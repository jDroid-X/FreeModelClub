/**
 * ProxyEngineService.js
 * Purpose: Core OpenAI Compatible API Gateway proxying requests to free provider endpoints.
 *          Includes KeepAlive socket pooling, GET /v1/models/:model support, tool call compatibility,
 *          Closed-Loop Auto-Failover to backup free models, and SSE stream delegation.
 * Dependencies: ProviderModel, AIModel, LogModel, ComboModel, ProxyExecutionHelper
 */

const ProviderModel = require('../models/ProviderModel');
const AIModel = require('../models/AIModel');
const LogModel = require('../models/LogModel');
const ComboModel = require('../models/ComboModel');
const ProxyExecutionHelper = require('./ProxyExecutionHelper');
const db = require('../models/Database');

class ProxyEngineService {
  static rrCounters = {};

  static async handleChatCompletion(req, res, clientKey = 'direct-ui') {
    const startTime = Date.now();
    const requestBody = req.body || {};

    const config = db.read(db.files.config);
    const defaultFallbackModel = config.default_fallback_model_id || 'llama-3.3-70b-versatile';
    let requestedModelId = requestBody.model || defaultFallbackModel;
    const messages = requestBody.messages || [];
    const isStream = Boolean(requestBody.stream);

    let targetModel = null;
    let targetProvider = null;
    let comboModels = [];
    let combo = ComboModel.getById(requestedModelId);

    if (combo && combo.isActive && combo.modelsList && combo.modelsList.length > 0) {
      comboModels = combo.modelsList.map(id => AIModel.getById(id)).filter(m => {
        if (!m || m.status !== 'Active') return false;
        const p = ProviderModel.getById(m.providerId, false);
        return p && p.isActive;
      });
      
      if (comboModels.length > 0) {
        const strat = combo.strategy || 'Fallback';
        
        if (strat === 'Round Robin' || strat === 'Weighted Round-Robin') {
          if (this.rrCounters[combo.id] === undefined) {
            this.rrCounters[combo.id] = 0;
          }
          const index = this.rrCounters[combo.id] % comboModels.length;
          this.rrCounters[combo.id]++;
          targetModel = comboModels[index];
        } else if (strat === 'Least Latency' || strat.includes('Fast')) {
          // OmniRoute Fast Strategy: Lowest P95 latency first
          const sorted = [...comboModels].sort((a, b) => (a.latencyMs || 100) - (b.latencyMs || 100));
          targetModel = sorted[0];
        } else if (strat.includes('Cheap') || strat.includes('Cost')) {
          // OmniRoute Cost-Saver Strategy: Prefer lowest token cost
          const sorted = [...comboModels].sort((a, b) => (a.inputTokenPrice || 0) - (b.inputTokenPrice || 0));
          targetModel = sorted[0];
        } else if (strat === 'LKGP' || strat.includes('Sticky')) {
          // OmniRoute Last-Known-Good Path Strategy: Sticky route to last successful model
          const lkgpId = combo.lastKnownGoodModelId;
          targetModel = comboModels.find(m => m.id === lkgpId || m.modelId === lkgpId) || comboModels[0];
        } else if (strat.includes('Smart') || strat.includes('Auto-Combo')) {
          // OmniRoute 12-Factor Adaptive Scoring Strategy (Health, Quota, Latency, Task Fit, Stability)
          const scored = comboModels.map(m => {
            const p = ProviderModel.getById(m.providerId, false);
            const healthScore = p && p.isActive ? 1.0 : 0.0;
            const latencyScore = 1.0 / (1.0 + ((m.latencyMs || 200) / 1000.0));
            const contextScore = (m.contextWindow || 32768) / 128000.0;
            const requestCountScore = 1.0 / (1.0 + (m.requestCount || 0));
            const totalScore = (healthScore * 0.35) + (latencyScore * 0.25) + (contextScore * 0.20) + (requestCountScore * 0.20);
            return { model: m, score: totalScore };
          });
          scored.sort((a, b) => b.score - a.score);
          targetModel = scored[0].model;
        } else {
          // Default Fallback: Ordered List Priority
          targetModel = comboModels[0];
        }
      }
    }

    if (!targetModel) {
      targetModel = AIModel.getById(requestedModelId);
    }

    // Zero-Trust Multimodal Router: Detect if prompt contains image_url payload
    const hasImagePayload = messages.some(m => Array.isArray(m.content) && m.content.some(c => c.type === 'image_url' || (c.image_url && c.image_url.url)));

    if (hasImagePayload) {
      const activeModels = AIModel.getActiveModels();
      // Find an active free model specializing in Vision & Multimodal
      const visionModel = activeModels.find(m => {
        const skill = (m.coreSkill || '').toLowerCase();
        const prov = ProviderModel.getById(m.providerId, false);
        return prov && prov.isActive && (skill.includes('vision') || skill.includes('multimodal') || (m.modelId || '').includes('vision') || (m.modelId || '').includes('flash') || (m.modelId || '').includes('qwen-vl'));
      });

      if (visionModel) {
        targetModel = visionModel;
        targetProvider = ProviderModel.getById(visionModel.providerId, false);
        LogModel.recordSystemLog('VISION_ROUTER', 'INFO', `Auto-routed image prompt to active free Vision model: '${visionModel.modelId}' (${targetProvider.displayName})`);
      }
    }

    if (targetModel) {
      targetProvider = ProviderModel.getById(targetModel.providerId, false);
    }

    if (!targetModel || !targetProvider || !targetProvider.isActive) {
      const activeModels = AIModel.getActiveModels();
      if (activeModels.length > 0) {
        targetModel = activeModels[0];
        targetProvider = ProviderModel.getById(targetModel.providerId, false);
      }
    }

    if (!targetProvider) {
      const errorMsg = 'No active Provider available. Please register a Free Provider first.';
      LogModel.recordApiLog({
        clientKey,
        modelId: requestedModelId,
        endpoint: '/v1/chat/completions',
        statusCode: 503,
        status: 'FAILED',
        errorDiagnostics: { error: errorMsg, hint: 'Go to Provider Registration in UI' }
      });
      return res.status(503).json({
        error: { message: errorMsg, type: 'provider_not_found', code: '503' }
      });
    }

    let attemptCount = 0;
    // Set maxAttempts to dynamically cover all models in the combo pool until all candidate tokens are exhausted
    const poolSize = comboModels.length > 0 ? comboModels.length : AIModel.getActiveModels().length;
    const maxAttempts = Math.max(config.max_failover_attempts || 10, poolSize * 2);
    let currentModel = targetModel;
    let currentProvider = targetProvider;
    let isFailover = false;
    let failoverFrom = null;

    const promptText = messages.map((m) => m.content || '').join(' ');
    const estimatedPromptTokens = Math.max(1, Math.round(promptText.length / 4));

    while (attemptCount < maxAttempts) {
      attemptCount++;

      let requestFailedOrBlocked = false;
      
      const hardLimit = parseInt(currentProvider.hardTokenLimit, 10) || 0;
      const consumed = currentProvider.tokensConsumed || 0;
      
      if (hardLimit > 0 && consumed >= hardLimit) {
        LogModel.recordSystemLog('QUOTA_EXCEEDED', 'WARN', `Provider '${currentProvider.displayName}' exceeded token limit (${hardLimit}). Auto-routing to next candidate in Combo pool.`);
        requestFailedOrBlocked = true;
      }

      if (!requestFailedOrBlocked) {
        try {
          const result = await ProxyExecutionHelper.executeProxyRequest({
            req,
            res,
            clientKey,
            targetModel: currentModel,
            targetProvider: currentProvider,
            requestBody,
            isStream,
            estimatedPromptTokens,
            startTime,
            isFailover,
            failoverFrom
          });

          if (result.success) {
            if (combo) {
              combo.lastKnownGoodModelId = currentModel.id;
              ComboModel.save(combo);
            }
            return;
          }

          if (attemptCount < maxAttempts) {
            let backupModel = null;
            if (combo && comboModels.length > 1) {
              const currentIdx = comboModels.findIndex(m => m.id === currentModel.id);
              
              // If we hit a 429, the provider itself is likely rate limited (RPM limit). 
              // We should aggressively try to find a model in the combo that belongs to a DIFFERENT provider.
              if (result.statusCode === 429) {
                 LogModel.recordSystemLog('RATE_LIMIT', 'WARN', `Hit 429 Rate Limit on ${currentProvider.displayName}. Waiting 1500ms before failover...`);
                 await new Promise(resolve => setTimeout(resolve, 1500));
                 
                 // Try to pick a different provider that we haven't just tried
                 const availableCrossModels = comboModels.filter((m, idx) => idx !== currentIdx && m.providerId !== currentProvider.id);
                 if (availableCrossModels.length > 0) {
                   // Pick randomly or round-robin among alternatives to avoid ping-pong
                   backupModel = availableCrossModels[attemptCount % availableCrossModels.length];
                 }
              }
              
              // If no cross-provider model found, or it wasn't a 429, just round-robin to the next one
              if (!backupModel) {
                 const nextIdx = (currentIdx >= 0 ? currentIdx + 1 : attemptCount) % comboModels.length;
                 backupModel = comboModels[nextIdx];
              }
            } else {
              const activeModels = AIModel.getActiveModels();
              backupModel = activeModels.find(
                (m) => m.providerId !== currentProvider.id && m.id !== currentModel.id
              );
            }

            if (backupModel) {
              const backupProvider = ProviderModel.getById(backupModel.providerId, false);
              if (backupProvider && backupProvider.isActive) {
                LogModel.recordSystemLog(
                  'AUTO_FAILOVER',
                  'WARN',
                  `Closed-loop failover triggered: rerouting from '${currentModel.modelId}' to backup model '${backupModel.modelId}' (${backupProvider.displayName})`,
                  { originalModel: currentModel.modelId, failoverModel: backupModel.modelId }
                );

                isFailover = true;
                failoverFrom = currentModel.modelId;
                currentModel = backupModel;
                currentProvider = backupProvider;
                continue;
              }
            }
          }

          return res.status(result.statusCode || 502).json(result.errorResponseBody || { error: 'Unknown proxy error' });
        } catch (err) {
          console.error('Proxy Request Exception:', err);
          if (attemptCount >= maxAttempts) {
            return res.status(500).json({
              error: { message: `Proxy Execution Failed after ${attemptCount} attempts: ${err.message}` }
            });
          }
        }
      }
    }
  }

  static formatModelItem(id, owner, family, skill, contextWindow, latencyMs, fmcId) {
    return {
      id,
      object: 'model',
      type: 'model',
      display_name: id,
      created: Math.floor(Date.now() / 1000),
      created_at: new Date().toISOString(),
      owned_by: owner,
      permission: [],
      root: id,
      parent: null,
      metadata: {
        fmc_id: fmcId || id,
        family: family || 'General',
        coreSkill: skill || 'General Knowledge',
        contextWindow: contextWindow || 128000,
        isFree: true,
        latencyMs: latencyMs || 100
      }
    };
  }

  static getOpenAIModelsFormat() {
    const activeModels = AIModel.getActiveModels();
    const formattedData = activeModels.map(m =>
      this.formatModelItem(m.modelId, m.providerName, m.family, m.coreSkill, m.contextWindow, m.latencyMs, m.id)
    );

    const combos = ComboModel.getAll().filter(c => c.isActive);
    combos.forEach(c => {
      const comboId = c.name || c.id;
      formattedData.push(this.formatModelItem(comboId, 'Model Combo Pool', 'Model Combo', `Combo (${c.strategy})`, 'Dynamic', 100, c.id));
    });

    return { object: 'list', data: formattedData };
  }

  static getSingleModelFormat(modelId) {
    const combo = ComboModel.getById(modelId);
    if (combo && combo.isActive) {
      const comboId = combo.name || combo.id;
      return this.formatModelItem(comboId, 'Model Combo Pool', 'Model Combo', `Combo (${combo.strategy})`, 'Dynamic', 100, combo.id);
    }

    let model = AIModel.getById(modelId);
    if (!model) {
      const active = AIModel.getActiveModels();
      if (active.length > 0) {
        model = {
          modelId: modelId,
          providerName: active[0].providerName,
          family: 'Claude/Fallback',
          coreSkill: 'General Reasoning',
          contextWindow: active[0].contextWindow,
          latencyMs: active[0].latencyMs,
          id: active[0].id
        };
      } else {
        return null;
      }
    }

    return this.formatModelItem(model.modelId, model.providerName, model.family, model.coreSkill, model.contextWindow, model.latencyMs, model.id);
  }
}

module.exports = ProxyEngineService;

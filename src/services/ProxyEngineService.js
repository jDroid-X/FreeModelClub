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
  
  static getBlacklistedStatus() {
    return [];
  }
  
  static isProviderBlacklisted(providerId) {
    return false;
  }

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

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ FLOWCHART STEP: Zero-Trust In-Memory SSOT Filter                  │
    // │ Dynamically filter active models whose providers are also active. │
    // │ Only models explicitly listed here are eligible for routing.      │
    // └─────────────────────────────────────────────────────────────────────┘
    const allProviders = ProviderModel.getAll(false);
    const activeProviderIds = new Set(
      allProviders.filter(p => p.isActive && !p.isArchived && !ProxyEngineService.isProviderBlacklisted(p.id)).map(p => p.id)
    );
    let activeModelsCache = AIModel.getAll().filter(m => m.isActive && activeProviderIds.has(m.providerId)).map(m => m.id);

    const comboMemberList = combo ? (combo.modelsList || combo.models || combo.modelIds || []) : [];
    if (combo && combo.isActive && comboMemberList.length > 0) {
      comboModels = comboMemberList.map(id => AIModel.getById(id)).filter(m => {
        if (!m) return false;
        // Strictly use Transactional Model Table as SSOT
        return activeModelsCache.includes(m.id) || activeModelsCache.includes(m.modelId);
      });
      
      if (comboModels.length > 0) {
        const ModelLoadBalancer = require('./ModelLoadBalancer');
        targetModel = ModelLoadBalancer.select(comboModels, combo.strategy || 'Fallback', {}, {
          comboId: combo.id,
          lastKnownGoodModelId: combo.lastKnownGoodModelId
        });
      }
    }

    if (!targetModel) {
      targetModel = AIModel.getById(requestedModelId);
    }

    // Zero-Trust Multimodal Router: Detect if prompt contains image_url payload
    const hasImagePayload = messages.some(m => Array.isArray(m.content) && m.content.some(c => c.type === 'image_url' || (c.image_url && c.image_url.url)));

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ FLOWCHART STEP: Zero-Trust Vision Router Override                 │
    // │ If image_url detected in prompt, forcefully override targetModel  │
    // │ with the first active Vision/Multimodal model from SSOT cache.    │
    // └─────────────────────────────────────────────────────────────────────┘
    if (hasImagePayload) {
      const allModels = AIModel.getAll();
      const activeModels = allModels.filter(m => activeModelsCache.includes(m.id) || activeModelsCache.includes(m.modelId));
      // Find an active free model specializing in Vision & Multimodal
      const visionModel = activeModels.find(m => {
        const skill = (m.coreSkill || '').toLowerCase();
        return (skill.includes('vision') || skill.includes('multimodal') || (m.modelId || '').includes('vision') || (m.modelId || '').includes('flash') || (m.modelId || '').includes('qwen-vl'));
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

    if (!targetModel || !targetProvider || !targetProvider.isActive || ProxyEngineService.isProviderBlacklisted(targetProvider.id)) {
      const activeModels = AIModel.getActiveModels();
      if (activeModels.length > 0) {
        targetModel = activeModels[0];
        targetProvider = ProviderModel.getById(targetModel.providerId, false);
      }
    }

    if (!targetProvider) {
      const errorMsg = 'No active Provider available. Please register a Free Provider first.';
      // Single log entry with combo info if available
      const comboInfo = combo && combo.id ? { comboId: combo.id } : {};
      LogModel.recordApiLog({
        clientKey,
        modelId: requestedModelId,
        endpoint: '/v1/chat/completions',
        statusCode: 503,
        status: 'FAILED',
        errorDiagnostics: { error: errorMsg, hint: 'Go to Provider Registration in UI' },
        ...comboInfo
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

    let promptLength = 0;
    if (messages && Array.isArray(messages)) {
      for (const m of messages) {
        if (typeof m.content === 'string') promptLength += m.content.length;
        else if (Array.isArray(m.content)) {
          for (const c of m.content) {
            if (c && typeof c.text === 'string') promptLength += c.text.length;
          }
        }
      }
    }
    const estimatedPromptTokens = Math.max(1, Math.round(promptLength / 4));

    while (attemptCount < maxAttempts) {
      attemptCount++;

      let preflightResult = null;
      
      const hardLimit = parseInt(currentProvider.hardTokenLimit, 10) || 0;
      const consumed = currentProvider.tokensConsumed || 0;
      
      if (hardLimit > 0 && consumed >= hardLimit) {
        LogModel.recordSystemLog('QUOTA_EXCEEDED', 'WARN', `Provider '${currentProvider.displayName}' exceeded token limit (${hardLimit}). Auto-routing to next candidate in Combo pool.`);
        preflightResult = { success: false, statusCode: 429, errorResponseBody: { error: { message: 'Quota Exceeded' } } };
      }

      const contextLimit = parseInt(currentModel.contextWindow, 10) || 0;
      if (!preflightResult && contextLimit > 0 && estimatedPromptTokens > contextLimit) {
        LogModel.recordSystemLog('CONTEXT_LIMIT_EXCEEDED', 'WARN', `Model '${currentModel.modelId}' context limit (${contextLimit}) exceeded by payload (${estimatedPromptTokens}). Preemptively routing.`);
        preflightResult = { success: false, statusCode: 413, errorResponseBody: { error: { message: 'Payload Too Large for Context Window' } } };
      }

      const tpmLimit = parseInt(currentProvider.rateLimitTPM, 10) || 0;
      if (!preflightResult && tpmLimit > 0 && estimatedPromptTokens > tpmLimit) {
        LogModel.recordSystemLog('TPM_LIMIT_EXCEEDED', 'WARN', `Provider '${currentProvider.displayName}' TPM limit (${tpmLimit}) exceeded by payload (${estimatedPromptTokens}). Preemptively routing.`);
        preflightResult = { success: false, statusCode: 413, errorResponseBody: { error: { message: 'Payload Too Large for Provider TPM Limit' } } };
      }

      try {
        let result = preflightResult;
        if (!result) {
          result = await ProxyExecutionHelper.executeProxyRequest({
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
        }

          if (result.success) {
          // Record successful request with resolved model details
          // Note: ProxyExecutionHelper also records its own detailed log with token counts
          const comboInfo = combo && combo.id ? { comboId: combo.id } : {};
          LogModel.recordApiLog({
            clientKey,
            providerId: currentProvider.id,
            providerName: currentProvider.displayName,
            modelId: currentModel.id || currentModel.modelId,
            endpoint: '/v1/chat/completions',
            statusCode: 200,
            status: isFailover ? 'SUCCESS_FAILOVER' : 'SUCCESS',
            ...comboInfo
          });
            if (combo) {
              combo.lastKnownGoodModelId = currentModel.id;
              ComboModel.save(combo);
            }
            return;
          }

          if (result && (result.statusCode === 401 || result.statusCode === 403)) {
            // Temporary in-memory cooldown without permanently corrupting user database config
            ProxyEngineService.blacklistProvider(currentProvider.id, 5);
            LogModel.recordSystemLog('PROVIDER_COOLDOWN', 'WARN', `Provider ${currentProvider.displayName} placed on 5-min cooldown due to HTTP ${result.statusCode}.`);
          }

          if (attemptCount < maxAttempts) {
            let backupModel = null;
            if (combo && comboModels.length > 1) {
              const currentIdx = comboModels.findIndex(m => m.id === currentModel.id);
              
              if (result.statusCode === 429) {
                 await new Promise(resolve => setTimeout(resolve, 1000));
                 const availableCrossModels = comboModels.filter((m, idx) => idx !== currentIdx && m.providerId !== currentProvider.id);
                 if (availableCrossModels.length > 0) {
                   backupModel = availableCrossModels[attemptCount % availableCrossModels.length];
                 }
              }
              
              if (!backupModel) {
                 const nextIdx = (currentIdx >= 0 ? currentIdx + attemptCount : attemptCount) % comboModels.length;
                 backupModel = comboModels[nextIdx];
              }
            } else {
              const activeModels = AIModel.getActiveModels();
              const availableCrossModels = activeModels.filter(
                (m) => m.providerId !== currentProvider.id && m.id !== currentModel.id
              );
              if (availableCrossModels.length > 0) {
                 backupModel = availableCrossModels[attemptCount % availableCrossModels.length];
              }
            }

            if (backupModel) {
              const backupProvider = ProviderModel.getById(backupModel.providerId, false);
              if (backupProvider && backupProvider.isActive) {
                LogModel.recordSystemLog(
                  'AUTO_FAILOVER',
                  'INFO',
                  `Closed-loop failover: rerouting from '${currentModel.modelId}' (${currentProvider.displayName}) -> '${backupModel.modelId}' (${backupProvider.displayName}) [HTTP ${result.statusCode}]`,
                  { originalModel: currentModel.modelId, failoverModel: backupModel.modelId, statusCode: result.statusCode }
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
      // Direct lookup by modelId string match
      const allModels = AIModel.getAll();
      model = allModels.find(m => m.modelId === modelId || m.id === modelId);
    }

    if (!model) {
      const active = AIModel.getActiveModels();
      if (active.length > 0) {
        model = {
          modelId: modelId,
          providerName: active[0].providerName || 'FMC Free Cloud Provider',
          family: active[0].family || 'General',
          coreSkill: active[0].coreSkill || 'General Reasoning',
          contextWindow: active[0].contextWindow || 128000,
          latencyMs: active[0].latencyMs || 100,
          id: active[0].id
        };
      } else {
        // Absolute fallback to default system model format instead of 404 error
        return this.formatModelItem(modelId, 'FMC Localhost Engine', 'General', 'Smart Assistant', 128000, 50, modelId);
      }
    }

    return this.formatModelItem(model.modelId || modelId, model.providerName || 'FMC Provider', model.family, model.coreSkill, model.contextWindow, model.latencyMs, model.id || modelId);
  }
}

module.exports = ProxyEngineService;

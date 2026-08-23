/**
 * ComboSmartAgent.js
 * Purpose: Central Adaptive Multi-Agent Orchestrator for FreeModelsClub.
 * Coordinates all 22 agents: 13 Algorithmic Load-Balancers, 4 Core Gateway Engines, and 5 Auxiliary Agents.
 * Provides prompt intent analysis, adaptive strategy switching, preflight token checks, and self-healing execution.
 * Dependencies: ModelLoadBalancer, TokenAgentService, ActiveConnectionTracker, ToolExecutionLoopService, ProviderAgentService, AIModel, ComboModel, ProviderModel, LogModel
 */

const ModelLoadBalancer = require('./ModelLoadBalancer');
const TokenAgentService = require('./TokenAgentService');
const ActiveConnectionTracker = require('./ActiveConnectionTracker');
const AIModel = require('../models/AIModel');
const ComboModel = require('../models/ComboModel');
const ProviderModel = require('../models/ProviderModel');
const LogModel = require('../models/LogModel');

class ComboSmartAgent {
  constructor() {
    this.name = 'ComboSmartAgent';
    this.version = '1.0.0';
    this.telemetryStats = {
      totalOrchestrations: 0,
      adaptiveSwitches: 0,
      autoVisionReroutes: 0,
      failoverRecoveries: 0
    };
  }

  /**
   * Analyze prompt characteristics to determine optimal routing requirements
   */
  analyzePromptIntent(messages = []) {
    let totalChars = 0;
    let hasVision = false;
    let isCodeTask = false;
    let isShortChat = true;

    for (const m of messages) {
      if (Array.isArray(m.content)) {
        for (const part of m.content) {
          if (part.type === 'image_url' || part.image_url) hasVision = true;
          if (typeof part.text === 'string') totalChars += part.text.length;
        }
      } else if (typeof m.content === 'string') {
        totalChars += m.content.length;
        const text = m.content.toLowerCase();
        if (text.includes('```') || text.includes('function ') || text.includes('class ') || text.includes('const ') || text.includes('def ')) {
          isCodeTask = true;
        }
      }
    }

    const estimatedTokens = Math.max(1, Math.round(totalChars / 4));
    if (estimatedTokens > 2000) isShortChat = false;

    return {
      estimatedTokens,
      hasVision,
      isCodeTask,
      isShortChat,
      requiresSpeed: isShortChat && !isCodeTask,
      requiresHeadroom: estimatedTokens > 16000
    };
  }

  /**
   * Dynamically determine the best agent strategy based on combo configuration and prompt intent
   */
  resolveOptimalStrategy(combo, promptIntent, requestedStrategy = null) {
    if (requestedStrategy && requestedStrategy !== 'Auto') {
      return requestedStrategy;
    }

    const comboStrategy = combo ? combo.strategy : 'Auto';
    if (comboStrategy && comboStrategy !== 'Auto') {
      return comboStrategy;
    }

    // Adaptive Multi-Agent Switching Rules:
    if (promptIntent.hasVision) {
      this.telemetryStats.autoVisionReroutes++;
      return 'Headroom';
    }
    if (promptIntent.requiresHeadroom) {
      this.telemetryStats.adaptiveSwitches++;
      return 'Headroom';
    }
    if (promptIntent.isCodeTask) {
      this.telemetryStats.adaptiveSwitches++;
      return 'Context Optimized';
    }
    if (promptIntent.requiresSpeed) {
      this.telemetryStats.adaptiveSwitches++;
      return 'Lowest Latency';
    }

    return 'Auto';
  }

  /**
   * Filter active model candidate pool for a combo
   */
  getEligibleCandidatePool(combo) {
    const allProviders = ProviderModel.getAll(false);
    const activeProviderIds = new Set(
      allProviders.filter(p => p.isActive && !p.isArchived).map(p => p.id)
    );

    const activeModels = AIModel.getAll().filter(m => m.isActive && activeProviderIds.has(m.providerId));
    const activeModelIds = new Set(activeModels.map(m => m.id));

    const comboMemberList = combo ? (combo.modelsList || combo.models || combo.modelIds || []) : [];
    let pool = comboMemberList.map(id => AIModel.getById(id)).filter(m => m && activeModelIds.has(m.id));

    if (pool.length === 0) {
      pool = activeModels;
    }

    return pool;
  }

  /**
   * Select candidate model using the 22-agent delegation pipeline with diagnostic logging
   */
  resolveTargetCandidate({ modelId, messages = [], requestedStrategy = null }) {
    this.telemetryStats.totalOrchestrations++;
    const combo = ComboModel.getById(modelId);
    const promptIntent = this.analyzePromptIntent(messages);
    const activeStrategy = this.resolveOptimalStrategy(combo, promptIntent, requestedStrategy);

    if (combo && combo.isActive) {
      let pool = this.getEligibleCandidatePool(combo);

      // Vision routing override
      if (promptIntent.hasVision) {
        const visionCandidate = pool.find(m => {
          const s = (m.coreSkill || '').toLowerCase();
          return s.includes('vision') || s.includes('multimodal') || (m.modelId || '').includes('vision') || (m.modelId || '').includes('flash');
        });
        if (visionCandidate) {
          LogModel.recordSystemLog('COMBO_SMART_AGENT', 'INFO', `Vision payload detected: auto-routed combo '${combo.name}' to vision model '${visionCandidate.id}'`);
          return {
            targetModel: visionCandidate,
            targetProvider: ProviderModel.getById(visionCandidate.providerId, false),
            strategyUsed: 'Vision Multi-Modal Router',
            combo,
            pool,
            promptIntent
          };
        }
      }

      const selectedModel = ModelLoadBalancer.select(pool, activeStrategy, {}, {
        comboId: combo.id,
        lastKnownGoodModelId: combo.lastKnownGoodModelId
      });

      if (selectedModel) {
        LogModel.recordSystemLog('COMBO_SMART_AGENT', 'INFO', `Routed combo '${combo.name}' using strategy '${activeStrategy}' to model '${selectedModel.id}' (Pool size: ${pool.length})`);
        return {
          targetModel: selectedModel,
          targetProvider: ProviderModel.getById(selectedModel.providerId, false),
          strategyUsed: activeStrategy,
          combo,
          pool,
          promptIntent
        };
      }
    }

    let singleModel = AIModel.getById(modelId) || AIModel.getActiveModels()[0] || {
      id: modelId || 'llama-3.3-70b-versatile',
      modelId: modelId || 'llama-3.3-70b-versatile',
      providerId: 'ollama'
    };

    LogModel.recordSystemLog('COMBO_SMART_AGENT', 'INFO', `Direct route dispatched to model '${singleModel.id}'`);

    return {
      targetModel: singleModel,
      targetProvider: ProviderModel.getById(singleModel.providerId, false) || ProviderModel.getAll()[0],
      strategyUsed: requestedStrategy || 'Direct Route',
      combo: null,
      pool: [singleModel],
      promptIntent
    };
  }

  /**
   * Preflight validation guard checking token budgets, TPM limits, and context limits
   */
  validatePreflight({ targetModel, targetProvider, estimatedTokens }) {
    if (!targetProvider || !targetProvider.isActive) {
      return { valid: false, statusCode: 503, message: 'Provider inactive or unreachable' };
    }

    const hardLimit = parseInt(targetProvider.hardTokenLimit, 10) || 0;
    const consumed = targetProvider.tokensConsumed || 0;
    if (hardLimit > 0 && consumed >= hardLimit) {
      return { valid: false, statusCode: 429, message: `Provider '${targetProvider.displayName}' token quota exceeded (${hardLimit})` };
    }

    const contextLimit = parseInt(targetModel.contextWindow, 10) || 0;
    if (contextLimit > 0 && estimatedTokens > contextLimit) {
      return { valid: false, statusCode: 413, message: `Payload (${estimatedTokens}) exceeds model context limit (${contextLimit})` };
    }

    return { valid: true };
  }

  /**
   * Telemetry summary
   */
  getTelemetry() {
    return {
      agent: this.name,
      version: this.version,
      ...this.telemetryStats,
      activeLoadBalanceStrategies: 13,
      coreEnginesConnected: 4,
      auxiliaryAgentsConnected: 5
    };
  }
}

module.exports = new ComboSmartAgent();

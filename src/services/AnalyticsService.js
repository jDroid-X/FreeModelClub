/**
 * AnalyticsService.js
 * Purpose: Computes token metrics, request counters, validity, latency statistics for Dashboard & Header
 * Dependencies: ProviderModel, AIModel, LogModel
 */

const ProviderModel = require('../models/ProviderModel');
const AIModel = require('../models/AIModel');
const LogModel = require('../models/LogModel');
const ComboModel = require('../models/ComboModel');

class AnalyticsService {
  static getDashboardSummary() {
    const providers = ProviderModel.getAll();
    const activeProviders = providers.filter((p) => p.isActive);

    const models = AIModel.getAll();
    const activeModels = models.filter((m) => m.status === 'Active' && m.isFree);

    const apiLogs = LogModel.getApiLogs(500);

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalRequests = apiLogs.length;
    let totalLatencyMs = 0;

    models.forEach((m) => {
      totalPromptTokens += m.totalPromptTokens || 0;
      totalCompletionTokens += m.totalCompletionTokens || 0;
    });

    const successLogs = apiLogs.filter((l) => l.status === 'SUCCESS');
    if (successLogs.length > 0) {
      totalLatencyMs = successLogs.reduce((acc, curr) => acc + (curr.latencyMs || 0), 0) / successLogs.length;
    }

    const modelAnalytics = activeModels.map((m) => {
      const totalTokens = (m.totalPromptTokens || 0) + (m.totalCompletionTokens || 0);
      return {
        id: m.id,
        modelId: m.modelId,
        modelName: m.modelName,
        providerName: m.providerName,
        family: m.family,
        coreSkill: m.coreSkill,
        contextWindow: m.contextWindow,
        latencyMs: m.latencyMs || 180,
        requestCount: m.requestCount || 0,
        totalPromptTokens: m.totalPromptTokens || 0,
        totalCompletionTokens: m.totalCompletionTokens || 0,
        totalTokens,
        status: m.status,
        validity: 'Active Free Tier ($0.00)',
        costSaved: `$${((totalTokens / 1000000) * 2.5).toFixed(4)}` // Estimated cost savings vs commercial paid models
      };
    });

    const totalTokens = totalPromptTokens + totalCompletionTokens;
    const dailyLimitRequests = 14400;
    const consumedRequests = totalRequests;
    const remainingBalancePercent = Math.max(0, Math.min(100, Math.round(((dailyLimitRequests - consumedRequests) / dailyLimitRequests) * 100)));
    let ragStatus = 'green';
    if (remainingBalancePercent < 10) ragStatus = 'red';
    else if (remainingBalancePercent <= 20) ragStatus = 'amber';

    return {
      overview: {
        totalProviders: providers.length,
        activeProviders: activeProviders.length,
        totalModels: models.length,
        activeFreeModels: activeModels.length,
        totalPromptTokens,
        totalCompletionTokens,
        totalTokens,
        totalRequests,
        dailyLimitRequests,
        consumedRequests,
        remainingBalancePercent,
        ragStatus,
        averageLatencyMs: Math.round(totalLatencyMs || 180),
        estimatedCostSaved: `$${((totalTokens / 1000000) * 2.5).toFixed(4)}`
      },
      providers: providers.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        protocol: p.protocol,
        baseUrl: p.baseUrl,
        isActive: p.isActive,
        freeOnly: p.freeOnly,
        modelCount: models.filter((m) => m.providerId === p.id).length
      })),
      modelAnalytics
    };
  }

  static getHeaderMetrics(modelId = null) {
    let targetModel = null;
    let isCombo = false;
    
    if (modelId) {
      targetModel = AIModel.getById(modelId);
      if (!targetModel) {
        const combo = ComboModel.getById(modelId);
        if (combo) {
          isCombo = true;
          targetModel = {
            modelId: combo.id,
            modelName: combo.name || 'Models Combo',
            providerName: 'Models Combo',
            family: `Strategy: ${combo.strategy}`,
            contextWindow: 128000,
            latencyMs: 180,
            totalPromptTokens: 0,
            totalCompletionTokens: 0
          };
          
          if (combo.modelsList && combo.modelsList.length > 0) {
            const primary = AIModel.getById(combo.modelsList[0]);
            if (primary) {
              targetModel.contextWindow = primary.contextWindow;
              targetModel.providerName = `Models Combo (${primary.providerName})`;
              
              let totalPrompt = 0;
              let totalComp = 0;
              let avgLat = 0;
              let validLats = 0;
              
              combo.modelsList.forEach(mid => {
                const m = AIModel.getById(mid);
                if (m) {
                  totalPrompt += (m.totalPromptTokens || 0);
                  totalComp += (m.totalCompletionTokens || 0);
                  if (m.latencyMs) { avgLat += m.latencyMs; validLats++; }
                }
              });
              
              targetModel.totalPromptTokens = totalPrompt;
              targetModel.totalCompletionTokens = totalComp;
              if (validLats > 0) targetModel.latencyMs = Math.round(avgLat / validLats);
            }
          }
        }
      }
    }

    if (!targetModel) {
      const active = AIModel.getActiveModels();
      targetModel = active[0] || {
        modelId: 'llama-3.3-70b-versatile',
        providerName: 'Groq Cloud API',
        family: 'Llama 3.3',
        contextWindow: 128000,
        latencyMs: 180,
        totalPromptTokens: 0,
        totalCompletionTokens: 0
      };
    }

    const summary = this.getDashboardSummary();
    const combos = ComboModel.getAll();

    const activeProviders = ProviderModel.getActiveProviders();
    let sumAvl = 0;
    let hasUnlimited = false;
    activeProviders.forEach(p => {
      if (p.hardTokenLimit && p.hardTokenLimit > 0) {
        sumAvl += p.hardTokenLimit;
      } else {
        hasUnlimited = true;
      }
    });

    const tokensCon = summary.overview.totalTokens;
    const tokensAvl = hasUnlimited ? 'Unlimited' : sumAvl; 
    const tokensBal = hasUnlimited ? 'Unlimited' : Math.max(0, tokensAvl - tokensCon);
    const tokensUtilized = (hasUnlimited || tokensAvl <= 0) ? '0.00' : ((tokensCon / tokensAvl) * 100).toFixed(2);

    return {
      selectedModelId: targetModel.modelId,
      selectedModelName: targetModel.modelName || targetModel.modelId,
      providerName: targetModel.providerName || 'Provider',
      family: targetModel.family || 'General',
      contextWindow: `${(targetModel.contextWindow / 1024).toFixed(0)}k Context`,
      latency: `${targetModel.latencyMs || 180} ms`,
      promptTokens: targetModel.totalPromptTokens || 0,
      completionTokens: targetModel.totalCompletionTokens || 0,
      totalTokens: (targetModel.totalPromptTokens || 0) + (targetModel.totalCompletionTokens || 0),
      sessionTotalTokens: summary.overview.totalTokens,
      cost: 'FREE ($0.00)',
      totalProviders: summary.overview.totalProviders,
      totalModelClubs: combos.length,
      totalModels: summary.overview.totalModels,
      tokensAvl: tokensAvl,
      tokensCon: tokensCon,
      tokensBal: tokensBal,
      tokensUtilized: tokensUtilized,
      totalCreditsSaved: summary.overview.estimatedCostSaved
    };
  }
}

module.exports = AnalyticsService;

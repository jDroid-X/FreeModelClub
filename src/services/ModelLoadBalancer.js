/**
 * ModelLoadBalancer.js
 * Purpose: Provide smart load‑balancing for the combo‑agent when selecting a model from a catalog.
 * Supports round‑robin, fallback, weighted, cost-optimized, least-used, p2c, LKGP, auto-scoring, and more.
 * The class is a singleton so state (e.g., round‑robin counters, LKGP history) is kept in‑memory across calls.
 */

const ActiveConnectionTracker = require('./ActiveConnectionTracker');

class ModelLoadBalancer {
  constructor() {
    // Map of key -> current round‑robin index
    this.rrCounters = {};
    // Last-Known-Good Provider/Model ID
    this.lkgpModelId = null;
  }

  /**
   * Record a successful response for LKGP tracking.
   * @param {string} modelId 
   */
  recordSuccess(modelId) {
    if (modelId) {
      this.lkgpModelId = modelId;
    }
  }

  /**
   * Choose a model according to the configured strategy.
   * @param {Array<Object>} models - Candidate models (already filtered for token budget & skills).
   * @param {string} strategy - Strategy name (case-insensitive & space-flexible).
   * @param {Object} [weights] - Optional map modelId -> weight (used for 'weighted').
   * @param {Object} [context] - Optional context { comboId, lastKnownGoodModelId }.
   * @returns {Object|null} Selected model.
   */
  select(models, strategy = 'roundRobin', weights = {}, context = {}) {
    if (!Array.isArray(models) || models.length === 0) return null;

    const normalizedStrategy = String(strategy || '').toLowerCase().replace(/[\s_-]+/g, '');

    switch (normalizedStrategy) {
      case 'fallback':
      case 'fillfirst':
        return models[0];

      case 'weighted':
        return this._weightedSelect(models, weights);

      case 'costoptimized':
      case 'cheap':
      case 'cost':
        return this._costOptimizedSelect(models);

      case 'lowestlatency':
      case 'fast':
      case 'fastfirst':
      case 'shipfast':
      case 'leastlatency':
        return this._lowestLatencySelect(models);

      case 'leastused':
        return this._leastUsedSelect(models);

      case 'powerof2choices':
      case 'p2c':
        return this._p2cSelect(models);

      case 'lkgp':
      case 'sticky':
        return this._lkgpSelect(models, context.lastKnownGoodModelId);

      case 'auto':
      case 'autoscoring':
      case 'smart':
      case 'autocombo':
      case 'smart12factor':
        return this._autoScoringSelect(models);

      case 'strictrandom':
      case 'random':
        return this._strictRandomSelect(models);

      case 'headroom':
        return this._headroomSelect(models);

      case 'contextoptimized':
        return this._contextOptimizedSelect(models);

      case 'roundrobin':
      case 'weightedroundrobin':
      default:
        return this._roundRobinSelect(models, context.comboId);
    }
  }

  _roundRobinSelect(models, comboId = null) {
    const key = comboId || models.map(m => m.modelId || m.id).join('|');
    const idx = this.rrCounters[key] || 0;
    const model = models[idx % models.length];
    this.rrCounters[key] = (idx + 1) % models.length;
    return model;
  }

  _weightedSelect(models, weights) {
    const cumulative = [];
    let total = 0;
    for (const m of models) {
      const w = Number(weights[m.modelId] || weights[m.id] || 1);
      total += w;
      cumulative.push({ model: m, high: total });
    }
    if (total === 0) return models[0];
    const rnd = Math.random() * total;
    for (const entry of cumulative) {
      if (rnd <= entry.high) return entry.model;
    }
    return models[0];
  }

  _costOptimizedSelect(models) {
    // Sort by costPer1k if available, or by maxTokens descending (assuming larger token budget = better value)
    const sorted = [...models].sort((a, b) => {
      const costA = a.costPer1k !== undefined ? a.costPer1k : (a.pricing?.input || 0);
      const costB = b.costPer1k !== undefined ? b.costPer1k : (b.pricing?.input || 0);
      if (costA !== costB) return costA - costB;
      return (b.contextWindow || 0) - (a.contextWindow || 0);
    });
    return sorted[0];
  }

  _lowestLatencySelect(models) {
    const ProviderModel = require('../models/ProviderModel');
    const sorted = [...models].sort((a, b) => {
      const provA = ProviderModel.getById(a.providerId, false);
      const provB = ProviderModel.getById(b.providerId, false);
      const latA = (provA && provA.pingLatencyMs !== undefined) ? provA.pingLatencyMs : (a.latencyMs || 9999);
      const latB = (provB && provB.pingLatencyMs !== undefined) ? provB.pingLatencyMs : (b.latencyMs || 9999);
      return latA - latB;
    });
    return sorted[0];
  }

  _leastUsedSelect(models) {
    let bestModel = models[0];
    let minConns = Infinity;

    for (const m of models) {
      const id = m.id || m.modelId;
      const status = ActiveConnectionTracker.checkConflict(id);
      const connCount = status.toolCount || 0;
      if (connCount < minConns) {
        minConns = connCount;
        bestModel = m;
      }
    }

    return bestModel;
  }

  _p2cSelect(models) {
    if (models.length === 1) return models[0];

    // Pick 2 random distinct indexes
    const idx1 = Math.floor(Math.random() * models.length);
    let idx2 = Math.floor(Math.random() * models.length);
    while (idx2 === idx1 && models.length > 1) {
      idx2 = Math.floor(Math.random() * models.length);
    }

    const m1 = models[idx1];
    const m2 = models[idx2];

    const c1 = (ActiveConnectionTracker.checkConflict(m1.id || m1.modelId).toolCount || 0);
    const c2 = (ActiveConnectionTracker.checkConflict(m2.id || m2.modelId).toolCount || 0);

    return c1 <= c2 ? m1 : m2;
  }

  _lkgpSelect(models, customLkgpId = null) {
    const targetId = customLkgpId || this.lkgpModelId;
    if (targetId) {
      const found = models.find(m => m.id === targetId || m.modelId === targetId);
      if (found) return found;
    }
    // Fallback to round-robin if no LKGP match
    return this._roundRobinSelect(models);
  }

  _autoScoringSelect(models) {
    // Multi-factor scoring: 40% health/availability, 30% low active load, 20% latency, 10% random exploration
    let bestModel = models[0];
    let highestScore = -Infinity;

    for (const m of models) {
      const id = m.id || m.modelId;
      const conns = ActiveConnectionTracker.checkConflict(id).toolCount || 0;
      
      const healthScore = m.status !== 'Inactive' ? 1.0 : 0.0;
      const loadScore = 1.0 / (1.0 + conns);
      const latencyScore = m.latencyMs ? (1000.0 / Math.max(m.latencyMs, 100)) : 0.5;
      const exploreScore = Math.random();

      const totalScore = (healthScore * 0.4) + (loadScore * 0.3) + (latencyScore * 0.2) + (exploreScore * 0.1);

      if (totalScore > highestScore) {
        highestScore = totalScore;
        bestModel = m;
      }
    }

    return bestModel;
  }

  _strictRandomSelect(models) {
    const idx = Math.floor(Math.random() * models.length);
    return models[idx];
  }

  _headroomSelect(models) {
    // Pick candidate with largest context window / headroom
    const sorted = [...models].sort((a, b) => (b.contextWindow || 0) - (a.contextWindow || 0));
    return sorted[0];
  }

  _contextOptimizedSelect(models) {
    // Prefer models with max output tokens
    const sorted = [...models].sort((a, b) => (b.maxTokens || 0) - (a.maxTokens || 0));
    return sorted[0];
  }
}

module.exports = new ModelLoadBalancer();

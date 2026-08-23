/**
 * ComboSmartAgent.js (Client Agent)
 * Purpose: Client-side telemetry, adaptive strategy monitoring, and agent orchestration bridge for FreeModelsClub.
 * Coordinates with backend ComboSmartAgent, HeaderTelemetry, and PlaygroundView.
 */

class ComboSmartAgent {
  static version = '1.0.0';
  static activeSessionStrategy = 'Auto';
  static lastResolvedModel = null;
  static lastResolvedProvider = null;

  static init() {
    this.activeSessionStrategy = localStorage.getItem('fmc_active_strategy') || 'Auto';
    if (typeof AppStore !== 'undefined' && AppStore.subscribe) {
      AppStore.subscribe('COMBO_AGENT_MUTATED', (data) => {
        this.onComboMutated(data);
      });
    }
  }

  static onComboMutated(data) {
    if (data && data.strategy) {
      this.activeSessionStrategy = data.strategy;
      localStorage.setItem('fmc_active_strategy', data.strategy);
    }
  }

  static recordResolution({ modelId, modelName, providerName, strategyUsed, isFailover }) {
    this.lastResolvedModel = modelName || modelId;
    this.lastResolvedProvider = providerName;
    this.activeSessionStrategy = strategyUsed || this.activeSessionStrategy;

    if (typeof AppStore !== 'undefined' && AppStore.emit) {
      AppStore.emit('COMBO_AGENT_RESOLVED', {
        modelId,
        modelName,
        providerName,
        strategyUsed: this.activeSessionStrategy,
        isFailover
      });
    }
  }

  static getActiveStrategyMetadata() {
    if (typeof LoadBalancingStrategyHelper !== 'undefined') {
      return LoadBalancingStrategyHelper.getById(this.activeSessionStrategy);
    }
    return { id: this.activeSessionStrategy, name: this.activeSessionStrategy, tag: 'DYNAMIC' };
  }
}

if (typeof window !== 'undefined') {
  window.ComboSmartAgent = ComboSmartAgent;
  document.addEventListener('DOMContentLoaded', () => ComboSmartAgent.init());
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ComboSmartAgent;
}

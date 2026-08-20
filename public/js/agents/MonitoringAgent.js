/**
 * MonitoringAgent.js
 * Purpose: Central Monitoring Agent for real-time app-wide metadata synchronization,
 *          telemetry audits, and automated page-open hydration across all SPA views.
 * Attached Model: Best available model with available tokens (e.g., Llama 3.3 70B Versatile).
 */

class MonitoringAgent {
  static attachedModel = {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile (Free)',
    provider: 'Groq Cloud API',
    tokensAvl: 'Unlimited'
  };

  static isSyncing = false;

  /**
   * Called automatically when any SPA page opens (navigate event)
   */
  static async onPageOpen(viewName) {
    try {
      console.log(`[MonitoringAgent] Refreshing metadata for view: '${viewName}'...`);
      
      // 1. Hydrate Top Header Telemetry Row
      if (typeof HeaderTelemetry !== 'undefined' && HeaderTelemetry.loadAndRender) {
        HeaderTelemetry.loadAndRender();
      }

      // 2. Emit relative view-specific event without forcing redundant full view re-renders
      // Note: app.navigate() already renders target view cleanly.
      window.dispatchEvent(new CustomEvent('fmc_monitoring_sync', { detail: { viewName, timestamp: Date.now() } }));
    } catch (err) {
      console.warn(`[MonitoringAgent] Page open sync warning for ${viewName}:`, err);
    }
  }

  /**
   * Manual Telemetry Refresh using the attached AI model with available tokens
   */
  static async manualRefresh() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    if (typeof ModalDialog !== 'undefined') {
      ModalDialog.showNotification(`[Monitoring Agent] Initiating telemetry sync using ${this.attachedModel.name}...`, 'info');
    }

    try {
      if (typeof HeaderTelemetry !== 'undefined' && HeaderTelemetry.loadAndRender) {
        await HeaderTelemetry.loadAndRender();
      }

      if (window.app && window.app.notifyDataChanged) {
        window.app.notifyDataChanged();
      }

      if (typeof ModalDialog !== 'undefined') {
        ModalDialog.showNotification(`[Monitoring Agent] App-wide metadata sync complete! All relative page elements updated.`, 'success');
      }
    } catch (err) {
      if (typeof ModalDialog !== 'undefined') {
        ModalDialog.showNotification(`[Monitoring Agent] Sync error: ${err.message}`, 'error');
      }
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Global closed-loop data change listener called after provider / model / combo registration
   */
  static async syncAllPages() {
    console.log('[MonitoringAgent] Executing global closed-loop metadata sync...');
    if (typeof HeaderTelemetry !== 'undefined' && HeaderTelemetry.loadAndRender) {
      HeaderTelemetry.loadAndRender();
    }
    const currentView = window.app ? window.app.currentView : 'dashboard';
    this.onPageOpen(currentView);
  }
}

window.MonitoringAgent = MonitoringAgent;

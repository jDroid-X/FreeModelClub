/**
 * ReportsView.js
 * Purpose: Reports view rendering 2-column layout matching User Manual structure:
 *          20% Left TOC Diagnostic Navigation Rail + 80% Workspace Pane (API Logs, System Logs, n8n Visual Workflow) (< 200 lines).
 * Dependencies: ApiService, ModalDialog, ReportsViewHelper
 */

class ReportsView {
  static currentTab = 'api';
  static autoRefreshInterval = null;
  static isAutoRefreshActive = false;
  static activeSeverityFilter = 'ALL';
  static currentSearchQuery = '';

  static async render(container) {
    container.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div class="panel-title"><i class="fa-solid fa-file-waveform"></i> Reports & Root Cause Diagnostics</div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" id="btn-auto-refresh" onclick="ReportsView.toggleAutoRefresh()"><i class="fa-solid fa-play"></i> Auto-Refresh: OFF</button>
            <button class="btn btn-secondary btn-sm" onclick="ReportsView.exportLogsCsv()"><i class="fa-solid fa-file-csv"></i> CSV</button>
            <button class="btn btn-secondary btn-sm" onclick="ReportsView.exportLogsJson()"><i class="fa-solid fa-file-code"></i> JSON</button>
            <button class="btn btn-danger btn-sm" onclick="ReportsView.clearLogs()"><i class="fa-solid fa-trash"></i> Clear</button>
          </div>
        </div>

        <div style="display: flex; gap: 12px; align-items: flex-start; margin-top: 12px;">
          <!-- Left 20% Width TOC Navigation Rail -->
          <div class="glass-panel" style="width: 20%; min-width: 170px; flex-shrink: 0; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-light); text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-bottom: 4px;">
              <i class="fa-solid fa-file-waveform"></i> Diagnostic Sections
            </div>

            <button class="btn btn-secondary btn-sm rpt-nav-btn active" id="tab-api-logs" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="ReportsView.switchTab('api')">
              <i class="fa-solid fa-chart-line" style="color: var(--accent-cyan); margin-right: 6px;"></i> 1. API Diagnostics
            </button>
            <button class="btn btn-secondary btn-sm rpt-nav-btn" id="tab-sys-logs" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="ReportsView.switchTab('system')">
              <i class="fa-solid fa-clock-rotate-left" style="color: var(--accent-emerald); margin-right: 6px;"></i> 2. System Event Log
            </button>
            <button class="btn btn-secondary btn-sm rpt-nav-btn" id="tab-n8n-workflow" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="ReportsView.switchTab('workflow')">
              <i class="fa-solid fa-diagram-project" style="color: var(--accent-amber); margin-right: 6px;"></i> 3. n8n Visual Workflow
            </button>
            <button class="btn btn-secondary btn-sm rpt-nav-btn" id="tab-monkeycode-audit" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="ReportsView.switchTab('monkeycode')">
              <i class="fa-solid fa-cubes" style="color: #a855f7; margin-right: 6px;"></i> 4. MonkeyCode Audit
            </button>

            <div style="border-top: 1px solid var(--border-color); padding-top: 6px; display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
              <button class="btn btn-secondary btn-xs" style="width: 100%; justify-content: flex-start;" onclick="ReportsView.exportLogsCsv()">
                <i class="fa-solid fa-file-csv"></i> Export CSV
              </button>
              <button class="btn btn-secondary btn-xs" style="width: 100%; justify-content: flex-start;" onclick="ReportsView.exportLogsJson()">
                <i class="fa-solid fa-file-code"></i> Export JSON
              </button>
            </div>
          </div>

          <!-- Right 80% Width Workspace Pane -->
          <div style="width: 80%; flex: 1; min-width: 0;">
            <div id="latency-distribution-card" class="glass-panel" style="margin-bottom: 12px; padding: 10px; background: rgba(0,0,0,0.2);">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 6px;">
                <span><i class="fa-solid fa-chart-simple"></i> Latency Distribution Breakdown</span>
                <span id="latency-summary-badge" style="color: var(--accent-emerald);">Calculating...</span>
              </div>
              <div style="height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; display: flex;">
                <div id="lat-bar-fast" style="width: 0%; background: var(--accent-emerald);" title="Fast <100ms"></div>
                <div id="lat-bar-normal" style="width: 0%; background: var(--accent-cyan);" title="Normal 100-500ms"></div>
                <div id="lat-bar-slow" style="width: 0%; background: var(--accent-amber);" title="Slow >500ms"></div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
              <div style="display: flex; gap: 6px; align-items: center;" id="severity-pill-filters">
                <button class="btn btn-secondary btn-xs severity-pill active" onclick="ReportsView.filterSeverity('ALL')">ALL</button>
                <button class="btn btn-secondary btn-xs severity-pill" onclick="ReportsView.filterSeverity('SUCCESS')">SUCCESS</button>
                <button class="btn btn-secondary btn-xs severity-pill" onclick="ReportsView.filterSeverity('INFO')">INFO</button>
                <button class="btn btn-secondary btn-xs severity-pill" onclick="ReportsView.filterSeverity('WARN')">WARN</button>
                <button class="btn btn-secondary btn-xs severity-pill" onclick="ReportsView.filterSeverity('ERROR')">ERROR</button>
              </div>
              <input type="text" id="log-search-input" class="form-control" style="max-width: 250px; font-size: 0.75rem; padding: 4px 8px;" placeholder="Search logs..." onkeyup="ReportsView.filterSearch(this.value)" />
            </div>

            <div id="report-log-container"></div>
          </div>
        </div>
      </div>
    `;

    this.switchTab('api');
  }

  static toggleAutoRefresh() {
    this.isAutoRefreshActive = !this.isAutoRefreshActive;
    const btn = document.getElementById('btn-auto-refresh');
    if (this.isAutoRefreshActive) {
      if (btn) { btn.className = 'btn btn-emerald btn-sm'; btn.innerHTML = `<i class="fa-solid fa-circle-pause"></i> Auto-Refresh: ON (3s)`; }
      this.autoRefreshInterval = setInterval(() => this.switchTab(this.currentTab, true), 3000);
    } else {
      if (btn) { btn.className = 'btn btn-secondary btn-sm'; btn.innerHTML = `<i class="fa-solid fa-play"></i> Auto-Refresh: OFF`; }
      if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval);
    }
  }

  static async switchTab(tab, isSilent = false) {
    this.currentTab = tab;
    document.querySelectorAll('.rpt-nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(tab === 'api' ? 'tab-api-logs' : (tab === 'system' ? 'tab-sys-logs' : (tab === 'monkeycode' ? 'tab-monkeycode-audit' : 'tab-n8n-workflow')));
    if (btn) btn.classList.add('active');

    const container = document.getElementById('report-log-container');
    if (!container) return;
    if (!isSilent) container.innerHTML = `<div style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--accent-cyan)"></i></div>`;

    if (tab === 'workflow') {
      ReportsViewHelper.renderN8nWorkflowTab(container);
      return;
    }
    if (tab === 'monkeycode') {
      ReportsViewHelper.renderMonkeyCodeAuditTab(container);
      return;
    }

    try {
      const res = tab === 'api' ? await ApiService.getApiLogs() : await ApiService.getSystemLogs();
      this.logs = res.logs || [];
      this.renderFilteredLogs();
    } catch (e) {
      container.innerHTML = `<div class="alert alert-danger">Error loading logs: ${e.message}</div>`;
    }
  }

  static renderFilteredLogs() {
    const container = document.getElementById('report-log-container');
    if (!container || !this.logs) return;

    let filtered = this.logs;
    if (this.activeSeverityFilter !== 'ALL') {
      filtered = filtered.filter(l => (l.status || l.severity || '').toUpperCase().includes(this.activeSeverityFilter));
    }
    if (this.currentSearchQuery) {
      const q = this.currentSearchQuery.toLowerCase();
      filtered = filtered.filter(l => JSON.stringify(l).toLowerCase().includes(q));
    }

    ReportsViewHelper.updateLatencyBar(this.logs);
    ReportsViewHelper.renderLogsTable(container, filtered, this.currentTab);
  }

  static openLogDetailModal(logId) {
    const log = (this.logs || []).find(l => l.id === logId || String(l.timestamp) === String(logId));
    if (log) ReportsViewHelper.renderLogDetailModal(log);
  }

  static calculateLatencyBreakdown(logs) {
    return ReportsViewHelper.calculateLatencyBreakdown(logs);
  }

  static filterSeverity(sev) {
    this.activeSeverityFilter = sev;
    document.querySelectorAll('.severity-pill').forEach(p => p.classList.remove('active'));
    event?.target?.classList.add('active');
    this.renderFilteredLogs();
  }

  static filterSearch(q) {
    this.currentSearchQuery = q;
    this.renderFilteredLogs();
  }

  static async exportLogsCsv() {
    const res = await ApiService.getApiLogs();
    const logs = res.logs || [];
    ReportsViewHelper.exportCsv(logs);
  }

  static async exportLogsJson() {
    const res = await ApiService.getApiLogs();
    const logs = res.logs || [];
    ReportsViewHelper.exportJson(logs);
  }

  static async clearLogs() {
    try {
      await ApiService.clearApiLogs();
      ModalDialog.showNotification('Logs cleared successfully.', 'info');
      this.switchTab(this.currentTab);
    } catch (e) {
      ModalDialog.showNotification('Clear error: ' + e.message, 'error');
    }
  }

  static async syncN8nWorkflows(btn) {
    if (this._isSyncing) return; // Prevent concurrent multi-clicks
    this._isSyncing = true;

    const btnEl = btn || (typeof event !== 'undefined' && event?.target ? event.target.closest('button') : null);
    const origHtml = btnEl ? btnEl.innerHTML : '';
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Syncing...`;
    }

    ModalDialog.showNotification('Syncing 11 workflows to n8n database...', 'info');
    try {
      const res = await ApiService.syncN8nWorkflows();
      if (res.success) {
        ModalDialog.showNotification(`n8n Sync Complete! ${res.importedCount || 11} workflows updated. Opening Master Brain...`, 'success');
        setTimeout(() => {
          window.open(res.masterBrainUrl || 'http://localhost:5678', '_blank');
        }, 1200);
        this.switchTab('workflow');
      } else {
        ModalDialog.showNotification('n8n Sync Warning: ' + (res.error || res.message), 'warning');
      }
    } catch (e) {
      ModalDialog.showNotification('n8n Sync Error: ' + e.message, 'error');
    } finally {
      this._isSyncing = false;
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerHTML = origHtml;
      }
    }
  }
}

window.ReportsView = ReportsView;

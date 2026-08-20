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
  static activeGroupBy = 'none';
  static activeGroupFilter = null;
  static activeBiReport = 'cost';

  static async render(container) {
    // MVC Closed-Loop: Cleanup any stale timers from previous render cycle
    this.cleanup();

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
            <button class="btn btn-secondary btn-sm rpt-nav-btn" id="tab-tool-dist" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="ReportsView.switchTab('tooldist')">
              <i class="fa-solid fa-sitemap" style="color: var(--accent-emerald); margin-right: 6px;"></i> 4. Tool Distribution
            </button>
            <button class="btn btn-secondary btn-sm rpt-nav-btn" id="tab-model-status" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="ReportsView.switchTab('modelstatus')">
              <i class="fa-solid fa-server" style="color: var(--accent-cyan); margin-right: 6px;"></i> 5. Active/Inactive Models Audit
            </button>
            <button class="btn btn-secondary btn-sm rpt-nav-btn" id="tab-bi-analytics" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="ReportsView.switchTab('bianalytics')">
              <i class="fa-solid fa-chart-pie" style="color: var(--accent-amber); margin-right: 6px;"></i> 6. BI Analytical Reports
            </button>
            <button class="btn btn-secondary btn-sm rpt-nav-btn" id="tab-install-checklist" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="ReportsView.switchTab('checklist')">
              <i class="fa-solid fa-check-double" style="color: var(--accent-cyan); margin-right: 6px;"></i> 7. Install Checklist
            </button>
            <button class="btn btn-secondary btn-sm rpt-nav-btn" id="tab-matrix" style="justify-content: flex-start; font-size: 0.75rem; text-align: left; border-top: 1px solid var(--border-color); margin-top: 4px;" onclick="ReportsView.switchTab('matrix')">
              <i class="fa-solid fa-table-list" style="color: var(--accent-cyan); margin-right: 6px;"></i> 8. Provider Config Matrix
            </button>
            <div id="diagnostic-checklist"></div>

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
              <div style="display: flex; gap: 8px; align-items: center;">
                <select id="log-groupby-select" class="form-control" style="font-size: 0.75rem; padding: 4px 8px; max-width: 150px; background: rgba(0,0,0,0.2); color: var(--text-main); border: 1px solid var(--border-color);" onchange="ReportsView.applyGroupBy(this.value)">
                  <option value="none">Group By: None</option>
                  <option value="provider">Provider</option>
                  <option value="model">Model</option>
                  <option value="tool">Tool/Client</option>
                  <option value="status">Status Code</option>
                  <option value="date">Date</option>
                </select>
                <input type="text" id="log-search-input" class="form-control" style="max-width: 250px; font-size: 0.75rem; padding: 4px 8px;" placeholder="Search logs..." onkeyup="ReportsView.filterSearch(this.value)" />
              </div>
            </div>

            <!-- Drilldown header injected dynamically if active -->
            <div id="drilldown-header-container"></div>
            <div id="report-log-container"></div>
          </div>
        </div>
      </div>
    `;

    this.switchTab('api');

    // BUG-9 fix: Render checklist into the dedicated right-pane tab, not the narrow sidebar.
    // DiagnosticChecklist tab button added below; sidebar div left for future compact badges.
    const sidebarChecklist = document.getElementById('diagnostic-checklist');
    if (sidebarChecklist) sidebarChecklist.innerHTML = ''; // Clear placeholder from sidebar

    // Initialize searchable dropdown for group-by selector
    const groupBySelect = document.getElementById('log-groupby-select');
    if (groupBySelect && typeof SearchableSelect !== 'undefined') {
      SearchableSelect.init(groupBySelect, { placeholder: '筛选分组...', maxHeight: 250 });
    }
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

  // ── MVC Isolation: Each tab wrapped in its own error boundary ──
  static _renderTabError(container, tabName, err) {
    console.error(`[ReportsView] Tab '${tabName}' render failed:`, err);
    container.innerHTML = `
      <div class="glass-card" style="padding: 20px; border-left: 3px solid var(--accent-rose);">
        <div style="font-size: 0.9rem; font-weight: 700; color: var(--accent-rose); margin-bottom: 8px;">
          <i class="fa-solid fa-triangle-exclamation"></i> Tab Load Error: ${tabName}
        </div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px;">${String(err.message || err)}</div>
        <button class="btn btn-secondary btn-sm" onclick="ReportsView.switchTab('${tabName}')">
          <i class="fa-solid fa-rotate"></i> Retry
        </button>
      </div>
    `;
  }

  // ── MVC Cleanup: Stop ALL intervals to prevent phantom DOM writes ──
  static cleanup() {
    if (this.isAutoRefreshActive) {
      try { this.isAutoRefreshActive = false; if (this.autoRefreshInterval) { clearInterval(this.autoRefreshInterval); this.autoRefreshInterval = null; } } catch (_) { /* best-effort */ }
    }
    if (this._toolDistRefreshActive) {
      try { this._toolDistRefreshActive = false; if (this._toolDistAutoRefresh) { clearInterval(this._toolDistAutoRefresh); this._toolDistAutoRefresh = null; } } catch (_) { /* best-effort */ }
    }
  }

  static async switchTab(tab, isSilent = false) {
    // Stop tool distribution auto-refresh if leaving that tab
    if (this.currentTab === 'tooldist' && tab !== 'tooldist' && this._toolDistRefreshActive) {
      this.toggleToolDistAutoRefresh();
    }

    this.currentTab = tab;
    if (tab !== 'api') {
       this.activeGroupBy = 'none';
       this.activeGroupFilter = null;
    }
    document.querySelectorAll('.rpt-nav-btn').forEach(b => b.classList.remove('active'));
    const tabMap = { api: 'tab-api-logs', system: 'tab-sys-logs', workflow: 'tab-n8n-workflow', tooldist: 'tab-tool-dist', modelstatus: 'tab-model-status', bianalytics: 'tab-bi-analytics', checklist: 'tab-install-checklist', matrix: 'tab-matrix' };
    const btn = document.getElementById(tabMap[tab] || 'tab-api-logs');
    if (btn) btn.classList.add('active');

    const container = document.getElementById('report-log-container');
    if (!container) return;

    // Hide latency charts and filters if viewing non-log tabs
    const latencyCard = document.getElementById('latency-distribution-card');
    const filterControls = document.getElementById('severity-pill-filters');
    const groupbySelect = document.getElementById('log-groupby-select');
    const searchInput = document.getElementById('log-search-input');
    
    const isLogTab = tab === 'api' || tab === 'system';
    if (!isLogTab) {
      if (latencyCard) latencyCard.style.display = 'none';
      if (filterControls && filterControls.parentElement) filterControls.parentElement.style.display = 'none';
      if (groupbySelect) groupbySelect.style.display = 'none';
      if (searchInput) searchInput.style.display = 'none';
    } else {
      if (latencyCard) latencyCard.style.display = 'block';
      if (filterControls && filterControls.parentElement) filterControls.parentElement.style.display = 'flex';
      if (groupbySelect) groupbySelect.style.display = 'block';
      if (searchInput) searchInput.style.display = 'block';
    }

    if (!isSilent) container.innerHTML = `<div style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--accent-cyan)"></i></div>`;

    try {
      if (tab === 'matrix') {
        const allProviders = await ApiService.getAllProviders();
        if (typeof ProvidersView !== 'undefined' && ProvidersView.renderMatrix) {
          container.innerHTML = `<div id="provider-matrix-container">${ProvidersView.renderMatrix(allProviders)}</div>`;
        } else {
          this._renderTabError(container, tab, new Error('ProvidersView module not loaded.'));
        }
        return;
      }
      if (tab === 'workflow') {
        if (typeof ReportsViewHelper !== 'undefined' && ReportsViewHelper.renderN8nWorkflowTab) {
          ReportsViewHelper.renderN8nWorkflowTab(container);
        } else { this._renderTabError(container, tab, new Error('ReportsViewHelper module not loaded.')); }
        return;
      }
      if (tab === 'tooldist') { this.renderToolDistributionTab(container); return; }
      if (tab === 'modelstatus') { this.renderModelStatusTab(container); return; }
      if (tab === 'bianalytics') { this.renderBiAnalyticsTab(container); return; }
      if (tab === 'checklist') {
        if (typeof DiagnosticChecklist !== 'undefined' && DiagnosticChecklist.renderFull) {
          DiagnosticChecklist.renderFull(container);
        } else { this._renderTabError(container, tab, new Error('DiagnosticChecklist module not loaded.')); }
        return;
      }

      const res = tab === 'api' ? await ApiService.getApiLogs() : await ApiService.getSystemLogs();
      this.logs = res.logs || [];
      this.renderFilteredLogs();
    } catch (e) {
      this._renderTabError(container, tab, e);
    }
  }

  static renderFilteredLogs() {
    const container = document.getElementById('report-log-container');
    const drilldownContainer = document.getElementById('drilldown-header-container');
    if (!container || !this.logs) return;

    let filtered = this.logs;

    if (this.activeGroupFilter && this.activeGroupBy !== 'none' && this.currentTab === 'api') {
      filtered = filtered.filter(l => {
        let keyVal = 'Unknown';
        switch(this.activeGroupBy) {
          case 'provider': keyVal = l.providerName || l.providerId || 'Unknown'; break;
          case 'model': keyVal = l.modelId || 'Unknown Model'; break;
          case 'tool': keyVal = l.toolName || 'Unknown Tool'; break;
          case 'status': keyVal = String(l.status || l.statusCode || 'Unknown'); break;
          case 'date': 
            if (l.timestamp) {
              const d = new Date(l.timestamp);
              keyVal = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            }
            break;
        }
        return String(keyVal) === String(this.activeGroupFilter);
      });
      if (drilldownContainer) {
        drilldownContainer.innerHTML = `
          <div style="background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 4px; border-left: 3px solid var(--accent-cyan); display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.8rem; color: var(--text-main);">
              <i class="fa-solid fa-filter" style="color: var(--accent-cyan); margin-right: 6px;"></i> 
              Drill-down: Grouping by <strong>${this.activeGroupBy.toUpperCase()}</strong> = <strong>${this.activeGroupFilter}</strong>
            </span>
            <button class="btn btn-secondary btn-xs" onclick="ReportsView.applyGroupFilter(null)"><i class="fa-solid fa-times"></i> Clear Drill-down</button>
          </div>
        `;
      }
    } else if (drilldownContainer) {
      drilldownContainer.innerHTML = '';
    }

    if (this.activeSeverityFilter !== 'ALL') {
      filtered = filtered.filter(l => (l.status || l.severity || '').toUpperCase().includes(this.activeSeverityFilter));
    }
    if (this.currentSearchQuery) {
      const q = this.currentSearchQuery.toLowerCase();
      filtered = filtered.filter(l => {
        const text = `${l.modelId || ''} ${l.providerName || ''} ${l.status || ''} ${l.endpoint || ''} ${l.responseSummary || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    ReportsViewHelper.updateLatencyBar(this.logs);

    if (this.activeGroupBy !== 'none' && !this.activeGroupFilter && this.currentTab === 'api') {
      const grouped = ReportsViewHelper.generateGroupedAnalytics(filtered, this.activeGroupBy);
      ReportsViewHelper.renderGroupedAnalyticsTable(container, grouped, this.activeGroupBy);
    } else {
      ReportsViewHelper.renderLogsTable(container, filtered, this.currentTab);
    }
  }

  static applyGroupBy(groupKey) {
    this.activeGroupBy = groupKey;
    this.activeGroupFilter = null;
    this.renderFilteredLogs();
  }

  static applyGroupFilter(groupName) {
    this.activeGroupFilter = groupName;
    this.renderFilteredLogs();
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
    // Find and activate the clicked pill by matching text content
    document.querySelectorAll('.severity-pill').forEach(p => {
      if (p.textContent.trim() === sev) p.classList.add('active');
    });
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
    ModalDialog.showOptionModal({
      title: 'Clear Diagnostic & System Logs',
      message: 'Select which log targets to clear from the database:',
      icon: 'fa-trash',
      options: [
        {
          id: 'clear-api',
          label: 'Clear API Telemetry Logs Only',
          icon: 'fa-chart-line',
          type: 'warning',
          action: async () => {
            await ApiService.request('/api/reports/clear', {
              method: 'POST',
              body: JSON.stringify({ type: 'api' })
            });
            ModalDialog.showNotification('API diagnostic logs cleared.', 'info');
            ReportsView.renderFilteredLogs();
            if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
          }
        },
        {
          id: 'clear-sys',
          label: 'Clear System Event Logs Only',
          icon: 'fa-clock-rotate-left',
          type: 'warning',
          action: async () => {
            await ApiService.request('/api/reports/clear', {
              method: 'POST',
              body: JSON.stringify({ type: 'system' })
            });
            ModalDialog.showNotification('System event logs cleared.', 'info');
            ReportsView.renderFilteredLogs();
            if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
          }
        },
        {
          id: 'clear-all',
          label: 'Clear All Telemetry & System Logs',
          icon: 'fa-trash',
          type: 'rose',
          action: async () => {
            await ApiService.request('/api/reports/clear', {
              method: 'POST',
              body: JSON.stringify({ type: 'all' })
            });
            ModalDialog.showNotification('All diagnostic logs cleared.', 'success');
            ReportsView.renderFilteredLogs();
            if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
          }
        }
      ]
    });
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

  // ── Tool Distribution Tab ──
  static _toolDistAutoRefresh = null;
  static _toolDistRefreshActive = false;

  static async renderToolDistributionTab(container) {
    try {
      const [distRes, connRes, conflictRes, statsRes, knownRes] = await Promise.all([
        ApiService.getToolDistribution(),
        ApiService.getActiveConnections(),
        ApiService.getConflictLog(),
        ApiService.getToolStats(),
        ApiService.getKnownTools()
      ]);

      const activeTools = distRes.activeTools || {};
      const connections = connRes.connections || [];
      const conflicts = conflictRes.events || [];
      const toolStats = statsRes.toolStats || [];
      const knownTools = knownRes.tools || [];
      const conflictStrategy = connRes.conflictStrategy || 'allow';

      // Build stats table rows
      const statsRows = toolStats.map(s => `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 6px 8px;"><i class="${s.toolIcon}" style="color: ${s.toolColor}; margin-right: 4px;"></i> ${s.toolName}</td>
          <td style="padding: 6px 8px; text-align: center;">${s.totalRequests}</td>
          <td style="padding: 6px 8px; text-align: center;"><span style="color: ${s.successRate >= 90 ? 'var(--accent-emerald)' : s.successRate >= 70 ? 'var(--accent-amber)' : 'var(--accent-rose)'};">${s.successRate}%</span></td>
          <td style="padding: 6px 8px; text-align: center;">${s.avgLatencyMs}ms</td>
          <td style="padding: 6px 8px; text-align: center;">${s.totalTokens.toLocaleString()}</td>
          <td style="padding: 6px 8px; text-align: center;">${s.modelsUsed.length}</td>
          <td style="padding: 6px 8px; text-align: center;">${s.conflictCount > 0 ? `<span style="color: var(--accent-rose); font-weight:700;">${s.conflictCount}</span>` : '0'}</td>
        </tr>
      `).join('');

      // Build conflict timeline
      const conflictRows = conflicts.slice(0, 20).map(c => `
        <div style="display: flex; gap: 8px; align-items: flex-start; padding: 6px 0; border-bottom: 1px solid var(--border-color); font-size: 0.7rem;">
          <span style="color: var(--accent-amber); white-space: nowrap;">${new Date(c.timestamp).toLocaleTimeString()}</span>
          <span style="color: var(--accent-rose);"><i class="fa-solid fa-triangle-exclamation"></i></span>
          <span style="color: var(--text-main);"><b>${c.conflictingTool}</b> → <code>${c.modelId}</code> (used by <b>${c.primaryTool}</b>)</span>
          <span class="btn btn-secondary btn-xs" style="margin-left: auto; font-size: 0.6rem;">${c.strategy}</span>
        </div>
      `).join('');

      // Build known tools listbox items
      const knownToolRows = knownTools.map(t => {
        const isActive = !!activeTools[t.toolId];
        return `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-bottom:1px solid var(--border-color);cursor:pointer;transition:background 0.15s;"
               onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'"
               onclick="ReportsView.showKnownToolDetail('${t.toolId}', '${t.displayName}')">
            <i class="${t.icon}" style="font-size:1rem;color:${t.color};width:20px;text-align:center;"></i>
            <div style="flex:1;min-width:0;">
              <div style="font-size:0.73rem;font-weight:600;color:var(--text-main);">${t.displayName}</div>
              <div style="font-size:0.62rem;color:var(--text-muted);">${t.toolId}</div>
            </div>
            <span style="width:8px;height:8px;border-radius:50%;background:${isActive ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.15)'};flex-shrink:0;" title="${isActive ? 'Active' : 'Idle'}"></span>
          </div>`;
      }).join('');

      // Build model selector options for test dialog
      const modelOptions = toolStats.length > 0
        ? toolStats.flatMap(s => s.modelsUsed).filter((v, i, a) => a.indexOf(v) === i).map(m => `<option value="${m}">${m}</option>`).join('')
        : '<option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>';

      container.innerHTML = `
        <div style="display: flex; gap: 14px; align-items: flex-start;">

          <!-- Left Column: Known Tools Registry + Conflict Summary -->
          <div style="width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px;">

            <!-- Known Tools Registry Listbox -->
            <div class="glass-panel" style="padding: 12px; background: rgba(0,0,0,0.2);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="font-size:0.8rem;font-weight:700;color:var(--accent-cyan);">
                  <i class="fa-solid fa-address-book"></i> Known Tools (${knownTools.length})
                </div>
              </div>
              <div style="max-height:320px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;">
                ${knownToolRows || '<div style="text-align:center;color:var(--text-muted);padding:12px;font-size:0.72rem;">Loading...</div>'}
              </div>
              <div style="margin-top:8px;display:flex;gap:4px;">
                <button class="btn btn-secondary btn-xs" style="flex:1;justify-content:center;" onclick="ReportsView.showTestToolDialog()">
                  <i class="fa-solid fa-vial"></i> Test Tool
                </button>
                <button class="btn btn-secondary btn-xs" style="flex:1;justify-content:center;" onclick="ReportsView.exportToolDistribution()">
                  <i class="fa-solid fa-file-export"></i> Export
                </button>
              </div>
            </div>

            <!-- Conflict Summary Mini-Card -->
            <div class="glass-panel" style="padding: 12px; background: rgba(0,0,0,0.2); border-left: 3px solid ${conflicts.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'};">
              <div style="font-size:0.78rem;font-weight:700;color:${conflicts.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'};margin-bottom:6px;">
                <i class="fa-solid fa-fa-${conflicts.length > 0 ? 'triangle-exclamation' : 'shield-check'}"></i> Conflict Summary
              </div>
              <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">
                Total Events: <strong style="color:var(--text-main);">${conflicts.length}</strong>
              </div>
              <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">
                Strategy: <span style="color:var(--accent-cyan);font-weight:600;">${conflictStrategy.toUpperCase()}</span>
              </div>
              <div style="font-size:0.72rem;color:var(--text-muted);">
                Active Connections: <strong style="color:var(--text-main);">${connections.length}</strong>
              </div>
            </div>
          </div>

          <!-- Right Column: Main Content -->
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 14px;">

            <!-- Header Bar with Controls -->
            <div class="glass-panel" style="padding: 10px 12px; background: rgba(0,0,0,0.2); display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">
                <i class="fa-solid fa-sitemap" style="color: var(--accent-emerald);"></i> Tool Distribution Dashboard
              </div>
              <div style="display: flex; gap: 6px; align-items: center;">
                <button class="btn btn-xs ${this._toolDistRefreshActive ? 'btn-emerald' : 'btn-secondary'}" id="tool-dist-autorefresh-btn"
                  onclick="ReportsView.toggleToolDistAutoRefresh()" title="Auto-refresh every 3s">
                  <i class="fa-solid fa-${this._toolDistRefreshActive ? 'pause' : 'play'}"></i> ${this._toolDistRefreshActive ? 'Live' : 'Auto'}
                </button>
                <button class="btn btn-secondary btn-xs" onclick="ReportsView.renderToolDistributionTab(document.getElementById('report-log-container'))" title="Manual Refresh">
                  <i class="fa-solid fa-rotate"></i>
                </button>
              </div>
            </div>

            <!-- Active Connections Live Panel -->
            <div class="glass-panel" style="padding: 12px; background: rgba(0,0,0,0.2);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-size: 0.82rem; font-weight: 700; color: var(--accent-emerald);">
                  <i class="fa-solid fa-plug"></i> Active Connections (${connections.length})
                </div>
                <span class="btn btn-xs" style="background: ${conflictStrategy === 'allow' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}; color: ${conflictStrategy === 'allow' ? 'var(--accent-emerald)' : 'var(--accent-amber)'}; font-size: 0.65rem; border: 1px solid ${conflictStrategy === 'allow' ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">Strategy: ${conflictStrategy.toUpperCase()}</span>
              </div>
              ${connections.length === 0 ? '<div style="text-align:center; color: var(--text-muted); padding: 24px; font-size: 0.75rem;"><i class="fa-solid fa-plug-circle-xmark" style="font-size:1.5rem;display:block;margin-bottom:8px;opacity:0.3;"></i>No active tool connections right now.<br/>Send a request from any connected tool to see it here live.</div>' : `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px;">
                  ${connections.map(c => `
                    <div style="padding: 10px; background: rgba(255,255,255,0.04); border-radius: 6px; border-left: 3px solid ${c.toolColor || '#6B7280'};">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="${c.toolIcon || 'fa-solid fa-circle'}" style="color: ${c.toolColor || '#6B7280'}; font-size: 0.9rem;"></i>
                        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-main);">${c.toolName}</span>
                        <span style="font-size: 0.6rem;color:var(--accent-emerald);margin-left:auto;"><i class="fa-solid fa-circle" style="font-size:0.4rem;"></i> LIVE</span>
                      </div>
                      <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">
                        Model: <code style="color: var(--accent-cyan);">${c.modelId}</code>
                      </div>
                      <div style="font-size: 0.62rem; color: var(--text-muted); margin-top: 2px;">
                        Duration: ${Math.round(c.durationMs / 1000)}s | Combo: ${c.comboId || 'direct'} | Session: ${c.clientSessionId}
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>

            <!-- Tool Usage Stats Table -->
            <div class="glass-panel" style="padding: 12px; background: rgba(0,0,0,0.2);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <div style="font-size: 0.82rem; font-weight: 700; color: var(--accent-cyan);">
                  <i class="fa-solid fa-chart-bar"></i> Tool Usage Stats (Last ${statsRes.hours || 24}h)
                </div>
                <span style="font-size:0.65rem;color:var(--text-muted);">${toolStats.length} tool${toolStats.length !== 1 ? 's' : ''} tracked</span>
              </div>
              ${toolStats.length === 0 ? '<div style="text-align:center; color: var(--text-muted); padding: 24px; font-size: 0.75rem;"><i class="fa-solid fa-chart-simple" style="font-size:1.5rem;display:block;margin-bottom:8px;opacity:0.3;"></i>No tool usage data yet.<br/>API logs will be tagged with tool identity as requests come in.</div>' : `
                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 0.72rem;">
                    <thead>
                      <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-muted);">
                        <th style="padding: 6px 8px; text-align: left;">Tool</th>
                        <th style="padding: 6px 8px; text-align: center;">Requests</th>
                        <th style="padding: 6px 8px; text-align: center;">Success %</th>
                        <th style="padding: 6px 8px; text-align: center;">Avg Latency</th>
                        <th style="padding: 6px 8px; text-align: center;">Tokens</th>
                        <th style="padding: 6px 8px; text-align: center;">Models Used</th>
                        <th style="padding: 6px 8px; text-align: center;">Conflicts</th>
                      </tr>
                    </thead>
                    <tbody>${statsRows}</tbody>
                  </table>
                </div>
              `}
            </div>

            <!-- Conflict Timeline -->
            <div class="glass-panel" style="padding: 12px; background: rgba(0,0,0,0.2);">
              <div style="font-size: 0.82rem; font-weight: 700; color: var(--accent-rose); margin-bottom: 10px;">
                <i class="fa-solid fa-triangle-exclamation"></i> Conflict Events (${conflicts.length})
              </div>
              ${conflicts.length === 0 ? '<div style="text-align:center; color: var(--text-muted); padding: 24px; font-size: 0.75rem;"><i class="fa-solid fa-shield-check" style="font-size:1.5rem;display:block;margin-bottom:8px;opacity:0.3;"></i>No tool conflicts detected.<br/>All tools are targeting different models.</div>' : `
                <div style="max-height: 300px; overflow-y: auto;">
                  ${conflictRows}
                </div>
              `}
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="alert alert-danger"><i class="fa-solid fa-circle-exclamation"></i> Error loading tool distribution: ${e.message}</div>`;
    }
  }

  // ── Auto-refresh for Tool Distribution ──
  static toggleToolDistAutoRefresh() {
    this._toolDistRefreshActive = !this._toolDistRefreshActive;
    const btn = document.getElementById('tool-dist-autorefresh-btn');
    if (this._toolDistRefreshActive) {
      this._toolDistAutoRefresh = setInterval(() => {
        const container = document.getElementById('report-log-container');
        if (container && this.currentTab === 'tooldist') this.renderToolDistributionTab(container);
      }, 3000);
      if (btn) { btn.className = 'btn btn-xs btn-emerald'; btn.innerHTML = '<i class="fa-solid fa-circle-pause"></i> Live'; }
      ModalDialog.showNotification('Tool Distribution auto-refresh enabled (3s)', 'info');
    } else {
      if (this._toolDistAutoRefresh) { clearInterval(this._toolDistAutoRefresh); this._toolDistAutoRefresh = null; }
      if (btn) { btn.className = 'btn btn-xs btn-secondary'; btn.innerHTML = '<i class="fa-solid fa-play"></i> Auto'; }
    }
  }

  // ── Show Known Tool Detail Dialog ──
  static async showKnownToolDetail(toolId, toolName) {
    try {
      const [knownRes, statsRes] = await Promise.all([
        ApiService.getKnownTools(),
        ApiService.getToolStats(168) // Last 7 days
      ]);
      const tool = (knownRes.tools || []).find(t => t.toolId === toolId);
      const toolStat = (statsRes.toolStats || []).find(s => s.toolName === toolName);

      ModalDialog.showModal({
        title: `Tool: ${toolName}`,
        icon: tool ? tool.icon : 'fa-robot',
        body: `
          <div style="font-size:0.85rem;color:var(--text-main);line-height:1.6;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:10px;background:rgba(0,0,0,0.2);border-radius:6px;border-left:3px solid ${tool ? tool.color : '#6B7280'};">
              <i class="${tool ? tool.icon : 'fa-solid fa-robot'}" style="font-size:2rem;color:${tool ? tool.color : '#6B7280'};"></i>
              <div>
                <div style="font-size:1rem;font-weight:700;">${toolName}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);">ID: ${toolId}</div>
              </div>
            </div>
            ${toolStat ? `
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                <div style="background:rgba(0,0,0,0.2);padding:8px;border-radius:6px;text-align:center;">
                  <div style="font-size:1.2rem;font-weight:700;color:var(--accent-cyan);">${toolStat.totalRequests}</div>
                  <div style="font-size:0.7rem;color:var(--text-muted);">Requests (7d)</div>
                </div>
                <div style="background:rgba(0,0,0,0.2);padding:8px;border-radius:6px;text-align:center;">
                  <div style="font-size:1.2rem;font-weight:700;color:var(--accent-emerald);">${toolStat.successRate}%</div>
                  <div style="font-size:0.7rem;color:var(--text-muted);">Success Rate</div>
                </div>
                <div style="background:rgba(0,0,0,0.2);padding:8px;border-radius:6px;text-align:center;">
                  <div style="font-size:1.2rem;font-weight:700;color:var(--accent-amber);">${toolStat.avgLatencyMs}ms</div>
                  <div style="font-size:0.7rem;color:var(--text-muted);">Avg Latency</div>
                </div>
                <div style="background:rgba(0,0,0,0.2);padding:8px;border-radius:6px;text-align:center;">
                  <div style="font-size:1.2rem;font-weight:700;color:${toolStat.conflictCount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'};">${toolStat.conflictCount}</div>
                  <div style="font-size:0.7rem;color:var(--text-muted);">Conflicts</div>
                </div>
              </div>
              <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;"><strong>Models Used:</strong></div>
              <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">
                ${(toolStat.modelsUsed || []).map(m => `<span style="font-size:0.7rem;background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:4px;color:var(--accent-cyan);">${m}</span>`).join('')}
                ${(toolStat.modelsUsed || []).length === 0 ? '<span style="font-size:0.7rem;color:var(--text-muted);">None yet</span>' : ''}
              </div>
            ` : `
              <div style="text-align:center;color:var(--text-muted);padding:12px;font-size:0.78rem;">
                <i class="fa-solid fa-chart-simple" style="font-size:1.2rem;display:block;margin-bottom:6px;opacity:0.4;"></i>
                No historical usage data for this tool yet.
              </div>
            `}
          </div>
        `,
        confirmText: 'Close'
      });
    } catch (e) {
      ModalDialog.showNotification('Error loading tool details: ' + e.message, 'error');
    }
  }

  // ── Send Test Request Dialog ──
  static showTestToolDialog() {
    const toolOptions = [
      'VS Code Copilot', 'Claude Desktop', 'Cursor IDE', 'Cline', 'Kilo Code',
      'OpenRouter', 'OpenAI Codex', 'MCP Client', 'FMC Dashboard', 'Postman', 'cURL / Terminal'
    ].map(t => `<option value="${t}">${t}</option>`).join('');

    ModalDialog.showModal({
      title: 'Send Test Request as Tool',
      icon: 'fa-vial',
      body: `
        <div style="font-size:0.85rem;color:var(--text-main);line-height:1.6;">
          <p style="margin-bottom:10px;">Simulate a request from a specific AI tool to verify identification and conflict detection.</p>
          <div class="form-group" style="margin-bottom:10px;">
            <label style="font-size:0.8rem;font-weight:600;">Simulated Tool:</label>
            <select id="test-tool-select" class="form-control" style="font-size:0.8rem;">${toolOptions}</select>
          </div>
          <div class="form-group" style="margin-bottom:10px;">
            <label style="font-size:0.8rem;font-weight:600;">Test Message:</label>
            <input type="text" id="test-tool-message" class="form-control" style="font-size:0.8rem;" value="Hello from test tool!" placeholder="Enter test prompt..." />
          </div>
          <div style="background:rgba(0,0,0,0.2);padding:8px;border-radius:6px;font-size:0.72rem;color:var(--text-muted);">
            <i class="fa-solid fa-circle-info" style="color:var(--accent-cyan);margin-right:4px;"></i>
            The request will include an <code>X-Tool-Name</code> header for identification. Check the Active Connections panel to see the result.
          </div>
        </div>
      `,
      confirmText: 'Send Test',
      onConfirm: async () => {
        const toolName = document.getElementById('test-tool-select')?.value || 'VS Code Copilot';
        const message = document.getElementById('test-tool-message')?.value || 'Hello from test tool!';
        try {
          ModalDialog.showNotification(`Sending test request as "${toolName}"...`, 'info');
          const res = await fetch('/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...ApiService.getAuthHeader(),
              'X-Tool-Name': toolName,
              'X-Client-Id': `test-${Date.now()}`
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: message }],
              stream: false
            })
          });
          const data = await res.json();
          if (res.ok) {
            ModalDialog.showNotification(`Test successful! Tool "${toolName}" identified. Status: ${res.status}`, 'success');
          } else {
            ModalDialog.showNotification(`Test completed. Tool "${toolName}" → HTTP ${res.status}: ${data.error?.message || 'Unknown'}`, 'warning');
          }
          // Refresh the tab to show new connection
          setTimeout(() => {
            const container = document.getElementById('report-log-container');
            if (container && this.currentTab === 'tooldist') this.renderToolDistributionTab(container);
          }, 500);
        } catch (e) {
          ModalDialog.showNotification('Test request failed: ' + e.message, 'error');
        }
      }
    });
  }

  // ── Export Tool Distribution Data ──
  static async exportToolDistribution() {
    try {
      const [distRes, statsRes, conflictRes] = await Promise.all([
        ApiService.getToolDistribution(),
        ApiService.getToolStats(168),
        ApiService.getConflictLog(200)
      ]);
      const exportData = {
        exportedAt: new Date().toISOString(),
        activeConnections: distRes.activeTools || {},
        toolStats: statsRes.toolStats || [],
        conflictEvents: conflictRes.events || [],
        conflictStrategy: conflictRes.conflictStrategy || 'allow'
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fmc-tool-distribution-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      ModalDialog.showNotification('Tool Distribution data exported!', 'success');
    } catch (e) {
      ModalDialog.showNotification('Export failed: ' + e.message, 'error');
    }
  }
  // ── Tab 5: Active vs Inactive Model Audit Tree & Sliding Drawer ──
  static async renderModelStatusTab(container) {
    try {
      const res = await ApiService.request('/api/reports/modelstatus');
      const data = res?.data || {};
      const summary = data.summary || {};
      const activeData = data.active || {};
      const inactiveData = data.inactive || {};

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Top Header & Monitoring Controls -->
          <div class="glass-panel" style="margin-bottom: 0; padding: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <h4 style="font-size: 0.95rem; color: var(--accent-cyan); margin: 0; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-server"></i> Active vs Inactive Provider & Model Audit Pipeline
              </h4>
              <p style="color: var(--text-muted); font-size: 0.78rem; margin: 4px 0 0 0;">
                Background audit checks status every <strong>${data.frequencyHours || 1} hour(s)</strong>. Bypasses inactive or offline models automatically during chat.
              </p>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.75rem; color: var(--text-muted);">Check Interval:</span>
              <select class="form-control" style="font-size: 0.75rem; padding: 2px 6px; width: 110px;" onchange="ReportsView.updateMonitoringInterval(this.value)">
                <option value="0.1" ${data.frequencyHours === 0.1 ? 'selected' : ''}>6 mins</option>
                <option value="0.5" ${data.frequencyHours === 0.5 ? 'selected' : ''}>30 mins</option>
                <option value="1" ${data.frequencyHours === 1 ? 'selected' : ''}>1 Hour (Default)</option>
                <option value="2" ${data.frequencyHours === 2 ? 'selected' : ''}>2 Hours</option>
                <option value="6" ${data.frequencyHours === 6 ? 'selected' : ''}>6 Hours</option>
                <option value="12" ${data.frequencyHours === 12 ? 'selected' : ''}>12 Hours</option>
                <option value="24" ${data.frequencyHours === 24 ? 'selected' : ''}>24 Hours</option>
              </select>
              <button class="btn btn-secondary btn-xs" onclick="ReportsView.switchTab('modelstatus')"><i class="fa-solid fa-rotate"></i> Run Audit Now</button>
            </div>
          </div>

          <!-- Summary Badges -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
            <div class="glass-panel" style="margin-bottom:0; padding:10px; border-left: 3px solid var(--accent-emerald);">
              <span style="font-size:0.68rem; color:var(--text-muted); display:block;">Active Models / Total</span>
              <strong style="font-size:1.1rem; color:var(--accent-emerald);">${summary.activeModelsCount || 0} / ${summary.totalModels || 0} Active</strong>
            </div>
            <div class="glass-panel" style="margin-bottom:0; padding:10px; border-left: 3px solid var(--accent-rose);">
              <span style="font-size:0.68rem; color:var(--text-muted); display:block;">Inactive / Bypassed</span>
              <strong style="font-size:1.1rem; color:var(--accent-rose);">${summary.inactiveModelsCount || 0} Inactive</strong>
            </div>
            <div class="glass-panel" style="margin-bottom:0; padding:10px; border-left: 3px solid var(--accent-cyan);">
              <span style="font-size:0.68rem; color:var(--text-muted); display:block;">Active Combos / Providers</span>
              <strong style="font-size:1.1rem; color:var(--accent-cyan);">${summary.activeCombosCount || 0} Combos • ${summary.activeProvidersCount || 0} Providers</strong>
            </div>
            <div class="glass-panel" style="margin-bottom:0; padding:10px; border-left: 3px solid ${data.isLocalServerActive ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">
              <span style="font-size:0.68rem; color:var(--text-muted); display:block;">Local Server (Port 11434)</span>
              <strong style="font-size:1.1rem; color:${data.isLocalServerActive ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">${data.isLocalServerActive ? '🟢 ONLINE' : '🔴 OFFLINE'}</strong>
            </div>
          </div>

          <!-- 3 PANELS: ACTIVE (Panel 1) vs INACTIVE (Panel 2) vs SLEEPING (Panel 3) -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
            <!-- PANEL 1: ACTIVE GROUP -->
            <div class="glass-panel" style="margin-bottom:0; padding:12px; border-top: 3px solid var(--accent-emerald);">
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-emerald); margin-bottom: 10px; display:flex; justify-content:space-between; align-items:center;">
                <span><i class="fa-solid fa-circle-check"></i> Panel 1: Active Tree</span>
                <span class="badge badge-emerald" style="font-size:0.7rem;">${summary.activeModelsCount || 0} Active</span>
              </div>
              ${ReportsView.renderTreePanel(activeData, true)}
            </div>

            <!-- PANEL 2: INACTIVE GROUP -->
            <div class="glass-panel" style="margin-bottom:0; padding:12px; border-top: 3px solid var(--accent-rose);">
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-rose); margin-bottom: 10px; display:flex; justify-content:space-between; align-items:center;">
                <span><i class="fa-solid fa-circle-xmark"></i> Panel 2: Inactive Tree</span>
                <span class="badge badge-rose" style="font-size:0.7rem;">${summary.inactiveModelsCount || 0} Inactive</span>
              </div>
              ${ReportsView.renderTreePanel(inactiveData, false)}
            </div>

            <!-- PANEL 3: BLACKLISTED SLEEP MODE GROUP -->
            <div class="glass-panel" style="margin-bottom:0; padding:12px; border-top: 3px solid var(--accent-amber);">
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-amber); margin-bottom: 10px; display:flex; justify-content:space-between; align-items:center;">
                <span><i class="fa-solid fa-moon"></i> Panel 3: Sleep Mode</span>
                <span class="badge badge-rose" style="font-size:0.7rem;">${summary.blacklistedModelsCount || 0} Sleeping</span>
              </div>
              ${ReportsView.renderTreePanel(data.blacklisted || {}, false, true)}
            </div>
          </div>
        </div>

        <!-- Sliding Metadata Right Drawer Container -->
        <div id="model-metadata-slide-drawer" class="glass-panel" style="position: fixed; top: 0; right: -420px; width: 400px; height: 100vh; z-index: 9999; background: var(--bg-card); border-left: 2px solid var(--accent-cyan); box-shadow: -10px 0 30px rgba(0,0,0,0.5); transition: right 0.3s ease; padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto;">
          <!-- Content rendered dynamically by openModelDrawer -->
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="alert alert-danger">Failed to load model status: ${e.message}</div>`;
    }
  }

  static renderTreePanel(groupData, isActiveGroup, isBlacklistedGroup = false) {
    let combos = [...(groupData.combos || [])];
    let providers = [...(groupData.providers || [])];

    if (isActiveGroup) {
      providers = providers.filter(p => p.isActive && !p.isBlacklisted && p.activeModelsCount > 0);
      providers.sort((a, b) => (b.activeModelsCount || 0) - (a.activeModelsCount || 0));
      combos.sort((a, b) => (b.activeModelsCount || 0) - (a.activeModelsCount || 0));
    } else if (isBlacklistedGroup) {
      providers = providers.filter(p => p.isBlacklisted);
      providers.sort((a, b) => (b.totalModelsCount || 0) - (a.totalModelsCount || 0));
      combos.sort((a, b) => ((b.blacklistedModels || []).length) - ((a.blacklistedModels || []).length));
    } else {
      providers.sort((a, b) => (b.inactiveModelsCount || 0) - (a.inactiveModelsCount || 0));
      combos.sort((a, b) => (b.inactiveModelsCount || 0) - (a.inactiveModelsCount || 0));
    }

    let html = `
      <div style="margin-bottom:12px;">
        <input type="text" placeholder="Search Models & Providers..." style="width:100%; padding:6px 12px; border-radius:6px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); color:white; font-size:0.75rem;" oninput="ReportsView.filterTree(this.value, '${isActiveGroup ? 'act' : (isBlacklistedGroup ? 'black' : 'inact')}')" />
      </div>
      <div style="display:flex; flex-direction:column; gap:8px;" id="tree-container-${isActiveGroup ? 'act' : (isBlacklistedGroup ? 'black' : 'inact')}">
    `;

    html += `
      <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); border-bottom:1px solid var(--border-color); padding-bottom:4px;">
        <i class="fa-solid fa-cubes-stacked"></i> Model Combos (${combos.length})
      </div>
    `;

    if (combos.length === 0) {
      html += `<div style="font-size:0.72rem; color:var(--text-dim); font-style:italic; padding:4px 8px;">No ${isBlacklistedGroup ? 'sleeping' : (isActiveGroup ? 'active' : 'inactive')} combos found.</div>`;
    } else {
      combos.forEach((c, idx) => {
        const treeId = `tree-combo-${isActiveGroup ? 'act' : (isBlacklistedGroup ? 'black' : 'inact')}-${idx}`;
        let badgeClass = 'badge-rose';
        let badgeLabel = '';

        if (isBlacklistedGroup) {
          badgeClass = 'badge-rose';
          badgeLabel = `${c.blacklistedModels ? c.blacklistedModels.length : 0} Sleeping`;
        } else if (isActiveGroup) {
          const allActive = c.activeModelsCount === c.totalModelsCount;
          badgeClass = allActive ? 'badge-emerald' : 'badge-amber';
          badgeLabel = `${c.activeModelsCount}/${c.totalModelsCount} Models`;
        } else {
          badgeClass = 'badge-rose';
          badgeLabel = `${c.inactiveModelsCount}/${c.totalModelsCount} Inactive`;
        }

        html += `
          <div style="background:rgba(255,255,255,0.03); border-radius:6px; border:1px solid var(--border-color); overflow:hidden;">
            <div style="padding:6px 10px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; font-size:0.78rem;" onclick="ReportsView.toggleTreeNode('${treeId}')">
              <span style="font-weight:700; color:var(--text-main);">
                <i class="fa-solid fa-angle-right" id="icon-${treeId}" style="transition:transform 0.2s ease; margin-right:6px; color:var(--accent-cyan);"></i> ${c.name}
              </span>
              <span class="badge ${badgeClass}" style="font-size:0.65rem;">${badgeLabel}</span>
            </div>
            <div id="${treeId}" style="display:none; padding:6px 10px 8px 24px; border-top:1px dashed var(--border-color); flex-direction:column; gap:4px; font-size:0.72rem;">
              ${(isActiveGroup ? (c.activeModels || []) : (isBlacklistedGroup ? (c.blacklistedModels || []) : (c.inactiveModels || []))).map(m => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:3px 6px; background:rgba(0,0,0,0.2); border-radius:4px;">
                  <span style="color:var(--text-main); cursor:pointer;" onclick="ReportsView.openModelDrawer('${m.id}')" title="Click for specs & options">
                    <i class="fa-solid fa-microchip" style="color:var(--accent-amber); margin-right:4px;"></i> ${typeof FormatHelper !== 'undefined' ? FormatHelper.getModelDisplayName(m) : (m.modelName || m.modelId)}
                  </span>
                  <button class="btn btn-secondary btn-xs" style="padding:1px 4px; font-size:0.65rem;" onclick="ReportsView.openModelDrawer('${m.id}')">Specs &gt;</button>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      });
    }

    html += `
      <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); border-bottom:1px solid var(--border-color); padding-bottom:4px; margin-top:8px; display:flex; justify-content:space-between; align-items:center;">
        <span><i class="fa-solid fa-network-wired"></i> Providers Group (${providers.length})</span>
        ${isBlacklistedGroup && providers.length > 0 ? `
          <button class="btn btn-emerald btn-xs" style="padding: 2px 8px; font-weight: 700; font-size: 0.65rem;" onclick="ReportsView.wakeUpAllProviders()">
            <i class="fa-solid fa-sun"></i> Wake Up All
          </button>
        ` : ''}
      </div>
    `;

    if (providers.length === 0) {
      html += `<div style="font-size:0.72rem; color:var(--text-dim); font-style:italic; padding:4px 8px;">No ${isBlacklistedGroup ? 'sleeping' : (isActiveGroup ? 'active' : 'inactive')} providers found.</div>`;
    } else {
      providers.forEach((p, idx) => {
        const treeId = `tree-prov-${isActiveGroup ? 'act' : (isBlacklistedGroup ? 'black' : 'inact')}-${idx}`;
        let badgeClass = 'badge-rose';
        let badgeLabel = '';

        if (isBlacklistedGroup) {
          badgeClass = 'badge-rose';
          badgeLabel = `🌙 Sleep (${p.remainingMinutes}m)`;
        } else if (isActiveGroup) {
          const allActive = p.inactiveModelsCount === 0 && p.activeModelsCount > 0;
          badgeClass = allActive ? 'badge-emerald' : 'badge-amber';
          badgeLabel = `${p.activeModelsCount}/${p.totalModelsCount} Active`;
        } else {
          badgeClass = 'badge-rose';
          badgeLabel = `${p.inactiveModelsCount}/${p.totalModelsCount} Inactive`;
        }

        html += `
          <div style="background:rgba(255,255,255,0.03); border-radius:6px; border:1px solid var(--border-color); overflow:hidden;">
            <div style="padding:6px 10px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; font-size:0.78rem;" onclick="ReportsView.toggleTreeNode('${treeId}')">
              <span style="font-weight:700; color:var(--text-main);">
                <i class="fa-solid fa-angle-right" id="icon-${treeId}" style="transition:transform 0.2s ease; margin-right:6px; color:var(--accent-cyan);"></i> ${p.displayName}
              </span>
              <div style="display:flex; align-items:center; gap:6px;">
                ${isBlacklistedGroup ? `
                  <button class="btn btn-emerald btn-xs" style="padding:1px 5px; font-size:0.65rem; font-weight:700;" onclick="event.stopPropagation(); ReportsView.wakeUpProvider('${p.id}')"><i class="fa-solid fa-sun"></i> Wake</button>
                ` : ''}
                <span class="badge ${badgeClass}" style="font-size:0.65rem;">${badgeLabel}</span>
              </div>
            </div>
            <div id="${treeId}" style="display:none; padding:6px 10px 8px 24px; border-top:1px dashed var(--border-color); flex-direction:column; gap:4px; font-size:0.72rem;">
              ${(isActiveGroup ? (p.activeModels || []) : (isBlacklistedGroup ? (p.activeModels || []).concat(p.inactiveModels || []) : (p.inactiveModels || []))).map(m => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:3px 6px; background:rgba(0,0,0,0.2); border-radius:4px;">
                  <span style="color:var(--text-main); cursor:pointer;" onclick="ReportsView.openModelDrawer('${m.id}')" title="Click for specs & options">
                    <i class="fa-solid fa-microchip" style="color:var(--accent-amber); margin-right:4px;"></i> ${typeof FormatHelper !== 'undefined' ? FormatHelper.getModelDisplayName(m) : (m.modelName || m.modelId)}
                  </span>
                  <button class="btn btn-secondary btn-xs" style="padding:1px 4px; font-size:0.65rem;" onclick="ReportsView.openModelDrawer('${m.id}')">Specs &gt;</button>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
    return html;
  }

  static async wakeUpProvider(providerId) {
    const res = await ApiService.unblacklistProvider(providerId);
    if (res.success) {
      ModalDialog.showNotification(`Provider '${providerId}' manually woken up!`, 'success');
      this.switchTab('modelstatus');
    }
  }

  static async wakeUpAllProviders() {
    const res = await ApiService.unblacklistAllProviders();
    if (res.success) {
      ModalDialog.showNotification('All providers have been successfully woken up!', 'success');
      this.switchTab('modelstatus');
    }
  }

  static toggleTreeNode(treeId) {
    const el = document.getElementById(treeId);
    const icon = document.getElementById(`icon-${treeId}`);
    if (el) {
      const isHidden = el.style.display === 'none';
      el.style.display = isHidden ? 'flex' : 'none';
      if (icon) {
        icon.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
      }
    }
  }


  static filterTree(val, group) {
    const term = val.toLowerCase();
    const container = document.getElementById('tree-container-' + group);
    if (!container) return;
    const items = container.querySelectorAll('.tree-node-item');
    // Wait, the tree nodes don't have a class yet. Let me just filter by inner text for now.
    Array.from(container.children).forEach(child => {
        if (child.tagName === 'DIV' && child.style.background) {
            if (child.innerText.toLowerCase().includes(term)) {
                child.style.display = 'block';
            } else {
                child.style.display = 'none';
            }
        }
    });
  }

  static async openProviderDrawer(providerId) {
    // Show a loading drawer
    const drawer = document.getElementById('code-drawer');
    const content = document.getElementById('code-drawer-content');
    if (!drawer || !content) return;
    
    drawer.classList.add('open');
    content.innerHTML = `<div style="padding: 20px; text-align: center;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;
    
    try {
        const res = await fetch('/api/providers/all');
        const data = await res.json();
        const p = data.data.find(x => x.id === providerId);
        
        if (!p) {
            content.innerHTML = `<div class="alert alert-danger">Provider not found</div>`;
            return;
        }

        const isAct = p.isActive;
        
        content.innerHTML = `
          <div style="padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 style="margin:0; color:var(--accent-cyan); display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-server"></i> ${p.displayName || p.id}
              </h3>
              <span class="badge ${isAct ? 'badge-emerald' : 'badge-rose'}">${isAct ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>
            
            <div class="glass-panel" style="padding:12px; margin-bottom:16px; font-size:0.8rem;">
              <div style="margin-bottom:8px;"><strong>Base URL:</strong> <code style="padding:2px 4px; background:rgba(0,0,0,0.3); border-radius:4px;">${p.baseUrl}</code></div>
              <div style="margin-bottom:8px;"><strong>Protocol:</strong> ${p.protocol || 'OpenAI'}</div>
              <div><strong>Models:</strong> ${p.models ? p.models.length : 0}</div>
            </div>

            <div style="display:flex; flex-direction:column; gap:8px;">
              <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="ReportsView.testProviderConnection('${p.id}')">
                <i class="fa-solid fa-plug-circle-bolt"></i> Test Connection
              </button>
              ${isAct 
                ? `<button class="btn btn-danger" style="width:100%; justify-content:center;" onclick="ReportsView.toggleProviderStatus('${p.id}', false)"><i class="fa-solid fa-power-off"></i> Force Deactivate</button>` 
                : `<button class="btn btn-emerald" style="width:100%; justify-content:center;" onclick="ReportsView.toggleProviderStatus('${p.id}', true)"><i class="fa-solid fa-play"></i> Force Activate</button>`
              }
            </div>
          </div>
        `;
    } catch(e) {
        content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  }

  static async testProviderConnection(providerId) {
    if (typeof ValidationNotifier !== 'undefined') {
        ValidationNotifier.show("Testing connection...", "info");
    }
    
    try {
        const res = await fetch(`/api/providers/${providerId}/ping`, { method: 'POST' });
        const data = await res.json();
        
        if (data.success && data.isActive) {
            if (typeof ValidationNotifier !== 'undefined') ValidationNotifier.show("Connection Successful! Provider is responsive.", "success");
            else alert("Connection Successful!");
        } else {
            if (typeof ValidationNotifier !== 'undefined') ValidationNotifier.show(`Connection Failed: ${data.error || 'Timeout'}`, "error");
            else alert("Connection Failed.");
        }
        
        // Refresh the drawer status
        setTimeout(() => this.openProviderDrawer(providerId), 1500);
        
    } catch(e) {
        if (typeof ValidationNotifier !== 'undefined') ValidationNotifier.show("Network error during test.", "error");
    }
  }

  static async toggleProviderStatus(providerId, forceActive) {
    try {
        await fetch(`/api/providers/${providerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: forceActive })
        });
        if (typeof ValidationNotifier !== 'undefined') {
            ValidationNotifier.show(`Provider ${forceActive ? 'Activated' : 'Deactivated'}`, "success");
        }
        this.openProviderDrawer(providerId);
        this.loadModelStatus(); // Refresh main tree
    } catch(e) {
        if (typeof ValidationNotifier !== 'undefined') ValidationNotifier.show("Update failed.", "error");
    }
  }

  static async openModelDrawer(modelId) {
    try {
      const res = await ApiService.getModels();
      const models = res.models || [];
      const model = models.find(m => m.id === modelId || m.modelId === modelId);
      if (!model) return;

      const drawer = document.getElementById('model-metadata-slide-drawer');
      if (!drawer) return;

      drawer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
          <h4 style="font-size:0.95rem; color:var(--accent-cyan); margin:0;"><i class="fa-solid fa-microchip"></i> Model Specs Metadata</h4>
          <button class="btn btn-link btn-xs" style="color:var(--text-muted);" onclick="ReportsView.closeModelDrawer()"><i class="fa-solid fa-xmark fa-lg"></i></button>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px; font-size:0.8rem;">
          <div style="background:rgba(0,0,0,0.3); padding:8px; border-radius:6px;">
            <span style="color:var(--text-muted); display:block; font-size:0.7rem;">Model ID / Name</span>
            <strong style="color:var(--text-main); font-size:0.92rem;">${typeof FormatHelper !== 'undefined' ? FormatHelper.getModelDisplayName(model) : (model.modelName || model.modelId)}</strong>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div style="background:rgba(0,0,0,0.3); padding:6px; border-radius:4px;">
              <span style="color:var(--text-muted); display:block; font-size:0.68rem;">Provider</span>
              <strong style="color:var(--accent-cyan);">${model.providerId || 'Groq'}</strong>
            </div>
            <div style="background:rgba(0,0,0,0.3); padding:6px; border-radius:4px;">
              <span style="color:var(--text-muted); display:block; font-size:0.68rem;">Status</span>
              <span class="badge ${model.isActive !== false ? 'badge-emerald' : 'badge-rose'}">${model.isActive !== false ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div style="background:rgba(0,0,0,0.3); padding:6px; border-radius:4px;">
              <span style="color:var(--text-muted); display:block; font-size:0.68rem;">Context Window</span>
              <strong style="color:var(--text-main);">${model.contextWindow ? (model.contextWindow / 1000) + 'k' : '128k'}</strong>
            </div>
            <div style="background:rgba(0,0,0,0.3); padding:6px; border-radius:4px;">
              <span style="color:var(--text-muted); display:block; font-size:0.68rem;">Core Skill</span>
              <strong style="color:var(--accent-amber);">${model.coreSkill || 'General'}</strong>
            </div>
          </div>

          <div style="background:rgba(0,0,0,0.3); padding:8px; border-radius:6px;">
            <span style="color:var(--text-muted); display:block; font-size:0.7rem;">Average Latency</span>
            <strong style="color:var(--accent-emerald);">${model.latencyMs || 120} ms</strong>
          </div>

          <div style="border-top:1px solid var(--border-color); padding-top:10px; display:flex; flex-direction:column; gap:8px;">
            <label style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">Quick Actions & Options:</label>
            <button class="btn btn-primary btn-sm" onclick="app.navigate('playground'); localStorage.setItem('fmc_selected_model', '${model.id}');"><i class="fa-solid fa-comments"></i> Use Model for Chat</button>
            <button class="btn btn-secondary btn-sm" onclick="ReportsView.activateModelInCatalog('${model.id}')"><i class="fa-solid fa-wrench"></i> Fix / Toggle Model Status</button>
            <button class="btn btn-secondary btn-sm" onclick="app.navigate('model-club')"><i class="fa-solid fa-cubes-stacked"></i> Add to Model Combo</button>
          </div>
        </div>
      `;
      drawer.style.right = '0px';
    } catch (e) {
      ModalDialog.showNotification('Error opening metadata drawer: ' + e.message, 'error');
    }
  }

  static closeModelDrawer() {
    const drawer = document.getElementById('model-metadata-slide-drawer');
    if (drawer) drawer.style.right = '-420px';
  }

  static async updateMonitoringInterval(hours) {
    try {
      const res = await ApiService.request('/api/reports/monitoringconfig', 'POST', { frequencyHours: hours });
      if (res.success) {
        if (typeof ModalDialog !== 'undefined') ModalDialog.showNotification(`Background monitoring interval updated to ${hours} hour(s)!`, 'success');
        this.switchTab('modelstatus');
      }
    } catch (e) {
      if (typeof ModalDialog !== 'undefined') ModalDialog.showNotification('Failed to set interval: ' + e.message, 'error');
    }
  }

  static async activateModelInCatalog(modelId) {
    ModalDialog.showNotification(`Toggling active status for model ${modelId}...`, 'info');
    this.closeModelDrawer();
    setTimeout(() => this.switchTab('modelstatus'), 400);
  }

  static async renderBiAnalyticsTab(container) {
    try {
      const res = await ApiService.getBiAnalytics();
      if (!res || !res.success || !res.report) {
        container.innerHTML = `<div class="alert alert-danger">Failed to compute BI Analytics Report.</div>`;
        return;
      }
      if (typeof ReportsViewHelper !== 'undefined' && ReportsViewHelper.renderBiAnalyticsSuite) {
        ReportsViewHelper.renderBiAnalyticsSuite(container, res.report, this.activeBiReport);
      } else {
        container.innerHTML = `<div class="alert alert-warning">ReportsViewHelper not loaded.</div>`;
      }
    } catch (e) {
      container.innerHTML = `<div class="alert alert-danger">Error fetching BI Analytics: ${e.message}</div>`;
    }
  }

  static switchBiReport(reportKey) {
    this.activeBiReport = reportKey;
    const container = document.getElementById('report-log-container');
    if (container && this.currentTab === 'bianalytics') {
      this.renderBiAnalyticsTab(container);
    }
  }
}

window.ReportsView = ReportsView;

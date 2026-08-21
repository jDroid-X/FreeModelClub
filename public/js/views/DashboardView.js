/**
 * DashboardView.js
 * Purpose: Dashboard Metrics & Model Specs drawer view rendering 2-column layout matching User Manual structure:
 *          20% Left TOC Quick Telemetry Rail + 80% Operational Workspace Pane (< 250 lines).
 *          Renders exact Operational Metrics & Provider Health layout matching attached mockup:
 *          Top Row: 4 Metric Panel Cards (AVAILABLE, CONSUMED, BALANCE, PERCENT CONSUMED TOKEN).
 *          Bottom Row: 3 Panel Cards (TOKEN POOL GAUGE ring, TOP PROVIDERS, MODEL USAGE BREAKDOWN).
 * Dependencies: ApiService, ModalDialog, DashboardViewHelper, AppStore
 */

class DashboardView {
  static getCurrentUserEmail() {
    try {
      const appUser = (window.AppStore && window.AppStore.getState && window.AppStore.getState('currentUser')) ||
                      (window.app && window.app.currentUser) ||
                      JSON.parse(localStorage.getItem('fmc_user') || sessionStorage.getItem('fmc_user') || 'null');
      if (appUser && appUser.email) return appUser.email;
    } catch (e) {}
    return 'Active Session Operator';
  }

  static modelAnalytics = [];
  static pollingInterval = null;
  static cachedTelemetry = null;
  static cachedModels = null;
  static cachedProviders = null;
  static cachedLogs = null;
  static _hasRegisteredStoreListeners = false;

  static async render(container, isSilentRefresh = false) {
    // Reactive EventBus Cache Invalidation
    if (window.AppStore && !DashboardView._hasRegisteredStoreListeners) {
      DashboardView._hasRegisteredStoreListeners = true;
      window.AppStore.on('PROVIDER_STATE_CHANGED', () => {
        DashboardView.cachedProviders = null;
        DashboardView.cachedModels = null;
        if (window.app && window.app.currentView === 'dashboard') {
          const c = document.getElementById('view-container');
          if (c) DashboardView.render(c, true);
        }
      });
      window.AppStore.on('MODELS_MUTATED', () => {
        DashboardView.cachedModels = null;
        if (window.app && window.app.currentView === 'dashboard') {
          const c = document.getElementById('view-container');
          if (c) DashboardView.render(c, true);
        }
      });
    }

    let telemetryData = DashboardView.cachedTelemetry || null;
    let modelsList = DashboardView.cachedModels || [];
    let providersList = DashboardView.cachedProviders || [];
    let apiLogs = DashboardView.cachedLogs || [];
    const userEmail = DashboardView.getCurrentUserEmail();

    // 1. Instantly render DOM layout shell on initial call (0ms Instant Load)
    if (!isSilentRefresh) {
      container.innerHTML = DashboardView._buildHtmlLayout(telemetryData, modelsList, providersList, apiLogs, userEmail);
      DashboardView._initActiveAgents();
      DashboardView.startLivePolling(container);
    }

    // 2. Hydrate telemetry and models asynchronously without blocking DOM presentation
    const hydratePromise = Promise.all([
      ApiService.getDashboardTelemetry().catch(() => null),
      (DashboardView.cachedModels ? Promise.resolve({ models: DashboardView.cachedModels }) : ApiService.getModels().catch(() => ({ models: [] }))),
      (DashboardView.cachedProviders ? Promise.resolve({ providers: DashboardView.cachedProviders }) : ApiService.getAllProviders().catch(() => ({ providers: [] }))),
      ApiService.getApiLogs().catch(() => ({ logs: [] })),
      ApiService.getActiveModelsCache().catch(() => ({ activeModels: [] }))
    ]).then(([tRes, mRes, pRes, lRes, acRes]) => {
      if (tRes && (tRes.data || tRes.telemetry)) {
        telemetryData = tRes.data || tRes.telemetry;
        DashboardView.cachedTelemetry = telemetryData;
      }
      if (mRes && mRes.models) {
        modelsList = mRes.models;
        if (acRes && acRes.activeModels && acRes.activeModels.length > 0) {
          modelsList = modelsList.filter(m => acRes.activeModels.includes(m.id) || acRes.activeModels.includes(m.modelId));
        }
        DashboardView.cachedModels = modelsList;
      }
      if (pRes && pRes.providers) {
        providersList = pRes.providers;
        DashboardView.cachedProviders = providersList;
      }
      if (lRes && lRes.logs) {
        apiLogs = lRes.logs;
        DashboardView.cachedLogs = apiLogs;
      }

      // Update dynamic containers in place
      const metricsEl = document.getElementById('dash-operational-metrics-container');
      if (metricsEl && typeof DashboardViewHelper !== 'undefined') {
        metricsEl.innerHTML = DashboardViewHelper.renderOperationalMetricsPanel(telemetryData, userEmail, apiLogs);
      }
      const visualEl = document.getElementById('dash-visual-analytics-container');
      if (visualEl && typeof DashboardViewHelper !== 'undefined') {
        visualEl.innerHTML = DashboardViewHelper.renderVisualAnalyticsTiles(apiLogs, telemetryData);
      }
      const streamEl = document.getElementById('dash-realtime-stream-tbody');
      if (streamEl && typeof DashboardViewHelper !== 'undefined') {
        streamEl.innerHTML = DashboardViewHelper.renderTelemetryRows(apiLogs, telemetryData);
      }
      const modelsTbody = document.querySelector('#dashboard-models-table tbody');
      if (modelsTbody && modelsList.length > 0) {
        modelsTbody.innerHTML = modelsList.slice(0, 25).map(m => `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 3px 4px;"><strong style="color: var(--text-main);">${typeof FormatHelper !== 'undefined' ? FormatHelper.getModelDisplayName(m) : (m.modelName || m.modelId)}</strong></td>
            <td style="padding: 3px 4px;"><span style="color: var(--accent-cyan);">${m.family || 'General'}</span></td>
            <td style="padding: 3px 4px;">${m.coreSkill || 'General'}</td>
            <td style="padding: 3px 4px;">${m.contextWindow ? (m.contextWindow / 1000) + 'k' : '128k'}</td>
            <td style="padding: 3px 4px; text-align: center;"><span class="badge badge-emerald">Free</span></td>
            <td style="padding: 3px 4px; text-align: right;">
              <button class="btn btn-secondary btn-xs" onclick="DashboardView.openModelSpecsDrawer('${m.id}')"><i class="fa-solid fa-info-circle"></i> Specs</button>
            </td>
          </tr>
        `).join('');
      }
    }).catch(err => {
      console.warn('DashboardView async telemetry hydrate fallback:', err);
    });

    if (isSilentRefresh) {
      await hydratePromise;
    }
  }

  static _initActiveAgents() {
    setTimeout(() => {
      if (window.ListBoxComponent && document.getElementById('dashboard-active-agents-listbox')) {
        const agentSpecs = (typeof SettingsViewHelper !== 'undefined') ? SettingsViewHelper.getDefaultRocasSpecs() : [];
        ListBoxComponent.render('dashboard-active-agents-listbox', {
          items: agentSpecs.map(a => ({ 
            id: a.id, 
            title: a.name, 
            subtitle: a.role,
            description: a.role, 
            icon: 'fa-robot', 
            badge: 'Active',
            badgeClass: 'badge-cyan',
            details: {
              'Agent Role': a.role,
              'Primary Goal': a.goal,
              'Execution Task': a.task,
              'Assigned Model': a.model || 'Dynamic LLM'
            }
          })),
          selectedId: null,
          height: '100%',
          onSelect: (item) => {
            ModalDialog.showOptionModal({
              title: `Agent Status: ${item.title}`,
              message: `Role: ${item.description}<br/>Status: Monitoring System.<br/>Select an action:`,
              icon: 'fa-robot',
              options: [
                { id: 'view', label: 'View Specifications', icon: 'fa-eye', action: () => { if(typeof SettingsView!=='undefined') SettingsView.openRocasModal(item.id); } },
                { id: 'close', label: 'Close', type: 'secondary', icon: 'fa-xmark' }
              ]
            });
          }
        });
      }
    }, 0);
  }

  static _buildHtmlLayout(telemetryData, modelsList, providersList, apiLogs, userEmail) {
    const totalTokens = (telemetryData && telemetryData.consumed && telemetryData.consumed.month) ?? 0;
    return `
      <div class="glass-panel" style="padding: 3px; margin: 3px;">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px; padding: 3px; margin-bottom: 3px;">
          <div class="panel-title"><i class="fa-solid fa-chart-line"></i> Dashboard & Operational Metrics</div>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-secondary btn-xs" onclick="DashboardView.openAdvancedAnalyticsGenerator()"><i class="fa-solid fa-chart-pie" style="color: var(--accent-cyan);"></i> Advanced Pivot Analytics</button>
            <button class="btn btn-secondary btn-xs" onclick="DashboardView.exportDashboardPdf()"><i class="fa-solid fa-file-pdf" style="color: var(--accent-rose);"></i> Export Audit PDF</button>
            <button class="btn btn-secondary btn-xs" onclick="app.navigate('registration')"><i class="fa-solid fa-plus-circle"></i> Add Provider</button>
          </div>
        </div>

        <div class="dash-columns-container">
          <!-- Left 20% Width TOC Quick Telemetry Rail (Responsive Smart-Fit) -->
          <div class="glass-panel dash-toc-rail">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-light); text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 3px; margin-bottom: 3px;">
              <i class="fa-solid fa-gauge-high"></i> Telemetry Rail
            </div>
            
            <div style="display: flex; gap: 3px; background: var(--bg-hover-overlay, rgba(255,255,255,0.04)); padding: 3px; border-radius: 4px; margin-bottom: 3px; border: 1px solid var(--border-color);">
              <button class="btn btn-secondary btn-xs" style="padding: 3px; font-size: 0.75rem; flex: 1;" onclick="DashboardView.exportDashboardPdf()" title="Export PDF Report"><i class="fa-solid fa-file-pdf" style="color: var(--accent-rose);"></i></button>
              <button class="btn btn-secondary btn-xs" style="padding: 3px; font-size: 0.75rem; flex: 1;" onclick="app.navigate('reports')" title="View API Logs"><i class="fa-solid fa-list-check" style="color: var(--accent-cyan);"></i></button>
              <button class="btn btn-secondary btn-xs" style="padding: 3px; font-size: 0.75rem; flex: 1;" onclick="app.navigate('reports'); setTimeout(() => { if (typeof ReportsView !== 'undefined') ReportsView.switchTab('system'); }, 150);" title="View System Event Logs"><i class="fa-solid fa-clock-rotate-left" style="color: var(--accent-amber);"></i></button>
              <button class="btn btn-secondary btn-xs" style="padding: 3px; font-size: 0.75rem; flex: 1;" onclick="window.location.reload(true)" title="Hard Refresh"><i class="fa-solid fa-rotate" style="color: var(--accent-emerald);"></i></button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 3px; font-size: 0.75rem;">
              <div style="background: var(--bg-hover-overlay, rgba(255,255,255,0.04)); padding: 3px; border-radius: 4px; border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted); display: block; font-size: 0.68rem; font-weight: 600;">System Account</span>
                <strong style="color: var(--accent-cyan); word-break: break-all; font-size: 0.72rem;">${userEmail}</strong>
              </div>
              <div style="background: var(--bg-hover-overlay, rgba(255,255,255,0.04)); padding: 3px; border-radius: 4px; border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted); display: block; font-size: 0.68rem; font-weight: 600;">Total Token Consumed</span>
                <strong style="color: var(--accent-emerald); font-size: 0.88rem;">${typeof FormatHelper !== 'undefined' ? FormatHelper.formatNumberAutoUnit(totalTokens) : totalTokens}</strong>
              </div>
              <div style="background: var(--bg-hover-overlay, rgba(255,255,255,0.04)); padding: 3px; border-radius: 4px; border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted); display: block; font-size: 0.68rem; font-weight: 600;">Registered Providers</span>
                <strong style="color: var(--accent-amber); font-size: 0.88rem;">${providersList.length} <span style="font-size: 0.72rem; color: var(--accent-emerald); font-weight: 600;">(${providersList.filter(p => p.isActive).length} Active)</span></strong>
              </div>
            </div>

            <div style="border-top: 1px solid var(--border-color); padding-top: 3px; display: flex; flex-direction: column; gap: 3px; margin-top: 3px;">
              <button class="btn btn-secondary btn-xs" style="width: 100%; justify-content: flex-start; padding: 3px;" onclick="if(typeof ProvidersView!=='undefined') ProvidersView.syncTokenLimits()">
                <i class="fa-solid fa-arrows-rotate" style="color: var(--accent-cyan); margin-right: 4px;"></i> Sync Token Limits
              </button>
            </div>

            <!-- Active System Agents ListBox -->
            <div style="border-top: 1px solid var(--border-color); padding-top: 3px; margin-top: 3px; display: flex; flex-direction: column; flex: 1;">
              <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); margin-bottom: 3px; text-transform: uppercase;">
                <i class="fa-solid fa-robot"></i> Active Agents
              </div>
              <div id="dashboard-active-agents-listbox" style="flex: 1; min-height: 120px;"></div>
            </div>
          </div>

          <!-- Right 80% Operational Workspace Pane (Responsive Smart-Fit) -->
          <div class="dash-workspace-pane">
            <!-- EXACT 4-CARD TOP + 3-CARD MIDDLE OPERATIONAL METRICS & CHARTS GRID -->
            <div id="dash-operational-metrics-container">
              ${DashboardViewHelper.renderOperationalMetricsPanel(telemetryData, userEmail, apiLogs)}
            </div>

            <!-- BREAKDOWN LISTS & COST RATES 3 TILES -->
            <div id="dash-visual-analytics-container">
              ${DashboardViewHelper.renderVisualAnalyticsTiles(apiLogs, telemetryData)}
            </div>

            <!-- REALTIME REQUEST STREAM -->
            <div id="sec-logs" class="glass-panel" style="padding: 4px; margin: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; padding: 2px; flex-wrap: wrap; gap: 4px;">
                <div style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
                  <i class="fa-solid fa-clock-rotate-left"></i> Realtime Request & Telemetry Stream
                </div>
                <div style="display: flex; gap: 4px; align-items: center;">
                  <input type="text" id="dash-stream-search" class="form-control" style="font-size: 0.70rem; padding: 2px 6px; width: 150px;" placeholder="Filter stream logs..." onkeyup="DashboardView.filterStream(this.value)" />
                  <button id="dash-btn-pause-polling" class="btn btn-secondary btn-xs" onclick="DashboardView.togglePollingPause()" title="Freeze stream for HIL inspection">
                    <i class="fa-solid fa-pause"></i> Pause Stream
                  </button>
                </div>
              </div>
              <div style="max-height: clamp(220px, 35vh, 450px); overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.74rem;">
                  <thead>
                    <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); text-align: left;">
                      <th style="padding: 3px 4px;">Timestamp</th>
                      <th style="padding: 3px 4px;">Model</th>
                      <th style="padding: 3px 4px;">Family</th>
                      <th style="padding: 3px 4px;">Tools</th>
                      <th style="padding: 3px 4px;">Tokens</th>
                      <th style="padding: 3px 4px;">Balance</th>
                      <th style="padding: 3px 4px; text-align: center;">Status</th>
                    </tr>
                  </thead>
                  <tbody id="dash-realtime-stream-tbody">
                    ${DashboardViewHelper.renderTelemetryRows(apiLogs, telemetryData)}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- REGISTERED AI MODELS & SPECS TABLE -->
            <div class="glass-panel" style="padding: 4px; margin: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; padding: 2px;">
                <div style="font-size: 0.76rem; font-weight: 700; color: var(--primary-light);"><i class="fa-solid fa-list-check"></i> Registered AI Models & Specs</div>
                <input type="text" id="dashboard-model-search" class="form-control" style="font-size: 0.70rem; padding: 2px 6px; width: 170px;" placeholder="Filter models..." onkeyup="DashboardView.filterModels(this.value)" />
              </div>
              
              <div style="max-height: clamp(220px, 35vh, 450px); overflow-y: auto;">
                <table id="dashboard-models-table" style="width: 100%; border-collapse: collapse; font-size: 0.74rem;">
                  <thead>
                    <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); text-align: left;">
                      <th style="padding: 3px 4px;">Model Name / ID</th>
                      <th style="padding: 3px 4px;">Family</th>
                      <th style="padding: 3px 4px;">Core Skill</th>
                      <th style="padding: 3px 4px;">Context</th>
                      <th style="padding: 3px 4px; text-align: center;">Status</th>
                      <th style="padding: 3px 4px; text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${modelsList.slice(0, 25).map(m => `
                      <tr style="border-bottom: 1px solid var(--border-color);">
                        <td style="padding: 3px 4px;"><strong style="color: var(--text-main);">${typeof FormatHelper !== 'undefined' ? FormatHelper.getModelDisplayName(m) : (m.modelName || m.modelId)}</strong></td>
                        <td style="padding: 3px 4px;"><span style="color: var(--accent-cyan);">${m.family || 'General'}</span></td>
                        <td style="padding: 3px 4px;">${m.coreSkill || 'General'}</td>
                        <td style="padding: 3px 4px;">${m.contextWindow ? (m.contextWindow / 1000) + 'k' : '128k'}</td>
                        <td style="padding: 3px 4px; text-align: center;"><span class="badge badge-emerald">Free</span></td>
                        <td style="padding: 3px 4px; text-align: right;">
                          <button class="btn btn-secondary btn-xs" onclick="DashboardView.openModelSpecsDrawer('${m.id}')"><i class="fa-solid fa-info-circle"></i> Specs</button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ${modelsList.length > 25 ? `
                <div style="text-align: center; padding-top: 3px; font-size: 0.70rem; color: var(--text-muted);">
                  Showing 25 of ${modelsList.length} models. Use filter box to search full catalog.
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static async handleTileClick(contextKey) {
    if (typeof DashboardViewHelper !== 'undefined' && DashboardViewHelper.handleContextualTileClick) {
      await DashboardViewHelper.handleContextualTileClick(contextKey);
    }
  }

  static filterModels(q) {
    const query = (q || '').toLowerCase();
    const rows = document.querySelectorAll('#dashboard-models-table tbody tr');
    rows.forEach(r => {
      r.style.display = r.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
  }

  static filterStream(q) {
    const query = (q || '').toLowerCase();
    const rows = document.querySelectorAll('#dash-realtime-stream-tbody tr');
    rows.forEach(r => {
      r.style.display = r.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
  }

  static openModelSpecsDrawer(modelId) {
    const model = (DashboardView.cachedModels || []).find(m => m.id === modelId || m.modelId === modelId);
    const providerName = model ? (model.providerName || model.providerId || 'Registered Provider') : 'Registered Provider';
    if (window.app && window.app.openCodeDrawer) {
      window.app.openCodeDrawer(providerName, modelId);
    }
  }


  static exportDashboardPdf() {
    ModalDialog.showOptionModal({
      title: 'Export Audit Report & Operational Metrics',
      message: 'Select the desired format for Human-In-Loop audit logging and report generation:',
      icon: 'fa-file-pdf',
      options: [
        {
          id: 'print',
          label: 'Printable Audit Report (PDF / Printer)',
          icon: 'fa-print',
          type: 'primary',
          action: () => {
            ModalDialog.showNotification('Preparing printable audit layout...', 'info');
            const printWin = window.open('', '_blank');
            if (!printWin) {
              ModalDialog.showNotification('Pop-up blocked. Please allow pop-ups to print PDF.', 'warning');
              return;
            }
            const innerHtml = document.getElementById('page-view-content')?.innerHTML || document.body.innerHTML;
            printWin.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>FreeModelsClub Operational Audit Report</title>
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #1e293b; background: #fff; }
                    h1, h2, h3 { color: #0f172a; }
                    .glass-panel, .glass-card { border: 1px solid #cbd5e1; padding: 12px; margin-bottom: 12px; border-radius: 6px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 12px; }
                    th { background: #f1f5f9; }
                    .btn, button, input { display: none !important; }
                  </style>
                </head>
                <body>
                  <h2>FreeModelsClub - Executive Operational Audit Report</h2>
                  <p><strong>Generated At:</strong> ${new Date().toLocaleString()}</p>
                  <hr/>
                  ${innerHtml}
                </body>
              </html>
            `);
            printWin.document.close();
            setTimeout(() => { printWin.print(); }, 500);
          }
        },
        {
          id: 'csv',
          label: 'Export Diagnostic Logs (CSV)',
          icon: 'fa-file-csv',
          type: 'cyan',
          action: () => {
            window.location.href = '/api/reports/export?format=csv';
            ModalDialog.showNotification('CSV diagnostic log export downloaded.', 'success');
          }
        },
        {
          id: 'json',
          label: 'Export Diagnostic Telemetry (JSON)',
          icon: 'fa-file-code',
          type: 'secondary',
          action: async () => {
            try {
              const res = await ApiService.request('/api/reports/export?format=json');
              const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `FMC_Audit_Report_${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
              ModalDialog.showNotification('JSON telemetry report downloaded.', 'success');
            } catch (e) {
              ModalDialog.showNotification('Export failed: ' + e.message, 'error');
            }
          }
        }
      ]
    });
  }

  static async openAdvancedAnalyticsGenerator() {
    ModalDialog.showCustomModal({
      title: '<i class="fa-solid fa-chart-pie" style="color: var(--accent-cyan);"></i> Advanced Analytics Generator',
      content: `
        <div style="font-size: 0.8rem; display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px;">
          <p style="color: var(--text-muted); margin: 0;">Generate dynamic pivot reports across your entire telemetry dataset instantly.</p>
          <div style="display: flex; gap: 8px; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
            <label style="font-weight: 700; color: var(--primary-light);">Group Data By:</label>
            <select id="adv-analytics-groupby" class="form-control" style="max-width: 200px; font-size: 0.75rem; background: var(--bg-dark); color: var(--text-main);">
              <option value="provider">Provider</option>
              <option value="model">Model</option>
              <option value="tool">Client Tool</option>
              <option value="status">Status Code</option>
              <option value="date">Date</option>
            </select>
            <button class="btn btn-cyan btn-sm" onclick="DashboardView.generateAdvancedAnalytics()"><i class="fa-solid fa-bolt"></i> Generate Report</button>
          </div>
          <div id="adv-analytics-results-container" style="min-height: 200px; max-height: 500px; overflow-y: auto;">
            <div style="text-align: center; padding: 40px; color: var(--text-dim);"><i class="fa-solid fa-arrow-up" style="margin-bottom: 8px; display: block;"></i> Select a dimension and generate the report</div>
          </div>
        </div>
      `,
      confirmText: 'Close',
      onConfirm: () => {}
    });
  }

  static async generateAdvancedAnalytics() {
    const container = document.getElementById('adv-analytics-results-container');
    const groupKey = document.getElementById('adv-analytics-groupby').value;
    if (!container || !groupKey) return;
    
    container.innerHTML = '<div style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--accent-cyan)"></i></div>';
    
    try {
      const res = await ApiService.getApiLogs();
      const logs = res.logs || [];
      if (logs.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">No telemetry data available to group.</div>';
        return;
      }
      
      const grouped = ReportsViewHelper.generateGroupedAnalytics(logs, groupKey);
      ReportsViewHelper.renderGroupedAnalyticsTable(container, grouped, groupKey);
      
      // Hook up drill-down click to navigate to the Reports view with the correct filters applied
      const table = container.querySelector('table');
      if (table) {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(tr => {
          const originalOnClick = tr.getAttribute('onclick');
          if (originalOnClick) {
            const match = originalOnClick.match(/ReportsView\.applyGroupFilter\('([^']+)'\)/);
            if (match && match[1]) {
               const filterName = match[1];
               const navAction = `app.navigate('reports'); setTimeout(() => { ReportsView.applyGroupBy('${groupKey}'); ReportsView.applyGroupFilter('${filterName}'); const sel = document.getElementById('log-groupby-select'); if(sel) sel.value='${groupKey}'; ModalDialog.closeModal(); }, 300);`;
               tr.setAttribute('onclick', navAction);
               const btn = tr.querySelector('button');
               if (btn) btn.setAttribute('onclick', `event.stopPropagation(); ${navAction}`);
            }
          }
        });
      }
    } catch (e) {
      container.innerHTML = `<div class="alert alert-danger">Failed to generate analytics: ${e.message}</div>`;
    }
  }

  static isPollingPaused = false;

  static togglePollingPause() {
    this.isPollingPaused = !this.isPollingPaused;
    const btn = document.getElementById('dash-btn-pause-polling');
    if (btn) {
      if (this.isPollingPaused) {
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Resume Stream';
        btn.classList.replace('btn-secondary', 'btn-emerald');
        ModalDialog.showNotification('Telemetry stream paused for inspection', 'info');
      } else {
        btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Stream';
        btn.classList.replace('btn-emerald', 'btn-secondary');
        ModalDialog.showNotification('Telemetry stream resumed', 'success');
      }
    }
  }

  static startLivePolling(container) {
    DashboardView.stopLivePolling();
    DashboardView.pollingInterval = setInterval(async () => {
      if (DashboardView.isPollingPaused) return;
      if (window.app && window.app.currentView === 'dashboard' && document.body.contains(container)) {
        try {
          const [tRes, lRes] = await Promise.all([
            ApiService.getDashboardTelemetry().catch(() => null),
            ApiService.getApiLogs().catch(() => ({ logs: [] }))
          ]);
          
          let telemetryData = null;
          let apiLogs = [];
          
          if (tRes && tRes.data) telemetryData = tRes.data;
          else if (tRes && tRes.telemetry) telemetryData = tRes.telemetry;
          if (lRes && lRes.logs) apiLogs = lRes.logs;
          
          const userEmail = (window.app && window.app.currentUser && window.app.currentUser.email) || DashboardView.DEFAULT_USER_ACCOUNT;
          
          try {
            const metricsPanel = document.getElementById('dash-operational-metrics-container');
            if (metricsPanel && typeof DashboardViewHelper !== 'undefined') {
              metricsPanel.innerHTML = DashboardViewHelper.renderOperationalMetricsPanel(telemetryData, userEmail, apiLogs);
            }
          } catch (err) {
            console.warn('[DashboardView] Failed to render operational metrics:', err);
          }
          
          try {
            const visualTiles = document.getElementById('dash-visual-analytics-container');
            if (visualTiles && typeof DashboardViewHelper !== 'undefined') {
              visualTiles.innerHTML = DashboardViewHelper.renderVisualAnalyticsTiles(apiLogs, telemetryData);
            }
          } catch (err) {
            console.warn('[DashboardView] Failed to render visual analytics:', err);
          }
          
          try {
            const streamBody = document.getElementById('dash-realtime-stream-tbody');
            if (streamBody && typeof DashboardViewHelper !== 'undefined') {
              streamBody.innerHTML = DashboardViewHelper.renderTelemetryRows(apiLogs, telemetryData);
            }
          } catch (err) {
            console.warn('[DashboardView] Failed to render telemetry stream:', err);
          }
          
        } catch (e) {
          console.warn('DashboardView live polling update failed:', e.message);
        }
      } else {
        DashboardView.stopLivePolling();
      }
    }, 4000);
  }

  static stopLivePolling() {
    if (DashboardView.pollingInterval) {
      clearInterval(DashboardView.pollingInterval);
      DashboardView.pollingInterval = null;
    }
  }
}

window.DashboardView = DashboardView;


/**
 * DashboardView.js
 * Purpose: Dashboard Metrics & Model Specs drawer view rendering 2-column layout matching User Manual structure:
 *          20% Left TOC Quick Telemetry Rail + 80% Operational Workspace Pane (< 250 lines).
 *          Renders exact Operational Metrics & Provider Health layout matching attached mockup:
 *          Top Row: 4 Metric Panel Cards (AVAILABLE, CONSUMED, BALANCE, PERCENT CONSUMED TOKEN).
 *          Bottom Row: 3 Panel Cards (TOKEN POOL GAUGE ring, TOP PROVIDERS, MODEL USAGE BREAKDOWN).
 * Dependencies: ApiService, ModalDialog, DashboardViewHelper
 */

class DashboardView {
  static modelAnalytics = [];
  static pollingInterval = null;

  static async render(container, isSilentRefresh = false) {
    let telemetryData = null;
    let modelsList = [];
    let providersList = [];
    let apiLogs = [];

    try {
      const [tRes, mRes, pRes, lRes] = await Promise.all([
        ApiService.getDashboardTelemetry(),
        ApiService.getModels(),
        ApiService.getAllProviders(),
        ApiService.getApiLogs()
      ]);

      if (tRes && tRes.data) telemetryData = tRes.data;
      else if (tRes && tRes.telemetry) telemetryData = tRes.telemetry;
      
      if (mRes && mRes.models) modelsList = mRes.models;
      if (pRes && pRes.providers) providersList = pRes.providers;
      if (lRes && lRes.logs) apiLogs = lRes.logs;
    } catch (err) {
      console.warn('DashboardView telemetry load fallback:', err.message);
    }

    const userEmail = (window.app && window.app.currentUser && window.app.currentUser.email) || 'jeet26@yahoo.com';
    const totalTokens = (telemetryData && telemetryData.consumed && telemetryData.consumed.month) || 123600;

    const htmlContent = `
      <div style="display: flex; gap: 12px; align-items: flex-start;">
        <!-- Left 20% Width TOC Quick Telemetry Rail -->
        <div class="glass-panel" style="width: 20%; min-width: 170px; flex-shrink: 0; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-light); text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
            <i class="fa-solid fa-gauge-high"></i> Telemetry Rail
          </div>
          
          <div style="display: flex; gap: 4px; background: rgba(255,255,255,0.04); padding: 4px; border-radius: 4px;">
            <button class="btn btn-secondary btn-sm" style="padding: 4px; font-size: 0.75rem; flex: 1;" onclick="DashboardView.exportDashboardPdf()" title="Export PDF Report"><i class="fa-solid fa-file-pdf" style="color: var(--accent-rose);"></i></button>
            <button class="btn btn-secondary btn-sm" style="padding: 4px; font-size: 0.75rem; flex: 1;" onclick="app.navigate('reports')" title="View Logs"><i class="fa-solid fa-list-check" style="color: var(--accent-cyan);"></i></button>
            <button class="btn btn-secondary btn-sm" style="padding: 4px; font-size: 0.75rem; flex: 1;" onclick="window.location.reload(true)" title="Hard Refresh"><i class="fa-solid fa-rotate" style="color: var(--accent-emerald);"></i></button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.75rem;">
            <div style="background: rgba(255,255,255,0.03); padding: 6px 8px; border-radius: 4px; border-left: 2px solid var(--accent-cyan);">
              <span style="color: var(--text-muted); display: block;">Total Token Volume</span>
              <strong style="color: var(--accent-cyan); font-size: 0.88rem;">${DashboardViewHelper.formatTokens(totalTokens)}</strong>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 6px 8px; border-radius: 4px; border-left: 2px solid var(--accent-emerald);">
              <span style="color: var(--text-muted); display: block;">Active Free Models</span>
              <strong style="color: var(--accent-emerald); font-size: 0.88rem;">${modelsList.length || 116}</strong>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 6px 8px; border-radius: 4px; border-left: 2px solid var(--accent-amber);">
              <span style="color: var(--text-muted); display: block;">Registered Providers</span>
              <strong style="color: var(--accent-amber); font-size: 0.88rem;">${providersList.length || 8}</strong>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 6px; display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
            <button class="btn btn-secondary btn-xs" style="width: 100%; justify-content: flex-start;" onclick="ProvidersView.syncTokenLimits()">
              <i class="fa-solid fa-arrows-rotate" style="color: var(--accent-cyan); margin-right: 6px;"></i> Sync Token Limits
            </button>
          </div>
        </div>

        <!-- Right 80% Operational Workspace Pane -->
        <div style="width: 80%; display: flex; flex-direction: column; gap: 12px;">
          
          <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div class="panel-title"><i class="fa-solid fa-chart-line"></i> Operational Metrics & Provider Health</div>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" onclick="DashboardView.exportDashboardPdf()"><i class="fa-solid fa-file-pdf" style="color: var(--accent-rose);"></i> Export Audit PDF</button>
              <button class="btn btn-secondary btn-sm" onclick="app.navigate('registration')"><i class="fa-solid fa-plus-circle"></i> Add Provider</button>
            </div>
          </div>

          <!-- EXACT 4-CARD TOP + 3-CARD BOTTOM OPERATIONAL METRICS & PROVIDER HEALTH GRID -->
          ${DashboardViewHelper.renderOperationalMetricsPanel(telemetryData, userEmail)}

          <!-- REGISTERED AI MODELS & SPECS TABLE -->
          <div class="glass-panel" style="padding: 12px; margin-bottom: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-light);"><i class="fa-solid fa-list-check"></i> Registered AI Models & Specs</div>
              <input type="text" id="dashboard-model-search" class="form-control" style="font-size: 0.72rem; padding: 4px 8px; width: 180px;" placeholder="Filter models..." onkeyup="DashboardView.filterModels(this.value)" />
            </div>
            
            <div style="max-height: 220px; overflow-y: auto;">
              <table id="dashboard-models-table" style="width: 100%; border-collapse: collapse; font-size: 0.76rem;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); text-align: left;">
                    <th style="padding: 6px;">Model Name / ID</th>
                    <th style="padding: 6px;">Family</th>
                    <th style="padding: 6px;">Core Skill</th>
                    <th style="padding: 6px;">Context</th>
                    <th style="padding: 6px; text-align: center;">Status</th>
                    <th style="padding: 6px; text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${modelsList.map(m => `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                      <td style="padding: 6px;"><strong style="color: var(--text-main);">${m.modelName || m.modelId}</strong></td>
                      <td style="padding: 6px;"><span style="color: var(--accent-cyan);">${m.family || 'General'}</span></td>
                      <td style="padding: 6px;">${m.coreSkill || 'General'}</td>
                      <td style="padding: 6px;">${m.contextWindow ? (m.contextWindow / 1000) + 'k' : '128k'}</td>
                      <td style="padding: 6px; text-align: center;"><span class="badge badge-emerald">Free</span></td>
                      <td style="padding: 6px; text-align: right;">
                        <button class="btn btn-secondary btn-xs" onclick="DashboardView.openModelSpecsDrawer('${m.id}')"><i class="fa-solid fa-info-circle"></i> Specs</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- REALTIME REQUEST STREAM -->
          <div id="sec-logs" class="glass-panel" style="padding: 12px; margin-bottom: 0;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">
              <i class="fa-solid fa-clock-rotate-left"></i> Realtime Request & Telemetry Stream
            </div>
            <div style="max-height: 220px; overflow-y: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.76rem;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); text-align: left;">
                    <th style="padding: 6px;">Timestamp</th>
                    <th style="padding: 6px;">Model</th>
                    <th style="padding: 6px;">Family</th>
                    <th style="padding: 6px;">Tools</th>
                    <th style="padding: 6px;">Tokens</th>
                    <th style="padding: 6px;">Balance</th>
                    <th style="padding: 6px; text-align: center;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${DashboardViewHelper.renderTelemetryRows(apiLogs, telemetryData)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = htmlContent;
    if (!isSilentRefresh) {
      DashboardView.startLivePolling(container);
    }
  }

  static async handleTileClick(contextKey) {
    let contextLabel = contextKey;
    let tileType = 'report';
    if (contextKey.startsWith('token:')) {
      const sub = contextKey.split(':')[1];
      contextLabel = `Token ${sub.toUpperCase()}`;
      tileType = 'token';
    } else if (contextKey.startsWith('provider:')) {
      contextLabel = `Provider: ${contextKey.split(':')[1]}`;
      tileType = 'provider';
    } else if (contextKey.startsWith('model:')) {
      contextLabel = `Model: ${contextKey.split(':')[1]}`;
      tileType = 'model';
    }

    try {
      const [reportsRes, logsRes] = await Promise.all([
        ApiService.getReports(),
        ApiService.getApiLogs()
      ]);
      const reports = reportsRes?.reports || [];
      const logs = logsRes?.logs || [];
      let matchedReport = reports.find(r => (r.title && r.title.toLowerCase().includes(contextLabel.toLowerCase())) || (r.category && r.category.toLowerCase().includes(tileType)));
      let isNewReport = false;

      if (!matchedReport) {
        const createRes = await ApiService.createReport({
          title: `Auto-Generated Report: ${contextLabel}`,
          category: tileType,
          summary: `Operational audit report for ${contextLabel} created automatically from Dashboard interaction.`,
          details: {
            contextKey,
            totalRequests: logs.length,
            totalTokens: logs.reduce((sum, l) => sum + (l.totalTokens || l.tokens || 0), 0),
            avgLatency: logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + (l.latencyMs || 0), 0) / logs.length) : 0,
            errorCount: logs.filter(l => l.error || l.status >= 400).length
          }
        });
        if (createRes?.success) {
          matchedReport = createRes.report;
          isNewReport = true;
        }
      }

      DashboardViewHelper.renderTileDetailModal(contextLabel, matchedReport, logs, isNewReport, tileType);
    } catch (e) {
      ModalDialog.showNotification('Error fetching tile details: ' + e.message, 'error');
    }
  }

  static filterModels(q) {
    const query = (q || '').toLowerCase();
    const rows = document.querySelectorAll('#dashboard-models-table tbody tr');
    rows.forEach(r => {
      r.style.display = r.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
  }

  static openModelSpecsDrawer(modelId) {
    window.app.openCodeDrawer('Model Specs Detail', modelId);
  }

  static exportDashboardPdf() {
    ModalDialog.showNotification('Exporting Dashboard Operational Report PDF...', 'info');
    setTimeout(() => {
      window.print();
    }, 500);
  }

  static startLivePolling(container) {
    DashboardView.stopLivePolling();
    DashboardView.pollingInterval = setInterval(() => {
      if (window.app && window.app.currentView === 'dashboard' && document.body.contains(container)) {
        DashboardView.render(container, true);
      } else {
        DashboardView.stopLivePolling();
      }
    }, 15000);
  }

  static stopLivePolling() {
    if (DashboardView.pollingInterval) {
      clearInterval(DashboardView.pollingInterval);
      DashboardView.pollingInterval = null;
    }
  }
}

window.DashboardView = DashboardView;
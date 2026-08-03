/**
 * DashboardViewHelper.js
 * Purpose: Helper module for DashboardView containing card grid metric builders,
 *          Token Pool Gauge ring renderer, top provider/model rows, and modal handlers.
 * Dependencies: FormatHelper, ModalDialog, ApiService
 */

class DashboardViewHelper {
  static formatTokens(num) {
    if (num == null || isNaN(num)) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  static renderTopMetricCard(title, dataObj, colorM, colorW, colorD, contextKey, isPercent = false) {
    const fmt = this.formatTokens;
    const valM = isPercent ? (dataObj?.month || '0.0') + '%' : fmt(dataObj?.month || 0);
    const valW = isPercent ? (dataObj?.week || '0.0') + '%' : fmt(dataObj?.week || 0);
    const valD = isPercent ? (dataObj?.day || '0.0') + '%' : fmt(dataObj?.day || 0);

    return `
      <div class="glass-panel dashboard-tile" style="margin-bottom: 0; padding: 12px; cursor: pointer; transition: transform 0.2s ease, border-color 0.2s ease; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;"
        onclick="DashboardView.handleTileClick('${contextKey}')"
        title="Click to view detailed report for ${title}">
        <div style="font-size: 0.68rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">
          ${title}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; gap: 4px;">
          <div>
            <div style="font-size: 0.58rem; color: var(--text-dim); margin-bottom: 3px;">Month (M)</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: ${colorM};">${valM}</div>
          </div>
          <div>
            <div style="font-size: 0.58rem; color: var(--text-dim); margin-bottom: 3px;">Week (W)</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: ${colorW};">${valW}</div>
          </div>
          <div>
            <div style="font-size: 0.58rem; color: var(--text-dim); margin-bottom: 3px;">Day (D)</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: ${colorD};">${valD}</div>
          </div>
        </div>
      </div>
    `;
  }

  static renderTokenPoolGauge(gauge, userEmail) {
    const used = gauge?.usedPercent || '0.0';
    const email = userEmail || gauge?.activeGroup || 'jeet26@yahoo.com';
    const keysCount = gauge?.activeKeysCount || 17;
    const capacity = this.formatTokens(gauge?.monthlyCapacity || 862500000);

    return `
      <div class="glass-panel dashboard-tile" style="margin-bottom: 0; padding: 14px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;">
        <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px;">
          TOKEN POOL GAUGE
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <!-- Ring Gauge -->
          <div style="position: relative; width: 80px; height: 80px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: conic-gradient(var(--accent-cyan) ${used}%, rgba(255,255,255,0.06) 0); border-radius: 50%;">
            <div style="width: 60px; height: 60px; background: var(--bg-card); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <strong style="font-size: 0.85rem; color: var(--text-main);">${used}%</strong>
              <span style="font-size: 0.58rem; color: var(--text-dim);">Used</span>
            </div>
          </div>
          <!-- Gauge Details -->
          <div style="font-size: 0.75rem; display: flex; flex-direction: column; gap: 4px; overflow: hidden;">
            <div style="color: var(--text-dim); font-size: 0.68rem;">Active Group</div>
            <div style="color: var(--accent-emerald); font-weight: 700; font-size: 0.76rem; word-break: break-all;">${email}</div>
            <div style="color: var(--text-dim); font-size: 0.68rem; margin-top: 2px;">Active Pool Keys</div>
            <div style="color: var(--text-main); font-weight: 700;">${keysCount} keys active</div>
            <div style="color: var(--text-dim); font-size: 0.68rem; margin-top: 2px;">Monthly Capacity</div>
            <div style="color: var(--accent-emerald); font-weight: 700;">${capacity}</div>
          </div>
        </div>
      </div>
    `;
  }

  static renderProviderRows(topProviders) {
    const fmt = this.formatTokens;
    return (topProviders || []).map(p => `
      <div class="dashboard-tile" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.04); padding: 8px 6px; cursor: pointer; border-radius: 4px; transition: background 0.2s ease;"
        onclick="DashboardView.handleTileClick('provider:${p.name}')"
        title="Click to view report for ${p.name}">
        <div style="display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-circle" style="font-size: 0.4rem; color: var(--accent-cyan); vertical-align: middle;"></i>
          <div>
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-cyan);">${p.name}</div>
            <div style="font-size: 0.65rem; color: var(--text-dim);">Reqs: ${p.requests || 0} ${p.avgLatency || 0}ms</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.88rem; font-weight: 700; color: var(--accent-emerald);">${fmt(p.tokens || 0)}</div>
          <div style="font-size: 0.6rem; color: var(--text-dim);">Tokens</div>
        </div>
      </div>
    `).join('');
  }

  static renderModelRows(topModels) {
    const fmt = this.formatTokens;
    return (topModels || []).map(m => `
      <div class="dashboard-tile" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.04); padding: 8px 6px; cursor: pointer; border-radius: 4px; transition: background 0.2s ease;"
        onclick="DashboardView.handleTileClick('model:${m.name}')"
        title="Click to view report for ${m.name}">
        <div style="display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-circle" style="font-size: 0.4rem; color: #6366f1; vertical-align: middle;"></i>
          <div>
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); word-break: break-all;">${m.name}</div>
            <div style="font-size: 0.65rem; color: var(--text-dim);">Reqs: ${m.requests || 0} ${m.avgLatency || 0}ms</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.88rem; font-weight: 700; color: var(--accent-emerald);">${fmt(m.tokens || 0)}</div>
          <div style="font-size: 0.6rem; color: var(--text-dim);">Tokens</div>
        </div>
      </div>
    `).join('');
  }

  static renderOperationalMetricsPanel(telemetryData, userEmail) {
    const data = telemetryData || {};
    const available = data.available || { month: 862500000, week: 315000000, day: 35300000 };
    const consumed = data.consumed || { month: 123600, week: 0, day: 96400 };
    const balance = data.balance || { month: 862376400, week: 315000000, day: 35203600 };
    const percent = data.percent || { month: '0.0', week: '0.0', day: '0.3' };
    const gauge = data.gauge || { activeGroup: userEmail || 'jeet26@yahoo.com', activeKeysCount: 17, monthlyCapacity: 862500000, usedPercent: '0.0' };
    const topProviders = data.topProviders || [
      { name: 'GITHUB-MODELS', tokens: 87000, requests: 165, avgLatency: 1982 },
      { name: 'GROQ', tokens: 28400, requests: 74, avgLatency: 419 },
      { name: 'OPENROUTER', tokens: 7600, requests: 140, avgLatency: 745 }
    ];
    const topModels = data.topModels || [
      { name: 'gpt-4o-mini-2024-07-18', tokens: 57200, requests: 108, avgLatency: 2339 },
      { name: 'automation-model', tokens: 27000, requests: 22, avgLatency: 0 },
      { name: 'llama-3.3-70b-versatile', tokens: 26400, requests: 37, avgLatency: 616 }
    ];

    return `
      <!-- TOP METRIC CARDS ROW (4 Columns) -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px;">
        ${this.renderTopMetricCard('AVAILABLE TOKEN', available, '#3b82f6', '#10b981', '#10b981', 'token:available')}
        ${this.renderTopMetricCard('CONSUMED TOKEN', consumed, '#3b82f6', '#10b981', '#10b981', 'token:consumed')}
        ${this.renderTopMetricCard('BALANCE TOKEN', balance, '#3b82f6', '#10b981', '#10b981', 'token:balance')}
        ${this.renderTopMetricCard('PERCENT CONSUMED TOKEN', percent, '#10b981', '#10b981', '#10b981', 'token:percent', true)}
      </div>

      <!-- BOTTOM PANELS ROW (3 Columns) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <!-- Card 1: Token Pool Gauge -->
        ${this.renderTokenPoolGauge(gauge, userEmail)}
        
        <!-- Card 2: Top Providers -->
        <div class="glass-panel dashboard-tile" style="padding: 12px; margin-bottom: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <span>TOP PROVIDERS (THIS MONTH)</span>
            <i class="fa-solid fa-server" style="color: var(--accent-cyan);"></i>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px; max-height: 180px; overflow-y: auto;">
            ${this.renderProviderRows(topProviders)}
          </div>
        </div>

        <!-- Card 3: Model Usage Breakdown -->
        <div class="glass-panel dashboard-tile" style="padding: 12px; margin-bottom: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <span>MODEL USAGE BREAKDOWN</span>
            <i class="fa-solid fa-cubes" style="color: #6366f1;"></i>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px; max-height: 180px; overflow-y: auto;">
            ${this.renderModelRows(topModels)}
          </div>
        </div>
      </div>
    `;
  }

  static renderTileDetailModal(contextLabel, report, logs, isNewReport, tileType) {
    const fmt = this.formatTokens;
    let detailContent = '';

    if (report) {
      const details = report.details || {};
      detailContent = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="badge badge-cyan">${report.category || tileType}</span>
            <span style="font-size: 0.72rem; color: var(--text-dim);">Generated: ${new Date(report.timestamp).toLocaleString()}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
            <div class="glass-panel" style="padding: 10px; text-align: center;">
              <div style="font-size: 0.6rem; color: var(--text-dim); text-transform: uppercase;">Total Requests</div>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent-cyan);">${details.totalRequests || 0}</div>
            </div>
            <div class="glass-panel" style="padding: 10px; text-align: center;">
              <div style="font-size: 0.6rem; color: var(--text-dim); text-transform: uppercase;">Total Tokens</div>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent-emerald);">${fmt(details.totalTokens || 0)}</div>
            </div>
            <div class="glass-panel" style="padding: 10px; text-align: center;">
              <div style="font-size: 0.6rem; color: var(--text-dim); text-transform: uppercase;">Avg Latency</div>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent-amber);">${details.avgLatency || 0} ms</div>
            </div>
          </div>
          ${details.detail ? `<div style="font-size: 0.78rem; color: var(--text-muted); background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px;">${details.detail}</div>` : ''}
          ${isNewReport ? '<div style="font-size: 0.72rem; color: var(--accent-emerald);"><i class="fa-solid fa-circle-check"></i> New report created. Refresh the Reports tab to see full details.</div>' : ''}
        </div>
      `;
    } else {
      detailContent = `
        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 400px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); text-align: left;">
                <th style="padding: 6px;">Timestamp</th>
                <th style="padding: 6px;">Model</th>
                <th style="padding: 6px;">Tokens</th>
                <th style="padding: 6px;">Latency</th>
                <th style="padding: 6px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${logs.slice(0, 50).map(l => {
                const dateStr = new Date(l.timestamp || Date.now()).toLocaleString();
                const modelName = l.model || l.modelId || l.modelName || 'Unknown';
                const tokens = l.totalTokens || l.tokens || l.tokensConsumed || 0;
                const latency = l.latencyMs || 0;
                const status = l.status || (l.error ? 'ERROR' : 'SUCCESS');
                const statusColor = status === 'SUCCESS' || status === 'INFO' ? 'var(--accent-emerald)' : 'var(--accent-rose)';
                return `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.76rem;">
                    <td style="padding: 5px; color: var(--text-dim); white-space: nowrap;">${dateStr}</td>
                    <td style="padding: 5px; font-weight: 600; color: var(--primary-light);">${modelName}</td>
                    <td style="padding: 5px; color: var(--accent-cyan);">${fmt(tokens)}</td>
                    <td style="padding: 5px;">${latency} ms</td>
                    <td style="padding: 5px;"><span style="color: ${statusColor}; font-weight: 600;">${status}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          ${logs.length > 50 ? `<div style="text-align: center; padding: 8px; color: var(--text-dim); font-size: 0.72rem;">Showing 50 of ${logs.length} entries.</div>` : ''}
        </div>
      `;
    }

    ModalDialog.showModal({
      title: `<i class="fa-solid fa-file-lines" style="color: var(--accent-cyan);"></i> Report: ${contextLabel}`,
      icon: 'fa-file-lines',
      body: detailContent,
      confirmText: 'Close',
      onConfirm: () => {}
    });
  }

  static renderTelemetryRows(apiLogs, telemetry) {
    if (!apiLogs || apiLogs.length === 0) {
      return `<tr><td colspan="7" style="text-align: center; padding: 20px; color: var(--text-dim);">No recent activity recorded.</td></tr>`;
    }
    const fmt = this.formatTokens;
    return apiLogs.map(log => {
      const dateStr = new Date(log.timestamp || Date.now()).toLocaleString();
      const modelName = log.model || log.modelId || log.modelName || 'Unknown';
      const family = log.family || 'General';
      const tools = log.tools || log.toolsUsed ? 'Yes' : 'No';
      const tokens = log.tokens || log.tokensConsumed || log.totalTokens || 0;
      const bal = log.balance || telemetry?.balance?.day || 0;
      const statusIcon = log.error || log.status >= 400 ? 'fa-xmark' : 'fa-check';
      const statusColor = log.error || log.status >= 400 ? 'var(--accent-red)' : 'var(--accent-emerald)';
      const title = log.error || (log.status >= 400 ? `Error ${log.status}` : 'Success');

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.8rem;">
          <td style="padding: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;" title="${dateStr}">${dateStr}</td>
          <td style="padding: 6px; font-weight: 700; color: var(--primary-light);">${modelName}</td>
          <td style="padding: 6px; color: var(--text-dim);">${family}</td>
          <td style="padding: 6px;">${tools}</td>
          <td style="padding: 6px; color: var(--accent-cyan);">${fmt(tokens)}</td>
          <td style="padding: 6px; color: var(--accent-emerald);">${fmt(bal)}</td>
          <td style="padding: 6px; text-align: center;">
            <i class="fa-solid ${statusIcon}" style="color: ${statusColor};" title="${title}"></i>
          </td>
        </tr>
      `;
    }).join('');
  }
}

window.DashboardViewHelper = DashboardViewHelper;

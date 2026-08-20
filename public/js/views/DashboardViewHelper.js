/**
 * DashboardViewHelper.js
 * Purpose: Helper module for DashboardView containing card grid metric builders,
 *          Token Pool Gauge ring renderer, top provider/model rows, and modal handlers.
 * Dependencies: FormatHelper, ModalDialog, ApiService
 */

class DashboardViewHelper {
  static formatTokens(num) {
    if (typeof FormatHelper !== 'undefined') return FormatHelper.formatNumberAutoUnit(num);
    if (num == null || isNaN(num)) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toString();
  }

  static renderTopMetricCard(title, dataObj, colorM, colorW, colorD, contextKey, isPercent = false) {
    const fmt = this.formatTokens;
    const valM = isPercent ? (dataObj?.month || '0.0') + '%' : fmt(dataObj?.month || 0);
    const valW = isPercent ? (dataObj?.week || '0.0') + '%' : fmt(dataObj?.week || 0);
    const valD = isPercent ? (dataObj?.day || '0.0') + '%' : fmt(dataObj?.day || 0);

    return `
      <div class="glass-panel dashboard-tile" style="margin: 0; padding: 3px; cursor: pointer;"
        onclick="DashboardView.handleTileClick('${contextKey}')"
        title="Click to view detailed report for ${title}">
        <div style="font-size: 0.68rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px; padding: 2px;">
          ${title}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; gap: 3px; padding: 2px;">
          <div>
            <div style="font-size: 0.58rem; color: var(--text-dim); margin-bottom: 1px;">Month (M)</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: ${colorM};">${valM}</div>
          </div>
          <div>
            <div style="font-size: 0.58rem; color: var(--text-dim); margin-bottom: 1px;">Week (W)</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: ${colorW};">${valW}</div>
          </div>
          <div>
            <div style="font-size: 0.58rem; color: var(--text-dim); margin-bottom: 1px;">Day (D)</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: ${colorD};">${valD}</div>
          </div>
        </div>
      </div>
    `;
  }

  static renderTokenPoolGauge(gauge, userEmail) {
    const used = gauge?.usedPercent ?? '0.0';
    const email = userEmail || gauge?.activeGroup || 'No Active Requests';
    const keysCount = gauge?.activeKeysCount ?? 0;
    const capacity = this.formatTokens(gauge?.monthlyCapacity ?? 0);

    return `
      <div class="glass-panel dashboard-tile" style="margin-bottom: 0; padding: 14px;">
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

  static renderTokenPoolGauge2x2(gauge, userEmail) {
    const data = gauge || {};
    const capacity = gauge?.monthlyCapacity || 1;
    const fmt = this.formatTokens;

    // Compute meaningful percentages for each donut
    const availablePct = '100.0';
    const consumedPct = ((data.consumed?.month || 0) / capacity * 100).toFixed(1);
    const balancePct = ((data.balance?.month || 0) / capacity * 100).toFixed(1);
    const percentConsumedRaw = parseFloat(data.percent?.month) || 0;

    // 2x2 Quadrant layout: Q1=Available, Q2=Consumed, Q3=Balance, Q4=Utilization
    // Each quadrant has a multi-color donut with M/W/D segments and pure interactive tooltip
    const metrics = [
      {
        id: 'available',
        title: 'AVAILABLE',
        icon: 'fa-database',
        borderColor: 'var(--accent-emerald)',
        tooltip: `AVAILABLE TOKENS (Relative Capacity Breakdown):\n• Month (M): ${fmt(data.available?.month || 0)} (100%)\n• Week (W): ${fmt(data.available?.week || 0)} (${(((data.available?.week || 0)/(data.available?.month || 1))*100).toFixed(1)}% of Month)\n• Day (D): ${fmt(data.available?.day || 0)} (${(((data.available?.day || 0)/(data.available?.week || 1))*100).toFixed(1)}% of Week)`,
        segments: [
          { color: '#10b981', pct: 100, label: 'M' },
          { color: '#06b6d4', pct: Math.min((((data.available?.week || 0) / (data.available?.month || 1)) * 100), 100).toFixed(1), label: 'W' },
          { color: '#8b5cf6', pct: Math.min((((data.available?.day || 0) / (data.available?.week || 1)) * 100), 100).toFixed(1), label: 'D' }
        ]
      },
      {
        id: 'consumed',
        title: 'CONSUMED',
        icon: 'fa-bolt',
        borderColor: 'var(--accent-amber)',
        tooltip: `CONSUMED TOKENS (Usage Breakdown):\n• Month (M): ${fmt(data.consumed?.month || 0)} (${consumedPct}% of Capacity)\n• Week (W): ${fmt(data.consumed?.week || 0)} (${(((data.consumed?.week || 0)/(data.consumed?.month || 1))*100).toFixed(1)}% of M)\n• Day (D): ${fmt(data.consumed?.day || 0)} (${(((data.consumed?.day || 0)/(data.consumed?.week || 1))*100).toFixed(1)}% of W)`,
        segments: [
          { color: '#f59e0b', pct: Math.min(parseFloat(consumedPct) || 0, 100), label: 'M' },
          { color: '#f97316', pct: Math.min((((data.consumed?.week || 0) / (capacity || 1)) * 100), 100).toFixed(1), label: 'W' },
          { color: '#ef4444', pct: Math.min((((data.consumed?.day || 0) / (capacity || 1)) * 100), 100).toFixed(1), label: 'D' }
        ]
      },
      {
        id: 'balance',
        title: 'BALANCE',
        icon: 'fa-wallet',
        borderColor: 'var(--accent-cyan)',
        tooltip: `TOKEN BALANCE (Remaining Pool Reserve):\n• Month (M): ${fmt(data.balance?.month || 0)} (${balancePct}% remaining)\n• Week (W): ${fmt(data.balance?.week || 0)} (${(((data.balance?.week || 0)/(data.balance?.month || 1))*100).toFixed(1)}% of M)\n• Day (D): ${fmt(data.balance?.day || 0)} (${(((data.balance?.day || 0)/(data.balance?.week || 1))*100).toFixed(1)}% of W)`,
        segments: [
          { color: '#06b6d4', pct: Math.min(parseFloat(balancePct) || 0, 100), label: 'M' },
          { color: '#0d9488', pct: Math.min((((data.balance?.week || 0) / (capacity || 1)) * 100), 100).toFixed(1), label: 'W' },
          { color: '#10b981', pct: Math.min((((data.balance?.day || 0) / (capacity || 1)) * 100), 100).toFixed(1), label: 'D' }
        ]
      },
      {
        id: 'utilization',
        title: 'UTILIZATION',
        icon: 'fa-chart-line',
        borderColor: '#8b5cf6',
        tooltip: `UTILIZATION RATE (Velocity Metrics):\n• Month (M): ${(parseFloat(data.percent?.month || '0').toFixed(2))}%\n• Week (W): ${(parseFloat(data.percent?.week || '0').toFixed(2))}%\n• Day (D): ${(parseFloat(data.percent?.day || '0').toFixed(2))}%`,
        segments: [
          { color: '#8b5cf6', pct: Math.min(parseFloat(data.percent?.month || '0'), 100), label: 'M' },
          { color: '#a855f7', pct: Math.min(parseFloat(data.percent?.week || '0'), 100), label: 'W' },
          { color: '#ec4899', pct: Math.min(parseFloat(data.percent?.day || '0'), 100), label: 'D' }
        ]
      }
    ];

    // Shared render helper for one quadrant card with 3-concentric rings and NO text inside
    const renderQuadrant = (m) => {
      const circOuter = 251.2;  // r=40 (Month)
      const circMid = 188.4;    // r=30 (Week)
      const circInner = 125.6;  // r=20 (Day)

      const pM = Math.min(parseFloat(m.segments[0].pct) || 0, 100);
      const pW = Math.min(parseFloat(m.segments[1].pct) || 0, 100);
      const pD = Math.min(parseFloat(m.segments[2].pct) || 0, 100);

      const dashM = (pM / 100) * circOuter;
      const dashW = (pW / 100) * circMid;
      const dashD = (pD / 100) * circInner;

      return `
        <div class="dashboard-tile" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 3px; background: rgba(255,255,255,0.02); border-radius: 6px; border: 1.5px solid ${m.borderColor}; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease;"
          onclick="DashboardView.handleTileClick('token:${m.id}')"
          title="${m.tooltip}">
          <!-- Donut Rings (M/W/D Concentric with zero center text clutter) -->
          <div style="position: relative; width: 68px; height: 68px; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 100 100" style="transform: rotate(-90deg); width: 100%; height: 100%;">
              <!-- Background Tracks -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="5"/>
              <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="5"/>
              <circle cx="50" cy="50" r="20" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="5"/>
              
              <!-- Month Ring (Outer) -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="${m.segments[0].color}" stroke-width="5"
                stroke-dasharray="${dashM} ${circOuter}" stroke-linecap="round"
                style="transition: stroke-dasharray 0.8s ease; filter: drop-shadow(0 0 3px ${m.segments[0].color}60);"/>
              
              <!-- Week Ring (Middle) -->
              <circle cx="50" cy="50" r="30" fill="none" stroke="${m.segments[1].color}" stroke-width="5"
                stroke-dasharray="${dashW} ${circMid}" stroke-linecap="round"
                style="transition: stroke-dasharray 0.8s ease; filter: drop-shadow(0 0 3px ${m.segments[1].color}60);"/>
              
              <!-- Day Ring (Inner) -->
              <circle cx="50" cy="50" r="20" fill="none" stroke="${m.segments[2].color}" stroke-width="5"
                stroke-dasharray="${dashD} ${circInner}" stroke-linecap="round"
                style="transition: stroke-dasharray 0.8s ease; filter: drop-shadow(0 0 3px ${m.segments[2].color}60);"/>
            </svg>
            <div style="position: absolute; font-size: 0.75rem; color: ${m.borderColor}; opacity: 0.85;">
              <i class="fa-solid ${m.icon}"></i>
            </div>
          </div>

          <!-- Pure Category Label (No text clutter, all breakdown in tooltip) -->
          <div style="font-size: 0.58rem; font-weight: 700; color: ${m.borderColor}; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; margin-top: 1px;">
            ${m.title}
          </div>
        </div>
      `;
    };

    return `
      <div class="glass-panel dashboard-tile" style="margin: 0; padding: 3px;">
        <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 3px; padding: 2px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <i class="fa-solid fa-circle-nodes" style="color: var(--accent-cyan);"></i>
            <span>TOKEN POOL GAUGE</span>
          </div>
          <div style="display: flex; gap: 4px; font-size: 0.58rem; color: var(--text-muted); text-transform: none;">
            <span><strong style="color: #10b981;">●</strong> Month</span>
            <span><strong style="color: #06b6d4;">●</strong> Week</span>
            <span><strong style="color: #8b5cf6;">●</strong> Day</span>
          </div>
        </div>

        <!-- 2x2 Quadrant Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 3px; margin-bottom: 3px;">
          ${renderQuadrant(metrics[0])}
          ${renderQuadrant(metrics[1])}
          ${renderQuadrant(metrics[2])}
          ${renderQuadrant(metrics[3])}
        </div>

        <!-- Legend -->
        <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 3px; font-size: 0.62rem; color: var(--text-muted);">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--accent-emerald); box-shadow: 0 0 3px var(--accent-emerald);"></span> Available
          </div>
          <div style="display: flex; align-items: center; gap: 3px; font-size: 0.62rem; color: var(--text-muted);">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--accent-amber); box-shadow: 0 0 3px var(--accent-amber);"></span> Consumed
          </div>
          <div style="display: flex; align-items: center; gap: 3px; font-size: 0.62rem; color: var(--text-muted);">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--accent-cyan); box-shadow: 0 0 3px var(--accent-cyan);"></span> Balance
          </div>
          <div style="display: flex; align-items: center; gap: 3px; font-size: 0.62rem; color: var(--text-muted);">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #8b5cf6; box-shadow: 0 0 3px #8b5cf6);"></span> Utilization
          </div>
        </div>

        ${gauge ? `
        <div style="margin-top: 3px; padding: 3px 6px; background: rgba(6,182,212,0.08); border: 1px solid rgba(6,182,212,0.2); border-radius: 4px; font-size: 0.65rem; color: var(--text-muted); text-align: center;">
          <i class="fa-solid fa-circle-info" style="color: var(--accent-cyan); margin-right: 3px;"></i>
          Active Group: <span style="color: var(--accent-emerald); font-weight: 600;">${gauge.activeGroup || userEmail || 'N/A'}</span>
          <span style="margin: 0 6px; opacity: 0.4;">|</span>
          Pool Keys: <span style="color: var(--accent-cyan); font-weight: 600;">${gauge.activeKeysCount || 0}</span>
          <span style="margin: 0 6px; opacity: 0.4;">|</span>
          Capacity: <span style="color: var(--text-main); font-weight: 600;">${fmt(gauge.monthlyCapacity || 0)}</span>
        </div>
        ` : ''}
      </div>
    `;
  }

  static renderProviderRows(topProviders) {
    const fmt = this.formatTokens;
    return (topProviders || []).map(p => `
      <div class="dashboard-tile" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.04); padding: 3px; cursor: pointer; border-radius: 4px; transition: background 0.2s ease;"
        onclick="DashboardView.handleTileClick('provider:${p.name}')"
        title="Click to view report for ${p.name}">
        <div style="display: flex; align-items: center; gap: 4px;">
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
      <div class="dashboard-tile" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.04); padding: 3px; cursor: pointer; border-radius: 4px; transition: background 0.2s ease;"
        onclick="DashboardView.handleTileClick('model:${m.name}')"
        title="Click to view report for ${m.name}">
        <div style="display: flex; align-items: center; gap: 4px;">
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
    const available = data.available ?? { month: 0, week: 0, day: 0 };
    const consumed = data.consumed ?? { month: 0, week: 0, day: 0 };
    const balance = data.balance ?? { month: 0, week: 0, day: 0 };
    const percent = data.percent ?? { month: '0.0', week: '0.0', day: '0.0' };
    const gauge = data.gauge ?? { activeGroup: userEmail || 'No Active Requests', activeKeysCount: 0, monthlyCapacity: 0, usedPercent: '0.0' };
    const topProviders = data.topProviders ?? [];
    const topModels = data.topModels ?? [];

    return `
      <!-- TOP METRIC CARDS ROW (4 Columns) -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; margin-bottom: 3px;">
        ${this.renderTopMetricCard('AVAILABLE TOKEN', available, '#3b82f6', '#10b981', '#10b981', 'token:available')}
        ${this.renderTopMetricCard('CONSUMED TOKEN', consumed, '#3b82f6', '#10b981', '#10b981', 'token:consumed')}
        ${this.renderTopMetricCard('BALANCE TOKEN', balance, '#3b82f6', '#10b981', '#10b981', 'token:balance')}
        ${this.renderTopMetricCard('PERCENT CONSUMED TOKEN', percent, '#10b981', '#10b981', '#10b981', 'token:percent', true)}
      </div>

      <!-- BOTTOM PANELS ROW (3 Columns with 2x2 Gauge) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px; margin-bottom: 3px;">
        <!-- Card 1: Token Pool Gauge (2x2 Layout) -->
        ${this.renderTokenPoolGauge2x2(gauge, userEmail)}
        
        <!-- Card 2: Top Providers -->
        <div class="glass-panel dashboard-tile" style="padding: 3px; margin: 0;">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 3px; padding: 2px; display: flex; justify-content: space-between; align-items: center;">
            <span>TOP PROVIDERS (THIS MONTH)</span>
            <i class="fa-solid fa-server" style="color: var(--accent-cyan);"></i>
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px; max-height: 280px; overflow-y: auto;">
            ${this.renderProviderRows(topProviders)}
          </div>
        </div>

        <!-- Card 3: Model Usage Breakdown -->
        <div class="glass-panel dashboard-tile" style="padding: 3px; margin: 0;">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 3px; padding: 2px; display: flex; justify-content: space-between; align-items: center;">
            <span>MODEL USAGE BREAKDOWN</span>
            <i class="fa-solid fa-cubes" style="color: #6366f1;"></i>
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px; max-height: 280px; overflow-y: auto;">
            ${this.renderModelRows(topModels)}
          </div>
        </div>
      </div>
    `;
  }

  static async handleContextualTileClick(contextKey) {
    const fmt = this.formatTokens;
    try {
      const [stats, providersRes, modelsRes, combosRes, biRes] = await Promise.all([
        ApiService.getHeaderStats(),
        ApiService.getAllProviders(),
        ApiService.getModels(),
        ApiService.getCombos(),
        ApiService.getBiAnalytics()
      ]);

      const providers = providersRes?.providers || [];
      const models = modelsRes?.models || [];
      const combos = combosRes?.combos || [];
      const biReport = biRes?.report || {};
      const sla = biReport.slaMetrics || {};
      const financial = biReport.financialSavings || {};

      let title = 'Telemetry Detail Report';
      let icon = 'fa-chart-simple';
      let bodyHtml = '';
      let actionBtn = null;

      // ── Context 1: Providers ──
      if (contextKey === 'header:providers' || contextKey.startsWith('provider:')) {
        const activeCount = providers.filter(p => p.isActive).length;
        title = `Provider Ecosystem Status (${activeCount}/${providers.length} Active)`;
        icon = 'fa-server';
        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
              <div class="glass-panel" style="padding:10px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">Active Providers</div>
                <div style="font-size:1.3rem; font-weight:800; color:var(--accent-cyan);">${activeCount}</div>
              </div>
              <div class="glass-panel" style="padding:10px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">Total Registered</div>
                <div style="font-size:1.3rem; font-weight:800; color:var(--text-main);">${providers.length}</div>
              </div>
              <div class="glass-panel" style="padding:10px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">Local Server</div>
                <div style="font-size:1.1rem; font-weight:800; color:${stats?.isLocalServerActive ? 'var(--accent-emerald)' : 'var(--text-muted)'};">${stats?.isLocalServerActive ? 'ONLINE' : 'STANDBY'}</div>
              </div>
            </div>
            <div style="max-height:220px; overflow-y:auto; border:1px solid var(--border-color); border-radius:6px;">
              <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
                <thead>
                  <tr style="background:rgba(0,0,0,0.3); border-bottom:1px solid var(--border-color); text-align:left;">
                    <th style="padding:6px 8px;">Provider</th>
                    <th style="padding:6px 8px;">Protocol</th>
                    <th style="padding:6px 8px; text-align:center;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${providers.map(p => `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                      <td style="padding:6px 8px; font-weight:600; color:var(--text-main);">${p.displayName || p.name || p.id}</td>
                      <td style="padding:6px 8px; color:var(--text-muted); font-size:0.7rem;">${p.protocol || 'OpenAI API'}</td>
                      <td style="padding:6px 8px; text-align:center;">
                        <span class="badge ${p.isActive ? 'badge-emerald' : 'badge-danger'}" style="font-size:0.65rem;">${p.isActive ? 'Active' : 'Offline'}</span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
        actionBtn = { label: 'Open Providers View', action: () => { window.app.navigate('/providers'); } };
      }
      // ── Context 2: Model Clubs ──
      else if (contextKey === 'header:modelClubs') {
        title = `Model Clubs & Combo Routing (${combos.length} Combos)`;
        icon = 'fa-users';
        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
              <div class="glass-panel" style="padding:10px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">Total Clubs</div>
                <div style="font-size:1.3rem; font-weight:800; color:var(--primary-light);">${combos.length}</div>
              </div>
              <div class="glass-panel" style="padding:10px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">Strategy Distribution</div>
                <div style="font-size:0.85rem; font-weight:700; color:var(--accent-cyan); margin-top:4px;">Round Robin / Fallback</div>
              </div>
              <div class="glass-panel" style="padding:10px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">High-Availability</div>
                <div style="font-size:1.1rem; font-weight:800; color:var(--accent-emerald);">Active Failover</div>
              </div>
            </div>
            <div style="max-height:220px; overflow-y:auto; border:1px solid var(--border-color); border-radius:6px;">
              <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
                <thead>
                  <tr style="background:rgba(0,0,0,0.3); border-bottom:1px solid var(--border-color); text-align:left;">
                    <th style="padding:6px 8px;">Combo Name</th>
                    <th style="padding:6px 8px;">Strategy</th>
                    <th style="padding:6px 8px; text-align:center;">Models in Pool</th>
                  </tr>
                </thead>
                <tbody>
                  ${combos.map(c => `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                      <td style="padding:6px 8px; font-weight:600; color:var(--text-main);">${c.name || c.id}</td>
                      <td style="padding:6px 8px; color:var(--accent-amber);">${c.strategy || 'round-robin'}</td>
                      <td style="padding:6px 8px; text-align:center; color:var(--accent-cyan); font-weight:700;">${(c.modelsList || c.models || []).length}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
        actionBtn = { label: 'Open Model Clubs', action: () => { window.app.navigate('/model-club'); } };
      }
      // ── Context 3: Models Catalog ──
      else if (contextKey === 'header:models' || contextKey.startsWith('model:')) {
        const activeModels = models.filter(m => m.status === 'Active');
        title = `Registered AI Models Catalog (${activeModels.length} Active / ${models.length} Total)`;
        icon = 'fa-microchip';
        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
              <div class="glass-panel" style="padding:10px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">Active Models</div>
                <div style="font-size:1.3rem; font-weight:800; color:var(--accent-emerald);">${activeModels.length}</div>
              </div>
              <div class="glass-panel" style="padding:10px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">Context Ranges</div>
                <div style="font-size:0.95rem; font-weight:700; color:var(--accent-cyan); margin-top:4px;">4k – 1M Tokens</div>
              </div>
              <div class="glass-panel" style="padding:10px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">Cost Tier</div>
                <div style="font-size:1.1rem; font-weight:800; color:var(--accent-emerald);">$0.00 Free Only</div>
              </div>
            </div>
            <div style="max-height:220px; overflow-y:auto; border:1px solid var(--border-color); border-radius:6px;">
              <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
                <thead>
                  <tr style="background:rgba(0,0,0,0.3); border-bottom:1px solid var(--border-color); text-align:left;">
                    <th style="padding:6px 8px;">Model ID</th>
                    <th style="padding:6px 8px;">Provider</th>
                    <th style="padding:6px 8px;">Core Skill</th>
                    <th style="padding:6px 8px; text-align:right;">Context</th>
                  </tr>
                </thead>
                <tbody>
                  ${models.slice(0, 30).map(m => `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                      <td style="padding:6px 8px; font-weight:600; color:var(--primary-light);">${m.modelId}</td>
                      <td style="padding:6px 8px; color:var(--text-muted);">${m.providerName || m.providerId}</td>
                      <td style="padding:6px 8px;"><span class="badge badge-cyan" style="font-size:0.65rem;">${m.coreSkill || 'General'}</span></td>
                      <td style="padding:6px 8px; text-align:right; font-family:monospace;">${m.contextWindow ? (m.contextWindow / 1024).toFixed(0) + 'k' : '8k'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
        actionBtn = { label: 'Open Playground Chat', action: () => { window.app.navigate('/playground'); } };
      }
      // ── Context 4: Active Agents ──
      else if (contextKey === 'header:agents') {
        title = `ROCAS Autonomous Multi-Agent Hierarchy`;
        icon = 'fa-robot';
        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
              <div class="glass-panel" style="padding:10px; text-align:center; border-left:3px solid var(--accent-cyan);">
                <div style="font-size:0.62rem; color:var(--text-muted);">A01 PROXY AGENT</div>
                <div style="font-size:1.1rem; font-weight:800; color:var(--accent-cyan); margin-top:2px;">Online</div>
              </div>
              <div class="glass-panel" style="padding:10px; text-align:center; border-left:3px solid var(--accent-emerald);">
                <div style="font-size:0.62rem; color:var(--text-muted);">A02 MONITOR</div>
                <div style="font-size:1.1rem; font-weight:800; color:var(--accent-emerald); margin-top:2px;">Active (0.5h)</div>
              </div>
              <div class="glass-panel" style="padding:10px; text-align:center; border-left:3px solid var(--accent-amber);">
                <div style="font-size:0.62rem; color:var(--text-muted);">A03 SEARCH AGENT</div>
                <div style="font-size:1.1rem; font-weight:800; color:var(--accent-amber); margin-top:2px;">DuckDuckGo</div>
              </div>
              <div class="glass-panel" style="padding:10px; text-align:center; border-left:3px solid var(--primary-light);">
                <div style="font-size:0.62rem; color:var(--text-muted);">A08 AUDIT AGENT</div>
                <div style="font-size:1.1rem; font-weight:800; color:var(--primary-light); margin-top:2px;">Closed-Loop</div>
              </div>
            </div>
            <div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:6px; font-size:0.75rem; color:var(--text-main); line-height:1.6;">
              <div style="font-weight:700; color:var(--accent-cyan); margin-bottom:4px;"><i class="fa-solid fa-circle-check"></i> Multi-Thread Closed-Loop Execution Status:</div>
              All autonomous agents are synchronized with <code>data/program_mapping.json</code>. Rate-limit failover, blacklist circuit breaker, and zero-trust key substitution are actively executing.
            </div>
          </div>
        `;
        actionBtn = { label: 'View Diagnostic Reports', action: () => { window.app.navigate('/reports'); } };
      }
      // ── Context 5: Avg Latency & SLA ──
      else if (contextKey === 'header:latency') {
        title = `Provider Latency Benchmark & SLA Compliance`;
        icon = 'fa-bolt';
        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
              <div class="glass-panel" style="padding:10px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--text-muted);">Average Response Time</div>
                <div style="font-size:1.3rem; font-weight:800; color:var(--accent-amber);">${stats.avgLatencyMs || 180} ms</div>
              </div>
              <div class="glass-panel" style="padding:10px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--text-muted);">SLA Compliance Rate</div>
                <div style="font-size:1.3rem; font-weight:800; color:var(--accent-emerald);">${sla.slaComplianceRatePct || '100%'}</div>
              </div>
              <div class="glass-panel" style="padding:10px; text-align:center;">
                <div style="font-size:0.65rem; color:var(--text-muted);">Target SLA</div>
                <div style="font-size:1.1rem; font-weight:800; color:var(--accent-cyan);">< 1,200 ms</div>
              </div>
            </div>
            <div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:6px; font-size:0.75rem; color:var(--text-muted);">
              <div style="font-weight:700; color:var(--text-main); margin-bottom:4px;"><i class="fa-solid fa-chart-line"></i> SLA Performance Distribution:</div>
              • Excellent (<300ms): <strong style="color:var(--accent-emerald);">${sla.excellentPct || '85.0'}%</strong><br/>
              • Acceptable (300-1200ms): <strong style="color:var(--accent-cyan);">${sla.acceptablePct || '15.0'}%</strong><br/>
              • Degraded (>1200ms): <strong style="color:var(--accent-rose);">${sla.degradedPct || '0.0'}%</strong>
            </div>
          </div>
        `;
        actionBtn = { label: 'View Latency Matrix', action: () => { window.app.navigate('/reports'); if (window.ReportsView) window.ReportsView.switchTab('bianalytics'); } };
      }
      // ── Context 6: Available Tokens ──
      else if (contextKey === 'header:tokensAvl' || contextKey === 'token:available') {
        title = `Available Token Pool Quota`;
        icon = 'fa-database';
        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div class="glass-panel" style="padding:16px; text-align:center; border-left:4px solid var(--primary-light);">
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Total Available Tokens</div>
              <div style="font-size:2rem; font-weight:800; color:var(--primary-light); margin:6px 0;">${fmt(stats.tokensAvl)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Aggregated monthly free tier token bandwidth across active providers</div>
            </div>
          </div>
        `;
      }
      // ── Context 7: Consumed Tokens ──
      else if (contextKey === 'header:tokensCon' || contextKey === 'token:consumed') {
        title = `Realtime Token Consumption & Velocity`;
        icon = 'fa-fire';
        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div class="glass-panel" style="padding:16px; text-align:center; border-left:4px solid var(--accent-rose);">
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Total Consumed Tokens</div>
              <div style="font-size:2rem; font-weight:800; color:var(--accent-rose); margin:6px 0;">${fmt(stats.tokensCon)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Prompt Tokens + Completion Tokens processed through local proxy</div>
            </div>
          </div>
        `;
      }
      // ── Context 8: Token Balance ──
      else if (contextKey === 'header:tokensBal' || contextKey === 'token:balance') {
        title = `Token Pool Balance & Safety Headroom`;
        icon = 'fa-scale-balanced';
        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div class="glass-panel" style="padding:16px; text-align:center; border-left:4px solid var(--accent-emerald);">
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Remaining Balance</div>
              <div style="font-size:2rem; font-weight:800; color:var(--accent-emerald); margin:6px 0;">${fmt(stats.tokensBal)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Quota headroom remaining before rate-limiting or soft caps</div>
            </div>
          </div>
        `;
      }
      // ── Context 9: Token Utilization ──
      else if (contextKey === 'header:tokensUtilized' || contextKey === 'token:percent') {
        title = `Token Pool Utilization Index`;
        icon = 'fa-chart-pie';
        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div class="glass-panel" style="padding:16px; text-align:center; border-left:4px solid var(--accent-amber);">
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Pool Utilization Percentage</div>
              <div style="font-size:2rem; font-weight:800; color:var(--accent-amber); margin:6px 0;">${stats.tokensUtilized || '0.00'}%</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Capacity saturation rate relative to monthly allocated bandwidth</div>
            </div>
          </div>
        `;
      }
      // ── Context 10: System Health / Uptime ──
      else if (contextKey === 'header:health') {
        title = `System Health & Circuit Breaker Status`;
        icon = 'fa-heart-pulse';
        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div class="glass-panel" style="padding:16px; text-align:center; border-left:4px solid var(--accent-emerald);">
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Overall System Health</div>
              <div style="font-size:2rem; font-weight:800; color:var(--accent-emerald); margin:6px 0;">${stats.systemHealth || '100%'}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">All background services, rate-limit controllers & port 12247 proxy are nominal</div>
            </div>
          </div>
        `;
        actionBtn = { label: 'View System Audit Logs', action: () => { window.app.navigate('/reports'); if (window.ReportsView) window.ReportsView.switchTab('system'); } };
      }
      // ── Context 11: Credits Saved (Last Tile) ──
      else if (contextKey === 'header:credits') {
        title = `Financial Cost Arbitrage & Free Tier Credits`;
        icon = 'fa-coins';
        bodyHtml = `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div class="glass-panel" style="padding:16px; text-align:center; border-left:4px solid var(--accent-emerald);">
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Total Estimated Cost Saved</div>
              <div style="font-size:2.2rem; font-weight:800; color:var(--accent-emerald); margin:6px 0;">${stats.totalCreditsSaved || '$0.00'}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Calculated against standard commercial baseline ($0.004/1k tokens)</div>
            </div>
            <div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:6px; font-size:0.75rem; color:var(--text-muted);">
              <div style="font-weight:700; color:var(--text-main); margin-bottom:4px;"><i class="fa-solid fa-calculator"></i> Cost Arbitrage Benefits:</div>
              By routing requests to registered zero-cost free models (Groq, OpenRouter, Gemini, NVIDIA, Ollama), you have completely avoided commercial API fees.
            </div>
          </div>
        `;
        actionBtn = { label: 'View Cost Optimization BI Report', action: () => { window.app.navigate('/reports'); if (window.ReportsView) window.ReportsView.switchTab('bianalytics'); } };
      }

      ModalDialog.showModal({
        title,
        icon,
        body: bodyHtml,
        confirmText: actionBtn ? actionBtn.label : 'Close',
        onConfirm: () => {
          if (actionBtn && actionBtn.action) actionBtn.action();
        }
      });
    } catch (e) {
      ModalDialog.showNotification('Error loading tile details: ' + e.message, 'error');
    }
  }

  static renderTileDetailModal(contextLabel, report, logs, isNewReport, tileType) {
    this.handleContextualTileClick(tileType);
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
  static renderVisualAnalyticsTiles(apiLogs) {
    if (typeof ReportsViewHelper === 'undefined' || !ReportsViewHelper.generateStats) {
      return `<div style="text-align:center; padding: 20px;">Stats Engine Loading...</div>`;
    }

    const stats = ReportsViewHelper.generateStats(apiLogs || []);
    const tf = "1W"; // Last 7 days
    const colors = ["#d946ef", "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316"];
    
    // 1. Market Share
    const mktData = stats.market[tf] || [];
    const latestShare = mktData[mktData.length - 1] || {};
    const authors = latestShare.authors || [];
    let shareBars = '';
    let conicGradientParts = [];
    let currentDeg = 0;
    authors.slice(0, 5).forEach((auth, idx) => {
      const color = colors[idx % colors.length];
      shareBars += `
        <div style="margin-bottom: 8px;">
          <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted); margin-bottom: 3px;">
            <span style="font-weight:700; color:var(--text-main); display:flex; align-items:center; gap:6px;">
              <span style="width:8px; height:8px; border-radius:50%; background:${color};"></span>${auth.author}
            </span>
            <span>${auth.share}%</span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow:hidden;">
            <div style="height: 100%; width: ${auth.share}%; background: ${color}; border-radius: 3px;"></div>
          </div>
        </div>
      `;
      let degrees = (auth.share / 100) * 360;
      conicGradientParts.push(`${color} ${currentDeg}deg ${currentDeg + degrees}deg`);
      currentDeg += degrees;
    });
    if (currentDeg < 360) conicGradientParts.push(`rgba(255,255,255,0.05) ${currentDeg}deg 360deg`);

    const marketTile = `
      <div class="glass-panel dashboard-tile" style="padding: 3px; margin: 0; background: var(--bg-card); border-radius: 6px; border: 1px solid var(--border-color);">
        <h5 style="color: var(--text-main); margin-bottom: 3px; font-size: 0.75rem; padding: 2px;"><i class="fa-solid fa-pie-chart" style="color:var(--accent-cyan); margin-right:4px;"></i> Market Share (7D)</h5>
        <div style="display: flex; gap: 3px; align-items: center; padding: 2px;">
          <div style="flex: 1; display: flex; justify-content: center;">
            <div style="width: 70px; height: 70px; border-radius: 50%; background: conic-gradient(${conicGradientParts.join(', ')}); position: relative; box-shadow: 0 0 6px rgba(0,0,0,0.5);">
              <div style="position: absolute; top: 15%; left: 15%; width: 70%; height: 70%; background: var(--bg-card); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                <div style="font-size: 0.72rem; font-weight: 800; color: var(--text-main);">${authors[0] ? authors[0].share + '%' : '0%'}</div>
              </div>
            </div>
          </div>
          <div style="flex: 1.5; max-height: 120px; overflow-y: auto; padding-right: 2px;">
            ${shareBars}
          </div>
        </div>
      </div>
    `;

    // 2. Token Cost
    const costData = stats.tokenCost[tf] || [];
    const maxCost = Math.max(...costData.map(d => d.inputPrice + d.outputPrice), 0.1);
    const tokenCostTile = `
      <div class="glass-panel dashboard-tile" style="padding: 3px; margin: 0; background: var(--bg-card); border-radius: 6px; border: 1px solid var(--border-color); overflow-y: auto; max-height: 180px;">
        <h5 style="color: var(--text-main); margin-bottom: 3px; font-size: 0.75rem; padding: 2px;"><i class="fa-solid fa-tags" style="color:var(--accent-amber); margin-right:4px;"></i> Token Cost Rates</h5>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.7rem;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); text-align: left;">
              <th style="padding: 3px;">Model ID</th>
              <th style="padding: 3px; width: 40%;">In/Out Rel</th>
            </tr>
          </thead>
          <tbody>
            ${costData.slice(0, 5).map(item => {
              const inPct = (item.inputPrice / maxCost) * 100;
              const outPct = (item.outputPrice / maxCost) * 100;
              return `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 3px; font-weight:700; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80px;" title="${item.model}">${item.model}</td>
                <td style="padding: 3px;">
                  <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; display: flex; overflow: hidden;">
                    <div style="width: ${inPct}%; background: var(--accent-emerald);" title="In: $${item.inputPrice}"></div>
                    <div style="width: ${outPct}%; background: var(--accent-cyan);" title="Out: $${item.outputPrice}"></div>
                  </div>
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    `;

    // 3. Model Usage
    const usageData = stats.usage["All Users"]?.[tf] || [];
    const modelColors = { "deepseek": "#d946ef", "qwen": "#6366f1", "mimo": "#06b6d4", "glm": "#f59e0b", "Other": "#10b981" };
    let usageBarsHtml = '';
    usageData.forEach(day => {
      let segments = day.segments || [];
      let totalTokens = segments.reduce((sum, s) => sum + (s.value || 0), 0);
      let segmentsHtml = '';
      const chartHeight = 80;
      segments.forEach((seg, idx) => {
        const pct = totalTokens > 0 ? seg.value / totalTokens : 0;
        let cKey = "Other";
        Object.keys(modelColors).forEach(k => { if (seg.model.toLowerCase().includes(k)) cKey = k; });
        const color = modelColors[cKey];
        if (pct > 0) {
          segmentsHtml = `<div style="height: ${pct * chartHeight}px; background: ${color};" title="${seg.model}: ${seg.value}"></div>` + segmentsHtml;
        }
      });
      usageBarsHtml += `
        <div style="display: flex; flex-direction: column; justify-content: flex-end; width: ${100/usageData.length}%; height: 100%;">
          <div style="width: 80%; margin: 0 auto; display: flex; flex-direction: column; gap: 1px;">
            ${segmentsHtml}
          </div>
        </div>
      `;
    });
    
    const usageTile = `
      <div class="glass-panel dashboard-tile" style="padding: 3px; margin: 0; background: var(--bg-card); border-radius: 6px; border: 1px solid var(--border-color);">
        <h5 style="color: var(--text-main); margin-bottom: 3px; font-size: 0.75rem; padding: 2px;"><i class="fa-solid fa-chart-column" style="color:var(--accent-cyan); margin-right:4px;"></i> Model Usage (7D)</h5>
        <div style="display: flex; align-items: flex-end; height: 90px; padding-bottom: 3px; border-bottom: 1px solid rgba(255,255,255,0.08);">
          ${usageBarsHtml}
        </div>
      </div>
    `;

    return `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; margin-bottom: 3px;">
        ${marketTile}
        ${tokenCostTile}
        ${usageTile}
      </div>
    `;
  }
}

window.DashboardViewHelper = DashboardViewHelper;

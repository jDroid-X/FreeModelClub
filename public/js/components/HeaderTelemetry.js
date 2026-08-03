/**
 * HeaderTelemetry.js
 * Purpose: Header Telemetry Row component rendering active model metrics, tokens, latency & cost.
 *          Dynamically adapts background color, border glow, and text contrast to the active theme.
 */

class HeaderTelemetry {
  static async loadAndRender(selectedModelId) {
    try {
      const targetId = selectedModelId || window.app?.selectedModelId || localStorage.getItem('fmc_selected_model') || '';
      const stats = await ApiService.getHeaderStats(targetId);
      this.renderUI(stats);
      return stats;
    } catch (err) {
      console.warn("HeaderTelemetry load failed:", err);
    }
  }

  static renderUI(stats) {
    const el = document.getElementById('header-telemetry-row');
    if (!el || !stats) return;

    const fmt = (num) => {
      if (!num) return '0';
      if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
      if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      return num.toString();
    };

    const tileStyle = `display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 4px 10px; min-width: 95px; background: var(--tile-glow-bg, var(--bg-card)); border: 1px solid var(--border-glow, var(--border-color)); box-shadow: 0 0 10px var(--border-glow, var(--tile-shadow)); border-radius: 6px; text-align: center; cursor: pointer; transition: background 0.3s ease, border-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;`;

    el.innerHTML = `
      <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: stretch; justify-content: flex-start; width: 100%;">
        <!-- Row 1: Counts & Credits -->
        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:providers')"
          title="Click to view provider report">
          <div class="metric-label" style="display: flex; align-items: center; gap: 4px; color: var(--text-muted); font-size: 0.65rem; font-weight: 700;">
            <i class="fa-solid fa-server" style="color: var(--accent-cyan);"></i>
            <span>Providers:</span>
          </div>
          <span class="metric-value" style="font-size: 1.25rem; font-weight: 500; color: var(--text-main); line-height: 1.2;">${stats.totalProviders || 0}</span>
        </div>

        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:modelClubs')"
          title="Click to view model club report">
          <div class="metric-label" style="display: flex; align-items: center; gap: 4px; color: var(--text-muted); font-size: 0.65rem; font-weight: 500;">
            <i class="fa-solid fa-users" style="color: var(--primary-light);"></i>
            <span>Model Clubs:</span>
          </div>
          <span class="metric-value" style="font-size: 1.25rem; font-weight: 500; color: var(--text-main); line-height: 1.2;">${stats.totalModelClubs || 0}</span>
        </div>

        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:models')"
          title="Click to view model report">
          <div class="metric-label" style="display: flex; align-items: center; gap: 4px; color: var(--text-muted); font-size: 0.65rem; font-weight: 500;">
            <i class="fa-solid fa-microchip" style="color: var(--accent-amber);"></i>
            <span>Models:</span>
          </div>
          <span class="metric-value" style="font-size: 1.25rem; font-weight: 500; color: var(--text-main); line-height: 1.2;">${stats.totalModels || 0}</span>
        </div>

        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:credits')"
          title="Click to view credits report">
          <div class="metric-label" style="display: flex; align-items: center; gap: 4px; color: var(--accent-emerald); font-size: 0.65rem; font-weight: 500;">
            <i class="fa-solid fa-coins" style="color: var(--accent-emerald);"></i>
            <span>Credits:</span>
          </div>
          <span class="metric-value" style="font-size: 1.25rem; font-weight: 500; color: var(--accent-emerald); line-height: 1.2;">${stats.totalCreditsSaved || '$0.00'}</span>
        </div>

        <!-- Row 2: Token Metrics -->
        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:tokensAvl')"
          title="Click to view available tokens report">
          <div class="metric-label" style="display: flex; align-items: center; gap: 4px; color: var(--text-muted); font-size: 0.65rem; font-weight: 500;">
            <i class="fa-solid fa-database" style="color: var(--primary-light);"></i>
            <span>Tokens Avl:</span>
          </div>
          <span class="metric-value" style="font-size: 1.25rem; font-weight: 500; color: var(--text-main); line-height: 1.2;">${fmt(stats.tokensAvl)}</span>
        </div>

        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:tokensCon')"
          title="Click to view consumed tokens report">
          <div class="metric-label" style="display: flex; align-items: center; gap: 4px; color: var(--text-muted); font-size: 0.65rem; font-weight: 500;">
            <i class="fa-solid fa-fire" style="color: var(--accent-rose);"></i>
            <span>Tokens Con:</span>
          </div>
          <span class="metric-value" style="font-size: 1.25rem; font-weight: 500; color: var(--text-main); line-height: 1.2;">${fmt(stats.tokensCon)}</span>
        </div>

        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:tokensBal')"
          title="Click to view token balance report">
          <div class="metric-label" style="display: flex; align-items: center; gap: 4px; color: var(--accent-emerald); font-size: 0.65rem; font-weight: 500;">
            <i class="fa-solid fa-scale-balanced" style="color: var(--accent-emerald);"></i>
            <span>Tokens Bal:</span>
          </div>
          <span class="metric-value" style="font-size: 1.25rem; font-weight: 500; color: var(--accent-emerald); line-height: 1.2;">${fmt(stats.tokensBal)}</span>
        </div>

        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:tokensUtilized')"
          title="Click to view token utilization report">
          <div class="metric-label" style="display: flex; align-items: center; gap: 4px; color: var(--text-muted); font-size: 0.65rem; font-weight: 500;">
            <i class="fa-solid fa-chart-pie" style="color: var(--accent-amber);"></i>
            <span>Tokens Utilized:</span>
          </div>
          <span class="metric-value" style="font-size: 1.25rem; font-weight: 500; color: var(--text-main); line-height: 1.2;">${stats.tokensUtilized || '0.00'}%</span>
        </div>
      </div>
    `;
  }

  static updateStagedMetadata(stagedCount = 0, poolTotal = 0) {
    const el = document.getElementById('header-telemetry-row');
    if (!el) return;

    const tiles = el.querySelectorAll('.metric-badge');
    tiles.forEach(tile => {
      const label = tile.querySelector('.metric-label span');
      if (label && label.textContent.trim().startsWith('Models')) {
        const valEl = tile.querySelector('.metric-value');
        if (valEl) {
          if (stagedCount > 0) {
            valEl.textContent = `${stagedCount} Staged`;
            valEl.style.color = 'var(--accent-emerald)';
            valEl.style.fontSize = '1.3rem';
            tile.style.borderColor = 'var(--accent-emerald)';
            tile.style.boxShadow = '0 0 10px var(--border-glow)';
          } else {
            this.loadAndRender();
          }
        }
      }
    });
  }
}

window.HeaderTelemetry = HeaderTelemetry;

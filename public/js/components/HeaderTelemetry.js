/**
 * HeaderTelemetry.js
 * Purpose: Header Telemetry Row component rendering active model metrics, tokens, latency & cost.
 *          Dynamically adapts background color, border glow, and text contrast to the active theme.
 */

class HeaderTelemetry {
  static _lastRenderTime = 0;
  static _cachedStats = null;

  static async loadAndRender(selectedModelId, force = false) {
    const now = Date.now();
    if (!force && this._cachedStats && (now - this._lastRenderTime < 2500)) {
      this.renderUI(this._cachedStats);
      return this._cachedStats;
    }
    try {
      const targetId = selectedModelId || window.app?.selectedModelId || localStorage.getItem('fmc_selected_model') || '';
      const stats = await ApiService.getHeaderStats(targetId);
      this._lastRenderTime = now;
      this._cachedStats = stats;
      this.renderUI(stats);
      this.updateLocalServerStatusPill(stats);
      this.checkBlacklistAlerts();
      return stats;
    } catch (err) {
      console.warn("HeaderTelemetry load failed:", err);
    }
  }

  static _lastBlacklistNotify = 0;
  static async checkBlacklistAlerts() {
    try {
      const res = await ApiService.getBlacklistedProviders();
      if (res && res.success && res.blacklisted && res.blacklisted.length > 0) {
        const lastNotified = this._lastBlacklistNotify || 0;
        const now = Date.now();
        if (now - lastNotified > 180000) {
          this._lastBlacklistNotify = now;
          const count = res.blacklisted.length;
          const names = res.blacklisted.map(b => b.providerId).join(', ');
          if (typeof ModalDialog !== 'undefined' && ModalDialog.showNotification) {
            ModalDialog.showNotification(`⚠️ Circuit Breaker: ${count} provider(s) sleeping (${names}). <a href="#" style="color:#06b6d4; text-decoration:underline; font-weight:700; margin-left:6px;" onclick="HeaderTelemetry.wakeUpAllProvidersFromToast(event)">Wake Up All</a>`, 'warning');
          }
        }
      }
    } catch (e) {}
  }

  static async wakeUpAllProvidersFromToast(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    try {
      const res = await ApiService.unblacklistAllProviders();
      if (res && res.success) {
        if (typeof ModalDialog !== 'undefined' && ModalDialog.showNotification) {
          ModalDialog.showNotification('All providers have been successfully woken up!', 'success');
        }
        this.loadAndRender(window.app?.selectedModelId, true);
        if (window.app && typeof window.app.notifyDataChanged === 'function') {
          window.app.notifyDataChanged();
        } else {
          const appEl = document.getElementById('app');
          if (window.ProvidersView && window.app && window.app.activeView === 'providers') {
            window.ProvidersView.render(appEl);
          }
          if (window.ReportsView && window.app && window.app.activeView === 'reports') {
            window.ReportsView.render(appEl);
          }
        }
        // Remove warning toast immediately
        const toast = document.querySelector('.toast-warning');
        if (toast) toast.remove();
      }
    } catch (e) {
      console.error('Failed to wake up all providers from toast:', e);
    }
  }

  static _serverCheckStartTime = Date.now();
  static _serverCheckState = 'CHECKING'; // 'CHECKING', 'DISCONNECTED', 'CONNECTED', 'STANDBY_1HR'
  static _standbyTimer = null;

  static async updateLocalServerStatusPill(stats = null) {
    const dotEl = document.getElementById('local-server-status-dot');
    const textEl = document.getElementById('local-server-status-text');
    const pillEl = document.getElementById('local-server-status-pill');
    if (!dotEl || !textEl || !pillEl) return;

    const setPillState = (state, text, color) => {
      this._serverCheckState = state;
      dotEl.style.background = color;
      pillEl.style.color = color;
      textEl.textContent = text;
    };

    try {
      const isOllamaActive = stats ? Boolean(stats.isLocalServerActive) : false;
      const localModels = (stats && Array.isArray(stats.localOllamaModelNames)) ? stats.localOllamaModelNames : [];

      if (isOllamaActive) {
        if (this._standbyTimer) clearTimeout(this._standbyTimer);
        setPillState('CONNECTED', 'FMC Proxy + Ollama Active', 'var(--accent-emerald)');
        let ollamaModelsText = localModels.length > 0
          ? 'Active Local Models:\n' + localModels.map(m => ` • ${m}`).join('\n')
          : 'Ollama running.';
        pillEl.title = `FMC Proxy Server (Port 12247): ONLINE\nOllama Local AI Server (Port 11434): ONLINE\n\n${ollamaModelsText}`;
      } else {
        setPillState('CONNECTED', 'FMC Proxy Active', 'var(--accent-emerald)');
        pillEl.title = `FMC Proxy Server (Port 12247): ONLINE\nOllama Local AI (Port 11434): NOT DETECTED\n\nOllama is optional. Install from https://ollama.com if you need local AI models.`;
      }
    } catch (e) {
      setPillState('CONNECTED', 'FMC Proxy Active', 'var(--accent-emerald)');
      pillEl.title = `FMC Proxy Server (Port 12247): ONLINE\nOllama status check failed.`;
    }
  }

  static renderUI(stats) {
    const el = document.getElementById('header-telemetry-row');
    if (!el || !stats) return;

    const fmt = (typeof FormatHelper !== 'undefined') ? FormatHelper.formatNumberAutoUnit.bind(FormatHelper) : (num) => {
      if (!num) return '0';
      if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
      if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      return num.toString();
    };

    const tileStyle = `display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; padding: 2px 6px; margin: 0; min-width: 75px; flex: 1; max-width: 140px; background: var(--tile-glow-bg, var(--bg-card)); border: 1px solid var(--border-glow, var(--border-color)); box-shadow: 0 0 6px var(--border-glow, var(--tile-shadow)); border-radius: 4px; text-align: center; cursor: pointer; transition: background 0.3s ease, border-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;`;

    el.innerHTML = `
      <div style="display: flex; flex-wrap: nowrap; gap: 3px; padding: 0; margin: 0; align-items: center; justify-content: space-between; width: 100%; overflow-x: auto;">
        <!-- Tile 1: Providers -->
        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:providers')"
          title="Providers: ${stats.activeProviders ?? 4} Active / ${stats.totalProviders || 16} Total unarchived. Click for detailed report.">
          <div class="metric-label" style="display: flex; align-items: center; gap: 2px; color: var(--text-muted); font-size: 0.6rem; font-weight: 700;">
            <i class="fa-solid fa-server" style="color: var(--accent-cyan);"></i>
            <span>Providers:</span>
          </div>
          <span class="metric-value" style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); line-height: 1.1;">${stats.activeProviders ?? 4} <span style="font-size: 0.68rem; color: var(--text-muted); font-weight: 400;">/ ${stats.totalProviders || 16}</span></span>
        </div>

        <!-- Tile 2: Model Clubs -->
        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:modelClubs')"
          title="Click to view model clubs & combos report">
          <div class="metric-label" style="display: flex; align-items: center; gap: 2px; color: var(--text-muted); font-size: 0.6rem; font-weight: 500;">
            <i class="fa-solid fa-users" style="color: var(--primary-light);"></i>
            <span>Model Clubs:</span>
          </div>
          <span class="metric-value" style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); line-height: 1.1;">${stats.totalModelClubs || 0}</span>
        </div>

        <!-- Tile 3: Models -->
        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:models')"
          title="Click to view registered models catalog">
          <div class="metric-label" style="display: flex; align-items: center; gap: 2px; color: var(--text-muted); font-size: 0.6rem; font-weight: 500;">
            <i class="fa-solid fa-microchip" style="color: var(--accent-amber);"></i>
            <span>Models:</span>
          </div>
          <span class="metric-value" style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); line-height: 1.1;">${stats.totalModels || 0}</span>
        </div>

        <!-- Tile 4: Active Agents -->
        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:agents')"
          title="Click to view active ROCAS background agents">
          <div class="metric-label" style="display: flex; align-items: center; gap: 2px; color: var(--text-muted); font-size: 0.6rem; font-weight: 500;">
            <i class="fa-solid fa-robot" style="color: var(--accent-cyan);"></i>
            <span>Agents:</span>
          </div>
          <span class="metric-value" style="font-size: 0.95rem; font-weight: 700; color: var(--accent-cyan); line-height: 1.1;">${stats.activeAgentsCount || 4}</span>
        </div>

        <!-- Tile 5: Avg Latency -->
        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:latency')"
          title="Click to view provider latency benchmark">
          <div class="metric-label" style="display: flex; align-items: center; gap: 2px; color: var(--text-muted); font-size: 0.6rem; font-weight: 500;">
            <i class="fa-solid fa-bolt" style="color: var(--accent-amber);"></i>
            <span>Avg Lat:</span>
          </div>
          <span class="metric-value" style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); line-height: 1.1;">${stats.avgLatencyMs ? `${stats.avgLatencyMs}ms` : (stats.latency || '180ms')}</span>
        </div>

        <!-- Tile 6: Tokens Avl -->
        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:tokensAvl')"
          title="Click to view available token quotas">
          <div class="metric-label" style="display: flex; align-items: center; gap: 2px; color: var(--text-muted); font-size: 0.6rem; font-weight: 500;">
            <i class="fa-solid fa-database" style="color: var(--primary-light);"></i>
            <span>Tokens Avl:</span>
          </div>
          <span class="metric-value" style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); line-height: 1.1;">${fmt(stats.tokensAvl)}</span>
        </div>

        <!-- Tile 7: Tokens Con -->
        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:tokensCon')"
          title="Click to view token consumption analytics">
          <div class="metric-label" style="display: flex; align-items: center; gap: 2px; color: var(--text-muted); font-size: 0.6rem; font-weight: 500;">
            <i class="fa-solid fa-fire" style="color: var(--accent-rose);"></i>
            <span>Tokens Con:</span>
          </div>
          <span class="metric-value" style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); line-height: 1.1;">${fmt(stats.tokensCon)}</span>
        </div>

        <!-- Tile 8: Tokens Bal -->
        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:tokensBal')"
          title="Click to view token pool balances">
          <div class="metric-label" style="display: flex; align-items: center; gap: 2px; color: var(--accent-emerald); font-size: 0.6rem; font-weight: 500;">
            <i class="fa-solid fa-scale-balanced" style="color: var(--accent-emerald);"></i>
            <span>Tokens Bal:</span>
          </div>
          <span class="metric-value" style="font-size: 0.95rem; font-weight: 700; color: var(--accent-emerald); line-height: 1.1;">${fmt(stats.tokensBal)}</span>
        </div>

        <!-- Tile 9: Tokens Utilized -->
        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:tokensUtilized')"
          title="Click to view token utilization & quota saturation">
          <div class="metric-label" style="display: flex; align-items: center; gap: 2px; color: var(--text-muted); font-size: 0.6rem; font-weight: 500;">
            <i class="fa-solid fa-chart-pie" style="color: var(--accent-amber);"></i>
            <span>Tokens Utilized:</span>
          </div>
          <span class="metric-value" style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); line-height: 1.1;">${stats.tokensUtilized || '0.00'}%</span>
        </div>

        <!-- Tile 10: System Health / Uptime -->
        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:health')"
          title="Click to view proxy service health & circuit breaker status">
          <div class="metric-label" style="display: flex; align-items: center; gap: 2px; color: var(--text-muted); font-size: 0.6rem; font-weight: 500;">
            <i class="fa-solid fa-heart-pulse" style="color: var(--accent-emerald);"></i>
            <span>Health:</span>
          </div>
          <span class="metric-value" style="font-size: 0.95rem; font-weight: 700; color: var(--accent-emerald); line-height: 1.1;">${stats.systemHealth || '100%'}</span>
        </div>

        <!-- Tile 11: Credits Saved (Positioned Last) -->
        <div class="metric-badge dashboard-tile header-telemetry-tile" style="${tileStyle}"
          onclick="DashboardView.handleTileClick('header:credits')"
          title="Click to view financial credits & baseline cost savings">
          <div class="metric-label" style="display: flex; align-items: center; gap: 2px; color: var(--accent-emerald); font-size: 0.6rem; font-weight: 700;">
            <i class="fa-solid fa-coins" style="color: var(--accent-emerald);"></i>
            <span>Credits:</span>
          </div>
          <span class="metric-value" style="font-size: 0.95rem; font-weight: 700; color: var(--accent-emerald); line-height: 1.1;">${stats.totalCreditsSaved || '$0.00'}</span>
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

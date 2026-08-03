/**
 * SettingsUiUxHelper.js
 * Purpose: Helper for SettingsView UI/UX Tab — screen layout inspector, save/reset/apply config.
 * Dependencies: SettingsViewHelper, ModalDialog
 */

class SettingsUiUxHelper {
  static _screens = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'playground', name: 'Playground Chat' },
    { id: 'registration', name: 'Provider Onboarding' },
    { id: 'config', name: 'Integration Snippets' },
    { id: 'providers', name: 'Active Providers' },
    { id: 'model-club', name: 'Model Club & Combos' },
    { id: 'settings', name: 'System Settings' },
    { id: 'reports', name: 'Reports & Audit' },
    { id: 'manual', name: 'User Manual & Guide' }
  ];

  static _screenSpecialProps = {
    dashboard: 'Grid Layout: 2-Row Grid • Tiles: 4-Tile Stat Grid • Max Telemetry Rows: 10',
    playground: '3-Panel Split: 15% Left Rail, Center Chat Window, 300px Right Parameters Drawer • Max Input Height: 120px',
    registration: '2-Column Split: Form Width 60%, Right Integration Code Drawer 300px',
    config: 'Code Drawer Sizing: 350px • Font: Monospace Code • Copy Button Placement: Top Right',
    providers: 'Card Grid Columns: 3 Columns • Ping Latency Threshold: 200ms',
    'model-club': 'Taxonomy Grid Columns: 3 Columns • Filter Bar Position: Top',
    settings: '2-Column Layout: 20% Left TOC Rail + 80% Right Detail Content Pane',
    reports: 'Log Stream Terminal Height: 400px • Log Font Size: 12px • Auto-Scroll: Enabled',
    manual: '20% Left TOC Navigation Rail • Accordion Expand Animation: 0.3s'
  };

  static renderTab(container, selectedScreenId) {
    const schemas = SettingsViewHelper.getDefaultScreenSchemas();
    const savedConfig = JSON.parse(localStorage.getItem('fmc_uiux_config') || '{}');
    const screenId = selectedScreenId || 'dashboard';
    const cfg = savedConfig[screenId] || schemas[screenId] || schemas.dashboard;

    container.innerHTML = `
      <div style="display:flex;gap:14px;align-items:flex-start;">
        <div class="glass-card" style="width:25%;min-width:150px;padding:8px;display:flex;flex-direction:column;gap:4px;">
          <div style="font-size:0.75rem;font-weight:700;color:var(--primary-light);margin-bottom:4px;border-bottom:1px solid var(--border-color);padding-bottom:4px;">Select Target Screen:</div>
          ${this._screens.map(s => `
            <button class="btn ${screenId === s.id ? 'btn-primary' : 'btn-secondary'} btn-xs"
              style="text-align:left;font-size:0.74rem;justify-content:flex-start;"
              onclick="SettingsView.selectedUiUxScreen='${s.id}'; SettingsUiUxHelper.renderTab(document.getElementById('settings-tab-content'),'${s.id}');">
              <i class="fa-solid ${screenId === s.id ? 'fa-pen-to-square' : 'fa-desktop'}" style="margin-right:6px;"></i> ${s.name}
            </button>`).join('')}
        </div>
        <div class="glass-card" style="flex:1;padding:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h4 style="font-size:0.98rem;color:var(--accent-cyan);margin:0;"><i class="fa-solid fa-sliders"></i> Layout Inspector: ${cfg.name.toUpperCase()}</h4>
            <span class="badge badge-emerald">UI/UX Agent Hydrated</span>
          </div>
          <form id="uiux-screen-form" onsubmit="event.preventDefault(); SettingsUiUxHelper.saveConfig('${screenId}');">
            <div style="font-size:0.78rem;font-weight:700;color:var(--primary-light);margin-bottom:6px;">1. Panel Layout Dimensions:</div>
            <div class="grid-2" style="gap:8px;margin-bottom:12px;">
              <div class="form-group" style="margin-bottom:0;">
                <label style="font-size:0.75rem;">Left Rail Width % (10-30%):</label>
                <input type="number" id="cfg-left-rail-pct" class="form-control" style="font-size:0.75rem;" min="10" max="30" value="${cfg.leftRailWidthPct || 15}" required />
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label style="font-size:0.75rem;">Center Window Min-Width (px):</label>
                <input type="number" id="cfg-center-min-px" class="form-control" style="font-size:0.75rem;" min="200" max="600" value="${cfg.centerMinWidthPx || 300}" required />
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label style="font-size:0.75rem;">Right Drawer Width (px):</label>
                <input type="number" id="cfg-right-drawer-px" class="form-control" style="font-size:0.75rem;" min="200" max="500" value="${cfg.rightDrawerWidthPx || 300}" required />
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label style="font-size:0.75rem;">Slide Animation Speed (sec):</label>
                <input type="number" id="cfg-anim-speed-sec" class="form-control" style="font-size:0.75rem;" step="0.1" min="0.1" max="1.0" value="${cfg.accordionExpandSpeedSec || 0.3}" required />
              </div>
            </div>
            <div style="font-size:0.78rem;font-weight:700;color:var(--primary-light);margin-bottom:6px;">2. Element Styling:</div>
            <div class="grid-2" style="gap:8px;margin-bottom:12px;">
              <div class="form-group" style="margin-bottom:0;">
                <label style="font-size:0.75rem;">Base Font Size (px):</label>
                <input type="number" id="cfg-font-size-px" class="form-control" style="font-size:0.75rem;" min="11" max="20" value="${cfg.fontSizePx || 14}" required />
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label style="font-size:0.75rem;">Inner Card Padding (px):</label>
                <input type="number" id="cfg-card-padding-px" class="form-control" style="font-size:0.75rem;" min="6" max="32" value="${cfg.cardPaddingPx || 12}" required />
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label style="font-size:0.75rem;">Glass Transparency (0.1-1.0):</label>
                <input type="number" id="cfg-glass-opacity" class="form-control" style="font-size:0.75rem;" step="0.05" min="0.1" max="1.0" value="${cfg.glassOpacity || 0.85}" required />
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label style="font-size:0.75rem;">Border Radius (px):</label>
                <input type="number" id="cfg-border-radius-px" class="form-control" style="font-size:0.75rem;" min="0" max="24" value="${cfg.borderRadiusPx || 8}" required />
              </div>
            </div>
            <div style="font-size:0.78rem;font-weight:700;color:var(--primary-light);margin-bottom:6px;">3. Screen Specialized Controls:</div>
            <div style="background:rgba(0,0,0,0.2);padding:8px;border-radius:6px;margin-bottom:12px;font-size:0.75rem;color:var(--text-muted);">
              ${this._screenSpecialProps[screenId] || 'Standard layout applies.'}
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="SettingsUiUxHelper.resetConfig('${screenId}')">
                <i class="fa-solid fa-rotate-left"></i> Reset Defaults
              </button>
              <button type="submit" class="btn btn-primary btn-sm">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Apply &amp; Save Screen Layout
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  static saveConfig(screenId) {
    const schemas = SettingsViewHelper.getDefaultScreenSchemas();
    const current = schemas[screenId] || schemas.dashboard;
    const savedConfig = JSON.parse(localStorage.getItem('fmc_uiux_config') || '{}');

    savedConfig[screenId] = {
      ...current,
      leftRailWidthPct: parseInt(document.getElementById('cfg-left-rail-pct').value, 10),
      centerMinWidthPx: parseInt(document.getElementById('cfg-center-min-px').value, 10),
      rightDrawerWidthPx: parseInt(document.getElementById('cfg-right-drawer-px').value, 10),
      fontSizePx: parseInt(document.getElementById('cfg-font-size-px').value, 10),
      cardPaddingPx: parseInt(document.getElementById('cfg-card-padding-px').value, 10),
      glassOpacity: parseFloat(document.getElementById('cfg-glass-opacity').value),
      borderRadiusPx: parseInt(document.getElementById('cfg-border-radius-px').value, 10),
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('fmc_uiux_config', JSON.stringify(savedConfig));
    this.applyLayout(screenId);
    ModalDialog.showNotification(`UI/UX Agent updated layout for '${screenId.toUpperCase()}'!`, 'success');
  }

  static resetConfig(screenId) {
    const savedConfig = JSON.parse(localStorage.getItem('fmc_uiux_config') || '{}');
    delete savedConfig[screenId];
    localStorage.setItem('fmc_uiux_config', JSON.stringify(savedConfig));
    ModalDialog.showNotification(`Reset layout settings for '${screenId.toUpperCase()}'.`, 'info');
    this.renderTab(document.getElementById('settings-tab-content'), screenId);
  }

  static applyLayout(screenId) {
    const schemas = SettingsViewHelper.getDefaultScreenSchemas();
    const savedConfig = JSON.parse(localStorage.getItem('fmc_uiux_config') || '{}');
    const cfg = savedConfig[screenId] || schemas[screenId] || schemas.dashboard;
    const root = document.documentElement;
    if (cfg.leftRailWidthPct) root.style.setProperty('--left-rail-width', `${cfg.leftRailWidthPct}%`);
    if (cfg.rightDrawerWidthPx) root.style.setProperty('--right-drawer-width', `${cfg.rightDrawerWidthPx}px`);
    if (cfg.fontSizePx) root.style.setProperty('--base-font-size', `${cfg.fontSizePx}px`);
    if (cfg.cardPaddingPx) root.style.setProperty('--card-padding', `${cfg.cardPaddingPx}px`);
    if (cfg.glassOpacity) root.style.setProperty('--glass-opacity', `${cfg.glassOpacity}`);
    if (cfg.borderRadiusPx) root.style.setProperty('--border-radius', `${cfg.borderRadiusPx}px`);
  }
}

window.SettingsUiUxHelper = SettingsUiUxHelper;

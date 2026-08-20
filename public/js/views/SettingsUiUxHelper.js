/**
 * SettingsUiUxHelper.js
 * Purpose: Helper for SettingsView UI/UX Tab — screen layout inspector, save/reset/apply config.
 * Dependencies: SettingsViewHelper, ModalDialog
 */

class SettingsUiUxHelper {
  static _screens = [
    { id: 'universal', name: '🌍 Universal Layout (App-Wide Defaults)', icon: 'fa-globe' },
    { id: 'dashboard', name: 'Dashboard View', icon: 'fa-chart-pie' },
    { id: 'playground', name: 'Playground Chat View', icon: 'fa-comments' },
    { id: 'registration', name: 'Provider Onboarding', icon: 'fa-plus-circle' },
    { id: 'config', name: 'Integration Snippets', icon: 'fa-code' },
    { id: 'providers', name: 'Active Providers Panel', icon: 'fa-network-wired' },
    { id: 'model-club', name: 'Model Club & Combos', icon: 'fa-cubes-stacked' },
    { id: 'settings', name: 'System Settings', icon: 'fa-sliders' },
    { id: 'reports', name: 'Reports & Diagnostics', icon: 'fa-file-waveform' },
    { id: 'manual', name: 'User Manual & Guide', icon: 'fa-book-open' }
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
    const screenId = selectedScreenId || 'universal';
    const cfg = savedConfig[screenId] || schemas[screenId] || schemas.universal;

    container.innerHTML = `
      <div style="display:flex;gap:14px;align-items:flex-start;">
        <!-- Left 20% Target Screen Selection Rail -->
        <div class="glass-card" style="width:24%;min-width:170px;padding:8px;display:flex;flex-direction:column;gap:4px;">
          <div style="font-size:0.75rem;font-weight:700;color:var(--primary-light);margin-bottom:4px;border-bottom:1px solid var(--border-color);padding-bottom:4px;display:flex;justify-content:space-between;align-items:center;">
            <span><i class="fa-solid fa-desktop"></i> Select Target Screen:</span>
          </div>
          ${this._screens.map(s => `
            <button class="btn ${screenId === s.id ? 'btn-primary' : 'btn-secondary'} btn-xs"
              style="text-align:left;font-size:0.74rem;justify-content:flex-start;${s.id === 'universal' ? 'border:1px solid var(--accent-amber); font-weight:700;' : ''}"
              onclick="SettingsView.selectedUiUxScreen='${s.id}'; SettingsUiUxHelper.renderTab(document.getElementById('settings-tab-content'),'${s.id}');">
              <i class="fa-solid ${s.icon || 'fa-desktop'}" style="margin-right:6px; color:${s.id === 'universal' ? 'var(--accent-amber)' : 'var(--accent-cyan)'}"></i> ${s.name}
            </button>`).join('')}
        </div>

        <!-- Right Detail Layout Inspector Workspace -->
        <div class="glass-card" style="flex:1;padding:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;border-bottom:1px solid var(--border-color);padding-bottom:6px;">
            <h4 style="font-size:0.95rem;color:var(--accent-cyan);margin:0;display:flex;align-items:center;gap:6px;">
              <i class="fa-solid ${this._screens.find(s => s.id === screenId)?.icon || 'fa-sliders'}"></i> ${cfg.name.toUpperCase()}
            </h4>
            <span class="badge ${screenId === 'universal' ? 'badge-amber' : 'badge-emerald'}" style="font-size:0.7rem;">
              ${screenId === 'universal' ? '🌍 App-Wide Master Default' : 'Screen Specific Override'}
            </span>
          </div>

          <form id="uiux-screen-form" onsubmit="event.preventDefault(); SettingsUiUxHelper.saveConfig('${screenId}');">
            
            <!-- 1 ROW 2 COLUMN LAYOUT FOR GROUP 1 AND GROUP 2 -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
              
              <!-- GROUP 1: Panel Layout Dimensions -->
              <div class="glass-panel" style="padding:10px; background:rgba(0,0,0,0.2); margin-bottom:0;">
                <div style="font-size:0.78rem;font-weight:700;color:var(--accent-cyan);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                  <i class="fa-solid fa-table-columns"></i> Group 1: Panel Layout Dimensions
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:0.72rem;display:flex;justify-content:space-between;">
                      <span>Left Rail Width: <strong id="lbl-left-rail-pct">${cfg.leftRailWidthPct || 20}%</strong></span>
                    </label>
                    <input type="range" id="cfg-left-rail-pct" class="form-range" min="10" max="35" value="${cfg.leftRailWidthPct || 20}"
                      oninput="document.getElementById('lbl-left-rail-pct').textContent = this.value + '%'" />
                  </div>

                  <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:0.72rem;display:flex;justify-content:space-between;">
                      <span>Center Min-Width: <strong id="lbl-center-min-px">${cfg.centerMinWidthPx || 320}px</strong></span>
                    </label>
                    <input type="range" id="cfg-center-min-px" class="form-range" min="200" max="600" step="10" value="${cfg.centerMinWidthPx || 320}"
                      oninput="document.getElementById('lbl-center-min-px').textContent = this.value + 'px'" />
                  </div>

                  <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:0.72rem;display:flex;justify-content:space-between;">
                      <span>Right Drawer Width: <strong id="lbl-right-drawer-px">${cfg.rightDrawerWidthPx || 300}px</strong></span>
                    </label>
                    <input type="range" id="cfg-right-drawer-px" class="form-range" min="200" max="500" step="10" value="${cfg.rightDrawerWidthPx || 300}"
                      oninput="document.getElementById('lbl-right-drawer-px').textContent = this.value + 'px'" />
                  </div>

                  <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:0.72rem;display:flex;justify-content:space-between;">
                      <span>Slide Animation Speed: <strong id="lbl-anim-speed-sec">${cfg.accordionExpandSpeedSec || 0.3}s</strong></span>
                    </label>
                    <input type="range" id="cfg-anim-speed-sec" class="form-range" min="0.1" max="1.0" step="0.05" value="${cfg.accordionExpandSpeedSec || 0.3}"
                      oninput="document.getElementById('lbl-anim-speed-sec').textContent = this.value + 's'" />
                  </div>
                </div>
              </div>

              <!-- GROUP 2: Element Styling & Typography -->
              <div class="glass-panel" style="padding:10px; background:rgba(0,0,0,0.2); margin-bottom:0;">
                <div style="font-size:0.78rem;font-weight:700;color:var(--accent-emerald);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                  <i class="fa-solid fa-font"></i> Group 2: Crystal-Clear Typography &amp; Styling
                </div>
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:0.72rem;display:flex;justify-content:space-between;">
                      <span>Online Crystal-Clear Font (12 Options):</span>
                    </label>
                    <select id="cfg-font-family" class="form-control" style="font-size:0.72rem; padding:3px 6px;" onchange="SettingsUiUxHelper.onFontPreviewChange(this.value)">
                      <option value="System" ${cfg.fontFamily === 'System' || !cfg.fontFamily ? 'selected' : ''}>🖥️ System Default Native Font (Clean OS Standard)</option>
                      <option value="Inter" ${cfg.fontFamily === 'Inter' ? 'selected' : ''}>✨ Inter (High-Clarity Universal UI Standard)</option>
                      <option value="Outfit" ${cfg.fontFamily === 'Outfit' ? 'selected' : ''}>💎 Outfit (Modern Luxury Geometric Display)</option>
                      <option value="Plus Jakarta Sans" ${cfg.fontFamily === 'Plus Jakarta Sans' ? 'selected' : ''}>🚀 Plus Jakarta Sans (Crisp Ultra-Legible Tech)</option>
                      <option value="Roboto" ${cfg.fontFamily === 'Roboto' ? 'selected' : ''}>⚡ Roboto (Material Design Precision Standard)</option>
                      <option value="Space Grotesk" ${cfg.fontFamily === 'Space Grotesk' ? 'selected' : ''}>🪐 Space Grotesk (Tech & Cyberpunk Clarity)</option>
                      <option value="JetBrains Mono" ${cfg.fontFamily === 'JetBrains Mono' ? 'selected' : ''}>💻 JetBrains Mono (Crystal Monospace Code)</option>
                      <option value="Fira Code" ${cfg.fontFamily === 'Fira Code' ? 'selected' : ''}>⌨️ Fira Code (Programming Ligatures Standard)</option>
                      <option value="Manrope" ${cfg.fontFamily === 'Manrope' ? 'selected' : ''}>🌟 Manrope (Warm Geometric Modern UI)</option>
                      <option value="DM Sans" ${cfg.fontFamily === 'DM Sans' ? 'selected' : ''}>📖 DM Sans (Low Eye Fatigue High Readability)</option>
                      <option value="Sora" ${cfg.fontFamily === 'Sora' ? 'selected' : ''}>🛸 Sora (Futuristic High-Density Sans)</option>
                    </select>
                  </div>

                  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
                    <div class="form-group" style="margin-bottom:0;">
                      <label style="font-size:0.7rem;display:flex;justify-content:space-between;">
                        <span>Base Size: <strong id="lbl-font-size-px">${cfg.fontSizePx || 14}px</strong></span>
                      </label>
                      <input type="range" id="cfg-font-size-px" class="form-range" min="11" max="18" value="${cfg.fontSizePx || 14}"
                        oninput="document.getElementById('lbl-font-size-px').textContent = this.value + 'px'" />
                    </div>

                    <div class="form-group" style="margin-bottom:0;">
                      <label style="font-size:0.7rem;display:flex;justify-content:space-between;">
                        <span>Weight:</span>
                      </label>
                      <select id="cfg-font-weight" class="form-control" style="font-size:0.7rem; padding:2px 4px;">
                        <option value="300" ${cfg.fontWeight === '300' ? 'selected' : ''}>300 Light</option>
                        <option value="400" ${cfg.fontWeight === '400' || !cfg.fontWeight ? 'selected' : ''}>400 Regular</option>
                        <option value="500" ${cfg.fontWeight === '500' ? 'selected' : ''}>500 Medium</option>
                        <option value="600" ${cfg.fontWeight === '600' ? 'selected' : ''}>600 SemiBold</option>
                        <option value="700" ${cfg.fontWeight === '700' ? 'selected' : ''}>700 Bold</option>
                      </select>
                    </div>
                  </div>

                  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
                    <div class="form-group" style="margin-bottom:0;">
                      <label style="font-size:0.7rem;display:flex;justify-content:space-between;">
                        <span>Spacing: <strong id="lbl-letter-spacing-px">${cfg.letterSpacingPx || -0.2}px</strong></span>
                      </label>
                      <input type="range" id="cfg-letter-spacing-px" class="form-range" min="-1" max="2" step="0.1" value="${cfg.letterSpacingPx || -0.2}"
                        oninput="document.getElementById('lbl-letter-spacing-px').textContent = this.value + 'px'" />
                    </div>

                    <div class="form-group" style="margin-bottom:0;">
                      <label style="font-size:0.7rem;display:flex;justify-content:space-between;">
                        <span>Line Height: <strong id="lbl-line-height">${cfg.lineHeight || 1.45}</strong></span>
                      </label>
                      <input type="range" id="cfg-line-height" class="form-range" min="1.2" max="1.8" step="0.05" value="${cfg.lineHeight || 1.45}"
                        oninput="document.getElementById('lbl-line-height').textContent = this.value" />
                    </div>
                  </div>

                  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
                    <div class="form-group" style="margin-bottom:0;">
                      <label style="font-size:0.7rem;display:flex;justify-content:space-between;">
                        <span>Padding: <strong id="lbl-card-padding-px">${cfg.cardPaddingPx || 12}px</strong></span>
                      </label>
                      <input type="range" id="cfg-card-padding-px" class="form-range" min="2" max="24" value="${cfg.cardPaddingPx || 12}"
                        oninput="document.getElementById('lbl-card-padding-px').textContent = this.value + 'px'" />
                    </div>

                    <div class="form-group" style="margin-bottom:0;">
                      <label style="font-size:0.7rem;display:flex;justify-content:space-between;">
                        <span>Blur: <strong id="lbl-backdrop-blur-px">${cfg.backdropBlurPx || 16}px</strong></span>
                      </label>
                      <input type="range" id="cfg-backdrop-blur-px" class="form-range" min="0" max="32" value="${cfg.backdropBlurPx || 16}"
                        oninput="document.getElementById('lbl-backdrop-blur-px').textContent = this.value + 'px'" />
                    </div>
                  </div>

                  <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:0.7rem;display:flex;justify-content:space-between;">
                      <span>Glass Opacity: <strong id="lbl-glass-opacity">${cfg.glassOpacity || 0.85}</strong></span>
                    </label>
                    <input type="range" id="cfg-glass-opacity" class="form-range" min="0.3" max="1.0" step="0.05" value="${cfg.glassOpacity || 0.85}"
                      oninput="document.getElementById('lbl-glass-opacity').textContent = this.value" />
                  </div>
                </div>
              </div>

            </div>

            <!-- GROUP 3: Screen Customization Controls (1 Row 2 Column Textboxes/Toggles) -->
            <div class="glass-panel" style="margin-bottom:12px; padding:10px; background:rgba(0,0,0,0.2); border-left:3px solid ${screenId === 'universal' ? 'var(--accent-amber)' : 'var(--accent-cyan)'};">
              <div style="font-size:0.78rem;font-weight:700;color:var(--primary-light);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                <i class="fa-solid ${screenId === 'universal' ? 'fa-globe' : 'fa-sliders'}" style="color:${screenId === 'universal' ? 'var(--accent-amber)' : 'var(--accent-cyan)'};"></i>
                Group 3: ${screenId === 'universal' ? 'App-Wide Universal Layout Defaults' : 'Screen-Specific Customization Controls'}
              </div>
              ${this._renderScreenSpecialControls(screenId, cfg)}
            </div>

            <div style="display:flex;gap:8px;justify-content:flex-end;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="SettingsUiUxHelper.resetConfig('${screenId}')">
                <i class="fa-solid fa-rotate-left"></i> Reset Defaults
              </button>
              <button type="submit" class="btn btn-primary btn-sm">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Apply &amp; Save ${screenId.toUpperCase()} Layout
              </button>
            </div>
          </form>

          <!-- Component Showcase & Closed-Loop Validation Sandbox -->
          <div style="margin-top:24px;border-top:1px solid var(--border-color);padding-top:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <h5 style="font-size:0.9rem;color:var(--text-main);margin:0;"><i class="fa-solid fa-flask"></i> Interactive Components & Validation Sandbox</h5>
            </div>
            <div class="grid-2" style="gap:16px;">
              
              <!-- Left: Textbox & Validation -->
              <div class="glass-panel" style="padding:12px;">
                <div style="font-size:0.75rem;font-weight:700;color:var(--primary-light);margin-bottom:8px;">Validated Textbox</div>
                <div id="sandbox-textbox-wrapper"></div>
                <button class="btn btn-emerald btn-sm mt-2" style="width:100%;" onclick="SettingsUiUxHelper.testValidation()">
                  <i class="fa-solid fa-check-double"></i> Trigger Backend Validation Check
                </button>
              </div>

              <!-- Right: List Box & Dialog Options -->
              <div class="glass-panel" style="padding:12px;">
                <div style="font-size:0.75rem;font-weight:700;color:var(--primary-light);margin-bottom:8px;">List Box & Dialog Trigger</div>
                <div id="sandbox-listbox-wrapper"></div>
                <button class="btn btn-secondary btn-sm mt-2" style="width:100%;" onclick="SettingsUiUxHelper.triggerOptionDialog()">
                  <i class="fa-solid fa-layer-group"></i> Show Interactive Dialog Options
                </button>
              </div>

            </div>

            <!-- Local Model Server & Port Settings Card -->
            <div class="glass-panel" style="margin-top:16px; padding:14px; border-left: 3px solid var(--accent-emerald);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h5 style="font-size:0.88rem; color:var(--accent-emerald); margin:0;"><i class="fa-solid fa-server"></i> Local Model Server & Port Settings</h5>
                <span class="badge badge-emerald" style="font-size:0.68rem;">Fast 400ms Socket Health Check</span>
              </div>
              <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:10px;">
                Configure the local model server port and default local model ID. FMC uses these settings to health-check local availability and auto-assign active models.
              </p>
              <div class="grid-2" style="gap:10px; margin-bottom:10px;">
                <div class="form-group" style="margin-bottom:0;">
                  <label style="font-size:0.75rem; font-weight:700; color:var(--accent-cyan);">Local Server Port (Default: 11434):</label>
                  <input type="number" id="local-server-port-input" class="form-control" style="font-size:0.75rem;" value="${localStorage.getItem('fmc_local_server_port') || 11434}" />
                </div>
                <div class="form-group" style="margin-bottom:0;">
                  <label style="font-size:0.75rem; font-weight:700; color:var(--accent-amber);">Default Local Model ID:</label>
                  <input type="text" id="local-model-id-input" class="form-control" style="font-size:0.75rem;" value="${localStorage.getItem('fmc_local_model_id') || 'llama3:latest'}" />
                </div>
              </div>
              <div style="display:flex; gap:8px; justify-content:flex-end;">
                <button class="btn btn-emerald btn-sm" onclick="SettingsUiUxHelper.saveLocalServerSettings()">
                  <i class="fa-solid fa-floppy-disk"></i> Save Local Server &amp; Port Settings
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    setTimeout(() => {
      const tbWrapper = document.getElementById('sandbox-textbox-wrapper');
      if (tbWrapper && typeof UiComponents !== 'undefined') {
        tbWrapper.innerHTML = UiComponents.renderValidatedTextbox({
          id: 'sandbox-api-key',
          label: 'Provider API Key',
          placeholder: 'sk-...',
          minLength: 10,
          required: true,
          helperText: 'Must be at least 10 chars. Will be checked by backend.'
        });
      }

      const lbWrapper = document.getElementById('sandbox-listbox-wrapper');
      if (lbWrapper && typeof ListBoxComponent !== 'undefined') {
        lbWrapper.innerHTML = ListBoxComponent.render({
          id: 'sandbox-list',
          items: [
            { id: 'item1', title: 'Orchestrator Agent', subtitle: 'Idle', icon: 'fa-robot', badge: 'Active', badgeClass: 'badge-emerald' },
            { id: 'item2', title: 'Provider Agent', subtitle: 'Syncing', icon: 'fa-server', badge: 'Warning', badgeClass: 'badge-amber' }
          ],
          height: '100px'
        });
      }
    }, 50);
  }

  static _renderScreenSpecialControls(screenId, cfg) {
    switch (screenId) {
      case 'universal':
        return `
          <div class="grid-2" style="gap:8px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-amber);">Micro-Animations &amp; Transitions:</label>
              <select id="cfg-spec-enable-anim" class="form-control" style="font-size:0.75rem;">
                <option value="true" ${cfg.enableAnimations !== false ? 'selected' : ''}>Enabled (Smooth Micro-Animations)</option>
                <option value="false" ${cfg.enableAnimations === false ? 'selected' : ''}>Disabled (Instant Jump)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-amber);">Border Glow Effects:</label>
              <select id="cfg-spec-enable-glow" class="form-control" style="font-size:0.75rem;">
                <option value="true" ${cfg.enableGlowEffects !== false ? 'selected' : ''}>Enabled (Neon Metal Border Glow)</option>
                <option value="false" ${cfg.enableGlowEffects === false ? 'selected' : ''}>Disabled (Flat Metal Border)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-amber);">Compact Layout Density Mode:</label>
              <select id="cfg-spec-compact-density" class="form-control" style="font-size:0.75rem;">
                <option value="true" ${cfg.compactDensityMode !== false ? 'selected' : ''}>Enabled (Ultra Compact Vertical)</option>
                <option value="false" ${cfg.compactDensityMode === false ? 'selected' : ''}>Disabled (Spacious Comfort)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-amber);">Header Telemetry Refresh Rate:</label>
              <select id="cfg-spec-telemetry-rate" class="form-control" style="font-size:0.75rem;">
                <option value="2.5" ${cfg.telemetryRefreshRateSec === 2.5 || !cfg.telemetryRefreshRateSec ? 'selected' : ''}>2.5 Seconds (Default)</option>
                <option value="5" ${cfg.telemetryRefreshRateSec === 5 ? 'selected' : ''}>5.0 Seconds</option>
                <option value="10" ${cfg.telemetryRefreshRateSec === 10 ? 'selected' : ''}>10.0 Seconds</option>
              </select>
            </div>
          </div>
        `;
      case 'dashboard':
        return `
          <div class="grid-2" style="gap:8px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Stat Grid Tiles Count:</label>
              <input type="number" id="cfg-spec-stat-tiles" class="form-control" style="font-size:0.75rem;" min="2" max="8" value="${cfg.statGridTiles || 4}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Max Telemetry Log Rows:</label>
              <input type="number" id="cfg-spec-telemetry-rows" class="form-control" style="font-size:0.75rem;" min="5" max="50" value="${cfg.maxTelemetryRows || 10}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Dashboard Auto-Refresh Rate (sec):</label>
              <input type="number" id="cfg-spec-dash-refresh" class="form-control" style="font-size:0.75rem;" min="5" max="120" value="${cfg.refreshIntervalSec || 15}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Model Table Rows per Page:</label>
              <input type="number" id="cfg-spec-dash-page-size" class="form-control" style="font-size:0.75rem;" min="10" max="100" value="${cfg.tablePageSize || 25}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Stat Tiles Grid Columns:</label>
              <select id="cfg-spec-dash-grid-cols" class="form-control" style="font-size:0.75rem;">
                <option value="4" ${cfg.gridCols === 4 || !cfg.gridCols ? 'selected' : ''}>4 Columns (Default)</option>
                <option value="3" ${cfg.gridCols === 3 ? 'selected' : ''}>3 Columns</option>
                <option value="2" ${cfg.gridCols === 2 ? 'selected' : ''}>2 Columns</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Show Pulse Animation Glow:</label>
              <select id="cfg-spec-dash-pulse" class="form-control" style="font-size:0.75rem;">
                <option value="true" ${cfg.pulseAnimation !== false ? 'selected' : ''}>Enabled</option>
                <option value="false" ${cfg.pulseAnimation === false ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
          </div>
        `;
      case 'playground':
        return `
          <div class="grid-2" style="gap:8px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Chat Textarea Max Height (px):</label>
              <input type="number" id="cfg-spec-textarea-height" class="form-control" style="font-size:0.75rem;" min="60" max="250" value="${cfg.chatTextareaMaxHeightPx || 120}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Chat Auto-Save Interval (sec):</label>
              <input type="number" id="cfg-spec-autosave-sec" class="form-control" style="font-size:0.75rem;" min="1" max="30" value="${cfg.autoSaveIntervalSec || 1.5}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Show Working Details Default:</label>
              <select id="cfg-spec-show-details" class="form-control" style="font-size:0.75rem;">
                <option value="true" ${cfg.showWorkingDetailsDefault !== false ? 'selected' : ''}>Enabled (Show Chain-of-Thought)</option>
                <option value="false" ${cfg.showWorkingDetailsDefault === false ? 'selected' : ''}>Disabled (Compact View)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Monospace Code Font in Chat:</label>
              <select id="cfg-spec-chat-mono" class="form-control" style="font-size:0.75rem;">
                <option value="true" ${cfg.monospaceCodeFont !== false ? 'selected' : ''}>Enabled (Fira Code)</option>
                <option value="false" ${cfg.monospaceCodeFont === false ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Message Bubble Padding (px):</label>
              <input type="number" id="cfg-spec-msg-padding" class="form-control" style="font-size:0.75rem;" min="4" max="20" value="${cfg.msgPaddingPx || 10}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Default System Prompt Persona:</label>
              <input type="text" id="cfg-spec-default-persona" class="form-control" style="font-size:0.75rem;" value="${cfg.defaultPersona || 'Senior Software Developer'}" />
            </div>
          </div>
        `;
      case 'registration':
        return `
          <div class="grid-2" style="gap:8px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Auto-Ping on Select:</label>
              <select id="cfg-spec-autoping" class="form-control" style="font-size:0.75rem;">
                <option value="true" ${cfg.autoPingOnSelect !== false ? 'selected' : ''}>Enabled</option>
                <option value="false" ${cfg.autoPingOnSelect === false ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Discovered Models Max Height (px):</label>
              <input type="number" id="cfg-spec-models-height" class="form-control" style="font-size:0.75rem;" min="80" max="300" value="${cfg.discoveredModelsMaxHeightPx || 140}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Registration Form Split Width %:</label>
              <input type="number" id="cfg-spec-form-split" class="form-control" style="font-size:0.75rem;" min="40" max="80" value="${cfg.formWidthPct || 60}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Auto-Extract LLM Specs on Paste:</label>
              <select id="cfg-spec-auto-extract" class="form-control" style="font-size:0.75rem;">
                <option value="true" ${cfg.autoExtractSpecs !== false ? 'selected' : ''}>Enabled (DuckDuckGo + LLM)</option>
                <option value="false" ${cfg.autoExtractSpecs === false ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
          </div>
        `;
      case 'config':
        return `
          <div class="grid-2" style="gap:8px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Default Code Language Tab:</label>
              <select id="cfg-spec-default-tab" class="form-control" style="font-size:0.75rem;">
                <option value="curl" ${cfg.defaultTab === 'curl' || !cfg.defaultTab ? 'selected' : ''}>cURL CLI</option>
                <option value="python" ${cfg.defaultTab === 'python' ? 'selected' : ''}>Python SDK</option>
                <option value="nodejs" ${cfg.defaultTab === 'nodejs' ? 'selected' : ''}>Node.js</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Snippet Code Line Height:</label>
              <input type="number" id="cfg-spec-line-height" class="form-control" style="font-size:0.75rem;" step="0.1" min="1.0" max="2.0" value="${cfg.lineHeightRatio || 1.4}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Copy Button Position:</label>
              <select id="cfg-spec-copy-pos" class="form-control" style="font-size:0.75rem;">
                <option value="Top Right" ${cfg.copyButtonPlacement === 'Top Right' || !cfg.copyButtonPlacement ? 'selected' : ''}>Top Right</option>
                <option value="Top Left" ${cfg.copyButtonPlacement === 'Top Left' ? 'selected' : ''}>Top Left</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Code Font Size (px):</label>
              <input type="number" id="cfg-spec-code-font-size" class="form-control" style="font-size:0.75rem;" min="10" max="18" value="${cfg.codeFontSizePx || 13}" />
            </div>
          </div>
        `;
      case 'providers':
        return `
          <div class="grid-2" style="gap:8px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Ping Latency Slow Threshold (ms):</label>
              <input type="number" id="cfg-spec-ping-thresh" class="form-control" style="font-size:0.75rem;" min="50" max="1000" value="${cfg.pingThresholdMs || 200}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Mask API Keys by Default:</label>
              <select id="cfg-spec-mask-keys" class="form-control" style="font-size:0.75rem;">
                <option value="true" ${cfg.maskApiKeysDefault !== false ? 'selected' : ''}>Enabled (Protected)</option>
                <option value="false" ${cfg.maskApiKeysDefault === false ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Providers Grid Columns:</label>
              <select id="cfg-spec-prov-cols" class="form-control" style="font-size:0.75rem;">
                <option value="3" ${cfg.gridColumns === 3 || !cfg.gridColumns ? 'selected' : ''}>3 Columns (Default)</option>
                <option value="2" ${cfg.gridColumns === 2 ? 'selected' : ''}>2 Columns</option>
                <option value="4" ${cfg.gridColumns === 4 ? 'selected' : ''}>4 Columns</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Auto Ping Health Check on Load:</label>
              <select id="cfg-spec-prov-autoping" class="form-control" style="font-size:0.75rem;">
                <option value="true" ${cfg.autoPingOnLoad !== false ? 'selected' : ''}>Enabled</option>
                <option value="false" ${cfg.autoPingOnLoad === false ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
          </div>
        `;
      case 'model-club':
        return `
          <div class="grid-2" style="gap:8px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Default Navigation Mode:</label>
              <select id="cfg-spec-viewmode" class="form-control" style="font-size:0.75rem;">
                <option value="hierarchy" ${cfg.defaultViewMode === 'hierarchy' || !cfg.defaultViewMode ? 'selected' : ''}>Hierarchy Tree</option>
                <option value="combos" ${cfg.defaultViewMode === 'combos' ? 'selected' : ''}>Combos Studio</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Auto Expand Combos Branch:</label>
              <select id="cfg-spec-autoexpand" class="form-control" style="font-size:0.75rem;">
                <option value="true" ${cfg.autoExpandCombos !== false ? 'selected' : ''}>Enabled</option>
                <option value="false" ${cfg.autoExpandCombos === false ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Taxonomy Grid Columns:</label>
              <select id="cfg-spec-tax-cols" class="form-control" style="font-size:0.75rem;">
                <option value="3" ${cfg.taxonomyGridColumns === 3 || !cfg.taxonomyGridColumns ? 'selected' : ''}>3 Columns (Default)</option>
                <option value="2" ${cfg.taxonomyGridColumns === 2 ? 'selected' : ''}>2 Columns</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Cache Taxonomy Pyramid Tree:</label>
              <select id="cfg-spec-tax-cache" class="form-control" style="font-size:0.75rem;">
                <option value="true" ${cfg.cacheTaxonomyTree !== false ? 'selected' : ''}>Enabled (Fast Load)</option>
                <option value="false" ${cfg.cacheTaxonomyTree === false ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
          </div>
        `;
      case 'reports':
        return `
          <div class="grid-2" style="gap:8px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Log Terminal Max Height (px):</label>
              <input type="number" id="cfg-spec-log-height" class="form-control" style="font-size:0.75rem;" min="200" max="800" value="${cfg.logTerminalHeightPx || 400}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Default Fetch Log Limit:</label>
              <input type="number" id="cfg-spec-log-limit" class="form-control" style="font-size:0.75rem;" min="25" max="500" value="${cfg.defaultLogLimit || 100}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Log Search Keystroke Cache:</label>
              <select id="cfg-spec-log-cache" class="form-control" style="font-size:0.75rem;">
                <option value="true" ${cfg.logSearchCache !== false ? 'selected' : ''}>Enabled (Fast Keystroke Search)</option>
                <option value="false" ${cfg.logSearchCache === false ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Default Open Diagnostic Tab:</label>
              <select id="cfg-spec-log-default-tab" class="form-control" style="font-size:0.75rem;">
                <option value="api" ${cfg.defaultReportTab === 'api' || !cfg.defaultReportTab ? 'selected' : ''}>1. API Diagnostics</option>
                <option value="system" ${cfg.defaultReportTab === 'system' ? 'selected' : ''}>2. System Event Log</option>
                <option value="modelstatus" ${cfg.defaultReportTab === 'modelstatus' ? 'selected' : ''}>5. Active/Inactive Audit Tree</option>
              </select>
            </div>
          </div>
        `;
      case 'settings':
        return `
          <div class="grid-2" style="gap:8px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Theme Cards Grid Columns:</label>
              <select id="cfg-spec-theme-cols" class="form-control" style="font-size:0.75rem;">
                <option value="3" ${cfg.themeCardsGridColumns === 3 || !cfg.themeCardsGridColumns ? 'selected' : ''}>3 Columns (Default)</option>
                <option value="4" ${cfg.themeCardsGridColumns === 4 ? 'selected' : ''}>4 Columns</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Default Settings Tab:</label>
              <select id="cfg-spec-settings-default-tab" class="form-control" style="font-size:0.75rem;">
                <option value="keys-endpoints" ${cfg.defaultSettingsTab === 'keys-endpoints' || !cfg.defaultSettingsTab ? 'selected' : ''}>API Key and Endpoints</option>
                <option value="ui-ux" ${cfg.defaultSettingsTab === 'ui-ux' ? 'selected' : ''}>UI/UX Features</option>
                <option value="launch-rules" ${cfg.defaultSettingsTab === 'launch-rules' ? 'selected' : ''}>Launching Rules &amp; Monitor</option>
              </select>
            </div>
          </div>
        `;
      case 'manual':
        return `
          <div class="grid-2" style="gap:8px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Accordion Speed (sec):</label>
              <input type="number" id="cfg-spec-accord-speed" class="form-control" style="font-size:0.75rem;" step="0.1" min="0.1" max="1.0" value="${cfg.accordionExpandSpeedSec || 0.3}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:0.75rem; color:var(--accent-cyan);">Auto-Collapse Other Accordions:</label>
              <select id="cfg-spec-manual-autocollapse" class="form-control" style="font-size:0.75rem;">
                <option value="true" ${cfg.autoCollapseAccordions !== false ? 'selected' : ''}>Enabled (Single Open Item)</option>
                <option value="false" ${cfg.autoCollapseAccordions === false ? 'selected' : ''}>Disabled (Multi-Expand)</option>
              </select>
            </div>
          </div>
        `;
      default:
        return `<div style="font-size:0.75rem; color:var(--text-muted);">Standard layout controls active.</div>`;
    }
  }

  static onFontPreviewChange(fontName) {
    const fontValue = (fontName === 'System' || !fontName)
      ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      : `'${fontName}', sans-serif`;
    
    document.documentElement.style.setProperty('--font-main', fontValue);
    document.documentElement.style.setProperty('--font-primary', fontValue);
    if (document.body) document.body.style.fontFamily = fontValue;
  }

  static saveConfig(screenId) {
    const schemas = SettingsViewHelper.getDefaultScreenSchemas();
    const current = schemas[screenId] || schemas.universal || schemas.dashboard;
    const savedConfig = JSON.parse(localStorage.getItem('fmc_uiux_config') || '{}');

    const fontFamilyEl = document.getElementById('cfg-font-family');
    const fontWeightEl = document.getElementById('cfg-font-weight');
    const letterSpacingEl = document.getElementById('cfg-letter-spacing-px');
    const lineHeightEl = document.getElementById('cfg-line-height');

    const selectedFont = fontFamilyEl ? fontFamilyEl.value : 'System';

    const updated = {
      ...current,
      leftRailWidthPct: parseInt(document.getElementById('cfg-left-rail-pct')?.value || 20, 10),
      centerMinWidthPx: parseInt(document.getElementById('cfg-center-min-px')?.value || 320, 10),
      rightDrawerWidthPx: parseInt(document.getElementById('cfg-right-drawer-px')?.value || 300, 10),
      fontSizePx: parseInt(document.getElementById('cfg-font-size-px')?.value || 14, 10),
      fontWeight: fontWeightEl ? fontWeightEl.value : '400',
      letterSpacingPx: letterSpacingEl ? parseFloat(letterSpacingEl.value) : -0.2,
      lineHeight: lineHeightEl ? parseFloat(lineHeightEl.value) : 1.45,
      cardPaddingPx: parseInt(document.getElementById('cfg-card-padding-px')?.value || 12, 10),
      glassOpacity: parseFloat(document.getElementById('cfg-glass-opacity')?.value || 0.85),
      backdropBlurPx: parseInt(document.getElementById('cfg-backdrop-blur-px')?.value || 16, 10),
      cardShadowPx: parseInt(document.getElementById('cfg-card-shadow-px')?.value || 8, 10),
      fontFamily: selectedFont,
      updatedAt: new Date().toISOString()
    };

    // Save custom screen-specific values dynamically if available
    const statTilesEl = document.getElementById('cfg-spec-stat-tiles');
    if (statTilesEl) updated.statGridTiles = parseInt(statTilesEl.value, 10);

    const telemetryRowsEl = document.getElementById('cfg-spec-telemetry-rows');
    if (telemetryRowsEl) updated.maxTelemetryRows = parseInt(telemetryRowsEl.value, 10);

    const textareaHeightEl = document.getElementById('cfg-spec-textarea-height');
    if (textareaHeightEl) updated.chatTextareaMaxHeightPx = parseInt(textareaHeightEl.value, 10);

    const pingThreshEl = document.getElementById('cfg-spec-ping-thresh');
    if (pingThreshEl) updated.pingThresholdMs = parseInt(pingThreshEl.value, 10);

    const logHeightEl = document.getElementById('cfg-spec-log-height');
    if (logHeightEl) updated.logTerminalHeightPx = parseInt(logHeightEl.value, 10);

    savedConfig[screenId] = updated;

    // App-wide Master Universal persistence
    if (screenId === 'universal') {
      localStorage.setItem('fmc_font_family', selectedFont);
      localStorage.setItem('fmc_font_size', updated.fontSizePx);
      savedConfig['universal'] = updated;
    }

    localStorage.setItem('fmc_uiux_config', JSON.stringify(savedConfig));
    this.applyLayout(screenId);
    ModalDialog.showNotification(`UI/UX Layout & Crystal Font saved for '${screenId.toUpperCase()}'!`, 'success');
  }

  static resetConfig(screenId) {
    const savedConfig = JSON.parse(localStorage.getItem('fmc_uiux_config') || '{}');
    delete savedConfig[screenId];
    if (screenId === 'universal') {
      localStorage.removeItem('fmc_font_family');
      localStorage.removeItem('fmc_font_size');
    }
    localStorage.setItem('fmc_uiux_config', JSON.stringify(savedConfig));
    this.applyLayout(screenId);
    ModalDialog.showNotification(`Reset layout settings for '${screenId.toUpperCase()}'.`, 'info');
    this.renderTab(document.getElementById('settings-tab-content'), screenId);
  }

  static async testValidation() {
    const input = document.getElementById('sandbox-api-key');
    if (!input) return;
    
    const val = input.value;
    if (typeof ValidationNotifier !== 'undefined') {
      await ValidationNotifier.validateAndPrompt({
        scope: 'provider_registration', // Reusing an existing backend scope
        data: { baseUrl: 'https://api.openai.com/v1', displayName: 'Sandbox Provider', apiKey: val || '' },
        title: 'API Key Validation Check',
        onSuccess: () => {
          ModalDialog.showNotification('API Key passed backend constraints!', 'success');
        },
        onOptionSelect: (optId) => {
          ModalDialog.showNotification(`Option selected: ${optId}`, 'info');
        }
      });
    }
  }

  static triggerOptionDialog() {
    if (typeof ValidationNotifier !== 'undefined') {
      ValidationNotifier.showOptionPopup({
        title: 'Agent Sync Required',
        message: 'The Provider Agent requires a synchronization pass to update models. Choose an action:',
        icon: 'fa-server',
        options: [
          { id: 'sync_now', label: 'Sync Now', type: 'emerald', icon: 'fa-rotate' },
          { id: 'sync_later', label: 'Remind Me Later', type: 'outline', icon: 'fa-clock' }
        ]
      });
    }
  }

  static applyLayout(screenId) {
    const schemas = SettingsViewHelper.getDefaultScreenSchemas();
    const savedConfig = JSON.parse(localStorage.getItem('fmc_uiux_config') || '{}');
    const universalCfg = savedConfig['universal'] || schemas.universal;
    const screenCfg = screenId ? (savedConfig[screenId] || schemas[screenId] || universalCfg) : universalCfg;

    // Merge: Screen specific override takes precedence over universal master default
    const cfg = { ...universalCfg, ...screenCfg };

    const root = document.documentElement;
    const body = document.body;

    const savedFont = localStorage.getItem('fmc_font_family') || cfg.fontFamily || 'System';
    const fontValue = (savedFont === 'System' || !savedFont)
      ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      : `'${savedFont}', sans-serif`;

    root.style.setProperty('--font-main', fontValue);
    root.style.setProperty('--font-primary', fontValue);
    if (body) body.style.fontFamily = fontValue;

    if (cfg.fontSizePx) {
      root.style.setProperty('--font-size-base', `${cfg.fontSizePx}px`);
      root.style.setProperty('--base-font-size', `${cfg.fontSizePx}px`);
    }
    if (cfg.fontWeight) root.style.setProperty('--font-weight-base', `${cfg.fontWeight}`);
    if (cfg.letterSpacingPx !== undefined) root.style.setProperty('--letter-spacing-base', `${cfg.letterSpacingPx}px`);
    if (cfg.lineHeight !== undefined) root.style.setProperty('--line-height-base', `${cfg.lineHeight}`);

    if (cfg.leftRailWidthPct) root.style.setProperty('--left-rail-width', `${cfg.leftRailWidthPct}%`);
    if (cfg.rightDrawerWidthPx) root.style.setProperty('--right-drawer-width', `${cfg.rightDrawerWidthPx}px`);
    if (cfg.cardPaddingPx) root.style.setProperty('--card-padding', `${cfg.cardPaddingPx}px`);
    if (cfg.glassOpacity !== undefined) root.style.setProperty('--glass-opacity', `${cfg.glassOpacity}`);
    if (cfg.borderRadiusPx !== undefined) root.style.setProperty('--border-radius', `${cfg.borderRadiusPx}px`);
    if (cfg.backdropBlurPx !== undefined) root.style.setProperty('--glass-blur', `${cfg.backdropBlurPx}px`);
    if (cfg.cardShadowPx !== undefined) root.style.setProperty('--card-shadow-elevation', `0 ${cfg.cardShadowPx}px ${cfg.cardShadowPx * 2}px rgba(0,0,0,0.3)`);

    if (cfg.enableAnimations === false) root.style.setProperty('--transition-speed', '0s');
    else root.style.setProperty('--transition-speed', '0.2s');

    if (body) {
      if (cfg.compactDensityMode !== false) body.classList.add('compact-density');
      else body.classList.remove('compact-density');
    }
  }

  static saveLocalServerSettings() {
    const portEl = document.getElementById('local-server-port-input');
    const modelEl = document.getElementById('local-model-id-input');

    const port = portEl ? parseInt(portEl.value) || 11434 : 11434;
    const modelId = modelEl ? modelEl.value.trim() || 'llama3:latest' : 'llama3:latest';

    localStorage.setItem('fmc_local_server_port', port);
    localStorage.setItem('fmc_local_model_id', modelId);

    if (typeof HeaderTelemetry !== 'undefined' && HeaderTelemetry.loadAndRender) {
      HeaderTelemetry.loadAndRender();
    }

    ModalDialog.showNotification(`Saved local server port (${port}) and default model ('${modelId}'). Health checks updated!`, 'success');
  }
}

window.SettingsUiUxHelper = SettingsUiUxHelper;

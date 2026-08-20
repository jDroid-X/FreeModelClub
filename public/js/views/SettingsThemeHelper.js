class SettingsThemeHelper {
  static openEditor(themeId = null) {
    let theme = null;
    let isEdit = false;
    if (themeId && SettingsView.cachedThemes) {
      theme = SettingsView.cachedThemes.find(t => t.id === themeId);
      isEdit = !!theme;
    }

    const vars = theme ? (theme.variables || {}) : {};
    
    // Extracted Variables with Defaults
    const p = vars['--primary'] || (theme ? theme.accent : null) || '#6366f1';
    const pHover = vars['--primary-hover'] || '#4f46e5';
    const s = vars['--secondary'] || '#06b6d4';
    
    const tOnPrimary = vars['--text-on-primary'] || '#ffffff';
    const tOnSecondary = vars['--text-on-secondary'] || '#ffffff';
    
    const bg = vars['--bg-dark'] || (theme ? theme.bg : null) || '#0f172a';
    const bgCard = vars['--bg-card'] || '#1e293b';
    const bgCardHover = vars['--bg-card-hover'] || '#334155';
    const bgSidebar = vars['--bg-sidebar'] || bg;
    const bgHoverOverlay = vars['--bg-hover-overlay'] || 'rgba(255,255,255,0.08)';
    
    const bgCode = vars['--bg-code'] || '#e2e8f0';
    const modalOverlay = vars['--modal-overlay'] || 'rgba(0, 0, 0, 0.7)';
    const bColor = vars['--border-color'] || '#334155';
    const bGlow = vars['--border-glow'] || p;
    const accentCyan = vars['--accent-cyan'] || '#06b6d4';
    const accentEmerald = vars['--accent-emerald'] || '#10b981';
    const accentAmber = vars['--accent-amber'] || '#f59e0b';
    const accentRose = vars['--accent-rose'] || '#f43f5e';
    
    const iconColor = vars['--icon-color'] || accentCyan || '#06b6d4';
    const iconHoverColor = vars['--icon-hover-color'] || p || '#6366f1';
    
    const tMain = vars['--text-main'] || '#ffffff';
    const tMuted = vars['--text-muted'] || '#94a3b8';
    const tDim = vars['--text-dim'] || '#64748b';
    const focusRing = vars['--focus-ring-color'] || accentCyan;
    const borderRadius = vars['--border-radius'] || '8px';
    const glassOpacity = vars['--glass-opacity'] || '0.85';
    const glassBlur = vars['--glass-blur'] || '16px';
    const transitionSpeed = vars['--transition-speed'] || '0.2s';
    const sidebarWidth = vars['--sidebar-width'] || '200px';
    const topbarHeight = vars['--topbar-height'] || '56px';
    const codeFontFamily = vars['--mono-font-family'] || "'Fira Code', monospace";
    const codeFontSize = vars['--code-font-size'] || '13px';
    const hoverOpacity = vars['--hover-overlay-opacity'] || '0.08';
    
    let font = vars['--font-main'] || "'Outfit', sans-serif";
    if (!font.includes("'")) font = `'${font}', sans-serif`;
    const sizeStr = vars['--font-size-base'] || '0.82rem';
    const fSize = parseFloat(sizeStr.replace('rem', '')) || 0.82;
    const fWeight = vars['--font-weight-base'] || 'normal';
    const fStyle = vars['--font-style-base'] || 'normal';

    const name = theme ? theme.name : 'Custom Theme';
    const themeSelectOptions = (SettingsView.cachedThemes || []).map(t => `
      <option value="${t.id}" ${themeId === t.id ? 'selected' : ''}>${t.name}</option>
    `).join('');
    const themeSearchOptions = (SettingsView.cachedThemes || []).map(t => `
      <option value="${t.name}"></option>
    `).join('');

    const html = `
      <div style="display: flex; gap: 20px; align-items: stretch; margin-top: 10px;">
        <!-- Left: Live Preview Visiting Card -->
        <div style="flex: 1; display: flex; flex-direction: column;">
          <h4 style="margin: 0 0 10px 0; font-size: 0.9rem; color: var(--accent-cyan);">Live Preview</h4>
          <div id="theme-preview-card" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('bg-dark')" style="
            flex: 1;
            background: ${bg};
            color: ${tMain};
            font-family: ${font};
            font-size: ${fSize}rem;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid ${bColor};
            box-shadow: 0 10px 30px ${bGlow};
            display: flex; flex-direction: column; gap: 15px;
            transition: all 0.2s ease;
            cursor: pointer;
          ">
            <!-- Full App Layout Simulation: Sidebar Rail + Settings Nav Panel + Content -->
            <div style="display: flex; gap: 0; height: 100%;">
              <!-- App Sidebar Rail (--bg-sidebar) -->
              <div id="preview-sidebar-rail" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('bg-sidebar')" style="width: 36px; background: ${bgSidebar}; border-right: 1px solid ${bColor}; border-radius: 8px 0 0 8px; padding: 8px 4px; display: flex; flex-direction: column; gap: 6px; align-items: center; cursor: pointer; flex-shrink: 0;" title="App Sidebar (--bg-sidebar)">
                <div style="width: 20px; height: 20px; border-radius: 50%; background: ${accentCyan}; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; font-size: 0.45rem; color: #fff;" title="App Logo"><i class="fa-solid fa-bolt"></i></div>
                <div onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('icon-color')" style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="Icon (--icon-color)"><i class="fa-solid fa-gauge" style="color: ${iconColor}; font-size: 0.55rem;"></i></div>
                <div onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('icon-color')" style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="Icon (--icon-color)"><i class="fa-solid fa-comments" style="color: ${iconColor}; font-size: 0.55rem;"></i></div>
                <div onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('icon-color')" style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: rgba(255,255,255,0.15); border-radius: 4px;" title="Active Nav Icon"><i class="fa-solid fa-sliders" style="color: ${iconColor}; font-size: 0.55rem;"></i></div>
                <div onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('icon-color')" style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="Icon (--icon-color)"><i class="fa-solid fa-chart-bar" style="color: ${iconColor}; font-size: 0.55rem;"></i></div>
              </div>

              <!-- Settings Navigation Panel (--bg-card + --btn-secondary-bg) -->
              <div id="preview-sidebar-panel" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('bg-card')" style="width: 105px; background: ${bgCard}; border-right: 1px solid ${bColor}; padding: 8px 5px; display: flex; flex-direction: column; gap: 4px; cursor: pointer; flex-shrink: 0;" title="Settings Navigation Panel (--bg-card)">
                <div style="font-size: 0.5rem; font-weight: 700; color: ${accentCyan}; display: flex; align-items: center; gap: 3px; padding: 2px 3px; border-bottom: 1px solid ${bColor}; margin-bottom: 2px;" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('accent-cyan')">
                  <i class="fa-solid fa-sliders" style="font-size: 0.45rem;"></i> Settings Nav
                </div>
                <div id="preview-nav-item-active" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('primary')" style="background: ${p}; color: ${tOnPrimary}; font-size: 0.46rem; font-weight: 600; padding: 2px 4px; border-radius: 3px; display: flex; align-items: center; gap: 3px; border: 1px solid ${bColor}; cursor: pointer;" title="Active Tab (--primary)">
                  <i class="fa-solid fa-key" style="color: #fbbf24; font-size: 0.42rem;"></i> API Keys
                </div>
                <div id="preview-nav-item-1" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('secondary')" style="background: ${s}; color: ${tOnSecondary}; font-size: 0.46rem; font-weight: 600; padding: 2px 4px; border-radius: 3px; display: flex; align-items: center; gap: 3px; border: 1px solid ${bColor}; cursor: pointer;" title="Nav Button (--secondary)">
                  <i class="fa-solid fa-robot" style="color: #34d399; font-size: 0.42rem;"></i> Agents
                </div>
                <div id="preview-nav-item-2" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('secondary')" style="background: ${s}; color: ${tOnSecondary}; font-size: 0.46rem; font-weight: 600; padding: 2px 4px; border-radius: 3px; display: flex; align-items: center; gap: 3px; border: 1px solid ${bColor}; cursor: pointer;" title="Nav Button (--secondary)">
                  <i class="fa-solid fa-palette" style="color: #06b6d4; font-size: 0.42rem;"></i> Themes
                </div>
                <div id="preview-nav-item-3" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('secondary')" style="background: ${s}; color: ${tOnSecondary}; font-size: 0.46rem; font-weight: 600; padding: 2px 4px; border-radius: 3px; display: flex; align-items: center; gap: 3px; border: 1px solid ${bColor}; cursor: pointer;" title="Nav Button (--secondary)">
                  <i class="fa-solid fa-shield-halved" style="color: #f59e0b; font-size: 0.42rem;"></i> Rules
                </div>
              </div>
              
              <!-- Main Content Simulation -->
              <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
                <div onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('text-main')" style="cursor: pointer;">
                  <div style="font-size: ${fSize}rem; font-family: ${font}; font-weight: ${fWeight}; font-style: ${fStyle}; color: ${tMain}; margin-bottom: 8px;">Theme Preview View</div>
                  <div style="font-size: 0.85em; color: ${tMuted}; margin-bottom: 15px;">This card demonstrates how UI components react to the variables configured on the right.</div>
                </div>
                
                <!-- Inner Card Simulation -->
                <div id="preview-inner-card" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('bg-card')" style="background: ${bgCard}; padding: 12px; border-radius: 8px; border: 1px solid ${bColor}; transition: all 0.2s ease; cursor: pointer;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color: ${tMain}; font-weight: 600; display: flex; align-items: center; gap: 6px;" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('text-main')">
                      <i id="preview-icon-sample-1" class="fa-solid fa-sliders" style="color: ${iconColor}; transition: color 0.2s ease;" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('icon-color')" title="Icon Color"></i>
                      System Status
                    </span>
                    <span onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('secondary')" style="background: rgba(6,182,212,0.2); color: ${tOnSecondary}; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                      <i id="preview-icon-sample-2" class="fa-solid fa-circle-check" style="color: ${iconColor}; font-size: 0.7em; transition: color 0.2s ease;"></i>
                      Active
                    </span>
                  </div>
                  <p style="margin: 0 0 8px 0; font-size: 0.9em; color: ${tDim};" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('text-dim')">All services operating normally. Dim text used for descriptions.</p>
                  
                  <!-- Interactive Icons Bar -->
                  <div style="display: flex; gap: 10px; align-items: center; background: rgba(0,0,0,0.15); padding: 6px 10px; border-radius: 6px; border: 1px solid ${bColor};">
                    <span style="font-size: 0.75rem; color: ${tMuted}; margin-right: 4px;">Icons Preview:</span>
                    <i id="preview-icon-sample-3" class="fa-solid fa-wand-magic-sparkles" style="color: ${iconColor}; font-size: 1rem; cursor: pointer; transition: all 0.2s ease;" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('icon-color')" title="Icon (Hover to test hover color)"></i>
                    <i id="preview-icon-sample-4" class="fa-solid fa-robot" style="color: ${iconColor}; font-size: 1rem; cursor: pointer; transition: all 0.2s ease;" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('icon-color')" title="Icon (Hover to test hover color)"></i>
                    <i id="preview-icon-sample-5" class="fa-solid fa-shield-halved" style="color: ${iconColor}; font-size: 1rem; cursor: pointer; transition: all 0.2s ease;" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('icon-color')" title="Icon (Hover to test hover color)"></i>
                    <i id="preview-icon-sample-6" class="fa-solid fa-bolt" style="color: ${iconColor}; font-size: 1rem; cursor: pointer; transition: all 0.2s ease;" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('icon-color')" title="Icon (Hover to test hover color)"></i>
                  </div>
                </div>
                
                <!-- Buttons Simulation (Primary, Secondary, Hover) -->
                <div style="display: flex; gap: 8px; margin-top: auto; flex-wrap: wrap;">
                  <button id="preview-btn-primary" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('primary')" style="flex: 1; padding: 6px 10px; font-size: 0.72rem; font-weight: 600; background: ${p}; color: ${tOnPrimary}; border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s ease;">Primary</button>
                  <button id="preview-btn-secondary" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('secondary')" style="flex: 1; padding: 6px 10px; font-size: 0.72rem; font-weight: 600; background: ${s}; color: ${tOnSecondary}; border: 1px solid ${bColor}; border-radius: 4px; cursor: pointer;">Secondary</button>
                  <button id="preview-btn-hover" onclick="event.stopPropagation(); SettingsThemeHelper.highlightInput('bg-hover-overlay')" style="flex: 1; padding: 6px 10px; font-size: 0.72rem; font-weight: 600; background: ${bgHoverOverlay}; color: ${tMain}; border: 1px solid ${bColor}; border-radius: 4px; cursor: pointer;">Hover Item</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Dense Property Editor -->
        <div style="flex: 1.2; overflow-y: auto; max-height: 65vh; padding-right: 10px; border-left: 1px solid var(--border-color); padding-left: 20px;">
          <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size:0.8rem; color: var(--accent-cyan);">Theme Name / Load Existing Theme:</label>
            <div style="display:flex;gap:8px;align-items:center;">
              <input
                type="search"
                id="editor-theme-search"
                class="form-control"
                list="theme-editor-theme-list"
                placeholder="Search existing themes..."
                value="${name}"
                oninput="SettingsThemeHelper.filterThemeList(this.value)"
                onchange="SettingsThemeHelper.loadThemeFromPicker(this.value)"
                style="flex:1;"
              />
              <button type="button" class="btn btn-emerald btn-xs" onclick="SettingsThemeHelper.suggestThemePalette()">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Suggest
              </button>
            </div>
            <datalist id="theme-editor-theme-list">
              ${themeSearchOptions}
            </datalist>
            <div style="display:flex;gap:8px;align-items:center;margin-top:6px;">
              <select id="editor-theme-select" class="form-control" style="height:28px;font-size:0.75rem;" onchange="SettingsThemeHelper.loadThemeFromPicker(this.value)">
                <option value="">-- Choose existing theme --</option>
                ${themeSelectOptions}
              </select>
              <input type="text" id="editor-theme-name" class="form-control" value="${name}" style="flex:1;" />
            </div>
          </div>

          <!-- Group: Global Theme & Background -->
          <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
            <h5 style="margin: 0 0 10px 0; color: var(--accent-cyan); font-size: 0.8rem; text-transform: uppercase;"><i class="fa-solid fa-globe"></i> Global Theme &amp; Background</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              ${this.colorInput('bg-dark', 'Main BG', bg)}
              ${this.colorInput('text-main', 'Text Main', tMain)}
              ${this.colorInput('icon-color', 'Icon Color', iconColor)}
              ${this.colorInput('icon-hover-color', 'Icon Mouse Hover', iconHoverColor)}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
              <div style="display: flex; flex-direction: column; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                <label style="font-size:0.75rem; margin: 0 0 4px 0; color: var(--text-main);">Font Family</label>
                <select id="editor-font-main" class="form-control" onchange="SettingsThemeHelper.updatePreview()" style="height: 28px; padding: 2px 6px; font-size: 0.75rem;">
                  <option value="'Outfit', sans-serif" ${font.includes('Outfit') ? 'selected' : ''}>Outfit</option>
                  <option value="'Roboto', sans-serif" ${font.includes('Roboto') ? 'selected' : ''}>Roboto</option>
                  <option value="'Inter', sans-serif" ${font.includes('Inter') ? 'selected' : ''}>Inter</option>
                  <option value="'Fira Code', monospace" ${font.includes('Fira Code') ? 'selected' : ''}>Fira Code</option>
                  <option value="'Consolas', monospace" ${font.includes('Consolas') ? 'selected' : ''}>Consolas</option>
                  <option value="system-ui, sans-serif" ${font.includes('system-ui') ? 'selected' : ''}>System Native</option>
                </select>
              </div>
              <div style="display: flex; flex-direction: column; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                <label style="font-size:0.75rem; margin: 0 0 4px 0; color: var(--text-main);">Font Size: <span id="editor-font-size-val">${fSize}</span>rem</label>
                <input type="range" id="editor-font-size-base" min="0.7" max="1.1" step="0.01" value="${fSize}" style="width: 100%;" oninput="document.getElementById('editor-font-size-val').innerText = this.value; SettingsThemeHelper.updatePreview()" />
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
              <div style="display: flex; flex-direction: column; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                <label style="font-size:0.75rem; margin: 0 0 4px 0; color: var(--text-main);">Font Weight</label>
                <select id="editor-font-weight-base" class="form-control" onchange="SettingsThemeHelper.updatePreview()" style="height: 28px; padding: 2px 6px; font-size: 0.75rem;">
                  <option value="normal" ${fWeight === 'normal' ? 'selected' : ''}>Normal (400)</option>
                  <option value="500" ${fWeight === '500' ? 'selected' : ''}>Medium (500)</option>
                  <option value="600" ${fWeight === '600' ? 'selected' : ''}>Semi-Bold (600)</option>
                  <option value="bold" ${fWeight === 'bold' ? 'selected' : ''}>Bold (700)</option>
                </select>
              </div>
              <div style="display: flex; flex-direction: column; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                <label style="font-size:0.75rem; margin: 0 0 4px 0; color: var(--text-main);">Font Style</label>
                <select id="editor-font-style-base" class="form-control" onchange="SettingsThemeHelper.updatePreview()" style="height: 28px; padding: 2px 6px; font-size: 0.75rem;">
                  <option value="normal" ${fStyle === 'normal' ? 'selected' : ''}>Normal</option>
                  <option value="italic" ${fStyle === 'italic' ? 'selected' : ''}>Italic</option>
                </select>
              </div>
            </div>
          </div>

            <!-- Group: Cards & Surfaces -->
          <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
            <h5 style="margin: 0 0 10px 0; color: var(--accent-cyan); font-size: 0.8rem; text-transform: uppercase;"><i class="fa-solid fa-layer-group"></i> Cards &amp; Surfaces</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              ${this.colorInput('bg-card', 'Card BG', bgCard)}
              ${this.colorInput('bg-card-hover', 'Card Hover', bgCardHover)}
              ${this.colorInput('bg-code', 'Code BG', bgCode)}
              ${this.colorInput('text-muted', 'Text Muted', tMuted)}
              ${this.colorInput('text-dim', 'Text Dim', tDim)}
              ${this.colorInput('border-radius', 'Border Radius', borderRadius)}
              ${this.colorInput('glass-opacity', 'Glass Opacity', glassOpacity)}
              ${this.colorInput('glass-blur', 'Glass Blur', glassBlur)}
              ${this.colorInput('transition-speed', 'Transition Speed', transitionSpeed)}
            </div>
          </div>
          
          <!-- Group: Navigation -->
          <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
            <h5 style="margin: 0 0 10px 0; color: var(--accent-cyan); font-size: 0.8rem; text-transform: uppercase;"><i class="fa-solid fa-bars"></i> Navigation</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              ${this.colorInput('bg-sidebar', 'Sidebar BG', bgSidebar)}
              ${this.colorInput('sidebar-width', 'Sidebar Width', sidebarWidth)}
              ${this.colorInput('topbar-height', 'Topbar Height', topbarHeight)}
              ${this.colorInput('focus-ring-color', 'Focus Ring', focusRing)}
            </div>
          </div>

          <!-- Group: Accents & Interactions -->
          <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
            <h5 style="margin: 0 0 10px 0; color: var(--accent-cyan); font-size: 0.8rem; text-transform: uppercase;"><i class="fa-solid fa-wand-magic-sparkles"></i> Accents &amp; Interactions</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              ${this.colorInput('primary', 'Primary BG', p)}
              ${this.colorInput('text-on-primary', 'Primary Text', tOnPrimary)}
              ${this.colorInput('secondary', 'Secondary BG', s)}
              ${this.colorInput('text-on-secondary', 'Secondary Text', tOnSecondary)}
              ${this.colorInput('primary-hover', 'Primary Hover', pHover)}
              ${this.colorInput('accent-cyan', 'Accent Cyan', accentCyan)}
              ${this.colorInput('accent-emerald', 'Accent Emerald', accentEmerald)}
              ${this.colorInput('accent-amber', 'Accent Amber', accentAmber)}
              ${this.colorInput('accent-rose', 'Accent Rose', accentRose)}
              <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                <label style="font-size:0.75rem; margin: 0; color: var(--text-main);">Hover Overlay</label>
                <input type="text" id="editor-bg-hover-overlay" class="form-control" value="${bgHoverOverlay}" oninput="SettingsThemeHelper.updatePreview()" style="height: 28px; width: 88px; font-size: 0.7rem; padding: 0 4px; text-align: center;" />
              </div>
              ${this.colorInput('mono-font-family', 'Code Font', codeFontFamily)}
              ${this.colorInput('code-font-size', 'Code Font Size', codeFontSize)}
              ${this.colorInput('hover-overlay-opacity', 'Hover Opacity', hoverOpacity)}
            </div>
          </div>

          <!-- Group: Borders & Effects -->
          <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
            <h5 style="margin: 0 0 10px 0; color: var(--accent-cyan); font-size: 0.8rem; text-transform: uppercase;"><i class="fa-solid fa-border-all"></i> Borders &amp; Effects</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              ${this.colorInput('border-color', 'Border Color', bColor)}
              ${this.colorInput('border-glow', 'Border Glow (Hex)', bGlow)}
              ${this.colorInput('modal-overlay', 'Modal Overlay', modalOverlay)}
            </div>
          </div>
        </div>
      </div>
    `;

    ModalDialog.showModal({
      title: isEdit ? 'Edit Theme (Pro-Max)' : 'Create New Theme (Pro-Max)',
      icon: 'fa-palette',
      body: html,
      confirmText: isEdit ? 'Save Changes' : 'Create Theme',
      width: '900px',
      onConfirm: async () => {
        await SettingsThemeHelper.saveTheme(themeId, isEdit, theme ? theme.isDefault : false);
      }
    });

    setTimeout(() => {
      const card = document.getElementById('preview-inner-card');
      if (card) {
        card.onmouseenter = () => { card.style.background = document.getElementById('editor-bg-card-hover').value; };
        card.onmouseleave = () => { card.style.background = document.getElementById('editor-bg-card').value; };
      }
      const pBtn = document.getElementById('preview-btn-primary');
      if (pBtn) {
        pBtn.onmouseenter = () => { pBtn.style.background = document.getElementById('editor-primary-hover').value; };
        pBtn.onmouseleave = () => { pBtn.style.background = document.getElementById('editor-primary').value; };
      }
      for (let i = 1; i <= 6; i++) {
        const ic = document.getElementById(`preview-icon-sample-${i}`);
        if (ic) {
          ic.onmouseenter = () => { ic.style.color = document.getElementById('editor-icon-hover-color').value; };
          ic.onmouseleave = () => { ic.style.color = document.getElementById('editor-icon-color').value; };
        }
      }
    }, 100);
  }

  static colorInput(id, label, value) {
    let isRgba = value.startsWith('rgb') || value.startsWith('rgba');
    let inputHtml = '';
    if (isRgba) {
      inputHtml = `<input type="text" id="editor-${id}" class="form-control" value="${value}" oninput="SettingsThemeHelper.updatePreview()" style="height: 28px; width: 60px; font-size: 0.7rem; padding: 0 4px; text-align: center;" />`;
    } else {
      inputHtml = `<input type="color" id="editor-${id}" class="form-control" value="${value}" oninput="SettingsThemeHelper.updatePreview()" style="height: 28px; width: 28px; padding: 0; cursor: pointer; border: none; border-radius: 4px; flex-shrink: 0;" />`;
    }

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
        <label style="font-size:0.75rem; margin: 0; color: var(--text-main);">${label}</label>
        ${inputHtml}
      </div>
    `;
  }

  static filterThemeList(query) {
    const select = document.getElementById('editor-theme-select');
    if (!select) return;
    const term = (query || '').trim().toLowerCase();
    Array.from(select.options).forEach((option, index) => {
      if (index === 0) return;
      const text = (option.textContent || '').toLowerCase();
      option.hidden = !!term && !text.includes(term);
    });
  }

  static loadThemeFromPicker(themeId) {
    if (!themeId) return;
    const normalized = themeId.trim().toLowerCase();
    const theme = (SettingsView.cachedThemes || []).find(t =>
      t.id === themeId || (t.name || '').trim().toLowerCase() === normalized
    );
    if (!theme) return;
    SettingsThemeHelper.openEditor(themeId);
  }

  static suggestThemePalette() {
    const nameInput = document.getElementById('editor-theme-name');
    const searchInput = document.getElementById('editor-theme-search');
    const rawName = (nameInput?.value || searchInput?.value || 'Custom Theme').trim();
    const palette = this.generateThemePalette(rawName);
    const set = (id, value) => {
      const el = document.getElementById('editor-' + id);
      if (el) el.value = value;
    };

    set('bg-dark', palette.bgDark);
    set('bg-card', palette.bgCard);
    set('bg-card-hover', palette.bgCardHover);
    set('bg-sidebar', palette.bgSidebar);
    set('bg-hover-overlay', palette.bgHoverOverlay);
    set('primary', palette.primary);
    set('primary-hover', palette.primaryHover);
    set('secondary', palette.secondary);
    set('text-on-primary', palette.textOnPrimary);
    set('text-on-secondary', palette.textOnSecondary);
    set('border-color', palette.borderColor);
    set('border-glow', palette.borderGlow);
    set('font-main', palette.fontMain);
    set('font-size-base', palette.fontSizeBase);
    set('font-weight-base', palette.fontWeightBase);
    set('font-style-base', palette.fontStyleBase);
    set('text-main', palette.textMain);
    set('text-muted', palette.textMuted);
    set('text-dim', palette.textDim);
    set('accent-cyan', palette.accentCyan);
    set('accent-emerald', palette.accentEmerald);
    set('accent-amber', palette.accentAmber);
    set('accent-rose', palette.accentRose);
    set('icon-color', palette.iconColor);
    set('icon-hover-color', palette.iconHoverColor);
    set('border-radius', palette.borderRadius);
    set('glass-opacity', palette.glassOpacity);
    set('glass-blur', palette.glassBlur);
    set('transition-speed', palette.transitionSpeed);
    set('sidebar-width', palette.sidebarWidth);
    set('topbar-height', palette.topbarHeight);
    set('focus-ring-color', palette.focusRingColor);
    set('mono-font-family', palette.monoFontFamily);
    set('code-font-size', palette.codeFontSize);
    set('hover-overlay-opacity', palette.hoverOverlayOpacity);
    this.updatePreview();
    ModalDialog.showNotification(`Suggested a ${palette.familyLabel} palette from '${rawName}'.`, 'success');
  }

  static generateThemePalette(name) {
    const normalized = (name || '').toLowerCase();
    const score = (terms) => terms.reduce((total, term) => total + (normalized.includes(term) ? 1 : 0), 0);
    const lightScore = score(['light', 'platinum', 'silver', 'chrome', 'aluminum', 'pearl']);
    const darkScore = score(['dark', 'obsidian', 'titanium', 'bronze', 'copper', 'steel', 'gunmetal']);
    const warmScore = score(['gold', 'bronze', 'copper', 'amber', 'rust']);
    const coolScore = score(['silver', 'platinum', 'titanium', 'ice', 'chrome', 'steel']);
    const vividScore = score(['neon', 'electric', 'glow', 'aurora']);
    const hash = Array.from(normalized || 'custom theme').reduce((acc, ch) => ((acc * 31) + ch.charCodeAt(0)) >>> 0, 17);
    const rotate = (hex, amount) => {
      const clean = hex.replace('#', '');
      const num = parseInt(clean, 16);
      const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amount));
      const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
      const b = Math.max(0, Math.min(255, ((num >> 0) & 255) + amount));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    };
    const blend = (a, b, t) => {
      const ca = a.replace('#', '');
      const cb = b.replace('#', '');
      const ra = parseInt(ca.substring(0, 2), 16), ga = parseInt(ca.substring(2, 4), 16), ba = parseInt(ca.substring(4, 6), 16);
      const rb = parseInt(cb.substring(0, 2), 16), gb = parseInt(cb.substring(2, 4), 16), bb = parseInt(cb.substring(4, 6), 16);
      const mix = (x, y) => Math.round(x + (y - x) * t);
      return `#${((1 << 24) + (mix(ra, rb) << 16) + (mix(ga, gb) << 8) + mix(ba, bb)).toString(16).slice(1)}`;
    };
    const isLight = lightScore > darkScore || normalized.includes('default') || normalized.includes('light');
    const baseLight = isLight ? '#f7fafc' : '#0b1020';
    const baseDark = isLight ? '#dbe7f2' : '#141b2d';
    const cardBase = isLight ? '#ffffff' : '#1a2333';
    const cardHoverBase = isLight ? '#f4f8fc' : '#253247';
    const sidebarBase = isLight ? '#d4dde8' : '#0f1523';

    const family = warmScore > coolScore ? 'warm' : (coolScore > warmScore ? 'cool' : (isLight ? 'light' : 'dark'));
    const primary = family === 'warm'
      ? (isLight ? '#b45309' : '#f97316')
      : family === 'cool'
        ? (isLight ? '#475569' : '#38bdf8')
        : (isLight ? '#4f46e5' : '#6366f1');
    const secondary = family === 'warm' ? '#fbbf24' : '#06b6d4';
    const accentCyan = family === 'warm' ? '#0ea5e9' : '#06b6d4';
    const accentEmerald = family === 'warm' ? '#10b981' : '#34d399';
    const accentAmber = family === 'warm' ? '#f59e0b' : '#fbbf24';
    const accentRose = vividScore ? '#fb7185' : (family === 'warm' ? '#f43f5e' : '#e11d48');
    const iconColor = family === 'warm' ? '#0ea5e9' : (family === 'cool' ? '#38bdf8' : accentCyan);
    const iconHoverColor = primary;
    const textMain = isLight ? '#0f172a' : '#f8fafc';
    const textMuted = isLight ? '#334155' : '#cbd5e1';
    const textDim = isLight ? '#64748b' : '#94a3b8';
    const borderBase = isLight ? '#94a3b8' : '#4f5f79';
    const borderGlow = family === 'warm' ? blend(primary, '#ffffff', isLight ? 0.35 : 0.22) : blend(primary, '#ffffff', isLight ? 0.4 : 0.2);
    const bgHoverOverlay = isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.08)';
    const contrastShift = isLight ? 18 : 22;

    const familyLabel = isLight ? 'Light Metal' : 'Dark Metal';
    const toneLabel = family === 'warm' ? 'Warm Alloy' : (family === 'cool' ? 'Cool Alloy' : 'Neutral Alloy');

    return {
      familyLabel: `${familyLabel} / ${toneLabel}`,
      bgDark: isLight ? blend(baseLight, baseDark, 0.5) : blend(baseLight, baseDark, 0.35),
      bgCard: isLight ? cardBase : cardBase,
      bgCardHover: isLight ? cardHoverBase : cardHoverBase,
      bgSidebar: isLight ? blend(cardBase, sidebarBase, 0.9) : blend(cardBase, sidebarBase, 0.7),
      bgHoverOverlay,
      primary,
      primaryHover: rotate(primary, isLight ? -18 : -10),
      secondary,
      textOnPrimary: isLight ? '#ffffff' : '#ffffff',
      textOnSecondary: isLight ? '#ffffff' : '#ffffff',
      borderColor: `rgba(${parseInt(borderBase.slice(1, 3), 16)}, ${parseInt(borderBase.slice(3, 5), 16)}, ${parseInt(borderBase.slice(5, 7), 16)}, ${isLight ? 0.34 : 0.42})`,
      borderGlow: `rgba(${parseInt(borderGlow.slice(1, 3), 16)}, ${parseInt(borderGlow.slice(3, 5), 16)}, ${parseInt(borderGlow.slice(5, 7), 16)}, ${isLight ? 0.65 : 0.82})`,
      fontMain: family === 'warm' ? "'Outfit', sans-serif" : (family === 'cool' ? "'Inter', sans-serif" : "'Outfit', sans-serif"),
      fontSizeBase: isLight ? 0.82 : 0.83,
      fontWeightBase: 'normal',
      fontStyleBase: 'normal',
      textMain,
      textMuted,
      textDim,
      accentCyan,
      accentEmerald,
      accentAmber,
      accentRose,
      iconColor,
      iconHoverColor,
      borderRadius: isLight ? '10px' : '8px',
      glassOpacity: isLight ? 0.92 : 0.86,
      glassBlur: isLight ? '10px' : '16px',
      transitionSpeed: isLight ? '0.18s' : '0.2s',
      sidebarWidth: isLight ? '208px' : '200px',
      textDim
    };
  }

  static highlightInput(inputId) {
    const input = document.getElementById('editor-' + inputId);
    if (input) {
      input.focus();
      const parent = input.closest('div');
      if (parent) {
        parent.style.boxShadow = '0 0 10px var(--accent-cyan)';
        parent.style.borderColor = 'var(--accent-cyan)';
        setTimeout(() => {
          parent.style.boxShadow = '';
          parent.style.borderColor = '';
        }, 1500);
      }
    }
  }

  static updatePreview() {
    const card = document.getElementById('theme-preview-card');
    if (!card) return;
    
    const val = (id) => {
      const el = document.getElementById('editor-' + id);
      return el ? el.value : '';
    };
    
    const bg = val('bg-dark');
    const bgCard = val('bg-card');
    const bgSidebar = val('bg-sidebar');
    const bgHoverOverlay = val('bg-hover-overlay');
    
    const p = val('primary');
    const s = val('secondary');
    const accentCyan = val('accent-cyan');
    const accentEmerald = val('accent-emerald');
    const accentAmber = val('accent-amber');
    const accentRose = val('accent-rose');
    const iconColor = val('icon-color') || accentCyan || '#06b6d4';
    const iconHoverColor = val('icon-hover-color') || p || '#6366f1';
    const bColor = val('border-color');
    const bGlow = val('border-glow');
    
    const tMain = val('text-main');
    const tMuted = val('text-muted');
    const tDim = val('text-dim');
    const tOnPrimary = val('text-on-primary');
    const tOnSecondary = val('text-on-secondary');
    const borderRadius = val('border-radius');
    const glassOpacity = val('glass-opacity');
    const glassBlur = val('glass-blur');
    const transitionSpeed = val('transition-speed');
    const sidebarWidth = val('sidebar-width');
    const topbarHeight = val('topbar-height');
    const focusRing = val('focus-ring-color');
    const codeFont = val('mono-font-family');
    const codeFontSize = val('code-font-size');
    const hoverOpacity = val('hover-overlay-opacity');
    const font = val('font-main');
    const fSize = val('font-size-base');
    const fWeight = val('font-weight-base');
    const fStyle = val('font-style-base');

    card.style.background = bg;
    card.style.color = tMain;
    card.style.fontFamily = font;
    card.style.fontSize = fSize + 'rem';
    card.style.fontWeight = fWeight;
    card.style.fontStyle = fStyle;
    card.style.borderColor = bColor;
    card.style.boxShadow = `0 10px 30px ${bGlow}`;
    card.style.borderRadius = borderRadius;
    card.style.opacity = glassOpacity;
    card.style.transitionDuration = transitionSpeed;

    // --- Sidebar Rail (child 0) ---
    const sidebarRail = card.children[0]?.children[0];
    if (sidebarRail) {
      sidebarRail.style.background = bgSidebar;
      sidebarRail.style.borderColor = bColor;
      // Update icon colors inside sidebar rail (children 1-4 contain icons)
      for (let i = 1; i <= 4; i++) {
        const iconWrap = sidebarRail.children[i];
        if (iconWrap && iconWrap.children[0]) {
          iconWrap.children[0].style.color = iconColor;
        }
      }
    }

    // --- Settings Navigation Panel (child 1) ---
    const settingsPanel = card.children[0]?.children[1];
    if (settingsPanel) {
      settingsPanel.style.background = bgCard;
      settingsPanel.style.borderColor = bColor;
      // Header (child 0)
      if (settingsPanel.children[0]) {
        settingsPanel.children[0].style.color = accentCyan;
        settingsPanel.children[0].style.borderColor = bColor;
      }
      // Active tab (child 1)
      if (settingsPanel.children[1]) {
        settingsPanel.children[1].style.background = p;
        settingsPanel.children[1].style.color = tOnPrimary;
        settingsPanel.children[1].style.borderColor = bColor;
      }
      // Secondary nav items (children 2-4)
      for (let i = 2; i <= 4; i++) {
        if (settingsPanel.children[i]) {
          settingsPanel.children[i].style.background = s;
          settingsPanel.children[i].style.color = tOnSecondary;
          settingsPanel.children[i].style.borderColor = bColor;
        }
      }
    }

    // --- Main Content (child 2) ---
    const mainContent = card.children[0]?.children[2];
    if (mainContent) {
      const header = mainContent.children[0];
      if (header) {
        if (header.children[0]) {
          header.children[0].style.fontFamily = font;
          header.children[0].style.fontSize = fSize + 'rem';
          header.children[0].style.fontWeight = fWeight;
          header.children[0].style.fontStyle = fStyle;
          header.children[0].style.color = tMain;
        }
        if (header.children[1]) header.children[1].style.color = tMuted;
      }
      
      const innerCard = mainContent.children[1];
      if (innerCard) {
        innerCard.style.background = bgCard;
        innerCard.style.borderColor = bColor;
        innerCard.style.borderRadius = borderRadius;
        if (innerCard.children[0]) {
          if (innerCard.children[0].children[0]) innerCard.children[0].children[0].style.color = tMain;
          if (innerCard.children[0].children[1]) innerCard.children[0].children[1].style.color = tOnSecondary;
        }
        if (innerCard.children[1]) innerCard.children[1].style.color = tDim;
      }

      for (let i = 1; i <= 6; i++) {
        const ic = document.getElementById(`preview-icon-sample-${i}`);
        if (ic) {
          ic.style.color = iconColor;
          ic.onmouseenter = () => { ic.style.color = iconHoverColor; };
          ic.onmouseleave = () => { ic.style.color = iconColor; };
        }
      }

      const buttons = mainContent.children[2];
      if (buttons) {
        if (buttons.children[0]) {
          buttons.children[0].style.background = p;
          buttons.children[0].style.color = tOnPrimary;
        }
        if (buttons.children[1]) {
          buttons.children[1].style.background = s;
          buttons.children[1].style.color = tOnSecondary;
          buttons.children[1].style.borderColor = bColor;
        }
        if (buttons.children[2]) {
          buttons.children[2].style.background = bgHoverOverlay;
          buttons.children[2].style.opacity = hoverOpacity;
          buttons.children[2].style.borderColor = bColor;
          buttons.children[2].style.color = tMain;
        }
      }
    }
  }

  static async saveTheme(themeId, isEdit, isDefault) {
    const val = (id) => {
      const el = document.getElementById('editor-' + id);
      return el ? el.value : '';
    };
    const name = val('theme-name').trim() || 'Custom Theme';
    
    const variables = {
      '--bg-dark': val('bg-dark'),
      '--bg-card': val('bg-card'),
      '--bg-card-hover': val('bg-card-hover'),
      '--bg-sidebar': val('bg-sidebar'),
      '--bg-hover-overlay': val('bg-hover-overlay'),
      
      '--text-on-primary': val('text-on-primary'),
      '--secondary': val('secondary'),
      '--text-on-secondary': val('text-on-secondary'),
      '--border-color': val('border-color'),
      '--border-glow': val('border-glow'),
      '--font-main': val('font-main'),
      '--font-size-base': val('font-size-base') ? (val('font-size-base').includes('rem') ? val('font-size-base') : val('font-size-base') + 'rem') : '0.82rem',
      '--font-weight-base': val('font-weight-base'),
      '--font-style-base': val('font-style-base'),
      '--primary': val('primary'),
      '--primary-hover': val('primary-hover'),
      '--text-main': val('text-main'),
      '--text-muted': val('text-muted'),
      '--text-dim': val('text-dim'),
      
      '--icon-color': val('icon-color') || '#06b6d4',
      '--icon-hover-color': val('icon-hover-color') || '#6366f1',
      
      '--accent-cyan': val('accent-cyan'),
      '--accent-emerald': val('accent-emerald'),
      '--accent-amber': val('accent-amber'),
      '--accent-rose': val('accent-rose'),
      '--border-radius': val('border-radius'),
      '--glass-opacity': val('glass-opacity'),
      '--glass-blur': val('glass-blur'),
      '--transition-speed': val('transition-speed'),
      '--sidebar-width': val('sidebar-width'),
      '--topbar-height': val('topbar-height'),
      '--focus-ring-color': val('focus-ring-color'),
      '--mono-font-family': val('mono-font-family'),
      '--code-font-size': val('code-font-size'),
      '--hover-overlay-opacity': val('hover-overlay-opacity'),
      '--bg-code': val('bg-code'),
      '--modal-overlay': val('modal-overlay')
    };

    const targetThemeId = (isEdit && themeId) ? themeId : ('theme-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    const endpoint = (isEdit && themeId) ? `/api/themes/${themeId}` : '/api/themes';
    const method = (isEdit && themeId) ? 'PUT' : 'POST';

    try {
      const res = await ApiService.request(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, variables, isDefault })
      });

      if (res && res.success) {
        const savedId = (res.theme && res.theme.id) ? res.theme.id : targetThemeId;
        ModalDialog.showNotification(`Theme "${name}" saved and applied!`, 'success');
        
        // Immediately apply the saved theme across the running app
        if (window.app && typeof window.app.changeTopTheme === 'function') {
          await window.app.changeTopTheme(savedId);
        } else if (typeof SettingsView !== 'undefined' && SettingsView.applyTheme) {
          await SettingsView.applyTheme(savedId);
        }
      } else {
        ModalDialog.showNotification('Failed to save theme: ' + (res?.message || 'Server error'), 'error');
      }
    } catch(err) {
      ModalDialog.showNotification('Error saving theme: ' + err.message, 'error');
    }
  }
}

window.SettingsThemeHelper = SettingsThemeHelper;

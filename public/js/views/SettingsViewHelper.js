/**
 * SettingsViewHelper.js
 * Purpose: Helper module for SettingsView containing themes tab HTML, launch rules tab HTML,
 *          System Agents ROCAS specification memos, screen-specific UI/UX layout customizer (imp19 & imp20),
 *          and master data JSON export/import handlers.
 */

class SettingsViewHelper {
  static getThemesList() {
    return [
      // 7 Official Metal Themes (Differentiated: Complementary/Split-Comp/Triadic Accents)
      { id: 'theme-platinum', name: 'Platinum Light Metal', category: 'Metal', accent: '#dde7f1', bg: '#eef3f8', sidebar: '#64748b', card: '#ffffff', text: '#0f172a', contrast: '20% Cool Light', icon: 'fa-shield-halved' },
      { id: 'theme-gold', name: 'Gold Dark Metal', category: 'Metal', accent: '#3b82f6', bg: '#181204', sidebar: '#241b07', card: '#34270d', text: '#fffbeb', contrast: '25% Warm Gold + Blue', icon: 'fa-crown' },
      { id: 'theme-silver', name: 'Silver Light Metal', category: 'Metal', accent: '#6b5b4e', bg: '#f4efe6', sidebar: '#786c5e', card: '#fdfbf7', text: '#1c1510', contrast: '18% Warm Stone Light', icon: 'fa-gem' },
      { id: 'theme-titanium', name: 'Titanium Dark Metal', category: 'Metal', accent: '#00b4d8', bg: '#080c14', sidebar: '#0f1726', card: '#162032', text: '#f0f8ff', contrast: '25% Stealth Cyan', icon: 'fa-cube' },
      { id: 'theme-bronze', name: 'Bronze Dark Metal', category: 'Metal', accent: '#14b8a6', bg: '#261a10', sidebar: '#382618', card: '#4a3422', text: '#fff7ed', contrast: '14% Mid + Seafoam', icon: 'fa-hammer' },
      { id: 'theme-copper', name: 'Copper Dark Metal', category: 'Metal', accent: '#a855f7', bg: '#200a06', sidebar: '#300f09', card: '#44160d', text: '#fff1f0', contrast: '25% Copper + Purple', icon: 'fa-coins' },
      { id: 'theme-obsidian', name: 'Obsidian Dark Metal', category: 'Metal', accent: '#22c55e', bg: '#020303', sidebar: '#060a07', card: '#0b120c', text: '#dcfce7', contrast: '2% Void + Laser Green', icon: 'fa-circle-dot' },

      // 5 Natural Themes (Ecosystem Spectrum)
      { id: 'theme-emerald-forest', name: 'Emerald Forest', category: 'Natural', accent: '#10b981', bg: '#03241b', sidebar: '#053629', card: '#084c3b', text: '#f0fdf4', contrast: '25% Amazon Pine + Lime', icon: 'fa-tree' },
      { id: 'theme-deep-ocean', name: 'Deep Ocean', category: 'Natural', accent: '#00f0ff', bg: '#020817', sidebar: '#04132e', card: '#08204d', text: '#f0f9ff', contrast: '25% Abyssal Aqua + Coral', icon: 'fa-water' },
      { id: 'theme-nordic-pine', name: 'Nordic Pine', category: 'Natural', accent: '#2dd4bf', bg: '#091f1a', sidebar: '#0f2d26', card: '#174036', text: '#ecfdf5', contrast: '25% Fjord Mint + Amber', icon: 'fa-leaf' },
      { id: 'theme-sahara-desert', name: 'Sahara Desert', category: 'Natural', accent: '#f59e0b', bg: '#2b1404', sidebar: '#3d1d06', card: '#542808', text: '#fffbeb', contrast: '25% Dune Gold + Oasis', icon: 'fa-sun' },
      { id: 'theme-autumn-maple', name: 'Autumn Maple', category: 'Natural', accent: '#e11d48', bg: '#26060c', sidebar: '#3a0912', card: '#500d1a', text: '#fff1f2', contrast: '25% Crimson Wine + Gold', icon: 'fa-fire' },

      // 5 Cosmic Themes (Astral Spectrum)
      { id: 'theme-nebula-violet', name: 'Nebula Violet', category: 'Cosmic', accent: '#c026d3', bg: '#130424', sidebar: '#1e0738', card: '#2c0a52', text: '#faf5ff', contrast: '25% Cosmic Orchid + Cyan', icon: 'fa-wand-magic-sparkles' },
      { id: 'theme-galaxy-starlight', name: 'Galaxy Starlight', category: 'Cosmic', accent: '#6366f1', bg: '#050716', sidebar: '#0a0e2a', card: '#101742', text: '#eef2ff', contrast: '25% Pulsar Indigo + Gold', icon: 'fa-star' },
      { id: 'theme-solar-flare', name: 'Solar Flare', category: 'Cosmic', accent: '#ff4500', bg: '#1c0500', sidebar: '#2b0800', card: '#420d00', text: '#fff7ed', contrast: '25% Plasma Orange + Yellow', icon: 'fa-meteor' },
      { id: 'theme-aurora-borealis', name: 'Aurora Borealis', category: 'Cosmic', accent: '#00ffaa', bg: '#021415', sidebar: '#042022', card: '#073033', text: '#f0fdfa', contrast: '25% Polar Emerald + Aqua', icon: 'fa-wind' },
      { id: 'theme-deep-cosmos', name: 'Deep Cosmos', category: 'Cosmic', accent: '#8b5cf6', bg: '#030208', sidebar: '#070514', card: '#0f0b24', text: '#f5f3ff', contrast: '25% Gravitational Violet', icon: 'fa-globe' },

      // 5 Popular Internet Themes (Iconic Specifications)
      { id: 'theme-dracula', name: 'Dracula Dark', category: 'Popular', accent: '#bd93f9', bg: '#1e1f29', sidebar: '#282a36', card: '#343746', text: '#f8f8f2', contrast: '25% Dracula Purple + Pink', icon: 'fa-moon' },
      { id: 'theme-tokyo-night', name: 'Tokyo Night', category: 'Popular', accent: '#7aa2f7', bg: '#16161e', sidebar: '#1a1b26', card: '#24283b', text: '#c0caf5', contrast: '25% Tokyo Storm + Magenta', icon: 'fa-city' },
      { id: 'theme-catppuccin', name: 'Catppuccin Mocha', category: 'Popular', accent: '#cba6f7', bg: '#11111b', sidebar: '#181825', card: '#1e1e2e', text: '#cdd6f4', contrast: '25% Mocha Mauve + Peach', icon: 'fa-cat' },
      { id: 'theme-nord-ice', name: 'Nord Ice', category: 'Popular', accent: '#88c0d0', bg: '#242933', sidebar: '#2e3440', card: '#3b4252', text: '#eceff4', contrast: '25% Arctic Frost + Aurora', icon: 'fa-snowflake' },
      { id: 'theme-cyberpunk', name: 'Cyberpunk Neon', category: 'Popular', accent: '#fee715', bg: '#07050e', sidebar: '#100c1e', card: '#1a1330', text: '#ffffff', contrast: '25% Laser Yellow + Pink', icon: 'fa-bolt' }
    ];
  }

  static getDefaultRocasSpecs() {
    return SettingsAgentHelper.getDefaultRocasSpecs();
  }

  static getDefaultAgentModels() {
    return SettingsAgentHelper.getDefaultAgentModels();
  }

  static renderAgentModelModalHtml(agentId, agentData, availableModels = []) {
    return `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="background: rgba(6, 182, 212, 0.08); border: 1px solid var(--accent-cyan); padding: 10px; border-radius: 6px; font-size: 0.78rem;">
          <strong style="color: var(--text-main); display: block; margin-bottom: 2px;">
            <i class="fa-solid fa-cubes"></i> Agent Attached Model & Provider Configuration
          </strong>
          <span style="color: var(--text-muted);">
            Manage the active AI provider and model attached to <strong>${agentData.name}</strong> based on required core skill: <strong style="color: var(--accent-cyan);">${agentData.skillRequired}</strong>.
          </span>
        </div>

        <form id="agent-model-form" onsubmit="event.preventDefault(); SettingsView.saveAgentModelAttachment('${agentId}');">
          <div class="form-group" style="margin-bottom: 10px;">
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan);">Select from Registered Free Models:</label>
            <select id="agent-select-registered-model" class="form-control" style="font-size: 0.78rem;" onchange="SettingsView.onSelectAgentModel(this.value)">
              <option value="">-- Choose Registered Active Model --</option>
              ${availableModels.map(m => `
              <option value="${m.id}" ${m.modelId === agentData.modelId ? 'selected' : ''}>
                  ${typeof FormatHelper !== 'undefined' ? FormatHelper.getModelDisplayName(m) : (m.modelName || m.modelId)} (${typeof FormatHelper !== 'undefined' ? FormatHelper.getProviderDisplayName(m) : (m.providerName || 'Provider')}) - ${m.coreSkill || 'Skill'}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="grid-2" style="gap: 8px; margin-bottom: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 700; color: var(--primary-light);">Provider Name:</label>
              <input type="text" id="agent-provider-name" class="form-control" style="font-size: 0.78rem;" value="${agentData.providerName || ''}" required />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 700; color: var(--accent-emerald);">Model ID / Endpoint:</label>
              <input type="text" id="agent-model-id" class="form-control" style="font-size: 0.78rem;" value="${agentData.modelId || ''}" required />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--accent-amber);">Display Model Name:</label>
            <input type="text" id="agent-model-name" class="form-control" style="font-size: 0.78rem;" value="${agentData.modelName || ''}" required />
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="SettingsView.resetAgentModelAttachment('${agentId}')">
              <i class="fa-solid fa-rotate-left"></i> Reset to Default
            </button>
            <button type="submit" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-floppy-disk"></i> Save Model Attachment
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Renders the ROCAS Format Modal Dialog HTML
   */
  static renderRocasModalHtml(agentId, rocasData) {
    return `
      <div style="display: flex; flex-direction: column; gap: 10px; max-height: 70vh; overflow-y: auto; padding-right: 4px;">
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid var(--primary-light); padding: 10px; border-radius: 6px; font-size: 0.78rem;">
          <strong style="color: var(--text-main); display: block; margin-bottom: 2px;">
            <i class="fa-solid fa-note-sticky"></i> ROCAS Operational Specification (Role, Task, Goal, Constraints, Input, Output, Validation)
          </strong>
          <span style="color: var(--text-muted);">
            View and update the enterprise work design for <strong>${rocasData.name}</strong>. Changes persist in system configuration.
          </span>
        </div>

        <form id="rocas-memo-form" onsubmit="event.preventDefault(); SettingsView.saveRocasMemo('${agentId}');">
          <div class="form-group" style="margin-bottom: 8px;">
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan);"><i class="fa-solid fa-user-gear"></i> Role:</label>
            <input type="text" id="rocas-role" class="form-control" style="font-size: 0.78rem;" value="${rocasData.role || ''}" required />
          </div>

          <div class="form-group" style="margin-bottom: 8px;">
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--accent-emerald);"><i class="fa-solid fa-list-check"></i> Task:</label>
            <textarea id="rocas-task" class="form-control" style="font-size: 0.76rem; height: 48px;" required>${rocasData.task || ''}</textarea>
          </div>

          <div class="form-group" style="margin-bottom: 8px;">
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--accent-amber);"><i class="fa-solid fa-bullseye"></i> Goal:</label>
            <textarea id="rocas-goal" class="form-control" style="font-size: 0.76rem; height: 48px;" required>${rocasData.goal || rocasData.objectives || ''}</textarea>
          </div>

          <div class="form-group" style="margin-bottom: 8px;">
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--accent-rose);"><i class="fa-solid fa-ban"></i> Constraints:</label>
            <textarea id="rocas-constraints" class="form-control" style="font-size: 0.76rem; height: 48px;" required>${rocasData.constraints || ''}</textarea>
          </div>

          <div class="form-group" style="margin-bottom: 8px;">
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--primary-light);"><i class="fa-solid fa-right-to-bracket"></i> Input:</label>
            <input type="text" id="rocas-input" class="form-control" style="font-size: 0.78rem;" value="${rocasData.input || ''}" required />
          </div>

          <div class="form-group" style="margin-bottom: 8px;">
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan);"><i class="fa-solid fa-right-from-bracket"></i> Output:</label>
            <textarea id="rocas-output" class="form-control" style="font-size: 0.76rem; height: 48px;" required>${rocasData.output || ''}</textarea>
          </div>

          <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--accent-emerald);"><i class="fa-solid fa-shield-check"></i> Validation:</label>
            <textarea id="rocas-validation" class="form-control" style="font-size: 0.76rem; height: 48px;" required>${rocasData.validation || ''}</textarea>
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="SettingsView.resetRocasMemo('${agentId}')">
              <i class="fa-solid fa-rotate-left"></i> Reset to Default
            </button>
            <button type="submit" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-floppy-disk"></i> Save ROCAS Memo
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Default Screen-Specific UI/UX Layout Schemas (imp19_plan_19 & imp20_plan_20)
   */
  static getDefaultScreenSchemas() {
    return {
      universal: {
        screenId: 'universal',
        name: '🌍 Universal App-Wide Defaults Layout',
        leftRailWidthPct: 20,
        centerMinWidthPx: 320,
        rightDrawerWidthPx: 300,
        fontSizePx: 14,
        cardPaddingPx: 12,
        glassOpacity: 0.85,
        borderRadiusPx: 8,
        backdropBlurPx: 16,
        cardShadowPx: 8,
        fontFamily: 'Inter',
        enableAnimations: true,
        enableGlowEffects: true,
        compactDensityMode: true
      },
      dashboard: {
        screenId: 'dashboard',
        name: 'Dashboard View',
        leftRailWidthPct: 20,
        centerMinWidthPx: 300,
        rightDrawerWidthPx: 300,
        statGridTiles: 4,
        maxTelemetryRows: 10,
        refreshIntervalSec: 15,
        fontSizePx: 14,
        cardPaddingPx: 12,
        glassOpacity: 0.85,
        borderRadiusPx: 8
      },
      playground: {
        screenId: 'playground',
        name: 'Playground Chat View',
        leftRailWidthPct: 20,
        centerMinWidthPx: 350,
        rightDrawerWidthPx: 300,
        chatTextareaMaxHeightPx: 120,
        autoSaveIntervalSec: 10,
        showWorkingDetailsDefault: true,
        fontSizePx: 14,
        cardPaddingPx: 10,
        glassOpacity: 0.85,
        borderRadiusPx: 8
      },
      registration: {
        screenId: 'registration',
        name: 'Provider Onboarding Registration',
        leftRailWidthPct: 20,
        centerMinWidthPx: 320,
        rightDrawerWidthPx: 300,
        autoPingOnSelect: true,
        discoveredModelsMaxHeightPx: 140,
        fontSizePx: 14,
        cardPaddingPx: 12,
        glassOpacity: 0.85,
        borderRadiusPx: 8
      },
      config: {
        screenId: 'config',
        name: 'Integration Code Snippets',
        leftRailWidthPct: 20,
        centerMinWidthPx: 300,
        rightDrawerWidthPx: 350,
        defaultTab: 'curl',
        fontSizePx: 13,
        cardPaddingPx: 12,
        glassOpacity: 0.85,
        borderRadiusPx: 8
      },
      providers: {
        screenId: 'providers',
        name: 'Active Providers Panel',
        leftRailWidthPct: 20,
        centerMinWidthPx: 300,
        rightDrawerWidthPx: 300,
        pingThresholdMs: 200,
        maskApiKeysDefault: true,
        fontSizePx: 14,
        cardPaddingPx: 12,
        glassOpacity: 0.85,
        borderRadiusPx: 8
      },
      'model-club': {
        screenId: 'model-club',
        name: 'Model Club & Combo Engine',
        leftRailWidthPct: 20,
        centerMinWidthPx: 320,
        rightDrawerWidthPx: 300,
        defaultViewMode: 'hierarchy',
        autoExpandCombos: true,
        fontSizePx: 14,
        cardPaddingPx: 12,
        glassOpacity: 0.85,
        borderRadiusPx: 8
      },
      settings: {
        screenId: 'settings',
        name: 'System Settings & Config',
        leftRailWidthPct: 20,
        centerMinWidthPx: 350,
        rightDrawerWidthPx: 300,
        themeCardsGridColumns: 3,
        fontSizePx: 14,
        cardPaddingPx: 12,
        glassOpacity: 0.85,
        borderRadiusPx: 8
      },
      reports: {
        screenId: 'reports',
        name: 'Diagnostic & Audit Reports',
        leftRailWidthPct: 20,
        centerMinWidthPx: 300,
        rightDrawerWidthPx: 300,
        logTerminalHeightPx: 400,
        defaultLogLimit: 100,
        fontSizePx: 13,
        cardPaddingPx: 12,
        glassOpacity: 0.85,
        borderRadiusPx: 8
      },
      manual: {
        screenId: 'manual',
        name: 'User Manual & Operational Guide',
        leftRailWidthPct: 20,
        centerMinWidthPx: 350,
        rightDrawerWidthPx: 300,
        accordionExpandSpeedSec: 0.3,
        fontSizePx: 14,
        cardPaddingPx: 14,
        glassOpacity: 0.85,
        borderRadiusPx: 8
      }
    };
  }

  static renderThemesTabHtml(activeTheme) {
    const themes = SettingsViewHelper.getThemesList();

    return `
      <div style="margin-bottom: 16px;">
        <h3 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 4px;">
          <i class="fa-solid fa-palette"></i> 7 Metal Themes & Design System Overrides
        </h3>
        <p style="font-size: 0.82rem; color: var(--text-muted);">
          Select your preferred aesthetic metal skin. Settings persist locally across sessions.
        </p>
      </div>

      <div class="grid-3" style="gap: 12px;">
        ${themes.map(t => `
          <div class="glass-card" style="padding: 14px; border-color: ${activeTheme === t.id ? 'var(--primary)' : 'var(--border-color)'}; border-width: ${activeTheme === t.id ? '2px' : '1px'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: var(--text-main); font-size: 0.9rem;">${t.name}</strong>
              <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: ${t.accent};"></span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px;">
              Background Accent: <code>${t.bg}</code>
            </div>
            <button type="button" class="btn ${activeTheme === t.id ? 'btn-primary' : 'btn-secondary'} btn-xs" style="width: 100%;" onclick="SettingsView.applyTheme('${t.id}')">
              ${activeTheme === t.id ? '<i class="fa-solid fa-check"></i> Active Theme' : 'Apply Theme'}
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  static renderLaunchRulesTabHtml() {
    return `
      <div style="margin-bottom: 16px;">
        <h3 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 4px;">
          <i class="fa-solid fa-shield-halved"></i> Security-First 5-Stage Launch Sequence Rules
        </h3>
        <p style="font-size: 0.82rem; color: var(--text-muted);">
          Chronological startup security rules enforcing zero-trust API proxy initialization.
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div class="glass-card" style="padding: 12px;">
          <h4 style="font-size: 0.9rem; color: var(--accent-cyan); margin: 0 0 4px 0;">Stage 1 (Server Phase): Backend Boot & Security Middleware</h4>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">Mount CORS, CSP headers, rate-limiting, and atomic DB lock handlers on Express boot.</p>
        </div>
        <div class="glass-card" style="padding: 12px;">
          <h4 style="font-size: 0.9rem; color: var(--accent-emerald); margin: 0 0 4px 0;">Stage 2 (Network Phase): Security Handshake & Header Delivery</h4>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">Enforce X-Frame-Options: DENY, X-Content-Type-Options: nosniff, and KeepAlive socket pooling.</p>
        </div>
        <div class="glass-card" style="padding: 12px;">
          <h4 style="font-size: 0.9rem; color: var(--accent-amber); margin: 0 0 4px 0;">Stage 3 (Gatekeeper Phase): Zero-Trust Authentication Gatekeeper</h4>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">Verify Client Bearer key validity and session status before forwarding requests.</p>
        </div>
        <div class="glass-card" style="padding: 12px;">
          <h4 style="font-size: 0.9rem; color: var(--primary-light); margin: 0 0 4px 0;">Stage 4 (Audit Phase): Database Health & Provider Readiness</h4>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">Query active provider base URLs and verify active models availability.</p>
        </div>
        <div class="glass-card" style="padding: 12px;">
          <h4 style="font-size: 0.9rem; color: var(--accent-cyan); margin: 0 0 4px 0;">Stage 5 (View Phase): Sanitized SPA Mount & Telemetry Hydration</h4>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">Render glassmorphism SPA layout with XSS sanitization and top header telemetry.</p>
        </div>
      </div>
    `;
  }
}

window.SettingsViewHelper = SettingsViewHelper;

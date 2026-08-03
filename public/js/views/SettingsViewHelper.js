/**
 * SettingsViewHelper.js
 * Purpose: Helper module for SettingsView containing themes tab HTML, launch rules tab HTML,
 *          System Agents ROCAS specification memos, screen-specific UI/UX layout customizer (imp19 & imp20),
 *          and master data JSON export/import handlers.
 */

class SettingsViewHelper {
  static getThemesList() {
    return [
      { id: 'system-default', name: 'System Default (Auto Dark/Light)', accent: '#6366f1', bg: 'var(--bg-dark)' },
      { id: 'theme-platinum', name: 'Platinum Light Metal', accent: '#4f46e5', bg: '#f1f5f9' },
      { id: 'theme-gold', name: 'Gold Dark Metal', accent: '#fbbf24', bg: '#120e04' },
      { id: 'theme-silver', name: 'Silver Light Metal', accent: '#475569', bg: '#e2e8f0' },
      { id: 'theme-titanium', name: 'Titanium Dark Metal', accent: '#38bdf8', bg: '#070a10' },
      { id: 'theme-bronze', name: 'Bronze Dark Metal', accent: '#d97706', bg: '#180e08' },
      { id: 'theme-copper', name: 'Copper Dark Metal', accent: '#f97316', bg: '#1c0d0a' },
      { id: 'theme-obsidian', name: 'Obsidian Dark Metal', accent: '#6366f1', bg: '#06080d' }
    ];
  }

  static getDefaultRocasSpecs() {
    return SettingsAgentHelper.getDefaultRocasSpecs();
  }

  static getDefaultAgentModels() {
    return SettingsAgentHelper.getDefaultAgentModels();
  }

  /**
   * Renders Attached Model Configuration Modal Dialog HTML
   */
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
                  ${typeof FormatHelper !== 'undefined' ? FormatHelper.sanitizeModelName(m.modelName || m.modelId) : (m.modelName || m.modelId)} (${m.providerName || 'Provider'}) - ${m.coreSkill || 'Skill'}
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
      dashboard: {
        screenId: 'dashboard',
        name: 'Dashboard View',
        leftRailWidthPct: 15,
        centerMinWidthPx: 300,
        rightDrawerWidthPx: 300,
        gridLayout: '2-Row Grid',
        statGridTiles: 4,
        maxTelemetryRows: 10,
        pulseAnimation: true,
        fontSizePx: 14,
        cardPaddingPx: 12,
        glassOpacity: 0.85
      },
      playground: {
        screenId: 'playground',
        name: 'Playground Chat View',
        leftRailWidthPct: 15,
        centerMinWidthPx: 350,
        rightDrawerWidthPx: 300,
        chatTextareaMaxHeightPx: 120,
        monospaceCodeFont: true,
        fontSizePx: 14,
        cardPaddingPx: 10,
        glassOpacity: 0.85
      },
      registration: {
        screenId: 'registration',
        name: 'Provider Onboarding Registration',
        leftRailWidthPct: 15,
        centerMinWidthPx: 320,
        rightDrawerWidthPx: 300,
        formWidthPct: 60,
        discoveredModelsMaxHeightPx: 140,
        fontSizePx: 14,
        cardPaddingPx: 12,
        glassOpacity: 0.85
      },
      config: {
        screenId: 'config',
        name: 'Integration Code Snippets',
        leftRailWidthPct: 15,
        centerMinWidthPx: 300,
        rightDrawerWidthPx: 350,
        monospaceCodeFont: true,
        lineHeightRatio: 1.4,
        copyButtonPlacement: 'Top Right',
        fontSizePx: 13,
        cardPaddingPx: 12,
        glassOpacity: 0.85
      },
      providers: {
        screenId: 'providers',
        name: 'Active Providers Panel',
        leftRailWidthPct: 15,
        centerMinWidthPx: 300,
        rightDrawerWidthPx: 300,
        gridColumns: 3,
        pingThresholdMs: 200,
        actionDropdownPlacement: 'Right',
        fontSizePx: 14,
        cardPaddingPx: 12,
        glassOpacity: 0.85
      },
      'model-club': {
        screenId: 'model-club',
        name: 'Model Club & Combo Engine',
        leftRailWidthPct: 15,
        centerMinWidthPx: 320,
        rightDrawerWidthPx: 300,
        taxonomyGridColumns: 3,
        filterBarPosition: 'Top',
        fontSizePx: 14,
        cardPaddingPx: 12,
        glassOpacity: 0.85
      },
      settings: {
        screenId: 'settings',
        name: 'System Settings & Config',
        leftRailWidthPct: 20,
        centerMinWidthPx: 350,
        rightDrawerWidthPx: 300,
        inspectorSplit: '2-Column Left Rail + Right Detail',
        themeCardsGridColumns: 3,
        fontSizePx: 14,
        cardPaddingPx: 12,
        glassOpacity: 0.85
      },
      reports: {
        screenId: 'reports',
        name: 'Diagnostic & Audit Reports',
        leftRailWidthPct: 15,
        centerMinWidthPx: 300,
        rightDrawerWidthPx: 300,
        logTerminalHeightPx: 400,
        logFontSizePx: 12,
        autoScrollStream: true,
        fontSizePx: 13,
        cardPaddingPx: 12,
        glassOpacity: 0.85
      },
      manual: {
        screenId: 'manual',
        name: 'User Manual & Operational Guide',
        leftRailWidthPct: 20,
        centerMinWidthPx: 350,
        rightDrawerWidthPx: 300,
        tocRailWidthPct: 20,
        accordionExpandSpeedSec: 0.3,
        fontSizePx: 14,
        cardPaddingPx: 14,
        glassOpacity: 0.85
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

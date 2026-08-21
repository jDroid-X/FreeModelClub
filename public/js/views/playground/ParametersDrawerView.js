/**
 * public/js/views/playground/ParametersDrawerView.js
 * OOPS View: Manages sliding drawer UI, range sliders, and active settings elements.
 */

class ParametersDrawerView {
  static toggleParametersDrawer(forceShow) {
    const drawer = document.getElementById('chat-parameters-right-drawer');
    const mainWindow = document.getElementById('playground-chat-main-window') || document.getElementById('chat-workspace-pane');
    if (!drawer) return;

    const isVisible = drawer.style.opacity === '1' || (drawer.style.width && drawer.style.width !== '0px');
    const shouldShow = forceShow !== null && forceShow !== undefined ? forceShow : !isVisible;

    if (shouldShow) {
      drawer.style.width = '300px';
      drawer.style.minWidth = '260px';
      drawer.style.maxWidth = '360px';
      drawer.style.padding = '10px';
      drawer.style.borderLeft = '1px solid var(--border-color)';
      drawer.style.opacity = '1';
      drawer.style.pointerEvents = 'auto';
      if (mainWindow) {
        mainWindow.style.flex = '1 1 0%';
        mainWindow.style.minWidth = '280px';
      }
    } else {
      drawer.style.width = '0px';
      drawer.style.minWidth = '0px';
      drawer.style.maxWidth = '0px';
      drawer.style.padding = '0px';
      drawer.style.borderLeftWidth = '0px';
      drawer.style.opacity = '0';
      drawer.style.pointerEvents = 'none';
      if (mainWindow) {
        mainWindow.style.flex = '1 1 0%';
        mainWindow.style.minWidth = '0';
      }
    }
  }

  static updateHyperDisplay(param, value) {
    if (param === 'temperature') {
      const el = document.getElementById('temp-val-display');
      const badge = document.getElementById('header-temp-badge');
      if (el) el.textContent = value;
      if (badge) badge.textContent = value;
    } else if (param === 'topP') {
      const el = document.getElementById('topp-val-display');
      if (el) el.textContent = value;
    } else if (param === 'maxTokens') {
      const el = document.getElementById('maxtokens-val-display');
      if (el) el.textContent = value;
    } else if (param === 'frequencyPenalty') {
      const el = document.getElementById('freqpen-val-display');
      if (el) el.textContent = value;
    } else if (param === 'presencePenalty') {
      const el = document.getElementById('prespen-val-display');
      if (el) el.textContent = value;
    }
  }

  static renderDrawerHtml(activeSession = {}) {
    const s = activeSession || {};
    const esc = (typeof PlaygroundViewHelper !== 'undefined') ? PlaygroundViewHelper.escapeHtml : (str => str || '');
    return `
      <div id="chat-parameters-right-drawer" class="glass-panel" style="width: 0px; min-width: 0px; max-width: 0px; flex-shrink: 0; flex-grow: 0; padding: 0px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; overflow-x: hidden; border-left: 0px solid var(--border-color); background: var(--bg-sidebar); height: 100%; margin-bottom: 0; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); opacity: 0; pointer-events: none; z-index: 95;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; min-width: 260px;">
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan);"><i class="fa-solid fa-sliders"></i> Hyperparameters</span>
          <button class="btn btn-link btn-xs" style="color: var(--text-muted); font-size: 1.1rem; cursor: pointer;" onclick="PlaygroundView.toggleSidebar('right')">&times;</button>
        </div>

        <!-- Sliders -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); display: flex; justify-content: space-between;">
            <span><i class="fa-solid fa-temperature-half"></i> Temperature</span>
            <span id="temp-val-display" style="color: var(--accent-amber);">${s.temperature || 0.7}</span>
          </div>
          <input type="range" class="form-range-slider" id="param-temp-slider" min="0" max="2" step="0.1" value="${s.temperature || 0.7}" style="width:100%; cursor:pointer;" oninput="PlaygroundView.updateHyperparameter('temperature', parseFloat(this.value))">

          <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); display: flex; justify-content: space-between; margin-top: 4px;">
            <span><i class="fa-solid fa-filter"></i> Top-P</span>
            <span id="topp-val-display" style="color: var(--accent-amber);">${s.topP || 0.9}</span>
          </div>
          <input type="range" class="form-range-slider" id="param-topp-slider" min="0" max="1" step="0.05" value="${s.topP || 0.9}" style="width:100%; cursor:pointer;" oninput="PlaygroundView.updateHyperparameter('topP', parseFloat(this.value))">

          <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); display: flex; justify-content: space-between; margin-top: 4px;">
            <span><i class="fa-solid fa-coins"></i> Max Tokens</span>
            <span id="maxtokens-val-display" style="color: var(--accent-amber);">${s.maxTokens || 4096}</span>
          </div>
          <input type="range" class="form-range-slider" id="param-maxtokens-slider" min="256" max="16384" step="256" value="${s.maxTokens || 4096}" style="width:100%; cursor:pointer;" oninput="PlaygroundView.updateHyperparameter('maxTokens', parseInt(this.value))">

          <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); display: flex; justify-content: space-between; margin-top: 4px;">
            <span><i class="fa-solid fa-repeat"></i> Frequency Penalty</span>
            <span id="freqpen-val-display" style="color: var(--accent-amber);">${s.frequencyPenalty || 0.0}</span>
          </div>
          <input type="range" class="form-range-slider" id="param-freqpen-slider" min="0" max="2" step="0.1" value="${s.frequencyPenalty || 0.0}" style="width:100%; cursor:pointer;" oninput="PlaygroundView.updateHyperparameter('frequencyPenalty', parseFloat(this.value))">

          <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); display: flex; justify-content: space-between; margin-top: 4px;">
            <span><i class="fa-solid fa-ghost"></i> Presence Penalty</span>
            <span id="prespen-val-display" style="color: var(--accent-amber);">${s.presencePenalty || 0.0}</span>
          </div>
          <input type="range" class="form-range-slider" id="param-prespen-slider" min="0" max="2" step="0.1" value="${s.presencePenalty || 0.0}" style="width:100%; cursor:pointer;" oninput="PlaygroundView.updateHyperparameter('presencePenalty', parseFloat(this.value))">
        </div>

        <!-- System Prompt with ROCA Format Presets -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan);"><i class="fa-solid fa-user-gear"></i> System Prompt (ROCA Format)</label>
          </div>
          <select id="select-system-prompt-roca" class="form-control" style="font-size: 0.68rem; padding: 2px 4px; margin-bottom: 4px;" onchange="PlaygroundView.applySystemPromptPreset(this.value)">
            <option value="">-- Select ROCA System Prompt Preset --</option>
            <option value="expert">1. Expert Multidisciplinary AI Assistant [ROCA]</option>
            <option value="architect">2. Clean OOPS MVC Enterprise Architect [ROCA]</option>
            <option value="fullstack">3. Full-Stack Node.js &amp; Vanilla JS Engineer [ROCA]</option>
            <option value="uncensored">4. Uncensored Raw Developer Mode [ROCA]</option>
            <option value="qa">5. QA &amp; Automated Test Architecture Auditor [ROCA]</option>
            <option value="database">6. JSON Database &amp; Schema Persistence Architect [ROCA]</option>
            <option value="security">7. Zero-Trust Security &amp; Key Protection Guard [ROCA]</option>
            <option value="bi_analytics">8. BI &amp; Telemetry Analytics Specialist [ROCA]</option>
            <option value="ui_ux">9. Glassmorphism UI/UX Pro-Max Designer [ROCA]</option>
            <option value="json_schema">10. Strict JSON Schema Output Generator [ROCA]</option>
            <option value="debugger">11. Root-Cause Diagnostic &amp; Self-Healing Debugger [ROCA]</option>
            <option value="prompt_engineer">12. Prompt Engineering &amp; ROCAS Optimizer [ROCA]</option>
          </select>
          <textarea id="param-system-prompt" class="form-control" style="font-size: 0.72rem; min-height: 95px; resize: vertical; background: var(--bg-input);" placeholder="Enter custom assistant system prompt (ROCA format: Role, Objective, Context, Actions)..." onchange="PlaygroundView.updateSystemPrompt(this.value)">${esc(s.systemPrompt || '')}</textarea>
        </div>

        <!-- Show Working Details Toggle -->
        <div style="background: rgba(56,189,248,0.08); border: 1px solid var(--accent-cyan); border-radius: 6px; padding: 8px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); cursor: pointer;">
            <input type="checkbox" id="param-show-working-details" ${s.showWorkingDetails ? 'checked' : ''} onchange="PlaygroundView.toggleShowWorkingDetails(this.checked)" />
            <i class="fa-solid fa-circle-info"></i> Show Working Details
          </label>
          <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px; line-height: 1.3;">
            Reasoning details display toggle.
          </div>
        </div>

        <!-- Uncensored Mode -->
        <div style="background: rgba(244,63,94,0.08); border: 1px solid var(--accent-rose); border-radius: 6px; padding: 8px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 700; color: var(--accent-rose); cursor: pointer;">
            <input type="checkbox" id="param-uncensored-mode" ${s.uncensored ? 'checked' : ''} onchange="PlaygroundView.toggleUncensoredMode(this.checked)" />
            <i class="fa-solid fa-radiation"></i> Uncensored Mode
          </label>
          <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px; line-height: 1.3;">
            Developer mode bypass.
          </div>
        </div>
      </div>
    `;
  }
}

window.ParametersDrawerView = ParametersDrawerView;


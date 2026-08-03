/**
 * SettingsAgentRenderHelper.js
 * Purpose: Render HTML cards matching theme header background and launch buttons for all 30 Agents (< 140 lines).
 * Dependencies: FormatHelper, ModalDialog
 */

class SettingsAgentRenderHelper {
  static renderTabHtml(rocasSpecs, agentModels) {
    const agentKeys = Object.keys(rocasSpecs);
    return `
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 4px;">
            <i class="fa-solid fa-robot" style="color: var(--accent-emerald);"></i> System & Enterprise AI Agents Manager (${agentKeys.length} Active Agents)
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-muted);">
            Manage ROCAS specification memos, role definitions, attached LLM models, and launch working scenarios for all agents.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" onclick="SettingsView.switchTab('agents')">
            <i class="fa-solid fa-arrows-rotate"></i> Refresh Agents
          </button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 12px;">
        ${agentKeys.map(key => {
          const spec = rocasSpecs[key] || {};
          const model = agentModels[key] || {};
          return SettingsAgentRenderHelper.renderAgentCardHtml(key, spec, model);
        }).join('')}
      </div>
    `;
  }

  static renderAgentCardHtml(key, spec, model) {
    const displayName = spec.name || model.name || key;
    const role = spec.role || 'Enterprise System Agent';
    const provider = model.providerName || 'Built-in Engine';
    const modelName = model.modelName || model.modelId || 'Attached Model';

    return `
      <div class="glass-panel" style="padding: 14px; display: flex; flex-direction: column; justify-content: space-between; background: var(--panel-header-bg, rgba(255, 255, 255, 0.05)); border: 1px solid var(--border-color); box-shadow: var(--panel-shadow);">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <strong style="font-size: 0.92rem; color: var(--accent-emerald); display: block;">${displayName}</strong>
              <span style="font-size: 0.72rem; color: var(--accent-cyan); font-weight: 600;">${spec.agentId || key}</span>
            </div>
            <span class="badge badge-emerald" style="font-size: 0.65rem;"><i class="fa-solid fa-circle-check"></i> Active</span>
          </div>

          <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 10px; min-height: 38px;">
            ${role}
          </div>

          <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.75rem; margin-bottom: 10px;">
            <div style="color: var(--primary-light); font-weight: 700; margin-bottom: 2px;">
              <i class="fa-solid fa-microchip"></i> Attached Model:
            </div>
            <div style="color: var(--text-main); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${modelName}
            </div>
            <div style="color: var(--text-dim); font-size: 0.7rem; margin-top: 2px;">
              Provider: ${provider}
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 4px; margin-top: 6px;">
          <button class="btn btn-secondary btn-xs" style="flex: 1; padding: 4px 6px; font-size: 0.72rem;" onclick="SettingsView.openRocasModal('${key}')" title="View ROCAS Spec">
            <i class="fa-solid fa-file-lines"></i> ROCAS
          </button>
          <button class="btn btn-secondary btn-xs" style="flex: 1; padding: 4px 6px; font-size: 0.72rem;" onclick="SettingsView.openAgentModelModal('${key}')" title="Change Attached Model">
            <i class="fa-solid fa-sliders"></i> Model
          </button>
          <button class="btn btn-primary btn-xs" style="flex: 1.2; padding: 4px 6px; font-size: 0.72rem;" onclick="SettingsView.launchAgent('${key}')" title="Launch Working Scenario">
            <i class="fa-solid fa-rocket"></i> Launch Agent
          </button>
        </div>
      </div>
    `;
  }
}

window.SettingsAgentRenderHelper = SettingsAgentRenderHelper;

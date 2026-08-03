/**
 * ModelClubNavHelper.js
 * Purpose: Dedicated Navigation Rail Component for ModelClubView (< 80 lines).
 * Dependencies: None
 */

class ModelClubNavHelper {
  static renderNavTreeHtml(combos, allProviders, familyGroups, skillGroups, currentViewMode, selectedHeader, expandedBranches) {
    const jdroidx = (combos || []).find(c => c.name && c.name.toLowerCase().includes('jdroid'));
    const modelClubCombos = (combos || []).filter(c => c !== jdroidx);

    return `
      <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.78rem;">
        <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-emerald); text-align: center; border-bottom: 1px solid var(--accent-emerald); padding-bottom: 5px; margin-bottom: 2px;">
          <i class="fa-solid fa-gem"></i> Combo Club
        </div>

        <button class="btn btn-secondary btn-xs" style="justify-content: flex-start; text-align: left; padding: 4px 8px; font-size: 0.72rem; ${currentViewMode === 'hierarchy' ? 'border-color: var(--accent-emerald); font-weight: 700;' : ''}" onclick="ModelClubView.switchView('hierarchy')">
          <i class="fa-solid fa-microchip" style="color: var(--accent-cyan); margin-right: 4px;"></i> ${jdroidx ? jdroidx.name : 'jDroidX Agent'}
          <span class="badge badge-emerald" style="font-size: 0.55rem; margin-left: auto;">Master</span>
        </button>

        <div style="font-size: 0.72rem; font-weight: 700; color: var(--primary-light); text-align: center; border-bottom: 1px solid var(--primary-light); padding-bottom: 5px; margin-top: 6px; margin-bottom: 2px;">
          <i class="fa-solid fa-sitemap"></i> Model Club
        </div>

        <button class="btn btn-secondary btn-xs" style="justify-content: flex-start; text-align: left; padding: 4px 8px; font-size: 0.72rem; ${currentViewMode === 'hierarchy' ? 'border-color: var(--accent-emerald); font-weight: 700;' : ''}" onclick="ModelClubView.switchView('hierarchy')">
          <i class="fa-solid fa-sitemap" style="color: var(--accent-emerald); margin-right: 6px;"></i> 5-Pane Matrix View
        </button>

        <!-- Model Combos Branch -->
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <button class="btn btn-secondary btn-xs" style="justify-content: space-between; text-align: left; ${currentViewMode === 'combos' ? 'border-color: var(--accent-emerald); font-weight: 700;' : ''}" onclick="ModelClubView.toggleBranch('combos')">
            <span><i class="fa-solid fa-layer-group" style="color: var(--accent-emerald); margin-right: 6px;"></i> Model Combos (${modelClubCombos.length})</span>
            <i class="fa-solid ${expandedBranches.combos ? 'fa-chevron-down' : 'fa-chevron-right'}" style="font-size: 0.65rem;"></i>
          </button>
          ${expandedBranches.combos ? `<div style="display: flex; flex-direction: column; gap: 2px; padding-left: 10px; border-left: 1px dashed var(--border-color); margin-left: 6px; max-height: 120px; overflow-y: auto;">
            ${modelClubCombos.map(c => `<button class="btn btn-secondary btn-xs" style="justify-content: flex-start; padding: 2px 6px; font-size: 0.7rem; border: none; background: transparent; color: ${selectedHeader === c.id ? 'var(--accent-emerald)' : 'var(--text-muted)'}; text-align: left;" onclick="ModelClubView.switchView('combos', '${c.id}')">• ${c.name}</button>`).join('')}
          </div>` : ''}
        </div>

        <!-- Core Skills Branch -->
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <button class="btn btn-secondary btn-xs" style="justify-content: space-between; text-align: left; ${currentViewMode === 'skills' ? 'border-color: var(--accent-amber); font-weight: 700;' : ''}" onclick="ModelClubView.toggleBranch('skills')">
            <span><i class="fa-solid fa-brain" style="color: var(--accent-amber); margin-right: 6px;"></i> Core Skills (${(skillGroups||[]).length})</span>
            <i class="fa-solid ${expandedBranches.skills ? 'fa-chevron-down' : 'fa-chevron-right'}" style="font-size: 0.65rem;"></i>
          </button>
          ${expandedBranches.skills ? `<div style="display: flex; flex-direction: column; gap: 2px; padding-left: 10px; border-left: 1px dashed var(--border-color); margin-left: 6px; max-height: 120px; overflow-y: auto;">
            ${(skillGroups||[]).map(s => `<button class="btn btn-secondary btn-xs" style="justify-content: flex-start; padding: 2px 6px; font-size: 0.7rem; border: none; background: transparent; color: ${selectedHeader === s.skillName ? 'var(--accent-amber)' : 'var(--text-muted)'}; text-align: left;" onclick="ModelClubView.switchView('skills', '${encodeURIComponent(s.skillName)}')">• ${s.skillName} (${s.models ? s.models.length : 0})</button>`).join('')}
          </div>` : ''}
        </div>

        <!-- Model Families Branch -->
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <button class="btn btn-secondary btn-xs" style="justify-content: space-between; text-align: left; ${currentViewMode === 'family' ? 'border-color: var(--accent-cyan); font-weight: 700;' : ''}" onclick="ModelClubView.toggleBranch('family')">
            <span><i class="fa-solid fa-folder-tree" style="color: var(--accent-cyan); margin-right: 6px;"></i> Model Families (${(familyGroups||[]).length})</span>
            <i class="fa-solid ${expandedBranches.family ? 'fa-chevron-down' : 'fa-chevron-right'}" style="font-size: 0.65rem;"></i>
          </button>
          ${expandedBranches.family ? `<div style="display: flex; flex-direction: column; gap: 2px; padding-left: 10px; border-left: 1px dashed var(--border-color); margin-left: 6px; max-height: 120px; overflow-y: auto;">
            ${(familyGroups||[]).map(f => `<button class="btn btn-secondary btn-xs" style="justify-content: flex-start; padding: 2px 6px; font-size: 0.7rem; border: none; background: transparent; color: ${selectedHeader === f.familyName ? 'var(--accent-cyan)' : 'var(--text-muted)'}; text-align: left;" onclick="ModelClubView.switchView('family', '${encodeURIComponent(f.familyName)}')">• ${f.familyName} (${f.models ? f.models.length : 0})</button>`).join('')}
          </div>` : ''}
        </div>

        <!-- Active Providers Branch -->
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <button class="btn btn-secondary btn-xs" style="justify-content: space-between; text-align: left; ${currentViewMode === 'providers' ? 'border-color: var(--primary-light); font-weight: 700;' : ''}" onclick="ModelClubView.toggleBranch('providers')">
            <span><i class="fa-solid fa-server" style="color: var(--primary-light); margin-right: 6px;"></i> Active Providers (${(allProviders||[]).length})</span>
            <i class="fa-solid ${expandedBranches.providers ? 'fa-chevron-down' : 'fa-chevron-right'}" style="font-size: 0.65rem;"></i>
          </button>
          ${expandedBranches.providers ? `<div style="display: flex; flex-direction: column; gap: 2px; padding-left: 10px; border-left: 1px dashed var(--border-color); margin-left: 6px; max-height: 120px; overflow-y: auto;">
            ${(allProviders||[]).map(p => `<button class="btn btn-secondary btn-xs" style="justify-content: flex-start; padding: 2px 6px; font-size: 0.7rem; border: none; background: transparent; color: ${selectedHeader === p.id ? 'var(--primary-light)' : 'var(--text-muted)'}; text-align: left;" onclick="ModelClubView.switchView('providers', '${encodeURIComponent(p.id)}')">• ${p.displayName || p.id}</button>`).join('')}
          </div>` : ''}
        </div>

        <!-- Create Combo Studio -->
        <button class="btn btn-secondary btn-xs" style="justify-content: flex-start; text-align: left; margin-top: 4px; ${currentViewMode === 'create-combo' ? 'border-color: var(--accent-emerald); font-weight: 700;' : ''}" onclick="ModelClubView.openCreateComboStudio()">
          <i class="fa-solid fa-wand-magic-sparkles" style="color: var(--accent-emerald); margin-right: 6px;"></i> + Create Combo Studio
        </button>
      </div>`;
  }
}

window.ModelClubNavHelper = ModelClubNavHelper;

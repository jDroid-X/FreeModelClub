/**
 * ModelClubComboModalRenderer.js
 * Purpose: Dedicated View Renderer Component for Combo Modals, Options Dialogs & Validations (< 170 lines).
 * Dependencies: ModalDialog, ApiService
 */

class ModelClubComboModalRenderer {
  static renderCreateComboModalBody(stagedIds, defaultName, allModels) {
    const stagedSet = new Set(stagedIds || []);
    const list = (allModels || []).filter(m => stagedSet.has(m.id) || stagedSet.has(m.modelId));
    return `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div class="form-group">
          <label style="font-size:0.78rem;font-weight:700;color:var(--accent-emerald);">Combo Agent Name *</label>
          <input type="text" id="combo-modal-name" class="form-control" value="${defaultName || ''}" placeholder="e.g. claude-opus-coding-agent" />
        </div>
        <div class="form-group">
          <label style="font-size:0.78rem;font-weight:700;color:var(--accent-cyan);">Load Balancing Strategy</label>
          <select id="combo-modal-strategy" class="form-control">
            <option value="Round Robin" selected>Round Robin (Equal Weight Distribution)</option>
            <option value="Fallback">Fallback (Failover Sequential Priority)</option>
            <option value="Lowest Latency">Lowest Latency (Speed Optimized)</option>
            <option value="Weighted">Weighted (Custom Probability)</option>
          </select>
        </div>
        <div class="form-group">
          <label style="font-size:0.78rem;font-weight:700;color:var(--text-main);">Description / Purpose</label>
          <input type="text" id="combo-modal-desc" class="form-control" placeholder="e.g. Master coding agent with automatic failover" />
        </div>
        <div style="padding:8px;border-radius:6px;background:rgba(0,0,0,0.3);border:1px solid var(--border-color);">
          <div style="font-size:0.74rem;font-weight:700;color:var(--accent-amber);margin-bottom:4px;display:flex;justify-content:space-between;">
            <span><i class="fa-solid fa-list-check"></i> Pooled Models Selected (${list.length})</span>
          </div>
          <div style="max-height:140px;overflow-y:auto;display:flex;flex-direction:column;gap:3px;">
            ${list.length > 0 ? list.map(m => `
              <div style="font-size:0.68rem;padding:3px 6px;border-radius:4px;background:rgba(255,255,255,0.03);display:flex;justify-content:space-between;align-items:center;">
                <span><i class="fa-solid fa-robot" style="color:var(--accent-emerald);margin-right:4px;"></i><strong>${m.modelName || m.modelId}</strong></span>
                <span class="badge badge-steel" style="font-size:0.55rem;">${m.providerName || m.providerId || 'Provider'}</span>
              </div>`).join('') : '<span style="font-size:0.7rem;color:var(--accent-rose);">No models selected yet. Pick models from the 5-Pane Matrix.</span>'}
          </div>
        </div>
      </div>`;
  }

  static renderEditComboModalBody(combo, allModels) {
    const rawPooled = combo.modelsList || [];
    const pooledIds = new Set(rawPooled);
    // Also build a set of alternate IDs (providerId_modelId composite) to handle
    // cases where combos stored IDs in an older format before normalization
    const pooledAltIds = new Set();
    rawPooled.forEach(id => {
      const m = (allModels || []).find(x => x.id === id || x.modelId === id);
      if (m) { pooledAltIds.add(m.id); if (m.modelId) pooledAltIds.add(m.modelId); }
    });
    const models = (allModels || []).map(m => ({
      ...m,
      isChecked: pooledIds.has(m.id) || pooledAltIds.has(m.id) || pooledIds.has(m.modelId)
    }));
    return `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div class="form-group">
          <label style="font-size:0.78rem;font-weight:700;color:var(--accent-emerald);">Combo Agent Name *</label>
          <input type="text" id="edit-combo-name" class="form-control" value="${combo.name || ''}" />
        </div>
        <div class="form-group">
          <label style="font-size:0.78rem;font-weight:700;color:var(--accent-cyan);">Load Balancing Strategy</label>
          <select id="edit-combo-strategy" class="form-control">
            <option value="Round Robin" ${combo.strategy === 'Round Robin' ? 'selected' : ''}>Round Robin (Equal Weight)</option>
            <option value="Fallback" ${combo.strategy === 'Fallback' ? 'selected' : ''}>Fallback (Failover Sequential)</option>
            <option value="Lowest Latency" ${combo.strategy === 'Lowest Latency' ? 'selected' : ''}>Lowest Latency (Speed Optimized)</option>
            <option value="Weighted" ${combo.strategy === 'Weighted' ? 'selected' : ''}>Weighted (Custom Probability)</option>
          </select>
        </div>
        <div class="form-group">
          <label style="font-size:0.78rem;font-weight:700;color:var(--text-main);">Description</label>
          <input type="text" id="edit-combo-desc" class="form-control" value="${combo.description || ''}" />
        </div>
        <div class="form-group">
          <label style="font-size:0.78rem;font-weight:700;color:var(--accent-amber);">Pooled Models Selection (${pooledIds.size}/${allModels.length})</label>
          <div style="max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:3px;padding:6px;border:1px solid var(--border-color);border-radius:6px;background:rgba(0,0,0,0.25);">
            ${models.map(m => `
              <label style="display:flex;align-items:center;justify-content:space-between;font-size:0.68rem;padding:3px 5px;border-radius:4px;background:${m.isChecked ? 'rgba(16,185,129,0.15)' : 'transparent'};cursor:pointer;">
                <span><input type="checkbox" class="edit-combo-model-chk" value="${m.id}" ${m.isChecked ? 'checked' : ''} /> <strong style="color:var(--text-main);">${m.modelName || m.modelId}</strong></span>
                <span style="font-size:0.58rem;color:var(--accent-cyan);">${m.providerName || m.providerId}</span>
              </label>`).join('')}
          </div>
        </div>
      </div>`;
  }

  static validateComboInput(name, modelIds) {
    if (!name || !name.trim()) {
      ModalDialog.showNotification('Validation Error: Combo Agent Name is required!', 'error');
      return false;
    }
    if (!Array.isArray(modelIds) || modelIds.length === 0) {
      ModalDialog.showNotification('Validation Error: Select at least 1 pooled model for this combo!', 'error');
      return false;
    }
    return true;
  }
}

window.ModelClubComboModalRenderer = ModelClubComboModalRenderer;

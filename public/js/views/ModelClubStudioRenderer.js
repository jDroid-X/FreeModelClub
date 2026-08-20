/**
 * ModelClubStudioRenderer.js
 * Purpose: Dedicated View Renderer Component for Combo Studio 5-Pane Staging Matrix (< 170 lines).
 * Dependencies: ModelClubComboStudioHelper
 */

class ModelClubStudioRenderer {
  static renderComboStudioHtml(helper) {
    const isEdit = !!helper.editingComboId;
    const stagedCount = helper.stagedModelIds.size;
    const totalModels = helper.models.length;

    return `
      <div class="glass-panel" style="padding:12px;border:1px solid var(--accent-emerald);display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-color);padding-bottom:6px;">
          <div>
            <h4 style="margin:0;color:var(--accent-emerald);font-size:0.98rem;display:flex;align-items:center;gap:6px;">
              <i class="fa-solid ${isEdit ? 'fa-pen-to-square' : 'fa-wand-magic-sparkles'}"></i> ${isEdit ? `Edit Combo Agent: ${helper.stagedName}` : 'Create New Model Combo Agent'}
            </h4>
            <span style="font-size:0.68rem;color:var(--text-muted);">Use the 5-Pane Staging Matrix below to select/deselect pooled models with 2-way Top-Down & Bottom-Up hierarchy linking</span>
          </div>
          <div style="display:flex;gap:6px;">
            <button type="button" class="btn btn-emerald btn-xs" onclick="ModelClubComboStudioHelper.saveStudioCombo()"><i class="fa-solid fa-floppy-disk"></i> ${isEdit ? 'Save Changes' : 'Save & Register Combo'}</button>
            <button type="button" class="btn btn-secondary btn-xs" onclick="ModelClubView.switchView('hierarchy')"><i class="fa-solid fa-xmark"></i> Cancel</button>
          </div>
        </div>

        <!-- TOP CONFIG FORM -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;background:rgba(0,0,0,0.25);padding:8px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.05);">
          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:0.72rem;font-weight:700;color:var(--accent-emerald);">Combo Agent Name *</label>
            <input type="text" id="studio-combo-name" class="form-control" style="font-family:var(--font-main);font-size:var(--font-size-base, 0.75rem);font-weight:var(--font-weight-base, normal);font-style:var(--font-style-base, normal);padding:3px 7px;height:28px;" value="${helper.stagedName || ''}" placeholder="e.g. claude-opus-coding-agent" />
          </div>

          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:0.72rem;font-weight:700;color:var(--accent-cyan);">Load Balancing Strategy</label>
            <select id="studio-combo-strategy" class="form-control" style="font-family:var(--font-main);font-size:var(--font-size-base, 0.75rem);font-weight:var(--font-weight-base, normal);font-style:var(--font-style-base, normal);padding:3px 7px;height:28px;">
              <option value="Round Robin" ${helper.stagedStrategy === 'Round Robin' ? 'selected' : ''}>Round Robin (Equal Weight)</option>
              <option value="Fallback" ${helper.stagedStrategy === 'Fallback' ? 'selected' : ''}>Fallback (Failover Sequential)</option>
              <option value="Auto" ${helper.stagedStrategy === 'Auto' ? 'selected' : ''}>🤖 Auto (Multi-Factor Scoring Engine)</option>
              <option value="Cost Optimized" ${helper.stagedStrategy === 'Cost Optimized' ? 'selected' : ''}>💲 Cost Optimized (Cheapest Provider First)</option>
              <option value="Least Used" ${helper.stagedStrategy === 'Least Used' ? 'selected' : ''}>⚖️ Least Used (Min Active Connections)</option>
              <option value="Power of 2 Choices" ${helper.stagedStrategy === 'Power of 2 Choices' ? 'selected' : ''}>🎲 Power of 2 Choices (P2C Dual Random)</option>
              <option value="LKGP" ${helper.stagedStrategy === 'LKGP' ? 'selected' : ''}>📌 LKGP (Last-Known-Good Session Sticky)</option>
              <option value="Fill First" ${helper.stagedStrategy === 'Fill First' ? 'selected' : ''}>🔋 Fill First (Greedy Quota Exhaustion)</option>
              <option value="Headroom" ${helper.stagedStrategy === 'Headroom' ? 'selected' : ''}>📐 Headroom (Max Context Window Size)</option>
              <option value="Lowest Latency" ${helper.stagedStrategy === 'Lowest Latency' ? 'selected' : ''}>⚡ Lowest Latency (Speed Optimized)</option>
              <option value="Weighted" ${helper.stagedStrategy === 'Weighted' ? 'selected' : ''}>📊 Weighted (Custom Probability)</option>
              <option value="Strict Random" ${helper.stagedStrategy === 'Strict Random' ? 'selected' : ''}>🔀 Strict Random (Pure Uniform Random)</option>
              <option value="Context Optimized" ${helper.stagedStrategy === 'Context Optimized' ? 'selected' : ''}>📝 Context Optimized (Max Output Tokens)</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:0.72rem;font-weight:700;color:var(--text-main);">Description / Purpose</label>
            <input type="text" id="studio-combo-desc" class="form-control" style="font-family:var(--font-main);font-size:var(--font-size-base, 0.75rem);font-weight:var(--font-weight-base, normal);font-style:var(--font-style-base, normal);padding:3px 7px;height:28px;" value="${helper.stagedDesc || ''}" placeholder="e.g. Master multi-model coding agent" />
          </div>
        </div>

        <!-- SUB-HEADER BAR WITH TELEMETRY & ACTIONS -->
        <div class="glass-panel" style="padding:5px 10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;width:100%;box-sizing:border-box;">
          <div style="font-size:0.73rem;font-weight:700;display:flex;gap:6px;align-items:center;">
            <span style="padding:2px 8px;border-radius:4px;background:rgba(16,185,129,0.12);border:1px solid var(--accent-emerald);color:var(--accent-emerald);">
              <i class="fa-solid fa-list-check"></i> Staged Pooled Models: <strong>${stagedCount}/${totalModels}</strong>
            </span>
          </div>
          <div style="display:flex;gap:5px;">
            <button type="button" class="btn btn-secondary btn-xs" onclick="ModelClubComboStudioHelper.selectAll()">Select All Models</button>
            <button type="button" class="btn btn-secondary btn-xs" onclick="ModelClubComboStudioHelper.clearAll()">Clear All Models</button>
          </div>
        </div>

        <!-- 4-PANE STAGING MATRIX GRID (Skills -> Families -> Providers -> Models) -->
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:6px;width:100%;box-sizing:border-box;align-items:stretch;">
          ${this._renderStudioBox('Skills', 'fa-brain', 'var(--accent-amber)', helper.skillGroups, helper.selectedSkills, s => s.skillName, s => s.skillName, 'toggleSkill', helper)}
          ${this._renderStudioBox('Families', 'fa-microchip', 'var(--accent-cyan)', helper.familyGroups, helper.selectedFamilies, f => f.familyName, f => f.familyName, 'toggleFamily', helper)}
          ${this._renderStudioBox('Providers', 'fa-server', 'var(--primary-light)', helper.providers, helper.selectedProviders, p => p.id, p => p.displayName || p.id, 'toggleProvider', helper)}
          ${this._renderStudioBox('Base Models', 'fa-robot', 'var(--accent-emerald)', helper.models, helper.stagedModelIds, m => m.id, m => (m.modelName||m.modelId||'').replace(/\s*\((free|Free|FREE)\)/g,'').trim(), 'toggleModel', helper)}
        </div>
      </div>`;
  }

  static _renderStudioBox(title, icon, color, rawList, selSet, idFn, nameFn, toggleFn, helper) {
    const list = [...rawList].sort((a, b) => (selSet.has(idFn(b)) ? 1 : 0) - (selSet.has(idFn(a)) ? 1 : 0));
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `<div class="glass-panel" style="padding:6px;display:flex;flex-direction:column;gap:4px;overflow:hidden;box-sizing:border-box;">
      <div style="font-size:0.75rem;font-weight:700;color:${color};border-bottom:1px solid var(--border-color);padding-bottom:3px;display:flex;justify-content:space-between;align-items:center;">
        <span><i class="fa-solid ${icon}"></i> ${title} <strong style="color:${color};">${selSet.size}/${rawList.length}</strong></span>
      </div>
      <div style="padding: 2px 0 4px 0;">
        <input type="text" class="form-control" style="width:100%;font-size:0.7rem;padding:2px 5px;height:22px;border:1px solid rgba(255,255,255,0.05);border-radius:4px;background:rgba(0,0,0,0.2);color:var(--text-main);" placeholder="Search ${title}..." onkeyup="
          const q = this.value.toLowerCase();
          const p = this.parentElement.parentElement;
          p.querySelectorAll('.studio-item-${safeTitle}').forEach(el => {
            el.style.display = el.getAttribute('data-name').toLowerCase().includes(q) ? 'flex' : 'none';
          });
        " />
      </div>
      <div style="flex:1;overflow-y:auto;max-height:340px;display:flex;flex-direction:column;gap:3px;padding-right:2px;">
        ${list.map(item => {
          const id = idFn(item), name = nameFn(item), ch = selSet.has(id);
          const hasDetails = title === 'Base Models';
          const cleanId = id.replace(/[^a-zA-Z0-9]/g, '');
          const detailsHtml = hasDetails ? `
            <div style="display:none; padding:4px 8px; font-size:0.65rem; color:var(--text-muted); background:rgba(0,0,0,0.2); border-top:1px solid rgba(255,255,255,0.05);" id="details-${cleanId}">
              <div><i class="fa-solid fa-microchip"></i> Family: ${item.family || 'N/A'}</div>
              <div><i class="fa-solid fa-memory"></i> Context: ${item.contextWindow ? (item.contextWindow / 1000) + 'k' : 'N/A'}</div>
              <div><i class="fa-solid fa-bolt"></i> Latency: ${item.latencyMs || '200'}ms</div>
            </div>
          ` : '';
          
          const toggleDetailsFn = hasDetails ? `onclick="event.preventDefault(); const d=document.getElementById('details-${cleanId}'); d.style.display = d.style.display==='none' ? 'block' : 'none';"` : '';
          const infoIcon = hasDetails ? `<i class="fa-solid fa-circle-info" style="margin-left:4px; color:var(--accent-cyan);" title="Show Details" ${toggleDetailsFn}></i>` : '';

          return `<div class="studio-item-${safeTitle}" data-name="${name.replace(/"/g, '&quot;')}" style="display:flex; flex-direction:column; border-radius:4px; background:${ch?'rgba(16,185,129,0.15)':'rgba(255,255,255,0.02)'}; border:1px solid ${ch?color:'rgba(255,255,255,0.05)'}; cursor:pointer; margin-bottom:2px;">
            <label style="display:flex;align-items:center;justify-content:space-between;font-family:var(--font-main);font-size:var(--font-size-base, 0.75rem);font-weight:var(--font-weight-base, normal);font-style:var(--font-style-base, normal);padding:3px 5px; cursor:pointer;">
              <span style="display:flex;align-items:center;gap:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                <input type="checkbox" ${ch?'checked':''} onchange="ModelClubComboStudioHelper.${toggleFn}('${encodeURIComponent(id)}')" />
                <span style="color:var(--text-main);">${name}</span>
                ${infoIcon}
              </span>
              ${ch?'<i class="fa-solid fa-check" style="color:'+color+';font-size:0.58rem;"></i>':''}
            </label>
            ${detailsHtml}
          </div>`;
        }).join('')}
      </div></div>`;
  }
}

window.ModelClubStudioRenderer = ModelClubStudioRenderer;

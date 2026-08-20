/**
 * ModelClubView.js
 * Purpose: Model Club view rendering 2-column layout with Combo Club Hierarchy Tree Navigation (< 250 lines).
 * Dependencies: ApiService, ModalDialog, ModelClubNavHelper, ModelClubHierarchyHelper, ModelClubComboStudioHelper
 */

class ModelClubView {
  static familyGroups = [];
  static skillGroups = [];
  static combos = [];
  static allModels = [];
  static allProviders = [];
  static currentViewMode = 'hierarchy';
  static selectedHeader = null;
  static expandedBranches = { combos: true, skills: false, family: false, providers: false, blacklisted: false };

  static async render(container) {
    container.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div class="panel-title"><i class="fa-solid fa-cubes-stacked"></i> Model Club Taxonomy & Models Combo <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 8px; font-weight: normal;"><i class="fa-solid fa-sitemap"></i> (5-Pane Matrix View)</span></div>
          <div style="display: flex; gap: 8px; align-items: center; flex: 1; max-width: 380px; justify-content: flex-end;">
            <input type="text" id="model-club-search" class="form-control" style="font-size: 0.76rem; padding: 3px 8px; height: 28px;" placeholder="Search free models..." onkeyup="ModelClubView.filterView()" />
            <button class="btn btn-secondary btn-sm" onclick="ModelClubView.refreshAll()"><i class="fa-solid fa-rotate"></i> Refresh</button>
          </div>
        </div>

        <div style="display: flex; gap: 12px; align-items: flex-start; margin-top: 10px;">
          <div class="glass-panel" style="width: 20%; min-width: 170px; flex-shrink: 0; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
            <div id="mc-nav-tree-container"></div>
            <div style="border-top: 1px solid var(--border-color); padding-top: 6px; display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
              <button class="btn btn-primary btn-xs" style="width: 100%; justify-content: flex-start;" onclick="ModelClubView.openCreateComboModal()">
                <i class="fa-solid fa-plus-circle"></i> + New Model Combo
              </button>
              <div style="display: flex; gap: 4px;">
                <button class="btn btn-secondary btn-xs" style="flex: 1; font-size: 0.7rem;" onclick="ModelClubComboHelper.exportCombosJson(ModelClubView.combos)"><i class="fa-solid fa-download" style="color: var(--accent-emerald);"></i> Export</button>
                <button class="btn btn-secondary btn-xs" style="flex: 1; font-size: 0.7rem;" onclick="ModelClubComboHelper.importCombosJson(() => ModelClubView.refreshAll())"><i class="fa-solid fa-upload" style="color: var(--accent-cyan);"></i> Import</button>
              </div>
            </div>
          </div>

          <div style="width: 80%; display: flex; flex-direction: column; gap: 8px;">
            <div id="model-club-content-grid"></div>
          </div>
        </div>
      </div>
    `;

    try {
      const [combosRes, modelsRes, provsRes] = await Promise.all([
        ApiService.getCombos(), ApiService.getModels(), ApiService.getAllProviders()
      ]);
      this.combos = Array.isArray(combosRes) ? combosRes : (combosRes.combos || []);
      this.allProviders = provsRes.providers || [];
      const modelArray = (modelsRes && modelsRes.models) ? modelsRes.models : (Array.isArray(modelsRes) ? modelsRes : []);

      if (typeof TaxonomyHelper !== 'undefined') {
        this._cachedPyramid = TaxonomyHelper.buildPyramid(modelArray, this.allProviders, this.combos);
        this.allModels = this._cachedPyramid.models;
        this.skillGroups = this._cachedPyramid.skillGroups;
        this.familyGroups = this._cachedPyramid.familyGroups;
      }
      this.renderNavTree();
      this.switchView(this.currentViewMode, this.selectedHeader);
    } catch (err) {
      console.error('Model Club init error:', err);
    }
  }

  static renderNavTree() {
    const container = document.getElementById('mc-nav-tree-container');
    if (container && typeof ModelClubNavHelper !== 'undefined') {
      container.innerHTML = ModelClubNavHelper.renderNavTreeHtml(
        this.combos, this.allProviders, this.familyGroups, this.skillGroups,
        this.currentViewMode, this.selectedHeader, this.expandedBranches
      );
    }
  }

  static toggleBranch(key) {
    this.expandedBranches[key] = !this.expandedBranches[key];
    this.renderNavTree();
  }

  static viewSleepingProviders(e) {
    if (e) {
      e.stopImmediatePropagation();
    }
    app.navigate('providers');
    setTimeout(() => {
      if (typeof ProvidersView !== 'undefined' && ProvidersView.switchTab) {
        ProvidersView.switchTab('blacklisted');
      }
    }, 200);
  }

  static switchView(mode, selectedHeader = null) {
    this.currentViewMode = mode;
    this.selectedHeader = selectedHeader ? decodeURIComponent(selectedHeader) : null;
    this.renderNavTree();

    const grid = document.getElementById('model-club-content-grid');
    if (!grid) return;

    if (mode === 'create-combo') {
      if (typeof ModelClubComboStudioHelper !== 'undefined') {
        grid.innerHTML = ModelClubComboStudioHelper.renderComboStudioHtml();
      }
      return;
    }

    if (typeof ModelClubHierarchyHelper !== 'undefined') {
      ModelClubHierarchyHelper.init(this.combos, this.allModels, this.allProviders, this.familyGroups, this.skillGroups, mode, this.selectedHeader);
      grid.innerHTML = ModelClubHierarchyHelper.renderHierarchySystemHtml();
    }
  }

  static filterView() {
    const q = document.getElementById('model-club-search')?.value || '';
    if (typeof ModelClubHierarchyHelper !== 'undefined') {
      ModelClubHierarchyHelper.filterPanesBySearch(q);
    }
  }

  static openCreateComboModal(ids = [], name = '') { this.openCreateComboStudio(ids, name); }
  static openCreateComboStudio(ids = [], name = '') {
    if (typeof ModelClubComboStudioHelper !== 'undefined') ModelClubComboStudioHelper.initStudio(null, ids, name);
    this.switchView('create-combo');
  }

  static openEditComboModal(comboId) {
    let targetCombo = this.combos.find(c => c.id === comboId);
    if (!targetCombo) targetCombo = this.combos.find(c => c.name && c.name.toLowerCase().includes('jdroid'));
    if (targetCombo && typeof ModelClubComboStudioHelper !== 'undefined') {
      ModelClubComboStudioHelper.initStudio(targetCombo);
      this.switchView('create-combo');
    }
  }

  static createComboForGroup(encodedName, encodedIds) {
    let name = 'Group', modelIds = [];
    try { name = decodeURIComponent(encodedName); modelIds = JSON.parse(decodeURIComponent(encodedIds)); } catch (e) { modelIds = []; }
    const cleanName = (name || 'custom').toLowerCase().replace(/[^a-z0-9_-]/g, '-') + '-combo-agent';
    this.openCreateComboStudio(modelIds, cleanName);
  }

  static openEditModelModal(modelId) {
    const cleanId = decodeURIComponent(modelId);
    const m = this.allModels.find(x => x.id === modelId || x.id === cleanId || x.modelId === modelId || x.modelId === cleanId) || {};
    
    const families = ['Llama', 'Gemini', 'Qwen', 'DeepSeek', 'Mistral', 'Claude', 'GPT', 'Gemma', 'Custom'];
    const skills = ['Full-Stack Code Generation', 'Deep Reasoning & Math', 'Multimodal Speed', 'Chain of Thought', 'Fast Instant Chat', 'General Instruction', 'Content Safety'];

    const content = `
      <form id="edit-model-config-form" style="display: flex; flex-direction: column; gap: 8px; font-size: 0.8rem;">
        <div style="background: rgba(6,182,212,0.08); border: 1px solid var(--accent-cyan); padding: 8px 10px; border-radius: 6px;">
          <strong style="color: var(--accent-cyan);"><i class="fa-solid fa-microchip"></i> Editing Model Config: ${typeof FormatHelper !== 'undefined' ? FormatHelper.getModelDisplayName(m) : (m.modelName || m.name || m.id || 'Model')}</strong>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Unique ID: <code>${m.id || ''}</code> | Provider: <strong>${(typeof FormatHelper !== 'undefined' ? FormatHelper.getProviderDisplayName(m, m.providerId || 'Provider') : (m.providerName || m.providerId)) || 'System'}</strong></div>
        </div>

        <div class="grid-2" style="gap: 8px;">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" style="font-size: 0.75rem; font-weight: 700;">Model Display Name:</label>
            <input type="text" id="cfg-model-name" class="form-control" style="font-size: 0.78rem;" value="${typeof FormatHelper !== 'undefined' ? FormatHelper.getModelDisplayName(m) : (m.modelName || m.name || '')}" required />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" style="font-size: 0.75rem; font-weight: 700;">Model Slug / Endpoint ID:</label>
            <input type="text" id="cfg-model-slug" class="form-control" style="font-size: 0.78rem;" value="${m.modelId || m.id || ''}" required />
          </div>
        </div>

        <div class="grid-2" style="gap: 8px;">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" style="font-size: 0.75rem; font-weight: 700;">Model Family:</label>
            <select id="cfg-model-family" class="form-control" style="font-size: 0.78rem;">
              ${families.map(f => `<option value="${f}" ${m.family === f ? 'selected' : ''}>${f}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" style="font-size: 0.75rem; font-weight: 700;">Core Skill / Specialization:</label>
            <select id="cfg-model-skill" class="form-control" style="font-size: 0.78rem;">
              ${skills.map(s => `<option value="${s}" ${m.coreSkill === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="grid-2" style="gap: 8px;">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" style="font-size: 0.75rem; font-weight: 700;">Context Window (Tokens):</label>
            <input type="number" id="cfg-model-context" class="form-control" style="font-size: 0.78rem;" value="${m.contextWindow || 128000}" />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" style="font-size: 0.75rem; font-weight: 700;">Max Output Tokens:</label>
            <input type="number" id="cfg-model-maxtokens" class="form-control" style="font-size: 0.78rem;" value="${m.maxTokens || 4096}" />
          </div>
        </div>

        <div class="grid-2" style="gap: 8px;">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" style="font-size: 0.75rem; font-weight: 700;">Average Latency (ms):</label>
            <input type="number" id="cfg-model-latency" class="form-control" style="font-size: 0.78rem;" value="${m.latencyMs || 200}" />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" style="font-size: 0.75rem; font-weight: 700;">Free Tier Rate Limit Quota:</label>
            <input type="text" id="cfg-model-limit" class="form-control" style="font-size: 0.78rem;" value="${m.freeTierLimit || m.metadata?.freeTierQuota || '30 RPM / 14,400 RPD'}" />
          </div>
        </div>

        <div style="display: flex; gap: 14px; align-items: center; background: rgba(0,0,0,0.2); padding: 6px 10px; border-radius: 6px; flex-wrap: wrap;">
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.75rem;">
            <input type="checkbox" id="cfg-model-free" ${m.isFree !== false ? 'checked' : ''} /> <strong style="color: var(--accent-emerald);">Free Tier Model</strong>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.75rem;">
            <input type="checkbox" id="cfg-model-vision" ${m.supportsVision || m.hasVision ? 'checked' : ''} /> <strong style="color: var(--accent-cyan);">Vision / Multimodal</strong>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.75rem;">
            <input type="checkbox" id="cfg-model-reasoning" ${m.supportsReasoning || m.hasReasoning ? 'checked' : ''} /> <strong style="color: var(--accent-amber);">Chain-of-Thought</strong>
          </label>
        </div>

        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-size: 0.75rem; font-weight: 700;">Default System Prompt / Instruction:</label>
          <textarea id="cfg-model-prompt" class="form-control" rows="2" style="font-size: 0.76rem;" placeholder="Optional default system instruction for this model...">${m.systemPrompt || ''}</textarea>
        </div>

        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-size: 0.75rem; font-weight: 700;">Description & Metadata Notes:</label>
          <input type="text" id="cfg-model-desc" class="form-control" style="font-size: 0.78rem;" value="${m.description || m.metadata?.description || ''}" placeholder="High-performance code generation and general reasoning model." />
        </div>
      </form>
    `;

    ModalDialog.showCustomModal({
      title: `<i class="fa-solid fa-gears" style="color: var(--accent-cyan);"></i> Edit ROCA Model Configuration`,
      content: content,
      confirmText: '<i class="fa-solid fa-floppy-disk"></i> Save Model Config',
      onConfirm: () => this.saveModelConfig(m.id || modelId)
    });
  }

  static async openBatchEditModal(modelIds = []) {
    if (!Array.isArray(modelIds) || modelIds.length === 0) {
      return ModalDialog.showNotification('Please select at least 1 model in Base Models pane to batch edit!', 'warning');
    }

    const families = ['(No Change)', 'Llama', 'Gemini', 'Qwen', 'DeepSeek', 'Mistral', 'Claude', 'GPT', 'Gemma', 'Custom'];
    const skills = ['(No Change)', 'Full-Stack Code Generation', 'Deep Reasoning & Math', 'Multimodal Speed', 'Chain of Thought', 'Fast Instant Chat', 'General Instruction', 'Content Safety'];

    const content = `
      <form id="batch-edit-models-form" style="display: flex; flex-direction: column; gap: 10px; font-size: 0.8rem;">
        <div style="background: rgba(16,185,129,0.08); border: 1px solid var(--accent-emerald); padding: 8px 10px; border-radius: 6px;">
          <strong style="color: var(--accent-emerald);"><i class="fa-solid fa-layer-group"></i> Batch Mutating ${modelIds.length} Selected Model(s)</strong>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Apply atomic taxonomy classification, family grouping, or status changes to all selected models simultaneously.</div>
        </div>

        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-size: 0.75rem; font-weight: 700;">Reassign Model Family:</label>
          <select id="batch-model-family" class="form-control" style="font-size: 0.78rem;">
            ${families.map(f => `<option value="${f}">${f}</option>`).join('')}
          </select>
        </div>

        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-size: 0.75rem; font-weight: 700;">Reassign Core Skill / Specialization:</label>
          <select id="batch-model-skill" class="form-control" style="font-size: 0.78rem;">
            ${skills.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>

        <div style="display: flex; gap: 14px; align-items: center; background: rgba(0,0,0,0.2); padding: 6px 10px; border-radius: 6px;">
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.75rem;">
            <input type="checkbox" id="batch-model-free" checked /> <strong style="color: var(--accent-emerald);">Mark as 100% Free Tier</strong>
          </label>
        </div>
      </form>
    `;

    ModalDialog.showCustomModal({
      title: `<i class="fa-solid fa-pen-ruler" style="color: var(--accent-emerald);"></i> Batch Edit ${modelIds.length} Model(s)`,
      content: content,
      confirmText: '<i class="fa-solid fa-floppy-disk"></i> Apply Batch Updates',
      onConfirm: async () => {
        const fam = document.getElementById('batch-model-family')?.value;
        const skl = document.getElementById('batch-model-skill')?.value;
        const isFree = document.getElementById('batch-model-free')?.checked;

        const updates = {};
        if (fam && fam !== '(No Change)') updates.family = fam;
        if (skl && skl !== '(No Change)') updates.coreSkill = skl;
        if (isFree !== undefined) updates.isFree = isFree;

        if (Object.keys(updates).length === 0) {
          return ModalDialog.showNotification('No properties selected for batch update.', 'info');
        }

        try {
          const res = await ApiService.batchUpdateModels(modelIds, updates);
          if (res.success) {
            try { localStorage.removeItem('fmc_cached_models'); } catch(e){}
            ModalDialog.showNotification(`Successfully batch-updated ${res.count || modelIds.length} model(s)!`, 'success');
            this.refreshAll();
          } else {
            ModalDialog.showNotification(`Batch update failed: ${res.error}`, 'error');
          }
        } catch (err) {
          ModalDialog.showNotification(`Batch update error: ${err.message}`, 'error');
        }
      }
    });
  }

  static async saveModelConfig(modelId) {
    const payload = {
      modelName: document.getElementById('cfg-model-name')?.value,
      modelId: document.getElementById('cfg-model-slug')?.value,
      family: document.getElementById('cfg-model-family')?.value,
      coreSkill: document.getElementById('cfg-model-skill')?.value,
      contextWindow: parseInt(document.getElementById('cfg-model-context')?.value) || 128000,
      maxTokens: parseInt(document.getElementById('cfg-model-maxtokens')?.value) || 4096,
      latencyMs: parseInt(document.getElementById('cfg-model-latency')?.value) || 200,
      freeTierLimit: document.getElementById('cfg-model-limit')?.value,
      isFree: document.getElementById('cfg-model-free')?.checked,
      supportsVision: document.getElementById('cfg-model-vision')?.checked,
      supportsReasoning: document.getElementById('cfg-model-reasoning')?.checked,
      systemPrompt: document.getElementById('cfg-model-prompt')?.value,
      description: document.getElementById('cfg-model-desc')?.value
    };

    try {
      const res = await ApiService.updateModel(modelId, payload);
      if (res.success) {
        try { localStorage.removeItem('fmc_cached_models'); } catch(e){}
        ModalDialog.showNotification(`ROCA Model Config for '${payload.modelName}' updated successfully!`, 'success');
        this.refreshAll();
      } else {
        ModalDialog.showNotification(`Failed to save model config: ${res.error || res.message}`, 'error');
      }
    } catch (err) {
      ModalDialog.showNotification(`Save Error: ${err.message}`, 'error');
    }
  }

  static async recalculateCoreSkills() {
    try {
      const res = await ApiService.recalculateCoreSkills();
      if (res.success) {
        ModalDialog.showNotification(`Recalculated core skills for ${res.count || 0} model(s).`, 'success');
        this.refreshAll();
      } else {
        ModalDialog.showNotification(`Failed to recalculate skills: ${res.error || res.message}`, 'error');
      }
    } catch (err) {
      ModalDialog.showNotification(`Skill recalculation error: ${err.message}`, 'error');
    }
  }

  static async refreshAll() {
    if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
    else { const c = document.querySelector('.glass-panel')?.parentElement; if (c) await this.render(c); }
  }
}

window.ModelClubView = ModelClubView;

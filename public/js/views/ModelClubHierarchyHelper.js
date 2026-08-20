/**
 * ModelClubHierarchyHelper.js
 * Purpose: Dynamic N-Pane Pyramid Matrix with 2-way reactive linking, Free Model Selection Mode, & SearchAgent integration (< 220 lines).
 * Dependencies: ModelClubView, TaxonomyHelper, ModelClubPanelRenderer, SearchAgent, ApiService, ModalDialog
 */

class ModelClubHierarchyHelper {
  static viewLevel = 'hierarchy';
  static activeItem = null;
  static isFreeSelectionMode = false;

  static selectedCombos = new Set();
  static selectedSkills = new Set();
  static selectedFamilies = new Set();
  static selectedProviders = new Set();
  static selectedModels = new Set();

  static init(combos, models, providers, familyGroups, skillGroups, level = 'hierarchy', activeItem = null) {
    this.combos = combos || [];
    this.providers = providers || [];
    this.viewLevel = level || 'hierarchy';
    this.activeItem = activeItem;

    if (typeof TaxonomyHelper !== 'undefined') {
      const p = TaxonomyHelper.buildPyramid(models || [], providers, combos);
      this.models = p.models; this.skillGroups = p.skillGroups; this.familyGroups = p.familyGroups;
    } else {
      this.models = models || []; this.skillGroups = skillGroups || []; this.familyGroups = familyGroups || [];
    }

    if (activeItem) {
      if (level === 'combos') { 
        const c = this.combos.find(x => x.id === activeItem || x.name === activeItem); 
        if (c) { this.selectedCombos.clear(); this.toggleCombo(c.id); } 
      }
      else if (level === 'skills') { this.selectedSkills.clear(); this.toggleSkill(encodeURIComponent(activeItem)); }
      else if (level === 'family') { this.selectedFamilies.clear(); this.toggleFamily(encodeURIComponent(activeItem)); }
      else if (level === 'providers') { this.selectedProviders.clear(); this.toggleProvider(encodeURIComponent(activeItem)); }
    }
  }

  // ─── DELEGATED SEARCH FILTERING (SEARCH AGENT) ─────────────────────
  static filterPanesBySearch(q) {
    const grid = document.getElementById('model-club-content-grid');
    if (!grid || typeof SearchAgent === 'undefined') return;
    const matches = SearchAgent.filterTaxonomyPyramid(q, this.models, this.skillGroups, this.familyGroups, this.providers, this.combos);
    SearchAgent.applyInPlaceDomFilter(grid, matches);
  }

  // ─── FREE SELECTION MODE TOGGLE ───────────────────────────────────
  static toggleFreeSelectionMode() {
    this.isFreeSelectionMode = !this.isFreeSelectionMode;
    const msg = this.isFreeSelectionMode 
      ? 'Free Model Selection Mode ENABLED: Arbitrarily pick models across any family, skill, or provider without hierarchy reset.' 
      : 'Hierarchical Drilldown Mode ENABLED: Selecting parent nodes will cascade filters to downstream panes.';
    ModalDialog.showNotification(msg, this.isFreeSelectionMode ? 'success' : 'info');
    this.refreshGrid();
  }

  // ─── 2-WAY REACTIVE LINKING ──────────────────────────────────────
  static toggleCombo(id) {
    this.selectedCombos.has(id) ? this.selectedCombos.delete(id) : this.selectedCombos.add(id);
    const mIds = new Set();
    this.combos.forEach(c => { if (this.selectedCombos.has(c.id)) (c.modelsList || []).forEach(mId => mIds.add(mId)); });
    this._syncFromModels(mIds, false);
    this.refreshGrid();
  }

  static toggleSkill(e) {
    const n = decodeURIComponent(e);
    this.selectedSkills.has(n) ? this.selectedSkills.delete(n) : this.selectedSkills.add(n);
    const mIds = new Set();
    this.models.forEach(m => { if (this.selectedSkills.has(m.coreSkill)) mIds.add(m.id); });
    this._syncFromModels(mIds, false);
    this.refreshGrid();
  }

  static toggleFamily(e) {
    const n = decodeURIComponent(e);
    this.selectedFamilies.has(n) ? this.selectedFamilies.delete(n) : this.selectedFamilies.add(n);
    const mIds = new Set();
    this.models.forEach(m => { if (this.selectedFamilies.has(m.family)) mIds.add(m.id); });
    this._syncFromModels(mIds, false);
    this.refreshGrid();
  }

  static toggleProvider(e) {
    const pId = decodeURIComponent(e);
    this.selectedProviders.has(pId) ? this.selectedProviders.delete(pId) : this.selectedProviders.add(pId);
    const mIds = new Set();
    this.models.forEach(m => { if (this.selectedProviders.has(m.providerId) || this.selectedProviders.has(m.providerName)) mIds.add(m.id); });
    this._syncFromModels(mIds, false);
    this.refreshGrid();
  }

  static toggleModel(e) {
    const mId = decodeURIComponent(e);
    this.selectedModels.has(mId) ? this.selectedModels.delete(mId) : this.selectedModels.add(mId);
    
    // In Free Selection Mode, do not destructively wipe parent pane sets
    if (!this.isFreeSelectionMode) {
      this._syncFromModels(this.selectedModels, true);
    }
    this.refreshGrid();
  }

  static _syncFromModels(mIdsSet, preserveModelSet = false) {
    if (!preserveModelSet) this.selectedModels = new Set(mIdsSet);
    this.selectedSkills.clear(); this.selectedFamilies.clear(); this.selectedProviders.clear();

    this.models.forEach(m => {
      if (mIdsSet.has(m.id)) {
        if (m.coreSkill) this.selectedSkills.add(m.coreSkill);
        if (m.family) this.selectedFamilies.add(m.family);
        if (m.providerId) this.selectedProviders.add(m.providerId);
      }
    });
    if (mIdsSet.size === 0) this.selectedCombos.clear();
  }

  static renderHierarchySystemHtml() {
    let gridCols = 'repeat(5, 1fr)';
    let panes = [this._paneCombos(), this._paneSkills(), this._paneFamilies(), this._paneProviders(), this._paneModels()];

    if (this.viewLevel === 'combos') { gridCols = 'repeat(4, 1fr)'; panes = [this._paneSkills(), this._paneFamilies(), this._paneProviders(), this._paneModels()]; }
    else if (this.viewLevel === 'skills') { gridCols = 'repeat(3, 1fr)'; panes = [this._paneFamilies(), this._paneProviders(), this._paneModels()]; }
    else if (this.viewLevel === 'family') { gridCols = 'repeat(2, 1fr)'; panes = [this._paneProviders(), this._paneModels()]; }
    else if (this.viewLevel === 'providers') { gridCols = '1fr'; panes = [this._paneModels()]; }

    return `<div style="display:flex;flex-direction:column;gap:8px;width:100%;box-sizing:border-box;">
      ${ModelClubPanelRenderer.renderTopDetailBanner(this.viewLevel, this.activeItem, this.combos, this.skillGroups, this.familyGroups, this.providers, this.models, this.isFreeSelectionMode)}
      
      <div style="display:grid;grid-template-columns:${gridCols};gap:6px;width:100%;box-sizing:border-box;align-items:stretch;">${panes.join('')}</div>
    </div>`;
  }

  // ─── PANE HELPERS ──────────────────────────────────────────────────
  static _paneCombos() { return ModelClubPanelRenderer.renderBox('Combos', 'fa-layer-group', 'var(--accent-emerald)', this.combos, this.selectedCombos, c => c.id, c => c.name, 'toggleCombo'); }
  static _paneSkills() { return ModelClubPanelRenderer.renderBox('Skills', 'fa-brain', 'var(--accent-amber)', this.skillGroups, this.selectedSkills, s => s.skillName, s => s.skillName, 'toggleSkill'); }
  static _paneFamilies() { return ModelClubPanelRenderer.renderBox('Families', 'fa-microchip', 'var(--accent-cyan)', this.familyGroups, this.selectedFamilies, f => f.familyName, f => f.familyName, 'toggleFamily'); }
  static _paneProviders() { return ModelClubPanelRenderer.renderBox('Providers', 'fa-server', 'var(--primary-light)', this.providers, this.selectedProviders, p => p.id, p => p.displayName || p.id, 'toggleProvider'); }
  static _paneModels() { 
     const activeModels = this.models.filter(m => m.isActive !== false);
     return ModelClubPanelRenderer.renderBox('Base Models', 'fa-robot', 'var(--accent-emerald)', activeModels, this.selectedModels, m => m.id, m => (m.modelName||m.modelId||'').replace(/\s*\((free|Free|FREE)\)/g,'').trim(), 'toggleModel'); 
  }

  static selectAll() {
    this.combos.forEach(c=>this.selectedCombos.add(c.id)); this.skillGroups.forEach(s=>this.selectedSkills.add(s.skillName));
    this.familyGroups.forEach(f=>this.selectedFamilies.add(f.familyName)); this.providers.forEach(p=>this.selectedProviders.add(p.id));
    this.models.forEach(m=>this.selectedModels.add(m.id)); this.refreshGrid();
  }

  static clearAll() {
    this.selectedCombos.clear(); this.selectedSkills.clear(); this.selectedFamilies.clear();
    this.selectedProviders.clear(); this.selectedModels.clear(); this.refreshGrid();
  }

  static openBatchEdit() {
    const ids = Array.from(this.selectedModels);
    if (ids.length === 0) {
      return ModalDialog.showNotification('Please check at least 1 model in Base Models pane to batch edit!', 'warning');
    }
    if (typeof ModelClubView !== 'undefined') {
      ModelClubView.openBatchEditModal(ids);
    }
  }

  static async createComboFromSelection() {
    let ids = Array.from(this.selectedModels); 
    if (ids.length === 0) ids = this.models.filter(m => m.isActive !== false).map(m => m.id);
    
    // Top-to-bottom & bottom-to-top validation check
    try {
      const valRes = await ApiService.validateModelSelection(ids);
      if (valRes && valRes.issues && valRes.issues.length > 0) {
        const warnMsgs = valRes.issues.map(i => `• ${i.message}`).join('\n');
        ModalDialog.showNotification(`Selection Advisory:\n${warnMsgs}`, 'warning');
      }
    } catch(e) {
      console.warn('Selection validation check bypassed:', e);
    }

    if (typeof ModelClubView !== 'undefined') {
      ModelClubView.openCreateComboStudio(ids, `combo-${Date.now().toString().slice(-4)}`);
    }
  }

  static getActiveComboId() { return Array.from(this.selectedCombos)[0] || (this.combos[0] ? this.combos[0].id : null); }
  static testSelectedCombo() { const cId = this.getActiveComboId(); if (!cId) return ModalDialog.showNotification('Please select a combo agent first!', 'warning'); ModalDialog.showNotification(`Testing Combo Agent [${cId}]...`, 'info'); }
  static cloneSelectedCombo() { const cId = this.getActiveComboId(); if (!cId) return ModalDialog.showNotification('Please select a combo agent first!', 'warning'); const c = this.combos.find(x => x.id === cId); if (c && typeof ModelClubView !== 'undefined') ModelClubView.openCreateComboStudio(c.modelsList || [], `${c.name}-copy`); }
  static copySelectedComboCode() { const cId = this.getActiveComboId(); if (!cId) return ModalDialog.showNotification('Please select a combo agent first!', 'warning'); const origin = (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:12247'); navigator.clipboard.writeText(`// FMC API\nfetch('${origin}/v1/chat/completions', { method: 'POST', body: JSON.stringify({ model: '${cId}' }) });`); ModalDialog.showNotification('API Code copied to clipboard!', 'success'); }
  static toggleSelectedComboActive() { const cId = this.getActiveComboId(); if (cId && typeof ModelClubComboHelper !== 'undefined') ModelClubComboHelper.toggleActive(cId, () => this.refreshGrid()); }
  static editSelectedCombo() { const cId = this.getActiveComboId(); if (cId && typeof ModelClubComboHelper !== 'undefined') ModelClubComboHelper.openEditComboModal(cId, this.combos, () => this.refreshGrid()); }
  static deleteSelectedCombo() { const cId = this.getActiveComboId(); if (cId && typeof ModelClubComboHelper !== 'undefined') ModelClubComboHelper.deleteCombo(cId, () => this.refreshGrid()); }

  static refreshGrid() { 
    const g = document.getElementById('model-club-content-grid'); 
    if (g) g.innerHTML = this.renderHierarchySystemHtml();
    const searchVal = document.getElementById('model-club-search')?.value;
    if (searchVal) this.filterPanesBySearch(searchVal);
  }
}

window.ModelClubHierarchyHelper = ModelClubHierarchyHelper;

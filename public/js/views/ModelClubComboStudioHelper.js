/**
 * ModelClubComboStudioHelper.js
 * Purpose: Studio Controller for New & Edit Combo Agent with 4-Pane Matrix & 2-Way Reactive Linkage (< 140 lines).
 * Dependencies: ApiService, ModalDialog, ModelClubStudioRenderer, TaxonomyHelper
 */

class ModelClubComboStudioHelper {
  static editingComboId = null;
  static stagedName = '';
  static stagedStrategy = 'Round Robin';
  static stagedDesc = '';

  static stagedModelIds = new Set();
  static selectedSkills = new Set();
  static selectedFamilies = new Set();
  static selectedProviders = new Set();

  static initStudio(comboToEdit = null, initialStagedIds = [], defaultName = '') {
    const allModels = (window.ModelClubView && window.ModelClubView.allModels) || [];
    const providers = ((window.ModelClubView && window.ModelClubView.allProviders) || []).filter(p => p.isActive === true);
    const combos = (window.ModelClubView && window.ModelClubView.combos) || [];

    if (typeof TaxonomyHelper !== 'undefined') {
      const pyramid = TaxonomyHelper.buildPyramid(allModels, providers, combos);
      this.models = pyramid.models;
      this.skillGroups = pyramid.skillGroups;
      this.familyGroups = pyramid.familyGroups;
      this.providers = providers;
    } else {
      this.models = allModels; this.skillGroups = []; this.familyGroups = []; this.providers = providers;
    }

    if (comboToEdit) {
      this.editingComboId = comboToEdit.id;
      this.stagedName = comboToEdit.name || '';
      this.stagedStrategy = comboToEdit.strategy || 'Round Robin';
      this.stagedDesc = comboToEdit.description || '';
      this.stagedModelIds = new Set(comboToEdit.modelsList || []);
    } else {
      this.editingComboId = null;
      this.stagedName = defaultName || '';
      this.stagedStrategy = 'Round Robin';
      this.stagedDesc = '';
      this.stagedModelIds = new Set(initialStagedIds || []);
    }
    this._syncFromModels(this.stagedModelIds, true);
  }

  static renderComboStudioHtml(stagedIds = [], stagedName = '', allModels = [], allProviders = [], combos = []) {
    if (!this.models || this.models.length === 0) {
      this.initStudio(null, stagedIds, stagedName);
    }
    return ModelClubStudioRenderer.renderComboStudioHtml(this);
  }

  // ─── 2-WAY REACTIVE LINKING FOR STUDIO ─────────────────────────────
  static toggleSkill(e) {
    const n = decodeURIComponent(e);
    this.selectedSkills.has(n) ? this.selectedSkills.delete(n) : this.selectedSkills.add(n);
    const mIds = new Set(this.stagedModelIds);
    this.models.forEach(m => {
      if (m.coreSkill === n) { this.selectedSkills.has(n) ? mIds.add(m.id) : mIds.delete(m.id); }
    });
    this._syncFromModels(mIds, false);
    this.refreshStudio();
  }

  static toggleFamily(e) {
    const n = decodeURIComponent(e);
    this.selectedFamilies.has(n) ? this.selectedFamilies.delete(n) : this.selectedFamilies.add(n);
    const mIds = new Set(this.stagedModelIds);
    this.models.forEach(m => {
      if (m.family === n) { this.selectedFamilies.has(n) ? mIds.add(m.id) : mIds.delete(m.id); }
    });
    this._syncFromModels(mIds, false);
    this.refreshStudio();
  }

  static toggleProvider(e) {
    const pId = decodeURIComponent(e);
    this.selectedProviders.has(pId) ? this.selectedProviders.delete(pId) : this.selectedProviders.add(pId);
    const mIds = new Set(this.stagedModelIds);
    this.models.forEach(m => {
      if (m.providerId === pId || m.providerName === pId) {
        this.selectedProviders.has(pId) ? mIds.add(m.id) : mIds.delete(m.id);
      }
    });
    this._syncFromModels(mIds, false);
    this.refreshStudio();
  }

  static toggleModel(e) {
    const mId = decodeURIComponent(e);
    this.stagedModelIds.has(mId) ? this.stagedModelIds.delete(mId) : this.stagedModelIds.add(mId);
    this._syncFromModels(this.stagedModelIds, true);
    this.refreshStudio();
  }

  static _syncFromModels(mIdsSet, preserveModelSet = false) {
    if (!preserveModelSet) this.stagedModelIds = new Set(mIdsSet);
    this.selectedSkills.clear(); this.selectedFamilies.clear(); this.selectedProviders.clear();
    this.models.forEach(m => {
      if (this.stagedModelIds.has(m.id)) {
        if (m.coreSkill) this.selectedSkills.add(m.coreSkill);
        if (m.family) this.selectedFamilies.add(m.family);
        if (m.providerId) this.selectedProviders.add(m.providerId);
      }
    });
  }

  static selectAll() {
    this.models.forEach(m => this.stagedModelIds.add(m.id));
    this._syncFromModels(this.stagedModelIds, true);
    this.refreshStudio();
  }

  static clearAll() {
    this.stagedModelIds.clear();
    this._syncFromModels(this.stagedModelIds, true);
    this.refreshStudio();
  }

  static async saveStudioCombo() {
    const name = document.getElementById('studio-combo-name')?.value.trim();
    const strategy = document.getElementById('studio-combo-strategy')?.value || 'Round Robin';
    const description = document.getElementById('studio-combo-desc')?.value.trim() || '';
    const allModels = (window.ModelClubView && window.ModelClubView.allModels) || [];
    const rawIds = Array.from(this.stagedModelIds);
    const modelIds = rawIds.map(id => {
      const m = allModels.find(x => x.id === id || x.modelId === id);
      return m ? m.id : id;
    });

    if (!name) return ModalDialog.showNotification('Validation Error: Combo Agent Name is required!', 'error');
    if (modelIds.length === 0) return ModalDialog.showNotification('Validation Error: Select at least 1 pooled model!', 'error');

    if (typeof ValidationNotifier !== 'undefined' && !this._isAutoSaving) {
      this._isAutoSaving = true; // prevent recursion loop
      const valRes = await ValidationNotifier.validateAndPrompt({
        scope: 'model_combo',
        data: { 
          comboId: this.editingComboId || 'new_combo', 
          name, strategy, description, 
          primaryModelId: modelIds[0], 
          fallbackModelId: modelIds[1] || modelIds[0], 
          modelsList: modelIds 
        },
        title: 'Combo Agent Optimization & Validation Check',
        onOptionSelect: async (optionId, resolvedData) => {
          if (resolvedData.fallbackModelId && resolvedData.fallbackModelId !== modelIds[1]) {
             this.stagedModelIds.add(resolvedData.fallbackModelId);
             this._syncFromModels(this.stagedModelIds, true);
             this.refreshStudio();
          }
          // Re-trigger save automatically to close the loop
          setTimeout(() => { this.saveStudioCombo(); }, 200);
        }
      });
      this._isAutoSaving = false;

      if (!valRes.isValid && valRes.issues && valRes.issues.length > 0) return;
      if (valRes.options && valRes.options.length > 0) return; // User is deciding in popup dialog
    }

    try {
      let res;
      if (this.editingComboId) {
        res = await ApiService.updateCombo(this.editingComboId, { name, strategy, description, modelsList: modelIds });
      } else {
        res = await ApiService.createCombo({ name, strategy, description, modelsList: modelIds });
      }

      if (res.success || res.combo) {
        ModalDialog.showNotification(`Combo Agent "${name}" saved successfully!`, 'success');
        if (typeof ModelClubView !== 'undefined') ModelClubView.refreshAll();
      } else {
        ModalDialog.showNotification(`Save Failed: ${res.error}`, 'error');
      }
    } catch (e) {
      ModalDialog.showNotification(`Save Error: ${e.message}`, 'error');
    }
  }

  static refreshStudio() {
    const g = document.getElementById('model-club-content-grid');
    if (g) g.innerHTML = ModelClubStudioRenderer.renderComboStudioHtml(this);
  }
}

window.ModelClubComboStudioHelper = ModelClubComboStudioHelper;

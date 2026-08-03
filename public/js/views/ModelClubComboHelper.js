/**
 * ModelClubComboHelper.js
 * Purpose: Model Combo Controller managing CRUD operations, Export/Import JSON (< 180 lines).
 * Dependencies: ApiService, ModalDialog, ModelClubComboModalRenderer
 */

class ModelClubComboHelper {
  static openCreateComboModal(stagedIds = [], defaultName = '', onRefresh = null) {
    const allModels = (window.ModelClubView && window.ModelClubView.allModels) || [];
    ModalDialog.showModal({
      title: 'Create Model Combo Agent',
      icon: 'fa-wand-magic-sparkles',
      body: ModelClubComboModalRenderer.renderCreateComboModalBody(stagedIds, defaultName, allModels),
      confirmText: 'Create Combo Agent',
      onConfirm: async () => {
        const name = document.getElementById('combo-modal-name')?.value.trim();
        const strategy = document.getElementById('combo-modal-strategy')?.value || 'Round Robin';
        const description = document.getElementById('combo-modal-desc')?.value.trim() || 'Custom model combo';
        const modelIds = stagedIds.length > 0 ? stagedIds : allModels.map(m => m.id);

        if (!ModelClubComboModalRenderer.validateComboInput(name, modelIds)) return;

        try {
          const res = await ApiService.createCombo({ name, strategy, description, modelsList: modelIds });
          if (res.success || res.combo) {
            ModalDialog.showNotification(`Combo Agent "${name}" created successfully!`, 'success');
            if (typeof onRefresh === 'function') onRefresh();
          } else {
            ModalDialog.showNotification(`Create Combo Failed: ${res.error || 'Unknown error'}`, 'error');
          }
        } catch (e) {
          ModalDialog.showNotification(`Create Combo Error: ${e.message}`, 'error');
        }
      }
    });
  }

  static openEditComboModal(comboId, allCombos = [], onRefresh = null) {
    const combos = allCombos.length > 0 ? allCombos : ((window.ModelClubView && window.ModelClubView.combos) || []);
    const combo = combos.find(c => c.id === comboId);
    if (!combo) return;

    const allModels = (window.ModelClubView && window.ModelClubView.allModels) || [];
    ModalDialog.showModal({
      title: `Edit Combo Agent: ${combo.name}`,
      icon: 'fa-pen-to-square',
      body: ModelClubComboModalRenderer.renderEditComboModalBody(combo, allModels),
      confirmText: 'Save Changes',
      onConfirm: async () => {
        const name = document.getElementById('edit-combo-name')?.value.trim();
        const strategy = document.getElementById('edit-combo-strategy')?.value || 'Round Robin';
        const description = document.getElementById('edit-combo-desc')?.value.trim() || '';
        const chks = document.querySelectorAll('.edit-combo-model-chk:checked');
        const modelIds = Array.from(chks).map(c => c.value);

        if (!ModelClubComboModalRenderer.validateComboInput(name, modelIds)) return;

        try {
          const res = await ApiService.updateCombo(comboId, { name, strategy, description, modelsList: modelIds });
          if (res.success || res.combo) {
            ModalDialog.showNotification(`Combo Agent "${name}" updated successfully!`, 'success');
            if (typeof onRefresh === 'function') onRefresh();
          } else {
            ModalDialog.showNotification(`Update Failed: ${res.error}`, 'error');
          }
        } catch (e) {
          ModalDialog.showNotification(`Update Error: ${e.message}`, 'error');
        }
      }
    });
  }

  static async toggleActive(id, onRefresh = null) {
    try {
      const res = await ApiService.toggleComboStatus(id);
      if (res.success) {
        ModalDialog.showNotification(`Combo active status toggled!`, 'success');
        if (typeof onRefresh === 'function') onRefresh();
      }
    } catch (e) {
      ModalDialog.showNotification(`Status Error: ${e.message}`, 'error');
    }
  }

  static async deleteCombo(id, onRefresh = null) {
    ModalDialog.showModal({
      title: 'Confirm Delete Combo Agent',
      icon: 'fa-triangle-exclamation',
      body: '<p style="font-size:0.85rem;color:var(--text-main);">Are you sure you want to delete this Combo Agent? This action cannot be undone.</p>',
      confirmText: 'Delete Combo',
      onConfirm: async () => {
        try {
          const res = await ApiService.deleteCombo(id);
          if (res.success) {
            ModalDialog.showNotification('Combo Agent deleted!', 'success');
            if (typeof onRefresh === 'function') onRefresh();
          }
        } catch (e) {
          ModalDialog.showNotification(`Delete Error: ${e.message}`, 'error');
        }
      }
    });
  }

  static exportCombosJson(combos) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(combos || [], null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `freemodelsclub-combos-${Date.now()}.json`);
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();
    ModalDialog.showNotification('Exported Model Combos JSON successfully!', 'success');
  }

  static importCombosJson(onRefresh = null) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const imported = JSON.parse(evt.target.result);
          if (Array.isArray(imported)) {
            let count = 0;
            for (const c of imported) {
              if (c.name && Array.isArray(c.modelsList)) {
                await ApiService.createCombo({ name: c.name, strategy: c.strategy || 'Round Robin', description: c.description || '', modelsList: c.modelsList });
                count++;
              }
            }
            ModalDialog.showNotification(`Imported ${count} Combo Agents successfully!`, 'success');
            if (typeof onRefresh === 'function') onRefresh();
          }
        } catch (err) {
          ModalDialog.showNotification(`Import Error: ${err.message}`, 'error');
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  }
}

window.ModelClubComboHelper = ModelClubComboHelper;

/**
 * ModelClubComboHelper.js
 * Purpose: Model Combo Controller managing CRUD operations, Export/Import JSON (< 180 lines).
 * Dependencies: ApiService, ModalDialog, ModelClubComboModalRenderer
 */

class ModelClubComboHelper {
  static openCreateComboModal(stagedIds = [], defaultName = '', onRefresh = null) {
    if (typeof ModelClubView !== 'undefined') {
      ModelClubView.openCreateComboStudio(stagedIds, defaultName);
    }
  }

  static openEditComboModal(comboId, allCombos = [], onRefresh = null) {
    if (typeof ModelClubView !== 'undefined') {
      ModelClubView.openEditComboModal(comboId);
    }
  }

  static async toggleActive(id, onRefresh = null) {
    try {
      const res = await ApiService.toggleComboStatus(id);
      if (res.success) {
        ModalDialog.showNotification(`Combo active status toggled!`, 'success');
        if (window.AppStore && window.AppStore.emit) window.AppStore.emit('MODELS_MUTATED');
        if (typeof onRefresh === 'function') onRefresh();
      }
    } catch (e) {
      ModalDialog.showNotification(`Status Error: ${e.message}`, 'error');
    }
  }

  static async deleteCombo(id, onRefresh = null) {
    if (typeof ValidationNotifier !== 'undefined') {
      ValidationNotifier.showOptionPopup({
        title: 'Delete Combo Agent',
        message: 'Are you sure you want to permanently delete this Combo Agent? This action cannot be undone.',
        icon: 'fa-trash',
        confirmText: 'Delete Combo',
        confirmStyle: 'danger',
        onConfirm: async () => {
          try {
            const res = await ApiService.deleteCombo(id);
            if (res.success) {
              ModalDialog.showNotification('Combo Agent deleted!', 'success');
              if (window.AppStore && window.AppStore.emit) window.AppStore.emit('MODELS_MUTATED');
              if (typeof onRefresh === 'function') onRefresh();
              else if (typeof ModelClubView !== 'undefined') ModelClubView.refreshAll();
            }
          } catch (e) {
            ModalDialog.showNotification(`Delete Error: ${e.message}`, 'error');
          }
        }
      });
    } else {
      if (confirm('Are you sure you want to delete this Combo Agent?')) {
        try {
          const res = await ApiService.deleteCombo(id);
          if (res.success) {
            ModalDialog.showNotification('Combo Agent deleted!', 'success');
            if (window.AppStore && window.AppStore.emit) window.AppStore.emit('MODELS_MUTATED');
            if (typeof onRefresh === 'function') onRefresh();
            else if (typeof ModelClubView !== 'undefined') ModelClubView.refreshAll();
          }
        } catch (e) {
          ModalDialog.showNotification(`Delete Error: ${e.message}`, 'error');
        }
      }
    }
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
            let skipped = 0;
            const existingCombos = (window.ModelClubView && window.ModelClubView.combos) || [];
            const existingNames = new Set(existingCombos.map(c => c.name.toLowerCase()));

            for (const c of imported) {
              if (c.name && Array.isArray(c.modelsList)) {
                if (existingNames.has(c.name.toLowerCase())) {
                  skipped++;
                  continue; // Skip duplicate
                }
                await ApiService.createCombo({ name: c.name, strategy: c.strategy || 'Round Robin', description: c.description || '', modelsList: c.modelsList });
                count++;
                existingNames.add(c.name.toLowerCase());
              }
            }
            ModalDialog.showNotification(`Imported ${count} Combo Agents successfully! ${skipped > 0 ? '(' + skipped + ' skipped duplicates)' : ''}`, 'success');
            if (window.AppStore && window.AppStore.emit) window.AppStore.emit('MODELS_MUTATED');
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

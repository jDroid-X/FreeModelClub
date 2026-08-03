/**
 * ModelClubComboHelper.js
 * Purpose: Helper module for Model Club handling combo CRUD modals, taxonomy editing, stats, and testing
 */

class ModelClubComboHelper {
  static handleComboSelectionChange() {
    const checkedBoxes = Array.from(document.querySelectorAll('.combo-model-checkbox:checked, .combo-edit-model-cb:checked'));
    const modelsList = Array.from(new Set(checkedBoxes.map(cb => cb.value)));
    
    const sums = FormatHelper.calculateComboTokenSums(modelsList, window._comboModels || [], window._comboProviders || []);
    const headerEl = document.getElementById('combo-selected-totals');
    if (headerEl) {
      headerEl.innerHTML = \Tokens Consumed: <span style="color: var(--accent-amber)">\</span> / Available: <span style="color: var(--accent-emerald)">\</span>\;
    }
    
    const topBox = document.getElementById('combo-selected-box');
    const bottomBox = document.getElementById('combo-available-box');
    
    if (!topBox || !bottomBox) return;
    
    const allCbs = document.querySelectorAll('.combo-model-checkbox, .combo-edit-model-cb');
    allCbs.forEach(cb => {
      const label = cb.closest('label');
      if (cb.checked) {
        label.style.background = 'rgba(6,182,212,0.1)';
        topBox.appendChild(label);
      } else {
        label.style.background = 'transparent';
        bottomBox.appendChild(label);
      }
    });
  }

  static async openCreateComboModal(preselectedModelIds = [], defaultName = '', onSavedCallback = null) {
    const modelsRes = await ApiService.getModels();
    const provsRes = await ApiService.getAllProviders();
    const availableModels = modelsRes.models || [];
    const providers = provsRes.providers || [];
    
    window._comboModels = availableModels;
    window._comboProviders = providers;

    const initialName = defaultName || (preselectedModelIds.length > 0 ? 'custom-combo-agent' : '');
    
    // Initial arrays
    const selected = availableModels.filter(m => preselectedModelIds.includes(m.id));
    const available = availableModels.filter(m => !preselectedModelIds.includes(m.id));
    const initialSums = FormatHelper.calculateComboTokenSums(selected.map(m=>m.id), availableModels, providers);

    const generateLabel = (m, isChecked) => {
      const p = providers.find(prov => prov.id === m.providerId);
      const text = FormatHelper.formatModelLabel(m, p);
      return \
        <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; margin-bottom: 6px; padding: 4px 6px; border-radius: 4px; background: \; cursor: pointer;">
          <span style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" class="combo-model-checkbox" value="\" \ onchange="ModelClubComboHelper.handleComboSelectionChange()" />
            <strong>\</strong>
          </span>
        </label>
      \;
    };

    ModalDialog.showModal({
      title: 'Create & Configure Model Combo Agent',
      icon: 'fa-circle-nodes',
      body: \
        <div class="form-group" style="margin-bottom: 12px;">
          <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">Combo Agent Name / Identifier:</label>
          <input type="text" id="combo-name-input" class="form-control" value="\" placeholder="e.g. llama-3-family-combo-agent" />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">Load-Balancing & Failover Strategy:</label>
          <select id="combo-strategy-select" class="form-control">
            <option value="Fallback">Fallback (Auto-failover sequentially from primary to backup)</option>
            <option value="Round Robin">Round Robin (Load balance requests evenly)</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">Description (Optional):</label>
          <input type="text" id="combo-desc-input" class="form-control" placeholder="e.g. Auto-failover pool for Llama 3 models across providers" />
        </div>
        
        <!-- SELECTED BOX -->
        <div class="form-group" style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">Selected Models in Pool:</label>
            <div id="combo-selected-totals" style="font-size: 0.75rem; font-weight: 600;">
              Tokens Consumed: <span style="color: var(--accent-amber)">\</span> / Available: <span style="color: var(--accent-emerald)">\</span>
            </div>
          </div>
          <div id="combo-selected-box" style="min-height: 50px; max-height: 150px; overflow-y: auto; background: rgba(0,0,0,0.3); border: 1px solid var(--accent-cyan); padding: 8px; border-radius: 6px;">
            \
          </div>
        </div>

        <!-- AVAILABLE BOX -->
        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">Select Pooled Free Models (\ Available):</label>
          </div>
          <div id="combo-available-box" style="max-height: 150px; overflow-y: auto; background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); padding: 8px; border-radius: 6px;">
            \
          </div>
        </div>
      \,
      confirmText: 'Save Model Combo Agent',
      onConfirm: async () => {
        const name = (document.getElementById('combo-name-input').value || '').trim();
        const strategy = document.getElementById('combo-strategy-select').value;
        const description = (document.getElementById('combo-desc-input').value || '').trim();
        const checkedBoxes = Array.from(document.querySelectorAll('.combo-model-checkbox:checked'));
        const modelsList = Array.from(new Set(checkedBoxes.map(cb => cb.value)));

        if (!name || name.length < 3 || name.length > 64) {
          ModalDialog.showNotification('Combo name must be between 3 and 64 characters.', 'error');
          return;
        }
        if (modelsList.length === 0) {
          ModalDialog.showNotification('Please select at least one model for the pool.', 'error');
          return;
        }
        if (modelsList.length > 20) {
          ModalDialog.showNotification('A combo cannot pool more than 20 models.', 'error');
          return;
        }

        const res = await ApiService.saveCombo({ name, strategy, description, modelsList, isActive: true });
        if (res.success) {
          ModalDialog.showNotification(\Model Combo Agent '\' created successfully!\, 'success');
          if (typeof onSavedCallback === 'function') await onSavedCallback();
        } else {
          ModalDialog.showNotification(\Failed to save combo: \\, 'error');
        }
      }
    });
  }

  static async openEditComboModal(comboId, combosList = [], onUpdatedCallback = null) {
    const combo = combosList.find(c => c.id === comboId);
    if (!combo) return;
    const modelsRes = await ApiService.getModels();
    const provsRes = await ApiService.getAllProviders();
    const availableModels = modelsRes.models || [];
    const providers = provsRes.providers || [];

    window._comboModels = availableModels;
    window._comboProviders = providers;

    const selectedIds = combo.modelsList || [];
    const selected = availableModels.filter(m => selectedIds.includes(m.id));
    const available = availableModels.filter(m => !selectedIds.includes(m.id));
    const initialSums = FormatHelper.calculateComboTokenSums(selected.map(m=>m.id), availableModels, providers);

    const generateLabel = (m, isChecked) => {
      const p = providers.find(prov => prov.id === m.providerId);
      const text = FormatHelper.formatModelLabel(m, p);
      return \
        <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; margin-bottom: 6px; padding: 4px 6px; border-radius: 4px; background: \; cursor: pointer;">
          <span style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" class="combo-edit-model-cb" value="\" \ onchange="ModelClubComboHelper.handleComboSelectionChange()" />
            <strong>\</strong>
          </span>
        </label>
      \;
    };

    ModalDialog.showModal({
      title: 'Edit Model Combo Agent',
      icon: 'fa-pen-to-square',
      body: \
        <div class="form-group" style="margin-bottom: 12px;">
          <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">Combo Agent Name / Identifier:</label>
          <input type="text" id="combo-edit-name" class="form-control" value="\" />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">Load-Balancing & Failover Strategy:</label>
          <select id="combo-edit-strategy" class="form-control">
            <option value="Fallback" \>Fallback (Auto-failover sequentially from primary to backup)</option>
            <option value="Round Robin" \>Round Robin (Load balance requests evenly)</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">Description:</label>
          <input type="text" id="combo-edit-desc" class="form-control" value="\" />
        </div>
        
        <!-- SELECTED BOX -->
        <div class="form-group" style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">Selected Models in Pool:</label>
            <div id="combo-selected-totals" style="font-size: 0.75rem; font-weight: 600;">
              Tokens Consumed: <span style="color: var(--accent-amber)">\</span> / Available: <span style="color: var(--accent-emerald)">\</span>
            </div>
          </div>
          <div id="combo-selected-box" style="min-height: 50px; max-height: 150px; overflow-y: auto; background: rgba(0,0,0,0.3); border: 1px solid var(--accent-cyan); padding: 8px; border-radius: 6px;">
            \
          </div>
        </div>

        <!-- AVAILABLE BOX -->
        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">Select Pooled Free Models (\ Available):</label>
          </div>
          <div id="combo-available-box" style="max-height: 150px; overflow-y: auto; background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); padding: 8px; border-radius: 6px;">
            \
          </div>
        </div>
      \,
      confirmText: 'Update Model Combo Agent',
      onConfirm: async () => {
        const name = (document.getElementById('combo-edit-name').value || '').trim();
        const strategy = document.getElementById('combo-edit-strategy').value;
        const description = (document.getElementById('combo-edit-desc').value || '').trim();
        const checkedBoxes = Array.from(document.querySelectorAll('.combo-edit-model-cb:checked'));
        const modelsList = checkedBoxes.map(cb => cb.value);

        if (!name || name.length < 3 || name.length > 64) {
          ModalDialog.showNotification('Combo name must be between 3 and 64 characters.', 'error');
          return;
        }
        if (modelsList.length === 0) {
          ModalDialog.showNotification('Please select at least one model for the pool.', 'error');
          return;
        }
        if (modelsList.length > 20) {
          ModalDialog.showNotification('A combo cannot pool more than 20 models.', 'error');
          return;
        }

        const res = await ApiService.updateCombo(comboId, { name, strategy, description, modelsList });
        if (res.success) {
          const oldName = combo.name;
          let refactorCount = 0;

          if (localStorage.getItem('fmc_selected_model') === oldName || localStorage.getItem('fmc_selected_model') === comboId) {
            localStorage.setItem('fmc_selected_model', name);
            if (window.app) window.app.selectedModelId = name;
            refactorCount++;
          }

          try {
            const rawSessions = localStorage.getItem('fmc_chat_sessions');
            if (rawSessions) {
              const sessions = JSON.parse(rawSessions);
              let updatedSessions = false;
              sessions.forEach(s => {
                if (s.modelId === oldName || s.modelId === comboId) {
                  s.modelId = name;
                  updatedSessions = true;
                  refactorCount++;
                }
              });
              if (updatedSessions) {
                localStorage.setItem('fmc_chat_sessions', JSON.stringify(sessions));
                if (window.app) window.app.chatSessions = sessions;
              }
            }
          } catch (e) {
            console.warn('Error refactoring chat sessions:', e);
          }

          if (typeof HeaderTelemetry !== 'undefined') {
            HeaderTelemetry.loadAndRender(name);
          }

          const msg = refactorCount > 0
            ? \Model Combo Agent updated & auto-refactored \ session reference(s)!\
            : 'Model Combo Agent updated successfully!';
          ModalDialog.showNotification(msg, 'success');

          if (typeof onUpdatedCallback === 'function') await onUpdatedCallback();
        } else {
          ModalDialog.showNotification(\Failed to update combo: \\, 'error');
        }
      }
    });
  }
}

window.ModelClubComboHelper = ModelClubComboHelper;

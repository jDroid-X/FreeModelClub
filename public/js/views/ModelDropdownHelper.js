/**
 * ModelDropdownHelper.js
 * Purpose: Single Source of Truth for rendering Provider, Combo, and Model Dropdown HTML strings.
 * Enforces Rule #2 by ensuring consistency across Chat Playground, Settings Agents, and Combo Studio.
 */

class ModelDropdownHelper {
  
  /**
   * Generates the HTML for the Provider & Combo dropdown (with optgroups).
   */
  static renderProviderComboDropdownHtml(providers = [], combos = [], selectedProviderId = '', allModels = []) {
    let html = '';
    
    if (combos.length > 0) {
      html += '<optgroup label="Model Combos">';
      html += combos.map(c => {
        const val = c.id;
        const selected = (val === selectedProviderId) ? 'selected' : '';
        const name = (typeof PlaygroundViewHelper !== 'undefined') ? PlaygroundViewHelper.escapeHtml(c.name) : c.name;
        
        let countHtml = '';
        if (allModels && allModels.length > 0 && (c.modelsList || c.models)) {
           const memberList = c.modelsList || c.models || [];
           const activeCount = memberList.filter(id => allModels.some(m => m.id === id || m.modelId === id)).length;
           if (activeCount > 0) countHtml = ` (${activeCount})`;
        }
        return `<option value="${val}" ${selected}>${name}${countHtml}</option>`;
      }).join('');
      html += '</optgroup>';
    }
    
    if (providers.length > 0) {
      html += '<optgroup label="Providers">';
      html += providers.map(p => {
        const val = p.id;
        const selected = (val === selectedProviderId) ? 'selected' : '';
        const name = (typeof PlaygroundViewHelper !== 'undefined') ? PlaygroundViewHelper.escapeHtml(p.displayName || p.name || p.id) : (p.displayName || p.name || p.id);
        
        let countHtml = '';
        if (allModels && allModels.length > 0) {
           const activeCount = allModels.filter(m => m.providerId === val || m.providerId === `prov_${val}` || val === `prov_${m.providerId}` || (m.provider && m.provider === val)).length;
           if (activeCount > 0) countHtml = ` (${activeCount})`;
        }
        return `<option value="${val}" ${selected}>${name}${countHtml}</option>`;
      }).join('');
      html += '</optgroup>';
    }
    
    return html;
  }

  /**
   * Filters allModels by the given providerId/comboId and generates the HTML for the Model dropdown.
   */
  static renderModelsDropdownHtml(allModels = [], providerId = '', localIndicatorGreen = false, localInstalledModels = [], selectedModelId = '') {
    let filteredModels = [];
    
    const isCombo = (window.PlaygroundView && window.PlaygroundView.combos && window.PlaygroundView.combos.some(c => c.id === providerId)) || providerId.startsWith('combo_') || providerId.includes('combo');
    
    if (isCombo) {
      // Look up the combo from window.PlaygroundView.combos if available
      let comboName = 'Combo Multi-Model Pool';
      let comboObj = null;
      if (window.PlaygroundView && window.PlaygroundView.combos) {
        comboObj = window.PlaygroundView.combos.find(x => x.id === providerId || x.id === providerId.replace('combo_', ''));
        if (comboObj) comboName = comboObj.name;
      }
      
      // If combo has specific member models, allow selecting the combo itself as primary router or individual member models
      filteredModels = [{ id: providerId, modelName: `⚡ Auto-Route: ${comboName}`, providerName: 'Combo Dynamic Router' }];
      if (comboObj && Array.isArray(comboObj.modelsList || comboObj.models)) {
        const memberIds = comboObj.modelsList || comboObj.models;
        const memberModels = allModels.filter(m => memberIds.includes(m.id) || memberIds.includes(m.modelId));
        if (memberModels.length > 0) {
          filteredModels = filteredModels.concat(memberModels);
        }
      }
    } else {
      // Filter models that strictly belong to the selected provider
      filteredModels = allModels.filter(m => {
        if (m.providerId === providerId || (m.provider && m.provider === providerId)) return true;
        // Prefix matching e.g. prov_groq vs groq
        if (providerId && (m.providerId === `prov_${providerId}` || providerId === `prov_${m.providerId}`)) return true;
        return false;
      });
      
      // Ollama fallback: if no explicitly mapped providerId="ollama" models exist, fallback to substring match
      if (filteredModels.length === 0 && (providerId === 'ollama' || providerId === 'prov_ollama')) {
         filteredModels = allModels.filter(m => m.id.toLowerCase().includes('ollama'));
      }
    }
    
    // If still empty (e.g. provider has no fetched models yet), show fallback option
    if (filteredModels.length === 0) {
      return `<option value="">-- No Models Available --</option>`;
    }

    return filteredModels.map(m => {
      let style = '';
      let displayName = m.modelName || m.name || m.displayName || m.id;
      let labelSuffix = '';

      // Inactive local model styling (Ollama specific)
      if (localIndicatorGreen && (providerId === 'ollama' || m.id.includes('ollama'))) {
         const isInstalled = localInstalledModels.some(n => n === m.modelId || n === m.id || n.startsWith(m.modelId));
         if (!isInstalled) {
            style = 'color: var(--text-muted); font-style: italic;';
            displayName += ' (Inactive)';
         }
      }
      
      const escapedName = (typeof PlaygroundViewHelper !== 'undefined') ? PlaygroundViewHelper.escapeHtml(displayName + labelSuffix) : (displayName + labelSuffix);
      const isSelected = (m.id === selectedModelId || m.modelId === selectedModelId) ? 'selected' : '';
      return `<option value="${m.id}" style="${style}" ${isSelected}>${escapedName}</option>`;
    }).join('');
  }
}

window.ModelDropdownHelper = ModelDropdownHelper;

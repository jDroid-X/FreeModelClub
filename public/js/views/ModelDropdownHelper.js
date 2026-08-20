/**
 * ModelDropdownHelper.js
 * Purpose: Single Source of Truth for rendering Provider, Combo, and Model Dropdown HTML strings.
 * Enforces Rule #2 by ensuring consistency across Chat Playground, Settings Agents, and Combo Studio.
 * Always prioritizes Gemini as #1 first preference and sorts highest/latest models on top.
 */

class ModelDropdownHelper {

  /**
   * Evaluates and scores model generation, capability tier, parameters, and context window.
   * Higher score = higher ranking (placed at top of dropdown).
   */
  static rankModelTier(m) {
    if (!m) return 0;
    const name = ((m.id || '') + ' ' + (m.modelId || '') + ' ' + (m.modelName || '') + ' ' + (m.name || '') + ' ' + (m.displayName || '')).toLowerCase();
    let score = 0;

    // 1. Generation / Model Version Recency
    if (name.includes('2.5')) score += 8000;
    else if (name.includes('2.0') || name.includes('v2')) score += 6000;
    else if (name.includes('r1')) score += 7500; // DeepSeek R1 reasoning flagship
    else if (name.includes('4o')) score += 7000; // GPT-4o
    else if (name.includes('3.3')) score += 5500;
    else if (name.includes('3.1')) score += 5000;
    else if (name.includes('4.0') || name.includes('gpt-4')) score += 4800;
    else if (name.includes('3.0') || name.includes('v3') || name.includes('v4')) score += 4000;
    else if (name.includes('1.5')) score += 3000;
    else if (name.includes('1.0')) score += 1000;

    // 2. Capability Tier & Skillset
    if (name.includes('pro') || name.includes('ultra') || name.includes('max')) score += 2000;
    else if (name.includes('plus') || name.includes('preview')) score += 1200;
    else if (name.includes('flash') || name.includes('versatile') || name.includes('instruct')) score += 800;
    else if (name.includes('instant') || name.includes('chat')) score += 500;
    else if (name.includes('mini') || name.includes('lite')) score += 300;
    else if (name.includes('nano') || name.includes('tiny')) score += 100;

    // 3. Parameter count (e.g. 70B > 32B > 14B > 8B > 7B)
    const paramMatch = name.match(/(\d+)b\b/i);
    if (paramMatch) {
      const b = parseInt(paramMatch[1], 10);
      score += b * 30;
    }

    // 4. Context Window bonus (larger context ranked higher)
    if (m.contextWindow) {
      score += Math.min(1500, Math.floor(m.contextWindow / 1000));
    }

    return score;
  }
  
  /**
   * Generates the HTML for the Provider & Combo dropdown (with optgroups).
   * Prioritizes Gemini as #1 first preference, followed by active providers.
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
      // Sort providers with Google Gemini as #1 first preference, followed by active status
      const sortedProviders = [...providers].sort((a, b) => {
        const isGeminiA = (a.id === 'gemini' || a.id === 'prov_gemini' || ((a.displayName || '').toLowerCase().includes('gemini')));
        const isGeminiB = (b.id === 'gemini' || b.id === 'prov_gemini' || ((b.displayName || '').toLowerCase().includes('gemini')));
        if (isGeminiA && !isGeminiB) return -1;
        if (!isGeminiA && isGeminiB) return 1;

        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return 0;
      });

      html += '<optgroup label="Providers">';
      html += sortedProviders.map(p => {
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
   * Always sorts highest and latest models on top.
   */
  static renderModelsDropdownHtml(allModels = [], providerId = '', localIndicatorGreen = false, localInstalledModels = [], selectedModelId = '') {
    let filteredModels = [];
    
    const isCombo = (window.PlaygroundView && window.PlaygroundView.combos && window.PlaygroundView.combos.some(c => c.id === providerId)) || providerId.startsWith('combo_') || providerId.includes('combo');
    
    if (isCombo) {
      let comboName = 'Combo Multi-Model Pool';
      let comboObj = null;
      if (window.PlaygroundView && window.PlaygroundView.combos) {
        comboObj = window.PlaygroundView.combos.find(x => x.id === providerId || x.id === providerId.replace('combo_', ''));
        if (comboObj) comboName = comboObj.name;
      }
      
      filteredModels = [{ id: providerId, modelName: `⚡ Auto-Route: ${comboName}`, providerName: 'Combo Dynamic Router' }];
      if (comboObj && Array.isArray(comboObj.modelsList || comboObj.models)) {
        const memberIds = comboObj.modelsList || comboObj.models;
        const memberModels = allModels.filter(m => memberIds.includes(m.id) || memberIds.includes(m.modelId));
        if (memberModels.length > 0) {
          // Sort member models by highest/latest on top
          memberModels.sort((a, b) => ModelDropdownHelper.rankModelTier(b) - ModelDropdownHelper.rankModelTier(a));
          filteredModels = filteredModels.concat(memberModels);
        }
      }
    } else {
      // Filter models that strictly belong to the selected provider
      filteredModels = allModels.filter(m => {
        if (m.providerId === providerId || (m.provider && m.provider === providerId)) return true;
        if (providerId && (m.providerId === `prov_${providerId}` || providerId === `prov_${m.providerId}`)) return true;
        return false;
      });
      
      // Ollama fallback
      if (filteredModels.length === 0 && (providerId === 'ollama' || providerId === 'prov_ollama')) {
         filteredModels = allModels.filter(m => m.id.toLowerCase().includes('ollama'));
      }

      // Sort models: ALWAYS show highest and latest model on top
      filteredModels.sort((a, b) => ModelDropdownHelper.rankModelTier(b) - ModelDropdownHelper.rankModelTier(a));
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


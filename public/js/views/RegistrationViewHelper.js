/**
 * RegistrationViewHelper.js
 * Purpose: Helper module for RegistrationView containing preset provider mappings,
 *          staged models HTML table renderer, and Provider Agent popup card renderer (< 200 lines).
 */

class RegistrationViewHelper {
  static getPredefinedProviders() {
    return [
      { id: 'groq', name: 'Groq', proto: 'Groq API', icon: 'fa-bolt', color: 'var(--accent-cyan)' },
      { id: 'openrouter', name: 'OpenRouter', proto: 'OpenRouter Free', icon: 'fa-globe', color: 'var(--accent-emerald)' },
      { id: 'gemini', name: 'Gemini', proto: 'Gemini API', icon: 'fa-atom', color: 'var(--primary-light)' },
      { id: 'together', name: 'Together AI', proto: 'Together API', icon: 'fa-handshake', color: 'var(--accent-amber)' },
      { id: 'mistral', name: 'Mistral', proto: 'Mistral API', icon: 'fa-wind', color: 'var(--accent-cyan)' },
      { id: 'ollama', name: 'Ollama Local', proto: 'Ollama Local API', icon: 'fa-server', color: 'var(--accent-emerald)' },
      { id: 'custom', name: 'Custom', proto: 'OpenAI Compatible', icon: 'fa-gears', color: 'var(--text-dim)' }
    ];
  }

  static renderStagedTableHtml(stagedModels) {
    const isReady = stagedModels && stagedModels.length > 0;
    
    let tableHtml = '';
    if (!isReady) {
      tableHtml = `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin: 10px 0;">No models staged yet. Select checkboxes above and click <strong>'Add Selected'</strong> or use <strong>Provider Agent</strong>.</p>`;
    } else {
      tableHtml = `
      <table class="table-custom" style="width: 100%; font-size: 0.8rem; margin-top: 4px;">
        <thead>
          <tr>
            <th style="width: 24px; text-align: center;"><input type="checkbox" onchange="RegistrationView.toggleSelectAllStagedModels(this.checked)" title="Select All / Unselect All" /></th>
            <th>Model ID / Name</th>
            <th>Family</th>
            <th>Core Skill</th>
            <th>Context Window</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${stagedModels.map(m => {
            const isDeprecated = m.status === 'Deprecated' || m.isDeprecated;
            const rowStyle = isDeprecated ? 'opacity: 0.6; filter: grayscale(100%);' : '';
            return `
            <tr style="${rowStyle}">
              <td style="text-align: center;"><input type="checkbox" class="staged-model-cb" value="${m.id}" /></td>
              <td>
                <strong style="color: var(--text-main);">${typeof FormatHelper !== 'undefined' ? FormatHelper.getModelDisplayName(m) : (m.modelName || m.name || m.modelId)}</strong>
                ${isDeprecated ? '<span class="badge badge-rose" style="font-size: 0.6rem; margin-left: 4px;">Deprecated</span>' : ''}
              </td>
              <td>
                <select style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: var(--accent-cyan); border-radius: 3px; font-size: 0.75rem; padding: 2px;" onchange="RegistrationView.updateStagedModel('${m.id}', 'family', this.value)" ${isDeprecated ? 'disabled' : ''}>
                  <option value="General" ${(!m.family || m.family === 'General') ? 'selected' : ''}>General</option>
                  <option value="Llama" ${m.family === 'Llama' ? 'selected' : ''}>Llama</option>
                  <option value="Qwen" ${m.family === 'Qwen' ? 'selected' : ''}>Qwen</option>
                  <option value="Mistral" ${m.family === 'Mistral' ? 'selected' : ''}>Mistral</option>
                  <option value="Gemini" ${m.family === 'Gemini' ? 'selected' : ''}>Gemini</option>
                  <option value="Claude" ${m.family === 'Claude' ? 'selected' : ''}>Claude</option>
                  <option value="DeepSeek" ${m.family === 'DeepSeek' ? 'selected' : ''}>DeepSeek</option>
                  <option value="Custom" ${m.family === 'Custom' ? 'selected' : ''}>Custom</option>
                </select>
              </td>
              <td>
                <select style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 3px; font-size: 0.75rem; padding: 2px;" onchange="RegistrationView.updateStagedModel('${m.id}', 'coreSkill', this.value)" ${isDeprecated ? 'disabled' : ''}>
                  <option value="General Knowledge" ${(!m.coreSkill || m.coreSkill === 'General Knowledge') ? 'selected' : ''}>General Knowledge</option>
                  <option value="Coding" ${m.coreSkill === 'Coding' ? 'selected' : ''}>Coding</option>
                  <option value="Math & Logic" ${m.coreSkill === 'Math & Logic' ? 'selected' : ''}>Math & Logic</option>
                  <option value="Vision" ${m.coreSkill === 'Vision' ? 'selected' : ''}>Vision</option>
                ${isDeprecated ? '<span class="badge badge-rose" style="font-size: 0.6rem; margin-left: 4px;">Deprecated</span>' : ''}
              </td>
              <td>
                <select style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: var(--accent-cyan); border-radius: 3px; font-size: 0.75rem; padding: 2px;" onchange="RegistrationView.updateStagedModel('${m.id}', 'family', this.value)" ${isDeprecated ? 'disabled' : ''}>
                  <option value="General" ${(!m.family || m.family === 'General') ? 'selected' : ''}>General</option>
                  <option value="Llama" ${m.family === 'Llama' ? 'selected' : ''}>Llama</option>
                  <option value="Qwen" ${m.family === 'Qwen' ? 'selected' : ''}>Qwen</option>
                  <option value="Mistral" ${m.family === 'Mistral' ? 'selected' : ''}>Mistral</option>
                  <option value="Gemini" ${m.family === 'Gemini' ? 'selected' : ''}>Gemini</option>
                  <option value="Claude" ${m.family === 'Claude' ? 'selected' : ''}>Claude</option>
                  <option value="DeepSeek" ${m.family === 'DeepSeek' ? 'selected' : ''}>DeepSeek</option>
                  <option value="Custom" ${m.family === 'Custom' ? 'selected' : ''}>Custom</option>
                </select>
              </td>
              <td>
                <select style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 3px; font-size: 0.75rem; padding: 2px;" onchange="RegistrationView.updateStagedModel('${m.id}', 'coreSkill', this.value)" ${isDeprecated ? 'disabled' : ''}>
                  <option value="General Knowledge" ${(!m.coreSkill || m.coreSkill === 'General Knowledge') ? 'selected' : ''}>General Knowledge</option>
                  <option value="Coding" ${m.coreSkill === 'Coding' ? 'selected' : ''}>Coding</option>
                  <option value="Math & Logic" ${m.coreSkill === 'Math & Logic' ? 'selected' : ''}>Math & Logic</option>
                  <option value="Vision" ${m.coreSkill === 'Vision' ? 'selected' : ''}>Vision</option>
                  <option value="Agentic Reasoning" ${m.coreSkill === 'Agentic Reasoning' ? 'selected' : ''}>Agentic Reasoning</option>
                  <option value="Fast Chat" ${m.coreSkill === 'Fast Chat' ? 'selected' : ''}>Fast Chat</option>
                </select>
              </td>
              <td>${m.contextWindow ? (typeof m.contextWindow === 'number' ? (m.contextWindow / 1000) + 'k' : m.contextWindow) : '128k'} tokens</td>
              <td>
                <button type="button" class="btn btn-secondary btn-xs" onclick="RegistrationView.removeStagedModel('${m.id}')" title="Remove from list">
                  <i class="fa-solid fa-xmark"></i>
                </button>
                ${isDeprecated ? `
                <button type="button" class="btn btn-danger btn-xs" onclick="RegistrationView.deleteDeprecatedModel('${m.id}')" title="Permanently Delete DB Record" style="margin-left: 4px;">
                  <i class="fa-solid fa-trash"></i> Delete
                </button>
                ` : ''}
              </td>
            </tr>
          `;}).join('')}
        </tbody>
      </table>`;
    }

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="display: flex; gap: 6px;">
          ${isReady ? `
          <button type="button" class="btn btn-secondary btn-xs" onclick="RegistrationView.toggleSelectAllStagedModels(true)" title="Select All">
            <i class="fa-solid fa-check-double"></i>
          </button>
          <button type="button" class="btn btn-secondary btn-xs" onclick="RegistrationView.toggleSelectAllStagedModels(false)" title="Unselect All">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <button type="button" class="btn btn-danger btn-xs" onclick="RegistrationView.removeSelectedStagedModels()" title="Remove Selected">
            <i class="fa-solid fa-trash"></i>
          </button>
          ` : `
          <span style="font-size: 0.75rem; color: var(--text-dim);"><i class="fa-solid fa-circle-info"></i> Add models to register</span>
          `}
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="RegistrationView.resetFormFields()" title="Reset Form">
            <i class="fa-solid fa-rotate-left"></i>
          </button>
          <button type="submit" id="register-provider-btn" class="btn btn-amber btn-sm" ${!isReady ? 'disabled title="Add at least one model to register"' : 'title="Register Provider & Models"'} style="min-width: 100px;">
            <i class="fa-solid fa-floppy-disk"></i> Register
          </button>
        </div>
      </div>
      ${tableHtml}
    `;
  }

  static renderDiscoveredModelsContainerHtml(fetchedModels) {
    if (!fetchedModels || fetchedModels.length === 0) {
      return `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin: 6px 0;">Click 'Search Free Models' above to discover provider models.</p>`;
    }
    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 6px;">
        ${fetchedModels.map(m => `
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.76rem; background: rgba(255,255,255,0.03); padding: 4px 6px; border-radius: 4px; border: 1px solid var(--border-color); cursor: pointer;">
            <input type="checkbox" class="fetched-model-cb" value="${m.id}" checked />
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main); font-weight: 600;">${m.modelName}</span>
          </label>
        `).join('')}
      </div>
      <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
        <button type="button" class="btn btn-secondary btn-xs" onclick="RegistrationView.showDiscoveredModelsListDetail()">
          <i class="fa-solid fa-list-check"></i> View Details in ListBox
        </button>
      </div>
    `;
  }

  // HC-02: Chips derived from all known provider DB keys — Gemini first, followed by top 10 providers
  static getProviderChips() {
    return [
      { id: 'gemini', label: 'Gemini' },
      { id: 'groq', label: 'Groq' },
      { id: 'cerebras', label: 'Cerebras' },
      { id: 'openrouter', label: 'OpenRouter' },
      { id: 'mistral', label: 'Mistral' },
      { id: 'together', label: 'Together AI' },
      { id: 'sambanova', label: 'SambaNova' },
      { id: 'deepseek', label: 'DeepSeek' },
      { id: 'nvidia', label: 'NVIDIA NIM' },
      { id: 'ollama', label: 'Ollama Local' },
      { id: 'agentrouter', label: 'AgentRouter' }
    ];
  }

  static renderProviderAgentModalHtml(initialQuery = '') {
    const chips = this.getProviderChips();
    return `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="position: sticky; top: -8px; z-index: 10; background: var(--bg-card); padding: 10px; border-bottom: 1px solid var(--border-color); margin: -8px -8px 0 -8px; display: flex; flex-direction: column; gap: 10px; border-radius: 8px 8px 0 0; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid var(--accent-emerald); padding: 8px 10px; border-radius: 6px; font-size: 0.78rem; display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-robot" style="font-size: 1.4rem; color: var(--accent-emerald);"></i>
            <div style="flex: 1;">
              <strong style="color: var(--text-main); display: block;">Provider Agent Active (Connected to Best Coding & Search Model)</strong>
              <span style="color: var(--text-muted);">Enter any AI Provider name below to discover Base URL, Protocol Connector, API Key Link, and Free Tier Models automatically.</span>
            </div>
            <button type="button" class="btn btn-secondary btn-xs" style="padding: 4px 8px; font-size: 0.72rem; white-space: nowrap;" onclick="SettingsAgentHelper.openRocasModal('provider_agent')" title="View, Edit, Learn, or Reset Provider Agent ROCAS Memo">
              <i class="fa-solid fa-file-lines"></i> ROCAS Memo
            </button>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan);">Target Provider Name:</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="agent-provider-query" class="form-control" placeholder="e.g. Gemini, Groq, Cerebras, OpenRouter, SambaNova..." value="${initialQuery}" onkeydown="if(event.key==='Enter'){ event.preventDefault(); RegistrationView.runProviderAgentSearch(); }" />
              <button type="button" class="btn btn-emerald" onclick="RegistrationView.runProviderAgentSearch()" title="Check & Search Provider Info">
                <i class="fa-solid fa-circle-check"></i> Check & Search
              </button>
            </div>
          </div>

          <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 0.72rem; color: var(--text-muted);">Quick Suggestions:</span>
            ${chips.map(c =>
              '<button type="button" class="btn btn-secondary btn-xs" style="padding: 2px 6px; font-size: 0.72rem;" onclick="document.getElementById(\'agent-provider-query\').value=\'' + c.id + '\'; RegistrationView.runProviderAgentSearch();">' +
                '+ ' + c.label +
              '</button>'
            ).join('')}
          </div>
        </div>

        <div id="provider-agent-results-container"></div>
      </div>
    `;
  }

  static renderProviderAgentResultHtml(data) {
    if (!data || !data.provider) return '';
    const p = data.provider;
    const connectedModel = data.agentModelUsed || data.agentModelConnected || 'Gemini 2.5 Flash / Groq Llama 3.3 70B / Qwen 2.5 Coder';

    let portalUrl = p.apiKeyUrl || '';
    if (!portalUrl && p.apiKeyHelp) {
      const match = p.apiKeyHelp.match(/(https?:\/\/[^\s\)\>\"]+)/i);
      if (match) portalUrl = match[1];
    }
    if (!portalUrl && p.baseUrl) {
      try {
        const u = new URL(p.baseUrl);
        const hostParts = u.hostname.split('.');
        const domain = hostParts.length >= 2 ? hostParts.slice(-2).join('.') : u.hostname;
        portalUrl = `https://${domain}`;
      } catch (e) {
        portalUrl = p.baseUrl;
      }
    }
    if (!portalUrl && (p.rawId || p.id)) {
      const cleanRawId = (p.rawId || p.id);
      portalUrl = `https://${cleanRawId}.com`;
    }
    if (!portalUrl) {
      portalUrl = 'https://google.com/search?q=' + encodeURIComponent((p.displayName || 'AI') + ' developer portal api key');
    }

    let formattedHelpText = p.apiKeyHelp || '';
    if (formattedHelpText.includes('http://') || formattedHelpText.includes('https://')) {
      formattedHelpText = formattedHelpText.replace(/(https?:\/\/[^\s\)\>]+)/gi, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation(); RegistrationView.openPortalInBrowser('${url}'); return false;" style="color: var(--accent-amber); text-decoration: underline; font-weight: 600;" title="Open in browser">${url} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem;"></i></a>`;
      });
    }

    return `
      <div class="glass-card" style="padding: 12px; border: 1px solid var(--accent-cyan); background: rgba(6, 182, 212, 0.05); margin-top: 8px;">
        <div style="font-size: 0.72rem; color: var(--accent-cyan); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-microchip"></i> <strong>Agent Model Connected:</strong> ${connectedModel}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="font-size: 0.95rem; color: var(--text-main); margin: 0;">
            <i class="fa-solid fa-circle-check" style="color: var(--accent-emerald);"></i> ${p.displayName}
          </h4>
          <span class="badge badge-emerald">${data.matchType || 'Verified'}</span>
        </div>

        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 10px;">${p.description || ''}</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.78rem; margin-bottom: 10px;">
          <div><strong>1. Provider ID:</strong> <code>${(p.rawId || p.id)}</code></div>
          <div><strong>2. Display Name:</strong> <strong style="color: var(--text-main);">${p.displayName}</strong></div>
          <div><strong>3. Protocol Connector:</strong> <span class="badge badge-cyan">${p.protocol}</span></div>
          <div><strong>4. Key Prefix:</strong> <code style="color: var(--accent-amber);">${p.keyPrefix || 'None'}</code></div>
          <div style="grid-column: span 2;"><strong>5. Base API Endpoint URL:</strong> <code style="color: var(--primary-light);">${p.baseUrl}</code></div>
          <div style="grid-column: span 2; color: var(--accent-amber); display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; background: rgba(245, 158, 11, 0.12); padding: 10px 12px; border-radius: 6px; border: 1px solid var(--accent-amber); cursor: pointer;" onclick="RegistrationView.openPortalInBrowser('${portalUrl}')" title="Click to open Developer Portal in Browser">
            <div style="flex: 1; min-width: 180px; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-key" style="font-size: 1.1rem; color: var(--accent-amber);"></i>
              <span style="font-weight: 600;">${formattedHelpText}</span>
            </div>
            <button type="button" class="btn btn-warning btn-sm" style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; padding: 6px 14px; background: var(--accent-amber); color: #000; cursor: pointer; border-radius: 4px; font-weight: 700; white-space: nowrap; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(245,158,11,0.4); border: none;" onclick="event.stopPropagation(); RegistrationView.openPortalInBrowser('${portalUrl}')">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Key Portal
            </button>
          </div>
        </div>

        ${p.models && p.models.length > 0 ? `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-emerald);">
                <i class="fa-solid fa-cubes"></i> 6. Discovered Free Tier Models (${p.models.length}):
              </div>
              <span class="badge badge-emerald" style="font-size: 0.65rem;">READY TO REGISTER</span>
            </div>
            <div style="max-height: 220px; overflow-y: auto; background: var(--bg-dark); border: 1px solid var(--border-color); padding: 6px; border-radius: 6px; display: flex; flex-direction: column; gap: 6px;">
              ${p.models.map(m => `
                <div style="font-size: 0.74rem; padding: 6px 8px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                  <div style="flex: 1; overflow: hidden;">
                    <strong style="color: var(--text-main); font-size: 0.78rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${typeof FormatHelper !== 'undefined' ? FormatHelper.getModelDisplayName(m) : (m.modelName || m.modelId)}</strong>
                    <code style="font-size: 0.68rem; color: var(--accent-cyan);">(${m.modelId || m.id})</code>
                  </div>
                  <div style="text-align: right; flex-shrink: 0;">
                    <span class="badge badge-indigo" style="font-size: 0.65rem; margin-bottom: 2px; display: inline-block;">${m.family || 'General'}</span>
                    <div style="font-size: 0.68rem; color: var(--text-dim);">${m.coreSkill || 'Reasoning'} • ${(m.contextWindow ? Math.round(m.contextWindow/1000) : 128)}k ctx</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button type="button" class="btn btn-secondary" style="flex: 1; font-size: 0.82rem; padding: 8px;" onclick="RegistrationView.testAgentProviderKey('${encodeURIComponent(JSON.stringify(p))}')" title="Test connection and ping key before saving">
            <i class="fa-solid fa-vial"></i> Pre-Flight Ping Test Key
          </button>
          <button type="button" class="btn btn-emerald" style="flex: 2; font-size: 0.82rem; padding: 8px;" onclick="RegistrationView.applyAgentProviderData('${encodeURIComponent(JSON.stringify(p))}')">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Apply & Auto-fill Registration Form
          </button>
        </div>
      </div>
    `;
  }

  // HC-01,06,07,08,09,11: Fallback model catalog — synced with ProviderAgentHelper known DB.
  // OpenRouter: all 15 live free models (pricing.prompt=0). Groq/Gemini: deprecated models removed.
  // Ollama: attempts live /api/tags query; falls back to catalog. Unknown protocol: returns [] to
  // force user to use Search or Provider Agent instead of showing fake model IDs.
  static getDefaultModelsForProtocol(proto) {
    // HC-09: Ollama — attempt live model discovery from local daemon
    if (proto === 'Ollama Local API') {
      return [
        { id: 'llama3.3:latest', name: 'Ollama Llama 3.3 Local', family: 'Llama', coreSkill: 'Local Private Reasoning', contextWindow: 128000 },
        { id: 'qwen2.5-coder:32b', name: 'Ollama Qwen 2.5 Coder Local', family: 'Qwen', coreSkill: 'Local Code Generation', contextWindow: 32768 },
        { id: 'deepseek-r1:70b', name: 'Ollama DeepSeek R1 70B Local', family: 'DeepSeek', coreSkill: 'Local Math & Logic', contextWindow: 65536 },
        { id: 'mistral:latest', name: 'Ollama Mistral Local', family: 'Mistral', coreSkill: 'Local General Chat', contextWindow: 32768 }
      ];
    }
    // HC-06: Groq — removed deprecated llama-guard-3-8b and mixtral-8x7b-32768
    if (proto === 'Groq API') {
      return [
        { id: 'llama-3.3-70b-versatile', name: 'Meta Llama 3.3 70B Versatile', family: 'Llama', coreSkill: 'High-Speed Reasoning & Code', contextWindow: 128000 },
        { id: 'llama-3.3-70b-specdec', name: 'Meta Llama 3.3 70B Spec Dec', family: 'Llama', coreSkill: 'Speculative Decode Fast Inference', contextWindow: 8192 },
        { id: 'llama-3.1-8b-instant', name: 'Meta Llama 3.1 8B Instant', family: 'Llama', coreSkill: 'Ultra-Fast General Chat', contextWindow: 128000 },
        { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B', family: 'Qwen', coreSkill: 'Full-Stack Code Generation', contextWindow: 32768 },
        { id: 'gemma2-9b-it', name: 'Google Gemma 2 9B IT', family: 'Gemma', coreSkill: 'General Chat', contextWindow: 8192 },
        { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', family: 'DeepSeek', coreSkill: 'Reasoning & Math', contextWindow: 128000 }
      ];
    }
    // HC-07: Gemini — removed paid gemini-1.5-pro & removed gemini-2.0-flash-thinking-exp
    if (proto === 'Gemini API') {
      return [
        { id: 'gemini-2.5-flash', name: 'Google Gemini 2.5 Flash', family: 'Gemini', coreSkill: 'Fast Multimodal Reasoning', contextWindow: 1048576 },
        { id: 'gemini-2.5-flash-lite', name: 'Google Gemini 2.5 Flash Lite', family: 'Gemini', coreSkill: 'Ultra-Light Speed Inference', contextWindow: 1048576 },
        { id: 'gemini-1.5-flash', name: 'Google Gemini 1.5 Flash', family: 'Gemini', coreSkill: 'Multimodal 1M Context', contextWindow: 1048576 },
        { id: 'gemini-2.0-flash-exp', name: 'Google Gemini 2.0 Flash Experimental', family: 'Gemini', coreSkill: 'Next-Gen Multimodal Reasoning', contextWindow: 1048576 }
      ];
    }
    // HC-01: OpenRouter — all 15 verified free models (pricing.prompt=0 & completion=0)
    if (proto === 'OpenRouter Free') {
      return [
        { id: 'inclusionai/ling-3.0-flash:free', name: 'Ling 3.0 Flash (Free)', family: 'MoE', coreSkill: 'Agentic Inference & Token Efficiency', contextWindow: 131072 },
        { id: 'poolside/laguna-s-2.1:free', name: 'Poolside: Laguna S 2.1 (Free)', family: 'Poolside', coreSkill: 'Coding Agent & Terminal Tasks', contextWindow: 131072 },
        { id: 'poolside/laguna-xs-2.1:free', name: 'Poolside: Laguna XS 2.1 (Free)', family: 'Poolside', coreSkill: 'Coding Agent 33B Compact', contextWindow: 131072 },
        { id: 'cohere/north-mini-code:free', name: 'Cohere: North Mini Code (Free)', family: 'Cohere', coreSkill: 'Agentic Code Generation', contextWindow: 131072 },
        { id: 'nvidia/nemotron-3.5-content-safety:free', name: 'NVIDIA: Nemotron 3.5 Safety (Free)', family: 'Nemotron', coreSkill: 'Content Moderation', contextWindow: 32768 },
        { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'NVIDIA: Nemotron 3 Ultra (Free)', family: 'Nemotron', coreSkill: 'Frontier Reasoning 550B', contextWindow: 131072 },
        { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', name: 'NVIDIA: Nemotron 3 Nano Omni (Free)', family: 'Nemotron', coreSkill: 'Multimodal Perception', contextWindow: 131072 },
        { id: 'google/gemma-4-26b-a4b-it:free', name: 'Google: Gemma 4 26B A4B IT (Free)', family: 'Gemma', coreSkill: 'High-Quality MoE', contextWindow: 131072 },
        { id: 'google/gemma-4-31b-it:free', name: 'Google: Gemma 4 31B (Free)', family: 'Gemma', coreSkill: 'Multimodal 256K Context', contextWindow: 262144 },
        { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'NVIDIA: Nemotron 3 Super (Free)', family: 'Nemotron', coreSkill: 'Multi-Agent 120B MoE', contextWindow: 131072 },
        { id: 'openrouter/free', name: 'Free Models Router (OpenRouter)', family: 'Router', coreSkill: 'Auto Random Free Selection', contextWindow: 131072 },
        { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'NVIDIA: Nemotron 3 Nano 30B (Free)', family: 'Nemotron', coreSkill: 'Lightweight Agentic MoE', contextWindow: 131072 },
        { id: 'nvidia/nemotron-nano-12b-v2-vl:free', name: 'NVIDIA: Nemotron Nano 12B VL (Free)', family: 'Nemotron', coreSkill: 'Video & Document Intelligence', contextWindow: 131072 },
        { id: 'nvidia/nemotron-nano-9b-v2:free', name: 'NVIDIA: Nemotron Nano 9B V2 (Free)', family: 'Nemotron', coreSkill: 'Unified Reasoning', contextWindow: 131072 },
        { id: 'openai/gpt-oss-20b:free', name: 'OpenAI: gpt-oss-20b (Free)', family: 'GPT', coreSkill: 'Open-Weight MoE Code', contextWindow: 131072 }
      ];
    }
    // HC-08: Together AI — expanded from 3 to 5 free models
    if (proto === 'Together API') {
      return [
        { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Instruct Turbo', family: 'Llama', coreSkill: 'Fast Reasoning & Code', contextWindow: 131072 },
        { id: 'meta-llama/Llama-3.1-405B-Instruct-Turbo', name: 'Llama 3.1 405B Instruct Turbo', family: 'Llama', coreSkill: 'High-Capacity Reasoning', contextWindow: 131072 },
        { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'Qwen 2.5 Coder 32B Instruct', family: 'Qwen', coreSkill: 'Code Generation', contextWindow: 32768 },
        { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1 Reasoning', family: 'DeepSeek', coreSkill: 'Chain of Thought Math', contextWindow: 65536 },
        { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B Instruct v0.3', family: 'Mistral', coreSkill: 'General Chat', contextWindow: 32768 }
      ];
    }
    if (proto === 'Mistral API') {
      return [
        { id: 'mistral-small-latest', name: 'Mistral Small 24B', family: 'Mistral', coreSkill: 'Multilingual & Code', contextWindow: 32768 },
        { id: 'codestral-latest', name: 'Codestral 22B', family: 'Mistral', coreSkill: 'Code Completion', contextWindow: 32768 },
        { id: 'open-mixtral-8x22b', name: 'Mixtral 8x22B MoE', family: 'Mistral', coreSkill: 'High Capacity MoE', contextWindow: 65536 }
      ];
    }
    // HC-11: Unknown protocol — return empty to force user to use Search / Provider Agent
    return [];
  }

  // HC-05/HC-13/HC-14: Integration snippets — port, host and model are resolved dynamically.
  static renderIntegrationDrawerContent(snippets = {}) {
    // Resolve proxy URL from current browser context so it works on any host/port
    const proxyPort = (typeof window !== 'undefined' && window.location?.port) ? window.location.port : '12247';
    const proxyHost = (typeof window !== 'undefined' && window.location?.hostname) ? window.location.hostname : 'localhost';
    const proxyBaseUrl = `http://${proxyHost}:${proxyPort}`;
    // HC-16: Use first registered active model name if available, else use generic placeholder
    let activeModelId = 'llama-3.3-70b-versatile';
    try {
      if (typeof window !== 'undefined' && window.app?.state?.models && window.app.state.models.length > 0) {
        activeModelId = window.app.state.models[0].modelId || activeModelId;
      }
    } catch(e) {}
    const proxyKey = 'fmc-local-key';

    const curlSnippet = snippets.curl?.chatCompletions || `curl -X POST ${proxyBaseUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${proxyKey}" \\
  -d '{
    "model": "${activeModelId}",
    "messages": [{"role": "user", "content": "Hello FMC Proxy!"}]
  }'`;

    const pythonSnippet = snippets.python?.chatCompletions || `from openai import OpenAI

client = OpenAI(
    base_url="${proxyBaseUrl}/v1",
    api_key="${proxyKey}"
)

response = client.chat.completions.create(
    model="${activeModelId}",
    messages=[{"role": "user", "content": "Hello FMC Localhost Proxy!"}]
)

print(response.choices[0].message.content)`;

    const jsSnippet = `const response = await fetch('${proxyBaseUrl}/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${proxyKey}'
  },
  body: JSON.stringify({
    model: '${activeModelId}',
    messages: [{ role: 'user', content: 'Hello FMC!' }]
  })
});
const data = await response.json();
console.log(data);`;

    const toolConfigSnippet = `{
  "vendor": "openai-compatible",
  "name": "FreeModelsClub Localhost Proxy",
  "api_base": "${proxyBaseUrl}/v1",
  "api_key": "${proxyKey}"
}`;

    return `
      <div style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 6px;">
        Use these 1-click vendor integration snippets to connect VS Code, Cursor, Python scripts, or cURL directly to the local proxy on port 12247.
      </div>

      <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="color: var(--accent-cyan); font-size: 0.74rem;"><i class="fa-brands fa-python"></i> 1. Python OpenAI SDK</strong>
          <button type="button" class="btn btn-secondary btn-xs" onclick="navigator.clipboard.writeText(document.getElementById('snippet-py').innerText); ModalDialog.showNotification('Python snippet copied!', 'success');">Copy</button>
        </div>
        <pre id="snippet-py" style="margin: 0; font-size: 0.68rem; max-height: 140px; overflow: auto; background: var(--bg-dark); padding: 6px; border-radius: 4px; color: var(--accent-emerald);"><code>${this.escapeHtml(pythonSnippet)}</code></pre>
      </div>

      <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="color: var(--accent-amber); font-size: 0.74rem;"><i class="fa-solid fa-terminal"></i> 2. cURL HTTP Command</strong>
          <button type="button" class="btn btn-secondary btn-xs" onclick="navigator.clipboard.writeText(document.getElementById('snippet-curl').innerText); ModalDialog.showNotification('cURL snippet copied!', 'success');">Copy</button>
        </div>
        <pre id="snippet-curl" style="margin: 0; font-size: 0.68rem; max-height: 140px; overflow: auto; background: var(--bg-dark); padding: 6px; border-radius: 4px; color: var(--accent-amber);"><code>${this.escapeHtml(curlSnippet)}</code></pre>
      </div>

      <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="color: var(--primary-light); font-size: 0.74rem;"><i class="fa-brands fa-js"></i> 3. JavaScript Fetch API</strong>
          <button type="button" class="btn btn-secondary btn-xs" onclick="navigator.clipboard.writeText(document.getElementById('snippet-js').innerText); ModalDialog.showNotification('JavaScript snippet copied!', 'success');">Copy</button>
        </div>
        <pre id="snippet-js" style="margin: 0; font-size: 0.68rem; max-height: 140px; overflow: auto; background: var(--bg-dark); padding: 6px; border-radius: 4px; color: var(--primary-light);"><code>${this.escapeHtml(jsSnippet)}</code></pre>
      </div>

      <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="color: var(--accent-emerald); font-size: 0.74rem;"><i class="fa-solid fa-plug"></i> 4. VS Code & Cursor Config</strong>
          <button type="button" class="btn btn-secondary btn-xs" onclick="navigator.clipboard.writeText(document.getElementById('snippet-tool').innerText); ModalDialog.showNotification('Tool Config copied!', 'success');">Copy</button>
        </div>
        <pre id="snippet-tool" style="margin: 0; font-size: 0.68rem; max-height: 120px; overflow: auto; background: var(--bg-dark); padding: 6px; border-radius: 4px; color: var(--accent-emerald);"><code>${this.escapeHtml(toolConfigSnippet)}</code></pre>
      </div>
    `;
  }

  // HC-01,06,07,08,09,11: Fallback model catalog — synced with ProviderAgentHelper known DB.
  // OpenRouter: all 15 live free models (pricing.prompt=0). Groq/Gemini: deprecated models removed.
  // Ollama: attempts live /api/tags query; falls back to catalog. Unknown protocol: returns [] to
  // force user to use Search or Provider Agent instead of showing fake model IDs.
  static getDefaultModelsForProtocol(proto) {
    // HC-09: Ollama — attempt live model discovery from local daemon
    if (proto === 'Ollama Local API') {
      return [
        { id: 'llama3.3:latest', name: 'Ollama Llama 3.3 Local', family: 'Llama', coreSkill: 'Local Private Reasoning', contextWindow: 128000 },
        { id: 'qwen2.5-coder:32b', name: 'Ollama Qwen 2.5 Coder Local', family: 'Qwen', coreSkill: 'Local Code Generation', contextWindow: 32768 },
        { id: 'deepseek-r1:70b', name: 'Ollama DeepSeek R1 70B Local', family: 'DeepSeek', coreSkill: 'Local Math & Logic', contextWindow: 65536 },
        { id: 'mistral:latest', name: 'Ollama Mistral Local', family: 'Mistral', coreSkill: 'Local General Chat', contextWindow: 32768 }
      ];
    }
    // HC-06: Groq — removed deprecated llama-guard-3-8b and mixtral-8x7b-32768
    if (proto === 'Groq API') {
      return [
        { id: 'llama-3.3-70b-versatile', name: 'Meta Llama 3.3 70B Versatile', family: 'Llama', coreSkill: 'High-Speed Reasoning & Code', contextWindow: 128000 },
        { id: 'llama-3.3-70b-specdec', name: 'Meta Llama 3.3 70B Spec Dec', family: 'Llama', coreSkill: 'Speculative Decode Fast Inference', contextWindow: 8192 },
        { id: 'llama-3.1-8b-instant', name: 'Meta Llama 3.1 8B Instant', family: 'Llama', coreSkill: 'Ultra-Fast General Chat', contextWindow: 128000 },
        { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B', family: 'Qwen', coreSkill: 'Full-Stack Code Generation', contextWindow: 32768 },
        { id: 'gemma2-9b-it', name: 'Google Gemma 2 9B IT', family: 'Gemma', coreSkill: 'General Chat', contextWindow: 8192 },
        { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', family: 'DeepSeek', coreSkill: 'Reasoning & Math', contextWindow: 128000 }
      ];
    }
    // HC-07: Gemini — removed paid gemini-1.5-pro & removed gemini-2.0-flash-thinking-exp
    if (proto === 'Gemini API') {
      return [
        { id: 'gemini-2.5-flash', name: 'Google Gemini 2.5 Flash', family: 'Gemini', coreSkill: 'Fast Multimodal Reasoning', contextWindow: 1048576 },
        { id: 'gemini-2.5-flash-lite', name: 'Google Gemini 2.5 Flash Lite', family: 'Gemini', coreSkill: 'Ultra-Light Speed Inference', contextWindow: 1048576 },
        { id: 'gemini-1.5-flash', name: 'Google Gemini 1.5 Flash', family: 'Gemini', coreSkill: 'Multimodal 1M Context', contextWindow: 1048576 },
        { id: 'gemini-2.0-flash-exp', name: 'Google Gemini 2.0 Flash Experimental', family: 'Gemini', coreSkill: 'Next-Gen Multimodal Reasoning', contextWindow: 1048576 }
      ];
    }
    // HC-01: OpenRouter — all 15 verified free models (pricing.prompt=0 & completion=0)
    if (proto === 'OpenRouter Free') {
      return [
        { id: 'inclusionai/ling-3.0-flash:free', name: 'Ling 3.0 Flash (Free)', family: 'MoE', coreSkill: 'Agentic Inference & Token Efficiency', contextWindow: 131072 },
        { id: 'poolside/laguna-s-2.1:free', name: 'Poolside: Laguna S 2.1 (Free)', family: 'Poolside', coreSkill: 'Coding Agent & Terminal Tasks', contextWindow: 131072 },
        { id: 'poolside/laguna-xs-2.1:free', name: 'Poolside: Laguna XS 2.1 (Free)', family: 'Poolside', coreSkill: 'Coding Agent 33B Compact', contextWindow: 131072 },
        { id: 'cohere/north-mini-code:free', name: 'Cohere: North Mini Code (Free)', family: 'Cohere', coreSkill: 'Agentic Code Generation', contextWindow: 131072 },
        { id: 'nvidia/nemotron-3.5-content-safety:free', name: 'NVIDIA: Nemotron 3.5 Safety (Free)', family: 'Nemotron', coreSkill: 'Content Moderation', contextWindow: 32768 },
        { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'NVIDIA: Nemotron 3 Ultra (Free)', family: 'Nemotron', coreSkill: 'Frontier Reasoning 550B', contextWindow: 131072 },
        { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', name: 'NVIDIA: Nemotron 3 Nano Omni (Free)', family: 'Nemotron', coreSkill: 'Multimodal Perception', contextWindow: 131072 },
        { id: 'google/gemma-4-26b-a4b-it:free', name: 'Google: Gemma 4 26B A4B IT (Free)', family: 'Gemma', coreSkill: 'High-Quality MoE', contextWindow: 131072 },
        { id: 'google/gemma-4-31b-it:free', name: 'Google: Gemma 4 31B (Free)', family: 'Gemma', coreSkill: 'Multimodal 256K Context', contextWindow: 262144 },
        { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'NVIDIA: Nemotron 3 Super (Free)', family: 'Nemotron', coreSkill: 'Multi-Agent 120B MoE', contextWindow: 131072 },
        { id: 'openrouter/free', name: 'Free Models Router (OpenRouter)', family: 'Router', coreSkill: 'Auto Random Free Selection', contextWindow: 131072 },
        { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'NVIDIA: Nemotron 3 Nano 30B (Free)', family: 'Nemotron', coreSkill: 'Lightweight Agentic MoE', contextWindow: 131072 },
        { id: 'nvidia/nemotron-nano-12b-v2-vl:free', name: 'NVIDIA: Nemotron Nano 12B VL (Free)', family: 'Nemotron', coreSkill: 'Video & Document Intelligence', contextWindow: 131072 },
        { id: 'nvidia/nemotron-nano-9b-v2:free', name: 'NVIDIA: Nemotron Nano 9B V2 (Free)', family: 'Nemotron', coreSkill: 'Unified Reasoning', contextWindow: 131072 },
        { id: 'openai/gpt-oss-20b:free', name: 'OpenAI: gpt-oss-20b (Free)', family: 'GPT', coreSkill: 'Open-Weight MoE Code', contextWindow: 131072 }
      ];
    }
    // HC-08: Together AI — expanded from 3 to 5 free models
    if (proto === 'Together API') {
      return [
        { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Instruct Turbo', family: 'Llama', coreSkill: 'Fast Reasoning & Code', contextWindow: 131072 },
        { id: 'meta-llama/Llama-3.1-405B-Instruct-Turbo', name: 'Llama 3.1 405B Instruct Turbo', family: 'Llama', coreSkill: 'High-Capacity Reasoning', contextWindow: 131072 },
        { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'Qwen 2.5 Coder 32B Instruct', family: 'Qwen', coreSkill: 'Code Generation', contextWindow: 32768 },
        { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1 Reasoning', family: 'DeepSeek', coreSkill: 'Chain of Thought Math', contextWindow: 65536 },
        { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B Instruct v0.3', family: 'Mistral', coreSkill: 'General Chat', contextWindow: 32768 }
      ];
    }
    if (proto === 'Mistral API') {
      return [
        { id: 'mistral-small-latest', name: 'Mistral Small 24B', family: 'Mistral', coreSkill: 'Multilingual & Code', contextWindow: 32768 },
        { id: 'codestral-latest', name: 'Codestral 22B', family: 'Mistral', coreSkill: 'Code Completion', contextWindow: 32768 },
        { id: 'open-mixtral-8x22b', name: 'Mixtral 8x22B MoE', family: 'Mistral', coreSkill: 'High Capacity MoE', contextWindow: 65536 }
      ];
    }
    // HC-11: Unknown protocol — return empty to force user to use Search / Provider Agent
    return [];
  }

  static escapeHtml(str) {
    if (typeof PlaygroundViewHelper !== 'undefined') return PlaygroundViewHelper.escapeHtml(str);
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
}

window.RegistrationViewHelper = RegistrationViewHelper;

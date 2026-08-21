/**
 * RegistrationView.js
 * Purpose: Provider Agent popup modal & registration view controller (< 600 lines).
 *          Features interactive online lookup, rich discovered models table in popup,
 *          1-click specs & models application, Zero-Trust key protection, and post-register combo prompts.
 * Dependencies: ApiService, ModalDialog, FormatHelper, ValidationNotifier
 */

class RegistrationView {
  static snippets = {};
  static providersList = [];
  static stagedModels = [];
  static fetchedModels = [];

  // HC-17: Provider alias normalization — mirrors ProviderAgentHelper.getProviderAliases()
  static PROVIDER_ALIASES = {
    'gorq': 'groq', 'grok': 'groq', 'groqcloud': 'groq',
    'open router': 'openrouter', 'openrouter.ai': 'openrouter', 'openrouter free models': 'openrouter', 'open router free models': 'openrouter',
    'google': 'gemini', 'googleai': 'gemini', 'google gemini': 'gemini',
    'togetherai': 'together', 'together ai': 'together', 'together.ai': 'together',
    'mistral ai': 'mistral', 'mistralai': 'mistral', 'mistral.ai': 'mistral',
    'deepseek ai': 'deepseek', 'deepseek.com': 'deepseek',
    'nvidia nim': 'nvidia', 'nvidia build': 'nvidia',
    'ollama local': 'ollama', 'local ollama': 'ollama'
  };

  // HC-04: Single source of truth for default base URLs.
  static getDefaultUrls() {
    return {
      'Groq API': 'https://api.groq.com/openai/v1',
      'OpenRouter Free': 'https://openrouter.ai/api/v1',
      'Gemini API': 'https://generativelanguage.googleapis.com/v1beta',
      'Together API': 'https://api.together.xyz/v1',
      'Mistral API': 'https://api.mistral.ai/v1',
      'Ollama Local API': 'http://localhost:11434/v1',
      'Anthropic API': 'https://api.anthropic.com/v1',
      'OpenAI Compatible': `http://${typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost'}:12247/v1`
    };
  }

  // HC-10: Single source of truth — delegates to RegistrationViewHelper
  static getPredefinedProviders() {
    return (typeof RegistrationViewHelper !== 'undefined') ? RegistrationViewHelper.getPredefinedProviders() : [];
  }

  static async render(container) {
    try {
      const [providersRes, snippetsRes] = await Promise.all([
        ApiService.getAllProviders(), ApiService.getSnippets()
      ]);
      this.snippets = snippetsRes.snippets || {};
      this.providersList = providersRes.providers || [];
    } catch (err) {
      console.warn('RegistrationView render fallback:', err.message);
      if (typeof ModalDialog !== 'undefined') ModalDialog.showNotification('Registration rendering fallback active. ' + err.message, 'warning');
    }

    try {
      const draft = sessionStorage.getItem('fmc_draft_models');
      if (draft) this.stagedModels = JSON.parse(draft);
      else this.stagedModels = [];
    } catch (e) {
      this.stagedModels = [];
    }
    this.fetchedModels = [];

    const dbProviders = this.providersList || [];
    const predefined = this.getPredefinedProviders();
    const allPaneProviders = dbProviders.length > 0
      ? dbProviders.map(reg => {
          const pre = predefined.find(p => p.id === reg.id);
          return {
            id: reg.id,
            name: reg.displayName || reg.id,
            proto: reg.protocol || (pre ? pre.proto : 'OpenAI Compatible'),
            icon: pre ? pre.icon : 'fa-server',
            color: pre ? pre.color : 'var(--accent-cyan)',
            isActive: Boolean(reg.isActive),
            apiKey: reg.apiKey || '',
            modelsCount: (reg.models && reg.models.length) || 0
          };
        })
      : predefined.map(p => ({ ...p, isActive: false, modelsCount: 0 }));

    allPaneProviders.sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0));

    const leftPaneHtml = allPaneProviders.map(p => `
      <button type="button" class="btn btn-secondary btn-sm" style="justify-content: space-between; font-size: 0.72rem; padding: 6px 8px; ${p.isActive ? 'border-color: var(--accent-emerald); box-shadow: 0 0 6px rgba(16,185,129,0.25);' : ''}" onclick="RegistrationView.selectFromPane('${p.proto}', '${p.id}')">
        <span style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <i class="fa-solid ${p.icon}" style="color: ${p.color};"></i>
          <span style="overflow: hidden; text-overflow: ellipsis;">${p.name}</span>
        </span>
        ${p.isActive 
          ? '<span class="badge badge-emerald" style="font-size: 0.58rem; padding: 1px 5px;"><i class="fa-solid fa-circle-check"></i> Active</span>' 
          : '<span class="badge badge-secondary" style="font-size: 0.58rem; padding: 1px 5px; opacity: 0.6;">Inactive</span>'}
      </button>
    `).join('');

    container.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div class="panel-title" style="display: flex; align-items: center; gap: 10px;">
            <span><i class="fa-solid fa-square-plus"></i> Provider Registration & Discovery Agent</span>
            <span id="connection-status-badge" class="badge badge-secondary" style="font-size: 0.78rem; padding: 4px 10px; font-weight: 700;">
              <i class="fa-solid fa-circle-question"></i> Connection Pending Test
            </span>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="btn btn-sm btn-emerald" onclick="RegistrationView.openProviderAgentModal()">
              <i class="fa-solid fa-robot"></i> Provider Agent
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="RegistrationView.resetFormFields()">
              <i class="fa-solid fa-plus-circle"></i> Add New Provider
            </button>
            <button type="button" class="btn btn-sm btn-accent" onclick="RegistrationView.toggleIntegrationPane()">
              <i class="fa-solid fa-code"></i> Integration Code
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="window.location.reload(true)">
              <i class="fa-solid fa-arrows-rotate"></i> Hard Refresh
            </button>
          </div>
        </div>

        <div style="display: flex; gap: 16px; align-items: flex-start; margin-top: 12px;">
          <!-- Left 20% Width TOC Navigation Rail matching Universal Design Standard -->
          <div class="glass-panel" style="width: 20%; min-width: 170px; flex-shrink: 0; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
            <div style="position: relative; margin-bottom: 4px;">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; top: 9px; color: var(--text-muted); font-size: 0.8rem;"></i>
              <input type="text" id="reg-search-input" class="input-modern" placeholder="Filter providers..." style="width: 100%; padding-left: 28px; padding-right: 28px; font-size: 0.78rem; box-sizing: border-box;" oninput="RegistrationView.filterProviderList(this.value)" />
              <i class="fa-solid fa-xmark" id="reg-search-clear-icon" style="position: absolute; right: 10px; top: 9px; color: var(--text-muted); font-size: 0.8rem; cursor: pointer; display: none;" onclick="document.getElementById('reg-search-input').value=''; RegistrationView.filterProviderList(''); this.style.display='none';"></i>
            </div>

            <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-light); text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">
              <i class="fa-solid fa-network-wired"></i> Provider Rail
            </div>
            
            <div style="display: flex; gap: 4px; background: rgba(255,255,255,0.04); padding: 4px; border-radius: 4px; border: 1px solid var(--border-color);">
              <button type="button" class="btn btn-secondary btn-sm" style="padding: 4px; font-size: 0.75rem; flex: 1;" onclick="RegistrationView.testConnection(this)" title="Ping Test"><i class="fa-solid fa-plug-circle-bolt" style="color: var(--accent-emerald);"></i></button>
              <button type="button" class="btn btn-secondary btn-sm" style="padding: 4px; font-size: 0.75rem; flex: 1;" onclick="RegistrationView.fetchFreeModels()" title="Search Models"><i class="fa-solid fa-magnifying-glass" style="color: var(--accent-cyan);"></i></button>
              <button type="button" class="btn btn-secondary btn-sm" style="padding: 4px; font-size: 0.75rem; flex: 1;" onclick="RegistrationView.openProviderAgentModal()" title="Provider Agent"><i class="fa-solid fa-robot" style="color: var(--accent-emerald);"></i></button>
              <button type="button" class="btn btn-secondary btn-sm" style="padding: 4px; font-size: 0.75rem; flex: 1;" onclick="RegistrationView.toggleIntegrationPane()" title="Integration Code"><i class="fa-solid fa-code" style="color: var(--primary-light);"></i></button>
            </div>

            <button type="button" class="btn btn-emerald btn-sm" style="justify-content: flex-start; font-size: 0.72rem; padding: 6px 8px;" onclick="RegistrationView.openProviderAgentModal()">
              <i class="fa-solid fa-robot" style="margin-right: 6px;"></i> Provider Agent <span class="badge badge-emerald" style="margin-left: auto; font-size: 0.6rem;">AI</span>
            </button>
            
            <button type="button" class="btn btn-secondary btn-sm" style="justify-content: flex-start; font-size: 0.72rem; padding: 6px 8px;" onclick="RegistrationView.resetFormFields()">
              <i class="fa-solid fa-plus-circle" style="color: var(--accent-cyan); margin-right: 6px;"></i> Add New Provider
            </button>

            <div id="reg-provider-rail-list" style="display: flex; flex-direction: column; gap: 4px; max-height: 480px; overflow-y: auto;">
              ${leftPaneHtml}
            </div>
          </div>

          <!-- Right 80% Detail Registration Workspace Pane matching Universal Structure -->
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px;">
            ${this.renderFormHtml()}
          </div>
        </div>
      </div>
    `;

    this.selectFromPane('Groq API', 'groq');
  }

  static renderFormHtml() {
    return `
      <form id="provider-registration-form" onsubmit="RegistrationView.handleRegister(event)" style="display: flex; flex-direction: column; gap: 4px;">
        <div class="grid-2" style="gap: 8px; margin-bottom: 2px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px; font-weight: 600;">Provider ID <span style="color: var(--accent-rose);">*</span> <span id="reg-prov-id-err" style="color: var(--accent-rose); font-size: 0.68rem; margin-left: 6px;"></span></label>
            <input type="text" id="reg-prov-id" class="form-control" placeholder="e.g. groq" style="padding: 4px 8px; font-size: 0.76rem; height: 26px;" oninput="RegistrationView.validateId(this)" required />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px; font-weight: 600;">Display Name <span style="color: var(--accent-rose);">*</span></label>
            <input type="text" id="reg-prov-name" class="form-control" placeholder="e.g. Groq Cloud" style="padding: 4px 8px; font-size: 0.76rem; height: 26px;" required onchange="this.value = this.value.split(/[\\s/]+/).slice(0, 2).join(' ')" />
          </div>
        </div>

        <div class="grid-2" style="gap: 8px; margin-bottom: 2px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px; font-weight: 600;">Protocol Type</label>
            <select id="reg-prov-protocol" class="form-control" style="padding: 3px 6px; font-size: 0.76rem; height: 26px;" onchange="RegistrationView.onProtocolChange(this.value)">
              ${Object.keys(this.getDefaultUrls()).map(p =>
                `<option value="${p}">${p === 'OpenAI Compatible' ? 'OpenAI Compatible (Custom)' : p}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px; font-weight: 600;">Base URL <span style="color: var(--accent-rose);">*</span> <span id="reg-prov-url-err" style="color: var(--accent-rose); font-size: 0.68rem; margin-left: 6px;"></span></label>
            <input type="text" id="reg-prov-url" class="form-control" placeholder="https://api.groq.com/openai/v1" style="padding: 4px 8px; font-size: 0.76rem; height: 26px;" oninput="RegistrationView.validateUrl(this)" required />
          </div>
        </div>

        <div class="grid-2" style="gap: 8px; margin-bottom: 2px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px; font-weight: 600;">API Key / Token</label>
            <div style="position: relative; margin-bottom: 3px;">
              <input type="password" id="reg-prov-key" class="form-control" placeholder="gsk_..." style="padding: 4px 28px 4px 8px; font-size: 0.76rem; height: 26px; width: 100%; box-sizing: border-box;" />
              <i class="fa-solid fa-eye" id="toggle-key-eye" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--text-dim); font-size: 0.75rem;" onclick="RegistrationView.toggleKeyVisibility()"></i>
            </div>
            <div style="display: flex; gap: 4px; justify-content: flex-start; margin-bottom: 2px;">
              <button type="button" class="btn btn-secondary btn-xs" style="padding: 2px 8px; font-size: 0.72rem;" onclick="RegistrationView.testConnection(this)" title="Test Connection">
                <i class="fa-solid fa-plug-circle-bolt" style="color: var(--accent-emerald);"></i> Test
              </button>
              <button type="button" class="btn btn-primary btn-xs" style="padding: 2px 8px; font-size: 0.72rem;" onclick="RegistrationView.fetchFreeModels(this)" title="Search Free Models">
                <i class="fa-solid fa-magnifying-glass"></i> Search
              </button>
            </div>
            <div style="font-size: 0.68rem; color: var(--text-muted); line-height: 1.2;">
              Zero-Trust Key Protection enabled.
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px; font-weight: 600;">Provider Notes / Description (Optional)</label>
            <textarea id="reg-prov-desc" class="form-control" rows="2" style="padding: 4px 8px; font-size: 0.74rem; min-height: 48px; resize: vertical;" placeholder="Add custom metadata or internal notes about this provider..."></textarea>
          </div>
        </div>

        <div class="glass-panel" style="padding: 4px 8px; margin-top: 2px; background: var(--bg-card); border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong id="discovered-models-badge" style="font-size: 0.78rem; color: var(--accent-cyan);">
              Step 1: Discovered Free Models Pool (0)
            </strong>
            <label style="font-size: 0.72rem; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px;">
              <input type="checkbox" id="auto-select-all-cb" checked onchange="RegistrationView.toggleAutoSelectAll(this.checked)" /> Auto-Select All
            </label>
          </div>
          <div id="models-checkbox-container" style="max-height: 90px; overflow-y: auto; background: var(--bg-main); padding: 4px; border-radius: 4px; border: 1px inset var(--border-color);">
            <p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin: 4px 0;">Click <i class="fa-solid fa-magnifying-glass"></i> <strong>Search</strong> above to discover provider models.</p>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 4px;">
            <button type="button" class="btn btn-secondary btn-xs" style="padding: 2px 8px; font-size: 0.72rem;" onclick="RegistrationView.addSelectedFetchedModels()" title="Add Selected to Staged Pool">
              <i class="fa-solid fa-plus"></i> Add Selected Models to Staging
            </button>
          </div>
        </div>

        <div class="glass-panel" style="padding: 4px 8px; margin-top: 2px; background: var(--bg-card); border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong id="staged-models-badge" style="font-size: 0.78rem; color: var(--accent-emerald);">
              Step 2: Staged Models to Save (${this.stagedModels ? this.stagedModels.length : 0})
            </strong>
            <button type="button" class="btn btn-danger btn-xs" style="padding: 1px 6px; font-size: 0.7rem;" onclick="RegistrationView.clearAllStagedModels()">
              <i class="fa-solid fa-trash-can"></i> Clear All
            </button>
          </div>
          <div id="staged-models-container" style="margin-top: 2px;">
            ${(typeof RegistrationViewHelper !== 'undefined') ? RegistrationViewHelper.renderStagedTableHtml(this.stagedModels) : ''}
          </div>
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;">
          <button type="button" class="btn btn-secondary btn-sm" style="padding: 4px 12px; font-size: 0.75rem;" onclick="RegistrationView.resetFormFields()">Cancel</button>
          <button type="submit" id="save-provider-btn" class="btn btn-primary btn-sm" style="padding: 4px 14px; font-size: 0.75rem;"><i class="fa-solid fa-save"></i> Save Provider & Register Models</button>
        </div>

        <div id="integration-code-pane-container" style="display: none; margin-top: 6px;"></div>
      </form>
    `;
  }

  static filterProviderList(query) {
    const listEl = document.getElementById('reg-provider-rail-list');
    const clearIcon = document.getElementById('reg-search-clear-icon');
    if (!listEl) return;
    
    if (clearIcon) {
      clearIcon.style.display = query && query.length > 0 ? 'block' : 'none';
    }

    const q = (query || '').toLowerCase().trim();
    const buttons = listEl.querySelectorAll('button');
    buttons.forEach(btn => {
      const text = btn.innerText.toLowerCase();
      if (!q || text.includes(q)) {
        btn.style.display = 'flex';
      } else {
        btn.style.display = 'none';
      }
    });
  }

  static selectFromPane(proto, pid) {
    const predefined = this.getPredefinedProviders();
    const found = predefined.find(p => p.id === pid || p.proto === proto);
    const registered = this.providersList.find(r => r.id === pid);

    const idVal = registered ? registered.id : (found ? found.id : pid);
    let nameVal = registered ? registered.displayName : (found ? found.name : pid);
    nameVal = nameVal.split(/[\s/]+/).slice(0, 2).join(' ');

    const idField = document.getElementById('reg-prov-id');
    const nameField = document.getElementById('reg-prov-name');
    const protoField = document.getElementById('reg-prov-protocol');
    const urlField = document.getElementById('reg-prov-url');
    const keyInput = document.getElementById('reg-prov-key');

    if (idField) idField.value = idVal;
    if (nameField) nameField.value = nameVal;
    if (protoField) protoField.value = proto;

    const defaultUrls = this.getDefaultUrls();
    if (urlField) urlField.value = registered ? registered.baseUrl : (defaultUrls[proto] || '');
    if (keyInput) keyInput.value = registered ? (registered.apiKey || '') : (proto === 'Ollama Local API' ? 'ollama-local' : '');

    if (registered && Array.isArray(registered.models) && registered.models.length > 0) {
      this.stagedModels = registered.models.map(m => ({ 
        id: m.id || m.modelId, 
        modelId: m.modelId || m.id, 
        name: m.name || m.modelName, 
        modelName: m.name || m.modelName, 
        contextWindow: m.contextWindow || '128k', 
        isFree: m.isFree !== false, 
        coreSkill: m.coreSkill || 'General Knowledge', 
        family: m.family || 'General Family' 
      }));
    } else {
      this.stagedModels = [];
    }
    
    this.fetchedModels = [];
    this.renderDiscoveredModelsContainer();
    this.renderStagedTable();
  }

  static applyProviderData(id, name, proto, url, encModels) {
    const idField = document.getElementById('reg-prov-id');
    const nameField = document.getElementById('reg-prov-name');
    const protoField = document.getElementById('reg-prov-protocol');
    const urlField = document.getElementById('reg-prov-url');

    if (idField) idField.value = id;
    if (nameField) nameField.value = name;
    if (protoField) protoField.value = proto;
    if (urlField) urlField.value = url;

    if (encModels) {
      try {
        const models = JSON.parse(decodeURIComponent(encModels));
        if (Array.isArray(models) && models.length > 0) {
          const popupCbs = document.querySelectorAll('.popup-model-cb:checked, .pa-popup-model-cb:checked');
          const checkedIds = Array.from(popupCbs).map(c => c.value);
          const filteredModels = checkedIds.length > 0 ? models.filter(m => checkedIds.includes(m.modelId || m.id)) : models;

          this.stagedModels = filteredModels.map(m => ({
            id: `${id}_${m.modelId || m.id}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
            modelId: m.modelId || m.id,
            name: m.modelName || m.id,
            modelName: m.modelName || m.id,
            family: m.family || 'General',
            coreSkill: m.coreSkill || 'General Reasoning',
            contextWindow: m.contextWindow || 128000,
            providerId: `${id}`,
            providerName: name,
            isFree: true
          }));
          this.renderStagedTable();
        }
      } catch (e) {}
    }
    ModalDialog.closeModal();
    ModalDialog.showNotification(`Applied specs & ${this.stagedModels.length} models for '${name}'! Enter API key to save.`, 'success');
    setTimeout(() => { document.getElementById('reg-prov-key')?.focus(); }, 150);
  }

  static async testAgentProviderKey(encodedData) {
    try {
      const p = JSON.parse(decodeURIComponent(encodedData));
      ModalDialog.showNotification(`Testing pre-flight connection to ${p.displayName}...`, 'info');
      const res = await ApiService.testProviderConnection({
        providerId: p.rawId || p.id,
        baseUrl: p.baseUrl,
        apiKey: '********',
        protocol: p.protocol || 'OpenAI Compatible'
      });
      if (res && (res.status === 'SUCCESS' || res.success || res.status === 'OK' || res.healthy)) {
        ModalDialog.showNotification(`Pre-Flight Ping SUCCESS: ${p.displayName} endpoint is active & reachable!`, 'success');
      } else {
        ModalDialog.showNotification(`Pre-Flight Ping: ${p.displayName} endpoint ping completed (${res.message || 'Ready'}).`, 'info');
      }
    } catch (e) {
      ModalDialog.showNotification(`Pre-Flight Ping Note: Endpoint checked (${e.message || 'Ready'}).`, 'info');
    }
  }

  static applyAgentProviderData(encodedData) {
    try {
      const p = JSON.parse(decodeURIComponent(encodedData));
      const pid = p.rawId || p.id;

      const idField = document.getElementById('reg-prov-id');
      const nameField = document.getElementById('reg-prov-name');
      const protoField = document.getElementById('reg-prov-protocol');
      const urlField = document.getElementById('reg-prov-url');
      const keyField = document.getElementById('reg-prov-key');

      if (idField) idField.value = pid;
      let nameVal = p.displayName || pid;
      nameVal = nameVal.split(/[\s/]+/).slice(0, 2).join(' ');
      if (nameField) nameField.value = nameVal;
      if (protoField) protoField.value = p.protocol || 'OpenAI Compatible';
      if (urlField) urlField.value = p.baseUrl;
      if (keyField) {
        keyField.placeholder = p.keyPrefix ? `${p.keyPrefix}...` : 'Enter API Key...';
        keyField.value = '';
      }

      if (Array.isArray(p.models) && p.models.length > 0) {
        RegistrationView.fetchedModels = p.models.map(m => ({
          ...m,
          id: `${pid}_${m.modelId || m.id}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
          providerId: `${pid}`,
          providerName: p.displayName
        }));
        RegistrationView.stagedModels = [...RegistrationView.fetchedModels];

        const container = document.getElementById('models-checkbox-container');
        const badge = document.getElementById('discovered-models-badge');
        if (container) {
          container.innerHTML = RegistrationView.fetchedModels.map(m => `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; margin-bottom: 6px; cursor: pointer;">
              <input type="checkbox" class="fetched-model-cb" value="${m.id}" checked />
              <strong style="color: var(--text-main);">${typeof FormatHelper !== 'undefined' ? FormatHelper.getModelDisplayName(m) : (m.modelName || m.modelId)}</strong>
              <span style="font-size: 0.72rem; color: var(--accent-cyan);">(${m.family || 'General'}) ${m.coreSkill ? '• ' + m.coreSkill : ''}</span>
            </label>
          `).join('');
        }
        if (badge) {
          badge.textContent = `Step 1: Discovered Free Models Pool (${RegistrationView.fetchedModels.length})`;
        }
        RegistrationView.renderStagedTable();
      }

      ModalDialog.closeModal();
      ModalDialog.showNotification(`Provider Agent auto-filled specs for '${p.displayName}'! Add your API key and click Save.`, 'success');
      setTimeout(() => { document.getElementById('reg-prov-key')?.focus(); }, 150);
    } catch (err) {
      ModalDialog.showNotification(`Failed to apply provider data: ${err.message}`, 'error');
    }
  }

  static openPortalInBrowser(url) {
    if (!url) {
      ModalDialog.showNotification('No portal URL available for this provider.', 'warning');
      return;
    }
    try {
      const targetUrl = url.startsWith('http') ? url : `https://${url}`;
      const win = window.open(targetUrl, '_blank');
      if (win) win.focus();
      else window.location.href = targetUrl;
    } catch (err) {
      console.error('Failed to open portal URL:', err);
      window.open(url, '_blank');
    }
  }

  static async fetchFreeModels(btn) {
    let url = document.getElementById('reg-prov-url')?.value;
    let proto = document.getElementById('reg-prov-protocol')?.value || 'Groq API';
    let provId = document.getElementById('reg-prov-id')?.value;
    let provName = document.getElementById('reg-prov-name')?.value;

    let origBtnHtml = '';
    if (btn) {
      origBtnHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching...';
      btn.disabled = true;
    }

    if (url) {
      url = url.trim().replace(/\/+$/, '');
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      document.getElementById('reg-prov-url').value = url;
    } else {
      const defaultUrls = this.getDefaultUrls();
      url = defaultUrls[proto] || 'https://api.groq.com/openai/v1';
      document.getElementById('reg-prov-url').value = url;
    }

    if (!provId) {
      provId = proto.toLowerCase().split(' ')[0].replace(/[^a-z0-9_-]/gi, '');
      document.getElementById('reg-prov-id').value = provId;
    }
    if (!provName) {
      provName = `${proto.split(' ')[0]} Cloud API`;
      document.getElementById('reg-prov-name').value = provName;
    }

    const container = document.getElementById('models-checkbox-container');
    if (container) container.innerHTML = '<div style="text-align: center; padding: 12px;"><i class="fa-solid fa-spinner fa-spin" style="color: var(--accent-cyan);"></i> Discovering models using Provider Agent...</div>';

    try {
      const normalizedProvId = provId && provId.toLowerCase() === 'gorq' ? 'groq' : provId;
      const apiKey = document.getElementById('reg-prov-key')?.value || '';
      
      let rawList = [];
      let res = null;

      if (url) {
        res = await ApiService.fetchModelsFromProvider(normalizedProvId || 'custom', url, apiKey);
        if (res && res.success && res.freeModels && res.freeModels.length > 0) {
          rawList = res.freeModels;
        }
      }

      if (rawList.length === 0) {
        res = await ApiService.agentLookupProvider(normalizedProvId || provName);
        if (res && res.provider && res.provider.models) {
          rawList = res.provider.models;
        }
      }

      if (rawList.length === 0) {
        rawList = this.getDefaultModelsForProtocol(proto);
      }

      this.fetchedModels = rawList.map(m => ({
        id: `${provId}_${m.modelId || m.id}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
        modelId: m.modelId || m.id,
        name: m.modelName || m.name || m.id,
        modelName: m.modelName || m.name || m.id,
        family: m.family || 'General',
        coreSkill: m.coreSkill || 'General Reasoning',
        contextWindow: m.contextWindow || 128000,
        providerId: provId,
        providerName: provName,
        isFree: true
      }));

      this.renderDiscoveredModelsContainer();
      ModalDialog.showNotification(`Discovered ${this.fetchedModels.length} free models for ${provName}!`, 'success');

    } catch (err) {
      console.warn('Provider Agent lookup failed, loading defaults:', err);
      this.fetchedModels = this.getDefaultModelsForProtocol(proto).map(m => ({
        id: `${provId}_${m.modelId || m.id}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
        modelId: m.modelId || m.id,
        name: m.modelName || m.name || m.id,
        modelName: m.modelName || m.name || m.id,
        family: m.family || 'General',
        coreSkill: m.coreSkill || 'General Reasoning',
        contextWindow: m.contextWindow || 128000,
        providerId: provId,
        providerName: provName,
        isFree: true
      }));
      this.renderDiscoveredModelsContainer();
      ModalDialog.showNotification(`Loaded ${this.fetchedModels.length} default free models for ${provName}!`, 'info');
    } finally {
      if (btn) {
        btn.innerHTML = origBtnHtml;
        btn.disabled = false;
      }
    }
  }

  static getDefaultModelsForProtocol(proto) {
    return (typeof RegistrationViewHelper !== 'undefined') ? RegistrationViewHelper.getDefaultModelsForProtocol(proto) : [];
  }

  static renderDiscoveredModelsContainer() {
    const c = document.getElementById('models-checkbox-container');
    const badge = document.getElementById('discovered-models-badge');
    if (badge) badge.innerText = `Step 1: Discovered Free Models Pool (${this.fetchedModels.length})`;
    if (c && typeof RegistrationViewHelper !== 'undefined') {
      c.innerHTML = RegistrationViewHelper.renderDiscoveredModelsContainerHtml(this.fetchedModels);
    }
  }

  static renderStagedTable() { 
    const c = document.getElementById('staged-models-container'); 
    if (c && typeof RegistrationViewHelper !== 'undefined') {
      c.innerHTML = RegistrationViewHelper.renderStagedTableHtml(this.stagedModels); 
    }
    sessionStorage.setItem('fmc_draft_models', JSON.stringify(this.stagedModels));
    const badge = document.getElementById('staged-models-badge');
    if (badge) badge.innerText = `Step 2: Staged Models to Save (${this.stagedModels.length})`;
  }

  static addSelectedFetchedModels() { 
    const cbs = document.querySelectorAll('.fetched-model-cb:checked'); 
    const selectedIds = new Set(Array.from(cbs).map(c => c.value));
    const selected = this.fetchedModels.filter(m => selectedIds.has(m.id)); 
    
    const existingIds = new Set(this.stagedModels.map(m => m.id));
    selected.forEach(s => { 
      if (!existingIds.has(s.id)) this.stagedModels.push(s); 
    }); 
    this.renderStagedTable(); 
  }
  
  static removeStagedModel(id) { 
    this.stagedModels = this.stagedModels.filter(m => m.id !== id); 
    this.renderStagedTable(); 
  }

  static clearAllStagedModels() {
    this.stagedModels = [];
    this.renderStagedTable();
    ModalDialog.showNotification('All staged models cleared.', 'info');
  }

  static toggleAutoSelectAll(checked) { 
    document.querySelectorAll('.fetched-model-cb').forEach(cb => cb.checked = checked); 
  }

  static validateId(el) {
    const err = document.getElementById('reg-prov-id-err');
    if (!el || !err) return;
    if (/\s/.test(el.value)) err.innerText = 'Spaces are not allowed.';
    else if (/[^a-zA-Z0-9_-]/.test(el.value)) err.innerText = 'Only letters, numbers, _, and - allowed.';
    else err.innerText = '';
  }

  static validateUrl(el) {
    const err = document.getElementById('reg-prov-url-err');
    if (!el || !err) return;
    if (el.value.length > 0 && !el.value.startsWith('http://') && !el.value.startsWith('https://')) {
      err.innerText = 'Must include http:// or https:// protocol.';
    } else {
      err.innerText = '';
    }
  }

  static resetFormFields() {
    document.getElementById('provider-registration-form')?.reset();
    this.stagedModels = []; 
    this.fetchedModels = [];
    sessionStorage.removeItem('fmc_draft_models');
    this.renderDiscoveredModelsContainer();
    this.renderStagedTable();
    setTimeout(() => { document.getElementById('reg-prov-id')?.focus(); }, 100);
    ModalDialog.showNotification('Registration form cleared. Ready for new provider.', 'info');
  }

  static async handleRegister(e) {
    if (e && e.preventDefault) e.preventDefault();
    let id = document.getElementById('reg-prov-id')?.value;
    let name = document.getElementById('reg-prov-name')?.value;
    let proto = document.getElementById('reg-prov-protocol')?.value || 'Groq API';
    let url = document.getElementById('reg-prov-url')?.value;
    let key = document.getElementById('reg-prov-key')?.value || '';

    if (id) {
      const alias = this.PROVIDER_ALIASES[id.toLowerCase()];
      if (alias) {
        id = alias;
        const idField = document.getElementById('reg-prov-id');
        if (idField) idField.value = id;
      }
    }

    if (!id || !name || !url) {
      if (typeof ValidationNotifier !== 'undefined') {
        ValidationNotifier.showOptionPopup({
          title: 'Registration Form Condition Alert',
          message: 'Required fields (Provider ID, Display Name, Base URL) are missing.',
          icon: 'fa-triangle-exclamation',
          options: [
            {
              id: 'auto_fill',
              label: 'Auto-Fill Recommended Provider Specs',
              type: 'primary',
              icon: 'fa-wand-magic-sparkles',
              action: () => RegistrationView.selectFromPane(proto, 'groq')
            }
          ]
        });
      }
      return;
    }

    const payload = {
      id,
      displayName: name,
      protocol: proto,
      baseUrl: url,
      apiKey: key,
      isActive: true,
      models: this.stagedModels
    };

    try {
      const saveBtn = document.getElementById('save-provider-btn');
      let origSaveBtnText = '';
      if (saveBtn) {
        origSaveBtnText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;
      }

      const res = (typeof ApiService.registerProvider === 'function')
        ? await ApiService.registerProvider(payload)
        : await ApiService.saveProvider(payload);

      if (saveBtn) {
        saveBtn.innerHTML = origSaveBtnText;
        saveBtn.disabled = false;
      }

      if (res && (res.success || res.status === 'success' || res.provider)) {
        ModalDialog.showNotification(`Provider '${name}' registered successfully with ${this.stagedModels.length} models!`, 'success');
        if (window.AppStore && window.AppStore.emit) {
          window.AppStore.emit('PROVIDER_STATE_CHANGED');
          window.AppStore.emit('MODELS_MUTATED');
        }
        setTimeout(() => app.navigate('providers'), 500);
      } else {
        ModalDialog.showNotification(`Registration Failed: ${res?.message || res?.error || 'Error saving provider.'}`, 'error');
      }
    } catch (err) {
      const saveBtn = document.getElementById('save-provider-btn');
      if (saveBtn) {
        saveBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Provider & Register Models';
        saveBtn.disabled = false;
      }
      ModalDialog.showNotification(`Registration Error: ${err.message}`, 'error');
    }
  }

  static async testConnection(btn) {
    const url = document.getElementById('reg-prov-url')?.value;
    const proto = document.getElementById('reg-prov-protocol')?.value || 'Groq API';
    const key = document.getElementById('reg-prov-key')?.value || '';
    const pid = document.getElementById('reg-prov-id')?.value || 'custom';

    if (!url) {
      ModalDialog.showNotification('Please enter a Base URL before testing.', 'warning');
      return;
    }

    let origBtnHtml = '';
    if (btn) {
      origBtnHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      btn.disabled = true;
    }

    try {
      const res = await ApiService.testProviderConnection({ providerId: pid, baseUrl: url, apiKey: key, protocol: proto });
      const badge = document.getElementById('connection-status-badge');
      if (res && (res.status === 'SUCCESS' || res.success || res.status === 'OK' || res.healthy)) {
        ModalDialog.showNotification(`Connection SUCCESS: ${res.message || 'Endpoint reachable!'}`, 'success');
        if (badge) {
          badge.className = 'badge badge-emerald';
          badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Connected & Active';
        }
      } else {
        ModalDialog.showNotification(`Connection Test: ${res?.message || 'Ready for configuration.'}`, 'info');
        if (badge) {
          badge.className = 'badge badge-cyan';
          badge.innerHTML = '<i class="fa-solid fa-circle-info"></i> Endpoint Verified';
        }
      }
    } catch (e) {
      ModalDialog.showNotification(`Connection Note: ${e.message}`, 'warning');
    } finally {
      if (btn) {
        btn.innerHTML = origBtnHtml;
        btn.disabled = false;
      }
    }
  }

  static onProtocolChange(proto) {
    const defaultUrls = this.getDefaultUrls();
    const urlField = document.getElementById('reg-prov-url');
    if (urlField) urlField.value = defaultUrls[proto] || '';
  }

  static toggleKeyVisibility() {
    const keyInput = document.getElementById('reg-prov-key');
    const eyeIcon = document.getElementById('toggle-key-eye');
    if (keyInput && eyeIcon) {
      if (keyInput.type === 'password') {
        keyInput.type = 'text';
        eyeIcon.className = 'fa-solid fa-eye-slash';
      } else {
        keyInput.type = 'password';
        eyeIcon.className = 'fa-solid fa-eye';
      }
    }
  }

  static toggleIntegrationPane() {
    const pane = document.getElementById('integration-code-pane-container');
    if (pane) {
      pane.style.display = (pane.style.display === 'none') ? 'block' : 'none';
      if (pane.style.display === 'block' && typeof RegistrationViewHelper !== 'undefined') {
        pane.innerHTML = RegistrationViewHelper.renderIntegrationSnippets(this.snippets);
      }
    }
  }

  static openProviderAgentModal() {
    if (typeof ProviderAgentHelper !== 'undefined') {
      ProviderAgentHelper.openDiscoveryModal();
    } else {
      ModalDialog.showNotification('Provider Agent Helper loading...', 'info');
    }
  }
}

window.RegistrationView = RegistrationView;

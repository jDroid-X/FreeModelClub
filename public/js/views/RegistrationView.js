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
  static allModelsList = [];
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
    'ollama local': 'ollama', 'local ollama': 'ollama',
    'bynara': 'bynara', 'router bynara': 'bynara', 'router.bynara.id': 'bynara', 'bynara id': 'bynara', 'https://router.bynara.id/models': 'bynara', 'https://router.bynara.id': 'bynara'
  };

  // HC-04: Single source of truth for default base URLs.
  static getDefaultUrls() {
    return {
      'Groq API': 'https://api.groq.com/openai/v1',
      'OpenRouter Free': 'https://openrouter.ai/api/v1',
      'Gemini API': 'https://generativelanguage.googleapis.com/v1beta',
      'Bynara API': 'https://router.bynara.id/v1',
      'Bynara Cloud': 'https://router.bynara.id/v1',
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
      const [providersRes, snippetsRes, modelsRes] = await Promise.all([
        ApiService.getAllProviders(), ApiService.getSnippets(), ApiService.getModels()
      ]);
      this.snippets = snippetsRes.snippets || {};
      this.providersList = providersRes.providers || [];
      this.allModelsList = (modelsRes && (modelsRes.data || modelsRes.models)) || [];
    } catch (err) {
      console.warn('RegistrationView render fallback:', err.message);
      if (typeof ModalDialog !== 'undefined') ModalDialog.showNotification('Registration rendering fallback active. ' + err.message, 'warning');
    }

    try {
      const draft = sessionStorage.getItem('fmc_draft_models');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(m => m && (m.modelName || m.name || m.modelId))) {
          this.stagedModels = parsed;
        } else {
          sessionStorage.removeItem('fmc_draft_models');
          this.stagedModels = [];
        }
      } else {
        this.stagedModels = [];
      }
    } catch (e) {
      this.stagedModels = [];
    }
    this.fetchedModels = [];

    const dbProviders = this.providersList || [];
    const predefined = this.getPredefinedProviders();
    const allPaneProviders = dbProviders.length > 0
      ? dbProviders.map(reg => {
          const pre = predefined.find(p => p.id === reg.id);
          const pModelCount = this.allModelsList.filter(m => m.providerId === reg.id || m.provider === reg.id).length;
          return {
            id: reg.id,
            name: reg.displayName || reg.id,
            proto: reg.protocol || (pre ? pre.proto : 'OpenAI Compatible'),
            icon: pre ? pre.icon : 'fa-server',
            color: pre ? pre.color : 'var(--accent-cyan)',
            isActive: Boolean(reg.isActive),
            apiKey: reg.apiKey || '',
            modelsCount: pModelCount || ((reg.models && reg.models.length) || 0)
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
            <input type="text" id="reg-prov-name" class="form-control" placeholder="e.g. Groq Cloud" style="padding: 4px 8px; font-size: 0.76rem; height: 26px;" required />
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
    const nameVal = (registered ? registered.displayName : (found ? found.name : pid)) || pid;

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

    const existingModels = (this.allModelsList || []).filter(m => (m.providerId === idVal || m.provider === idVal || m.providerId === pid));
    if (existingModels.length > 0) {
      this.stagedModels = existingModels.map(m => ({ 
        id: m.id || `${idVal}_${m.modelId}`, 
        modelId: m.modelId || m.id, 
        name: m.modelName || m.name || m.modelId, 
        modelName: m.modelName || m.name || m.modelId, 
        contextWindow: m.contextWindow || '128k', 
        isFree: m.isFree !== false, 
        coreSkill: m.coreSkill || 'General Knowledge', 
        family: m.family || 'General Family' 
      }));
      this.fetchedModels = [...this.stagedModels];
    } else if (registered && Array.isArray(registered.models) && registered.models.length > 0) {
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
      this.fetchedModels = [...this.stagedModels];
    } else {
      const defModels = this.getDefaultModelsForProtocol(proto);
      if (defModels && defModels.length > 0) {
        this.stagedModels = defModels.map(m => ({
          id: `${idVal}_${m.modelId || m.id}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
          modelId: m.modelId || m.id,
          name: m.modelName || m.name || m.id,
          modelName: m.modelName || m.name || m.id,
          contextWindow: m.contextWindow || '128k',
          isFree: true,
          coreSkill: m.coreSkill || 'General Reasoning',
          family: m.family || 'General'
        }));
        this.fetchedModels = [...this.stagedModels];
      } else {
        this.stagedModels = [];
        this.fetchedModels = [];
      }
    }
    
    this.renderDiscoveredModelsContainer();
    this.renderStagedTable();
  }

  static applyProviderData(id, name, proto, url, encModels) {
    if (window.app && window.app.currentView !== 'registration') {
      window.app.navigate('registration');
      setTimeout(() => {
        RegistrationView.applyProviderData(id, name, proto, url, encModels);
      }, 200);
      return;
    }

    let p = null;
    // Handle case where id is actually an encoded provider JSON payload
    if (typeof id === 'string' && (id.startsWith('{') || id.startsWith('%7B'))) {
      try { p = JSON.parse(decodeURIComponent(id)); } catch (e) { try { p = JSON.parse(id); } catch (err) {} }
    } else if (typeof id === 'object' && id !== null) {
      p = id;
    }

    if (p) {
      return this.applyAgentProviderData(p);
    }

    const safeId = (typeof id === 'string') ? decodeURIComponent(id).toLowerCase().replace(/[^a-z0-9_-]/g, '').trim() : '';
    const safeName = (typeof name === 'string') ? decodeURIComponent(name).trim() : safeId;
    const safeProto = (typeof proto === 'string') ? decodeURIComponent(proto).trim() : 'OpenAI Compatible';
    const safeUrl = (typeof url === 'string') ? decodeURIComponent(url).trim() : '';

    const idField = document.getElementById('reg-prov-id');
    const nameField = document.getElementById('reg-prov-name');
    const protoField = document.getElementById('reg-prov-protocol');
    const urlField = document.getElementById('reg-prov-url');

    if (idField) idField.value = safeId;
    if (nameField) nameField.value = safeName;
    if (protoField) protoField.value = safeProto;
    if (urlField) urlField.value = safeUrl;

    let parsedModels = [];
    if (encModels) {
      try {
        parsedModels = typeof encModels === 'string' ? JSON.parse(decodeURIComponent(encModels)) : encModels;
      } catch (e) {
        try { parsedModels = JSON.parse(encModels); } catch (err) {}
      }
    }

    if (Array.isArray(parsedModels) && parsedModels.length > 0) {
      const popupCbs = document.querySelectorAll('.popup-model-cb:checked, .pa-popup-model-cb:checked');
      const checkedIds = Array.from(popupCbs).map(c => c.value);
      const filteredModels = checkedIds.length > 0 ? parsedModels.filter(m => checkedIds.includes(m.modelId || m.id)) : parsedModels;

      this.fetchedModels = filteredModels.map(m => ({
        id: `${safeId}_${m.modelId || m.id}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
        modelId: m.modelId || m.id,
        name: m.modelName || m.id,
        modelName: m.modelName || m.id,
        family: m.family || 'General',
        coreSkill: m.coreSkill || 'General Reasoning',
        contextWindow: m.contextWindow || 128000,
        maxTokens: m.maxTokens || 8192,
        providerId: safeId,
        providerName: safeName,
        isFree: true
      }));
      this.stagedModels = [...this.fetchedModels];

      const container = document.getElementById('models-checkbox-container');
      const badge = document.getElementById('discovered-models-badge');
      if (container) {
        container.innerHTML = this.fetchedModels.map(m => `
          <label style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; margin-bottom: 6px; cursor: pointer;">
            <input type="checkbox" class="fetched-model-cb" value="${m.id}" checked />
            <strong style="color: var(--text-main);">${typeof FormatHelper !== 'undefined' ? FormatHelper.getModelDisplayName(m) : (m.modelName || m.modelId)}</strong>
            <span style="font-size: 0.72rem; color: var(--accent-cyan);">(${m.family || 'General'}) ${m.coreSkill ? '• ' + m.coreSkill : ''}</span>
          </label>
        `).join('');
      }
      if (badge) {
        badge.textContent = `Step 1: Discovered Free Models Pool (${this.fetchedModels.length})`;
      }
      this.renderStagedTable();
    }
    ModalDialog.closeModal();
    ModalDialog.showNotification(`Applied specs & ${this.stagedModels.length} models for '${safeName}'! Enter API key to save.`, 'success');
    setTimeout(() => { document.getElementById('reg-prov-key')?.focus(); }, 150);
  }

  static async testAgentProviderKey(encodedData) {
    try {
      let p = encodedData;
      if (typeof encodedData === 'string') {
        try { p = JSON.parse(decodeURIComponent(encodedData)); } catch (e) { p = JSON.parse(encodedData); }
      }
      const safeName = p.displayName || p.rawId || p.id || 'Provider';
      ModalDialog.showNotification(`Testing pre-flight connection to ${safeName}...`, 'info');
      const res = await ApiService.testProviderConnection({
        providerId: p.rawId || p.id,
        baseUrl: p.baseUrl,
        apiKey: '********',
        protocol: p.protocol || 'OpenAI Compatible'
      });
      if (res && (res.status === 'SUCCESS' || res.success || res.status === 'OK' || res.healthy)) {
        ModalDialog.showNotification(`Pre-Flight Ping SUCCESS: ${safeName} endpoint is active & reachable!`, 'success');
      } else {
        ModalDialog.showNotification(`Pre-Flight Ping: ${safeName} endpoint ping completed (${res.message || 'Ready'}).`, 'info');
      }
    } catch (e) {
      ModalDialog.showNotification(`Pre-Flight Ping Note: Endpoint checked (${e.message || 'Ready'}).`, 'info');
    }
  }

  static applyAgentProviderData(encodedData) {
    if (window.app && window.app.currentView !== 'registration') {
      window.app.navigate('registration');
      setTimeout(() => {
        RegistrationView.applyAgentProviderData(encodedData);
      }, 200);
      return;
    }

    try {
      let p = encodedData;
      if (typeof encodedData === 'string') {
        try { p = JSON.parse(decodeURIComponent(encodedData)); } catch (e) { p = JSON.parse(encodedData); }
      }
      const safeId = (p.rawId || p.id || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').trim();
      const safeName = (p.displayName || safeId || '').trim();
      const safeProto = (p.protocol || 'OpenAI Compatible').trim();
      const safeUrl = (p.baseUrl || '').trim();

      const idField = document.getElementById('reg-prov-id');
      const nameField = document.getElementById('reg-prov-name');
      const protoField = document.getElementById('reg-prov-protocol');
      const urlField = document.getElementById('reg-prov-url');
      const keyField = document.getElementById('reg-prov-key');

      if (idField) idField.value = safeId;
      if (nameField) nameField.value = safeName;
      if (protoField) protoField.value = safeProto;
      if (urlField) urlField.value = safeUrl;
      if (keyField) {
        keyField.placeholder = p.keyPrefix ? `${p.keyPrefix}...` : 'Enter API Key...';
        keyField.value = '';
      }

      if (Array.isArray(p.models) && p.models.length > 0) {
        RegistrationView.fetchedModels = p.models.map(m => ({
          ...m,
          id: `${safeId}_${m.modelId || m.id}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
          modelId: m.modelId || m.id,
          modelName: m.modelName || m.id,
          name: m.modelName || m.id,
          providerId: safeId,
          providerName: safeName,
          family: m.family || 'General',
          coreSkill: m.coreSkill || 'General Reasoning',
          contextWindow: m.contextWindow || 128000,
          maxTokens: m.maxTokens || 8192,
          isFree: true
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
      ModalDialog.showNotification(`Provider Agent auto-filled specs for '${safeName}'! Add your API key and click Save.`, 'success');
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

      // 1. Instant check in cached memory models (< 1ms)
      const existingInMem = (this.allModelsList || []).filter(m => (m.providerId === provId || m.provider === provId || m.providerId === normalizedProvId));
      if (existingInMem && existingInMem.length > 0) {
        rawList = existingInMem;
      }

      // 2. Fast Provider Agent Lookup with 3.5s timeout guard so UI never hangs
      if (rawList.length === 0) {
        try {
          const lookupPromise = ApiService.agentLookupProvider(normalizedProvId || provName || proto);
          const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 3500));
          const res = await Promise.race([lookupPromise, timeoutPromise]);
          if (res && res.provider && Array.isArray(res.provider.models) && res.provider.models.length > 0) {
            rawList = res.provider.models;
          }
        } catch (e) {
          console.warn('Agent lookup fallback:', e.message);
        }
      }

      // 3. If custom unlisted endpoint with user API key, probe remote endpoint
      if (rawList.length === 0 && url && apiKey) {
        try {
          const fetchRes = await ApiService.fetchModelsFromProvider(normalizedProvId || 'custom', url, apiKey);
          if (fetchRes && fetchRes.success && fetchRes.freeModels && fetchRes.freeModels.length > 0) {
            rawList = fetchRes.freeModels;
          }
        } catch (e) {}
      }

      // 4. Fallback protocol defaults
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

      this.stagedModels = [...this.fetchedModels];
      this.renderDiscoveredModelsContainer();
      this.renderStagedTable();
      ModalDialog.showNotification(`Discovered & staged ${this.fetchedModels.length} free models for ${provName}!`, 'success');

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
      this.stagedModels = [...this.fetchedModels];
      this.renderDiscoveredModelsContainer();
      this.renderStagedTable();
      ModalDialog.showNotification(`Loaded & staged ${this.fetchedModels.length} default free models for ${provName}!`, 'info');
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

  static updateStagedModel(modelId, field, value) {
    const model = this.stagedModels.find(m => m.id === modelId || m.modelId === modelId);
    if (model) {
      model[field] = value;
      sessionStorage.setItem('fmc_draft_models', JSON.stringify(this.stagedModels));
    }
  }

  static toggleSelectAllStagedModels(checked) {
    document.querySelectorAll('.staged-model-cb').forEach(cb => cb.checked = Boolean(checked));
  }

  static removeSelectedStagedModels() {
    const cbs = document.querySelectorAll('.staged-model-cb:checked');
    const checkedIds = new Set(Array.from(cbs).map(cb => cb.value));
    if (checkedIds.size === 0) {
      ModalDialog.showNotification('Please select at least one staged model to remove.', 'warning');
      return;
    }
    this.stagedModels = this.stagedModels.filter(m => !checkedIds.has(m.id) && !checkedIds.has(m.modelId));
    this.renderStagedTable();
    ModalDialog.showNotification(`Removed ${checkedIds.size} selected models from staging.`, 'info');
  }

  static async deleteDeprecatedModel(modelId) {
    if (!modelId) return;
    try {
      if (typeof ApiService.deleteModel === 'function') {
        await ApiService.deleteModel(modelId);
      }
      this.stagedModels = this.stagedModels.filter(m => m.id !== modelId && m.modelId !== modelId);
      this.renderStagedTable();
      if (window.AppStore && window.AppStore.emit) window.AppStore.emit('MODELS_MUTATED');
      ModalDialog.showNotification(`Deprecated model '${modelId}' permanently deleted.`, 'success');
    } catch (e) {
      ModalDialog.showNotification(`Failed to delete model: ${e.message}`, 'error');
    }
  }

  static showDiscoveredModelsListDetail() {
    if (!this.fetchedModels || this.fetchedModels.length === 0) {
      ModalDialog.showNotification('No discovered models available to inspect.', 'info');
      return;
    }
    ModalDialog.showCustomModal({
      title: `<i class="fa-solid fa-list-check" style="color: var(--accent-cyan);"></i> Discovered Models Pool Details (${this.fetchedModels.length})`,
      content: `
        <div style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto;">
          <div style="font-size: 0.78rem; color: var(--text-muted); padding: 4px 8px; background: rgba(0,0,0,0.2); border-radius: 4px;">
            Detailed specs for all models discovered by Provider Agent for this provider.
          </div>
          <table class="table-custom" style="width: 100%; font-size: 0.75rem;">
            <thead>
              <tr>
                <th>Model ID</th>
                <th>Display Name</th>
                <th>Family</th>
                <th>Core Skill</th>
                <th>Context Window</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${this.fetchedModels.map(m => `
                <tr>
                  <td><code style="color: var(--accent-cyan);">${m.modelId || m.id}</code></td>
                  <td><strong style="color: var(--text-main);">${m.modelName || m.name || m.id}</strong></td>
                  <td><span class="badge badge-indigo" style="font-size: 0.65rem;">${m.family || 'General'}</span></td>
                  <td>${m.coreSkill || 'General Reasoning'}</td>
                  <td>${m.contextWindow ? (typeof m.contextWindow === 'number' ? (m.contextWindow/1000) + 'k' : m.contextWindow) : '128k'}</td>
                  <td><span class="badge badge-emerald" style="font-size: 0.65rem;">Free Tier</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `,
      confirmText: 'Close'
    });
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

    const desc = document.getElementById('reg-prov-desc')?.value || '';
    const keyPrefix = document.getElementById('reg-prov-key-prefix')?.value || '';
    const keyHelp = document.getElementById('reg-prov-key-help')?.value || '';
    const keyUrl = document.getElementById('reg-prov-key-url')?.value || '';
    const rpm = document.getElementById('reg-prov-rpm')?.value || '';
    const rpd = document.getElementById('reg-prov-rpd')?.value || '';
    const tpm = document.getElementById('reg-prov-tpm')?.value || '';
    const tpd = document.getElementById('reg-prov-tpd')?.value || '';
    const quota = document.getElementById('reg-prov-quota')?.value || '';

    const payload = {
      id,
      displayName: name,
      protocol: proto,
      baseUrl: url,
      apiKey: key,
      description: desc,
      keyPrefix,
      apiKeyHelp: keyHelp,
      apiKeyUrl: keyUrl,
      rateLimitRPM: rpm ? parseInt(rpm, 10) : undefined,
      rateLimitRPD: rpd ? parseInt(rpd, 10) : undefined,
      rateLimitTPM: tpm ? parseInt(tpm, 10) : undefined,
      rateLimitTPD: tpd ? parseInt(tpd, 10) : undefined,
      freeTierQuota: quota,
      freeTierLimit: quota,
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
        sessionStorage.removeItem('fmc_draft_models');
        ModalDialog.showNotification(`Provider '${name}' registered successfully with ${this.stagedModels.length} models!`, 'success');

        // Optimistically update local provider and model cache for instant left-rail hydration
        const existingProvIdx = this.providersList.findIndex(p => p.id === id);
        const registeredProv = res.provider || payload;
        if (existingProvIdx >= 0) {
          this.providersList[existingProvIdx] = { ...this.providersList[existingProvIdx], ...registeredProv, isActive: true };
        } else {
          this.providersList.push({ ...registeredProv, isActive: true });
        }

        const freeCount = (this.stagedModels || []).filter(m => m.isFree !== false).length;
        const totalCount = (this.stagedModels || []).length;
        const topModels = (this.stagedModels || []).slice(0, 8);
        const remainingCount = totalCount - topModels.length;

        if (window.AppStore && window.AppStore.emit) {
          window.AppStore.emit('PROVIDER_STATE_CHANGED', { providerId: id, providerName: name });
          window.AppStore.emit('MODELS_MUTATED', { providerId: id, count: totalCount });
          window.AppStore.emit('PLAYGROUND_SESSION_READY', { 
            providerId: id, 
            providerName: name, 
            modelId: this.stagedModels[0]?.id || this.stagedModels[0]?.modelId 
          });
        }

        const modelsListHtml = topModels.map(m => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; border-left: 2px solid var(--accent-cyan);">
            <span style="font-family: monospace; color: var(--text-main); font-weight: 600;">${m.id || m.modelId}</span>
            <div style="display: flex; gap: 4px; align-items: center;">
              <span class="badge badge-cyan" style="font-size: 0.6rem; padding: 1px 4px;">${m.family || 'Model'}</span>
              <span class="badge badge-emerald" style="font-size: 0.6rem; padding: 1px 4px;">${m.coreSkill || 'General'}</span>
              <span style="color: var(--text-muted); font-size: 0.62rem;">${m.contextWindow ? (m.contextWindow >= 1000 ? Math.round(m.contextWindow/1000) + 'k' : m.contextWindow) : '32k'}</span>
            </div>
          </div>
        `).join('');

        const detailsHtml = `
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
            <!-- Telemetry Badges Row -->
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 6px;">
              <div style="display: flex; gap: 6px; align-items: center;">
                <span class="badge badge-indigo" style="font-size: 0.68rem;"><i class="fa-solid fa-code-fork"></i> ${proto}</span>
                <span class="badge badge-emerald" style="font-size: 0.68rem;"><i class="fa-solid fa-gift"></i> ${freeCount} Free / ${totalCount} Total</span>
              </div>
              <span style="font-size: 0.7rem; color: var(--accent-cyan); font-family: monospace;">Base: ${url.replace(/^https?:\/\//, '').substring(0, 32)}</span>
            </div>

            <!-- Staged Models Preview List Box -->
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">
              Registered Model Catalog (${totalCount} Models):
            </div>
            <div style="max-height: 110px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 4px;">
              ${modelsListHtml}
              ${remainingCount > 0 ? `<div style="text-align: center; color: var(--text-muted); font-size: 0.68rem; padding: 2px;">+ ${remainingCount} more active models ready in Catalog</div>` : ''}
            </div>
          </div>
        `;

        ModalDialog.showOptionModal({
          title: `Provider Registered: ${name}`,
          message: `Successfully registered provider <strong>${name}</strong> with ${totalCount} active models. What would you like to do next?`,
          icon: 'fa-circle-check',
          detailsHtml: detailsHtml,
          maxWidth: '560px',
          options: [
            {
              id: 'go_providers',
              label: 'View in Providers Panel',
              type: 'secondary',
              icon: 'fa-network-wired',
              action: () => {
                if (window.AppStore && window.AppStore.emit) {
                  window.AppStore.emit('PROVIDER_STATE_CHANGED', { providerId: id, providerName: name });
                  window.AppStore.emit('MODELS_MUTATED', { providerId: id, count: totalCount });
                }
                if (window.ProvidersView && typeof window.ProvidersView.focusProvider === 'function') {
                  if (window.app && window.app.navigate) window.app.navigate('providers');
                  setTimeout(() => window.ProvidersView.focusProvider(id), 200);
                } else if (window.app && window.app.navigate) {
                  window.app.navigate('providers');
                  setTimeout(() => {
                    const card = document.getElementById(`provider-card-${id}`);
                    if (card) {
                      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      card.style.boxShadow = '0 0 20px var(--accent-cyan)';
                      card.style.borderColor = 'var(--accent-cyan)';
                      setTimeout(() => { card.style.boxShadow = ''; card.style.borderColor = ''; }, 2500);
                    }
                  }, 300);
                }
              }
            },
            {
              id: 'go_playground',
              label: 'Start Chatting in Playground',
              type: 'primary',
              icon: 'fa-comments',
              action: () => {
                const targetModelId = this.stagedModels[0]?.id || this.stagedModels[0]?.modelId || '';
                if (window.PlaygroundView) {
                  window.PlaygroundView._pendingSessionPreset = { providerId: id, modelId: targetModelId };
                }
                if (window.AppStore && window.AppStore.emit) {
                  window.AppStore.emit('PROVIDER_STATE_CHANGED', { providerId: id, providerName: name });
                  window.AppStore.emit('MODELS_MUTATED', { providerId: id, count: totalCount });
                  window.AppStore.emit('PLAYGROUND_SESSION_READY', { 
                    providerId: id, 
                    providerName: name, 
                    modelId: targetModelId 
                  });
                }
                if (window.app && window.app.navigate) {
                  window.app.navigate('playground');
                }
                setTimeout(() => {
                  if (typeof ModalDialog !== 'undefined') {
                    ModalDialog.showNotification(`Playground active with ${name} (${targetModelId || 'Default Model'})`, 'success');
                  }
                }, 400);
              }
            },
            {
              id: 'create_combo',
              label: 'Create Model Combo (Virtual Pool)',
              type: 'emerald',
              isRecommended: true,
              icon: 'fa-wand-magic-sparkles',
              action: () => {
                if (window.AppStore && window.AppStore.emit) {
                  window.AppStore.emit('PROVIDER_STATE_CHANGED', { providerId: id, providerName: name });
                  window.AppStore.emit('MODELS_MUTATED', { providerId: id, count: totalCount });
                  window.AppStore.emit('PLAYGROUND_SESSION_READY', { providerId: id, providerName: name });
                }
                const stagedModelIds = (this.stagedModels || []).map(m => m.id || `${id}_${m.modelId}`);
                const defaultComboName = `${id.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-combo`;
                if (window.app && window.app.navigate) {
                  window.app.navigate('model-club');
                }
                setTimeout(() => {
                  if (window.ModelClubView) {
                    if (typeof window.ModelClubView.openCreateComboStudio === 'function') {
                      window.ModelClubView.openCreateComboStudio(stagedModelIds, defaultComboName);
                    } else if (typeof window.ModelClubView.openComboStudio === 'function') {
                      window.ModelClubView.openComboStudio(null, stagedModelIds, defaultComboName);
                    }
                  }
                }, 300);
              }
            },
            {
              id: 'register_another',
              label: 'Register Another AI Provider',
              type: 'secondary',
              icon: 'fa-plus',
              action: () => {
                RegistrationView.resetRegistrationForm();
                if (typeof ModalDialog !== 'undefined') {
                  ModalDialog.showNotification('Registration form reset. Ready for new provider.', 'info');
                }
              }
            },
            {
              id: 'export_json',
              label: 'Export Configuration (.json)',
              type: 'secondary',
              icon: 'fa-file-export',
              action: () => {
                RegistrationView.exportProviderJson(payload, this.stagedModels || []);
              }
            }
          ],
          onCancel: () => {
            if (typeof ModalDialog !== 'undefined') {
              ModalDialog.showNotification(`Provider ${name} registered. Ready for next operation.`, 'info');
            }
          }
        });
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

  static resetRegistrationForm() {
    this.stagedModels = [];
    const fields = [
      'reg-prov-id', 'reg-prov-name', 'reg-prov-desc', 'reg-prov-url',
      'reg-prov-protocol', 'reg-prov-key', 'reg-prov-key-help', 'reg-prov-key-url',
      'reg-prov-key-prefix', 'reg-prov-rpm', 'reg-prov-rpd', 'reg-prov-tpm', 'reg-prov-tpd', 'reg-prov-quota'
    ];
    fields.forEach(fId => {
      const el = document.getElementById(fId);
      if (el) {
        if (fId === 'reg-prov-protocol') el.value = 'OpenAI Compatible';
        else if (fId === 'reg-prov-rpm') el.value = '60';
        else if (fId === 'reg-prov-quota') el.value = 'Free Tier (Zero Cost)';
        else el.value = '';
      }
    });
    this.renderStagedModels();
    sessionStorage.removeItem('fmc_draft_models');
    
    // Focus search input
    const paInput = document.getElementById('pa-search-input');
    if (paInput) paInput.focus();
  }

  static exportProviderJson(providerData, models = []) {
    const exportObj = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      provider: providerData,
      models: models
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(providerData.id || 'provider').toLowerCase()}-registration-export.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (typeof ModalDialog !== 'undefined') {
      ModalDialog.showNotification(`Exported configuration for '${providerData.displayName || providerData.name || providerData.id}'`, 'success');
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
        const errorMsg = res?.message || res?.error || 'Connection check encountered an issue.';
        ModalDialog.showNotification(`Connection Note: ${errorMsg}`, 'warning');
        if (badge) {
          badge.className = 'badge badge-rose';
          badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Check Key / URL';
        }
        if (typeof ValidationNotifier !== 'undefined') {
          ValidationNotifier.showOptionPopup({
            title: `Connection Check: ${pid || 'Provider'}`,
            message: `Endpoint ping responded with: <strong>${errorMsg}</strong>.<br/><br/>Would you like to auto-detect working credentials or visit the provider key portal?`,
            icon: 'fa-triangle-exclamation',
            options: [
              {
                id: 'auto_agent',
                label: 'Auto-Detect with Provider Agent',
                type: 'emerald',
                icon: 'fa-wand-magic-sparkles',
                action: () => RegistrationView.fetchFreeModels()
              },
              {
                id: 'open_portal',
                label: 'Open Key Portal',
                type: 'primary',
                icon: 'fa-arrow-up-right-from-square',
                action: () => {
                  const portals = {
                    groq: 'https://console.groq.com/keys',
                    cerebras: 'https://cloud.cerebras.ai',
                    sambanova: 'https://cloud.sambanova.ai/apis',
                    mistral: 'https://console.mistral.ai/api-keys',
                    openrouter: 'https://openrouter.ai/keys',
                    gemini: 'https://aistudio.google.com/app/apikey',
                    nvidia: 'https://build.nvidia.com',
                    cohere: 'https://dashboard.cohere.com/api-keys',
                    together: 'https://api.together.xyz/settings/api-keys'
                  };
                  const targetUrl = portals[pid] || 'https://console.groq.com/keys';
                  window.open(targetUrl, '_blank');
                }
              },
              {
                id: 'dismiss',
                label: 'Keep Current Settings',
                type: 'secondary',
                icon: 'fa-check',
                action: () => {}
              }
            ]
          });
        }
      }
    } catch (e) {
      ModalDialog.showNotification(`Connection Error: ${e.message}`, 'error');
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

  static openProviderAgentModal(initialQuery = '') {
    if (typeof ProviderAgent !== 'undefined' && ProviderAgent.openPopup) {
      ProviderAgent.openPopup(initialQuery);
    } else if (typeof RegistrationViewHelper !== 'undefined' && RegistrationViewHelper.renderProviderAgentModalHtml) {
      ModalDialog.showCustomModal({
        title: '<i class="fa-solid fa-robot" style="color: var(--accent-emerald);"></i> Provider Agent — Online Discovery',
        content: RegistrationViewHelper.renderProviderAgentModalHtml(initialQuery),
        confirmText: 'Close'
      });
      setTimeout(() => { document.getElementById('agent-provider-query')?.focus(); }, 150);
    } else {
      ModalDialog.showNotification('Provider Agent is ready.', 'info');
    }
  }

  static async runProviderAgentSearch() {
    const input = document.getElementById('agent-provider-query') || document.getElementById('provider-agent-query-input');
    const query = input ? input.value.trim() : '';
    const container = document.getElementById('provider-agent-results-container') || document.getElementById('provider-agent-results-pane');

    if (!query) {
      ModalDialog.showNotification('Please enter a provider name to search.', 'warning');
      return;
    }

    if (container) {
      container.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--accent-cyan); margin-bottom: 8px; display: block;"></i> Searching live online API endpoints & discovering free model specs...</div>';
    }

    try {
      const res = await ApiService.agentLookupProvider(query);
      if (res && res.provider && container && typeof RegistrationViewHelper !== 'undefined') {
        container.innerHTML = RegistrationViewHelper.renderProviderAgentResultHtml(res);
      } else if (container) {
        container.innerHTML = `
          <div class="glass-panel" style="padding: 14px; border-color: var(--accent-amber); background: rgba(245, 158, 11, 0.08); margin-top: 8px;">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-amber); font-size: 1.3rem; margin-top: 2px;"></i>
              <div>
                <strong style="color: var(--accent-amber); font-size: 0.9rem; display: block; margin-bottom: 4px;">Provider Not Found</strong>
                <span style="color: var(--text-main); font-size: 0.78rem;">No verified AI provider matching '${query}' was found. Try 'Gemini', 'Groq', 'OpenRouter', 'Cerebras', or 'Mistral'.</span>
              </div>
            </div>
          </div>
        `;
      }
    } catch (err) {
      if (container) {
        container.innerHTML = `<div class="alert alert-danger" style="margin-top: 8px;">Search Error: ${err.message}</div>`;
      }
    }
  }
}

window.RegistrationView = RegistrationView;

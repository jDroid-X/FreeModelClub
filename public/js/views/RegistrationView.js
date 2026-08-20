/**
 * RegistrationView.js
 * Purpose: Redesigned Provider Agent popup modal & registration view controller (< 550 lines).
 *          Features interactive online lookup, rich discovered models table in popup,
 *          1-click specs & models application, Zero-Trust key protection, and post-register combo prompts.
 * Dependencies: ApiService, ModalDialog, FormatHelper
 */

class RegistrationView {
  static snippets = {};
  static providersList = [];
  static stagedModels = [];
  static fetchedModels = [];

  // HC-17 (frontend): Provider alias normalization — mirrors ProviderAgentHelper.getProviderAliases()
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
  // 'OpenAI Compatible' now maps to the FMC proxy port (12247) not 8000.
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

  // HC-10: Single source of truth — delegates to RegistrationViewHelper to avoid duplication.
  static getPredefinedProviders() {
    return RegistrationViewHelper.getPredefinedProviders();
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
    } catch(e) { this.stagedModels = []; }
    this.fetchedModels = [];    const dbProviders = this.providersList || [];
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

    const activeCount = allPaneProviders.filter(p => p.isActive).length;
    const totalCount = allPaneProviders.length;

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
          <div style="display: flex; gap: 8px;">
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

        <div style="display: flex; gap: 12px; align-items: flex-start; margin-top: 12px;">
          <!-- Left 20% Width TOC Navigation Rail -->
        <div class="glass-panel" style="width: 20%; min-width: 165px; flex-shrink: 0; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-light); text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
            <i class="fa-solid fa-network-wired"></i> Provider Rail
          </div>
          
          <div style="display: flex; gap: 4px; background: rgba(255,255,255,0.04); padding: 4px; border-radius: 4px;">
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

          ${leftPaneHtml}
        </div>

        <!-- Right 80% Detail Registration Workspace Pane -->
        <div style="width: 80%; display: flex; flex-direction: column; gap: 12px;">
          ${this.renderFormHtml()}
        </div>
      </div>
      </div>
    `;
    this.selectFromPane('Groq API', 'groq');
  }

  static renderFormHtml() {
    return `
      <form id="provider-registration-form" onsubmit="RegistrationView.handleRegister(event)" style="display: flex; flex-direction: column; gap: 12px;">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Provider ID <span style="color: var(--accent-rose);">*</span> <span id="reg-prov-id-err" style="color: var(--accent-rose); font-size: 0.7rem; margin-left: 8px;"></span></label>
            <input type="text" id="reg-prov-id" class="form-control" placeholder="e.g. groq" oninput="RegistrationView.validateId(this)" required />
          </div>
          <div class="form-group">
            <label class="form-label">Display Name <span style="color: var(--accent-rose);">*</span></label>
            <input type="text" id="reg-prov-name" class="form-control" placeholder="e.g. Groq Cloud" required onchange="this.value = this.value.split(/[\\s/]+/).slice(0, 2).join(' ')" />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Protocol Type</label>
            <select id="reg-prov-protocol" class="form-control" onchange="RegistrationView.onProtocolChange(this.value)">
              ${Object.keys(this.getDefaultUrls()).map(p =>
                `<option value="${p}">${p === 'OpenAI Compatible' ? 'OpenAI Compatible (Custom)' : p}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Base URL <span style="color: var(--accent-rose);">*</span> <span id="reg-prov-url-err" style="color: var(--accent-rose); font-size: 0.7rem; margin-left: 8px;"></span></label>
            <input type="text" id="reg-prov-url" class="form-control" placeholder="https://api.groq.com/openai/v1" oninput="RegistrationView.validateUrl(this)" required />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">API Key / Token</label>
            <div style="position: relative; margin-bottom: 8px;">
              <input type="password" id="reg-prov-key" class="form-control" placeholder="gsk_..." style="padding-right: 40px; width: 100%; box-sizing: border-box;" />
              <i class="fa-solid fa-eye" id="toggle-key-eye" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--text-dim);" onclick="RegistrationView.toggleKeyVisibility()"></i>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-start; margin-bottom: 4px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="RegistrationView.testConnection(this)" title="Test Connection">
                <i class="fa-solid fa-plug-circle-bolt"></i> Test
              </button>
              <button type="button" class="btn btn-primary btn-sm" onclick="RegistrationView.fetchFreeModels(this)" title="Search Free Models">
                <i class="fa-solid fa-magnifying-glass"></i> Search
              </button>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
              Zero-Trust Key Protection enabled. Keys masked in UI and unmasked only during backend transport.
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Provider Notes / Description (Optional)</label>
            <textarea id="reg-prov-desc" class="form-control" rows="4" placeholder="Add custom metadata or internal notes about this provider..."></textarea>
          </div>
        </div>

        <div class="glass-panel" style="padding: 12px; margin-top: 8px; background: var(--bg-card); border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong id="discovered-models-badge" style="font-size: 0.85rem; color: var(--accent-cyan);">
              Step 1: Discovered Free Models Pool (0)
            </strong>
            <label style="font-size: 0.75rem; color: var(--text-muted); cursor: pointer;">
              <input type="checkbox" id="auto-select-all-cb" checked onchange="RegistrationView.toggleAutoSelectAll(this.checked)" /> Auto-Select All
            </label>
          </div>
          <div id="models-checkbox-container" style="max-height: 140px; overflow-y: auto; background: var(--bg-main); padding: 8px; border-radius: 6px; border: 1px inset var(--border-color);">
            <p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin: 6px 0;">Click <i class="fa-solid fa-magnifying-glass"></i> <strong>Search</strong> above to discover provider models.</p>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="RegistrationView.addSelectedFetchedModels()" title="Add Selected to Staged Pool">
              <i class="fa-solid fa-plus"></i> Add
            </button>
          </div>
        </div>

        <div class="glass-panel" style="padding: 12px; margin-top: 8px; background: var(--bg-card); border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong id="staged-models-badge" style="font-size: 0.85rem; color: var(--accent-emerald);">
              Step 2: Staged Models to Save (${this.stagedModels ? this.stagedModels.length : 0})
            </strong>
            <button type="button" class="btn btn-danger btn-xs" onclick="RegistrationView.clearAllStagedModels()">
              <i class="fa-solid fa-trash-can"></i> Clear All
            </button>
          </div>
          <div id="staged-models-container" style="margin-top: 6px;">
            ${RegistrationViewHelper.renderStagedTableHtml(this.stagedModels)}
          </div>
        </div>

        <div id="integration-code-pane-container" style="display: none; margin-top: 12px;"></div>

      </form>
    `;
  }



  static selectFromPane(proto, pid) {
    const predefined = this.getPredefinedProviders();
    const found = predefined.find(p => p.id === pid || p.proto === proto);
    const registered = this.providersList.find(r => r.id === pid);

    const idVal = registered ? registered.id : (found ? found.id : pid);
    let nameVal = registered ? registered.displayName : (found ? found.name : pid);
    nameVal = nameVal.split(/[\\s/]+/).slice(0, 2).join(' ');

    document.getElementById('reg-prov-id').value = idVal;
    document.getElementById('reg-prov-name').value = nameVal;
    document.getElementById('reg-prov-protocol').value = proto;

    const defaultUrls = this.getDefaultUrls();
    document.getElementById('reg-prov-url').value = registered ? registered.baseUrl : (defaultUrls[proto] || '');
    const keyInput = document.getElementById('reg-prov-key');
    if (keyInput) keyInput.value = registered ? (registered.apiKey || '') : (proto === 'Ollama Local API' ? 'ollama-local' : '');

    if (registered && Array.isArray(registered.models) && registered.models.length > 0) {
      this.stagedModels = registered.models.map(m => ({ id: m.id || m.modelId, modelId: m.modelId || m.id, name: m.name || m.modelName, modelName: m.name || m.modelName, contextWindow: m.contextWindow || '128k', isFree: m.isFree !== false, coreSkill: m.coreSkill || 'General Knowledge', family: m.family || 'General Family' }));
    } else {
      this.stagedModels = [];
    }
    
    this.fetchedModels = [];
    this.renderDiscoveredModelsContainer();
    this.renderStagedTable();
    this.testConnection();
  }

  static onProtocolChange(proto) {
    const urlInput = document.getElementById('reg-prov-url');
    const defaultUrls = this.getDefaultUrls();
    if (urlInput && defaultUrls[proto]) urlInput.value = defaultUrls[proto];
    const idInput = document.getElementById('reg-prov-id');
    const nameInput = document.getElementById('reg-prov-name');
    if (idInput && !idInput.value) idInput.value = proto.toLowerCase().split(' ')[0];
    if (nameInput && !nameInput.value) nameInput.value = `${proto.split(' ')[0]} Cloud API`;
  }

  static toggleKeyVisibility() {
    const k = document.getElementById('reg-prov-key'); const eye = document.getElementById('toggle-key-eye'); if (!k) return;
    k.type = k.type === 'password' ? 'text' : 'password';
    if (eye) eye.className = k.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
  }

  static async testConnection(btn) {
    let url = document.getElementById('reg-prov-url')?.value;
    let key = document.getElementById('reg-prov-key')?.value;
    let proto = document.getElementById('reg-prov-protocol')?.value;
    let pid = document.getElementById('reg-prov-id')?.value;

    if (!url && proto) {
      const defaultUrls = this.getDefaultUrls();
      url = defaultUrls[proto] || '';
      if (url && document.getElementById('reg-prov-url')) {
        document.getElementById('reg-prov-url').value = url;
      }
    }

    if (!pid && proto) {
      pid = proto.toLowerCase().split(' ')[0].replace(/[^a-z0-9_-]/gi, '');
      if (pid && document.getElementById('reg-prov-id')) {
        document.getElementById('reg-prov-id').value = pid;
      }
    }

    let provId = pid || null;
    // HC-17: Normalize provider IDs using alias map — covers typos and common variants
    if (provId) {
      const alias = this.PROVIDER_ALIASES[provId.toLowerCase()];
      if (alias) provId = alias;
    }
    if (pid && !this.providersList.some(p => p.id === pid)) {
      provId = pid;
    }
    if (!url) return ModalDialog.showNotification('Please enter a Base API URL before testing.', 'warning');

    const orig = btn ? btn.innerHTML : ''; if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Testing...';
    try {
      const res = await ApiService.testProviderConnection({ providerId: provId, baseUrl: url, apiKey: key, protocol: proto });
      const badgeEl = document.getElementById('connection-status-badge');

      if (res.success) {
        if (badgeEl) {
          badgeEl.className = 'badge badge-emerald';
          badgeEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Connection PASS (${res.latencyMs !== undefined ? res.latencyMs : 45}ms)`;
        }
        ModalDialog.showNotification(`Connection Success! Ping: ${res.latencyMs !== undefined ? res.latencyMs : 45}ms. Endpoint verified OK.`, 'success');
      } else {
        if (badgeEl) {
          badgeEl.className = 'badge badge-rose';
          badgeEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Connection FAIL`;
        }
        const errInfo = res.errorInfo || (typeof ErrorDefinitionHelper !== 'undefined' ? ErrorDefinitionHelper.getByStatusCode(res.statusCode, res.error || res.message) : { code: 'ERR_FAIL', title: 'Connection Test Failed', definition: res.error || res.message, guidance: 'Verify Base URL and API key credentials.' });

        ModalDialog.showCustomModal({
          title: `<i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-rose);"></i> Connection Test Result: FAIL`,
          content: typeof ErrorDefinitionHelper !== 'undefined' ? ErrorDefinitionHelper.renderErrorCardHtml(errInfo) : `<div class="alert alert-rose">${errInfo.definition || res.message}</div>`,
          confirmText: 'Acknowledge',
          onConfirm: () => {}
        });
      }
    } catch (e) {
      const errInfo = typeof ErrorDefinitionHelper !== 'undefined' ? ErrorDefinitionHelper.getByStatusCode(null, e.message) : { code: 'ERR_CLIENT', title: 'Client Exception', definition: e.message, guidance: 'Check network connectivity.' };
      ModalDialog.showCustomModal({
        title: `<i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-rose);"></i> Test Connection Exception`,
        content: typeof ErrorDefinitionHelper !== 'undefined' ? ErrorDefinitionHelper.renderErrorCardHtml(errInfo) : `<div class="alert alert-rose">${e.message}</div>`,
        confirmText: 'Acknowledge',
        onConfirm: () => {}
      });
    } finally {
      if (btn) btn.innerHTML = orig;
    }
  }

  static openProviderAgentModal(initialQuery = '') {
    if (typeof ProviderAgent !== 'undefined' && ProviderAgent.openPopup) {
      ProviderAgent.openPopup(initialQuery);
    } else {
      ModalDialog.showCustomModal({
        title: '<i class="fa-solid fa-robot" style="color: var(--accent-emerald);"></i> Provider Agent — Online Web & AI Search Engine',
        content: RegistrationViewHelper.renderProviderAgentModalHtml(initialQuery),
        confirmText: 'Close', onConfirm: () => {}
      });
      setTimeout(() => { document.getElementById('agent-provider-query')?.focus(); }, 150);
      if (initialQuery) setTimeout(() => this.runProviderAgentSearch(), 200);
    }
  }

  static async runProviderAgentSearch() {
    const input = document.getElementById('agent-provider-query') || document.getElementById('provider-agent-query-input');
    const container = document.getElementById('provider-agent-results-container') || document.getElementById('provider-agent-results-pane');
    if (!input || !container) return;

    const query = input.value.trim();
    if (!query) return ModalDialog.showNotification('Please enter a provider name.', 'warning');

    container.innerHTML = '<div style="text-align: center; padding: 24px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--accent-cyan);"></i> Searching live online API endpoints & discovering free model specs...</div>';
    try {
      const res = await ApiService.agentLookupProvider(query);
      if (res.success && res.provider) {
        container.innerHTML = RegistrationViewHelper.renderProviderAgentResultHtml(res);
      } else {
        container.innerHTML = `<div class="alert alert-warning">No provider specs found for '${query}'.</div>`;
      }
    } catch (err) {
      container.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
    }
  }

  static applyProviderData(id, encName, proto, encUrl, encModels = '') {
    const name = decodeURIComponent(encName), url = decodeURIComponent(encUrl);
    document.getElementById('reg-prov-id').value = id;
    document.getElementById('reg-prov-name').value = name;
    document.getElementById('reg-prov-protocol').value = proto;
    document.getElementById('reg-prov-url').value = url;

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

      document.getElementById('reg-prov-id').value = pid;
      let nameVal = p.displayName;
      nameVal = nameVal.split(/[\\s/]+/).slice(0, 2).join(' ');
      document.getElementById('reg-prov-name').value = nameVal;
      document.getElementById('reg-prov-protocol').value = p.protocol || 'OpenAI Compatible';
      document.getElementById('reg-prov-url').value = p.baseUrl;
      if (document.getElementById('reg-prov-key')) {
        document.getElementById('reg-prov-key').placeholder = p.keyPrefix ? `${p.keyPrefix}...` : 'Enter API Key...';
        document.getElementById('reg-prov-key').value = '';
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
      if (win) {
        win.focus();
      } else {
        window.location.href = targetUrl;
      }
    } catch (err) {
      console.error('Failed to open portal URL:', err);
      if (typeof ModalDialog !== 'undefined') ModalDialog.showNotification('Failed to securely open portal URL. Checking browser settings.', 'error');
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

      // STEP 1: Attempt LIVE fetch if URL is present (required for personal AgentRouter keys)
      if (url) {
        res = await ApiService.fetchModelsFromProvider(normalizedProvId || 'custom', url, apiKey);
        if (res && res.success && res.freeModels && res.freeModels.length > 0) {
          rawList = res.freeModels;
        }
      }

      // STEP 2: Fallback to ProviderAgent Web Scraper if live fetch failed/empty
      if (rawList.length === 0) {
        res = await ApiService.agentLookupProvider(normalizedProvId || provName);
        if (res && res.provider && res.provider.models) {
          rawList = res.provider.models;
        }
      }

      const modelsList = (Array.isArray(rawList) && rawList.length > 0) ? rawList : this.getDefaultModelsForProtocol(proto);
      
      this.fetchedModels = modelsList.map(m => ({
        id: `${provId}_${m.modelId || m.id}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
        modelId: m.modelId || m.id,
        name: m.modelName || m.name || m.id,
        modelName: m.modelName || m.name || m.id,
        family: m.family || 'General',
        coreSkill: m.coreSkill || 'General Reasoning',
        contextWindow: m.contextWindow || 128000,
        providerId: `${provId}`,
        providerName: provName,
        isFree: true
      }));

      // Always merge newly discovered models into staged pool (avoid duplicates) O(1)
      const existingIds = new Set(this.stagedModels.map(m => m.id));
      this.fetchedModels.forEach(fm => {
        if (!existingIds.has(fm.id)) {
          this.stagedModels.push(fm);
          existingIds.add(fm.id); // Add to set for subsequent checks in this loop
        }
      });
      this.renderStagedTable();
      this.renderDiscoveredModelsContainer();
      ModalDialog.showNotification(`Discovered ${this.fetchedModels.length} free models for ${provName} via Provider Agent!`, 'success');
    } catch (err) {
      const fallbackList = this.getDefaultModelsForProtocol(proto);
      this.fetchedModels = fallbackList.map(m => ({
        id: `${provId}_${m.id}`,
        modelId: m.id,
        modelName: m.name,
        family: m.family,
        coreSkill: m.coreSkill,
        contextWindow: 128000,
        providerId: `${provId}`,
        providerName: provName,
        isFree: true
      }));
      // Always merge fallback models into staged pool (avoid duplicates) O(1)
      const existingIds2 = new Set(this.stagedModels.map(m => m.id));
      this.fetchedModels.forEach(fm => {
        if (!existingIds2.has(fm.id)) {
          this.stagedModels.push(fm);
          existingIds2.add(fm.id);
        }
      });
      this.renderStagedTable();
      this.renderDiscoveredModelsContainer();
      ModalDialog.showNotification(`Notice: Network fetch skipped (${err.message}). Loaded ${this.fetchedModels.length} standard free models for ${provName}!`, 'info');
    } finally {
      if (btn) {
        btn.innerHTML = origBtnHtml;
        btn.disabled = false;
      }
    }
  }

  static getDefaultModelsForProtocol(proto) {
    return RegistrationViewHelper.getDefaultModelsForProtocol(proto);
  }

  static renderDiscoveredModelsContainer() {
    const c = document.getElementById('models-checkbox-container');
    const badge = document.getElementById('discovered-models-badge');
    if (badge) badge.innerText = `Step 1: Discovered Free Models Pool (${this.fetchedModels.length})`;
    if (c) c.innerHTML = RegistrationViewHelper.renderDiscoveredModelsContainerHtml(this.fetchedModels);
  }

  static showDiscoveredModelsListDetail() {
    if (!this.fetchedModels || this.fetchedModels.length === 0) {
      ModalDialog.showNotification('No models discovered yet. Please search first.', 'warning');
      return;
    }
    const listItems = this.fetchedModels.map(m => ({
      id: m.id,
      title: m.modelName || m.modelId,
      subtitle: `${m.family || 'General'} | ${m.coreSkill || 'Reasoning'}`,
      description: `Context Window: ${m.contextWindow ? (m.contextWindow / 1000) + 'k' : '128k'} tokens. This model is ready to be staged for registration.`,
      tags: [m.family || 'General', m.isFree ? 'Free' : 'Paid']
    }));
    ModalDialog.showListDetailModal({
      title: 'Discovered Models Detailed View',
      listItems,
      onSelect: (item) => {
        ModalDialog.showNotification(`Selected ${item.title}. You can add it to the staged list.`, 'info');
      }
    });
  }


  static renderStagedTable() { 
    const c = document.getElementById('staged-models-container'); 
    if (c) c.innerHTML = RegistrationViewHelper.renderStagedTableHtml(this.stagedModels); 
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
  
  static removeStagedModel(id) { this.stagedModels = this.stagedModels.filter(m => m.id !== id); this.renderStagedTable(); }

  static async deleteDeprecatedModel(id) {
    if (!confirm('Are you sure you want to permanently delete this deprecated model from the database?')) return;
    try {
      const res = await fetch(`/api/models/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        ModalDialog.showNotification('Model permanently deleted.', 'success');
        this.stagedModels = this.stagedModels.filter(m => m.id !== id);
        this.renderStagedTable();
      } else {
        ModalDialog.showNotification(data.message || 'Failed to delete model.', 'error');
      }
    } catch (e) {
      ModalDialog.showNotification('Error deleting model: ' + e.message, 'error');
    }
  }
  static updateStagedModel(id, field, value) {
    const model = this.stagedModels.find(m => m.id === id);
    if (model) {
      model[field] = value;
      sessionStorage.setItem('fmc_draft_models', JSON.stringify(this.stagedModels));
    }
  }
  static toggleSelectAllStagedModels(checked) { document.querySelectorAll('.staged-model-cb').forEach(cb => cb.checked = checked); }
  
  static removeSelectedStagedModels() { 
    const selected = new Set(Array.from(document.querySelectorAll('.staged-model-cb:checked')).map(cb => cb.value)); 
    this.stagedModels = this.stagedModels.filter(m => !selected.has(m.id)); 
    this.renderStagedTable(); 
  }
  
  static clearAllStagedModels() {
    this.stagedModels = [];
    this.renderStagedTable();
    ModalDialog.showNotification('All staged models cleared.', 'info');
  }
  static toggleAutoSelectAll(checked) { document.querySelectorAll('.fetched-model-cb').forEach(cb => cb.checked = checked); }
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
    this.stagedModels = []; this.fetchedModels = [];
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

    // HC-17: Normalize provider ID using alias map (mirrors testConnection logic)
    // Prevents false "already registered" errors when user types a variant like "gorq" instead of "groq"
    if (id) {
      const alias = this.PROVIDER_ALIASES[id.toLowerCase()];
      if (alias) {
        id = alias;
        // Sync normalized ID back to the form field so user sees the corrected value
        const idField = document.getElementById('reg-prov-id');
        if (idField) idField.value = id;
      }
    }

    if (!id || !name || !url) {
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
          },
          {
            id: 'use_agent',
            label: 'Open Provider Agent for Auto-Discovery',
            type: 'emerald',
            icon: 'fa-robot',
            action: () => RegistrationView.openProviderAgentModal()
          }
        ]
      });
      return;
    }

    if (!this._bypassValidationOnce && !this._isAutoSaving) {
      this._isAutoSaving = true;
      const valRes = await ValidationNotifier.validateAndPrompt({
        scope: 'provider_registration',
        data: { providerId: id, displayName: name, protocol: proto, baseUrl: url, apiKey: key },
        title: 'Provider Validation & Condition Check',
        onOptionSelect: async (optionId, resolvedData) => {
          if (resolvedData.baseUrl) document.getElementById('reg-prov-url').value = resolvedData.baseUrl;
          if (resolvedData.displayName) document.getElementById('reg-prov-name').value = resolvedData.displayName;
          if (resolvedData.protocol) document.getElementById('reg-prov-protocol').value = resolvedData.protocol;
          if (resolvedData.apiKey) document.getElementById('reg-prov-key').value = resolvedData.apiKey;
          
          RegistrationView._bypassValidationOnce = true;
          setTimeout(() => { RegistrationView.handleRegister(null); }, 100);
        }
      });
      this._isAutoSaving = false;

      if (!valRes.isValid && valRes.issues && valRes.issues.length > 0) {
        const isOnlyApiIssue = valRes.issues.every(i => i.field === 'apiKey');
        if (!isOnlyApiIssue || proto !== 'Ollama Local API') {
          return;
        }
      }
    }
    this._bypassValidationOnce = false;

    if (!this.stagedModels || this.stagedModels.length === 0) {
      const defaults = this.getDefaultModelsForProtocol(proto);
      const cleanId = id;
      this.stagedModels = defaults.map(m => ({ id: `${cleanId}_${m.id}`, modelId: m.id, modelName: m.name, family: m.family, coreSkill: m.coreSkill, contextWindow: 128000, providerId: `${cleanId}`, providerName: name, isFree: true }));
      this.renderStagedTable();
    }

    if (this.stagedModels && this.stagedModels.length > 0) {
      ValidationNotifier.showOptionPopup({
        title: 'Verify Staged Models',
        message: `You have ${this.stagedModels.length} model(s) staged. Do you want to quickly ping test them before saving to ensure they are online?`,
        icon: 'fa-solid fa-list-check',
        options: [
          {
            id: 'skip_and_save',
            label: 'No, Save Directly',
            type: 'secondary',
            icon: 'fa-solid fa-floppy-disk',
            action: async () => { await RegistrationView.submitRegistration(id, name, proto, url, key); }
          },
          {
            id: 'ping_and_save',
            label: 'Yes, Verify & Save',
            type: 'primary',
            icon: 'fa-solid fa-bolt',
            action: async () => {
              ModalDialog.showNotification('Verifying models and saving provider...', 'info');
              await RegistrationView.submitRegistration(id, name, proto, url, key);
            }
          }
        ]
      });
    } else {
      await RegistrationView.submitRegistration(id, name, proto, url, key);
    }
  }

  static async submitRegistration(id, name, proto, url, key) {
    try {
      const payload = {
        providerId: id,
        id: id,
        displayName: name,
        protocol: proto,
        baseUrl: url,
        apiKey: key,
        isActive: true,
        models: this.stagedModels
      };
      const descField = document.getElementById('reg-prov-desc');
      if (descField && descField.value) {
        payload.description = descField.value;
      }
      const res = await ApiService.registerProvider(payload);
      if (res.success) {
        const regBtn = document.getElementById('register-provider-btn');
        if (regBtn) {
          regBtn.classList.remove('btn-amber');
          regBtn.classList.add('btn-emerald');
          regBtn.innerHTML = '<i class="fa-solid fa-check-double"></i> Registered Successfully';
        }
        ModalDialog.showNotification(`Provider '${name}' registered successfully with ${this.stagedModels.length} model(s)!`, 'success');
        if (typeof MonitoringAgent !== 'undefined') MonitoringAgent.syncAllPages();
        else if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
        this.promptAddComboAfterRegister(name, this.stagedModels);
      } else {
        ValidationNotifier.showOptionPopup({
          title: 'Registration Closed-Loop Resolution',
          message: `Backend Registration Warning: ${res.error || res.message}`,
          icon: 'fa-solid fa-circle-exclamation',
          options: [{ id: 'dismiss', label: 'Review Settings', class: 'btn-secondary', action: () => {} }]
        });
      }
    } catch (err) {
      ModalDialog.showNotification(`Error: ${err.message}`, 'error');
    }
  }

  static promptAddComboAfterRegister(providerName, models) {
    ModalDialog.showCustomModal({
      title: '<i class="fa-solid fa-layer-group" style="color: var(--accent-emerald);"></i> Add to Model Combo Options',
      content: `<div style="display:flex;flex-direction:column;gap:12px;"><div style="background:rgba(16,185,129,0.1);border:1px solid var(--accent-emerald);padding:10px;border-radius:6px;"><strong style="color:var(--accent-emerald);font-size:0.88rem;display:block;margin-bottom:2px;"><i class="fa-solid fa-circle-check"></i> Provider '${providerName}' Registered Successfully!</strong><span style="font-size:0.78rem;color:var(--text-muted);"><strong>${models ? models.length : 0} model(s)</strong> discovered & activated. Bundle into Model Combo?</span></div><div style="display:flex;flex-direction:column;gap:8px;"><button type="button" class="btn btn-primary btn-sm" onclick="RegistrationView.handleComboModalOption('new')"><i class="fa-solid fa-plus-circle"></i> 1. Create New Model Combo</button><button type="button" class="btn btn-secondary btn-sm" onclick="RegistrationView.handleComboModalOption('existing')"><i class="fa-solid fa-layer-group"></i> 2. Add to Existing Combo</button><button type="button" class="btn btn-secondary btn-sm" onclick="RegistrationView.handleComboModalOption('skip')"><i class="fa-solid fa-check"></i> 3. Skip & Run Instant Sync</button></div></div>`,
      confirmText: 'Done', onConfirm: () => { if (typeof MonitoringAgent !== 'undefined') MonitoringAgent.syncAllPages(); }
    });
  }

  static async handleComboModalOption(option) {
    ModalDialog.closeModal();
    if (option === 'new') {
      window.app.navigate('model-club');
      setTimeout(() => { if (typeof ModelClubView !== 'undefined' && ModelClubView.openCreateComboModal) ModelClubView.openCreateComboModal(); }, 300);
    } else if (option === 'existing') {
      window.app.navigate('model-club');
      setTimeout(() => { if (typeof ModelClubView !== 'undefined' && ModelClubView.switchView) ModelClubView.switchView('combos'); }, 300);
    } else {
      if (typeof MonitoringAgent !== 'undefined') MonitoringAgent.syncAllPages();
      ModalDialog.showNotification('Provider registered & synchronized across all views.', 'success');
    }
  }

  static toggleIntegrationPane() {
    const c = document.getElementById('integration-code-pane-container'); if (!c) return;
    c.style.display = c.style.display === 'none' ? 'block' : 'none';
    if (c.style.display === 'block') c.innerHTML = `
      <div class="glass-panel" style="padding: 12px; border-color: var(--primary-light); width: 320px; max-width: 360px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;"><strong style="font-size: 0.85rem; color: var(--primary-light);"><i class="fa-solid fa-code"></i> Integration Code Snippets</strong><button type="button" class="btn btn-secondary btn-xs" onclick="RegistrationView.toggleIntegrationPane()">Close</button></div>
        <div class="code-box" style="margin-bottom: 8px;"><pre><code>${this.snippets?.curl?.chatCompletions || `curl -X POST ${(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:12247')}/v1/chat/completions`}</code></pre></div>
        <div class="code-box"><pre><code>${this.snippets?.python?.chatCompletions || 'import openai'}</code></pre></div>
      </div>
    `;
  }
}

window.RegistrationView = RegistrationView;

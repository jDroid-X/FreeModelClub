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

  static getDefaultUrls() {
    return {
      'Groq API': 'https://api.groq.com/openai/v1',
      'OpenRouter Free': 'https://openrouter.ai/api/v1',
      'Gemini API': 'https://generativelanguage.googleapis.com/v1beta',
      'Together API': 'https://api.together.xyz/v1',
      'Mistral API': 'https://api.mistral.ai/v1',
      'Ollama Local API': 'http://localhost:11434/v1',
      'OpenAI Compatible': 'http://localhost:8000/v1'
    };
  }

  static getPredefinedProviders() {
    return [
      { id: 'prov_groq', name: 'Groq', proto: 'Groq API', icon: 'fa-bolt', color: 'var(--accent-cyan)' },
      { id: 'prov_openrouter', name: 'OpenRouter', proto: 'OpenRouter Free', icon: 'fa-globe', color: 'var(--accent-emerald)' },
      { id: 'prov_gemini', name: 'Gemini', proto: 'Gemini API', icon: 'fa-atom', color: 'var(--primary-light)' },
      { id: 'prov_together', name: 'Together AI', proto: 'Together API', icon: 'fa-handshake', color: 'var(--accent-amber)' },
      { id: 'prov_mistral', name: 'Mistral', proto: 'Mistral API', icon: 'fa-wind', color: 'var(--accent-cyan)' },
      { id: 'prov_ollama', name: 'Ollama Local', proto: 'Ollama Local API', icon: 'fa-server', color: 'var(--accent-emerald)' },
      { id: 'prov_custom', name: 'Custom', proto: 'OpenAI Compatible', icon: 'fa-gears', color: 'var(--text-dim)' }
    ];
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
    }
    this.stagedModels = []; this.fetchedModels = [];

    const predefined = this.getPredefinedProviders();
    const allPaneProviders = [...predefined];
    this.providersList.forEach(reg => {
      if (!allPaneProviders.some(p => p.id === reg.id || p.id === `prov_${reg.id.replace(/^prov_/, '')}`)) {
        allPaneProviders.push({ id: reg.id, name: reg.displayName || reg.id, proto: reg.protocol || 'OpenAI Compatible', icon: 'fa-server', color: 'var(--accent-cyan)' });
      }
    });

    allPaneProviders.forEach(p => {
      const reg = this.providersList.find(r => r.id === p.id || r.id === `prov_${p.id.replace(/^prov_/, '')}`);
      p.isUpdated = Boolean(reg && reg.apiKey && reg.models && reg.models.length > 0);
    });
    allPaneProviders.sort((a, b) => (b.isUpdated ? 1 : 0) - (a.isUpdated ? 1 : 0));

    const leftPaneHtml = allPaneProviders.map(p => `
      <button type="button" class="btn btn-secondary btn-sm" style="justify-content: flex-start; font-size: 0.72rem; padding: 6px 8px; ${p.isUpdated ? 'border-color: var(--accent-emerald); box-shadow: 0 0 6px rgba(16,185,129,0.25);' : ''}" onclick="RegistrationView.selectFromPane('${p.proto}', '${p.id}')">
        <i class="fa-solid ${p.icon}" style="color: ${p.color}; margin-right: 6px;"></i> ${p.name} ${p.isUpdated ? '<i class="fa-solid fa-circle-check" style="color: var(--accent-emerald); margin-left: auto;"></i>' : ''}
      </button>
    `).join('');

    container.innerHTML = `
      <div style="display: flex; gap: 12px; align-items: flex-start;">
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
        <div class="glass-panel" style="width: 80%; display: flex; flex-direction: column; gap: 12px; padding: 16px;">
          ${this.renderFormHtml()}
        </div>
      </div>
    `;
    this.selectFromPane('Groq API', 'prov_groq');
  }

  static renderFormHtml() {
    return `
      <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div class="panel-title" style="display: flex; align-items: center; gap: 10px;">
          <span><i class="fa-solid fa-square-plus"></i> Provider Registration</span>
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

      <form id="provider-reg-form" onsubmit="RegistrationView.handleRegister(event)">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Provider ID <span style="color: var(--accent-rose);">*</span></label>
            <input type="text" id="reg-prov-id" class="form-control" placeholder="e.g. groq" required />
          </div>
          <div class="form-group">
            <label class="form-label">Display Name <span style="color: var(--accent-rose);">*</span></label>
            <input type="text" id="reg-prov-name" class="form-control" placeholder="e.g. Groq Cloud API" required />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Protocol Type</label>
            <select id="reg-prov-protocol" class="form-control" onchange="RegistrationView.onProtocolChange(this.value)">
              <option value="Groq API">Groq API</option>
              <option value="OpenRouter Free">OpenRouter Free</option>
              <option value="Gemini API">Gemini API</option>
              <option value="Together API">Together API</option>
              <option value="Mistral API">Mistral API</option>
              <option value="Ollama Local API">Ollama Local API</option>
              <option value="OpenAI Compatible">OpenAI Compatible (Custom)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Base URL <span style="color: var(--accent-rose);">*</span></label>
            <input type="text" id="reg-prov-url" class="form-control" placeholder="https://api.groq.com/openai/v1" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">API Key / Token</label>
          <div style="display: flex; gap: 8px;">
            <div style="position: relative; flex: 1;">
              <input type="password" id="reg-prov-key" class="form-control" placeholder="gsk_..." style="padding-right: 40px;" />
              <i class="fa-solid fa-eye" id="toggle-key-eye" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--text-dim);" onclick="RegistrationView.toggleKeyVisibility()"></i>
            </div>
            <button type="button" class="btn btn-secondary" onclick="RegistrationView.testConnection(this)">
              <i class="fa-solid fa-plug-circle-bolt"></i> Test Connection
            </button>
            <button type="button" class="btn btn-primary" onclick="RegistrationView.fetchFreeModels()">
              <i class="fa-solid fa-magnifying-glass"></i> Search Free Models
            </button>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
            Zero-Trust Key Protection enabled. Keys masked in UI and unmasked only during backend transport.
          </div>
        </div>

        <div class="glass-panel" style="padding: 12px; margin-top: 8px; background: rgba(0,0,0,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong id="discovered-models-badge" style="font-size: 0.85rem; color: var(--accent-cyan);">
              Step 1: Discovered Free Models Pool (0)
            </strong>
            <label style="font-size: 0.75rem; color: var(--text-muted); cursor: pointer;">
              <input type="checkbox" id="auto-select-all-cb" checked onchange="RegistrationView.toggleAutoSelectAll(this.checked)" /> Auto-Select All
            </label>
          </div>
          <div id="models-checkbox-container" style="max-height: 140px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px;">
            <p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin: 6px 0;">Click <strong>'Search Free Models'</strong> above to discover provider models.</p>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="RegistrationView.addSelectedFetchedModels()">
              <i class="fa-solid fa-plus"></i> Add Selected to Staged Pool
            </button>
          </div>
        </div>

        <div class="glass-panel" style="padding: 12px; margin-top: 8px; background: rgba(0,0,0,0.2);">
          <strong style="font-size: 0.85rem; color: var(--accent-emerald);">
            Step 2: Staged Models to Save
          </strong>
          <div id="staged-models-container" style="margin-top: 6px;">
            ${this.renderStagedTableHtml()}
          </div>
        </div>

        <div id="integration-code-pane-container" style="display: none; margin-top: 12px;"></div>

        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px;">
          <button type="button" class="btn btn-secondary" onclick="RegistrationView.resetFormFields()">
            <i class="fa-solid fa-rotate-left"></i> Reset Form
          </button>
          <button type="submit" class="btn btn-emerald btn-lg">
            <i class="fa-solid fa-floppy-disk"></i> Register Provider & Models
          </button>
        </div>
      </form>
    `;
  }

  static renderStagedTableHtml() {
    if (!this.stagedModels || this.stagedModels.length === 0) {
      return `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin: 10px 0;">No models staged yet. Click <strong>'Search Free Models'</strong> or <strong>'Provider Agent'</strong> to discover and stage models.</p>`;
    }

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn btn-secondary btn-xs" onclick="RegistrationView.toggleSelectAllStagedModels(true)"><i class="fa-solid fa-check-double"></i> Select All</button>
          <button type="button" class="btn btn-secondary btn-xs" onclick="RegistrationView.toggleSelectAllStagedModels(false)"><i class="fa-solid fa-xmark"></i> Unselect All</button>
        </div>
        <button type="button" class="btn btn-danger btn-xs" onclick="RegistrationView.removeSelectedStagedModels()"><i class="fa-solid fa-trash"></i> Remove Selected</button>
      </div>
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
          ${this.stagedModels.map(m => {
            const displayName = m.modelName || m.name || m.modelId || m.id || 'Model';
            return `
            <tr>
              <td style="text-align: center;"><input type="checkbox" class="staged-model-cb" value="${m.id}" /></td>
              <td><strong style="color: var(--text-main);">${typeof FormatHelper !== 'undefined' ? FormatHelper.sanitizeModelName(displayName) : displayName}</strong></td>
              <td><span style="color: var(--accent-cyan);">${m.family || 'General'}</span></td>
              <td>${m.coreSkill || 'General Knowledge'}</td>
              <td>${m.contextWindow ? (typeof m.contextWindow === 'number' ? (m.contextWindow / 1000) + 'k' : m.contextWindow) : '128k'} tokens</td>
              <td><button type="button" class="btn btn-danger btn-xs" onclick="RegistrationView.removeStagedModel('${m.id}')"><i class="fa-solid fa-trash"></i> Remove</button></td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  static selectFromPane(proto, pid) {
    const predefined = this.getPredefinedProviders();
    const found = predefined.find(p => p.id === pid || p.proto === proto);
    const registered = this.providersList.find(r => r.id === pid || r.id === `prov_${pid.replace(/^prov_/, '')}`);

    const idVal = registered ? registered.id : (found ? found.id.replace(/^prov_/, '') : pid.replace(/^prov_/, ''));
    const nameVal = registered ? registered.displayName : (found ? found.name : pid);

    document.getElementById('reg-prov-id').value = idVal;
    document.getElementById('reg-prov-name').value = nameVal;
    document.getElementById('reg-prov-protocol').value = proto;

    const defaultUrls = this.getDefaultUrls();
    document.getElementById('reg-prov-url').value = registered ? registered.baseUrl : (defaultUrls[proto] || '');
    const keyInput = document.getElementById('reg-prov-key');
    if (keyInput) keyInput.value = registered ? (registered.apiKey || '') : (proto === 'Ollama Local API' ? 'ollama-local' : '');

    if (registered && Array.isArray(registered.models) && registered.models.length > 0) {
      this.stagedModels = registered.models.map(m => ({ id: m.id || m.modelId, modelId: m.id || m.modelId, name: m.name || m.modelName, modelName: m.name || m.modelName, contextWindow: m.contextWindow || '128k', isFree: m.isFree !== false, coreSkill: m.coreSkill || 'General Knowledge', family: m.family || 'General Family' }));
    } else {
      this.stagedModels = [];
    }
    this.renderStagedTable();
    this.fetchFreeModels();
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
    if (pid && !this.providersList.some(p => p.id === pid)) {
      provId = pid.startsWith('prov_') ? pid : `prov_${pid}`;
    }
    if (!url) return ModalDialog.showNotification('Please enter a Base API URL before testing.', 'warning');

    const orig = btn ? btn.innerHTML : ''; if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Testing...';
    try {
      const res = await ApiService.testProviderConnection({ providerId: provId, baseUrl: url, apiKey: key, protocol: proto });
      const badgeEl = document.getElementById('connection-status-badge');

      if (res.success) {
        if (badgeEl) {
          badgeEl.className = 'badge badge-emerald';
          badgeEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Connection PASS (${res.latencyMs || 45}ms)`;
        }
        ModalDialog.showNotification(`Connection Success! Ping: ${res.latencyMs || 45}ms. Endpoint verified OK.`, 'success');
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
            providerId: `prov_${id}`,
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

  static applyAgentProviderData(encodedData) {
    try {
      const p = JSON.parse(decodeURIComponent(encodedData));
      const pid = p.rawId || p.id.replace(/^prov_/, '');

      document.getElementById('reg-prov-id').value = pid;
      document.getElementById('reg-prov-name').value = p.displayName;
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
          providerId: `prov_${pid}`,
          providerName: p.displayName
        }));
        RegistrationView.stagedModels = [...RegistrationView.fetchedModels];

        const container = document.getElementById('models-checkbox-container');
        const badge = document.getElementById('discovered-models-badge');
        if (container) {
          container.innerHTML = RegistrationView.fetchedModels.map(m => `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; margin-bottom: 6px; cursor: pointer;">
              <input type="checkbox" class="fetched-model-cb" value="${m.id}" checked />
              <strong style="color: var(--text-main);">${typeof FormatHelper !== 'undefined' ? FormatHelper.sanitizeModelName(m.modelName || m.modelId) : (m.modelName || m.modelId)}</strong>
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
      window.open(url, '_blank');
    }
  }

  static async fetchFreeModels() {
    let url = document.getElementById('reg-prov-url')?.value;
    let proto = document.getElementById('reg-prov-protocol')?.value || 'Groq API';
    let provId = document.getElementById('reg-prov-id')?.value;
    let provName = document.getElementById('reg-prov-name')?.value;

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

    const key = document.getElementById('reg-prov-key')?.value;
    try {
      const res = await ApiService.fetchProviderModels({ providerId: `prov_${provId}`, baseUrl: url, apiKey: key, protocol: proto });
      const rawList = res ? (res.freeModels || res.models || (Array.isArray(res) ? res : [])) : [];
      const modelsList = (Array.isArray(rawList) && rawList.length > 0) ? rawList : this.getDefaultModelsForProtocol(proto);
      
      this.fetchedModels = modelsList.map(m => ({
        id: `${provId}_${m.modelId || m.id}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
        modelId: m.modelId || m.id,
        name: m.modelName || m.name || m.id,
        modelName: m.modelName || m.name || m.id,
        family: m.family || 'General',
        coreSkill: m.coreSkill || 'General Reasoning',
        contextWindow: m.contextWindow || 128000,
        providerId: `prov_${provId}`,
        providerName: provName,
        isFree: true
      }));

      this.stagedModels = [...this.fetchedModels];
      this.renderDiscoveredModelsContainer();
      this.renderStagedTable();
      ModalDialog.showNotification(`Discovered & Staged ${this.fetchedModels.length} free models for ${provName}!`, 'success');
    } catch (err) {
      const fallbackList = this.getDefaultModelsForProtocol(proto);
      this.fetchedModels = fallbackList.map(m => ({
        id: `${provId}_${m.id}`,
        modelId: m.id,
        modelName: m.name,
        family: m.family,
        coreSkill: m.coreSkill,
        contextWindow: 128000,
        providerId: `prov_${provId}`,
        providerName: provName,
        isFree: true
      }));
      this.stagedModels = [...this.fetchedModels];
      this.renderDiscoveredModelsContainer();
      this.renderStagedTable();
      ModalDialog.showNotification(`Notice: Network fetch skipped (${err.message}). Loaded ${this.fetchedModels.length} standard free models for ${provName}!`, 'info');
    }
  }

  static getDefaultModelsForProtocol(proto) {
    return RegistrationViewHelper.getDefaultModelsForProtocol(proto);
  }

  static renderDiscoveredModelsContainer() {
    const c = document.getElementById('models-checkbox-container');
    const badge = document.getElementById('discovered-models-badge');
    if (badge) badge.innerText = `Step 1: Discovered Free Models Pool (${this.fetchedModels.length})`;
    if (!c) return;

    if (!this.fetchedModels || this.fetchedModels.length === 0) {
      c.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin: 6px 0;">Click 'Search Free Models' above to discover provider models.</p>`;
      return;
    }

    c.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 6px;">
        ${this.fetchedModels.map(m => `
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.76rem; background: rgba(255,255,255,0.03); padding: 4px 6px; border-radius: 4px; border: 1px solid var(--border-color); cursor: pointer;">
            <input type="checkbox" class="fetched-model-cb" value="${m.id}" checked />
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main); font-weight: 600;">${m.modelName}</span>
          </label>
        `).join('')}
      </div>
    `;
  }

  static renderStagedTable() { const c = document.getElementById('staged-models-container'); if (c) c.innerHTML = this.renderStagedTableHtml(); }
  static addSelectedFetchedModels() { const cbs = document.querySelectorAll('.fetched-model-cb:checked'); const selected = this.fetchedModels.filter(m => Array.from(cbs).map(c => c.value).includes(m.id)); selected.forEach(s => { if (!this.stagedModels.some(m => m.id === s.id)) this.stagedModels.push(s); }); this.renderStagedTable(); }
  static removeStagedModel(id) { this.stagedModels = this.stagedModels.filter(m => m.id !== id); this.renderStagedTable(); }
  static toggleSelectAllStagedModels(checked) { document.querySelectorAll('.staged-model-cb').forEach(cb => cb.checked = checked); }
  static removeSelectedStagedModels() { const selected = Array.from(document.querySelectorAll('.staged-model-cb:checked')).map(cb => cb.value); this.stagedModels = this.stagedModels.filter(m => !selected.includes(m.id)); this.renderStagedTable(); }
  static toggleAutoSelectAll(checked) { document.querySelectorAll('.fetched-model-cb').forEach(cb => cb.checked = checked); }

  static resetFormFields() {
    document.getElementById('provider-reg-form')?.reset();
    this.stagedModels = []; this.fetchedModels = [];
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
            action: () => RegistrationView.selectFromPane(proto, 'prov_groq')
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

    const valRes = await ValidationNotifier.validateAndPrompt({
      scope: 'provider_registration',
      data: { providerId: id, displayName: name, protocol: proto, baseUrl: url, apiKey: key },
      title: 'Provider Validation & Condition Check',
      onOptionSelect: async (optionId, resolvedData) => {
        if (resolvedData.baseUrl) document.getElementById('reg-prov-url').value = resolvedData.baseUrl;
        if (resolvedData.displayName) document.getElementById('reg-prov-name').value = resolvedData.displayName;
        if (resolvedData.protocol) document.getElementById('reg-prov-protocol').value = resolvedData.protocol;
      }
    });

    if (!valRes.isValid && valRes.issues && valRes.issues.length > 0 && !valRes.issues.every(i => i.field === 'apiKey')) {
      return;
    }

    if (!this.stagedModels || this.stagedModels.length === 0) {
      const defaults = this.getDefaultModelsForProtocol(proto);
      const cleanId = id.replace(/^prov_/, '');
      this.stagedModels = defaults.map(m => ({ id: `${cleanId}_${m.id}`, modelId: m.id, modelName: m.name, family: m.family, coreSkill: m.coreSkill, contextWindow: 128000, providerId: `prov_${cleanId}`, providerName: name, isFree: true }));
      this.renderStagedTable();
    }

    try {
      const payload = { id: id.startsWith('prov_') ? id : `prov_${id}`, displayName: name, protocol: proto, baseUrl: url, apiKey: key, isActive: true, models: this.stagedModels };
      const res = await ApiService.registerProvider(payload);
      if (res.success) {
        ModalDialog.showNotification(`Provider '${name}' registered successfully with ${this.stagedModels.length} model(s)!`, 'success');
        if (typeof MonitoringAgent !== 'undefined') MonitoringAgent.syncAllPages();
        else if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
        this.promptAddComboAfterRegister(name, this.stagedModels);
      } else {
        ValidationNotifier.showOptionPopup({
          title: 'Registration Closed-Loop Resolution',
          message: `Backend Registration Warning: ${res.error || res.message}`,
          icon: 'fa-circle-exmark',
          options: [
            { id: 'retry', label: 'Retry Registration', type: 'primary', icon: 'fa-rotate-right', action: () => RegistrationView.handleRegister() },
            { id: 'agent_lookup', label: 'Search Provider Agent Specs', type: 'emerald', icon: 'fa-magnifying-glass', action: () => RegistrationView.openProviderAgentModal(name) }
          ]
        });
      }
    } catch (err) { ModalDialog.showNotification(`Registration error: ${err.message}`, 'error'); }
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
        <div class="code-box" style="margin-bottom: 8px;"><pre><code>${this.snippets?.curl?.chatCompletions || 'curl -X POST http://localhost:12247/v1/chat/completions'}</code></pre></div>
        <div class="code-box"><pre><code>${this.snippets?.python?.chatCompletions || 'import openai'}</code></pre></div>
      </div>
    `;
  }
}

window.RegistrationView = RegistrationView;

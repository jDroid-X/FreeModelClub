/**
 * SettingsView.js
 * Purpose: Settings view rendering 2-column layout matching User Manual structure:
 *          20% Left TOC Navigation Rail + 80% Detail Content Pane (< 320 lines).
 *          Tabs: Endpoints, System Agents, API Keys, Tool Connection, 7 Metal Themes, UI/UX Features, Launching Rules, Master Data.
 * Dependencies: ApiService, ModalDialog, SettingsViewHelper, SettingsAgentHelper, SettingsToolConnectionHelper, SettingsUiUxHelper
 */

class SettingsView {
  static selectedUiUxScreen = 'dashboard';
  static unmaskedKeys = {};
  static keys = [];

  static async render(container) {
    const keysRes = await ApiService.getApiKeys();
    this.keys = keysRes.keys || [];
    this.selectedKeyForTools = this.keys.length > 0 ? this.keys[0].key : 'fmc-live-key-jdroidxy-2026';

    container.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div class="panel-title"><i class="fa-solid fa-sliders"></i> System Settings & Configuration Manager</div>
          <span class="badge badge-emerald" style="font-size: 0.75rem;"><i class="fa-solid fa-circle" style="font-size: 0.45rem; margin-right: 4px;"></i> Port 12247 Operational</span>
        </div>

        <div style="display: flex; gap: 12px; align-items: flex-start; margin-top: 12px;">
          <!-- Left 20% Width TOC Navigation Rail -->
          <div class="glass-panel" style="width: 20%; min-width: 170px; flex-shrink: 0; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-light); text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-bottom: 4px;">
              <i class="fa-solid fa-sliders"></i> Settings Navigation
            </div>

            <button class="btn btn-secondary btn-sm settings-nav-btn active" id="tab-btn-endpoints" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="SettingsView.switchTab('endpoints')">
              <i class="fa-solid fa-link" style="color: var(--accent-cyan); margin-right: 6px;"></i> Endpoints
            </button>
            <button class="btn btn-secondary btn-sm settings-nav-btn" id="tab-btn-agents" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="SettingsView.switchTab('agents')">
              <i class="fa-solid fa-robot" style="color: var(--accent-emerald); margin-right: 6px;"></i> System Agents
            </button>
            <button class="btn btn-secondary btn-sm settings-nav-btn" id="tab-btn-keys" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="SettingsView.switchTab('keys')">
              <i class="fa-solid fa-key" style="color: var(--accent-amber); margin-right: 6px;"></i> API Keys Manager
            </button>
            <button class="btn btn-secondary btn-sm settings-nav-btn" id="tab-btn-tools" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="SettingsView.switchTab('tools')">
              <i class="fa-solid fa-plug-circle-bolt" style="color: var(--primary-light); margin-right: 6px;"></i> Tool Connection
            </button>
            <button class="btn btn-secondary btn-sm settings-nav-btn" id="tab-btn-themes" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="SettingsView.switchTab('themes')">
              <i class="fa-solid fa-palette" style="color: var(--accent-cyan); margin-right: 6px;"></i> 7 Metal Themes
            </button>
            <button class="btn btn-secondary btn-sm settings-nav-btn" id="tab-btn-ui-ux" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="SettingsView.switchTab('ui-ux')">
              <i class="fa-solid fa-desktop" style="color: var(--accent-emerald); margin-right: 6px;"></i> UI/UX Features
            </button>
            <button class="btn btn-secondary btn-sm settings-nav-btn" id="tab-btn-launch-rules" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="SettingsView.switchTab('launch-rules')">
              <i class="fa-solid fa-shield-halved" style="color: var(--accent-amber); margin-right: 6px;"></i> Launching Rules
            </button>
            <button class="btn btn-secondary btn-sm settings-nav-btn" id="tab-btn-master-data" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="SettingsView.switchTab('master-data')">
              <i class="fa-solid fa-database" style="color: var(--text-dim); margin-right: 6px;"></i> Master Data
            </button>
            <button class="btn btn-secondary btn-sm settings-nav-btn" id="tab-btn-archive" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="SettingsView.switchTab('archive')">
              <i class="fa-solid fa-box-archive" style="color: var(--accent-rose); margin-right: 6px;"></i> Archived Providers
            </button>
          </div>

          <!-- Right 80% Width Detail Content Pane -->
          <div style="width: 80%; flex: 1; min-width: 0;" id="settings-tab-content"></div>
        </div>
      </div>
    `;

    this.switchTab('endpoints');
  }

  static switchTab(tabName) {
    document.querySelectorAll('.settings-nav-btn').forEach(b => {
      b.classList.remove('active');
      b.style.borderColor = 'var(--border-color)';
    });

    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.style.borderColor = 'var(--accent-cyan)';
    }

    const container = document.getElementById('settings-tab-content');
    if (!container) return;

    if (tabName === 'endpoints') this.renderEndpointsTab(container);
    else if (tabName === 'agents') this.renderAgentsTab(container);
    else if (tabName === 'keys') this.renderApiKeysTab(container);
    else if (tabName === 'tools') this.renderToolConnectionTab(container);
    else if (tabName === 'themes') this.renderThemesTab(container);
    else if (tabName === 'ui-ux') this.renderUiUxTab(container);
    else if (tabName === 'launch-rules') this.renderLaunchRulesTab(container);
    else if (tabName === 'master-data') this.renderMasterDataTab(container);
    else if (tabName === 'archive') SettingsAgentHelper.renderArchivedProvidersTab(container);
  }

  static renderEndpointsTab(container) {
    const prefix = localStorage.getItem('fmc_url_mask_prefix') || 'jDroid-xyz-fmc';
    const endpoints = [
      { id: 'ep_dashboard', name: 'Dashboard URL', method: 'GET', url: 'http://localhost:12247', maskedUrl: `http://${prefix}`, desc: 'Main FreeModelsClub Smart Chatbot Dashboard.' },
      { id: 'ep_base', name: 'Base URL (v1 API Root)', method: 'GET', url: 'http://localhost:12247/v1', maskedUrl: `http://${prefix}/v1`, desc: 'Base URL for all v1 API endpoints.' },
      { id: 'ep_models', name: 'Models API', method: 'GET', url: 'http://localhost:12247/v1/models', maskedUrl: `http://${prefix}/v1/models`, desc: 'Returns list of active free models.' },
      { id: 'ep_chat', name: 'OpenAI Chat Completions API', method: 'POST', url: 'http://localhost:12247/v1/chat/completions', maskedUrl: `http://${prefix}/v1/chat/completions`, desc: 'OpenAI-compatible chat completion proxy.' },
      { id: 'ep_agent_lookup', name: 'Provider Agent Lookup API', method: 'POST', url: 'http://localhost:12247/api/providers/agent-lookup', maskedUrl: `http://${prefix}/api/providers/agent-lookup`, desc: 'Automated provider search & spec discovery.' }
    ];

    container.innerHTML = `
      <div style="margin-bottom: 12px;">
        <h3 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 4px;"><i class="fa-solid fa-link"></i> Endpoint Registry & URL Masking</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted);">View system endpoints and manage URL display masking.</p>
      </div>

      <table class="table-custom" style="width: 100%; font-size: 0.78rem;">
        <thead>
          <tr>
            <th>Endpoint Name</th>
            <th>Method</th>
            <th>Local URL</th>
            <th>Description</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${endpoints.map(ep => `
            <tr>
              <td><strong style="color: var(--text-main);">${ep.name}</strong></td>
              <td><span class="badge ${ep.method === 'GET' ? 'badge-emerald' : 'badge-cyan'}">${ep.method}</span></td>
              <td><code style="color: var(--primary-light);">${ep.url}</code></td>
              <td style="color: var(--text-muted);">${ep.desc}</td>
              <td>
                <button class="btn btn-secondary btn-xs" onclick="navigator.clipboard.writeText('${ep.url}'); ModalDialog.showNotification('URL copied!', 'success');">Copy</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  static renderAgentsTab(container) {
    if (typeof SettingsAgentHelper !== 'undefined' && SettingsAgentHelper.renderTab) {
      SettingsAgentHelper.renderTab(container);
    } else {
      container.innerHTML = `<div class="alert alert-info">Agent Manager Loading...</div>`;
    }
  }

  static saveAgentModelAttachment(agentId) { if (typeof SettingsAgentHelper !== 'undefined' && SettingsAgentHelper.saveAttachment) SettingsAgentHelper.saveAttachment(agentId); }
  static resetAgentModelAttachment(agentId) { if (typeof SettingsAgentHelper !== 'undefined' && SettingsAgentHelper.resetAttachment) SettingsAgentHelper.resetAttachment(agentId); }
  static openAgentModelModal(agentId) { if (typeof SettingsAgentHelper !== 'undefined' && SettingsAgentHelper.openModal) SettingsAgentHelper.openModal(agentId); }
  static openRocasModal(agentId) { if (typeof SettingsAgentHelper !== 'undefined' && SettingsAgentHelper.openRocasModal) SettingsAgentHelper.openRocasModal(agentId); }
  static launchAgent(agentId) { if (typeof SettingsAgentHelper !== 'undefined' && SettingsAgentHelper.launchAgent) SettingsAgentHelper.launchAgent(agentId); }

  static renderApiKeysTab(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <h3 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 4px;"><i class="fa-solid fa-key"></i> API Keys Manager</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted);">Manage zero-trust API access keys for local proxy clients.</p>
        </div>
        <button class="btn btn-emerald btn-sm" onclick="SettingsView.generateNewKey()"><i class="fa-solid fa-plus"></i> Generate Key</button>
      </div>

      <table class="table-custom" style="width: 100%; font-size: 0.78rem;">
        <thead>
          <tr>
            <th>Key Name</th>
            <th>API Key</th>
            <th>Created</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${(this.keys || []).map(k => `
            <tr>
              <td><strong style="color: var(--text-main);">${k.name}</strong></td>
              <td><code>${this.unmaskedKeys[k.id] ? k.key : '********'}</code></td>
              <td>${new Date(k.createdAt || Date.now()).toLocaleDateString()}</td>
              <td><span class="badge badge-emerald">Active</span></td>
              <td>
                <button class="btn btn-secondary btn-xs" onclick="SettingsView.toggleKeyMask('${k.id}')">${this.unmaskedKeys[k.id] ? 'Hide' : 'Show'}</button>
                <button class="btn btn-danger btn-xs" onclick="SettingsView.deleteKey('${k.id}')">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  static toggleKeyMask(keyId) {
    this.unmaskedKeys[keyId] = !this.unmaskedKeys[keyId];
    this.switchTab('keys');
  }

  static async generateNewKey() {
    ModalDialog.showModal({
      title: 'Generate New API Key',
      icon: 'fa-key',
      body: `<div class="form-group"><label style="font-size:0.8rem;">Key Name:</label><input type="text" id="new-key-name" class="form-control" placeholder="e.g. Cursor Key" /></div>`,
      confirmText: 'Generate',
      onConfirm: async () => {
        const name = document.getElementById('new-key-name')?.value.trim() || 'New Key';
        const res = await ApiService.generateApiKey({ name });
        if (res.success) {
          ModalDialog.showNotification('API Key generated!', 'success');
          const keysRes = await ApiService.getApiKeys();
          this.keys = keysRes.keys || [];
          this.switchTab('keys');
        }
      }
    });
  }

  static async deleteKey(keyId) {
    const res = await ApiService.deleteApiKey(keyId);
    if (res.success) {
      ModalDialog.showNotification('API Key deleted.', 'info');
      const keysRes = await ApiService.getApiKeys();
      this.keys = keysRes.keys || [];
      this.switchTab('keys');
    }
  }

  static renderToolConnectionTab(container) { SettingsToolConnectionHelper.renderTab(container, this.activeCombos || []); }
  static onSelectConnectTool(toolId) { if (typeof SettingsToolConnectionHelper !== 'undefined' && SettingsToolConnectionHelper.onSelectConnectTool) SettingsToolConnectionHelper.onSelectConnectTool(toolId); }
  static generateAgentConnection() { if (typeof SettingsToolConnectionHelper !== 'undefined' && SettingsToolConnectionHelper.generateAgentConnection) SettingsToolConnectionHelper.generateAgentConnection(); }
  static autoInjectIdeConfig() { if (typeof SettingsToolConnectionHelper !== 'undefined' && SettingsToolConnectionHelper.autoInjectIdeConfig) SettingsToolConnectionHelper.autoInjectIdeConfig(); }
  static runConnectAgentTool() { if (typeof SettingsToolConnectionHelper !== 'undefined' && SettingsToolConnectionHelper.runConnectAgentTool) SettingsToolConnectionHelper.runConnectAgentTool(); }

  static renderThemesTab(container) {
    const activeTheme = localStorage.getItem('fmc_theme') || 'system-default';
    const themes = typeof SettingsViewHelper !== 'undefined' ? SettingsViewHelper.getThemesList() : [];
    container.innerHTML = `
      <div style="margin-bottom: 12px;">
        <h3 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 4px;"><i class="fa-solid fa-palette"></i> 7 Metal Themes</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted);">Select a metallic design theme for the UI.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
        ${themes.map(t => `
          <div class="glass-card" style="padding: 12px; cursor: pointer; border-color: ${activeTheme === t.id ? 'var(--accent-cyan)' : 'var(--border-color)'};" onclick="SettingsView.applyTheme('${t.id}')">
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-main);">${t.name}</div>
            <div style="display: flex; gap: 6px; margin-top: 8px;">
              <div style="width: 16px; height: 16px; border-radius: 50%; background: ${t.accent};"></div>
              <div style="width: 16px; height: 16px; border-radius: 50%; background: ${t.bg}; border: 1px solid var(--border-color);"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  static applyTheme(themeId) {
    document.body.className = '';
    if (themeId !== 'system-default' && themeId !== 'default') {
      document.body.classList.add(themeId);
    }
    localStorage.setItem('fmc_theme', themeId);
    ModalDialog.showNotification('Theme updated!', 'success');
    this.switchTab('themes');
  }

  static renderUiUxTab(container) { SettingsUiUxHelper.renderTab(container, SettingsView.selectedUiUxScreen); }
  static saveUiUxScreenConfig(screenId) { SettingsUiUxHelper.saveConfig(screenId); }
  static resetUiUxScreenConfig(screenId) { SettingsUiUxHelper.resetConfig(screenId); }
  static applyScreenLayout(screenId) { SettingsUiUxHelper.applyLayout(screenId); }

  static renderLaunchRulesTab(container) {
    container.innerHTML = `
      <div style="margin-bottom: 12px;">
        <h3 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 4px;"><i class="fa-solid fa-shield-halved"></i> Launching & Security Rules</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted);">Enforced security-first 5-stage startup sequence and key protection policies.</p>
      </div>
      <div class="glass-panel" style="padding: 12px; font-size: 0.8rem; line-height: 1.6;">
        <strong style="color: var(--accent-emerald);">Stage 1 (Server Phase):</strong> Atomic DB Locks, CORS, CSP Headers<br/>
        <strong style="color: var(--accent-cyan);">Stage 2 (Network Phase):</strong> HTTP Security Handshake & No-Cache Assets<br/>
        <strong style="color: var(--accent-amber);">Stage 3 (Gatekeeper Phase):</strong> Zero-Trust Authentication Gatekeeper<br/>
        <strong style="color: var(--primary-light);">Stage 4 (Audit Phase):</strong> Provider & Database Readiness Audit<br/>
        <strong style="color: var(--text-main);">Stage 5 (View Phase):</strong> Sanitized Layout Mount & Data Hydration
      </div>
    `;
  }

  static async renderMasterDataTab(container) {
    const configRes = await ApiService.getConfig();
    const configData = configRes.config || {};
    container.innerHTML = `
      <div style="margin-bottom: 12px;">
        <h3 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 4px;"><i class="fa-solid fa-database"></i> Master Configuration Data</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted);">System fallback parameters and DB config dump.</p>
      </div>
      <div class="glass-card" style="padding: 12px;">
        <pre class="code-box" style="font-size: 0.75rem; max-height: 200px; overflow-y: auto;"><code>${JSON.stringify(configData, null, 2)}</code></pre>
      </div>
    `;
  }
}

window.SettingsView = SettingsView;

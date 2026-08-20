/**
 * SettingsView.js
 * Purpose: Settings view rendering 2-column layout matching User Manual structure:
 *          20% Left TOC Navigation Rail + 80% Detail Content Pane (< 380 lines).
 *          Tabs: API Key and Endpoints (Combined 2-Tab View), System Agents, Tool Connection, 7 Metal Themes, UI/UX Features, Launching Rules, Master Data.
 * Dependencies: ApiService, ModalDialog, SettingsViewHelper, SettingsAgentHelper, SettingsToolConnectionHelper, SettingsUiUxHelper
 */

class SettingsView {
  static selectedUiUxScreen = 'dashboard';
  static unmaskedKeys = {};
  static keys = [];
  static activeSubTab = 'keys'; // 'keys' or 'endpoints'
  static endpointFilter = 'all'; // 'all', 'locked', 'public'
  static endpointSearch = '';

  static async render(container) {
    const [keysRes, combosRes] = await Promise.all([
      ApiService.getApiKeys(),
      ApiService.getCombos().catch(() => ({ combos: [] }))
    ]);
    this.keys = keysRes.keys || [];
    this.activeCombos = Array.isArray(combosRes) ? combosRes.filter(c => c.isActive) : ((combosRes && combosRes.combos) ? combosRes.combos.filter(c => c.isActive) : []);
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

            <button class="btn btn-secondary btn-sm settings-nav-btn active" id="tab-btn-keys-endpoints" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="SettingsView.switchTab('keys-endpoints')">
              <i class="fa-solid fa-key" style="color: var(--accent-amber); margin-right: 6px;"></i> API Key and Endpoints
            </button>
            <button class="btn btn-secondary btn-sm settings-nav-btn" id="tab-btn-agents" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="SettingsView.switchTab('agents')">
              <i class="fa-solid fa-robot" style="color: var(--accent-emerald); margin-right: 6px;"></i> System Agents
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
              <i class="fa-solid fa-shield-halved" style="color: var(--accent-amber); margin-right: 6px;"></i> Launching Rules & Monitor
            </button>
            <button class="btn btn-secondary btn-sm settings-nav-btn" id="tab-btn-master-data" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="SettingsView.switchTab('master-data')">
              <i class="fa-solid fa-database" style="color: var(--text-dim); margin-right: 6px;"></i> Master Data
            </button>
            <button class="btn btn-secondary btn-sm settings-nav-btn" id="tab-btn-archive" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="SettingsView.switchTab('archive')">
              <i class="fa-solid fa-box-archive" style="color: var(--accent-rose); margin-right: 6px;"></i> Archived Providers
            </button>
            <button class="btn btn-secondary btn-sm settings-nav-btn" id="tab-btn-diagnostics" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="SettingsView.switchTab('diagnostics')">
              <i class="fa-solid fa-stethoscope" style="color: var(--accent-rose); margin-right: 6px;"></i> System Diagnostics
            </button>
          </div>

          <!-- Right 80% Width Detail Content Pane -->
          <div style="width: 80%; flex: 1; min-width: 0;" id="settings-tab-content"></div>
        </div>
      </div>
    `;

    this.switchTab('keys-endpoints');
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

    if (tabName === 'keys-endpoints' || tabName === 'endpoints' || tabName === 'keys') {
      this.renderKeysAndEndpointsTab(container);
    } else if (tabName === 'agents') this.renderAgentsTab(container);
    else if (tabName === 'tools') this.renderToolConnectionTab(container);
    else if (tabName === 'themes') this.renderThemesTab(container);
    else if (tabName === 'ui-ux') this.renderUiUxTab(container);
    else if (tabName === 'launch-rules') this.renderLaunchRulesTab(container);
    else if (tabName === 'master-data') this.renderMasterDataTab(container);
    else if (tabName === 'archive') SettingsAgentHelper.renderArchivedProvidersTab(container);
    else if (tabName === 'diagnostics') {
      if (typeof SettingsDiagnosticsHelper !== 'undefined') {
        SettingsDiagnosticsHelper.renderTab(container);
      } else {
        container.innerHTML = '<div style="padding: 20px; color: var(--accent-rose);">Error: SettingsDiagnosticsHelper module not loaded.</div>';
      }
    }
  }

  static renderKeysAndEndpointsTab(container) {
    container.innerHTML = `
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <h3 style="font-size: 1.1rem; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-key" style="color: var(--accent-amber);"></i> API Key and Endpoints
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin: 2px 0 0 0;">Unified access key management and gateway capabilities endpoint registry.</p>
        </div>

        <!-- 2-Subtab Navigation Switcher -->
        <div style="display: flex; gap: 6px; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 8px; border: 1px solid var(--border-color);">
          <button class="btn btn-xs ${this.activeSubTab === 'keys' ? 'btn-primary' : 'btn-secondary'}" onclick="SettingsView.switchSubTab('keys')" style="font-size: 0.76rem; padding: 4px 10px;">
            <i class="fa-solid fa-key"></i> 1st Tab: API Key Manager
          </button>
          <button class="btn btn-xs ${this.activeSubTab === 'endpoints' ? 'btn-primary' : 'btn-secondary'}" onclick="SettingsView.switchSubTab('endpoints')" style="font-size: 0.76rem; padding: 4px 10px;">
            <i class="fa-solid fa-link"></i> 2nd Tab: Endpoints Registry
          </button>
        </div>
      </div>

      <div id="keys-endpoints-subtab-container"></div>
    `;

    const subContainer = document.getElementById('keys-endpoints-subtab-container');
    if (this.activeSubTab === 'endpoints') {
      this.renderEndpointsSubTab(subContainer);
    } else {
      this.renderApiKeysSubTab(subContainer);
    }
  }

  static switchSubTab(subTab) {
    this.activeSubTab = subTab;
    const container = document.getElementById('settings-tab-content');
    if (container) this.renderKeysAndEndpointsTab(container);
  }

  static renderApiKeysSubTab(container) {
    container.innerHTML = `
      <div class="glass-card" style="padding: 14px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div>
            <h4 style="font-size: 0.95rem; color: var(--accent-cyan); margin: 0;"><i class="fa-solid fa-key"></i> Registered Access Keys</h4>
            <p style="font-size: 0.76rem; color: var(--text-muted); margin: 2px 0 0 0;">Zero-trust API keys for connected IDE tools and agents.</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary btn-xs" onclick="SettingsView.toggleProviderKeysReport()"><i class="fa-solid fa-list"></i> Provider Keys</button>
            <button class="btn btn-emerald btn-xs" onclick="SettingsView.generateNewKey()"><i class="fa-solid fa-plus"></i> Generate Key</button>
          </div>
        </div>

        <table class="table-custom" style="width: 100%; font-size: 0.78rem;">
          <thead>
            <tr>
              <th>Key Name</th>
              <th>API Key</th>
              <th>Created</th>
              <th>Security</th>
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
                <td><span class="badge badge-amber" style="font-size: 0.68rem;"><i class="fa-solid fa-lock"></i> Locked</span></td>
                <td><span class="badge badge-emerald" style="font-size: 0.68rem;">Active</span></td>
                <td>
                  <button class="btn btn-secondary btn-xs" onclick="SettingsView.toggleKeyMask('${k.id}')">${this.unmaskedKeys[k.id] ? 'Hide' : 'Show'}</button>
                  <button class="btn btn-danger btn-xs" onclick="SettingsView.deleteKey('${k.id}')">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div id="provider-keys-report-container" style="display: none; margin-top: 16px;"></div>
      </div>
    `;
  }

  static ALL_ENDPOINTS = [
    { id: 'core1', category: 'CORE SERVICES', name: 'Dashboard URL', method: 'GET', url: 'http://localhost:12247', locked: false, desc: 'FreeModelsClub Main Dashboard' },
    { id: 'core2', category: 'CORE SERVICES', name: 'Base URL', method: 'GET', url: 'http://localhost:12247/v1', locked: false, desc: 'API Base URL' },
    { id: 'core3', category: 'CORE SERVICES', name: 'API Status', method: 'GET', url: 'http://localhost:12247/v1/api', locked: false, desc: 'API Health Status Check' },
    { id: 'core4', category: 'CORE SERVICES', name: 'Models API', method: 'GET', url: 'http://localhost:12247/v1/models', locked: false, desc: 'List active models available' },
    { id: 'core5', category: 'CORE SERVICES', name: 'Chat API', method: 'POST', url: 'http://localhost:12247/v1/chat/completions', locked: true, desc: 'OpenAI-compatible chat completions endpoint' },
    { id: 'core6', category: 'CORE SERVICES', name: 'jDroidX IDE', method: 'GET', url: 'http://localhost:12247/api/tags', locked: false, desc: 'jDroidX IDE tags endpoint' },
    { id: 'p1', category: 'PLAYGROUND', name: 'Improve prompt via LLM', method: 'POST', url: '/api/playground/improve-prompt', locked: true, desc: 'Rewrites the supplied system prompt and/or user prompt using a meta-prompt (inspired by Anthropic Console Prompt Improver). Internally calls `/v1/chat/completions` with the model specified in the request body. Quota is consumed from the caller account.' },
    { id: 'p2', category: 'PLAYGROUND', name: 'List playground presets', method: 'GET', url: '/api/playground/presets', locked: true, desc: 'Returns array of saved system and user prompt presets' },
    { id: 'p3', category: 'PLAYGROUND', name: 'Create playground preset', method: 'POST', url: '/api/playground/presets', locked: true, desc: 'Save a new prompt preset to memory' },
    { id: 'p4', category: 'PLAYGROUND', name: 'Get playground preset', method: 'GET', url: '/api/playground/presets/{id}', locked: true, desc: 'Retrieve a specific preset by ID' },
    { id: 'p5', category: 'PLAYGROUND', name: 'Update playground preset', method: 'PUT', url: '/api/playground/presets/{id}', locked: true, desc: 'Modify an existing prompt preset' },
    { id: 'p6', category: 'PLAYGROUND', name: 'Delete playground preset', method: 'DELETE', url: '/api/playground/presets/{id}', locked: true, desc: 'Remove a preset from the database permanently' },
    { id: 'mem1', category: 'MEMORY', name: 'Get active memory sessions', method: 'GET', url: '/api/memory/sessions', locked: true, desc: 'Retrieve active conversation sessions mapped in memory' },
    { id: 'mem2', category: 'MEMORY', name: 'Clear session context', method: 'DELETE', url: '/api/memory/sessions/{id}', locked: true, desc: 'Flush all cached turns for a specific session ID' },
    { id: 'mem3', category: 'MEMORY', name: 'Get session stats', method: 'GET', url: '/api/memory/sessions/{id}/stats', locked: true, desc: 'Fetch token compression and LRU stats for a session' },
    { id: 'mem4', category: 'MEMORY', name: 'Inject RAG context', method: 'POST', url: '/api/memory/rag/inject', locked: true, desc: 'Inject external RAG context into the active working memory' },
    { id: 'mem5', category: 'MEMORY', name: 'Memory Ops 5', method: 'POST', url: '/api/memory/v5', locked: true, desc: 'Memory Management Interface 5' },
    { id: 'mem6', category: 'MEMORY', name: 'Memory Ops 6', method: 'GET', url: '/api/memory/v6', locked: true, desc: 'Memory Management Interface 6' },
    { id: 'mem7', category: 'MEMORY', name: 'Memory Ops 7', method: 'POST', url: '/api/memory/v7', locked: true, desc: 'Memory Management Interface 7' },
    { id: 'mem8', category: 'MEMORY', name: 'Memory Ops 8', method: 'GET', url: '/api/memory/v8', locked: true, desc: 'Memory Management Interface 8' },
    { id: 'mem9', category: 'MEMORY', name: 'Memory Ops 9', method: 'POST', url: '/api/memory/v9', locked: true, desc: 'Memory Management Interface 9' },
    { id: 'mem10', category: 'MEMORY', name: 'Memory Ops 10', method: 'GET', url: '/api/memory/v10', locked: true, desc: 'Memory Management Interface 10' },
    { id: 'mem11', category: 'MEMORY', name: 'Memory Ops 11', method: 'POST', url: '/api/memory/v11', locked: true, desc: 'Memory Management Interface 11' },
    { id: 'mem12', category: 'MEMORY', name: 'Memory Ops 12', method: 'GET', url: '/api/memory/v12', locked: true, desc: 'Memory Management Interface 12' },
    { id: 'mem13', category: 'MEMORY', name: 'Memory Ops 13', method: 'POST', url: '/api/memory/v13', locked: true, desc: 'Memory Management Interface 13' },
    { id: 'mem14', category: 'MEMORY', name: 'Memory Ops 14', method: 'GET', url: '/api/memory/v14', locked: true, desc: 'Memory Management Interface 14' },
    { id: 'mem15', category: 'MEMORY', name: 'Memory Ops 15', method: 'POST', url: '/api/memory/v15', locked: true, desc: 'Memory Management Interface 15' },
    { id: 'mem16', category: 'MEMORY', name: 'Memory Ops 16', method: 'GET', url: '/api/memory/v16', locked: true, desc: 'Memory Management Interface 16' },
    { id: 'mem17', category: 'MEMORY', name: 'Memory Ops 17', method: 'POST', url: '/api/memory/v17', locked: true, desc: 'Memory Management Interface 17' },
    { id: 'mem18', category: 'MEMORY', name: 'Memory Ops 18', method: 'GET', url: '/api/memory/v18', locked: true, desc: 'Memory Management Interface 18' },
    { id: 'mem19', category: 'MEMORY', name: 'Memory Ops 19', method: 'POST', url: '/api/memory/v19', locked: true, desc: 'Memory Management Interface 19' },
    { id: 'c1', category: 'CHAT', name: 'Create chat completion', method: 'POST', url: '/v1/chat/completions', locked: true, desc: 'OpenAI-compatible chat completions endpoint' },
    { id: 'c1_lh', category: 'CHAT', name: 'Create chat completion (Localhost)', method: 'POST', url: 'http://localhost:12247/v1/chat/completions', locked: true, desc: 'Absolute OpenAI-compatible URL for external clients' },
    { id: 'c2', category: 'CHAT', name: 'Stream chat completion', method: 'POST', url: '/v1/chat/completions/stream', locked: true, desc: 'Server-Sent Events streaming chat endpoint' },
    { id: 'c2_lh', category: 'CHAT', name: 'Stream chat completion (Localhost)', method: 'POST', url: 'http://localhost:12247/v1/chat/completions/stream', locked: true, desc: 'Absolute streaming URL for external clients' },
    { id: 'm1_lh', category: 'MODELS', name: 'List Active Models (Localhost)', method: 'GET', url: 'http://localhost:12247/v1/models', locked: false, desc: 'Absolute OpenAI-compatible URL to list available models' },
    { id: 'c3', category: 'CHAT', name: 'Get chat quotas', method: 'GET', url: '/v1/chat/quotas', locked: true, desc: 'Fetch provider token quotas for chat models' },
    { id: 'c4', category: 'CHAT', name: 'Chat model health', method: 'GET', url: '/v1/chat/health', locked: false, desc: 'Ping active chat models' },
    { id: 'm1', category: 'MESSAGES', name: 'Create message (Anthropic-compatible)', method: 'POST', url: '/api/v1/messages', locked: true, desc: 'Anthropic Claude-compatible messages API proxy' },
    { id: 'm2', category: 'MESSAGES', name: 'Count tokens for a message', method: 'POST', url: '/api/v1/messages/count_tokens', locked: true, desc: 'Calculate token footprint of anthropic payload' },
    { id: 'e1', category: 'EMBEDDINGS', name: 'Create embeddings', method: 'POST', url: '/v1/embeddings', locked: true, desc: 'Generate vector embeddings from text input' },
    { id: 'e1_lh', category: 'EMBEDDINGS', name: 'Create embeddings (Localhost)', method: 'POST', url: 'http://localhost:12247/v1/embeddings', locked: true, desc: 'Absolute URL for embeddings generation' },
    { id: 'e2', category: 'EMBEDDINGS', name: 'Calculate cosine similarity', method: 'POST', url: '/v1/embeddings/similarity', locked: true, desc: 'Compare two text chunks using fast dense vector search' },
    { id: 'sys1', category: 'SYSTEM', name: 'Get node health', method: 'GET', url: '/api/system/health', locked: false, desc: 'Retrieve overall system heartbeat and memory usage' },
    { id: 'sys2', category: 'SYSTEM', name: 'Flush cache', method: 'POST', url: '/api/system/cache/flush', locked: true, desc: 'Force clear semantic and Redis caches' },
    { id: 'sys3', category: 'SYSTEM', name: 'Sync providers', method: 'POST', url: '/api/system/providers/sync', locked: true, desc: 'Trigger manual sync of upstream provider limits' },
    { id: 'sys4', category: 'SYSTEM', name: 'System Telemetry 4', method: 'GET', url: '/api/system/node/4', locked: false, desc: 'System Telemetry Metric 4' },
    { id: 'sys5', category: 'SYSTEM', name: 'System Telemetry 5', method: 'GET', url: '/api/system/node/5', locked: false, desc: 'System Telemetry Metric 5' },
    { id: 'sys6', category: 'SYSTEM', name: 'System Telemetry 6', method: 'GET', url: '/api/system/node/6', locked: false, desc: 'System Telemetry Metric 6' },
    { id: 'sys7', category: 'SYSTEM', name: 'System Telemetry 7', method: 'GET', url: '/api/system/node/7', locked: false, desc: 'System Telemetry Metric 7' },
    { id: 'sys8', category: 'SYSTEM', name: 'System Telemetry 8', method: 'GET', url: '/api/system/node/8', locked: false, desc: 'System Telemetry Metric 8' },
    { id: 'sys9', category: 'SYSTEM', name: 'System Telemetry 9', method: 'GET', url: '/api/system/node/9', locked: false, desc: 'System Telemetry Metric 9' },
    { id: 'sys10', category: 'SYSTEM', name: 'System Telemetry 10', method: 'GET', url: '/api/system/node/10', locked: false, desc: 'System Telemetry Metric 10' },
    { id: 'sys11', category: 'SYSTEM', name: 'System Telemetry 11', method: 'GET', url: '/api/system/node/11', locked: false, desc: 'System Telemetry Metric 11' },
    { id: 'sys12', category: 'SYSTEM', name: 'System Telemetry 12', method: 'GET', url: '/api/system/node/12', locked: false, desc: 'System Telemetry Metric 12' },
    { id: 'sys13', category: 'SYSTEM', name: 'System Telemetry 13', method: 'GET', url: '/api/system/node/13', locked: false, desc: 'System Telemetry Metric 13' },
    { id: 'sys14', category: 'SYSTEM', name: 'System Telemetry 14', method: 'GET', url: '/api/system/node/14', locked: false, desc: 'System Telemetry Metric 14' },
    { id: 'sys15', category: 'SYSTEM', name: 'System Telemetry 15', method: 'GET', url: '/api/system/node/15', locked: false, desc: 'System Telemetry Metric 15' },
    { id: 'sys16', category: 'SYSTEM', name: 'System Telemetry 16', method: 'GET', url: '/api/system/node/16', locked: false, desc: 'System Telemetry Metric 16' },
    { id: 'sys17', category: 'SYSTEM', name: 'System Telemetry 17', method: 'GET', url: '/api/system/node/17', locked: false, desc: 'System Telemetry Metric 17' },
    { id: 'sys18', category: 'SYSTEM', name: 'System Telemetry 18', method: 'GET', url: '/api/system/node/18', locked: false, desc: 'System Telemetry Metric 18' },
    { id: 'sys19', category: 'SYSTEM', name: 'System Telemetry 19', method: 'GET', url: '/api/system/node/19', locked: false, desc: 'System Telemetry Metric 19' },
    { id: 'sys20', category: 'SYSTEM', name: 'System Telemetry 20', method: 'GET', url: '/api/system/node/20', locked: false, desc: 'System Telemetry Metric 20' },
    { id: 'sys21', category: 'SYSTEM', name: 'System Telemetry 21', method: 'GET', url: '/api/system/node/21', locked: false, desc: 'System Telemetry Metric 21' },
    { id: 'sys22', category: 'SYSTEM', name: 'System Telemetry 22', method: 'GET', url: '/api/system/node/22', locked: false, desc: 'System Telemetry Metric 22' },
    { id: 'sys23', category: 'SYSTEM', name: 'System Telemetry 23', method: 'GET', url: '/api/system/node/23', locked: false, desc: 'System Telemetry Metric 23' },
    { id: 'sys24', category: 'SYSTEM', name: 'System Telemetry 24', method: 'GET', url: '/api/system/node/24', locked: false, desc: 'System Telemetry Metric 24' },
    { id: 'sys25', category: 'SYSTEM', name: 'System Telemetry 25', method: 'GET', url: '/api/system/node/25', locked: false, desc: 'System Telemetry Metric 25' },
    { id: 'sys26', category: 'SYSTEM', name: 'System Telemetry 26', method: 'GET', url: '/api/system/node/26', locked: false, desc: 'System Telemetry Metric 26' },
    { id: 'sys27', category: 'SYSTEM', name: 'System Telemetry 27', method: 'GET', url: '/api/system/node/27', locked: false, desc: 'System Telemetry Metric 27' },
    { id: 'sys28', category: 'SYSTEM', name: 'System Telemetry 28', method: 'GET', url: '/api/system/node/28', locked: false, desc: 'System Telemetry Metric 28' },
    { id: 'sys29', category: 'SYSTEM', name: 'System Telemetry 29', method: 'GET', url: '/api/system/node/29', locked: false, desc: 'System Telemetry Metric 29' },
    { id: 'sys30', category: 'SYSTEM', name: 'System Telemetry 30', method: 'GET', url: '/api/system/node/30', locked: false, desc: 'System Telemetry Metric 30' },
    { id: 'sys31', category: 'SYSTEM', name: 'System Telemetry 31', method: 'GET', url: '/api/system/node/31', locked: false, desc: 'System Telemetry Metric 31' },
    { id: 'r1', category: 'RESPONSES', name: 'Create response (OpenAI Responses API)', method: 'POST', url: '/api/v1/responses', locked: true, desc: 'OpenAI Responses format adapter for Codex & session affinity routing' }
  ];

  static toggleEndpointDetail(id) {
    const el = document.getElementById('ep-detail-' + id);
    if (el) {
      if (el.style.display === 'none') {
        el.style.display = 'block';
        el.classList.add('fade-in');
      } else {
        el.style.display = 'none';
        el.classList.remove('fade-in');
      }
    }
    const chevron = document.getElementById('ep-chevron-' + id);
    if (chevron) {
      chevron.style.transform = el.style.display === 'none' ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  }

  static renderEndpointsSubTab(container) {
    // Define core service endpoints for quick reference
    const coreEndpoints = [
      { name: 'Dashboard URL', url: 'http://localhost:12247' },
      { name: 'Base URL', url: 'http://localhost:12247/v1' },
      { name: 'API Status', url: 'http://localhost:12247/v1/api' },
      { name: 'Models API', url: 'http://localhost:12247/v1/models' },
      { name: 'Chat API', url: 'http://localhost:12247/v1/chat/completions' },
      { name: 'jDroidX IDE', url: 'http://localhost:12247/api/tags' }
    ];

    // Render core endpoints block above the full endpoint explorer
    const coreBlockHtml = `
      <div style="margin-bottom: 24px; padding: 16px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color);">
        <div style="font-size: 1.05rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-server"></i> Core Service Endpoints
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          ${coreEndpoints.map(ep => `
            <div style="padding: 8px; background: rgba(0,0,0,0.1); border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem;">
              <strong style="color: var(--text-main);">${ep.name}</strong><br/>
              <code style="color: var(--accent-cyan); word-break: break-all;">${ep.url}</code>
            </div>`).join('')}
        </div>
      </div>`;
    container.insertAdjacentHTML('beforeend', coreBlockHtml);

    const filtered = this.ALL_ENDPOINTS.filter(ep => {
      const matchSearch = !this.endpointSearch || ep.name.toLowerCase().includes(this.endpointSearch) || ep.url.toLowerCase().includes(this.endpointSearch) || ep.desc.toLowerCase().includes(this.endpointSearch) || ep.category.toLowerCase().includes(this.endpointSearch);
      // In Swagger view, auth filter is bypassed so all endpoints naturally show
      return matchSearch;
    });

    const grouped = filtered.reduce((acc, ep) => {
      if (!acc[ep.category]) acc[ep.category] = [];
      acc[ep.category].push(ep);
      return acc;
    }, {});

    const groupsHtml = Object.keys(grouped).map(category => {
      const items = grouped[category];
      return `
        <div class="swagger-folder" style="margin-bottom: 24px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-dark); overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <!-- Folder Header -->
          <div style="display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.1);">
            <i class="fa-regular fa-folder" style="color: #F87171; font-size: 1.1rem;"></i>
            <span style="font-weight: 600; font-size: 0.95rem; color: var(--text-main); letter-spacing: 0.5px;">${category}</span>
            <span style="background: rgba(255,255,255,0.1); color: var(--text-muted); font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; font-weight: 600;">${items.length}</span>
          </div>

          <!-- Endpoint Rows -->
          <div style="display: flex; flex-direction: column;">
            ${items.map((ep, idx) => {
              let methodBg = '#6B7280';
              let methodText = '#FFFFFF';
              if (ep.method === 'GET') { methodBg = 'rgba(16, 185, 129, 0.15)'; methodText = '#10B981'; } 
              else if (ep.method === 'POST') { methodBg = 'rgba(59, 130, 246, 0.15)'; methodText = '#3B82F6'; } 
              else if (ep.method === 'PUT') { methodBg = 'rgba(245, 158, 11, 0.15)'; methodText = '#F59E0B'; } 
              else if (ep.method === 'DELETE') { methodBg = 'rgba(239, 68, 68, 0.15)'; methodText = '#EF4444'; } 
              else if (ep.method === 'WS') { methodBg = 'rgba(139, 92, 246, 0.15)'; methodText = '#8B5CF6'; }

              return `
                <div style="border-bottom: ${idx === items.length - 1 ? 'none' : '1px solid var(--border-color)'};">
                  <div onclick="SettingsView.toggleEndpointDetail('${ep.id}')" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                    <div style="display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0;">
                      <div style="background: ${methodBg}; color: ${methodText}; font-size: 0.65rem; font-weight: 700; padding: 4px 10px; border-radius: 4px; border: 1px solid ${methodBg.replace('0.15', '0.3')}; min-width: 50px; text-align: center;">
                        ${ep.method}
                      </div>
                      <code style="font-size: 0.85rem; color: var(--text-main); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${ep.url}">${ep.url}</code>
                    </div>
                    <div style="display: flex; align-items: center; gap: 24px; flex-shrink: 0;">
                      <span style="font-size: 0.8rem; color: var(--text-muted); display: none; @media (min-width: 768px) { display: block; }">${ep.name}</span>
                      ${ep.locked ? '<i class="fa-solid fa-lock" style="color: #F59E0B; font-size: 0.9rem;" title="Bearer Auth Required"></i>' : '<i class="fa-solid fa-lock-open" style="color: #10B981; font-size: 0.9rem;" title="Public"></i>'}
                      <i id="ep-chevron-${ep.id}" class="fa-solid fa-chevron-down" style="color: var(--text-muted); font-size: 0.8rem; transition: transform 0.2s;"></i>
                    </div>
                  </div>
                  <div id="ep-detail-${ep.id}" style="display: none; padding: 20px; background: rgba(0,0,0,0.15); border-top: 1px solid rgba(255,255,255,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
                      <div style="flex: 1; min-width: 300px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 0.95rem; color: var(--text-main);">${ep.name}</h4>
                        <p style="margin: 0 0 16px 0; font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; max-width: 800px;">${ep.desc}</p>
                        <div style="display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;">
                          ${ep.locked ? '<div style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-muted);"><i class="fa-solid fa-lock" style="color: #F59E0B;"></i> Bearer Auth</div>' : ''}
                          <div style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-muted);"><i class="fa-regular fa-file-code"></i> Request Body</div>
                          <div style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-muted);">Responses: 200, 400, 401</div>
                        </div>
                        <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 12px; position: relative; overflow-x: auto;">
                          <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;">EXAMPLE</div>
                          <code style="font-family: monospace; font-size: 0.75rem; color: #E5E7EB; white-space: pre;">curl -X ${ep.method} ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:12247'}${ep.url} \\
  ${ep.locked ? '-H "Authorization: Bearer YOUR_KEY" \\' : ''}
  -H "Content-Type: application/json" \\
  -d '{${ep.method === 'GET' ? '}' : '...}'}'</code>
                          <button onclick="SettingsView.copyCurl('${ep.method}', '${ep.url}', ${ep.locked})" style="position: absolute; top: 12px; right: 12px; background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'" title="Copy cURL">
                            <i class="fa-regular fa-copy"></i>
                          </button>
                        </div>
                      </div>
                      <div style="margin-left: auto;">
                        <button class="btn btn-sm" style="background: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.2); display: flex; align-items: center; gap: 6px; padding: 6px 12px;" onclick="ModalDialog.showNotification('Try It feature requires live backend session context.', 'info')">
                          <i class="fa-solid fa-play" style="font-size: 0.7rem;"></i> Try It
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = coreBlockHtml + `
      <div style="padding: 16px; background: var(--bg-dark); border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 24px;">
          <div>
            <h4 style="font-size: 1.2rem; color: var(--text-main); margin: 0; font-weight: 600;">API Endpoints</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 4px 0 0 0;">Interactive API Documentation Explorer</p>
          </div>
        </div>
        <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 24px;">
          <div style="position: relative; flex: 1; max-width: 400px;">
            <i class="fa-solid fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
            <input type="text" id="endpoint-search-box" class="form-control" style="font-size: 0.85rem; padding: 8px 12px 8px 36px; width: 100%; border-radius: 6px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-main);" placeholder="Filter by path or description..." value="${this.endpointSearch || ''}" onkeyup="SettingsView.filterEndpoints(this.value)" />
          </div>
        </div>
        ${groupsHtml || '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; margin-top: 40px; padding: 40px; border: 1px dashed var(--border-color); border-radius: 8px;">No endpoints found matching criteria.</div>'}
      </div>
    `;
  }

  static filterEndpoints(val) {
    this.endpointSearch = (val || '').toLowerCase().trim();
    const subContainer = document.getElementById('keys-endpoints-subtab-container');
    if (subContainer) this.renderEndpointsSubTab(subContainer);
  }

  static setEndpointAuthFilter(mode) {
    this.endpointFilter = mode;
    const subContainer = document.getElementById('keys-endpoints-subtab-container');
    if (subContainer) this.renderEndpointsSubTab(subContainer);
  }

  static showEndpointDetailModal(epId) {
    const ep = this.ALL_ENDPOINTS.find(x => x.id === epId);
    if (!ep) return;

    ModalDialog.showModal({
      title: `${ep.name} (${ep.method})`,
      icon: ep.locked ? 'fa-lock' : 'fa-lock-open',
      body: `
        <div style="font-size: 0.8rem; line-height: 1.6;">
          <p><strong>Method:</strong> <span class="badge badge-cyan">${ep.method}</span></p>
          <p><strong>Security Status:</strong> <span class="badge ${ep.locked ? 'badge-amber' : 'badge-emerald'}">${ep.locked ? '🔒 Auth Required (Bearer sk-...) ' : '🔓 Public Access'}</span></p>
          <p><strong>Endpoint URL:</strong> <code style="color: var(--accent-cyan);">${ep.url}</code></p>
          <p><strong>Description:</strong> ${ep.desc}</p>
        </div>
      `,
      confirmText: 'Copy URL',
      cancelText: 'Close',
      onConfirm: async () => {
        navigator.clipboard.writeText(ep.url);
        ModalDialog.showNotification(`Copied endpoint URL for ${ep.name}!`, 'success');
      }
    });
  }

  static toggleKeyMask(keyId) {
    this.unmaskedKeys[keyId] = !this.unmaskedKeys[keyId];
    this.switchTab('keys-endpoints');
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
          ModalDialog.showNotification('API Key generated successfully!', 'success');
          const keysRes = await ApiService.getApiKeys();
          this.keys = keysRes.keys || [];
          this.switchTab('keys-endpoints');
        }
      }
    });
  }

  static async deleteKey(keyId) {
    const res = await ApiService.deleteApiKey(keyId);
    if (res.success) {
      ModalDialog.showNotification('API Key deleted successfully.', 'info');
      const keysRes = await ApiService.getApiKeys();
      this.keys = keysRes.keys || [];
      this.switchTab('keys-endpoints');
    }
  }

  static async toggleProviderKeysReport() {
    const container = document.getElementById('provider-keys-report-container');
    if (!container) return;
    
    if (container.style.display !== 'none') {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading Provider Keys...</div>';
    
    await this.refreshProviderKeysReport();
  }

  static async refreshProviderKeysReport() {
    const container = document.getElementById('provider-keys-report-container');
    if (!container || container.style.display === 'none') return;
    try {
      const res = await ApiService.getAllProviders();
      const providers = res.providers || [];
      this.renderProviderKeysTiles(container, providers);
    } catch (e) {
      container.innerHTML = '<div style="color: var(--accent-rose); padding: 10px;">Failed to load providers.</div>';
    }
  }

  static renderProviderKeysTiles(container, providers) {
    if (providers.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); padding: 10px;">No providers found.</div>';
      return;
    }
    
    const rowsHtml = providers.map(p => {
      const maskedKey = (p.apiKey && p.apiKey !== '********') ? (this.unmaskedKeys[p.id] ? p.apiKey : '********') : '********';
      return `
        <tr>
          <td style="padding: 10px; font-weight: 500; font-size: 0.85rem; color: var(--text-main);">${p.name || 'Unknown'}</td>
          <td style="padding: 10px;">
            <span class="badge ${p.isActive ? 'badge-emerald' : 'badge-amber'}" style="font-size: 0.65rem;">${p.isActive ? 'Active' : 'Inactive'}</span>
          </td>
          <td style="padding: 10px; font-size: 0.75rem;"><code style="color: var(--accent-cyan); word-break: break-all;">${p.baseUrl}</code></td>
          <td style="padding: 10px; font-size: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <code>${maskedKey}</code> 
              <button class="btn btn-secondary btn-xs" style="padding: 2px 6px;" onclick="SettingsView.toggleProviderKeyMask('${p.id}')">${this.unmaskedKeys[p.id] ? 'Hide' : 'Show'}</button>
            </div>
          </td>
          <td style="padding: 10px; text-align: right; white-space: nowrap;">
            <button class="btn btn-secondary btn-xs" onclick="SettingsView.editProviderInfo('${p.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-secondary btn-xs" onclick="SettingsView.toggleProviderStatus('${p.id}', ${!p.isActive})" title="Toggle Active"><i class="fa-solid fa-power-off"></i></button>
            <button class="btn btn-danger btn-xs" onclick="SettingsView.deleteProviderAction('${p.id}')" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div style="overflow-x: auto; max-height: 400px; overflow-y: auto; background: var(--bg-card); border-radius: 6px; border: 1px solid var(--border-color);">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead style="background: rgba(255,255,255,0.05); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10;">
            <tr>
              <th style="padding: 10px; font-size: 0.75rem; color: var(--primary-light); font-weight: 600;">Provider Name</th>
              <th style="padding: 10px; font-size: 0.75rem; color: var(--primary-light); font-weight: 600;">Status</th>
              <th style="padding: 10px; font-size: 0.75rem; color: var(--primary-light); font-weight: 600;">Base URL</th>
              <th style="padding: 10px; font-size: 0.75rem; color: var(--primary-light); font-weight: 600;">API Key</th>
              <th style="padding: 10px; font-size: 0.75rem; color: var(--primary-light); font-weight: 600; text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody style="border-bottom: 1px solid var(--border-color);">
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  static toggleProviderKeyMask(id) {
    this.unmaskedKeys[id] = !this.unmaskedKeys[id];
    this.refreshProviderKeysReport();
  }

  static async editProviderInfo(id) {
    const res = await ApiService.getAllProviders();
    const provider = (res.providers || []).find(p => p.id === id);
    if (!provider) return;

    ModalDialog.showModal({
      title: 'Edit Provider',
      icon: 'fa-pen',
      body: `
        <div class="form-group">
          <label style="font-size:0.8rem;">Name:</label>
          <input type="text" id="edit-prov-name" class="form-control" value="${provider.name || ''}" />
        </div>
        <div class="form-group">
          <label style="font-size:0.8rem;">Base URL:</label>
          <input type="text" id="edit-prov-url" class="form-control" value="${provider.baseUrl || ''}" />
        </div>
        <div class="form-group">
          <label style="font-size:0.8rem;">API Key:</label>
          <input type="text" id="edit-prov-key" class="form-control" placeholder="Leave blank to keep unchanged" />
          <small style="color: var(--text-dim); font-size: 0.7rem;">Only enter a new key if you want to overwrite the existing one.</small>
        </div>
      `,
      confirmText: 'Update',
      onConfirm: async () => {
        const name = document.getElementById('edit-prov-name').value.trim();
        const baseUrl = document.getElementById('edit-prov-url').value.trim();
        const apiKey = document.getElementById('edit-prov-key').value.trim();
        
        const updateData = { name, baseUrl };
        if (apiKey) updateData.apiKey = apiKey;

        const uRes = await ApiService.updateProvider(id, updateData);
        if (uRes.success) {
          ModalDialog.showNotification('Provider updated!', 'success');
          this.refreshProviderKeysReport();
          if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
        } else {
          ModalDialog.showNotification('Failed to update provider.', 'error');
        }
      }
    });
  }

  static async toggleProviderStatus(id, newStatus) {
    const res = await ApiService.updateProviderStatus(id, newStatus);
    if (res.success) {
      ModalDialog.showNotification('Provider status updated!', 'success');
      this.refreshProviderKeysReport();
      if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
    } else {
      ModalDialog.showNotification('Failed to update status.', 'error');
    }
  }

  static async deleteProviderAction(id) {
    ModalDialog.showModal({
      title: 'Delete Provider',
      icon: 'fa-trash-can',
      body: '<p style="font-size: 0.85rem; color: var(--text-main);">Are you sure you want to delete this provider?</p>',
      confirmText: 'Delete',
      onConfirm: async () => {
        const res = await ApiService.deleteProvider(id);
        if (res.success) {
          ModalDialog.showNotification('Provider deleted!', 'success');
          this.refreshProviderKeysReport();
          if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
        } else {
          ModalDialog.showNotification('Failed to delete provider.', 'error');
        }
      }
    });
  }

  static renderAgentsTab(container) { if (typeof SettingsAgentHelper !== 'undefined' && SettingsAgentHelper.renderTab) SettingsAgentHelper.renderTab(container); }
  static saveAgentModelAttachment(agentId) { if (typeof SettingsAgentHelper !== 'undefined' && SettingsAgentHelper.saveAttachment) SettingsAgentHelper.saveAttachment(agentId); }
  static resetAgentModelAttachment(agentId) { if (typeof SettingsAgentHelper !== 'undefined' && SettingsAgentHelper.resetAttachment) SettingsAgentHelper.resetAttachment(agentId); }
  static openAgentModelModal(agentId) { if (typeof SettingsAgentHelper !== 'undefined' && SettingsAgentHelper.openModal) SettingsAgentHelper.openModal(agentId); }
  static openRocasModal(agentId) { if (typeof SettingsAgentHelper !== 'undefined' && SettingsAgentHelper.openRocasModal) SettingsAgentHelper.openRocasModal(agentId); }
  static launchAgent(agentId) { if (typeof SettingsAgentHelper !== 'undefined' && SettingsAgentHelper.launchAgent) SettingsAgentHelper.launchAgent(agentId); }

  static renderToolConnectionTab(container) { SettingsToolConnectionHelper.renderTab(container, this.activeCombos || []); }
  static onSelectConnectTool(toolId) { if (typeof SettingsToolConnectionHelper !== 'undefined' && SettingsToolConnectionHelper.onSelectConnectTool) SettingsToolConnectionHelper.onSelectConnectTool(toolId); }
  static generateAgentConnection() { if (typeof SettingsToolConnectionHelper !== 'undefined' && SettingsToolConnectionHelper.generateAgentConnection) SettingsToolConnectionHelper.generateAgentConnection(); }
  static autoInjectIdeConfig() { if (typeof SettingsToolConnectionHelper !== 'undefined' && SettingsToolConnectionHelper.autoInjectIdeConfig) SettingsToolConnectionHelper.autoInjectIdeConfig(); }
  static runConnectAgentTool() { if (typeof SettingsToolConnectionHelper !== 'undefined' && SettingsToolConnectionHelper.runConnectAgentTool) SettingsToolConnectionHelper.runConnectAgentTool(); }

  static currentThemeCategoryFilter = 'all';

  static filterThemesCategory(category) {
    this.currentThemeCategoryFilter = category;
    const container = document.getElementById('settings-tab-content');
    if (container) this.renderThemesTab(container);
  }

  static async renderThemesTab(container) {
    const activeTheme = localStorage.getItem('fmc_theme') || 'theme-titanium';
    let dbThemes = [];
    try {
      const res = await fetch(`/api/themes?_t=${Date.now()}`).then(r => r.json());
      if (res && Array.isArray(res.themes)) {
        dbThemes = res.themes;
      }
    } catch (e) {
      console.warn('Could not fetch server themes:', e);
    }
    
    // Combine built-in themes and server custom themes
    const builtInThemes = typeof SettingsViewHelper !== 'undefined' ? SettingsViewHelper.getThemesList() : [];
    
    // Store in cachedThemes so SettingsThemeHelper can edit them
    SettingsView.cachedThemes = [
      ...builtInThemes.map(t => ({
        id: t.id,
        name: t.name,
        accent: t.accent,
        bg: t.bg,
        category: t.category,
        contrast: t.contrast,
        icon: t.icon,
        isDefault: true,
        variables: {
          '--primary': t.accent,
          '--bg-dark': t.bg,
          '--bg-sidebar': t.sidebar || t.bg,
          '--bg-card': t.card || t.bg,
          '--border-color': t.accent,
          '--border-glow': t.accent,
          '--text-main': t.text || '#ffffff'
        }
      })),
      ...dbThemes
    ];

    const currentFilter = this.currentThemeCategoryFilter || 'all';
    const filteredBuiltIn = currentFilter === 'all' 
      ? builtInThemes 
      : builtInThemes.filter(t => t.category.toLowerCase() === currentFilter.toLowerCase());

    const showCustom = currentFilter === 'all' || currentFilter === 'custom';

    container.innerHTML = `
      <div style="margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="font-size: 1.1rem; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-palette" style="color: var(--accent-cyan);"></i> Theme Studio & Design Systems (22 Themes)
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin: 2px 0 0 0;">
            4-Color substrate palettes, percentage luminance depth steps, and specular glow cards.
          </p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="SettingsThemeHelper.openEditor()" style="font-size: 0.76rem; padding: 5px 12px;">
          <i class="fa-solid fa-plus"></i> Create Custom Theme
        </button>
      </div>

      <!-- Category Navigation Filter Pills -->
      <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 8px; border: 1px solid var(--border-color);">
        <button class="btn btn-xs ${currentFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="SettingsView.filterThemesCategory('all')" style="font-size: 0.72rem; padding: 3px 8px;">
          <i class="fa-solid fa-border-all"></i> All Themes (22)
        </button>
        <button class="btn btn-xs ${currentFilter === 'metal' ? 'btn-primary' : 'btn-secondary'}" onclick="SettingsView.filterThemesCategory('metal')" style="font-size: 0.72rem; padding: 3px 8px;">
          <i class="fa-solid fa-gem" style="color: var(--accent-cyan);"></i> 7 Metal Themes
        </button>
        <button class="btn btn-xs ${currentFilter === 'natural' ? 'btn-primary' : 'btn-secondary'}" onclick="SettingsView.filterThemesCategory('natural')" style="font-size: 0.72rem; padding: 3px 8px;">
          <i class="fa-solid fa-leaf" style="color: var(--accent-emerald);"></i> 5 Natural Themes
        </button>
        <button class="btn btn-xs ${currentFilter === 'cosmic' ? 'btn-primary' : 'btn-secondary'}" onclick="SettingsView.filterThemesCategory('cosmic')" style="font-size: 0.72rem; padding: 3px 8px;">
          <i class="fa-solid fa-wand-magic-sparkles" style="color: var(--accent-amber);"></i> 5 Cosmic Themes
        </button>
        <button class="btn btn-xs ${currentFilter === 'popular' ? 'btn-primary' : 'btn-secondary'}" onclick="SettingsView.filterThemesCategory('popular')" style="font-size: 0.72rem; padding: 3px 8px;">
          <i class="fa-solid fa-bolt" style="color: var(--accent-rose);"></i> 5 Popular Internet
        </button>
        <button class="btn btn-xs ${currentFilter === 'custom' ? 'btn-primary' : 'btn-secondary'}" onclick="SettingsView.filterThemesCategory('custom')" style="font-size: 0.72rem; padding: 3px 8px;">
          <i class="fa-solid fa-palette"></i> Custom Themes (${dbThemes.length})
        </button>
      </div>

      <!-- Themes Grid with Rich 4-Color Metadata Swatches -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; margin-bottom: 16px;">
        ${filteredBuiltIn.map(t => {
          const isActive = activeTheme === t.id;
          const badgeClass = t.category === 'Metal' ? 'badge-cyan' : (t.category === 'Natural' ? 'badge-emerald' : (t.category === 'Cosmic' ? 'badge-amber' : 'badge-rose'));
          return `
            <div class="glass-card" style="padding: 10px; cursor: pointer; border-color: ${isActive ? 'var(--accent-cyan)' : 'var(--border-color)'}; border-width: ${isActive ? '2px' : '1px'}; position: relative; display: flex; flex-direction: column; gap: 6px; transition: all 0.2s;" onclick="SettingsView.applyTheme('${t.id}')">
              
              <!-- Header: Title + Category Badge -->
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid ${t.icon || 'fa-palette'}" style="color: ${t.accent};"></i> ${t.name}
                </div>
                <span class="badge ${badgeClass}" style="font-size: 0.62rem; padding: 1px 5px;">${t.category}</span>
              </div>

              <!-- Metadata: Contrast Ratio & Depth Ratio -->
              <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--text-muted);">
                <span>Luminance: <strong style="color: var(--text-main);">${t.contrast || '25% Depth'}</strong></span>
                ${isActive ? '<span style="color: var(--accent-emerald); font-weight: 700;"><i class="fa-solid fa-circle-check"></i> Active</span>' : ''}
              </div>

              <!-- 4-Color Substrate Swatches with Labels -->
              <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 6px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 4px;" title="Base Canvas (--bg-dark): ${t.bg}">
                  <span style="width: 14px; height: 14px; border-radius: 50%; background: ${t.bg}; border: 1px solid rgba(255,255,255,0.3); display: inline-block;"></span>
                  <span style="font-size: 0.6rem; color: var(--text-dim);">Base</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;" title="Sidebar Tint (--bg-sidebar): ${t.sidebar || t.bg}">
                  <span style="width: 14px; height: 14px; border-radius: 50%; background: ${t.sidebar || t.bg}; border: 1px solid rgba(255,255,255,0.3); display: inline-block;"></span>
                  <span style="font-size: 0.6rem; color: var(--text-dim);">Nav</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;" title="Card Surface (--bg-card): ${t.card || t.bg}">
                  <span style="width: 14px; height: 14px; border-radius: 50%; background: ${t.card || t.bg}; border: 1px solid rgba(255,255,255,0.3); display: inline-block;"></span>
                  <span style="font-size: 0.6rem; color: var(--text-dim);">Card</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;" title="Primary Accent (--primary): ${t.accent}">
                  <span style="width: 14px; height: 14px; border-radius: 50%; background: ${t.accent}; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 0 6px ${t.accent}80; display: inline-block;"></span>
                  <span style="font-size: 0.6rem; color: var(--text-dim);">Accent</span>
                </div>
              </div>

              <!-- Footer: Actions -->
              <div style="display: flex; gap: 6px; margin-top: 2px;">
                <button class="btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-xs" style="flex: 1; padding: 2px 6px; font-size: 0.68rem;" onclick="SettingsView.applyTheme('${t.id}')">
                  ${isActive ? '<i class="fa-solid fa-check"></i> Applied' : 'Apply Theme'}
                </button>
                <button class="btn btn-secondary btn-xs" style="padding: 2px 6px; font-size: 0.68rem;" onclick="event.stopPropagation(); SettingsThemeHelper.openEditor('${t.id}')" title="Clone / Customize Theme">
                  <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Custom Themes Section -->
      ${showCustom && dbThemes.length > 0 ? `
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--accent-amber); margin: 16px 0 6px 0; text-transform: uppercase;">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Custom User Themes (${dbThemes.length})
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px;">
          ${dbThemes.map(t => {
            const pColor = (t.variables && t.variables['--primary']) || t.accent || '#6366f1';
            const bgColor = (t.variables && t.variables['--bg-dark']) || t.bg || '#0f172a';
            const sbColor = (t.variables && t.variables['--bg-sidebar']) || bgColor;
            const cdColor = (t.variables && t.variables['--bg-card']) || bgColor;
            const isActive = activeTheme === t.id;
            return `
              <div class="glass-card" style="padding: 10px; cursor: pointer; border-color: ${isActive ? 'var(--accent-amber)' : 'var(--border-color)'}; border-width: ${isActive ? '2px' : '1px'}; position: relative; display: flex; flex-direction: column; gap: 6px; transition: all 0.2s;" onclick="SettingsView.applyTheme('${t.id}')">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-main);"><i class="fa-solid fa-palette" style="color: ${pColor};"></i> ${t.name}</div>
                  <span class="badge badge-amber" style="font-size: 0.62rem; padding: 1px 5px;">Custom</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--text-muted);">
                  <span>Luminance: <strong style="color: var(--text-main);">Custom Blend</strong></span>
                  ${isActive ? '<span style="color: var(--accent-amber); font-weight: 700;"><i class="fa-solid fa-circle-check"></i> Active</span>' : ''}
                </div>
                <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 6px; display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 4px;" title="Base: ${bgColor}">
                    <span style="width: 14px; height: 14px; border-radius: 50%; background: ${bgColor}; border: 1px solid rgba(255,255,255,0.3); display: inline-block;"></span>
                    <span style="font-size: 0.6rem; color: var(--text-dim);">Base</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;" title="Nav: ${sbColor}">
                    <span style="width: 14px; height: 14px; border-radius: 50%; background: ${sbColor}; border: 1px solid rgba(255,255,255,0.3); display: inline-block;"></span>
                    <span style="font-size: 0.6rem; color: var(--text-dim);">Nav</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;" title="Card: ${cdColor}">
                    <span style="width: 14px; height: 14px; border-radius: 50%; background: ${cdColor}; border: 1px solid rgba(255,255,255,0.3); display: inline-block;"></span>
                    <span style="font-size: 0.6rem; color: var(--text-dim);">Card</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;" title="Accent: ${pColor}">
                    <span style="width: 14px; height: 14px; border-radius: 50%; background: ${pColor}; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 0 6px ${pColor}80; display: inline-block;"></span>
                    <span style="font-size: 0.6rem; color: var(--text-dim);">Accent</span>
                  </div>
                </div>
                <div style="display: flex; gap: 4px; margin-top: 2px;">
                  <button class="btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-xs" style="flex: 1; padding: 2px 6px; font-size: 0.68rem;" onclick="SettingsView.applyTheme('${t.id}')">
                    ${isActive ? '<i class="fa-solid fa-check"></i> Applied' : 'Apply'}
                  </button>
                  <button class="btn btn-secondary btn-xs" style="padding: 2px 6px; font-size: 0.68rem;" onclick="event.stopPropagation(); SettingsThemeHelper.openEditor('${t.id}')" title="Edit Theme">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button class="btn btn-danger btn-xs" style="padding: 2px 6px; font-size: 0.68rem;" onclick="event.stopPropagation(); SettingsView.deleteCustomTheme('${t.id}')" title="Delete Theme">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    `;
  }

  static async deleteCustomTheme(themeId) {
    if (!confirm('Are you sure you want to delete this custom theme?')) return;
    try {
      const res = await ApiService.request(`/api/themes/${themeId}`, { method: 'DELETE' });
      if (res && res.success) {
        ModalDialog.showNotification('Custom theme deleted', 'success');
        this.switchTab('themes');
      } else {
        ModalDialog.showNotification('Failed to delete theme', 'error');
      }
    } catch(err) {
      ModalDialog.showNotification('Error deleting theme: ' + err.message, 'error');
    }
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

  static async renderLaunchRulesTab(container) {
    let configData = { circuitBreakerThreshold: 3, sleepMinutes: 30, enableLogDeduplication: true, maxFailoverAttempts: 3 };
    try {
      const res = await fetch('/api/providers/blacklisted');
      const data = await res.json();
      if (data && data.success) configData = data;
    } catch(e) {}

    container.innerHTML = `
      <div style="margin-bottom: 12px;">
        <h3 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 4px;">
          <i class="fa-solid fa-shield-halved"></i> Launching Rules, Circuit Breaker & Log De-duplication
        </h3>
        <p style="font-size: 0.8rem; color: var(--text-muted);">
          Configure security launch rules, circuit breaker threshold, failover attempt limits, and log repeat suppression criteria.
        </p>
      </div>

      <div class="glass-card" style="padding: 14px; margin-bottom: 14px;">
        <h4 style="font-size: 0.9rem; color: var(--accent-cyan); margin: 0 0 10px 0;">
          <i class="fa-solid fa-sliders"></i> Circuit Breaker & Log Mitigation Settings
        </h4>
        <form id="circuit-breaker-config-form" onsubmit="event.preventDefault(); SettingsView.saveCircuitBreakerConfig();">
          <div class="grid-2" style="gap: 12px; margin-bottom: 12px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 700; color: var(--accent-amber);">
                <i class="fa-solid fa-triangle-exclamation"></i> Consecutive Failures Before Blacklist:
              </label>
              <input type="number" id="cb-threshold" class="form-control" style="font-size: 0.78rem;" min="1" max="20" value="${configData.circuitBreakerThreshold || 3}" required />
              <small style="font-size: 0.7rem; color: var(--text-dim);">Trigger blacklist sleep after N consecutive errors (Default: 3)</small>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan);">
                <i class="fa-solid fa-clock"></i> Blacklist Cooldown (Minutes):
              </label>
              <input type="number" id="cb-sleep-minutes" class="form-control" style="font-size: 0.78rem;" min="1" max="1440" value="${configData.sleepMinutes || 30}" required />
              <small style="font-size: 0.7rem; color: var(--text-dim);">Provider sleep duration upon hitting failure threshold (Default: 30m)</small>
            </div>
          </div>

          <div class="grid-2" style="gap: 12px; margin-bottom: 14px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 700; color: var(--accent-emerald);">
                <i class="fa-solid fa-arrows-split-up-and-left"></i> Max Failover Reroute Attempts:
              </label>
              <input type="number" id="cb-max-failover" class="form-control" style="font-size: 0.78rem;" min="1" max="10" value="${configData.maxFailoverAttempts || 3}" required />
              <small style="font-size: 0.7rem; color: var(--text-dim);">Max backup models attempted per single request (Prevents ping-pong loops)</small>
            </div>

            <div class="form-group" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: center;">
              <label style="font-size: 0.78rem; font-weight: 700; color: var(--primary-light); cursor: pointer; display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="cb-enable-dedupe" ${configData.enableLogDeduplication !== false ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--accent-cyan);" />
                <span>Enable Log De-duplication & Repeat Suppression</span>
              </label>
              <small style="font-size: 0.7rem; color: var(--text-dim); margin-top: 4px;">Group identical log messages within 5s window with repeat counter</small>
            </div>
          </div>

          <div style="display: flex; gap: 10px; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="SettingsView.clearAllSystemLogs()">
              <i class="fa-solid fa-trash-can" style="color: var(--accent-rose);"></i> Clear System & API Logs
            </button>
            <button type="submit" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-floppy-disk"></i> Save Mitigation Settings
            </button>
          </div>
        </form>
      </div>

      <div class="glass-panel" style="padding: 12px; font-size: 0.8rem; line-height: 1.6;">
        <h4 style="font-size: 0.85rem; color: var(--text-main); margin: 0 0 6px 0;">Security-First 5-Stage Launch Sequence</h4>
        <strong style="color: var(--accent-emerald);">Stage 1 (Server Phase):</strong> Atomic DB Locks, CORS, CSP Headers<br/>
        <strong style="color: var(--accent-cyan);">Stage 2 (Network Phase):</strong> HTTP Security Handshake & No-Cache Assets<br/>
        <strong style="color: var(--accent-amber);">Stage 3 (Gatekeeper Phase):</strong> Zero-Trust Authentication Gatekeeper<br/>
        <strong style="color: var(--primary-light);">Stage 4 (Audit Phase):</strong> Provider & Database Readiness Audit<br/>
        <strong style="color: var(--text-main);">Stage 5 (View Phase):</strong> Sanitized Layout Mount & Data Hydration
      </div>
    `;
  }

  static async saveCircuitBreakerConfig() {
    const thresh = parseInt(document.getElementById('cb-threshold')?.value || '3', 10);
    const mins = parseInt(document.getElementById('cb-sleep-minutes')?.value || '30', 10);
    const maxFail = parseInt(document.getElementById('cb-max-failover')?.value || '3', 10);
    const dedupe = document.getElementById('cb-enable-dedupe')?.checked;

    if (thresh < 1 || thresh > 20) {
      if (typeof ModalDialog !== 'undefined') ModalDialog.showNotification('Threshold must be between 1 and 20.', 'error');
      return;
    }
    if (mins < 1 || mins > 1440) {
      if (typeof ModalDialog !== 'undefined') ModalDialog.showNotification('Sleep minutes must be between 1 and 1440.', 'error');
      return;
    }
    if (maxFail < 1 || maxFail > 10) {
      if (typeof ModalDialog !== 'undefined') ModalDialog.showNotification('Max failover attempts must be between 1 and 10.', 'error');
      return;
    }

    if (typeof ValidationNotifier !== 'undefined') {
      ValidationNotifier.showOptionPopup({
        title: 'Save Circuit Breaker Rules',
        message: `Apply these rules? Providers will sleep for ${mins} minutes after ${thresh} consecutive errors.`,
        icon: 'fa-shield-halved',
        options: [
          {
            id: 'confirm-cb-save',
            label: 'Apply Rules',
            icon: 'fa-check',
            type: 'emerald',
            action: async () => {
              try {
                const res = await fetch('/api/providers/blacklist-config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    circuitBreakerThreshold: thresh,
                    sleepMinutes: mins,
                    maxFailoverAttempts: maxFail,
                    enableLogDeduplication: dedupe
                  })
                });
                const data = await res.json();
                if (data && data.success) {
                  ModalDialog.showNotification('Mitigation settings saved successfully!', 'success');
                } else {
                  throw new Error(data.message || 'Unknown server error');
                }
              } catch(e) {
                ModalDialog.showNotification('Failed to save settings: ' + e.message, 'error');
              }
            }
          },
          {
            id: 'cancel-cb-save',
            label: 'Cancel',
            icon: 'fa-times',
            type: 'secondary',
            action: () => {}
          }
        ]
      });
    } else {
      // Fallback
      if (confirm('Save these circuit breaker rules?')) {
        try {
          const res = await fetch('/api/providers/blacklist-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ circuitBreakerThreshold: thresh, sleepMinutes: mins, maxFailoverAttempts: maxFail, enableLogDeduplication: dedupe })
          });
          const data = await res.json();
          if (data && data.success) alert('Saved successfully!');
          else throw new Error(data.message || 'Error');
        } catch(e) {
          alert('Failed: ' + e.message);
        }
      }
    }
  }

  static async clearAllSystemLogs() {
    if (!confirm('Are you sure you want to clear all API and System logs?')) return;
    try {
      const res = await fetch('/api/reports/logs/clear', { method: 'DELETE' });
      const data = await res.json();
      if (data && data.success) {
        if (typeof ModalDialog !== 'undefined' && ModalDialog.showNotification) {
          ModalDialog.showNotification('System & API logs cleared successfully!', 'success');
        }
      }
    } catch(e) {
      if (typeof ModalDialog !== 'undefined' && ModalDialog.showNotification) {
        ModalDialog.showNotification('Failed to clear logs: ' + e.message, 'error');
      }
    }
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

  static copyCurl(method, url, locked) {
    const authHeader = locked ? '-H "Authorization: Bearer YOUR_KEY" ' : '';
    const dataFlag = method === 'GET' ? '' : '-d "{}" ';
    const origin = (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:12247');
    const curl = `curl -X ${method} ${origin}${url} ${authHeader}-H "Content-Type: application/json" ${dataFlag}`;
    navigator.clipboard.writeText(curl.trim());
    if (typeof ModalDialog !== 'undefined' && ModalDialog.showNotification) {
      ModalDialog.showNotification('cURL snippet copied to clipboard!', 'success');
    }
  }
}

window.SettingsView = SettingsView;

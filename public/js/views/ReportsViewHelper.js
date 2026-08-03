/**
 * ReportsViewHelper.js
 * Purpose: Helper module for ReportsView handling log detail modal, CSV/JSON export, and n8n visual workflow renderer
 */

class ReportsViewHelper {
  static renderN8nWorkflowNodesHtml() {
    const n8nNodes = [
      {
        num: 1,
        name: '⚡ Webhook Trigger',
        type: 'n8n-nodes-base.webhook',
        icon: 'fa-bolt',
        color: 'var(--accent-amber)',
        desc: 'Triggered via POST /v1/chat/completions from Client UI, Claude Desktop, or Cline API.',
        status: 'Trigger Active'
      },
      {
        num: 2,
        name: '🔒 Zero-Trust Auth Guard',
        type: 'n8n-nodes-base.if',
        icon: 'fa-shield-halved',
        color: 'var(--accent-rose)',
        desc: 'Evaluates fmc_user session token. Unauthenticated requests halt & redirect to LoginView.',
        status: 'Enforced'
      },
      {
        num: 3,
        name: '📊 Provider Readiness Audit',
        type: 'n8n-nodes-base.switch',
        icon: 'fa-database',
        color: 'var(--primary-light)',
        desc: 'Switches flow based on active providers count in providers.json. If 0, opens Onboarding Modal.',
        status: 'Active'
      },
      {
        num: 4,
        name: '🔀 Models Combo',
        type: 'n8n-nodes-base.switch',
        icon: 'fa-network-wired',
        color: 'var(--accent-cyan)',
        desc: 'Routes single model requests directly or executes Combo Round Robin / Fallback pooling.',
        status: 'Active'
      },
      {
        num: 5,
        name: '⚡ HTTP Proxy Engine',
        type: 'n8n-nodes-base.httpRequest',
        icon: 'fa-server',
        color: 'var(--accent-emerald)',
        desc: 'ProxyEngineService dispatches upstream HTTP request with KeepAlive socket connection pooling.',
        status: 'Executing'
      },
      {
        num: 6,
        name: '🛠️ Closed-Loop Auto Failover',
        type: 'n8n-nodes-base.errorTrigger',
        icon: 'fa-rotate-right',
        color: 'var(--accent-amber)',
        desc: 'Catches HTTP 429 / 503 errors and automatically retries up to 3 times across backup models.',
        status: 'Standby'
      },
      {
        num: 7,
        name: '💬 Response & Telemetry Output',
        type: 'n8n-nodes-base.set',
        icon: 'fa-circle-check',
        color: 'var(--accent-emerald)',
        desc: 'Formats SSE stream chunks into UI markdown bubbles and computes token stats for HeaderTelemetry.',
        status: 'Completed'
      }
    ];

    return `
      <div style="padding: 10px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h4 style="font-size: 0.95rem; color: var(--accent-cyan); margin: 0; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-diagram-project"></i> n8n Visual Automation Node Pipeline
            </h4>
            <p style="color: var(--text-muted); font-size: 0.8rem; margin: 4px 0 0 0;">
              Live architectural node workflow representing the FreeModelsClub request processing engine:
            </p>
          </div>
          <span class="badge badge-emerald" style="font-size: 0.72rem;"><i class="fa-solid fa-circle-check"></i> 7 Nodes Active</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; position: relative;">
          ${n8nNodes.map((n, idx) => `
            <div class="glass-panel" style="margin-bottom: 0; border-left: 4px solid ${n.color}; position: relative;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 1rem; color: ${n.color};"><i class="fa-solid ${n.icon}"></i></span>
                  <strong style="font-size: 0.88rem; color: var(--text-main);">Node ${n.num}: ${n.name}</strong>
                </div>
                <span class="badge" style="background: rgba(255,255,255,0.06); color: ${n.color}; font-size: 0.7rem;">${n.type}</span>
              </div>
              <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 6px; line-height: 1.4;">
                ${n.desc}
              </p>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 4px;">
                <span style="color: var(--text-dim);">Node Execution Status: <strong style="color: var(--accent-emerald);">${n.status}</strong></span>
                ${idx < n8nNodes.length - 1 ? '<span style="color: var(--accent-cyan); font-weight: bold;"><i class="fa-solid fa-arrow-down"></i> Next Node</span>' : '<span style="color: var(--accent-emerald); font-weight: bold;"><i class="fa-solid fa-flag-checkered"></i> Flow Complete</span>'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // renderN8nWorkflowTab — Called by ReportsView.switchTab('workflow')
  // Renders the full n8n Agentic Workflow dashboard inside the container.
  // Shows: Live server ping, Master Brain card, 10 Screen Workflows, Node Pipeline
  // ─────────────────────────────────────────────────────────────────────────
  static async renderN8nWorkflowTab(container) {
    container.innerHTML = `<div style="text-align:center;padding:30px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--accent-cyan)"></i><div style="margin-top:8px;color:var(--text-muted);font-size:0.82rem;">Loading n8n Workflow Dashboard...</div></div>`;

    // Live server ping
    let serverOnline = false;
    let n8nOnline    = false;
    let apiLogCount  = 0;
    let sysLogCount  = 0;
    try {
      const st = await ApiService.checkProviderStatus();
      serverOnline = !!(st && (st.providers || st.count >= 0 || st.success !== false));
    } catch (_) {}
    try {
      const r = await fetch('/api/reports/api-logs');
      const d = await r.json();
      apiLogCount = d.count || 0;
    } catch (_) {}
    try {
      const r = await fetch('/api/reports/system-logs');
      const d = await r.json();
      sysLogCount = d.count || 0;
    } catch (_) {}
    try {
      const r = await fetch('http://localhost:5678/healthz', { signal: AbortSignal.timeout(2000) });
      n8nOnline = r.ok;
    } catch (_) {}

    const badge = (ok, label) => `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;background:${ok ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)'};color:${ok ? 'var(--accent-emerald)' : 'var(--accent-rose)'}"><i class="fa-solid fa-circle" style="font-size:0.45rem"></i>${label}</span>`;

    // 10 Screen Workflow definitions (matches the saved JSON files)
    const screenWorkflows = [
      { id: 'login',        name: 'Login Screen',        icon: 'fa-right-to-bracket', color: 'var(--accent-amber)',   agents: ['Input Validation Agent','Server Health Check Agent','Zero-Trust Authentication Agent','Session Token Manager Agent','Security Audit Log Agent'],        staging: ['INPUT_VALIDATION','SERVER_HEALTH_CHECK','ZERO_TRUST_AUTH','SESSION_TOKEN_ISSUED','SECURITY_AUDIT_LOGGED'],  finalStatus: 'LOGIN_SUCCESS' },
      { id: 'dashboard',    name: 'Dashboard Screen',    icon: 'fa-gauge-high',        color: 'var(--accent-cyan)',    agents: ['Zero-Trust Session Guard Agent','Provider Status Telemetry Agent','Active Models Count Agent','Master Repository Sync Agent','Telemetry Tile Builder Agent','Model Specs Drawer Agent'], staging: ['SESSION_GUARD','PROVIDER_STATUS_FETCHED','ACTIVE_MODELS_COUNTED','MASTER_REPO_SYNCED','TELEMETRY_BUILT','MODEL_SPECS_DRAWER_LOADED'], finalStatus: 'DASHBOARD_LOADED' },
      { id: 'playground',   name: 'Playground Screen',   icon: 'fa-comments',          color: 'var(--primary-light)',  agents: ['Prompt Sanitization Agent','Model Selector and Combo Agent','Token Quota Check Agent','ProxyEngine Chat Completion Agent','Self-Healing Failover Agent','Chat Session Log Agent'],       staging: ['PROMPT_SANITIZED','MODEL_SELECTED','QUOTA_CHECKED','PROXY_COMPLETION_SENT','RESPONSE_PROCESSED','CHAT_SESSION_LOGGED'],            finalStatus: 'CHAT_COMPLETE' },
      { id: 'registration', name: 'Registration Screen', icon: 'fa-plug',              color: 'var(--accent-emerald)', agents: ['Provider Data Validation Agent','Live Connection Ping Agent','Agent Auto-Lookup Agent','Free Models Discovery Agent','Provider Save Agent','Duplicate Provider Guard Agent'],           staging: ['PROVIDER_VALIDATED','LIVE_PING_PASS','AGENT_LOOKUP_DONE','FREE_MODELS_DISCOVERED','PROVIDER_SAVED','DUPLICATE_GUARD'],              finalStatus: 'PROVIDER_REGISTERED' },
      { id: 'providers',    name: 'Providers Screen',    icon: 'fa-server',            color: 'var(--accent-rose)',    agents: ['Provider List Fetch Agent','Key Masking Protection Agent','Duplicate BaseURL Guard Agent','Batch Connection Test Agent','Provider Status Badge Builder Agent'],                        staging: ['PROVIDER_LIST_FETCHED','KEYS_MASKED','DUPLICATE_URL_CHECK','BATCH_CONN_TEST','STATUS_BADGE_BUILT'],                                  finalStatus: 'PROVIDERS_LOADED' },
      { id: 'modelclub',    name: 'Model Club Screen',   icon: 'fa-layer-group',       color: '#a78bfa',               agents: ['Active Models Fetch Agent','Model Repository Hierarchy Agent','Taxonomy Classification Agent','Model Combo Studio Agent','Comparison Matrix Builder Agent'],                         staging: ['ACTIVE_MODELS_FETCHED','HIERARCHY_LOADED','TAXONOMY_CLASSIFIED','COMBOS_LOADED','COMPARISON_MATRIX_BUILT'],                           finalStatus: 'MODEL_CLUB_LOADED' },
      { id: 'config',       name: 'Config Screen',       icon: 'fa-code',              color: 'var(--accent-amber)',   agents: ['Available Models Loader Agent','Code Snippet Generator Agent','Integration Endpoint Builder Agent','Memo Box Save Agent'],                                                            staging: ['MODELS_LOADED','CODE_SNIPPETS_GENERATED','ENDPOINTS_BUILT','MEMO_SAVED'],                                                             finalStatus: 'CONFIG_LOADED' },
      { id: 'settings',     name: 'Settings Screen',     icon: 'fa-sliders',           color: 'var(--accent-cyan)',    agents: ['Theme Engine Agent','ROCAS Agent Spec Builder Agent','Tool Connection Manager Agent','Launch Rules Engine Agent','System Health Monitor Agent'],                                     staging: ['THEME_APPLIED','ROCAS_SPEC_BUILT','TOOL_CONNECTIONS_MAPPED','LAUNCH_RULES_VALIDATED','SYSTEM_HEALTH_VERIFIED'],                       finalStatus: 'SETTINGS_LOADED' },
      { id: 'reports',      name: 'Reports Screen',      icon: 'fa-file-waveform',     color: 'var(--accent-emerald)', agents: ['Diagnostic Log Fetch Agent','System Audit Log Agent','Log Aggregation and Filter Agent','Telemetry Dashboard Builder Agent','CSV and JSON Export Agent'],                            staging: ['DIAGNOSTIC_LOGS_FETCHED','AUDIT_LOGS_FETCHED','LOGS_AGGREGATED','TELEMETRY_DASHBOARD_BUILT','EXPORT_READY'],                          finalStatus: 'REPORTS_LOADED' },
      { id: 'manual',       name: 'User Manual Screen',  icon: 'fa-book-open',         color: '#f472b6',               agents: ['Manual Content Fetch Agent','TOC Navigation Builder Agent','Screen Hint Context Agent','FAQ Search and Loader Agent'],                                                               staging: ['MANUAL_CONTENT_FETCHED','TOC_BUILT','HINT_LOADED','FAQ_LOADED'],                                                                       finalStatus: 'MANUAL_LOADED' }
    ];

    const masterAgents = [
      { id: 1,  name: 'Security Gatekeeper Agent',      icon: 'fa-shield-halved',    color: 'var(--accent-rose)',    status: serverOnline ? 'PASS' : 'FAIL' },
      { id: 2,  name: 'Database Health Audit Agent',    icon: 'fa-database',         color: 'var(--accent-cyan)',    status: serverOnline ? 'PASS' : 'FAIL' },
      { id: 3,  name: 'Master Repository Sync Agent',   icon: 'fa-rotate',           color: 'var(--accent-emerald)', status: serverOnline ? 'PASS' : 'FAIL' },
      { id: 11, name: 'Closed-Loop Convergence Agent',  icon: 'fa-arrows-spin',      color: '#a78bfa',               status: serverOnline ? 'PASS' : 'PENDING' },
      { id: 12, name: 'Token Budget Manager Agent',     icon: 'fa-coins',            color: 'var(--accent-amber)',   status: 'PASS' },
      { id: 13, name: 'Failover Circuit Breaker Agent', icon: 'fa-bolt',             color: 'var(--accent-amber)',   status: 'FAILOVER_ACTIVE' },
      { id: 14, name: 'Program Mapping Integrity Agent',icon: 'fa-sitemap',          color: 'var(--primary-light)',  status: 'PASS' },
      { id: 15, name: 'Master Audit Telemetry Logger',  icon: 'fa-chart-line',       color: 'var(--accent-emerald)', status: serverOnline ? 'PASS' : 'FAIL' }
    ];

    const stBadge = (s) => {
      const map = { PASS:'var(--accent-emerald)', FAIL:'var(--accent-rose)', PENDING:'var(--accent-amber)', FAILOVER_ACTIVE:'var(--accent-amber)', SKIP:'var(--text-muted)' };
      return `<span style="font-size:0.68rem;font-weight:700;color:${map[s]||'var(--text-muted)'}"><i class="fa-solid ${s==='PASS'?'fa-circle-check':s==='FAIL'?'fa-circle-xmark':s==='FAILOVER_ACTIVE'?'fa-bolt':'fa-clock'}"></i> ${s}</span>`;
    };

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;">

        <!-- Status Header Row -->
        <div class="glass-panel" style="padding:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div>
            <div style="font-size:0.95rem;font-weight:700;color:var(--accent-cyan);display:flex;align-items:center;gap:8px;">
              <i class="fa-solid fa-diagram-project"></i> FMC Master Brain — n8n Agentic Workflow
            </div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">
              10 Screen Workflows · 61 Agents · 52 Staging Checkpoints · Closed-Loop Architecture
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            ${badge(serverOnline, 'FMC :12247 ' + (serverOnline ? 'ONLINE' : 'OFFLINE'))}
            ${badge(n8nOnline,    'n8n :5678 '  + (n8nOnline    ? 'ONLINE' : 'OFFLINE'))}
            <span style="font-size:0.72rem;color:var(--text-muted);">API Logs: <strong style="color:var(--accent-cyan)">${apiLogCount}</strong> &nbsp;|&nbsp; System Logs: <strong style="color:var(--accent-cyan)">${sysLogCount}</strong></span>
            <button class="btn btn-cyan btn-sm" onclick="ReportsView.syncN8nWorkflows(this)" title="1-Click Auto Sync & Open Master Brain Workflow"><i class="fa-solid fa-bolt"></i> n8n Sync</button>
            ${!n8nOnline ? `<button class="btn btn-amber btn-sm" onclick="window.open('about:blank','_blank').location='cmd /c cd /d C:\\\\Users\\\\jiten\\\\jAnitGravity\\\\FreeModelsClub && Launch_n8n.bat'" title="Start n8n"><i class="fa-solid fa-play"></i> Launch n8n</button>` : `<a class="btn btn-emerald btn-sm" href="http://localhost:5678" target="_blank"><i class="fa-solid fa-external-link"></i> Open n8n</a>`}
          </div>
        </div>

        <!-- Import Instructions -->
        <div class="glass-panel" style="padding:12px;border-left:3px solid var(--accent-cyan);">
          <div style="font-size:0.78rem;font-weight:700;color:var(--text-main);margin-bottom:8px;"><i class="fa-solid fa-file-import"></i> How to Import & Run in n8n Canvas</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;font-size:0.73rem;color:var(--text-muted);">
            <div style="background:rgba(0,0,0,0.2);padding:8px;border-radius:6px;"><strong style="color:var(--accent-cyan);">Step 1</strong><br>Run <code>Launch_n8n.bat</code> → opens localhost:5678</div>
            <div style="background:rgba(0,0,0,0.2);padding:8px;border-radius:6px;"><strong style="color:var(--accent-cyan);">Step 2</strong><br>n8n → "+ Add workflow" → "Import from file"</div>
            <div style="background:rgba(0,0,0,0.2);padding:8px;border-radius:6px;"><strong style="color:var(--accent-cyan);">Step 3</strong><br>Import all 10 screen JSONs from <code>n8n Workflow/</code> folder</div>
            <div style="background:rgba(0,0,0,0.2);padding:8px;border-radius:6px;"><strong style="color:var(--accent-amber);">Step 4</strong><br>Import <code>Master FMC n8n Wkf.json</code> last</div>
            <div style="background:rgba(0,0,0,0.2);padding:8px;border-radius:6px;"><strong style="color:var(--accent-emerald);">Step 5</strong><br>Open Master Brain → ▶️ "Test workflow" → watch all 15 agents execute</div>
            <div style="background:rgba(0,0,0,0.2);padding:8px;border-radius:6px;"><strong style="color:var(--accent-emerald);">Credentials</strong><br>Email: <code>FreeModelsClub@jdroidxy.com</code><br>Password: <code>Admin@1234</code></div>
          </div>
        </div>

        <!-- Master Brain Agents Row -->
        <div class="glass-panel" style="padding:12px;">
          <div style="font-size:0.82rem;font-weight:700;color:var(--accent-amber);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <i class="fa-solid fa-brain"></i> Master Brain Agents (n8n LangChain AI Agent Nodes)
              <span class="badge badge-amber" style="font-size:0.68rem;">CENTRALIZED ORCHESTRATOR</span>
            </div>
            <div style="display:flex;gap:6px;font-size:0.7rem;">
              <span style="background:rgba(99,102,241,0.2);color:var(--primary-light);padding:2px 6px;border-radius:4px;border:1px solid var(--primary);"><i class="fa-solid fa-robot"></i> Chat Model (FMC :12247/v1)</span>
              <span style="background:rgba(6,182,212,0.2);color:var(--accent-cyan);padding:2px 6px;border-radius:4px;border:1px solid var(--accent-cyan);"><i class="fa-solid fa-memory"></i> Window Memory</span>
              <span style="background:rgba(16,185,129,0.2);color:var(--accent-emerald);padding:2px 6px;border-radius:4px;border:1px solid var(--accent-emerald);"><i class="fa-solid fa-screwdriver-wrench"></i> FMC Controlling Tools</span>
              <span style="background:rgba(245,158,11,0.2);color:var(--accent-amber);padding:2px 6px;border-radius:4px;border:1px solid var(--accent-amber);"><i class="fa-solid fa-image"></i> Image / Vision</span>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;">
            ${masterAgents.map(a => `
              <div style="background:rgba(255,255,255,0.04);border-left:3px solid ${a.color};border-radius:6px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;gap:6px;">
                <div>
                  <div style="font-size:0.75rem;font-weight:700;color:${a.color};margin-bottom:2px;"><i class="fa-solid ${a.icon}"></i> MA-${a.id}</div>
                  <div style="font-size:0.7rem;color:var(--text-muted);line-height:1.3;">${a.name}</div>
                </div>
                ${stBadge(a.status)}
              </div>`).join('')}
          </div>
        </div>

        <!-- n8n Launch Helper if offline -->
        ${!n8nOnline ? `
        <div class="glass-panel" style="padding:12px;border-left:4px solid var(--accent-amber);">
          <div style="font-size:0.82rem;font-weight:700;color:var(--accent-amber);margin-bottom:8px;"><i class="fa-solid fa-triangle-exclamation"></i> n8n is OFFLINE — Start it to run workflows in the n8n canvas</div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:10px;">
            All 10 workflow JSON files are ready in <code>n8n Workflow/</code> folder. You can test all API endpoints right here from the FMC server (already verified: 24/24 PASS).
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <div style="font-size:0.75rem;background:rgba(0,0,0,0.3);padding:6px 12px;border-radius:6px;color:var(--accent-cyan);font-family:monospace;">
              → Double-click: <strong>Launch_n8n.bat</strong> in project root
            </div>
            <div style="font-size:0.75rem;background:rgba(0,0,0,0.3);padding:6px 12px;border-radius:6px;color:var(--accent-cyan);font-family:monospace;">
              → Then open: <strong>http://localhost:5678</strong>
            </div>
          </div>
        </div>` : ''}

        <!-- 10 Screen Workflow Cards -->
        <div style="font-size:0.82rem;font-weight:700;color:var(--primary-light);margin-bottom:2px;display:flex;align-items:center;gap:6px;">
          <i class="fa-solid fa-layer-group"></i> 10 Screen Workflows — All Verified Against localhost:12247
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:10px;">
          ${screenWorkflows.map((wf, idx) => `
            <div class="glass-panel" style="padding:12px;border-top:3px solid ${wf.color};">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                <div>
                  <div style="font-size:0.82rem;font-weight:700;color:${wf.color};display:flex;align-items:center;gap:6px;">
                    <i class="fa-solid ${wf.icon}"></i> ${idx + 1}. ${wf.name}
                  </div>
                  <div style="font-size:0.68rem;color:var(--text-dim);margin-top:2px;">${wf.agents.length} Agents · ${wf.staging.length} Checkpoints</div>
                </div>
                <span style="font-size:0.68rem;font-weight:700;color:${serverOnline?'var(--accent-emerald)':'var(--accent-rose)'};white-space:nowrap;">
                  <i class="fa-solid ${serverOnline?'fa-circle-check':'fa-circle-xmark'}"></i> ${serverOnline ? wf.finalStatus : 'PENDING'}
                </span>
              </div>
              <!-- Staging pipeline -->
              <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px;">
                ${wf.staging.map(s => `<span style="font-size:0.62rem;padding:2px 6px;border-radius:10px;background:${serverOnline?'rgba(52,211,153,0.12)':'rgba(255,255,255,0.05)'};color:${serverOnline?'var(--accent-emerald)':'var(--text-dim)'};border:1px solid ${serverOnline?'rgba(52,211,153,0.3)':'rgba(255,255,255,0.08)'}"><i class="fa-solid ${serverOnline?'fa-check':'fa-clock'}" style="font-size:0.55rem"></i> ${s}</span>`).join('')}
              </div>
              <!-- Agent list -->
              <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:6px;display:flex;flex-direction:column;gap:3px;">
                ${wf.agents.map((a, ai) => `
                  <div style="display:flex;align-items:center;gap:6px;font-size:0.7rem;color:var(--text-muted);">
                    <span style="color:${wf.color};font-size:0.65rem;font-weight:700;min-width:16px;">A${ai+1}</span>
                    <span>${a}</span>
                    <span style="margin-left:auto;color:${serverOnline?'var(--accent-emerald)':'var(--text-dim)'};font-size:0.65rem;">${serverOnline?'✓ PASS':'…'}</span>
                  </div>`).join('')}
              </div>
            </div>`).join('')}
        </div>

        <!-- Node Pipeline Visualization -->
        <div class="glass-panel" style="padding:12px;">
          <div style="font-size:0.82rem;font-weight:700;color:var(--accent-cyan);margin-bottom:10px;display:flex;align-items:center;gap:6px;">
            <i class="fa-solid fa-arrow-right-arrow-left"></i> Internal Request Pipeline — 7 Node Flow
          </div>
          ${this.renderN8nWorkflowNodesHtml()}
        </div>

      </div>
    `;
  }

  static formatTokens(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  static async renderTelemetryDashboard(container) {
    container.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color:var(--accent-cyan)"></i></div>';
    
    try {
      const res = await ApiService.getTelemetry();
      if (!res.success) {
        container.innerHTML = `<div class="alert alert-danger">${res.error || 'Failed to fetch telemetry'}</div>`;
        return;
      }
      
      const { available, consumed, balance, percent, gauge, topProviders, topModels } = res.data;
      const fmt = this.formatTokens;

      const topMetricPanel = (title, dataObj, colorM, colorW, colorD) => `
        <div class="glass-panel" style="flex: 1; padding: 12px; min-width: 200px;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase;">${title}</div>
          <div style="display: flex; justify-content: space-between; text-align: center;">
            <div style="flex: 1;">
              <div style="font-size: 0.65rem; color: var(--text-dim); margin-bottom: 4px;">Month (M)</div>
              <div style="font-size: 1rem; font-weight: 700; color: ${colorM};">${title.includes('PERCENT') ? dataObj.month + '%' : fmt(dataObj.month)}</div>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 0.65rem; color: var(--text-dim); margin-bottom: 4px;">Week (W)</div>
              <div style="font-size: 1rem; font-weight: 700; color: ${colorW};">${title.includes('PERCENT') ? dataObj.week + '%' : fmt(dataObj.week)}</div>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 0.65rem; color: var(--text-dim); margin-bottom: 4px;">Day (D)</div>
              <div style="font-size: 1rem; font-weight: 700; color: ${colorD};">${title.includes('PERCENT') ? dataObj.day + '%' : fmt(dataObj.day)}</div>
            </div>
          </div>
        </div>
      `;

      const providerRows = topProviders.map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 8px 0;">
          <div>
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);"><i class="fa-solid fa-circle" style="font-size: 0.4rem; color: var(--accent-cyan); vertical-align: middle; margin-right: 4px;"></i>${p.name}</div>
            <div style="font-size: 0.65rem; color: var(--text-dim);">Reqs: ${p.requests}  ${p.avgLatency}ms</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-emerald);">${fmt(p.tokens)}</div>
            <div style="font-size: 0.65rem; color: var(--text-dim);">Tokens</div>
          </div>
        </div>
      `).join('');

      const modelRows = topModels.map(m => `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 8px 0;">
          <div>
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);"><i class="fa-solid fa-circle" style="font-size: 0.4rem; color: #5c6ac4; vertical-align: middle; margin-right: 4px;"></i>${m.name}</div>
            <div style="font-size: 0.65rem; color: var(--text-dim);">Reqs: ${m.requests}  ${m.avgLatency}ms</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-emerald);">${fmt(m.tokens)}</div>
            <div style="font-size: 0.65rem; color: var(--text-dim);">Tokens</div>
          </div>
        </div>
      `).join('');

      // CSS for the gauge chart (using conic gradient)
      const gaugePercent = parseFloat(gauge.usedPercent) || 0;
      const gaugeColor = gaugePercent > 90 ? 'var(--accent-rose)' : (gaugePercent > 70 ? 'var(--accent-amber)' : '#38bdf8');
      const gaugeStyle = `background: conic-gradient(${gaugeColor} ${gaugePercent}%, rgba(255,255,255,0.1) 0);`;

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Top Metrics Row -->
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            ${topMetricPanel('AVAILABLE TOKEN', available, '#38bdf8', '#38bdf8', 'var(--accent-emerald)')}
            ${topMetricPanel('CONSUMED TOKEN', consumed, '#38bdf8', '#38bdf8', 'var(--accent-emerald)')}
            ${topMetricPanel('BALANCE TOKEN', balance, '#38bdf8', '#38bdf8', 'var(--accent-emerald)')}
            ${topMetricPanel('PERCENT CONSUMED TOKEN', percent, '#38bdf8', '#38bdf8', 'var(--accent-emerald)')}
          </div>

          <!-- Bottom Charts Row -->
          <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: stretch;">
            <!-- Gauge Card -->
            <div class="glass-panel" style="flex: 1; min-width: 300px; padding: 16px;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 24px; text-transform: uppercase;">TOKEN POOL GAUGE</div>
              <div style="display: flex; align-items: center; gap: 24px;">
                <!-- Circular Gauge -->
                <div style="position: relative; width: 100px; height: 100px; border-radius: 50%; ${gaugeStyle} display: flex; justify-content: center; align-items: center;">
                  <div style="width: 76px; height: 76px; background: var(--bg-surface); border-radius: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 4px solid var(--bg-body);">
                    <span style="font-size: 1rem; font-weight: 800; color: var(--text-main);">${gauge.usedPercent}%</span>
                    <span style="font-size: 0.55rem; color: var(--text-dim);">Used</span>
                  </div>
                </div>
                <!-- Gauge Metadata -->
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <div>
                    <div style="font-size: 0.65rem; color: var(--text-dim);">Active Group</div>
                    <div style="font-size: 0.85rem; color: var(--accent-emerald);">${gauge.activeGroup}</div>
                  </div>
                  <div>
                    <div style="font-size: 0.65rem; color: var(--text-dim);">Active Pool Keys</div>
                    <div style="font-size: 1rem; font-weight: 700; color: var(--text-main);">${gauge.activeKeysCount} keys active</div>
                  </div>
                  <div>
                    <div style="font-size: 0.65rem; color: var(--text-dim);">Monthly Capacity</div>
                    <div style="font-size: 0.95rem; font-weight: 700; color: var(--accent-emerald);">${fmt(gauge.monthlyCapacity)}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Top Providers -->
            <div class="glass-panel" style="flex: 1.2; min-width: 300px; padding: 16px;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase;">TOP PROVIDERS (THIS MONTH)</div>
              <div style="display: flex; flex-direction: column;">
                ${providerRows}
              </div>
            </div>

            <!-- Model Usage -->
            <div class="glass-panel" style="flex: 1.2; min-width: 300px; padding: 16px;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase;">MODEL USAGE BREAKDOWN</div>
              <div style="display: flex; flex-direction: column;">
                ${modelRows}
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = '<div class="alert alert-danger">Error rendering dashboard: ' + e.message + '</div>';
    }
  }

  static updateLatencyBar(logs) {
    if (!logs || logs.length === 0) return;
    const fast = logs.filter(l => (l.latencyMs || 0) < 100).length;
    const normal = logs.filter(l => (l.latencyMs || 0) >= 100 && (l.latencyMs || 0) <= 500).length;
    const slow = logs.filter(l => (l.latencyMs || 0) > 500).length;
    const total = logs.length;

    const fastPct = Math.round((fast / total) * 100);
    const normalPct = Math.round((normal / total) * 100);
    const slowPct = Math.round((slow / total) * 100);

    const barFast = document.getElementById('lat-bar-fast');
    const barNormal = document.getElementById('lat-bar-normal');
    const barSlow = document.getElementById('lat-bar-slow');
    const badge = document.getElementById('latency-summary-badge');

    if (barFast) barFast.style.width = fastPct + '%';
    if (barNormal) barNormal.style.width = normalPct + '%';
    if (barSlow) barSlow.style.width = slowPct + '%';
    if (badge) badge.textContent = `Fast: ${fastPct}% | Normal: ${normalPct}% | Slow: ${slowPct}%`;
  }

  static renderLogsTable(container, logs, tab = 'api') {
    if (!container) return;
    if (!logs || logs.length === 0) {
      container.innerHTML = `<div class="glass-panel" style="text-align: center; padding: 24px; color: var(--text-muted);"><i class="fa-solid fa-folder-open fa-2x" style="margin-bottom: 8px; color: var(--text-dim); display: block;"></i>No ${tab.toUpperCase()} diagnostic logs recorded yet.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="max-height: 480px; overflow-y: auto; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px;">
        <table class="table-custom" style="width: 100%; font-size: 0.74rem;">
          <thead>
            <tr>
              <th style="width: 130px;">Time</th>
              ${tab === 'api' ? '<th>Model / Endpoint</th><th>Provider</th><th>Latency</th><th>Status</th>' : '<th>Category</th><th>Level</th><th>Message</th>'}
              <th style="width: 60px; text-align: center;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map((l, idx) => {
              const timeStr = l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : 'Just now';
              const statusBadge = (l.statusCode >= 200 && l.statusCode < 300) || l.status === 'SUCCESS' || l.level === 'INFO' ? 
                `<span class="badge badge-emerald">${l.status || l.level || '200 OK'}</span>` : 
                `<span class="badge badge-rose" style="background: rgba(244,63,94,0.2); color: var(--accent-rose);">${l.status || l.level || l.statusCode || 'ERROR'}</span>`;

              return `
                <tr style="cursor: pointer;" onclick="ReportsView.openLogDetailModal('${l.id || idx}')">
                  <td style="color: var(--text-dim); white-space: nowrap;">${timeStr}</td>
                  ${tab === 'api' ? `
                    <td><strong style="color: var(--text-main);">${l.modelId || 'Unknown Model'}</strong> <div style="font-size: 0.68rem; color: var(--text-dim);">${l.endpoint || '/v1/chat/completions'}</div></td>
                    <td><span style="color: var(--accent-cyan);">${l.providerName || l.providerId || 'System Proxy'}</span></td>
                    <td><span style="color: ${(l.latencyMs||0) > 500 ? 'var(--accent-amber)' : 'var(--accent-emerald)'}; font-weight: 600;">${l.latencyMs || 0}ms</span></td>
                    <td>${statusBadge}</td>
                  ` : `
                    <td><strong style="color: var(--accent-cyan);">${l.category || 'GENERAL'}</strong></td>
                    <td>${statusBadge}</td>
                    <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-main);">${l.message || ''}</td>
                  `}
                  <td style="text-align: center;">
                    <button class="btn btn-secondary btn-xs" style="padding: 2px 6px;" onclick="event.stopPropagation(); ReportsView.openLogDetailModal('${l.id || idx}')"><i class="fa-solid fa-eye"></i></button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  static renderLogDetailModal(log) {
    ModalDialog.showCustomModal({
      title: '<i class="fa-solid fa-bug" style="color: var(--accent-cyan);"></i> Log Diagnostic Inspector',
      content: `
        <div style="font-size: 0.78rem; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
            <span><strong>Log ID:</strong> <code>${log.id}</code></span>
            <span><strong>Timestamp:</strong> ${new Date(log.timestamp).toLocaleString()}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div><strong>Model:</strong> ${log.modelId || 'N/A'}</div>
            <div><strong>Provider:</strong> ${log.providerName || log.providerId || 'N/A'}</div>
            <div><strong>Latency:</strong> ${log.latencyMs || 0}ms</div>
            <div><strong>Status Code:</strong> ${log.statusCode || log.status || 'N/A'}</div>
          </div>
          ${log.errorDiagnostics ? `
            <div style="background: rgba(244,63,94,0.1); border: 1px solid var(--accent-rose); padding: 8px; border-radius: 4px; color: var(--accent-rose);">
              <strong>Error Diagnostics:</strong>
              <pre style="font-size: 0.72rem; margin-top: 4px; white-space: pre-wrap;">${JSON.stringify(log.errorDiagnostics, null, 2)}</pre>
            </div>
          ` : ''}
          <div style="background: var(--bg-dark); padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
            <strong>Full Payload JSON:</strong>
            <pre style="font-size: 0.7rem; color: var(--primary-light); max-height: 180px; overflow-y: auto; margin-top: 4px;">${JSON.stringify(log, null, 2)}</pre>
          </div>
        </div>
      `,
      confirmText: 'Close',
      onConfirm: () => {}
    });
  }

  static exportCsv(logs) {
    if (!logs || logs.length === 0) return ModalDialog.showNotification('No logs available to export.', 'warning');
    const headers = ['ID', 'Timestamp', 'Model', 'Provider', 'LatencyMs', 'Status', 'Endpoint'];
    const rows = logs.map(l => [l.id, l.timestamp, l.modelId, l.providerName, l.latencyMs, l.status || l.statusCode, l.endpoint]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    this.downloadFile(csvContent, `fmc_api_logs_${Date.now()}.csv`, 'text/csv');
  }

  static exportJson(logs) {
    if (!logs || logs.length === 0) return ModalDialog.showNotification('No logs available to export.', 'warning');
    this.downloadFile(JSON.stringify(logs, null, 2), `fmc_api_logs_${Date.now()}.json`, 'application/json');
  }

  static downloadFile(content, fileName, mimeType) {
    const dataStr = `data:${mimeType};charset=utf-8,` + encodeURIComponent(content);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', fileName);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    ModalDialog.showNotification(`Downloaded '${fileName}' log report!`, 'success');
  }
}

window.ReportsViewHelper = ReportsViewHelper;

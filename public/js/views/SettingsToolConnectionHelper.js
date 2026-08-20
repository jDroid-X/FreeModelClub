/**
 * SettingsToolConnectionHelper.js
 * Purpose: Helper for SettingsView Tool Connection tab — tool selection grid,
 *          Integration & Connect Agent script generation, auto-inject, and save config.
 * Dependencies: ApiService, ModalDialog, SettingsAgentHelper, SettingsViewHelper
 */

class SettingsToolConnectionHelper {
  static renderTab(container, combos = [], attached = {}) {
    const safeCombos = Array.isArray(combos) ? combos : [];
    const comboOptions = safeCombos.length > 0
      ? safeCombos.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
      : `<option value="">-- No Combos Available --</option>`;

    const toolBtnHtml = (id, icon, color, label) => `
      <button class="btn btn-secondary btn-sm" onclick="SettingsView.onSelectConnectTool('${id}')" id="tool-btn-${id}"
        style="display:flex;flex-direction:column;align-items:center;padding:8px 4px;gap:6px;text-align:center;">
        <i class="${icon}" style="font-size:1.3rem;color:${color};"></i>
        <span style="font-size:0.65rem;">${label}</span>
      </button>`;

    container.innerHTML = `
      <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h3 style="font-size:1.1rem;color:var(--text-main);margin-bottom:4px;"><i class="fa-solid fa-plug-circle-bolt"></i> Universal AI Tools Integration</h3>
          <p style="font-size:0.8rem;color:var(--text-muted);">Configure tool connections via the Integration &amp; Connect Agent.</p>
        </div>
      </div>

      <!-- Conflict Resolution Strategy Panel -->
      <div class="glass-card" style="padding:14px;border-left:3px solid var(--accent-amber);margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <i class="fa-solid fa-shield-halved" style="font-size:1.2rem;color:var(--accent-amber);"></i>
          <div>
            <h5 style="margin:0;font-size:0.92rem;color:var(--text-main);">Multi-Tool Conflict Resolution</h5>
            <span style="font-size:0.7rem;color:var(--text-muted);">Configure how the proxy handles concurrent requests from multiple AI tools targeting the same model</span>
          </div>
        </div>
        <div id="conflict-strategy-panel" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start;">
          <div style="flex:1;min-width:200px;">
            <label style="font-size:0.78rem;color:var(--primary-light);font-weight:600;display:block;margin-bottom:6px;">Active Strategy:</label>
            <select id="conflict-strategy-select" class="form-control" style="font-size:0.8rem;" onchange="SettingsToolConnectionHelper.previewStrategy(this.value)">
              <option value="allow">Allow (Both proceed simultaneously)</option>
              <option value="queue">Queue (2s delay for 2nd request)</option>
              <option value="redirect">Redirect (Route to next available model)</option>
              <option value="reject">Reject (Return 429 busy error)</option>
            </select>
          </div>
          <div style="flex:2;min-width:300px;">
            <div id="strategy-preview" style="background:rgba(0,0,0,0.2);padding:10px;border-radius:6px;font-size:0.75rem;color:var(--text-muted);min-height:60px;line-height:1.5;">
              <i class="fa-solid fa-circle-info" style="color:var(--accent-cyan);margin-right:4px;"></i>
              <strong>Allow:</strong> Both tools proceed with requests to the same model simultaneously. No restrictions. Best for low-traffic scenarios.
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;justify-content:flex-end;">
            <button class="btn btn-primary btn-xs" onclick="SettingsToolConnectionHelper.saveConflictStrategy()">
              <i class="fa-solid fa-floppy-disk"></i> Save Strategy
            </button>
            <button class="btn btn-secondary btn-xs" onclick="SettingsToolConnectionHelper.testConflictStrategy()">
              <i class="fa-solid fa-vial"></i> Test with 2 Tools
            </button>
          </div>
        </div>
        <div id="conflict-strategy-status" style="margin-top:8px;font-size:0.72rem;display:none;"></div>
      </div>

      <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;">
        <div style="flex:1;min-width:320px;display:flex;flex-direction:column;gap:12px;">
          <div class="glass-card" style="padding:14px;">
            <div class="form-group" style="margin-bottom:12px;">
              <label style="font-size:0.8rem;color:var(--primary-light);">Select Model Name (Combo):</label>
              <select id="connect-combo-select" class="form-control" style="font-size:0.8rem;">${comboOptions}</select>
            </div>
            <div style="font-size:0.8rem;color:var(--primary-light);font-weight:700;margin-bottom:6px;">Select Target Tool:</div>

            <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:4px;margin-top:8px;text-transform:uppercase;letter-spacing:0.5px;">IDE Tools</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin-bottom:8px;">
              ${toolBtnHtml('vscode','fa-solid fa-code','var(--accent-cyan)','VS Code')}
              ${toolBtnHtml('cursor','fa-solid fa-terminal','var(--accent-emerald)','Cursor IDE')}
              ${toolBtnHtml('windsurf','fa-solid fa-water','#f97316','Windsurf IDE')}
              ${toolBtnHtml('cline','fa-solid fa-terminal','#3b82f6','Cline')}
            </div>

            <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Desktop Apps</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin-bottom:8px;">
              ${toolBtnHtml('claude','fa-solid fa-message','var(--accent-amber)','Claude Desktop')}
              ${toolBtnHtml('jan','fa-solid fa-robot','var(--accent-rose)','Jan.ai')}
              ${toolBtnHtml('anythingllm','fa-solid fa-database','#a855f7','AnythingLLM')}
            </div>

            <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Web Clients</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin-bottom:8px;">
              ${toolBtnHtml('openwebui','fa-solid fa-globe','#e2e8f0','Open WebUI')}
              ${toolBtnHtml('lovable','fa-solid fa-heart','#ef4444','Lovable')}
              ${toolBtnHtml('bolt','fa-solid fa-bolt','#eab308','Bolt.new')}
            </div>

            <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Generic Agents & CLI</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin-bottom:4px;">
              ${toolBtnHtml('pearai','fa-solid fa-leaf','#14b8a6','PearAI')}
              ${toolBtnHtml('mcp','fa-solid fa-network-wired','var(--primary-light)','MCP Server')}
            </div>
          </div>
          <div class="glass-card" style="padding:14px;border-left:4px solid var(--accent-rose);">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <i class="fa-solid fa-user-tie" style="font-size:1.3rem;color:var(--accent-rose);"></i>
              <div>
                <h4 style="font-size:0.98rem;color:var(--text-main);margin:0;">Integration &amp; Connect Agent</h4>
                <span style="font-size:0.72rem;color:var(--text-muted);">Working Behind the Scenes</span>
              </div>
            </div>
            <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:10px;">Generates setup instructions, MCP connection scripts, and environment configuration using AI.</p>
            <div style="background:rgba(0,0,0,0.2);padding:8px;border-radius:6px;margin-bottom:10px;">
              <div style="font-size:0.73rem;color:var(--accent-cyan);font-weight:600;margin-bottom:4px;">
                Attached: <strong style="color:var(--text-main);">${attached.modelName || attached.modelId}</strong> (${attached.providerName || 'Active Provider'})
              </div>
              <div style="display:flex;gap:4px;flex-wrap:wrap;">
                <span style="font-size:0.68rem;background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px;">Script Generation</span>
                <span style="font-size:0.68rem;background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px;">Tool Integration</span>
              </div>
            </div>
            <div style="display:flex;gap:6px;flex-direction:column;">
              <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center;" onclick="SettingsView.generateAgentConnection()">
                <i class="fa-solid fa-wand-magic-sparkles" style="margin-right:6px;"></i> Generate AI Integration Scripts
              </button>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-secondary btn-xs" style="border-color:var(--accent-rose);" onclick="SettingsView.openRocasModal('connect_agent')">
                  <i class="fa-solid fa-note-sticky" style="color:var(--accent-rose);margin-right:4px;"></i> ROCAS Memo
                </button>
                <button class="btn btn-secondary btn-xs" style="border-color:var(--accent-rose);" onclick="SettingsView.openAgentModelModal('connect_agent')">
                  <i class="fa-solid fa-cubes" style="color:var(--accent-rose);margin-right:4px;"></i> Model Config
                </button>
              </div>
            </div>
          </div>
        </div>
        <div style="flex:1.5;min-width:400px;display:flex;flex-direction:column;gap:12px;">
          <div class="glass-card" style="padding:14px;border-left:3px solid var(--accent-cyan);">
            <h5 style="margin:0 0 8px;font-size:0.9rem;color:var(--text-main);"><i class="fa-solid fa-list-ol"></i> Integration Instructions</h5>
            <div id="connect-agent-instructions-box" style="font-size:0.78rem;color:var(--text-muted);line-height:1.5;min-height:150px;background:rgba(0,0,0,0.2);padding:10px;border-radius:6px;overflow-y:auto;">
              <em>Select a tool and click Generate to see instructions...</em>
            </div>
          </div>
          <div class="glass-card" style="padding:14px;border-left:3px solid var(--accent-emerald);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <h5 style="margin:0;font-size:0.9rem;color:var(--text-main);"><i class="fa-solid fa-terminal"></i> Auto Setup Script &amp; Backend Config</h5>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-primary btn-xs" onclick="SettingsView.autoInjectIdeConfig()"><i class="fa-solid fa-wand-magic-sparkles"></i> Auto-Inject into IDE</button>
                <button class="btn btn-secondary btn-xs" onclick="navigator.clipboard.writeText(document.getElementById('connect-agent-script-box').textContent); ModalDialog.showNotification('Script copied!','success');"><i class="fa-solid fa-copy"></i> Copy Script</button>
              </div>
            </div>
            <div style="min-height:150px;background:rgba(0,0,0,0.3);padding:10px;border-radius:6px;overflow-x:auto;">
              <pre class="code-box" style="font-size:0.75rem;margin:0;white-space:pre-wrap;word-wrap:break-word;"><code id="connect-agent-script-box">/* Script will appear here */</code></pre>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:12px;">
              <button class="btn btn-primary btn-sm" onclick="SettingsView.runConnectAgentTool()">
                <i class="fa-solid fa-save" style="margin-right:6px;"></i> Save Backend Connection Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    // Auto-load saved conflict strategy from config.json
    setTimeout(() => this.loadConflictStrategy(), 100);
  }

  static onSelectConnectTool(toolId) {
    this._selectedConnectTool = toolId;
    const allTools = ['vscode','cursor','claude','jan','anythingllm','openwebui','cline','pearai','windsurf','lovable','bolt','mcp'];
    allTools.forEach(t => {
      const btn = document.getElementById(`tool-btn-${t}`);
      if (!btn) return;
      if (t === toolId) {
        btn.classList.add('active');
        btn.style.borderColor = 'var(--accent-cyan)';
        btn.style.background = 'rgba(6,182,212,0.1)';
      } else {
        btn.classList.remove('active');
        btn.style.borderColor = 'var(--border-color)';
        btn.style.background = 'transparent';
      }
    });
  }

  static buildAgentPrompt(toolId, comboName, apiKey, rocasSpecs) {
    return `You are the Integration & Connect Agent for FreeModelsClub (FMC) — a local OpenAI-compatible proxy running at http://localhost:12247/v1.
The user wants to connect the tool "${toolId}" to this proxy server.
They have chosen the Model Combo "${comboName}".
Their API key for the proxy is "${apiKey}".

===== CRITICAL ARCHITECTURE KNOWLEDGE =====
1. FMC PROXY IS FULLY OPENAI & ANTHROPIC COMPATIBLE: Runs locally at http://localhost:12247. Exposes /v1/models, /v1/chat/completions, /v1/messages, /messages.
2. PREVENT PROTOCOL TYPOS: Never prefix with https://http// or duplicate http://. Use STRICTLY: http://localhost:12247 (or http://127.0.0.1:12247).
3. DESKTOP CLIENT CONFIG: Set API BASE URL to "http://localhost:12247". Do NOT append extra /v1 if client auto-appends /v1/messages.
4. UNIVERSAL IDE / AGENT CONFIG (Tool-Wise Routing): Many upstream providers (like AgentRouter, OpenRouter) restrict models based on the Client Tool. Always inject custom headers if supported by your IDE (e.g. Cursor, Cline):
   { 
     "name": "FreeModelsClub-FMC",
     "vendor": "openai-compatible",
     "baseUrl": "http://localhost:12247/v1",
     "apiKey": "${apiKey}",
     "customHeaders": { 
        "X-Title": "FreeModelsClub - My IDE", 
        "X-Tool-Name": "My-IDE-Name" 
     }
   }
===========================================

Provide highly detailed step-by-step instructions and a comprehensive setup script.
Return STRICTLY as JSON object: { "instructions": "...", "script": "..." }. No markdown, no extra text.`;
  }

  // ── Conflict Resolution Strategy UI Methods ──

  static STRATEGY_DESCRIPTIONS = {
    allow:   '<i class="fa-solid fa-circle-info" style="color:var(--accent-cyan);margin-right:4px;"></i><strong>Allow:</strong> Both tools proceed with requests to the same model simultaneously. No restrictions. Best for low-traffic scenarios where concurrent usage is acceptable.',
    queue:   '<i class="fa-solid fa-clock" style="color:var(--accent-amber);margin-right:4px;"></i><strong>Queue:</strong> The second tool waits 2 seconds before its request proceeds. Prevents burst spikes. Good balance between fairness and throughput.',
    redirect: '<i class="fa-solid fa-shuffle" style="color:var(--accent-emerald);margin-right:4px;"></i><strong>Redirect:</strong> Automatically routes the second tool to the next available model in the combo pool. Best for combo agents with multiple pooled models.',
    reject:  '<i class="fa-solid fa-ban" style="color:var(--accent-rose);margin-right:4px;"></i><strong>Reject:</strong> Returns HTTP 429 "Model Busy" error to the second tool. Use when you want strict single-occupancy per model. Prevents any resource contention.'
  };

  static previewStrategy(strategy) {
    const el = document.getElementById('strategy-preview');
    if (el) el.innerHTML = this.STRATEGY_DESCRIPTIONS[strategy] || this.STRATEGY_DESCRIPTIONS.allow;
  }

  static async loadConflictStrategy() {
    try {
      const res = await ApiService.getSystemConfig();
      const config = res.config || {};
      const strategy = config.conflict_resolution_strategy || 'allow';
      const select = document.getElementById('conflict-strategy-select');
      if (select) {
        select.value = strategy;
        this.previewStrategy(strategy);
      }
    } catch (e) {
      console.warn('Failed to load conflict strategy:', e);
    }
  }

  static async saveConflictStrategy() {
    const select = document.getElementById('conflict-strategy-select');
    const statusEl = document.getElementById('conflict-strategy-status');
    if (!select) return;

    const strategy = select.value;
    try {
      const res = await ApiService.saveSystemConfig({ conflict_resolution_strategy: strategy });
      if (res.success) {
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.innerHTML = `<i class="fa-solid fa-check-circle" style="color:var(--accent-emerald);"></i> Strategy saved: <strong>${strategy.toUpperCase()}</strong> — Active immediately.`;
          statusEl.style.color = 'var(--accent-emerald)';
          setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
        }
        ModalDialog.showNotification(`Conflict resolution strategy set to "${strategy.toUpperCase()}"`, 'success');
      } else {
        ModalDialog.showNotification('Failed to save strategy: ' + (res.error || 'Unknown error'), 'error');
      }
    } catch (e) {
      ModalDialog.showNotification('Save error: ' + e.message, 'error');
    }
  }

  static async testConflictStrategy() {
    const strategy = document.getElementById('conflict-strategy-select')?.value || 'allow';
    ModalDialog.showModal({
      title: 'Test Conflict Resolution',
      icon: 'fa-flask-vial',
      body: `
        <div style="font-size:0.85rem;color:var(--text-main);line-height:1.6;">
          <p>This will send <strong>2 concurrent requests</strong> to the same model from different simulated tools to test the <strong style="color:var(--accent-cyan);">${strategy.toUpperCase()}</strong> strategy.</p>
          <div style="background:rgba(0,0,0,0.2);padding:10px;border-radius:6px;margin:10px 0;">
            <div style="font-size:0.78rem;color:var(--text-muted);"><strong>Simulated scenario:</strong></div>
            <div style="font-size:0.78rem;margin-top:4px;">
              <span style="color:var(--accent-cyan);">Tool A (IDE Tool)</span> → Model: llama-3.3-70b<br/>
              <span style="color:var(--accent-rose);">Tool B (Desktop App)</span> → Model: default-fallback-model (same model!)
            </div>
          </div>
          <p style="font-size:0.78rem;color:var(--text-muted);">Strategy behavior: <em>${this.STRATEGY_DESCRIPTIONS[strategy]?.replace(/<[^>]*>/g, '') || 'Both proceed'}</em></p>
        </div>
      `,
      confirmText: 'Run Test',
      onConfirm: async () => {
        ModalDialog.showNotification('Sending 2 concurrent test requests...', 'info');
        try {
          const testPayload = { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'Test conflict resolution' }], stream: false };
          const authH = ApiService.getAuthHeader();
          const headers1 = { 'Content-Type': 'application/json', ...authH, 'X-Tool-Name': 'IDE Tool', 'X-Client-Id': 'test-tool-a' };
          const headers2 = { 'Content-Type': 'application/json', ...authH, 'X-Tool-Name': 'Desktop App', 'X-Client-Id': 'test-tool-b' };
          const [res1, res2] = await Promise.allSettled([
            fetch('/v1/chat/completions', { method: 'POST', headers: headers1, body: JSON.stringify(testPayload) }),
            fetch('/v1/chat/completions', { method: 'POST', headers: headers2, body: JSON.stringify(testPayload) })
          ]);
          const status1 = res1.status === 'fulfilled' ? res1.value.status : 'error';
          const status2 = res2.status === 'fulfilled' ? res2.value.status : 'error';
          ModalDialog.showNotification(`Test complete! Tool A: ${status1} | Tool B: ${status2} | Strategy: ${strategy.toUpperCase()}`, status1 < 400 && status2 < 400 ? 'success' : 'warning');
        } catch (e) {
          ModalDialog.showNotification('Test failed: ' + e.message, 'error');
        }
      }
    });
  }
}

window.SettingsToolConnectionHelper = SettingsToolConnectionHelper;

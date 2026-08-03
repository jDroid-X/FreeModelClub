/**
 * SettingsToolConnectionHelper.js
 * Purpose: Helper for SettingsView Tool Connection tab — tool selection grid,
 *          Integration & Connect Agent script generation, auto-inject, and save config.
 * Dependencies: ApiService, ModalDialog, SettingsAgentHelper, SettingsViewHelper
 */

class SettingsToolConnectionHelper {
  static renderTab(container, combos, attached) {
    const comboOptions = combos.length > 0
      ? combos.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
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
      <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;">
        <div style="flex:1;min-width:320px;display:flex;flex-direction:column;gap:12px;">
          <div class="glass-card" style="padding:14px;">
            <div class="form-group" style="margin-bottom:12px;">
              <label style="font-size:0.8rem;color:var(--primary-light);">Select Model Name (Combo):</label>
              <select id="connect-combo-select" class="form-control" style="font-size:0.8rem;">${comboOptions}</select>
            </div>
            <div style="font-size:0.8rem;color:var(--primary-light);font-weight:700;margin-bottom:6px;">Select Target Tool:</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;margin-bottom:4px;">
              ${toolBtnHtml('vscode','fa-solid fa-code','var(--accent-cyan)','VS Code')}
              ${toolBtnHtml('antigravity','fa-solid fa-rocket','var(--accent-emerald)','Antigravity')}
              ${toolBtnHtml('claude','fa-solid fa-message','var(--accent-amber)','Claude')}
              ${toolBtnHtml('cline','fa-solid fa-robot','var(--accent-rose)','Cline')}
              ${toolBtnHtml('continue','fa-solid fa-forward-step','#a855f7','Continue')}
              ${toolBtnHtml('copilot','fa-brands fa-github','#e2e8f0','Copilot')}
              ${toolBtnHtml('cursor','fa-solid fa-arrow-pointer','#3b82f6','Cursor')}
              ${toolBtnHtml('windsurf','fa-solid fa-wind','#14b8a6','Windsurf')}
              ${toolBtnHtml('codegpt','fa-solid fa-brain','#f97316','CodeGPT')}
              ${toolBtnHtml('tabnine','fa-solid fa-9','#ef4444','Tabnine')}
              ${toolBtnHtml('amazonq','fa-brands fa-aws','#eab308','Amazon Q')}
              ${toolBtnHtml('openclaw','fa-solid fa-paw','var(--primary-light)','Openclaw')}
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
  }

  static onSelectTool(toolId) {
    const allTools = ['vscode','antigravity','claude','cline','continue','copilot','cursor','windsurf','codegpt','tabnine','amazonq','openclaw'];
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
1. FMC PROXY IS FULLY OPENAI-COMPATIBLE: Runs at http://localhost:12247/v1. Exposes /v1/models, /v1/chat/completions, /v1/messages (Anthropic-compatible).
2. CORRECT VS CODE VENDOR TYPE: Use vendor "openai-compatible" NOT "customendpoint". Min config:
   { "name":"FreeModelsClub-FMC","vendor":"openai-compatible","baseUrl":"http://localhost:12247/v1","apiKey":"${apiKey}" }
3. Only use customendpoint + models[] if tool has NO support for openai-compatible vendor type.
4. MCP SERVER CONFIG: Use SSE transport with url: http://localhost:12247/v1. Proxy is CORS-enabled.
${rocasSpecs ? `\nADDITIONAL AGENT SPECS:\n${rocasSpecs}` : ''}
===========================================

Provide highly detailed step-by-step instructions and a comprehensive setup script.
Return STRICTLY as JSON object: { "instructions": "...", "script": "..." }. No markdown, no extra text.`;
  }
}

window.SettingsToolConnectionHelper = SettingsToolConnectionHelper;

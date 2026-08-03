/**
 * RegistrationViewHelper.js
 * Purpose: Helper module for RegistrationView containing preset provider mappings,
 *          staged models HTML table renderer, and Provider Agent popup card renderer (< 200 lines).
 */

class RegistrationViewHelper {
  static getPredefinedProviders() {
    return [
      { id: 'prov_groq', name: 'Groq', proto: 'Groq API', icon: 'fa-bolt', color: 'var(--accent-cyan)' },
      { id: 'prov_openrouter', name: 'OpenRouter', proto: 'OpenRouter Free', icon: 'fa-globe', color: 'var(--accent-emerald)' },
      { id: 'prov_gemini', name: 'Gemini', proto: 'Gemini API', icon: 'fa-atom', color: 'var(--primary-light)' },
      { id: 'prov_together', name: 'Together AI', proto: 'Together API', icon: 'fa-handshake', color: 'var(--accent-amber)' },
      { id: 'prov_mistral', name: 'Mistral', proto: 'Mistral API', icon: 'fa-wind', color: 'var(--accent-cyan)' },
      { id: 'prov_ollama', name: 'Ollama Local', proto: 'Ollama Local API', icon: 'fa-server', color: 'var(--accent-emerald)' },
      { id: 'prov_monkeycode_30m', name: 'Chaitin MonkeyCode (30M Free)', proto: 'OpenAI Compatible', icon: 'fa-cubes', color: '#a855f7' },
      { id: 'prov_custom', name: 'Custom', proto: 'OpenAI Compatible', icon: 'fa-gears', color: 'var(--text-dim)' }
    ];
  }

  static renderStagedTableHtml(stagedModels) {
    if (!stagedModels || stagedModels.length === 0) {
      return `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin: 10px 0;">No models staged yet. Select checkboxes above and click <strong>'Add Selected'</strong> or use <strong>Provider Agent</strong>.</p>`;
    }

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn btn-secondary btn-xs" onclick="RegistrationView.toggleSelectAllStagedModels(true)">
            <i class="fa-solid fa-check-double"></i> Select All
          </button>
          <button type="button" class="btn btn-secondary btn-xs" onclick="RegistrationView.toggleSelectAllStagedModels(false)">
            <i class="fa-solid fa-xmark"></i> Unselect All
          </button>
        </div>
        <button type="button" class="btn btn-danger btn-xs" onclick="RegistrationView.removeSelectedStagedModels()">
          <i class="fa-solid fa-trash"></i> Remove Selected
        </button>
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
          ${stagedModels.map(m => `
            <tr>
              <td style="text-align: center;"><input type="checkbox" class="staged-model-cb" value="${m.id}" /></td>
              <td><strong style="color: var(--text-main);">${typeof FormatHelper !== 'undefined' ? FormatHelper.sanitizeModelName(m.modelName || m.name || m.modelId) : (m.modelName || m.name || m.modelId)}</strong></td>
              <td><span style="color: var(--accent-cyan);">${m.family || 'General'}</span></td>
              <td>${m.coreSkill || 'General Knowledge'}</td>
              <td>${m.contextWindow ? (typeof m.contextWindow === 'number' ? (m.contextWindow / 1000) + 'k' : m.contextWindow) : '128k'} tokens</td>
              <td>
                <button type="button" class="btn btn-danger btn-xs" onclick="RegistrationView.removeStagedModel('${m.id}')">
                  <i class="fa-solid fa-trash"></i> Remove
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  static renderProviderAgentModalHtml(initialQuery = '') {
    const chips = ['SambaNova', 'NVIDIA', 'Groq', 'Gemini', 'OpenRouter', 'Together', 'Cerebras', 'Ollama', 'Hyperbolic', 'DeepSeek', 'Mistral'];
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
              <input type="text" id="agent-provider-query" class="form-control" placeholder="e.g. SambaNova, NVIDIA, Groq, Gemini, Cerebras..." value="${initialQuery}" onkeydown="if(event.key==='Enter'){ event.preventDefault(); RegistrationView.runProviderAgentSearch(); }" />
              <button type="button" class="btn btn-emerald" onclick="RegistrationView.runProviderAgentSearch()" title="Check & Search Provider Info">
                <i class="fa-solid fa-circle-check"></i> Check & Search
              </button>
            </div>
          </div>

          <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 0.72rem; color: var(--text-muted);">Quick Suggestions:</span>
            ${chips.map(c => `
              <button type="button" class="btn btn-secondary btn-xs" style="padding: 2px 6px; font-size: 0.72rem;" onclick="document.getElementById('agent-provider-query').value='${c}'; RegistrationView.runProviderAgentSearch();">
                + ${c}
              </button>
            `).join('')}
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
      const cleanRawId = (p.rawId || p.id).replace(/^prov_/, '');
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

        <div class="grid-2" style="gap: 8px; font-size: 0.78rem; margin-bottom: 10px;">
          <div><strong>1. Provider ID:</strong> <code>${(p.rawId || p.id).replace(/^prov_/, '')}</code></div>
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
                    <strong style="color: var(--text-main); font-size: 0.78rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${typeof FormatHelper !== 'undefined' ? FormatHelper.sanitizeModelName(m.modelName || m.modelId) : (m.modelName || m.modelId)}</strong>
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

        <button type="button" class="btn btn-emerald" style="width: 100%; font-size: 0.82rem; padding: 8px;" onclick="RegistrationView.applyAgentProviderData('${encodeURIComponent(JSON.stringify(p))}')">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Apply & Auto-fill Registration Form
        </button>
      </div>
    `;
  }

  static getDefaultModelsForProtocol(proto) {
    if (proto === 'Groq API') {
      return [
        { id: 'llama-3.3-70b-versatile', name: 'Meta Llama 3.3 70B Versatile', family: 'Llama', coreSkill: 'General Reasoning' },
        { id: 'llama-3.1-8b-instant', name: 'Meta Llama 3.1 8B Instant', family: 'Llama', coreSkill: 'Fast Execution' },
        { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B', family: 'Qwen', coreSkill: 'Code Generation' },
        { id: 'gemma2-9b-it', name: 'Google Gemma 2 9B IT', family: 'Gemma', coreSkill: 'General Chat' },
        { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', family: 'DeepSeek', coreSkill: 'Reasoning & Math' },
        { id: 'llama-guard-3-8b', name: 'Meta Llama Guard 3 8B', family: 'Llama', coreSkill: 'Content Safety' },
        { id: 'mixtral-8x7b-32768', name: 'Mistral Mixtral 8x7B', family: 'Mistral', coreSkill: 'MoE Multilingual' }
      ];
    }
    if (proto === 'Gemini API') {
      return [
        { id: 'gemini-1.5-flash', name: 'Google Gemini 1.5 Flash', family: 'Gemini', coreSkill: 'Multimodal Speed' },
        { id: 'gemini-1.5-pro', name: 'Google Gemini 1.5 Pro', family: 'Gemini', coreSkill: 'Deep Analysis' },
        { id: 'gemini-2.0-flash-exp', name: 'Google Gemini 2.0 Flash Experimental', family: 'Gemini', coreSkill: 'Next-Gen Multimodal' },
        { id: 'gemini-2.0-flash-thinking-exp', name: 'Google Gemini 2.0 Flash Thinking Exp', family: 'Gemini', coreSkill: 'Chain of Thought' }
      ];
    }
    if (proto === 'OpenRouter Free') {
      return [
        { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta Llama 3.3 70B (Free)', family: 'Llama', coreSkill: 'General Reasoning' },
        { id: 'google/gemini-2.0-flash-exp:free', name: 'Google Gemini 2.0 Flash Exp (Free)', family: 'Gemini', coreSkill: 'Multimodal' },
        { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', family: 'DeepSeek', coreSkill: 'Reasoning & Math' },
        { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B (Free)', family: 'Qwen', coreSkill: 'Code Generation' },
        { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (Free)', family: 'Mistral', coreSkill: 'General Chat' }
      ];
    }
    if (proto === 'Together API') {
      return [
        { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Instruct Turbo', family: 'Llama', coreSkill: 'Fast Reasoning' },
        { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'Qwen 2.5 Coder 32B Instruct', family: 'Qwen', coreSkill: 'Code Generation' },
        { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1 Reasoning', family: 'DeepSeek', coreSkill: 'Math & Logic' }
      ];
    }
    if (proto === 'Mistral API') {
      return [
        { id: 'mistral-small-latest', name: 'Mistral Small 24B', family: 'Mistral', coreSkill: 'Multilingual & Code' },
        { id: 'codestral-latest', name: 'Codestral 22B', family: 'Mistral', coreSkill: 'Code Completion' },
        { id: 'open-mixtral-8x22b', name: 'Mixtral 8x22B MoE', family: 'Mistral', coreSkill: 'High Capacity MoE' }
      ];
    }
    if (proto === 'Ollama Local API') {
      return [
        { id: 'llama3.3:latest', name: 'Ollama Llama 3.3 Local', family: 'Llama', coreSkill: 'Local Reasoning' },
        { id: 'qwen2.5-coder:32b', name: 'Ollama Qwen 2.5 Coder Local', family: 'Qwen', coreSkill: 'Local Code Generation' },
        { id: 'deepseek-r1:70b', name: 'Ollama DeepSeek R1 Local', family: 'DeepSeek', coreSkill: 'Local Math & Logic' }
      ];
    }
    return [
      { id: 'llama-3.3-70b-instruct', name: 'Meta Llama 3.3 70B Instruct', family: 'Llama', coreSkill: 'General Reasoning' },
      { id: 'deepseek-r1', name: 'DeepSeek R1 Reasoning', family: 'DeepSeek', coreSkill: 'Deep Math & Logic' },
      { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B', family: 'Qwen', coreSkill: 'Code Generation' },
      { id: 'nemotron-70b-instruct', name: 'NVIDIA Nemotron 70B Instruct', family: 'Nemotron', coreSkill: 'Enterprise Logic' },
      { id: 'mistral-small-latest', name: 'Mistral Small 24B', family: 'Mistral', coreSkill: 'Multilingual & Code' }
    ];
  }

  static renderIntegrationDrawerContent(snippets = {}) {
    const curlSnippet = snippets.curl?.chatCompletions || `curl -X POST http://localhost:12247/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer fmc-live-key-jdroidxy-2026" \\
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Hello FMC Proxy!"}]
  }'`;

    const pythonSnippet = snippets.python?.chatCompletions || `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:12247/v1",
    api_key="fmc-live-key-jdroidxy-2026"
)

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "Hello FMC Localhost Proxy!"}]
)

print(response.choices[0].message.content)`;

    const jsSnippet = `const response = await fetch('http://localhost:12247/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer fmc-live-key-jdroidxy-2026'
  },
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: 'Hello FMC!' }]
  })
});
const data = await response.json();
console.log(data);`;

    const toolConfigSnippet = `{
  "vendor": "openai-compatible",
  "name": "FreeModelsClub Localhost Proxy",
  "api_base": "http://localhost:12247/v1",
  "api_key": "fmc-live-key-jdroidxy-2026"
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

  static escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.RegistrationViewHelper = RegistrationViewHelper;

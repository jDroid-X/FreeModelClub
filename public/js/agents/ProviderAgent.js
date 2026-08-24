/**
 * ProviderAgent.js
 * Purpose: Independent System Agent for Online Provider & Free Model Discovery (< 180 lines).
 *          Opens interactive Provider Agent popup modal, searches online AI endpoints,
 *          and applies discovered specs & staged models to registration forms.
 * Dependencies: ApiService, ModalDialog
 */

class ProviderAgent {
  static suggestions = ['Gemini', 'Groq', 'OpenRouter', 'NVIDIA', 'Bynara', 'ChatGPT / OpenAI', 'Perplexity', 'Cerebras', 'SambaNova', 'DeepSeek', 'Mistral', 'Together', 'Opencode', 'Ollama', 'AgentRouter', 'Poe', 'Morph', 'Comet'];
  static currentDiscoveredData = null;
  static cachedProviders = [];
  static cachedCombos = [];
  static cachedModels = [];

  static async openPopup(initialQuery = '') {
    this.currentDiscoveredData = null;
    const extraFooterHtml = `
      <button type="button" id="pa-footer-apply-btn" class="btn btn-emerald btn-sm" style="display: none; align-items: center; gap: 6px; font-weight: 600;" onclick="ProviderAgent.applyCurrentData()" title="Apply discovered specs and stage selected models to registration form">
        <i class="fa-solid fa-circle-check"></i> Apply Specs & Models
      </button>
    `;

    ModalDialog.showCustomModal({
      title: '<i class="fa-solid fa-robot" style="color: var(--accent-emerald);"></i> Provider Agent — Online Web & AI Search Engine',
      width: '660px',
      extraButtonsHtml: extraFooterHtml,
      content: `
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 520px; overflow-y: auto; padding-right: 2px;">
          <!-- Compact Header Banner -->
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.35); padding: 6px 10px; border-radius: 6px; font-size: 0.76rem; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-earth-americas" style="font-size: 1.25rem; color: var(--accent-emerald);"></i>
            <div style="line-height: 1.25;">
              <strong style="color: var(--text-main); font-size: 0.82rem;">Provider Agent Active (Perplexity & Frontier AI Model Engine)</strong>
              <span style="color: var(--text-muted); font-size: 0.72rem; display: block;">Researches official Base URL, Protocol, Free Quota, API Key Link, and Free Model Pool automatically.</span>
            </div>
          </div>

          <!-- Attached Model Engine Controls (Provider / Combo + Target Attached Model) -->
          <div style="display: flex; gap: 8px; margin-bottom: 2px; flex-wrap: wrap;">
            <div class="form-group" style="flex: 1; min-width: 160px; margin-bottom: 0;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; display: block;">PROVIDER / COMBO:</label>
              <select id="pa-provider-combo-select" class="form-control" style="font-size: 0.78rem; height: 30px; font-family: monospace;" onchange="ProviderAgent.onProviderChange(this.value)">
                <option value="">Loading providers...</option>
              </select>
            </div>
            <div class="form-group" style="flex: 2; min-width: 210px; margin-bottom: 0;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; display: block;">TARGET ATTACHED MODEL ENGINE:</label>
              <select id="pa-attached-model-select" class="form-control" style="font-size: 0.78rem; height: 30px; font-family: monospace;">
                <option value="gpt-4o">GPT-4o (Default Agent Engine)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              </select>
            </div>
          </div>

          <!-- Key Link Warning Banner -->
          <div id="pa-key-warning" style="display: none; background: rgba(244,63,94,0.12); border: 1px solid var(--accent-rose); color: var(--accent-rose); padding: 4px 8px; border-radius: 4px; font-size: 0.72rem;">
            <i class="fa-solid fa-triangle-exclamation"></i> <span id="pa-key-warning-text">No API Key linked for this provider. Live AI search requires an active provider key.</span>
          </div>

          <!-- Target Provider Search Input & Quick Selectbox -->
          <div class="form-group" style="margin-bottom: 0;">
            <div style="display: flex; gap: 6px; align-items: center;">
              <div style="position: relative; flex: 1; display: flex; align-items: center;">
                <input type="text" id="provider-agent-query-input" class="form-control" placeholder="Search provider (e.g. Gemini, Groq, Bynara, OpenAI, Perplexity)..." value="${initialQuery}" onkeydown="if(event.key==='Enter'){event.preventDefault();ProviderAgent.search();}" oninput="const clr = document.getElementById('pa-search-clear-btn'); if (clr) clr.style.display = this.value ? 'block' : 'none';" style="padding-right: 24px; font-size: 0.8rem; height: 32px;" />
                <i id="pa-search-clear-btn" class="fa-solid fa-xmark" style="position: absolute; right: 8px; color: var(--text-muted); font-size: 0.75rem; cursor: pointer; display: ${initialQuery ? 'block' : 'none'};" onclick="document.getElementById('provider-agent-query-input').value=''; this.style.display='none'; document.getElementById('provider-agent-query-input').focus();" title="Clear"></i>
              </div>
              <select id="pa-quick-provider-select" class="form-control" style="width: 175px; font-size: 0.76rem; height: 32px; font-family: monospace; border-color: var(--accent-cyan);" onchange="if(this.value){ document.getElementById('provider-agent-query-input').value=this.value; const clr=document.getElementById('pa-search-clear-btn'); if(clr) clr.style.display='block'; ProviderAgent.search(); }">
                <option value="">⚡ Select Provider...</option>
                <option value="Gemini">Google Gemini API</option>
                <option value="Groq">Groq Cloud LPU API</option>
                <option value="OpenRouter">OpenRouter Free Models</option>
                <option value="NVIDIA">NVIDIA NIM Cloud API</option>
                <option value="Bynara">Bynara AI Router</option>
                <option value="OpenAI">OpenAI (ChatGPT API)</option>
                <option value="Perplexity">Perplexity AI Search</option>
                <option value="Cerebras">Cerebras Wafer-Scale</option>
                <option value="SambaNova">SambaNova Cloud API</option>
                <option value="DeepSeek">DeepSeek Official API</option>
                <option value="Mistral">Mistral AI Cloud API</option>
                <option value="Together">Together AI Cloud</option>
                <option value="Opencode">Opencode Zen AI</option>
                <option value="Ollama">Ollama Local Host</option>
                <option value="Hyperbolic">Hyperbolic Cloud</option>
                <option value="AgentRouter">Agent Router Cloud</option>
                <option value="Poe">Poe AI Platform</option>
                <option value="Morph">Morph LLM Cloud</option>
                <option value="Comet">Comet API Platform</option>
              </select>
              <button type="button" class="btn btn-emerald btn-sm" onclick="ProviderAgent.search()" title="Execute Online Search" style="height: 32px; padding: 0 12px; font-size: 0.78rem; white-space: nowrap;">
                <i class="fa-solid fa-magnifying-glass"></i> Search Agent
              </button>
            </div>
          </div>

          <!-- Quick Suggestions Row -->
          <div style="display: flex; gap: 4px; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600;"><i class="fa-solid fa-bolt" style="color: var(--accent-amber);"></i> Quick:</span>
            ${this.suggestions.map(s => `
              <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 6px; font-size: 0.68rem; line-height: 1.3;" onclick="document.getElementById('provider-agent-query-input').value='${s}'; const clr = document.getElementById('pa-search-clear-btn'); if (clr) clr.style.display='block'; ProviderAgent.search();">
                + ${s}
              </button>
            `).join('')}
          </div>

          <!-- Dynamic Results Pane -->
          <div id="provider-agent-results-pane" style="min-height: 60px;">
            <div style="font-size: 0.74rem; color: var(--text-dim); text-align: center; padding: 14px; background: rgba(0,0,0,0.18); border-radius: 6px; border: 1px dashed var(--border-color);">
              Type a provider name above and click <strong>Search Agent</strong> or pick a quick suggestion chip.
            </div>
          </div>
        </div>
      `,
      confirmText: 'Close',
      onConfirm: () => {}
    });

    setTimeout(() => {
      ProviderAgent.populateDropdowns();
      document.getElementById('provider-agent-query-input')?.focus();
    }, 80);
  }

  static async populateDropdowns() {
    try {
      if (typeof ApiService !== 'undefined') {
        const [provRes, comboRes, modelsRes] = await Promise.all([
          ApiService.getProviders().catch(() => ({ providers: [] })),
          ApiService.getCombos().catch(() => ({ combos: [] })),
          ApiService.getModels().catch(() => ({ models: [] }))
        ]);
        this.cachedProviders = provRes.providers || provRes || [];
        this.cachedCombos = comboRes.combos || comboRes || [];
        this.cachedModels = modelsRes.models || modelsRes || [];
      }
    } catch (e) {
      console.warn('Notice: ProviderAgent dropdown cache:', e);
    }

    const pSelect = document.getElementById('pa-provider-combo-select');
    if (!pSelect) return;

    let html = '';
    // Providers
    if (this.cachedProviders.length > 0) {
      html += '<optgroup label="── Standalone Providers ──">';
      this.cachedProviders.forEach(p => {
        html += `<option value="${p.id}">${p.displayName || p.name || p.id}</option>`;
      });
      html += '</optgroup>';
    }
    // Combos
    if (this.cachedCombos.length > 0) {
      html += '<optgroup label="── Multi-Model Combos ──">';
      this.cachedCombos.forEach(c => {
        html += `<option value="combo_${c.id}">${c.name || c.id}</option>`;
      });
      html += '</optgroup>';
    }
    if (!html) {
      html = '<option value="gemini">Google Gemini API</option><option value="groq">Groq Cloud API</option><option value="openai">OpenAI API</option>';
    }

    pSelect.innerHTML = html;

    // Prefer Gemini or Groq or first provider
    const preferred = this.cachedProviders.find(p => p.id === 'gemini' || p.id === 'groq' || p.id === 'openai') || this.cachedProviders[0];
    if (preferred) {
      pSelect.value = preferred.id;
    }
    this.onProviderChange(pSelect.value);
  }

  static onProviderChange(val) {
    const mSelect = document.getElementById('pa-attached-model-select');
    const warnEl = document.getElementById('pa-key-warning');
    const warnText = document.getElementById('pa-key-warning-text');
    if (!mSelect) return;

    let models = [];
    let isKeyLinked = true;
    let provName = val;

    if (val.startsWith('combo_')) {
      const comboId = val.replace('combo_', '');
      const combo = this.cachedCombos.find(c => c.id === comboId);
      if (combo) {
        models = (combo.models || []).map(m => ({ id: m.modelId || m, name: m.modelName || m.modelId || m }));
      }
    } else {
      const prov = this.cachedProviders.find(p => p.id === val);
      if (prov) {
        provName = prov.displayName || prov.id;
        isKeyLinked = !!prov.apiKey && !prov.apiKey.startsWith('****') && prov.apiKey !== 'ollama-local' || prov.isActive;
        models = this.cachedModels.filter(m => m.providerId === val || m.provider === val);
      }
    }

    if (models.length === 0) {
      // Default standard options
      models = [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' }
      ];
    }

    mSelect.innerHTML = models.map(m => `<option value="${m.id || m.modelId}">${m.name || m.modelName || m.id || m.modelId}</option>`).join('');

    if (warnEl) {
      if (!isKeyLinked && !val.startsWith('combo_')) {
        warnEl.style.display = 'block';
        if (warnText) warnText.innerText = `No API Key linked for '${provName}'. Live online search requires an active provider key or select another provider.`;
      } else {
        warnEl.style.display = 'none';
      }
    }
  }

  static formatContextWindow(tokens) {
    if (!tokens) return '128k';
    const num = Number(tokens);
    if (isNaN(num)) return String(tokens);
    if (num >= 1000000) {
      const m = num / 1000000;
      return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + 'M';
    }
    return Math.round(num / 1000) + 'k';
  }

  static async search() {
    const query = document.getElementById('provider-agent-query-input')?.value;
    const providerId = document.getElementById('pa-provider-combo-select')?.value;
    const modelId = document.getElementById('pa-attached-model-select')?.value;
    const resContainer = document.getElementById('provider-agent-results-pane');
    const footerApplyBtn = document.getElementById('pa-footer-apply-btn');
    if (footerApplyBtn) footerApplyBtn.style.display = 'none';

    if (!query) {
      ModalDialog.showNotification('Please enter a provider name.', 'warning');
      return;
    }
    if (resContainer) {
      resContainer.innerHTML = `<div style="text-align: center; padding: 18px; font-size: 0.78rem; color: var(--accent-cyan);"><i class="fa-solid fa-spinner fa-spin fa-lg" style="margin-right: 6px;"></i> Searching live online API endpoints & extracting free model specs with <strong>${modelId || 'Agent Engine'}</strong>...</div>`;
    }
    try {
      const res = await ApiService.agentLookupProvider({ query, providerId, modelId, forceLive: true });
      if (res && res.success && res.found && res.provider) {
        const p = res.provider;
        this.currentDiscoveredData = p;
        const modelsList = p.models || [];

        if (resContainer) {
          resContainer.innerHTML = `
            <div class="glass-panel" style="padding: 10px; border-color: rgba(16, 185, 129, 0.4); background: rgba(0,0,0,0.22); margin-bottom: 0; display: flex; flex-direction: column; gap: 8px;">
              <!-- Header Info -->
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <strong style="font-size: 0.92rem; color: var(--accent-emerald);"><i class="fa-solid fa-circle-check"></i> ${p.displayName}</strong>
                  <span class="badge badge-cyan" style="font-size: 0.65rem;">${p.protocol || 'OpenAI Compatible'}</span>
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                  ${p.freeTierQuota ? `<span class="badge badge-amber" style="font-size: 0.65rem;"><i class="fa-solid fa-gift"></i> ${p.freeTierQuota}</span>` : ''}
                  <span class="badge badge-emerald" style="font-size: 0.65rem;">${res.matchType || 'Verified Live'}</span>
                </div>
              </div>

              <!-- Compact 2-Col Specs Grid -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.74rem; background: rgba(255,255,255,0.025); padding: 6px 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                <div>
                  <span style="color: var(--text-muted); display: block; font-size: 0.68rem;">Base Endpoint URL:</span>
                  <code style="color: var(--accent-cyan); font-size: 0.72rem; word-break: break-all;">${p.baseUrl || 'https://api.example.com/v1'}</code>
                </div>
                <div>
                  <span style="color: var(--text-muted); display: block; font-size: 0.68rem;">API Key Management:</span>
                  ${p.apiKeyUrl ? `<a href="${p.apiKeyUrl}" target="_blank" style="color: var(--primary-light); font-size: 0.72rem; text-decoration: underline;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open Key Portal</a>` : `<span style="color: var(--text-dim); font-size: 0.72rem;">${p.apiKeyHelp || 'Built-in Key Manager'}</span>`}
                </div>
              </div>

              <!-- Discovered Staged Models Table -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-main);">Discovered Free Models (${modelsList.length}):</span>
                  <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 5px; font-size: 0.65rem;" onclick="document.querySelectorAll('.pa-model-cb').forEach(cb => cb.checked = true)">Select All</button>
                    <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 5px; font-size: 0.65rem;" onclick="document.querySelectorAll('.pa-model-cb').forEach(cb => cb.checked = false)">Clear</button>
                  </div>
                </div>
                <div style="max-height: 140px; overflow-y: auto; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 4px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 0.72rem;">
                    <thead>
                      <tr style="background: rgba(255,255,255,0.05); text-align: left; border-bottom: 1px solid var(--border-color);">
                        <th style="padding: 4px 6px; width: 24px;"></th>
                        <th style="padding: 4px 6px;">Model ID</th>
                        <th style="padding: 4px 6px;">Family</th>
                        <th style="padding: 4px 6px;">Core Skill</th>
                        <th style="padding: 4px 6px; text-align: right;">Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${modelsList.map(m => `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                          <td style="padding: 3px 6px; text-align: center;">
                            <input type="checkbox" class="pa-model-cb" value="${m.modelId || m.id}" checked />
                          </td>
                          <td style="padding: 3px 6px; font-family: monospace; font-weight: 600; color: var(--accent-cyan);">${m.modelId || m.id}</td>
                          <td style="padding: 3px 6px; color: var(--text-muted);">${m.family || 'General'}</td>
                          <td style="padding: 3px 6px; color: var(--text-muted);">${m.coreSkill || 'Reasoning'}</td>
                          <td style="padding: 3px 6px; text-align: right; color: var(--accent-emerald);">${ProviderAgent.formatContextWindow(m.contextWindow)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          `;
        }
        if (footerApplyBtn) footerApplyBtn.style.display = 'inline-flex';
      } else {
        const errorMsg = res?.error || res?.message || `No verified AI provider matching "${query}" was found.`;
        if (resContainer) {
          resContainer.innerHTML = `
            <div style="background: rgba(244,63,94,0.12); border: 1px solid var(--accent-rose); padding: 12px; border-radius: 6px; font-size: 0.76rem; color: var(--text-main);">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-rose); font-size: 1.1rem;"></i>
                <strong style="color: var(--accent-rose);">Live Provider Search Notice</strong>
              </div>
              <div style="line-height: 1.4; color: var(--text-muted); margin-bottom: 8px;">${errorMsg}</div>
              ${res?.unlinked ? `<button type="button" class="btn btn-rose btn-xs" onclick="app.navigate('providers')"><i class="fa-solid fa-key"></i> Go to Providers to Link API Key</button>` : ''}
            </div>
          `;
        }
      }
    } catch (err) {
      if (resContainer) {
        resContainer.innerHTML = `<div style="background: rgba(244,63,94,0.15); border: 1px solid var(--accent-rose); color: var(--accent-rose); padding: 10px; border-radius: 6px; font-size: 0.76rem;"><i class="fa-solid fa-triangle-exclamation"></i> Search Failed: ${err.message}</div>`;
      }
    }
  }

  static applyCurrentData() {
    if (!this.currentDiscoveredData) {
      ModalDialog.showNotification('No provider specs to apply.', 'warning');
      return;
    }
    this.applyData(this.currentDiscoveredData);
  }

  static applyData(payloadStr) {
    try {
      let p = typeof payloadStr === 'string' ? JSON.parse(decodeURIComponent(payloadStr)) : payloadStr;
      const checkedCbs = Array.from(document.querySelectorAll('.pa-model-cb:checked, .pa-popup-model-cb:checked, .popup-model-cb:checked')).map(cb => cb.value);
      if (checkedCbs.length > 0 && Array.isArray(p.models)) {
        p.models = p.models.filter(m => checkedCbs.includes(m.modelId || m.id));
      }
      if (typeof RegistrationView !== 'undefined' && RegistrationView.applyAgentProviderData) {
        RegistrationView.applyAgentProviderData(p);
      } else if (typeof RegistrationView !== 'undefined' && RegistrationView.applyProviderData) {
        RegistrationView.applyProviderData(p);
      } else {
        ModalDialog.closeModal();
        ModalDialog.showNotification('Provider Agent specs applied.', 'info');
      }
    } catch (e) {
      ModalDialog.showNotification(`Failed to apply data: ${e.message}`, 'error');
    }
  }
}

if (typeof window !== 'undefined') {
  window.ProviderAgent = ProviderAgent;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProviderAgent;
}

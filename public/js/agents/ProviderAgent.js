/**
 * ProviderAgent.js
 * Purpose: Independent System Agent for Online Provider & Free Model Discovery (< 180 lines).
 *          Opens interactive Provider Agent popup modal, searches online AI endpoints,
 *          and applies discovered specs & staged models to registration forms.
 * Dependencies: ApiService, ModalDialog
 */

class ProviderAgent {
  static suggestions = ['Gemini', 'Groq', 'Cerebras', 'OpenRouter', 'Mistral', 'Together', 'SambaNova', 'DeepSeek', 'NVIDIA', 'Ollama', 'AgentRouter'];
  static currentDiscoveredData = null;

  static openPopup(initialQuery = '') {
    this.currentDiscoveredData = null;
    const extraFooterHtml = `
      <button type="button" id="pa-footer-apply-btn" class="btn btn-emerald btn-sm" style="display: none; align-items: center; gap: 6px; font-weight: 600;" onclick="ProviderAgent.applyCurrentData()" title="Apply discovered specs and stage selected models to registration form">
        <i class="fa-solid fa-circle-check"></i> Apply Specs & Models
      </button>
    `;

    ModalDialog.showCustomModal({
      title: '<i class="fa-solid fa-robot" style="color: var(--accent-emerald);"></i> Provider Agent — Online Web & AI Search Engine',
      width: '640px',
      extraButtonsHtml: extraFooterHtml,
      content: `
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 520px; overflow-y: auto; padding-right: 2px;">
          <!-- Compact Header Banner -->
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.35); padding: 6px 10px; border-radius: 6px; font-size: 0.76rem; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-earth-americas" style="font-size: 1.25rem; color: var(--accent-emerald);"></i>
            <div style="line-height: 1.25;">
              <strong style="color: var(--text-main); font-size: 0.82rem;">Provider Agent Active (Live Web Search Engine)</strong>
              <span style="color: var(--text-muted); font-size: 0.72rem; display: block;">Discover official Base URL, Protocol, Free Quota, API Key Link, and Free Model Pool automatically.</span>
            </div>
          </div>

          <!-- Target Provider Search Input -->
          <div class="form-group" style="margin-bottom: 0;">
            <div style="display: flex; gap: 6px; align-items: center;">
              <div style="position: relative; flex: 1; display: flex; align-items: center;">
                <input type="text" id="provider-agent-query-input" class="form-control" placeholder="Target provider e.g. Gemini, Groq, Cerebras, OpenRouter..." value="${initialQuery}" onkeydown="if(event.key==='Enter'){event.preventDefault();ProviderAgent.search();}" oninput="const clr = document.getElementById('pa-search-clear-btn'); if (clr) clr.style.display = this.value ? 'block' : 'none';" style="padding-right: 24px; font-size: 0.8rem; height: 32px;" />
                <i id="pa-search-clear-btn" class="fa-solid fa-xmark" style="position: absolute; right: 8px; color: var(--text-muted); font-size: 0.75rem; cursor: pointer; display: ${initialQuery ? 'block' : 'none'};" onclick="document.getElementById('provider-agent-query-input').value=''; this.style.display='none'; document.getElementById('provider-agent-query-input').focus();" title="Clear"></i>
              </div>
              <button type="button" class="btn btn-emerald btn-sm" onclick="ProviderAgent.search()" title="Execute Online Search" style="height: 32px; padding: 0 12px; font-size: 0.78rem;">
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
    setTimeout(() => { document.getElementById('provider-agent-query-input')?.focus(); }, 120);
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
    const resContainer = document.getElementById('provider-agent-results-pane');
    const footerApplyBtn = document.getElementById('pa-footer-apply-btn');
    if (footerApplyBtn) footerApplyBtn.style.display = 'none';

    if (!query) {
      ModalDialog.showNotification('Please enter a provider name.', 'warning');
      return;
    }
    if (resContainer) {
      resContainer.innerHTML = '<div style="text-align: center; padding: 18px; font-size: 0.78rem; color: var(--accent-cyan);"><i class="fa-solid fa-spinner fa-spin fa-lg" style="margin-right: 6px;"></i> Searching live online API endpoints & discovering free model specs...</div>';
    }
    try {
      const res = await ApiService.agentLookupProvider(query);
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
                  <span class="badge badge-emerald" style="font-size: 0.65rem;">${res.matchType || 'Verified'}</span>
                </div>
              </div>

              <!-- Compact 2-Col Specs Grid -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.74rem; background: rgba(255,255,255,0.025); padding: 6px 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                <div><span style="color: var(--text-muted);">Base URL:</span> <code style="color: var(--primary-light); font-size: 0.72rem;">${p.baseUrl}</code></div>
                <div><span style="color: var(--text-muted);">Key Prefix:</span> <code style="color: var(--accent-amber); font-size: 0.72rem;">${p.keyPrefix || 'None'}</code></div>
                ${p.apiKeyHelp ? `<div style="grid-column: span 2; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                  <div><span style="color: var(--text-muted);">API Key Portal:</span> <a href="${p.apiKeyUrl || '#'}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-amber); text-decoration: underline; font-weight: 600;">${p.apiKeyHelp} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.65rem;"></i></a></div>
                </div>` : ''}
              </div>

              <!-- Discovered Models List -->
              <div>
                <div style="font-size: 0.74rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                  <span><i class="fa-solid fa-cubes"></i> Discovered Free Models (${modelsList.length}):</span>
                  <label style="font-size: 0.68rem; color: var(--text-muted); font-weight: normal; cursor: pointer; display: flex; align-items: center; gap: 4px; margin: 0;">
                    <input type="checkbox" checked id="pa-popup-select-all" onchange="document.querySelectorAll('.pa-popup-model-cb').forEach(c=>c.checked=this.checked)" /> Select All
                  </label>
                </div>

                <div style="max-height: 160px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 2px; border-radius: 4px; border: 1px solid var(--border-color);">
                  <table class="table-custom" style="width: 100%; font-size: 0.72rem; margin: 0;">
                    <thead>
                      <tr>
                        <th style="width: 24px; text-align: center; padding: 3px;">#</th>
                        <th style="padding: 3px 6px;">Model Name / ID</th>
                        <th style="padding: 3px 6px;">Family</th>
                        <th style="padding: 3px 6px;">Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${modelsList.map(m => `
                        <tr>
                          <td style="text-align: center; padding: 2px 3px;"><input type="checkbox" class="pa-popup-model-cb" value="${m.modelId || m.id}" checked /></td>
                          <td style="padding: 2px 6px;"><strong style="color: var(--text-main); font-size: 0.74rem;">${m.modelName || m.name || m.id}</strong></td>
                          <td style="padding: 2px 6px;"><span class="badge badge-indigo" style="font-size: 0.62rem;">${m.family || 'General'}</span></td>
                          <td style="padding: 2px 6px;"><span class="badge badge-emerald" style="font-size: 0.62rem;">${ProviderAgent.formatContextWindow(m.contextWindow)}</span></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          `;
        }

        // Show Apply Button in Footer next to Close
        if (footerApplyBtn) {
          footerApplyBtn.style.display = 'inline-flex';
        }
      } else if (resContainer) {
        const notFoundMsg = (res && res.message) ? res.message : `No verified AI provider matching '${query}' was found.`;
        resContainer.innerHTML = `
          <div class="glass-panel" style="padding: 12px; border-color: var(--accent-amber); background: rgba(245, 158, 11, 0.08);">
            <div style="display: flex; align-items: flex-start; gap: 8px;">
              <i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-amber); font-size: 1.1rem; margin-top: 2px;"></i>
              <div>
                <strong style="color: var(--accent-amber); font-size: 0.84rem; display: block; margin-bottom: 2px;">Provider Not Found</strong>
                <span style="color: var(--text-main); font-size: 0.74rem; line-height: 1.35; display: block; margin-bottom: 6px;">${notFoundMsg}</span>
                <div style="font-size: 0.7rem; color: var(--text-muted);">Please check the spelling or select a provider from Quick Suggestions.</div>
              </div>
            </div>
          </div>
        `;
      }
    } catch (err) {
      if (resContainer) {
        const errInfo = typeof ErrorDefinitionHelper !== 'undefined' ? ErrorDefinitionHelper.getByStatusCode(null, err.message) : { code: 'ERR_SEARCH_FAIL', title: 'Search Error', definition: err.message, guidance: 'Check internet connectivity and try searching again.' };
        resContainer.innerHTML = typeof ErrorDefinitionHelper !== 'undefined' ? ErrorDefinitionHelper.renderErrorCardHtml(errInfo) : `<div class="alert alert-danger" style="font-size: 0.74rem; padding: 8px;">Error: ${err.message}</div>`;
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
      const checkedCbs = Array.from(document.querySelectorAll('.pa-popup-model-cb:checked')).map(cb => cb.value);
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

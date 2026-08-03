/**
 * ProviderAgent.js
 * Purpose: Independent System Agent for Online Provider & Free Model Discovery (< 180 lines).
 *          Opens interactive Provider Agent popup modal, searches online AI endpoints,
 *          and applies discovered specs & staged models to registration forms.
 * Dependencies: ApiService, ModalDialog
 */

class ProviderAgent {
  static suggestions = ['SambaNova', 'NVIDIA', 'Groq', 'Gemini', 'OpenRouter', 'Together', 'Cerebras', 'Ollama', 'Hyperbolic', 'DeepSeek', 'Mistral'];

  static openPopup(initialQuery = '') {
    ModalDialog.showCustomModal({
      title: '<i class="fa-solid fa-robot" style="color: var(--accent-emerald);"></i> Provider Agent — Online Web & AI Search Engine',
      content: `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="position: sticky; top: -8px; z-index: 10; background: var(--bg-card); padding: 10px; border-bottom: 1px solid var(--border-color); margin: -8px -8px 0 -8px; display: flex; flex-direction: column; gap: 10px; border-radius: 8px 8px 0 0; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid var(--accent-emerald); padding: 8px 10px; border-radius: 6px; font-size: 0.78rem; display: flex; align-items: center; gap: 10px;">
              <i class="fa-solid fa-earth-americas" style="font-size: 1.5rem; color: var(--accent-emerald);"></i>
              <div>
                <strong style="color: var(--text-main); display: block; font-size: 0.88rem;">Provider Agent Active (Live Web Search Engine)</strong>
                <span style="color: var(--text-muted);">Enter any AI Provider name below to discover Base URL, Protocol, Free Quota, API Key Link, and Free Model Pool automatically.</span>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan);">Target Provider Name or Domain:</label>
              <div style="display: flex; gap: 8px;">
                <input type="text" id="provider-agent-query-input" class="form-control" placeholder="e.g. SambaNova, NVIDIA, Groq, Gemini, Cerebras..." value="${initialQuery}" onkeydown="if(event.key==='Enter'){event.preventDefault();ProviderAgent.search();}" />
                <button type="button" class="btn btn-emerald" onclick="ProviderAgent.search()" title="Execute Online Search">
                  <i class="fa-solid fa-magnifying-glass"></i> Search Agent
                </button>
              </div>
            </div>

            <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
              <span style="font-size: 0.72rem; color: var(--text-muted);">Quick Suggestions:</span>
              ${this.suggestions.map(s => `
                <button type="button" class="btn btn-secondary btn-xs" style="padding: 2px 6px; font-size: 0.72rem;" onclick="document.getElementById('provider-agent-query-input').value='${s}'; ProviderAgent.search();">
                  + ${s}
                </button>
              `).join('')}
            </div>
          </div>

          <div id="provider-agent-results-pane" style="margin-top: 4px; min-height: 100px;">
            <div style="font-size: 0.75rem; color: var(--text-dim); text-align: center; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 6px;">
              Type a provider name above and click <strong>Search Agent</strong> or choose a quick suggestion chip.
            </div>
          </div>
        </div>
      `,
      confirmText: 'Close',
      onConfirm: () => {}
    });
    setTimeout(() => { document.getElementById('provider-agent-query-input')?.focus(); }, 150);
  }

  static async search() {
    const query = document.getElementById('provider-agent-query-input')?.value;
    const resContainer = document.getElementById('provider-agent-results-pane');
    if (!query) {
      ModalDialog.showNotification('Please enter a provider name.', 'warning');
      return;
    }
    if (resContainer) {
      resContainer.innerHTML = '<div style="text-align: center; padding: 24px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--accent-cyan);"></i> Searching live online API endpoints & discovering free model specs...</div>';
    }
    try {
      const res = await ApiService.agentLookupProvider(query);
      if (res.success && res.provider) {
        const p = res.provider;
        const pid = p.rawId || p.id || query.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const encName = encodeURIComponent(p.displayName || query);
        const encUrl = encodeURIComponent(p.baseUrl || '');
        const encModels = encodeURIComponent(JSON.stringify(p.models || []));
        const modelsList = p.models || [];

        if (resContainer) {
          resContainer.innerHTML = `
            <div class="glass-panel" style="padding: 14px; border-color: var(--accent-emerald); background: rgba(0,0,0,0.3);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div>
                  <strong style="font-size: 1rem; color: var(--accent-emerald); display: block;">${p.displayName}</strong>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">Source Match: <strong style="color: var(--accent-cyan);">${res.matchType || 'Live Online Search'}</strong></span>
                </div>
                ${p.freeTierQuota ? `<span class="badge badge-amber" style="font-size: 0.7rem;"><i class="fa-solid fa-gift"></i> Quota: ${p.freeTierQuota}</span>` : ''}
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.78rem; margin-bottom: 8px; background: rgba(255,255,255,0.03); padding: 8px; border-radius: 4px;">
                <div><strong>Protocol Type:</strong> <span style="color: var(--accent-cyan);">${p.protocol}</span></div>
                <div><strong>Base URL:</strong> <code style="color: var(--primary-light);">${p.baseUrl}</code></div>
                ${p.apiKeyHelp ? `<div style="grid-column: span 2;"><strong>API Key Link:</strong> <a href="${p.apiKeyUrl || '#'}" target="_blank" style="color: var(--accent-amber);">${p.apiKeyHelp}</a></div>` : ''}
              </div>

              <div style="font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 6px;">
                <i class="fa-solid fa-cubes"></i> Discovered Free Models (${modelsList.length}):
              </div>

              <div style="max-height: 120px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 6px; border-radius: 4px; margin-bottom: 10px;">
                <table class="table-custom" style="width: 100%; font-size: 0.74rem;">
                  <thead>
                    <tr>
                      <th style="width: 20px;"><input type="checkbox" checked id="pa-popup-select-all" onchange="document.querySelectorAll('.pa-popup-model-cb, .popup-model-cb').forEach(c=>c.checked=this.checked)" /></th>
                      <th>Model Name</th>
                      <th>Family</th>
                      <th>Context</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${modelsList.map(m => `
                      <tr>
                        <td><input type="checkbox" class="pa-popup-model-cb popup-model-cb" value="${m.modelId || m.id}" checked /></td>
                        <td><strong style="color: var(--text-main);">${m.modelName || m.id}</strong></td>
                        <td><span style="color: var(--accent-cyan);">${m.family || 'General'}</span></td>
                        <td>${m.contextWindow ? (m.contextWindow / 1000) + 'k' : '128k'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <button type="button" class="btn btn-emerald btn-sm" style="width: 100%; justify-content: center; font-size: 0.82rem; padding: 8px;" onclick="ProviderAgent.applyData('${pid}', '${encName}', '${p.protocol}', '${encUrl}', '${encModels}')">
                <i class="fa-solid fa-circle-check"></i> Apply Specs & Save All Discovered Models to Form
              </button>
            </div>
          `;
        }
      } else if (resContainer) {
        const errInfo = typeof ErrorDefinitionHelper !== 'undefined' ? ErrorDefinitionHelper.getByStatusCode(404, `No provider specs found for '${query}'.`) : { code: 'ERR_SEARCH_404', title: 'Provider Not Found', definition: `No provider specs found for '${query}'.`, guidance: 'Verify provider spelling or domain name.' };
        resContainer.innerHTML = typeof ErrorDefinitionHelper !== 'undefined' ? ErrorDefinitionHelper.renderErrorCardHtml(errInfo) : `<div class="alert alert-warning">No provider specs found for '${query}'.</div>`;
      }
    } catch (err) {
      if (resContainer) {
        const errInfo = typeof ErrorDefinitionHelper !== 'undefined' ? ErrorDefinitionHelper.getByStatusCode(null, err.message) : { code: 'ERR_SEARCH_FAIL', title: 'Search Error', definition: err.message, guidance: 'Check internet connectivity and try searching again.' };
        resContainer.innerHTML = typeof ErrorDefinitionHelper !== 'undefined' ? ErrorDefinitionHelper.renderErrorCardHtml(errInfo) : `<div class="alert alert-danger">Error: ${err.message}</div>`;
      }
    }
  }

  static applyData(id, encName, proto, encUrl, encModels = '') {
    if (typeof RegistrationView !== 'undefined' && RegistrationView.applyProviderData) {
      RegistrationView.applyProviderData(id, encName, proto, encUrl, encModels);
    } else {
      ModalDialog.closeModal();
      ModalDialog.showNotification('Provider Agent specs ready. Please open Provider Registration.', 'info');
    }
  }
}

window.ProviderAgent = ProviderAgent;

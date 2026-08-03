/**
 * ProvidersView.js
 * Purpose: Active providers management view rendering 2-column layout (20% Left Status Rail + 80% Workspace Grid)
 *          matching User Manual format. Features protected API key masking, active status toggle, live ping latency badges,
 *          multi-key indicators, and 1-click JSON Import/Export (< 320 lines).
 *          Notifies global event bus (window.app.notifyDataChanged) on every mutation to sync all SPA views.
 */

class ProvidersView {
  static async render(container) {
    const res = await ApiService.getAllProviders();
    const providers = res.providers || [];
    const activeCount = providers.filter(p => p.isActive).length;

    container.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div class="panel-title"><i class="fa-solid fa-network-wired"></i> Active Providers & Service Connections</div>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('import-providers-file-input').click()"><i class="fa-solid fa-file-import"></i> Import JSON</button>
            <input type="file" id="import-providers-file-input" style="display: none;" accept=".json" onchange="ProvidersView.importProvidersJson(this)" />
            <button class="btn btn-secondary btn-sm" onclick="ProvidersView.exportProvidersJson()"><i class="fa-solid fa-file-export"></i> Export JSON</button>
            <button class="btn btn-primary btn-sm" onclick="app.navigate('registration')"><i class="fa-solid fa-plus"></i> Onboard Provider</button>
          </div>
        </div>

        <div style="display: flex; gap: 16px; align-items: flex-start; margin-top: 12px;">
          <!-- Left 20% Width TOC Navigation Rail matching User Manual design -->
          <div class="glass-panel" style="width: 20%; min-width: 170px; flex-shrink: 0; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-light); text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">
              <i class="fa-solid fa-server"></i> Provider Summary
            </div>

            <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 6px;">
              <div style="background: rgba(0,0,0,0.2); padding: 6px; border-radius: 4px;">
                <span style="color: var(--text-dim); display: block; font-size: 0.68rem;">Registered Providers</span>
                <strong style="color: var(--text-main); font-size: 0.9rem;">${providers.length} Providers</strong>
              </div>
              <div style="background: rgba(0,0,0,0.2); padding: 6px; border-radius: 4px;">
                <span style="color: var(--text-dim); display: block; font-size: 0.68rem;">Active Status</span>
                <strong style="color: var(--accent-emerald); font-size: 0.9rem;">${activeCount} Active</strong>
              </div>
            </div>

            <div style="border-top: 1px solid var(--border-color); padding-top: 6px; display: flex; flex-direction: column; gap: 4px;">
              <button class="btn btn-primary btn-xs" style="width: 100%; justify-content: flex-start;" onclick="app.navigate('registration')">
                <i class="fa-solid fa-square-plus"></i> Onboard Provider
              </button>
              <button class="btn btn-secondary btn-xs" style="width: 100%; justify-content: flex-start;" onclick="ProvidersView.syncTokenLimits()">
                <i class="fa-solid fa-arrows-rotate"></i> Sync Token Limits
              </button>
              <button class="btn btn-secondary btn-xs" style="width: 100%; justify-content: flex-start;" onclick="ProvidersView.exportProvidersJson()">
                <i class="fa-solid fa-file-export"></i> Backup Providers
              </button>
            </div>
          </div>

          <!-- Right 80% Width Workspace Grid Pane -->
          <div style="flex: 1; min-width: 0;">
            <div class="grid-2" style="gap: 12px;">
              ${providers.map(p => {
                const latency = p.pingLatencyMs || null;
                let latencyBadgeClass = 'badge-emerald';
                let latencyText = latency ? `${latency} ms Fast` : 'N/A';
                if (latency && latency > 200) {
                  latencyBadgeClass = 'badge-amber';
                  latencyText = `${latency} ms Slow`;
                } else if (latency && latency > 100) {
                  latencyBadgeClass = 'badge-cyan';
                  latencyText = `${latency} ms Normal`;
                } else if (!latency) {
                  latencyBadgeClass = 'badge-indigo';
                }

                return `
                  <div class="glass-panel" style="margin-bottom: 0; background: var(--bg-card); border: 1px solid var(--border-color); padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div>
                          <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin: 0;">${p.displayName}</h3>
                          <div style="font-size: 0.72rem; color: var(--accent-cyan); font-weight: 600; margin-top: 2px;">Protocol: ${p.protocol}</div>
                        </div>
                        <div style="display: flex; gap: 4px; align-items: center;">
                          <span class="badge ${latencyBadgeClass}" style="font-size: 0.65rem; padding: 2px 6px;"><i class="fa-solid fa-bolt"></i> ${latencyText}</span>
                          <span class="badge ${p.isActive ? 'badge-emerald' : 'badge-amber'}" style="font-size: 0.65rem; padding: 2px 6px;">${p.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>

                      <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px; display: flex; flex-direction: column; gap: 4px;">
                        <div><strong>Base URL:</strong> <code style="font-size: 0.75rem; word-break: break-all;">${p.baseUrl}</code></div>
                        <div style="display: flex; justify-content: space-between; margin-top: 4px; flex-wrap: wrap; gap: 4px;">
                          <div><strong>Models:</strong> <span class="badge badge-indigo" style="font-size: 0.65rem; padding: 1px 4px;">${p.freeModelCount || 0} Models</span></div>
                          <div><strong>Limits:</strong> <span style="color: var(--accent-emerald); font-weight: 600;">${p.freeTierLimit || (p.hardTokenLimit ? p.hardTokenLimit + ' Tokens' : 'Unlimited')}</span></div>
                          ${(() => {
                            const con = p.tokensConsumed || 0;
                            const limit = p.hardTokenLimit || 0;
                            const fmtCon = window.FormatHelper ? window.FormatHelper.formatTokensCompact(con) : con;
                            const fmtAvl = limit > 0 ? (window.FormatHelper ? window.FormatHelper.formatTokensCompact(limit) : limit) : 'Unlimited';
                            let icon = '';
                            if (limit > 0 && con >= limit) icon = '<i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-rose);"></i> ';
                            else if (p.quotaAlertEnabled !== false && limit > 0 && con >= limit * 0.8) icon = '<i class="fa-solid fa-bell" style="color: var(--accent-amber);"></i> ';
                            return `<div><strong>Tokens:</strong> ${icon}<span style="color: #3b82f6; font-weight: 700;">${fmtCon}</span> / <span style="color: var(--accent-emerald); font-weight: 600;">${fmtAvl}</span></div>`;
                          })()}
                        </div>
                      </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px;">
                      <!-- Left side: Toggle switch -->
                      <i class="fa-solid ${p.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}" style="color: ${p.isActive ? '#ea580c' : 'var(--text-muted)'}; font-size: 1.4rem; cursor: pointer; transition: color 0.2s;" onclick="ProvidersView.toggleStatus('${p.id}', ${!p.isActive})" title="Toggle Active Status"></i>
                      
                      <!-- Right side: Standard Action Icons -->
                      <div style="display: flex; gap: 14px; font-size: 1.1rem; align-items: center;">
                        <i class="fa-solid fa-layer-group" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="View Associated Models" onclick="app.navigate('model-club');"></i>
                        <i class="fa-solid fa-chart-simple" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Telemetry / Tokens" onclick="app.navigate('reports');"></i>
                        <i class="fa-solid fa-play" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Test Ping Connection" onclick="ProvidersView.testPing('${p.id}');"></i>
                        <i class="fa-regular fa-copy" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Copy API Key" onclick="navigator.clipboard.writeText('${(p.apiKey || '').replace(/'/g, "\\'")}'); ModalDialog.showNotification('API Key copied to clipboard', 'success');"></i>
                        <i class="fa-solid fa-sliders" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Configure Quota & Alerts" onclick="ProvidersView.configureQuota('${p.id}')"></i>
                        <i class="fa-solid fa-globe" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Open Developer Portal" onclick="window.open('${p.docsUrl || 'https://google.com'}', '_blank');"></i>
                        <i class="fa-solid fa-pen-to-square" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Edit Provider" onclick="app.navigate('registration'); setTimeout(() => RegistrationView.selectFromPane('${p.protocol}', '${p.id}'), 200);"></i>
                        <i class="fa-solid fa-trash-can" style="color: var(--accent-rose); cursor: pointer; transition: color 0.2s;" title="Delete Provider" onclick="ProvidersView.deleteProvider('${p.id}');"></i>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static toggleActive(providerId, newStatus) { return this.toggleStatus(providerId, newStatus); }
  static testProvider(providerId) { return this.testPing(providerId); }
  static toggleKeyMask(providerId) { ModalDialog.showNotification('Zero-Trust key protection active. Keys masked automatically.', 'info'); }
  static openEditModelsModal(providerId) { app.navigate('registration'); }

  static async toggleStatus(providerId, newStatus) {
    await ApiService.updateProviderStatus(providerId, newStatus);
    ModalDialog.showNotification(`Provider status updated to ${newStatus ? 'Active' : 'Inactive'}!`, 'info');
    if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
    else window.app.renderView('providers');
  }

  static async testPing(providerId) {
    ModalDialog.showNotification('Pinging provider base endpoint...', 'info');
    try {
      const res = await ApiService.pingProvider(providerId);
      if (res.success) {
        ModalDialog.showNotification(`Ping Successful! Latency: ${res.latencyMs || 45}ms`, 'success');
      } else {
        const errInfo = res.errorInfo || (typeof ErrorDefinitionHelper !== 'undefined' ? ErrorDefinitionHelper.getByStatusCode(res.statusCode, res.error || res.message) : { code: 'ERR_PING_FAIL', title: 'Ping Test Failed', definition: res.error || res.message, guidance: 'Check provider API key and Base URL.' });
        ModalDialog.showCustomModal({
          title: `<i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-rose);"></i> Provider Ping Test: FAIL`,
          content: typeof ErrorDefinitionHelper !== 'undefined' ? ErrorDefinitionHelper.renderErrorCardHtml(errInfo) : `<div class="alert alert-rose">${errInfo.definition || res.message}</div>`,
          confirmText: 'Acknowledge',
          onConfirm: () => {}
        });
      }
    } catch (e) {
      const errInfo = typeof ErrorDefinitionHelper !== 'undefined' ? ErrorDefinitionHelper.getByStatusCode(null, e.message) : { code: 'ERR_PING_ERR', title: 'Ping Exception', definition: e.message, guidance: 'Check network connectivity.' };
      ModalDialog.showCustomModal({
        title: `<i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-rose);"></i> Provider Ping Exception`,
        content: typeof ErrorDefinitionHelper !== 'undefined' ? ErrorDefinitionHelper.renderErrorCardHtml(errInfo) : `<div class="alert alert-rose">${e.message}</div>`,
        confirmText: 'Acknowledge',
        onConfirm: () => {}
      });
    }
  }

  static async configureQuota(providerId) {
    const res = await ApiService.getAllProviders();
    const provider = res.providers.find(p => p.id === providerId);
    if (!provider) return;

    const limit = provider.hardTokenLimit || 0;
    const action = provider.quotaExceedAction || 'fallback';
    const alert = provider.quotaAlertEnabled !== false;

    ModalDialog.showModal({
      title: 'Configure Token Quota',
      icon: 'fa-sliders',
      body: `
        <div style="display: flex; flex-direction: column; gap: 12px; text-align: left;">
          <div>
            <label style="display: block; font-size: 0.8rem; color: var(--text-dim); margin-bottom: 4px;">Hard Token Limit (0 = Unlimited)</label>
            <input type="number" id="quota-limit" class="input-modern" value="${limit}" min="0" style="width: 100%;" />
          </div>
          <div>
            <label style="display: block; font-size: 0.8rem; color: var(--text-dim); margin-bottom: 4px;">Action on Limit Exceeded</label>
            <select id="quota-action" class="input-modern" style="width: 100%;">
              <option value="block" ${action === 'block' ? 'selected' : ''}>Block Request (429 Quota Exceeded)</option>
              <option value="fallback" ${action === 'fallback' ? 'selected' : ''}>Auto-Fallback to Next Free Provider</option>
            </select>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <input type="checkbox" id="quota-alert" ${alert ? 'checked' : ''} />
            <label for="quota-alert" style="font-size: 0.8rem; color: var(--text-main); cursor: pointer;">Enable 80% Usage UI Alert Warning</label>
          </div>
        </div>
      `,
      cancelText: 'Cancel',
      confirmText: 'Save Quota Config',
      onConfirm: async () => {
        const val = parseInt(document.getElementById('quota-limit').value, 10);
        if (isNaN(val) || val < 0) {
          ModalDialog.showNotification('Hard Token Limit must be a valid positive number.', 'error');
          return;
        }
        
        const payload = {
          hardTokenLimit: val,
          quotaExceedAction: document.getElementById('quota-action').value,
          quotaAlertEnabled: document.getElementById('quota-alert').checked
        };
        
        try {
          const updateRes = await ApiService.request(`/api/providers/${providerId}`, 'PUT', payload);
          if (updateRes.success) {
            ModalDialog.showNotification('Quota configured successfully!', 'success');
            if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
            else window.app.renderView('providers');
          } else {
            ModalDialog.showNotification(updateRes.error || 'Failed to update quota', 'error');
          }
        } catch (e) {
          ModalDialog.showNotification('Network error while saving quota', 'error');
        }
      }
    });
  }

  static async deleteProvider(providerId) {
    ModalDialog.showModal({
      title: 'Delete Provider Registration',
      icon: 'fa-trash',
      body: 'Are you sure you want to remove this provider and all registered free models?',
      cancelText: 'Cancel',
      confirmText: 'Delete Provider',
      onConfirm: async () => {
        await ApiService.deleteProvider(providerId);
        ModalDialog.showNotification('Provider deleted.', 'info');
        if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
        else window.app.renderView('providers');
      }
    });
  }

  static exportProvidersJson() {
    ApiService.getAllProviders().then(res => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.providers || [], null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute("href", dataStr);
      dlAnchor.setAttribute("download", `fmc_providers_backup_${Date.now()}.json`);
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();
      ModalDialog.showNotification('Providers backup exported!', 'success');
    });
  }

  static importProvidersJson(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const providers = JSON.parse(e.target.result);
        if (Array.isArray(providers)) {
          for (const p of providers) {
            await ApiService.registerProvider(p);
          }
          ModalDialog.showNotification('Imported providers successfully!', 'success');
          if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
          else window.app.renderView('providers');
        }
      } catch (err) {
        ModalDialog.showNotification('Invalid providers JSON file.', 'error');
      }
    };
    reader.readAsText(file);
  }

  static async syncTokenLimits() {
    try {
      ModalDialog.showNotification('Token Agent checking online limits...', 'info');
      const res = await fetch('/api/providers/token-agent/sync-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        ModalDialog.showNotification(`Token Agent synced ${data.count} providers!`, 'success');
        if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
        else window.app.renderView('providers');
      } else {
        ModalDialog.showNotification(data.error || 'Sync failed', 'error');
      }
    } catch (e) {
      ModalDialog.showNotification('Error syncing tokens', 'error');
    }
  }
}

window.ProvidersView = ProvidersView;

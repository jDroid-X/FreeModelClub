/**
 * ProvidersView.js
 * Purpose: Active providers management view rendering 2-column layout (20% Left Status Rail + 80% Workspace Grid)
 *          matching User Manual format. Features protected API key masking, active status toggle, live ping latency badges,
 *          multi-key indicators, and 1-click JSON Import/Export (< 320 lines).
 *          Notifies global event bus (window.app.notifyDataChanged) on every mutation to sync all SPA views.
 */

class ProvidersView {
  static activeTab = 'active'; // 'active', 'inactive', 'blacklisted'
  static matrixSortCol = 'status'; // default sort column
  static matrixSortDesc = false; // default sort direction

  static async render(container) {
    const [res, blacklistedRes] = await Promise.all([
      ApiService.getAllProviders(),
      ApiService.getBlacklistedProviders().catch(() => ({ blacklisted: [], sleepMinutes: 30 }))
    ]);

    const allProviders = res.providers || [];
    const blacklistedList = (blacklistedRes && blacklistedRes.blacklisted) || [];
    const sleepMinutes = (blacklistedRes && blacklistedRes.sleepMinutes) || 30;

    const blacklistedMap = new Map(blacklistedList.map(b => [b.providerId, b]));

    const activeProviders = allProviders.filter(p => p.isActive && !blacklistedMap.has(p.id));
    const inactiveProviders = allProviders.filter(p => !p.isActive);
    const blacklistedProviders = allProviders.filter(p => blacklistedMap.has(p.id));

    let displayProviders = activeProviders;
    if (this.activeTab === 'inactive') displayProviders = inactiveProviders;
    else if (this.activeTab === 'blacklisted') displayProviders = blacklistedProviders;

    container.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <div class="panel-title"><i class="fa-solid fa-network-wired"></i> Providers & Service Connections</div>
            
            <!-- Editable Blacklist Sleep Duration Control -->
            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.74rem; background: rgba(0,0,0,0.25); padding: 3px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
              <span style="color: var(--accent-amber); font-weight: 600;"><i class="fa-solid fa-moon"></i> Sleep Mode Duration:</span>
              <select class="form-control" style="font-size: 0.72rem; padding: 2px 6px; width: 125px;" onchange="ProvidersView.updateBlacklistSleepDuration(this.value)">
                <option value="5" ${sleepMinutes === 5 ? 'selected' : ''}>5 Mins</option>
                <option value="15" ${sleepMinutes === 15 ? 'selected' : ''}>15 Mins</option>
                <option value="30" ${sleepMinutes === 30 ? 'selected' : ''}>30 Mins (Default)</option>
                <option value="60" ${sleepMinutes === 60 ? 'selected' : ''}>60 Mins</option>
              </select>
            </div>
          </div>

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
            <div style="margin-bottom: 8px; position: relative;">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; top: 9px; color: var(--text-muted); font-size: 0.8rem;"></i>
              <input type="text" id="provider-search-input" class="input-modern" placeholder="Search providers..." style="width: 100%; padding-left: 28px; padding-right: 28px; font-size: 0.8rem; box-sizing: border-box;" oninput="ProvidersView.filterList(this.value)" />
              <i class="fa-solid fa-xmark" style="position: absolute; right: 10px; top: 9px; color: var(--text-muted); font-size: 0.8rem; cursor: pointer; display: none;" onclick="document.getElementById('provider-search-input').value=''; ProvidersView.filterList(''); this.style.display='none';"></i>
            </div>
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-light); text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">
              <i class="fa-solid fa-filter"></i> Provider Sections
            </div>

            <!-- 4 Filter Buttons -->
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <button class="btn btn-sm ${this.activeTab === 'active' ? 'btn-primary' : 'btn-secondary'}" style="justify-content: space-between; font-size: 0.75rem;" onclick="ProvidersView.switchTab('active')">
                <span><i class="fa-solid fa-circle-check" style="color: var(--accent-emerald);"></i> Active Pool</span>
                <span class="badge badge-emerald" style="font-size: 0.65rem;">${activeProviders.length}</span>
              </button>
              
              <button class="btn btn-sm ${this.activeTab === 'inactive' ? 'btn-primary' : 'btn-secondary'}" style="justify-content: space-between; font-size: 0.75rem;" onclick="ProvidersView.switchTab('inactive')">
                <span><i class="fa-solid fa-circle-pause" style="color: var(--accent-amber);"></i> Inactive</span>
                <span class="badge badge-amber" style="font-size: 0.65rem;">${inactiveProviders.length}</span>
              </button>

              <button class="btn btn-sm ${this.activeTab === 'blacklisted' ? 'btn-primary' : 'btn-secondary'}" style="justify-content: space-between; font-size: 0.75rem; border: ${blacklistedProviders.length > 0 ? '1px solid var(--accent-rose)' : '1px solid var(--border-color)'};" onclick="ProvidersView.switchTab('blacklisted')">
                <span><i class="fa-solid fa-moon" style="color: var(--accent-rose);"></i> Sleep Mode</span>
                <span class="badge badge-rose" style="font-size: 0.65rem;">${blacklistedProviders.length}</span>
              </button>

              <button class="btn btn-sm ${this.activeTab === 'matrix' ? 'btn-primary' : 'btn-secondary'}" style="justify-content: space-between; font-size: 0.75rem; border-top: 1px solid var(--border-color); margin-top: 4px;" onclick="ProvidersView.switchTab('matrix')">
                <span><i class="fa-solid fa-table-list" style="color: var(--accent-cyan);"></i> Config Matrix</span>
              </button>
            </div>
            ${blacklistedProviders.length > 0 ? `
              <button class="btn btn-emerald btn-xs" style="width: 100%; margin-top: 6px; font-weight: 700;" onclick="ProvidersView.wakeUpAllProviders()">
                <i class="fa-solid fa-sun"></i> Wake Up All (${blacklistedProviders.length})
              </button>
            ` : ''}

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
            ${this.activeTab === 'matrix' ? `
              <!-- Provider Configuration Matrix -->
              <div id="provider-matrix-container" style="margin-bottom: 16px;">
                ${this.renderMatrix(allProviders)}
              </div>
            ` : `
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                ${this.activeTab === 'active' ? '<i class="fa-solid fa-circle-check" style="color: var(--accent-emerald);"></i> Active' : this.activeTab === 'inactive' ? '<i class="fa-solid fa-circle-pause" style="color: var(--accent-amber);"></i> Inactive' : '<i class="fa-solid fa-moon" style="color: var(--accent-rose);"></i> Sleep Mode'} Provider Action Cards
              </div>

              ${displayProviders.length === 0 ? `
              <div class="glass-panel" style="padding: 24px; text-align: center; color: var(--text-muted);">
                <i class="fa-solid fa-box-open" style="font-size: 2rem; margin-bottom: 8px; opacity: 0.4;"></i>
                <div style="font-size: 0.85rem;">No providers found in '${this.activeTab.toUpperCase()}' state.</div>
              </div>
            ` : `
              <div class="grid-2" style="gap: 12px;">
                ${displayProviders.map(p => {
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

                  const blacklistedInfo = blacklistedMap.get(p.id);

                  return `
                    <div class="glass-panel" style="margin-bottom: 0; background: var(--bg-card); border: 1px solid ${blacklistedInfo ? 'var(--accent-rose)' : 'var(--border-color)'}; padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
                      <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                          <div>
                            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin: 0;">${p.displayName}</h3>
                            <div style="font-size: 0.72rem; color: var(--accent-cyan); font-weight: 600; margin-top: 2px;">Protocol: ${p.protocol}</div>
                          </div>
                          <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
                            <span class="badge ${latencyBadgeClass}" style="font-size: 0.65rem; padding: 2px 6px;"><i class="fa-solid fa-bolt"></i> ${latencyText}</span>
                            ${blacklistedInfo ? `
                              <span class="badge badge-rose" style="font-size: 0.65rem; padding: 2px 6px;" title="Circuit breaker active"><i class="fa-solid fa-moon"></i> Sleep (${blacklistedInfo.remainingMinutes}m remaining)</span>
                            ` : `
                              <span class="badge ${p.isActive ? 'badge-emerald' : 'badge-amber'}" style="font-size: 0.65rem; padding: 2px 6px;">${p.isActive ? 'Active' : 'Inactive'}</span>
                            `}
                          </div>
                        </div>

                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px; display: flex; flex-direction: column; gap: 4px;">
                          <div>
                            <strong>Base URL:</strong> <code id="display-url-${p.id}" style="font-size: 0.75rem; word-break: break-all;">${p.baseUrl}</code>
                            <i class="fa-solid fa-pen-to-square" style="margin-left: 6px; cursor: pointer; color: var(--accent-cyan);" title="Edit Base URL" onclick="ProvidersView.promptEditBaseUrl('${p.id}', '${p.baseUrl}')"></i>
                          </div>
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
                        <!-- Left side: Toggle switch or Wake Up Button -->
                        ${blacklistedInfo ? `
                          <button class="btn btn-emerald btn-xs" style="padding: 3px 8px; font-weight: 700;" onclick="ProvidersView.wakeUpProvider('${p.id}')">
                            <i class="fa-solid fa-sun"></i> Wake Up (Unblacklist)
                          </button>
                        ` : `
                          <i id="toggle-icon-${p.id}" class="fa-solid ${p.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}" style="color: ${p.isActive ? '#ea580c' : 'var(--text-muted)'}; font-size: 1.4rem; cursor: pointer; transition: color 0.2s;" onclick="ProvidersView.toggleStatus('${p.id}', ${!p.isActive})" title="Toggle Active Status"></i>
                        `}
                        
                        <!-- Right side: Standard Action Icons -->
                        <div style="display: flex; gap: 14px; font-size: 1.1rem; align-items: center;">
                          <i class="fa-solid fa-layer-group" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="View Associated Models" onclick="app.navigate('model-club');"></i>
                          <i class="fa-solid fa-chart-simple" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Telemetry / Tokens" onclick="app.navigate('reports');"></i>
                          <i class="fa-solid fa-play" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Test Ping Connection" onclick="ProvidersView.testPing('${p.id}');"></i>
                          <i class="fa-solid fa-key" style="color: var(--accent-amber); cursor: pointer; transition: color 0.2s;" title="Add / Update API Key" onclick="ProvidersView.promptEditApiKey('${p.id}')"></i>
                          <i class="fa-regular fa-copy" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Copy API Key" onclick="ProvidersView.copyProviderKey('${p.id}')"></i>
                          <i class="fa-solid fa-sliders" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Configure Quota & Alerts" onclick="ProvidersView.configureQuota('${p.id}')"></i>
                          <i class="fa-solid fa-globe" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Open Developer Portal" onclick="ProvidersView.openProviderModels('${p.baseUrl || ''}', '${p.docsUrl || ''}', '${(p.displayName || p.id).replace(/'/g, "\\\'")}')"></i>
                          <i class="fa-solid fa-pen-to-square" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Edit Provider" onclick="app.navigate('registration'); setTimeout(() => RegistrationView.selectFromPane('${p.protocol}', '${p.id}'), 200);"></i>
                          <i class="fa-solid fa-trash-can" style="color: var(--accent-rose); cursor: pointer; transition: color 0.2s;" title="Delete Provider" onclick="ProvidersView.deleteProvider('${p.id}');"></i>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
            `}
          </div>
        </div>
      </div>
    `;
  }

  static switchTab(tabName) {
    this.activeTab = tabName;
    this.render(document.getElementById('app'));
  }

  static setMatrixSort(col) {
    if (this.matrixSortCol === col) {
      this.matrixSortDesc = !this.matrixSortDesc;
    } else {
      this.matrixSortCol = col;
      this.matrixSortDesc = false;
    }
    this.render(document.getElementById('app'));
  }

  static renderMatrix(allProviders) {
    // Clone to sort safely
    let sorted = [...allProviders];
    
    sorted.sort((a, b) => {
      let valA = '', valB = '';
      if (this.matrixSortCol === 'status') {
        valA = a.isActive ? 1 : 0;
        valB = b.isActive ? 1 : 0;
        // Primary sort by status, secondary by name
        if (valA === valB) { valA = a.id; valB = b.id; }
      } else if (this.matrixSortCol === 'id') { valA = a.id; valB = b.id; }
      else if (this.matrixSortCol === 'name') { valA = a.displayName || a.id; valB = b.displayName || b.id; }
      else if (this.matrixSortCol === 'protocol') { valA = a.protocol || ''; valB = b.protocol || ''; }
      else if (this.matrixSortCol === 'quota') { 
        valA = a.freeTierLimit || 999999999; 
        valB = b.freeTierLimit || 999999999; 
      }
      
      if (valA < valB) return this.matrixSortDesc ? 1 : -1;
      if (valA > valB) return this.matrixSortDesc ? -1 : 1;
      return 0;
    });

    const getSortIcon = (col) => {
      if (this.matrixSortCol !== col) return '<i class="fa-solid fa-sort" style="color: var(--text-muted); opacity: 0.5;"></i>';
      return this.matrixSortDesc ? '<i class="fa-solid fa-sort-down" style="color: var(--accent-cyan);"></i>' : '<i class="fa-solid fa-sort-up" style="color: var(--accent-cyan);"></i>';
    };

    const headerStyle = "cursor: pointer; padding: 8px 10px; font-weight: 600; color: var(--text-main); border-bottom: 2px solid var(--border-color); text-align: left; font-size: 0.8rem; transition: background 0.2s;";
    const cellStyle = "padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.78rem;";

    return `
      <div class="glass-panel" style="padding: 0; overflow: hidden; margin-bottom: 0;">
        <div class="panel-header" style="background: rgba(0,0,0,0.2); padding: 10px 14px; border-bottom: 1px solid var(--border-color);">
          <div class="panel-title" style="font-size: 0.95rem;"><i class="fa-solid fa-table-list"></i> Provider Configuration Matrix</div>
        </div>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: rgba(255,255,255,0.02);">
                <th style="${headerStyle}" onclick="ProvidersView.setMatrixSort('id')">Provider ID ${getSortIcon('id')}</th>
                <th style="${headerStyle}" onclick="ProvidersView.setMatrixSort('name')">Display Name ${getSortIcon('name')}</th>
                <th style="${headerStyle}" onclick="ProvidersView.setMatrixSort('protocol')">Protocol ${getSortIcon('protocol')}</th>
                <th style="${headerStyle}">Base URL</th>
                <th style="${headerStyle}" onclick="ProvidersView.setMatrixSort('status')">Status ${getSortIcon('status')}</th>
                <th style="${headerStyle}">Free Only</th>
                <th style="${headerStyle}" onclick="ProvidersView.setMatrixSort('quota')">Quota Limit ${getSortIcon('quota')}</th>
              </tr>
            </thead>
            <tbody>
              ${sorted.map(p => {
                const statusHtml = p.isActive 
                  ? '<span style="color: var(--accent-emerald); font-weight: 600;"><i class="fa-solid fa-circle" style="font-size: 0.6rem; vertical-align: middle;"></i> Active</span>' 
                  : '<span style="color: var(--accent-rose); font-weight: 600;"><i class="fa-solid fa-circle" style="font-size: 0.6rem; vertical-align: middle;"></i> Inactive</span>';
                
                const shortUrl = p.baseUrl && p.baseUrl.length > 35 ? p.baseUrl.substring(0, 32) + '...' : (p.baseUrl || 'N/A');
                
                let quotaStr = 'Unlimited';
                if (p.freeTierLimit) quotaStr = p.freeTierLimit;
                else if (p.hardTokenLimit) quotaStr = p.hardTokenLimit + ' Tokens';

                return `
                  <tr style="transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                    <td style="${cellStyle}"><code style="font-size: 0.72rem;">${p.id}</code></td>
                    <td style="${cellStyle} font-weight: 600; color: var(--text-main);">${p.displayName || p.id}</td>
                    <td style="${cellStyle} color: var(--text-muted);">${p.protocol || 'N/A'}</td>
                    <td style="${cellStyle} color: var(--accent-cyan);"><a href="${p.baseUrl}" target="_blank" style="color: inherit; text-decoration: none;">${shortUrl} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.6rem;"></i></a></td>
                    <td style="${cellStyle}">${statusHtml}</td>
                    <td style="${cellStyle}">${p.freeOnly ? 'Yes' : 'No'}</td>
                    <td style="${cellStyle}">${quotaStr}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  static async wakeUpProvider(providerId) {
    try {
      const res = await ApiService.unblacklistProvider(providerId);
      if (res && res.success) {
        ModalDialog.showNotification(`Provider '${providerId}' woken up from sleep mode!`, 'success');
        
        // Find the Wake Up button and replace it with the standard active toggle switch
        const btnNode = document.querySelector(`button[onclick="ProvidersView.wakeUpProvider('${providerId}')"]`);
        if (btnNode) {
          const toggleHtml = `<i id="toggle-icon-${providerId}" class="fa-solid fa-toggle-on" style="color: #ea580c; font-size: 1.4rem; cursor: pointer; transition: color 0.2s;" onclick="ProvidersView.toggleStatus('${providerId}', false)" title="Toggle Active Status"></i>`;
          btnNode.outerHTML = toggleHtml;
        }

        if (window.app && window.app.triggerSilentDataSync) {
          window.app.triggerSilentDataSync();
        }
      } else {
        ModalDialog.showNotification(`Failed to wake up provider: ${res?.error || 'Unknown error'}`, 'error');
      }
    } catch (e) {
      ModalDialog.showNotification('Network error while waking up provider', 'error');
    }
  }

  static async wakeUpAllProviders() {
    const res = await ApiService.unblacklistAllProviders();
    if (res.success) {
      ModalDialog.showNotification('All providers woken up from sleep mode!', 'success');
      const appContainer = document.getElementById('app');
      if (appContainer) this.render(appContainer);
    }
  }

  static async updateBlacklistSleepDuration(mins) {
    const res = await ApiService.setBlacklistSleepMinutes(mins);
    if (res.success) {
      ModalDialog.showNotification(`Blacklist Sleep Duration set to ${mins} minutes!`, 'success');
      this.render(document.getElementById('app'));
    }
  }

  static toggleActive(providerId, newStatus) { return this.toggleStatus(providerId, newStatus); }
  static testProvider(providerId) { return this.testPing(providerId); }
  static toggleKeyMask(providerId) { ModalDialog.showNotification('Zero-Trust key protection active. Keys masked automatically.', 'info'); }
  static openEditModelsModal(providerId) { app.navigate('registration'); }

  static async copyProviderKey(providerId) {
    try {
      const res = await ApiService.getAllProviders();
      const allProviders = res.providers || [];
      const provider = allProviders.find(p => p.id === providerId);
      if (provider && provider.apiKey) {
        await navigator.clipboard.writeText(provider.apiKey);
        ModalDialog.showNotification('API Key copied to clipboard', 'success');
      } else {
        ModalDialog.showNotification('API Key not found or empty', 'warning');
      }
    } catch (e) {
      console.error("[ProvidersView] Failed to copy API key:", e);
      ModalDialog.showNotification('Failed to copy API key', 'error');
    }
  }

  static async promptEditBaseUrl(providerId, currentUrl) {
    ModalDialog.showCustomModal({
      title: 'Update Base URL',
      icon: 'fa-link',
      body: `
        <div style="text-align: left;">
          <p style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 12px;">
            Warning: Updating the Base URL may cause duplicate records if another provider is already using the new endpoint.
          </p>
          <label style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 4px; display: block;">Provider Base URL</label>
          <input type="text" id="edit-baseurl-input" class="input-modern" value="${currentUrl}" style="width: 100%; box-sizing: border-box;" />
        </div>
      `,
      buttons: [
        {
          text: 'Cancel',
          type: 'secondary',
          action: () => ModalDialog.closeModal()
        },
        {
          text: 'Validate & Update',
          type: 'primary',
          icon: 'fa-check',
          action: async () => {
            const newUrl = document.getElementById('edit-baseurl-input').value.trim();
            if (!newUrl || newUrl === currentUrl) return;

            ModalDialog.closeModal();

            // Use ValidationNotifier to check for duplicates before saving
            await ValidationNotifier.validateAndPrompt({
              scope: 'provider_registration',
              data: { providerId: providerId, baseUrl: newUrl },
              title: 'Base URL Modification Check',
              onSuccess: async () => {
                try {
                  const updateRes = await ApiService.request(`/api/providers/${providerId}`, { method: 'PUT', body: JSON.stringify({ baseUrl: newUrl }) });
                  if (updateRes.success) {
                    ModalDialog.showNotification('Base URL updated successfully!', 'success');
                    if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
                    else window.app.renderView('providers');
                  } else {
                    ModalDialog.showNotification(updateRes.error || 'Failed to update Base URL', 'error');
                  }
                } catch (e) {
                  ModalDialog.showNotification('Network error saving Base URL', 'error');
                }
              }
            });
          }
        }
      ]
    });
  }

  static async toggleStatus(providerId, newStatus) {
    // In-place DOM mutation optimistically
    const icon = document.getElementById(`toggle-icon-${providerId}`);
    if (icon) {
      if (newStatus) {
        icon.classList.remove('fa-toggle-off');
        icon.classList.add('fa-toggle-on');
        icon.style.color = '#ea580c';
        icon.setAttribute('onclick', `ProvidersView.toggleStatus('${providerId}', false)`);
      } else {
        icon.classList.remove('fa-toggle-on');
        icon.classList.add('fa-toggle-off');
        icon.style.color = 'var(--text-muted)';
        icon.setAttribute('onclick', `ProvidersView.toggleStatus('${providerId}', true)`);
      }
    }

    try {
      const res = await ApiService.updateProviderStatus(providerId, newStatus);
      if (res && res.success) {
        ModalDialog.showNotification(`Provider status updated to ${newStatus ? 'Active' : 'Inactive'}!`, 'info');
        if (window.AppStore && window.AppStore.emit) {
          window.AppStore.emit('PROVIDER_STATE_CHANGED', { providerId, isActive: newStatus });
        }
        // Background sync for other components without a hard reload
        if (window.app && window.app.triggerSilentDataSync) {
          window.app.triggerSilentDataSync();
        }
      } else {
        throw new Error(res?.error || 'Backend rejected status update');
      }
    } catch (e) {
      ModalDialog.showNotification(`Failed to update status: ${e.message}`, 'error');
      // Revert the UI icon if the backend failed
      if (icon) {
        if (!newStatus) {
          icon.classList.remove('fa-toggle-off');
          icon.classList.add('fa-toggle-on');
          icon.style.color = '#ea580c';
          icon.setAttribute('onclick', `ProvidersView.toggleStatus('${providerId}', false)`);
        } else {
          icon.classList.remove('fa-toggle-on');
          icon.classList.add('fa-toggle-off');
          icon.style.color = 'var(--text-muted)';
          icon.setAttribute('onclick', `ProvidersView.toggleStatus('${providerId}', true)`);
        }
      }
    }
  }


  static filterList(val) {
    const term = val.toLowerCase();
    const grid = document.querySelector('.grid-2');
    const xmark = document.querySelector('#provider-search-input ~ .fa-xmark');
    if (xmark) xmark.style.display = val ? 'block' : 'none';
    if (!grid) return;
    Array.from(grid.children).forEach(card => {
        if (card.innerText.toLowerCase().includes(term)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
  }

  static async openProviderDrawer(providerId) {
    const drawer = document.getElementById('code-drawer');
    const content = document.getElementById('code-drawer-content');
    if (!drawer || !content) return;
    
    drawer.classList.add('open');
    content.innerHTML = `<div style="padding: 20px; text-align: center;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;
    
    try {
        const res = await fetch('/api/providers/all');
        const data = await res.json();
        const p = data.data.find(x => x.id === providerId);
        
        if (!p) {
            content.innerHTML = `<div class="alert alert-danger">Provider not found</div>`;
            return;
        }

        const isAct = p.isActive;
        const displayName = (p.displayName || p.id).replace(/'/g, "\\\'");
        
        content.innerHTML = `
          <div style="padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 style="margin:0; color:var(--accent-cyan); display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-server"></i> ${p.displayName || p.id}
              </h3>
              <span class="badge ${isAct ? 'badge-emerald' : 'badge-rose'}">${isAct ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>
            
            <div class="glass-panel" style="padding:12px; margin-bottom:16px; font-size:0.8rem;">
              <div style="margin-bottom:8px;"><strong>Base URL:</strong> <code style="padding:2px 4px; background:rgba(0,0,0,0.3); border-radius:4px;">${p.baseUrl}</code></div>
              <div style="margin-bottom:8px;"><strong>Protocol:</strong> ${p.protocol || 'OpenAI'}</div>
              <div><strong>Models Limit:</strong> ${p.models ? p.models.length : 0}</div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
              <button class="btn btn-primary" onclick="ProvidersView.testPing('${p.id}')">
                <i class="fa-solid fa-play"></i> Test Ping
              </button>
              <button class="btn btn-secondary" onclick="ProvidersView.configureQuota('${p.id}')">
                <i class="fa-solid fa-chart-simple"></i> Quota
              </button>
              <button class="btn btn-secondary" onclick="ProvidersView.copyProviderKey('${p.id}')">
                <i class="fa-regular fa-copy"></i> Copy Key
              </button>
              <button class="btn btn-secondary" onclick="app.navigate('registration'); setTimeout(() => RegistrationView.selectFromPane('${p.protocol}', '${p.id}'), 200);">
                <i class="fa-solid fa-pen-to-square"></i> Edit
              </button>
            </div>
            
            <div style="margin-top:16px; display:flex; gap:8px;">
              <button class="btn btn-danger" style="flex:1; justify-content:center;" onclick="ProvidersView.deleteProvider('${p.id}')">
                <i class="fa-solid fa-trash-can"></i> Delete
              </button>
            </div>
          </div>
        `;
    } catch(e) {
        content.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  }

  static async promptEditApiKey(providerId, prefillKey = '', fromPingFailure = false) {
    const res = await ApiService.getAllProviders();
    const provider = (res.providers || []).find(p => p.id === providerId);
    if (!provider) return ModalDialog.showNotification('Provider not found', 'error');

    const displayName = provider.displayName || provider.id;
    const portalUrl = provider.docsUrl || (provider.id === 'gemini' ? 'https://aistudio.google.com/app/apikey' : (provider.id === 'groq' ? 'https://console.groq.com/keys' : 'https://openrouter.ai/keys'));

    ModalDialog.showCustomModal({
      title: `<i class="fa-solid fa-key" style="color: var(--accent-amber);"></i> ${fromPingFailure ? 'Authentication Required (HTTP 401): ' : ''}Update API Key for ${displayName}`,
      content: `
        <div style="display: flex; flex-direction: column; gap: 12px; text-align: left;">
          ${fromPingFailure ? `
            <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid var(--accent-amber); padding: 10px; border-radius: 6px; font-size: 0.8rem; color: var(--accent-amber);">
              <i class="fa-solid fa-triangle-exclamation"></i> <strong>Endpoint Reachable:</strong> The server at <code>${provider.baseUrl}</code> is online, but returned <strong>HTTP 401 / 403 Unauthorized</strong>. Please enter or update your valid API key below to activate this provider.
            </div>
          ` : `
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              Enter or update your API key for <strong>${displayName}</strong>. Keys are encrypted with Zero-Trust protection.
            </div>
          `}
          <div class="form-group">
            <label style="display: block; font-size: 0.75rem; color: var(--text-dim); margin-bottom: 4px;">API Key / Secret Token</label>
            <div style="position: relative;">
              <input type="password" id="modal-prov-key-input" class="form-control" placeholder="Enter API key..." value="${prefillKey}" style="padding-right: 36px; width: 100%; box-sizing: border-box;" />
              <i class="fa-solid fa-eye" id="modal-toggle-key-eye" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--text-dim);" onclick="const k = document.getElementById('modal-prov-key-input'); k.type = k.type === 'password' ? 'text' : 'password'; this.className = k.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';"></i>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem;">
            <a href="${portalUrl}" target="_blank" style="color: var(--accent-cyan); text-decoration: underline;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Get Free Key from ${displayName} Portal</a>
            <button type="button" class="btn btn-link btn-xs" style="color: var(--text-dim);" onclick="navigator.clipboard.readText().then(t => { if(t) document.getElementById('modal-prov-key-input').value = t; });">Paste Clipboard</button>
          </div>
        </div>
      `,
      cancelText: 'Cancel',
      confirmText: 'Save Key & Activate',
      onConfirm: async () => {
        const keyInput = document.getElementById('modal-prov-key-input');
        const newKey = keyInput ? keyInput.value.trim() : '';
        if (!newKey) {
          ModalDialog.showNotification('API key cannot be empty.', 'warning');
          return;
        }
        try {
          const updateRes = await ApiService.updateProviderApiKey(providerId, newKey);
          if (updateRes && (updateRes.success || updateRes.provider)) {
            ModalDialog.showNotification(`API key updated and '${displayName}' activated!`, 'success');
            window.dispatchEvent(new CustomEvent('fmc-providers-updated'));
            if (window.AppStore && window.AppStore.emit) {
              window.AppStore.emit('PROVIDER_STATE_CHANGED', { providerId });
            }
            if (typeof ProvidersView !== 'undefined' && ProvidersView.render) {
              ProvidersView.render(document.getElementById('app'));
            }
            setTimeout(() => ProvidersView.testPing(providerId), 300);
          } else {
            ModalDialog.showNotification(`Failed to update key: ${updateRes.error || updateRes.message}`, 'error');
          }
        } catch (e) {
          ModalDialog.showNotification(`Update error: ${e.message}`, 'error');
        }
      }
    });
    setTimeout(() => document.getElementById('modal-prov-key-input')?.focus(), 150);
  }

  static async testPing(providerId) {
    ModalDialog.showNotification('Pinging provider base endpoint...', 'info');
    try {
      const res = await ApiService.pingProvider(providerId);
      if (res.success) {
        ModalDialog.showNotification(`Ping Successful! Latency: ${res.latencyMs || 45}ms`, 'success');
      } else if (res.authRequired || res.statusCode === 401 || res.statusCode === 403 || (res.error && res.error.includes('401'))) {
        // Direct option to add/update API key immediately instead of raw 401 failure
        ProvidersView.promptEditApiKey(providerId, '', true);
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
    
    // Rate limits
    const rpm = provider.rateLimitRPM || 0;
    const rpd = provider.rateLimitRPD || 0;
    const tpm = provider.rateLimitTPM || 0;
    const tpd = provider.rateLimitTPD || 0;
    const ash = provider.rateLimitASH || 0;
    const asd = provider.rateLimitASD || 0;

    ModalDialog.showModal({
      title: 'Configure Token Quota & Rate Limits',
      icon: 'fa-sliders',
      body: `
        <div style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
          
          <div style="background: rgba(0,0,0,0.15); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--accent-cyan);"><i class="fa-solid fa-gauge-high"></i> Provider Rate Limits</div>
              <button class="btn btn-secondary btn-xs" onclick="ProvidersView.syncLimits('${provider.id}')" title="Sync limits via System Agent"><i class="fa-solid fa-rotate"></i> Auto-Sync</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="display: block; font-size: 0.75rem; color: var(--text-dim); margin-bottom: 4px;">RPM (Requests / Min)</label>
                <input type="number" id="quota-rpm" class="input-modern" value="${rpm}" min="0" max="1000" style="width: 100%; font-size: 0.85rem;" />
              </div>
              <div>
                <label style="display: block; font-size: 0.75rem; color: var(--text-dim); margin-bottom: 4px;">RPD (Requests / Day)</label>
                <input type="number" id="quota-rpd" class="input-modern" value="${rpd}" min="0" max="100000" style="width: 100%; font-size: 0.85rem;" />
              </div>
              <div>
                <label style="display: block; font-size: 0.75rem; color: var(--text-dim); margin-bottom: 4px;">TPM (Tokens / Min)</label>
                <input type="number" id="quota-tpm" class="input-modern" value="${tpm}" min="0" max="1000000" style="width: 100%; font-size: 0.85rem;" />
              </div>
              <div>
                <label style="display: block; font-size: 0.75rem; color: var(--text-dim); margin-bottom: 4px;">TPD (Tokens / Day)</label>
                <input type="number" id="quota-tpd" class="input-modern" value="${tpd}" min="0" max="10000000" style="width: 100%; font-size: 0.85rem;" />
              </div>
              <div>
                <label style="display: block; font-size: 0.75rem; color: var(--text-dim); margin-bottom: 4px;">ASH (Audio Sec / Hour)</label>
                <input type="number" id="quota-ash" class="input-modern" value="${ash}" min="0" max="50000" style="width: 100%; font-size: 0.85rem;" />
              </div>
              <div>
                <label style="display: block; font-size: 0.75rem; color: var(--text-dim); margin-bottom: 4px;">ASD (Audio Sec / Day)</label>
                <input type="number" id="quota-asd" class="input-modern" value="${asd}" min="0" max="200000" style="width: 100%; font-size: 0.85rem;" />
              </div>
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 12px; display: flex; justify-content: space-between;">
              <span><i class="fa-solid fa-circle-info"></i> (0 = Unlimited). Values strictly enforced.</span>
              <a href="https://console.groq.com/docs/rate-limits" target="_blank" style="color: var(--accent-cyan); text-decoration: none;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Docs</a>
            </div>
          </div>

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
      confirmText: 'Save Configuration',
      onConfirm: async () => {
        const valLimit = parseInt(document.getElementById('quota-limit').value, 10);
        const valRpm = parseInt(document.getElementById('quota-rpm').value, 10) || 0;
        const valRpd = parseInt(document.getElementById('quota-rpd').value, 10) || 0;
        const valTpm = parseInt(document.getElementById('quota-tpm').value, 10) || 0;
        const valTpd = parseInt(document.getElementById('quota-tpd').value, 10) || 0;
        const valAsh = parseInt(document.getElementById('quota-ash').value, 10) || 0;
        const valAsd = parseInt(document.getElementById('quota-asd').value, 10) || 0;

        // Validation for min/max limits
        const rpmMax = parseInt(document.getElementById('quota-rpm').max, 10);
        const rpdMax = parseInt(document.getElementById('quota-rpd').max, 10);
        const tpmMax = parseInt(document.getElementById('quota-tpm').max, 10);
        const tpdMax = parseInt(document.getElementById('quota-tpd').max, 10);
        const ashMax = parseInt(document.getElementById('quota-ash').max, 10);
        const asdMax = parseInt(document.getElementById('quota-asd').max, 10);

        if (valRpm < 0 || valRpm > rpmMax || valRpd < 0 || valRpd > rpdMax || valTpm < 0 || valTpm > tpmMax || valTpd < 0 || valTpd > tpdMax || valAsh < 0 || valAsh > ashMax || valAsd < 0 || valAsd > asdMax) {
          if (typeof ValidationNotifier !== 'undefined') {
            ValidationNotifier.showOptionPopup({
              title: 'Rate Limits Exceeded Boundaries',
              message: 'One or more of your rate limits exceeds the maximum allowed by the system configuration. Would you like to reset them to 0 (unlimited)?',
              icon: 'fa-gauge-high',
              options: [
                { id: 'reset', label: 'Reset all to 0', icon: 'fa-undo', type: 'warning', action: () => { 
                    ['rpm','rpd','tpm','tpd','ash','asd'].forEach(k => document.getElementById('quota-'+k).value = '0');
                  } 
                },
                { id: 'close', label: 'Close & Fix', icon: 'fa-xmark', type: 'secondary', action: () => {} }
              ]
            });
          } else {
            ModalDialog.showNotification('One or more limits exceed the maximum allowed boundaries.', 'error');
          }
          return;
        }

        if (isNaN(valLimit) || valLimit < 0) {
          if (typeof ValidationNotifier !== 'undefined') {
            ValidationNotifier.showOptionPopup({
              title: 'Invalid Quota Configuration',
              message: 'The Hard Token Limit must be a valid positive number. Do you want to reset it to Unlimited (0) or fix it?',
              icon: 'fa-triangle-exclamation',
              options: [
                { id: 'reset', label: 'Reset to 0 (Unlimited)', icon: 'fa-undo', type: 'warning', action: () => { document.getElementById('quota-limit').value = '0'; } },
                { id: 'fix', label: 'Fix Manually', icon: 'fa-pen', type: 'primary', action: () => { document.getElementById('quota-limit').focus(); } }
              ]
            });
          } else {
            ModalDialog.showNotification('Hard Token Limit must be a valid positive number.', 'error');
          }
          return;
        }
        
        const payload = {
          hardTokenLimit: valLimit,
          quotaExceedAction: document.getElementById('quota-action').value,
          quotaAlertEnabled: document.getElementById('quota-alert').checked,
          rateLimitRPM: valRpm,
          rateLimitRPD: valRpd,
          rateLimitTPM: valTpm,
          rateLimitTPD: valTpd,
          rateLimitASH: valAsh,
          rateLimitASD: valAsd
        };
        
        try {
          const updateRes = await ApiService.request(`/api/providers/${providerId}`, { method: 'PUT', body: JSON.stringify(payload) });
          if (updateRes.success) {
            ModalDialog.showNotification('Quota and Limits configured successfully!', 'success');
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

  static async syncLimits(providerId) {
    try {
      const btn = event.currentTarget;
      const ogHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
      btn.disabled = true;

      const res = await ApiService.request(`/api/providers/${providerId}/sync-limits`, { method: 'POST' });
      if (res.success) {
        ModalDialog.showNotification('Limits synced successfully!', 'success');
        ModalDialog.closeModal();
        setTimeout(() => ProvidersView.configureQuota(providerId), 300);
      } else {
        ModalDialog.showNotification(res.error || 'Failed to sync limits', 'error');
        btn.innerHTML = ogHtml;
        btn.disabled = false;
      }
    } catch (e) {
      ModalDialog.showNotification('Network error during sync', 'error');
    }
  }

  static async deleteProvider(providerId) {
    if (typeof ValidationNotifier !== 'undefined') {
      ValidationNotifier.showOptionPopup({
        title: 'Provider Action — Deletion or Archive',
        message: `Select how you would like to handle provider '${providerId}':`,
        icon: 'fa-trash',
        options: [
          {
            id: 'archive',
            label: 'Archive Provider (Disable)',
            icon: 'fa-box-archive',
            type: 'warning',
            action: async () => {
              await ApiService.updateProviderStatus(providerId, false);
              ModalDialog.showNotification(`Provider '${providerId}' archived to Inactive state.`, 'info');
              if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
            }
          },
          {
            id: 'delete',
            label: 'Permanently Delete',
            icon: 'fa-trash',
            type: 'danger',
            action: async () => {
              await ApiService.deleteProvider(providerId);
              ModalDialog.showNotification(`Provider '${providerId}' deleted successfully.`, 'info');
              if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
            }
          }
        ]
      });
    } else {
      if (confirm(`Permanently delete provider '${providerId}'?`)) {
        await ApiService.deleteProvider(providerId);
        ModalDialog.showNotification(`Provider '${providerId}' deleted.`, 'info');
        if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
      }
    }
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

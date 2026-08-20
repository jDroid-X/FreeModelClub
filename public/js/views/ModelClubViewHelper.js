/**
 * ModelClubViewHelper.js
 * Purpose: Helper module for ModelClubView containing model comparison modal, combo simulator,
 *          circuit-breaker health probe testing, and JSON backup export/import tools.
 */

class ModelClubViewHelper {
  static renderModelCardHtml(m, showActions = true) {
    const consumedTokens = (m.totalPromptTokens || 0) + (m.totalCompletionTokens || 0);
    return `
      <div class="glass-card tile-card" style="padding: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <h4 style="color: var(--text-main); font-size: 0.95rem; margin: 0; font-weight: 700;">
            ${typeof FormatHelper !== 'undefined' ? FormatHelper.getModelDisplayName(m) : (m.modelName || m.modelId)}
          </h4>
          <span class="badge badge-emerald">Free</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px; display: flex; flex-direction: column; gap: 3px;">
          <div><i class="fa-solid fa-server" style="width: 16px;"></i> Provider: <strong style="color: var(--primary-light);">${typeof FormatHelper !== 'undefined' ? FormatHelper.getProviderDisplayName(m) : m.providerName}</strong></div>
          <div><i class="fa-solid fa-microchip" style="width: 16px;"></i> Family: <span style="color: var(--accent-cyan);">${m.family || 'General'}</span></div>
          <div><i class="fa-solid fa-bolt" style="width: 16px;"></i> Skill: <span>${m.coreSkill || 'General Knowledge'}</span></div>
          <div><i class="fa-solid fa-memory" style="width: 16px;"></i> Context Window: <span>${m.contextWindow ? (m.contextWindow / 1000) + 'k' : '128k'} tokens</span></div>
          <div><i class="fa-solid fa-coins" style="width: 16px; color: var(--accent-emerald);"></i> Tokens: <strong style="color: var(--accent-emerald);">${consumedTokens} / Unlimited Tokens</strong></div>
        </div>
        ${showActions ? `
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px;">
          <!-- Left side: Toggle switch -->
          <i class="fa-solid ${m.status !== 'Inactive' ? 'fa-toggle-on' : 'fa-toggle-off'}" style="color: ${m.status !== 'Inactive' ? '#ea580c' : 'var(--text-muted)'}; font-size: 1.4rem; cursor: pointer; transition: color 0.2s;" onclick="event.stopPropagation(); ModelClubView.toggleModel('${m.id}')" title="Toggle Active Status"></i>
          
          <!-- Right side: Standard Action Icons -->
          <div style="display: flex; gap: 14px; font-size: 1.1rem; align-items: center;">
            <i class="fa-solid fa-layer-group" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="View associated Combos" onclick="event.stopPropagation(); ModelClubView.selectTreeNode('combos', null)"></i>
            <i class="fa-solid fa-chart-simple" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Telemetry / Tokens" onclick="event.stopPropagation(); app.navigate('reports')"></i>
            <i class="fa-solid fa-play" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Test Ping Connection" onclick="event.stopPropagation(); ModelClubView.testModel('${m.id}', this)"></i>
            <i class="fa-regular fa-copy" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Copy Model ID" onclick="event.stopPropagation(); navigator.clipboard.writeText('${(m.modelId || '').replace(/'/g, "\\'")}'); ModalDialog.showNotification('Model ID copied to clipboard', 'success');"></i>
            <i class="fa-solid fa-globe" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Test in Playground" onclick="event.stopPropagation(); app.navigate('playground'); setTimeout(() => PlaygroundView.selectModel('${m.id}'), 100);"></i>
            <i class="fa-solid fa-pen-to-square" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Edit Taxonomy" onclick="event.stopPropagation(); ModelClubView.openEditTaxonomyModal('${m.id}')"></i>
            <i class="fa-solid fa-trash-can" style="color: var(--accent-rose); cursor: pointer; transition: color 0.2s;" title="Disable Model" onclick="event.stopPropagation(); ModelClubView.toggleModel('${m.id}')"></i>
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }

  static renderModelCompareModal(activeModels) {
    ModalDialog.showModal({
      title: 'Side-by-Side Model Comparison Matrix',
      icon: 'fa-code-compare',
      body: `
        <div style="max-height: 450px; overflow-y: auto;">
          <table class="table-custom" style="width: 100%; font-size: 0.8rem;">
            <thead>
              <tr>
                <th>Model Name</th>
                <th>Provider</th>
                <th>Family</th>
                <th>Core Skill</th>
                <th>Context Window</th>
                <th>Latency</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${activeModels.map(m => `
                <tr>
                  <td><strong style="color: var(--text-main);">${typeof FormatHelper !== 'undefined' ? FormatHelper.getModelDisplayName(m) : (m.modelName || m.modelId)}</strong></td>
                  <td><span class="badge badge-steel">${typeof FormatHelper !== 'undefined' ? FormatHelper.getProviderDisplayName(m) : m.providerName}</span></td>
                  <td><span style="color: var(--accent-cyan);">${m.family || 'General'}</span></td>
                  <td>${m.coreSkill || 'General'}</td>
                  <td>${m.contextWindow ? (m.contextWindow / 1000) + 'k' : '128k'}</td>
                  <td>~${m.latencyMs || 100}ms</td>
                  <td>
                    <button class="btn btn-secondary btn-xs" onclick="app.navigate('playground'); ModalDialog.closeModal();">Select</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `,
      cancelText: 'Close'
    });
  }

  static renderComboCardHtml(c) {
    const stratMap = {
      'Round Robin': 'badge-steel',
      'Fallback': 'badge-amber',
      'Auto': 'badge-emerald',
      'Cost Optimized': 'badge-cyan',
      'Least Used': 'badge-purple',
      'Power of 2 Choices': 'badge-amber',
      'LKGP': 'badge-steel',
      'Fill First': 'badge-active',
      'Lowest Latency': 'badge-emerald'
    };
    const strategyBadge = stratMap[c.strategy] || 'badge-active';
    const isExpanded = ModelClubView.expandedComboId === c.id;
    const tokenSumStr = typeof FormatHelper !== 'undefined' ? FormatHelper.formatTokenSumString(c.modelsList || [], ModelClubView.allModels || [], ModelClubView.allProviders || [], 'Tokens') : '0 / Unlimited Tokens';

    return `
      <div class="glass-card" style="padding: 16px; border-color: ${c.isActive ? 'var(--border-color)' : 'var(--accent-rose)'}; cursor: pointer;"
           onclick="event.stopPropagation(); ModelClubView.expandedComboId='${c.id}'; ModelClubView.switchView(ModelClubView.currentViewMode);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div>
            <h4 style="font-size: 1.05rem; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              ${c.name}
              <span class="badge ${strategyBadge}">${c.strategy} Strategy</span>
              <span class="badge badge-emerald" style="font-size: 0.72rem;"><i class="fa-solid fa-coins"></i> Tokens: ${tokenSumStr}</span>
            </h4>
          </div>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">
          <strong>Pooled Models (${c.modelsList ? c.modelsList.length : 0}):</strong>
          <ul style="margin: 4px 0 0 16px; color: var(--primary-light);">
            ${(c.modelsList || []).map(mId => {
              const m = (ModelClubView.allModels || []).find(x => x.id === mId || x.modelId === mId);
              const p = m ? (ModelClubView.allProviders || []).find(prov => prov.id === m.providerId) : null;
              const isOnline = p ? p.isActive !== false : true;
              const healthBadge = isOnline 
                ? `<span class="badge badge-emerald" style="font-size: 0.62rem; margin-left: 6px;"><i class="fa-solid fa-heart-pulse"></i> Healthy</span>`
                : `<span class="badge badge-rose" style="font-size: 0.62rem; margin-left: 6px;"><i class="fa-solid fa-triangle-exclamation"></i> Offline</span>`;
              const labelText = m ? FormatHelper.formatModelLabel(m, p) : mId;
              return `<li style="margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.05); padding-bottom: 2px;"><code>${labelText}</code> ${healthBadge}</li>`;
            }).join('')}
          </ul>
        </div>
        ${c.description ? `<p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px; font-style: italic;">${c.description}</p>` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px; margin-top: 10px;">
          <!-- Left side: Toggle switch -->
          <i class="fa-solid ${c.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}" style="color: ${c.isActive ? '#ea580c' : 'var(--text-muted)'}; font-size: 1.4rem; cursor: pointer; transition: color 0.2s;" onclick="event.stopPropagation(); ModelClubView.toggleCombo('${c.id}')" title="Toggle Active Status"></i>
          
          <!-- Right side: Standard Action Icons -->
          <div style="display: flex; gap: 14px; font-size: 1.1rem; align-items: center;">
            <i class="fa-solid fa-layer-group" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="List Models" onclick="event.stopPropagation(); ModelClubView.selectTreeNode('family', null)"></i>
            <i class="fa-solid fa-chart-simple" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Combo Stats" onclick="event.stopPropagation(); ModelClubView.loadComboStats('${c.id}')"></i>
            <i class="fa-solid fa-flask" style="color: var(--accent-amber); cursor: pointer; transition: color 0.2s;" title="Test Combo Router Simulator" onclick="event.stopPropagation(); ModelClubView.loadComboTest('${c.id}')"></i>
            <i class="fa-solid fa-clone" style="color: var(--accent-cyan); cursor: pointer; transition: color 0.2s;" title="1-Click Clone Combo" onclick="event.stopPropagation(); ModelClubComboHelper.cloneCombo('${c.id}', ModelClubView.allCombos, () => ModelClubView.render(document.getElementById('view-content-pane')))"></i>
            <i class="fa-regular fa-copy" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Copy Combo ID" onclick="event.stopPropagation(); navigator.clipboard.writeText('${(c.id || '').replace(/'/g, "\\'")}'); ModalDialog.showNotification('Combo ID copied!', 'success');"></i>
            <i class="fa-solid fa-globe" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Test in Playground" onclick="event.stopPropagation(); app.navigate('playground'); setTimeout(() => PlaygroundView.selectModel('${c.id}'), 100);"></i>
            <i class="fa-solid fa-pen-to-square" style="color: var(--text-muted); cursor: pointer; transition: color 0.2s;" title="Edit Combo" onclick="event.stopPropagation(); ModelClubView.openEditComboModal('${c.id}')"></i>
            <i class="fa-solid fa-trash-can" style="color: var(--accent-rose); cursor: pointer; transition: color 0.2s;" title="Delete Combo" onclick="event.stopPropagation(); ModelClubView.deleteCombo('${c.id}')"></i>
          </div>
        </div>
        ${isExpanded ? `
        <div style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px;">
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <button class="btn btn-secondary btn-xs" onclick="event.stopPropagation(); ModelClubView.loadComboStats('${c.id}')">
              <i class="fa-solid fa-chart-bar"></i> Stats
            </button>
            <button class="btn btn-secondary btn-xs" onclick="event.stopPropagation(); ModelClubView.loadComboTest('${c.id}')">
              <i class="fa-solid fa-flask"></i> Test Run
            </button>
          </div>
          <div id="combo-drawer-${c.id}"></div>
        </div>
        ` : ''}
      </div>
    `;
  }

  static renderComboStatsDrawer(comboId, data) {
    const el = document.getElementById(`combo-drawer-${comboId}`);
    if (!el) return;
    el.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 12px;">
        <div style="background: var(--bg-secondary); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.7rem; color: var(--text-muted);">TOTAL REQUESTS</div>
          <div style="font-size: 1rem; font-weight: 700;">${data.stats.total_requests}</div>
        </div>
        <div style="background: var(--bg-secondary); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.7rem; color: var(--text-muted);">TOKENS SPENT</div>
          <div style="font-size: 1rem; font-weight: 700;">${data.stats.total_tokens}</div>
        </div>
        <div style="background: var(--bg-secondary); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.7rem; color: var(--text-muted);">AVG LATENCY</div>
          <div style="font-size: 1rem; font-weight: 700;">${(data.stats.avg_latency / 1000).toFixed(2)}s</div>
        </div>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px;">Routed Model Breakdown</div>
      <table class="table-custom" style="width: 100%; font-size: 0.75rem;">
        <thead><tr><th>Model</th><th>Provider</th><th>Calls</th><th>Tokens</th></tr></thead>
        <tbody>
          ${data.modelBreakdown.map((row) => `
            <tr><td>${row.model}</td><td>${row.provider_id}</td><td>${row.requests}</td><td>${row.tokens}</td></tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  static renderComboTestDrawer(comboId, data) {
    const el = document.getElementById(`combo-drawer-${comboId}`);
    if (!el) return;
    el.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 12px;">
        <div style="background: var(--bg-secondary); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.7rem; color: var(--accent-green);">ACTIVE PROVIDERS</div>
          <div style="font-size: 1rem; font-weight: 700;">          ${data.providerStatus.filter((p) => p.status === 'active').length}</div>
        </div>
        <div style="background: var(--bg-secondary); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.7rem; color: var(--accent-red);">INACTIVE PROVIDERS</div>
          <div style="font-size: 1rem; font-weight: 700;">          ${data.providerStatus.filter((p) => p.status !== 'active').length}</div>
        </div>
        <div style="background: var(--bg-secondary); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.7rem; color: var(--accent-cyan);">PRIORITY SORT</div>
          <div style="font-size: 0.9rem; font-weight: 700;">Complete</div>
        </div>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px;">Provider Verification Status</div>
      <table class="table-custom" style="width: 100%; font-size: 0.75rem;">
        <thead><tr><th>Provider</th><th>Status</th><th>Daily</th><th>Monthly</th></tr></thead>
        <tbody>
          ${data.providerStatus.map((p) => `
            <tr><td>${p.display_name}</td><td><span class="badge ${p.status === 'active' ? 'badge-active' : 'badge-error'}">${p.status.toUpperCase()}</span></td><td>${p.daily_limit}</td><td>${p.monthly_limit}</td></tr>
          `).join('')}
        </tbody>
      </table>
      <pre style="background: #070a13; border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; font-size: 0.7rem; color: var(--accent-emerald); margin-top: 10px; white-space: pre-wrap; max-height: 160px; overflow-y: auto;">${data.logs}</pre>
    `;
  }

  static async promptAddToCombos(model, combos) {
    return new Promise((resolve) => {
      const selected = new Set();
      ModalDialog.showModal({
        title: 'Add Model to Combos',
        icon: 'fa-circle-nodes',
        body: `
          <p style="font-size: 0.85rem; margin-bottom: 16px;">
            You just activated <strong>${model.modelName || model.modelId}</strong>. Which existing combos should its provider be added to?
          </p>
          <div style="display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto;">
            ${combos.map(combo => `
              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer;">
                <input type="checkbox" class="add-to-combo-cb" value="${combo.id}" />
                ${combo.name}
              </label>
            `).join('')}
          </div>
        `,
        confirmText: 'Add to Selected',
        onConfirm: () => {
          document.querySelectorAll('.add-to-combo-cb:checked').forEach(cb => selected.add(cb.value));
          ModalDialog.closeModal();
          resolve(Array.from(selected));
        },
        cancelText: 'Skip'
      });
    });
  }
}

window.ModelClubViewHelper = ModelClubViewHelper;


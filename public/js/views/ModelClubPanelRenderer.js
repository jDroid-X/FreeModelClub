/**
 * ModelClubPanelRenderer.js
 * Purpose: Dedicated View Renderer Component for N-Pane Matrix boxes & top detail banners with Free Selection Mode (< 170 lines).
 * Dependencies: FormatHelper, ModelClubHierarchyHelper, ModelClubView
 */

class ModelClubPanelRenderer {
  static renderTopDetailBanner(viewLevel, activeItem, combos, skillGroups, familyGroups, providers, models, isFreeSelectionMode = false) {
    const lvl = viewLevel, itm = activeItem;
    let icon = 'fa-gem', title = 'Combo Club', color = 'var(--accent-emerald)', bg = 'rgba(16,185,129,0.02)', sub1 = 'Master Aggregator Agent', sub2 = 'Dynamic N-Pane Pyramid Matrix', modelCount = 0, tokenHtml = '', limitsHtml = '', btnHtml = '';

    const fmt = (typeof FormatHelper !== 'undefined') ? FormatHelper : null;

    if (lvl === 'combos') {
      const c = (combos || []).find(x => x.id === itm) || (combos || [])[0] || {};
      icon = 'fa-layer-group'; title = c.name || 'Model Combo'; color = 'var(--accent-emerald)'; bg = 'rgba(16,185,129,0.02)';
      const lkgpInfo = c.lastKnownGoodModelId ? ` | Pinned (LKGP): ${c.lastKnownGoodModelId}` : '';
      sub1 = `Strategy: ${c.strategy || 'Round Robin'}${lkgpInfo}`;
      sub2 = `${c.description || 'Model combo cluster'}`;
      const comboModels = (c.modelsList || []).map(id => (models || []).find(m => m.id === id || m.modelId === id)).filter(Boolean);
      modelCount = comboModels.length;
      if (fmt && comboModels.length > 0) {
        const sums = fmt.calculateSkillTokenSums(comboModels, providers);
        tokenHtml = `<strong>Tokens:</strong> <span style="color:var(--accent-emerald);font-weight:600;">${fmt.formatNumberAutoUnit(sums.consumed)} Consumed</span> <span style="color:var(--border-color);margin:0 4px;">|</span> <span style="color:var(--accent-cyan);font-weight:600;">${fmt.formatNumberAutoUnit(sums.available)} Available</span>`;
        limitsHtml = `<strong>Limits (Est):</strong> ${fmt.formatNumberAutoUnit(sums.available / Math.max(1, comboModels.length))} Avg TPM/RPM`;
      }
      btnHtml = `<button class="btn btn-secondary btn-xs" onclick="ModelClubView.openEditComboModal('${c.id||''}')"><i class="fa-solid fa-pen-to-square"></i> Edit Combo</button>`;
    } else if (lvl === 'skills') {
      const sg = (skillGroups || []).find(x => x.skillName === itm) || {};
      icon = 'fa-brain'; title = `Core Skill: ${itm || 'Skill'}`; color = 'var(--accent-amber)'; bg = 'rgba(245,158,11,0.02)';
      sub1 = `Classification: Skill Grouping`;
      sub2 = `Groups models optimized for ${itm || 'specific tasks'}`;
      modelCount = (sg.models||[]).length;
      if (fmt && modelCount > 0) {
        const sums = fmt.calculateSkillTokenSums(sg.models, providers);
        tokenHtml = `<strong>Tokens:</strong> <span style="color:var(--accent-amber);font-weight:600;">${fmt.formatNumberAutoUnit(sums.consumed)} Consumed</span> <span style="color:var(--border-color);margin:0 4px;">|</span> <span style="color:var(--accent-cyan);font-weight:600;">${fmt.formatNumberAutoUnit(sums.available)} Available</span>`;
        limitsHtml = `<strong>Limits (Est):</strong> High-availability skill pool`;
      }
      btnHtml = `<button class="btn btn-amber btn-xs" onclick="ModelClubView.createComboForGroup('${encodeURIComponent(itm||'')}', '${encodeURIComponent(JSON.stringify((sg.models||[]).map(m=>m.id)))}')"><i class="fa-solid fa-bolt"></i> + Create Combo</button>`;
    } else if (lvl === 'family') {
      const fg = (familyGroups || []).find(x => x.familyName === itm) || {};
      icon = 'fa-microchip'; title = `Model Family: ${itm || 'Family'}`; color = 'var(--accent-cyan)'; bg = 'rgba(6,182,212,0.02)';
      sub1 = `Classification: Head Family Cluster`;
      sub2 = `Base architecture grouping for ${itm || 'models'}`;
      modelCount = (fg.models||[]).length;
      if (fmt && modelCount > 0) {
        const sums = fmt.calculateSkillTokenSums(fg.models, providers);
        tokenHtml = `<strong>Tokens:</strong> <span style="color:var(--accent-cyan);font-weight:600;">${fmt.formatNumberAutoUnit(sums.consumed)} Consumed</span> <span style="color:var(--border-color);margin:0 4px;">|</span> <span style="color:var(--accent-emerald);font-weight:600;">${fmt.formatNumberAutoUnit(sums.available)} Available</span>`;
        limitsHtml = `<strong>Limits (Est):</strong> Inherited from parent providers`;
      }
      btnHtml = `<button class="btn btn-cyan btn-xs" onclick="ModelClubView.createComboForGroup('${encodeURIComponent(itm||'')}', '${encodeURIComponent(JSON.stringify((fg.models||[]).map(m=>m.id)))}')"><i class="fa-solid fa-wand-magic-sparkles"></i> + Create Combo</button>`;
    } else if (lvl === 'providers') {
      const p = (providers || []).find(x => x.id === itm) || {}; const pName = p.displayName || itm;
      const pModels = (models || []).filter(m => m.providerId === itm || m.providerName === pName);
      icon = 'fa-server'; title = `Active Provider: ${pName}`; color = 'var(--primary-light)'; bg = 'rgba(99,102,241,0.02)';
      sub1 = `Protocol: ${p.protocol || 'API'}`;
      sub2 = `Status: Active Online`;
      modelCount = pModels.length;
      if (fmt && modelCount > 0) {
        const sums = fmt.calculateSkillTokenSums(pModels, providers);
        tokenHtml = `<strong>Tokens:</strong> <span style="color:var(--primary-light);font-weight:600;">${fmt.formatNumberAutoUnit(sums.consumed)} Consumed</span> <span style="color:var(--border-color);margin:0 4px;">|</span> <span style="color:var(--accent-emerald);font-weight:600;">${fmt.formatNumberAutoUnit(sums.available)} Available</span>`;
        limitsHtml = `<strong>Limits:</strong> ${p.rateLimitRPM||0} RPM / ${p.rateLimitRPD||0} RPD / ${p.rateLimitTPM||0} TPM`;
      }
      btnHtml = `<button class="btn btn-primary btn-xs" onclick="ModelClubView.createComboForGroup('${encodeURIComponent(pName)}', '${encodeURIComponent(JSON.stringify(pModels.map(m=>m.id)))}')"><i class="fa-solid fa-plus"></i> + Create Combo</button>`;
    } else {
      const jdroidx = (combos || []).find(c => c.name && (c.name.toLowerCase().includes('jdroidxyz') || c.name.toLowerCase().includes('jdroid')))
        || { name: 'jDroidxyz-combo-agent', id: 'combo_1785085494991_5mmp0', strategy: 'Round Robin', modelsList: [] };
      const jId = jdroidx ? jdroidx.id : '';
      icon = 'fa-gem';
      title = jdroidx.name || 'jDroidxyz-combo-agent';
      color = 'var(--accent-emerald)';
      bg = 'rgba(16,185,129,0.02)';
      sub1 = `Master Agent | Strategy: ${jdroidx.strategy || 'Round Robin'}`;
      sub2 = 'Master Multi-Model Combo Agent & Universal Load-Balanced Swarm';
      const masterModels = jdroidx && Array.isArray(jdroidx.modelsList) && jdroidx.modelsList.length > 0
        ? jdroidx.modelsList.map(id => (models || []).find(m => m.id === id || m.modelId === id)).filter(Boolean)
        : (models || []);
      modelCount = masterModels.length;
      if (fmt && modelCount > 0) {
        const sums = fmt.calculateSkillTokenSums(masterModels, providers);
        tokenHtml = `<strong>Tokens:</strong> <span style="color:var(--accent-emerald);font-weight:600;">${fmt.formatNumberAutoUnit(sums.consumed)} Consumed</span> <span style="color:var(--border-color);margin:0 4px;">|</span> <span style="color:var(--accent-cyan);font-weight:600;">${fmt.formatNumberAutoUnit(sums.available)} Available</span>`;
        limitsHtml = `<strong>Limits (Est):</strong> ${fmt.formatNumberAutoUnit(sums.available / Math.max(1, masterModels.length))} Avg TPM/RPM`;
      }
      btnHtml = `<button class="btn btn-secondary btn-xs" onclick="ModelClubView.openEditComboModal('${jId}')"><i class="fa-solid fa-pen-to-square"></i> Edit Master Agent</button>`;
    }

    if (!tokenHtml) {
      tokenHtml = `<strong>Tokens:</strong> <span style="color:var(--text-muted);">No token data available</span>`;
      limitsHtml = `<strong>Limits:</strong> N/A`;
    }

    return `
      <div class="glass-panel" style="margin-bottom: 0; background: var(--bg-card); border: 1px solid ${color}; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: inset 0 0 20px ${bg};">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; gap: 10px; align-items: center;">
              <i class="fa-solid ${icon}" style="font-size: 1.8rem; color: ${color};"></i>
              <div>
                <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin: 0;">${title}</h3>
                <div style="font-size: 0.72rem; color: ${color}; font-weight: 600; margin-top: 2px;">${sub1}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              ${btnHtml}
              <button class="btn ${isFreeSelectionMode ? 'btn-primary' : 'btn-secondary'} btn-xs" onclick="ModelClubHierarchyHelper.toggleFreeSelectionMode()" title="Toggle Free Model Selection Mode"><i class="fa-solid ${isFreeSelectionMode ? 'fa-unlock' : 'fa-lock'}"></i> Free Selection: ${isFreeSelectionMode ? 'ON' : 'OFF'}</button>
              <button class="btn btn-secondary btn-xs" onclick="ModelClubHierarchyHelper.openBatchEdit()" title="Batch Edit Selected Models"><i class="fa-solid fa-pen-ruler" style="color: var(--accent-emerald);"></i> Batch Edit</button>
              <button class="btn btn-emerald btn-xs" onclick="ModelClubHierarchyHelper.createComboFromSelection()"><i class="fa-solid fa-circle-plus"></i> + Create Combo</button>
              <span style="font-size: 0.65rem; font-weight: 700; padding: 3px 6px; border-radius: 4px; background: ${bg}; border: 1px solid ${color}; color: ${color}; margin-left: 4px;">
                <i class="fa-solid fa-circle-check"></i> ACTIVE
              </span>
            </div>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-main); margin-bottom: 6px; margin-top: 4px;">
            <strong>Description:</strong> <span style="color: var(--text-muted);">${sub2}</span>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-main); margin-bottom: 6px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <span><strong>Models:</strong> <span class="badge" style="background: ${bg}; color: ${color}; border: 1px solid ${color}; margin-left: 4px;">${modelCount} MODELS</span></span>
            <span>${limitsHtml}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid var(--border-color); padding-top: 6px; margin-top: 4px; flex-wrap: wrap; gap: 8px;">
            <div style="font-size: 0.78rem; color: var(--text-main);">
              ${tokenHtml}
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <button type="button" class="btn btn-secondary btn-xs" style="padding:2px 6px;" title="Select All" onclick="ModelClubHierarchyHelper.selectAll()"><i class="fa-solid fa-check-double" style="color:var(--text-main);font-size:1.1rem;"></i></button>
              <button type="button" class="btn btn-secondary btn-xs" style="padding:2px 6px;" title="Clear All" onclick="ModelClubHierarchyHelper.clearAll()"><i class="fa-solid fa-eraser" style="color:var(--text-main);font-size:1.1rem;"></i></button>
              <div style="width:1px;height:18px;background:var(--border-color);margin:0 2px;"></div>
              
              <button type="button" class="btn btn-secondary btn-xs" style="padding:2px 6px;" title="Recalculate Core Skills" onclick="ModelClubView.recalculateCoreSkills()"><i class="fa-solid fa-brain" style="color:var(--accent-amber);font-size:1.1rem;"></i></button>
              <button type="button" class="btn btn-secondary btn-xs" style="padding:2px 6px;" title="Compare Models Analytics" onclick="ModelClubView.openModelCompareModal()"><i class="fa-solid fa-chart-column" style="color:var(--text-main);font-size:1.1rem;"></i></button>
              <button type="button" class="btn btn-secondary btn-xs" style="padding:2px 6px;" title="Test / Ping Selected Combo" onclick="ModelClubHierarchyHelper.testSelectedCombo()"><i class="fa-solid fa-flask" style="color:var(--accent-amber);font-size:1.1rem;"></i></button>
              <button type="button" class="btn btn-secondary btn-xs" style="padding:2px 6px;" title="Clone / Duplicate Selected Combo" onclick="ModelClubHierarchyHelper.cloneSelectedCombo()"><i class="fa-solid fa-clone" style="color:var(--accent-cyan);font-size:1.1rem;"></i></button>
              <button type="button" class="btn btn-secondary btn-xs" style="padding:2px 6px;" title="Copy Integration Code" onclick="ModelClubHierarchyHelper.copySelectedComboCode()"><i class="fa-solid fa-copy" style="color:var(--text-main);font-size:1.1rem;"></i></button>
              <button type="button" class="btn btn-secondary btn-xs" style="padding:2px 6px;" title="Toggle Active / Online Status" onclick="ModelClubHierarchyHelper.toggleSelectedComboActive()"><i class="fa-solid fa-globe" style="color:var(--text-main);font-size:1.1rem;"></i></button>
              <button type="button" class="btn btn-secondary btn-xs" style="padding:2px 6px;" title="Edit Combo" onclick="ModelClubHierarchyHelper.editSelectedCombo()"><i class="fa-solid fa-pen-to-square" style="color:var(--text-main);font-size:1.1rem;"></i></button>
              <button type="button" class="btn btn-secondary btn-xs" style="padding:2px 6px;" title="Delete Combo" onclick="ModelClubHierarchyHelper.deleteSelectedCombo()"><i class="fa-solid fa-trash-can" style="color:var(--accent-rose);font-size:1.1rem;"></i></button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static renderBox(title, icon, color, rawList, selSet, idFn, nameFn, toggleFn) {
    const list = [...rawList].sort((a, b) => (selSet.has(idFn(b)) ? 1 : 0) - (selSet.has(idFn(a)) ? 1 : 0));
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `<div class="glass-panel" style="padding:6px;display:flex;flex-direction:column;gap:4px;overflow:hidden;box-sizing:border-box;">
      <div style="font-size:0.72rem;font-weight:700;color:${color};border-bottom:1px solid var(--border-color);padding-bottom:3px;display:flex;justify-content:space-between;align-items:center;">
        <span><i class="fa-solid ${icon}"></i> ${title} <strong style="color:${color};">${selSet.size}/${rawList.length}</strong></span>
      </div>
      <div style="padding: 1px 0 3px 0;">
        <input type="text" class="form-control" style="width:100%;font-size:0.68rem;padding:2px 5px;height:20px;border:1px solid rgba(255,255,255,0.05);border-radius:4px;background:rgba(0,0,0,0.2);color:var(--text-main);" placeholder="Filter ${title}..." onkeyup="
          const q = this.value.toLowerCase();
          const p = this.parentElement.parentElement;
          p.querySelectorAll('.matrix-item-${safeTitle}').forEach(el => {
            el.style.display = el.getAttribute('data-name').toLowerCase().includes(q) ? 'flex' : 'none';
          });
        " />
      </div>
      <div style="flex:1;overflow-y:auto;max-height:340px;display:flex;flex-direction:column;gap:3px;padding-right:2px;">
        ${list.map(item => {
          const id = idFn(item), name = nameFn(item), ch = selSet.has(id);
          const isModel = toggleFn === 'toggleModel';
          const isCombo = toggleFn === 'toggleCombo';
          const isSkill = toggleFn === 'toggleSkill';
          const isFamily = toggleFn === 'toggleFamily';
          const isProvider = toggleFn === 'toggleProvider';

          const tokenInfo = isModel && typeof FormatHelper !== 'undefined'
            ? `<span style="font-size:0.55rem;color:var(--accent-amber);margin-left:4px;">${FormatHelper.formatNumberAutoUnit((item.totalPromptTokens||0)+(item.totalCompletionTokens||0))}</span>`
            : '';
          const modelCount = !isModel && item.models ? `<span style="font-size:0.55rem;color:var(--text-muted);margin-left:4px;">(${item.models.length})</span>` : '';
          const visionTag = isModel && (item.supportsVision || item.hasVision) ? `<i class="fa-solid fa-eye" style="color:var(--accent-cyan);font-size:0.55rem;margin-left:3px;" title="Vision / Multimodal"></i>` : '';
          const reasonTag = isModel && (item.supportsReasoning || item.hasReasoning) ? `<i class="fa-solid fa-brain" style="color:var(--accent-amber);font-size:0.55rem;margin-left:3px;" title="Chain-of-Thought / Deep Reasoning"></i>` : '';
          
          const cleanId = id.replace(/[^a-zA-Z0-9]/g, '');
          let detailsBody = '';
          if (isModel) {
            detailsBody = `<div><i class="fa-solid fa-server"></i> Provider: ${item.providerDisplayName || item.providerName || item.providerId || 'N/A'}</div>
              <div><i class="fa-solid fa-microchip"></i> Family: ${item.family || 'N/A'} | <i class="fa-solid fa-bolt"></i> Latency: ${item.latencyMs || 200}ms</div>
              <div><i class="fa-solid fa-memory"></i> Context: ${item.contextWindow ? (item.contextWindow/1000).toFixed(0)+'k' : '128k'} | Max Output: ${item.maxTokens || 4096}</div>`;
          } else if (isCombo) {
            detailsBody = `<div><i class="fa-solid fa-layer-group"></i> Strategy: ${item.strategy || 'Round Robin'}</div>
              <div><i class="fa-solid fa-robot"></i> Pooled Models: ${(item.modelsList||[]).length}</div>
              ${item.lastKnownGoodModelId ? `<div><i class="fa-solid fa-thumbtack" style="color:var(--accent-cyan);"></i> Pinned: ${item.lastKnownGoodModelId}</div>` : ''}`;
          } else if (isSkill) {
            detailsBody = `<div><i class="fa-solid fa-brain"></i> Category ID: ${item.categoryId || 'skill'}</div>
              <div><i class="fa-solid fa-robot"></i> Assigned Models: ${(item.models||[]).length}</div>`;
          } else if (isFamily) {
            detailsBody = `<div><i class="fa-solid fa-building"></i> Vendor: ${item.vendor || 'Meta/Google/Various'}</div>
              <div><i class="fa-solid fa-robot"></i> Family Models: ${(item.models||[]).length}</div>`;
          } else if (isProvider) {
            detailsBody = `<div><i class="fa-solid fa-network-wired"></i> Protocol: ${item.protocol || 'OpenAI Compatible'}</div>
              <div><i class="fa-solid fa-gauge-high"></i> Ping: ${item.pingLatencyMs !== undefined ? item.pingLatencyMs + 'ms' : 'Active'}</div>`;
          }

          const detailsHtml = detailsBody ? `
            <div style="display:none; padding:3px 6px; font-size:0.62rem; color:var(--text-muted); background:rgba(0,0,0,0.25); border-top:1px solid rgba(255,255,255,0.05);" id="pdetails-${cleanId}">
              ${detailsBody}
            </div>` : '';

          const toggleDetailsFn = detailsBody ? `onclick="event.preventDefault(); event.stopPropagation(); const d=document.getElementById('pdetails-${cleanId}'); if(d) d.style.display = d.style.display==='none' ? 'block' : 'none';"` : '';
          const infoIcon = detailsBody ? `<i class="fa-solid fa-circle-info" style="margin-left:3px; color:var(--accent-cyan); font-size:0.6rem; cursor:pointer;" title="Toggle Quick Details" ${toggleDetailsFn}></i>` : '';

          return `<div class="matrix-item-${safeTitle}" data-name="${name.replace(/"/g, '&quot;')}" style="display:flex; flex-direction:column; border-radius:4px; background:${ch?'rgba(16,185,129,0.15)':'rgba(255,255,255,0.02)'}; border:1px solid ${ch?color:'rgba(255,255,255,0.05)'}; cursor:pointer; margin-bottom:1px;">
            <label style="display:flex;align-items:center;justify-content:space-between;font-family:var(--font-main);font-size:var(--font-size-base, 0.68rem);font-weight:var(--font-weight-base, normal);font-style:var(--font-style-base, normal);padding:3px 5px;cursor:pointer;margin-bottom:0;">
              <span style="display:flex;align-items:center;gap:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                <input type="checkbox" ${ch?'checked':''} onchange="ModelClubHierarchyHelper.${toggleFn}('${encodeURIComponent(id)}')" />
                <strong style="color:var(--text-main);">${name}</strong>${visionTag}${reasonTag}${modelCount}${tokenInfo}${infoIcon}
              </span>
              <span style="display:flex;align-items:center;gap:4px;">
                ${isModel ? `<button type="button" class="btn btn-secondary btn-xs" style="padding:1px 4px;font-size:0.6rem;" onclick="event.stopPropagation(); ModelClubView.openEditModelModal('${encodeURIComponent(id)}')" title="Edit ROCA Model Config"><i class="fa-solid fa-gear"></i></button>` : ''}
                ${ch ? '<i class="fa-solid fa-check" style="color:'+color+';font-size:0.58rem;"></i>' : ''}
              </span>
            </label>
            ${detailsHtml}
          </div>`;
        }).join('')}
      </div></div>`;
  }
}

window.ModelClubPanelRenderer = ModelClubPanelRenderer;

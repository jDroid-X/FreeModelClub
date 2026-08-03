/**
 * ModelClubPanelRenderer.js
 * Purpose: Dedicated View Renderer Component for N-Pane Matrix boxes & top detail banners (< 90 lines).
 * Dependencies: None
 */

class ModelClubPanelRenderer {
  static renderTopDetailBanner(viewLevel, activeItem, combos, skillGroups, familyGroups, providers, models) {
    const lvl = viewLevel, itm = activeItem;
    let icon = 'fa-gem', title = 'Combo Club', color = 'var(--accent-emerald)', bg = 'rgba(16,185,129,0.05)', sub = 'Master Aggregator Agent | Dynamic N-Pane Pyramid Matrix', btnHtml = '';

    if (lvl === 'combos') {
      const c = (combos || []).find(x => x.id === itm) || (combos || [])[0] || {};
      icon = 'fa-layer-group'; title = c.name || 'Model Combo';
      sub = `${c.description || 'Model combo cluster'} | Strategy: ${c.strategy || 'Round Robin'}`;
      btnHtml = `<button class="btn btn-secondary btn-xs" onclick="ModelClubView.openEditComboModal('${c.id||''}')"><i class="fa-solid fa-pen-to-square"></i> Edit Combo</button>`;
    } else if (lvl === 'skills') {
      const sg = (skillGroups || []).find(x => x.skillName === itm) || {};
      icon = 'fa-brain'; title = `Core Skill: ${itm || 'Skill'}`; color = 'var(--accent-amber)'; bg = 'rgba(245,158,11,0.05)';
      sub = `Skill Grouping | Base Models: ${(sg.models||[]).length}`;
      btnHtml = `<button class="btn btn-amber btn-xs" onclick="ModelClubView.createComboForGroup('${encodeURIComponent(itm||'')}', '${encodeURIComponent(JSON.stringify((sg.models||[]).map(m=>m.id)))}')"><i class="fa-solid fa-bolt"></i> + Create Combo</button>`;
    } else if (lvl === 'family') {
      const fg = (familyGroups || []).find(x => x.familyName === itm) || {};
      icon = 'fa-microchip'; title = `Model Family: ${itm || 'Family'}`; color = 'var(--accent-cyan)'; bg = 'rgba(6,182,212,0.05)';
      sub = `Head Family Cluster | Base Models: ${(fg.models||[]).length}`;
      btnHtml = `<button class="btn btn-cyan btn-xs" onclick="ModelClubView.createComboForGroup('${encodeURIComponent(itm||'')}', '${encodeURIComponent(JSON.stringify((fg.models||[]).map(m=>m.id)))}')"><i class="fa-solid fa-wand-magic-sparkles"></i> + Create Combo</button>`;
    } else if (lvl === 'providers') {
      const p = (providers || []).find(x => x.id === itm) || {}; const pName = p.displayName || itm;
      const pModels = (models || []).filter(m => m.providerId === itm || m.providerName === pName);
      icon = 'fa-server'; title = `Active Provider: ${pName}`; color = 'var(--primary-light)'; bg = 'rgba(99,102,241,0.05)';
      sub = `Status: Active Online | Pooled Models: ${pModels.length}`;
      btnHtml = `<button class="btn btn-primary btn-xs" onclick="ModelClubView.createComboForGroup('${encodeURIComponent(pName)}', '${encodeURIComponent(JSON.stringify(pModels.map(m=>m.id)))}')"><i class="fa-solid fa-plus"></i> + Create Combo</button>`;
    } else {
      const jdroidx = (combos || []).find(c => c.name && c.name.toLowerCase().includes('jdroid'));
      const jId = jdroidx ? jdroidx.id : '';
      btnHtml = `<button class="btn btn-secondary btn-xs" onclick="ModelClubView.openEditComboModal('${jId}')"><i class="fa-solid fa-pen-to-square"></i> Edit Agent</button>`;
    }

    return `<div class="glass-panel" style="padding:10px;border:1px solid ${color};background:${bg};display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <i class="fa-solid ${icon}" style="color:${color};font-size:1.1rem;"></i>
        <div><h4 style="margin:0;color:${color};font-size:0.92rem;">${title}</h4><span style="font-size:0.68rem;color:var(--text-muted);">${sub}</span></div>
      </div>
      <div style="display:flex;gap:6px;">${btnHtml}<button class="btn btn-emerald btn-xs" onclick="ModelClubHierarchyHelper.createComboFromSelection()"><i class="fa-solid fa-circle-plus"></i> + Create Combo</button></div>
    </div>`;
  }

  static renderBox(title, icon, color, rawList, selSet, idFn, nameFn, toggleFn) {
    const list = [...rawList].sort((a, b) => (selSet.has(idFn(b)) ? 1 : 0) - (selSet.has(idFn(a)) ? 1 : 0));
    return `<div class="glass-panel" style="padding:6px;display:flex;flex-direction:column;gap:4px;overflow:hidden;box-sizing:border-box;">
      <div style="font-size:0.72rem;font-weight:700;color:${color};border-bottom:1px solid var(--border-color);padding-bottom:3px;display:flex;justify-content:space-between;align-items:center;">
        <span><i class="fa-solid ${icon}"></i> ${title} <strong style="color:${color};">${selSet.size}/${rawList.length}</strong></span>
      </div>
      <div style="flex:1;overflow-y:auto;max-height:340px;display:flex;flex-direction:column;gap:3px;padding-right:2px;">
        ${list.map(item => {
          const id = idFn(item), name = nameFn(item), ch = selSet.has(id);
          const isModel = toggleFn === 'toggleModel';
          return `<label style="display:flex;align-items:center;justify-content:space-between;font-size:0.68rem;padding:3px 5px;border-radius:4px;background:${ch?'rgba(16,185,129,0.15)':'rgba(255,255,255,0.02)'};border:1px solid ${ch?color:'rgba(255,255,255,0.05)'};cursor:pointer;">
            <span style="display:flex;align-items:center;gap:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><input type="checkbox" ${ch?'checked':''} onchange="ModelClubHierarchyHelper.${toggleFn}('${encodeURIComponent(id)}')" /><strong style="color:var(--text-main);">${name}</strong></span>
            <span style="display:flex;align-items:center;gap:4px;">
              ${isModel ? `<button type="button" class="btn btn-secondary btn-xs" style="padding:1px 4px;font-size:0.6rem;" onclick="event.stopPropagation(); ModelClubView.openEditModelModal('${encodeURIComponent(id)}')" title="Edit ROCA Model Config"><i class="fa-solid fa-gear"></i></button>` : ''}
              ${ch ? '<i class="fa-solid fa-check" style="color:'+color+';font-size:0.58rem;"></i>' : ''}
            </span>
          </label>`;
        }).join('')}
      </div></div>`;
  }
}

window.ModelClubPanelRenderer = ModelClubPanelRenderer;

/**
 * SearchAgent.js
 * Purpose: Decoupled client-side search agent for dynamic filter queries & multi-pane taxonomy traversal (< 80 lines).
 * Dependencies: None
 */

class SearchAgent {
  static filterTaxonomyPyramid(query, models, skillGroups, familyGroups, providers, combos) {
    const term = (query || '').toLowerCase().trim();
    if (!term) return null;

    const matchingModelIds = new Set(
      (models || []).filter(m => 
        (m.modelName || m.modelId || '').toLowerCase().includes(term) ||
        (m.family || '').toLowerCase().includes(term) ||
        (m.coreSkill || '').toLowerCase().includes(term) ||
        (m.providerName || m.providerId || '').toLowerCase().includes(term)
      ).map(m => m.id)
    );

    const matchingSkills = new Set();
    const matchingFamilies = new Set();
    const matchingProviders = new Set();
    const matchingCombos = new Set();

    (models || []).forEach(m => {
      if (matchingModelIds.has(m.id)) {
        if (m.coreSkill) matchingSkills.add(m.coreSkill);
        if (m.family) matchingFamilies.add(m.family);
        if (m.providerId) matchingProviders.add(m.providerId);
        if (m.providerName) matchingProviders.add(m.providerName);
      }
    });

    (skillGroups || []).forEach(sg => { if (sg.skillName.toLowerCase().includes(term)) matchingSkills.add(sg.skillName); });
    (familyGroups || []).forEach(fg => { if (fg.familyName.toLowerCase().includes(term)) matchingFamilies.add(fg.familyName); });
    (providers || []).forEach(p => { if ((p.displayName || p.id).toLowerCase().includes(term)) { matchingProviders.add(p.id); matchingProviders.add(p.displayName || p.id); } });
    (combos || []).forEach(c => {
      if (c.name.toLowerCase().includes(term) || (c.modelsList || []).some(mId => matchingModelIds.has(mId))) {
        matchingCombos.add(c.id);
      }
    });

    return { term, matchingModelIds, matchingSkills, matchingFamilies, matchingProviders, matchingCombos };
  }

  static applyInPlaceDomFilter(gridElement, matches) {
    if (!gridElement) return;
    if (!matches) {
      gridElement.querySelectorAll('.glass-panel label').forEach(lbl => lbl.style.display = '');
      gridElement.querySelectorAll('.glass-panel').forEach(pane => {
        const labels = pane.querySelectorAll('label');
        const chks = pane.querySelectorAll('input[type="checkbox"]:checked');
        const hStrong = pane.querySelector('div strong');
        if (hStrong) hStrong.textContent = `${chks.length}/${labels.length}`;
      });
      return;
    }

    gridElement.querySelectorAll('.glass-panel').forEach(pane => {
      const labels = pane.querySelectorAll('label');
      let visibleCount = 0, checkedCount = 0;

      labels.forEach(label => {
        const text = label.textContent.trim().toLowerCase();
        const chk = label.querySelector('input[type="checkbox"]');
        const rawVal = chk ? decodeURIComponent(chk.getAttribute('onchange')?.match(/'([^']+)'/)?.[1] || '') : text;

        let isMatch = false;
        if (pane.textContent.includes('Combos')) isMatch = matches.matchingCombos.has(rawVal) || text.includes(matches.term);
        else if (pane.textContent.includes('Skills')) isMatch = matches.matchingSkills.has(rawVal) || text.includes(matches.term);
        else if (pane.textContent.includes('Families')) isMatch = matches.matchingFamilies.has(rawVal) || text.includes(matches.term);
        else if (pane.textContent.includes('Providers')) isMatch = matches.matchingProviders.has(rawVal) || matches.matchingProviders.has(text) || text.includes(matches.term);
        else if (pane.textContent.includes('Models')) isMatch = matches.matchingModelIds.has(rawVal) || text.includes(matches.term);

        label.style.display = isMatch ? 'flex' : 'none';
        if (isMatch) {
          visibleCount++;
          if (chk && chk.checked) checkedCount++;
        }
      });

      const headerStrong = pane.querySelector('div strong');
      if (headerStrong) headerStrong.textContent = `${checkedCount}/${visibleCount}`;
    });
  }
}

window.SearchAgent = SearchAgent;

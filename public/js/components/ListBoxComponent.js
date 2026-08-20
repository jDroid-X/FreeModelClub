/**
 * ListBoxComponent.js
 * Purpose: Reusable master-detail list box component rendering selectable items with item details pane (< 180 lines).
 * Dependencies: None
 */

class ListBoxComponent {
  /**
   * Renders master-detail list box inside container target
   */
  static render(containerTarget, { items = [], selectedId = null, onSelect = null, title = 'Select Item' } = {}) {
    const container = typeof containerTarget === 'string' ? document.getElementById(containerTarget) : containerTarget;
    if (!container) return;

    this.items = items;
    this.selectedItem = items.find(i => i.id === selectedId) || items[0] || null;
    this.onSelectCallback = onSelect;

    container.innerHTML = `
      <div class="listbox-container" style="display: flex; gap: 12px; height: 100%; min-height: 320px; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: rgba(0,0,0,0.2);">
        <!-- Left Master List Box (35% Width) -->
        <div style="width: 38%; min-width: 220px; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; background: rgba(255,255,255,0.02);">
          <div style="padding: 8px 10px; border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.3);">
            <input type="text" id="listbox-search-input" class="form-control" placeholder="Filter items..." style="font-size: 0.76rem; padding: 4px 8px;" onkeyup="ListBoxComponent.filter(this.value)" />
          </div>
          <div id="listbox-items-pane" style="flex: 1; overflow-y: auto; padding: 4px;"></div>
        </div>

        <!-- Right Detail Pane (65% Width) -->
        <div id="listbox-detail-pane" style="width: 62%; flex: 1; padding: 14px; overflow-y: auto; display: flex; flex-direction: column;"></div>
      </div>
    `;

    this.renderItemsList();
    this.renderDetailPane();
  }

  static renderItemsList(filterQuery = '') {
    const pane = document.getElementById('listbox-items-pane');
    if (!pane) return;

    let filtered = this.items || [];
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      filtered = filtered.filter(i => (i.title || i.name || i.id).toLowerCase().includes(q) || (i.subtitle || '').toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
      pane.innerHTML = `<div style="padding: 16px; text-align: center; font-size: 0.76rem; color: var(--text-muted);">No matching items.</div>`;
      return;
    }

    pane.innerHTML = filtered.map(item => {
      const isSelected = this.selectedItem && this.selectedItem.id === item.id;
      return `
        <div class="listbox-item ${isSelected ? 'active' : ''}" onclick="ListBoxComponent.selectItem('${item.id}')" style="padding: 8px 10px; border-radius: 6px; margin-bottom: 4px; cursor: pointer; border: 1px solid ${isSelected ? 'var(--accent-cyan)' : 'transparent'}; background: ${isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.02)'}; transition: all 0.2s ease;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 0.82rem; color: ${isSelected ? 'var(--accent-cyan)' : 'var(--text-main)'};"><i class="fa-solid ${item.icon || 'fa-cube'}" style="margin-right: 6px;"></i>${item.title || item.name || item.id}</strong>
            ${item.badge ? `<span class="badge ${item.badgeClass || 'badge-emerald'}" style="font-size: 0.68rem;">${item.badge}</span>` : ''}
          </div>
          ${item.subtitle ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${item.subtitle}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  static selectItem(id) {
    const item = (this.items || []).find(i => i.id === id);
    if (!item) return;
    this.selectedItem = item;
    this.renderItemsList(document.getElementById('listbox-search-input')?.value || '');
    this.renderDetailPane();

    if (typeof this.onSelectCallback === 'function') {
      this.onSelectCallback(item);
    }
  }

  static renderDetailPane() {
    const pane = document.getElementById('listbox-detail-pane');
    if (!pane) return;

    const item = this.selectedItem;
    if (!item) {
      pane.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Select an item from the list box to view details.</div>`;
      return;
    }

    const details = item.details || {};
    const detailRows = Object.keys(details).map(k => `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="padding: 6px 8px; font-weight: 700; color: var(--text-muted); width: 35%; font-size: 0.76rem;">${k}:</td>
        <td style="padding: 6px 8px; color: var(--text-main); font-size: 0.76rem;"><code>${typeof details[k] === 'object' ? JSON.stringify(details[k]) : details[k]}</code></td>
      </tr>
    `).join('');

    pane.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
        <div>
          <h4 style="margin: 0; color: var(--accent-cyan); font-size: 1rem;"><i class="fa-solid ${item.icon || 'fa-cube'}"></i> ${item.title || item.name}</h4>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${item.subtitle || 'Selected List Item Details'}</span>
        </div>
        ${item.badge ? `<span class="badge ${item.badgeClass || 'badge-emerald'}">${item.badge}</span>` : ''}
      </div>

      <div style="flex: 1; overflow-y: auto;">
        <p style="font-size: 0.8rem; color: var(--text-main); line-height: 1.5; margin-bottom: 12px;">${item.description || 'Comprehensive metadata and configuration parameters for selected list item.'}</p>
        
        ${Object.keys(details).length > 0 ? `
          <table class="table-custom" style="width: 100%; font-size: 0.76rem; margin-bottom: 12px;">
            <tbody>${detailRows}</tbody>
          </table>
        ` : ''}
      </div>

      ${item.options && item.options.length > 0 ? `
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 10px;">
          ${item.options.map(opt => `
            <button class="btn btn-${opt.type || 'secondary'} btn-sm" onclick="ListBoxComponent.triggerAction('${item.id}', '${opt.id}')">
              <i class="fa-solid ${opt.icon || 'fa-check'}"></i> ${opt.label}
            </button>
          `).join('')}
        </div>
      ` : ''}
    `;
  }

  static triggerAction(itemId, actionId) {
    const item = (this.items || []).find(i => i.id === itemId);
    if (!item || !item.options) return;
    const opt = item.options.find(o => o.id === actionId);
    if (opt && typeof opt.action === 'function') {
      opt.action(item);
    }
  }

  static filter(q) {
    this.renderItemsList(q);
  }
}

window.ListBoxComponent = ListBoxComponent;

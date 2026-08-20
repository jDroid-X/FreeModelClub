/**
 * SearchableSelect.js
 * Purpose: Enhances native <select> with searchable overlay.
 *          Click select → shows all items + search bar to filter quickly.
 *          Keeps original select appearance intact.
 * Dependencies: None (pure vanilla JS)
 */
'use strict';

class SearchableSelect {
  static _instances = new Map();

  /**
   * Add search functionality to a native select element
   */
  static init(target, options = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el || el.tagName !== 'SELECT') return;

    if (el.dataset.ssId) {
      this.destroy(el.dataset.ssId);
    }

    const id = el.id || `ss-${Date.now()}`;
    el.dataset.ssId = id;
    const placeholder = options.placeholder || 'Search...';
    const maxHeight = options.maxHeight || 350;

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'searchable-select-enhanced';
    wrapper.style.cssText = 'position: relative; display: inline-block; width: 100%;';

    // Trigger button (looks like select)
    const triggerBtn = document.createElement('button');
    triggerBtn.type = 'button';
    triggerBtn.className = 'ss-trigger-btn';
    triggerBtn.style.cssText = `
      width: 100%; padding: 6px 12px;
      background: rgba(0,0,0,0.2); 
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
      border-radius: 6px; 
      color: var(--text-main, #ffffff);
      font-size: 0.78rem; text-align: left;
      display: flex; align-items: center; justify-content: space-between;
      cursor: pointer; gap: 8px;
      transition: all 0.2s ease;
    `;
    triggerBtn.onmouseenter = () => triggerBtn.style.background = 'rgba(255,255,255,0.05)';
    triggerBtn.onmouseleave = () => triggerBtn.style.background = 'rgba(0,0,0,0.2)';
    
    const selectedText = document.createElement('span');
    selectedText.className = 'ss-selected-text';
    selectedText.textContent = el.options[el.selectedIndex]?.text || placeholder;
    selectedText.style.cssText = 'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
    
    const chevron = document.createElement('i');
    chevron.className = 'fa-solid fa-chevron-down ss-chevron';
    chevron.style.cssText = 'font-size: 0.65rem; color: var(--text-muted, #888); transition: transform 0.2s;';
    
    triggerBtn.appendChild(selectedText);
    triggerBtn.appendChild(chevron);

    // Dropdown overlay - with dynamic positioning support
    const dropdown = document.createElement('div');
    dropdown.className = 'ss-dropdown-overlay';
    dropdown.style.cssText = `
      display: none; 
      position: absolute; 
      left: 0; 
      background: var(--bg-card, rgba(15, 23, 42, 0.95));
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.12)); 
      border-radius: 8px;
      z-index: 10000; 
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
      overflow: hidden; 
      flex-direction: column; 
      max-height: ${maxHeight}px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    `;

    // Search input
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = 'padding: 8px; border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.1)); position: sticky; top: 0; background: var(--bg-card, rgba(15, 23, 42, 0.92));';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'ss-search-input';
    searchInput.placeholder = placeholder;
    searchInput.style.cssText = `
      width: 100%; padding: 6px 10px 6px 28px;
      background: rgba(0,0,0,0.3); 
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
      color: var(--text-main, #ffffff); 
      border-radius: 4px;
      font-size: 0.76rem; 
      outline: none;
    `;
    
    // Search icon
    const searchIcon = document.createElement('i');
    searchIcon.className = 'fa-solid fa-search ss-search-icon';
    searchIcon.style.cssText = `
      position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
      color: var(--text-muted, #cbd5e1); font-size: 0.75rem; pointer-events: none;
    `;
    
    searchContainer.style.position = 'relative';
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchInput);

    // Items list
    const itemsList = document.createElement('div');
    itemsList.className = 'ss-items-list';
    itemsList.style.cssText = 'overflow-y: auto;';

    dropdown.appendChild(searchContainer);
    dropdown.appendChild(itemsList);
    wrapper.appendChild(triggerBtn);
    wrapper.appendChild(dropdown);

    // Hide original and wrap it
    el.style.display = 'none';
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);

    // Render options
    const renderOptions = (filter = '') => {
      const q = filter.toLowerCase().trim();
      let html = '';
      let count = 0;

      for (let i = 0; i < el.options.length; i++) {
        const opt = el.options[i];
        const matches = !q || opt.text.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q);
        if (!matches) continue;
        count++;

        const isSelected = opt.value === el.value;
        html += `<div class="ss-item${isSelected ? ' selected' : ''}" data-value="${this.escapeHtml(opt.value)}" 
          style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: ${isSelected ? 'var(--accent-cyan, #06b6d4)' : 'var(--text-main, #ffffff)'}; background: ${isSelected ? 'rgba(6, 182, 212, 0.15)' : 'transparent'}; transition: all 0.15s;"
          onmouseover="this.style.background='rgba(99, 102, 241, 0.15)'" 
          onmouseout="this.style.background='${isSelected ? 'rgba(6, 182, 212, 0.15)' : 'transparent'}'">
          <i class="fa-solid ${isSelected ? 'fa-check' : 'fa-circle'}" style="color: ${isSelected ? 'var(--accent-cyan, #06b6d4)' : 'var(--text-muted, #cbd5e1)'}; font-size: 0.65rem;"></i>
          <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(opt.text)}</span>
        </div>`;
      }

      if (count === 0) {
        html = '<div style="padding: 16px; text-align: center; color: var(--text-muted, #888); font-size: 0.75rem;">No matching items</div>';
      }

      itemsList.innerHTML = html;

      itemsList.querySelectorAll('.ss-item').forEach(item => {
        item.addEventListener('click', () => {
          const val = item.dataset.value;
          const opt = Array.from(el.options).find(o => o.value === val);
          if (opt) {
            el.value = val;
            selectedText.textContent = opt.text;
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          this.closeDropdown(id);
        });
      });
    };

    // Toggle dropdown with dynamic positioning
    const toggleDropdown = () => {
      const isOpen = dropdown.style.display === 'flex';
      if (isOpen) {
        this.closeDropdown(id);
      } else {
        dropdown.style.display = 'flex';
        searchInput.value = '';
        renderOptions('');
        searchInput.focus();
        chevron.style.transform = 'rotate(180deg)';
        
        // Dynamically position dropdown based on viewport space
        setTimeout(() => this._positionDropdown(dropdown, wrapper, maxHeight), 10);
      }
    };

    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
    });

    searchInput.addEventListener('input', (e) => renderOptions(e.target.value));

    const closeHandler = (e) => {
      if (!wrapper.contains(e.target)) this.closeDropdown(id);
    };
    document.addEventListener('click', closeHandler);

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeDropdown(id);
    });

    SearchableSelect._instances.set(id, { wrapper, triggerBtn, dropdown, searchInput, itemsList, selectedText, chevron, closeHandler, renderOptions });
  }

  /**
   * Position dropdown dynamically based on available viewport space
   * Opens upward if not enough space below, downward if space available
   */
  static _positionDropdown(dropdown, wrapper, defaultMaxHeight) {
    const rect = wrapper.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    // Calculate available space
    const spaceBelow = viewportHeight - rect.bottom + scrollTop;
    const spaceAbove = rect.top;
    const neededHeight = Math.min(dropdown.scrollHeight, defaultMaxHeight);
    
    // Set initial width and left position
    // Enforce minimum dropdown width of 250px when tray opens
    dropdown.style.width = `${Math.max(rect.width, 250)}px`;
    dropdown.style.left = '0';
    
    // Decide position based on available space
    if (spaceBelow >= neededHeight + 10) {
      // Enough space below - open downward
      dropdown.style.top = '100%';
      dropdown.style.bottom = 'auto';
      dropdown.style.marginTop = '4px';
      dropdown.style.marginBottom = '0';
    } else if (spaceAbove >= neededHeight + 10) {
      // Not enough space below but enough above - open upward
      dropdown.style.top = 'auto';
      dropdown.style.bottom = '100%';
      dropdown.style.marginTop = '0';
      dropdown.style.marginBottom = '4px';
    } else {
      // Neither side has enough space - use whichever has more
      if (spaceBelow > spaceAbove) {
        dropdown.style.top = '100%';
        dropdown.style.bottom = 'auto';
        dropdown.style.maxHeight = `${spaceBelow - 10}px`;
        dropdown.style.marginTop = '4px';
      } else {
        dropdown.style.top = 'auto';
        dropdown.style.bottom = '100%';
        dropdown.style.maxHeight = `${spaceAbove - 10}px`;
        dropdown.style.marginBottom = '4px';
      }
    }
  }

  static closeDropdown(id) {
    const inst = this._instances.get(id);
    if (inst) {
      inst.dropdown.style.display = 'none';
      inst.searchInput.value = '';
      inst.chevron.style.transform = '';
    }
  }

  static escapeHtml(text) {
    if (typeof PlaygroundViewHelper !== 'undefined') return PlaygroundViewHelper.escapeHtml(text);
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static sync(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el || !el.dataset.ssId) return;
    const inst = this._instances.get(el.dataset.ssId);
    if (!inst) return;

    const selectedOpt = el.options[el.selectedIndex];
    if (selectedOpt && inst.selectedText) {
      inst.selectedText.textContent = selectedOpt.text;
    }
    if (typeof inst.renderOptions === 'function') {
      inst.renderOptions(inst.searchInput ? inst.searchInput.value : '');
    }
  }

  static setValue(target, value, triggerEvent = false) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    el.value = value;
    this.sync(el);
    if (triggerEvent) {
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  static destroy(id) {
    const inst = this._instances.get(id);
    if (inst) {
      document.removeEventListener('click', inst.closeHandler);
      const el = inst.wrapper.querySelector('select');
      if (el) {
        el.style.display = '';
        delete el.dataset.ssId;
        inst.wrapper.parentNode.insertBefore(el, inst.wrapper);
      }
      inst.wrapper.remove();
      this._instances.delete(id);
    }
  }

  static destroyAll() {
    this._instances.forEach((inst, id) => this.destroy(id));
  }
}

window.SearchableSelect = SearchableSelect;

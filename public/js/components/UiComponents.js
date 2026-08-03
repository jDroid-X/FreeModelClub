/**
 * UiComponents.js
 * Purpose: Reusable UI Component library providing stateful buttons and validated textboxes (< 160 lines).
 * Dependencies: None
 */

class UiComponents {
  /**
   * Renders a stateful, interactive button with icons, loading states, and variants
   */
  static renderButton({ id, label, icon = 'fa-check', type = 'primary', size = 'md', disabled = false, extraClass = '', onclick = '' }) {
    const sizeClass = size === 'xs' ? 'btn-xs' : (size === 'sm' ? 'btn-sm' : (size === 'lg' ? 'btn-lg' : ''));
    return `
      <button type="button" id="${id || ''}" class="btn btn-${type} ${sizeClass} ${extraClass}" ${disabled ? 'disabled' : ''} ${onclick ? `onclick="${onclick}"` : ''}>
        ${icon ? `<i class="fa-solid ${icon}"></i>` : ''}
        <span>${label}</span>
      </button>
    `;
  }

  /**
   * Sets loading state on an existing button element
   */
  static setButtonLoading(btnId, isLoading = true, loadingText = 'Processing...') {
    const btn = typeof btnId === 'string' ? document.getElementById(btnId) : btnId;
    if (!btn) return;
    if (isLoading) {
      btn.dataset.origHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${loadingText}</span>`;
    } else {
      btn.disabled = false;
      if (btn.dataset.origHtml) btn.innerHTML = btn.dataset.origHtml;
    }
  }

  /**
   * Renders a validated textbox with live condition indicators, clear button, and character counter
   */
  static renderValidatedTextbox({ id, label, value = '', placeholder = '', type = 'text', minLength = 0, maxLength = 256, regex = null, helperText = '', required = false }) {
    const safeVal = value || '';
    return `
      <div class="fmc-textbox-group" id="${id}-container" style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px;">
        ${label ? `<label for="${id}" style="font-size: 0.78rem; font-weight: 700; color: var(--text-main); display: flex; justify-content: space-between; align-items: center;">
          <span>${label} ${required ? '<span style="color: var(--accent-rose);">*</span>' : ''}</span>
          <span id="${id}-counter" style="font-size: 0.7rem; color: var(--text-muted); font-weight: 400;">${safeVal.length}/${maxLength}</span>
        </label>` : ''}
        <div style="position: relative; display: flex; align-items: center;">
          <input type="${type}" id="${id}" class="form-control fmc-validated-input" value="${safeVal}" placeholder="${placeholder}" maxlength="${maxLength}" 
            oninput="UiComponents.onTextboxInput('${id}', ${minLength}, '${regex || ''}')" style="padding-right: 32px;" />
          <button type="button" class="btn-input-clear" id="${id}-clear-btn" onclick="UiComponents.clearTextbox('${id}')" style="position: absolute; right: 8px; background: none; border: none; color: var(--text-dim); cursor: pointer; display: ${safeVal ? 'block' : 'none'};">
            <i class="fa-solid fa-circle-xmark"></i>
          </button>
        </div>
        <div id="${id}-feedback" style="font-size: 0.72rem; color: var(--text-muted); min-height: 16px; margin-top: 2px;">${helperText}</div>
      </div>
    `;
  }

  static onTextboxInput(id, minLength = 0, regexStr = '') {
    const input = document.getElementById(id);
    const counter = document.getElementById(`${id}-counter`);
    const clearBtn = document.getElementById(`${id}-clear-btn`);
    const feedback = document.getElementById(`${id}-feedback`);
    if (!input) return;

    const val = input.value;
    if (counter) counter.textContent = `${val.length}/${input.maxLength || 256}`;
    if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';

    let isValid = true;
    let msg = '';

    if (val.length < minLength && val.length > 0) {
      isValid = false;
      msg = `Requires at least ${minLength} characters.`;
    } else if (regexStr) {
      try {
        const re = new RegExp(regexStr);
        if (val.length > 0 && !re.test(val)) {
          isValid = false;
          msg = 'Invalid format pattern.';
        }
      } catch (e) {}
    }

    if (feedback) {
      if (!isValid) {
        feedback.style.color = 'var(--accent-rose)';
        feedback.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${msg}`;
        input.style.borderColor = 'var(--accent-rose)';
      } else if (val.length >= minLength && val.length > 0) {
        feedback.style.color = 'var(--accent-emerald)';
        feedback.innerHTML = `<i class="fa-solid fa-circle-check"></i> Condition satisfied.`;
        input.style.borderColor = 'var(--accent-emerald)';
      } else {
        feedback.style.color = 'var(--text-muted)';
        feedback.innerHTML = '';
        input.style.borderColor = 'var(--border-color)';
      }
    }
  }

  static clearTextbox(id) {
    const input = document.getElementById(id);
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input'));
      input.focus();
    }
  }
}

window.UiComponents = UiComponents;

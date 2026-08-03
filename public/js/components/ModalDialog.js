/**
 * ModalDialog.js
 * Purpose: Glassmorphism Modal Dialog System and Toast Notification Manager
 */

class ModalDialog {
  static showModal({ title, body, icon = 'fa-circle-info', confirmText = 'OK', cancelText = null, onConfirm = null }) {
    const existing = document.getElementById('fmc-active-modal');
    if (existing) existing.remove();

    const modalEl = document.createElement('div');
    modalEl.id = 'fmc-active-modal';
    modalEl.className = 'modal-overlay';

    modalEl.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid ${icon}" style="color: var(--accent-cyan);"></i>
            <span>${title}</span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="ModalDialog.closeModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">${body}</div>
        <div class="modal-footer">
          ${cancelText ? `<button class="btn btn-secondary" onclick="ModalDialog.closeModal()">${cancelText}</button>` : ''}
          <button class="btn btn-primary" id="modal-confirm-btn">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    document.getElementById('modal-confirm-btn').onclick = async () => {
      if (typeof onConfirm === 'function') {
        try {
          await onConfirm();
        } catch (err) {
          console.error("Modal confirmation failed:", err);
        }
      }
      this.closeModal();
    };
  }

  static closeModal() {
    const modalEl = document.getElementById('fmc-active-modal');
    if (modalEl) modalEl.remove();
  }

  static showCustomModal({ title, content, confirmText = 'Close', onConfirm = null }) {
    const existing = document.getElementById('fmc-active-modal');
    if (existing) existing.remove();

    const modalEl = document.createElement('div');
    modalEl.id = 'fmc-active-modal';
    modalEl.className = 'modal-overlay';

    modalEl.innerHTML = `
      <div class="modal-box" style="max-width: 600px; max-height: 90vh;">
        <div class="modal-header">
          <div class="modal-title">${title}</div>
          <button class="btn btn-secondary btn-sm" onclick="ModalDialog.closeModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="overflow-y: auto; padding-top: 8px;">${content}</div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="modal-confirm-btn">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    document.getElementById('modal-confirm-btn').onclick = async () => {
      if (typeof onConfirm === 'function') {
        try {
          await onConfirm();
        } catch (err) {
          console.error("Modal custom confirmation failed:", err);
        }
      }
      this.closeModal();
    };
  }

  static showLoadingModal({ title = 'Initializing Environment', message = 'Loading system components...', initialProgress = 10, icon = 'fa-spinner fa-spin' } = {}) {
    const existing = document.getElementById('fmc-loading-modal');
    if (existing) existing.remove();

    const modalEl = document.createElement('div');
    modalEl.id = 'fmc-loading-modal';
    modalEl.className = 'modal-overlay';

    modalEl.innerHTML = `
      <div class="modal-box" style="max-width: 480px;">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid ${icon}" style="color: var(--accent-cyan);"></i>
            <span>${title}</span>
          </div>
        </div>
        <div class="modal-body" style="text-align: center; padding: 28px 24px;">
          <div id="fmc-loading-msg" style="font-size: 0.95rem; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">
            ${message}
          </div>
          <div class="running-bar-track">
            <div id="fmc-loading-bar" class="running-bar-fill" style="width: ${initialProgress}%;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: var(--text-muted); margin-top: 6px;">
            <span id="fmc-loading-sub"><i class="fa-solid fa-gear fa-spin" style="margin-right: 4px; color: var(--accent-cyan);"></i> Processing...</span>
            <strong id="fmc-loading-percent" style="color: var(--accent-cyan); font-weight: 700;">${initialProgress}%</strong>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);
  }

  static updateLoadingProgress(percent, message = null, subMessage = null) {
    const bar = document.getElementById('fmc-loading-bar');
    const msgEl = document.getElementById('fmc-loading-msg');
    const percentEl = document.getElementById('fmc-loading-percent');
    const subEl = document.getElementById('fmc-loading-sub');

    if (bar && percent !== undefined) {
      const p = Math.min(100, Math.max(0, percent));
      bar.style.width = p + '%';
      if (percentEl) percentEl.textContent = p + '%';
    }
    if (msgEl && message) {
      msgEl.textContent = message;
    }
    if (subEl && subMessage) {
      subEl.innerHTML = `<i class="fa-solid fa-gear fa-spin" style="margin-right: 4px; color: var(--accent-cyan);"></i> ${subMessage}`;
    }
  }

  static closeLoadingModal() {
    const modalEl = document.getElementById('fmc-loading-modal');
    if (modalEl) modalEl.remove();
  }

  static showNotification(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      info: 'fa-circle-info',
      success: 'fa-circle-check',
      warning: 'fa-triangle-exclamation',
      error: 'fa-circle-xmark'
    };

    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${icons[type] || 'fa-circle-info'}" style="font-size: 1.1rem;"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  static showOptionModal({ title, message = '', icon = 'fa-sliders', options = [], onCancel = null }) {
    this.closeModal();

    const modalEl = document.createElement('div');
    modalEl.id = 'fmc-active-modal';
    modalEl.className = 'modal-overlay';

    const optionsHtml = options.map((opt, idx) => `
      <button class="btn btn-${opt.type || 'primary'} option-dialog-btn" id="opt-btn-${idx}" style="width: 100%; justify-content: flex-start; padding: 10px 14px; font-size: 0.85rem;">
        <i class="fa-solid ${opt.icon || 'fa-arrow-right'}" style="margin-right: 8px;"></i>
        <span>${opt.label}</span>
      </button>
    `).join('');

    modalEl.innerHTML = `
      <div class="modal-box" style="max-width: 520px;">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid ${icon}" style="color: var(--accent-cyan);"></i>
            <span>${title}</span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="ModalDialog.closeModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="padding: 18px 20px;">
          ${message ? `<p style="font-size: 0.88rem; color: var(--text-main); margin-bottom: 14px; line-height: 1.5;">${message}</p>` : ''}
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${optionsHtml}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" onclick="ModalDialog.closeModal()">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    options.forEach((opt, idx) => {
      const btn = document.getElementById(`opt-btn-${idx}`);
      if (btn) {
        btn.onclick = async () => {
          this.closeModal();
          if (typeof opt.action === 'function') {
            try { await opt.action(opt.id || opt.value); } catch (e) { console.error('Option action error:', e); }
          }
        };
      }
    });
  }

  static showValidationModal({ title = 'Validation Conditions Check', validationResults = [], options = [], onDismiss = null }) {
    this.closeModal();

    const modalEl = document.createElement('div');
    modalEl.id = 'fmc-active-modal';
    modalEl.className = 'modal-overlay';

    const itemsHtml = validationResults.map(res => `
      <div style="background: rgba(255,255,255,0.03); border-left: 3px solid ${res.passed ? 'var(--accent-emerald)' : 'var(--accent-rose)'}; padding: 8px 12px; border-radius: 4px; margin-bottom: 6px; font-size: 0.78rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: var(--text-main);"><i class="fa-solid ${res.passed ? 'fa-circle-check' : 'fa-triangle-exclamation'}" style="color: ${res.passed ? 'var(--accent-emerald)' : 'var(--accent-rose)'}; margin-right: 6px;"></i> ${res.field || 'Condition'}</strong>
          <span class="badge ${res.passed ? 'badge-emerald' : 'badge-rose'}">${res.passed ? 'PASSED' : 'CHECK NEEDED'}</span>
        </div>
        <div style="color: var(--text-muted); margin-top: 4px;">${res.message}</div>
      </div>
    `).join('');

    const optionsHtml = options.map((opt, idx) => `
      <button class="btn btn-${opt.type || 'primary'} btn-sm" id="val-opt-btn-${idx}" style="font-size: 0.78rem;">
        <i class="fa-solid ${opt.icon || 'fa-bolt'}" style="margin-right: 4px;"></i> ${opt.label}
      </button>
    `).join('');

    modalEl.innerHTML = `
      <div class="modal-box" style="max-width: 580px;">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid fa-shield-halved" style="color: var(--accent-cyan);"></i>
            <span>${title}</span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="ModalDialog.closeModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="max-height: 400px; overflow-y: auto; padding: 14px 18px;">
          ${itemsHtml}
        </div>
        <div class="modal-footer" style="gap: 8px; justify-content: flex-end; flex-wrap: wrap;">
          ${optionsHtml}
          <button class="btn btn-secondary btn-sm" onclick="ModalDialog.closeModal()">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    options.forEach((opt, idx) => {
      const btn = document.getElementById(`val-opt-btn-${idx}`);
      if (btn) {
        btn.onclick = async () => {
          this.closeModal();
          if (typeof opt.action === 'function') {
            try { await opt.action(opt.id); } catch (e) { console.error('Validation option error:', e); }
          }
        };
      }
    });
  }

  static showListDetailModal({ title = 'Select Item with Details', listItems = [], selectedId = null, onSelect = null }) {
    this.closeModal();

    const modalEl = document.createElement('div');
    modalEl.id = 'fmc-active-modal';
    modalEl.className = 'modal-overlay';

    modalEl.innerHTML = `
      <div class="modal-box" style="max-width: 780px; width: 90vw;">
        <div class="modal-header">
          <div class="modal-title"><i class="fa-solid fa-list-check" style="color: var(--accent-cyan);"></i> ${title}</div>
          <button class="btn btn-secondary btn-sm" onclick="ModalDialog.closeModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="padding: 12px; height: 420px;" id="list-detail-dialog-body"></div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" onclick="ModalDialog.closeModal()">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    if (window.ListBoxComponent) {
      window.ListBoxComponent.render('list-detail-dialog-body', {
        items: listItems,
        selectedId: selectedId || (listItems[0] && listItems[0].id),
        onSelect: (item) => {
          if (typeof onSelect === 'function') onSelect(item);
        }
      });
    }
  }
}

window.ModalDialog = ModalDialog;

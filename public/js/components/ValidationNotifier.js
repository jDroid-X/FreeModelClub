/**
 * ValidationNotifier.js
 * Purpose: Validation condition checking engine & closed-loop option dialog notifier (< 150 lines).
 * Dependencies: ApiService, ModalDialog
 */

class ValidationNotifier {
  /**
   * Validates target form/data object against conditions and pops up option dialog if checks fail or require decision
   */
  static async validateAndPrompt({ scope, data, title = 'Validation Conditions Check', onSuccess = null, onOptionSelect = null }) {
    try {
      const res = await ApiService.request('/api/validation/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, data })
      });

      if (res.isValid) {
        ModalDialog.showNotification('Validation passed! All conditions satisfied.', 'success');
        if (typeof onSuccess === 'function') await onSuccess(data);
        return { isValid: true, data };
      }

      // If validation conditions fail or have options, display Popup Dialog with Options
      const validationResults = (res.issues || []).map(iss => ({
        field: iss.field,
        passed: false,
        message: iss.message
      }));

      const options = (res.options || []).map(opt => ({
        id: opt.id,
        label: opt.label,
        type: opt.type || 'primary',
        icon: opt.icon || 'fa-bolt',
        action: async (optionId) => {
          // Closed loop option resolution
          const resolveRes = await ApiService.request('/api/validation/resolve-option', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scope, optionId, data })
          });

          if (resolveRes.success) {
            ModalDialog.showNotification(`Option '${opt.label}' applied!`, 'success');
            if (typeof onOptionSelect === 'function') {
              await onOptionSelect(optionId, resolveRes.resolvedData || data);
            }
          }
        }
      }));

      ModalDialog.showValidationModal({
        title,
        validationResults,
        options
      });

      return { isValid: false, issues: res.issues, options: res.options };

    } catch (err) {
      ModalDialog.showNotification(`Validation error: ${err.message}`, 'error');
      return { isValid: false, error: err.message };
    }
  }

  /**
   * Helper to trigger interactive popup option dialog with options
   */
  static showOptionPopup({ title, message, icon = 'fa-circle-info', options = [], confirmText, confirmStyle, onConfirm }) {
    if (confirmText && onConfirm && options.length === 0) {
      options = [{
        label: confirmText,
        type: confirmStyle || 'primary',
        icon: 'fa-check',
        action: onConfirm
      }];
    }
    ModalDialog.showOptionModal({
      title,
      message,
      icon,
      options
    });
  }

  /**
   * Notification bridge method delegating to ModalDialog.showNotification or showOptionModal
   */
  static show(arg1, arg2, arg3) {
    if (typeof ModalDialog !== 'undefined' && ModalDialog.showNotification) {
      if (arg3 !== undefined) {
        // Called as (title, message, type)
        const type = typeof arg3 === 'string' ? arg3 : 'info';
        ModalDialog.showNotification(`[${arg1}] ${arg2}`, type);
      } else {
        // Called as (message, type)
        const type = typeof arg2 === 'string' ? arg2 : 'info';
        ModalDialog.showNotification(arg1, type);
      }
    } else {
      console.log('[ValidationNotifier]', arg1, arg2, arg3);
    }
  }
}

window.ValidationNotifier = ValidationNotifier;

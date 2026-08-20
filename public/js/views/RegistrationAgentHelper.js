/**
 * RegistrationAgentHelper.js
 * Purpose: Auxiliary helper functions for Provider Agent registration and online model discovery (< 100 lines).
 */

class RegistrationAgentHelper {
  static formatQuotaBadge(quotaStr) {
    if (!quotaStr) return '';
    return `<span class="badge badge-amber" style="font-size: 0.7rem;"><i class="fa-solid fa-gift"></i> Quota: ${quotaStr}</span>`;
  }
}

window.RegistrationAgentHelper = RegistrationAgentHelper;

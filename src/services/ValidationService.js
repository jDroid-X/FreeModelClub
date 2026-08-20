/**
 * ValidationService.js
 * Purpose: Enforces input sanitization, URL validation, credential checks, and condition feedback (< 200 lines).
 * Dependencies: None
 */

class ValidationService {
  /**
   * Validates provider registration / edit data
   */
  static validateProviderRegistration(data = {}, existingProviders = []) {
    const issues = [];
    const options = [];

    if (!data.displayName || data.displayName.trim().length < 2) {
      issues.push({ field: 'displayName', rule: 'MIN_LENGTH', message: 'Provider Display Name must be at least 2 characters.' });
    }

    if (!data.baseUrl || !data.baseUrl.trim()) {
      issues.push({ field: 'baseUrl', rule: 'REQUIRED', message: 'Base URL is required.' });
    } else {
      const url = data.baseUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        issues.push({ field: 'baseUrl', rule: 'URL_FORMAT', message: 'Base URL must start with http:// or https://' });
      }
    }

    const isOllama = data.protocol === 'Ollama Local API' || (data.baseUrl && data.baseUrl.includes('11434'));
    const existingProv = existingProviders.find(p => p.id === data.providerId);
    const hasDbKey = existingProv && existingProv.apiKey && existingProv.apiKey !== '';

    if (!isOllama && (!data.apiKey || !data.apiKey.trim()) && !hasDbKey) {
      issues.push({ field: 'apiKey', rule: 'KEY_REQUIRED', message: 'API key is required for cloud providers.' });
    }

    if (data.baseUrl && Array.isArray(existingProviders)) {
      const dup = existingProviders.find(p => p.baseUrl === data.baseUrl.trim() && p.id !== data.providerId);
      if (dup) {
        issues.push({ field: 'baseUrl', rule: 'DUPLICATE_URL', message: `Base URL is already registered under '${dup.displayName || dup.id}'.` });
        options.push({ id: 'switch_existing', label: `Switch to ${dup.displayName || dup.id}`, type: 'amber', icon: 'fa-arrow-right' });
      }
    }

    if (issues.length > 0) {
      options.unshift(
        { id: 'auto_fix', label: 'Apply Recommended Auto-Fixes', type: 'emerald', isRecommended: true, icon: 'fa-wand-magic-sparkles' },
        { id: 'use_defaults', label: 'Load Default Working Specs', type: 'secondary', icon: 'fa-sliders' }
      );
    }

    return {
      isValid: issues.length === 0,
      issues,
      options: options.length > 0 ? options : [{ id: 'proceed', label: 'Proceed with Validation', type: 'emerald', isRecommended: true, icon: 'fa-check' }]
    };
  }

  /**
   * Validates Model Combo creation / configuration
   */
  static validateModelCombo(comboData = {}, allModels = []) {
    const issues = [];
    const options = [];

    if (!comboData.id || comboData.id.trim().length < 2) {
      issues.push({ field: 'id', rule: 'REQUIRED', message: 'Combo ID/Name is required.' });
    }

    if (!comboData.primaryModelId) {
      issues.push({ field: 'primaryModelId', rule: 'REQUIRED', message: 'Primary Model selection is required.' });
    }

    if (comboData.primaryModelId && comboData.fallbackModelId && comboData.primaryModelId === comboData.fallbackModelId) {
      issues.push({ field: 'fallbackModelId', rule: 'DUPLICATE_MODEL', message: 'Fallback model should differ from primary model for true high-availability.' });
      options.push({ id: 'auto_assign_fallback', label: 'Auto-Assign Alternate Fallback Model', type: 'emerald', isRecommended: true, icon: 'fa-network-wired' });
    }

    return {
      isValid: issues.length === 0,
      issues,
      options: options.length > 0 ? options : [{ id: 'proceed', label: 'Proceed with Combo', type: 'emerald', isRecommended: true, icon: 'fa-check' }]
    };
  }

  /**
   * Validates Chat completions payload format
   */
  static validateChatPayload(payload = {}) {
    if (!payload.messages || !Array.isArray(payload.messages) || payload.messages.length === 0) {
      return { isValid: false, error: 'Request payload must contain a non-empty "messages" array.' };
    }
    return { isValid: true };
  }
}

module.exports = ValidationService;


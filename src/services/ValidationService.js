/**
 * ValidationService.js
 * Purpose: Enforces input sanitization, URL validation, credential checks, and error condition feedback
 * Dependencies: None
 */

class ValidationService {
  static validateProviderRegistration(data = {}) {
    const errors = [];
    const warnings = [];

    if (!data.displayName || data.displayName.trim().length < 3) {
      errors.push('Display Name is required and must be at least 3 characters long.');
    }

    if (!data.baseUrl || !data.baseUrl.trim()) {
      errors.push('Base URL is required.');
    } else {
      const url = data.baseUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        errors.push('Base URL must begin with http:// or https:// (e.g. https://api.groq.com/openai/v1).');
      }
    }

    if (data.baseUrl && data.baseUrl.includes('api.groq.com') && (!data.apiKey || !data.apiKey.trim())) {
      warnings.push('Groq Cloud API requires an API key (gsk_...). Make sure to supply your key.');
    }

    if (data.baseUrl && data.baseUrl.includes('openrouter.ai') && (!data.apiKey || !data.apiKey.trim())) {
      warnings.push('OpenRouter API requires an API key (sk-or-v1-...). Make sure to supply your key.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      message: errors.length > 0 ? errors.join(' ') : 'Validation passed successfully.'
    };
  }

  static validateChatPayload(payload = {}) {
    if (!payload.messages || !Array.isArray(payload.messages) || payload.messages.length === 0) {
      return { isValid: false, error: 'Request payload must contain a non-empty "messages" array.' };
    }
    return { isValid: true };
  }
}

module.exports = ValidationService;

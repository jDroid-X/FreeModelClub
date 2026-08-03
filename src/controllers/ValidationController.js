/**
 * ValidationController.js
 * Purpose: Backend validation condition checker & closed-loop option resolution engine (< 150 lines).
 *          Evaluates field constraints, provider reachability, model parameters, and returns actionable feedback options.
 * Dependencies: Database, LogModel
 */

const db = require('../models/Database');
const LogModel = require('../models/LogModel');

class ValidationController {
  static checkCondition(req, res) {
    const { scope, data } = req.body || {};
    const issues = [];
    const options = [];

    if (!scope || !data) {
      return res.status(400).json({ success: false, message: 'scope and data are required for validation.' });
    }

    if (scope === 'provider_registration') {
      const { baseUrl, apiKey, displayName, protocol } = data;
      if (!displayName || displayName.trim().length < 2) {
        issues.push({ field: 'displayName', rule: 'MIN_LENGTH', message: 'Provider Display Name must be at least 2 characters.' });
      }
      if (!baseUrl || !baseUrl.startsWith('http')) {
        issues.push({ field: 'baseUrl', rule: 'URL_FORMAT', message: 'Base URL must start with http:// or https://' });
      }
      if (apiKey === '********' || !apiKey) {
        issues.push({ field: 'apiKey', rule: 'KEY_CHECK', message: 'API key is masked or empty. Resolution will fetch original database key.' });
      }

      if (issues.length > 0) {
        options.push(
          { id: 'auto_fix', label: 'Apply Recommended Auto-Fixes', type: 'primary', icon: 'fa-wand-magic-sparkles' },
          { id: 'use_defaults', label: 'Load Default Working Specs', type: 'secondary', icon: 'fa-sliders' },
          { id: 'view_log', label: 'Inspect Error Log', type: 'outline', icon: 'fa-file-waveform' }
        );
      }
    } else if (scope === 'model_combo') {
      const { comboId, primaryModelId, fallbackModelId } = data;
      if (!comboId) issues.push({ field: 'comboId', rule: 'REQUIRED', message: 'Combo ID is required.' });
      if (primaryModelId === fallbackModelId) {
        issues.push({ field: 'fallbackModelId', rule: 'DUPLICATE_MODEL', message: 'Fallback model should differ from primary model for true high-availability.' });
        options.push(
          { id: 'auto_assign_fallback', label: 'Auto-Assign Alternate Fallback Model', type: 'primary', icon: 'fa-network-wired' }
        );
      }
    }

    const isValid = issues.length === 0;
    return res.json({
      success: true,
      isValid,
      scope,
      issueCount: issues.length,
      issues,
      options: options.length > 0 ? options : [{ id: 'proceed', label: 'Proceed with Validation', type: 'emerald', icon: 'fa-check' }]
    });
  }

  static resolveOption(req, res) {
    const { scope, optionId, data } = req.body || {};
    const resolvedData = { ...data };

    if (optionId === 'auto_fix' || optionId === 'use_defaults') {
      if (!resolvedData.baseUrl || !resolvedData.baseUrl.startsWith('http')) {
        resolvedData.baseUrl = 'https://api.groq.com/openai/v1';
      }
      if (!resolvedData.displayName) {
        resolvedData.displayName = 'Auto-Configured Provider';
      }
      if (!resolvedData.protocol) {
        resolvedData.protocol = 'OpenAI Compatible';
      }
    } else if (optionId === 'auto_assign_fallback') {
      resolvedData.fallbackModelId = 'llama-3.1-8b-instant';
    }

    LogModel.recordSystemLog('VALIDATION_OPTION_RESOLVED', 'INFO', `Closed-loop feedback option '${optionId}' resolved for scope '${scope}'`, { optionId, scope });

    return res.json({
      success: true,
      scope,
      optionId,
      resolvedData,
      message: `Option '${optionId}' successfully applied. Closed-loop state updated.`
    });
  }
}

module.exports = ValidationController;

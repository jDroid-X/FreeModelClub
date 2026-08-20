/**
 * ValidationController.js
 * Purpose: Backend validation condition checker & closed-loop option resolution engine (< 150 lines).
 *          Evaluates field constraints, provider reachability, model parameters, and returns actionable feedback options.
 * Dependencies: Database, LogModel
 */

const db = require('../models/Database');
const LogModel = require('../models/LogModel');
const ValidationService = require('../services/ValidationService');

class ValidationController {
  static checkCondition(req, res) {
    const { scope, data } = req.body || {};

    if (!scope || !data) {
      return res.status(400).json({ success: false, message: 'scope and data are required for validation.' });
    }

    let validationResult;
    if (scope === 'provider_registration') {
      const allProviders = db.read('providers') || [];
      validationResult = ValidationService.validateProviderRegistration(data, allProviders);
    } else if (scope === 'model_combo') {
      const allModels = db.read('models') || [];
      validationResult = ValidationService.validateModelCombo(data, allModels);
    } else {
      validationResult = { isValid: true, issues: [], options: [{ id: 'proceed', label: 'Proceed with Validation', type: 'emerald', isRecommended: true, icon: 'fa-check' }] };
    }

    return res.json({
      success: true,
      isValid: validationResult.isValid,
      scope,
      issueCount: validationResult.issues ? validationResult.issues.length : 0,
      issues: validationResult.issues || [],
      options: validationResult.options || []
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
    } else if (optionId === 'apply_groq_optimizations') {
      // In a real scenario, this would set internal token limit config
      resolvedData.displayName = (resolvedData.displayName || 'Groq') + ' (Optimized)';
    } else if (optionId === 'switch_existing') {
      const allProviders = db.read('providers') || [];
      const dup = allProviders.find(p => p.baseUrl === resolvedData.baseUrl);
      if (dup) {
         resolvedData.providerId = dup.id;
         resolvedData.displayName = dup.displayName;
      }
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

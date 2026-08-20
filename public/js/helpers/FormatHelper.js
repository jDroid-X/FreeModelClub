/**
 * FormatHelper.js
 * Purpose: Centralized utility for formatting display strings across the UI.
 *          Handles sanitization (removing prov_ prefixes) and token arithmetic.
 */

class FormatHelper {
  static getProviderDisplayName(provider = null, fallback = 'Unknown Provider') {
    if (!provider) return fallback;
    const raw = (provider.displayName || provider.providerName || provider.name || provider.id || fallback).trim();
    return this.compactProviderName(raw);
  }

  static getModelDisplayName(model = null, fallback = 'Unknown Model') {
    if (!model) return fallback;
    if (typeof model === 'string') return this.sanitizeModelName(model).trim() || fallback;
    const rawName = model.modelName || model.name || model.displayName || model.modelId || model.id || fallback;
    return this.sanitizeModelName(String(rawName)).trim() || fallback;
  }

  /**
   * Sanitizes model IDs/Names by stripping internal prefix conventions
   * e.g. "prov_openrouter_cohere_north-mini" -> "cohere_north-mini"
   */
  static sanitizeModelName(name) {
    if (!name || typeof name !== 'string') return name;
    let cleanName = name;
    
    // Remove specific provider prefixes followed by underscore if any exist
    cleanName = cleanName.replace(/^[a-zA-Z0-9]+_/, '');
    return cleanName;
  }

  static compactProviderName(name) {
    if (!name || typeof name !== 'string') return name;
    return name
      .replace(/\s*\(.+?\)\s*/g, ' ')
      .replace(/[\/,|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 3)
      .join(' ');
  }

  static formatTokensCompact(num) {
    if (num == null || num === 'Unlimited') return 'Unlimited';
    if (typeof num === 'string') num = parseInt(num.replace(/,/g, ''), 10);
    if (isNaN(num)) return '0';
    return this.formatNumberAutoUnit(num);
  }

  /**
   * Universal format: <Provider> - <Models> - <Tokens consumed / Available>
   * @param {Object} model - The AIModel object
   * @param {Object} provider - The ProviderModel object (can be null if missing)
   * @returns {string} Formatted string
   */
  static formatModelLabel(model, provider = null) {
    const providerName = this.getProviderDisplayName(provider, model.providerName || 'Unknown Provider');
    const cleanModelName = this.getModelDisplayName(model, 'Unknown Model');
    
    const consumed = (model.totalPromptTokens || 0) + (model.totalCompletionTokens || 0);
    const available = provider && provider.tokensAvailable ? provider.tokensAvailable : 'Unlimited';

    return `${providerName} - ${cleanModelName} - ${consumed} / ${available}`;
  }

  /**
   * Calculates sum of tokens for a list of models (IDs or objects) and their providers
   */
  static calculateComboTokenSums(modelsList, allModels = [], allProviders = []) {
    let sumConsumed = 0;
    let hasUnlimited = false;
    let sumAvailable = 0;

    (modelsList || []).forEach(item => {
      const m = typeof item === 'object' ? item : (allModels || []).find(x => x.id === item);
      if (m) {
        sumConsumed += (m.totalPromptTokens || 0) + (m.totalCompletionTokens || 0);
        const p = (allProviders || []).find(prov => prov.id === m.providerId);
        if (p) {
          if (!p.tokensAvailable || p.tokensAvailable === 'Unlimited') {
            hasUnlimited = true;
          } else if (typeof p.tokensAvailable === 'number') {
            sumAvailable += p.tokensAvailable;
          } else {
            const parsed = parseInt(String(p.tokensAvailable).replace(/,/g, ''), 10);
            if (!isNaN(parsed)) sumAvailable += parsed;
            else hasUnlimited = true;
          }
        } else {
          hasUnlimited = true;
        }
      }
    });

    return {
      consumed: sumConsumed,
      available: hasUnlimited ? 'Unlimited' : sumAvailable
    };
  }

  /**
   * Formats token sum as "<Tokens consumed / Available><unit>" e.g. "0 / Unlimited Tokens"
   */
  static formatTokenSumString(modelsList, allModels = [], allProviders = [], unit = 'Tokens') {
    const sums = this.calculateComboTokenSums(modelsList, allModels, allProviders);
    return `${sums.consumed} / ${sums.available} ${unit}`;
  }

  /**
   * Centralized number formatter: always uses highest appropriate unit with 2 decimals.
   * e.g. 123600 → "123.60K", 862500000 → "862.50M", 42 → "42.00"
   * @param {number|string|null} value - The numeric value to format
   * @returns {string} Formatted string like "<###.## unit>"
   */
  static formatNumberAutoUnit(value) {
    if (value == null || value === 'Unlimited') return value === 'Unlimited' ? 'Unlimited' : '0.00';
    if (typeof value === 'string') value = parseFloat(value.replace(/,/g, ''), 10);
    if (isNaN(value)) return '0.00';
    if (value >= 1000000000) return (value / 1000000000).toFixed(2) + 'B';
    if (value >= 1000000) return (value / 1000000).toFixed(2) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(2) + 'K';
    return value.toFixed(2);
  }

  /**
   * Calculate consumed/available tokens for a skill group's models.
   * @param {Array} skillModels - Array of model objects in the skill group
   * @param {Array} allProviders - All provider objects
   * @returns {{ consumed: number, available: string|number }}
   */
  static calculateSkillTokenSums(skillModels = [], allProviders = []) {
    let sumConsumed = 0;
    let hasUnlimited = false;
    let sumAvailable = 0;

    (skillModels || []).forEach(m => {
      sumConsumed += (m.totalPromptTokens || 0) + (m.totalCompletionTokens || 0);
      const p = (allProviders || []).find(prov => prov.id === m.providerId);
      if (p) {
        if (!p.tokensAvailable || p.tokensAvailable === 'Unlimited') {
          hasUnlimited = true;
        } else if (typeof p.tokensAvailable === 'number') {
          sumAvailable += p.tokensAvailable;
        } else {
          const parsed = parseInt(String(p.tokensAvailable).replace(/,/g, ''), 10);
          if (!isNaN(parsed)) sumAvailable += parsed;
          else hasUnlimited = true;
        }
      } else {
        hasUnlimited = true;
      }
    });

    return {
      consumed: sumConsumed,
      available: hasUnlimited ? 'Unlimited' : sumAvailable
    };
  }

  /**
   * Format token Bal/Avail string for display: "Bal: ###.##K / Avl: ###.##M"
   * @param {Array} models - model objects in the group
   * @param {Array} providers - all providers
   * @returns {string} Formatted string
   */
  static formatBalAvailString(models = [], providers = []) {
    const sums = this.calculateSkillTokenSums(models, providers);
    const balStr = this.formatNumberAutoUnit(sums.consumed);
    const avlStr = this.formatNumberAutoUnit(sums.available);
    return `Bal: ${balStr} | Avl: ${avlStr}`;
  }
}

window.FormatHelper = FormatHelper;


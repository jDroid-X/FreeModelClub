/**
 * FormatHelper.js
 * Purpose: Centralized utility for formatting display strings across the UI.
 *          Handles sanitization (removing prov_ prefixes) and token arithmetic.
 */

class FormatHelper {
  /**
   * Sanitizes model IDs/Names by stripping internal prefix conventions
   * e.g. "prov_openrouter_cohere_north-mini" -> "cohere_north-mini"
   */
  static sanitizeModelName(rawName) {
    if (!rawName) return 'Unknown Model';
    let cleanName = String(rawName);
    // Remove specific provider prefixes followed by underscore (e.g. prov_openrouter_)
    cleanName = cleanName.replace(/^prov_[a-zA-Z0-9]+_/, '');
    // Fallback: remove just prov_ if it somehow remains
    cleanName = cleanName.replace(/^prov_/, '');
    return cleanName;
  }

  static formatTokensCompact(num) {
    if (num == null || num === 'Unlimited') return 'Unlimited';
    if (typeof num === 'string') num = parseInt(num.replace(/,/g, ''), 10);
    if (isNaN(num)) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\\.0$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\\.0$/, '') + 'K';
    return num.toString();
  }

  /**
   * Universal format: <Provider> - <Models> - <Tokens consumed / Available>
   * @param {Object} model - The AIModel object
   * @param {Object} provider - The ProviderModel object (can be null if missing)
   * @returns {string} Formatted string
   */
  static formatModelLabel(model, provider = null) {
    const providerName = provider ? provider.displayName : (model.providerName || 'Unknown Provider');
    const cleanModelName = this.sanitizeModelName(model.modelName || model.modelId || model.id);
    
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
}

window.FormatHelper = FormatHelper;


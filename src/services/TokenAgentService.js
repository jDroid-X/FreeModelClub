/**
 * TokenAgentService.js
 * Purpose: Comprehensive Token Agent Service covering all rate limit criteria,
 *          latency pings, consumed token aggregation, and hard limit normalizations (< 170 lines).
 */

const ProviderModel = require('../models/ProviderModel');
const AIModel = require('../models/AIModel');
const LogModel = require('../models/LogModel');
const http = require('http');
const https = require('https');

class TokenAgentService {
  static getKnownTokenLimits() {
    return {
      'groq': { limit: '30 RPM / 14,400 RPD / 3,000 TPM', hard: 14400000 },
      'gemini': { limit: '15 RPM / 1,500 RPD / 1M TPM', hard: 1500000 },
      'openrouter': { limit: '200 RPM (Depends on Free Model)', hard: 0 },
      'ollama': { limit: 'Unlimited Local / Zero Rate Limits', hard: 0 },
      'opencode': { limit: 'Universal Dynamic Free Tier (opencode)', hard: 0 },
      'openai': { limit: 'Unlimited / Custom', hard: 0 },
      'nvidia': { limit: 'Universal Dynamic Free Tier (nvidia)', hard: 0 },
      'bynara': { limit: 'Universal Dynamic Free Tier (bynara)', hard: 0 },
      'together': { limit: '60 RPM / Free Tier', hard: 6000000 },
      'cohere': { limit: '10 RPM / 1,000 RPD', hard: 1000000 },
      'huggingface': { limit: 'No exact rate limit (Dynamic)', hard: 0 },
      'github': { limit: '15 RPM / 150 RPD', hard: 150000 },
      'anthropic': { limit: 'Unlimited / Custom', hard: 0 }
    };
  }

  static detectProviderKey(provider) {
    const name = (provider.displayName || '').toLowerCase();
    const url = (provider.baseUrl || '').toLowerCase();

    if (name.includes('groq') || url.includes('groq')) return 'groq';
    if (name.includes('gemini') || name.includes('google') || url.includes('google')) return 'gemini';
    if (name.includes('openrouter') || url.includes('openrouter')) return 'openrouter';
    if (name.includes('ollama') || url.includes('localhost') || url.includes('11434')) return 'ollama';
    if (name.includes('opencode') || url.includes('opencode')) return 'opencode';
    if (name.includes('openai') || url.includes('openai')) return 'openai';
    if (name.includes('nvidia') || url.includes('nvidia')) return 'nvidia';
    if (name.includes('bynara') || url.includes('bynara')) return 'bynara';
    if (name.includes('together') || url.includes('together')) return 'together';
    if (name.includes('cohere') || url.includes('cohere')) return 'cohere';
    if (name.includes('huggingface') || url.includes('huggingface')) return 'huggingface';
    if (name.includes('github') || url.includes('github')) return 'github';
    if (name.includes('anthropic') || url.includes('anthropic')) return 'anthropic';

    try {
      if (provider.baseUrl) {
        const parsed = new URL(provider.baseUrl);
        const parts = parsed.hostname.split('.');
        if (parts.length >= 2) return parts[parts.length - 2].toLowerCase();
      }
    } catch (e) {}

    return 'unknown_dynamic_provider';
  }

  static async pingLatency(baseUrl) {
    if (!baseUrl) return null;
    return new Promise(resolve => {
      const start = Date.now();
      try {
        const parsed = new URL(baseUrl);
        const transport = parsed.protocol === 'https:' ? https : http;
        const req = transport.get(baseUrl, { timeout: 3000 }, res => {
          resolve(Date.now() - start);
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
      } catch (e) { resolve(null); }
    });
  }

  static async syncProviderTokenLimit(providerId) {
    const provider = ProviderModel.getById(providerId, false);
    if (!provider) return { success: false, message: 'Provider not found.' };

    const key = this.detectProviderKey(provider);
    const known = this.getKnownTokenLimits()[key];

    let freeTierLimit = known ? known.limit : `Universal Dynamic Free Tier (${key})`;
    let hardTokenLimit = known ? known.hard : 0;

    // Aggregate tokens consumed by associated models
    const allModels = AIModel.getAll();
    const providerModels = allModels.filter(m => m.providerId === provider.id || m.providerName === provider.displayName);
    const totalTokensConsumed = providerModels.reduce((acc, m) => acc + (m.totalPromptTokens || 0) + (m.totalCompletionTokens || 0), 0);

    // Measure ping latency
    const pingLatencyMs = await this.pingLatency(provider.baseUrl);

    provider.freeTierLimit = freeTierLimit;
    provider.hardTokenLimit = hardTokenLimit;
    provider.tokensConsumed = totalTokensConsumed;
    provider.freeModelCount = providerModels.length;
    if (pingLatencyMs) provider.pingLatencyMs = pingLatencyMs;

    ProviderModel.update(provider.id, provider);

    LogModel.recordSystemLog(
      'TOKEN_AGENT',
      'INFO',
      `Synced Token Limits for '${provider.displayName}': ${freeTierLimit} | Consumed: ${totalTokensConsumed} | Latency: ${pingLatencyMs || 'N/A'}ms`
    );

    return { success: true, providerId: provider.id, freeTierLimit, hardTokenLimit, totalTokensConsumed, pingLatencyMs };
  }

  static async syncAllProviderTokens() {
    const providers = ProviderModel.getAll(false);
    const results = [];
    for (let p of providers) {
      const res = await this.syncProviderTokenLimit(p.id);
      results.push(res);
    }
    return { success: true, count: providers.length, results };
  }
}

module.exports = TokenAgentService;

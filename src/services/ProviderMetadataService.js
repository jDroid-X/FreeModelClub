/**
 * ProviderMetadataService.js
 * Purpose: Central Single Source of Truth for Provider Metadata, Rate Limits, Daily Allowances,
 *          Official Docs & Portal URLs, and Model Name Sanitization.
 * Dependencies: None (pure utility & dictionary service)
 */

class ProviderMetadataService {
  /**
   * Canonical Provider Metadata Registry
   */
  static KNOWN_METADATA = {
    bynara: {
      id: 'bynara',
      displayName: 'Bynara AI Router',
      portalUrl: 'https://router.bynara.id',
      docsUrl: 'https://router.bynara.id/docs',
      rateLimitRPM: 60,
      rateLimitRPD: 5000,
      rateLimitTPM: 100000,
      rateLimitTPD: 1000000,
      freeTierLimit: '60 RPM / 5,000 RPD / 100K TPM',
      hardTokenLimit: 1000000,
      freeModelCount: 72
    },
    groq: {
      id: 'groq',
      displayName: 'Groq Cloud',
      portalUrl: 'https://console.groq.com/keys',
      docsUrl: 'https://console.groq.com/docs/rate-limits',
      rateLimitRPM: 30,
      rateLimitRPD: 14400,
      rateLimitTPM: 70000,
      rateLimitTPD: 500000,
      freeTierLimit: '30 RPM / 14,400 RPD / 70K TPM',
      hardTokenLimit: 14400000,
      freeModelCount: 9
    },
    gemini: {
      id: 'gemini',
      displayName: 'Google Gemini API',
      portalUrl: 'https://aistudio.google.com/app/apikey',
      docsUrl: 'https://ai.google.dev/gemini-api/docs/rate-limits',
      rateLimitRPM: 15,
      rateLimitRPD: 1500,
      rateLimitTPM: 1000000,
      rateLimitTPD: 5000000,
      freeTierLimit: '15 RPM / 1,500 RPD / 1M TPM',
      hardTokenLimit: 1500000,
      freeModelCount: 5
    },
    openrouter: {
      id: 'openrouter',
      displayName: 'OpenRouter Free Models',
      portalUrl: 'https://openrouter.ai/keys',
      docsUrl: 'https://openrouter.ai/docs/limits',
      rateLimitRPM: 200,
      rateLimitRPD: 20000,
      rateLimitTPM: 200000,
      rateLimitTPD: 2000000,
      freeTierLimit: '200 RPM / 20,000 RPD (Free Models)',
      hardTokenLimit: 0,
      freeModelCount: 17
    },
    nvidia: {
      id: 'nvidia',
      displayName: 'NVIDIA NIM Cloud',
      portalUrl: 'https://build.nvidia.com',
      docsUrl: 'https://docs.api.nvidia.com/nim/reference/limits',
      rateLimitRPM: 30,
      rateLimitRPD: 1000,
      rateLimitTPM: 50000,
      rateLimitTPD: 500000,
      freeTierLimit: '30 RPM / 1,000 RPD / 50K TPM',
      hardTokenLimit: 500000,
      freeModelCount: 71
    },
    opencode: {
      id: 'opencode',
      displayName: 'Opencode Zen',
      portalUrl: 'https://opencode.ai',
      docsUrl: 'https://opencode.ai/docs/zen/',
      rateLimitRPM: 60,
      rateLimitRPD: 5000,
      rateLimitTPM: 100000,
      rateLimitTPD: 1000000,
      freeTierLimit: '60 RPM / 5,000 RPD / 100K TPM',
      hardTokenLimit: 1000000,
      freeModelCount: 71
    },
    openai: {
      id: 'openai',
      displayName: 'OpenAI ChatGPT',
      portalUrl: 'https://platform.openai.com/api-keys',
      docsUrl: 'https://platform.openai.com/docs/guides/rate-limits',
      rateLimitRPM: 3,
      rateLimitRPD: 200,
      rateLimitTPM: 40000,
      rateLimitTPD: 200000,
      freeTierLimit: 'Tier 1 / Free Trial Limits',
      hardTokenLimit: 0,
      freeModelCount: 17
    },
    ollama: {
      id: 'ollama',
      displayName: 'Ollama Localhost Models',
      portalUrl: 'https://ollama.com',
      docsUrl: 'https://github.com/ollama/ollama/blob/main/docs/api.md',
      rateLimitRPM: 0,
      rateLimitRPD: 0,
      rateLimitTPM: 0,
      rateLimitTPD: 0,
      freeTierLimit: 'Unlimited Local / Zero Rate Limits',
      hardTokenLimit: 0,
      freeModelCount: 7
    },
    together: {
      id: 'together',
      displayName: 'Together AI Cloud',
      portalUrl: 'https://api.together.ai/settings/api-keys',
      docsUrl: 'https://docs.together.ai/docs/rate-limits',
      rateLimitRPM: 60,
      rateLimitRPD: 5000,
      rateLimitTPM: 60000,
      rateLimitTPD: 500000,
      freeTierLimit: '60 RPM / 5,000 RPD ($5.00 Free Trial Credit)',
      hardTokenLimit: 500000,
      freeModelCount: 0
    },
    cerebras: {
      id: 'cerebras',
      displayName: 'Cerebras Cloud AI',
      portalUrl: 'https://cloud.cerebras.ai',
      docsUrl: 'https://inference-docs.cerebras.ai/rate-limits',
      rateLimitRPM: 30,
      rateLimitRPD: 14400,
      rateLimitTPM: 60000,
      rateLimitTPD: 500000,
      freeTierLimit: '30 RPM / 14,400 RPD / 60K TPM',
      hardTokenLimit: 500000,
      freeModelCount: 0
    },
    sambanova: {
      id: 'sambanova',
      displayName: 'SambaNova Cloud AI',
      portalUrl: 'https://cloud.sambanova.ai',
      docsUrl: 'https://community.sambanova.ai/t/rate-limits/',
      rateLimitRPM: 30,
      rateLimitRPD: 1000,
      rateLimitTPM: 60000,
      rateLimitTPD: 500000,
      freeTierLimit: '30 RPM / 1,000 RPD / 60K TPM',
      hardTokenLimit: 500000,
      freeModelCount: 0
    },
    mistral: {
      id: 'mistral',
      displayName: 'Mistral AI Platform',
      portalUrl: 'https://console.mistral.ai/api-keys',
      docsUrl: 'https://docs.mistral.ai/deployment/limits/',
      rateLimitRPM: 60,
      rateLimitRPD: 5000,
      rateLimitTPM: 500000,
      rateLimitTPD: 2000000,
      freeTierLimit: 'La Plateforme Free Tier (1 RPS / 500K TPM)',
      hardTokenLimit: 2000000,
      freeModelCount: 0
    },
    deepseek: {
      id: 'deepseek',
      displayName: 'DeepSeek AI Platform',
      portalUrl: 'https://platform.deepseek.com/api_keys',
      docsUrl: 'https://api-docs.deepseek.com/quick_start/rate_limit',
      rateLimitRPM: 60,
      rateLimitRPD: 5000,
      rateLimitTPM: 100000,
      rateLimitTPD: 1000000,
      freeTierLimit: 'Standard Free Tier (60 RPM / 100K TPM)',
      hardTokenLimit: 1000000,
      freeModelCount: 0
    },
    agentrouter: {
      id: 'agentrouter',
      displayName: 'AgentRouter API',
      portalUrl: 'https://agentrouter.org/console/personal',
      docsUrl: 'https://agentrouter.org/docs/index.html',
      rateLimitRPM: 60,
      rateLimitRPD: 5000,
      rateLimitTPM: 100000,
      rateLimitTPD: 1000000,
      freeTierLimit: 'Universal Dynamic Free Tier',
      hardTokenLimit: 1000000,
      freeModelCount: 0
    }
  };

  /**
   * Resolves canonical or inferred metadata for any provider.
   */
  static getMetadata(providerId, baseUrl = '', displayName = '') {
    const pId = (providerId || '').toLowerCase();
    const pName = (displayName || '').toLowerCase();
    const pBase = (baseUrl || '').toLowerCase();

    // Check exact ID match
    for (const [key, meta] of Object.entries(this.KNOWN_METADATA)) {
      if (pId === key || pId.includes(key) || pName.includes(key) || pBase.includes(key)) {
        return { ...meta };
      }
    }

    // Dynamic heuristic fallback
    return {
      id: providerId,
      displayName: displayName || providerId,
      portalUrl: baseUrl ? baseUrl.replace(/\/v1\/?$/, '') : '',
      docsUrl: baseUrl ? baseUrl.replace(/\/v1\/?$/, '') : '',
      rateLimitRPM: 30,
      rateLimitRPD: 1000,
      rateLimitTPM: 60000,
      rateLimitTPD: 500000,
      freeTierLimit: '30 RPM / 1,000 RPD / 60K TPM',
      hardTokenLimit: 500000,
      freeModelCount: 0
    };
  }

  /**
   * Formats a standard rate limit descriptor.
   */
  static formatRateLimitString(rpm = 30, rpd = 1000, tpm = 60000) {
    const fmt = (n) => {
      if (!n || n <= 0) return '0';
      if (n >= 1000000) return `${(n / 1000000).toFixed(0)}M`;
      if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
      return n.toLocaleString();
    };
    return `${rpm} RPM / ${rpd.toLocaleString()} RPD / ${fmt(tpm)} TPM`;
  }

  /**
   * Cleans prepended URL prefixes and unwanted suffixes from model names.
   */
  static sanitizeModelName(rawName) {
    if (!rawName) return '';
    return rawName
      .replace(/^https?:\/\/[^\/]+\/\s*/i, '') // Strips "https://router.bynara.id/ "
      .replace(/\s*\((free|Free|FREE)\)/g, '')  // Strips "(Free)"
      .replace(/:free$/i, '')                  // Strips ":free"
      .trim();
  }
}

module.exports = ProviderMetadataService;

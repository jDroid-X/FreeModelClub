/**
 * ProviderService.js
 * Purpose: Connects to AI Provider APIs, fetches live models, and filters ONLY Free Models
 * Dependencies: ProviderModel, AIModel, ModelFamilyService, https, http
 */

const https = require('https');
const http = require('http');
const ProviderModel = require('../models/ProviderModel');
const AIModel = require('../models/AIModel');
const ModelFamilyService = require('./ModelFamilyService');
const ProviderAgentHelper = require('./ProviderAgentHelper');
const db = require('../models/Database');

class ProviderService {
  /**
   * Fetches models from provider API and returns filtered list of Free Models
   */
  static async fetchFreeModelsFromProvider(providerId, customBaseUrl = null, customApiKey = null) {
    const provider = ProviderModel.getById(providerId) || {
      id: providerId,
      baseUrl: customBaseUrl,
      apiKey: customApiKey,
      protocol: 'OpenAI Compatible',
      displayName: providerId
    };

    const baseUrl = (customBaseUrl || provider.baseUrl || '').replace(/\/+$/, '');
    const apiKey = customApiKey !== null ? customApiKey : provider.apiKey;

    if (!baseUrl) {
      throw new Error('Base URL is required to fetch provider models.');
    }

    // 1. First attempt Live Online API discovery
    let rawModels = [];
    try {
      const isOllama = provider.id === 'ollama' || baseUrl.includes('11434') || baseUrl.includes('ollama') || (provider.protocol && provider.protocol.toLowerCase().includes('ollama'));
      const isGemini = provider.id === 'gemini' || baseUrl.includes('googleapis.com') || (provider.protocol && provider.protocol.toLowerCase().includes('gemini'));
      let responseData;
      
      if (isOllama) {
        const targetUrl = baseUrl.includes('/v1') ? `${baseUrl.replace(/\/v1\/?$/, '')}/api/tags` : `${baseUrl}/api/tags`;
        responseData = await this.makeHttpRequest(targetUrl, apiKey);
      } else if (isGemini) {
        const cleanBase = baseUrl.replace(/\/models\/?$/, '');
        const targetUrl = apiKey ? `${cleanBase}/models?key=${apiKey}` : `${cleanBase}/models`;
        responseData = await this.makeHttpRequest(targetUrl, apiKey);
      } else {
        let fullUrl = baseUrl;
        if (baseUrl.includes('router.bynara.id')) {
          const cleanBynara = baseUrl.replace(/\/models\/?$/, '').replace(/\/v1\/?$/, '');
          fullUrl = `${cleanBynara}/v1/models`;
        } else {
          const targetPath = baseUrl.endsWith('/models') ? '' : '/models';
          fullUrl = `${baseUrl}${targetPath}`;
        }
        responseData = await this.makeHttpRequest(fullUrl, apiKey);
      }

      let liveModels = [];
      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        liveModels = responseData.data;
      } else if (Array.isArray(responseData)) {
        liveModels = responseData;
      } else if (responseData && responseData.models && Array.isArray(responseData.models)) {
        liveModels = responseData.models;
      }

      liveModels.forEach(lm => {
        const id = lm.id || lm.modelId || lm.name || '';
        if (id) {
          rawModels.push(lm);
        }
      });
    } catch (err) {
      console.warn(`Live API fetch notice for ${provider.displayName}: ${err.message}.`);
    }

    // 2. If Live API returned no models, invoke ProviderAgentService (LLM Online Search)
    if (!rawModels || rawModels.length === 0) {
      try {
        const ProviderAgentService = require('./ProviderAgentService');
        const queryName = provider.displayName && provider.displayName !== provider.id ? provider.displayName : provider.id;
        const aiResult = await ProviderAgentService.lookupProvider(queryName);
        if (aiResult && aiResult.found && aiResult.provider && Array.isArray(aiResult.provider.models) && aiResult.provider.models.length > 0) {
          rawModels = aiResult.provider.models;
        }
      } catch (aiErr) {
        console.warn(`AI Agent lookup notice for ${provider.displayName}: ${aiErr.message}.`);
      }
    }

    // 3. Fallback to Known Catalog only if live discovery was completely unavailable
    if (!rawModels || rawModels.length === 0) {
      const ProviderAgentHelper = require('./ProviderAgentHelper');
      const knownDb = ProviderAgentHelper.getKnownProvidersDatabase();
      if (knownDb[provider.id] && Array.isArray(knownDb[provider.id].models)) {
        rawModels = knownDb[provider.id].models.slice();
      }
    }

    if (!rawModels || rawModels.length === 0) {
      rawModels = this.getFallbackFreeModelsForProvider(provider);
    }

    // Filter ONLY Free models
    const freeModels = this.filterAndEnrichFreeModels(rawModels, provider);
    return freeModels;
  }

  static filterAndEnrichFreeModels(rawList, provider) {
    const freeList = [];

    rawList.forEach((item) => {
      const modelId = typeof item === 'string' ? item : item.id || item.modelId || item.name || item.model;
      const rawName = item.name || item.modelName || item.id || modelId;

      if (!modelId) return; // Skip invalid entries to prevent crashes
      
      let isFree = false;
      // Identification rules for Free Models across major providers:
      const idLower = modelId.toLowerCase();

      // Rule 0: Trust explicit isFree flags from AI Agent or Verified Catalog
      if (item.isFree === true || item.isFree === 'true') {
        isFree = true;
      }
      // Rule 1: Explicitly marked as free by API pricing info
      else if (item.pricing && item.pricing.prompt !== undefined) {
        if (parseFloat(item.pricing.prompt) === 0 && parseFloat(item.pricing.completion) === 0) {
          isFree = true;
        } else if (!idLower.includes(':free') && !idLower.includes('-free')) {
          isFree = false;
        }
      } 
      // Rule 2: OpenRouter suffix convention
      else if (provider.id === 'openrouter' || (provider.baseUrl && provider.baseUrl.toLowerCase().includes('openrouter.ai'))) {
        isFree = idLower.includes(':free');
      } 
      // Rule 3: Known strictly free providers (Groq, Bynara, Opencode, Ollama)
      else if (['groq', 'router.bynara', 'opencode', 'ollama'].some(p => provider.id && provider.id.includes(p)) || 
               ['groq', 'bynara', 'opencode', 'localhost'].some(b => provider.baseUrl && provider.baseUrl.includes(b))) {
        isFree = true;
      }
      // Rule 4: Heuristics based on model name strings
      else if (idLower.includes('free') || idLower.includes('trial') || idLower.includes('preview')) {
        isFree = true;
      }
      // Default: If provider has mixed tiers (Together, Mistral, etc.) and we don't have pricing, 
      // rely strictly on the known catalog in ProviderAgentHelper instead of importing hundreds of paid models.
      // If we made it this far, the model isn't strictly verified as free.
      else {
        isFree = false;
      }

      if (isFree) {
        const familyInfo = ModelFamilyService.classifyModel(modelId);
        freeList.push({
          id: `${provider.id}_${modelId}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
          providerId: provider.id,
          providerName: provider.displayName || provider.id,
          modelId: modelId,
          modelName: `${rawName} (Free)`,
          isFree: true,
          family: familyInfo.family,
          coreSkill: familyInfo.coreSkill,
          contextWindow: item.context_length || item.contextWindow || familyInfo.contextWindow || 32768,
          maxTokens: item.max_tokens || 8192,
          latencyMs: familyInfo.defaultLatencyMs || 200,
          status: 'Active',
          metadata: {
            description: item.description || familyInfo.description || 'Free tier high-performance AI model.',
            freeTierLimit: familyInfo.freeTierLimit || 'Unlimited / Standard Free Tier'
          }
        });
      }
    });

    return freeList;
  }

  static getFallbackFreeModelsForProvider(provider) {
    const pId = (provider.id || '').toLowerCase();
    const pUrl = (provider.baseUrl || '').toLowerCase();
    const pName = (provider.name || provider.displayName || '').toLowerCase();

    try {
      const knownDb = ProviderAgentHelper.getKnownProvidersDatabase();
      for (const [k, pInfo] of Object.entries(knownDb)) {
        if (pId === k || pId.includes(k) || pUrl.includes(k) || pName.includes(k)) {
          if (Array.isArray(pInfo.models) && pInfo.models.length > 0) {
            return pInfo.models.map(m => ({
              id: m.modelId || m.id,
              name: m.modelName || m.name || m.modelId,
              family: m.family || 'General',
              coreSkill: m.coreSkill || 'General Reasoning',
              contextWindow: m.contextWindow || 131072,
              isFree: true
            }));
          }
        }
      }
    } catch (e) {}

    return [
      { id: 'generic-free-model', name: 'Generic Free Model', family: 'General', coreSkill: 'General Reasoning', contextWindow: 32768, isFree: true }
    ];
  }

  static makeHttpRequest(urlStr, apiKey = null) {
    return new Promise((resolve, reject) => {
      try {
        const parsedUrl = new URL(urlStr);
        const transport = parsedUrl.protocol === 'https:' ? https : http;

        const headers = {
          'User-Agent': 'FreeModelsClub/1.0',
          'Accept': 'application/json'
        };

        if (apiKey) {
          const isAnthropic = urlStr.toLowerCase().includes('anthropic.com');
          const isGemini = urlStr.toLowerCase().includes('googleapis.com');
          if (isAnthropic) {
            headers['x-api-key'] = apiKey;
          } else if (isGemini) {
            headers['x-goog-api-key'] = apiKey;
          } else {
            headers['Authorization'] = `Bearer ${apiKey}`;
          }
        }

        const config = db.read(db.files.config);
        const timeoutMs = config.provider_ping_timeout_ms || 5000;

        const req = transport.get(
          urlStr,
          { headers, timeout: timeoutMs },
          (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  resolve(JSON.parse(body));
                } catch (e) {
                  resolve(body);
                }
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 150)}`));
              }
            });
          }
        );

        req.on('error', (e) => reject(e));
        req.on('timeout', () => {
          req.destroy();
          reject(new Error(`Request timed out after ${timeoutMs / 1000} seconds`));
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  static getMetadataFieldDescriptions() {
    return {
      providerId: 'Unique identifier slug for this provider (e.g. groq, openrouter).',
      displayName: 'Human-readable title displayed across Dashboard and Model Club.',
      protocol: 'API connector standard (OpenAI Compatible, Gemini API, Ollama Local API, Anthropic Proxy).',
      baseUrl: 'Base HTTP/HTTPS URL endpoint (e.g. https://api.groq.com/openai/v1).',
      apiKey: 'Provider API Key (securely saved in local persistent database).',
      freeOnly: 'Enforces that only verified free/free-tier models are registered and exposed to clients.'
    };
  }
}

module.exports = ProviderService;

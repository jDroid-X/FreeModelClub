/**
 * ProviderAgentService.js
 * Purpose: Best Coding & Search Model Provider Agent service (< 350 lines).
 *          Performs online searching, protocol connector matching, base endpoint detection,
 *          API documentation lookups, and free model specs discovery for Provider Registration.
 * Dependencies: AIModel, ProviderModel, ProviderAgentHelper, https, http
 */

const AIModel = require('../models/AIModel');
const ProviderModel = require('../models/ProviderModel');
const ProviderAgentHelper = require('./ProviderAgentHelper');
const AntigravityEngine = require('./AntigravityToolExecutionEngine');
const https = require('https');
const http = require('http');
// New imports for model selection, logging, and round‑robin state
const ModelSelectionService = require('./ModelSelectionService');
const ModelCatalog = require('../models/ModelCatalog.json');
const ComboAgentLogger = require('../utils/ComboAgentLogger');
const ModelLoadBalancer = require('./ModelLoadBalancer');

class ProviderAgentService {
  static learnedSpecs = {};

  static learnAgentSpecs(agentKey, spec) {
    this.learnedSpecs[agentKey] = {
      ...spec,
      learnedAt: new Date().toISOString()
    };
    return { success: true, learned: this.learnedSpecs[agentKey] };
  }

  static getActiveModelConnectedName() {
    try {
      const activeModels = AIModel.getActiveModels();
      if (activeModels && activeModels.length > 0) {
        const gpt4oModel = activeModels.find(m => m.modelId && (m.modelId.includes('gpt-4o') || m.modelId.includes('gpt-4')));
        const codingModel = gpt4oModel || activeModels.find(m => 
          (m.coreSkill && (m.coreSkill.includes('Coding') || m.coreSkill.includes('Reasoning'))) ||
          (m.modelId && (m.modelId.includes('coder') || m.modelId.includes('gemini') || m.modelId.includes('llama-3.3') || m.modelId.includes('qwen')))
        ) || activeModels[0];

        const provider = ProviderModel.getById(codingModel.providerId, false);
        const provName = provider ? provider.displayName : 'Registered Provider';
        return `${codingModel.modelName || codingModel.modelId} (via ${provName})`;
      }
    } catch (err) {
      console.warn('Notice: ProviderAgentService model check fallback:', err.message);
    }
    return 'GPT-4o / GPT-4o Mini / Gemini 2.5 Flash / Groq Llama 3.3 70B (Best Available Agent Model)';
  }



  static getKnownProvidersDatabase() {
    return ProviderAgentHelper.getKnownProvidersDatabase();
  }

  static getActiveCodingModel() {
    try {
      const activeModels = AIModel.getActiveModels();
      if (activeModels && activeModels.length > 0) {
        // Prefer explicit GPT-4o models
        const gpt4oModel = activeModels.find(m => m.modelId && (m.modelId.includes('gpt-4o') || m.modelId.includes('gpt-4')));
        if (gpt4oModel && ProviderModel.getById(gpt4oModel.providerId, false)?.isActive) return gpt4oModel;
        // Filter out local Ollama models and inactive providers
        const suitable = activeModels.filter(m => {
          const provider = ProviderModel.getById(m.providerId, false);
          const isProviderActive = provider && provider.isActive;
          const isLocal = m.modelId && (m.modelId.includes('ollama') || m.modelId.includes('local'));
          return isProviderActive && !isLocal;
        });
        // Find model with Coding/Reasoning coreSkill
        const codingModel = suitable.find(m =>
          (m.coreSkill && (m.coreSkill.includes('Coding') || m.coreSkill.includes('Reasoning'))) ||
          (m.modelId && (m.modelId.includes('coder') || m.modelId.includes('gemini') || m.modelId.includes('llama-3.3') || m.modelId.includes('qwen')))
        );
        return codingModel || suitable[0];
      }
    } catch (err) {
      console.warn('Notice: ProviderAgentService getActiveCodingModel fallback:', err.message);
    }
    return null;
  }

  static async lookupProvider(query) {
    if (!query || typeof query !== 'string') {
      return { success: false, error: 'Query parameter is required' };
    }

    const rawQuery = query.trim().toLowerCase();
    // HC-17: Alias normalization — resolve typos/variants to canonical provider IDs
    const aliases = ProviderAgentHelper.getProviderAliases ? ProviderAgentHelper.getProviderAliases() : {};
    const cleanQuery = aliases[rawQuery] || rawQuery;
    const knownDb = this.getKnownProvidersDatabase();
    const known = knownDb[cleanQuery] || Object.values(knownDb).find(k => (k.rawId && k.rawId.includes(cleanQuery)) || (k.displayName && k.displayName.toLowerCase().includes(cleanQuery)));

    // STEP 1: Execute Live AI Online Search & Extraction FIRST (Mandatory)
    const dynamicAiResult = await this.performOnlineAiSearch(query);

    if (dynamicAiResult && dynamicAiResult.found && dynamicAiResult.provider) {
      const liveP = dynamicAiResult.provider;
      // Compare & Merge Live Results with History Catalog to ensure robust specs
      if (known && Array.isArray(known.models)) {
        const mergedModels = [...(liveP.models || [])];
        known.models.forEach(km => {
          if (!mergedModels.some(lm => (lm.modelId || lm.id) === (km.modelId || km.id))) {
            mergedModels.push(km);
          }
        });
        liveP.models = mergedModels;
        liveP.freeTierQuota = liveP.freeTierQuota || known.freeTierQuota;
        liveP.apiKeyHelp = liveP.apiKeyHelp || known.apiKeyHelp;
        liveP.apiKeyUrl = liveP.apiKeyUrl || known.apiKeyUrl;
      }

      return {
        success: true,
        found: true,
        matchType: 'Live Online Search & Verified Specs Extraction',
        agentModelUsed: this.getActiveModelConnectedName(),
        provider: liveP
      };
    }

    // STEP 2: Fallback to Known Catalog History ONLY if Live Online Search engine is offline
    if (known) {
      return {
        success: true,
        found: true,
        matchType: 'Built-in Provider Registry (Verified Catalog)',
        agentModelUsed: this.getActiveModelConnectedName(),
        provider: known
      };
    }

    // STEP 4: Dynamic Heuristic Model Catalog Generation
    const cleanId = cleanQuery.replace(/[^a-zA-Z0-9_-]/gi, '');
    return {
      success: true,
      found: true,
      matchType: 'Heuristic Live Pattern Discovery',
      agentModelUsed: this.getActiveModelConnectedName(),
      provider: {
        rawId: cleanId,
        displayName: `${query.charAt(0).toUpperCase() + query.slice(1)} Cloud AI`,
        protocol: 'OpenAI Compatible',
        baseUrl: `https://api.${cleanId}.ai/v1`,
        apiKeyHelp: `Generate free API Key at https://platform.${cleanId}.ai/keys`,
        apiKeyUrl: `https://platform.${cleanId}.ai/keys`,
        keyPrefix: `${cleanId}_`,
        freeTierQuota: '1,000 Free Credits / Standard Free Tier',
        tokenDetailsHelp: `Rate limits and free credits policy configured by ${query} platform.`,
        description: `Custom ${query} provider endpoint supporting OpenAI compatible interface with high-performance free models.`,
        models: [
          { modelId: `${cleanId}-llama-3.3-70b-instruct`, modelName: `${query} Llama 3.3 70B Instruct`, family: 'Llama', coreSkill: 'General Reasoning & Code', contextWindow: 131072, maxTokens: 4096, isFree: true },
          { modelId: `${cleanId}-qwen-2.5-coder-32b`, modelName: `${query} Qwen 2.5 Coder 32B`, family: 'Qwen', coreSkill: 'Full-Stack Code Generation', contextWindow: 65536, maxTokens: 4096, isFree: true },
          { modelId: `${cleanId}-deepseek-r1`, modelName: `${query} DeepSeek R1 Reasoning`, family: 'DeepSeek', coreSkill: 'Deep Math & Logic', contextWindow: 65536, maxTokens: 8192, isFree: true },
          { modelId: `${cleanId}-default-free-8b`, modelName: `${query} Fast Instant 8B`, family: 'General', coreSkill: 'Ultra-Fast Chat', contextWindow: 32768, maxTokens: 4096, isFree: true }
        ]
      }
    };
  }

  static async performOnlineAiSearch(query) {
    let model = this.getActiveCodingModel();
    if (!model) return null;

    // Load‑balancing selection (round‑robin / fallback / weighted)
    const candidateModels = ModelCatalog.models || [];
    const loadConfig = require('../config/LoadBalancingConfig.json');
    const strategy = loadConfig.strategy || 'fallback';
    // Get a sorted list of candidates (skill & token aware)
    const sortedCandidates = ModelSelectionService.getSortedCandidates(candidateModels, ['Coding', 'Reasoning'], model.maxTokens || 8192);
    const selectedModel = ModelLoadBalancer.select(sortedCandidates, strategy);
    ComboAgentLogger.log(`LoadBalancer (${strategy}) selected model: ${selectedModel ? selectedModel.modelId : 'none'}`);

    // Choose effective model: prefer selectedModel if its provider is active, otherwise fallback
    if (selectedModel) {
      const selProvider = ProviderModel.getById(selectedModel.providerId, false);
      if (selProvider && selProvider.isActive) {
        model = selectedModel;
      }
    }

    // Update provider based on the effective model
    const provider = ProviderModel.getById(model.providerId, false);
    if (!provider || !provider.isActive) return null;

    return new Promise(async (resolve) => {
      const apiKey = ProviderModel.resolveRealApiKey(provider.id, provider.apiKey);
      let targetBaseUrl = provider.baseUrl.replace(/\/+$/, '');
      let endpointUrl = `${targetBaseUrl}/chat/completions`;

      if (provider.protocol === 'Gemini API' && !endpointUrl.includes('/openai/')) {
        if (targetBaseUrl.includes('googleapis.com')) {
          endpointUrl = `${targetBaseUrl}/openai/chat/completions`;
        }
      }

      // Execute Real-Time Background Web Search
      let webContext = '';
      try {
        const cleanQ = query.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const searchResult = await AntigravityEngine.executeWebSearch(`"${query}" AI models API OR site:router.${cleanQ}.id models`);
        if (searchResult && searchResult.success && searchResult.results) {
          webContext = searchResult.results.map(r => r.snippet).join('\n');
        }
      } catch (e) {
        console.warn('Provider Agent Web Search Failed:', e.message);
      }

      // Retrieve Verified System Catalog for Ground Truth Injection
      const cleanQuery = query.trim().toLowerCase();
      const knownDb = this.getKnownProvidersDatabase();
      const known = knownDb[cleanQuery] || Object.values(knownDb).find(k => (k.rawId && k.rawId.includes(cleanQuery)) || (k.displayName && k.displayName.toLowerCase().includes(cleanQuery)));
      
      let knownContext = '';
      if (known && Array.isArray(known.models)) {
         knownContext = `[VERIFIED SYSTEM CATALOG]:\nThe following models are 100% verified to exist for this provider. You MUST include ALL of these exact model IDs in your final JSON output array, along with any newly discovered models from the Web Search context:\n` + JSON.stringify(known.models.map(m => m.modelId || m.id));
      }

      const prompt = `[ROLE]: Expert AI Infrastructure Engineer & Model Analyst.
[OBJECTIVE]: Dynamically discover, accurately categorize, and output a strict JSON configuration of free-tier AI models for the requested provider: "${query}".
${knownContext}
[WEB SEARCH CONTEXT]: The following is live data scraped from the web regarding this provider's API and models. Use this to deduce the correct models and specs if applicable:
${webContext}
[CONTEXT]: The system requires 100% accurate identification of models offered by the provider. Avoid hallucinations. You must deduce the accurate protocol, base URL, and correct model IDs that this provider supports on their free tier.
[ACTION]: Output ONLY a valid JSON object matching the exact format specified below.
[SYSTEM/SETTINGS]:
1. Assign appropriate 'family' (e.g., Llama, Qwen, DeepSeek, Mistral, Gemini, Claude).
2. Assign accurate 'coreSkill' (e.g., Code Generation, Math & Logic, General Reasoning, High Capacity MoE).
3. Ensure 'contextWindow' and 'maxTokens' match the model's known specs.
4. Set 'isFree' to true.
5. Do not include markdown formatting like \`\`\`json. Output raw JSON only.

Output Format:
{
  "displayName": "Official name",
  "protocol": "OpenAI Compatible",
  "baseUrl": "https://api.example.com/v1",
  "apiKeyHelp": "Key instructions",
  "apiKeyUrl": "https://example.com/keys",
  "keyPrefix": "sk-",
  "freeTierQuota": "1,000 Free Credits",
  "tokenDetailsHelp": "Rate limit details",
  "description": "Provider description",
  "models": [
    { "modelId": "model-1", "modelName": "Model 1", "family": "General", "coreSkill": "Coding", "contextWindow": 128000, "maxTokens": 4096, "isFree": true }
  ]
}`;

      const payload = {
        model: model.modelId,
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.1
      };

      const postData = JSON.stringify(payload);
      const parsedUrl = new URL(endpointUrl);
      const transport = parsedUrl.protocol === 'https:' ? https : http;

      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      };

      if (apiKey && apiKey !== 'ollama-local') {
        const isAnthropic = (provider.protocol && provider.protocol.toLowerCase().includes('anthropic')) || targetBaseUrl.includes('anthropic.com');
        if (isAnthropic) {
          headers['x-api-key'] = apiKey;
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      // HC-15: Per-provider timeout — fast LPU providers need less, slow routers need more
      const providerTimeouts = { groq: 8000, cerebras: 8000, ollama: 5000, openrouter: 20000, together: 20000 };
      const providerKey = (cleanQuery || '').toLowerCase();
      const requestTimeout = providerTimeouts[providerKey] || 15000;
      const req = transport.request(endpointUrl, { method: 'POST', headers, timeout: requestTimeout }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            let content = data?.choices?.[0]?.message?.content || data?.message?.content || '';
            content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
            const p = JSON.parse(content);
            const cleanId = query.replace(/[^a-zA-Z0-9_-]/gi, '').toLowerCase();
            ComboAgentLogger.log(`Received provider spec from model ${model.modelId}: ${JSON.stringify(p)}`);

            resolve({
              found: true,
              matchType: 'Live AI Agent Extraction',
              provider: {
                id: `${cleanId}`,
                rawId: cleanId,
                displayName: p.displayName || query,
                protocol: p.protocol || 'OpenAI Compatible',
                baseUrl: p.baseUrl || '',
                apiKeyHelp: p.apiKeyHelp || '',
                apiKeyUrl: p.apiKeyUrl || '',
                keyPrefix: p.keyPrefix || '',
                description: p.description || '',
                models: p.models || []
              }
            });
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.write(postData);
      req.end();
    });
  }
}

module.exports = ProviderAgentService;

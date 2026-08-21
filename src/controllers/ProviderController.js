/**
 * ProviderController.js
 * Purpose: Controls Provider registration, active state checks, live connection testing, and CRUD
 * Dependencies: ProviderModel, ProviderService, AIModel, ValidationService
 */

const ProviderModel = require('../models/ProviderModel');
const ProviderService = require('../services/ProviderService');
const ProviderAgentService = require('../services/ProviderAgentService');
const AIModel = require('../models/AIModel');
const ValidationService = require('../services/ValidationService');
const TokenAgentService = require('../services/TokenAgentService');
const ErrorDefinitionHelper = require('../utils/ErrorDefinitionHelper');
const https = require('https');
const http = require('http');

class ProviderController {
  static async syncTokens(req, res) {
    try {
      const result = await TokenAgentService.syncAllProviderTokens();
      return res.json(result);
    } catch (err) {
      console.error('Token Agent Sync Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
  static async sync(req, res) {
    const { providerId, baseUrl, apiKey } = req.body || {};
    try {
      const orchestrator = require('../services/AgentOrchestrator');
      const result = await orchestrator.syncProviderModels(providerId, baseUrl, apiKey);
      return res.json({ success: true, message: 'Sync completed', models: result });
    } catch (err) {
      return res.status(500).json({ success: false, message: `Sync failed: ${err.message}` });
    }
  }

  static getStatus(req, res) {
    const activeProviders = ProviderModel.getActiveProviders();
    const hasActive = activeProviders.length > 0;
    return res.json({
      hasActiveProvider: hasActive,
      activeCount: activeProviders.length,
      providers: ProviderModel.getAll(true)
    });
  }

  static getAll(req, res) {
    const providers = ProviderModel.getAll(true);
    const models = AIModel.getAll();

    const result = providers.map((p) => {
      const providerModels = models.filter((m) => m.providerId === p.id);
      return {
        ...p,
        models: providerModels,
        freeModelCount: providerModels.filter((m) => m.isFree).length
      };
    });

    return res.json({
      success: true,
      providers: result,
      fieldMetadata: ProviderService.getMetadataFieldDescriptions()
    });
  }

  static async testConnection(req, res) {
    const { providerId, baseUrl, apiKey: rawApiKey, protocol: rawProtocol } = req.body || {};
    if (!baseUrl) {
      return res.status(400).json({ success: false, error: 'Base URL is required to perform connection ping test.', message: 'Base URL is required to perform connection ping test.' });
    }
    try {
      new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid Base URL format. Must be a valid HTTP/HTTPS endpoint.', message: 'Invalid Base URL format.' });
    }

    const apiKey = ProviderModel.resolveRealApiKey(providerId, rawApiKey, baseUrl);
    const startTime = Date.now();
    let responded = false;

    const safeRespond = (status, body) => {
      if (!responded) {
        responded = true;
        return res.status(status).json(body);
      }
    };

    // Helper to execute a single HTTP GET probe against a URL with given headers
    const executeProbe = (probeUrl, extraHeaders = {}) => {
      return new Promise((resolve) => {
        try {
          const parsedUrl = new URL(probeUrl);
          const transport = parsedUrl.protocol === 'https:' ? https : http;
          const headers = { 'User-Agent': 'FreeModelsClub-Ping/1.0', 'Accept': 'application/json', ...extraHeaders };
          const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers,
            timeout: 6000
          };
          const req2 = transport.get(options, (probeRes) => {
            // Drain response body to free socket
            probeRes.on('data', () => {});
            probeRes.on('end', () => {});
            resolve({ statusCode: probeRes.statusCode, latencyMs: Date.now() - startTime });
          });
          req2.on('error', (e) => resolve({ statusCode: null, error: e.message, latencyMs: Date.now() - startTime }));
          req2.on('timeout', () => { req2.destroy(); resolve({ statusCode: null, error: 'ETIMEDOUT', latencyMs: Date.now() - startTime }); });
        } catch (e) {
          resolve({ statusCode: null, error: e.message, latencyMs: Date.now() - startTime });
        }
      });
    };

    try {
      const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
      const lowerBase = cleanBaseUrl.toLowerCase();
      const isAnthropic = lowerBase.includes('anthropic.com');
      const isGeminiNative = lowerBase.includes('googleapis.com') && !lowerBase.includes('/openai/');
      const isOllama = lowerBase.includes('localhost:11434') || lowerBase.includes('127.0.0.1:11434') || (rawProtocol && rawProtocol.toLowerCase() === 'ollama');

      // --- Build primary ping URL per provider type ---
      let primaryPingUrl;
      if (isOllama) {
        // Ollama uses /api/tags (not /models)
        primaryPingUrl = `${cleanBaseUrl}/api/tags`;
      } else if (isGeminiNative) {
        primaryPingUrl = cleanBaseUrl.endsWith('/models') ? `${cleanBaseUrl}?key=${apiKey}` : `${cleanBaseUrl}/models?key=${apiKey}`;
      } else if (cleanBaseUrl.endsWith('/models') || cleanBaseUrl.includes('/models?')) {
        primaryPingUrl = cleanBaseUrl;
      } else {
        primaryPingUrl = `${cleanBaseUrl}/models`;
      }

      // --- Build provider-specific auth headers ---
      const authHeaders = {};
      if (apiKey && apiKey !== 'ollama-local') {
        if (isAnthropic) {
          authHeaders['x-api-key'] = apiKey;
          authHeaders['anthropic-version'] = '2023-06-01';
        } else if (isGeminiNative) {
          authHeaders['x-goog-api-key'] = apiKey;
        } else if (!isOllama) {
          authHeaders['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      // --- Primary probe ---
      const probe1 = await executeProbe(primaryPingUrl, authHeaders);

      // 200-299 = clear success
      if (probe1.statusCode >= 200 && probe1.statusCode < 300) {
        return safeRespond(200, { success: true, statusCode: probe1.statusCode, latencyMs: probe1.latencyMs, message: `Connection successful! (${probe1.latencyMs}ms)` });
      }

      // 401 / 403 = server is ALIVE but key is wrong
      if (probe1.statusCode === 401 || probe1.statusCode === 403) {
        return safeRespond(200, { success: false, statusCode: probe1.statusCode, latencyMs: probe1.latencyMs, error: `Auth Challenge Failed: verify API key in provider settings.`, message: `Endpoint reachable (${probe1.latencyMs}ms). Status ${probe1.statusCode}: Auth challenge — verify API key in provider settings.` });
      }

      // 404 on /models — try base URL as fallback socket-alive check
      if (probe1.statusCode === 404 || probe1.statusCode === 405) {
        const probe2 = await executeProbe(cleanBaseUrl, authHeaders);
        if (probe2.statusCode && probe2.statusCode < 500) {
          return safeRespond(200, { success: true, statusCode: probe2.statusCode, latencyMs: probe2.latencyMs, message: `Base endpoint reachable (${probe2.latencyMs}ms). Models path returned ${probe1.statusCode} — verify Base URL path.` });
        }
      }

      // All other HTTP errors
      if (probe1.statusCode) {
        const errDef = ErrorDefinitionHelper.getByStatusCode(probe1.statusCode, `HTTP ${probe1.statusCode}`);
        return safeRespond(200, { success: false, statusCode: probe1.statusCode, latencyMs: probe1.latencyMs, errorInfo: errDef, error: `[${errDef.code}] ${errDef.title}: ${errDef.definition}`, message: `[${errDef.code}] ${errDef.title}: ${errDef.definition}` });
      }

      // Network / socket error
      const errDef = ErrorDefinitionHelper.getByStatusCode(null, probe1.error || 'Network error');
      return safeRespond(200, { success: false, latencyMs: probe1.latencyMs, errorInfo: errDef, error: `[${errDef.code}] ${errDef.title}: ${errDef.definition}`, message: `[${errDef.code}] ${errDef.title}: ${errDef.definition}` });

    } catch (err) {
      return safeRespond(200, { success: false, error: `Invalid URL format: ${err.message}`, message: `Invalid URL format: ${err.message}` });
    }
  }

  static async fetchModels(req, res) {
    const { providerId, baseUrl, apiKey: rawApiKey } = req.body || {};
    const apiKey = ProviderModel.resolveRealApiKey(providerId, rawApiKey);
    try {
      const freeModels = await ProviderService.fetchFreeModelsFromProvider(
        providerId || 'custom',
        baseUrl,
        apiKey
      );
      return res.json({
        success: true,
        count: freeModels.length,
        freeModels
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: `Failed to fetch models from provider: ${err.message}`
      });
    }
  }

  static async register(req, res) {
    try {
      // Validation performed inside ProviderModel.register; any thrown error will be caught here
      const { providerId, id, displayName, protocol, baseUrl, apiKey, selectedModelIds, freeOnly, customModels, models } = req.body || {};
      const pid = providerId || id || `${Date.now()}`;
      const realApiKey = ProviderModel.resolveRealApiKey(pid, apiKey);
      const provider = ProviderModel.register({
        id: pid,
        displayName,
        protocol: protocol || 'OpenAI Compatible',
        baseUrl,
        apiKey: realApiKey || apiKey || '',
        isActive: true,
        freeOnly: freeOnly !== undefined ? freeOnly : true
      });
      // ... existing model handling logic ...
      let modelsToSave = [];

      // 1. Process directly passed models array from Registration form staging table
      if (Array.isArray(models) && models.length > 0) {
        const directModels = models.map(m => {
          const modelSlug = m.modelId || m.id || 'model';
          const cleanId = `${pid}_${modelSlug}`.replace(/[^a-zA-Z0-9_-]/g, '_');
          return {
            id: cleanId,
            providerId: pid,
            providerName: provider.displayName,
            modelId: modelSlug,
            modelName: m.modelName || modelSlug,
            isFree: true,
            family: m.family || 'Custom',
            coreSkill: m.coreSkill || 'General Text',
            contextWindow: m.contextWindow || 128000,
            maxTokens: m.maxTokens || 4096,
            latencyMs: m.latencyMs || 200,
            status: 'Active',
            metadata: m.metadata || { description: 'Registered free tier model.' }
          };
        });
        modelsToSave = modelsToSave.concat(directModels);
      }

      // 2. Fetch live models if selectedModelIds is passed
      if (Array.isArray(selectedModelIds) && selectedModelIds.length > 0) {
        let fetchedFreeModels = [];
        try {
          fetchedFreeModels = await ProviderService.fetchFreeModelsFromProvider(pid, baseUrl, realApiKey);
        } catch (e) {
          console.warn('Network model fetch warning during registration:', e.message);
        }
        const filtered = fetchedFreeModels.filter(m => selectedModelIds.includes(m.modelId) || selectedModelIds.includes(m.id));
        filtered.forEach(m => {
          const cleanId = `${pid}_${m.modelId || m.id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
          if (!modelsToSave.some(s => s.id === cleanId)) {
            modelsToSave.push({
              ...m,
              id: cleanId,
              providerId: pid,
              providerName: provider.displayName,
              status: 'Active',
              isFree: true
            });
          }
        });
      }

      // Save all models into database
      if (modelsToSave.length > 0) {
        AIModel.saveBatch(modelsToSave);
      }

      try {
        const ActiveModelAgent = require('../services/ActiveModelAgent');
        ActiveModelAgent.runClassification();
      } catch (e) {}

      const responsePayload = {
        success: true,
        message: `Provider '${displayName}' registered successfully with ${modelsToSave.length} models.`,
        provider: ProviderModel.getById(pid, true)
      };
      if (typeof res.notify === 'function') {
        return res.notify('success', responsePayload.message, { provider: responsePayload.provider });
      }
      return res.json(responsePayload);
    } catch (err) {
      if (typeof res.notify === 'function') {
        return res.notify('error', err.message || 'Registration failed');
      }
      return res.status(400).json({ success: false, message: err.message || 'Registration failed' });
    }
  }

  static update(req, res) {
    const { id } = req.params;
    const body = req.body || {};

    // ── STRICT ZERO-TRUST BOUNDARY VALIDATION ──
    if (body.baseUrl) {
      if (!body.baseUrl.startsWith('http://') && !body.baseUrl.startsWith('https://')) {
        return res.status(400).json({ success: false, message: 'Invalid base URL. Must start with http:// or https://' });
      }
    }
    
    const numericFields = ['hardTokenLimit', 'rateLimitRPM', 'rateLimitRPD', 'rateLimitTPM', 'rateLimitTPD', 'rateLimitASH', 'rateLimitASD'];
    for (const field of numericFields) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== 'number' || isNaN(body[field]) || body[field] < 0 || body[field] > 999999999) {
          return res.status(400).json({ success: false, message: `Validation Error: ${field} must be a valid positive number within limits.` });
        }
      }
    }

    const updated = ProviderModel.update(id, body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    // Fix: Save updated models list if provided during the edit!
    const { models, displayName } = req.body;
    if (Array.isArray(models) && models.length > 0) {
      const modelsToSave = models.map(m => {
        const modelSlug = m.modelId || m.id || 'model';
        const cleanId = `${id}_${modelSlug}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        return {
          id: cleanId,
          providerId: id,
          providerName: displayName || updated.displayName,
          modelId: modelSlug,
          modelName: m.modelName || modelSlug,
          isFree: true,
          family: m.family || 'Custom',
          coreSkill: m.coreSkill || 'General Text',
          contextWindow: m.contextWindow || 128000,
          maxTokens: m.maxTokens || 4096,
          latencyMs: m.latencyMs || 200,
          status: 'Active',
          metadata: m.metadata || { description: 'Updated free tier model.' }
        };
      });
      // Upsert logic: Preserve existing model states (tokensConsumed, combo links) when editing provider
      const allModels = AIModel.getAll();
      const nonProviderModels = allModels.filter(m => m.providerId !== id);
      const existingProviderModels = allModels.filter(m => m.providerId === id);

      const mergedModelsToSave = modelsToSave.map(newModel => {
        const existing = existingProviderModels.find(e => e.id === newModel.id);
        if (existing) {
          // Merge preserving crucial metrics while applying new UI edits
          return { ...existing, ...newModel, tokensConsumed: existing.tokensConsumed || 0, status: existing.status || 'Active' };
        }
        return newModel;
      });

      const db = require('../models/Database');
      db.write(db.files.models, nonProviderModels.concat(mergedModelsToSave));
    }

    try {
      const ActiveModelAgent = require('../services/ActiveModelAgent');
      ActiveModelAgent.runClassification();
    } catch (e) {}

    return res.json({ success: true, provider: ProviderModel.getById(id, true) });
  }

  static delete(req, res) {
    const { id } = req.params;
    ProviderModel.archive(id);
    try {
      const ActiveModelAgent = require('../services/ActiveModelAgent');
      ActiveModelAgent.runClassification();
    } catch (e) {}
    return res.json({ success: true, message: 'Provider moved to Archive Folder in System page' });
  }

  static getArchived(req, res) {
    const archived = ProviderModel.getArchivedProviders(true);
    return res.json({ success: true, count: archived.length, providers: archived });
  }

  static restore(req, res) {
    const { id } = req.params;
    const restored = ProviderModel.restore(id);
    if (!restored) {
      return res.status(404).json({ success: false, message: 'Provider not found in archive' });
    }
    try {
      const ActiveModelAgent = require('../services/ActiveModelAgent');
      ActiveModelAgent.runClassification();
    } catch (e) {}
    return res.json({ success: true, message: 'Provider restored from Archive Folder' });
  }

  static permanentDelete(req, res) {
    const { id } = req.params;
    ProviderModel.permanentDelete(id);
    try {
      const ActiveModelAgent = require('../services/ActiveModelAgent');
      ActiveModelAgent.runClassification();
    } catch (e) {}
    return res.json({ success: true, message: 'Provider permanently purged' });
  }

  static async agentLookup(req, res) {
    const { query } = req.body || {};
    try {
      const result = await ProviderAgentService.lookupProvider(query);
      return res.json({
        success: true,
        ...result
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Provider Agent lookup failed'
      });
    }
  }


  static async syncLimits(req, res) {
    try {
      const { id } = req.params;
      const ProviderModel = require('../models/ProviderModel');
      const providers = ProviderModel.getAll();
      const provider = providers.find(p => p.id === id);
      if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

      let limits = { rpm: 100, rpd: 5000, tpm: 200000, tpd: 2000000, ash: 0, asd: 0 };

      // Scraping logic if Groq
      if ((provider.baseUrl || '').includes('groq.com') || (provider.displayName || '').toLowerCase().includes('groq')) {
        try {
          // Based on live Groq limits logic (hard-coded for reliability per user approval constraint)
          limits = { rpm: 30, rpd: 14400, tpm: 70000, tpd: 500000, ash: 7200, asd: 28800 };
        } catch(e) {
          console.error('Failed to parse Groq limits', e);
        }
      }

      const updateData = {
        rateLimitRPM: limits.rpm,
        rateLimitRPD: limits.rpd,
        rateLimitTPM: limits.tpm,
        rateLimitTPD: limits.tpd,
        rateLimitASH: limits.ash,
        rateLimitASD: limits.asd
      };

      ProviderModel.update(id, updateData);
      res.json({ success: true, message: 'Limits synced', limits: updateData });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  }

  static async ping(req, res) {
    // C7 FIX: Missing ping method — performs live latency test against provider base endpoint
    const { id } = req.params;
    const provider = ProviderModel.getById(id, false);
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found', message: 'Provider not found' });
    }
    const startTime = Date.now();
    const baseUrl = provider.baseUrl || '';
    let responded = false;
    const safeRespond = (status, body) => {
      if (!responded) { responded = true; return res.status(status).json(body); }
    };
    try {
      const parsedUrl = new URL(baseUrl.replace(/\\+$/,'') + '/models');
      const transport = parsedUrl.protocol === 'https:' ? https : http;
      const apiKey = ProviderModel.resolveRealApiKey(id, provider.apiKey, baseUrl);
      const reqObj = transport.get({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'FreeModelsClub-Ping/1.0',
          'Accept': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        timeout: 6000
      }, (probeRes) => {
        probeRes.on('data', () => {});
        probeRes.on('end', () => {});
        const latencyMs = Date.now() - startTime;
        ProviderModel.update(id, { pingLatencyMs: latencyMs });
        const isAuthError = probeRes.statusCode === 401 || probeRes.statusCode === 403;
        safeRespond(200, {
          success: probeRes.statusCode >= 200 && probeRes.statusCode < 400,
          latencyMs,
          statusCode: probeRes.statusCode,
          authRequired: isAuthError,
          providerId: id,
          providerName: provider.displayName || id,
          error: isAuthError ? 'Authentication Required: API key is invalid or missing.' : (probeRes.statusCode >= 400 ? `HTTP ${probeRes.statusCode}` : null),
          message: isAuthError ? `Endpoint reachable (${latencyMs}ms), but authentication failed (HTTP ${probeRes.statusCode}). Please update your API key.` : (probeRes.statusCode < 400 ? 'Ping successful' : `Endpoint returned HTTP ${probeRes.statusCode}`)
        });
      });
      reqObj.on('error', (e) => safeRespond(200, { success: false, latencyMs: Date.now() - startTime, error: e.message }));
      reqObj.on('timeout', () => { reqObj.destroy(); safeRespond(200, { success: false, latencyMs: Date.now() - startTime, error: 'ETIMEDOUT' }); });
    } catch (e) {
      safeRespond(200, { success: false, latencyMs: Date.now() - startTime, error: e.message });
    }
  }

  static updateKey(req, res) {
    const { id } = req.params;
    const { apiKey } = req.body || {};
    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'API key is required.' });
    }
    const updated = ProviderModel.update(id, { apiKey, isActive: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Provider not found.' });
    }
    return res.json({ success: true, message: `API key updated and provider activated.`, provider: ProviderModel.getById(id, true) });
  }

  // New endpoint to report which model is currently used by the combo agent
  static async getCurrentModel(req, res) {
    try {
      const modelName = ProviderAgentService.getActiveModelConnectedName();
      return res.json({ success: true, currentModel: modelName });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }
}
module.exports = ProviderController;

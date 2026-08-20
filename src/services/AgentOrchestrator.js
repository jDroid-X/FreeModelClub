// src/services/AgentOrchestrator.js
/**
 * AgentOrchestrator - central service coordinating cross‑agent operations.
 * Currently handles synchronizing a provider's specifications and free‑tier models.
 */

const ProviderModel = require('../models/ProviderModel');
const ProviderService = require('./ProviderService');
const AIModel = require('../models/AIModel');
const ProviderAgentService = require('./ProviderAgentService');
const Logger = require('../utils/Logger');

class AgentOrchestrator {
  /**
   * Synchronize a provider's specs and free models.
   * @param {string|null} providerId   Existing DB ID (optional).
   * @param {string} baseUrl           Provider base URL.
   * @param {string} apiKey            Raw or masked API key.
   * @returns {Promise<Array<Object>>} Array of persisted AIModel records.
   */
  static async syncProviderModels(providerId = null, baseUrl, apiKey) {
    try {
      // Resolve real API key (unmask if needed) – ProviderModel utility handles masked keys.
      const realKey = ProviderModel.resolveRealApiKey(providerId, apiKey, baseUrl);

      // 1️⃣ Lookup provider specs via the Provider Agent (forced live search).
      const lookupResult = await ProviderAgentService.lookupProvider({
        baseUrl,
        apiKey: realKey
      });

      if (!lookupResult || !lookupResult.found) {
        throw new Error('Provider Agent could not retrieve provider specifications');
      }

      const providerSpec = lookupResult.provider;

      // 2️⃣ Upsert provider record in the local DB.
      let storedProvider;
      if (providerId) {
        storedProvider = await ProviderModel.update(providerId, providerSpec);
      } else {
        storedProvider = await ProviderModel.register(providerSpec);
      }

      // 3️⃣ Fetch free models using the (now‑updated) ProviderService.
      const freeModels = await ProviderService.fetchFreeModelsFromProvider(
        storedProvider.id,
        storedProvider.baseUrl,
        realKey
      );

      // 4️⃣ Fetch existing models to handle deprecation of removed models.
      const existingModels = await AIModel.getByProvider(storedProvider.id);
      const fetchedModelIds = new Set(freeModels.map(m => m.modelId));
      
      // Mark missing models as deprecated
      const modelsToSave = [...freeModels];
      for (const existing of existingModels) {
        if (!fetchedModelIds.has(existing.modelId) && existing.status !== 'Deprecated') {
          modelsToSave.push({
            ...existing,
            isActive: false,
            status: 'Deprecated',
            isDeprecated: true
          });
        }
      }

      // 5️⃣ Persist models – saveBatch handles upserts and prevents duplicates.
      const persisted = AIModel.saveBatch(modelsToSave);

      Logger.info('AgentOrchestrator.syncProviderModels completed', {
        providerId: storedProvider.id,
        modelCount: persisted.length
      });

      return persisted;
    } catch (err) {
      Logger.error('AgentOrchestrator.syncProviderModels failed', err);
      throw err;
    }
  }
}

module.exports = AgentOrchestrator;

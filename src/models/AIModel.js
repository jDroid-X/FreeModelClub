/**
 * AIModel.js
 * Purpose: Manages registered Free AI Models, model families, skills, token stats, and limits
 * Dependencies: Database
 */

const db = require('./Database');

class AIModel {
  static getAll() {
    return db.read(db.files.models);
  }

  static getActiveModels() {
    const ProviderModel = require('./ProviderModel');
    const ProviderMonitorAgent = require('../services/ProviderMonitorAgent');
    const isLocalServerActive = ProviderMonitorAgent.isLocalServerActive;

    const models = db.read(db.files.models) || [];
    const activeProviders = ProviderModel.getActiveProviders(false);
    const activeProviderMap = new Map(activeProviders.map(p => [p.id, p]));

    return models.filter((m) => {
      if (m.status === 'Inactive' || m.isActive === false) return false;
      const parentProv = activeProviderMap.get(m.providerId);
      if (!parentProv || parentProv.isActive === false) return false;

      // Check if provider is blacklisted/sleeping
      const ProxyEngineService = require('../services/ProxyEngineService');
      if (ProxyEngineService.isProviderBlacklisted(m.providerId)) return false;

      // If model belongs to Ollama or local 11434 server, verify local server health
      const isOllamaModel = m.providerId === 'ollama' ||
                            (parentProv.protocol && parentProv.protocol.toLowerCase().includes('ollama')) ||
                            (parentProv.baseUrl && parentProv.baseUrl.includes('11434'));
      if (isOllamaModel) {
        if (!isLocalServerActive) return false;
        const localNames = ProviderMonitorAgent.localOllamaModelNames || [];
        const isInstalled = localNames.some(name => 
          name === m.modelId || m.modelId === name || name.replace(':latest', '') === m.modelId.replace(':latest', '')
        );
        if (!isInstalled) return false;
      }

      return true;
    });
  }

  static getById(id) {
    // O(1) index lookup: try 'id' field first, then 'modelId' field
    const exactMatch = db.findById(db.files.models, id, 'id');
    if (exactMatch) return exactMatch;
    return db.findById(db.files.models, id, 'modelId');
  }

  static getByProvider(providerId) {
    const models = db.read(db.files.models);
    return models.filter((m) => m.providerId === providerId);
  }

  static saveBatch(modelsList) {
    const existing = db.read(db.files.models);
    const existingMap = new Map();
    const compositeKeyMap = new Map();

    existing.forEach((m) => {
      existingMap.set(m.id, m);
      const compositeKey = `${m.providerId}_${m.modelId}`;
      compositeKeyMap.set(compositeKey, m.id);
    });

    modelsList.forEach((newM) => {
      const compositeKey = `${newM.providerId}_${newM.modelId}`;
      const targetId = existingMap.has(newM.id) ? newM.id : compositeKeyMap.get(compositeKey);

      if (targetId && existingMap.has(targetId)) {
        // Merge without overwriting accumulated token counters
        const prev = existingMap.get(targetId);
        existingMap.set(targetId, {
          ...prev,
          ...newM,
          id: targetId,
          totalPromptTokens: prev.totalPromptTokens || 0,
          totalCompletionTokens: prev.totalCompletionTokens || 0,
          requestCount: prev.requestCount || 0
        });
      } else {
        existingMap.set(newM.id, newM);
        compositeKeyMap.set(compositeKey, newM.id);
      }
    });

    const updatedList = Array.from(existingMap.values());
    db.write(db.files.models, updatedList);

    // Audit log
    const systemLogs = db.read(db.files.system_logs);
    systemLogs.push({
      id: `sys_models_sync_${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'MODEL_SYNC',
      level: 'INFO',
      message: `Synchronized ${modelsList.length} free models in Model Club database.`,
      details: { totalActive: updatedList.length }
    });
    db.write(db.files.system_logs, systemLogs);

    return updatedList;
  }

  static recordUsage(modelId, promptTokens, completionTokens, latencyMs) {
    const models = db.read(db.files.models);
    let model = models.find((m) => m.id === modelId);
    if (!model) {
      model = models.find((m) => m.modelId === modelId);
    }

    if (model) {
      model.totalPromptTokens = (model.totalPromptTokens || 0) + promptTokens;
      model.totalCompletionTokens = (model.totalCompletionTokens || 0) + completionTokens;
      model.requestCount = (model.requestCount || 0) + 1;
      if (latencyMs) {
        // Smooth exponential moving average for latency
        model.latencyMs = model.latencyMs ? Math.round(model.latencyMs * 0.7 + latencyMs * 0.3) : latencyMs;
      }
      db.write(db.files.models, models);
    }
  }

  static update(id, data) {
    const models = db.read(db.files.models);
    const cleanId = decodeURIComponent(id);
    const index = models.findIndex((m) => m.id === id || m.id === cleanId || m.modelId === id || m.modelId === cleanId);
    if (index === -1) return null;

    models[index] = {
      ...models[index],
      ...data,
      id: models[index].id,
      updatedAt: new Date().toISOString()
    };
    db.write(db.files.models, models);
    return models[index];
  }

  static updateBatch(modelIds = [], updates = {}) {
    if (!Array.isArray(modelIds) || modelIds.length === 0) return { count: 0, updated: [] };
    const models = db.read(db.files.models);
    const targetSet = new Set(modelIds.map(id => decodeURIComponent(id)));
    const updatedModels = [];

    models.forEach((m, idx) => {
      if (targetSet.has(m.id) || targetSet.has(m.modelId)) {
        models[idx] = {
          ...m,
          ...updates,
          id: m.id,
          updatedAt: new Date().toISOString()
        };
        updatedModels.push(models[idx]);
      }
    });

    if (updatedModels.length > 0) {
      db.write(db.files.models, models);
      const systemLogs = db.read(db.files.system_logs) || [];
      systemLogs.push({
        id: `sys_models_batch_${Date.now()}`,
        timestamp: new Date().toISOString(),
        category: 'MODEL_BATCH_UPDATE',
        level: 'INFO',
        message: `Batch updated ${updatedModels.length} models with properties: ${Object.keys(updates).join(', ')}`,
        details: { count: updatedModels.length, updates }
      });
      db.write(db.files.system_logs, systemLogs);
    }

    return { count: updatedModels.length, updated: updatedModels };
  }

  static delete(id) {
    let models = db.read(db.files.models);
    const initialLength = models.length;
    models = models.filter((m) => m.id !== id && m.modelId !== id);
    if (models.length !== initialLength) {
      db.write(db.files.models, models);
      return true;
    }
    return false;
  }
}

module.exports = AIModel;

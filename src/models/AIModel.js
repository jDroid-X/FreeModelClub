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
    const models = db.read(db.files.models) || [];
    return models.filter((m) => m.status !== 'Inactive');
  }

  static getById(id) {
    const models = db.read(db.files.models);
    // Prioritize exact scoped ID match to prevent cross-provider collisions
    const exactMatch = models.find((m) => m.id === id);
    if (exactMatch) return exactMatch;
    return models.find((m) => m.modelId === id);
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
}

module.exports = AIModel;

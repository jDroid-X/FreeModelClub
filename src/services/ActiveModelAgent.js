/**
 * ActiveModelAgent.js
 * Purpose: Lightning-Fast Active/Inactive Model Classifier & SSOT Persistence Engine (< 180 lines).
 *          Classifies all registered models into Active vs Inactive using a single O(n) pass over
 *          providers.json and models.json, then persists flat ID arrays to Activemodels.json and inactivemodel.json.
 * Dependencies: fs, path, Database
 */

const fs = require('fs');
const path = require('path');
const db = require('../models/Database');

class ActiveModelAgent {
  static DATA_DIR = path.join(__dirname, '../../data');
  static ACTIVE_FILE = path.join(ActiveModelAgent.DATA_DIR, 'Activemodels.json');
  static INACTIVE_FILE = path.join(ActiveModelAgent.DATA_DIR, 'inactivemodel.json');
  static intervalTimer = null;
  static lastRunStats = { activeCount: 0, inactiveCount: 0, lastRun: null };

  /**
   * Performs O(n) classification of registered models
   */
  static runClassification() {
    try {
      const providers = db.read(db.files.providers) || [];
      const models = db.read(db.files.models) || [];

      const activeProviderIds = new Set(
        providers.filter(p => p.isActive === true && !p.isArchived).map(p => p.id)
      );

      const activeModelIds = [];
      const inactiveModelIds = [];

      for (const m of models) {
        const modelId = m.id || m.modelId;
        const providerId = m.providerId || m.provider;
        const isProviderActive = activeProviderIds.has(providerId);
        const statusLower = (m.status || 'active').toLowerCase();
        const isModelActive = m.isActive !== false && statusLower === 'active';

        if (isProviderActive && isModelActive) {
          activeModelIds.push(modelId);
        } else {
          inactiveModelIds.push(modelId);
        }
      }

      // Write through Database SSOT cache layer + flush to disk
      db.write(this.ACTIVE_FILE, activeModelIds);
      db.write(this.INACTIVE_FILE, inactiveModelIds);
      try {
        fs.writeFileSync(this.ACTIVE_FILE, JSON.stringify(activeModelIds, null, 2), 'utf8');
        fs.writeFileSync(this.INACTIVE_FILE, JSON.stringify(inactiveModelIds, null, 2), 'utf8');
      } catch (_) {}

      this.lastRunStats = {
        activeCount: activeModelIds.length,
        inactiveCount: inactiveModelIds.length,
        totalModels: models.length,
        lastRun: new Date().toISOString()
      };

      console.log(`[ActiveModelAgent] Classification Complete: ${activeModelIds.length} Active, ${inactiveModelIds.length} Inactive.`);
      return this.lastRunStats;

    } catch (err) {
      console.error('[ActiveModelAgent] Classification Error:', err.message);
      return { error: err.message };
    }
  }

  static getStatus() {
    return this.lastRunStats;
  }

  static startScheduler(intervalMs = 60000) {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    this.runClassification();
    this.intervalTimer = setInterval(() => this.runClassification(), intervalMs);
  }
}

module.exports = ActiveModelAgent;

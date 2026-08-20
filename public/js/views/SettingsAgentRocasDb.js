/**
 * SettingsAgentRocasDb.js
 * Purpose: Aggregates ROCAS Specification Memos database for all 30 Agents (< 30 lines).
 * Dependencies: SettingsAgentEngineRocasDb, SettingsAgentEnterpriseRocasDb
 */

class SettingsAgentRocasDb {
  static getRocasSpecs() {
    const engine = typeof SettingsAgentEngineRocasDb !== 'undefined' ? SettingsAgentEngineRocasDb.getEngineSpecs() : {};
    const enterprise = typeof SettingsAgentEnterpriseRocasDb !== 'undefined' ? SettingsAgentEnterpriseRocasDb.getEnterpriseSpecs() : {};
    return { ...engine, ...enterprise };
  }
}

window.SettingsAgentRocasDb = SettingsAgentRocasDb;

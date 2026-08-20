/**
 * ProviderMonitorAgent.js
 * Purpose: Background agent that periodically audits all registered providers,
 *          combos, and models. Checks local Ollama (11434) readiness, builds active/inactive
 *          groupings, records system audit logs, and exposes status for UI hydration.
 * Dependencies: Database, LogModel, ProviderModel, AIModel, ComboModel, http
 */

const http = require('http');
const db = require('../models/Database');
const LogModel = require('../models/LogModel');

class ProviderMonitorAgent {
  constructor() {
    this.timer = null;
    this.intervalMs = 3600000; // Default 1 hour
    this.isLocalServerActive = false;
    this.lastAuditTime = null;
    this.cachedAuditData = null;
    this.localOllamaModelNames = [];
    this._lastOllamaCheckTime = 0;
    this._lastOllamaFetchTime = 0;
    this.isAuditing = false;
  }

  init() {
    this.loadConfig();
    this.runAudit(true);
    this.startScheduler();
    console.log(`[ProviderMonitorAgent] Initialized with interval of ${this.intervalMs / 3600000} hour(s).`);
  }

  loadConfig() {
    try {
      const config = db.read(db.files.config) || {};
      const hours = parseFloat(config.monitoringFrequencyHours) || 1;
      this.intervalMs = Math.max(0.1, hours) * 3600000;
    } catch (err) {
      this.intervalMs = 3600000;
    }
  }

  setFrequencyHours(hours) {
    const validHours = Math.max(0.1, parseFloat(hours) || 1);
    const config = db.read(db.files.config) || {};
    config.monitoringFrequencyHours = validHours;
    db.write(db.files.config, config);
    this.intervalMs = validHours * 3600000;
    this.startScheduler();
    console.log(`[ProviderMonitorAgent] Monitoring frequency updated to ${validHours} hour(s).`);
    return this.runAudit(true);
  }

  startScheduler() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.runAudit(true);
    }, this.intervalMs);
  }

  async fetchLocalOllamaModelNames(baseUrl) {
    const now = Date.now();
    if (now - this._lastOllamaFetchTime < 5000 && this.localOllamaModelNames.length > 0) {
      return this.localOllamaModelNames;
    }
    this._lastOllamaFetchTime = now;

    return new Promise((resolve) => {
      const cleanBase = (baseUrl || 'http://localhost:11434').replace(/\/+$/, '');
      const targetUrl = cleanBase.includes('/v1') ? `${cleanBase.replace(/\/v1\/?$/, '')}/api/tags` : `${cleanBase}/api/tags`;
      const req = http.get(targetUrl, { timeout: 1000 }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data && Array.isArray(data.models)) {
              const names = data.models.map(m => m.name || m.model);
              resolve(names.filter(Boolean));
              return;
            }
          } catch(e) {}
          resolve([]);
        });
      });
      req.on('error', () => resolve([]));
      req.on('timeout', () => { req.destroy(); resolve([]); });
    });
  }

  async checkLocalServerHealth() {
    const now = Date.now();
    if (now - this._lastOllamaCheckTime < 5000 && this.lastAuditTime) {
      return this.isLocalServerActive;
    }
    this._lastOllamaCheckTime = now;

    return new Promise((resolve) => {
      const req = http.get('http://localhost:11434/api/tags', { timeout: 400 }, (res) => {
        const isRealOllama = !res.headers['x-jdroidx-proxy'];
        resolve(res.statusCode >= 200 && res.statusCode < 400 && isRealOllama);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    });
  }

  async runAudit(writeLog = false) {
    if (this.isAuditing) {
      console.log('[ProviderMonitorAgent] Audit already in progress, skipping overlapping run.');
      return this.cachedAuditData;
    }
    this.isAuditing = true;

    try {
      this.loadConfig();
      this.isLocalServerActive = await this.checkLocalServerHealth();
      this.lastAuditTime = new Date().toISOString();

      const ProviderModel = require('../models/ProviderModel');
      const AIModel = require('../models/AIModel');
      const ComboModel = require('../models/ComboModel');

    const providers = ProviderModel.getAll() || [];
    const models = AIModel.getAll() || [];
    const combos = ComboModel.getAll() || [];

    // Fetch local Ollama models if active
    this.localOllamaModelNames = [];
    if (this.isLocalServerActive) {
      const ollamaProv = providers.find(p => p.id === 'ollama' || p.baseUrl.includes('11434') || (p.protocol && p.protocol.toLowerCase().includes('ollama')));
      const targetBase = ollamaProv ? ollamaProv.baseUrl : 'http://localhost:11434';
      this.localOllamaModelNames = await this.fetchLocalOllamaModelNames(targetBase);
    }

    const ProxyEngineService = require('./ProxyEngineService');
    const blacklistedList = ProxyEngineService.getBlacklistedStatus() || [];
    const blacklistedIds = new Set(blacklistedList.map(b => b.providerId));

    const activeProviders = [];
    const inactiveProviders = [];
    const blacklistedProviders = [];

    providers.forEach(p => {
      const pModels = models.filter(m => m.providerId === p.id);
      
      const activePModels = pModels.filter(m => {
        if (m.isActive === false || m.status === 'Inactive') return false;
        const isOllamaModel = p.id === 'ollama' || (p.protocol && p.protocol.toLowerCase().includes('ollama')) || p.baseUrl.includes('11434');
        if (isOllamaModel) {
          if (!this.isLocalServerActive) return false;
          const isInstalled = this.localOllamaModelNames.some(name => 
            name === m.modelId || m.modelId === name || name.replace(':latest', '') === m.modelId.replace(':latest', '')
          );
          if (!isInstalled) return false;
        }
        return true;
      });

      const inactivePModels = pModels.filter(m => {
        if (m.isActive === false || m.status === 'Inactive') return true;
        const isOllamaModel = p.id === 'ollama' || (p.protocol && p.protocol.toLowerCase().includes('ollama')) || p.baseUrl.includes('11434');
        if (isOllamaModel) {
          if (!this.isLocalServerActive) return true;
          const isInstalled = this.localOllamaModelNames.some(name => 
            name === m.modelId || m.modelId === name || name.replace(':latest', '') === m.modelId.replace(':latest', '')
          );
          if (!isInstalled) return true;
        }
        return false;
      });

      const isBlack = blacklistedIds.has(p.id);
      const blackInfo = isBlack ? blacklistedList.find(b => b.providerId === p.id) : null;

      const obj = {
        id: p.id,
        displayName: p.displayName || p.id,
        protocol: p.protocol || 'OpenAI Compatible',
        baseUrl: p.baseUrl,
        isActive: p.isActive,
        isBlacklisted: isBlack,
        remainingMinutes: blackInfo ? blackInfo.remainingMinutes : 0,
        totalModelsCount: pModels.length,
        activeModelsCount: activePModels.length,
        inactiveModelsCount: inactivePModels.length,
        activeModels: activePModels,
        inactiveModels: inactivePModels
      };

      if (isBlack) blacklistedProviders.push(obj);
      else if (p.isActive) activeProviders.push(obj);
      else inactiveProviders.push(obj);
    });

    const activeCombos = [];
    const inactiveCombos = [];
    const blacklistedCombos = [];

    combos.forEach(c => {
      const comboModelIds = c.modelsList || c.modelIds || [];
      const comboModels = models.filter(m => comboModelIds.includes(m.id) || comboModelIds.includes(m.modelId));
      
      const activeCModels = comboModels.filter(m => {
        const prov = providers.find(p => p.id === m.providerId);
        const isBlack = blacklistedIds.has(m.providerId);
        if (isBlack) return false;
        
        const isOllamaModel = m.providerId === 'ollama' ||
                              (prov && prov.protocol && prov.protocol.toLowerCase().includes('ollama')) ||
                              (prov && prov.baseUrl && prov.baseUrl.includes('11434'));
        if (isOllamaModel) {
          if (!this.isLocalServerActive) return false;
          const isInstalled = this.localOllamaModelNames.some(name => 
            name === m.modelId || m.modelId === name || name.replace(':latest', '') === m.modelId.replace(':latest', '')
          );
          if (!isInstalled) return false;
        }
        
        return m.isActive !== false && m.status !== 'Inactive' && prov && prov.isActive;
      });

      const inactiveCModels = comboModels.filter(m => {
        const prov = providers.find(p => p.id === m.providerId);
        const isBlack = blacklistedIds.has(m.providerId);
        if (isBlack) return false;
        
        const isOllamaModel = m.providerId === 'ollama' ||
                              (prov && prov.protocol && prov.protocol.toLowerCase().includes('ollama')) ||
                              (prov && prov.baseUrl && prov.baseUrl.includes('11434'));
        if (isOllamaModel) {
          if (!this.isLocalServerActive) return true;
          const isInstalled = this.localOllamaModelNames.some(name => 
            name === m.modelId || m.modelId === name || name.replace(':latest', '') === m.modelId.replace(':latest', '')
          );
          if (!isInstalled) return true;
        }
        
        return m.isActive === false || m.status === 'Inactive' || !prov || !prov.isActive;
      });

      const blacklistedCModels = comboModels.filter(m => blacklistedIds.has(m.providerId));

      const obj = {
        id: c.id,
        name: c.name || c.id,
        description: c.description || '',
        strategy: c.strategy || 'RoundRobin',
        isActive: c.isActive,
        totalModelsCount: comboModels.length,
        activeModelsCount: activeCModels.length,
        inactiveModelsCount: inactiveCModels.length,
        activeModels: activeCModels,
        inactiveModels: inactiveCModels,
        blacklistedModels: blacklistedCModels
      };

      if (blacklistedCModels.length > 0 && activeCModels.length === 0) {
        blacklistedCombos.push(obj);
      } else if (c.isActive) {
        activeCombos.push(obj);
      } else {
        inactiveCombos.push(obj);
      }
    });

    const activeModelsAll = models.filter(m => {
      const prov = providers.find(p => p.id === m.providerId);
      const isBlack = blacklistedIds.has(m.providerId);
      if (isBlack) return false;
      
      const isOllamaModel = m.providerId === 'ollama' ||
                            (prov && prov.protocol && prov.protocol.toLowerCase().includes('ollama')) ||
                            (prov && prov.baseUrl && prov.baseUrl.includes('11434'));
      if (isOllamaModel) {
        if (!this.isLocalServerActive) return false;
        const isInstalled = this.localOllamaModelNames.some(name => 
          name === m.modelId || m.modelId === name || name.replace(':latest', '') === m.modelId.replace(':latest', '')
        );
        if (!isInstalled) return false;
      }
      
      return m.isActive !== false && m.status !== 'Inactive' && prov && prov.isActive;
    });

    const inactiveModelsAll = models.filter(m => {
      const prov = providers.find(p => p.id === m.providerId);
      const isBlack = blacklistedIds.has(m.providerId);
      if (isBlack) return false;
      
      const isOllamaModel = m.providerId === 'ollama' ||
                            (prov && prov.protocol && prov.protocol.toLowerCase().includes('ollama')) ||
                            (prov && prov.baseUrl && prov.baseUrl.includes('11434'));
      if (isOllamaModel) {
        if (!this.isLocalServerActive) return true;
        const isInstalled = this.localOllamaModelNames.some(name => 
          name === m.modelId || m.modelId === name || name.replace(':latest', '') === m.modelId.replace(':latest', '')
        );
        if (!isInstalled) return true;
      }
      
      return m.isActive === false || m.status === 'Inactive' || !prov || !prov.isActive;
    });

    const blacklistedModelsAll = models.filter(m => blacklistedIds.has(m.providerId));

    this.cachedAuditData = {
      timestamp: this.lastAuditTime,
      isLocalServerActive: this.isLocalServerActive,
      frequencyHours: this.intervalMs / 3600000,
      summary: {
        totalProviders: providers.length,
        activeProvidersCount: activeProviders.length,
        inactiveProvidersCount: inactiveProviders.length,
        blacklistedProvidersCount: blacklistedProviders.length,
        totalModels: models.length,
        activeModelsCount: activeModelsAll.length,
        inactiveModelsCount: inactiveModelsAll.length,
        blacklistedModelsCount: blacklistedModelsAll.length,
        totalCombos: combos.length,
        activeCombosCount: activeCombos.length,
        inactiveCombosCount: inactiveCombos.length,
        blacklistedCombosCount: blacklistedCombos.length
      },
      active: {
        combos: activeCombos,
        providers: activeProviders,
        models: activeModelsAll
      },
      inactive: {
        combos: inactiveCombos,
        providers: inactiveProviders,
        models: inactiveModelsAll
      },
      blacklisted: {
        combos: blacklistedCombos,
        providers: blacklistedProviders,
        models: blacklistedModelsAll
      }
    };

      const currentSignature = `${activeModelsAll.length}_${inactiveModelsAll.length}_${providers.length}_${this.isLocalServerActive}`;
      const stateChanged = this._lastAuditSignature && this._lastAuditSignature !== currentSignature;
      
      if (writeLog && stateChanged) {
        LogModel.recordSystemLog(
          'BACKGROUND_MONITOR',
          'INFO',
          `Provider Audit State Changed: ${activeModelsAll.length} Active / ${inactiveModelsAll.length} Inactive Models across ${providers.length} Providers. Local Server: ${this.isLocalServerActive ? 'ONLINE' : 'OFFLINE'}.`,
          this.cachedAuditData.summary
        );
      }
      this._lastAuditSignature = currentSignature;

      // Notify clients of background sync (if WebSockets or similar are added later)
      // For now, this prepares the state for the UI to consume natively.

      return this.cachedAuditData;
    } finally {
      this.isAuditing = false;
    }
  }

  async getAuditReport() {
    return this.runAudit(false);
  }
}

module.exports = new ProviderMonitorAgent();

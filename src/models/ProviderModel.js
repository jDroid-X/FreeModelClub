/**
 * ProviderModel.js
 * Purpose: Manages Provider details, registration, updating, active status, credentials, and API key masking.
 *          Integrates CryptoVault for AES-256-GCM zero-trust encryption at rest.
 * Dependencies: Database, CryptoVault
 */

const db = require('./Database');
const CryptoVault = require('../utils/CryptoVault');

class ProviderModel {
  static save(provider) {
    if (!provider || !provider.id) return false;
    return this.update(provider.id, provider);
  }

  static getByBaseUrl(baseUrl) {
    const providers = db.read(db.files.providers);
    return providers.find(p => p.baseUrl === baseUrl);
  }

  static getAll(maskKeys = true) {
    const providers = db.read(db.files.providers);
    const unarchived = providers.filter((p) => !p.isArchived && p.id && p.displayName && p.displayName !== 'Unnamed Provider' && p.baseUrl);

    return unarchived.map((p) => {
      const realKey = CryptoVault.decrypt(p.apiKey);
      return {
        ...p,
        apiKey: maskKeys ? this.maskApiKey(realKey) : realKey
      };
    });
  }

  static getArchivedProviders(maskKeys = true) {
    const providers = db.read(db.files.providers);
    const archived = providers.filter((p) => Boolean(p.isArchived));

    return archived.map((p) => {
      const realKey = CryptoVault.decrypt(p.apiKey);
      return {
        ...p,
        apiKey: maskKeys ? this.maskApiKey(realKey) : realKey
      };
    });
  }

  static getActiveProviders(maskKeys = false) {
    const providers = db.read(db.files.providers);
    const active = providers.filter((p) => {
      if (!p.isActive || p.isArchived || !p.displayName || p.displayName === 'Unnamed Provider' || !p.baseUrl) return false;
      const realKey = CryptoVault.decrypt(p.apiKey);
      const hasKey = realKey && realKey.trim().length > 0;
      return hasKey;
    });

    return active.map((p) => {
      const realKey = CryptoVault.decrypt(p.apiKey);
      return {
        ...p,
        apiKey: maskKeys ? this.maskApiKey(realKey) : realKey
      };
    });
  }

  static getById(id, maskKeys = true) {
    const providers = db.read(db.files.providers);
    const provider = providers.find((p) => p.id === id);

    if (!provider) return null;

    const realKey = CryptoVault.decrypt(provider.apiKey);
    return {
      ...provider,
      apiKey: maskKeys ? this.maskApiKey(realKey) : realKey
    };
  }

  static maskApiKey(key) {
    if (!key || key === 'ollama-local' || key === 'none') return key || '';
    if (key.length <= 8) return '********';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }

  static resolveRealApiKey(providerId, incomingKey, targetBaseUrl = null) {
    const isRealKey = incomingKey &&
                      incomingKey !== '********' &&
                      incomingKey !== '[REDACTED]' &&
                      !/^\*+$/.test(incomingKey) &&
                      !incomingKey.includes('...') &&
                      !CryptoVault.isEncrypted(incomingKey);

    // If an explicit unmasked real API key was provided in request, use it directly
    if (isRealKey) {
      return incomingKey;
    }

    const providers = db.read(db.files.providers);

    // 1. Try resolving by explicit Provider ID
    if (providerId) {
      const stored = providers.find(p => p.id === providerId || (p.displayName && p.displayName.toLowerCase().includes(providerId.toLowerCase())));
      if (stored && stored.apiKey) {
        const dec = CryptoVault.decrypt(stored.apiKey);
        if (dec && !/^\*+$/.test(dec) && dec !== '********' && !dec.includes('...')) {
          return dec;
        }
      }
    }

    // 2. Try resolving by Target Base URL domain matching
    if (targetBaseUrl) {
      try {
        const u = new URL(targetBaseUrl);
        const host = u.hostname.toLowerCase().replace(/^www\./, '');
        const storedByDomain = providers.find(p => {
          if (!p.baseUrl || !p.apiKey) return false;
          try {
            const pHost = new URL(p.baseUrl).hostname.toLowerCase().replace(/^www\./, '');
            return pHost === host || host.includes(pHost) || pHost.includes(host);
          } catch(e) {
            return p.baseUrl.toLowerCase().includes(host);
          }
        });
        if (storedByDomain) {
          const dec = CryptoVault.decrypt(storedByDomain.apiKey);
          if (dec && !/^\*+$/.test(dec) && dec !== '********' && !dec.includes('...')) {
            return dec;
          }
        }
      } catch (e) {}
    }

    // 3. Fallback: Return first active provider's unmasked key
    for (const p of providers) {
      if (p.apiKey && p.isActive && !p.isArchived) {
        const dec = CryptoVault.decrypt(p.apiKey);
        if (dec && !/^\*+$/.test(dec) && dec !== '********' && !dec.includes('...')) {
          return dec;
        }
      }
    }

    return incomingKey || '';
  }

  static hasActiveProviders() {
    const active = this.getActiveProviders();
    return active.length > 0;
  }

  static register(providerData) {
    const providers = db.read(db.files.providers);
    const incomingId = (providerData.providerId || providerData.id || '').toString().trim();
    const cleanNewId = incomingId.toLowerCase();
    const existingIndex = providers.findIndex((p) => p.id === incomingId || p.id.toLowerCase() === cleanNewId);

    const rawDisplayName = (providerData.displayName || providerData.name || '').trim();
    if (!rawDisplayName || rawDisplayName.toLowerCase() === 'unnamed provider') {
      throw new Error('Provider display name is required and cannot be empty.');
    }
    const cleanDisplayName = rawDisplayName.split(/[\s/]+/).slice(0, 3).join(' ');

    const rawBaseUrl = (providerData.baseUrl || '').trim();
    if (!rawBaseUrl) {
      throw new Error('Provider API Base URL is required.');
    }

    // Prevent adding a new duplicate provider with the same Base URL under a different provider ID
    if (existingIndex < 0) {
      const isDuplicate = providers.some((p) => {
        const cleanPId = (p.id || '').toLowerCase();
        return cleanPId !== cleanNewId && 
               p.baseUrl && 
               p.baseUrl.trim().toLowerCase() === rawBaseUrl.toLowerCase();
      });

      if (isDuplicate) {
        throw new Error(`A provider with the base URL '${rawBaseUrl}' is already registered in the system.`);
      }
    }

    let rawApiKey = providerData.apiKey || '';
    if (existingIndex >= 0) {
      const isPlaceholder = !rawApiKey || 
                            rawApiKey === '********' || 
                            /^\*+$/.test(rawApiKey) || 
                            rawApiKey.includes('...');
      if (isPlaceholder && providers[existingIndex].apiKey) {
        rawApiKey = CryptoVault.decrypt(providers[existingIndex].apiKey);
      }
    }

    const encryptedKey = CryptoVault.encrypt(rawApiKey);

    const newProvider = {
      id: incomingId || `${cleanDisplayName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`,
      displayName: cleanDisplayName,
      protocol: providerData.protocol || 'OpenAI Compatible',
      baseUrl: rawBaseUrl,
      apiKey: encryptedKey,
      isActive: providerData.isActive !== undefined ? providerData.isActive : true,
      freeOnly: providerData.freeOnly !== undefined ? providerData.freeOnly : true,
      docsUrl: providerData.docsUrl || '',
      registeredAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      providers[existingIndex] = { ...providers[existingIndex], ...newProvider };
    } else {
      providers.push(newProvider);
    }

    db.write(db.files.providers, providers);

    try {
      const ProxyEngineService = require('../services/ProxyEngineService');
      ProxyEngineService.recordProviderSuccess(newProvider.id);
    } catch(e) {}

    const config = db.read(db.files.config);
    if (!config.activeProviderId) {
      config.activeProviderId = newProvider.id;
      db.write(db.files.config, config);
    }

    const systemLogs = db.read(db.files.system_logs);
    systemLogs.push({
      id: `sys_${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'PROVIDER_REGISTRATION',
      level: 'INFO',
      message: `Provider '${newProvider.displayName}' registered/updated successfully.`,
      details: { providerId: newProvider.id, protocol: newProvider.protocol, baseUrl: newProvider.baseUrl }
    });
    db.write(db.files.system_logs, systemLogs);

    return {
      ...newProvider,
      apiKey: this.maskApiKey(rawApiKey)
    };
  }

  static update(id, updateData) {
    const providers = db.read(db.files.providers);
    const index = providers.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const isPlaceholder = !updateData.apiKey ||
                          updateData.apiKey === '********' ||
                          /^\*+$/.test(updateData.apiKey) ||
                          updateData.apiKey.includes('...');
    
    let apiKeyToSave = providers[index].apiKey;
    if (!isPlaceholder && updateData.apiKey) {
      apiKeyToSave = CryptoVault.encrypt(updateData.apiKey);
    }

    const merged = { 
      ...providers[index], 
      ...updateData, 
      apiKey: apiKeyToSave,
      updatedAt: new Date().toISOString() 
    };

    providers[index] = merged;
    db.write(db.files.providers, providers);

    // Closed-loop synchronization: Update status of child models in models.json matching provider.isActive
    if (updateData.isActive !== undefined) {
      const models = db.read(db.files.models);
      let updatedModels = false;
      models.forEach((m) => {
        if (m.providerId === id) {
          m.status = updateData.isActive ? 'Active' : 'Inactive';
          m.isActive = Boolean(updateData.isActive);
          updatedModels = true;
        }
      });
      if (updatedModels) {
        db.write(db.files.models, models);
      }
    }

    try {
      const ProxyEngineService = require('../services/ProxyEngineService');
      ProxyEngineService.recordProviderSuccess(id);
    } catch(e) {}

    return {
      ...providers[index],
      apiKey: this.maskApiKey(CryptoVault.decrypt(providers[index].apiKey))
    };
  }

  static recordUsage(providerId, promptTokens = 0, completionTokens = 0) {
    const providers = db.read(db.files.providers);
    const index = providers.findIndex((p) => p.id === providerId);
    if (index === -1) return null;
    
    providers[index].tokensConsumed = (providers[index].tokensConsumed || 0) + promptTokens + completionTokens;
    db.write(db.files.providers, providers);
    return providers[index];
  }

  static delete(id) {
    return this.archive(id);
  }

  static archive(id) {
    const providers = db.read(db.files.providers);
    const index = providers.findIndex((p) => p.id === id);
    if (index === -1) return false;

    providers[index].isArchived = true;
    providers[index].isActive = false;
    providers[index].archivedAt = new Date().toISOString();
    db.write(db.files.providers, providers);

    // Mark models as archived
    const models = db.read(db.files.models);
    models.forEach((m) => {
      if (m.providerId === id) m.status = 'Archived';
    });
    db.write(db.files.models, models);

    return true;
  }

  static restore(id) {
    const providers = db.read(db.files.providers);
    const index = providers.findIndex((p) => p.id === id);
    if (index === -1) return false;

    providers[index].isArchived = false;
    providers[index].isActive = true;
    delete providers[index].archivedAt;
    db.write(db.files.providers, providers);

    // Restore models status
    const models = db.read(db.files.models);
    models.forEach((m) => {
      if (m.providerId === id) m.status = 'Active';
    });
    db.write(db.files.models, models);

    return true;
  }

  static permanentDelete(id) {
    let providers = db.read(db.files.providers);
    providers = providers.filter((p) => p.id !== id);
    db.write(db.files.providers, providers);

    let models = db.read(db.files.models);
    models = models.filter((m) => m.providerId !== id);
    db.write(db.files.models, models);

    return true;
  }
}

module.exports = ProviderModel;

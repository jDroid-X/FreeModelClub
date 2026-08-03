/**
 * ProviderModel.js
 * Purpose: Manages Provider details, registration, updating, active status, credentials, and API key masking
 * Dependencies: Database
 */

const db = require('./Database');

class ProviderModel {
  static getAll(maskKeys = true) {
    const providers = db.read(db.files.providers);
    const unarchived = providers.filter((p) => !p.isArchived);
    if (!maskKeys) return unarchived;

    return unarchived.map((p) => ({
      ...p,
      apiKey: this.maskApiKey(p.apiKey)
    }));
  }

  static getArchivedProviders(maskKeys = true) {
    const providers = db.read(db.files.providers);
    const archived = providers.filter((p) => Boolean(p.isArchived));
    if (!maskKeys) return archived;

    return archived.map((p) => ({
      ...p,
      apiKey: this.maskApiKey(p.apiKey)
    }));
  }

  static getActiveProviders(maskKeys = false) {
    const providers = db.read(db.files.providers);
    const active = providers.filter((p) => p.isActive && !p.isArchived);
    if (!maskKeys) return active;

    return active.map((p) => ({
      ...p,
      apiKey: this.maskApiKey(p.apiKey)
    }));
  }

  static getById(id, maskKey = false) {
    const providers = db.read(db.files.providers);
    const provider = providers.find((p) => p.id === id);
    if (!provider) return null;
    if (maskKey) {
      return { ...provider, apiKey: this.maskApiKey(provider.apiKey) };
    }
    return provider;
  }

  static maskApiKey(key) {
    if (!key || key === 'ollama-local') return key || '';
    if (key.length <= 8) return '********';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }

  static resolveRealApiKey(providerId, incomingKey, targetBaseUrl = null) {
    const isRealKey = incomingKey &&
                      incomingKey !== '********' &&
                      !/^\*+$/.test(incomingKey) &&
                      !incomingKey.includes('...');

    // If an explicit unmasked real API key was provided in request, use it directly
    if (isRealKey) {
      return incomingKey;
    }

    const providers = db.read(db.files.providers);

    // 1. Try resolving by explicit Provider ID
    if (providerId) {
      const cleanId = providerId.replace(/^prov_/, '');
      const stored = providers.find(p => p.id === providerId || p.id === `prov_${cleanId}` || p.id === cleanId || p.displayName.toLowerCase().includes(cleanId.toLowerCase()));
      if (stored && stored.apiKey && !/^\*+$/.test(stored.apiKey) && stored.apiKey !== '********' && !stored.apiKey.includes('...')) {
        return stored.apiKey;
      }
    }

    // 2. Try resolving by Target Base URL domain matching
    if (targetBaseUrl) {
      try {
        const u = new URL(targetBaseUrl);
        const host = u.hostname.toLowerCase().replace(/^www\./, '');
        const storedByDomain = providers.find(p => {
          if (!p.baseUrl || !p.apiKey || /^\*+$/.test(p.apiKey) || p.apiKey === '********' || p.apiKey.includes('...')) return false;
          try {
            const pHost = new URL(p.baseUrl).hostname.toLowerCase().replace(/^www\./, '');
            return pHost === host || host.includes(pHost) || pHost.includes(host);
          } catch(e) {
            return p.baseUrl.toLowerCase().includes(host);
          }
        });
        if (storedByDomain) return storedByDomain.apiKey;
      } catch (e) {}
    }

    // 3. Fallback: Return first active provider's unmasked key if domain matches
    const firstValid = providers.find(p => p.apiKey && !/^\*+$/.test(p.apiKey) && p.apiKey !== '********' && !p.apiKey.includes('...'));
    return (firstValid && firstValid.apiKey) ? firstValid.apiKey : (incomingKey || '');
  }

  static hasActiveProviders() {
    const active = this.getActiveProviders();
    return active.length > 0;
  }

  static register(providerData) {
    const providers = db.read(db.files.providers);
    const cleanNewId = (providerData.id || '').replace(/^prov_/, '').toLowerCase();
    const existingIndex = providers.findIndex((p) => p.id === providerData.id || p.id.replace(/^prov_/, '').toLowerCase() === cleanNewId);

    // Prevent adding a new duplicate provider with the same Base URL under a different provider ID
    const isDuplicate = providers.some((p) => {
      const cleanPId = (p.id || '').replace(/^prov_/, '').toLowerCase();
      return cleanPId !== cleanNewId && 
             p.baseUrl && 
             p.baseUrl.trim().toLowerCase() === (providerData.baseUrl || '').trim().toLowerCase();
    });

    if (isDuplicate) {
      throw new Error(`A provider with the base URL '${providerData.baseUrl}' is already registered in the system.`);
    }

    const newProvider = {
      id: providerData.id || `prov_${Date.now()}`,
      displayName: providerData.displayName || 'Unnamed Provider',
      protocol: providerData.protocol || 'OpenAI Compatible',
      baseUrl: providerData.baseUrl || '',
      apiKey: providerData.apiKey || '',
      isActive: providerData.isActive !== undefined ? providerData.isActive : true,
      freeOnly: providerData.freeOnly !== undefined ? providerData.freeOnly : true,
      docsUrl: providerData.docsUrl || '',
      registeredAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Retain existing key if new key provided is blank/masked/placeholder
      const isPlaceholder = !newProvider.apiKey || 
                            newProvider.apiKey === '********' || 
                            /^\*+$/.test(newProvider.apiKey) || 
                            newProvider.apiKey.includes('...');
      if (isPlaceholder && providers[existingIndex].apiKey) {
        newProvider.apiKey = providers[existingIndex].apiKey;
      }
      providers[existingIndex] = { ...providers[existingIndex], ...newProvider };
    } else {
      providers.push(newProvider);
    }

    db.write(db.files.providers, providers);

    const config = db.read(db.files.config);
    if (!config.activeProviderId) {
      config.activeProviderId = newProvider.id;
      db.write(db.files.config, config);
    }

    const systemLogs = db.read(db.files.system_logs);
    systemLogs.push({
      id: `sys_prov_${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'PROVIDER_REGISTRATION',
      level: 'INFO',
      message: `Provider '${newProvider.displayName}' registered/updated successfully.`,
      details: { providerId: newProvider.id, protocol: newProvider.protocol, baseUrl: newProvider.baseUrl }
    });
    db.write(db.files.system_logs, systemLogs);

    return newProvider;
  }

  static update(id, updateData) {
    const providers = db.read(db.files.providers);
    const index = providers.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const merged = { ...providers[index], ...updateData, updatedAt: new Date().toISOString() };

    const isPlaceholder = !merged.apiKey ||
                          merged.apiKey === '********' ||
                          /\*+$/.test(merged.apiKey) ||
                          merged.apiKey.includes('...');
    if (isPlaceholder && providers[index].apiKey) {
      merged.apiKey = providers[index].apiKey;
    }

    providers[index] = merged;
    db.write(db.files.providers, providers);
    return providers[index];
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

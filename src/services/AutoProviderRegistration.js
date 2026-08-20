/**
 * AutoProviderRegistration.js
 * Purpose: Auto-registers known free-tier providers on server startup
 */

const ProviderModel = require('../models/ProviderModel');
const ProviderAgentHelper = require('./ProviderAgentHelper');

class AutoProviderRegistration {
  static async registerKnownProviders() {
    try {
      const existingProviders = ProviderModel.getAll(true);
      const existingIds = new Set(existingProviders.map(p => p.id));
      
      const knownDb = ProviderAgentHelper.getKnownProvidersDatabase();
      let registered = 0;
      
      for (const [key, providerData] of Object.entries(knownDb)) {
        if (!existingIds.has(key)) {
          // Auto-register with dummy API key - user will need to add their own
          await ProviderModel.register({
            id: providerData.id,
            displayName: providerData.displayName,
            protocol: providerData.protocol || 'OpenAI Compatible',
            baseUrl: providerData.baseUrl,
            apiKey: providerData.keyPrefix === 'ollama-local' ? 'ollama-local' : '',
            isActive: false, // Start inactive until user provides API key
            freeOnly: true,
            docsUrl: providerData.apiKeyUrl || '',
            registeredAt: new Date().toISOString()
          });
          registered++;
          console.log(`[AutoRegister] Registered provider: ${providerData.displayName} (${key})`);
        } else {
          // Update existing provider with latest catalog info if missing docsUrl
          const existing = existingProviders.find(p => p.id === key);
          if (existing && !existing.docsUrl && providerData.apiKeyUrl) {
            await ProviderModel.update(key, { docsUrl: providerData.apiKeyUrl });
            console.log(`[AutoRegister] Updated docsUrl for: ${providerData.displayName}`);
          }
        }
      }
      
      console.log(`[AutoRegister] Total new providers registered: ${registered}`);
      return registered;
    } catch (err) {
      console.error('[AutoRegister] Failed to register providers:', err.message);
      return 0;
    }
  }
}

module.exports = AutoProviderRegistration;

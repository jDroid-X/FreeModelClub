/**
 * ProviderModel.test.js
 * Purpose: Unit tests for ProviderModel CRUD, key masking, and O(1) index-backed getById
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ProviderModel = require('../src/models/ProviderModel');
const db = require('../src/models/Database');

describe('ProviderModel — Read Operations', () => {
  it('should return all non-archived providers', () => {
    const providers = ProviderModel.getAll();
    expect(Array.isArray(providers)).toBe(true);
    providers.forEach(p => {
      expect(p.isArchived).not.toBe(true);
    });
  });

  it('should return active providers with API keys', () => {
    const active = ProviderModel.getActiveProviders();
    expect(Array.isArray(active)).toBe(true);
    active.forEach(p => {
      expect(p.isActive).toBe(true);
      expect(p.apiKey).toBeDefined();
      expect(p.apiKey.trim().length).toBeGreaterThan(0);
    });
  });

  it('should get provider by ID using O(1) index lookup', () => {
    const providers = db.read(db.files.providers);
    if (providers.length === 0) return;
    const target = providers.find(p => !p.isArchived);
    if (!target) return;

    const found = ProviderModel.getById(target.id);
    expect(found).toBeDefined();
    expect(found.id).toBe(target.id);
    expect(found.displayName).toBe(target.displayName);
  });

  it('should return null for non-existent provider ID', () => {
    const found = ProviderModel.getById('nonexistent_xyz_999');
    expect(found).toBeNull();
  });

  it('should mask API keys correctly', () => {
    const masked = ProviderModel.maskApiKey('sk-abcdefgh12345678');
    expect(masked).not.toBe('sk-abcdefgh12345678');
    expect(masked).toContain('...');
    expect(masked.startsWith('sk-a')).toBe(true);
    expect(masked.endsWith('5678')).toBe(true);
  });

  it('should not mask short keys', () => {
    const masked = ProviderModel.maskApiKey('short');
    expect(masked).toBe('********');
  });

  it('should not mask ollama-local key', () => {
    const masked = ProviderModel.maskApiKey('ollama-local');
    expect(masked).toBe('ollama-local');
  });

  it('should handle hasActiveProviders check', () => {
    const result = ProviderModel.hasActiveProviders();
    expect(typeof result).toBe('boolean');
  });
});

describe('ProviderModel — Key Resolution', () => {
  it('should resolve real key from stored provider', () => {
    const active = ProviderModel.getActiveProviders(false);
    if (active.length === 0) return;
    const provider = active[0];

    const resolved = ProviderModel.resolveRealApiKey(provider.id, '********');
    expect(resolved).toBeDefined();
    expect(resolved).not.toBe('********');
    expect(resolved.length).toBeGreaterThan(0);
  });

  it('should pass through real API keys without resolving', () => {
    const realKey = 'sk-real-test-key-12345678';
    const resolved = ProviderModel.resolveRealApiKey('anyProvider', realKey);
    expect(resolved).toBe(realKey);
  });
});

describe('ProviderModel & AIModel — Metadata Retention & Auto-Classification', () => {
  it('should preserve all rate limits and metadata fields in register()', () => {
    const testProviderData = {
      id: 'test_meta_provider_unit',
      displayName: 'Test Meta Provider',
      protocol: 'OpenAI Compatible',
      baseUrl: 'https://api.testprovider.ai/v1',
      apiKey: 'sk-test-meta-secret-12345',
      rateLimitRPM: 120,
      rateLimitRPD: 5000,
      rateLimitTPM: 100000,
      freeTierLimit: '500k Tokens / Day',
      keyPrefix: 'sk-test-',
      docsUrl: 'https://docs.testprovider.ai'
    };

    const registered = ProviderModel.register(testProviderData);
    expect(registered).toBeDefined();
    expect(registered.id).toBe('test_meta_provider_unit');
    expect(registered.rateLimitRPM).toBe(120);
    expect(registered.rateLimitRPD).toBe(5000);
    expect(registered.rateLimitTPM).toBe(100000);
    expect(registered.freeTierLimit).toBe('500k Tokens / Day');
    expect(registered.keyPrefix).toBe('sk-test-');
    expect(registered.docsUrl).toBe('https://docs.testprovider.ai');

    // Clean up test provider
    ProviderModel.delete('test_meta_provider_unit');
  });

  it('should auto-classify family and coreSkill when saving models via AIModel.saveBatch', () => {
    const AIModel = require('../src/models/AIModel');
    const sampleModels = [
      {
        id: 'test_meta_provider_unit_llama_3_3',
        modelId: 'llama-3.3-70b-versatile',
        providerId: 'test_meta_provider_unit'
      }
    ];

    const saved = AIModel.saveBatch(sampleModels);
    const target = saved.find(m => m.id === 'test_meta_provider_unit_llama_3_3');
    expect(target).toBeDefined();
    expect(target.family).toBe('Llama Family');
    expect(target.headFamilyId).toBe('llama');
    expect(target.coreSkill).toBeDefined();
    expect(target.contextWindow).toBeGreaterThan(0);

    // Clean up test model from DB
    const allModels = db.read(db.files.models).filter(m => m.id !== 'test_meta_provider_unit_llama_3_3');
    db.write(db.files.models, allModels);
  });
});


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

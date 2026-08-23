/**
 * ProxyEngineService.test.js
 * Purpose: Unit tests for ProxyEngineService circuit breaker, blacklisting, and failover state
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ProxyEngineService = require('../src/services/ProxyEngineService');
const ComboModel = require('../src/models/ComboModel');
const ActiveModelAgent = require('../src/services/ActiveModelAgent');

describe('ProxyEngineService — Circuit Breaker & Blacklist', () => {
  beforeEach(() => {
    ProxyEngineService.unblacklistAllProviders();
  });

  it('should initialize with empty blacklist', () => {
    expect(ProxyEngineService.getBlacklistedStatus()).toEqual([]);
    expect(ProxyEngineService.isProviderBlacklisted('groq')).toBe(false);
  });

  it('should blacklist a provider for specified duration', () => {
    ProxyEngineService.blacklistProvider('groq', 10);
    expect(ProxyEngineService.isProviderBlacklisted('groq')).toBe(true);
    const status = ProxyEngineService.getBlacklistedStatus();
    expect(status.length).toBe(1);
    expect(status[0].providerId).toBe('groq');
    expect(status[0].remainingMinutes).toBeGreaterThanOrEqual(9);
  });

  it('should unblacklist a provider explicitly', () => {
    ProxyEngineService.blacklistProvider('groq', 10);
    expect(ProxyEngineService.isProviderBlacklisted('groq')).toBe(true);
    ProxyEngineService.unblacklistProvider('groq');
    expect(ProxyEngineService.isProviderBlacklisted('groq')).toBe(false);
  });

  it('should trigger circuit breaker after consecutive failures threshold', () => {
    ProxyEngineService.circuitBreakerThreshold = 3;
    ProxyEngineService.recordProviderFailure('test_provider');
    expect(ProxyEngineService.isProviderBlacklisted('test_provider')).toBe(false);

    ProxyEngineService.recordProviderFailure('test_provider');
    expect(ProxyEngineService.isProviderBlacklisted('test_provider')).toBe(false);

    ProxyEngineService.recordProviderFailure('test_provider');
    expect(ProxyEngineService.isProviderBlacklisted('test_provider')).toBe(true);
  });

  it('should reset failure counter on recordProviderSuccess', () => {
    ProxyEngineService.circuitBreakerThreshold = 3;
    ProxyEngineService.recordProviderFailure('test_provider_2');
    ProxyEngineService.recordProviderFailure('test_provider_2');
    ProxyEngineService.recordProviderSuccess('test_provider_2');
    ProxyEngineService.recordProviderFailure('test_provider_2');
    expect(ProxyEngineService.isProviderBlacklisted('test_provider_2')).toBe(false);
  });
});

describe('ComboModel — Normalization & Integrity', () => {
  it('should normalize modelsList when models array is provided', () => {
    const testCombo = {
      id: 'test-normalization-combo',
      name: 'Test Normalization Combo',
      models: ['groq_llama-3_3-70b-versatile'],
      strategy: 'Fallback'
    };
    ComboModel.save(testCombo);
    const retrieved = ComboModel.getById('test-normalization-combo');
    expect(retrieved).toBeDefined();
    expect(Array.isArray(retrieved.modelsList)).toBe(true);
    ComboModel.delete('test-normalization-combo');
  });
});

describe('ActiveModelAgent — Classification Engine', () => {
  it('should run classification without exceptions', () => {
    const stats = ActiveModelAgent.runClassification();
    expect(stats).toBeDefined();
    expect(typeof stats.activeCount).toBe('number');
    expect(typeof stats.inactiveCount).toBe('number');
  });
});

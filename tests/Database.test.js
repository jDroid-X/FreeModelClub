/**
 * Database.test.js
 * Purpose: Unit tests for the Database.js in-memory cache + secondary index layer
 * Tests: read, write, findById, findByField, filter, count, index rebuild
 */

// Use createRequire to import CommonJS modules from ESM test context
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const db = require('../src/models/Database');

describe('Database — Core Read/Write', () => {
  it('should have all registered file paths', () => {
    expect(db.files).toBeDefined();
    expect(db.files.providers).toBeDefined();
    expect(db.files.models).toBeDefined();
    expect(db.files.combos).toBeDefined();
    expect(db.files.config).toBeDefined();
    expect(db.files.api_logs).toBeDefined();
    expect(db.files.system_logs).toBeDefined();
    expect(db.files.users).toBeDefined();
    expect(db.files.taxonomy).toBeDefined();
    expect(db.files.program_mapping).toBeDefined();
  });

  it('should read providers as an array', () => {
    const providers = db.read(db.files.providers);
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);
  });

  it('should read models as an array', () => {
    const models = db.read(db.files.models);
    expect(Array.isArray(models)).toBe(true);
  });

  it('should read combos as an array', () => {
    const combos = db.read(db.files.combos);
    expect(Array.isArray(combos)).toBe(true);
  });

  it('should read config as an object', () => {
    const config = db.read(db.files.config);
    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
  });

  it('should return empty array for non-existent file path', () => {
    const result = db.read('/nonexistent/path.json');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

describe('Database — Secondary Index Layer', () => {
  it('should have built indexes on startup', () => {
    expect(db._indexes.size).toBeGreaterThan(0);
  });

  it('should find provider by ID (O(1))', () => {
    const providers = db.read(db.files.providers);
    if (providers.length === 0) return;
    const firstProvider = providers[0];
    const found = db.findById(db.files.providers, firstProvider.id);
    expect(found).toBeDefined();
    expect(found.id).toBe(firstProvider.id);
    expect(found.displayName).toBe(firstProvider.displayName);
  });

  it('should return null for non-existent provider ID', () => {
    const found = db.findById(db.files.providers, 'nonexistent_provider_xyz');
    expect(found).toBeNull();
  });

  it('should find combo by ID (O(1))', () => {
    const combos = db.read(db.files.combos);
    if (combos.length === 0) return;
    const firstCombo = combos[0];
    const found = db.findById(db.files.combos, firstCombo.id);
    expect(found).toBeDefined();
    expect(found.id).toBe(firstCombo.id);
  });

  it('should find combo by name (O(1))', () => {
    const combos = db.read(db.files.combos);
    if (combos.length === 0) return;
    const firstCombo = combos[0];
    if (!firstCombo.name) return;
    const found = db.findById(db.files.combos, firstCombo.name, 'name');
    expect(found).toBeDefined();
    expect(found.name).toBe(firstCombo.name);
  });

  it('should find model by modelId (O(1))', () => {
    const models = db.read(db.files.models);
    if (models.length === 0) return;
    const firstModel = models[0];
    if (!firstModel.modelId) return;
    const found = db.findByField(db.files.models, 'modelId', firstModel.modelId);
    expect(found).toBeDefined();
    expect(found.modelId).toBe(firstModel.modelId);
  });

  it('should rebuild indexes after write', () => {
    const providers = db.read(db.files.providers);
    const originalCount = providers.length;

    // Add a temporary provider
    const tempProvider = { id: 'test_temp_provider_999', displayName: 'Test Temp', isActive: false };
    providers.push(tempProvider);
    db.write(db.files.providers, providers);

    // Index should be rebuilt automatically
    const found = db.findById(db.files.providers, 'test_temp_provider_999');
    expect(found).toBeDefined();
    expect(found.displayName).toBe('Test Temp');

    // Cleanup: remove temp provider
    const cleaned = providers.filter(p => p.id !== 'test_temp_provider_999');
    db.write(db.files.providers, cleaned);

    // Verify cleanup
    const shouldBeNull = db.findById(db.files.providers, 'test_temp_provider_999');
    expect(shouldBeNull).toBeNull();
    expect(db.read(db.files.providers).length).toBe(originalCount);
  });
});

describe('Database — Filter & Count', () => {
  it('should filter providers by isActive', () => {
    const activeProviders = db.filter(db.files.providers, p => p.isActive === true);
    expect(Array.isArray(activeProviders)).toBe(true);
    activeProviders.forEach(p => {
      expect(p.isActive).toBe(true);
    });
  });

  it('should count all providers', () => {
    const count = db.count(db.files.providers);
    const providers = db.read(db.files.providers);
    expect(count).toBe(providers.length);
  });

  it('should count with predicate', () => {
    const activeCount = db.count(db.files.providers, p => p.isActive === true);
    const activeProviders = db.filter(db.files.providers, p => p.isActive === true);
    expect(activeCount).toBe(activeProviders.length);
  });
});

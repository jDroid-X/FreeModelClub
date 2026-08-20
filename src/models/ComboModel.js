/**
 * ComboModel.js
 * Purpose: Manages registered Model Combos (pool of models with load-balancing/failover strategies)
 *          Enforces cascading referential integrity against AIModel catalog.
 * Dependencies: Database
 */

const db = require('./Database');

class ComboModel {
  static getAll() {
    this.sanitizeReferentialIntegrity();
    return db.read(db.files.combos);
  }

  static isValidStrategy(strategy) {
    return ['Fallback', 'Round Robin', 'Least Latency', 'LKGP', 'Fast (Ship-Fast)', 'Cheap (Cost-Saver)', 'Smart (Quality-First)', 'Auto-Combo'].includes(strategy);
  }

  /**
   * Cascading Referential Integrity: Ensure combo modelsList only references existing models.
   */
  static sanitizeReferentialIntegrity() {
    try {
      const combos = db.read(db.files.combos) || [];
      const models = db.read(db.files.models) || [];
      const validModelIds = new Set(models.map(m => m.id).concat(models.map(m => m.modelId)));

      let changed = false;
      combos.forEach(c => {
        if (Array.isArray(c.modelsList)) {
          const originalLen = c.modelsList.length;
          const filtered = c.modelsList.filter(id => validModelIds.has(id));
          if (filtered.length !== originalLen) {
            c.modelsList = filtered;
            changed = true;
          }
        }
      });

      if (changed) {
        db.write(db.files.combos, combos);
      }
    } catch (e) {
      console.error('[ComboModel.sanitizeReferentialIntegrity]', e.message);
    }
  }

  static getById(id) {
    if (!id) return null;
    this.sanitizeReferentialIntegrity();

    // O(1) index lookup: try exact ID match first
    const exact = db.findById(db.files.combos, id, 'id');
    if (exact) return exact;

    // O(1) index lookup: try exact name match (case-sensitive from index)
    const nameMatch = db.findById(db.files.combos, id, 'name');
    if (nameMatch) return nameMatch;

    // Fallback: case-insensitive name + fuzzy alias match (O(n) — rare path)
    const combos = db.read(db.files.combos);
    const ciNameMatch = combos.find((c) => c.name && c.name.toLowerCase() === id.toLowerCase());
    if (ciNameMatch) return ciNameMatch;

    const cleanInput = id.toLowerCase().replace(/[^a-z0-9]/g, '');
    return combos.find((c) => {
      if (!c.name) return false;
      const cleanName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanName.includes(cleanInput) || cleanInput.includes(cleanName) ||
             (cleanInput.startsWith('jdroid') && cleanName.startsWith('jdroid'));
    });
  }

  static save(combo) {
    // Ensure no duplicate model IDs in the combo
    if (Array.isArray(combo.modelsList)) {
      const models = db.read(db.files.models) || [];
      const validModelIds = new Set(models.map(m => m.id).concat(models.map(m => m.modelId)));
      // Filter out invalid/dangling model IDs
      combo.modelsList = Array.from(new Set(combo.modelsList.filter(id => validModelIds.has(id))));
    }
    const combos = db.read(db.files.combos);
    const existingIndex = combos.findIndex((c) => c.id === combo.id);

    if (existingIndex > -1) {
      combos[existingIndex] = { ...combos[existingIndex], ...combo };
    } else {
      combos.push(combo);
    }

    db.write(db.files.combos, combos);
    return combo;
  }

  static delete(id) {
    const combos = db.read(db.files.combos);
    const filtered = combos.filter((c) => c.id !== id);
    db.write(db.files.combos, filtered);
    return true;
  }

  static toggle(id) {
    const combos = db.read(db.files.combos);
    const combo = combos.find((c) => c.id === id);
    if (combo) {
      combo.isActive = !combo.isActive;
      db.write(db.files.combos, combos);
      return combo;
    }
    return null;
  }
}

module.exports = ComboModel;

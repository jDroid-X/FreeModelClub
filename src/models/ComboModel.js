/**
 * ComboModel.js
 * Purpose: Manages registered Model Combos (pool of models with load-balancing/failover strategies)
 * Dependencies: Database
 */

const db = require('./Database');

class ComboModel {
  static getAll() {
    return db.read(db.files.combos);
  }

  static isValidStrategy(strategy) {
    return ['Fallback', 'Round Robin', 'Least Latency', 'LKGP', 'Fast (Ship-Fast)', 'Cheap (Cost-Saver)', 'Smart (Quality-First)', 'Auto-Combo'].includes(strategy);
  }

  static getById(id) {
    if (!id) return null;
    const combos = db.read(db.files.combos);
    // Strict priority: exact ID match first, then case-insensitive name match
    return combos.find((c) => c.id === id) || combos.find((c) => c.name && c.name.toLowerCase() === id.toLowerCase());
  }

  static save(combo) {
    // Ensure no duplicate model IDs in the combo
    if (Array.isArray(combo.modelsList)) {
      combo.modelsList = Array.from(new Set(combo.modelsList));
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

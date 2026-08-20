// src/services/ThemeService.js
/**
 * ThemeService.js
 * Purpose: Business logic for managing themes (CRUD) and applying live CSS variables.
 * Dependencies: ThemeModel, utility for CSS variable updates.
 */
const ThemeModel = require('../models/ThemeModel');

class ThemeService {
  static getAll() { return ThemeModel.getAll(); }
  static get(id) { return ThemeModel.get(id); }
  static create(theme) {
    const validation = ThemeModel.validate(theme);
    if (!validation.isValid) throw new Error('Invalid theme: ' + validation.errors.join('; '));
    return ThemeModel.create(theme);
  }
  static update(id, updates) {
    const existing = ThemeModel.get(id);
    if (!existing) throw new Error('Theme not found');
    const merged = { ...existing, ...updates };
    const validation = ThemeModel.validate(merged);
    if (!validation.isValid) throw new Error('Invalid theme update: ' + validation.errors.join('; '));
    return ThemeModel.update(id, updates);
  }
  static delete(id) { return ThemeModel.delete(id); }
  // Client-side helper injected via script to apply CSS vars
  static applyThemeVariables(themeVariables) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    Object.entries(themeVariables).forEach(([k, v]) => root.style.setProperty(`--${k}`, v));
  }
}
module.exports = ThemeService;

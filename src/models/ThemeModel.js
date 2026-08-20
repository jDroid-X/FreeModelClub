// src/models/ThemeModel.js
/**
 * ThemeModel.js
 * Purpose: Manage theme definitions (CRUD) using the JSON-backed Database.
 * Dependencies: Database, uuid, path
 */
const db = require('./Database');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class ThemeModel {
  static _filePath() {
    // Use configured path if exists, otherwise default data/themes.json
    return db.files.themes || path.join(__dirname, '../../data/themes.json');
  }

  static getAll() {
    return db.read(this._filePath());
  }

  static get(id) {
    const themes = this.getAll();
    return themes.find(t => t.id === id) || null;
  }

  static create(theme) {
    const themes = this.getAll();
    const newTheme = {
      id: uuidv4(),
      name: theme.name,
      variables: theme.variables || {},
      isDefault: !!theme.isDefault,
    };
    // If this theme is marked default, unset default flag on others
    if (newTheme.isDefault) {
      themes.forEach(t => (t.isDefault = false));
    }
    themes.push(newTheme);
    db.write(this._filePath(), themes);
    return newTheme;
  }

  static update(id, updates) {
    const themes = this.getAll();
    const index = themes.findIndex(t => t.id === id);
    if (index === -1) {
      // Upsert: allow modifying hardcoded themes by saving them into the db
      const newTheme = {
        id: id,
        name: updates.name || id,
        variables: updates.variables || {},
        isDefault: !!updates.isDefault
      };
      if (newTheme.isDefault) themes.forEach(t => (t.isDefault = false));
      themes.push(newTheme);
      db.write(this._filePath(), themes);
      return newTheme;
    }
    const theme = themes[index];
    if (updates.name !== undefined) theme.name = updates.name;
    if (updates.variables !== undefined) theme.variables = updates.variables;
    if (updates.isDefault !== undefined) {
      if (updates.isDefault) {
        themes.forEach(t => (t.isDefault = false));
      }
      theme.isDefault = !!updates.isDefault;
    }
    themes[index] = theme;
    db.write(this._filePath(), themes);
    return theme;
  }

  static delete(id) {
    let themes = this.getAll();
    const before = themes.length;
    themes = themes.filter(t => t.id !== id);
    db.write(this._filePath(), themes);
    return before !== themes.length;
  }

  // Simple validation (can be replaced by a JSON schema later)
  static validate(theme) {
    const errors = [];
    if (!theme.name || typeof theme.name !== 'string' || theme.name.trim().length < 1) {
      errors.push('Theme name is required and must be a non‑empty string');
    }
    if (theme.variables && typeof theme.variables !== 'object') {
      errors.push('Theme variables must be an object of CSS key/value pairs');
    }
    return { isValid: errors.length === 0, errors };
  }
}

module.exports = ThemeModel;

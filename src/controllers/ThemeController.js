// src/controllers/ThemeController.js
/**
 * ThemeController.js
 * Purpose: Expose CRUD API for theme management.
 * Dependencies: ThemeModel, NotificationService
 */
const ThemeModel = require('../models/ThemeModel');

class ThemeController {
  static getAllThemes(req, res) {
    const themes = ThemeModel.getAll();
    res.json({ success: true, themes });
  }

  static getThemeById(req, res) {
    const theme = ThemeModel.get(req.params.id);
    if (!theme) return res.status(404).json({ success: false, message: 'Theme not found' });
    res.json({ success: true, theme });
  }

  static createTheme(req, res) {
    const { name, variables, isDefault } = req.body || {};
    const validation = ThemeModel.validate({ name, variables });
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }
    const newTheme = ThemeModel.create({ name, variables, isDefault });
    if (res.notify) {
      return res.notify('success', 'Theme created', { theme: newTheme });
    }
    res.json({ success: true, theme: newTheme });
  }

  static updateTheme(req, res) {
    const updates = req.body || {};
    const validation = ThemeModel.validate(updates);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }
    const updated = ThemeModel.update(req.params.id, updates);
    if (!updated) return res.status(404).json({ success: false, message: 'Theme not found' });
    if (res.notify) return res.notify('success', 'Theme updated', { theme: updated });
    res.json({ success: true, theme: updated });
  }

  static deleteTheme(req, res) {
    const ok = ThemeModel.delete(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Theme not found' });
    if (res.notify) return res.notify('success', 'Theme deleted');
    res.json({ success: true, message: 'Deleted' });
  }
}

module.exports = ThemeController;

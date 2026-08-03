/**
 * ModelComboService.js
 * Purpose: Business logic service for validating, creating, updating, and testing Model Combos (< 130 lines).
 * Dependencies: ComboModel, AIModel
 */

const ComboModel = require('../models/ComboModel');
const AIModel = require('../models/AIModel');

class ModelComboService {
  static validateComboInput(name, modelsList, currentComboId = null) {
    if (typeof name !== 'string' || !name.trim()) {
      return { valid: false, status: 400, error: 'Combo name must be a non-empty string.' };
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 64) {
      return { valid: false, status: 400, error: 'Combo name must be between 3 and 64 characters.' };
    }
    if (!Array.isArray(modelsList) || modelsList.length === 0) {
      return { valid: false, status: 400, error: 'At least one model must be selected for the combo.' };
    }

    const allModels = AIModel.getAll();
    const modelMap = new Map();
    allModels.forEach(m => {
      if (m.id) modelMap.set(m.id, m.id);
      if (m.modelId) modelMap.set(m.modelId, m.id);
    });

    const sanitizedModelsList = Array.from(new Set(modelsList))
      .map(id => modelMap.get(id) || id)
      .filter(id => allModels.some(m => m.id === id || m.modelId === id));

    if (sanitizedModelsList.length === 0) {
      return { valid: false, status: 400, error: 'None of the selected model IDs exist in the database.' };
    }

    const allCombos = ComboModel.getAll();
    const nameConflict = allCombos.find(c => c.id !== currentComboId && c.name.toLowerCase() === trimmedName.toLowerCase());
    if (nameConflict) {
      return { valid: false, status: 409, error: `A Combo named "${trimmedName}" already exists.` };
    }

    const modelNameCollision = allModels.some(
      m => (m.id && m.id.toLowerCase() === trimmedName.toLowerCase()) || (m.modelId && m.modelId.toLowerCase() === trimmedName.toLowerCase())
    );
    if (modelNameCollision) {
      return { valid: false, status: 409, error: `Combo name "${trimmedName}" conflicts with an existing AI Model ID.` };
    }

    return { valid: true, trimmedName, sanitizedModelsList };
  }

  static createCombo({ name, strategy, description, modelsList }) {
    const val = this.validateComboInput(name, modelsList);
    if (!val.valid) return val;

    const validStrategies = ['Fallback', 'Round Robin', 'Lowest Latency', 'Weighted'];
    const targetStrategy = validStrategies.includes(strategy) ? strategy : 'Round Robin';

    const randSuffix = Math.random().toString(36).substring(2, 7);
    const id = `combo_${Date.now()}_${randSuffix}`;

    const combo = {
      id,
      name: val.trimmedName,
      strategy: targetStrategy,
      description: typeof description === 'string' ? description.trim().substring(0, 256) : '',
      modelsList: val.sanitizedModelsList,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    ComboModel.save(combo);
    return { valid: true, combo };
  }

  static updateCombo(id, { name, strategy, description, modelsList }) {
    const existing = ComboModel.getById(id);
    if (!existing) return { valid: false, status: 404, error: 'Combo not found' };

    const val = this.validateComboInput(name, modelsList, id);
    if (!val.valid) return val;

    const validStrategies = ['Fallback', 'Round Robin', 'Lowest Latency', 'Weighted'];
    const targetStrategy = validStrategies.includes(strategy) ? strategy : existing.strategy;

    const updated = {
      ...existing,
      name: val.trimmedName,
      strategy: targetStrategy,
      description: typeof description === 'string' ? description.trim().substring(0, 256) : existing.description,
      modelsList: val.sanitizedModelsList,
      updatedAt: new Date().toISOString()
    };
    ComboModel.save(updated);
    return { valid: true, combo: updated };
  }
}

module.exports = ModelComboService;

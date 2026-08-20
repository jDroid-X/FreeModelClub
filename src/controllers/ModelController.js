/**
 * ModelController.js
 * Purpose: Controller for AI Models and Model Combos (< 150 lines).
 * Dependencies: AIModel, ComboModel, ModelFamilyService, ModelComboService
 */

const AIModel = require('../models/AIModel');
const ComboModel = require('../models/ComboModel');
const ModelFamilyService = require('../services/ModelFamilyService');
const ModelComboService = require('../services/ModelComboService');

class ModelController {
  static getAll(req, res) {
    try {
      const models = AIModel.getAll().map(m => {
        const fam = ModelFamilyService.getHeadFamily(m.family, m.modelId || m.id);
        const skl = ModelFamilyService.getSkillCategory(m.coreSkill, m.modelId || m.id);
        return { ...m, family: fam.headFamilyName, headFamilyId: fam.headFamilyId, coreSkill: skl.categoryName, skillCategoryId: skl.categoryId, skillSubLevel1: skl.subLevel1 };
      });
      return res.json({ success: true, models });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static getActive(req, res) {
    try { return res.json({ success: true, models: AIModel.getActiveModels() }); }
    catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static getByFamily(req, res) {
    try {
      const familyGroups = ModelFamilyService.groupModelsByFamily(AIModel.getAll());
      const groups = Object.keys(familyGroups).map(familyName => ({ familyName, headFamilyId: familyGroups[familyName][0]?.headFamilyId || 'other', models: familyGroups[familyName] }));
      return res.json({ success: true, families: familyGroups, groups });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static getBySkill(req, res) {
    try {
      const skillGroups = ModelFamilyService.groupModelsByCoreSkill(AIModel.getAll());
      const groups = Object.keys(skillGroups).map(skillName => ({ skillName, skillCategoryId: skillGroups[skillName][0]?.skillCategoryId || 'general', models: skillGroups[skillName] }));
      return res.json({ success: true, skills: skillGroups, groups });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static getTaxonomy(req, res) {
    try {
      const pyramid = ModelFamilyService.buildFullTaxonomy(AIModel.getAll(), [], ComboModel.getAll());
      return res.json({ success: true, ...pyramid });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static recalculateCoreSkills(req, res) {
    try {
      const allModels = AIModel.getAll();
      const updated = allModels.map((m) => {
        const fam = ModelFamilyService.getHeadFamily(m.family, m.modelId || m.id);
        const skl = ModelFamilyService.getSkillCategory(m.coreSkill, m.modelId || m.id);
        return {
          ...m,
          family: fam.headFamilyName,
          headFamilyId: fam.headFamilyId,
          coreSkill: skl.categoryName,
          skillCategoryId: skl.categoryId,
          skillSubLevel1: skl.subLevel1
        };
      });

      AIModel.saveBatch(updated);
      return res.json({ success: true, count: updated.length, models: updated });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  static toggleStatus(req, res) {
    try {
      const model = AIModel.getById(req.params.id);
      if (!model) return res.status(404).json({ success: false, error: 'Model not found' });
      const updated = AIModel.update(model.id, { status: model.status === 'Active' ? 'Inactive' : 'Active' });
      return res.json({ success: true, model: updated });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static updateModel(req, res) {
    try {
      const updated = AIModel.update(req.params.id, req.body || {});
      if (!updated) return res.status(404).json({ success: false, error: 'Model not found' });
      return res.json({ success: true, model: updated });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static batchUpdateModels(req, res) {
    try {
      const { modelIds, updates } = req.body || {};
      if (!Array.isArray(modelIds) || modelIds.length === 0) {
        return res.status(400).json({ success: false, error: 'Validation Error: modelIds array is required.' });
      }
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ success: false, error: 'Validation Error: updates object is required.' });
      }
      const result = AIModel.updateBatch(modelIds, updates);
      return res.json({ success: true, count: result.count, updated: result.updated });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static validateModelSelection(req, res) {
    try {
      const { modelIds } = req.body || {};
      if (!Array.isArray(modelIds) || modelIds.length === 0) {
        return res.status(400).json({ success: false, error: 'Validation Error: modelIds array is required.' });
      }

      const allModels = AIModel.getAll();
      const selected = modelIds.map(id => allModels.find(m => m.id === id || m.modelId === id)).filter(Boolean);
      
      const ProviderModel = require('../models/ProviderModel');
      const activeProviders = ProviderModel.getActiveProviders();
      const activeProviderIds = new Set(activeProviders.map(p => p.id));

      const issues = [];
      const suggestions = [];

      // 1. Check inactive/sleeping providers
      const inactiveProviderModels = selected.filter(m => !activeProviderIds.has(m.providerId));
      if (inactiveProviderModels.length > 0) {
        issues.push({
          type: 'warning',
          code: 'INACTIVE_PROVIDER_MODELS',
          message: `${inactiveProviderModels.length} selected model(s) belong to inactive/sleeping providers (${inactiveProviderModels.map(m => m.providerId).join(', ')}).`
        });
      }

      // 2. Check context window variance
      const contextWindows = selected.map(m => m.contextWindow || 128000);
      const minContext = Math.min(...contextWindows);
      const maxContext = Math.max(...contextWindows);
      if (maxContext / minContext >= 8) {
        issues.push({
          type: 'info',
          code: 'CONTEXT_WINDOW_DISPARITY',
          message: `Large context window variance detected (${(minContext/1000).toFixed(0)}k to ${(maxContext/1000).toFixed(0)}k). Load balancer will clamp payloads to lowest context limit (${(minContext/1000).toFixed(0)}k).`
        });
      }

      // 3. Provider rate limit compounding check
      const providerFrequency = {};
      selected.forEach(m => {
        providerFrequency[m.providerId] = (providerFrequency[m.providerId] || 0) + 1;
      });
      for (const [pId, freq] of Object.entries(providerFrequency)) {
        if (freq >= 3 && pId !== 'ollama') {
          suggestions.push({
            type: 'suggestion',
            code: 'PROVIDER_CONCENTRATION',
            message: `Selected ${freq} models from provider '${pId}'. Consider diversifying across other active providers (e.g. OpenRouter, Gemini) to prevent RPM quota exhaustion.`
          });
        }
      }

      return res.json({
        success: true,
        isValid: issues.filter(i => i.type === 'error').length === 0,
        modelCount: selected.length,
        minContextWindow: minContext,
        maxContextWindow: maxContext,
        issues,
        suggestions
      });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static testModel(req, res) {
    try {
      const model = AIModel.getById(req.params.id);
      if (!model) return res.status(404).json({ success: false, error: 'Model not found' });
      return res.json({ success: true, status: 'reachable', model });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  // ─── COMBO ENDPOINTS ─────────────────────────────────────────────
  static getCombos(req, res) {
    try { return res.json({ success: true, combos: ComboModel.getAll() }); }
    catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static saveCombo(req, res) {
    try {
      if (!req.body || !req.body.name) {
        return res.status(400).json({ success: false, error: 'Validation Error: Combo name is required.' });
      }
      if (req.body.modelsList && !Array.isArray(req.body.modelsList)) {
        return res.status(400).json({ success: false, error: 'Validation Error: modelsList must be an array.' });
      }
      if (Array.isArray(req.body.modelsList) && req.body.modelsList.length === 0) {
        return res.status(400).json({ success: false, error: 'Validation Error: Combo must contain at least 1 model.' });
      }
      const result = ModelComboService.createCombo(req.body);
      if (!result.valid) return res.status(result.status || 400).json({ success: false, error: result.error });
      return res.json({ success: true, combo: result.combo });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static updateCombo(req, res) {
    try {
      if (!req.body) {
        return res.status(400).json({ success: false, error: 'Validation Error: Request body is empty.' });
      }
      if (req.body.modelsList && !Array.isArray(req.body.modelsList)) {
        return res.status(400).json({ success: false, error: 'Validation Error: modelsList must be an array.' });
      }
      if (Array.isArray(req.body.modelsList) && req.body.modelsList.length === 0) {
        return res.status(400).json({ success: false, error: 'Validation Error: Combo must contain at least 1 model.' });
      }
      const result = ModelComboService.updateCombo(req.params.id, req.body);
      if (!result.valid) return res.status(result.status || 400).json({ success: false, error: result.error });
      return res.json({ success: true, combo: result.combo });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static toggleComboStatus(req, res) {
    try {
      const combo = ComboModel.toggle(req.params.id);
      if (!combo) return res.status(404).json({ success: false, error: 'Combo not found' });
      return res.json({ success: true, combo });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static deleteCombo(req, res) {
    try {
      const existing = ComboModel.getById(req.params.id);
      if (!existing) return res.status(404).json({ success: false, error: 'Combo not found' });
      ComboModel.delete(req.params.id);
      return res.json({ success: true });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static getComboUsage(req, res) {
    try {
      const combo = ComboModel.getById(req.params.id);
      if (!combo) return res.status(404).json({ success: false, error: 'Combo not found' });
      return res.json({ success: true, comboId: combo.id, name: combo.name, modelsList: combo.modelsList || [], strategy: combo.strategy, isActive: combo.isActive });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static testCombo(req, res) {
    try {
      const combo = ComboModel.getById(req.params.id);
      if (!combo) return res.status(404).json({ success: false, error: 'Combo not found' });
      const pooledModels = AIModel.getAll().filter(m => (combo.modelsList || []).includes(m.id));
      return res.json({ success: true, comboId: combo.id, name: combo.name, strategy: combo.strategy, pooledModelCount: pooledModels.length, pooledModels: pooledModels.map(m => ({ id: m.id, modelId: m.modelId, modelName: m.modelName, status: m.status })) });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static async deleteModel(req, res) {
    try {
      const { id } = req.params;
      const cleanId = decodeURIComponent(id);
      const success = AIModel.delete(cleanId);
      if (success) {
        res.status(200).json({ success: true, message: 'Model deleted successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Model not found' });
      }
    } catch (err) {
      const Logger = require('../utils/Logger');
      Logger.error('Error deleting model', err);
      res.status(500).json({ success: false, message: 'Failed to delete model' });
    }
  }
}

module.exports = ModelController;
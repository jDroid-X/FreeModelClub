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
      const result = ModelComboService.createCombo(req.body || {});
      if (!result.valid) return res.status(result.status || 400).json({ success: false, error: result.error });
      return res.json({ success: true, combo: result.combo });
    } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
  }

  static updateCombo(req, res) {
    try {
      const result = ModelComboService.updateCombo(req.params.id, req.body || {});
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
}

module.exports = ModelController;
/**
 * ModelFamilyService.js
 * Purpose: Classifies models into Head Families and 7 Skill Categories with 3-level sub-hierarchy.
 *          Uses data/taxonomy.json as single source of truth for pyramid linkage.
 * Dependencies: data/taxonomy.json
 */

const fs = require('fs');
const path = require('path');

class ModelFamilyService {
  static _taxonomy = null;

  static getTaxonomy() {
    if (!this._taxonomy) {
      try {
        const raw = fs.readFileSync(path.join(__dirname, '../../data/taxonomy.json'), 'utf8');
        this._taxonomy = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to load taxonomy.json:', e.message);
        this._taxonomy = { skillCategories: [], headFamilies: [] };
      }
    }
    return this._taxonomy;
  }

  // ─── HEAD FAMILY CLASSIFICATION ────────────────────────────────────
  static getHeadFamily(rawFamily, modelId) {
    const s = `${rawFamily || ''} ${modelId || ''}`.toLowerCase();
    const tax = this.getTaxonomy();

    for (const hf of tax.headFamilies) {
      if (hf.id === 'other') continue;
      // Check excludeKeywords first
      if (hf.excludeKeywords && hf.excludeKeywords.some(ek => s.includes(ek))) continue;
      if (hf.matchKeywords.some(kw => s.includes(kw))) {
        return { headFamilyId: hf.id, headFamilyName: hf.name, vendor: hf.vendor, icon: hf.icon, variants: hf.variants };
      }
    }
    const other = tax.headFamilies.find(f => f.id === 'other') || { id: 'other', name: 'Other Specialized', vendor: 'Various', icon: '🔬', variants: [] };
    return { headFamilyId: other.id, headFamilyName: other.name, vendor: other.vendor, icon: other.icon, variants: other.variants };
  }

  // Backward-compatible alias
  static getMasterFamilyName(family, modelId) {
    return this.getHeadFamily(family, modelId).headFamilyName;
  }

  // ─── 7 SKILL CATEGORY CLASSIFICATION ──────────────────────────────
  static getSkillCategory(rawSkill, modelId) {
    const s = `${rawSkill || ''} ${modelId || ''}`.toLowerCase();
    const tax = this.getTaxonomy();

    // Priority order: safety > vision > coding > reasoning > fast_chat > enterprise > general
    const priorityOrder = ['safety', 'vision', 'coding', 'reasoning', 'fast_chat', 'enterprise', 'general'];

    for (const catId of priorityOrder) {
      const cat = tax.skillCategories.find(c => c.id === catId);
      if (!cat) continue;
      if (cat.matchKeywords.some(kw => s.includes(kw))) {
        // Determine sub-level
        let subLevel1 = null, subLevel2 = null;
        if (cat.subLevels) {
          for (const sl of cat.subLevels) {
            if (sl.keywords.some(kw => s.includes(kw))) {
              subLevel1 = sl.name;
              break;
            }
          }
          if (!subLevel1 && cat.subLevels.length > 0) subLevel1 = cat.subLevels[0].name;
        }
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          icon: cat.icon,
          color: cat.color,
          subLevel1: subLevel1 || cat.subLevels?.[0]?.name || cat.name,
          subLevel2: subLevel2 || null,
          subLevels: cat.subLevels || []
        };
      }
    }

    // Default: General Knowledge & Language
    const gen = tax.skillCategories.find(c => c.id === 'general') || { id: 'general', name: 'General Knowledge & Language', icon: 'fa-comments', color: '#6366f1', subLevels: [] };
    return {
      categoryId: gen.id, categoryName: gen.name, icon: gen.icon, color: gen.color,
      subLevel1: gen.subLevels?.[0]?.name || gen.name, subLevel2: null, subLevels: gen.subLevels || []
    };
  }

  // Backward-compatible alias
  static getMasterSkillName(skill, modelId) {
    return this.getSkillCategory(skill, modelId).categoryName;
  }

  // ─── FULL MODEL CLASSIFICATION ─────────────────────────────────────
  static classifyModel(modelId) {
    const id = (modelId || '').toLowerCase();
    const familyInfo = this.getHeadFamily('', modelId);
    const skillInfo = this.getSkillCategory('', modelId);

    let contextWindow = 32768, defaultLatencyMs = 200;

    if (id.includes('gemini')) { contextWindow = 1000000; defaultLatencyMs = 150; }
    else if (id.includes('llama') && id.includes('70b')) { contextWindow = 128000; defaultLatencyMs = 180; }
    else if (id.includes('llama')) { contextWindow = 128000; defaultLatencyMs = 90; }
    else if (id.includes('deepseek')) { contextWindow = 64000; defaultLatencyMs = 380; }
    else if (id.includes('gpt')) { contextWindow = 128000; defaultLatencyMs = 250; }
    else if (id.includes('nemotron')) { contextWindow = 128000; defaultLatencyMs = 190; }
    else if (id.includes('mixtral') || id.includes('mistral')) { contextWindow = 32768; defaultLatencyMs = 200; }
    else if (id.includes('qwen')) { contextWindow = 32768; defaultLatencyMs = 220; }
    else if (id.includes('gemma')) { contextWindow = 8192; defaultLatencyMs = 120; }

    return {
      family: familyInfo.headFamilyName,
      headFamilyId: familyInfo.headFamilyId,
      coreSkill: skillInfo.categoryName,
      skillCategoryId: skillInfo.categoryId,
      skillSubLevel1: skillInfo.subLevel1,
      contextWindow,
      defaultLatencyMs,
      freeTierLimit: 'Free Tier / Standard',
      description: `${familyInfo.headFamilyName} model classified under ${skillInfo.categoryName}.`
    };
  }

  // ─── GROUPING METHODS (use normalized taxonomy) ────────────────────
  static groupModelsByFamily(modelsList) {
    const groups = {};
    modelsList.forEach(model => {
      const info = this.getHeadFamily(model.family, model.modelId || model.id);
      model.family = info.headFamilyName;
      model.headFamilyId = info.headFamilyId;
      if (!groups[info.headFamilyName]) groups[info.headFamilyName] = [];
      groups[info.headFamilyName].push(model);
    });
    return groups;
  }

  static groupModelsByCoreSkill(modelsList) {
    const groups = {};
    modelsList.forEach(model => {
      const info = this.getSkillCategory(model.coreSkill, model.modelId || model.id);
      model.coreSkill = info.categoryName;
      model.skillCategoryId = info.categoryId;
      model.skillSubLevel1 = info.subLevel1;
      if (!groups[info.categoryName]) groups[info.categoryName] = [];
      groups[info.categoryName].push(model);
    });
    return groups;
  }

  // ─── BUILD FULL TAXONOMY PYRAMID ───────────────────────────────────
  static buildFullTaxonomy(models, providers = [], combos = []) {
    const tax = this.getTaxonomy();
    const normalizedModels = models.map(m => {
      const fam = this.getHeadFamily(m.family, m.modelId || m.id);
      const skl = this.getSkillCategory(m.coreSkill, m.modelId || m.id);
      return { ...m, family: fam.headFamilyName, headFamilyId: fam.headFamilyId, coreSkill: skl.categoryName, skillCategoryId: skl.categoryId, skillSubLevel1: skl.subLevel1 };
    });

    const skillGroups = tax.skillCategories.map(cat => ({
      ...cat,
      skillName: cat.name,
      models: normalizedModels.filter(m => m.skillCategoryId === cat.id)
    }));

    const familyGroups = tax.headFamilies.map(hf => ({
      ...hf,
      familyName: hf.name,
      models: normalizedModels.filter(m => m.headFamilyId === hf.id)
    })).filter(g => g.models.length > 0);

    return {
      models: normalizedModels,
      skillGroups,
      familyGroups,
      providers,
      combos,
      stats: {
        totalModels: normalizedModels.length,
        totalSkillCategories: skillGroups.filter(s => s.models.length > 0).length,
        totalFamilies: familyGroups.length,
        totalProviders: providers.length,
        totalCombos: combos.length
      }
    };
  }
}

module.exports = ModelFamilyService;

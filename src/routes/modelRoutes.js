/**
 * modelRoutes.js
 * Purpose: Model Club API routes (all, active, family view, core skills view)
 */

const express = require('express');
const router = express.Router();
const ModelController = require('../controllers/ModelController');
const FIMController = require('../controllers/FIMController');
const db = require('../models/Database');

router.post('/fim', FIMController.handleFIM);
router.get('/', ModelController.getAll);
router.get('/all', ModelController.getAll);
router.get('/active', ModelController.getActive);
router.get('/family', ModelController.getByFamily);
router.get('/skills', ModelController.getBySkill);
router.get('/taxonomy', ModelController.getTaxonomy);
router.post('/recalculate-core-skills', ModelController.recalculateCoreSkills);
router.post('/batch-update', ModelController.batchUpdateModels);
router.post('/validate-selection', ModelController.validateModelSelection);
router.post('/toggle/:id', ModelController.toggleStatus);

// Get Active Models Cache (Fast endpoint for frontend filtering via in-memory cross-reference)
router.get('/active-cache', (req, res) => {
  try {
    const AIModel = require('../models/AIModel');
    const ProviderModel = require('../models/ProviderModel');
    const allProviders = ProviderModel.getAll(false);
    const activeProviderIds = new Set(allProviders.filter(p => p.isActive && !p.isArchived).map(p => p.id));
    const activeModels = AIModel.getAll().filter(m => m.isActive && activeProviderIds.has(m.providerId)).map(m => m.id);
    res.json({ activeModels, count: activeModels.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', ModelController.updateModel);
router.delete('/:id', ModelController.deleteModel);
router.post('/:id/test', ModelController.testModel);

// Combos Routes
router.get('/combos', ModelController.getCombos);
router.post('/combos', ModelController.saveCombo);
router.put('/combos/:id', ModelController.updateCombo);
router.post('/combos/:id/toggle', ModelController.toggleComboStatus);
router.delete('/combos/:id', ModelController.deleteCombo);
router.get('/combos/:id/usage', ModelController.getComboUsage);
router.post('/combos/:id/test-run', ModelController.testCombo);

module.exports = router;

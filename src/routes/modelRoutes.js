/**
 * modelRoutes.js
 * Purpose: Model Club API routes (all, active, family view, core skills view)
 */

const express = require('express');
const router = express.Router();
const ModelController = require('../controllers/ModelController');

router.get('/', ModelController.getAll);
router.get('/all', ModelController.getAll);
router.get('/active', ModelController.getActive);
router.get('/family', ModelController.getByFamily);
router.get('/skills', ModelController.getBySkill);
router.get('/taxonomy', ModelController.getTaxonomy);
router.post('/toggle/:id', ModelController.toggleStatus);
router.put('/:id', ModelController.updateModel);
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

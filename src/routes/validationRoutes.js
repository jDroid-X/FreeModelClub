/**
 * validationRoutes.js
 * Purpose: Express route handlers for condition checks and validation option resolutions (< 30 lines).
 */

const express = require('express');
const router = express.Router();
const ValidationController = require('../controllers/ValidationController');

router.post('/check', ValidationController.checkCondition);
router.post('/resolve-option', ValidationController.resolveOption);

module.exports = router;

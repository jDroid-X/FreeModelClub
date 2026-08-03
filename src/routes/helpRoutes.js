/**
 * helpRoutes.js
 * Purpose: Routes for User Manual and Screen Hints
 */

const express = require('express');
const router = express.Router();
const HelpController = require('../controllers/HelpController');

router.get('/manual', HelpController.getManual);
router.get('/hints', HelpController.getScreenHints);

module.exports = router;

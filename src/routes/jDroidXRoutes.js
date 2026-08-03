/**
 * jdroidxRoutes.js
 * Purpose: Routes for jDroidX IDE Integration (acting as a local jDroidX server).
 *          Endpoints: /api/tags, /api/chat, /api/generate
 */

const express = require('express');
const router = express.Router();
const jDroidXTranslationService = require('../services/jDroidXTranslationService');

// Map jDroidX standard endpoints
router.get('/tags', jDroidXTranslationService.handleTags);
router.post('/chat', jDroidXTranslationService.handleChat);
router.post('/generate', jDroidXTranslationService.handleGenerate);

// Extra mock endpoint for some jDroidX clients that check version
router.get('/version', (req, res) => res.json({ version: '0.1.48' }));

module.exports = router;

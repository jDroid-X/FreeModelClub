/**
 * openaiRoutes.js
 * Purpose: Standard OpenAI compatible endpoints (/v1/chat/completions, /v1/models, /v1/models/:model, /v1/api)
 *          plus telemetry stats
 */

const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/ChatController');

// OpenAI Standard API Compatible Endpoints
router.post('/chat/completions', ChatController.handleCompletions);
router.get('/models', ChatController.getModelsList);
router.get('/models/:model', ChatController.getSingleModel);
router.get('/api', ChatController.getApiStatus);

// Anthropic API Compatible Endpoints (For Claude Desktop Integration)
const AnthropicTranslationService = require('../services/AnthropicTranslationService');
router.post('/messages', AnthropicTranslationService.handleMessages);

// FMC Server Telemetry & Stats Endpoints
router.get('/dashboard/stats', ChatController.getDashboardStats);
router.get('/header/stats', ChatController.getHeaderStats);

module.exports = router;

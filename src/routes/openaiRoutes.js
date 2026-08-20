/**
 * openaiRoutes.js
 * Purpose: Standard OpenAI compatible endpoints (/v1/chat/completions, /v1/models, /v1/models/:model, /v1/api)
 *          plus telemetry stats
 */

const express = require('express');
const router = express.Router();
const ChatController  = require('../controllers/ChatController');
const DeviceController = require('../controllers/DeviceController');
const AuthController   = require('../controllers/AuthController');

// OpenAI Standard API Compatible Endpoints
router.post('/chat/completions', ChatController.handleCompletions);
router.get('/models', ChatController.getModelsList);
router.get('/models/:model', ChatController.getSingleModel);
router.get('/api', ChatController.getApiStatus);

// Anthropic API Compatible Endpoints (For Claude Desktop Integration)
const AnthropicTranslationService = require('../services/AnthropicTranslationService');
router.post('/messages', AnthropicTranslationService.handleMessages);

// Antigravity-Class Agent Chat Completions Endpoint (Tool Execution Loop)
const PromptOrchestratorService = require('../services/PromptOrchestratorService');
const ToolExecutionLoopService = require('../services/ToolExecutionLoopService');
const ProxyEngineService = require('../services/ProxyEngineService');
const ProviderModel = require('../models/ProviderModel');
const AIModel = require('../models/AIModel');
const ComboModel = require('../models/ComboModel');

router.post('/chat/completions/agent', async (req, res) => {
  try {
    const { model, messages, agentMode, context, temperature, max_tokens } = req.body || {};

    // Resolve target model and provider (reuse ProxyEngineService resolution logic)
    let targetModel = AIModel.getById(model);
    let targetProvider = null;

    // Check combo models
    const combo = ComboModel.getById(model);
    if (combo && combo.isActive && combo.modelsList && combo.modelsList.length > 0) {
      const comboModels = combo.modelsList.map(id => AIModel.getById(id)).filter(m => {
        if (!m || m.status !== 'Active') return false;
        const p = ProviderModel.getById(m.providerId, false);
        return p && p.isActive;
      });
      if (comboModels.length > 0) targetModel = comboModels[0];
    }

    if (!targetModel) {
      const activeModels = AIModel.getActiveModels();
      targetModel = activeModels[0] || { id: model || 'llama-3.3-70b-versatile', modelId: model || 'llama-3.3-70b-versatile', providerId: 'ollama' };
    }

    if (targetModel) {
      targetProvider = ProviderModel.getById(targetModel.providerId, false) || ProviderModel.getAll()[0] || { id: 'ollama', displayName: 'Ollama / Localhost', baseUrl: 'http://127.0.0.1:11434', isActive: true };
    }

    // Build structured prompt via PromptOrchestratorService
    const orchestrated = await PromptOrchestratorService.buildPrompt({
      messages: messages || [],
      userText: (messages && messages.length > 0) ? messages[messages.length - 1].content : '',
      systemPrompt: '',
      workspaceContext: context || {},
      attachments: [],
      agentMode: agentMode || 'Agent',
      maxContextTokens: 4000
    });

    // Execute the Antigravity tool execution loop
    await ToolExecutionLoopService.executeLoop({
      res,
      messages: orchestrated.messages,
      tools: orchestrated.tools,
      targetModel,
      targetProvider,
      requestBody: { temperature: temperature || 0.7, max_tokens: max_tokens || 4096 },
      metadata: orchestrated.metadata
    });

  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: { message: err.message || 'Agent execution failed.', code: 500 } });
    }
  }
});

// FMC Server Telemetry & Stats Endpoints
router.get('/dashboard/stats', ChatController.getDashboardStats);
router.get('/header/stats',    ChatController.getHeaderStats);

// Device Identity Endpoint (BUG-5 fix)
router.get('/api/device', DeviceController.getDevice);

// User Profile Endpoint (BUG-6 fix)
router.get('/api/user/profile', AuthController.getUserProfile);

module.exports = router;

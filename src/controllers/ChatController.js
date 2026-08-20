/**
 * ChatController.js
 * Purpose: Handles OpenAI compatible API endpoints (/v1/chat/completions, /v1/models, /v1/models/:model, /v1/api)
 *          and Playground token telemetry headers
 * Dependencies: ProxyEngineService, AnalyticsService
 */

const ProxyEngineService = require('../services/ProxyEngineService');
const AnalyticsService = require('../services/AnalyticsService');

class ChatController {
  static async handleCompletions(req, res) {
    const authHeader = req.headers['authorization'] || '';
    const apiKey = authHeader.replace(/^Bearer\s+/i, '') || req.headers['x-api-key'] || req.query.api_key || 'direct-ui';

    return await ProxyEngineService.handleChatCompletion(req, res, apiKey);
  }

  static getModelsList(req, res) {
    const response = ProxyEngineService.getOpenAIModelsFormat();
    return res.json(response);
  }

  static getSingleModel(req, res) {
    const { model } = req.params;
    const modelData = ProxyEngineService.getSingleModelFormat(model);
    if (!modelData) {
      return res.status(404).json({ error: { message: `Model '${model}' not found`, code: 404 } });
    }
    return res.json(modelData);
  }

  static getApiStatus(req, res) {
    return res.json({
      status: 'online',
      service: 'FreeModelsClub Localhost Smart Chatbot Proxy',
      version: '1.1.0',
      port: 12247,
      openAiEndpoints: {
        baseUrl: 'http://127.0.0.1:12247/v1',
        models: 'http://127.0.0.1:12247/v1/models',
        chatCompletions: 'http://127.0.0.1:12247/v1/chat/completions'
      },
      timestamp: new Date().toISOString()
    });
  }

  static getHeaderStats(req, res) {
    const modelId = req.query.modelId || null;
    const headerStats = AnalyticsService.getHeaderMetrics(modelId);
    return res.json(headerStats);
  }

  static getDashboardStats(req, res) {
    const summary = AnalyticsService.getDashboardSummary();
    return res.json(summary);
  }
}

module.exports = ChatController;

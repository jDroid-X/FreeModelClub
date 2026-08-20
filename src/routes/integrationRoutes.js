/**
 * integrationRoutes.js
 * Purpose: Integration code snippets, API keys generator, and Memo box URLs API routes
 */

const express = require('express');
const router = express.Router();
const IntegrationController = require('../controllers/IntegrationController');

router.get('/snippets', IntegrationController.getSnippets);
router.get('/keys', IntegrationController.getApiKeys);
router.post('/keys/generate', IntegrationController.generateApiKey);
router.post('/keys/:id/toggle', IntegrationController.toggleApiKeyStatus);
router.post('/keys/:id/rotate', IntegrationController.rotateApiKey);
router.post('/keys/:id/scope', IntegrationController.updateApiKeyScope);
router.delete('/keys/:id', IntegrationController.deleteApiKey);
router.get('/memo-urls', IntegrationController.getMemoUrls);
router.post('/memo-urls', IntegrationController.saveMemoUrls);
router.get('/status', IntegrationController.getConfig);
router.get('/config', IntegrationController.getConfig);
router.put('/config', IntegrationController.saveConfig);
router.post('/auto-inject', IntegrationController.autoInjectConfig);
router.post('/n8n-sync', IntegrationController.n8nSync);
router.post('/master-brain-pipeline', IntegrationController.executeMasterBrainPipeline);
router.get('/master-brain-pipeline', IntegrationController.executeMasterBrainPipeline);

module.exports = router;

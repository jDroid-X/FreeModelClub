/**
 * providerRoutes.js
 * Purpose: Provider registration, ping test, and CRUD API routes
 */

const express = require('express');
const router = express.Router();
const ProviderController = require('../controllers/ProviderController');

router.get('/status', ProviderController.getStatus);
router.get('/all', ProviderController.getAll);
router.post('/test-connection', ProviderController.testConnection);
router.post('/fetch-models', ProviderController.fetchModels);
router.post('/agent-lookup', ProviderController.agentLookup);
router.post('/token-agent/sync-all', ProviderController.syncTokens);
router.post('/register', ProviderController.register);
router.put('/:id', ProviderController.update);
router.get('/archived', ProviderController.getArchived);
router.post('/:id/restore', ProviderController.restore);
router.delete('/:id/permanent', ProviderController.permanentDelete);
router.delete('/:id', ProviderController.delete);

module.exports = router;

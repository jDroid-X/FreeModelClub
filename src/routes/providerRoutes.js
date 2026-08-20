/**
 * providerRoutes.js
 * Purpose: Provider registration, ping test, and CRUD API routes
 */

const express = require('express');
const router = express.Router();
const ProviderController = require('../controllers/ProviderController');

router.get('/', ProviderController.getAll);
router.get('/status', ProviderController.getStatus);
router.get('/all', ProviderController.getAll);
const SelfHealingController = require('../controllers/SelfHealingController');
router.get('/blacklisted/all', SelfHealingController.getBlacklistedProviders);
router.delete('/blacklisted/all', SelfHealingController.unblacklistAllProviders);
router.post('/test-connection', ProviderController.testConnection);
router.post('/fetch-models', ProviderController.fetchModels);
router.post('/agent-lookup', ProviderController.agentLookup);
router.post('/token-agent/sync-all', ProviderController.syncTokens);
router.post('/register', ProviderController.register);
router.post('/:id/sync-limits', ProviderController.syncLimits);
router.post('/:id/update-key', ProviderController.updateKey);
router.put('/:id', ProviderController.update);
router.post('/:id/ping', ProviderController.ping);
router.get('/archived', ProviderController.getArchived);
router.post('/:id/restore', ProviderController.restore);
router.delete('/:id/permanent', ProviderController.permanentDelete);
router.delete('/:id', ProviderController.delete);

module.exports = router;

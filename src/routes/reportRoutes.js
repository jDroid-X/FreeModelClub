/**
 * reportRoutes.js
 * Purpose: API Diagnostic logs & System audit log API endpoints
 */

const express = require('express');
const router = express.Router();
const LogController = require('../controllers/LogController');
const TelemetryController = require('../controllers/TelemetryController');

router.get('/api-logs', LogController.getApiLogs);
router.get('/system-logs', LogController.getSystemLogs);
router.post('/reports', LogController.createReport);
router.get('/reports', LogController.getReports);
router.post('/clear', LogController.clearLogs);
router.get('/telemetry', TelemetryController.getDashboardTelemetry);

module.exports = router;

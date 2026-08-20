/**
 * reportRoutes.js
 * Purpose: API Diagnostic logs & System audit log API endpoints
 */

const express = require('express');
const router = express.Router();
const LogController = require('../controllers/LogController');
const TelemetryController = require('../controllers/TelemetryController');
const ToolTrackingController = require('../controllers/ToolTrackingController');

const AnalyticsService = require('../services/AnalyticsService');

router.get('/api-logs', LogController.getApiLogs);
router.get('/system-logs', LogController.getSystemLogs);
router.get('/summary', (req, res) => res.json(AnalyticsService.getDashboardSummary()));
router.post('/', LogController.createReport);
router.post('/reports', LogController.createReport);
router.post('/feedback', LogController.submitFeedback);
router.get('/', LogController.getReports);
router.get('/reports', LogController.getReports);
router.get('/export', LogController.exportAuditReport);
router.get('/reports/export', LogController.exportAuditReport);
router.post('/clear', LogController.clearLogs);
router.get('/telemetry', TelemetryController.getDashboardTelemetry);

// ── Tool Identification & Conflict Tracking ──
router.get('/active-connections', ToolTrackingController.getActiveConnections);
router.get('/tool-distribution', ToolTrackingController.getToolDistribution);
router.get('/conflict-log', ToolTrackingController.getConflictLog);
router.get('/known-tools', ToolTrackingController.getKnownTools);
router.get('/tool-stats', ToolTrackingController.getToolStats);

router.get('/modelstatus', LogController.getModelStatus);
router.get('/model-status', LogController.getModelStatus);
router.post('/monitoringconfig', LogController.setMonitoringConfig);
router.post('/clear', LogController.clearLogs);
router.post('/logs/clear', LogController.clearLogs);
router.delete('/logs/clear', LogController.clearLogs);

// ── BI Analytical Reporting Routes ──
router.get('/bi-analytics', LogController.getBiAnalytics);
router.get('/bi-mapping', LogController.getBiMapping);
router.post('/bi-mapping', LogController.saveBiMapping);

module.exports = router;

/**
 * LogController.js
 * Purpose: API Diagnostic logs & System audit logs endpoints for Reports tab
 * Dependencies: LogModel
 */

const LogModel = require('../models/LogModel');

class LogController {
  static getApiLogs(req, res) {
    const limit = parseInt(req.query.limit || '100', 10);
    const logs = LogModel.getApiLogs(limit);
    return res.json({
      success: true,
      count: logs.length,
      logs
    });
  }

  static getSystemLogs(req, res) {
    const limit = parseInt(req.query.limit || '100', 10);
    const logs = LogModel.getSystemLogs(limit);
    return res.json({
      success: true,
      count: logs.length,
      logs
    });
  }

  static createReport(req, res) {
    const { context, tileType, details, level, message } = req.body || {};
    if (!context) {
      return res.status(400).json({ success: false, error: 'context is required' });
    }
    const report = LogModel.recordReport({
      category: 'DASHBOARD_REPORT',
      level: level || 'INFO',
      message: message || `Dashboard report for ${context}`,
      details: details || null,
      context: context,
      tileType: tileType || 'generic',
      sourceView: 'dashboard'
    });
    return res.json({ success: true, report });
  }

  static getReports(req, res) {
    const context = req.query.context || null;
    const reports = LogModel.getReports(context);
    return res.json({ success: true, count: reports.length, reports });
  }

  static clearLogs(req, res) {
    const { type } = req.body || {};
    LogModel.clearLogs(type || 'all');
    return res.json({ success: true, message: `Logs (${type || 'all'}) cleared successfully.` });
  }
}

module.exports = LogController;

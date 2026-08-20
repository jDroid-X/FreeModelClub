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

  static submitFeedback(req, res) {
    const { category, description } = req.body || {};
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ success: false, error: 'Description must be at least 10 characters.' });
    }
    
    LogModel.recordSystemLog('FEEDBACK', 'INFO', `User submitted feedback [${category || 'general'}]: ${description.substring(0, 100)}...`);
    
    const report = LogModel.recordReport({
      category: 'USER_FEEDBACK',
      level: 'INFO',
      message: `Feedback Category: ${category}`,
      details: description,
      context: 'AboutView',
      tileType: 'feedback',
      sourceView: 'about'
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
  static async getModelStatus(req, res) {
    const ProviderMonitorAgent = require('../services/ProviderMonitorAgent');
    const data = await ProviderMonitorAgent.getAuditReport();
    return res.json({ success: true, data });
  }

  static async setMonitoringConfig(req, res) {
    const ProviderMonitorAgent = require('../services/ProviderMonitorAgent');
    const { frequencyHours } = req.body || {};
    const data = await ProviderMonitorAgent.setFrequencyHours(frequencyHours);
    return res.json({ success: true, message: `Monitoring interval set to ${frequencyHours} hours`, data });
  }

  static exportAuditReport(req, res) {
    const format = (req.query.format || 'json').toLowerCase();
    const apiLogs = LogModel.getApiLogs(200);
    const systemLogs = LogModel.getSystemLogs(200);
    const reports = LogModel.getReports();

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="FMC_Audit_Report.csv"');
      let csv = 'Type,Timestamp,Model/Source,Status,Tokens/Message\n';
      apiLogs.forEach(l => {
        csv += `"API","${l.timestamp || ''}","${l.model || ''}","${l.status || ''}","${l.totalTokens || 0}"\n`;
      });
      systemLogs.forEach(s => {
        csv += `"SYSTEM","${s.timestamp || ''}","${s.source || ''}","${s.level || ''}","${(s.message || '').replace(/"/g, '""')}"\n`;
      });
      return res.send(csv);
    }

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalApiRequests: apiLogs.length,
        totalSystemEvents: systemLogs.length,
        totalReports: reports.length
      },
      apiLogs,
      systemLogs,
      reports
    });
  }

  static getBiAnalytics(req, res) {
    const AnalyticsService = require('../services/AnalyticsService');
    const report = AnalyticsService.getBIAnalyticalReport();
    return res.json({ success: true, report });
  }

  static getBiMapping(req, res) {
    const AnalyticsService = require('../services/AnalyticsService');
    const mapping = AnalyticsService.getBIMapping();
    return res.json({ success: true, mapping });
  }

  static saveBiMapping(req, res) {
    const AnalyticsService = require('../services/AnalyticsService');
    const mapping = AnalyticsService.saveBIMapping(req.body);
    return res.json({ success: true, mapping });
  }
}

module.exports = LogController;

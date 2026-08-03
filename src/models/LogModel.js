/**
 * LogModel.js
 * Purpose: Diagnostic API logging & System activity logging for root-cause analysis and auditing
 * Dependencies: Database
 */

const db = require('./Database');

class LogModel {
  static getAll() {
    const logs = db.read(db.files.api_logs);
    return logs;
  }

  static getApiLogs(limit = 100) {
    const logs = db.read(db.files.api_logs);
    return logs.slice(-limit).reverse();
  }

  static getSystemLogs(limit = 100) {
    const logs = db.read(db.files.system_logs);
    return logs.slice(-limit).reverse();
  }

  static recordApiLog(entry) {
    const logs = db.read(db.files.api_logs);
    const newLog = {
      id: `api_log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      providerId: entry.providerId || 'unknown',
      providerName: entry.providerName || 'unknown',
      modelId: entry.modelId || 'unknown',
      clientKey: entry.clientKey || 'direct-ui',
      endpoint: entry.endpoint || '/v1/chat/completions',
      promptTokens: entry.promptTokens || 0,
      completionTokens: entry.completionTokens || 0,
      totalTokens: (entry.promptTokens || 0) + (entry.completionTokens || 0),
      latencyMs: entry.latencyMs || 0,
      statusCode: entry.statusCode || 200,
      status: entry.status || 'SUCCESS',
      requestPayload: entry.requestPayload || null,
      responseSummary: entry.responseSummary || '',
      errorDiagnostics: entry.errorDiagnostics || null
    };

    logs.push(newLog);

    // Keep log buffer bounded to max 1000 items
    if (logs.length > 1000) {
      logs.shift();
    }

    db.write(db.files.api_logs, logs);
    return newLog;
  }

  static recordSystemLog(category, level, message, details = null) {
    const logs = db.read(db.files.system_logs);
    const newLog = {
      id: `sys_log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      category: category || 'GENERAL',
      level: level || 'INFO', // INFO, WARN, ERROR, SUCCESS
      message: message,
      details: details
    };

    logs.push(newLog);

    if (logs.length > 1000) {
      logs.shift();
    }

    db.write(db.files.system_logs, logs);
    return newLog;
  }

  static recordReport(entry) {
    const logs = db.read(db.files.system_logs);
    const newLog = {
      id: `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      category: entry.category || 'DASHBOARD_REPORT',
      level: entry.level || 'INFO',
      message: entry.message || 'Dashboard tile report',
      details: entry.details || null,
      context: entry.context || null,
      tileType: entry.tileType || 'generic',
      sourceView: 'dashboard'
    };
    logs.push(newLog);
    if (logs.length > 2000) {
      logs.shift();
    }
    db.write(db.files.system_logs, logs);
    return newLog;
  }

  static getReports(context = null) {
    const logs = db.read(db.files.system_logs);
    let reports = logs.filter(l => l.category === 'DASHBOARD_REPORT' || l.sourceView === 'dashboard');
    if (context) {
      reports = reports.filter(l => l.context === context || l.tileType === context);
    }
    return reports;
  }

  static clearLogs(type = 'all') {
    if (type === 'api' || type === 'all') {
      db.write(db.files.api_logs, []);
    }
    if (type === 'system' || type === 'all') {
      db.write(db.files.system_logs, []);
    }
    return true;
  }
}

module.exports = LogModel;

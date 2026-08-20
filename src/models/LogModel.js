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
      errorDiagnostics: entry.errorDiagnostics || null,
      // Tool identification fields
      toolName: entry.toolName || 'Unknown',
      toolVersion: entry.toolVersion || '',
      toolIcon: entry.toolIcon || 'fa-solid fa-question-circle',
      toolColor: entry.toolColor || '#6B7280',
      clientSessionId: entry.clientSessionId || '',
      comboId: entry.comboId || null,
      // Conflict & Rich Telemetry metadata fields
      conflictFlags: entry.conflictFlags || null,
      strategyUsed: entry.strategyUsed || 'Direct Route',
      selfHealed: entry.selfHealed || false,
      retryAttempts: entry.retryAttempts || 0,
      routingPath: entry.routingPath || [],
      hasImage: entry.hasImage || false,
      routingLatencyMs: entry.routingLatencyMs || 0,
      // NEW: Deep Analytics Fields (added 2026-08-11)
      ttft_ms: entry.ttft_ms || null,              // Time to First Token (ms)
      tokens_per_second: entry.tokens_per_second || null,  // Streaming speed
      ip_address: entry.ip_address || null,        // Client IP for geolocation
      request_size_bytes: entry.request_size_bytes || 0,  // Payload size
      response_size_bytes: entry.response_size_bytes || 0, // Response size
      providerLatencyMs: entry.providerLatencyMs || null, // Provider-specific timing
      failoverReason: entry.failoverReason || null,    // Why failover occurred
      userAgent_full: entry.userAgent_full || null,   // Complete User-Agent string
      cost_estimate: entry.cost_estimate || 0,        // API cost (if paid provider)
      region: entry.region || null,                  // Provider region/geolocation
      modelFamily: entry.modelFamily || null,         // Llama/Mistral/Gemini etc
      contextWindow: entry.contextWindow || null,     // Model context limit
      temperature: entry.temperature || null,         // Request temperature
      maxTokens: entry.maxTokens || null,             // Requested max tokens
      stream: entry.stream || false                   // Streaming flag
    };

    logs.push(newLog);

    // Retain logs for a minimum of 30 days. Hard cap at 2000 items to protect memory in extreme cases.
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    while (logs.length > 0 && (new Date(logs[0].timestamp).getTime() < thirtyDaysAgo || logs.length > 2000)) {
      logs.shift();
    }

    db.write(db.files.api_logs, logs);
    return newLog;
  }

  static lastLogCache = { message: '', rawMessage: '', timestamp: 0, count: 1, logId: null };

  static recordSystemLog(category, level, message, details = null) {
    const logs = db.read(db.files.system_logs);
    const now = Date.now();
    const config = db.read(db.files.config) || {};
    const dedupeEnabled = config.enableLogDeduplication !== false;
    const windowMs = (config.deduplicationWindowMs || 5) * 1000;

    if (dedupeEnabled && this.lastLogCache.rawMessage === message && (now - this.lastLogCache.timestamp) < windowMs && logs.length > 0) {
      this.lastLogCache.count++;
      this.lastLogCache.timestamp = now;
      
      const lastIdx = logs.findIndex(l => l.id === this.lastLogCache.logId);
      if (lastIdx !== -1) {
        logs[lastIdx].timestamp = new Date().toISOString();
        logs[lastIdx].message = `${message} [Repeated ${this.lastLogCache.count}x]`;
        if (details) logs[lastIdx].details = details;
        db.write(db.files.system_logs, logs);
        return logs[lastIdx];
      }
    }

    const newLog = {
      id: `sys_log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      category: category || 'GENERAL',
      level: level || 'INFO', // INFO, WARN, ERROR, SUCCESS
      message: message,
      details: details
    };

    this.lastLogCache = {
      message: newLog.message,
      rawMessage: message,
      timestamp: now,
      count: 1,
      logId: newLog.id
    };

    logs.push(newLog);

    // Retain system logs for a minimum of 30 days. Hard cap at 2000 items to protect memory.
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    while (logs.length > 0 && (new Date(logs[0].timestamp).getTime() < thirtyDaysAgo || logs.length > 2000)) {
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
    // Retain reports for a minimum of 30 days. Hard cap at 2000 items.
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    while (logs.length > 0 && (new Date(logs[0].timestamp).getTime() < thirtyDaysAgo || logs.length > 2000)) {
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
    this.lastLogCache = { message: '', rawMessage: '', timestamp: 0, count: 1, logId: null };
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

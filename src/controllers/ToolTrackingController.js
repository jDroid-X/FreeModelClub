/**
 * ToolTrackingController.js
 * Purpose: API endpoints for tool identification, active connection tracking,
 *          conflict detection, and tool distribution analytics.
 * Dependencies: ActiveConnectionTracker, ToolIdentificationService, LogModel
 */

const ActiveConnectionTracker = require('../services/ActiveConnectionTracker');
const ToolIdentificationService = require('../services/ToolIdentificationService');
const LogModel = require('../models/LogModel');

class ToolTrackingController {
  /**
   * GET /api/reports/active-connections
   * Returns real-time list of all active tool→model connections.
   */
  static getActiveConnections(req, res) {
    const connections = ActiveConnectionTracker.getActiveConnections();
    const byModel = ActiveConnectionTracker.getConnectionsByModel();
    return res.json({
      success: true,
      total: connections.length,
      connections,
      byModel,
      conflictStrategy: ActiveConnectionTracker.getConflictStrategy()
    });
  }

  /**
   * GET /api/reports/tool-distribution
   * Returns aggregated tool usage stats from active connections.
   */
  static getToolDistribution(req, res) {
    const active = ActiveConnectionTracker.getToolDistribution();
    return res.json({
      success: true,
      activeTools: active,
      activeToolCount: Object.keys(active).length
    });
  }

  /**
   * GET /api/reports/conflict-log
   * Returns recent conflict events (when multiple tools hit the same model).
   */
  static getConflictLog(req, res) {
    const limit = parseInt(req.query.limit) || 50;
    const events = ActiveConnectionTracker.getConflictEvents(limit);
    return res.json({
      success: true,
      total: events.length,
      events,
      conflictStrategy: ActiveConnectionTracker.getConflictStrategy()
    });
  }

  /**
   * GET /api/reports/known-tools
   * Returns the list of all known tool signatures (for dashboard dropdowns/filters).
   */
  static getKnownTools(req, res) {
    const tools = ToolIdentificationService.getKnownTools();
    return res.json({ success: true, tools });
  }

  /**
   * GET /api/reports/tool-stats
   * Returns aggregated stats per tool from the api_logs (historical + active).
   * Query params: ?hours=24 (default 24), ?toolName=VSCode-Copilot (optional filter)
   */
  static getToolStats(req, res) {
    const hours = parseInt(req.query.hours) || 24;
    const toolFilter = req.query.toolName || null;
    const cutoff = new Date(Date.now() - hours * 3600 * 1000).toISOString();

    const allLogs = LogModel.getAll();
    const recentLogs = allLogs.filter(l => l.timestamp >= cutoff);

    // Aggregate by toolName
    const stats = {};
    for (const log of recentLogs) {
      const tool = log.toolName || 'Unknown';
      if (toolFilter && tool !== toolFilter) continue;

      if (!stats[tool]) {
        stats[tool] = {
          toolName: tool,
          toolIcon: log.toolIcon || 'fa-solid fa-question-circle',
          toolColor: log.toolColor || '#6B7280',
          totalRequests: 0,
          successCount: 0,
          errorCount: 0,
          totalTokens: 0,
          avgLatencyMs: 0,
          latencySum: 0,
          modelsUsed: new Set(),
          providersUsed: new Set(),
          conflictCount: 0
        };
      }

      const s = stats[tool];
      s.totalRequests++;
      if (log.status === 'SUCCESS' || log.status === 'SUCCESS_FAILOVER') s.successCount++;
      else s.errorCount++;
      s.totalTokens += log.totalTokens || 0;
      s.latencySum += log.latencyMs || 0;
      if (log.modelId) s.modelsUsed.add(log.modelId);
      if (log.providerId) s.providersUsed.add(log.providerId);
      if (log.conflictFlags) s.conflictCount++;
    }

    // Finalize stats (convert Sets to arrays, compute averages)
    const result = Object.values(stats).map(s => ({
      ...s,
      avgLatencyMs: s.totalRequests > 0 ? Math.round(s.latencySum / s.totalRequests) : 0,
      successRate: s.totalRequests > 0 ? Math.round((s.successCount / s.totalRequests) * 100) : 0,
      modelsUsed: [...s.modelsUsed],
      providersUsed: [...s.providersUsed],
      latencySum: undefined
    }));

    // Sort by totalRequests descending
    result.sort((a, b) => b.totalRequests - a.totalRequests);

    return res.json({
      success: true,
      hours,
      toolFilter,
      totalLogs: recentLogs.length,
      toolStats: result
    });
  }
}

module.exports = ToolTrackingController;

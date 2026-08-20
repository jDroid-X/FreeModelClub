/**
 * ActiveConnectionTracker.js
 * Purpose: Tracks which AI tools are actively connected to which models in real-time.
 *          Detects conflicts when multiple tools target the same model/combo simultaneously.
 *          Provides conflict resolution strategies (Allow, Queue, Redirect, Reject).
 * Dependencies: LogModel (for conflict logging), db (for config)
 */

const LogModel = require('../models/LogModel');
const db = require('../models/Database');

class ActiveConnectionTracker {
  /**
   * Active connections map: modelId → Set of connection objects
   * Each connection: { toolId, toolName, clientSessionId, clientKey, comboId, startedAt, requestId }
   */
  static connections = new Map();

  /**
   * Conflict event log (in-memory ring buffer, last 200 events)
   */
  static conflictEvents = [];

  /**
   * Register a new active connection when a request starts.
   * @param {string} modelId - The target model ID
   * @param {Object} toolInfo - Tool identification object from ToolIdentificationService
   * @param {string} clientKey - API key used
   * @param {string} comboId - Combo ID if resolved from a combo, else null
   * @param {string} requestId - Unique request ID
   * @returns {{ conflict: boolean, conflictDetails: Object|null }}
   */
  static startConnection(modelId, toolInfo, clientKey, comboId, requestId) {
    if (!this.connections.has(modelId)) {
      this.connections.set(modelId, new Set());
    }

    const modelConnections = this.connections.get(modelId);
    const existingTools = new Set();
    const existingToolNames = new Set();

    for (const conn of modelConnections) {
      if (conn.clientSessionId !== toolInfo.clientSessionId) {
        existingTools.add(conn.toolId);
        existingToolNames.add(conn.toolName);
      }
    }

    const connection = {
      toolId: toolInfo.toolId,
      toolName: toolInfo.toolName,
      toolVersion: toolInfo.toolVersion,
      toolIcon: toolInfo.toolIcon,
      toolColor: toolInfo.toolColor,
      clientSessionId: toolInfo.clientSessionId,
      clientKey,
      comboId: comboId || null,
      startedAt: Date.now(),
      requestId
    };

    modelConnections.add(connection);

    // Detect conflict: different tools hitting the same model
    const conflict = existingTools.size > 0 && !existingTools.has(toolInfo.toolId);
    let conflictDetails = null;

    if (conflict) {
      conflictDetails = {
        modelId,
        concurrentTools: [...existingToolNames, toolInfo.toolName],
        concurrentToolCount: existingToolNames.size + 1,
        primaryTool: [...existingToolNames][0],
        conflictingTool: toolInfo.toolName
      };

      this._recordConflict(conflictDetails, comboId);
    }

    return { conflict, conflictDetails };
  }

  /**
   * Remove a connection when a request completes.
   * @param {string} modelId
   * @param {string} clientSessionId
   */
  static endConnection(modelId, clientSessionId) {
    const modelConnections = this.connections.get(modelId);
    if (!modelConnections) return;

    for (const conn of modelConnections) {
      if (conn.clientSessionId === clientSessionId) {
        modelConnections.delete(conn);
        break;
      }
    }

    // Clean up empty model entries
    if (modelConnections.size === 0) {
      this.connections.delete(modelId);
    }
  }

  /**
   * Get all active connections (for dashboard display).
   * @returns {Array<Object>} Flat array of connections with modelId added
   */
  static getActiveConnections() {
    const result = [];
    for (const [modelId, conns] of this.connections) {
      for (const conn of conns) {
        result.push({ ...conn, modelId, durationMs: Date.now() - conn.startedAt });
      }
    }
    return result;
  }

  /**
   * Get active connections grouped by model.
   * @returns {Object} { modelId: [connections...] }
   */
  static getConnectionsByModel() {
    const result = {};
    for (const [modelId, conns] of this.connections) {
      result[modelId] = [...conns].map(c => ({
        ...c,
        durationMs: Date.now() - c.startedAt
      }));
    }
    return result;
  }

  /**
   * Get tool distribution stats from active connections.
   * @returns {Object} { toolId: { toolName, toolIcon, toolColor, activeCount, models: [...] } }
   */
  static getToolDistribution() {
    const dist = {};
    for (const [modelId, conns] of this.connections) {
      for (const conn of conns) {
        if (!dist[conn.toolId]) {
          dist[conn.toolId] = {
            toolId: conn.toolId,
            toolName: conn.toolName,
            toolIcon: conn.toolIcon,
            toolColor: conn.toolColor,
            activeCount: 0,
            models: []
          };
        }
        dist[conn.toolId].activeCount++;
        if (!dist[conn.toolId].models.includes(modelId)) {
          dist[conn.toolId].models.push(modelId);
        }
      }
    }
    return dist;
  }

  /**
   * Check if a specific model has active connections from multiple tools.
   * @param {string} modelId
   * @returns {{ hasConflict: boolean, toolCount: number, tools: string[] }}
   */
  static checkConflict(modelId) {
    const modelConnections = this.connections.get(modelId);
    if (!modelConnections || modelConnections.size <= 1) {
      return { hasConflict: false, toolCount: modelConnections ? modelConnections.size : 0, tools: [] };
    }

    const uniqueTools = new Set();
    for (const conn of modelConnections) {
      uniqueTools.add(conn.toolName);
    }

    return {
      hasConflict: uniqueTools.size > 1,
      toolCount: uniqueTools.size,
      tools: [...uniqueTools]
    };
  }

  /**
   * Get the configured conflict resolution strategy.
   * Reads from config.json → conflict_resolution_strategy
   * @returns {string} 'allow' | 'queue' | 'redirect' | 'reject'
   */
  static getConflictStrategy() {
    try {
      const config = db.read(db.files.config);
      return config.conflict_resolution_strategy || 'allow';
    } catch {
      return 'allow';
    }
  }

  /**
   * Handle a conflict based on configured strategy.
   * @param {string} modelId
   * @param {Object} toolInfo
   * @param {Array} comboModels - All models in the combo for redirect
   * @returns {{ action: string, redirectModel?: Object, waitMs?: number, rejectReason?: string }}
   */
  static resolveConflict(modelId, toolInfo, comboModels = []) {
    const strategy = this.getConflictStrategy();

    switch (strategy) {
      case 'queue':
        // Make the conflicting request wait 2 seconds
        return { action: 'queue', waitMs: 2000 };

      case 'redirect':
        // Find another model in the combo that isn't contested
        if (comboModels.length > 1) {
          const available = comboModels.find(m => {
            const conns = this.connections.get(m.id);
            if (!conns || conns.size === 0) return true;
            const tools = new Set([...conns].map(c => c.toolId));
            return !tools.has(toolInfo.toolId);
          });
          if (available) {
            return { action: 'redirect', redirectModel: available };
          }
        }
        // Fallback: allow if no redirect target
        return { action: 'allow' };

      case 'reject':
        return { action: 'reject', rejectReason: `Model '${modelId}' is busy with another tool. Try again later.` };

      case 'allow':
      default:
        return { action: 'allow' };
    }
  }

  /**
   * Get recent conflict events (for dashboard timeline).
   * @param {number} limit
   */
  static getConflictEvents(limit = 50) {
    return this.conflictEvents.slice(-limit).reverse();
  }

  /**
   * Record a conflict event.
   * @private
   */
  static _recordConflict(details, comboId) {
    const event = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      modelId: details.modelId,
      comboId: comboId || null,
      concurrentTools: details.concurrentTools,
      concurrentToolCount: details.concurrentToolCount,
      primaryTool: details.primaryTool,
      conflictingTool: details.conflictingTool,
      strategy: this.getConflictStrategy()
    };

    this.conflictEvents.push(event);

    // Ring buffer: keep last 200
    if (this.conflictEvents.length > 200) {
      this.conflictEvents.shift();
    }

    // Also log to system logs
    LogModel.recordSystemLog(
      'TOOL_CONFLICT',
      'WARN',
      `Tool conflict detected: '${details.conflictingTool}' targeting model '${details.modelId}' already in use by '${details.primaryTool}' [Strategy: ${event.strategy}]`,
      { concurrentTools: details.concurrentTools, comboId }
    );
  }

  /**
   * Clear all tracked connections (e.g., on server restart cleanup).
   */
  static clearAll() {
    this.connections.clear();
    this.conflictEvents = [];
  }
}

module.exports = ActiveConnectionTracker;

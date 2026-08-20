/**
 * LogRotationService.js
 * Purpose: Daily log rotation & archival for api_logs and system_logs.
 *          Splits large monolithic log arrays into daily files, keeping only the
 *          last 7 days in the Database warm cache. Archives older logs to data/backups/logs/.
 * Dependencies: Database, fs, path
 */

const fs = require('fs');
const path = require('path');
const db = require('../models/Database');

class LogRotationService {
  constructor() {
    this.backupDir = path.join(db.dataDir, 'backups', 'logs');
    this._ensureDir(this.backupDir);
    this.RETENTION_DAYS = 7;       // Keep this many days in warm cache
    this.ARCHIVE_DAYS = 30;        // Archive (don't delete) logs older than this
    this.MAX_ITEMS_PER_TABLE = 2000; // Hard cap per table (matches LogModel)
  }

  _ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Get ISO date string (YYYY-MM-DD) from a timestamp or ISO string.
   * @param {string|number} ts - Timestamp or ISO date string
   * @returns {string} Date in YYYY-MM-DD format
   */
  _toDateKey(ts) {
    try {
      const d = new Date(ts);
      return d.toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Rotate logs for a given table (api_logs or system_logs).
   * - Groups entries by date
   * - Archives entries older than RETENTION_DAYS to daily JSON files in backups/logs/
   * - Keeps only recent entries in the main table
   * - Enforces MAX_ITEMS_PER_TABLE hard cap
   * @param {string} tableKey - 'api_logs' or 'system_logs'
   * @returns {{ archived: number, retained: number, files: string[] }}
   */
  rotate(tableKey) {
    const filePath = db.files[tableKey];
    if (!filePath) {
      console.error(`[LogRotation] Unknown table key: ${tableKey}`);
      return { archived: 0, retained: 0, files: [] };
    }

    const allLogs = db.read(filePath);
    if (!Array.isArray(allLogs) || allLogs.length === 0) {
      return { archived: 0, retained: allLogs ? allLogs.length : 0, files: [] };
    }

    const now = Date.now();
    const cutoffMs = now - (this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const recentLogs = [];
    const archiveBuckets = new Map(); // dateKey → [logs]
    const archivedFiles = [];

    // Partition: recent vs archive
    for (const log of allLogs) {
      const logTime = new Date(log.timestamp).getTime();
      if (logTime >= cutoffMs) {
        recentLogs.push(log);
      } else {
        const dateKey = this._toDateKey(log.timestamp);
        if (!archiveBuckets.has(dateKey)) {
          archiveBuckets.set(dateKey, []);
        }
        archiveBuckets.get(dateKey).push(log);
      }
    }

    // Write archive files (one per day)
    for (const [dateKey, logs] of archiveBuckets) {
      const archiveFile = path.join(this.backupDir, `${tableKey}_${dateKey}.json`);
      try {
        // Merge with existing archive file if it exists
        let existing = [];
        if (fs.existsSync(archiveFile)) {
          try {
            existing = JSON.parse(fs.readFileSync(archiveFile, 'utf8'));
          } catch (e) { existing = []; }
        }
        const merged = [...existing, ...logs];
        // Deduplicate by log ID
        const seen = new Set();
        const deduped = merged.filter(l => {
          if (seen.has(l.id)) return false;
          seen.add(l.id);
          return true;
        });
        fs.writeFileSync(archiveFile, JSON.stringify(deduped, null, 2), 'utf8');
        archivedFiles.push(archiveFile);
      } catch (err) {
        console.error(`[LogRotation] Failed to write archive ${archiveFile}:`, err.message);
      }
    }

    // Enforce hard cap on retained logs
    const capped = recentLogs.length > this.MAX_ITEMS_PER_TABLE
      ? recentLogs.slice(-this.MAX_ITEMS_PER_TABLE)
      : recentLogs;

    // Update the main table with only recent logs
    const archivedCount = allLogs.length - capped.length;
    if (archivedCount > 0) {
      db.write(filePath, capped);
      console.log(`[LogRotation] ${tableKey}: Archived ${archivedCount} entries (${archiveBuckets.size} daily files). Retained ${capped.length} entries.`);
    }

    return {
      archived: archivedCount,
      retained: capped.length,
      files: archivedFiles
    };
  }

  /**
   * Rotate both api_logs and system_logs.
   * @returns {{ api_logs: Object, system_logs: Object }}
   */
  rotateAll() {
    return {
      api_logs: this.rotate('api_logs'),
      system_logs: this.rotate('system_logs')
    };
  }

  /**
   * Clean up archive files older than ARCHIVE_DAYS.
   * @returns {number} Number of deleted archive files
   */
  cleanupOldArchives() {
    const cutoffMs = Date.now() - (this.ARCHIVE_DAYS * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    try {
      const files = fs.readdirSync(this.backupDir);
      for (const file of files) {
        // Extract date from filename: api_logs_2026-08-01.json
        const dateMatch = file.match(/_(\d{4}-\d{2}-\d{2})\.json$/);
        if (dateMatch) {
          const fileDate = new Date(dateMatch[1]).getTime();
          if (fileDate < cutoffMs) {
            fs.unlinkSync(path.join(this.backupDir, file));
            deletedCount++;
          }
        }
      }
    } catch (err) {
      console.error('[LogRotation] Archive cleanup error:', err.message);
    }

    if (deletedCount > 0) {
      console.log(`[LogRotation] Cleaned up ${deletedCount} archive files older than ${this.ARCHIVE_DAYS} days.`);
    }
    return deletedCount;
  }

  /**
   * Get summary statistics for log storage.
   * @returns {{ api_logs: Object, system_logs: Object, archiveFiles: number }}
   */
  getStats() {
    const apiLogs = db.read(db.files.api_logs);
    const sysLogs = db.read(db.files.system_logs);
    let archiveFileCount = 0;

    try {
      archiveFileCount = fs.readdirSync(this.backupDir).filter(f => f.endsWith('.json')).length;
    } catch (e) {}

    return {
      api_logs: {
        count: Array.isArray(apiLogs) ? apiLogs.length : 0,
        oldestEntry: Array.isArray(apiLogs) && apiLogs.length > 0 ? apiLogs[0].timestamp : null,
        newestEntry: Array.isArray(apiLogs) && apiLogs.length > 0 ? apiLogs[apiLogs.length - 1].timestamp : null
      },
      system_logs: {
        count: Array.isArray(sysLogs) ? sysLogs.length : 0,
        oldestEntry: Array.isArray(sysLogs) && sysLogs.length > 0 ? sysLogs[0].timestamp : null,
        newestEntry: Array.isArray(sysLogs) && sysLogs.length > 0 ? sysLogs[sysLogs.length - 1].timestamp : null
      },
      archiveFiles: archiveFileCount,
      retentionDays: this.RETENTION_DAYS,
      archiveDays: this.ARCHIVE_DAYS
    };
  }
}

module.exports = new LogRotationService();

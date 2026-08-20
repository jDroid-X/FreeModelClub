/**
 * SelfHealingController.js
 * Purpose: Controller handling playground self-healing AI Agent endpoints:
 *          POST /api/playground/self-heal/detect
 *          POST /api/playground/self-heal/apply
 */

const SelfHealingService = require('../services/SelfHealingService');

class SelfHealingController {
  static detect(req, res) {
    try {
      const { text = '', attachments = [], tokenBalancePercent = 100 } = req.body;
      const intentInfo = SelfHealingService.detectIntentAndContext(text, attachments, tokenBalancePercent);
      let payload = null;

      if (intentInfo.mode === 'self_heal') {
        payload = SelfHealingService.generateSelfHealingPayload(text, attachments);
      }

      return res.json({
        success: true,
        intent: intentInfo,
        payload
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static apply(req, res) {
    try {
      const { filePath, patchCode, confirmed = false } = req.body;
      const result = SelfHealingService.applySelfHealingPatch(filePath, patchCode, confirmed);
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static createFolder(req, res) {
    try {
      const { targetPath } = req.body;
      const result = SelfHealingService.createLocalFolder(targetPath);
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async selectWorkspaceFolder(req, res) {
    try {
      const result = await SelfHealingService.selectWorkspaceFolder();
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async selectLocalFile(req, res) {
    try {
      const result = await SelfHealingService.selectLocalFile();
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async runWebSearch(req, res) {
    const AntigravityEngine = require('../services/AntigravityToolExecutionEngine');
    const result = await AntigravityEngine.executeWebSearch(req.body.query);
    return res.json(result);
  }

  static async runYouTubeTranscript(req, res) {
    const AntigravityEngine = require('../services/AntigravityToolExecutionEngine');
    const result = await AntigravityEngine.extractYouTubeTranscript(req.body.url);
    return res.json(result);
  }

  static async generateImageArtifact(req, res) {
    const AntigravityEngine = require('../services/AntigravityToolExecutionEngine');
    const result = await AntigravityEngine.generateImage(req.body.prompt, req.body.imageName);
    return res.json(result);
  }

  static saveCodeFile(req, res) {
    const AntigravityEngine = require('../services/AntigravityToolExecutionEngine');
    const result = AntigravityEngine.saveCodeToFile(req.body.targetPath, req.body.codeContent);
    return res.json(result);
  }

  static readFileContent(req, res) {
    try {
      const fs = require('fs');
      const filePath = req.body.filePath;
      if (!filePath) return res.json({ success: false, error: 'No file path provided' });
      if (!fs.existsSync(filePath)) return res.json({ success: false, error: 'File not found: ' + filePath });
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) return res.json({ success: false, error: 'Target is a directory, not a file' });
      const content = fs.readFileSync(filePath, 'utf-8');
      const ext = (filePath.match(/\.[^.]+$/) || [''])[0].replace('.', '');
      return res.json({ success: true, content, extension: ext, size: stat.size, lastModified: stat.mtime });
    } catch (err) {
      return res.json({ success: false, error: err.message });
    }
  }

  static async runPowerShell(req, res) {
    const AntigravityEngine = require('../services/AntigravityToolExecutionEngine');
    const result = await AntigravityEngine.executePowerShellCommand(req.body.commandLine);
    return res.json(result);
  }

  static extractImageText(req, res) {
    const AntigravityEngine = require('../services/AntigravityToolExecutionEngine');
    const result = AntigravityEngine.extractTextFromImageData(req.body.base64Data);
    return res.json(result);
  }

  static async browseLocalPath(req, res) {
    const fs = require('fs');
    const path = require('path');
    let rawTarget = req.body.targetPath || process.cwd();
    
    let target;
    try {
      target = path.resolve(rawTarget);
    } catch (e) {
      return res.json({ success: false, error: 'Invalid path format.' });
    }

    try {
      if (!fs.existsSync(target)) {
        return res.json({ success: false, error: 'Path does not exist: ' + target });
      }
      
      const stat = fs.statSync(target);
      if (!stat.isDirectory()) {
        return res.json({ success: false, error: 'Target is not a directory: ' + target });
      }
      
      const items = fs.readdirSync(target, { withFileTypes: true });
      const parent = path.dirname(target);
      
      const result = [];
      for (const item of items) {
        let isDir = false;
        try {
          isDir = item.isDirectory();
        } catch (e) {}
        
        // Skip hidden/system files to keep it clean unless requested
        if (item.name.startsWith('$') || item.name.startsWith('.')) continue;
        
        result.push({
          name: item.name,
          isDir: isDir,
          path: path.join(target, item.name)
        });
      }
      
      // Sort: directories first, then files
      result.sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });
      
      return res.json({
        success: true,
        currentPath: target,
        parentPath: parent !== target ? parent : null,
        items: result
      });
    } catch (err) {
      // Gracefully handle EPERM or EACCES (Permission Denied)
      if (err.code === 'EPERM' || err.code === 'EACCES') {
        return res.json({ success: false, error: 'Permission denied accessing directory: ' + target });
      }
      return res.json({ success: false, error: err.message });
    }
  }

  static getBlacklistedProviders(req, res) {
    const ProxyEngineService = require('../services/ProxyEngineService');
    const db = require('../models/Database');
    const config = db.read(db.files.config) || {};
    const blacklisted = ProxyEngineService.getBlacklistedStatus();
    return res.json({
      success: true,
      sleepMinutes: config.blacklistSleepMinutes || ProxyEngineService.blacklistSleepMinutes || 30,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 3,
      enableLogDeduplication: config.enableLogDeduplication !== false,
      maxFailoverAttempts: config.max_failover_attempts || 3,
      blacklisted
    });
  }

  static unblacklistProvider(req, res) {
    const ProxyEngineService = require('../services/ProxyEngineService');
    const { providerId } = req.body;
    const ok = ProxyEngineService.unblacklistProvider(providerId);
    return res.json({ success: ok });
  }

  static unblacklistAllProviders(req, res) {
    const ProxyEngineService = require('../services/ProxyEngineService');
    const ok = ProxyEngineService.unblacklistAllProviders();
    return res.json({ success: ok });
  }

  static setBlacklistConfig(req, res) {
    const ProxyEngineService = require('../services/ProxyEngineService');
    const db = require('../models/Database');
    const config = db.read(db.files.config) || {};
    const { sleepMinutes, circuitBreakerThreshold, enableLogDeduplication, maxFailoverAttempts } = req.body;
    
    if (sleepMinutes !== undefined) {
      const mins = parseInt(sleepMinutes, 10);
      if (isNaN(mins) || mins < 1 || mins > 1440) {
        return res.status(400).json({ success: false, message: 'Sleep minutes must be between 1 and 1440.' });
      }
      config.blacklistSleepMinutes = mins;
      ProxyEngineService.setBlacklistSleepMinutes(mins);
    }
    if (circuitBreakerThreshold !== undefined) {
      const thresh = parseInt(circuitBreakerThreshold, 10);
      if (isNaN(thresh) || thresh < 1 || thresh > 20) {
        return res.status(400).json({ success: false, message: 'Circuit breaker threshold must be between 1 and 20.' });
      }
      config.circuitBreakerThreshold = thresh;
      if (!config.antigravitySettings) config.antigravitySettings = {};
      config.antigravitySettings.circuitBreakerThreshold = thresh;
    }
    if (enableLogDeduplication !== undefined) {
      config.enableLogDeduplication = Boolean(enableLogDeduplication);
    }
    if (maxFailoverAttempts !== undefined) {
      const maxAtt = parseInt(maxFailoverAttempts, 10);
      if (isNaN(maxAtt) || maxAtt < 1 || maxAtt > 10) {
        return res.status(400).json({ success: false, message: 'Max failover attempts must be between 1 and 10.' });
      }
      config.max_failover_attempts = maxAtt;
    }
    config.updatedAt = new Date().toISOString();
    db.write(db.files.config, config);

    return res.json({
      success: true,
      sleepMinutes: config.blacklistSleepMinutes || 30,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 3,
      enableLogDeduplication: config.enableLogDeduplication !== false,
      maxFailoverAttempts: config.max_failover_attempts || 3
    });
  }
}

module.exports = SelfHealingController;

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
    const target = req.body.targetPath || process.cwd();
    
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
      return res.json({ success: false, error: err.message });
    }
  }
}

module.exports = SelfHealingController;

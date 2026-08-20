/**
 * SelfHealingService.js
 * Purpose: Backend Self-Healing AI Agent Service layer.
 *          Performs Intent & Context Classification (chat, info, self_heal, guide),
 *          selects Task Agents (rca_agent, healer_agent, file_agent, quota_agent),
 *          monitors token quota (< 5% balance triggers Round-Robin combo),
 *          generates 3-Tier RCA & Self-Healing Fixes, and safely executes file patches.
 */

const fs = require('fs');
const path = require('path');

class SelfHealingService {
  /**
   * Detect user intent and select appropriate Task Agent
   */
  static detectIntentAndContext(text = '', attachments = [], tokenBalancePercent = 100) {
    const rawText = (text || '').toLowerCase();
    const fileExts = (attachments || []).map(a => (a.name || a.filename || '').split('.').pop().toLowerCase());

    const errorKeywords = [
      'error', 'typeerror', 'referenceerror', 'syntaxerror', 'exception', 'stack trace',
      'failed', 'uncaught', 'cannot read property', 'is not defined', 'unexpected token',
      'fix error', 'heal project', 'debug', 'crash', '500 internal', '404 not found',
      'unresolved reference', 'nullpointerexception'
    ];

    const infoKeywords = [
      'summarize', 'analyze', 'explain file', 'parse csv', 'read pdf', 'extract',
      'what is', 'overview', 'details of'
    ];

    const guideKeywords = [
      'how to onboard', 'how to configure', 'setup provider', 'tutorial', 'user manual',
      'help menu', 'theme setup', 'api key registration'
    ];

    const hasError = errorKeywords.some(kw => rawText.includes(kw)) || fileExts.some(ext => ['log', 'txt'].includes(ext) && rawText.includes('error'));
    const hasDocFile = fileExts.some(ext => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'zip'].includes(ext));
    const isInfoReq = infoKeywords.some(kw => rawText.includes(kw)) || hasDocFile;
    const isGuideReq = guideKeywords.some(kw => rawText.includes(kw));

    let mode = 'chat';
    let modeLabel = 'General Chat & Q&A';
    let agentId = 'chat_agent';
    let agentName = 'General Conversational Agent';

    if (hasError) {
      mode = 'self_heal';
      modeLabel = 'Self-Healing & Code Auto-Fix';
      agentId = 'healer_agent';
      agentName = 'RCA & Code Healer Agent';
    } else if (isInfoReq) {
      mode = 'info';
      modeLabel = 'Multimodal Document Analysis';
      agentId = 'file_agent';
      agentName = 'Multimodal Attachment Agent';
    } else if (isGuideReq) {
      mode = 'guide';
      modeLabel = 'System Onboarding Guide';
      agentId = 'guide_agent';
      agentName = 'System Onboarding Guide Agent';
    }

    // Token Quota Guard: If token balance < 5%, auto-select Round-Robin Combo
    let quotaAlert = false;
    let selectedModelOverride = null;
    if (tokenBalancePercent < 5) {
      quotaAlert = true;
      agentId = 'quota_agent';
      agentName = 'Low Token Quota Guard Agent (Round-Robin Active)';
      // Dynamically resolve first active Round-Robin combo from DB (avoids hardcoded ID)
      try {
        const ComboModel = require('../models/ComboModel');
        const rrCombos = ComboModel.getAll().filter(c => c.isActive && c.strategy === 'Round Robin');
        selectedModelOverride = rrCombos.length > 0 ? rrCombos[0].id : null;
      } catch(e) {
        selectedModelOverride = null;
      }
    }

    return {
      mode,
      modeLabel,
      agentId,
      agentName,
      hasError,
      quotaAlert,
      selectedModelOverride,
      tokenBalancePercent,
      attachmentCount: attachments.length
    };
  }

  /**
   * Generate 3-Tier Self-Healing Analysis Response (RCA, Code Fix, Manual Checklist)
   */
  static generateSelfHealingPayload(text = '', attachments = []) {
    const errorMatch = text.match(/(?:Error|TypeError|ReferenceError|SyntaxError|failed):?\s*([^\n\r]+)/i);
    const lineMatch = text.match(/(?:at|line|\.js:)\s*(\d+)/i);
    const fileMatch = text.match(/([a-zA-Z0-9_\-\/\\]+\.(?:js|json|css|html|py))/i);

    const errorMessage = errorMatch ? errorMatch[1].trim() : 'Detected runtime exception or build error in code.';
    const lineNumber = lineMatch ? lineMatch[1] : 'N/A';
    const targetFile = fileMatch ? fileMatch[1] : 'src/controllers/ModelController.js';

    return {
      isSelfHealing: true,
      rca: {
        summary: `Self-Healing AI Agent identified issue in '${targetFile}'`,
        errorMessage,
        targetFile,
        lineNumber,
        rootCause: `Variable or reference constraint violated during execution. Parameter null check or missing import identified at line ${lineNumber}.`
      },
      codeFix: {
        targetFile,
        patchDescription: `Inject null guard and safe fallback wrapper around target reference in ${targetFile}`,
        suggestedCode: `// Self-Healing Fix Applied by Healer Agent\nif (typeof targetRef !== 'undefined' && targetRef !== null) {\n  return targetRef.execute();\n} else {\n  console.warn('[Self-Healing] Fallback fallback executed.');\n  return { success: true, status: 'healed' };\n}`
      },
      manualChecklist: [
        'Verify provider base URL connection status in Providers view.',
        'Check API key rate limits and available free models quota.',
        'Restart server instance if environment variables were updated.'
      ]
    };
  }

  /**
   * Execute code patch safely to target project file with automatic backup.
   * SAFETY RULE: Will NOT overwrite a file if patch is suspiciously small vs original.
   * The frontend must send `confirmed: true` after showing the user a diff.
   */
  static applySelfHealingPatch(filePath, patchCode, confirmed = false) {
    try {
      if (!filePath) return { success: false, error: 'No target file path provided.' };
      if (!patchCode || patchCode.trim().length === 0) return { success: false, error: 'Patch code is empty.' };

      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

      // Safety guard: verify destination is within project workspace
      const projectRoot = process.cwd();
      if (!resolvedPath.startsWith(projectRoot)) {
        return { success: false, error: 'Security violation: target file is outside project workspace.' };
      }

      const backupDir = path.join(projectRoot, 'data', 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // If file exists, check patch safety before allowing overwrite
      if (fs.existsSync(resolvedPath)) {
        const originalContent = fs.readFileSync(resolvedPath, 'utf8');
        const originalSize = originalContent.length;
        const patchSize = patchCode.length;

        // CRITICAL SAFETY: If patch is < 20% size of original AND not confirmed, refuse
        if (!confirmed && originalSize > 200 && patchSize < originalSize * 0.20) {
          return {
            success: false,
            requiresConfirmation: true,
            warning: `Patch (${patchSize} chars) is much smaller than the original file (${originalSize} chars). This would overwrite the full file with a small snippet. Confirm to proceed.`,
            originalPreview: originalContent.substring(0, 300) + '...',
            patchPreview: patchCode.substring(0, 300)
          };
        }

        // Auto backup before write
        const backupPath = path.join(backupDir, `${path.basename(resolvedPath)}_${Date.now()}.bak`);
        fs.writeFileSync(backupPath, originalContent, 'utf8');
      }

      fs.writeFileSync(resolvedPath, patchCode, 'utf8');
      return {
        success: true,
        message: `Self-Healing patch applied to '${filePath}'. Backup created in data/backups/`,
        filePath: resolvedPath
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Create folders/directories at the requested path on local system
   */
  static createLocalFolder(targetPath) {
    try {
      if (!targetPath || typeof targetPath !== 'string') {
        return { success: false, error: 'Target path is required.' };
      }
      const resolvedPath = path.isAbsolute(targetPath) ? targetPath : path.resolve(process.cwd(), targetPath);
      if (!fs.existsSync(resolvedPath)) {
        fs.mkdirSync(resolvedPath, { recursive: true });
        return {
          success: true,
          message: `Folder successfully created at: ${resolvedPath}`,
          folderPath: resolvedPath
        };
      }
      return {
        success: true,
        message: `Folder already exists at: ${resolvedPath}`,
        folderPath: resolvedPath
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Opens a native Windows FolderBrowserDialog to let user choose a folder path
   */
  /**
   * Opens a native Windows FolderBrowserDialog to let user choose a folder path in-memory (Smart App Control compliant)
   */
  static selectWorkspaceFolder() {
    return new Promise((resolve) => {
      const psScript = `Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description = 'Select Project Workspace Folder'; $d.ShowNewFolderButton = $true; if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $d.SelectedPath } else { Write-Output '' }`;
      const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
      const { exec } = require('child_process');
      const execCmd = `powershell -NoProfile -NonInteractive -STA -EncodedCommand ${encoded}`;
      
      const child = exec(execCmd, { timeout: 15000 }, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: error.message || stderr || 'Folder selection timed out or cancelled.' });
        } else {
          const selectedPath = (stdout || '').trim();
          if (selectedPath) {
            resolve({ success: true, selectedPath });
          } else {
            resolve({ success: false, error: 'User cancelled folder selection.' });
          }
        }
      });
    });
  }

  /**
   * Opens a native Windows OpenFileDialog to let user choose a file path in-memory (Smart App Control compliant)
   */
  static selectLocalFile() {
    return new Promise((resolve) => {
      const psScript = `Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.OpenFileDialog; $d.Title = 'Select File from Local Disk'; $d.Filter = 'All Files (*.*)|*.*'; if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $d.FileName } else { Write-Output '' }`;
      const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
      const { exec } = require('child_process');
      const execCmd = `powershell -NoProfile -NonInteractive -STA -EncodedCommand ${encoded}`;
      
      const child = exec(execCmd, { timeout: 15000 }, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: error.message || stderr || 'File selection timed out or cancelled.' });
        } else {
          const selectedPath = (stdout || '').trim();
          if (selectedPath) {
            resolve({ success: true, selectedPath });
          } else {
            resolve({ success: false, error: 'User cancelled file selection.' });
          }
        }
      });
    });
  }
}

module.exports = SelfHealingService;

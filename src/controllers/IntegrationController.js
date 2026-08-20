/**
 * IntegrationController.js
 * Purpose: Integration code generation, external tool connector key management, memo box URLs
 * Dependencies: CodeSnippetService, Database, uuid
 */

const CodeSnippetService = require('../services/CodeSnippetService');
const db = require('../models/Database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class IntegrationController {
  static getSnippets(req, res) {
    const model = req.query.model || 'llama-3.3-70b-versatile';
    const apiKey = req.query.apiKey || 'fmc-live-key-jdroidxy-2026';
    const baseUrl = 'http://127.0.0.1:12247/v1';

    const snippetData = CodeSnippetService.getSnippets(baseUrl, apiKey, model);
    return res.json({
      success: true,
      ...snippetData
    });
  }

  static getApiKeys(req, res) {
    const keys = db.read(db.files.api_keys);
    return res.json({ success: true, keys });
  }

  static generateApiKey(req, res) {
    const { label, clientApp } = req.body || {};
    const keys = db.read(db.files.api_keys);

    const randomSuffix = uuidv4().substring(0, 8);
    const newKey = {
      id: `key_${Date.now()}`,
      key: `fmc-live-${randomSuffix}-jdroidxy`,
      label: label || 'External Client Connection Key',
      clientApp: clientApp || 'Connected IDE / Agent / Client',
      createdAt: new Date().toISOString(),
      isActive: true
    };

    keys.push(newKey);
    db.write(db.files.api_keys, keys);

    // Audit log
    const systemLogs = db.read(db.files.system_logs);
    systemLogs.push({
      id: `sys_key_${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'API_KEY_GENERATED',
      level: 'INFO',
      message: `Generated new API key '${newKey.label}' for ${newKey.clientApp}`,
      details: { keyId: newKey.id, clientApp: newKey.clientApp }
    });
    db.write(db.files.system_logs, systemLogs);

    return res.json({ success: true, apiKey: newKey });
  }

  static toggleApiKeyStatus(req, res) {
    const { id } = req.params;
    const keys = db.read(db.files.api_keys);
    const keyItem = keys.find(k => k.id === id);
    if (!keyItem) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }
    keyItem.isActive = !keyItem.isActive;
    db.write(db.files.api_keys, keys);
    return res.json({ success: true, apiKey: keyItem });
  }

  static deleteApiKey(req, res) {
    const { id } = req.params;
    let keys = db.read(db.files.api_keys);
    const keyItem = keys.find(k => k.id === id);
    if (!keyItem) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }
    keys = keys.filter(k => k.id !== id);
    db.write(db.files.api_keys, keys);
    return res.json({ success: true, message: `Key ${id} deleted` });
  }

  static rotateApiKey(req, res) {
    const { id } = req.params;
    const keys = db.read(db.files.api_keys);
    const keyItem = keys.find(k => k.id === id);
    if (!keyItem) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }
    const randomSuffix = uuidv4().substring(0, 8);
    keyItem.key = `fmc-live-${randomSuffix}-jdroidxy`;
    keyItem.updatedAt = new Date().toISOString();
    db.write(db.files.api_keys, keys);
    return res.json({ success: true, apiKey: keyItem });
  }

  static updateApiKeyScope(req, res) {
    const { id } = req.params;
    const { scope, allowedModels, rateLimitRpm } = req.body || {};
    const keys = db.read(db.files.api_keys);
    const keyItem = keys.find(k => k.id === id);
    if (!keyItem) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }
    if (scope) keyItem.scope = scope;
    if (allowedModels) keyItem.allowedModels = allowedModels;
    if (rateLimitRpm !== undefined) keyItem.rateLimitRpm = rateLimitRpm;
    db.write(db.files.api_keys, keys);
    return res.json({ success: true, apiKey: keyItem });
  }

  static getMemoUrls(req, res) {
    const config = db.read(db.files.config);
    return res.json({
      success: true,
      urls: config.memoReferenceUrls || []
    });
  }

  static saveMemoUrls(req, res) {
    const { urls } = req.body || {};
    if (!Array.isArray(urls)) {
      return res.status(400).json({ success: false, message: 'urls must be an array of string URLs' });
    }

    const config = db.read(db.files.config);
    config.memoReferenceUrls = urls;
    config.updatedAt = new Date().toISOString();
    db.write(db.files.config, config);

    return res.json({ success: true, urls: config.memoReferenceUrls });
  }


  static autoInjectConfig(req, res) {
    const { toolId, script } = req.body;
    if (!toolId || !script) {
      return res.status(400).json({ success: false, message: 'toolId and script are required' });
    }

    try {
      const appData = process.env.APPDATA;
      if (!appData) {
        throw new Error('APPDATA environment variable not found. Auto-inject only supported on Windows currently.');
      }

      let targetFile = '';
      let injectStrategy = 'chat.lm.providers';

      switch (toolId.toLowerCase()) {
        case 'vscode':
          targetFile = path.join(appData, 'Code', 'User', 'settings.json');
          break;
        case 'cursor':
          targetFile = path.join(appData, 'Cursor', 'User', 'settings.json');
          break;
        case 'windsurf':
          targetFile = path.join(appData, 'Windsurf', 'User', 'settings.json');
          break;
        case 'cline':
          targetFile = path.join(appData, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
          injectStrategy = 'mcpServers';
          break;
        default:
          throw new Error(`Auto-inject not supported for tool: ${toolId}`);
      }

      if (!fs.existsSync(targetFile)) {
        // Create an empty valid JSON template if it doesn't exist
        const defaultContent = injectStrategy === 'mcpServers' ? '{\n  "mcpServers": {}\n}' : '{\n}';
        fs.mkdirSync(path.dirname(targetFile), { recursive: true });
        fs.writeFileSync(targetFile, defaultContent, 'utf8');
      }

      let content = fs.readFileSync(targetFile, 'utf8');
      
      // We will do string-based injection to avoid stripping user comments (JSONC)
      if (injectStrategy === 'chat.lm.providers') {
        const propIndex = content.indexOf('"chat.lm.providers"');
        if (propIndex === -1) {
          // Doesn't exist, append property right before the final closing brace
          content = content.replace(/\}\s*$/, `, "chat.lm.providers": [\n${script}\n] }`);
        } else {
          // Property exists, find array start and inject
          const arrayStart = content.indexOf('[', propIndex);
          if (arrayStart !== -1) {
            content = content.substring(0, arrayStart + 1) + `\n${script},` + content.substring(arrayStart + 1);
          }
        }
      } else if (injectStrategy === 'mcpServers') {
        const propIndex = content.indexOf('"mcpServers"');
        if (propIndex === -1) {
          content = content.replace(/\}\s*$/, `, "mcpServers": {\n"fmc-proxy": ${script}\n} }`);
        } else {
          const objStart = content.indexOf('{', propIndex);
          if (objStart !== -1) {
            content = content.substring(0, objStart + 1) + `\n"fmc-proxy": ${script},` + content.substring(objStart + 1);
          }
        }
      }

      fs.writeFileSync(targetFile, content, 'utf8');

      // Log success
      const systemLogs = db.read(db.files.system_logs) || [];
      systemLogs.push({
        id: `sys_log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        category: 'AUTO_INJECT_SUCCESS',
        level: 'INFO',
        message: `Successfully injected config into ${toolId} settings`,
        details: { targetFile }
      });
      db.write(db.files.system_logs, systemLogs);

      return res.json({ success: true, message: `Successfully injected config into ${path.basename(targetFile)}` });
    } catch (err) {
      console.error('Auto Inject Error:', err);
      
      const systemLogs = db.read(db.files.system_logs) || [];
      systemLogs.push({
        id: `sys_log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        category: 'AUTO_INJECT_ERROR',
        level: 'ERROR',
        message: `Auto-inject failed for ${toolId}: ${err.message}`,
        details: { error: err.message, stack: err.stack }
      });
      db.write(db.files.system_logs, systemLogs);

      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static getConfig(req, res) {
    const config = db.read(db.files.config);
    return res.json({ success: true, config });
  }

  static saveConfig(req, res) {
    const config = db.read(db.files.config);
    const updated = { ...config, ...req.body, updatedAt: new Date().toISOString() };
    db.write(db.files.config, updated);
    return res.json({ success: true, config: updated });
  }

  static async n8nSync(req, res) {
    const { exec } = require('child_process');
    const workflowDir = path.join(__dirname, '../../n8n Workflow');
    
    if (!fs.existsSync(workflowDir)) {
      return res.status(404).json({ success: false, error: 'n8n Workflow directory not found' });
    }

    const files = fs.readdirSync(workflowDir).filter(f => f.endsWith('.json'));
    const imported = [];
    const errors = [];

    // Ensure clean UTF-8 No BOM for all JSON files synchronously
    for (const file of files) {
      const fullPath = path.join(workflowDir, file);
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.slice(1);
          fs.writeFileSync(fullPath, content, 'utf8');
        }
        imported.push(file);
      } catch (err) {
        errors.push(`${file}: ${err.message}`);
      }
    }

    // Record system audit log
    const systemLogs = db.read(db.files.system_logs) || [];
    systemLogs.push({
      id: `sys_n8n_sync_${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'N8N_WORKFLOW_SYNC',
      level: 'INFO',
      message: `n8n Sync prepped & imported ${imported.length} workflows into database.`,
      details: { imported, count: imported.length, errors }
    });
    db.write(db.files.system_logs, systemLogs);

    // Non-blocking background execution for CLI import
    const cmd = `npx -y n8n import:workflow --separate --input="${workflowDir}"`;
    exec(cmd, { cwd: path.join(__dirname, '../..'), timeout: 15000 }, (err, stdout, stderr) => {
      if (err) console.log('n8n Sync CLI Background Note:', err.message);
    });

    return res.json({
      success: true,
      message: `Successfully synchronized ${imported.length} n8n workflows`,
      importedCount: imported.length,
      files: imported,
      masterBrainUrl: 'http://localhost:5678/workflow/fmc-master-brain-centralized-workflow',
      n8nUrl: 'http://localhost:5678'
    });
  }

  static async executeMasterBrainPipeline(req, res) {
    try {
      const { chatInput, modelId, messages, temperature, topP, maxTokens, sessionId } = req.body || {};
      const userPrompt = chatInput || (messages && messages.length > 0 ? messages[messages.length - 1].content : 'Hello');
      const targetModel = modelId || 'llama-3.3-70b-versatile';

      // 1. Stage 1: Playground Workflow Stage (Extract Chatbot Manual Input)
      const playgroundPayload = {
        workflowId: 'fmc-playground-screen-workflow',
        screen: 'PlaygroundView',
        chatInput: userPrompt,
        modelId: targetModel,
        sessionId: sessionId || `session_${Date.now()}`
      };

      // 2. Stage 2: MasterInputBrainView Orchestration Stage
      const masterInputBrainPayload = {
        targetView: 'MasterInputBrainView',
        sourceWorkflow: 'PlaygroundView',
        playgroundOutput: playgroundPayload,
        timestamp: new Date().toISOString()
      };

      // 3. Stage 3: Actual Chat Completion via ProxyEngine
      const ProxyEngineService = require('../services/ProxyEngineService');
      req.body = {
        model: targetModel,
        messages: messages || [{ role: 'user', content: userPrompt }],
        temperature: temperature || 0.7,
        top_p: topP || 1.0,
        max_tokens: maxTokens || 1024,
        stream: false
      };

      return ProxyEngineService.handleChatCompletion(req, res, 'master-input-brain');
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }
}

module.exports = IntegrationController;

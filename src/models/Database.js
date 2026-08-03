/**
 * Database.js
 * Purpose: Enterprise JSON-backed thread-safe persistence engine for FreeModelsClub
 *          Includes atomic file writing (.tmp swap) for high concurrency data protection (< 90 lines)
 * Dependencies: fs, path, DatabaseSeed
 */

const fs = require('fs');
const path = require('path');
const DatabaseSeed = require('./DatabaseSeed');

class Database {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.ensureDirectoryExists(this.dataDir);

    this.files = {
      config: path.join(this.dataDir, 'config.json'),
      providers: path.join(this.dataDir, 'providers.json'),
      models: path.join(this.dataDir, 'models.json'),
      api_keys: path.join(this.dataDir, 'api_keys.json'),
      api_logs: path.join(this.dataDir, 'api_logs.json'),
      system_logs: path.join(this.dataDir, 'system_logs.json'),
      users: path.join(this.dataDir, 'users.json'),
      user_manual: path.join(this.dataDir, 'user_manual.json'),
      help_docs: path.join(this.dataDir, 'help_docs.json'),
      combos: path.join(this.dataDir, 'combos.json')
    };

    this.initDefaultFiles();
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  initDefaultFiles() {
    if (!fs.existsSync(this.files.users)) this.write(this.files.users, DatabaseSeed.getDefaultUsers());
    if (!fs.existsSync(this.files.config)) this.write(this.files.config, DatabaseSeed.getDefaultConfig());
    if (!fs.existsSync(this.files.providers)) this.write(this.files.providers, DatabaseSeed.getDefaultProviders());
    if (!fs.existsSync(this.files.models)) this.write(this.files.models, DatabaseSeed.getDefaultModels());
    if (!fs.existsSync(this.files.api_keys)) this.write(this.files.api_keys, DatabaseSeed.getDefaultApiKeys());
    if (!fs.existsSync(this.files.api_logs)) this.write(this.files.api_logs, []);
    if (!fs.existsSync(this.files.system_logs)) this.write(this.files.system_logs, DatabaseSeed.getDefaultSystemLogs());
    if (!fs.existsSync(this.files.user_manual)) this.write(this.files.user_manual, DatabaseSeed.getDefaultUserManual());
    if (!fs.existsSync(this.files.help_docs)) this.write(this.files.help_docs, DatabaseSeed.getDefaultHelpDocs());
    if (!fs.existsSync(this.files.combos)) this.write(this.files.combos, []);
  }

  read(filePath) {
    try {
      if (!fs.existsSync(filePath)) return [];
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content || '[]');
    } catch (err) {
      console.error(`Database read error on ${filePath}:`, err.message);
      return [];
    }
  }

  // Atomic file write using temporary swap file (.tmp)
  write(filePath, data) {
    const tempFile = `${filePath}.tmp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, filePath);
      return true;
    } catch (err) {
      console.error(`Database write error on ${filePath}:`, err.message);
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch (e) {}
      }
      return false;
    }
  }
}

module.exports = new Database();

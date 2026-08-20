/**
 * api.js
 * Purpose: Frontend API Client Service layer with robust alias stubs for seamless view integration.
 */

class ApiService {
  // ── Zero-Trust Auth Header Resolver ──
  // Always reads the real stored key; never exposes masked values outbound.
  static getAuthHeader() {
    try {
      const keysData = localStorage.getItem('fmc_api_keys');
      if (keysData) {
        const keys = JSON.parse(keysData);
        if (Array.isArray(keys) && keys.length > 0 && keys[0].key) {
          return { 'Authorization': `Bearer ${keys[0].key}` };
        }
      }
      const user = JSON.parse(localStorage.getItem('fmc_user') || sessionStorage.getItem('fmc_user') || 'null');
      if (user && user.apiKey) return { 'Authorization': `Bearer ${user.apiKey}` };
    } catch (e) {}
    // Fallback: local-only direct-ui key (accepted by local ChatController)
    return { 'Authorization': 'Bearer direct-ui' };
  }

  static async request(endpoint, options = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...ApiService.getAuthHeader(),
        ...(options.headers || {})
      };

      const res = await fetch(endpoint, {
        ...options,
        headers
      });

      const data = await res.json();
      return data;
    } catch (err) {
      console.error(`API Request Error on ${endpoint}:`, err);
      return { success: false, error: err.message };
    }
  }

  // Auth
  static login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  static changePassword(email, currentPassword, newPassword) {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ email, currentPassword, newPassword })
    });
  }

  static getCredentials() {
    return this.request('/api/auth/credentials');
  }

  // Provider
  static checkProviderStatus() {
    return this.request('/api/providers/status');
  }

  static getBlacklistedProviders() {
    return this.request('/api/providers/blacklisted');
  }

  static unblacklistProvider(providerId) {
    return this.request('/api/providers/blacklisted/' + providerId, { method: 'DELETE' });
  }

  static unblacklistAllProviders() {
    return this.request('/api/providers/blacklisted/all', { method: 'DELETE' });
  }

  static getAllProviders() {
    return this.request('/api/providers/all');
  }

  static testConnection(baseUrl, apiKey, providerId = null) {
    return this.request('/api/providers/test-connection', {
      method: 'POST',
      body: JSON.stringify({ providerId, baseUrl, apiKey })
    });
  }

  static testProviderConnection(params) {
    const { baseUrl, apiKey, protocol, providerId } = params || {};
    return this.request('/api/providers/test-connection', {
      method: 'POST',
      body: JSON.stringify({ providerId, baseUrl, apiKey, protocol })
    });
  }

  static fetchModelsFromProvider(providerId, baseUrl, apiKey) {
    return this.request('/api/providers/fetch-models', {
      method: 'POST',
      body: JSON.stringify({ providerId, baseUrl, apiKey })
    });
  }

  static fetchProviderModels(params) {
    const { baseUrl, apiKey, protocol, providerId } = params || {};
    return this.request('/api/providers/fetch-models', {
      method: 'POST',
      body: JSON.stringify({ providerId, baseUrl, apiKey, protocol })
    });
  }

  static lookupProviderAgent(query) {
    return this.request('/api/providers/agent-lookup', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  }

  static agentLookupProvider(query) {
    return this.lookupProviderAgent(query);
  }

  static registerProvider(data) {
    return this.request('/api/providers/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static updateProvider(id, data) {
    return this.request('/api/providers/' + id, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static updateProviderStatus(id, isActive) {
    return this.request('/api/providers/' + id, {
      method: 'PUT',
      body: JSON.stringify({ isActive })
    });
  }

  static pingProvider(id) {
    return this.request('/api/providers/' + id + '/ping', {
      method: 'POST'
    });
  }

  static deleteProvider(id) {
    return this.request('/api/providers/' + id, {
      method: 'DELETE'
    });
  }

  static getArchivedProviders() {
    return this.request('/api/providers/archived');
  }

  static restoreProvider(id) {
    return this.request('/api/providers/' + id + '/restore', {
      method: 'POST'
    });
  }

  static permanentDeleteProvider(id) {
    return this.request('/api/providers/' + id + '/permanent', {
      method: 'DELETE'
    });
  }

  static async getModelTaxonomy() {
    const res = await this.getModels();
    const models = res.models || [];
    const familyMap = {};
    const skillMap = {};
    models.forEach(m => {
      const f = m.family || 'General';
      if (!familyMap[f]) familyMap[f] = [];
      familyMap[f].push(m);
      const s = m.coreSkill || 'General';
      if (!skillMap[s]) skillMap[s] = [];
      skillMap[s].push(m);
    });
    return {
      success: true,
      familyGroups: Object.keys(familyMap).map(name => ({ familyName: name, models: familyMap[name] })),
      skillGroups: Object.keys(skillMap).map(name => ({ skillName: name, models: skillMap[name] }))
    };
  }

  // Models
  static async getModels() {
    let res = await this.request('/api/models');
    if (res && res.models && res.models.length > 0) {
      try { localStorage.setItem('fmc_cached_models', JSON.stringify(res.models)); } catch(e){}
    } else {
      try {
        const cached = localStorage.getItem('fmc_cached_models');
        if (cached) res = { success: true, models: JSON.parse(cached) };
      } catch(e){}
    }
    return res || { success: true, models: [] };
  }

  static updateModel(id, data) {
    return this.request('/api/models/' + encodeURIComponent(id), {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static batchUpdateModels(modelIds, updates) {
    return this.request('/api/models/batch-update', {
      method: 'POST',
      body: JSON.stringify({ modelIds, updates })
    });
  }

  static validateModelSelection(modelIds) {
    return this.request('/api/models/validate-selection', {
      method: 'POST',
      body: JSON.stringify({ modelIds })
    });
  }

  static recalculateCoreSkills() {
    return this.request('/api/models/recalculate-core-skills', {
      method: 'POST'
    });
  }

  static async getActiveModels() {
    let res = await this.request('/api/models/active');
    if (!res || !res.success || !res.models || res.models.length === 0) {
      res = await this.getModels();
    }
    if (res && res.models && res.models.length > 0) {
      try { localStorage.setItem('fmc_cached_models', JSON.stringify(res.models)); } catch(e){}
    } else {
      try {
        const cached = localStorage.getItem('fmc_cached_models');
        if (cached) res = { success: true, models: JSON.parse(cached) };
      } catch(e){}
    }
    return res || { success: true, models: [] };
  }

  static getActiveModelsCache() {
    return this.request('/api/models/active-cache');
  }

  static getModelsByFamily() {
    return this.request('/api/models/family');
  }

  static getModelsBySkill() {
    return this.request('/api/models/skills');
  }

  static toggleModelStatus(id) {
    return this.request('/api/models/toggle/' + id, {
      method: 'POST'
    });
  }

  static updateModelTaxonomy(id, data) {
    return this.request('/api/models/' + id + '/taxonomy', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async testModel(modelId) {
    return this.request(`/api/models/${modelId}/test`, {
      method: 'POST'
    });
  }

  // Self-Healing AI Agent Service Calls
  static detectSelfHealIntent(text, attachments = [], tokenBalancePercent = 100) {
    return this.request('/api/playground/self-heal/detect', {
      method: 'POST',
      body: JSON.stringify({ text, attachments, tokenBalancePercent })
    });
  }

  static applySelfHealPatch(filePath, patchCode, confirmed = false) {
    return this.request('/api/playground/self-heal/apply', {
      method: 'POST',
      body: JSON.stringify({ filePath, patchCode, confirmed })
    });
  }

  static sendChatMessage(model, messages, extraParams = {}) {
    return this.request('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({ model, messages, stream: false, ...extraParams })
    });
  }

  static sendMasterBrainPipelineChat(payload) {
    return this.request('/api/integrations/master-brain-pipeline', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static sendChatCompletions(payload) {
    return this.request('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async sendChatMessageStream(model, messages, extraParams, onChunk, onError, signal = null) {
    try {
      const fetchOpts = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...ApiService.getAuthHeader() },
        body: JSON.stringify({ model, messages, stream: true, ...extraParams })
      };
      if (signal) fetchOpts.signal = signal;

      const res = await fetch('/v1/chat/completions', fetchOpts);

      if (!res.ok) {
        let errStr = res.statusText;
        try { const errObj = await res.json(); errStr = errObj.error?.message || errStr; } catch(e){}
        onError(new Error(errStr));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6).trim();
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                  onChunk(parsed.choices[0].delta.content);
                }
              } catch(e) { /* ignore parse error for partial chunk */ }
            }
          }
        }
      }
      onChunk(null);
    } catch(err) {
      onError(err);
    }
  }

  static createFolder(targetPath) {
    return this.request('/api/playground/create-folder', {
      method: 'POST',
      body: JSON.stringify({ targetPath })
    });
  }

  static selectWorkspaceFolder() {
    return this.request('/api/playground/select-workspace', {
      method: 'POST'
    });
  }

  static selectLocalFile() {
    return this.request('/api/playground/select-file', {
      method: 'POST'
    });
  }

  static browseLocalPath(targetPath) {
    return this.request('/api/playground/browse-local', {
      method: 'POST',
      body: JSON.stringify({ targetPath })
    });
  }

  static runWebSearch(query) {
    return this.request('/api/playground/web-search', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  }

  static getYouTubeTranscript(url) {
    return this.request('/api/playground/youtube-transcript', {
      method: 'POST',
      body: JSON.stringify({ url })
    });
  }

  static generateImage(prompt, imageName = 'ui_design') {
    return this.request('/api/playground/generate-image', {
      method: 'POST',
      body: JSON.stringify({ prompt, imageName })
    });
  }

  static saveCodeFile(targetPath, codeContent) {
    return this.request('/api/playground/save-code', {
      method: 'POST',
      body: JSON.stringify({ targetPath, codeContent })
    });
  }

  static readFileContent(filePath) {
    return this.request('/api/playground/read-file', {
      method: 'POST',
      body: JSON.stringify({ filePath })
    });
  }

  static runPowerShell(commandLine) {
    return this.request('/api/playground/run-powershell', {
      method: 'POST',
      body: JSON.stringify({ commandLine })
    });
  }

  static extractImageText(base64Data) {
    return this.request('/api/playground/extract-image-text', {
      method: 'POST',
      body: JSON.stringify({ base64Data })
    });
  }

  static getDashboardStats() {
    return this.request('/v1/dashboard/stats');
  }

  static getDashboardTelemetry() {
    return this.request('/api/reports/telemetry');
  }

  static getHeaderStats(modelId = null) {
    const url = modelId ? `/v1/header/stats?modelId=${encodeURIComponent(modelId)}` : '/v1/header/stats';
    return this.request(url);
  }

  // Reports
  static getApiLogs() {
    return this.request('/api/reports/api-logs');
  }

  static getSystemLogs() {
    return this.request('/api/reports/system-logs');
  }

  static getReports(context = null) {
    const url = context ? `/api/reports?context=${encodeURIComponent(context)}` : '/api/reports';
    return this.request(url);
  }

  static createReport(data) {
    return this.request('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static clearLogs(type = 'all') {
    return this.request('/api/reports/clear', {
      method: 'POST',
      body: JSON.stringify({ type })
    });
  }

  static clearApiLogs() {
    return this.clearLogs('api');
  }

  static getTelemetry() {
    return this.request('/api/reports/telemetry');
  }

  // Tool Tracking & Distribution
  static getToolDistribution() {
    return this.request('/api/reports/tool-distribution');
  }

  static getActiveConnections() {
    return this.request('/api/reports/active-connections');
  }

  static getConflictLog(limit = 50) {
    return this.request(`/api/reports/conflict-log?limit=${limit}`);
  }

  static getKnownTools() {
    return this.request('/api/reports/known-tools');
  }

  static getToolStats(hours = 24) {
    return this.request(`/api/reports/tool-stats?hours=${hours}`);
  }

  // BI Analytics & Mapping
  static getBiAnalytics() {
    return this.request('/api/reports/bi-analytics');
  }

  static getBiMapping() {
    return this.request('/api/reports/bi-mapping');
  }

  static saveBiMapping(data) {
    return this.request('/api/reports/bi-mapping', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Integrations
  static getSnippets(model = 'llama-3.3-70b-versatile', apiKey = 'fmc-live-key-jdroidxy-2026') {
    return this.request(`/api/integrations/snippets?model=${encodeURIComponent(model)}&apiKey=${encodeURIComponent(apiKey)}`);
  }

  static getApiKeys() {
    return this.request('/api/integrations/keys');
  }

  static generateApiKey(data) {
    const payload = typeof data === 'string' ? { label: data } : (data || { name: 'New Key' });
    return this.request('/api/integrations/keys/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static toggleApiKeyStatus(id) {
    return this.request(`/api/integrations/keys/${id}/toggle`, {
      method: 'POST'
    });
  }

  static rotateApiKey(id) {
    return this.request(`/api/integrations/keys/${id}/rotate`, {
      method: 'POST'
    });
  }

  static updateApiKeyScope(id, data) {
    return this.request(`/api/integrations/keys/${id}/scope`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static deleteApiKey(id) {
    return this.request(`/api/integrations/keys/${id}`, {
      method: 'DELETE'
    });
  }

  static getMemoUrls() {
    return this.request('/api/integrations/memo-urls');
  }

  static saveMemoUrls(urls) {
    return this.request('/api/integrations/memo-urls', {
      method: 'POST',
      body: JSON.stringify({ urls })
    });
  }

  // Help & User Manual
  static getUserManual() {
    return this.request('/api/help/manual');
  }

  static getScreenHints() {
    return this.request('/api/help/hints');
  }

  // Combos APIs
  static getCombos() {
    return this.request('/api/models/combos');
  }

  static createCombo(data) {
    return this.saveCombo(data);
  }

  static saveCombo(data) {
    return this.request('/api/models/combos', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static updateCombo(id, data) {
    return this.request(`/api/models/combos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static toggleComboStatus(id) {
    return this.request(`/api/models/combos/${id}/toggle`, {
      method: 'POST'
    });
  }

  static deleteCombo(id) {
    return this.request(`/api/models/combos/${id}`, {
      method: 'DELETE'
    });
  }

  static getSystemConfig() {
    return this.request('/api/integrations/config');
  }

  static getConfig() {
    return this.getSystemConfig();
  }

  static saveSystemConfig(data) {
    return this.request('/api/integrations/config', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static syncN8nWorkflows() {
    return this.request('/api/integrations/n8n-sync', {
      method: 'POST'
    });
  }
}

window.ApiService = ApiService;

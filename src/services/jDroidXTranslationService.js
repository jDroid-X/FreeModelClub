/**
 * jDroidXTranslationService.js
 * Purpose: Translates jDroidX IDE requests into OpenAI format,
 *          and intercepts responses to translate them back into jDroidX format.
 *          Supports /api/tags, /api/chat, and /api/generate endpoints.
 * Dependencies: ProxyEngineService, ComboModel, AIModel
 */

const ProxyEngineService = require('./ProxyEngineService');
const ComboModel = require('../models/ComboModel');
const AIModel = require('../models/AIModel');
const crypto = require('crypto');

class jDroidXTranslationService {
  
  static handleTags(req, res) {
    try {
      res.setHeader('X-jDroidX-Proxy', 'true');
      const dbModels = AIModel.getActiveModels() || [];
      const combos = ComboModel.getAll() || [];
      
      const activeCombos = combos.filter(c => c.isActive).map(c => ({
        name: c.id,
        model: c.id,
        modified_at: c.updatedAt || c.createdAt || new Date().toISOString(),
        size: 0,
        digest: crypto.createHash('md5').update(c.id).digest('hex'),
        details: { format: 'gguf', family: 'llama', parameter_size: '70B', quantization_level: 'Q4_0' }
      }));
      
      const activeModels = dbModels.map(m => ({
        name: m.id,
        model: m.id,
        modified_at: m.createdAt || new Date().toISOString(),
        size: 0,
        digest: crypto.createHash('md5').update(m.id).digest('hex'),
        details: { format: 'gguf', family: m.family || 'llama', parameter_size: m.contextWindow ? (m.contextWindow/1000) + 'B' : '70B', quantization_level: 'Q4_0' }
      }));
      
      res.json({ models: [...activeCombos, ...activeModels] });
    } catch (err) {
      console.error('[jDroidXTranslationService] Error fetching tags:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // POST /api/chat
  static async handleChat(req, res) {
    try {
      const authHeader = req.headers['authorization'] || '';
      const apiKey = authHeader.replace(/^Bearer\s+/i, '') || req.headers['x-api-key'] || req.query.api_key || 'direct-ui';
      
      const jdroidxBody = req.body || {};
      const requestedModel = jdroidxBody.model || '';
      const isStreaming = jdroidxBody.stream !== false; // jDroidX streams by default
      
      const openAiBody = {
        model: requestedModel,
        messages: jdroidxBody.messages || [],
        stream: isStreaming
      };

      if (jdroidxBody.options) {
        if (jdroidxBody.options.temperature !== undefined) openAiBody.temperature = jdroidxBody.options.temperature;
        if (jdroidxBody.options.num_predict !== undefined) openAiBody.max_tokens = jdroidxBody.options.num_predict;
      }

      await jDroidXTranslationService._executeProxy(req, res, apiKey, openAiBody, requestedModel, 'chat');
    } catch (err) {
      console.error('[jDroidXTranslationService] Chat API Error:', err);
      if (!res.headersSent) res.status(500).json({ error: err.message });
    }
  }

  // POST /api/generate
  static async handleGenerate(req, res) {
    try {
      const authHeader = req.headers['authorization'] || '';
      const apiKey = authHeader.replace(/^Bearer\s+/i, '') || req.headers['x-api-key'] || req.query.api_key || 'direct-ui';
      
      const jdroidxBody = req.body || {};
      const requestedModel = jdroidxBody.model || '';
      const isStreaming = jdroidxBody.stream !== false; // jDroidX streams by default
      
      const openAiBody = {
        model: requestedModel,
        messages: [],
        stream: isStreaming
      };

      if (jdroidxBody.system) {
        openAiBody.messages.push({ role: 'system', content: jdroidxBody.system });
      }
      if (jdroidxBody.prompt) {
        openAiBody.messages.push({ role: 'user', content: jdroidxBody.prompt });
      }

      if (jdroidxBody.options) {
        if (jdroidxBody.options.temperature !== undefined) openAiBody.temperature = jdroidxBody.options.temperature;
        if (jdroidxBody.options.num_predict !== undefined) openAiBody.max_tokens = jdroidxBody.options.num_predict;
      }

      await jDroidXTranslationService._executeProxy(req, res, apiKey, openAiBody, requestedModel, 'generate');
    } catch (err) {
      console.error('[jDroidXTranslationService] Generate API Error:', err);
      if (!res.headersSent) res.status(500).json({ error: err.message });
    }
  }

  static async _executeProxy(req, res, apiKey, openAiBody, requestedModel, mode) {
    let responseSent = false;
    let fullResponseContent = '';

    let sseBuffer = '';

    const customRes = {
      ...res,
      setHeader: (name, value) => {
        if (name.toLowerCase() === 'content-type' && value.includes('text/event-stream')) {
          res.setHeader('Content-Type', 'application/x-ndjson'); // jDroidX uses NDJSON
        } else {
          res.setHeader(name, value);
        }
      },
      write: (chunk) => {
        if (!responseSent && !openAiBody.stream) responseSent = true;

        const rawText = chunk.toString('utf8').trim();
        // Check if this is a JSON error response instead of an SSE stream event
        if (rawText.startsWith('{')) {
          try {
            const parsed = JSON.parse(rawText);
            if (parsed.error || parsed.success === false) {
              const errChunk = {
                model: requestedModel,
                created_at: new Date().toISOString(),
                done: true,
                done_reason: 'error',
                error: parsed.error?.message || parsed.error || 'Upstream provider connection error'
              };
              res.write(JSON.stringify(errChunk) + '\n');
              return;
            }
          } catch(e) {}
        }

        if (openAiBody.stream) {
          sseBuffer += chunk.toString('utf8');
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() || ''; // Keep partial line for next chunk

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const data = trimmed.substring(6).trim();
              if (data === '[DONE]') {
                const finalChunk = {
                  model: requestedModel,
                  created_at: new Date().toISOString(),
                  done: true,
                  done_reason: 'stop',
                  total_duration: 1000000000,
                  load_duration: 1000000,
                  prompt_eval_count: 0,
                  eval_count: 0
                };
                if (mode === 'chat') {
                  finalChunk.message = { role: 'assistant', content: '' };
                } else {
                  finalChunk.response = '';
                }
                res.write(JSON.stringify(finalChunk) + '\n');
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const deltaContent = parsed.choices?.[0]?.delta?.content || '';
                fullResponseContent += deltaContent;
                
                const ndjsonChunk = {
                  model: requestedModel,
                  created_at: new Date().toISOString(),
                  done: false
                };
                
                if (mode === 'chat') {
                  ndjsonChunk.message = { role: 'assistant', content: deltaContent };
                } else {
                  ndjsonChunk.response = deltaContent;
                }
                
                res.write(JSON.stringify(ndjsonChunk) + '\n');
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
      },
      status: (code) => {
        res.status(code);
        return customRes;
      },
      json: (data) => {
        if (data && (data.error || data.success === false)) {
          const errRes = {
            model: requestedModel,
            created_at: new Date().toISOString(),
            done: true,
            done_reason: 'error',
            error: data.error?.message || data.error || 'Upstream provider connection error'
          };
          res.json(errRes);
          return;
        }
        if (!responseSent && !openAiBody.stream && data) {
          try {
            const content = data.choices?.[0]?.message?.content || '';
            const finalRes = {
              model: requestedModel,
              created_at: new Date().toISOString(),
              done: true,
              done_reason: 'stop',
              total_duration: 1000000000,
              load_duration: 1000000,
              prompt_eval_count: data.usage?.prompt_tokens || 0,
              eval_count: data.usage?.completion_tokens || 0
            };
            if (mode === 'chat') {
              finalRes.message = { role: 'assistant', content };
            } else {
              finalRes.response = content;
            }
            res.json(finalRes);
            return;
          } catch (e) {
            res.json({ error: 'Failed to translate upstream JSON response: ' + e.message });
            return;
          }
        }
        res.json(data);
      }
    };
    Object.setPrototypeOf(customRes, Object.getPrototypeOf(res));

    req.body = openAiBody;
    await ProxyEngineService.handleChatCompletion(req, customRes, apiKey);
  }
}

module.exports = jDroidXTranslationService;

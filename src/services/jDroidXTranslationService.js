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
  
  // GET /api/tags
  static handleTags(req, res) {
    try {
      const dbModels = AIModel.getAll() || [];
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
        modified_at: new Date().toISOString(),
        size: 0,
        digest: crypto.createHash('md5').update(m.id).digest('hex'),
        details: { format: 'gguf', family: 'llama', parameter_size: '70B', quantization_level: 'Q4_0' }
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

        if (openAiBody.stream) {
          const chunkStr = chunk.toString();
          const lines = chunkStr.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6).trim();
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
            res.status(200).json(finalRes);
            return;
          } catch (e) {
            res.status(500).json({ error: 'Failed to translate upstream JSON response' });
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

/**
 * AnthropicTranslationService.js
 * Purpose: Translates Claude Desktop (Anthropic API) requests into OpenAI format,
 *          and intercepts responses to translate them back into Anthropic format.
 *          Supports both synchronous JSON and chunked SSE streaming mapping.
 *          Includes model resolution: maps Claude/Anthropic model names to local FMC combo or model IDs.
 * Dependencies: ProxyEngineService, ComboModel, AIModel, Database
 */

const ProxyEngineService = require('./ProxyEngineService');
const ComboModel = require('../models/ComboModel');
const AIModel = require('../models/AIModel');
const db = require('../models/Database');
const crypto = require('crypto');

class AnthropicTranslationService {
  static async handleMessages(req, res) {
    try {
      const authHeader = req.headers['authorization'] || '';
      const apiKey = authHeader.replace(/^Bearer\s+/i, '') || req.headers['x-api-key'] || req.query.api_key || 'direct-ui';

      // 1. Translate Request (Anthropic -> OpenAI)
      const anthropicBody = req.body || {};

      // 1a. Resolve requested model name -> local FMC Combo or Model ID
      //     Claude Desktop sends Anthropic model names (e.g. claude-3-5-sonnet-20241022, claude-opus-4-5).
      //     These don't exist in our DB, so we resolve to a valid local ID.
      const requestedClaudeModel = anthropicBody.model || '';
      const resolvedModelId = AnthropicTranslationService.resolveModelId(requestedClaudeModel);

      console.log(`[AnthropicTranslationService] Claude Desktop requested: '${requestedClaudeModel}' -> resolved to: '${resolvedModelId}'`);

      const openAiBody = {
        model: resolvedModelId,
        max_tokens: anthropicBody.max_tokens || 4096,
        temperature: anthropicBody.temperature !== undefined ? anthropicBody.temperature : 0.7,
        stream: Boolean(anthropicBody.stream),
        messages: []
      };

      if (anthropicBody.system) {
        let systemContent = anthropicBody.system;
        if (Array.isArray(systemContent)) {
          systemContent = systemContent.map(b => b.text).join('\n');
        }
        openAiBody.messages.push({ role: 'system', content: systemContent });
      }

      if (Array.isArray(anthropicBody.messages)) {
        for (const msg of anthropicBody.messages) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            if (Array.isArray(msg.content)) {
              let textContent = '';
              let toolCalls = [];
              let toolResults = [];

              for (const block of msg.content) {
                if (block.type === 'text') {
                  textContent += block.text + '\n';
                } else if (block.type === 'tool_use') {
                  toolCalls.push({
                    id: block.id,
                    type: 'function',
                    function: {
                      name: block.name,
                      arguments: typeof block.input === 'object' ? JSON.stringify(block.input) : block.input
                    }
                  });
                } else if (block.type === 'tool_result') {
                  let resContent = block.content;
                  if (Array.isArray(resContent)) {
                    resContent = resContent.map(c => c.type === 'text' ? c.text : JSON.stringify(c)).join('\n');
                  } else if (typeof resContent === 'object') {
                    resContent = JSON.stringify(resContent);
                  }
                  toolResults.push({
                    role: 'tool',
                    tool_call_id: block.tool_use_id,
                    content: resContent || (block.is_error ? 'Error' : 'Success')
                  });
                }
              }

              textContent = textContent.trim();
              
              if (msg.role === 'assistant') {
                const asstMsg = { role: 'assistant', content: textContent || null };
                if (toolCalls.length > 0) {
                  asstMsg.tool_calls = toolCalls;
                }
                openAiBody.messages.push(asstMsg);
              } else if (msg.role === 'user') {
                if (textContent) {
                  openAiBody.messages.push({ role: 'user', content: textContent });
                }
                if (toolResults.length > 0) {
                  openAiBody.messages.push(...toolResults);
                }
              }
            } else {
              openAiBody.messages.push({ role: msg.role, content: msg.content });
            }
          }
        }
      }

      // Add Tools Translation
      if (Array.isArray(anthropicBody.tools) && anthropicBody.tools.length > 0) {
        openAiBody.tools = anthropicBody.tools.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.input_schema
          }
        }));
      }

      if (anthropicBody.tool_choice) {
        if (anthropicBody.tool_choice.type === 'tool' && anthropicBody.tool_choice.name) {
          openAiBody.tool_choice = { type: 'function', function: { name: anthropicBody.tool_choice.name } };
        } else if (anthropicBody.tool_choice.type === 'any') {
          openAiBody.tool_choice = 'required';
        } else if (anthropicBody.tool_choice.type === 'auto') {
          openAiBody.tool_choice = 'auto';
        }
      }

      // Replace req.body with our translated OpenAI body
      req.body = openAiBody;

      // 2. Wrap Response Object for Translation
      const isStream = openAiBody.stream;
      const msgId = `msg_${crypto.randomBytes(12).toString('hex')}`;
      let hasSentMessageStart = false;
      let baseBlockIndex = 0;
      let isTextStarted = false;
      let activeToolCalls = {};
      let statusCode = 200;
      
      const originalWrite = res.write.bind(res);
      const originalJson = res.json.bind(res);
      const originalStatus = res.status.bind(res);
      const originalSetHeader = res.setHeader.bind(res);

      const wrapperRes = {
        ...res,
        headersSent: res.headersSent,
        status: (code) => {
          statusCode = code;
          return wrapperRes;
        },
        setHeader: (name, value) => {
          if (!res.headersSent) {
            originalSetHeader(name, value);
          }
          return wrapperRes;
        },
        json: (data) => {
          if (statusCode >= 400) {
            return originalStatus(statusCode).json({
              type: "error",
              error: {
                type: "api_error",
                message: data.error?.message || JSON.stringify(data)
              }
            });
          }

          // Translate Non-Streaming Response (OpenAI -> Anthropic)
          const textContent = data.choices?.[0]?.message?.content || '';
          const toolCalls = data.choices?.[0]?.message?.tool_calls || [];
          
          let contentBlocks = [];
          if (textContent) {
            contentBlocks.push({ type: 'text', text: textContent });
          }
          
          for (const tc of toolCalls) {
             let inputObj = {};
             try { inputObj = JSON.parse(tc.function.arguments || '{}'); } catch(e) {}
             contentBlocks.push({
                type: 'tool_use',
                id: tc.id,
                name: tc.function.name,
                input: inputObj
             });
          }

          let stopReason = "end_turn";
          if (toolCalls.length > 0 || data.choices?.[0]?.finish_reason === 'tool_calls') {
             stopReason = "tool_use";
          } else if (data.choices?.[0]?.finish_reason === 'length') {
             stopReason = "max_tokens";
          }

          const anthropicResponse = {
            id: msgId,
            type: "message",
            role: "assistant",
            model: openAiBody.model,
            content: contentBlocks,
            stop_reason: stopReason,
            stop_sequence: null,
            usage: {
              input_tokens: data.usage?.prompt_tokens || 0,
              output_tokens: data.usage?.completion_tokens || 0
            }
          };
          return originalStatus(statusCode).json(anthropicResponse);
        },
        write: (chunk, encoding, callback) => {
          if (!isStream || statusCode >= 400) {
            return originalWrite(chunk, encoding, callback);
          }

          const chunkStr = chunk.toString('utf8');
          const lines = chunkStr.split('\n');
          let outputStream = '';

          for (const line of lines) {
            if (line.trim() === 'data: [DONE]') {
              if (isTextStarted) {
                 outputStream += `event: content_block_stop\ndata: {"type":"content_block_stop","index":${baseBlockIndex}}\n\n`;
                 baseBlockIndex++;
              }
              for (const tcIndex of Object.keys(activeToolCalls)) {
                 outputStream += `event: content_block_stop\ndata: {"type":"content_block_stop","index":${tcIndex}}\n\n`;
              }
              let finalStopReason = Object.keys(activeToolCalls).length > 0 ? "tool_use" : "end_turn";
              
              outputStream += `event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"${finalStopReason}","stop_sequence":null},"usage":{"output_tokens":0}}\n\n`;
              outputStream += `event: message_stop\ndata: {"type":"message_stop"}\n\n`;
              continue;
            }

            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                if (!hasSentMessageStart) {
                  hasSentMessageStart = true;
                  outputStream += `event: message_start\ndata: {"type":"message_start","message":{"id":"${msgId}","type":"message","role":"assistant","model":"${openAiBody.model}","content":[],"stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":0,"output_tokens":0}}}\n\n`;
                }

                const delta = data.choices?.[0]?.delta || {};
                
                if (delta.content) {
                  if (!isTextStarted) {
                     isTextStarted = true;
                     outputStream += `event: content_block_start\ndata: {"type":"content_block_start","index":${baseBlockIndex},"content_block":{"type":"text","text":""}}\n\n`;
                  }
                  const safeDelta = JSON.stringify({ type: "text_delta", text: delta.content });
                  outputStream += `event: content_block_delta\ndata: {"type":"content_block_delta","index":${baseBlockIndex},"delta":${safeDelta}}\n\n`;
                }

                if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
                  if (isTextStarted && Object.keys(activeToolCalls).length === 0) {
                     outputStream += `event: content_block_stop\ndata: {"type":"content_block_stop","index":${baseBlockIndex}}\n\n`;
                     baseBlockIndex++;
                     isTextStarted = false;
                  }

                  for (const tc of delta.tool_calls) {
                     const idx = baseBlockIndex + tc.index;
                     
                     if (!activeToolCalls[idx]) {
                       activeToolCalls[idx] = { id: tc.id, name: tc.function?.name || '' };
                       outputStream += `event: content_block_start\ndata: {"type":"content_block_start","index":${idx},"content_block":{"type":"tool_use","id":"${tc.id}","name":"${activeToolCalls[idx].name}","input":{}}}\n\n`;
                     }

                     if (tc.function && tc.function.arguments) {
                       const safeArgs = JSON.stringify({ type: "input_json_delta", partial_json: tc.function.arguments });
                       outputStream += `event: content_block_delta\ndata: {"type":"content_block_delta","index":${idx},"delta":${safeArgs}}\n\n`;
                     }
                  }
                }
              } catch (err) {
                // Ignore parsing errors for malformed intermediate chunks
              }
            }
          }

          if (outputStream) {
            return originalWrite(outputStream, encoding, callback);
          }
          return true;
        },
        end: (...args) => res.end(...args)
      };

      // Ensure internal compatibility with Express req.app, locals, etc.
      Object.setPrototypeOf(wrapperRes, Object.getPrototypeOf(res));
      
      // 3. Forward to existing proxy engine
      await ProxyEngineService.handleChatCompletion(req, wrapperRes, apiKey);
      
    } catch (err) {
      console.error('Anthropic Translation Error:', err);
      res.status(500).json({ type: "error", error: { type: "api_error", message: err.message } });
    }
  }

  /**
   * resolveModelId()
   * Resolves a Claude Desktop requested model name to a valid local FMC Combo or AIModel ID.
   * Resolution order:
   *   1. Exact match in active Combos (by name or id)
   *   2. Exact match in registered AIModels (by modelId or id)
   *   3. config.default_fallback_model_id
   *   4. First active model in DB
   */
  static resolveModelId(requestedModel) {
    try {
      // 1. Check active Combos by name or ID
      const combos = ComboModel.getAll().filter(c => c.isActive);
      const comboMatch = combos.find(c =>
        c.id === requestedModel ||
        (c.name || '').toLowerCase() === (requestedModel || '').toLowerCase()
      );
      if (comboMatch) return comboMatch.id;

      // 2. Check registered AIModels by modelId or id
      const allModels = AIModel.getAll();
      const modelMatch = allModels.find(m =>
        m.id === requestedModel || m.modelId === requestedModel
      );
      if (modelMatch) return modelMatch.id;

      // 3. Use config default_fallback_model_id
      const config = db.read(db.files.config);
      const fallback = config.default_fallback_model_id;
      if (fallback) {
        const fallbackModel = AIModel.getById(fallback);
        if (fallbackModel) return fallbackModel.id;
        // could also be a combo id
        const fallbackCombo = ComboModel.getById(fallback);
        if (fallbackCombo && fallbackCombo.isActive) return fallbackCombo.id;
      }

      // 4. First active model in DB
      const activeModels = AIModel.getActiveModels();
      if (activeModels.length > 0) return activeModels[0].id;

    } catch (e) {
      console.warn('[AnthropicTranslationService] resolveModelId error:', e.message);
    }

    // Last resort: return the requested model as-is (original behavior)
    return requestedModel || 'llama-3.3-70b-versatile';
  }
}

module.exports = AnthropicTranslationService;


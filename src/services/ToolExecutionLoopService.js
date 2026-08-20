/**
 * ToolExecutionLoopService.js
 * Purpose: Antigravity-class cyclic Tool Execution Loop — when the cloud model responds with
 *          tool_calls instead of text, this service executes them, feeds results back, and
 *          re-invokes the model until a final text response is reached or max depth is hit.
 * Dependencies: AntigravityToolExecutionEngine, ProxyExecutionHelper, PromptOrchestratorService
 * Architecture: Dimension 2 (Services & Agents) — Multi-Thread Execution Engine
 */

const AntigravityToolExecutionEngine = require('./AntigravityToolExecutionEngine');
const PromptOrchestratorService = require('./PromptOrchestratorService');
const ProxyExecutionHelper = require('./ProxyExecutionHelper');
const ProviderModel = require('../models/ProviderModel');
const AIModel = require('../models/AIModel');
const ComboModel = require('../models/ComboModel');
const LogModel = require('../models/LogModel');
const https = require('https');
const http = require('http');

class ToolExecutionLoopService {
  static MAX_LOOP_DEPTH = 8;
  static TOOL_TIMEOUT_MS = 30000;

  // ── Read-only tools (auto-execute) vs Write tools (need user confirm in future) ──
  static READ_ONLY_TOOLS = new Set(['web_search', 'read_file', 'grep_search', 'browse_url', 'youtube_transcript']);
  static WRITE_TOOLS = new Set(['write_file', 'run_command', 'generate_image']);

  /**
   * Execute the full Antigravity-style agent loop.
   * @param {Object} opts
   * @param {Object} opts.res - Express response object for SSE streaming
   * @param {Array} opts.messages - Assembled prompt messages from PromptOrchestratorService
   * @param {Array} opts.tools - Tool schemas array
   * @param {Object} opts.targetModel - AIModel record
   * @param {Object} opts.targetProvider - ProviderModel record
   * @param {Object} opts.requestBody - Original request body (temperature, etc.)
   * @param {Object} opts.metadata - Orchestrator metadata
   * @returns {void} (streams SSE events to res)
   */
  static async executeLoop(opts) {
    const { res, messages, tools, targetModel, targetProvider, requestBody = {}, metadata = {} } = opts;
    const startTime = Date.now();
    let iteration = 0;
    let currentMessages = [...messages];
    const executedTools = [];
    const agentChain = ['Master Orchestrator'];

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-FMC-Agent-Mode', metadata.agentMode || 'Agent');
    res.flushHeaders();

    // Emit initial progress event
    this._emitSSE(res, 'agent_status', {
      status: 'started', iteration: 0,
      agentChain,
      model: targetModel.modelId || targetModel.id,
      modelName: targetModel.name || targetModel.modelName || targetModel.modelId,
      provider: targetProvider.displayName,
      providerId: targetProvider.id
    });
    
    let currentModel = targetModel;
    let currentProvider = targetProvider;
    let isFailover = false;
    let failoverFrom = null;

    let comboModels = [];
    if (requestBody.comboId) {
      const combo = ComboModel.getById(requestBody.comboId);
      if (combo && combo.isActive && combo.modelsList) {
        comboModels = combo.modelsList.map(id => AIModel.getById(id)).filter(m => {
          if (!m || m.status !== 'Active') return false;
          const p = ProviderModel.getById(m.providerId, false);
          return p && p.isActive;
        });
      }
    }

    let modelResponse;

    try {
      while (iteration < this.MAX_LOOP_DEPTH) {
        iteration++;

        let attemptCount = 0;
        const poolSize = comboModels.length > 0 ? comboModels.length : AIModel.getActiveModels().length;
        const maxAttempts = Math.max(10, poolSize * 2);
        
        while (attemptCount < maxAttempts) {
          attemptCount++;
          try {
            // ── Call the cloud model ──
            this._emitSSE(res, 'agent_status', {
              status: 'inference', iteration,
              message: `Calling ${currentModel.modelId} (iteration ${iteration}${isFailover ? ' - Failover' : ''})...`,
              model: currentModel.modelId || currentModel.id,
              modelName: currentModel.name || currentModel.modelName || currentModel.modelId,
              providerId: currentProvider.id,
              provider: currentProvider.displayName
            });

            const inferenceStart = Date.now();
            modelResponse = await this._callModel(
              currentProvider, currentModel, currentMessages, tools, requestBody
            );
            const inferenceMs = Date.now() - inferenceStart;
            
            if (modelResponse) {
              this._emitSSE(res, 'resolved_model', {
                modelId: currentModel.modelId || currentModel.id,
                modelName: currentModel.name || currentModel.modelName || currentModel.modelId,
                providerId: currentProvider.id,
                providerName: currentProvider.displayName,
                isFailover
              });

              LogModel.recordApiLog({
                providerId: currentProvider.id,
                providerName: currentProvider.displayName,
                modelId: currentModel.modelId,
                clientKey: 'direct-ui',
                endpoint: '/v1/chat/completions',
                promptTokens: modelResponse.usage?.prompt_tokens || 0,
                completionTokens: modelResponse.usage?.completion_tokens || 0,
                latencyMs: inferenceMs,
                statusCode: 200,
                status: isFailover ? 'SUCCESS_FAILOVER_AGENT' : 'SUCCESS_AGENT',
                requestPayload: { model: currentModel.modelId, messagesCount: currentMessages.length, toolsCount: tools ? tools.length : 0 },
                responseSummary: `Agent iteration ${iteration}`,
                failoverReason: isFailover ? `Rerouted from ${failoverFrom}` : null
              });
              break; // Success! Break out of failover loop
            }
          } catch (err) {
            LogModel.recordSystemLog('AGENT_LOOP_ERROR', 'WARN', `Provider '${currentProvider.displayName}' failed: ${err.message}. Attempting failover.`);
            let backupModel = null;
            if (comboModels.length > 0) {
              const currentIdx = comboModels.findIndex(m => m.id === currentModel.id);
              if (err.message && err.message.includes('429')) {
                const crossModels = comboModels.filter((m, idx) => idx !== currentIdx && m.providerId !== currentProvider.id);
                if (crossModels.length > 0) backupModel = crossModels[0];
              }
              if (!backupModel) {
                 const nextIdx = (currentIdx >= 0 ? currentIdx + attemptCount : attemptCount) % comboModels.length;
                 backupModel = comboModels[nextIdx];
              }
            } else {
               const activeModels = AIModel.getActiveModels();
               const crossModels = activeModels.filter(m => m.providerId !== currentProvider.id && m.id !== currentModel.id);
               if (crossModels.length > 0) backupModel = crossModels[attemptCount % crossModels.length];
            }
            
            if (backupModel) {
              const backupProvider = ProviderModel.getById(backupModel.providerId, false);
              if (backupProvider && backupProvider.isActive) {
                isFailover = true;
                failoverFrom = currentModel.modelId;
                currentModel = backupModel;
                currentProvider = backupProvider;
                LogModel.recordSystemLog('AUTO_FAILOVER', 'WARN', `Agent Loop Failover: rerouting to '${backupModel.modelId}'`);
                continue; // Retry with backup model
              }
            }
            if (attemptCount >= maxAttempts) throw err; // Exhausted attempts
          }
        }

        if (!modelResponse) {
          this._emitSSE(res, 'error', { message: 'No response from model.' });
          break;
        }

        // ── Check if model wants to call tools ──
        if (modelResponse.toolCalls && modelResponse.toolCalls.length > 0) {
          // Add assistant message with tool calls to conversation
          currentMessages.push({
            role: 'assistant',
            content: modelResponse.textContent || null,
            tool_calls: modelResponse.toolCalls
          });

          // Stream any partial text before tool execution
          if (modelResponse.textContent) {
            this._emitSSE(res, 'text_delta', { content: modelResponse.textContent });
          }

          // Execute each tool call
          for (const toolCall of modelResponse.toolCalls) {
            const toolName = toolCall.function?.name || 'unknown';
            const toolArgs = this._safeParseArgs(toolCall.function?.arguments);

            this._emitSSE(res, 'tool_call', {
              toolId: toolCall.id, toolName, arguments: toolArgs,
              isReadOnly: this.READ_ONLY_TOOLS.has(toolName),
              iteration
            });

            agentChain.push(`Tool: ${toolName}`);
            const toolStart = Date.now();
            let toolResult;

            try {
              toolResult = await this._executeTool(toolName, toolArgs);
            } catch (toolErr) {
              toolResult = { success: false, error: toolErr.message || 'Tool execution failed.' };
            }

            const toolDurationMs = Date.now() - toolStart;
            executedTools.push({ tool: toolName, input: toolArgs, output: toolResult, durationMs: toolDurationMs });

            this._emitSSE(res, 'tool_result', {
              toolId: toolCall.id, toolName, result: toolResult,
              durationMs: toolDurationMs, iteration
            });

            // Add tool result to messages for next inference
            currentMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult).substring(0, 15000) // Safety truncation
            });
          }

          // Continue loop for next inference with tool results
          continue;
        }

        // ── Model returned final text (no tool calls) — Stream it ──
        if (modelResponse.textContent) {
          this._emitSSE(res, 'text_delta', { content: modelResponse.textContent });
        } else if (!modelResponse.toolCalls || modelResponse.toolCalls.length === 0) {
          // If model returned empty text and no tool calls, retry without tools for direct conversational response
          try {
            const noToolRes = await this._callModelWithoutTools(currentProvider, currentModel, currentMessages, requestBody);
            if (noToolRes && noToolRes.textContent) {
              modelResponse.textContent = noToolRes.textContent;
              this._emitSSE(res, 'text_delta', { content: noToolRes.textContent });
              if (noToolRes.thinkingContent) this._emitSSE(res, 'thinking', { content: noToolRes.thinkingContent });
            }
          } catch (retryErr) {}
        }

        // ── Emit thinking trace if present ──
        if (modelResponse.thinkingContent) {
          this._emitSSE(res, 'thinking', { content: modelResponse.thinkingContent });
        }

        // ── Final response reached — break loop ──
        break;
      }

      // ── Emit completion metadata ──
      const totalMs = Date.now() - startTime;
      this._emitSSE(res, 'agent_complete', {
        iterations: iteration,
        agentChain,
        toolsExecuted: executedTools.map(t => ({ tool: t.tool, durationMs: t.durationMs, success: t.output?.success })),
        latencyBreakdown: {
          totalMs,
          contextHydrationMs: metadata.contextHydrationMs || 0,
          toolExecutionMs: executedTools.reduce((s, t) => s + t.durationMs, 0),
          cloudInferenceMs: totalMs - (metadata.contextHydrationMs || 0) - executedTools.reduce((s, t) => s + t.durationMs, 0)
        },
        tokenUsage: modelResponse?.usage || {},
        model: currentModel.modelId || currentModel.id,
        provider: currentProvider.displayName,
        providerId: currentProvider.id,
        isFailover,
        failoverFrom
      });

    } catch (err) {
      this._emitSSE(res, 'error', { message: err.message || 'Agent loop encountered an error.' });
      LogModel.recordSystemLog('AGENT_LOOP_ERROR', 'ERROR', err.message, { iteration, stack: err.stack });
    } finally {
      // End SSE stream
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }

  // ── Call Cloud Model (non-streaming, for tool loop) ──
  static async _callModel(provider, model, messages, tools, requestBody) {
    const realKey = ProviderModel.resolveRealApiKey(provider.id, provider.apiKey, provider.baseUrl);
    const baseUrl = (provider.baseUrl || '').trim().replace(/\/+$/, '');
    
    let fullUrl = `${baseUrl}/chat/completions`;
    if (provider.protocol === 'ANTHROPIC') {
      fullUrl = `${baseUrl}/messages`;
    } else if (provider.protocol === 'Gemini API' && !fullUrl.includes('/openai/') && baseUrl.includes('googleapis.com')) {
      fullUrl = `${baseUrl}/openai/chat/completions`;
    }

    const payload = {
      model: model.modelId || model.id,
      messages: messages.filter(m => m.role !== 'tool' || m.tool_call_id).map(m => {
        const msg = { role: m.role, content: m.content };
        if (m.tool_calls) msg.tool_calls = m.tool_calls;
        if (m.tool_call_id) { msg.tool_call_id = m.tool_call_id; msg.role = 'tool'; }
        return msg;
      }),
      temperature: requestBody.temperature || 0.7,
      max_tokens: requestBody.max_tokens || 4096,
      stream: false
    };

    // Include tools only if model supports function calling and we have tools
    if (tools && tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = 'auto';
    }

    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${realKey}`,
          'User-Agent': 'FMC-AgentLoop/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60000)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        // If tools not supported, retry without tools
        if (response.status === 400 && tools && (errorText.includes('tools') || errorText.includes('function'))) {
          return this._callModelWithoutTools(provider, model, messages, requestBody);
        }
        throw new Error(`Model API ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      const choice = data.choices && data.choices[0];
      if (!choice && !data.message && !data.response) return { textContent: '', toolCalls: [], usage: data.usage || {} };

      let textContent = choice?.message?.content || choice?.text || (typeof data.response === 'string' ? data.response : '') || '';
      const reasoning = choice?.message?.reasoning_content || choice?.message?.reasoning || this._extractThinking(textContent);

      if (!textContent && reasoning) {
        textContent = reasoning;
      }
      if (!textContent && data.message) {
        textContent = typeof data.message === 'string' ? data.message : (data.message.content || '');
      }

      return {
        textContent: textContent || '',
        toolCalls: choice?.message?.tool_calls || [],
        thinkingContent: reasoning || this._extractThinking(textContent),
        usage: data.usage || {},
        finishReason: choice?.finish_reason
      };
    } catch (err) {
      throw err;
    }
  }

  // ── Fallback: Call model without tool schemas ──
  static async _callModelWithoutTools(provider, model, messages, requestBody) {
    const realKey = ProviderModel.resolveRealApiKey(provider.id, provider.apiKey, provider.baseUrl);
    const baseUrl = (provider.baseUrl || '').trim().replace(/\/+$/, '');
    
    let fullUrl = `${baseUrl}/chat/completions`;
    if (provider.protocol === 'ANTHROPIC') {
      fullUrl = `${baseUrl}/messages`;
    } else if (provider.protocol === 'Gemini API' && !fullUrl.includes('/openai/') && baseUrl.includes('googleapis.com')) {
      fullUrl = `${baseUrl}/openai/chat/completions`;
    }

    const payload = {
      model: model.modelId || model.id,
      messages: messages.filter(m => m.role !== 'tool').map(m => ({ role: m.role, content: m.content || '' })),
      temperature: requestBody.temperature || 0.7,
      max_tokens: requestBody.max_tokens || 4096,
      stream: false
    };

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${realKey}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000)
    });

    const data = await response.json();
    const choice = data.choices && data.choices[0];
    let textContent = choice?.message?.content || choice?.text || (typeof data.response === 'string' ? data.response : '') || '';
    const reasoning = choice?.message?.reasoning_content || choice?.message?.reasoning || this._extractThinking(textContent);

    if (!textContent && reasoning) {
      textContent = reasoning;
    }
    if (!textContent && data.message) {
      textContent = typeof data.message === 'string' ? data.message : (data.message.content || '');
    }

    return {
      textContent: textContent || '',
      toolCalls: [],
      thinkingContent: reasoning || this._extractThinking(textContent),
      usage: data.usage || {},
      finishReason: choice?.finish_reason
    };
  }

  // ── Execute Individual Tool ──
  static async _executeTool(toolName, args) {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Tool '${toolName}' timed out after ${this.TOOL_TIMEOUT_MS}ms`)), this.TOOL_TIMEOUT_MS)
    );

    const executionPromise = (async () => {
      switch (toolName) {
        case 'web_search':
          return AntigravityToolExecutionEngine.executeWebSearch(args.query);
        case 'read_file':
          return AntigravityToolExecutionEngine.readFileContent
            ? AntigravityToolExecutionEngine.readFileContent(args.filePath)
            : this._readFileContent(args.filePath);
        case 'write_file':
          return AntigravityToolExecutionEngine.saveCodeToFile(args.filePath, args.content);
        case 'run_command':
          return AntigravityToolExecutionEngine.executePowerShellCommand(args.commandLine);
        case 'grep_search':
          return AntigravityToolExecutionEngine.executeSemanticSearch(args.query, 10);
        case 'generate_image':
          return AntigravityToolExecutionEngine.generateImage(args.prompt, args.imageName || 'generated');
        case 'browse_url':
          return this._fetchUrlContent(args.url);
        case 'youtube_transcript':
          return AntigravityToolExecutionEngine.extractYouTubeTranscript(args.videoUrl);
        default:
          return { success: false, error: `Unknown tool: '${toolName}'` };
      }
    })();

    return Promise.race([executionPromise, timeoutPromise]);
  }

  // ── Helper: Read File Content ──
  static _readFileContent(filePath) {
    const fs = require('fs');
    const path = require('path');
    try {
      const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(resolved)) return { success: false, error: `File not found: ${resolved}` };
      const content = fs.readFileSync(resolved, 'utf8');
      return { success: true, filePath: resolved, content: content.substring(0, 50000), totalChars: content.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ── Helper: Fetch URL Content ──
  static async _fetchUrlContent(url) {
    if (!url) return { success: false, error: 'URL is required.' };
    return new Promise((resolve) => {
      const mod = url.startsWith('https') ? https : http;
      const req = mod.get(url, { headers: { 'User-Agent': 'FMC-Agent/1.0' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // Strip HTML tags for a text-only representation
          const text = data.replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 20000);
          resolve({ success: true, url, content: text, charCount: text.length });
        });
      });
      req.on('error', err => resolve({ success: false, error: err.message }));
      req.setTimeout(8000, () => { req.destroy(); resolve({ success: false, error: 'URL fetch timed out.' }); });
    });
  }

  // ── Helper: Extract <think> blocks ──
  static _extractThinking(content) {
    if (!content) return '';
    const match = content.match(/<think>([\s\S]*?)<\/think>/i);
    return match ? match[1].trim() : '';
  }

  // ── Helper: Safe JSON parse for tool arguments ──
  static _safeParseArgs(argsStr) {
    if (!argsStr) return {};
    if (typeof argsStr === 'object') return argsStr;
    try { return JSON.parse(argsStr); } catch { return { raw: argsStr }; }
  }

  // ── SSE Event Emitter ──
  static _emitSSE(res, eventType, data) {
    try {
      if (res.writableEnded) return;
      const payload = JSON.stringify({ type: eventType, ...data, timestamp: Date.now() });
      res.write(`data: ${payload}\n\n`);
    } catch (e) { /* Client disconnected */ }
  }
}

module.exports = ToolExecutionLoopService;

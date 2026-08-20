/**
 * ChatOrchestrator.js
 * Purpose: Client-side Antigravity-class 5-phase chat pipeline orchestrator.
 *          Replaces the simple fetch→stream→render loop with:
 *          Phase 1: Input Processing → Phase 2: Context Hydration → Phase 3: Request Dispatch
 *          → Phase 4: SSE Multi-Event Stream Processing → Phase 5: Rich UI Rendering
 * Dependencies: ChatMarkdownRenderer, PlaygroundView, PlaygroundTrayDrawerHelper, ApiService
 * Architecture: Dimension 1 (View) — Orchestration Controller Layer
 */

class ChatOrchestrator {
  static isExecuting = false;
  static activeAbortController = null;
  static executedTools = [];
  static agentMetadata = {};
  static messageQueue = [];

  /**
   * Execute the full 5-phase Antigravity pipeline.
   * @param {Object} opts
   * @param {string} opts.userText - Raw user input text
   * @param {string} opts.modelId - Selected model ID
   * @param {Object} opts.activeSession - Active chat session object
   * @param {string} opts.agentMode - 'Agent' | 'Ask' | 'Plan'
   * @param {Array} opts.attachments - Context attachments [{name, type, data}]
   * @param {Object} opts.workspaceContext - {openFiles, cursorPosition, workspacePath}
   */
  static async execute(opts) {
    const { userText, modelId, activeSession, agentMode = 'Agent', attachments = [], workspaceContext = {} } = opts;

    if (this.isExecuting) {
      // Queue the message if an agent loop is already active
      this.messageQueue.push(opts);
      if (typeof ModalDialog !== 'undefined') {
        ModalDialog.showNotification('Agent is working. Your message has been queued.', 'info');
      }
      return;
    }

    this.isExecuting = true;
    this.executedTools = [];
    this.agentMetadata = {};
    this.activeAbortController = new AbortController();

    // ── Phase 1: Input Processing ──
    let processedText = userText;

    // Slash command expansion
    const availablePrompts = (typeof PlaygroundInputHelper !== 'undefined' && PlaygroundInputHelper.slashPrompts) 
      ? PlaygroundInputHelper.slashPrompts 
      : [];
    const slashMatch = availablePrompts.find(p => processedText.startsWith(p.cmd));
    if (slashMatch) {
      processedText = processedText.replace(slashMatch.cmd, slashMatch.prompt);
    }

    // Agent tag injection
    if (typeof PlaygroundView !== 'undefined' && PlaygroundView.currentAgent && PlaygroundView.currentAgent !== '@copilot') {
      processedText = PlaygroundView.currentAgent + ' ' + processedText;
    }

    // ── Phase 2: Context Hydration (Parallel) ──
    const contextPayload = {
      workspacePath: workspaceContext.workspacePath || localStorage.getItem('fmc_ide_workspace') || '',
      openFiles: workspaceContext.openFiles || [],
      cursorPosition: workspaceContext.cursorPosition || null,
      agentMode,
      attachments: attachments.map(a => ({ name: a.name, type: a.type }))
    };

    // ── Add user message to session ──
    const userMsg = { role: 'user', content: processedText, timestamp: new Date().toISOString() };
    activeSession.messages.push(userMsg);

    const modelSelectEl = document.getElementById('ollama-model-select');
    let modelDisplayName = '';
    if (modelSelectEl && modelSelectEl.selectedIndex >= 0 && modelSelectEl.options[modelSelectEl.selectedIndex]) {
      modelDisplayName = modelSelectEl.options[modelSelectEl.selectedIndex].text.replace(' (Inactive)', '').trim();
    }
    if (!modelDisplayName || modelDisplayName === 'Agent' || modelDisplayName === '@copilot') {
      const mObj = (window.PlaygroundView?.allModels || []).find(m => m.id === modelId || m.modelId === modelId);
      modelDisplayName = mObj ? (mObj.name || mObj.modelName || mObj.id) : modelId;
    }

    const assistantMsg = {
      role: 'assistant',
      content: '',
      modelName: modelDisplayName,
      timestamp: new Date().toISOString(),
      agentMetadata: {},
      toolsExecuted: []
    };
    activeSession.messages.push(assistantMsg);

    // Update UI
    if (typeof PlaygroundView !== 'undefined') {
      PlaygroundView.isGenerating = true;
      PlaygroundView.activeAbortController = this.activeAbortController;
      PlaygroundView.updateSendButtonState(true);
      PlaygroundView.renderMessages();
      PlaygroundView.renderAgentsWindow();
      PlaygroundView.saveSessions();
    }

    const msgIndex = activeSession.messages.length - 1;
    const assistantBubbleId = 'msg_bubble_' + msgIndex;
    const mainBubbleId = 'main_msg_bubble_' + msgIndex;

    // ── Phase 3: Request Dispatch ──
    try {
      const requestPayload = {
        model: modelId,
        messages: activeSession.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        stream: true,
        agentMode,
        context: contextPayload,
        temperature: activeSession.temperature || 0.7,
        max_tokens: activeSession.maxTokens || 4096
      };

      const response = await fetch('/v1/chat/completions/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((typeof ApiService !== 'undefined') ? ApiService.getAuthHeader() : {})
        },
        body: JSON.stringify(requestPayload),
        signal: this.activeAbortController.signal
      });

      // If agent endpoint not found, fall back to standard endpoint
      if (response.status === 404) {
        return await this._fallbackToStandardStream(activeSession, assistantMsg, msgIndex, modelId, assistantBubbleId, mainBubbleId);
      }

      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
      }

      // ── Dynamic Model Header Synchronization ──
      const resolvedModelName = response.headers.get('X-FMC-Resolved-Model-Name');
      const resolvedModelId = response.headers.get('X-FMC-Resolved-Model');
      const resolvedProvider = response.headers.get('X-FMC-Resolved-Provider');
      const isFailover = response.headers.get('X-FMC-Failover') === 'true';
      if (resolvedModelName || resolvedModelId) {
        assistantMsg.modelName = isFailover ? `${resolvedModelName || resolvedModelId} (Failover)` : (resolvedModelName || resolvedModelId);
        const badgeEl = document.querySelector(`[data-msg-index="${msgIndex}"] .chat-bubble-model-tag`) ||
                        document.getElementById(`model_tag_${msgIndex}`);
        if (badgeEl) badgeEl.textContent = `jDroid-X-FMC (${assistantMsg.modelName})`;

        if (typeof PlaygroundView !== 'undefined' && PlaygroundView.syncActiveModelSelection) {
          PlaygroundView.syncActiveModelSelection(resolvedModelId, resolvedProvider, resolvedModelName, isFailover);
        }
      }

      // ── Phase 4: SSE Multi-Event Stream Processing ──
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let buffer = '';
      let thinkingText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.substring(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const event = JSON.parse(jsonStr);

            switch (event.type) {
              case 'text_delta':
                fullText += event.content || '';
                assistantMsg.content = fullText;
                this._updateBubble(assistantBubbleId, mainBubbleId, fullText);
                break;

              case 'thinking':
                thinkingText += event.content || '';
                // Wrap thinking in <think> tags for the renderer
                assistantMsg.content = `<think>${thinkingText}</think>\n\n${fullText}`;
                this._updateBubble(assistantBubbleId, mainBubbleId, assistantMsg.content);
                break;

              case 'tool_call':
                this._showToolProgress(event.toolName, event.iteration, 'executing');
                break;

              case 'tool_result':
                this._showToolProgress(event.toolName, event.iteration, 'completed', event.durationMs);
                this.executedTools.push({
                  tool: event.toolName,
                  durationMs: event.durationMs,
                  success: event.result?.success
                });
                // Update file changes tray if tool was a write
                if (event.toolName === 'write_file' && event.result?.success) {
                  this._addFileChange(event.result);
                }
                break;

              case 'agent_status':
                if (event.modelName || event.model) {
                  assistantMsg.modelName = event.modelName || event.model;
                  const tagEl = document.getElementById(`model_tag_${msgIndex}`);
                  if (tagEl) tagEl.textContent = `jDroid-X-FMC (${assistantMsg.modelName})`;
                }
                this._updateAgentStatus(event);
                break;

              case 'resolved_model':
                if (event.modelName || event.modelId) {
                  const resolvedLabel = event.isFailover ? `${event.modelName || event.modelId} (Failover)` : (event.modelName || event.modelId);
                  assistantMsg.modelName = resolvedLabel;
                  assistantMsg.modelId = event.modelId;
                  const tagEl = document.getElementById(`model_tag_${msgIndex}`);
                  if (tagEl) tagEl.textContent = `jDroid-X-FMC (${resolvedLabel})`;

                  if (typeof window.PlaygroundView !== 'undefined' && window.PlaygroundView.syncActiveModelSelection) {
                    window.PlaygroundView.syncActiveModelSelection(event.modelId, event.providerId, event.modelName, event.isFailover);
                  }
                }
                break;

              case 'agent_complete':
                this.agentMetadata = event;
                assistantMsg.agentMetadata = event;
                assistantMsg.toolsExecuted = this.executedTools;
                assistantMsg.tokenCount = event.tokenUsage?.total_tokens;
                assistantMsg.latencyMs = event.latencyBreakdown?.totalMs;
                if (event.modelName || event.model) {
                  const finalLabel = event.isFailover ? `${event.modelName || event.model} (Failover)` : (event.modelName || event.model);
                  assistantMsg.modelName = finalLabel;
                  const tagEl = document.getElementById(`model_tag_${msgIndex}`);
                  if (tagEl) tagEl.textContent = `jDroid-X-FMC (${finalLabel})`;
                }
                
                // Sync UI if agent dynamically failed over to another provider/model
                if (typeof window.PlaygroundView !== 'undefined' && window.PlaygroundView.syncActiveModelSelection) {
                  window.PlaygroundView.syncActiveModelSelection(event.model, event.providerId, event.modelName || event.model, event.isFailover);
                }
                break;

              case 'error':
                fullText += `\n\n> [!CAUTION]\n> **Agent Error**: ${event.message}\n`;
                assistantMsg.content = fullText;
                this._updateBubble(assistantBubbleId, mainBubbleId, fullText);
                break;

              default:
                // Standard OpenAI SSE format fallback
                if (event.choices && event.choices[0]?.delta?.content) {
                  fullText += event.choices[0].delta.content;
                  assistantMsg.content = fullText;
                  this._updateBubble(assistantBubbleId, mainBubbleId, fullText);
                }
                break;
            }
          } catch (e) { /* Skip malformed JSON lines */ }
        }
      }

      // Finalize content
      if (!fullText && buffer) {
        try {
          const parsed = JSON.parse(buffer);
          fullText = parsed.choices?.[0]?.message?.content || '';
        } catch (e) {}
      }

      const finalBody = fullText || (thinkingText ? '' : 'Hello! I am jDroid-X-FMC AI. How can I assist you with your project today?');
      assistantMsg.content = thinkingText
        ? `<think>${thinkingText}</think>\n\n${finalBody}`
        : finalBody;

      this._updateBubble(assistantBubbleId, mainBubbleId, assistantMsg.content);

    } catch (err) {
      if (err.name === 'AbortError') {
        assistantMsg.content += ' [Generation Stopped]';
      } else {
        assistantMsg.content = `> [!CAUTION]\n> **Error**: ${err.message || 'Failed to connect to proxy endpoint.'}\n`;
        this._showErrorRecovery(err, activeSession, opts);
      }
      this._updateBubble(assistantBubbleId, mainBubbleId, assistantMsg.content);
    } finally {
      this.isExecuting = false;
      this.activeAbortController = null;
      this._hideToolProgress();

      if (typeof PlaygroundView !== 'undefined') {
        PlaygroundView.isGenerating = false;
        PlaygroundView.activeAbortController = null;
        PlaygroundView.updateSendButtonState(false);
        PlaygroundView.saveSessions();
        PlaygroundView.renderMessages();
        PlaygroundView.renderAgentsWindow();
      }

      // Process queued messages
      if (this.messageQueue.length > 0) {
        const next = this.messageQueue.shift();
        setTimeout(() => this.execute(next), 300);
      }
    }
  }

  // ── Fallback to standard /v1/chat/completions streaming ──
  static async _fallbackToStandardStream(session, assistantMsg, msgIndex, modelId, bubbleId, mainBubbleId) {
    try {
      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((typeof ApiService !== 'undefined') ? ApiService.getAuthHeader() : {})
        },
        body: JSON.stringify({
          model: modelId,
          messages: session.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
          stream: true
        }),
        signal: this.activeAbortController.signal
      });

      if (!response.ok) throw new Error('HTTP ' + response.status);

      const resolvedModelName = response.headers.get('X-FMC-Resolved-Model-Name');
      const resolvedModelId = response.headers.get('X-FMC-Resolved-Model');
      const resolvedProvider = response.headers.get('X-FMC-Resolved-Provider');
      const isFailover = response.headers.get('X-FMC-Failover') === 'true';
      if (resolvedModelName || resolvedModelId) {
        assistantMsg.modelName = isFailover ? `${resolvedModelName || resolvedModelId} (Failover)` : (resolvedModelName || resolvedModelId);
        const badgeEl = document.querySelector(`[data-msg-index="${msgIndex}"] .chat-bubble-model-tag`) ||
                        document.getElementById(`model_tag_${msgIndex}`);
        if (badgeEl) badgeEl.textContent = assistantMsg.modelName;

        if (typeof PlaygroundView !== 'undefined' && PlaygroundView.syncActiveModelSelection) {
          PlaygroundView.syncActiveModelSelection(resolvedModelId, resolvedProvider, resolvedModelName, isFailover);
        }
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.substring(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content;
              if (delta) {
                fullText += delta;
                assistantMsg.content = fullText;
                this._updateBubble(bubbleId, mainBubbleId, fullText);
              }
            } catch (e) {}
          }
        }
      }

      // Finalize content for non-SSE or buffered JSON
      if (!fullText && buffer) {
        try {
          const parsed = JSON.parse(buffer);
          fullText = parsed.choices?.[0]?.message?.content || parsed.choices?.[0]?.text || '';
        } catch (e) {}
      }

      assistantMsg.content = fullText || 'No response returned from model.';
      this._updateBubble(bubbleId, mainBubbleId, assistantMsg.content);
    } catch (err) {
      if (err.name !== 'AbortError') {
        assistantMsg.content = 'Error: ' + (err.message || 'Connection failed.');
        this._updateBubble(bubbleId, mainBubbleId, assistantMsg.content);
      }
    }
  }

  // ── UI Update Helpers (RAF Throttled for 60/120 FPS Smooth Streaming) ──
  static _pendingUpdate = null;
  static _rafId = null;

  static _updateBubble(bubbleId, mainBubbleId, text, forceImmediate = false) {
    this._pendingUpdate = { bubbleId, mainBubbleId, text };

    if (forceImmediate) {
      if (this._rafId) {
        cancelAnimationFrame(this._rafId);
        this._rafId = null;
      }
      this._flushBubbleUpdate();
      return;
    }

    if (!this._rafId) {
      this._rafId = requestAnimationFrame(() => {
        this._rafId = null;
        this._flushBubbleUpdate();
      });
    }
  }

  static _flushBubbleUpdate() {
    if (!this._pendingUpdate) return;
    const { bubbleId, mainBubbleId, text } = this._pendingUpdate;
    this._pendingUpdate = null;

    const rendered = typeof ChatMarkdownRenderer !== 'undefined'
      ? ChatMarkdownRenderer.render(text)
      : (typeof PlaygroundViewHelper !== 'undefined' ? PlaygroundViewHelper.formatChatMessageContent(text) : text);

    const el = document.getElementById(bubbleId);
    const mainEl = document.getElementById(mainBubbleId);
    if (el) el.innerHTML = rendered;
    if (mainEl) mainEl.innerHTML = rendered;

    // Auto-scroll
    const container = document.getElementById('chat-messages-container');
    const mainContainer = document.getElementById('fmc-main-content');
    if (container) container.scrollTop = container.scrollHeight;
    if (mainContainer) mainContainer.scrollTop = mainContainer.scrollHeight;
  }

  static _showToolProgress(toolName, iteration, status, durationMs) {
    let panel = document.getElementById('agv-tool-progress-panel');
    if (!panel) {
      // Create the floating tool progress panel
      const container = document.getElementById('chat-messages-container');
      if (!container) return;
      panel = document.createElement('div');
      panel.id = 'agv-tool-progress-panel';
      panel.className = 'agv-tool-progress';
      container.parentElement.insertBefore(panel, container.nextSibling);
    }

    const toolIcon = {
      'web_search': 'fa-globe', 'read_file': 'fa-file-code', 'write_file': 'fa-floppy-disk',
      'run_command': 'fa-terminal', 'grep_search': 'fa-magnifying-glass', 'generate_image': 'fa-image',
      'browse_url': 'fa-globe', 'youtube_transcript': 'fa-youtube'
    }[toolName] || 'fa-gear';

    const statusClass = status === 'completed' ? 'agv-tool-done' : 'agv-tool-active';
    const statusIcon = status === 'completed' ? '<i class="fa-solid fa-check-circle" style="color:var(--accent-emerald)"></i>' : '<i class="fa-solid fa-spinner fa-spin" style="color:var(--accent-cyan)"></i>';
    const durationLabel = durationMs ? ` (${durationMs}ms)` : '';

    // Append or update the tool entry
    const entryId = `agv-tool-${toolName}-${iteration}`;
    let entry = document.getElementById(entryId);
    if (!entry) {
      entry = document.createElement('div');
      entry.id = entryId;
      entry.className = `agv-tool-entry ${statusClass}`;
      panel.appendChild(entry);
    }
    entry.className = `agv-tool-entry ${statusClass}`;
    entry.innerHTML = `${statusIcon} <i class="fa-solid ${toolIcon}"></i> <span>${toolName}</span>${durationLabel}`;
    panel.style.display = 'flex';
  }

  static _hideToolProgress() {
    const panel = document.getElementById('agv-tool-progress-panel');
    if (panel) {
      setTimeout(() => { panel.style.display = 'none'; }, 3000);
    }
  }

  static _updateAgentStatus(event) {
    const statusEl = document.getElementById('agv-agent-status');
    if (!statusEl) return;
    statusEl.textContent = event.message || event.status || '';
  }

  static _addFileChange(result) {
    if (typeof PlaygroundTrayDrawerHelper !== 'undefined' && result.filePath) {
      const fileName = result.filePath.split(/[/\\]/).pop();
      PlaygroundTrayDrawerHelper.fileChanges.push({
        name: fileName,
        path: result.filePath,
        additions: 1,
        deletions: 0,
        status: 'added'
      });
    }
  }

  static _showErrorRecovery(err, session, opts) {
    if (typeof ValidationNotifier !== 'undefined') {
      ValidationNotifier.showOptionPopup({
        title: 'Agent Execution Error',
        message: `The agent engine encountered an error: <code style="color: var(--accent-rose);">${err.message}</code>`,
        icon: 'fa-network-wired',
        options: [
          { 
            id: 'retry', 
            label: 'Retry', 
            type: 'primary', 
            icon: 'fa-rotate-right', 
            action: () => { 
              if (opts && opts.userText) {
                const inputEl = document.getElementById('chat-user-input');
                if (inputEl) inputEl.value = opts.userText;
                if (session && session.messages && session.messages.length >= 2) {
                  session.messages.pop(); // remove assistant msg
                  session.messages.pop(); // remove user msg
                }
              }
              PlaygroundView.sendMessage(); 
            } 
          },
          { id: 'switch', label: 'Switch Provider', type: 'emerald', icon: 'fa-arrow-right-arrow-left', action: () => { ModalDialog.showNotification('Switch provider from the dropdown and retry.', 'info'); } }
        ]
      });
    }
  }

  // ── Abort active execution ──
  static abort() {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
    }
  }
}

window.ChatOrchestrator = ChatOrchestrator;

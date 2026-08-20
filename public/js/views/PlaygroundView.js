/**
 * PlaygroundView.js
 * Purpose: jDroid-X-FMC Agents & Chat Window for FreeModelsClub.
 * Structure: Strict OOPS-based MVC delegation (< 2000 lines).
 * Provider: Ollama (http://localhost:11434/v1)
 */

class PlaygroundView {
  static models = [];
  static isGenerating = false;
  static activeAbortController = null;
  static activeTab = 'agents-window';
  static activeLeftTab = 'chat'; // 'chat' or 'ide'
  static voiceRecognition = null;
  static isVoiceActive = false;
  static activeContextAttachments = [];
  static currentAgent = '@copilot';
  static editorDrawerOpen = false;

  // ── Session Management ──
  static loadSessions() {
    try {
      let sessions = [];
      let activeId = null;

      // Check new key first
      const newSaved = localStorage.getItem('fmc_chat_sessions');
      if (newSaved) {
        sessions = JSON.parse(newSaved);
        activeId = localStorage.getItem('fmc_active_session_id');
      }
      
      // Fallback/merge old key if new key empty
      if (!sessions || sessions.length === 0) {
        const oldSaved = localStorage.getItem('fmc_ollama_sessions');
        if (oldSaved) {
          sessions = JSON.parse(oldSaved);
          activeId = localStorage.getItem('fmc_ollama_active_id');
          
          // Migrate and remove legacy keys
          localStorage.setItem('fmc_chat_sessions', oldSaved);
          if (activeId) localStorage.setItem('fmc_active_session_id', activeId);
          localStorage.removeItem('fmc_ollama_sessions');
          localStorage.removeItem('fmc_ollama_active_id');
        }
      }

      window.app.chatSessions = sessions || [];
      if (activeId) window.app.activeSessionId = activeId;
      
      const topSession = window.app.chatSessions[0];
      if (topSession && topSession.messages.length <= 1) {
         window.app.activeSessionId = topSession.id;
      } else if (!topSession) {
         PlaygroundView.createNewSession();
      }
    } catch (e) {
      console.error('Error loading sessions:', e);
      if (typeof ModalDialog !== 'undefined') ModalDialog.showNotification('Failed to load chat history.', 'error');
      PlaygroundView.createNewSession();
    }
  }

  static saveSessions() {
    try {
      if (!window.app.chatSessions) return;
      const dataStr = JSON.stringify(window.app.chatSessions);
      const activeId = window.app.activeSessionId || '';
      
      localStorage.setItem('fmc_chat_sessions', dataStr);
      localStorage.setItem('fmc_active_session_id', activeId);
    } catch (e) {
      console.error('Error saving sessions:', e);
      if (typeof ModalDialog !== 'undefined') ModalDialog.showNotification('Failed to save chat progress.', 'warning');
    }
  }

  static createNewSession() {
    // ChatSessionViewModel.createNewSession now handles adding it to window.app.chatSessions correctly.
    // However, it pushes it. We want it unshifted, so we pop and unshift.
    const newSession = ChatSessionViewModel.createNewSession(window.app.selectedModelId);
    window.app.chatSessions.pop(); // Remove from end
    window.app.chatSessions.unshift(newSession); // Add to beginning
    
    window.app.activeSessionId = newSession.id;
    window.app.chatHistory = newSession.messages;
    PlaygroundView.saveSessions();
    PlaygroundView.renderSessionList();
    PlaygroundView.renderMessages();
    PlaygroundView.renderAgentsWindow();
  }

  static switchSession(sessionId) {
    window.app.activeSessionId = sessionId;
    PlaygroundView.saveSessions();
    PlaygroundView.renderSessionList();
    PlaygroundView.renderMessages();
    PlaygroundView.renderAgentsWindow();
  }

  static clearChat() {
    if (typeof ValidationNotifier !== 'undefined') {
      ValidationNotifier.showOptionPopup({
        title: 'Clear Chat Session',
        message: 'Are you sure you want to clear all messages in this chat session? This action cannot be undone.',
        confirmText: 'Clear Chat',
        confirmStyle: 'danger',
        onConfirm: () => this._executeClearChat()
      });
    } else {
      if (confirm('Are you sure you want to clear all messages?')) this._executeClearChat();
    }
  }

  static _executeClearChat() {
    const activeSession = (window.app.chatSessions || []).find(s => s.id === window.app.activeSessionId);
    if (activeSession) {
      activeSession.messages = [];
      PlaygroundView.saveSessions();
      PlaygroundView.renderMessages();
      PlaygroundView.renderAgentsWindow();
    }
  }

  static deleteSession(sessionId) {
    if (typeof ValidationNotifier !== 'undefined') {
      ValidationNotifier.showOptionPopup({
        title: 'Delete Chat Session',
        message: 'Are you sure you want to permanently delete this chat session? This action cannot be undone.',
        confirmText: 'Delete Session',
        confirmStyle: 'danger',
        onConfirm: () => this._executeDeleteSession(sessionId)
      });
    } else {
      if (confirm('Are you sure you want to delete this session?')) this._executeDeleteSession(sessionId);
    }
  }

  static _executeDeleteSession(sessionId) {
    if (!window.app.chatSessions) return;
    window.app.chatSessions = window.app.chatSessions.filter(s => s.id !== sessionId);
    if (window.app.chatSessions.length === 0) {
      PlaygroundView.createNewSession();
    } else {
      window.app.activeSessionId = window.app.chatSessions[0].id;
    }
    PlaygroundView.saveSessions();
    PlaygroundView.renderSessionList();
    PlaygroundView.renderMessages();
    PlaygroundView.renderAgentsWindow();
  }

  static async fetchWithTimeout(url, timeoutMs = 350) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch {
      return { ok: false };
    }
  }

  // ── Models & Providers Loader ──
  static async loadAllModels(force = false) {
    if (!force && PlaygroundView.allModels && PlaygroundView.allModels.length > 0 && PlaygroundView.providers && PlaygroundView.providers.length > 0) {
      // Return cached catalog instantly; revalidate in background
      setTimeout(() => PlaygroundView.loadAllModels(true).catch(() => {}), 1000);
      return;
    }

    try {
      const [modelsRes, providersRes, combosRes, ollamaTagsRes, activeCacheRes] = await Promise.all([
        ApiService.getActiveModels().catch(() => ({ models: [] })),
        ApiService.getAllProviders().catch(() => ({ providers: [] })),
        ApiService.getCombos().catch(() => ({ combos: [] })),
        PlaygroundView.fetchWithTimeout('http://localhost:11434/api/tags', 350),
        ApiService.getActiveModelsCache().catch(() => ({ activeModels: [] }))
      ]);

      let allModelsList = (modelsRes && modelsRes.models) ? modelsRes.models : [];
      
      // Filter the models list using the Zero-Trust SSOT ActiveModelAgent cache
      if (activeCacheRes && activeCacheRes.activeModels && activeCacheRes.activeModels.length > 0) {
        const strictCache = activeCacheRes.activeModels;
        allModelsList = allModelsList.filter(m => strictCache.includes(m.id) || strictCache.includes(m.modelId));
      }
      
      PlaygroundView.allModels = allModelsList;
      
      const dbProviders = Array.isArray(providersRes) ? providersRes : (providersRes && providersRes.providers) || [];
      PlaygroundView.providers = dbProviders.filter(p => p.isActive);

      const dbCombos = Array.isArray(combosRes) ? combosRes : (combosRes && combosRes.combos) || [];
      PlaygroundView.combos = dbCombos.filter(c => c.isActive);

      if (ollamaTagsRes && ollamaTagsRes.ok && typeof ollamaTagsRes.json === 'function') {
        try {
          const tagsJson = await ollamaTagsRes.json();
          PlaygroundView.localInstalledModels = (tagsJson.models || []).map(m => m.name);
          PlaygroundView.localIndicatorGreen = true;
        } catch {
          PlaygroundView.localInstalledModels = [];
          PlaygroundView.localIndicatorGreen = false;
        }
      } else {
        PlaygroundView.localInstalledModels = [];
        PlaygroundView.localIndicatorGreen = false;
      }

      if (PlaygroundView.allModels.length === 0) {
        PlaygroundView.allModels = [
          { id: 'llama3:latest', providerId: 'ollama', name: 'Llama 3 (Ollama)' }
        ];
      }
      
      if (PlaygroundView.providers.length === 0) {
        PlaygroundView.providers = [{ id: 'ollama', displayName: 'Ollama / Localhost' }];
      }

    } catch (e) {
      console.error('Error loading models:', e);
      if (typeof ModalDialog !== 'undefined') ModalDialog.showNotification('Error loading AI models. Defaulting to local provider.', 'error');
      PlaygroundView.allModels = [{ id: 'llama3:latest', providerId: 'ollama', name: 'Llama 3 (Ollama)' }];
      PlaygroundView.providers = [{ id: 'ollama', displayName: 'Ollama / Localhost' }];
      PlaygroundView.combos = [];
      PlaygroundView.localInstalledModels = [];
      PlaygroundView.localIndicatorGreen = false;
    }
  }

  static onProviderChange(providerId) {
    const modelSelect = document.getElementById('ollama-model-select');
    if (!modelSelect) return;

    if (typeof ModelDropdownHelper !== 'undefined') {
      const allM = PlaygroundView.allModels || [];
      const isGreen = PlaygroundView.localIndicatorGreen;
      const installed = PlaygroundView.localInstalledModels || [];
      // Determine a sensible default model for the chosen provider/combo
      // Prefer a model already selected by the user if it belongs to this provider
      let defaultModelId = window.app.selectedModelId;
      const providerModels = ModelDropdownHelper.renderModelsDropdownHtml(allM, providerId, isGreen, installed, '');
      // Check if the current selected model is valid for this provider
      // Since ModelDropdownHelper filters allM internally, we can check if defaultModelId matches any of the models that would be returned.
      // But a cleaner way is just to see if the rendered HTML string contains value="defaultModelId"
      // Even better, avoid DOM parsing and just filter directly.
      let filteredModels = [];
      const isCombo = (PlaygroundView.combos && PlaygroundView.combos.some(c => c.id === providerId)) || providerId.startsWith('combo_') || providerId.includes('combo');
      
      if (isCombo) {
        let comboObj = PlaygroundView.combos ? PlaygroundView.combos.find(x => x.id === providerId || x.id === providerId.replace('combo_', '')) : null;
        filteredModels = [{ id: providerId }];
        if (comboObj && Array.isArray(comboObj.modelsList || comboObj.models)) {
          const memberIds = comboObj.modelsList || comboObj.models;
          const memberModels = allM.filter(m => memberIds.includes(m.id) || memberIds.includes(m.modelId));
          filteredModels = filteredModels.concat(memberModels);
        }
      } else if (providerId) {
        filteredModels = allM.filter(m => m.providerId === providerId || m.providerId === `prov_${providerId}` || providerId === `prov_${m.providerId}` || (m.provider && m.provider === providerId));
        if (filteredModels.length === 0 && (providerId === 'ollama' || providerId === 'prov_ollama')) {
          filteredModels = allM.filter(m => m.id.toLowerCase().includes('ollama'));
        }
      } else {
        filteredModels = allM;
      }

      const optionExists = filteredModels.some(m => m.id === defaultModelId || m.modelId === defaultModelId);
      if (!optionExists && filteredModels.length > 0) {
        defaultModelId = filteredModels[0].id;
      } else if (filteredModels.length === 0) {
        defaultModelId = '';
      }

      modelSelect.innerHTML = ModelDropdownHelper.renderModelsDropdownHtml(allM, providerId, isGreen, installed, defaultModelId);
      
      // Sync the global selected model ID
      window.app.selectedModelId = defaultModelId;
      
      // Reinitialize searchable select for updated model options
      if (typeof SearchableSelect !== 'undefined') {
        SearchableSelect.init(modelSelect, { placeholder: 'Search models...', maxHeight: 300 });
      }
    }

    // Automatically trigger onModelChange for the newly selected option
    if (modelSelect.options && modelSelect.options.length > 0) {
       const selectedIdx = modelSelect.selectedIndex > -1 ? modelSelect.selectedIndex : 0;
       PlaygroundView.onModelChange(modelSelect.options[selectedIdx].value);
    }
  }

  // ── Render Entrypoint ──
  static async render(container) {
    if (!PlaygroundView.allModels || PlaygroundView.allModels.length === 0) {
      PlaygroundView.allModels = [
        { id: 'llama-3.3-70b-versatile', providerId: 'groq', name: 'Llama 3.3 70B (Groq)' },
        { id: 'llama3:latest', providerId: 'ollama', name: 'Llama 3 (Ollama)' }
      ];
      PlaygroundView.providers = [
        { id: 'groq', displayName: 'Groq Cloud' },
        { id: 'ollama', displayName: 'Ollama / Localhost' }
      ];
    }
    PlaygroundView.loadSessions();

    const selectedModelId = window.app.selectedModelId || 'llama-3.3-70b-versatile';
    let initialProvider = 'groq';
    const selectedModelObj = PlaygroundView.allModels.find(m => m.id === selectedModelId);
    if (selectedModelObj && selectedModelObj.providerId) {
       initialProvider = selectedModelObj.providerId;
    }

    let providerOptions = '';
    if (typeof ModelDropdownHelper !== 'undefined') {
      providerOptions = ModelDropdownHelper.renderProviderComboDropdownHtml(
         PlaygroundView.providers || [],
         PlaygroundView.combos || [],
         initialProvider,
         PlaygroundView.allModels || []
      );
    }

    let initialModels = PlaygroundView.allModels.filter(m => m.providerId === initialProvider || (m.provider && m.provider === initialProvider));
    if (initialModels.length === 0 && initialProvider === 'ollama') {
       initialModels = PlaygroundView.allModels.filter(m => m.id.toLowerCase().includes('ollama'));
    }
    if (initialModels.length === 0) {
       initialModels = PlaygroundView.allModels;
    }

    let defaultModelId = selectedModelId;
    if (PlaygroundView.localIndicatorGreen && initialProvider === 'ollama') {
       const installedModel = initialModels.find(m => PlaygroundView.localInstalledModels.some(n => n === m.modelId || n === m.id || n.startsWith(m.modelId)));
       if (installedModel) {
          defaultModelId = installedModel.id;
          window.app.selectedModelId = defaultModelId;
       }
    }

    const activeSession = (window.app && window.app.chatSessions ? window.app.chatSessions.find(s => s.id === window.app.activeSessionId) : null) || {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 4096,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      systemPrompt: '',
      showWorkingDetails: true,
      uncensored: false
    };

    // Hydrate full model catalog and active tags in background without blocking initial paint
    setTimeout(() => {
      PlaygroundView.loadAllModels().then(() => {
        const provSelect = document.getElementById('chat-provider-select');
        const curProv = (provSelect && provSelect.value) || initialProvider;
        if (provSelect && typeof ModelDropdownHelper !== 'undefined') {
          provSelect.innerHTML = ModelDropdownHelper.renderProviderComboDropdownHtml(
            PlaygroundView.providers || [],
            PlaygroundView.combos || [],
            curProv,
            PlaygroundView.allModels || []
          );
        }
        PlaygroundView.onProviderChange(curProv);
        PlaygroundView.renderAgentsWindow();
      }).catch(() => {});
    }, 0);

    container.innerHTML = `
      <div id="playground-workspace-container" class="glass-panel" style="padding: 2px; margin: 2px; overflow: hidden; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-card); display: flex; width: calc(100% - 4px); height: calc(100vh - 112px); position: relative; box-shadow: var(--tile-shadow); box-sizing: border-box;">
        
        <!-- LEFT SIDEBAR: 2-TAB PANEL (Chat | IDE) -->
        <div id="left-sidebar" class="sidebar-container" style="width: 240px; min-width: 0; max-width: 550px; background: var(--bg-sidebar); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; position: relative; transition: width 0.1s ease; flex-shrink: 0;">
          
          <!-- Tab Switcher + Sidebar Collapse -->
          <div class="sidebar-tabs" style="display: flex; align-items: center; border-bottom: 1px solid var(--border-color); background: var(--bg-sidebar);">
            <button id="tab-chat-btn" onclick="PlaygroundView.switchLeftTab('chat')" class="sidebar-tab active" style="flex: 1; padding: 8px 0; background: transparent; border: none; color: var(--text-main); cursor: pointer; font-size: 0.75rem; font-weight: 600; border-bottom: 2px solid var(--primary); display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease;">
              <i class="fa-solid fa-comments"></i> jChat
            </button>
            <button id="tab-ide-btn" onclick="PlaygroundView.switchLeftTab('ide')" class="sidebar-tab" style="flex: 1; padding: 8px 0; background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.75rem; font-weight: 600; border-bottom: 2px solid transparent; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease;">
              <i class="fa-solid fa-code"></i> jCode&lt;IDE&gt;
            </button>
            <button onclick="PlaygroundView.toggleSidebar('left')" class="fmc-chat-icon-btn" style="padding: 0 6px;" title="Collapse Sidebar">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
          </div>
          
          <!-- Chat Panel -->
          <div id="left-panel-chat" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
            <!-- Header -->
            <div class="sidebar-section-header" style="padding: 10px 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Conversations</span>
              <button onclick="PlaygroundView.createNewSession()" class="fmc-chat-icon-btn" title="New Chat">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
            <!-- Sessions List -->
            <div style="flex: 1; overflow-y: auto; padding: 8px;" id="session-list-container">
              <!-- Sessions rendered here -->
            </div>
          </div>
          
          <!-- IDE Panel -->
          <div id="left-panel-ide" style="flex: 1; display: none; flex-direction: column; overflow: hidden;">
            <!-- Header -->
            <div class="sidebar-section-header" style="padding: 10px 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Explorer</span>
              <div style="display: flex; gap: 4px; align-items: center;">
                <button onclick="IDEWorkspaceView.refreshExplorer()" class="fmc-chat-icon-btn" title="Refresh">
                  <i class="fa-solid fa-rotate"></i>
                </button>
                <button onclick="IDEWorkspaceView.openWorkspaceFromSidebar()" class="fmc-chat-icon-btn" title="Open Folder">
                  <i class="fa-solid fa-folder-open"></i>
                </button>
              </div>
            </div>
            <!-- Workspace Path -->
            <div id="ide-workspace-path-display" class="sidebar-path-display" style="padding: 6px 12px; font-size: 0.65rem; color: var(--text-dim); border-bottom: 1px solid var(--border-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              No workspace opened
            </div>
            <!-- File Tree -->
            <div id="ide-file-tree-sidebar" style="flex: 1; overflow-y: auto; padding: 4px 0;">
              <div style="padding: 20px; text-align: center; color: var(--text-dim); font-size: 0.7rem;">
                <i class="fa-solid fa-folder-open" style="font-size: 1.5rem; margin-bottom: 8px; opacity: 0.5;"></i><br>
                Open a folder to start coding
              </div>
            </div>
            <!-- Quick Actions -->
            <div class="sidebar-actions" style="padding: 8px; border-top: 1px solid var(--border-color); display: flex; gap: 4px;">
              <button onclick="IDEWorkspaceView.createNewFile()" class="btn btn-secondary btn-xs sidebar-action-btn" style="flex: 1; background: rgba(0,122,204,0.2); border: 1px solid var(--border-glow); color: var(--primary-light); padding: 6px; border-radius: 4px; cursor: pointer; font-size: 0.65rem;">
                <i class="fa-solid fa-file-circle-plus" style="margin-right: 4px;"></i> New File
              </button>
              <button onclick="IDEWorkspaceView.createNewFolder()" class="btn btn-secondary btn-xs sidebar-action-btn" style="flex: 1; background: rgba(251,191,36,0.2); border: 1px solid rgba(251,191,36,0.4); color: var(--accent-amber); padding: 6px; border-radius: 4px; cursor: pointer; font-size: 0.65rem;">
                <i class="fa-solid fa-folder-plus" style="margin-right: 4px;"></i> New Folder
              </button>
            </div>
          </div>
          
          <!-- Status Bar -->
          <div class="sidebar-status-bar" style="padding: 4px 8px; background: var(--primary); font-size: 0.6rem; color: white; display: flex; justify-content: space-between; align-items: center;">
            <span id="sidebar-status-text">jChat</span>
            <span id="workspace-indicator" style="display: flex; align-items: center; gap: 4px;">
              <i class="fa-solid fa-circle" style="color: #f44336;"></i> No Workspace
            </span>
          </div>
        </div>
        
        <!-- Draggable Horizontal Splitter (Resize Sidebar) -->
        <div id="sidebar-resizer" style="width: 4px; cursor: col-resize; background: transparent; z-index: 10; margin-left: -2px; transition: background 0.15s ease; flex-shrink: 0;" onmousedown="PlaygroundView.startSidebarResize(event)" onmouseover="this.style.background='var(--accent-cyan)'" onmouseout="if(!PlaygroundView.isResizingSidebar) this.style.background='transparent'"></div>

        <!-- IDE Editor Drawer (slides from left edge) -->
        <div id="ide-editor-drawer" class="editor-drawer" style="position: absolute; left: 240px; top: 0; bottom: 0; width: 0; max-width: 500px; background: var(--bg-sidebar); border-right: 1px solid var(--border-color); transition: width 0.3s ease; overflow-y: auto; overflow-x: hidden; z-index: 100;">
          <div id="ide-editor-content" style="width: 0; transition: width 0.3s ease; height: 100%;"></div>
          <!-- Close Button -->
          <button onclick="PlaygroundView.closeEditorDrawer()" class="btn btn-link btn-xs editor-close-btn" style="position: absolute; top: 8px; right: 8px; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-muted); width: 24px; height: 24px; border-radius: 4px; cursor: pointer; font-size: 0.7rem; z-index: 101;">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>

        <!-- Right Column: 80% Main Chat Workspace -->
        <div id="chat-workspace-pane" style="flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--bg-dark); position: relative; height: 100%;">
          
          <!-- Top Left Uncollapse Sidebar Button (visible only when left sidebar is hidden) -->
          <button id="sidebar-uncollapse-btn" class="fmc-chat-icon-btn" style="position: absolute; top: 6px; left: 8px; z-index: 50; display: none;" onclick="PlaygroundView.toggleSidebar('left')" title="Show Left Sidebar">
            <i class="fa-solid fa-bars-staggered"></i>
          </button>

          <!-- Messages Container (Auto-Fitting Scrollable Canvas) -->
          <div id="chat-messages-container" style="flex: 1; min-height: 0; overflow-y: auto; padding: 2px 4px; display: flex; flex-direction: column; gap: 4px; scroll-behavior: smooth;"></div>

          <!-- Floating Input Area (2px Padding Compact Fit) -->
          <div style="padding: 2px; width: 100%; max-width: 100%; margin: 0; box-sizing: border-box; flex-shrink: 0;">
            <div id="context-attachments-container" style="display: flex; gap: 3px; flex-wrap: wrap; margin-bottom: 2px;"></div>
            
            <div class="glass-panel input-pill" style="position: relative; border-radius: 6px; padding: 2px; display: flex; flex-direction: column; gap: 2px; border: 2px solid var(--border-color); box-shadow: var(--tile-shadow); width: 100%; box-sizing: border-box; margin: 2px 0;">
              <!-- Textarea -->
              <textarea id="chat-user-input" class="form-control" style="width: 100%; background: transparent; border: none; color: var(--text-main); font-size: 0.85rem; min-height: 28px; max-height: 140px; resize: none; outline: none; font-family: inherit; line-height: 1.35; padding: 2px; margin: 0;" placeholder="Type your message..." onkeydown="PlaygroundView.handleInputKeyDown(event)" oninput="this.style.height='auto'; this.style.height=Math.min(this.scrollHeight, 140)+'px';"></textarea>
              
              <!-- Bottom Bar: Controls + Mic + Send -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 2px 0 0 0; border-top: 1px solid var(--border-color); gap: 4px; flex-wrap: wrap; margin: 0;">
                <!-- Left Side: All Controls in Responsive Row -->
                <div style="display: flex; gap: 3px; align-items: center; flex: 1; min-width: 260px; flex-wrap: wrap; margin: 0; padding: 0;">
                  <!-- Sidebar & Drawer Toggles -->
                  <button class="fmc-chat-icon-btn" title="Toggle Left Sidebar" onclick="PlaygroundView.toggleSidebar('left')">
                    <i class="fa-solid fa-bars-staggered"></i>
                  </button>
                  <button class="fmc-chat-icon-btn" title="Model Parameters Drawer" onclick="PlaygroundView.toggleSidebar('right')">
                    <i class="fa-solid fa-sliders"></i>
                  </button>
                  <button class="fmc-chat-icon-btn" title="Playground Hints" onclick="if(typeof PlaygroundTrayDrawerHelper !== 'undefined') PlaygroundTrayDrawerHelper.showHints()">
                    <i class="fa-solid fa-lightbulb"></i>
                  </button>

                  <!-- Attach Context Button -->
                  <button class="fmc-chat-icon-btn" title="Attach File Context" onclick="PlaygroundView.addContextAttachment()">
                    <i class="fa-solid fa-paperclip"></i>
                  </button>
                  
                  <!-- Provider Select -->
                  <div style="flex: 1; min-width: 120px; max-width: 240px; margin: 0; padding: 0;">
                    <select id="chat-provider-select" class="form-control ss-enhanced-select" style="font-size: 0.7rem; padding: 2px 4px; height: 26px; border-radius: 4px; width: 100%; font-weight: 600; margin: 0;" onchange="PlaygroundView.onProviderChange(this.value)" title="Select Provider/Combo">
                       ${providerOptions}
                    </select>
                  </div>
                  
                  <!-- Model Select -->
                  <div style="flex: 1.5; min-width: 150px; max-width: 320px; margin: 0; padding: 0;">
                    <select id="ollama-model-select" class="form-control ss-enhanced-select" style="font-size: 0.7rem; padding: 2px 4px; height: 26px; border-radius: 4px; width: 100%; font-weight: 600; margin: 0;" onchange="PlaygroundView.onModelChange(this.value)" title="Select Model">
                       ${(typeof ModelDropdownHelper !== 'undefined') ? 
                          ModelDropdownHelper.renderModelsDropdownHtml(
                             PlaygroundView.allModels || [], 
                             initialProvider, 
                             PlaygroundView.localIndicatorGreen, 
                             PlaygroundView.localInstalledModels || [], 
                             defaultModelId
                          ) : ''
                       }
                    </select>
                  </div>
                  
                  <!-- Mic Icon Button -->
                  <button id="voice-toggle-btn" class="fmc-chat-icon-btn" title="Voice Input" onclick="PlaygroundView.toggleVoiceInput()">
                    <i class="fa-solid fa-microphone"></i>
                  </button>
                </div>
                
                <!-- Right Side: Send Button -->
                <button id="chat-send-btn" class="fmc-chat-icon-btn fmc-chat-send-btn" title="Send Message (Enter)" onclick="PlaygroundView.handleSendOrStopClick()">
                  <i class="fa-solid fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Parameters Slide-Out Drawer -->
        <div id="chat-parameters-right-drawer" class="glass-panel" style="width: 0px; min-width: 0px; max-width: 0px; flex-shrink: 0; flex-grow: 0; padding: 0px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; overflow-x: hidden; border-left: 0px solid var(--border-color); background: var(--bg-sidebar); height: 100%; margin-bottom: 0; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); opacity: 0; pointer-events: none; z-index: 95;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; min-width: 260px;">
            <span style="font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan);"><i class="fa-solid fa-sliders"></i> Hyperparameters</span>
            <button class="btn btn-link btn-xs" style="color: var(--text-muted); font-size: 1.1rem; cursor: pointer;" onclick="PlaygroundView.toggleSidebar('right')">&times;</button>
          </div>

          <!-- Sliders -->
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); display: flex; justify-content: space-between;">
              <span><i class="fa-solid fa-temperature-half"></i> Temperature</span>
              <span id="temp-val-display" style="color: var(--accent-amber);">${activeSession.temperature || 0.7}</span>
            </div>
            <input type="range" class="form-range-slider" id="param-temp-slider" min="0" max="2" step="0.1" value="${activeSession.temperature || 0.7}" style="width:100%; cursor:pointer;" oninput="PlaygroundView.updateHyperparameter('temperature', parseFloat(this.value))">

            <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); display: flex; justify-content: space-between; margin-top: 4px;">
              <span><i class="fa-solid fa-filter"></i> Top-P</span>
              <span id="topp-val-display" style="color: var(--accent-amber);">${activeSession.topP || 0.9}</span>
            </div>
            <input type="range" class="form-range-slider" id="param-topp-slider" min="0" max="1" step="0.05" value="${activeSession.topP || 0.9}" style="width:100%; cursor:pointer;" oninput="PlaygroundView.updateHyperparameter('topP', parseFloat(this.value))">

            <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); display: flex; justify-content: space-between; margin-top: 4px;">
              <span><i class="fa-solid fa-coins"></i> Max Tokens</span>
              <span id="maxtokens-val-display" style="color: var(--accent-amber);">${activeSession.maxTokens || 4096}</span>
            </div>
            <input type="range" class="form-range-slider" id="param-maxtokens-slider" min="256" max="16384" step="256" value="${activeSession.maxTokens || 4096}" style="width:100%; cursor:pointer;" oninput="PlaygroundView.updateHyperparameter('maxTokens', parseInt(this.value))">

            <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); display: flex; justify-content: space-between; margin-top: 4px;">
              <span><i class="fa-solid fa-repeat"></i> Frequency Penalty</span>
              <span id="freqpen-val-display" style="color: var(--accent-amber);">${activeSession.frequencyPenalty || 0.0}</span>
            </div>
            <input type="range" class="form-range-slider" id="param-freqpen-slider" min="0" max="2" step="0.1" value="${activeSession.frequencyPenalty || 0.0}" style="width:100%; cursor:pointer;" oninput="PlaygroundView.updateHyperparameter('frequencyPenalty', parseFloat(this.value))">

            <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); display: flex; justify-content: space-between; margin-top: 4px;">
              <span><i class="fa-solid fa-ghost"></i> Presence Penalty</span>
              <span id="prespen-val-display" style="color: var(--accent-amber);">${activeSession.presencePenalty || 0.0}</span>
            </div>
            <input type="range" class="form-range-slider" id="param-prespen-slider" min="0" max="2" step="0.1" value="${activeSession.presencePenalty || 0.0}" style="width:100%; cursor:pointer;" oninput="PlaygroundView.updateHyperparameter('presencePenalty', parseFloat(this.value))">
          </div>

          <!-- System Prompt with ROCA Format Presets -->
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan);"><i class="fa-solid fa-user-gear"></i> System Prompt (ROCA Format)</label>
            </div>
            <select id="select-system-prompt-roca" class="form-control" style="font-size: 0.68rem; padding: 2px 4px; margin-bottom: 4px;" onchange="PlaygroundView.applySystemPromptPreset(this.value)">
              <option value="">-- Select ROCA System Prompt Preset --</option>
              <option value="expert">1. Expert Multidisciplinary AI Assistant [ROCA]</option>
              <option value="architect">2. Clean OOPS MVC Enterprise Architect [ROCA]</option>
              <option value="fullstack">3. Full-Stack Node.js &amp; Vanilla JS Engineer [ROCA]</option>
              <option value="uncensored">4. Uncensored Raw Developer Mode [ROCA]</option>
              <option value="qa">5. QA &amp; Automated Test Architecture Auditor [ROCA]</option>
              <option value="database">6. JSON Database &amp; Schema Persistence Architect [ROCA]</option>
              <option value="security">7. Zero-Trust Security &amp; Key Protection Guard [ROCA]</option>
              <option value="bi_analytics">8. BI &amp; Telemetry Analytics Specialist [ROCA]</option>
              <option value="ui_ux">9. Glassmorphism UI/UX Pro-Max Designer [ROCA]</option>
              <option value="json_schema">10. Strict JSON Schema Output Generator [ROCA]</option>
              <option value="debugger">11. Root-Cause Diagnostic &amp; Self-Healing Debugger [ROCA]</option>
              <option value="prompt_engineer">12. Prompt Engineering &amp; ROCAS Optimizer [ROCA]</option>
            </select>
            <textarea id="param-system-prompt" class="form-control" style="font-size: 0.72rem; min-height: 95px; resize: vertical; background: var(--bg-input);" placeholder="Enter custom assistant system prompt (ROCA format: Role, Objective, Context, Actions)..." onchange="PlaygroundView.updateSystemPrompt(this.value)">${(typeof PlaygroundViewHelper !== 'undefined') ? PlaygroundViewHelper.escapeHtml(activeSession.systemPrompt || '') : (activeSession.systemPrompt || '')}</textarea>
          </div>

          <!-- Show Working Details Toggle -->
          <div style="background: rgba(56,189,248,0.08); border: 1px solid var(--accent-cyan); border-radius: 6px; padding: 8px;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); cursor: pointer;">
              <input type="checkbox" id="param-show-working-details" ${activeSession.showWorkingDetails ? 'checked' : ''} onchange="PlaygroundView.toggleShowWorkingDetails(this.checked)" />
              <i class="fa-solid fa-circle-info"></i> Show Working Details
            </label>
            <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px; line-height: 1.3;">
              Reasoning details display toggle.
            </div>
          </div>

          <!-- Uncensored Mode -->
          <div style="background: rgba(244,63,94,0.08); border: 1px solid var(--accent-rose); border-radius: 6px; padding: 8px;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 700; color: var(--accent-rose); cursor: pointer;">
              <input type="checkbox" id="param-uncensored-mode" ${activeSession.uncensored ? 'checked' : ''} onchange="PlaygroundView.toggleUncensoredMode(this.checked)" />
              <i class="fa-solid fa-radiation"></i> Uncensored Mode
            </label>
          </div>
        </div>
      </div>
    `;

    PlaygroundView.renderSessionList();
    PlaygroundView.renderMessages();

    PlaygroundView.renderAgentsWindow();
    
    // Dynamic Pixel Height Auto-Fit & Window Resize Listener
    PlaygroundView.adjustLayoutHeight();
    if (!PlaygroundView._resizeListenerAttached) {
      window.addEventListener('resize', PlaygroundView.adjustLayoutHeight);
      PlaygroundView._resizeListenerAttached = true;
    }

    setTimeout(() => {
      PlaygroundView.adjustLayoutHeight();
      const inputEl = document.getElementById('chat-user-input');
      if (inputEl) inputEl.focus();
      
      // Fix input alignment and initialize searchable selects
      PlaygroundView.fixInputAlignment();
      
      // Initialize searchable dropdowns for provider and model selects
      if (typeof SearchableSelect !== 'undefined') {
        PlaygroundView.initSearchableSelects();
      }
    }, 150);
  }

  // ── ROCA System Prompt Preset & Direct Hyperparameter Updaters ──
  static updateSystemPrompt(val) {
    const activeSession = (window.app && window.app.chatSessions ? window.app.chatSessions.find(s => s.id === window.app.activeSessionId) : null);
    if (activeSession) {
      activeSession.systemPrompt = val;
      PlaygroundView.saveSessions();
      if (typeof ModalDialog !== 'undefined' && ModalDialog.showNotification) {
        ModalDialog.showNotification('System prompt updated!', 'success');
      }
    }
  }

  static applySystemPromptPreset(presetKey) {
    if (!presetKey) return;
    const presets = (typeof PlaygroundViewHelper !== 'undefined' && PlaygroundViewHelper.getRocaPresets)
      ? PlaygroundViewHelper.getRocaPresets()
      : {};

    if (presets[presetKey]) {
      const input = document.getElementById('param-system-prompt');
      if (input) input.value = presets[presetKey];
      this.updateSystemPrompt(presets[presetKey]);
      if (typeof ModalDialog !== 'undefined' && ModalDialog.showNotification) {
        ModalDialog.showNotification(`Loaded ROCA system prompt preset: '${presetKey}'`, 'success');
      }
    }
  }

  // ── Dynamic Pixel Auto-Fit & Sidebar Resizing ──
  static isResizingSidebar = false;
  static _sidebarMoveHandler = null;
  static _sidebarUpHandler = null;
  static _resizeListenerAttached = false;

  static adjustLayoutHeight() {
    const ws = document.getElementById('playground-workspace-container');
    if (!ws) return;

    const wsRect = ws.getBoundingClientRect();
    const topOffset = wsRect.top > 0 ? wsRect.top : 108;
    const availableHeight = Math.max(300, window.innerHeight - topOffset - 4);

    ws.style.height = `${availableHeight}px`;
    ws.style.maxHeight = `${availableHeight}px`;

    const msgContainer = document.getElementById('chat-messages-container');
    if (msgContainer) {
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }
  }

  static startSidebarResize(e) {
    e.preventDefault();
    this.isResizingSidebar = true;
    const sidebar = document.getElementById('left-sidebar');
    const resizer = document.getElementById('sidebar-resizer');
    if (!sidebar) return;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    if (resizer) resizer.style.background = 'var(--accent-cyan)';

    this._sidebarMoveHandler = (moveEvent) => {
      if (!this.isResizingSidebar) return;
      const newWidth = Math.max(160, Math.min(moveEvent.clientX, 550));
      sidebar.style.width = `${newWidth}px`;
      sidebar.style.minWidth = `${newWidth}px`;
      sidebar.style.maxWidth = `${newWidth}px`;
    };

    this._sidebarUpHandler = () => {
      this.isResizingSidebar = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (resizer) resizer.style.background = 'transparent';
      window.removeEventListener('mousemove', this._sidebarMoveHandler);
      window.removeEventListener('mouseup', this._sidebarUpHandler);
    };

    window.addEventListener('mousemove', this._sidebarMoveHandler);
    window.addEventListener('mouseup', this._sidebarUpHandler);
  }

  // ── UI Actions & Tabs ──
  static fixInputAlignment() {
    // Ensure input area has proper ultra-compact flex layout
    const inputContainer = document.querySelector('.input-pill');
    if (inputContainer) {
      inputContainer.style.display = 'flex';
      inputContainer.style.flexDirection = 'column';
      inputContainer.style.gap = '2px';
      inputContainer.style.padding = '2px 4px';
      inputContainer.style.margin = '0';
    }
    
    // Fix select dropdown widths
    const providerSelect = document.getElementById('chat-provider-select');
    if (providerSelect) {
      providerSelect.style.minWidth = '120px';
      providerSelect.style.maxWidth = '240px';
    }
    const modelSelect = document.getElementById('ollama-model-select');
    if (modelSelect) {
      modelSelect.style.minWidth = '150px';
      modelSelect.style.maxWidth = '320px';
    }
  }
  
  static initSearchableSelects() {
    if (typeof SearchableSelect !== 'undefined') {
      const providerSelect = document.getElementById('chat-provider-select');
      const modelSelect = document.getElementById('ollama-model-select');
      if (providerSelect) {
        SearchableSelect.init(providerSelect, { placeholder: 'Search providers...', maxHeight: 300 });
        // Ensure native change event fires when a searchable option is selected
        providerSelect.addEventListener('change', () => PlaygroundView.onProviderChange(providerSelect.value));
      }
      if (modelSelect) {
        SearchableSelect.init(modelSelect, { placeholder: 'Search models...', maxHeight: 300 });
        modelSelect.addEventListener('change', () => PlaygroundView.onModelChange(modelSelect.value));
      }
    }
  }
  
  static switchTab(tabId) {
    PlaygroundView.activeTab = tabId;
    
    const sideCanvas = document.getElementById('fmc-main-content');
    if (sideCanvas) {
      if (tabId === 'agents-window') {
        sideCanvas.style.display = 'none';
      } else {
        sideCanvas.style.display = 'block';
      }
    }
    
    PlaygroundView.renderAgentsWindow();
    
    const tabs = document.querySelectorAll('.fmc-tab');
    tabs.forEach(t => {
      if (t.className.includes(tabId)) {
         t.style.background = 'var(--primary)';
         t.style.color = '#ffffff';
      } else {
         t.style.background = 'transparent';
         t.style.color = 'var(--text-muted)';
      }
    });
  }

  static toggleAgentMenu() {
    const menu = document.getElementById('agent-menu');
    if (menu) {
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
  }

  static setAgent(agentTag) {
    PlaygroundView.currentAgent = agentTag;
    const indicator = document.getElementById('agent-indicator');
    if (indicator) {
      indicator.innerHTML = agentTag + ' <i class="fa-solid fa-caret-down"></i>';
    }
    PlaygroundView.toggleAgentMenu();
  }

  static addContextAttachment() {
    PlaygroundView.activeContextAttachments.push({ type: 'file', name: 'context_sample.js' });
    PlaygroundView.renderContextAttachments();
  }

  static removeContextAttachment(idx) {
    PlaygroundView.activeContextAttachments.splice(idx, 1);
    PlaygroundView.renderContextAttachments();
  }

  static renderContextAttachments() {
    const container = document.getElementById('context-attachments-container');
    if (!container) return;
    if (PlaygroundView.activeContextAttachments.length === 0) {
       container.innerHTML = '';
       return;
    }
    container.innerHTML = PlaygroundView.activeContextAttachments.map((att, idx) => `
      <div style="display: flex; align-items: center; gap: 4px; background: rgba(0, 122, 204, 0.2); color: #4fc1ff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; border: 1px solid rgba(79, 193, 255, 0.3);">
        <i class="fa-solid fa-file-code"></i> ` + att.name + `
        <i class="fa-solid fa-xmark" style="cursor: pointer; margin-left: 4px;" onclick="PlaygroundView.removeContextAttachment(` + idx + `)"></i>
      </div>
    `).join('');
  }

  static onModelChange(modelId) {
    window.app.selectedModelId = modelId;
    const activeSession = (window.app.chatSessions || []).find(s => s.id === window.app.activeSessionId);
    if (activeSession) activeSession.modelId = modelId;
    PlaygroundView.saveSessions();

    const selectEl = document.getElementById('ollama-model-select');
    if (selectEl) {
      selectEl.value = modelId;
      const enhancedBtn = selectEl.parentElement?.querySelector('.ss-enhanced-trigger');
      if (enhancedBtn && selectEl.selectedIndex > -1) {
        const opt = selectEl.options[selectEl.selectedIndex];
        if (opt) enhancedBtn.textContent = opt.text;
      }
    }

    if (typeof ValidationNotifier !== 'undefined') {
      const selectedModel = (PlaygroundView.allModels || []).find(m => m.id === modelId);
      if (selectedModel && selectedModel.isActive === false) {
         ValidationNotifier.show(
           'Model Eligibility Warning',
           `The model "${modelId}" is currently marked inactive. The Proxy Engine will attempt to route requests to a fallback combo.`,
           'warning'
         );
      }
    }
  }

  // ── SSOT Runtime Model & Selectbox Synchronization ──
  static syncActiveModelSelection(resolvedModelId, resolvedProviderId, resolvedModelName, isFailover = false) {
    if (!resolvedModelId) return;

    // 1. Update in-memory state
    window.app.selectedModelId = resolvedModelId;

    // 2. If provider known, match and update provider selectbox
    const providerSelect = document.getElementById('chat-provider-select');
    if (providerSelect && resolvedProviderId) {
      let matchedProvValue = null;
      for (let i = 0; i < providerSelect.options.length; i++) {
        const val = providerSelect.options[i].value;
        if (val === resolvedProviderId || val === `prov_${resolvedProviderId}` || val.toLowerCase() === resolvedProviderId.toLowerCase()) {
          matchedProvValue = val;
          break;
        }
      }
      if (matchedProvValue && providerSelect.value !== matchedProvValue) {
        providerSelect.value = matchedProvValue;
        if (typeof SearchableSelect !== 'undefined') {
          SearchableSelect.sync(providerSelect);
        }
        PlaygroundView.onProviderChange(matchedProvValue);
      }
    }

    // 3. Update model selectbox
    const modelSelect = document.getElementById('ollama-model-select');
    if (modelSelect) {
      let matchedModelValue = null;
      for (let i = 0; i < modelSelect.options.length; i++) {
        const val = modelSelect.options[i].value;
        if (val === resolvedModelId || val.includes(resolvedModelId) || resolvedModelId.includes(val)) {
          matchedModelValue = val;
          break;
        }
      }

      if (matchedModelValue) {
        modelSelect.value = matchedModelValue;
        window.app.selectedModelId = matchedModelValue;
      } else {
        // Dynamically add option if missing from current view
        const opt = document.createElement('option');
        opt.value = resolvedModelId;
        opt.text = resolvedModelName || resolvedModelId;
        opt.selected = true;
        modelSelect.appendChild(opt);
        modelSelect.value = resolvedModelId;
        window.app.selectedModelId = resolvedModelId;
      }

      if (typeof SearchableSelect !== 'undefined') {
        SearchableSelect.sync(modelSelect);
      }
    }

    // 4. Visual toast notification on upstream failover
    if (isFailover && typeof ModalDialog !== 'undefined') {
      ModalDialog.showNotification(`⚡ Live Auto-Failover: Chat switched to ${resolvedModelName || resolvedModelId}`, 'info');
    }
  }

  static editUserMessage(index) {
    const activeSession = (window.app.chatSessions || []).find(s => s.id === window.app.activeSessionId);
    if (!activeSession || !activeSession.messages[index]) return;
    const inputEl = document.getElementById('chat-user-input');
    if (inputEl) {
      inputEl.value = activeSession.messages[index].content;
      inputEl.focus();
      ModalDialog.showNotification('Loaded message into prompt editor for editing.', 'info');
    }
  }

  static undoMessage(index) {
    const activeSession = (window.app.chatSessions || []).find(s => s.id === window.app.activeSessionId);
    if (!activeSession) return;
    activeSession.messages.splice(index, 1);
    PlaygroundView.saveSessions();
    PlaygroundView.renderMessages();
    ModalDialog.showNotification('Message undone and removed.', 'success');
  }

  static regenerateResponse(index) {
    const activeSession = (window.app.chatSessions || []).find(s => s.id === window.app.activeSessionId);
    if (!activeSession) return;
    // Find preceding user message
    let lastUserPrompt = '';
    for (let i = index - 1; i >= 0; i--) {
      if (activeSession.messages[i].role === 'user') {
        lastUserPrompt = activeSession.messages[i].content;
        break;
      }
    }
    if (lastUserPrompt) {
      activeSession.messages.splice(index, 1); // remove old response
      const inputEl = document.getElementById('chat-user-input');
      if (inputEl) inputEl.value = lastUserPrompt;
      PlaygroundView.sendMessage();
    }
  }

  // ── Theme Cleanup ──
  static cleanupThemeClasses() {
    // Safety net: remove any lingering theme-card-tile classes from DOM
    const container = document.getElementById('chat-messages-container');
    if (container) {
      container.querySelectorAll('.theme-card-tile').forEach(el => {
        el.classList.remove('theme-card-tile');
      });
    }
  }

  static renderSessionList(filterQuery = '') {
    const container = document.getElementById('session-list-container');
    if (!container) return;
    const sessions = window.app.chatSessions || [];
    const filtered = filterQuery ? sessions.filter(s => s.title.toLowerCase().includes(filterQuery.toLowerCase())) : sessions;

    if (filtered.length === 0) {
      container.innerHTML = '<div style="font-size: 0.72rem; color: #8e8ea0; padding: 10px; text-align: center;">No history found</div>';
      return;
    }

    container.innerHTML = filtered.map(s => PlaygroundViewHelper.renderSessionItemHtml(s, s.id === window.app.activeSessionId)).join('');
  }

  static toggleSidebar(side) {
    if (side === 'left') {
      const sidebar = document.getElementById('left-sidebar');
      const uncollapseBtn = document.getElementById('sidebar-uncollapse-btn');
      const resizer = document.getElementById('sidebar-resizer');
      if (sidebar) {
        const isCollapsed = sidebar.style.width === '0px' || sidebar.style.width === '0' || sidebar.style.display === 'none';
        sidebar.style.width = isCollapsed ? '240px' : '0px';
        sidebar.style.minWidth = isCollapsed ? '240px' : '0px';
        sidebar.style.overflow = isCollapsed ? 'visible' : 'hidden';
        sidebar.style.display = isCollapsed ? 'flex' : 'none';
        if (resizer) resizer.style.display = isCollapsed ? 'block' : 'none';
        if (uncollapseBtn) uncollapseBtn.style.display = isCollapsed ? 'none' : 'inline-flex';
      }
    } else if (side === 'right') {
      if (typeof ParametersDrawerView !== 'undefined') {
        ParametersDrawerView.toggleParametersDrawer();
      } else {
        const drawer = document.getElementById('chat-parameters-right-drawer');
        if (drawer) {
          const isVisible = drawer.style.opacity === '1' || (drawer.style.width && drawer.style.width !== '0px');
          if (isVisible) {
            drawer.style.width = '0px';
            drawer.style.minWidth = '0px';
            drawer.style.maxWidth = '0px';
            drawer.style.padding = '0px';
            drawer.style.borderLeftWidth = '0px';
            drawer.style.opacity = '0';
            drawer.style.pointerEvents = 'none';
          } else {
            drawer.style.width = '300px';
            drawer.style.minWidth = '260px';
            drawer.style.maxWidth = '360px';
            drawer.style.padding = '10px';
            drawer.style.borderLeft = '1px solid var(--border-color)';
            drawer.style.opacity = '1';
            drawer.style.pointerEvents = 'auto';
          }
        }
      }
    }
  }

  static switchLeftTab(tab) {
    PlaygroundView.activeLeftTab = tab;
    
    const chatBtn = document.getElementById('tab-chat-btn');
    const ideBtn = document.getElementById('tab-ide-btn');
    const chatPanel = document.getElementById('left-panel-chat');
    const idePanel = document.getElementById('left-panel-ide');
    const statusText = document.getElementById('sidebar-status-text');
    
    if (tab === 'chat') {
      if (chatBtn) {
        chatBtn.classList.add('active');
        chatBtn.classList.remove('inactive');
      }
      if (ideBtn) {
        ideBtn.classList.remove('active');
        ideBtn.classList.add('inactive');
      }
      if (chatPanel) chatPanel.style.display = 'flex';
      if (idePanel) idePanel.style.display = 'none';
      if (statusText) statusText.textContent = 'jChat Active';
    } else if (tab === 'ide') {
      if (chatBtn) {
        chatBtn.classList.remove('active');
        chatBtn.classList.add('inactive');
      }
      if (ideBtn) {
        ideBtn.classList.add('active');
        ideBtn.classList.remove('inactive');
      }
      if (chatPanel) chatPanel.style.display = 'none';
      if (idePanel) idePanel.style.display = 'flex';
      if (statusText) statusText.textContent = 'jCode<IDE> Active';
      
      // Load IDE workspace if available
      setTimeout(() => {
        if (typeof IDEWorkspaceView !== 'undefined') {
          IDEWorkspaceView.loadFileTreeForSidebar();
        }
      }, 100);
    }
  }

  static openEditorDrawer(filePath, fileName) {
    if (PlaygroundView.editorDrawerOpen) return;
    PlaygroundView.editorDrawerOpen = true;
    
    const drawer = document.getElementById('ide-editor-drawer');
    const content = document.getElementById('ide-editor-content');
    
    if (drawer && content) {
      // Responsive width: up to 60% of viewport but never exceeding 500px
      const maxWidth = 500; // px
      const calculatedWidth = Math.min(window.innerWidth * 0.6, maxWidth);
      drawer.style.width = `${calculatedWidth}px`;
      content.style.width = '100%';
      
      // Load file content
      if (typeof ApiService !== 'undefined' && filePath) {
        ApiService.readFileContent(filePath).then(res => {
          if (res.success && typeof IDEWorkspaceView !== 'undefined') {
            IDEWorkspaceView.renderEditor(filePath, fileName, res.content, IDEWorkspaceView.getFileExtension(filePath));
          }
        }).catch(err => console.error('Failed to load file:', err));
      }
    }
  }

  static closeEditorDrawer() {
    const drawer = document.getElementById('ide-editor-drawer');
    const content = document.getElementById('ide-editor-content');
    
    if (drawer && content) {
      drawer.style.width = '0';
      content.style.width = '0';
      PlaygroundView.editorDrawerOpen = false;
    }
  }

  static updateWorkspaceIndicator() {
    const indicator = document.getElementById('workspace-indicator');
    if (!indicator) return;
    
    const workspacePath = IDEWorkspaceView?.workspacePath || localStorage.getItem('fmc_ide_workspace');
    if (workspacePath) {
      const folderName = workspacePath.split('\\').pop() || workspacePath;
      indicator.innerHTML = `<i class="fa-solid fa-circle" style="color: #6a9955;"></i> ${folderName}`;
    } else {
      indicator.innerHTML = `<i class="fa-solid fa-circle" style="color: #f44336;"></i> No Workspace`;
    }
  }

  static renderMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;
    
    // Force remove any stale theme classes
    container.querySelectorAll('.theme-card-tile').forEach(el => el.classList.remove('theme-card-tile'));
    // Remove any inherited glass-panel border/shadow from container itself
    container.style.border = 'none !important';
    container.style.boxShadow = 'none !important';
    container.style.background = 'transparent !important';

    const activeSession = (window.app.chatSessions || []).find(s => s.id === window.app.activeSessionId);
    const messages = activeSession ? activeSession.messages : [];

    // Ultra-Modern Hero Empty State
    if (messages.length === 0) {
      container.innerHTML = `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 9px 6px; max-width: 800px; margin: 0 auto; width: 100%;">
          
          <div style="width: 72px; height: 72px; border-radius: 20px; background: linear-gradient(135deg, var(--primary), var(--accent-cyan)); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 2.2rem; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          
          <p style="font-size: 0.95rem; color: var(--text-muted); text-align: center; margin-bottom: 32px; max-width: 540px; line-height: 1.6;">
            Select a starter prompt below or enter your task to begin building with AI.
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; width: 100%;">
            
            <div class="glass-panel" style="padding: 5px; border-radius: 8px; cursor: pointer; border: 1px solid var(--border-color); transition: all 0.2s ease; display: flex; flex-direction: column; gap: 5px;" onclick="PlaygroundView.sendPresetPrompt('/explain Scaffold a new OOPS MVC module with automated tests')" onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='translateY(0)';">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(99, 102, 241, 0.15); color: var(--primary-light); display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">
                  <i class="fa-solid fa-cubes"></i>
                </div>
                <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main);">Build OOPS MVC Module</div>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">Scaffold a clean architecture controller, view, and model schema.</div>
            </div>

            <div class="glass-panel" style="padding: 5px; border-radius: 8px; cursor: pointer; border: 1px solid var(--border-color); transition: all 0.2s ease; display: flex; flex-direction: column; gap: 5px;" onclick="PlaygroundView.sendPresetPrompt('/fix Analyze memory usage and identify async bottlenecks')" onmouseover="this.style.borderColor='var(--accent-cyan)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='translateY(0)';">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">
                  <i class="fa-solid fa-gauge-high"></i>
                </div>
                <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main);">Performance Audit</div>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">Detect event loop blocks, memory leaks, and unhandled promises.</div>
            </div>

            <div class="glass-panel" style="padding: 5px; border-radius: 8px; cursor: pointer; border: 1px solid var(--border-color); transition: all 0.2s ease; display: flex; flex-direction: column; gap: 5px;" onclick="PlaygroundView.sendPresetPrompt('/security Scan endpoints against OWASP top 10 standards')" onmouseover="this.style.borderColor='var(--accent-emerald)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='translateY(0)';">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">
                  <i class="fa-solid fa-shield-halved"></i>
                </div>
                <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main);">Security Scan</div>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">Audit payload sizes, XSS escaping, CORS headers, and API keys.</div>
            </div>

            <div class="glass-panel" style="padding: 5px; border-radius: 8px; cursor: pointer; border: 1px solid var(--border-color); transition: all 0.2s ease; display: flex; flex-direction: column; gap: 5px;" onclick="PlaygroundView.sendPresetPrompt('/tests Write unit tests with 100% coverage')" onmouseover="this.style.borderColor='var(--accent-amber)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='translateY(0)';">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(245, 158, 11, 0.15); color: var(--accent-amber); display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">
                  <i class="fa-solid fa-vial-circle-check"></i>
                </div>
                <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main);">Generate Unit Tests</div>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">Create unit, integration, and UI regression test suites.</div>
            </div>

          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="width: 100%; display: flex; flex-direction: column; gap: 4px;">
        ` + messages.map((msg, index) => {
          // Do not render completely empty message bubbles (e.g., from routing agents) unless it is currently being generated
          if (!msg.content || msg.content.trim() === '') {
            if (!(PlaygroundView.isGenerating && index === messages.length - 1)) {
              return '';
            }
          }

          const isUser = msg.role === 'user';
          const bubbleId = 'msg_bubble_' + index;
          const mainBubbleId = 'main_msg_bubble_' + index;
          const formattedDate = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          let modelDisplayName = msg.modelName;
          if (!modelDisplayName || modelDisplayName === 'Agent' || modelDisplayName === '@copilot') {
            const mid = msg.modelId || window.app.selectedModelId;
            const mObj = (PlaygroundView.allModels || []).find(m => m.id === mid || m.modelId === mid);
            modelDisplayName = mObj ? (mObj.name || mObj.modelName || mObj.id) : (mid || 'Llama 3.3 70B Versatile (Free)');
          }

          return `
            <div style="display: flex; flex-direction: column; gap: 2px; padding: 4px 8px; border-radius: 6px; background: ` + (isUser ? 'rgba(255,255,255,0.02)' : 'var(--bg-card)') + `; border: 1px solid var(--border-color);">
              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <div style="width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; flex-shrink: 0; background: ` + (isUser ? 'rgba(99,102,241,0.15)' : 'var(--primary)') + `; color: ` + (isUser ? 'var(--primary-light)' : '#ffffff') + `;">
                  <i class="fa-solid ` + (isUser ? 'fa-user' : 'fa-robot') + `"></i>
                </div>
                <div style="flex: 1; font-size: 0.85rem; line-height: 1.5; color: var(--text-main); overflow-wrap: anywhere;">
                  <div style="font-weight: 700; color: ` + (isUser ? 'var(--text-muted)' : 'var(--primary-light)') + `; margin-bottom: 4px; font-size: 0.78rem; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span class="chat-bubble-model-tag" id="model_tag_${index}">` + (isUser ? 'You' : 'jDroid-X-FMC (' + modelDisplayName + ')') + `</span>
                      ` + (!isUser && PlaygroundView.isGenerating && index === messages.length - 1 ? `<div style="display: flex; align-items: center; margin-left: 4px;"><svg width="55" height="20" viewBox="0 0 55 20" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray: 75; stroke-dashoffset: 75; animation: fmcEkgDraw 1.3s linear infinite; filter: drop-shadow(0 0 3px var(--primary-light));"><path d="M 0 10 L 12 10 L 16 3 L 21 17 L 26 5 L 30 13 L 34 10 L 55 10" /></svg></div>` : '') + `
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <div class="agv-msg-actions-top" style="display: flex; align-items: center; gap: 4px;">
                        <button type="button" class="fmc-chat-icon-btn" onclick="navigator.clipboard.writeText(document.getElementById('${bubbleId}').innerText); ModalDialog.showNotification('Message text copied!','success')" title="Copy Message Text">
                          <i class="fa-regular fa-copy"></i>
                        </button>
                        ${isUser ? `
                          <button type="button" class="fmc-chat-icon-btn" onclick="PlaygroundView.editUserMessage(${index})" title="Edit Message">
                            <i class="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button type="button" class="fmc-chat-icon-btn" onclick="PlaygroundView.undoMessage(${index})" title="Undo / Delete Message">
                            <i class="fa-solid fa-rotate-left"></i>
                          </button>
                        ` : `
                          <button type="button" class="fmc-chat-icon-btn" onclick="PlaygroundView.regenerateResponse(${index})" title="Regenerate Response">
                            <i class="fa-solid fa-rotate"></i>
                          </button>
                        `}
                      </div>
                      <span style="font-size: 0.65rem; color: var(--text-dim); font-weight: 400;"><i class="fa-regular fa-clock" style="margin-right: 3px;"></i>${formattedDate}</span>
                    </div>
                  </div>
                  <div id="` + bubbleId + `">` + PlaygroundViewHelper.formatChatMessageContent(msg.content) + `</div>
                </div>
              </div>
            </div>
          `;
        }).join('') + `
      </div>
    `;

    container.scrollTop = container.scrollHeight;
  }

  static renderAgentsWindow() {
    const container = document.getElementById('fmc-main-content');
    if (!container) return;

    // Clean up any stale theme classes before rendering
    container.querySelectorAll('.theme-card-tile').forEach(el => el.classList.remove('theme-card-tile'));

    if (PlaygroundView.activeTab === 'browser') {
      container.innerHTML = `
        <div style="padding: 24px; height: 100%; display: flex; flex-direction: column;">
           <div style="display: flex; align-items: center; gap: 8px; background: #3c3c3c; padding: 8px; border-radius: 6px 6px 0 0; border-bottom: 1px solid #454545;">
              <div style="display: flex; gap: 4px;">
                 <div style="width: 10px; height: 10px; border-radius: 50%; background: #ff5f56;"></div>
                 <div style="width: 10px; height: 10px; border-radius: 50%; background: #ffbd2e;"></div>
                 <div style="width: 10px; height: 10px; border-radius: 50%; background: #27c93f;"></div>
              </div>
              <div style="flex: 1; background: #252526; border-radius: 4px; padding: 4px 12px; font-size: 0.75rem; color: #cccccc; display: flex; align-items: center; gap: 8px;">
                 <i class="fa-solid fa-lock" style="font-size: 0.6rem; color: #858585;"></i> ${window.location.origin}
              </div>
              <i class="fa-solid fa-rotate-right" style="color: #cccccc; font-size: 0.8rem; cursor: pointer;"></i>
           </div>
           <div style="flex: 1; background: #ffffff; color: #000000; padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <i class="fa-brands fa-react" style="font-size: 4rem; color: #61dafb; margin-bottom: 16px;"></i>
              <h2 style="margin: 0; font-family: sans-serif;">Browser Preview Simulation</h2>
              <p style="color: #666;">This tab represents the integrated browser for testing web apps.</p>
           </div>
        </div>
      `;
      return;
    }

    if (PlaygroundView.activeTab === 'plan') {
      container.innerHTML = `
        <div style="padding: 24px; max-width: 800px; margin: 0 auto; width: 100%;">
           <h2 style="font-size: 1.2rem; font-weight: 400; color: #cccccc; margin-bottom: 16px;"><i class="fa-solid fa-list-check" style="color: #007acc; margin-right: 8px;"></i> Agent Plan & Approvals</h2>
           <p style="font-size: 0.85rem; color: #858585; margin-bottom: 24px;">Review and approve the step-by-step implementation plan generated by the Plan agent before execution.</p>
           
           <div style="background: #252526; border: 1px solid #3c3c3c; border-radius: 6px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; gap: 12px; align-items: flex-start;">
                 <i class="fa-regular fa-circle-check" style="color: #19c37d; margin-top: 4px;"></i>
                 <div>
                    <div style="font-size: 0.9rem; font-weight: 600; color: #cccccc;">Step 1: Scaffold UI Component</div>
                    <div style="font-size: 0.8rem; color: #858585; margin-top: 4px;">Create 'src/components/NewFeature.js'</div>
                 </div>
              </div>
              <div style="display: flex; gap: 12px; align-items: flex-start;">
                 <i class="fa-regular fa-circle-check" style="color: #19c37d; margin-top: 4px;"></i>
                 <div>
                    <div style="font-size: 0.9rem; font-weight: 600; color: #cccccc;">Step 2: Wire up state management</div>
                    <div style="font-size: 0.8rem; color: #858585; margin-top: 4px;">Modify 'src/state/Store.js' to include new actions.</div>
                 </div>
              </div>
              <div style="display: flex; gap: 12px; align-items: flex-start; opacity: 0.5;">
                 <i class="fa-regular fa-circle" style="color: #858585; margin-top: 4px;"></i>
                 <div>
                    <div style="font-size: 0.9rem; font-weight: 600; color: #cccccc;">Step 3: Run tests</div>
                    <div style="font-size: 0.8rem; color: #858585; margin-top: 4px;">Execute 'npm test' in integrated terminal.</div>
                 </div>
              </div>
           </div>

           <div style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
              <button style="background: #3c3c3c; border: 1px solid #454545; color: #cccccc; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Reject</button>
              <button style="background: #007acc; border: none; color: #ffffff; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Approve & Execute</button>
           </div>
        </div>
      `;
      return;
    }

    // Default: 'agents-window'
    const activeSession = (window.app.chatSessions || []).find(s => s.id === window.app.activeSessionId);
    const messages = activeSession ? activeSession.messages : [];

    if (messages.length === 0) {
      container.innerHTML = `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; height: 100%;">
          <div style="width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: var(--primary-light); margin-bottom: 16px;">
            <i class="fa-solid fa-layer-group"></i>
          </div>
          <h2 style="font-size: 1.3rem; font-weight: 700; color: var(--text-main); margin-bottom: 16px;">Artifacts Canvas</h2>
          <div style="font-size: 0.9rem; color: var(--text-muted); text-align: center; max-width: 400px; margin-bottom: 32px; line-height: 1.6;">
            Code snippets, documents, and agent orchestration artifacts will render here, side-by-side with your active chat stream.
          </div>
        </div>
      `;
    } else {
      // Mirror chat messages but with wider layout, simulating Agents Window artifacts
      container.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto; padding: 24px; display: flex; flex-direction: column; gap: 24px;">
          <h2 style="font-size: 1.2rem; font-weight: 400; color: #cccccc; margin-bottom: 0;">` + PlaygroundViewHelper.escapeHtml(activeSession.title) + `</h2>
          <hr style="border: none; border-top: 1px solid #3c3c3c; width: 100%; margin-bottom: 16px;">
          ` + messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const bubbleId = 'main_msg_bubble_' + index;
            return `
              <div style="display: flex; gap: 16px; align-items: flex-start; background: ` + (isUser ? 'transparent' : '#252526') + `; padding: ` + (isUser ? '0' : '16px') + `; border-radius: 8px; border: ` + (isUser ? 'none' : '1px solid #3c3c3c') + `;">
                <div style="width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; background: ` + (isUser ? 'transparent' : '#007acc') + `; color: ` + (isUser ? '#cccccc' : '#ffffff') + `;">
                  <i class="fa-solid ` + (isUser ? 'fa-user' : 'fa-robot') + `"></i>
                </div>
                <div style="flex: 1; font-size: 0.85rem; line-height: 1.6; color: #cccccc; overflow-wrap: anywhere;">
                  <div style="font-weight: 600; color: ` + (isUser ? '#cccccc' : '#007acc') + `; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    <span>` + (isUser ? 'You' : 'jDroid-X-FMC (' + (msg.modelName || 'Agent') + ')') + `</span>
                    ` + (!isUser && PlaygroundView.isGenerating && index === messages.length - 1 ? `<div style="display: flex; align-items: center; margin-left: 4px;"><svg width="55" height="20" viewBox="0 0 55 20" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray: 75; stroke-dashoffset: 75; animation: fmcEkgDraw 1.3s linear infinite; filter: drop-shadow(0 0 3px var(--primary-light));"><path d="M 0 10 L 12 10 L 16 3 L 21 17 L 26 5 L 30 13 L 34 10 L 55 10" /></svg></div>` : '') + `
                  </div>
                  <div id="` + bubbleId + `">` + PlaygroundViewHelper.formatChatMessageContent(msg.content) + `</div>
                </div>
              </div>
            `;
          }).join('') + `
        </div>
      `;
      container.scrollTop = container.scrollHeight;
    }
  }

  static sendPresetPrompt(promptText) {
    const inputEl = document.getElementById('chat-user-input');
    if (!inputEl) return;
    inputEl.value = promptText;
    inputEl.focus();
  }



  static handleInputKeyDown(e) {
    // Allow sending with Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      PlaygroundView.sendMessage();
    }
  }

  // Toggle microphone input using Web Speech API
  static toggleVoiceInput() {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      // Browser does not support SpeechRecognition
      NotificationHelper.show('Voice input not supported in this browser.', 'error');
      return;
    }
    if (PlaygroundView.isVoiceActive) {
      // Stop current recognition
      if (PlaygroundView.voiceRecognition) {
        PlaygroundView.voiceRecognition.stop();
        PlaygroundView.voiceRecognition = null;
      }
      PlaygroundView.isVoiceActive = false;
      const btn = document.getElementById('voice-toggle-btn');
      if (btn) btn.style.background = '';
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    const inputEl = document.getElementById('chat-user-input');
    if (!inputEl) return;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      inputEl.value = transcript;
    };
    recognition.onerror = (event) => {
      NotificationHelper.show('Voice input error: ' + event.error, 'error');
    };
    recognition.onend = () => {
      PlaygroundView.isVoiceActive = false;
      const btn = document.getElementById('voice-toggle-btn');
      if (btn) btn.style.background = '';
    };
    recognition.start();
    PlaygroundView.voiceRecognition = recognition;
    PlaygroundView.isVoiceActive = true;
    const btn = document.getElementById('voice-toggle-btn');
    if (btn) btn.style.background = 'var(--accent-cyan)';
  }



  static handleSendOrStopClick() {
    if (PlaygroundView.isGenerating) {
      if (PlaygroundView.activeAbortController) {
        PlaygroundView.activeAbortController.abort();
      }
    } else {
      PlaygroundView.sendMessage();
    }
  }

  static updateSendButtonState(isGenerating) {
    const btn = document.getElementById('chat-send-btn');
    if (!btn) return;
    if (isGenerating) {
      btn.style.background = '#ef4444';
      btn.innerHTML = '<i class="fa-solid fa-stop" style="font-size: 0.7rem;"></i>';
    } else {
      btn.style.background = '#007acc';
      btn.innerHTML = '<i class="fa-solid fa-paper-plane" style="font-size: 0.7rem;"></i>';
    }
  }

  static async sendMessage() {
    const inputEl = document.getElementById('chat-user-input');
    if (!inputEl) return;
    let userText = inputEl.value.trim();
    
    if (!userText && !PlaygroundView.isGenerating) {
      if (typeof ValidationNotifier !== 'undefined') {
        ValidationNotifier.showOptionPopup({
          title: 'Empty Message Detected',
          message: 'Please enter a prompt or task before sending.',
          icon: 'fa-triangle-exclamation',
          options: [
            { id: 'ok', label: 'Got It', type: 'secondary', icon: 'fa-check', action: () => { setTimeout(() => inputEl.focus(), 100); } }
          ]
        });
      }
      return;
    }
    if (PlaygroundView.isGenerating) return;

    inputEl.value = '';

    let activeSession = (window.app.chatSessions || []).find(s => s.id === window.app.activeSessionId);
    if (!activeSession) {
      PlaygroundView.createNewSession();
      activeSession = window.app.chatSessions.find(s => s.id === window.app.activeSessionId);
    }

    if (activeSession.title === 'New Conversation') {
      activeSession.title = userText.substring(0, 30).replace(/\n/g, ' ') + (userText.length > 30 ? '...' : '');
      PlaygroundView.saveSessions();
      PlaygroundView.renderSessionList();
    }

    const modelSelectEl = document.getElementById('ollama-model-select');
    let defaultId = PlaygroundView.allModels && PlaygroundView.allModels[0] ? PlaygroundView.allModels[0].id : 'llama3:latest';
    const modelId = (modelSelectEl && modelSelectEl.value) ? modelSelectEl.value : (window.app.selectedModelId || defaultId);
    window.app.selectedModelId = modelId;

    // ── Antigravity-Class Pipeline: Delegate to ChatOrchestrator ──
    if (typeof ChatOrchestrator !== 'undefined') {
      const agentMode = (typeof PlaygroundTrayDrawerHelper !== 'undefined') ? PlaygroundTrayDrawerHelper.agentMode : 'Agent';
      const workspaceContext = {
        workspacePath: (typeof IDEWorkspaceView !== 'undefined' && IDEWorkspaceView.workspacePath) ? IDEWorkspaceView.workspacePath : localStorage.getItem('fmc_ide_workspace') || '',
        openFiles: [],
        cursorPosition: null
      };

      await ChatOrchestrator.execute({
        userText,
        modelId,
        activeSession,
        agentMode,
        attachments: PlaygroundView.activeContextAttachments || [],
        workspaceContext
      });
      return;
    }

    // ── Legacy Fallback: Original inline streaming (preserved for backward compat) ──
    // Handle Agent Tags & Slash Commands Simulation
    if (PlaygroundView.currentAgent && PlaygroundView.currentAgent !== '@copilot') {
       userText = PlaygroundView.currentAgent + ' ' + userText;
    }

    if (PlaygroundView.activeContextAttachments.length > 0) {
       const attachments = PlaygroundView.activeContextAttachments.map(a => '[Attached: ' + a.name + ']').join(' ');
       userText = attachments + ' \n\n' + userText;
    }

    const userMsg = { role: 'user', content: userText, timestamp: new Date().toISOString() };
    activeSession.messages.push(userMsg);

    let optionText = 'Agent';
    if (modelSelectEl && modelSelectEl.options[modelSelectEl.selectedIndex]) {
        optionText = modelSelectEl.options[modelSelectEl.selectedIndex].text.replace(' (Inactive)', '');
    }

    const assistantMsg = { role: 'assistant', content: '', modelName: optionText, timestamp: new Date().toISOString() };
    activeSession.messages.push(assistantMsg);

    PlaygroundView.isGenerating = true;
    PlaygroundView.activeAbortController = new AbortController();
    PlaygroundView.updateSendButtonState(true);

    PlaygroundView.renderMessages();
    PlaygroundView.renderAgentsWindow();
    PlaygroundView.saveSessions();

    const container = document.getElementById('chat-messages-container');
    const mainContainer = document.getElementById('fmc-main-content');
    
    const msgIndex = activeSession.messages.length - 1;
    const assistantBubbleId = 'msg_bubble_' + msgIndex;
    const mainBubbleId = 'main_msg_bubble_' + msgIndex;

    try {
      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...ApiService.getAuthHeader()
        },
        body: JSON.stringify({
          model: modelId,
          messages: activeSession.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
          stream: true
        }),
        signal: PlaygroundView.activeAbortController.signal
      });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
      }

      const isFailover = response.headers.get('X-FMC-Failover') === 'true';
      if (isFailover) {
         const failoverProvider = response.headers.get('X-FMC-Failover-Provider');
         const failoverToModel = response.headers.get('X-FMC-Failover-To');
         if (failoverToModel) {
            const providerSelectEl = document.getElementById('chat-provider-select');
            if (providerSelectEl && failoverProvider && failoverProvider !== 'unknown') {
               let provFound = false;
               for (let i=0; i<providerSelectEl.options.length; i++) {
                   if (providerSelectEl.options[i].value === failoverProvider) {
                       providerSelectEl.selectedIndex = i;
                       provFound = true; break;
                   }
               }
               if (provFound) PlaygroundView.onProviderChange(failoverProvider);
            }
            
            const modelSelectEl2 = document.getElementById('ollama-model-select');
            if (modelSelectEl2) {
               let modFound = false;
               for (let i=0; i<modelSelectEl2.options.length; i++) {
                   if (modelSelectEl2.options[i].value === failoverToModel || modelSelectEl2.options[i].value.includes(failoverToModel)) {
                       modelSelectEl2.selectedIndex = i;
                       modFound = true; break;
                   }
               }
               if (modFound) {
                   const selectedOpt = modelSelectEl2.options[modelSelectEl2.selectedIndex];
                   if (selectedOpt) {
                       activeSession.messages[msgIndex].modelName = selectedOpt.text.replace(' (Inactive)', '') + ' (Failover)';
                       PlaygroundView.onModelChange(modelSelectEl2.value);
                       PlaygroundView.renderMessages();
                   }
               }
            }
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
              const delta = parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content;
              if (delta) {
                fullText += delta;
                assistantMsg.content = fullText;
                
                const assistantBubbleEl = document.getElementById(assistantBubbleId);
                const mainBubbleEl = document.getElementById(mainBubbleId);
                
                if (assistantBubbleEl) assistantBubbleEl.innerHTML = PlaygroundViewHelper.formatChatMessageContent(fullText);
                if (mainBubbleEl) mainBubbleEl.innerHTML = PlaygroundViewHelper.formatChatMessageContent(fullText);
                
                if (container) container.scrollTop = container.scrollHeight;
                if (mainContainer && PlaygroundView.activeTab === 'agents-window') mainContainer.scrollTop = mainContainer.scrollHeight;
              }
            } catch (e) {}
          }
        }
      }

      if (!fullText && buffer) {
        try {
          const parsed = JSON.parse(buffer);
          fullText = (parsed.choices && parsed.choices[0] && parsed.choices[0].message && parsed.choices[0].message.content) || '';
        } catch (e) {}
      }

      assistantMsg.content = fullText || 'No response returned from Ollama.';
      
      const assistantBubbleEl = document.getElementById(assistantBubbleId);
      const mainBubbleEl = document.getElementById(mainBubbleId);
      if (assistantBubbleEl) assistantBubbleEl.innerHTML = PlaygroundViewHelper.formatChatMessageContent(assistantMsg.content);
      if (mainBubbleEl) mainBubbleEl.innerHTML = PlaygroundViewHelper.formatChatMessageContent(assistantMsg.content);
      
    } catch (err) {
      if (err.name === 'AbortError') {
        assistantMsg.content += ' [Generation Stopped]';
      } else {
        assistantMsg.content = 'Error: ' + (err.message || 'Failed to connect to proxy endpoint.');
        
        // Robust ValidationNotifier Fallback Loop
        if (typeof ValidationNotifier !== 'undefined') {
          ValidationNotifier.showOptionPopup({
            title: 'Execution Engine Error',
            message: `The proxy engine encountered an error: <code style="color: var(--accent-rose);">${err.message}</code><br><br>Would you like to force a failover to the next available free model or retry?`,
            icon: 'fa-network-wired',
            options: [
              {
                id: 'retry',
                label: 'Retry Current Request',
                type: 'primary',
                icon: 'fa-rotate-right',
                action: () => { 
                  const inputEl = document.getElementById('chat-user-input');
                  if (inputEl) inputEl.value = userText;
                  if (activeSession && activeSession.messages && activeSession.messages.length >= 2) {
                    activeSession.messages.pop(); // remove failed assistant msg
                    activeSession.messages.pop(); // remove user msg so it doesn't duplicate
                  }
                  PlaygroundView.sendMessage(); 
                }
              },
              {
                id: 'failover',
                label: 'Switch Provider & Retry',
                type: 'emerald',
                icon: 'fa-arrow-right-arrow-left',
                action: () => { 
                   ModalDialog.showNotification('Switching to alternate provider...', 'info');
                }
              }
            ]
          });
        }
      }
      const assistantBubbleEl = document.getElementById(assistantBubbleId);
      const mainBubbleEl = document.getElementById(mainBubbleId);
      if (assistantBubbleEl) assistantBubbleEl.innerHTML = PlaygroundViewHelper.formatChatMessageContent(assistantMsg.content);
      if (mainBubbleEl) mainBubbleEl.innerHTML = PlaygroundViewHelper.formatChatMessageContent(assistantMsg.content);
    } finally {
      PlaygroundView.isGenerating = false;
      PlaygroundView.activeAbortController = null;
      PlaygroundView.updateSendButtonState(false);
      PlaygroundView.saveSessions();
      PlaygroundView.renderMessages();
      PlaygroundView.renderAgentsWindow();
      if (container) container.scrollTop = container.scrollHeight;
      if (mainContainer && PlaygroundView.activeTab === 'agents-window') mainContainer.scrollTop = mainContainer.scrollHeight;
    }
  }

  // ── IDE Workspace Integration ──
  static openIDEWorkspace(workspacePath = null) {
    // Switch to IDE tab and open workspace
    PlaygroundView.switchLeftTab('ide');
    
    setTimeout(() => {
      if (typeof IDEWorkspaceView !== 'undefined') {
        IDEWorkspaceView.render(workspacePath);
        PlaygroundView.updateWorkspaceIndicator();
      } else {
        ModalDialog.showNotification('IDE Workspace module not loaded. Please refresh the page.', 'error');
      }
    }, 100);
  }

  static quickOpenFile() {
    if (!IDEWorkspaceView || !IDEWorkspaceView.workspacePath) {
      ModalDialog.showNotification('Please open a workspace first using IDE Mode.', 'warning');
      return;
    }
    
    const container = document.getElementById('fmc-main-content');
    if (!container) return;
    
    // Quick open modal
    ModalDialog.showCustomModal({
      title: '<i class="fa-solid fa-folder-open" style="color: #6b9bff; margin-right: 8px;"></i>Quick Open File',
      content: `
        <div style="padding: 8px 0;">
          <input type="text" id="quick-open-input" placeholder="Type to search files..." 
            style="width: 100%; padding: 8px 12px; background: #2d2d2d; border: 1px solid #3e3e42; color: #cccccc; border-radius: 4px; font-size: 0.8rem;"
            onkeyup="IDEWorkspaceView.filterQuickOpenFiles(this.value)">
          <div id="quick-open-results" style="max-height: 300px; overflow-y: auto; margin-top: 8px;">
            <div style="padding: 8px; color: #858585; font-size: 0.75rem;"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</div>
          </div>
        </div>
      `,
      confirmText: 'Cancel',
      onCancel: () => ModalDialog.closeModal()
    });
    
    // Load file list
    setTimeout(() => {
      IDEWorkspaceView.loadFileTreeForQuickOpen(IDEWorkspaceView.workspacePath);
      const input = document.getElementById('quick-open-input');
      if (input) input.focus();
    }, 100);
  }

  static toggleTerminal() {
    const panel = document.getElementById('ide-terminal-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    } else {
      // Terminal panel doesn't exist yet, show notification
      if (typeof IDEWorkspaceView !== 'undefined' && IDEWorkspaceView.workspacePath) {
        const btn = event.target.closest('button');
        if (btn) {
          ModalDialog.showNotification('Open IDE Mode first to use the terminal.', 'info');
        }
      }
    }
  }

  static showChatView() {
    PlaygroundView.activeTab = 'agents-window';
    const container = document.getElementById('fmc-main-content');
    if (container) {
      container.style.display = 'none';
    }
    // Re-render the chat view
    const chatContainer = document.querySelector('.glass-panel');
    if (chatContainer) {
      PlaygroundView.render(chatContainer);
    }
  }

  static async refreshProjectPath() {
    const pathEl = document.getElementById('project-path');
    if (!pathEl) return;
    
    const workspacePath = localStorage.getItem('fmc_project_workspace_path');
    if (workspacePath) {
      pathEl.textContent = workspacePath;
    } else {
      pathEl.textContent = 'No workspace set';
    }
  }

  static togglePanel(panelName) {
    const projectPanel = document.getElementById('project-panel');
    const chatContainer = document.getElementById('session-list-container');
    
    if (panelName === 'project') {
      if (projectPanel) {
        projectPanel.style.display = projectPanel.style.display === 'none' ? 'flex' : 'none';
      }
      if (chatContainer && projectPanel.style.display === 'flex') {
        chatContainer.style.display = 'none';
      } else if (chatContainer) {
        chatContainer.style.display = 'flex';
      }
    } else if (panelName === 'chat') {
      if (projectPanel) {
        projectPanel.style.display = 'none';
      }
      const chatContainer = document.getElementById('session-list-container');
      if (chatContainer) {
        chatContainer.style.display = 'flex';
      }
    }
  }
}

window.PlaygroundView = PlaygroundView;

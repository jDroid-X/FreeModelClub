/**
 * PlaygroundTrayDrawerHelper.js
 * Purpose: Handles Tray Drawers (ToDo List, File Changes) above input box, Bottom Toolbar menus (+ Attachments, Agent Mode, Models, Configure Tools), and Footer status line for PlaygroundView.
 * Dependencies: ApiService, ModalDialog
 */

class PlaygroundTrayDrawerHelper {
  static todoList = [];

  static fileChanges = [];

  static agentMode = 'Agent'; // 'Agent', 'Ask', 'Plan'
  static approvalMode = 'Default approvals'; // 'Default approvals', 'Auto-approve reads', 'Strict approvals'
  static toolsList = [
    { id: 'agent', name: 'agent', desc: 'Delegate tasks to other agents', category: 'Built-In', enabled: true },
    { id: 'browser', name: 'browser', desc: 'Open and interact with integrated browser pages', category: 'Built-In', enabled: true },
    { id: 'edit', name: 'edit', desc: 'Edit files in your workspace', category: 'Built-In', enabled: true },
    { id: 'execute', name: 'execute', desc: 'Execute code and applications on your machine', category: 'Built-In', enabled: true },
    { id: 'read', name: 'read', desc: 'Read files in your workspace', category: 'Built-In', enabled: true },
    { id: 'search', name: 'search', desc: 'Search files in your workspace', category: 'Built-In', enabled: true },
    { id: 'todo', name: 'todo', desc: 'Manage and track todo items for task planning', category: 'Built-In', enabled: true },
    { id: 'vscode', name: 'vscode', desc: 'Use VS Code features', category: 'Built-In', enabled: true },
    { id: 'web', name: 'web', desc: 'Fetch information from the web', category: 'Built-In', enabled: true },
    { id: 'ollama_mcp_vscode', name: 'ollama_mcp_vscode', desc: 'Ollama local MCP bridge', category: 'Ollama MCP', enabled: true },
    { id: 'playwright', name: 'Playwright', desc: 'End-to-End browser testing agent', category: 'Testing', enabled: true },
    { id: 'powershell', name: 'PowerShell Runner', desc: 'Execute Windows PowerShell scripts', category: 'CLI Tools', enabled: true },
    { id: 'vision_ocr', name: 'Vision OCR Engine', desc: 'Extract text & OCR from screenshot images', category: 'Vision Tools', enabled: true }
  ];

  // ── Render Top Tray Drawers (ToDo Bar & File Changes Bar) ──
  // Dynamic Popup Rule: Row 1 & Row 2 ONLY display when active items exist!
  static renderTopTrayDrawersHtml() {
    const hasTodo = this.todoList && this.todoList.length > 0;
    const hasFileChanges = this.fileChanges && this.fileChanges.length > 0;

    const doneCount = hasTodo ? this.todoList.filter(t => t.done).length : 0;
    const totalTasks = hasTodo ? this.todoList.length : 0;
    const activeTask = hasTodo ? (this.todoList.find(t => !t.done) || this.todoList[0]) : { title: 'No active tasks' };

    const totalAdditions = hasFileChanges ? this.fileChanges.reduce((acc, f) => acc + f.additions, 0) : 0;
    const totalDeletions = hasFileChanges ? this.fileChanges.reduce((acc, f) => acc + f.deletions, 0) : 0;
    const fileCount = hasFileChanges ? this.fileChanges.length : 0;

    return `
      <!-- Top Tray Drawer 1: ToDo List Bar (Theme Synced & Dynamic Popup) -->
      <div id="pg-todo-drawer-wrapper" style="display: ${hasTodo ? 'block' : 'none'}; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 1px; overflow: hidden; font-family: var(--font-code); transition: all 0.3s ease;">
        <div id="pg-todo-header-bar" style="display: flex; justify-content: space-between; align-items: center; padding: 2px 8px; cursor: pointer; background: rgba(255,255,255,0.03); user-select: none;" onclick="PlaygroundTrayDrawerHelper.toggleTodoDrawer()">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 0.74rem; color: var(--text-main);">
            <i id="pg-todo-chevron" class="fa-solid fa-chevron-right" style="font-size: 0.62rem; color: var(--text-muted); transition: transform 0.2s ease;"></i>
            <span style="font-size: 0.78rem; color: var(--accent-cyan); font-weight: 700;">o</span>
            <span style="font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 420px;">${PlaygroundViewHelper.escapeHtml(activeTask.title)}</span>
            <span style="font-size: 0.68rem; color: var(--text-muted);">(${doneCount}/${totalTasks})</span>
          </div>
          <button type="button" class="btn btn-link btn-xs" style="color: var(--text-muted); padding: 0;" onclick="event.stopPropagation(); PlaygroundTrayDrawerHelper.toggleTodoDrawer()" title="Toggle ToDo List Drawer">
            <i class="fa-solid fa-list-check" style="font-size: 0.8rem;"></i>
          </button>
        </div>

        <!-- Collapsible Content -->
        <div id="pg-todo-drawer-content" style="display: none; padding: 4px 8px; border-top: 1px solid var(--border-color); background: rgba(0,0,0,0.15);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 0.7rem; font-weight: 700; color: var(--accent-cyan);"><i class="fa-solid fa-list-check"></i> Task Planning Tree</span>
            <button class="btn btn-secondary btn-xs" style="font-size: 0.62rem; padding: 1px 4px;" onclick="PlaygroundTrayDrawerHelper.addNewTaskPrompt()">+ Add Task</button>
          </div>
          <div id="pg-todo-items-list" style="display: flex; flex-direction: column; gap: 2px; max-height: 120px; overflow-y: auto;">
            ${hasTodo ? this.todoList.map(t => `
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.7rem; background: rgba(255,255,255,0.02); padding: 2px 6px; border-radius: 4px;">
                <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; flex: 1;">
                  <input type="checkbox" ${t.done ? 'checked' : ''} onchange="PlaygroundTrayDrawerHelper.toggleTaskDone(${t.id})" />
                  <span style="${t.done ? 'text-decoration: line-through; opacity: 0.6;' : 'color: var(--text-main);'}">${PlaygroundViewHelper.escapeHtml(t.title)}</span>
                </label>
                <button type="button" class="btn btn-link btn-xs" style="color: var(--accent-rose); padding: 0 2px;" onclick="PlaygroundTrayDrawerHelper.deleteTask(${t.id})">&times;</button>
              </div>
            `).join('') : ''}
          </div>
        </div>
      </div>

      <!-- Top Tray Drawer 2: Current File Changes Bar (Theme Synced & Dynamic Popup) -->
      <div id="pg-file-changes-wrapper" style="display: ${hasFileChanges ? 'block' : 'none'}; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 1px; overflow: hidden; font-family: var(--font-code); transition: all 0.3s ease;">
        <div id="pg-file-changes-header-bar" style="display: flex; justify-content: space-between; align-items: center; padding: 2px 8px; cursor: pointer; background: rgba(255,255,255,0.03); user-select: none;" onclick="PlaygroundTrayDrawerHelper.toggleFileChangesDrawer()">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 0.74rem; color: var(--text-main);">
            <i id="pg-file-changes-chevron" class="fa-solid fa-chevron-right" style="font-size: 0.62rem; color: var(--text-muted); transition: transform 0.2s ease;"></i>
            <span style="font-weight: 600;">${fileCount} files changed</span>
            <span style="color: var(--accent-emerald); font-weight: 700;">+${totalAdditions}</span>
            <span style="color: var(--accent-rose); font-weight: 700;">-${totalDeletions}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;" onclick="event.stopPropagation();">
            <button class="btn btn-accent btn-xs" style="padding: 2px 8px; font-size: 0.68rem; border-radius: 4px; font-weight: 700;" onclick="PlaygroundTrayDrawerHelper.keepFileChanges()">Keep</button>
            <button class="btn btn-secondary btn-xs" style="padding: 2px 8px; font-size: 0.68rem; border-radius: 4px;" onclick="PlaygroundTrayDrawerHelper.undoFileChanges()">Undo</button>
            <button class="btn btn-secondary btn-xs" style="padding: 2px 6px; font-size: 0.68rem; border-radius: 4px;" onclick="PlaygroundTrayDrawerHelper.openDiffModal()" title="View File Diff"><i class="fa-solid fa-file-code"></i></button>
          </div>
        </div>

        <!-- Collapsible Content -->
        <div id="pg-file-changes-drawer-content" style="display: none; padding: 4px 8px; border-top: 1px solid var(--border-color); background: rgba(0,0,0,0.15);">
          <div style="font-size: 0.7rem; font-weight: 700; color: var(--accent-amber); margin-bottom: 4px;"><i class="fa-solid fa-code-compare"></i> Modified Workspace Files</div>
          <div style="display: flex; flex-direction: column; gap: 2px; max-height: 100px; overflow-y: auto;">
            ${hasFileChanges ? this.fileChanges.map(f => `
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; background: rgba(255,255,255,0.02); padding: 2px 6px; border-radius: 4px;">
                <span style="color: var(--primary-light); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px;">${PlaygroundViewHelper.escapeHtml(f.path)}</span>
                <div>
                  <span style="color: var(--accent-emerald); font-weight: 700; margin-right: 4px;">+${f.additions}</span>
                  <span style="color: var(--accent-rose); font-weight: 700;">-${f.deletions}</span>
                </div>
              </div>
            `).join('') : ''}
          </div>
        </div>
      </div>
    `;
  }

  // ── Render Input Toolbar & Bottom Status Line (Theme Synced) ──
  static renderBottomToolbarHtml(selectedModelName) {
    return `
      <!-- Toolbar Row inside Input Box Container -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 3px; margin-top: 2px; border-top: 1px solid rgba(255,255,255,0.05); flex-wrap: wrap; gap: 4px;">
        
        <!-- Left Button Group: + , Agent , Auto , Models , Configure Tools -->
        <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
          
          <!-- Image 2: + Attachments / Context Drawer Button -->
          <div style="position: relative;">
            <button type="button" class="btn btn-secondary btn-xs" style="padding: 2px 6px; font-size: 0.72rem; border-radius: 4px; font-weight: 700;" onclick="PlaygroundTrayDrawerHelper.toggleAttachmentsDrawer(event)" title="Add Attachments / Context Items">
              <i class="fa-solid fa-plus"></i>
            </button>
            
            <!-- Image 2 Popup Drawer -->
            <div id="pg-attachments-drawer-popup" class="glass-panel" style="display: none; position: absolute; bottom: 36px; left: 0; z-index: 105; width: 220px; padding: 6px; background: var(--bg-card); border: 1px solid var(--border-glow); box-shadow: 0 10px 28px rgba(0,0,0,0.6); border-radius: 8px;">
              <div style="position: relative; margin-bottom: 6px;">
                <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 0.72rem; color: var(--text-muted);"></i>
                <input type="text" class="form-control" style="font-size: 0.72rem; padding: 4px 8px 4px 24px; width: 100%;" placeholder="Search attachments..." onkeyup="PlaygroundTrayDrawerHelper.filterAttachments(this.value)" />
              </div>
              <div id="pg-attachments-menu-list" style="display: flex; flex-direction: column; gap: 2px; max-height: 240px; overflow-y: auto;">
                <div class="pg-drawer-menu-item active" onclick="PlaygroundTrayDrawerHelper.selectAttachmentOption('editors')"><i class="fa-regular fa-file" style="color: var(--accent-cyan);"></i> Open Editors</div>
                <div class="pg-drawer-menu-item" onclick="PlaygroundTrayDrawerHelper.selectAttachmentOption('files')"><i class="fa-regular fa-folder-open" style="color: var(--accent-amber);"></i> Files &amp; Folders...</div>
                <div class="pg-drawer-menu-item" onclick="PlaygroundTrayDrawerHelper.selectAttachmentOption('instructions')"><i class="fa-solid fa-bookmark" style="color: var(--accent-emerald);"></i> Instructions...</div>
                <div class="pg-drawer-menu-item" onclick="PlaygroundTrayDrawerHelper.selectAttachmentOption('mcp')"><i class="fa-solid fa-network-wired" style="color: #a855f7;"></i> MCP Resources...</div>
                <div class="pg-drawer-menu-item" onclick="PlaygroundTrayDrawerHelper.selectAttachmentOption('screenshot')"><i class="fa-solid fa-camera" style="color: var(--accent-cyan);"></i> Screenshot Window</div>
                <div class="pg-drawer-menu-item" onclick="PlaygroundTrayDrawerHelper.selectAttachmentOption('source_control')"><i class="fa-solid fa-code-commit" style="color: var(--accent-amber);"></i> Source Control...</div>
                <div class="pg-drawer-menu-item" onclick="PlaygroundTrayDrawerHelper.selectAttachmentOption('problems')"><i class="fa-solid fa-circle-xmark" style="color: var(--accent-rose);"></i> Problems...</div>
                <div class="pg-drawer-menu-item" onclick="PlaygroundTrayDrawerHelper.selectAttachmentOption('symbols')"><i class="fa-solid fa-cubes" style="color: var(--accent-emerald);"></i> Symbols...</div>
                <div class="pg-drawer-menu-item" onclick="PlaygroundTrayDrawerHelper.selectAttachmentOption('sessions')"><i class="fa-solid fa-comments" style="color: var(--primary-light);"></i> Sessions...</div>
                <div class="pg-drawer-menu-item" onclick="PlaygroundTrayDrawerHelper.selectAttachmentOption('tools')"><i class="fa-solid fa-screwdriver-wrench" style="color: var(--accent-cyan);"></i> Tools...</div>
              </div>
            </div>
          </div>

          <!-- Image 3: Agent Mode Drawer Button -->
          <div style="position: relative;">
            <button type="button" id="pg-agent-mode-btn" class="tray-btn-premium" onclick="PlaygroundTrayDrawerHelper.toggleAgentDrawer(event)">
              <i class="fa-solid fa-code tray-badge-glow"></i> <span id="pg-agent-mode-label">${this.agentMode}</span>
            </button>

            <!-- Image 3 Popup Drawer -->
            <div id="pg-agent-drawer-popup" class="glass-panel" style="display: none; position: absolute; bottom: 36px; left: 0; z-index: 105; width: 220px; padding: 6px; background: var(--bg-card); border: 1px solid var(--border-glow); box-shadow: 0 10px 28px rgba(0,0,0,0.6); border-radius: 8px;">
              <div class="pg-drawer-menu-item ${this.agentMode === 'Agent' ? 'active' : ''}" onclick="PlaygroundTrayDrawerHelper.setAgentMode('Agent')">
                <span><i class="fa-solid fa-code" style="color: var(--accent-cyan);"></i> Agent</span>
                <span style="font-size: 0.65rem; color: var(--text-muted);">Ctrl+Shift+I</span>
              </div>
              <div class="pg-drawer-menu-item ${this.agentMode === 'Ask' ? 'active' : ''}" onclick="PlaygroundTrayDrawerHelper.setAgentMode('Ask')">
                <span><i class="fa-solid fa-comment-dots" style="color: var(--accent-emerald);"></i> Ask</span>
              </div>
              <div class="pg-drawer-menu-item ${this.agentMode === 'Plan' ? 'active' : ''}" onclick="PlaygroundTrayDrawerHelper.setAgentMode('Plan')">
                <span><i class="fa-solid fa-list-ol" style="color: var(--accent-amber);"></i> Plan</span>
              </div>
              <div style="border-top: 1px solid var(--border-color); margin: 4px 0;"></div>
              <div class="pg-drawer-menu-item" onclick="PlaygroundTrayDrawerHelper.openConfigureCustomAgents()">
                <i class="fa-solid fa-user-gear" style="color: var(--primary-light);"></i> Configure Custom Agents...
              </div>
            </div>
          </div>

          <!-- Strategy Auto Button -->
          <button type="button" class="tray-btn-premium" onclick="PlaygroundTrayDrawerHelper.cycleStrategy(this)" title="Strategy Mode">
            <i class="fa-solid fa-arrows-split-up-and-left" style="color: var(--accent-emerald);"></i> Auto
          </button>

          <!-- Image 4: Models Button -->
          <div style="position: relative;">
            <button type="button" id="pg-bottom-model-btn" class="tray-btn-premium" style="max-width: 220px;" onclick="PlaygroundTrayDrawerHelper.toggleModelsDrawer(event)">
              <i class="fa-solid fa-wand-magic-sparkles tray-badge-glow" style="flex-shrink: 0;"></i> <span id="pg-bottom-model-name" style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${PlaygroundViewHelper.escapeHtml(selectedModelName || 'jDroidxyz-combo-agent')}</span>
            </button>

            <!-- Image 4 Popup Drawer -->
            <div id="pg-models-drawer-popup" class="glass-panel" style="display: none; position: fixed; z-index: 1000; width: 640px; max-width: 95vw; padding: 12px; background: rgba(15,23,42,0.85); border: 1px solid var(--border-glow); box-shadow: 0 16px 40px rgba(0,0,0,0.8); border-radius: 12px; backdrop-filter: blur(12px);">
              <!-- Dual Tier Grid Layout -->
              <div class="dual-tier-tray-grid">
                 <!-- Left Column: Categories -->
                 <div class="dual-tier-col">
                    <div class="dual-tier-header"><i class="fa-solid fa-filter"></i> Category</div>
                    <div style="padding: 6px; border-bottom: 1px solid var(--border-color);">
                       <input type="text" class="form-control" style="font-size: 0.72rem; padding: 4px 8px; width: 100%;" placeholder="Search categories..." onkeyup="PlaygroundTrayDrawerHelper.filterCategories(this.value)" />
                    </div>
                    <div id="pg-models-menu-categories" class="dual-tier-list">
                       <!-- Populated dynamically -->
                    </div>
                 </div>
                 
                 <!-- Right Column: Models -->
                 <div class="dual-tier-col">
                    <div class="dual-tier-header"><i class="fa-solid fa-microchip"></i> Model</div>
                    <div style="padding: 6px; border-bottom: 1px solid var(--border-color);">
                       <input type="text" class="form-control" id="pg-models-menu-search" style="font-size: 0.72rem; padding: 4px 8px; width: 100%;" placeholder="Search models..." onkeyup="PlaygroundTrayDrawerHelper.filterModelsList(this.value)" />
                    </div>
                    <div id="pg-models-menu-list" class="dual-tier-list">
                       <!-- Populated dynamically -->
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <!-- Image 5: Configure Tools Button (Sliders / Tune Icon) -->
          <button type="button" class="fmc-chat-icon-btn" onclick="PlaygroundTrayDrawerHelper.openConfigureToolsModal()" title="Configure Tools Available to Chat">
            <i class="fa-solid fa-sliders"></i>
          </button>
        </div>

        <!-- Right Side: Mic & Circular Theme Send Button (Matching Screenshot) -->
        <div style="display: flex; align-items: center; gap: 6px;">
          <button type="button" id="pg-voice-btn" class="fmc-chat-icon-btn" onclick="PlaygroundInputHelper.toggleVoiceDictation(this)" title="Voice Dictation">
            <i class="fa-solid fa-microphone"></i>
          </button>
          
          <button type="button" id="chat-send-btn" class="fmc-chat-icon-btn fmc-chat-send-btn" onclick="PlaygroundView.handleSendOrStopClick()" title="Send Prompt (Ctrl+Enter)">
            <i class="fa-solid fa-arrow-turn-down fa-rotate-90"></i>
          </button>
        </div>
      </div>
      <!-- Bottom Line Status Footer (Image 1 style) -->
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; color: var(--text-muted); padding-top: 2px; border-top: 1px solid rgba(255,255,255,0.03);">
        <div style="display: flex; align-items: center; gap: 14px;">
          <span style="display: flex; align-items: center; gap: 5px; cursor: pointer;" onclick="PlaygroundView.changeWorkspacePath()" title="Active Local Workspace">
            <i class="fa-solid fa-desktop" style="font-size: 0.72rem; color: var(--text-muted);"></i> Local
          </span>
          <span style="display: flex; align-items: center; gap: 5px; cursor: pointer;" onclick="PlaygroundTrayDrawerHelper.toggleApprovalMode()" title="Approval Policy">
            <i class="fa-solid fa-shield-halved" style="font-size: 0.72rem; color: var(--accent-emerald);"></i> <span id="pg-approval-mode-text">${this.approvalMode}</span>
          </span>
        </div>
        <div>
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 0.72rem; color: var(--accent-cyan); opacity: 0.5;"></i>
        </div>
      </div>
    `;
  }

  // ── Render Image 5: Configure Tools Modal ──
  static renderConfigureToolsModalHtml() {
    const selectedCount = this.toolsList.filter(t => t.enabled).length;

    return `
      <div id="pg-configure-tools-modal" class="modal-overlay" style="display: none; position: fixed; top:0; left:0; right:0; bottom:0; z-index: 1000; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); justify-content: center; align-items: center;">
        <div class="glass-panel" style="width: 580px; max-width: 95vw; background: #0f172a; border: 1px solid var(--accent-cyan); border-radius: 10px; padding: 16px; box-shadow: 0 16px 40px rgba(0,0,0,0.8); display: flex; flex-direction: column; gap: 12px;">
          
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
            <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-sliders" style="color: var(--accent-cyan);"></i> Configure Tools
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="btn btn-secondary btn-xs" title="Refresh Tool Catalog" onclick="PlaygroundTrayDrawerHelper.refreshToolCatalog()"><i class="fa-solid fa-arrows-rotate"></i></button>
              <button class="btn btn-secondary btn-xs" title="Tool Settings" onclick="ModalDialog.showNotification('Tool Engine configuration synced', 'info')"><i class="fa-solid fa-gear"></i></button>
              <button class="btn btn-link btn-xs" style="color: var(--text-muted); font-size: 1rem;" onclick="PlaygroundTrayDrawerHelper.closeConfigureToolsModal()">&times;</button>
            </div>
          </div>

          <!-- Search & Select All Header Bar -->
          <div style="display: flex; gap: 8px; align-items: center;">
            <div style="position: relative; flex: 1;">
              <input type="checkbox" id="pg-tools-select-all" checked onchange="PlaygroundTrayDrawerHelper.toggleSelectAllTools(this.checked)" style="position: absolute; left: 10px; top: 10px; z-index: 2;" />
              <input type="text" id="pg-tools-search-input" class="form-control" style="padding-left: 32px; font-size: 0.8rem;" placeholder="Select tools that are available to chat." onkeyup="PlaygroundTrayDrawerHelper.filterConfiguredTools(this.value)" />
            </div>
            <span id="pg-tools-selected-badge" style="font-size: 0.72rem; padding: 6px 12px; border-radius: 6px; background: rgba(56, 189, 248, 0.2); color: var(--accent-cyan); font-weight: 700; white-space: nowrap;">
              ${selectedCount} Selected
            </span>
            <button class="btn btn-accent btn-sm" style="padding: 6px 16px;" onclick="PlaygroundTrayDrawerHelper.saveConfiguredTools()">OK</button>
          </div>

          <!-- Subtitle Description -->
          <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.4;">
            The selected tools will be applied globally for all chat sessions that use the default agent.
          </div>

          <!-- Checkable Tool Tree -->
          <div id="pg-tools-checklist-container" style="max-height: 320px; overflow-y: auto; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
            ${this.renderToolsChecklistHtml()}
          </div>
        </div>
      </div>
    `;
  }

  static renderToolsChecklistHtml(filterText = '') {
    const categories = Array.from(new Set(this.toolsList.map(t => t.category)));
    
    return categories.map(cat => {
      const catTools = this.toolsList.filter(t => t.category === cat && (!filterText || t.name.toLowerCase().includes(filterText.toLowerCase()) || t.desc.toLowerCase().includes(filterText.toLowerCase())));
      if (catTools.length === 0) return '';

      const allCatSelected = catTools.every(t => t.enabled);

      return `
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan);">
            <i class="fa-solid fa-chevron-down" style="font-size: 0.65rem;"></i>
            <input type="checkbox" ${allCatSelected ? 'checked' : ''} onchange="PlaygroundTrayDrawerHelper.toggleCategoryTools('${cat}', this.checked)" />
            <span>${cat}</span>
          </div>
          <div style="padding-left: 20px; display: flex; flex-direction: column; gap: 4px;">
            ${catTools.map(t => `
              <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.74rem; color: var(--text-main); cursor: pointer; background: rgba(255,255,255,0.02); padding: 4px 8px; border-radius: 4px;">
                <input type="checkbox" ${t.enabled ? 'checked' : ''} onchange="PlaygroundTrayDrawerHelper.toggleToolEnabled('${t.id}', this.checked)" />
                <div style="display: flex; flex-direction: column;">
                  <span style="font-weight: 600; color: var(--primary-light);">${t.name}</span>
                  <span style="font-size: 0.68rem; color: var(--text-muted);">${t.desc}</span>
                </div>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  // ── Event Handlers & Toggles ──
  static toggleTodoDrawer() {
    const content = document.getElementById('pg-todo-drawer-content');
    const chevron = document.getElementById('pg-todo-chevron');
    if (!content) return;
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'block' : 'none';
    if (chevron) chevron.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
  }

  static toggleFileChangesDrawer() {
    const content = document.getElementById('pg-file-changes-drawer-content');
    const chevron = document.getElementById('pg-file-changes-chevron');
    if (!content) return;
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'block' : 'none';
    if (chevron) chevron.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
  }

  static toggleTaskDone(id) {
    const task = this.todoList.find(t => t.id === id);
    if (task) {
      task.done = !task.done;
      const el = document.getElementById('pg-todo-drawer-wrapper');
      if (el) {
        const activeTask = this.todoList.find(t => !t.done) || this.todoList[0];
        const doneCount = this.todoList.filter(t => t.done).length;
        const totalTasks = this.todoList.length;
        const activeTitleEl = el.querySelector('#pg-todo-header-bar span:nth-child(3)');
        const countEl = el.querySelector('#pg-todo-header-bar span:nth-child(4)');
        if (activeTitleEl) activeTitleEl.innerText = activeTask ? activeTask.title : 'No active tasks';
        if (countEl) countEl.innerText = `(${doneCount}/${totalTasks})`;
      }
    }
  }

  static deleteTask(id) {
    this.todoList = this.todoList.filter(t => t.id !== id);
    ModalDialog.showNotification('Task removed from planning tree', 'info');
    if (this.todoList.length === 0) {
      const wrapper = document.getElementById('pg-todo-drawer-wrapper');
      if (wrapper) wrapper.style.display = 'none';
    } else {
      const container = document.getElementById('pg-todo-items-list');
      if (container) {
        container.innerHTML = this.todoList.map(t => `
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.74rem; background: rgba(255,255,255,0.02); padding: 4px 8px; border-radius: 4px;">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; flex: 1;">
              <input type="checkbox" ${t.done ? 'checked' : ''} onchange="PlaygroundTrayDrawerHelper.toggleTaskDone(${t.id})" />
              <span style="${t.done ? 'text-decoration: line-through; opacity: 0.6;' : 'color: var(--text-main);'}">${PlaygroundViewHelper.escapeHtml(t.title)}</span>
            </label>
            <button type="button" class="btn btn-link btn-xs" style="color: var(--accent-rose); padding: 0 4px;" onclick="PlaygroundTrayDrawerHelper.deleteTask(${t.id})">&times;</button>
          </div>
        `).join('');
      }
    }
  }

  static addNewTaskPrompt() {
    ModalDialog.showPrompt('Add New Agile SDLC Task', 'Task Description:', (title) => {
      if (title && title.trim()) {
        this.todoList.push({ id: Date.now(), title: title.trim(), done: false });
        ModalDialog.showNotification('Task added to planning tree', 'success');
        const container = document.getElementById('pg-todo-items-list');
        if (container) {
          container.innerHTML = this.todoList.map(t => `
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.74rem; background: rgba(255,255,255,0.02); padding: 4px 8px; border-radius: 4px;">
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; flex: 1;">
                <input type="checkbox" ${t.done ? 'checked' : ''} onchange="PlaygroundTrayDrawerHelper.toggleTaskDone(${t.id})" />
                <span style="${t.done ? 'text-decoration: line-through; opacity: 0.6;' : 'color: var(--text-main);'}">${PlaygroundViewHelper.escapeHtml(t.title)}</span>
              </label>
              <button type="button" class="btn btn-link btn-xs" style="color: var(--accent-rose); padding: 0 4px;" onclick="PlaygroundTrayDrawerHelper.deleteTask(${t.id})">&times;</button>
            </div>
          `).join('');
        }
      }
    });
  }

  static keepFileChanges() {
    this.fileChanges = [];
    const wrapper = document.getElementById('pg-file-changes-wrapper');
    if (wrapper) wrapper.style.display = 'none';
    ModalDialog.showNotification('File changes accepted and committed to workspace', 'success');
  }

  static undoFileChanges() {
    this.fileChanges = [];
    const wrapper = document.getElementById('pg-file-changes-wrapper');
    if (wrapper) wrapper.style.display = 'none';
    ModalDialog.showNotification('File changes reverted to last git snapshot', 'warning');
  }

  static openDiffModal() {
    ModalDialog.showNotification('Opening File Diff Viewer Modal', 'info');
  }

  // ── Image 2 Attachments Drawer Toggle ──
  static toggleAttachmentsDrawer(e) {
    if (e) e.stopPropagation();
    const el = document.getElementById('pg-attachments-drawer-popup');
    if (!el) return;
    this.closeAllDrawers();
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
    if (el.style.display === 'flex') {
      const searchInput = el.querySelector('input');
      if (searchInput) searchInput.focus();
    }
  }

  static selectAttachmentOption(optionKey) {
    this.closeAllDrawers();
    if (optionKey === 'files' || optionKey === 'editors') {
      PlaygroundView.selectLocalDeskItem();
    } else if (optionKey === 'screenshot') {
      ModalDialog.showNotification('Capturing screenshot window...', 'info');
    } else if (optionKey === 'tools') {
      this.openConfigureToolsModal();
    } else {
      ModalDialog.showNotification(`Selected attachment context: ${optionKey}`, 'info');
    }
  }

  // ── Image 3 Agent Mode Drawer Toggle ──
  static toggleAgentDrawer(e) {
    if (e) e.stopPropagation();
    const el = document.getElementById('pg-agent-drawer-popup');
    if (!el) return;
    this.closeAllDrawers();
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
  }

  static setAgentMode(mode) {
    this.agentMode = mode;
    const label = document.getElementById('pg-agent-mode-label');
    if (label) label.innerText = mode;
    this.closeAllDrawers();
    ModalDialog.showNotification(`Switched chat mode to '${mode}'`, 'info');
  }

  static openConfigureCustomAgents() {
    this.closeAllDrawers();
    window.location.pathname = '/settings';
  }

  // ── Image 4 Models Drawer Toggle ──
  static toggleModelsDrawer(e) {
    if (e) e.stopPropagation();
    const el = document.getElementById('pg-models-drawer-popup');
    if (!el) return;
    this.closeAllDrawers();
    const isHidden = el.style.display === 'none';
    
    if (isHidden) {
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      if (e && e.currentTarget) {
         const rect = e.currentTarget.getBoundingClientRect();
         el.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
         let leftPos = rect.left - 200;
         if (leftPos + 450 > window.innerWidth) leftPos = window.innerWidth - 470;
         if (leftPos < 10) leftPos = 10;
         el.style.left = leftPos + 'px';
      }
      this.populateModelsMenuList();
    } else {
      el.style.display = 'none';
    }
  }

  static _trayDropdownState = { activeCategory: '', catSearch: '', modSearch: '' };

  static populateModelsMenuList() {
    const catListEl = document.getElementById('pg-models-menu-categories');
    const modListEl = document.getElementById('pg-models-menu-list');
    if (!catListEl || !modListEl) return;
    
    try {
      const activeModels = (typeof PlaygroundView !== 'undefined' && PlaygroundView.models) ? PlaygroundView.models : [];
      const combos = (window.app && window.app.combos) ? window.app.combos : [];
    
    // Build unique sets
    const families = [...new Set(activeModels.map(m => m.family || 'General').filter(Boolean))].sort();
    const providers = [...new Set(activeModels.map(m => m.providerId).filter(Boolean))].sort();

    // Reconcile selectedModelId with category initially
    const selectedModelId = window.app.selectedModelId || '';
    if (!this._trayDropdownState.initialized && selectedModelId) {
      if (selectedModelId.startsWith('dynamic_all:')) {
         this._trayDropdownState.activeCategory = selectedModelId.replace('dynamic_all:', '');
      } else {
         const sm = activeModels.find(m => m.id === selectedModelId);
         if (sm) this._trayDropdownState.activeCategory = 'provider:' + sm.providerId;
      }
      this._trayDropdownState.initialized = true;
    }

    // Validate activeCategory; fallback if missing (e.g. provider was blacklisted)
    const currentCat = this._trayDropdownState.activeCategory;
    let isValidCat = false;
    if (currentCat.startsWith('provider:')) isValidCat = providers.includes(currentCat.split(':')[1]);
    else if (currentCat.startsWith('family:')) isValidCat = families.includes(currentCat.split(':')[1]);
    else if (currentCat.startsWith('combo:')) isValidCat = combos.some(c => c.id === currentCat.split(':')[1]);

    if (!isValidCat) {
      if (providers.length > 0) this._trayDropdownState.activeCategory = 'provider:' + providers[0];
      else if (combos.length > 0) this._trayDropdownState.activeCategory = 'combo:' + combos[0].id;
      else if (families.length > 0) this._trayDropdownState.activeCategory = 'family:' + families[0];
    }

    const catQuery = this._trayDropdownState.catSearch.toLowerCase();
    
    // Render Category List
    let catHtml = '';
    
    const filterAndMap = (arr, prefix, title) => {
       const f = arr.filter(x => {
          if (!x) return false;
          return !catQuery || (x.name || String(x)).toLowerCase().includes(catQuery);
       });
       if (f.length === 0) return '';
       let html = `<div style="font-size: 0.6rem; color: var(--text-muted); margin: 6px 0 2px 4px; text-transform: uppercase;">${title}</div>`;
       f.forEach(item => {
          const val = prefix + ':' + (item.id || item);
          const name = item.name || item;
          const isActive = this._trayDropdownState.activeCategory === val;
          html += `<div class="dual-tier-item ${isActive ? 'active' : ''}" onclick="PlaygroundTrayDrawerHelper.selectCategoryFromDrawer(event, '${val}')">
            ${PlaygroundViewHelper.escapeHtml(name)}
          </div>`;
       });
       return html;
    };
    
    catHtml += filterAndMap(combos, 'combo', 'Combos');
    catHtml += filterAndMap(providers, 'provider', 'Providers');
    catHtml += filterAndMap(families, 'family', 'Families');
    
    catListEl.innerHTML = catHtml || '<div style="padding: 8px; color: var(--text-muted); font-size: 0.72rem; text-align: center;">No matches</div>';

    // Render Model List
    let filteredModels = [];
    const cat = this._trayDropdownState.activeCategory;
    if (cat.startsWith('provider:')) {
       filteredModels = activeModels.filter(m => m.providerId === cat.split(':')[1]);
    } else if (cat.startsWith('family:')) {
       filteredModels = activeModels.filter(m => (m.family || 'General') === cat.split(':')[1]);
    } else if (cat.startsWith('combo:')) {
       filteredModels = [];
    }

    const modQuery = this._trayDropdownState.modSearch.toLowerCase();
    filteredModels = filteredModels.filter(m => {
       if (!m) return false;
       return !modQuery || (m.modelName || m.id || '').toLowerCase().includes(modQuery);
    });

    let modHtml = '';
    
    if (!cat.startsWith('combo:')) {
       modHtml += `<div class="dual-tier-item" style="color: var(--accent-amber);" onclick="PlaygroundTrayDrawerHelper.selectModelFromDrawer(event, 'dynamic_all:${cat}')"><i class="fa-solid fa-bolt" style="margin-right:6px;"></i> [ ALL MODELS ] (Fallback Array)</div>`;
       filteredModels.forEach(m => {
          const isActive = m.id === selectedModelId;
          modHtml += `<div class="dual-tier-item ${isActive ? 'active' : ''}" onclick="PlaygroundTrayDrawerHelper.selectModelFromDrawer(event, '${m.id}')">
            <div style="display: flex; flex-direction: column;">
              <span>${PlaygroundViewHelper.escapeHtml(m.modelName || m.id)}</span>
              <span style="font-size: 0.6rem; color: var(--text-muted); font-weight: normal;">${m.providerId}</span>
            </div>
            ${isActive ? '<i class="fa-solid fa-check" style="color: var(--accent-cyan);"></i>' : ''}
          </div>`;
       });
    } else {
       modHtml += `<div class="dual-tier-item" style="color: var(--accent-cyan);" onclick="PlaygroundTrayDrawerHelper.selectModelFromDrawer(event, '${cat}')">
         <i class="fa-solid fa-play" style="margin-right:6px;"></i> Execute Native Combo
       </div>`;
    }
    
    modListEl.innerHTML = modHtml;
    } catch(err) {
       console.error("Drawer populate error:", err);
       catListEl.innerHTML = `<div style="color:red; padding:10px;">${err.toString()}</div>`;
       modListEl.innerHTML = `<div style="color:red; padding:10px;">${err.stack}</div>`;
    }
  }

  static selectCategoryFromDrawer(event, val) {
    if (event) event.stopPropagation();
    this._trayDropdownState.activeCategory = val;
    this.populateModelsMenuList();
    document.getElementById('pg-models-menu-search')?.focus();
  }

  static selectModelFromDrawer(event, modelId) {
    if (event) event.stopPropagation();
    this.closeAllDrawers();
    if (typeof PlaygroundView !== 'undefined' && typeof PlaygroundView.selectModel === 'function') {
       PlaygroundView.selectModel(modelId);
    } else if (typeof PlaygroundView !== 'undefined' && PlaygroundView.onModelSelectChange) {
       PlaygroundView.onModelSelectChange(modelId);
    }
  }

  static filterCategories(text) {
    this._trayDropdownState.catSearch = text;
    this.populateModelsMenuList();
  }

  static filterModelsList(text) {
    this._trayDropdownState.modSearch = text;
    this.populateModelsMenuList();
  }

  // ── Image 5 Configure Tools Modal Handlers ──
  static openConfigureToolsModal() {
    this.closeAllDrawers();
    const modal = document.getElementById('pg-configure-tools-modal');
    if (modal) modal.style.display = 'flex';
  }

  static closeConfigureToolsModal() {
    const modal = document.getElementById('pg-configure-tools-modal');
    if (modal) modal.style.display = 'none';
  }

  static filterConfiguredTools(text) {
    const container = document.getElementById('pg-tools-checklist-container');
    if (container) {
      container.innerHTML = this.renderToolsChecklistHtml(text);
    }
  }

  static toggleToolEnabled(toolId, enabled) {
    const tool = this.toolsList.find(t => t.id === toolId);
    if (tool) tool.enabled = enabled;
    this.updateToolsBadge();
  }

  static toggleCategoryTools(cat, enabled) {
    this.toolsList.filter(t => t.category === cat).forEach(t => t.enabled = enabled);
    this.filterConfiguredTools(document.getElementById('pg-tools-search-input')?.value || '');
    this.updateToolsBadge();
  }

  static toggleSelectAllTools(enabled) {
    this.toolsList.forEach(t => t.enabled = enabled);
    this.filterConfiguredTools(document.getElementById('pg-tools-search-input')?.value || '');
    this.updateToolsBadge();
  }

  static updateToolsBadge() {
    const badge = document.getElementById('pg-tools-selected-badge');
    const selectedCount = this.toolsList.filter(t => t.enabled).length;
    if (badge) badge.innerText = `${selectedCount} Selected`;
  }

  static saveConfiguredTools() {
    localStorage.setItem('fmc_configured_tools', JSON.stringify(this.toolsList));
    this.closeConfigureToolsModal();
    const count = this.toolsList.filter(t => t.enabled).length;
    ModalDialog.showNotification(`Saved ${count} active tools for chat execution`, 'success');
  }

  static refreshToolCatalog() {
    ModalDialog.showNotification('Refreshed tool catalog from local & MCP servers', 'info');
  }

  static toggleApprovalMode() {
    const modes = ['Default approvals', 'Auto-approve reads', 'Strict approvals'];
    const idx = (modes.indexOf(this.approvalMode) + 1) % modes.length;
    this.approvalMode = modes[idx];
    const textEl = document.getElementById('pg-approval-mode-text');
    if (textEl) textEl.innerText = this.approvalMode;
    ModalDialog.showNotification(`Approval policy updated to '${this.approvalMode}'`, 'info');
  }

  static cycleStrategy(btnEl) {
    const strategies = [
      { name: 'Auto', icon: 'fa-arrows-split-up-and-left', color: 'var(--accent-emerald)', desc: 'Multi-Factor Scoring Engine' },
      { name: 'Cost Optimized', icon: 'fa-dollar-sign', color: 'var(--accent-cyan)', desc: 'Cheapest Provider First' },
      { name: 'Least Used', icon: 'fa-scale-balanced', color: 'var(--accent-purple)', desc: 'Min Active Connections' },
      { name: 'Power of 2 Choices', icon: 'fa-dice', color: 'var(--accent-amber)', desc: 'P2C Dual Random' },
      { name: 'LKGP', icon: 'fa-thumbtack', color: 'var(--primary-light)', desc: 'Session Sticky' },
      { name: 'Round Robin', icon: 'fa-rotate', color: 'var(--text-main)', desc: 'Equal Distribution' },
      { name: 'Fallback', icon: 'fa-shield-halved', color: 'var(--accent-rose)', desc: 'Failover Sequential' }
    ];
    
    const currentName = localStorage.getItem('fmc_active_strategy') || 'Auto';
    const currentIdx = strategies.findIndex(s => s.name === currentName);
    const nextIdx = (currentIdx + 1) % strategies.length;
    const nextStrat = strategies[nextIdx];

    localStorage.setItem('fmc_active_strategy', nextStrat.name);

    if (btnEl) {
      btnEl.innerHTML = `<i class="fa-solid ${nextStrat.icon}" style="color: ${nextStrat.color};"></i> ${nextStrat.name}`;
      btnEl.title = `Strategy: ${nextStrat.name} (${nextStrat.desc})`;
    }

    if (typeof ModalDialog !== 'undefined') {
      ModalDialog.showNotification(`Playground strategy switched to <strong>${nextStrat.name}</strong> (${nextStrat.desc})`, 'info');
    }
  }

  static showHints() {
    let drawer = document.getElementById('playground-hint-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'playground-hint-drawer';
      drawer.className = 'hint-drawer';
      drawer.innerHTML = `
        <div class="hint-drawer-header">
          <h4 style="margin: 0; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-lightbulb" style="color: var(--accent-amber);"></i> Playground Hints &amp; Shortcuts
          </h4>
          <button type="button" onclick="PlaygroundTrayDrawerHelper.hideHints()">&times;</button>
        </div>
        <div class="hint-drawer-body" style="padding: 14px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px; font-size: 0.78rem; line-height: 1.45; color: var(--text-main);">
          
          <!-- Section 1: Keyboard Shortcuts -->
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px;">
            <div style="font-weight: 700; color: var(--accent-cyan); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-keyboard"></i> Keyboard Shortcuts
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center;"><span>Send Prompt:</span> <kbd style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-color); padding: 1px 5px; border-radius: 4px; font-family: monospace;">Enter</kbd></div>
              <div style="display: flex; justify-content: space-between; align-items: center;"><span>New Line:</span> <kbd style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-color); padding: 1px 5px; border-radius: 4px; font-family: monospace;">Shift + Enter</kbd></div>
              <div style="display: flex; justify-content: space-between; align-items: center;"><span>Toggle Agent Mode:</span> <kbd style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-color); padding: 1px 5px; border-radius: 4px; font-family: monospace;">Ctrl + Shift + I</kbd></div>
              <div style="display: flex; justify-content: space-between; align-items: center;"><span>Toggle Sidebar:</span> <kbd style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-color); padding: 1px 5px; border-radius: 4px; font-family: monospace;">Sidebar Button</kbd></div>
              <div style="display: flex; justify-content: space-between; align-items: center;"><span>Parameters Drawer:</span> <kbd style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-color); padding: 1px 5px; border-radius: 4px; font-family: monospace;">Sliders Button</kbd></div>
            </div>
          </div>

          <!-- Section 2: Autonomous Agent Tools -->
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px;">
            <div style="font-weight: 700; color: var(--accent-emerald); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-screwdriver-wrench"></i> Available Agent Tools (8 Tools)
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px; font-size: 0.74rem;">
              <div>• <strong style="color: var(--accent-cyan);">web_search</strong>: Live DuckDuckGo web search.</div>
              <div>• <strong style="color: var(--accent-cyan);">read_file / write_file</strong>: Read and edit local workspace files.</div>
              <div>• <strong style="color: var(--accent-cyan);">run_command</strong>: Execute safe terminal commands.</div>
              <div>• <strong style="color: var(--accent-cyan);">generate_image</strong>: Generate AI image assets.</div>
              <div>• <strong style="color: var(--accent-cyan);">grep_search</strong>: Search codebase patterns.</div>
              <div>• <strong style="color: var(--accent-cyan);">browse_url / youtube_transcript</strong>: Fetch web markdown and video captions.</div>
            </div>
          </div>

          <!-- Section 3: Smart Routing & Failover -->
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px;">
            <div style="font-weight: 700; color: var(--accent-amber); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-shield-halved"></i> Auto-Failover &amp; Resiliency
            </div>
            <p style="margin: 0; font-size: 0.72rem; color: var(--text-dim); line-height: 1.4;">
              If any provider experiences rate limits (HTTP 429) or timeouts, FreeModelsClub automatically switches to the next healthy model in your pool with zero conversation loss.
            </p>
          </div>

        </div>
      `;
      document.body.appendChild(drawer);
    }
    drawer.classList.add('open');
  }

  static hideHints() {
    const drawer = document.getElementById('playground-hint-drawer');
    if (drawer) drawer.classList.remove('open');
  }

  static closeAllDrawers() {
    ['pg-attachments-drawer-popup', 'pg-agent-drawer-popup', 'pg-models-drawer-popup'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }
}

// Global click listener to close popups when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#pg-attachments-drawer-popup') &&
      !e.target.closest('#pg-agent-drawer-popup') &&
      !e.target.closest('#pg-models-drawer-popup') &&
      !e.target.closest('button')) {
    PlaygroundTrayDrawerHelper.closeAllDrawers();
  }
});

window.PlaygroundTrayDrawerHelper = PlaygroundTrayDrawerHelper;

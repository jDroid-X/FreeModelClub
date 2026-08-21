/**
 * IDEWorkspaceView.js
 * Purpose: VS Code-style IDE workspace integration for Playground.
 *          Provides file explorer, code editor, terminal, and workspace management.
 * Dependencies: ApiService, ModalDialog, PlaygroundView
 */
'use strict';

class IDEWorkspaceView {
  // ── State ──
  static workspacePath = null;
  static openFiles = [];
  static activeFile = null;
  static fileTreeCache = {};
  static terminalHistory = [];
  static currentTerminalLine = 0;

  // ── Helper: Browser-Safe Path Join ──
  static joinPath(base, child) {
    if (!base) return child || '';
    if (!child) return base || '';
    const isWindows = base.includes('\\') || /^[a-zA-Z]:/.test(base);
    const sep = isWindows ? '\\' : '/';
    const cleanBase = base.endsWith('\\') || base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanChild = child.startsWith('\\') || child.startsWith('/') ? child.slice(1) : child;
    return `${cleanBase}${sep}${cleanChild}`;
  }

  // ── Constants ──
  static FILE_ICONS = {
    '.js': 'fa-brands fa-js',
    '.ts': 'fa-brands fa-js',
    '.py': 'fa-brands fa-python',
    '.json': 'fa-solid fa-file-code',
    '.html': 'fa-brands fa-html5',
    '.css': 'fa-brands fa-css3',
    '.md': 'fa-solid fa-file-lines',
    '.txt': 'fa-solid fa-file-text',
    '.png': 'fa-solid fa-file-image',
    '.jpg': 'fa-solid fa-file-image',
    '.svg': 'fa-solid fa-file-image',
    '.gitignore': 'fa-brands fa-git',
    '.env': 'fa-solid fa-lock',
    'default': 'fa-solid fa-file'
  };

  static FOLDER_COLORS = ['#fbbf24', '#60a5fa', '#34d399', '#f472b6'];

  // ── Render Entrypoint ──
  static render(workspacePath = null) {
    if (workspacePath) {
      IDEWorkspaceView.workspacePath = workspacePath;
      localStorage.setItem('fmc_ide_workspace', workspacePath);
    } else {
      workspacePath = localStorage.getItem('fmc_ide_workspace');
    }

    const container = document.getElementById('fmc-main-content');
    if (!container) return;

    container.innerHTML = `
      <div class="ide-workspace" style="display: flex; height: 100%; overflow: hidden; background: #1e1e1e;">
        
        <!-- Activity Bar -->
        <div class="activity-bar" style="width: 48px; background: #333333; display: flex; flex-direction: column; align-items: center; padding-top: 8px; gap: 4px;">
          ${this.renderActivityButton('explorer', 'fa-files', 'Files', true)}
          ${this.renderActivityButton('search', 'fa-magnifying-glass', 'Search')}
          ${this.renderActivityButton('git', 'fa-code-branch', 'Source Control')}
          ${this.renderActivityButton('debug', 'fa-play', 'Run & Debug')}
          ${this.renderActivityButton('extensions', 'fa-puzzle-piece', 'Extensions')}
          <div style="flex: 1;"></div>
          ${this.renderActivityButton('settings', 'fa-gear', 'Settings')}
        </div>

        <!-- Sidebar Panel -->
        <div id="ide-sidebar" class="sidebar" style="width: 220px; background: #252526; border-right: 1px solid #3e3e42; display: flex; flex-direction: column;">
          <!-- Sidebar Header -->
          <div class="sidebar-header" style="padding: 8px 12px; font-size: 0.75rem; font-weight: 600; color: #bbbbbb; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
            <span id="sidebar-title">Explorer</span>
            <div style="display: flex; gap: 4px;">
              <button onclick="IDEWorkspaceView.createNewFile()" style="background: transparent; border: none; color: #858585; cursor: pointer; font-size: 0.75rem;" title="New File"><i class="fa-solid fa-file-circle-plus"></i></button>
              <button onclick="IDEWorkspaceView.createNewFolder()" style="background: transparent; border: none; color: #858585; cursor: pointer; font-size: 0.75rem;" title="New Folder"><i class="fa-solid fa-folder-plus"></i></button>
              <button onclick="IDEWorkspaceView.refreshExplorer()" style="background: transparent; border: none; color: #858585; cursor: pointer; font-size: 0.75rem;" title="Refresh"><i class="fa-solid fa-rotate"></i></button>
            </div>
          </div>

          <!-- Workspace Path Display -->
          <div id="ide-workspace-path" class="workspace-path" style="padding: 4px 12px 8px; font-size: 0.7rem; color: #858585; border-bottom: 1px solid #3e3e42;">
            <i class="fa-solid fa-folder-open" style="margin-right: 4px;"></i>
            <span id="workspace-path-text">${workspacePath || 'No Workspace Open'}</span>
            <button onclick="IDEWorkspaceView.openWorkspace()" style="background: transparent; border: none; color: #6b9bff; cursor: pointer; font-size: 0.65rem; margin-left: 4px;">Change</button>
          </div>

          <!-- File Tree Container -->
          <div id="ide-file-tree" class="file-tree" style="flex: 1; overflow-y: auto; padding: 4px 0;">
            ${workspacePath ? this.renderLoadingTree() : this.renderNoWorkspace()}
          </div>
        </div>

        <!-- Main Content Area -->
        <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
          
          <!-- Tab Bar -->
          <div id="ide-tab-bar" class="tab-bar" style="display: flex; background: #252526; border-bottom: 1px solid #3e3e42; overflow-x: auto;">
            ${this.renderTabBarButtons()}
          </div>

          <!-- Editor Area -->
          <div id="ide-editor-area" class="editor-area" style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
            ${this.renderEditorPlaceholder()}
          </div>

          <!-- Bottom Panel (Terminal) -->
          <div id="ide-terminal-panel" class="terminal-panel" style="height: 200px; border-top: 1px solid #3e3e42; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: #252526; border-bottom: 1px solid #3e3e42;">
              <div style="display: flex; gap: 16px;">
                <button class="terminal-tab active" onclick="IDEWorkspaceView.switchTerminalTab('terminal')" style="background: none; border: none; color: #e0e0e0; cursor: pointer; font-size: 0.75rem; padding: 2px 8px; border-bottom: 1px solid #007acc; margin-bottom: -1px;">TERMINAL</button>
                <button class="terminal-tab" onclick="IDEWorkspaceView.switchTerminalTab('problems')" style="background: none; border: none; color: #858585; cursor: pointer; font-size: 0.75rem; padding: 2px 8px;">PROBLEMS</button>
                <button class="terminal-tab" onclick="IDEWorkspaceView.switchTerminalTab('output')" style="background: none; border: none; color: #858585; cursor: pointer; font-size: 0.75rem; padding: 2px 8px;">OUTPUT</button>
              </div>
              <div style="display: flex; gap: 4px;">
                <button onclick="IDEWorkspaceView.clearTerminal()" style="background: transparent; border: none; color: #858585; cursor: pointer; font-size: 0.7rem;" title="Clear"><i class="fa-solid fa-eraser"></i></button>
                <button onclick="IDEWorkspaceView.toggleTerminalSize()" style="background: transparent; border: none; color: #858585; cursor: pointer; font-size: 0.7rem;" title="Toggle Size"><i class="fa-solid fa-expand"></i></button>
                <button onclick="IDEWorkspaceView.closeTerminal()" style="background: transparent; border: none; color: #858585; cursor: pointer; font-size: 0.7rem;" title="Close"><i class="fa-solid fa-times"></i></button>
              </div>
            </div>
            <div id="terminal-content" class="terminal-content" style="flex: 1; background: #1e1e1e; padding: 8px; font-family: 'Fira Code', Consolas, monospace; font-size: 0.75rem; overflow-y: auto; color: #d4d4d4;">
              <div style="color: #6a9955;">Microsoft Windows [Version 10.0.22621.2428]</div>
              <div style="color: #d4d4d4;">(c) Microsoft Corporation. All rights reserved.</div>
              <br>
              <div id="terminal-output"></div>
              <div style="display: flex; align-items: center; margin-top: 4px;">
                <span style="color: #6b9bff; margin-right: 4px;">➜</span>
                <span id="terminal-cwd" style="color: #569cd6; margin-right: 4px;">${workspacePath || 'C:\\Workspace'}</span>
                <span style="color: #ce9178; margin-right: 4px;">~</span>
                <input type="text" id="terminal-input" style="flex: 1; background: transparent; border: none; color: #d4d4d4; font-family: inherit; font-size: inherit; outline: none;" placeholder="Enter command..." onkeydown="IDEWorkspaceView.handleTerminalInput(event)">
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel (Chat Integration) -->
        <div class="chat-panel" style="width: 280px; background: #252526; border-left: 1px solid #3e3e42; display: flex; flex-direction: column;">
          <div style="padding: 8px 12px; font-size: 0.75rem; font-weight: 600; color: #bbbbbb; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #3e3e42;">
            <i class="fa-solid fa-wand-magic-sparkles" style="color: var(--accent-cyan); margin-right: 4px;"></i>
            AI Assistant
          </div>
          <div style="flex: 1; overflow-y: auto; padding: 8px;">
            <div style="font-size: 0.7rem; color: #858585; margin-bottom: 8px; padding: 8px; background: rgba(0,122,204,0.1); border-radius: 4px;">
              <i class="fa-solid fa-circle-info" style="margin-right: 4px;"></i>
              Select files from the explorer to add them to your AI context.
            </div>
            <div id="ai-suggestions" style="display: flex; flex-direction: column; gap: 4px;">
              ${this.renderAISuggestion('Explain this code', 'fa-circle-question')}
              ${this.renderAISuggestion('Fix bugs', 'fa-bug')}
              ${this.renderAISuggestion('Add tests', 'fa-vial')}
              ${this.renderAISuggestion('Refactor', 'fa-arrows-rotate')}
              ${this.renderAISuggestion('Generate docs', 'fa-book')}
            </div>
          </div>
          <div style="padding: 8px; border-top: 1px solid #3e3e42;">
            <button onclick="IDEWorkspaceView.sendToChat()" style="width: 100%; background: #007acc; border: none; color: white; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
              <i class="fa-solid fa-paper-plane" style="margin-right: 4px;"></i> Send to Chat
            </button>
          </div>
        </div>
      </div>
    `;

    // Load file tree if workspace is set
    if (workspacePath) {
      setTimeout(() => this.loadFileTree(workspacePath), 100);
    }
  }

  static renderActivityButton(id, icon, title, active = false) {
    const color = active ? '#e0e0e0' : '#858585';
    const border = active ? 'border-left: 2px solid #e0e0e0;' : '';
    return `<button onclick="IDEWorkspaceView.switchActivity('${id}')" 
      style="width: 40px; height: 40px; background: transparent; border: none; color: ${color}; cursor: pointer; font-size: 1.1rem; ${border}" 
      title="${title}">
      <i class="fa-solid ${icon}"></i>
    </button>`;
  }

  static renderAISuggestion(text, icon) {
    return `<button onclick="IDEWorkspaceView.insertSuggestion('${text}')" 
      style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid #3e3e42; color: #cccccc; padding: 6px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem; text-align: left; display: flex; align-items: center; gap: 6px;">
      <i class="fa-solid ${icon}" style="color: #6b9bff;"></i>
      ${text}
    </button>`;
  }

  static renderLoadingTree() {
    return `<div style="display: flex; justify-content: center; padding: 20px;">
      <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.2rem; color: #6b9bff;"></i>
    </div>`;
  }

  static renderNoWorkspace() {
    return `<div style="padding: 20px; text-align: center;">
      <i class="fa-solid fa-folder-open" style="font-size: 2rem; color: #545454; margin-bottom: 12px;"></i>
      <div style="font-size: 0.75rem; color: #858585; margin-bottom: 12px;">No workspace opened</div>
      <button onclick="IDEWorkspaceView.openWorkspace()" style="background: #007acc; border: none; color: white; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
        <i class="fa-solid fa-folder-open" style="margin-right: 4px;"></i> Open Folder
      </button>
    </div>`;
  }

  static renderTabBarButtons() {
    return `<button onclick="IDEWorkspaceView.toggleEditorPanel()" style="background: transparent; border: none; color: #858585; cursor: pointer; font-size: 0.7rem; padding: 4px 8px;">
      <i class="fa-solid fa-code"></i> Editor
    </button>`;
  }

  static renderEditorPlaceholder() {
    return `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #1e1e1e;">
      <div style="text-align: center; color: #858585;">
        <i class="fa-solid fa-file-code" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></i>
        <div style="font-size: 0.9rem; margin-bottom: 8px;">No file opened</div>
        <div style="font-size: 0.75rem;">Select a file from the explorer or press <kbd style="background: #3e3e42; padding: 2px 6px; border-radius: 3px;">Ctrl+P</kbd> to quick open</div>
      </div>
    </div>`;
  }

  // ── Workspace Management ──
  static openWorkspace() {
    FileSystemController.openInteractiveBrowser('folder', (selectedPath) => {
      if (selectedPath) {
        IDEWorkspaceView.selectWorkspace(selectedPath);
      }
    });
  }

  static selectWorkspace(folderPath) {
    if (!folderPath) return;
    IDEWorkspaceView.workspacePath = folderPath;
    localStorage.setItem('fmc_ide_workspace', folderPath);
    localStorage.setItem('fmc_project_workspace_path', folderPath);
    
    // Update path display in workspace header
    const pathText = document.getElementById('workspace-path-text');
    if (pathText) pathText.textContent = folderPath;

    const sidebarPathText = document.getElementById('ide-workspace-path-display');
    if (sidebarPathText) sidebarPathText.textContent = folderPath;

    if (typeof PlaygroundView !== 'undefined' && typeof PlaygroundView.updateWorkspaceIndicator === 'function') {
      PlaygroundView.updateWorkspaceIndicator();
    }

    IDEWorkspaceView.loadFileTree(folderPath);
    IDEWorkspaceView.loadFileTreeForSidebar();
    ModalDialog.showNotification('Workspace opened: ' + folderPath, 'success');
  }

  static refreshExplorer() {
    const currentWs = IDEWorkspaceView.workspacePath || localStorage.getItem('fmc_ide_workspace');
    if (currentWs) {
      IDEWorkspaceView.loadFileTree(currentWs);
      IDEWorkspaceView.loadFileTreeForSidebar();
    }
  }

  // ── File Tree Loading ──
  static async loadFileTree(path) {
    const container = document.getElementById('ide-file-tree');
    if (!container) return;

    container.innerHTML = this.renderLoadingTree();

    try {
      const res = await ApiService.browseLocalPath(path);
      if (res.success) {
        IDEWorkspaceView.fileTreeCache[path] = res;
        container.innerHTML = this.renderFileTreeItems(res.items, path, 0, false);
        
        // Update workspace path display
        const pathText = document.getElementById('workspace-path-text');
        if (pathText) pathText.textContent = path;
      } else {
        container.innerHTML = `<div style="padding: 12px; color: #f44336; font-size: 0.75rem;"><i class="fa-solid fa-triangle-exclamation"></i> ${res.error}</div>`;
      }
    } catch (err) {
      container.innerHTML = `<div style="padding: 12px; color: #f44336; font-size: 0.75rem;"><i class="fa-solid fa-triangle-exclamation"></i> ${err.message}</div>`;
    }
  }
  
  static handleFileClick(filePath, fileName, isSidebar) {
    if (isSidebar) {
      // Open in sidebar editor drawer
      if (typeof SidebarEditorView !== 'undefined') {
        SidebarEditorView.open(filePath, fileName);
      }
    } else {
      // Open in main editor
      this.openFile(filePath, fileName);
    }
  }

  static formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  static copyPathToClipboard(filePath) {
    if (!filePath) return;
    navigator.clipboard.writeText(filePath).then(() => {
      ModalDialog.showNotification(`Copied path: ${filePath}`, 'success');
    }).catch(() => {
      ModalDialog.showNotification('Failed to copy path to clipboard', 'warning');
    });
  }

  static renderFileTreeItems(items, parentPath, depth, isSidebar = false) {
    const targetId = isSidebar ? 'ide-file-tree-sidebar' : 'ide-file-tree';
    if (items.length === 0) {
      return `<div style="padding: 4px 12px; color: #858585; font-size: 0.8rem;">Empty folder</div>`;
    }

    // Sort: folders first, then files
    const sorted = [...items].sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return sorted.map(item => {
      const itemPath = item.path || IDEWorkspaceView.joinPath(parentPath, item.name);
      const escapedPath = itemPath.replace(/\\/g, '\\\\');
      const sizeStr = item.size ? IDEWorkspaceView.formatFileSize(item.size) : '';
      
      if (item.isDir) {
        const colorIndex = item.name.charCodeAt(0) % IDEWorkspaceView.FOLDER_COLORS.length;
        const folderColor = IDEWorkspaceView.FOLDER_COLORS[colorIndex];
        const isSidebarFlag = isSidebar ? 'true' : 'false';
        return `
          <div class="tree-item folder" data-is-sidebar="${isSidebarFlag}" style="user-select: none; position: relative; margin: 0; padding: 0;">
            <div onclick="IDEWorkspaceView.toggleFolder(this, '${escapedPath}', ${isSidebarFlag})" 
              style="display: flex; align-items: center; justify-content: space-between; padding: 1px 4px; cursor: pointer; font-size: ${isSidebar ? '0.85rem' : '0.78rem'}; font-weight: 600; min-height: 22px; height: 22px; line-height: 20px; box-sizing: border-box; color: var(--text-main);"
              onmouseover="this.style.background='rgba(255,255,255,0.08)'; const acts = this.querySelector('.tree-actions'); if(acts) acts.style.opacity='1';" 
              onmouseout="this.style.background='transparent'; const acts = this.querySelector('.tree-actions'); if(acts) acts.style.opacity='0';">
              <div style="display: flex; align-items: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
                <i class="fa-solid fa-caret-right folder-arrow" style="width: 11px; margin-right: 3px; font-size: 0.65rem; color: var(--text-dim);"></i>
                <i class="fa-solid fa-folder" style="color: ${folderColor}; margin-right: 5px; font-size: 0.82rem;"></i>
                <span style="font-weight: 600; font-size: ${isSidebar ? '0.85rem' : '0.78rem'}; color: var(--text-main); overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
              </div>
              <div class="tree-actions" style="opacity: 0; display: flex; gap: 2px; align-items: center; transition: opacity 0.15s ease; flex-shrink: 0;">
                <button type="button" onclick="event.stopPropagation(); IDEWorkspaceView.createNewFile('${escapedPath}')" title="New File Inside" style="background: transparent; border: none; color: var(--primary-light); cursor: pointer; font-size: 0.68rem; padding: 1px 3px;"><i class="fa-solid fa-file-circle-plus"></i></button>
                <button type="button" onclick="event.stopPropagation(); IDEWorkspaceView.showRenameDialog('${escapedPath}', '${item.name.replace(/'/g, "\\'")}')" title="Rename Folder" style="background: transparent; border: none; color: var(--accent-amber); cursor: pointer; font-size: 0.68rem; padding: 1px 3px;"><i class="fa-solid fa-pencil"></i></button>
                <button type="button" onclick="event.stopPropagation(); IDEWorkspaceView.showDeleteDialog('${escapedPath}', '${item.name.replace(/'/g, "\\'")}', true)" title="Delete Folder" style="background: transparent; border: none; color: var(--accent-rose); cursor: pointer; font-size: 0.68rem; padding: 1px 3px;"><i class="fa-solid fa-trash-can"></i></button>
              </div>
            </div>
            <div class="folder-children" style="display: none;">
              <div style="padding-left: 10px;">
                <div class="folder-loader" style="display: none; padding: 2px 6px; color: var(--text-muted); font-size: 0.72rem;">
                  <i class="fa-solid fa-circle-notch fa-spin"></i> Loading...
                </div>
                <div class="folder-content"></div>
              </div>
            </div>
          </div>
        `;
      } else {
        const ext = '.' + item.name.split('.').pop().toLowerCase();
        const iconClass = IDEWorkspaceView.FILE_ICONS[ext] || IDEWorkspaceView.FILE_ICONS['default'];
        const iconColor = ext === '.js' || ext === '.ts' ? '#fbbf24' : 
                         ext === '.py' ? '#60a5fa' : 
                         ext === '.json' ? '#34d399' : '#a1a1aa';
        
        return `
          <div class="tree-item file" style="cursor: pointer; position: relative; margin: 0; padding: 0;" 
            onclick="IDEWorkspaceView.handleFileClick('${escapedPath}', '${item.name}', ${isSidebar})"
            onmouseover="this.style.background='rgba(255,255,255,0.08)'; const acts = this.querySelector('.tree-actions'); if(acts) acts.style.opacity='1';" 
            onmouseout="this.style.background='transparent'; const acts = this.querySelector('.tree-actions'); if(acts) acts.style.opacity='0';">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 1px 4px; font-size: ${isSidebar ? '0.85rem' : '0.78rem'}; font-weight: 600; min-height: 22px; height: 22px; line-height: 20px; box-sizing: border-box; color: var(--text-main);">
              <div style="display: flex; align-items: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
                <i class="${iconClass}" style="width: 14px; margin-right: 5px; font-size: 0.75rem; color: ${iconColor};"></i>
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: ${isSidebar ? '0.85rem' : '0.78rem'}; font-weight: 600; color: var(--text-main);">${item.name}</span>
                ${sizeStr ? `<span style="margin-left: 6px; font-size: 0.65rem; color: var(--text-muted); opacity: 0.85;">${sizeStr}</span>` : ''}
              </div>
              <div class="tree-actions" style="opacity: 0; display: flex; gap: 2px; align-items: center; transition: opacity 0.15s ease; flex-shrink: 0;">
                <button type="button" onclick="event.stopPropagation(); IDEWorkspaceView.copyPathToClipboard('${escapedPath}')" title="Copy Path" style="background: transparent; border: none; color: var(--text-dim); cursor: pointer; font-size: 0.68rem; padding: 1px 3px;"><i class="fa-solid fa-link"></i></button>
                <button type="button" onclick="event.stopPropagation(); IDEWorkspaceView.showRenameDialog('${escapedPath}', '${item.name.replace(/'/g, "\\'")}')" title="Rename File" style="background: transparent; border: none; color: var(--accent-amber); cursor: pointer; font-size: 0.68rem; padding: 1px 3px;"><i class="fa-solid fa-pencil"></i></button>
                <button type="button" onclick="event.stopPropagation(); IDEWorkspaceView.showDeleteDialog('${escapedPath}', '${item.name.replace(/'/g, "\\'")}', false)" title="Delete File" style="background: transparent; border: none; color: var(--accent-rose); cursor: pointer; font-size: 0.68rem; padding: 1px 3px;"><i class="fa-solid fa-trash-can"></i></button>
              </div>
            </div>
          </div>
        `;
      }
    }).join('');
  }

  static async toggleFolder(element, folderPath, isSidebar) {
    // isSidebar passed explicitly from onclick handler
    const arrow = element.querySelector('.folder-arrow');
    const childrenContainer = element.parentElement;
    const folderChildren = childrenContainer.querySelector('.folder-children');
    const contentDiv = childrenContainer.querySelector('.folder-content');
    const loaderDiv = childrenContainer.querySelector('.folder-loader');

    if (arrow.classList.contains('fa-caret-down')) {
      // Collapse
      arrow.classList.remove('fa-caret-down');
      arrow.classList.add('fa-caret-right');
      if (folderChildren) folderChildren.style.display = 'none';
      if (contentDiv) contentDiv.style.display = 'none';
    } else {
      // Expand
      arrow.classList.remove('fa-caret-right');
      arrow.classList.add('fa-caret-down');
      if (folderChildren) folderChildren.style.display = 'block';
      
      if (contentDiv.innerHTML === '') {
        // Load folder contents
        loaderDiv.style.display = 'block';
        contentDiv.style.display = 'none';
        
        try {
          const res = await ApiService.browseLocalPath(folderPath);
          if (res.success) {
            IDEWorkspaceView.fileTreeCache[folderPath] = res;
            contentDiv.innerHTML = this.renderFileTreeItems(res.items, folderPath, 0, isSidebar);
          }
        } catch (err) {
          contentDiv.innerHTML = `<div style="color: var(--accent-rose); font-size: 0.7rem; padding: 4px;">Error loading folder</div>`;
        } finally {
          loaderDiv.style.display = 'none';
          contentDiv.style.display = 'block';
        }
      } else {
        contentDiv.style.display = 'block';
      }
    }
  }

  // ── File Operations ──
  static openFileInEditor(filePath, fileName) {
    if (!filePath) return;
    const name = fileName || filePath.split('\\').pop().split('/').pop() || 'file';
    if (typeof SidebarEditorView !== 'undefined' && document.getElementById('ide-editor-drawer')) {
      SidebarEditorView.open(filePath, name);
    } else {
      IDEWorkspaceView.openFile(filePath, name);
    }
  }

  static async openFile(filePath, fileName) {
    if (!fileName && filePath) {
      fileName = filePath.split('\\').pop().split('/').pop() || 'file';
    }
    // Add to open files if not already open
    if (!IDEWorkspaceView.openFiles.find(f => f.path === filePath)) {
      IDEWorkspaceView.openFiles.push({ path: filePath, name: fileName });
    }
    IDEWorkspaceView.activeFile = filePath;

    // Update tab bar
    this.renderTabBar();

    // Load file content
    try {
      const res = await ApiService.readFileContent(filePath);
      if (res.success) {
        this.renderEditor(filePath, fileName, res.content, res.extension);
      } else {
        ModalDialog.showNotification('Failed to read file: ' + res.error, 'error');
      }
    } catch (err) {
      ModalDialog.showNotification('Error reading file: ' + err.message, 'error');
    }
  }

  static renderTabBar() {
    const tabBar = document.getElementById('ide-tab-bar');
    if (!tabBar) return;

    let tabsHtml = IDEWorkspaceView.openFiles.map(file => `
      <div class="ide-tab ${file.path === IDEWorkspaceView.activeFile ? 'active' : ''}" 
        onclick="IDEWorkspaceView.openFile('${file.path.replace(/\\/g, '\\\\')}', '${file.name}')"
        style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: ${file.path === IDEWorkspaceView.activeFile ? '#1e1e1e' : '#2d2d2d'}; border-right: 1px solid #3e3e42; cursor: pointer; min-width: 120px;">
        <i class="fa-solid fa-file-code" style="color: #6b9bff; font-size: 0.7rem;"></i>
        <span style="font-size: 0.75rem; color: ${file.path === IDEWorkspaceView.activeFile ? '#e0e0e0' : '#858585'}; flex: 1; overflow: hidden; text-overflow: ellipsis;">${file.name}</span>
        <button onclick="event.stopPropagation(); IDEWorkspaceView.closeTab('${file.path.replace(/\\/g, '\\\\')}')" 
          style="background: transparent; border: none; color: #858585; cursor: pointer; font-size: 0.65rem; padding: 0 2px;">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `).join('');

    tabsHtml += `<button onclick="IDEWorkspaceView.toggleEditorPanel()" style="background: transparent; border: none; color: #858585; cursor: pointer; font-size: 0.7rem; padding: 6px 12px;"><i class="fa-solid fa-code"></i></button>`;
    
    tabBar.innerHTML = tabsHtml;
  }

  static closeTab(filePath) {
    const idx = IDEWorkspaceView.openFiles.findIndex(f => f.path === filePath);
    if (idx !== -1) {
      IDEWorkspaceView.openFiles.splice(idx, 1);
      if (IDEWorkspaceView.activeFile === filePath) {
        IDEWorkspaceView.activeFile = IDEWorkspaceView.openFiles[idx] ? IDEWorkspaceView.openFiles[idx].path : null;
      }
      this.renderTabBar();
      if (IDEWorkspaceView.activeFile) {
        this.openFile(IDEWorkspaceView.activeFile, IDEWorkspaceView.openFiles.find(f => f.path === IDEWorkspaceView.activeFile).name);
      } else {
        this.renderEditorPlaceholder();
      }
    }
  }

  static renderEditor(filePath, fileName, content, extension) {
    const editorArea = document.getElementById('ide-editor-area');
    if (!editorArea) return;

    // Syntax highlighting (simple version)
    const highlighted = this.highlightSyntax(content, extension);
    
    editorArea.innerHTML = `
      <div class="editor-container" style="flex: 1; display: flex; overflow: hidden; background: #1e1e1e;">
        <!-- Line Numbers -->
        <div class="line-numbers" style="width: 50px; background: #1e1e1e; border-right: 1px solid #3e3e42; padding: 8px 0; text-align: right; overflow: hidden;">
          ${content.split('\n').map((_, i) => `<div style="padding: 0 8px; color: #858585; font-size: 0.7rem; font-family: 'Fira Code', Consolas, monospace; line-height: 1.6;">${i + 1}</div>`).join('')}
        </div>
        
        <!-- Code Editor -->
        <div class="code-editor-wrapper" style="flex: 1; position: relative; overflow: auto;">
          <pre class="code-highlighting" style="margin: 0; padding: 8px; font-family: 'Fira Code', Consolas, monospace; font-size: 0.8rem; line-height: 1.6; color: #d4d4d4; white-space: pre; min-height: 100%;"><code>${highlighted}</code></pre>
          <textarea class="code-editor" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; margin: 0; padding: 8px; font-family: 'Fira Code', Consolas, monospace; font-size: 0.8rem; line-height: 1.6; color: transparent; background: transparent; border: none; outline: none; resize: none; white-space: pre; overflow: hidden;" 
            oninput="IDEWorkspaceView.syncEditor(this)" 
            onscroll="IDEWorkspaceView.syncScroll(this)"
            spellcheck="false">${this.escapeHtml(content)}</textarea>
        </div>
        
        <!-- Action Buttons -->
        <div class="editor-actions" style="width: 40px; background: #252526; border-left: 1px solid #3e3e42; display: flex; flex-direction: column; align-items: center; padding: 8px 0; gap: 8px;">
          <button onclick="IDEWorkspaceView.saveFile()" title="Save (Ctrl+S)" style="background: transparent; border: none; color: #6a9955; cursor: pointer; font-size: 1rem;" ${IDEWorkspaceView.isDirty ? '' : 'style="opacity: 0.5;"'}>
            <i class="fa-solid fa-floppy-disk"></i>
          </button>
          <button onclick="IDEWorkspaceView.runCurrentFile()" title="Run File" style="background: transparent; border: none; color: #6b9bff; cursor: pointer; font-size: 1rem;">
            <i class="fa-solid fa-play"></i>
          </button>
          <button onclick="IDEWorkspaceView.sendToChat()" title="Send to AI" style="background: transparent; border: none; color: #ce9178; cursor: pointer; font-size: 1rem;">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
      
      <!-- Status Bar -->
      <div class="status-bar" style="height: 22px; background: #007acc; display: flex; align-items: center; padding: 0 8px; font-size: 0.65rem; color: white; justify-content: space-between;">
        <div style="display: flex; gap: 12px; align-items: center;">
          <span><i class="fa-solid fa-code-branch" style="margin-right: 4px;"></i>main</span>
          <span id="status-file-name">${fileName}</span>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <span id="status-position">Ln 1, Col 1</span>
          <span>UTF-8</span>
          <span>${extension.toUpperCase() || 'TEXT'}</span>
          <span><i class="fa-solid fa-check" style="margin-right: 4px;"></i>Prettier</span>
        </div>
      </div>
    `;
  }

  static syncEditor(textarea) {
    const pre = textarea.parentElement.querySelector('.code-highlighting code');
    if (pre) {
      pre.innerHTML = this.highlightSyntax(textarea.value, IDEWorkspaceView.getFileExtension(IDEWorkspaceView.activeFile));
    }
  }

  static syncScroll(textarea) {
    const lineNumbers = textarea.closest('.editor-container').querySelector('.line-numbers');
    if (lineNumbers) {
      lineNumbers.scrollTop = textarea.scrollTop;
    }
  }

  static escapeHtml(str) {
    if (typeof PlaygroundViewHelper !== 'undefined') return PlaygroundViewHelper.escapeHtml(str);
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  static highlightSyntax(code, extension) {
    let escaped = this.escapeHtml(code);
    
    // Keywords
    const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'new', 'this', 'true', 'false', 'null', 'undefined'];
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'g');
      escaped = escaped.replace(regex, `<span style="color: #569cd6;">${kw}</span>`);
    });
    
    // Strings
    escaped = escaped.replace(/(['"`])(.*?)\1/g, '<span style="color: #ce9178;">$1$2$1</span>');
    
    // Comments
    escaped = escaped.replace(/(\/\/.*)/g, '<span style="color: #6a9955;">$1</span>');
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6a9955;">$1</span>');
    
    // Numbers
    escaped = escaped.replace(/\b(\d+)\b/g, '<span style="color: #b5cea8;">$1</span>');
    
    // Function calls
    escaped = escaped.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\(/g, '<span style="color: #dcdcaa;">$1</span>(');
    
    return escaped;
  }

  static getFileExtension(filePath) {
    if (!filePath) return '';
    const match = filePath.match(/\.([^.]+)$/);
    return match ? match[1] : '';
  }

  static async saveFile() {
    if (!IDEWorkspaceView.activeFile) return;
    
    const editor = document.querySelector('.code-editor');
    if (!editor) return;
    
    const content = editor.value;
    
    try {
      // Use the saveCode endpoint
      const res = await fetch('/api/playground/save-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPath: IDEWorkspaceView.activeFile,
          codeContent: content
        })
      });
      
      const result = await res.json();
      if (result.success) {
        ModalDialog.showNotification('File saved successfully!', 'success');
      } else {
        ModalDialog.showNotification('Failed to save: ' + result.error, 'error');
      }
    } catch (err) {
      ModalDialog.showNotification('Error saving file: ' + err.message, 'error');
    }
  }

  static async runCurrentFile() {
    if (!IDEWorkspaceView.activeFile) return;
    
    const extension = IDEWorkspaceView.getFileExtension(IDEWorkspaceView.activeFile);
    let command = '';
    
    switch (extension) {
      case 'js':
        command = `node "${IDEWorkspaceView.activeFile.replace(/\\/g, '/')}"`;
        break;
      case 'py':
        command = `python "${IDEWorkspaceView.activeFile.replace(/\\/g, '/')}"`;
        break;
      default:
        command = `echo "Running ${IDEWorkspaceView.activeFile}"`;
    }
    
    this.executeCommand(command);
  }

  // ── Terminal ──
  static handleTerminalInput(event) {
    const input = event.target;
    if (event.key === 'Enter') {
      const command = input.value.trim();
      if (command) {
        IDEWorkspaceView.terminalHistory.push(command);
        IDEWorkspaceView.currentTerminalLine = IDEWorkspaceView.terminalHistory.length;
        this.executeCommand(command);
        input.value = '';
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (IDEWorkspaceView.terminalHistory.length > 0) {
        if (IDEWorkspaceView.currentTerminalLine > 0) {
          IDEWorkspaceView.currentTerminalLine--;
        }
        input.value = IDEWorkspaceView.terminalHistory[IDEWorkspaceView.currentTerminalLine] || '';
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (IDEWorkspaceView.terminalHistory.length > 0) {
        if (IDEWorkspaceView.currentTerminalLine < IDEWorkspaceView.terminalHistory.length - 1) {
          IDEWorkspaceView.currentTerminalLine++;
          input.value = IDEWorkspaceView.terminalHistory[IDEWorkspaceView.currentTerminalLine] || '';
        } else {
          IDEWorkspaceView.currentTerminalLine = IDEWorkspaceView.terminalHistory.length;
          input.value = '';
        }
      }
    }
  }

  static async executeCommand(command) {
    const output = document.getElementById('terminal-output');
    const cwd = document.getElementById('terminal-cwd');
    if (!output) return;

    // Show command
    output.innerHTML += `<div style="color: #6b9bff;">➜ <span id="terminal-cwd-display">${cwd?.textContent || ''}</span></div>`;
    output.innerHTML += `<div style="color: #ce9178;">$ ${this.escapeHtml(command)}</div>`;
    
    // Execute via API
    try {
      const res = await fetch('/api/playground/run-powershell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandLine: command })
      });
      
      const result = await res.json();
      if (result.success) {
        output.innerHTML += `<pre style="color: #d4d4d4; margin: 4px 0; white-space: pre-wrap;">${this.escapeHtml(result.output || '')}</pre>`;
      } else {
        output.innerHTML += `<div style="color: #f44336;">Error: ${this.escapeHtml(result.error)}</div>`;
      }
    } catch (err) {
      output.innerHTML += `<div style="color: #f44336;">Connection error: ${this.escapeHtml(err.message)}</div>`;
    }
    
    output.innerHTML += '<br>';
    
    // Scroll to bottom
    const terminalContent = document.getElementById('terminal-content');
    if (terminalContent) {
      terminalContent.scrollTop = terminalContent.scrollHeight;
    }
  }

  static clearTerminal() {
    const output = document.getElementById('terminal-output');
    if (output) output.innerHTML = '';
  }

  static toggleTerminalSize() {
    const panel = document.getElementById('ide-terminal-panel');
    if (panel) {
      const currentHeight = panel.style.height;
      panel.style.height = currentHeight === '400px' ? '200px' : '400px';
    }
  }

  static closeTerminal() {
    const panel = document.getElementById('ide-terminal-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    }
  }

  static switchTerminalTab(tab) {
    document.querySelectorAll('.terminal-tab').forEach(t => {
      t.style.color = '#858585';
      t.style.borderBottom = 'none';
    });
    event.target.style.color = '#e0e0e0';
    event.target.style.borderBottom = '1px solid #007acc';
  }

  // ── Interactive File & Folder CRUD Modals with Validations ──
  static createNewFile(targetFolder = null) {
    const baseDir = targetFolder || IDEWorkspaceView.workspacePath || localStorage.getItem('fmc_ide_workspace');
    if (!baseDir) {
      ModalDialog.showNotification('Please open a workspace folder first', 'warning');
      return;
    }

    const modalContent = `
      <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.78rem;">
        <div style="color: var(--text-muted); font-size: 0.72rem;">
          <i class="fa-solid fa-folder-open" style="color: var(--accent-amber); margin-right: 4px;"></i> Location: <code style="color: var(--primary-light);">${baseDir}</code>
        </div>
        <div>
          <label style="display: block; font-weight: 600; margin-bottom: 4px; color: var(--text-main);">File Name:</label>
          <input type="text" id="new-file-name-input" class="form-control" placeholder="e.g. app.js, index.html, test.py" style="width: 100%; font-family: monospace; font-size: 0.78rem;" autofocus />
        </div>
        <div>
          <label style="display: block; font-weight: 600; margin-bottom: 4px; color: var(--text-muted);">Starter Template (Optional):</label>
          <select id="new-file-template-select" class="form-control" style="width: 100%; font-size: 0.75rem;">
            <option value="empty">Empty File</option>
            <option value="js">JavaScript Module (.js)</option>
            <option value="py">Python Script (.py)</option>
            <option value="html">HTML5 Page (.html)</option>
            <option value="json">JSON Data Structure (.json)</option>
            <option value="md">Markdown Document (.md)</option>
            <option value="css">CSS Stylesheet (.css)</option>
          </select>
        </div>
        <div id="new-file-error-msg" style="display: none; color: var(--accent-rose); font-size: 0.72rem;"></div>
      </div>
    `;

    ModalDialog.showCustomModal({
      title: '<i class="fa-solid fa-file-circle-plus" style="color: var(--primary-light); margin-right: 6px;"></i> Create New File',
      content: modalContent,
      confirmText: 'Create File',
      onConfirm: () => {
        const input = document.getElementById('new-file-name-input');
        const templateSelect = document.getElementById('new-file-template-select');
        const errorDiv = document.getElementById('new-file-error-msg');
        const rawName = input ? input.value.trim() : '';

        if (!rawName) {
          if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = 'Please enter a valid file name.'; }
          return false;
        }

        // Validate illegal Windows file characters
        if (/[<>:"/\\|?*]/.test(rawName)) {
          if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = 'File name cannot contain < > : " / \\ | ? *'; }
          return false;
        }

        let initialContent = '';
        const selectedTemplate = templateSelect ? templateSelect.value : 'empty';
        if (selectedTemplate === 'js') initialContent = "/**\n * " + rawName + "\n */\n'use strict';\n\nconsole.log('Hello from " + rawName + "');\n";
        else if (selectedTemplate === 'py') initialContent = "#!/usr/bin/env python3\n# " + rawName + "\n\nprint('Hello from " + rawName + "')\n";
        else if (selectedTemplate === 'html') initialContent = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>" + rawName + "</title>\n</head>\n<body>\n  <h1>" + rawName + "</h1>\n</body>\n</html>\n";
        else if (selectedTemplate === 'json') initialContent = "{\n  \"name\": \"" + rawName + "\",\n  \"version\": \"1.0.0\"\n}\n";
        else if (selectedTemplate === 'md') initialContent = "# " + rawName + "\n\nDescription for " + rawName + ".\n";
        else if (selectedTemplate === 'css') initialContent = "/* Styles for " + rawName + " */\n";

        const targetFilePath = IDEWorkspaceView.joinPath(baseDir, rawName);

        fetch('/api/playground/save-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetPath: targetFilePath, codeContent: initialContent })
        })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            ModalDialog.closeModal();
            ModalDialog.showNotification(`File created: ${rawName}`, 'success');
            const ws = IDEWorkspaceView.workspacePath || localStorage.getItem('fmc_ide_workspace');
            if (ws) {
              IDEWorkspaceView.loadFileTree(ws);
              IDEWorkspaceView.loadFileTreeForSidebar();
            }
            IDEWorkspaceView.openFile(targetFilePath, rawName);
          } else {
            if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = res.error || 'Failed to create file.'; }
          }
        })
        .catch(err => {
          if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = err.message; }
        });

        return false; // Keep modal open until async finish
      }
    });

    setTimeout(() => {
      const input = document.getElementById('new-file-name-input');
      if (input) input.focus();
    }, 100);
  }

  static createNewFolder(targetFolder = null) {
    const baseDir = targetFolder || IDEWorkspaceView.workspacePath || localStorage.getItem('fmc_ide_workspace');
    if (!baseDir) {
      ModalDialog.showNotification('Please open a workspace folder first', 'warning');
      return;
    }

    const modalContent = `
      <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.78rem;">
        <div style="color: var(--text-muted); font-size: 0.72rem;">
          <i class="fa-solid fa-folder-open" style="color: var(--accent-amber); margin-right: 4px;"></i> Location: <code style="color: var(--primary-light);">${baseDir}</code>
        </div>
        <div>
          <label style="display: block; font-weight: 600; margin-bottom: 4px; color: var(--text-main);">Folder Name:</label>
          <input type="text" id="new-folder-name-input" class="form-control" placeholder="e.g. src, components, utils" style="width: 100%; font-family: monospace; font-size: 0.78rem;" autofocus />
        </div>
        <div id="new-folder-error-msg" style="display: none; color: var(--accent-rose); font-size: 0.72rem;"></div>
      </div>
    `;

    ModalDialog.showCustomModal({
      title: '<i class="fa-solid fa-folder-plus" style="color: var(--accent-amber); margin-right: 6px;"></i> Create New Folder',
      content: modalContent,
      confirmText: 'Create Folder',
      onConfirm: () => {
        const input = document.getElementById('new-folder-name-input');
        const errorDiv = document.getElementById('new-folder-error-msg');
        const rawName = input ? input.value.trim() : '';

        if (!rawName) {
          if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = 'Please enter a folder name.'; }
          return false;
        }

        if (/[<>:"/\\|?*]/.test(rawName)) {
          if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = 'Folder name cannot contain < > : " / \\ | ? *'; }
          return false;
        }

        const targetFolderPath = IDEWorkspaceView.joinPath(baseDir, rawName);

        fetch('/api/playground/create-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetPath: targetFolderPath })
        })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            ModalDialog.closeModal();
            ModalDialog.showNotification(`Folder created: ${rawName}`, 'success');
            const ws = IDEWorkspaceView.workspacePath || localStorage.getItem('fmc_ide_workspace');
            if (ws) {
              IDEWorkspaceView.loadFileTree(ws);
              IDEWorkspaceView.loadFileTreeForSidebar();
            }
          } else {
            if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = res.error || 'Failed to create folder.'; }
          }
        })
        .catch(err => {
          if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = err.message; }
        });

        return false;
      }
    });

    setTimeout(() => {
      const input = document.getElementById('new-folder-name-input');
      if (input) input.focus();
    }, 100);
  }

  static showRenameDialog(oldPath, oldName) {
    const modalContent = `
      <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.78rem;">
        <div style="color: var(--text-muted); font-size: 0.72rem;">Current Path: <code style="color: var(--primary-light);">${oldPath}</code></div>
        <div>
          <label style="display: block; font-weight: 600; margin-bottom: 4px; color: var(--text-main);">New Name:</label>
          <input type="text" id="rename-item-input" class="form-control" value="${oldName}" style="width: 100%; font-family: monospace; font-size: 0.78rem;" autofocus />
        </div>
        <div id="rename-error-msg" style="display: none; color: var(--accent-rose); font-size: 0.72rem;"></div>
      </div>
    `;

    ModalDialog.showCustomModal({
      title: '<i class="fa-solid fa-pencil" style="color: var(--accent-amber); margin-right: 6px;"></i> Rename Item',
      content: modalContent,
      confirmText: 'Rename',
      onConfirm: () => {
        const input = document.getElementById('rename-item-input');
        const errorDiv = document.getElementById('rename-error-msg');
        const newName = input ? input.value.trim() : '';

        if (!newName || newName === oldName) {
          ModalDialog.closeModal();
          return;
        }

        if (/[<>:"/\\|?*]/.test(newName)) {
          if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = 'Name cannot contain < > : " / \\ | ? *'; }
          return false;
        }

        fetch('/api/playground/rename-item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPath, newName })
        })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            ModalDialog.closeModal();
            ModalDialog.showNotification(`Renamed to "${newName}"`, 'success');
            const ws = IDEWorkspaceView.workspacePath || localStorage.getItem('fmc_ide_workspace');
            if (ws) {
              IDEWorkspaceView.loadFileTree(ws);
              IDEWorkspaceView.loadFileTreeForSidebar();
            }
          } else {
            if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = res.error || 'Failed to rename item.'; }
          }
        })
        .catch(err => {
          if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = err.message; }
        });

        return false;
      }
    });

    setTimeout(() => {
      const input = document.getElementById('rename-item-input');
      if (input) { input.focus(); input.select(); }
    }, 100);
  }

  static showDeleteDialog(targetPath, itemName, isDir) {
    const modalContent = `
      <div style="font-size: 0.78rem; color: var(--text-main); line-height: 1.5;">
        <p>Are you sure you want to permanently delete this ${isDir ? 'folder and all its contents' : 'file'}?</p>
        <div style="padding: 8px; background: rgba(244,67,54,0.1); border: 1px solid rgba(244,67,54,0.3); border-radius: 4px; color: var(--accent-rose); font-family: monospace; font-size: 0.72rem; word-break: break-all;">
          ${targetPath}
        </div>
      </div>
    `;

    ModalDialog.showCustomModal({
      title: '<i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-rose); margin-right: 6px;"></i> Confirm Permanent Delete',
      content: modalContent,
      confirmText: 'Delete Permanently',
      onConfirm: () => {
        fetch('/api/playground/delete-item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetPath })
        })
        .then(r => r.json())
        .then(res => {
          ModalDialog.closeModal();
          if (res.success) {
            ModalDialog.showNotification(`Deleted: ${itemName}`, 'success');
            // Close tab if deleted file was open
            if (IDEWorkspaceView.activeFile === targetPath) {
              IDEWorkspaceView.closeTab(targetPath);
            }
            const ws = IDEWorkspaceView.workspacePath || localStorage.getItem('fmc_ide_workspace');
            if (ws) {
              IDEWorkspaceView.loadFileTree(ws);
              IDEWorkspaceView.loadFileTreeForSidebar();
            }
          } else {
            ModalDialog.showNotification(`Delete failed: ${res.error}`, 'error');
          }
        })
        .catch(err => {
          ModalDialog.closeModal();
          ModalDialog.showNotification(`Error: ${err.message}`, 'error');
        });
      }
    });
  }

  // ── AI Integration ──
  static sendToChat() {
    const editor = document.querySelector('.code-editor');
    if (!editor) {
      ModalDialog.showNotification('No file opened to send', 'warning');
      return;
    }
    
    const content = editor.value;
    const fileName = IDEWorkspaceView.activeFile ? IDEWorkspaceView.activeFile.split('\\').pop() : 'unknown';
    
    // Switch back to chat view
    if (typeof PlaygroundView !== 'undefined') {
      PlaygroundView.showChatView();
    }
    
    // Add file context to chat
    const inputEl = document.getElementById('chat-user-input');
    if (inputEl) {
      const prefix = `[Context: ${fileName}]\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}\n\n`;
      inputEl.value = prefix + (inputEl.value || 'Help me analyze this code:');
      inputEl.focus();
    }
  }

  static insertSuggestion(text) {
    const inputEl = document.getElementById('chat-user-input');
    if (inputEl) {
      inputEl.value = text;
      inputEl.focus();
    }
  }

  // ── Activity Panel Switching ──
  static switchActivity(panel) {
    switch (panel) {
      case 'explorer':
        IDEWorkspaceView.refreshExplorer();
        ModalDialog.showNotification('File Explorer Active', 'info');
        break;
      case 'search':
        if (typeof PlaygroundViewHelper !== 'undefined' && PlaygroundViewHelper.showQuickOpenModal) {
          PlaygroundViewHelper.showQuickOpenModal();
        } else {
          ModalDialog.showNotification('Press Ctrl+P to quick-search workspace files', 'info');
        }
        break;
      case 'git':
        IDEWorkspaceView.executeCommand('git status');
        ModalDialog.showNotification('Executed: git status in terminal', 'info');
        break;
      case 'debug':
        IDEWorkspaceView.runCurrentFile();
        break;
      case 'extensions':
        ModalDialog.showNotification('AI Agent Tools Active: Web Search, Image Gen, YouTube, PowerShell, Code Auto-Patch', 'info');
        break;
      case 'settings':
        if (typeof app !== 'undefined' && app.navigate) {
          app.navigate('settings');
        }
        break;
      default:
        console.log('Switched to activity:', panel);
    }
  }

  static toggleEditorPanel() {
    const editorArea = document.getElementById('ide-editor-area');
    if (editorArea) {
      editorArea.style.display = editorArea.style.display === 'none' ? 'flex' : 'none';
    }
  }
  static renderEditorPlaceholder() {
    return `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #1e1e1e;">
      <div style="text-align: center; color: #858585;">
        <i class="fa-solid fa-file-code" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></i>
        <div style="font-size: 0.9rem; margin-bottom: 8px;">No file opened</div>
        <div style="font-size: 0.75rem;">Select a file from the explorer or press <kbd style="background: #3e3e42; padding: 2px 6px; border-radius: 3px;">Ctrl+P</kbd> to quick open</div>
      </div>
    </div>`;
  }

  // ── Sidebar Integration for Playground Left Panel ──
  static async loadFileTreeForSidebar() {
    const container = document.getElementById('ide-file-tree-sidebar');
    if (!container) return;
    
    const workspacePath = IDEWorkspaceView.workspacePath || localStorage.getItem('fmc_ide_workspace');
    
    if (!workspacePath) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <i class="fa-solid fa-folder-open" style="font-size: 2rem; color: #545454; margin-bottom: 12px;"></i>
          <div style="font-size: 0.7rem; color: #858585; margin-bottom: 12px;">No workspace opened</div>
          <button onclick="IDEWorkspaceView.openWorkspaceFromSidebar()" style="background: #007acc; border: none; color: white; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">
            <i class="fa-solid fa-folder-open" style="margin-right: 4px;"></i> Open Folder
          </button>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '<div style="display: flex; justify-content: center; padding: 20px;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.2rem; color: #6b9bff;"></i></div>';
    
    try {
      const res = await ApiService.browseLocalPath(workspacePath);
      if (res.success) {
        IDEWorkspaceView.fileTreeCache[workspacePath] = res;
        container.innerHTML = IDEWorkspaceView.renderFileTreeItems(res.items, workspacePath, 0, true);
        
        // Update workspace display
        const pathDisplay = document.getElementById('ide-workspace-path-display');
        if (pathDisplay) pathDisplay.textContent = workspacePath;
      } else {
        container.innerHTML = `<div style="padding: 12px; color: #f44336; font-size: 0.7rem;"><i class="fa-solid fa-triangle-exclamation"></i> ${res.error}</div>`;
      }
    } catch (err) {
      container.innerHTML = `<div style="padding: 12px; color: #f44336; font-size: 0.7rem;"><i class="fa-solid fa-triangle-exclamation"></i> ${err.message}</div>`;
    }
  }
  
  static openWorkspaceFromSidebar() {
    // Use existing FileSystemController interactive browser
    FileSystemController.openInteractiveBrowser('folder', (selectedPath) => {
      if (selectedPath) {
        IDEWorkspaceView.workspacePath = selectedPath;
        localStorage.setItem('fmc_ide_workspace', selectedPath);
        localStorage.setItem('fmc_project_workspace_path', selectedPath);
        PlaygroundView.updateWorkspaceIndicator();
        IDEWorkspaceView.loadFileTreeForSidebar();
        ModalDialog.showNotification('Workspace opened: ' + selectedPath, 'success');
      }
    });
  }

  static async loadFileTreeForQuickOpen(path) {
    const resultsDiv = document.getElementById('quick-open-results');
    if (!resultsDiv) return;
    
    try {
      const res = await ApiService.browseLocalPath(path);
      if (res.success) {
        IDEWorkspaceView.renderQuickOpenList(res.items, path);
      } else {
        resultsDiv.innerHTML = `<div style="padding: 8px; color: #f44336; font-size: 0.75rem;">${res.error}</div>`;
      }
    } catch (err) {
      resultsDiv.innerHTML = `<div style="padding: 8px; color: #f44336; font-size: 0.75rem;">Error: ${err.message}</div>`;
    }
  }

  static renderQuickOpenList(items, parentPath) {
    const resultsDiv = document.getElementById('quick-open-results');
    if (!resultsDiv) return;
    
    // Filter to show only files
    const files = items.filter(item => !item.isDir).slice(0, 50);
    
    if (files.length === 0) {
      resultsDiv.innerHTML = `<div style="padding: 8px; color: #858585; font-size: 0.75rem;">No files found in this folder</div>`;
      return;
    }
    
    resultsDiv.innerHTML = files.map(file => `
      <div onclick="IDEWorkspaceView.openFile('${file.path.replace(/\\/g, '\\\\')}')" 
        style="padding: 6px 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: #cccccc;"
        onmouseover="this.style.background='rgba(0,122,204,0.1)'" 
        onmouseout="this.style.background='transparent'">
        <i class="fa-solid fa-file" style="color: #6b9bff;"></i>
        ${file.name}
      </div>
    `).join('');
  }

  static filterQuickOpenFiles(query) {
    const resultsDiv = document.getElementById('quick-open-results');
    if (!resultsDiv) return;
    
    if (!query || query.trim() === '') {
      // Show all files again
      IDEWorkspaceView.loadFileTreeForQuickOpen(IDEWorkspaceView.workspacePath);
      return;
    }
    
    // Filter the displayed files
    const allItems = resultsDiv.querySelectorAll('div[onclick]');
    allItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query.toLowerCase()) ? 'flex' : 'none';
    });
  }

  static async sendToChat(fileContent = null, fileName = null) {
    const activeFile = IDEWorkspaceView.activeFile;
    const displayFileName = fileName || (activeFile ? activeFile.split('\\').pop() : 'unknown');
    
    let content = fileContent;
    if (!content && activeFile) {
      try {
        const res = await ApiService.readFileContent(activeFile);
        if (res.success) {
          content = res.content;
        }
      } catch (err) {
        ModalDialog.showNotification('Failed to read file: ' + err.message, 'error');
        return;
      }
    }
    
    if (!content) {
      content = '[File: ' + displayFileName + ']';
    }
    
    // Switch back to chat view
    PlaygroundView.showChatView();
    
    // Add file context to chat input
    setTimeout(() => {
      const inputEl = document.getElementById('chat-user-input');
      if (inputEl) {
        const prefix = `[Context: ${displayFileName}]\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}\n\n`;
        inputEl.value = prefix + (inputEl.value || 'Help me analyze this code:');
        inputEl.focus();
      }
    }, 200);
  }

  static insertSuggestion(text) {
    PlaygroundView.sendPresetPrompt(text);
  }
}

// Make it globally accessible
window.IDEWorkspaceView = IDEWorkspaceView;

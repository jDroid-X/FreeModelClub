/**
 * SidebarEditorView.js
 * Purpose: Lightweight sliding editor panel that appears from left edge when IDE tab is active.
 *          Shows file content with syntax highlighting and quick actions.
 * Dependencies: ApiService, PlaygroundView, ModalDialog
 */
'use strict';

class SidebarEditorView {
  static currentFile = null;
  static currentContent = null;

  // ── Open Editor Panel ──
  static async open(filePath, fileName) {
    this.currentFile = filePath;
    this.currentContent = null;
    
    const drawer = document.getElementById('ide-editor-drawer');
    const content = document.getElementById('ide-editor-content');
    
    if (!drawer || !content) return;
    
    // Show drawer
    drawer.style.width = '55%';
    content.style.width = '100%';
    
    // Show loading state
    content.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
        <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.5rem; color: #6b9bff;"></i>
      </div>
    `;
    
    // Load file content
    try {
      const res = await ApiService.readFileContent(filePath);
      if (res.success) {
        this.currentContent = res.content;
        this.renderEditor(content, filePath, fileName, res.content, res.extension);
      } else {
        content.innerHTML = `<div style="padding: 20px; color: #f44336;">Error: ${res.error}</div>`;
      }
    } catch (err) {
      content.innerHTML = `<div style="padding: 20px; color: #f44336;">${err.message}</div>`;
    }
  }

  static renderEditor(container, filePath, fileName, content, extension) {
    const lines = content.split('\n');
    const lineNumbers = lines.map((_, i) => 
      `<div style="padding: 0 8px; color: #858585; font-size: 0.7rem; font-family: 'Fira Code', Consolas, monospace; text-align: right; border-right: 1px solid #3e3e42; min-width: 40px;">${i + 1}</div>`
    ).join('');
    
    container.innerHTML = `
      <div style="height: 100%; display: flex; flex-direction: column; background: #1e1e1e;">
        <!-- Tab Bar -->
        <div style="display: flex; background: #252526; border-bottom: 1px solid #3e3e42; overflow-x: auto;">
          <div style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: #1e1e1e; border-right: 1px solid #3e3e42; cursor: pointer; min-width: 120px;">
            <i class="fa-brands fa-js" style="color: #fbbf24; font-size: 0.7rem;"></i>
            <span style="font-size: 0.75rem; color: #cccccc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${fileName}</span>
            <button onclick="SidebarEditorView.close()" style="background: transparent; border: none; color: #858585; cursor: pointer; font-size: 0.65rem; padding: 0 2px;">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
        </div>
        
        <!-- Editor Area -->
        <div style="flex: 1; display: flex; overflow: hidden; position: relative;">
          <!-- Line Numbers -->
          <div style="width: 50px; background: #1e1e1e; border-right: 1px solid #3e3e42; overflow: hidden; padding-top: 8px;">
            ${lineNumbers}
          </div>
          
          <!-- Code Editor -->
          <textarea class="sidebar-code-editor" 
            style="flex: 1; background: transparent; border: none; outline: none; color: #d4d4d4; font-family: 'Fira Code', Consolas, monospace; font-size: 0.8rem; line-height: 1.6; padding: 8px; resize: none; white-space: pre; overflow: auto;"
            oninput="SidebarEditorView.onInput(this)"
            onscroll="SidebarEditorView.syncScroll(this)"
            spellcheck="false">${this.escapeHtml(content)}</textarea>
        </div>
        
        <!-- Action Bar -->
        <div style="padding: 6px 12px; background: #252526; border-top: 1px solid #3e3e42; display: flex; gap: 8px; align-items: center;">
          <button onclick="SidebarEditorView.save()" style="background: #007acc; border: none; color: white; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">
            <i class="fa-solid fa-floppy-disk" style="margin-right: 4px;"></i> Save
          </button>
          <button onclick="SidebarEditorView.sendToChat()" style="background: rgba(255,255,255,0.1); border: 1px solid var(--border-color); color: #cccccc; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">
            <i class="fa-solid fa-paper-plane" style="margin-right: 4px;"></i> Send to Chat
          </button>
          <button onclick="SidebarEditorView.runCurrentFile()" style="background: rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.4); color: #10b981; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">
            <i class="fa-solid fa-play" style="margin-right: 4px;"></i> Run
          </button>
          <div style="flex: 1;"></div>
          <span style="font-size: 0.65rem; color: #858585;">${extension.toUpperCase() || 'TEXT'}</span>
        </div>
        
        <!-- Status Bar -->
        <div style="height: 22px; background: #007acc; display: flex; align-items: center; padding: 0 8px; font-size: 0.65rem; color: white; justify-content: space-between;">
          <span>${fileName}</span>
          <span id="sidebar-editor-position">Ln 1, Col 1</span>
          <span>UTF-8</span>
        </div>
      </div>
    `;
  }

  static escapeHtml(str) {
    if (typeof PlaygroundViewHelper !== 'undefined') return PlaygroundViewHelper.escapeHtml(str);
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  static onInput(textarea) {
    this.currentContent = textarea.value;
    // Update position indicator
    const pos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, pos);
    const lines = textBefore.split('\n');
    const ln = lines.length;
    const col = lines[lines.length - 1].length + 1;
    const posEl = document.getElementById('sidebar-editor-position');
    if (posEl) posEl.textContent = `Ln ${ln}, Col ${col}`;
  }

  static syncScroll(textarea) {
    const lineNumbers = textarea.closest('div[style*="flex"]').querySelector('div[style*="width: 50px"]');
    if (lineNumbers) {
      lineNumbers.scrollTop = textarea.scrollTop;
    }
  }

  static async save() {
    if (!this.currentFile || !this.currentContent) return;
    
    try {
      const res = await fetch('/api/playground/save-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPath: this.currentFile,
          codeContent: this.currentContent
        })
      });
      
      const result = await res.json();
      if (result.success) {
        ModalDialog.showNotification('File saved!', 'success');
      } else {
        ModalDialog.showNotification('Save failed: ' + result.error, 'error');
      }
    } catch (err) {
      ModalDialog.showNotification('Error saving: ' + err.message, 'error');
    }
  }

  static sendToChat() {
    if (!this.currentFile) return;
    
    const fileName = this.currentFile.split('\\').pop();
    const content = this.currentContent || '';
    
    // Switch to chat tab
    PlaygroundView.switchLeftTab('chat');
    
    // Add to chat input
    setTimeout(() => {
      const inputEl = document.getElementById('chat-user-input');
      if (inputEl) {
        const prefix = `[Context: ${fileName}]\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}\n\n`;
        inputEl.value = prefix + (inputEl.value || 'Analyze this code:');
        inputEl.focus();
      }
    }, 200);
  }

  static runCurrentFile() {
    if (!this.currentFile) return;
    
    const ext = this.currentFile.split('.').pop().toLowerCase();
    let command = '';
    
    switch (ext) {
      case 'js':
        command = `node "${this.currentFile.replace(/\\/g, '/')}"`;
        break;
      case 'py':
        command = `python "${this.currentFile.replace(/\\/g, '/')}"`;
        break;
      default:
        command = `echo "Running ${this.currentFile}"`;
    }
    
    const executeScript = () => {
      ModalDialog.showNotification(`Running script: ${this.currentFile.split('\\').pop()}...`, 'info');
      fetch('/api/playground/run-powershell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandLine: command })
      })
      .then(res => res.json())
      .then(result => {
        // Output to IDE terminal if present
        const termOutput = document.getElementById('terminal-output');
        const termContent = document.getElementById('terminal-content');
        if (termOutput) {
          termOutput.innerHTML += `<div style="color: #6b9bff; margin-top: 6px;">➜ <span style="color: #569cd6;">${this.currentFile}</span></div>`;
          termOutput.innerHTML += `<div style="color: #ce9178;">$ ${SidebarEditorView.escapeHtml(command)}</div>`;
          if (result.success) {
            termOutput.innerHTML += `<pre style="color: #d4d4d4; margin: 4px 0; white-space: pre-wrap;">${SidebarEditorView.escapeHtml(result.output || 'Process exited successfully (0)')}</pre>`;
          } else {
            termOutput.innerHTML += `<div style="color: #f44336;">Error: ${SidebarEditorView.escapeHtml(result.error || 'Execution failed')}</div>`;
          }
          if (termContent) termContent.scrollTop = termContent.scrollHeight;
        }

        if (result.success) {
          ModalDialog.showNotification('Script executed successfully!', 'success');
        } else {
          ModalDialog.showNotification('Execution Error: ' + (result.error || 'Failed to run script'), 'error');
        }
      })
      .catch(err => ModalDialog.showNotification('Connection error: ' + err.message, 'error'));
    };

    // Human-In-The-Loop (HITL) Interactive Option Dialog
    ModalDialog.showOptionModal({
      title: '<i class="fa-solid fa-terminal" style="color: var(--accent-amber);"></i> Shell Script Execution Confirmation',
      message: `The agent is requesting to execute the following command:<br/><pre style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; font-size: 0.76rem; color: var(--accent-cyan); margin-top: 6px; overflow-x: auto;">${command}</pre>Do you want to authorize execution?`,
      icon: 'fa-triangle-exclamation',
      options: [
        {
          id: 'approve',
          label: 'Approve & Execute',
          icon: 'fa-play',
          type: 'primary',
          action: executeScript
        },
        {
          id: 'cancel',
          label: 'Reject / Cancel',
          icon: 'fa-xmark',
          type: 'secondary',
          action: () => ModalDialog.showNotification('Script execution cancelled by operator.', 'info')
        }
      ]
    });
  }

  static close() {
    const drawer = document.getElementById('ide-editor-drawer');
    const content = document.getElementById('ide-editor-content');
    
    if (drawer && content) {
      drawer.style.width = '0';
      content.style.width = '0';
    }
    
    this.currentFile = null;
    this.currentContent = null;
  }

  static toggle() {
    if (this.currentFile) {
      this.close();
    } else {
      // Would need current file context - use open instead
      console.log('Use open() to load a specific file');
    }
  }
}

window.SidebarEditorView = SidebarEditorView;

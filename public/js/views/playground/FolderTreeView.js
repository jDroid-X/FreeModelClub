/**
 * public/js/views/playground/FolderTreeView.js
 * OOPS View: Renders the custom interactive HTML folder/file tree browser inside the modal.
 */

class FolderTreeView {
  static getLoadingSpinnerHtml() {
    return `
      <div style="display: flex; justify-content: center; padding: 25px;">
        <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.6rem; color: var(--accent-cyan);"></i>
      </div>
    `;
  }

  static getErrorHtml(error) {
    return `<div class="alert alert-danger" style="font-size: 0.75rem; padding: 10px;">${error}</div>`;
  }

  static navigateBrowser(path) {
    if (typeof PlaygroundView !== 'undefined' && typeof PlaygroundView.navigateBrowser === 'function') {
      PlaygroundView.navigateBrowser(path);
    } else if (typeof PlaygroundView !== 'undefined' && typeof PlaygroundView.browserNavigateCallback === 'function') {
      PlaygroundView.browserNavigateCallback(path);
    }
  }

  static selectBrowserPath(path) {
    if (typeof PlaygroundView !== 'undefined' && typeof PlaygroundView.selectBrowserPath === 'function') {
      PlaygroundView.selectBrowserPath(path);
    } else if (typeof PlaygroundView !== 'undefined' && typeof PlaygroundView.browserSelectCallback === 'function') {
      PlaygroundView.browserSelectCallback(path);
    }
  }

  static async pickNativeFolder() {
    if (window.showDirectoryPicker) {
      try {
        const dirHandle = await window.showDirectoryPicker();
        if (dirHandle && dirHandle.name) {
          // Note: Browser sandbox provides handle; notify user or use standard path navigation
          ModalDialog.showNotification(`Selected folder: ${dirHandle.name}`, 'success');
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.warn('Native picker error:', e);
        }
      }
    }
  }

  static renderTreeBrowser(mode, res, currentPath) {
    let parentBtnHtml = '';
    if (res.parentPath) {
      parentBtnHtml = `
        <button type="button" class="btn btn-secondary btn-xs" style="padding: 4px 8px; font-weight: bold;" onclick="FolderTreeView.navigateBrowser('${res.parentPath.replace(/\\/g, '\\\\')}')">
          <i class="fa-solid fa-arrow-up"></i> Up
        </button>
      `;
    }
    
    // Dynamically derive root and home directories without hardcoding
    let baseRoot = 'C:\\';
    let userHome = '';
    if (currentPath) {
      const match = currentPath.match(/^([a-zA-Z]:\\(?:Users|home)\\[^\\]+)/i);
      if (match) userHome = match[1];
      const driveMatch = currentPath.match(/^([a-zA-Z]:\\)/);
      if (driveMatch) baseRoot = driveMatch[1];
    }
    const homePath = userHome || 'C:\\Users\\Default';
    
    const shortcutsHtml = `
      <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; font-size: 0.68rem; align-items: center;">
        <span style="color: var(--text-dim); font-size: 0.65rem; margin-right: 2px;"><i class="fa-solid fa-bolt" style="color: var(--accent-amber);"></i> Jumps:</span>
        <button type="button" class="btn btn-secondary btn-xs" style="padding: 2px 6px; font-size: 0.65rem;" onclick="FolderTreeView.navigateBrowser('${baseRoot.replace(/\\/g, '\\\\')}')"><i class="fa-solid fa-hard-drive"></i> Root (${baseRoot})</button>
        ${userHome ? `
          <button type="button" class="btn btn-secondary btn-xs" style="padding: 2px 6px; font-size: 0.65rem;" onclick="FolderTreeView.navigateBrowser('${homePath.replace(/\\/g, '\\\\')}\\\\Desktop')"><i class="fa-solid fa-desktop"></i> Desktop</button>
          <button type="button" class="btn btn-secondary btn-xs" style="padding: 2px 6px; font-size: 0.65rem;" onclick="FolderTreeView.navigateBrowser('${homePath.replace(/\\/g, '\\\\')}\\\\Documents')"><i class="fa-solid fa-folder-open"></i> Documents</button>
        ` : ''}
        <button type="button" class="btn btn-cyan btn-xs" style="padding: 2px 6px; font-size: 0.65rem; margin-left: auto;" onclick="FolderTreeView.pickNativeFolder()"><i class="fa-solid fa-computer"></i> Native Picker</button>
      </div>
    `;

    let itemsHtml = '';
    if (!res.items || res.items.length === 0) {
      itemsHtml = `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 15px;">Empty Folder</div>`;
    } else {
      itemsHtml = res.items.map(item => {
        const escapedPath = item.path.replace(/\\/g, '\\\\');
        if (item.isDir) {
          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(56,189,248,0.06)'" onmouseout="this.style.background='none'">
              <div style="display: flex; align-items: center; gap: 8px; flex: 1; font-size: 0.72rem; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" onclick="FolderTreeView.navigateBrowser('${escapedPath}')" title="${item.path}">
                <i class="fa-solid fa-folder" style="color: var(--accent-amber); flex-shrink: 0;"></i>
                <span style="color: var(--text-main); font-weight: bold; overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
              </div>
              ${mode === 'folder' ? `
                <button type="button" class="btn btn-cyan btn-xs" style="padding: 2px 8px; font-size: 0.68rem; margin-left: 6px; flex-shrink: 0;" onclick="FolderTreeView.selectBrowserPath('${escapedPath}')">
                  <i class="fa-solid fa-check"></i> Select
                </button>
              ` : ''}
            </div>
          `;
        } else {
          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(34,197,94,0.06)'" onmouseout="this.style.background='none'">
              <div style="display: flex; align-items: center; gap: 8px; flex: 1; font-size: 0.72rem; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" onclick="FolderTreeView.selectBrowserPath('${escapedPath}')" title="${item.path}">
                <i class="fa-solid fa-file" style="color: var(--primary-light); flex-shrink: 0;"></i>
                <span style="color: var(--text-main); overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
              </div>
              ${mode === 'file' ? `
                <button type="button" class="btn btn-emerald btn-xs" style="padding: 2px 8px; font-size: 0.68rem; margin-left: 6px; flex-shrink: 0;" onclick="FolderTreeView.selectBrowserPath('${escapedPath}')">
                  <i class="fa-solid fa-check"></i> Select
                </button>
              ` : ''}
            </div>
          `;
        }
      }).join('');
    }
    
    return `
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.75rem;">
        ${shortcutsHtml}
        <div style="display: flex; gap: 4px; align-items: center;">
          <input type="text" id="browser-current-path-input" class="form-control" style="font-size: 0.72rem; font-family: monospace; padding: 4px 8px; flex: 1;" value="${currentPath}" onkeydown="if(event.key==='Enter') FolderTreeView.navigateBrowser(this.value);" />
          <button type="button" class="btn btn-cyan btn-xs" style="padding: 4px 8px;" onclick="FolderTreeView.navigateBrowser(document.getElementById('browser-current-path-input').value)">Go</button>
          ${parentBtnHtml}
        </div>
        
        <div style="max-height: 250px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 4px; padding: 4px; display: flex; flex-direction: column; gap: 2px; background: rgba(0,0,0,0.15);">
          ${itemsHtml}
        </div>
        
        ${mode === 'folder' ? `
          <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
            <button type="button" class="btn btn-cyan btn-sm" style="width: 100%; font-weight: 700; padding: 6px;" onclick="FolderTreeView.selectBrowserPath('${currentPath.replace(/\\/g, '\\\\')}')">
              <i class="fa-solid fa-folder-check" style="margin-right: 4px;"></i> Select Current Folder: ${currentPath.split('\\').pop() || currentPath}
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }
}

window.FolderTreeView = FolderTreeView;

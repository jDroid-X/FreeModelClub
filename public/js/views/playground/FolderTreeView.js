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

  static renderTreeBrowser(mode, res, currentPath) {
    let parentBtnHtml = '';
    if (res.parentPath) {
      parentBtnHtml = `
        <button class="btn btn-secondary btn-xs" style="padding: 4px 8px; font-weight: bold;" onclick="PlaygroundView.navigateBrowser('${res.parentPath.replace(/\\/g, '\\\\')}')">
          <i class="fa-solid fa-arrow-up"></i> Up
        </button>
      `;
    }
    
    let itemsHtml = '';
    if (res.items.length === 0) {
      itemsHtml = `<div style="text-align: center; color: var(--text-muted); font-size: 0.72rem; padding: 15px;">Empty Folder</div>`;
    } else {
      itemsHtml = res.items.map(item => {
        const escapedPath = item.path.replace(/\\/g, '\\\\');
        if (item.isDir) {
          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(56,189,248,0.06)'" onmouseout="this.style.background='none'">
              <div style="display: flex; align-items: center; gap: 8px; flex: 1; font-size: 0.72rem; font-family: monospace;" onclick="PlaygroundView.navigateBrowser('${escapedPath}')">
                <i class="fa-solid fa-folder" style="color: var(--accent-amber);"></i>
                <span style="color: var(--text-main); font-weight: bold;">${item.name}</span>
              </div>
              ${mode === 'folder' ? `
                <button class="btn btn-cyan btn-xs" style="padding: 2px 6px; font-size: 0.65rem;" onclick="PlaygroundView.selectBrowserPath('${escapedPath}')">
                  Select
                </button>
              ` : ''}
            </div>
          `;
        } else {
          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(34,197,94,0.06)'" onmouseout="this.style.background='none'">
              <div style="display: flex; align-items: center; gap: 8px; flex: 1; font-size: 0.72rem; font-family: monospace;" onclick="PlaygroundView.selectBrowserPath('${escapedPath}')">
                <i class="fa-solid fa-file" style="color: var(--primary-light);"></i>
                <span style="color: var(--text-main);">${item.name}</span>
              </div>
              ${mode === 'file' ? `
                <button class="btn btn-emerald btn-xs" style="padding: 2px 6px; font-size: 0.65rem;" onclick="PlaygroundView.selectBrowserPath('${escapedPath}')">
                  Select
                </button>
              ` : ''}
            </div>
          `;
        }
      }).join('');
    }
    
    return `
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.75rem;">
        <div style="display: flex; gap: 4px; align-items: center;">
          <input type="text" id="browser-current-path-input" class="form-control" style="font-size: 0.72rem; font-family: monospace; padding: 4px 8px; flex: 1;" value="${currentPath}" />
          <button class="btn btn-cyan btn-xs" style="padding: 4px 8px;" onclick="PlaygroundView.navigateBrowser(document.getElementById('browser-current-path-input').value)">Go</button>
          ${parentBtnHtml}
        </div>
        
        <div style="max-height: 250px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 4px; padding: 4px; display: flex; flex-direction: column; gap: 2px; background: rgba(0,0,0,0.15);">
          ${itemsHtml}
        </div>
        
        ${mode === 'folder' ? `
          <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
            <button class="btn btn-cyan btn-sm" style="width: 100%; font-weight: 700; padding: 6px;" onclick="PlaygroundView.selectBrowserPath('${currentPath.replace(/\\/g, '\\\\')}')">
              Select Current Folder: ${currentPath.split('\\').pop() || currentPath}
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }
}

window.FolderTreeView = FolderTreeView;

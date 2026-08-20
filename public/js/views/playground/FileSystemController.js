/**
 * public/js/views/playground/FileSystemController.js
 * OOPS Controller: Coordinates directory pickers, uploads, and attachment arrays.
 */

class FileSystemController {
  static openInteractiveBrowser(mode, callback) {
    ModalDialog.closeModal();
    let currentPath = localStorage.getItem('fmc_project_workspace_path') || 'c:\\Users\\jiten\\jAnitGravity\\FreeModelsClub';
    
    const renderBrowserContent = async (browsePath) => {
      browsePath = browsePath || currentPath;
      const modalBody = document.getElementById('interactive-browser-body');
      if (modalBody) {
        modalBody.innerHTML = FolderTreeView.getLoadingSpinnerHtml();
      }
      
      try {
        const res = await ApiService.browseLocalPath(browsePath);
        if (!res.success) {
          if (modalBody) {
            modalBody.innerHTML = FolderTreeView.getErrorHtml(res.error);
          }
          return;
        }
        
        currentPath = res.currentPath;
        if (modalBody) {
          modalBody.innerHTML = FolderTreeView.renderTreeBrowser(mode, res, currentPath);
        }
      } catch (err) {
        if (modalBody) {
          modalBody.innerHTML = FolderTreeView.getErrorHtml(err.message);
        }
      }
    };
    
    PlaygroundView.browserNavigateCallback = renderBrowserContent;
    PlaygroundView.browserSelectCallback = (selectedPath) => {
      ModalDialog.closeModal();
      callback(selectedPath);
    };
    
    const modalContent = `
      <div id="interactive-browser-body" style="min-height: 150px; min-width: 480px;"></div>
    `;
    
    ModalDialog.showCustomModal({
      title: `<i class="fa-solid fa-folder-open" style="color: var(--accent-cyan);"></i> Select ${mode === 'folder' ? 'Workspace Directory' : 'Local File'}`,
      content: modalContent,
      confirmText: 'Cancel'
    });
    
    renderBrowserContent(currentPath);
  }

  static handleFileUpload(event, onFileAddedCallback) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        onFileAddedCallback({
          name: file.name,
          type: file.type || 'text/plain',
          data: e.target.result
        });
      };
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
    
    event.target.value = ''; // reset file input value
  }

  static handleClipboardPaste(event, onFileAddedCallback) {
    const items = (event.clipboardData || event.originalEvent?.clipboardData)?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            onFileAddedCallback({
              name: `clipboard_img_${Date.now()}.png`,
              type: 'image/png',
              data: e.target.result
            });
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }
}

window.FileSystemController = FileSystemController;

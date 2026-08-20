/**
 * ConfigView.js
 * Purpose: Integration code snippets & Reference documentation Memo box view
 *          structured with 2-column layout (20% Left Language TOC Rail + 80% Code Workspace Pane) matching User Manual format.
 */

class ConfigView {
  static getSnippetRegistry() {
    return {
      curl: '<i class="fa-solid fa-terminal"></i> cURL Command Line Integration',
      python: '<i class="fa-brands fa-python"></i> Python OpenAI SDK Integration',
      nodejs: '<i class="fa-brands fa-node-js"></i> Node.js Express Client Integration',
      go: '<i class="fa-solid fa-code"></i> Go Lang HTTP Client Integration',
      php: '<i class="fa-brands fa-php"></i> PHP Guzzle Client Integration',
      jsonSpec: '<i class="fa-solid fa-file-code"></i> OpenAPI 3.0 JSON Specification',
      vscode: '<i class="fa-solid fa-gear"></i> External AI Clients (IDE, Desktop, CLI)'
    };
  }

  static async render(container) {
    const [snippetsData, memoData] = await Promise.all([
      ApiService.getSnippets(),
      ApiService.getMemoUrls()
    ]);

    container.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div class="panel-title"><i class="fa-solid fa-code"></i> Integration Script Snippets & Reference Memo</div>
          <span class="badge badge-emerald"><i class="fa-solid fa-plug" style="margin-right: 4px;"></i> Port 12247 API Endpoint</span>
        </div>

        <div style="display: flex; gap: 16px; align-items: flex-start; margin-top: 12px;">
          <!-- Left 20% Width TOC Navigation Rail matching User Manual design -->
          <div class="glass-panel" style="width: 20%; min-width: 170px; flex-shrink: 0; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-light); text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-bottom: 4px;">
              <i class="fa-solid fa-code"></i> Languages & Tools
            </div>

            <button class="btn btn-secondary btn-sm config-nav-btn active" id="cfg-btn-curl" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="ConfigView.switchTab('curl')">
              <i class="fa-solid fa-terminal" style="color: var(--accent-cyan); margin-right: 6px;"></i> cURL CLI
            </button>
            <button class="btn btn-secondary btn-sm config-nav-btn" id="cfg-btn-python" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="ConfigView.switchTab('python')">
              <i class="fa-brands fa-python" style="color: var(--accent-emerald); margin-right: 6px;"></i> Python SDK
            </button>
            <button class="btn btn-secondary btn-sm config-nav-btn" id="cfg-btn-nodejs" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="ConfigView.switchTab('nodejs')">
              <i class="fa-brands fa-node-js" style="color: var(--accent-amber); margin-right: 6px;"></i> Node.js Express
            </button>
            <button class="btn btn-secondary btn-sm config-nav-btn" id="cfg-btn-go" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="ConfigView.switchTab('go')">
              <i class="fa-solid fa-code" style="color: var(--primary-light); margin-right: 6px;"></i> Go Lang
            </button>
            <button class="btn btn-secondary btn-sm config-nav-btn" id="cfg-btn-php" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="ConfigView.switchTab('php')">
              <i class="fa-brands fa-php" style="color: var(--accent-cyan); margin-right: 6px;"></i> PHP Client
            </button>
            <button class="btn btn-secondary btn-sm config-nav-btn" id="cfg-btn-jsonSpec" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="ConfigView.switchTab('jsonSpec')">
              <i class="fa-solid fa-file-code" style="color: var(--accent-emerald); margin-right: 6px;"></i> OpenAPI JSON
            </button>
            <button class="btn btn-secondary btn-sm config-nav-btn" id="cfg-btn-vscode" style="justify-content: flex-start; font-size: 0.75rem; text-align: left;" onclick="ConfigView.switchTab('vscode')">
              <i class="fa-solid fa-gear" style="color: var(--primary); margin-right: 6px;"></i> VS Code Extensions
            </button>
          </div>

          <!-- Right 80% Width Workspace Pane -->
          <div style="flex: 1; min-width: 0;">
            <div class="glass-card" style="padding: 14px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="font-size: 0.95rem; color: var(--accent-cyan); margin: 0;" id="config-snippet-title">
                  <i class="fa-solid fa-terminal"></i> cURL Command Line Integration
                </h4>
                <button class="btn btn-secondary btn-xs" onclick="ConfigView.copySnippet()"><i class="fa-solid fa-copy"></i> Copy Code</button>
              </div>

              <div id="snippet-code-container"></div>
            </div>

            <!-- Reference Documentation Memo Box -->
            <div class="glass-card" style="padding: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                 <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                   <i class="fa-solid fa-bookmark" style="color: var(--accent-amber);"></i> Reference Documentation Memo Box
                 </div>
                 <button class="btn btn-primary btn-sm" onclick="ConfigView.showAddUrlDialog()"><i class="fa-solid fa-plus"></i> Add URL</button>
              </div>
              <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 10px;">
                Manage provider website reference URLs below for manual lookups and search testing:
              </p>

              <div id="memo-urls-list-container" style="margin-bottom: 10px; height: 320px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.snippetsData = snippetsData.snippets || {};
    this.memoUrls = memoData.urls || [];
    this.switchTab('curl');
    this.renderMemoList();
  }

  static switchTab(lang) {
    document.querySelectorAll('.config-nav-btn').forEach(b => {
      b.classList.remove('active');
      b.style.borderColor = 'var(--border-color)';
    });

    const activeBtn = document.getElementById(`cfg-btn-${lang}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.style.borderColor = 'var(--accent-cyan)';
    }

    const container = document.getElementById('snippet-code-container');
    const titleEl = document.getElementById('config-snippet-title');
    if (!container) return;

    const titles = this.getSnippetRegistry();

    if (titleEl) titleEl.innerHTML = titles[lang] || 'Integration Code Snippet';

    const snippetObj = this.snippetsData[lang] || {};
    const snippetData = snippetObj.chatCompletions || snippetObj.jsonSpec || '// Snippet loading...';

    if (Array.isArray(snippetData)) {
      container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; align-items: stretch;">
          ${snippetData.map((item, index) => `
            <div style="display: flex; flex-direction: column; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; height: 100%;">
              <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 8px; flex-shrink: 0;"><i class="fa-solid fa-cube"></i> ${item.label}</div>
              <div style="flex: 1; position: relative; display: flex; flex-direction: column;">
                <button class="btn btn-secondary btn-xs" style="position: absolute; top: 4px; right: 4px; z-index: 10; padding: 2px 6px; font-size: 0.65rem;" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').innerText); ModalDialog.showNotification('Snippet copied!', 'success');"><i class="fa-solid fa-copy"></i> Copy</button>
                <pre class="code-box" style="margin: 0; flex: 1; font-size: 0.7rem; max-height: 240px; overflow-y: auto; padding-top: 24px;"><code>${this.escapeHtml(item.code)}</code></pre>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      this.currentActiveSnippet = snippetData.map(i => `// ${i.label}\n${i.code}`).join('\n\n');
    } else {
      container.innerHTML = `<pre class="code-box" style="font-size: 0.78rem; max-height: 280px; overflow-y: auto;"><code>${this.escapeHtml(snippetData)}</code></pre>`;
      this.currentActiveSnippet = snippetData;
    }
  }

  static copySnippet() {
    if (this.currentActiveSnippet) {
      navigator.clipboard.writeText(this.currentActiveSnippet);
      ModalDialog.showNotification('Copied code snippet to clipboard!', 'success');
    }
  }

  static renderMemoList() {
    const urls = this.memoUrls || [];
    const items = urls.map((url, idx) => {
      let hostname = url;
      let protocol = 'N/A';
      try {
        const u = new URL(url);
        hostname = u.hostname;
        protocol = u.protocol;
      } catch(e) {}
      
      return {
        id: `url-${idx}`,
        title: hostname,
        subtitle: url,
        icon: 'fa-globe',
        badge: 'URL',
        badgeClass: 'badge-emerald',
        details: {
          'Full URL': url,
          'Protocol': protocol,
          'Host': hostname,
        },
        options: [
          { id: 'open', label: 'Open in Browser', icon: 'fa-arrow-up-right-from-square', type: 'primary', action: (item) => window.open(item.subtitle, '_blank') },
          { id: 'remove', label: 'Remove', icon: 'fa-trash', type: 'danger', action: (item) => ConfigView.confirmRemoveUrl(item.subtitle) }
        ]
      };
    });
    
    if (window.ListBoxComponent) {
      window.ListBoxComponent.render('memo-urls-list-container', {
        items,
        title: 'Memo URLs'
      });
    }
  }

  static showAddUrlDialog() {
    const content = `
      <div class="form-group">
        <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px; display: block;">Website URL</label>
        <input type="text" id="new-memo-url-input" class="form-control" placeholder="https://example.com" style="width: 100%;" />
      </div>
    `;
    ModalDialog.showCustomModal({
      title: '<i class="fa-solid fa-plus"></i> Add New Memo URL',
      content,
      confirmText: 'Validate & Add',
      onConfirm: async () => {
        const input = document.getElementById('new-memo-url-input');
        const url = input ? input.value.trim() : '';
        if (!url) return;
        
        const hasProtocol = url.startsWith('http://') || url.startsWith('https://');
        const isUnique = !this.memoUrls.includes(url);
        
        if (hasProtocol && isUnique) {
           ConfigView.addUrl(url);
        } else {
          ModalDialog.showValidationModal({
            title: 'URL Validation Check',
            validationResults: [
              { field: 'Protocol Check', passed: hasProtocol, message: hasProtocol ? 'Valid HTTP/HTTPS protocol detected.' : 'Missing http:// or https:// protocol.' },
              { field: 'Uniqueness Check', passed: isUnique, message: isUnique ? 'URL is unique.' : 'URL already exists in the memo list.' }
            ],
            options: [
              {
                id: 'add-anyway',
                label: 'Force Add Anyway',
                icon: 'fa-triangle-exclamation',
                type: 'danger',
                action: () => ConfigView.addUrl(url)
              }
            ]
          });
        }
      }
    });
  }

  static addUrl(url) {
    if (!this.memoUrls.includes(url)) {
      this.memoUrls.push(url);
      ApiService.saveMemoUrls(this.memoUrls).then(() => {
        ModalDialog.showNotification('Reference URL added to SSOT memo successfully!', 'success');
        this.renderMemoList();
        if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
      }).catch(err => {
        ModalDialog.showNotification('Failed to save memo URL: ' + err.message, 'error');
      });
    }
  }

  static confirmRemoveUrl(url) {
    ModalDialog.showOptionModal({
      title: 'Remove Reference URL',
      message: `Are you sure you want to remove this URL from the reference memo list?<br><br><strong style="color:var(--accent-rose);">${url}</strong>`,
      icon: 'fa-trash',
      options: [
        { id: 'yes', label: 'Yes, Remove It', icon: 'fa-trash-can', type: 'danger', action: () => {
          this.memoUrls = this.memoUrls.filter(u => u !== url);
          ApiService.saveMemoUrls(this.memoUrls).then(() => {
            ModalDialog.showNotification('Reference URL removed from SSOT memo!', 'success');
            this.renderMemoList();
            if (window.app && window.app.notifyDataChanged) window.app.notifyDataChanged();
          }).catch(err => {
            ModalDialog.showNotification('Failed to delete memo URL: ' + err.message, 'error');
          });
        }},
        { id: 'no', label: 'Cancel', icon: 'fa-xmark', type: 'secondary', action: () => {} }
      ]
    });
  }

  static escapeHtml(str) {
    if (typeof PlaygroundViewHelper !== 'undefined') return PlaygroundViewHelper.escapeHtml(str);
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
}

window.ConfigView = ConfigView;

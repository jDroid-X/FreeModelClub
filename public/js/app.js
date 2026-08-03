/**
 * app.js
 * Purpose: Master Single Page Application Router & State Manager (< 300 lines)
 *          Delegates UI rendering to OOPS-based modular Views, Components, and AppRouterHelper.
 *          Fail-safe startup initialization prevents blank page on initial load or slow network.
 * Dependencies: ApiService, ModalDialog, HeaderTelemetry, NavigationHelper, AppRouterHelper
 */

class App {
  constructor() {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('fmc_user') || 'null');
    } catch (e) {
      user = null;
    }

    // Default localhost auto-authentication fallback for seamless first launch
    if (!user) {
      user = {
        id: 'usr_default',
        email: 'FreeModelsClub@jdroidxy.com',
        displayName: 'FreeModelsClub Local Developer',
        role: 'admin'
      };
      try {
        localStorage.setItem('fmc_user', JSON.stringify(user));
      } catch (e) {}
    }
    this.currentUser = user;

    this.currentView = 'dashboard';
    this.selectedModelId = 'llama-3.3-70b-versatile';
    this.chatHistory = [];
    this.screenHints = {};
    this.historyStack = ['dashboard'];
    this.historyIndex = 0;
    this.applySavedTheme();

    const validViews = ['dashboard', 'playground', 'registration', 'config', 'providers', 'model-club', 'settings', 'reports', 'manual'];
    const parts = window.location.pathname.toLowerCase().replace(/^\/+/, '').split('/');
    let initialView = 'dashboard';
    for (const p of parts) {
      if (validViews.includes(p)) {
        initialView = p;
        break;
      }
    }
    this.currentView = initialView;
    this.historyStack = [initialView];

    window.addEventListener('popstate', (e) => {
      const pParts = window.location.pathname.toLowerCase().replace(/^\/+/, '').split('/');
      let popView = 'dashboard';
      for (const p of pParts) {
        if (validViews.includes(p)) {
          popView = p;
          break;
        }
      }
      const targetView = (e.state && e.state.viewName) || popView;
      this.navigate(targetView, true);
    });

    window.addEventListener('fmc_data_changed', () => {
      this.syncAllPages();
    });

    this.init();
  }

  applySavedTheme() {
    const savedTheme = localStorage.getItem('fmc_theme') || 'system-default';
    document.body.className = '';
    if (savedTheme === 'system-default' || savedTheme === 'system' || savedTheme === 'default') {
      document.body.classList.add('theme-system');
    } else {
      document.body.classList.add(savedTheme);
    }
  }

  async init() {
    // 1. Render App Shell Layout IMMEDIATELY so page is never blank
    try {
      this.renderAppLayout();
      this.updateThemeDropdown();
      this.renderView(this.currentView);
    } catch (err) {
      console.error('Error rendering initial app layout:', err);
    }

    // 2. Hydrate Header Telemetry & Screen Hints asynchronously
    try {
      HeaderTelemetry.loadAndRender(this.selectedModelId);
    } catch (e) {}

    try {
      const hintsRes = await ApiService.getScreenHints();
      if (hintsRes && hintsRes.hints) this.screenHints = hintsRes.hints;
    } catch (e) {}

    // 3. Fail-safe provider readiness check
    try {
      const status = await ApiService.checkProviderStatus();
      if (status && status.hasActiveProvider === false) {
        this.currentView = 'registration';
        this.renderView('registration');
        if (window.AppRouterHelper && typeof AppRouterHelper.showMissingMandatoryItemsDialog === 'function') {
          AppRouterHelper.showMissingMandatoryItemsDialog(() => this.navigate('registration'));
        }
      }
    } catch (err) {
      console.warn('Notice: Provider status check fallback in init():', err);
    }
  }

  renderAppLayout() {
    const appEl = document.getElementById('app');
    if (!appEl) return;
    const theme = localStorage.getItem('fmc_theme') || 'default';
    if (typeof NavigationHelper.renderLayoutShellHtml === 'function') {
      appEl.innerHTML = NavigationHelper.renderLayoutShellHtml(this.currentView, theme, this.currentUser);
    } else if (typeof NavigationHelper.renderShellHtml === 'function') {
      appEl.innerHTML = NavigationHelper.renderShellHtml(this.currentUser, this.currentView);
    }
    NavigationHelper.bindMenuEvents();
    AppRouterHelper.renderBreadcrumbs(this.currentView);
  }

  updateThemeDropdown() {
    const sel = document.getElementById('top-theme-selector');
    if (!sel) return;
    const cur = localStorage.getItem('fmc_theme') || 'system-default';
    sel.value = cur;
  }

  changeTopTheme(val) {
    document.body.className = '';
    if (val !== 'system-default' && val !== 'default') {
      document.body.classList.add(val);
    }
    localStorage.setItem('fmc_theme', val);
    ModalDialog.showNotification('Theme set to ' + val, 'success');
  }

  navigate(viewName, isPopState = false) {
    if (this.currentView === viewName && !isPopState) return;

    if (!isPopState) {
      if (this.historyIndex < this.historyStack.length - 1) {
        this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
      }
      this.historyStack.push(viewName);
      this.historyIndex = this.historyStack.length - 1;
    }

    this.currentView = viewName;
    AppRouterHelper.syncUrlHistory(viewName, isPopState);
    AppRouterHelper.renderBreadcrumbs(viewName);
    NavigationHelper.updateActiveNavLinks(viewName);
    this.renderView(viewName);

    if (typeof MonitoringAgent !== 'undefined' && MonitoringAgent.onPageOpen) {
      MonitoringAgent.onPageOpen(viewName);
    }
  }

  goBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const prevView = this.historyStack[this.historyIndex];
      this.navigate(prevView, true);
    } else {
      ModalDialog.showNotification('Already at initial page history.', 'info');
    }
  }

  goForward() {
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyIndex++;
      const nextView = this.historyStack[this.historyIndex];
      this.navigate(nextView, true);
    } else {
      ModalDialog.showNotification('Already at latest page history.', 'info');
    }
  }

  async renderView(viewName) {
    const container = document.getElementById('page-view-content') || document.getElementById('main-content');
    if (!container) return;

    try {
      const views = {
        dashboard: window.DashboardView,
        playground: window.PlaygroundView,
        registration: window.RegistrationView,
        config: window.ConfigView,
        providers: window.ProvidersView,
        'model-club': window.ModelClubView,
        settings: window.SettingsView,
        reports: window.ReportsView,
        manual: window.ManualView
      };
      const targetView = views[viewName];
      if (!targetView) throw new Error(`View '${viewName}' is not loaded or defined.`);
      await targetView.render(container);
    } catch (err) {
      console.error(`Error rendering view '${viewName}':`, err);
      container.innerHTML = `
        <div class="glass-panel" style="padding: 20px; border-color: var(--accent-rose);">
          <h3 style="color: var(--accent-rose); margin-bottom: 10px;"><i class="fa-solid fa-triangle-exclamation"></i> Error Loading View '${viewName}'</h3>
          <p style="color: var(--text-main); font-size: 0.9rem;">${err.message || 'An unexpected rendering error occurred.'}</p>
          <button class="btn btn-secondary btn-sm" style="margin-top: 15px;" onclick="app.navigate('dashboard')"><i class="fa-solid fa-house"></i> Return to Dashboard</button>
        </div>
      `;
    }
  }

  showActivePageHint() {
    const viewName = this.historyStack[this.historyIndex] || 'dashboard';
    NavigationHelper.showScreenHint(viewName);
  }

  closeHintDrawer() {
    NavigationHelper.showScreenHint(this.currentView);
  }

  async openCodeDrawer(providerName = 'Registered Provider', modelId = 'llama-3.3-70b-versatile') {
    const drawer = document.getElementById('code-drawer');
    const titleEl = document.getElementById('code-drawer-title');
    const container = document.getElementById('code-drawer-content');
    if (!drawer || !container) return;
    if (titleEl) {
      titleEl.innerHTML = `<i class="fa-solid fa-code"></i> Code Snippets: <span style="color: var(--accent-cyan);">${providerName}</span>`;
    }

    const res = await ApiService.request(`/api/integration/snippets?model=${encodeURIComponent(modelId)}`);
    this.currentCodeSnippets = res.snippets || {};
    this.currentCodeModel = modelId;
    this.renderCodeDrawerBody('curl');
    drawer.classList.add('open');
  }

  renderCodeDrawerBody(lang = 'curl') {
    const container = document.getElementById('code-drawer-content');
    if (!container) return;
    const snippet = (this.currentCodeSnippets && this.currentCodeSnippets[lang]) || {};
    const codeText = snippet.chatCompletions || snippet.jsonSpec || '';
    const escapeFn = window.ConfigView && window.ConfigView.escapeHtml ? window.ConfigView.escapeHtml : (str => str);
    container.innerHTML = `
      <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
        <span><strong>Target Model:</strong> <code style="color: var(--accent-cyan);">${this.currentCodeModel || 'default'}</code></span>
        <span style="font-size: 0.72rem; color: var(--accent-emerald);"><i class="fa-solid fa-circle" style="font-size: 0.5rem;"></i> Endpoint Live</span>
      </div>
      <div class="tab-row" style="margin-bottom: 8px;">
        <button class="tab-btn ${lang === 'curl' ? 'active' : ''}" onclick="app.switchCodeDrawerTab('curl')">cURL</button>
        <button class="tab-btn ${lang === 'python' ? 'active' : ''}" onclick="app.switchCodeDrawerTab('python')">Python</button>
        <button class="tab-btn ${lang === 'nodejs' ? 'active' : ''}" onclick="app.switchCodeDrawerTab('nodejs')">Node.js</button>
        <button class="tab-btn ${lang === 'go' ? 'active' : ''}" onclick="app.switchCodeDrawerTab('go')">Go</button>
        <button class="tab-btn ${lang === 'php' ? 'active' : ''}" onclick="app.switchCodeDrawerTab('php')">PHP</button>
        <button class="tab-btn ${lang === 'vscode' ? 'active' : ''}" onclick="app.switchCodeDrawerTab('vscode')">VS Code</button>
      </div>
      <div style="flex: 1; margin: 0; font-size: 0.76rem; overflow-y: auto; max-height: calc(100vh - 210px);">
        ${Array.isArray(codeText) 
          ? codeText.map(item => `
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-cyan); margin: 12px 0 6px 0;"><i class="fa-solid fa-cube"></i> ${item.label}</div>
              <div class="code-box" style="position: relative;">
                <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); ModalDialog.showNotification('Code snippet copied to clipboard!', 'success');">Copy Code</button>
                <pre><code style="font-family: var(--font-code); color: var(--accent-emerald);">${escapeFn(item.code)}</code></pre>
              </div>
            `).join('')
          : `
            <div class="code-box" style="position: relative;">
              <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); ModalDialog.showNotification('Code snippet copied to clipboard!', 'success');">Copy Code</button>
              <pre><code style="font-family: var(--font-code); color: var(--accent-emerald);">${escapeFn(codeText)}</code></pre>
            </div>
          `
        }
      </div>
    `;
  }

  switchCodeDrawerTab(lang) {
    this.renderCodeDrawerBody(lang);
  }

  closeCodeDrawer() {
    const drawer = document.getElementById('code-drawer');
    if (drawer) drawer.classList.remove('open');
  }

  notifyDataChanged() {
    window.dispatchEvent(new CustomEvent('fmc_data_changed'));
  }

  syncAllPages() {
    if (window.HeaderTelemetry && typeof window.HeaderTelemetry.loadAndRender === 'function') {
      window.HeaderTelemetry.loadAndRender(this.selectedModelId);
    }
    if (this.currentView) {
      this.renderView(this.currentView);
    }
  }

  logout() {
    ModalDialog.showModal({
      title: 'Confirm Sign Out',
      icon: 'fa-right-from-bracket',
      body: 'Are you sure you want to end your current session?',
      cancelText: 'Cancel',
      confirmText: 'Sign Out',
      onConfirm: () => {
        localStorage.removeItem('fmc_user');
        this.currentUser = null;
        LoginView.render();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

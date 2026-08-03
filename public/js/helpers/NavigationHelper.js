/**
 * NavigationHelper.js
 * Purpose: Provides layout structure, navigation drawer rendering, and screen hint modals
 */

class NavigationHelper {
  static getNavItems() {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
      { id: 'playground', label: 'Playground Chat', icon: 'fa-comments' },
      { id: 'providers', label: 'Providers', icon: 'fa-network-wired' },
      { id: 'registration', label: 'Provider Register', icon: 'fa-square-plus' },
      { id: 'config', label: 'Integration Code', icon: 'fa-code' },
      { id: 'model-club', label: 'Model Club & Combos', icon: 'fa-cubes-stacked' },
      { id: 'settings', label: 'Settings', icon: 'fa-sliders' },
      { id: 'reports', label: 'Reports & Logs', icon: 'fa-file-waveform' },
      { id: 'manual', label: 'User Manual & Help', icon: 'fa-book-open' }
    ];
  }

  static renderLayoutShellHtml(activeView, currentTheme, headerStats) {
    const navItems = this.getNavItems();
    return `
      <aside class="sidebar" id="main-sidebar">
        <div class="sidebar-header">
          <div class="logo-badge"><i class="fa-solid fa-brain"></i></div>
          <div>
            <div class="logo-title">FreeModelsClub</div>
            <div class="logo-subtitle">Localhost AI Service</div>
          </div>
        </div>
        <ul class="nav-menu">
          ${navItems.map(item => `
            <li class="nav-item ${item.id === 'registration' || item.id === 'config' ? 'sub-item' : ''}">
              <a class="nav-link ${item.id === 'registration' || item.id === 'config' ? 'sub-link' : ''} ${activeView === item.id ? 'active' : ''}" onclick="app.navigate('${item.id}')">
                <i class="fa-solid ${item.icon}"></i> ${item.label}
              </a>
            </li>
          `).join('')}
        </ul>
        <div class="sidebar-footer">
          <div class="status-pill"><span class="status-dot"></span><span>Port 12247 Active</span></div>
        </div>
      </aside>
      <div class="main-wrapper" id="main-wrapper-content">
        <header class="top-header-bar">
          <div class="header-left">
            <button class="hamburger-btn" onclick="app.toggleSidebar()"><i class="fa-solid fa-bars"></i></button>
            <div class="nav-controls-group">
              <button class="nav-hist-btn" id="nav-btn-back" title="Back" onclick="app.goBack()"><i class="fa-solid fa-arrow-left"></i></button>
              <button class="nav-hist-btn" id="nav-btn-forward" title="Forward" onclick="app.goForward()"><i class="fa-solid fa-arrow-right"></i></button>
              <button class="nav-hist-btn" title="Home Dashboard" onclick="app.navigate('dashboard')"><i class="fa-solid fa-house"></i></button>
            </div>
            <div class="header-title-section">
              <div class="breadcrumb-trail" id="nav-breadcrumb-trail"></div>
              <h2 id="page-title-heading" style="font-size: 0.95rem; margin-top: 2px;">${activeView.charAt(0).toUpperCase() + activeView.slice(1).replace('-', ' ')}</h2>
            </div>
            <div id="masked-url-endpoint-pill" class="badge badge-cyan" style="font-size: 0.75rem; padding: 4px 10px; display: flex; align-items: center; gap: 6px; background: rgba(6, 182, 212, 0.12); border: 1px solid var(--accent-cyan); border-radius: 6px; margin-left: 12px;" title="System Endpoint URL Mask">
              <i class="fa-solid fa-globe" style="color: var(--accent-cyan);"></i>
              <span id="masked-url-text" style="font-weight: 700; color: var(--text-main); font-family: monospace;">http://localhost:12247/${activeView}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <button class="hamburger-btn" title="Screen Hints" onclick="NavigationHelper.showScreenHint('${activeView}')" style="color: var(--accent-amber);"><i class="fa-solid fa-lightbulb"></i></button>
            <div class="user-profile-menu">
              <button class="hamburger-btn" title="Change Theme" style="color: var(--accent-cyan);"><i class="fa-solid fa-palette"></i></button>
              <div class="profile-dropdown" id="theme-dropdown-menu" style="width: 250px;"></div>
            </div>
            <div class="user-profile-menu">
              <div class="profile-avatar"><i class="fa-solid fa-user"></i></div>
              <div class="profile-dropdown">
                <div style="padding: 6px 12px; border-bottom: 1px solid var(--border-color); font-size: 0.8rem;">
                  <strong style="color: var(--text-main);">${headerStats.userEmail || 'Admin User'}</strong><br>
                  <span style="color: var(--accent-cyan); font-weight: 600;">Admin User</span>
                </div>
                <a class="dropdown-item" onclick="app.navigate('settings')"><i class="fa-solid fa-sliders"></i> Settings & Themes</a>
                <a class="dropdown-item" onclick="app.navigate('manual')"><i class="fa-solid fa-book-open"></i> HIL User Manual</a>
                <a class="dropdown-item" onclick="app.logout()" style="color: var(--accent-rose);"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</a>
              </div>
            </div>
          </div>
        </header>
        <div style="padding: 8px 16px; background: var(--bg-sidebar); border-bottom: 1px solid var(--border-color); display: flex; align-items: center; overflow-x: auto;">
          <div class="telemetry-row" id="header-telemetry-row" style="gap: 8px; flex-wrap: nowrap;"></div>
        </div>
        <main class="page-container">
          <div id="page-view-content"></div>
        </main>
        <div id="hint-drawer" class="hint-drawer">
          <div class="hint-drawer-header">
            <h4><i class="fa-solid fa-lightbulb"></i> Page Hint</h4>
            <button onclick="app.closeHintDrawer()"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="hint-drawer-body" id="hint-drawer-content"></div>
        </div>
        <div id="code-drawer" class="code-drawer">
          <div class="code-drawer-header">
            <h4 id="code-drawer-title"><i class="fa-solid fa-code"></i> Integration Code Snippets</h4>
            <button onclick="app.closeCodeDrawer()"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="code-drawer-body" id="code-drawer-content"></div>
        </div>
      </div>
    `;
  }

  static showScreenHint(viewName) {
    const hints = {
      dashboard: {
        title: 'Dashboard Metrics & Telemetry',
        icon: 'fa-chart-line',
        body: 'Displays real-time system performance, total tokens served, active providers, and model health counters. Click any provider card to view deep model specifications.'
      },
      playground: {
        title: 'Playground Interactive Chat',
        icon: 'fa-comments',
        body: 'Test model responses in real-time. Select any active model, Models Combo, or Personal AI Assistant (Self-Healing). Supports SSE streaming, markdown formatting, and code drawer.'
      },
      registration: {
        title: 'Provider Register & Agent Search',
        icon: 'fa-key',
        body: 'Register new AI model providers. Click **Provider Agent** to automatically search base URLs, protocol connectors, and free tier model specs. Use the browser button to retrieve API keys.'
      },
      providers: {
        title: 'Provider Management',
        icon: 'fa-server',
        body: 'Manage registered providers, toggle active statuses, and inspect API keys with automatic unmasked outbound key resolution protection.'
      },
      'model-club': {
        title: 'Model Club & Models Combo',
        icon: 'fa-cubes-stacked',
        body: 'Explore the 44 free models taxonomy organized by Family and Core Skills. Create virtual Model Combos with Fallback or Round-Robin load balancing.'
      },
      config: {
        title: 'Integration Scripts & Snippets',
        icon: 'fa-code',
        body: 'Copy ready-to-use integration code snippets in cURL, Python, Node.js, PHP, and Go for `/v1/chat/completions` and `/v1/models`.'
      },
      reports: {
        title: 'Audit & Diagnostic Logs',
        icon: 'fa-receipt',
        body: 'Inspect diagnostic API logs and system audit logs. Filter by log level (INFO, WARN, ERROR), search text, or export to CSV/JSON.'
      },
      settings: {
        title: 'Settings & AI Agents',
        icon: 'fa-sliders',
        body: 'Configure system endpoints, customize UI/UX screens, inspect specialized AI Agents in ROCAS format, and cycle between 7 metal themes.'
      },
      manual: {
        title: 'Human-In-Loop User Manual',
        icon: 'fa-book-open',
        body: 'Step-by-step operating manual, system architecture guidelines, and FAQs for Human-In-Loop developers.'
      }
    };

    const hint = hints[viewName] || {
      title: 'Screen Information',
      icon: 'fa-circle-info',
      body: 'Standard OOPS MVC closed-loop workspace view.'
    };

    ModalDialog.showModal({
      title: `${hint.title} - Screen Hint`,
      icon: hint.icon,
      body: `
        <div style="font-size: 0.85rem; line-height: 1.5; color: var(--text-main);">
          <p style="margin-bottom: 12px;">${hint.body}</p>
          <div style="background: rgba(6, 182, 212, 0.08); border: 1px solid var(--accent-cyan); padding: 8px; border-radius: 6px; font-size: 0.78rem;">
            <i class="fa-solid fa-shield-halved" style="color: var(--accent-cyan);"></i> <strong>Closed-Loop Standard:</strong> Every action on this screen is validated against <code>program_mapping.json</code>.
          </div>
        </div>
      `,
      confirmText: 'Got It',
      onConfirm: () => {}
    });
  }

  static bindMenuEvents() {
    const themeBtn = document.querySelector('.user-profile-menu button[title="Change Theme"]');
    const themeDropdown = document.getElementById('theme-dropdown-menu');
    if (themeBtn && themeDropdown) {
      const themes = [
        { id: 'system-default', label: 'System Default (Auto Dark/Light)' },
        { id: 'theme-platinum', label: 'Platinum (Luminous Light Metal)' },
        { id: 'theme-gold', label: 'Gold (Rich Metallic Gold)' },
        { id: 'theme-silver', label: 'Silver (Polished Silver Light)' },
        { id: 'theme-titanium', label: 'Titanium (Deep Metallic Titanium)' },
        { id: 'theme-bronze', label: 'Bronze (Deep Metallic Bronze)' },
        { id: 'theme-copper', label: 'Copper (Warm Metallic Copper)' },
        { id: 'theme-obsidian', label: 'Obsidian (Pure Midnight Dark)' }
      ];
      themeDropdown.innerHTML = themes.map(t => `
        <a class="dropdown-item" onclick="app.changeTopTheme('${t.id}')">
          <span class="theme-color-preview ${t.id}"></span> ${t.label}
        </a>
      `).join('');
      
      themeBtn.onclick = (e) => {
        e.stopPropagation();
        themeDropdown.classList.toggle('active');
      };
    }
  }

  static updateActiveNavLinks(viewName) {
    document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
      const onclickAttr = link.getAttribute('onclick') || '';
      if (onclickAttr.includes(`'${viewName}'`) || onclickAttr.includes(`"${viewName}"`)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  static renderShellHtml(currentUser, currentView) {
    return this.renderLayoutShellHtml(currentView, 'default', currentUser);
  }
}

window.NavigationHelper = NavigationHelper;

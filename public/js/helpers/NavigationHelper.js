/**
 * NavigationHelper.js
 * Purpose: Provides layout structure, navigation drawer rendering, and screen hint modals
 */

class NavigationHelper {
  static getRouteRegistry() {
    return {
      'dashboard': { label: 'Dashboard', icon: 'fa-chart-pie', viewClass: 'DashboardView' },
      'playground': { label: 'Playground Chat', icon: 'fa-comments', viewClass: 'PlaygroundView' },
      'providers': { label: 'Providers', icon: 'fa-network-wired', viewClass: 'ProvidersView' },
      'registration': { label: 'Provider Register', icon: 'fa-square-plus', viewClass: 'RegistrationView' },
      'config': { label: 'Integration Code', icon: 'fa-code', viewClass: 'ConfigView' },
      'model-club': { label: 'Model Club & Combos', icon: 'fa-cubes-stacked', viewClass: 'ModelClubView' },
      'settings': { label: 'Settings', icon: 'fa-sliders', viewClass: 'SettingsView' },
      'reports': { label: 'Reports & Logs', icon: 'fa-file-waveform', viewClass: 'ReportsView' },
      'manual': { label: 'User Manual & Help', icon: 'fa-book-open', viewClass: 'ManualView' },
      'about': { label: 'About jDroid-X', icon: 'fa-circle-info', viewClass: 'AboutView' },
      'licenses': { label: 'Licenses', icon: 'fa-file-contract', viewClass: 'LicensesView', hidden: true },
      'legal': { label: 'Legal & Privacy', icon: 'fa-scale-balanced', viewClass: 'LegalView', hidden: true },
      'user-profile': { label: 'User Profile', icon: 'fa-user', viewClass: 'UserProfileView', hidden: true }
    };
  }

  static getNavItems() {
    const registry = this.getRouteRegistry();
    const items = [];
    for (const [id, route] of Object.entries(registry)) {
      if (!route.hidden) {
        items.push({ id, label: route.label, icon: route.icon });
      }
    }
    return items;
  }

  static renderLayoutShellHtml(activeView, currentTheme, headerStats) {
    const navItems = this.getNavItems();
    const themeIconColor = 'var(--primary-light, var(--accent-cyan))';
    const themeIconSoft = 'var(--border-glow, var(--primary-light, var(--accent-cyan)))';
    return `
      <aside class="sidebar" id="main-sidebar">
        <div class="sidebar-header">
          <div class="logo-badge" style="display: flex; align-items: center; justify-content: center; background: transparent;"><img src="/jdroidxlogo.png" alt="jDroidX" style="width: 28px; height: 28px; object-fit: contain;" onerror="this.outerHTML='<i class=\'fa-solid fa-robot\'></i>'"></div>
          <div class="logo-text-container">
            <div class="logo-title">FreeModelsClub</div>
            <div class="logo-subtitle">Localhost AI Service</div>
          </div>
          <button class="collapse-sidebar-btn" onclick="app.toggleSidebar()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; margin-left:auto;" title="Toggle Sidebar">
            <i class="fa-solid fa-chevron-left" id="sidebar-toggle-icon"></i>
          </button>
        </div>
        <ul class="nav-menu">
          ${navItems.map(item => `
            <li class="nav-item ${item.id === 'registration' || item.id === 'config' ? 'sub-item' : ''}">
              <a class="nav-link ${item.id === 'registration' || item.id === 'config' ? 'sub-link' : ''} ${activeView === item.id ? 'active' : ''}" onclick="app.navigate('${item.id}')" title="${item.label}">
                <i class="fa-solid ${item.icon}" style="color: ${themeIconColor};"></i> <span class="nav-link-text">${item.label}</span>
              </a>
            </li>
          `).join('')}
        </ul>
        <div class="sidebar-footer" style="display: flex; flex-direction: column; gap: 4px; padding: 10px;">
          <div class="status-pill" style="display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: var(--accent-emerald);">
            <span class="status-dot" style="background: var(--accent-emerald);"></span>
            <span>Port 12247 Active</span>
          </div>
          <div id="local-server-status-pill" class="status-pill" style="display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: var(--accent-amber);" title="Ollama / Local Server status (Port 11434)">
            <span id="local-server-status-dot" class="status-dot" style="background: var(--accent-amber);"></span>
            <span id="local-server-status-text">Local Server Checking...</span>
          </div>
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
            <i class="fa-solid fa-globe" style="color: ${themeIconSoft};"></i>
              <span id="masked-url-text" style="font-weight: 700; color: var(--text-main); font-family: monospace;">${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:12247'}/${activeView}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 3px; padding: 3px;">
            <!-- Layout Toggles -->
            <div style="display: flex; gap: 3px; align-items: center; background: rgba(0,0,0,0.2); padding: 3px; margin: 3px; border-radius: 4px; border: 1px solid var(--border-color);">
              <button class="hamburger-btn layout-toggle-btn" title="Toggle Left Sidebar (Hide/Unhide)" onclick="if(window.app && window.app.currentView === 'playground' && window.PlaygroundView) { PlaygroundView.toggleSidebar('left'); } else if(window.app) { app.toggleSidebar(); }" style="color: ${themeIconColor}; opacity: 0.8; padding: 3px; margin: 0; display: flex; align-items: center; justify-content: center;">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="2.5" width="13" height="11" rx="1"></rect><line x1="5.5" y1="2.5" x2="5.5" y2="13.5"></line></svg>
              </button>
              <button class="hamburger-btn layout-toggle-btn" title="Toggle IDE / Chat Split View" onclick="if(window.PlaygroundView && window.app && window.app.currentView === 'playground') { PlaygroundView.switchLeftTab(PlaygroundView.activeLeftTab === 'chat' ? 'ide' : 'chat'); } else if(window.app) { app.navigate('playground'); }" style="color: ${themeIconColor}; opacity: 0.8; padding: 3px; margin: 0; display: flex; align-items: center; justify-content: center;">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="2.5" width="13" height="11" rx="1"></rect><line x1="8" y1="2.5" x2="8" y2="13.5"></line></svg>
              </button>
              <button class="hamburger-btn layout-toggle-btn" title="Toggle Integration Code Drawer" onclick="if(window.app) app.toggleCodeDrawer();" style="color: ${themeIconColor}; opacity: 0.8; padding: 3px; margin: 0; display: flex; align-items: center; justify-content: center;">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="2.5" width="13" height="11" rx="1"></rect><line x1="1.5" y1="9.5" x2="14.5" y2="9.5"></line></svg>
              </button>
              <button class="hamburger-btn layout-toggle-btn" title="Toggle Right Parameters Drawer" onclick="if(window.PlaygroundView && window.app && window.app.currentView === 'playground') { PlaygroundView.toggleSidebar('right'); } else if(window.app) { app.navigate('playground'); setTimeout(() => { if(window.PlaygroundView) PlaygroundView.toggleSidebar('right'); }, 100); }" style="color: ${themeIconColor}; opacity: 0.8; padding: 3px; margin: 0; display: flex; align-items: center; justify-content: center;">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="2.5" width="13" height="11" rx="1"></rect><line x1="10.5" y1="2.5" x2="10.5" y2="13.5"></line></svg>
              </button>
            </div>
            <button class="hamburger-btn" title="Screen Hints" onclick="NavigationHelper.showScreenHint('${activeView}')" style="color: ${themeIconColor}; padding: 3px; margin: 3px;"><i class="fa-solid fa-lightbulb"></i></button>
            <div class="user-profile-menu" id="theme-menu-container" style="padding: 3px; margin: 0;">
              <button class="hamburger-btn" id="theme-toggle-btn" title="Change Theme" style="color: ${themeIconColor}; cursor: pointer; padding: 3px; margin: 0;"><i class="fa-solid fa-palette"></i></button>
              <div class="profile-dropdown" id="theme-dropdown-menu" style="width: 260px;"></div>
            </div>
            <div class="user-profile-menu" id="user-menu-container" style="padding: 3px; margin: 0;">
              <div class="profile-avatar" id="user-avatar-btn" style="cursor: pointer; width: 28px; height: 28px; margin: 3px;" title="User Profile & Settings"><i class="fa-solid fa-user"></i></div>
              <div class="profile-dropdown" id="user-profile-dropdown">
                <div style="padding: 8px 12px; border-bottom: 1px solid var(--border-color); font-size: 0.8rem;">
                  <strong style="color: var(--text-main); font-size: 0.84rem;">${headerStats.userEmail || 'Admin User'}</strong><br>
                  <span style="color: ${themeIconColor}; font-weight: 600; font-size: 0.74rem;"><i class="fa-solid fa-shield-halved"></i> Admin Privileges</span>
                </div>
                <a class="dropdown-item" onclick="app.navigate('user-profile')"><i class="fa-solid fa-user-circle"></i> My Profile</a>
                <a class="dropdown-item" onclick="app.navigate('settings')"><i class="fa-solid fa-sliders"></i> Settings & Themes</a>
                <a class="dropdown-item" onclick="app.navigate('manual')"><i class="fa-solid fa-book-open"></i> HIL User Manual</a>
                <a class="dropdown-item" onclick="app.logout()" style="color: var(--accent-rose);"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</a>
              </div>
            </div>
          </div>
        </header>
        <div class="header-telemetry-container" style="padding: 3px; margin: 0; background: var(--bg-sidebar); border-bottom: 1px solid var(--border-color); display: flex; align-items: center; overflow-x: auto; min-height: auto; height: auto;">
          <div class="telemetry-row" id="header-telemetry-row" style="gap: 3px; padding: 0; margin: 0; flex-wrap: nowrap; width: 100%;"></div>
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
      },
      about: {
        title: 'About jDroid-X',
        icon: 'fa-circle-info',
        body: 'Information about the Free Model Club application, its version, and the developer (jDroid-X).'
      },
      licenses: {
        title: 'Open Source Licenses',
        icon: 'fa-id-card',
        body: 'Legal attributions and open-source licenses for the third-party software that powers Free Model Club.'
      },
      legal: {
        title: 'Legal & Privacy',
        icon: 'fa-scale-balanced',
        body: 'Important disclaimers, privacy policy details, and terms of use regarding third-party AI models.'
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
    const themeBtn = document.getElementById('theme-toggle-btn') || document.querySelector('.user-profile-menu button[title="Change Theme"]');
    const themeDropdown = document.getElementById('theme-dropdown-menu');
    const themeWrapper = document.getElementById('theme-menu-container') || themeBtn?.parentElement;

    const userBtn = document.getElementById('user-avatar-btn') || document.querySelector('.profile-avatar');
    const userDropdown = document.getElementById('user-profile-dropdown') || userBtn?.nextElementSibling;
    const userWrapper = document.getElementById('user-menu-container') || userBtn?.parentElement;

    let themeCloseTimer = null;
    let userCloseTimer = null;
    const LEAVE_GRACE_MS = 380; // 380ms grace delay gives user comfortable time to navigate cursor

    if (themeBtn && themeDropdown) {
      const themes = typeof SettingsViewHelper !== 'undefined' 
        ? SettingsViewHelper.getThemesList() 
        : [
            { id: 'theme-platinum', name: 'Platinum Light Metal', accent: '#dde7f1', category: 'Metal' },
            { id: 'theme-gold', name: 'Gold Dark Metal', accent: '#fbbf24', category: 'Metal' },
            { id: 'theme-silver', name: 'Silver Light Metal', accent: '#475569', category: 'Metal' },
            { id: 'theme-titanium', name: 'Titanium Dark Metal', accent: '#38bdf8', category: 'Metal' },
            { id: 'theme-bronze', name: 'Bronze Dark Metal', accent: '#fb923c', category: 'Metal' },
            { id: 'theme-copper', name: 'Copper Dark Metal', accent: '#fb7185', category: 'Metal' },
            { id: 'theme-obsidian', name: 'Obsidian Dark Metal', accent: '#818cf8', category: 'Metal' }
          ];
      
      themeDropdown.style.maxHeight = '360px';
      themeDropdown.style.overflowY = 'auto';
      themeDropdown.innerHTML = `
        <div style="padding: 6px 10px; font-size: 0.68rem; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase; border-bottom: 1px solid var(--border-color);">
          <i class="fa-solid fa-palette"></i> 22 Metallic & Cosmic Palettes
        </div>
        ${themes.map(t => `
          <a class="dropdown-item" onclick="app.changeTopTheme('${t.id}')" style="display: flex; align-items: center; justify-content: space-between; padding: 5px 10px; font-size: 0.72rem; cursor: pointer;">
            <span style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: ${t.accent}; display: inline-block; box-shadow: 0 0 4px ${t.accent}60;"></span>
              ${t.name}
            </span>
            <span style="font-size: 0.58rem; color: var(--text-dim); background: rgba(0,0,0,0.2); padding: 1px 4px; border-radius: 3px;">${t.category || 'Theme'}</span>
          </a>
        `).join('')}
      `;

      // Click to toggle persistent open
      themeBtn.onclick = (e) => {
        e.stopPropagation();
        if (userDropdown) userDropdown.classList.remove('active');
        themeDropdown.classList.toggle('active');
      };

      // Hover with debounce grace period
      if (themeWrapper) {
        themeWrapper.onmouseenter = () => {
          if (themeCloseTimer) { clearTimeout(themeCloseTimer); themeCloseTimer = null; }
          themeDropdown.classList.add('active');
        };
        themeWrapper.onmouseleave = () => {
          themeCloseTimer = setTimeout(() => {
            themeDropdown.classList.remove('active');
          }, LEAVE_GRACE_MS);
        };
      }
    }

    // Profile menu handlers
    if (userBtn && userDropdown) {
      userBtn.onclick = (e) => {
        e.stopPropagation();
        if (themeDropdown) themeDropdown.classList.remove('active');
        userDropdown.classList.toggle('active');
      };

      if (userWrapper) {
        userWrapper.onmouseenter = () => {
          if (userCloseTimer) { clearTimeout(userCloseTimer); userCloseTimer = null; }
          userDropdown.classList.add('active');
        };
        userWrapper.onmouseleave = () => {
          userCloseTimer = setTimeout(() => {
            userDropdown.classList.remove('active');
          }, LEAVE_GRACE_MS);
        };
      }
    }

    // Close on outside click or Escape key
    if (!NavigationHelper._themeClickHandlerBound) {
      NavigationHelper._themeClickHandlerBound = true;
      document.addEventListener('click', (e) => {
        const td = document.getElementById('theme-dropdown-menu');
        const ud = document.getElementById('user-profile-dropdown');
        if (td && td.classList.contains('active') && !td.contains(e.target) && !themeBtn?.contains(e.target)) {
          td.classList.remove('active');
        }
        if (ud && ud.classList.contains('active') && !ud.contains(e.target) && !userBtn?.contains(e.target)) {
          ud.classList.remove('active');
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const td = document.getElementById('theme-dropdown-menu');
          const ud = document.getElementById('user-profile-dropdown');
          if (td) td.classList.remove('active');
          if (ud) ud.classList.remove('active');
        }
      });
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

/**
 * AppRouterHelper.js
 * Purpose: Router & History Navigation helper for SPA router (app.js).
 *          Handles URL path synchronization, popstate history events, breadcrumb rendering,
 *          and mandatory setup dialogs.
 * Dependencies: ModalDialog, ApiService
 */

class AppRouterHelper {
  static syncUrlHistory(viewName, isPopState = false) {
    const validViews = ['dashboard', 'playground', 'registration', 'config', 'providers', 'model-club', 'settings', 'reports', 'manual', 'about', 'licenses', 'legal', 'user-profile'];
    const cleanView = (viewName || '').toLowerCase();
    if (!validViews.includes(cleanView)) return;

    const urlPath = `/${cleanView}`;
    const titles = {
      dashboard: 'Dashboard — FreeModelsClub',
      playground: 'Playground Chat — FreeModelsClub',
      registration: 'Provider Registration — FreeModelsClub',
      config: 'Integration Config — FreeModelsClub',
      providers: 'Providers Manager — FreeModelsClub',
      'model-club': 'Model Club Taxonomy — FreeModelsClub',
      settings: 'System Settings — FreeModelsClub',
      reports: 'Diagnostics & Reports — FreeModelsClub',
      manual: 'User Manual & Guide — FreeModelsClub',
      about: 'About jDroid-X — FreeModelsClub',
      licenses: 'Open Source Licenses — FreeModelsClub',
      legal: 'Legal & Privacy — FreeModelsClub',
      'user-profile': 'User Profile — FreeModelsClub'
    };

    document.title = titles[cleanView] || 'FreeModelsClub Smart Chatbot';

    if (!isPopState && window.location.pathname.toLowerCase() !== urlPath) {
      history.pushState({ viewName: cleanView }, '', urlPath);
    }
  }

  static renderBreadcrumbs(currentView) {
    const cleanView = (currentView || 'dashboard').toLowerCase();
    const titles = {
      dashboard: 'Dashboard',
      playground: 'Playground Chat',
      registration: 'Provider Registration & Discovery',
      config: 'Integration Code & Config',
      providers: 'Providers & Service Connections',
      'model-club': 'Model Club & Combo Studio',
      settings: 'System Settings & Themes',
      reports: 'Diagnostics & Reports',
      manual: 'User Manual & Help Guide',
      about: 'About jDroid-X',
      licenses: 'Open Source Licenses',
      legal: 'Legal & Privacy',
      'user-profile': 'User Profile'
    };

    const subCategories = {
      dashboard: 'Operations & Telemetry',
      playground: 'Interactive Chat & IDE',
      registration: 'Provider Onboarding',
      config: 'Integration Scripts & Snippets',
      providers: 'Service Connections & Keys',
      'model-club': 'Taxonomy & Combo Studio',
      settings: 'System Configuration & Themes',
      reports: 'Diagnostics & Root Cause Logs',
      manual: 'User Manual & Guides',
      about: 'App Info & Architecture',
      licenses: 'Open Source Attributions',
      legal: 'Terms & Privacy',
      'user-profile': 'User Account & Security'
    };

    // 1. Sync Breadcrumbs (Non-redundant hierarchical path)
    const el = document.getElementById('nav-breadcrumb-trail') || document.getElementById('app-breadcrumbs');
    if (el) {
      el.innerHTML = `<span style="color: var(--text-muted); cursor: pointer;" onclick="app.navigate('dashboard')">Home</span> <span style="color: var(--border-color); margin: 0 4px;">/</span> <span style="color: var(--accent-cyan); font-weight: 600;">${subCategories[cleanView] || cleanView}</span>`;
    }

    // 2. Sync Top Page Title Heading
    const titleEl = document.getElementById('page-title-heading');
    if (titleEl) {
      titleEl.textContent = titles[cleanView] || cleanView.charAt(0).toUpperCase() + cleanView.slice(1).replace('-', ' ');
    }

    // 3. Sync Masked URL Endpoint Pill
    const urlEl = document.getElementById('masked-url-text');
    if (urlEl) {
      urlEl.textContent = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:12247'}/${cleanView}`;
    }

    // 4. Sync History Navigation Button States
    const backBtn = document.getElementById('nav-btn-back');
    const fwdBtn = document.getElementById('nav-btn-forward');
    const appObj = (typeof window !== 'undefined' && window.app) ? window.app : null;
    const historyStack = (appObj && Array.isArray(appObj.historyStack)) ? appObj.historyStack : [];
    const historyIndex = (appObj && typeof appObj.historyIndex === 'number') ? appObj.historyIndex : 0;

    if (backBtn) {
      backBtn.style.opacity = historyIndex > 0 ? '1' : '0.4';
      backBtn.style.cursor = historyIndex > 0 ? 'pointer' : 'default';
    }
    if (fwdBtn) {
      fwdBtn.style.opacity = (historyStack.length > 0 && historyIndex < historyStack.length - 1) ? '1' : '0.4';
      fwdBtn.style.cursor = (historyStack.length > 0 && historyIndex < historyStack.length - 1) ? 'pointer' : 'default';
    }
  }

  static showMissingMandatoryItemsDialog(onConfirm) {
    ModalDialog.showModal({
      title: 'Mandatory Setup Required',
      icon: 'fa-triangle-exclamation',
      body: `
        <div style="line-height: 1.8;">
          <p style="color: var(--accent-amber); font-weight: 600; margin-bottom: 10px;">
            ⚠️ No Active Free Provider Configured!
          </p>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 12px;">
            To run localhost service on port 12247, complete mandatory setup:
          </p>
          <ol style="margin-left: 20px; font-size: 0.85rem; color: var(--text-main);">
            <li>Select Provider API Protocol (OpenAI Compatible, Groq, OpenRouter, Gemini)</li>
            <li>Enter Base URL & Provider API Key</li>
            <li>Click <strong>'Search Free Models'</strong></li>
            <li>Register Provider & Staged Models</li>
          </ol>
        </div>
      `,
      confirmText: 'Configure Provider Now',
      onConfirm: onConfirm || (() => {})
    });
  }
}

window.AppRouterHelper = AppRouterHelper;

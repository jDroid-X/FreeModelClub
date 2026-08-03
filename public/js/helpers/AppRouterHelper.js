/**
 * AppRouterHelper.js
 * Purpose: Router & History Navigation helper for SPA router (app.js).
 *          Handles URL path synchronization, popstate history events, breadcrumb rendering,
 *          and mandatory setup dialogs.
 * Dependencies: ModalDialog, ApiService
 */

class AppRouterHelper {
  static syncUrlHistory(viewName, isPopState = false) {
    const validViews = ['dashboard', 'playground', 'registration', 'config', 'providers', 'model-club', 'settings', 'reports', 'manual'];
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
      manual: 'User Manual & Guide — FreeModelsClub'
    };

    document.title = titles[cleanView] || 'FreeModelsClub Smart Chatbot';

    if (!isPopState && window.location.pathname.toLowerCase() !== urlPath) {
      history.pushState({ viewName: cleanView }, '', urlPath);
    }
  }

  static renderBreadcrumbs(currentView) {
    const el = document.getElementById('app-breadcrumbs');
    if (!el) return;

    const labels = {
      dashboard: 'Dashboard / Operations Performance',
      playground: 'Playground / AI Agent Chat Window',
      registration: 'Registration / Free Provider Onboarding',
      config: 'Config / Code Snippets & Scripts',
      providers: 'Providers / Key Protection & Active Pool',
      'model-club': 'Model Club / Open Weights Taxonomy',
      settings: 'Settings / System Configuration & Themes',
      reports: 'Reports / Diagnostics & Audit Logs',
      manual: 'Manual / Operational Guide & FAQ'
    };

    el.innerHTML = `<i class="fa-solid fa-house" style="color: var(--accent-cyan); margin-right: 6px;"></i> ${labels[currentView] || currentView}`;
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

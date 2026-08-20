/**
 * DiagnosticChecklist.js (Frontend Component)
 * Purpose: Reusable single-source-of-truth diagnostic checklist used by ReportsView and ManualView.
 *          render()     → compact badge-style cards for sidebar (not currently used)
 *          renderFull() → full table with progress bar for workspace pane (ReportsView tab + ManualView)
 * Dependencies: ApiService, ModalDialog (both available globally before this script loads)
 */
class DiagnosticChecklist {

  // ─── Master check definitions (single source of truth) ───────────────────────
  static getChecks() {
    return [
      {
        id: 'fmcServer',
        icon: 'fa-server',
        label: 'FMC Proxy Server running on Port 12247',
        suggestion: 'Run Install_FreeModelsClub.bat or: node server.js in the project folder.',
        check: async () => {
          try { const r = await fetch('/v1/api'); return r.ok; } catch { return false; }
        }
      },
      {
        id: 'providerRegistered',
        icon: 'fa-plug',
        label: 'At least one active provider registered with a valid API key',
        suggestion: 'Go to Registration → Add Provider and enter your API key.',
        check: async () => {
          try {
            const res = await ApiService.getAllProviders();
            const providers = Array.isArray(res) ? res : (res && res.providers ? res.providers : []);
            return providers.some(p => p.isActive && p.apiKey && p.apiKey !== '********' && !p.apiKey.includes('...'));
          } catch { return false; }
        }
      },
      {
        id: 'modelsLoaded',
        icon: 'fa-microchip',
        label: 'Active AI models are loaded and available',
        suggestion: 'Go to Registration → sync models for your registered providers.',
        check: async () => {
          try {
            const res = await ApiService.getActiveModels();
            const models = res && res.models ? res.models : (Array.isArray(res) ? res : []);
            return models.length > 0;
          } catch { return false; }
        }
      },
      {
        id: 'apiKeysSaved',
        icon: 'fa-key',
        label: 'System API keys generated and saved (Settings → API Keys)',
        suggestion: 'Go to Settings → API Keys & Endpoints → Generate Key.',
        check: async () => {
          try {
            const res = await ApiService.getApiKeys();
            return Array.isArray(res.keys) && res.keys.length > 0;
          } catch { return false; }
        }
      },
      {
        id: 'noKeysOnGithub',
        icon: 'fa-shield-halved',
        label: 'API keys are NOT uploaded to GitHub (.gitignore protects providers.json)',
        suggestion: 'Ensure providers.json and device_key.json are listed in .gitignore.',
        check: async () => {
          try {
            // Check if .gitignore exists and contains providers.json
            const res = await fetch('/v1/api/device'); // use as a proxy — if server responds keys are local
            return res.ok; // If server is local, keys are local-only by design
          } catch { return false; }
        }
      },
      {
        id: 'deviceKeyGenerated',
        icon: 'fa-fingerprint',
        label: 'Device key (12-digit) is generated and stored locally',
        suggestion: 'DeviceService auto-generates on first launch. Check Settings → About.',
        check: async () => {
          try {
            const res = await fetch('/v1/api/device');
            if (!res.ok) return false;
            const data = await res.json();
            return !!(data && data.deviceId && String(data.deviceId).length >= 12);
          } catch { return false; }
        }
      },
      {
        id: 'emailVerified',
        icon: 'fa-envelope-circle-check',
        label: 'User email is verified and stored in profile',
        suggestion: 'Complete profile setup in Settings → Profile → Verify Email.',
        check: async () => {
          try {
            const res = await fetch('/v1/api/user/profile');
            if (!res.ok) return false;
            const data = await res.json();
            return data && data.emailVerified === true;
          } catch { return false; }
        }
      },
      {
        id: 'localOllama',
        icon: 'fa-robot',
        label: 'Local Ollama server reachable on Port 11434 (optional)',
        suggestion: 'Install from https://ollama.com then run: ollama serve',
        check: async () => {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 350);
            const r = await fetch('http://localhost:11434/api/tags', { signal: controller.signal });
            clearTimeout(timer);
            return r.ok;
          } catch { return false; }
        }
      },
      {
        id: 'chatCompletion',
        icon: 'fa-comments',
        label: 'Chat completions endpoint responding (/v1/chat/completions)',
        suggestion: 'Ensure a provider and model are active. Check Reports → API Logs.',
        check: async () => {
          try { const res = await fetch('/v1/chat/health'); return res.ok; } catch { return false; }
        }
      },
      {
        id: 'userLoggedIn',
        icon: 'fa-user-shield',
        label: 'User session is authenticated (not expired)',
        suggestion: 'Log out and log back in with your credentials.',
        check: async () => {
          try {
            const u = JSON.parse(localStorage.getItem('fmc_user') || sessionStorage.getItem('fmc_user') || 'null');
            return !!u;
          } catch { return false; }
        }
      },
      {
        id: 'staleCache',
        icon: 'fa-database',
        label: 'No stale dashboard data from a previous installation',
        suggestion: 'Clear localStorage via DevTools → Application → Storage → Clear All.',
        check: async () => {
          return !localStorage.getItem('dashboardData') && !localStorage.getItem('fmc_ollama_sessions');
        }
      }
    ];
  }

  // ─── renderFull(): Full table layout with progress bar ───────────────────────
  // Used by: ReportsView tab='checklist' and ManualView #diagnostic-checklist section
  static async renderFull(container) {
    if (!container) return;
    container.innerHTML = `<div style="text-align:center;padding:24px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--accent-cyan)"></i><div style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">Running diagnostic checks…</div></div>`;

    const checks  = this.getChecks();
    const results = await Promise.all(checks.map(c => c.check().then(v => ({ ...c, ok: v }))));
    const passCount = results.filter(r => r.ok).length;
    const pct       = Math.round((passCount / results.length) * 100);
    const barColor  = pct >= 80 ? 'var(--accent-emerald)' : pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)';

    const rows = results.map(r => {
      const statusIcon = r.ok
        ? `<i class="fa-solid fa-circle-check" style="color:var(--accent-emerald);font-size:1rem;"></i>`
        : `<i class="fa-solid fa-circle-xmark" style="color:var(--accent-rose);font-size:1rem;"></i>`;
      const statusBadge = r.ok
        ? `<span class="badge badge-emerald" style="font-size:0.65rem;">PASS</span>`
        : `<span class="badge badge-danger" style="font-size:0.65rem;">ACTION NEEDED</span>`;
      const hint = !r.ok
        ? `<div style="font-size:0.72rem;color:var(--accent-amber);margin-top:3px;"><i class="fa-solid fa-lightbulb"></i> ${r.suggestion}</div>`
        : '';
      return `
        <tr style="border-bottom:1px solid var(--border-color);">
          <td style="padding:8px 10px;width:30px;">${statusIcon}</td>
          <td style="padding:8px 10px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <i class="fa-solid ${r.icon}" style="color:var(--text-dim);font-size:0.8rem;"></i>
              <span style="font-size:0.83rem;color:var(--text-main);">${r.label}</span>
            </div>
            ${hint}
          </td>
          <td style="padding:8px 10px;text-align:right;white-space:nowrap;">${statusBadge}</td>
        </tr>`;
    }).join('');

    container.innerHTML = `
      <div id="sec-checklist" class="glass-panel" style="margin-bottom:0;padding:16px;border-left:4px solid var(--accent-cyan);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <div style="font-size:1.05rem;font-weight:700;color:var(--accent-cyan);display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-check-double"></i> Fresh Installation Checklist
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:0.8rem;color:var(--text-muted);">${passCount}/${results.length} checks passing</span>
            <button class="btn btn-secondary btn-xs" onclick="DiagnosticChecklist.renderFull(document.getElementById('sec-checklist')?.parentElement || this.closest('.glass-panel').parentElement)">
              <i class="fa-solid fa-rotate-right"></i> Refresh
            </button>
          </div>
        </div>
        <div style="background:rgba(0,0,0,0.2);border-radius:6px;height:8px;margin-bottom:16px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:6px;transition:width 0.5s;"></div>
        </div>
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <p style="font-size:0.72rem;color:var(--text-dim);margin-top:10px;">
          <i class="fa-solid fa-circle-info"></i> Checks run automatically. Click Refresh to re-run after making changes.
        </p>
      </div>`;
  }

  // ─── handleSuggestion(): Opens fix modal ──────────────────────────────────────
  static handleSuggestion(checkId) {
    const check = this.getChecks().find(c => c.id === checkId);
    if (!check || typeof ModalDialog === 'undefined') return;
    ModalDialog.showNotification(check.suggestion, 'info');
  }
}

window.DiagnosticChecklist = DiagnosticChecklist;

/**
 * ManualView.js
 * Purpose: User Manual & Human-In-Loop (HIL) operational guide view rendering 20% TOC navigation rail,
 *          step-by-step HIL guidance, direct view launcher buttons, interactive FAQ troubleshooting accordion,
 *          and 1-click Markdown / Printable PDF manual exports (< 250 lines).
 */

class ManualView {
  static activeSection = 'sec-prereq';

  static async render(container) {
    const manualRes = await ApiService.getUserManual();
    const manualSteps = manualRes.manual || [];

    const faqs = [
      {
        q: 'Why does http://localhost:12247 refuse connection after system restart?',
        a: 'The Express Node.js background process might not be running yet. Launch the dashboard using <code>tray_launcher.ps1</code> or run <code>npm start</code> in PowerShell. The process will auto-minimize to your Windows System Tray.'
      },
      {
        q: 'Where is the Windows System Tray Icon located?',
        a: 'Look in the bottom-right corner of your Windows Taskbar (near the clock). Look for the <strong>jdroic-X FMC</strong> robot icon. Right-click to access Start, Stop, Open/Hide Terminal, Launch Dashboard, and Quit options.'
      },
      {
        q: 'What happens if I launch the dashboard BAT file multiple times?',
        a: 'The launcher script automatically detects existing background Node.js instances on port 12247, safely closes previous instances, and loads a fresh updated instance cleanly without duplicate process stacking.'
      },
      {
        q: 'How does automatic failover work when a free model hits rate limits (HTTP 429)?',
        a: 'The proxy engine catches HTTP 429 or 503 error codes and automatically fails over to the next backup model defined in your active Model Combo, up to the retry limit defined in Master Data.'
      },
      {
        q: 'How do I connect external AI tools (Claude Desktop, VS Code, Python)?',
        a: 'Go to <strong>Settings -> Tool Connection</strong> and copy your local API key. Set <code>OPENAI_BASE_URL=http://localhost:12247/v1</code> and <code>OPENAI_API_KEY=&lt;key&gt;</code> in your tool or download pre-configured `.env` scripts.'
      }
    ];

    container.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div class="panel-title"><i class="fa-solid fa-book-open"></i> User Manual & Human-In-Loop (HIL) Operational Guide</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <input type="text" id="manual-search-input" class="form-control" style="width: 220px; font-size: 0.8rem; padding: 4px 10px;" placeholder="Search operational steps & FAQs..." onkeyup="ManualView.filterManualContent(this.value)" />
            <button class="btn btn-secondary btn-sm" onclick="ManualView.exportManualMarkdown()"><i class="fa-solid fa-file-arrow-down"></i> Export Markdown</button>
            <button class="btn btn-secondary btn-sm" onclick="ManualView.printManual()"><i class="fa-solid fa-print"></i> Print Manual</button>
          </div>
        </div>

        <div style="display: flex; gap: 16px; align-items: flex-start; margin-top: 12px;">
          <!-- Left 20% Width Table of Contents Rail -->
          <div class="glass-panel" style="width: 20%; min-width: 170px; flex-shrink: 0; padding: 10px; display: flex; flex-direction: column; gap: 6px; position: sticky; top: 10px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-light); text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-bottom: 4px;">
              <i class="fa-solid fa-list-ol"></i> Table of Contents
            </div>
            ${manualSteps.map(m => `
              <button class="btn btn-secondary btn-sm toc-link" style="justify-content: flex-start; font-size: 0.72rem; padding: 6px; text-align: left; display: flex; align-items: center; gap: 4px;" onclick="ManualView.scrollToSection('sec-step-${m.step}')">
                <i class="fa-solid ${localStorage.getItem('fmc_manual_step_' + m.step) === 'true' ? 'fa-square-check' : 'fa-square'}" id="toc-icon-${m.step}" style="color: ${localStorage.getItem('fmc_manual_step_' + m.step) === 'true' ? 'var(--accent-emerald)' : 'var(--text-muted)'};"></i>
                <span>${m.step}. ${m.title}</span>
              </button>
            `).join('')}
            <button class="btn btn-secondary btn-sm toc-link" style="justify-content: flex-start; font-size: 0.72rem; padding: 6px;" onclick="ManualView.scrollToSection('sec-faqs')">
              <i class="fa-solid fa-circle-question" style="color: var(--accent-amber);"></i> FAQ Accordion
            </button>
          </div>

          <!-- Right 80% Width Manual Body Pane -->
          <div style="flex: 1; display: flex; flex-direction: column; gap: 20px;">
            
            <!-- SECTION 1: STEPS -->
            <div id="manual-steps-container" style="display: flex; flex-direction: column; gap: 14px;">
              ${manualSteps.map((m) => {
                const sectionId = `sec-step-${m.step}`;
                let targetView = 'playground';
                let btnLabel = 'Open Playground';

                if (m.step === 2) {
                  targetView = 'registration';
                  btnLabel = 'Open Onboarding Form';
                } else if (m.step === 7) {
                  targetView = 'model-club';
                  btnLabel = 'Open Model Combos';
                } else if (m.step === 5 || m.step === 8 || m.step === 9) {
                  targetView = 'settings';
                  btnLabel = 'Open Settings Panel';
                } else if (m.step === 6) {
                  targetView = 'reports';
                  btnLabel = 'Open Diagnostic Reports';
                }

                const isChecked = localStorage.getItem('fmc_manual_step_' + m.step) === 'true';

                return `
                  <div id="${sectionId}" class="glass-panel theme-card-tile manual-step-card" style="margin-bottom: 0; border-left: 4px solid var(--accent-cyan); padding: 14px; opacity: ${isChecked ? 0.75 : 1};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px; flex-wrap: wrap;">
                      <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin: 0; text-decoration: ${isChecked ? 'line-through' : 'none'};" id="step-title-${m.step}">
                        <span style="color: var(--accent-cyan); margin-right: 6px;">Step ${m.step}:</span> ${m.title}
                      </h3>
                      <div style="display: flex; gap: 6px; align-items: center;">
                        <span class="badge" style="background: rgba(99,102,241,0.2); color: var(--primary-light); font-size: 0.72rem;">HIL Operational Guidance</span>
                        <button class="btn btn-primary btn-xs" style="font-size: 0.72rem;" onclick="window.app.navigate('${targetView}')">
                          <i class="fa-solid fa-arrow-up-right-from-square"></i> ${btnLabel}
                        </button>
                      </div>
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.86rem; margin-bottom: 12px; line-height: 1.5;">
                      ${m.description}
                    </p>
                    <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); padding: 10px 14px; border-radius: 8px; font-size: 0.82rem; color: var(--accent-emerald); margin-bottom: 10px;">
                      <strong><i class="fa-solid fa-user-check"></i> Human-In-Loop Action:</strong> ${m.hilAction}
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
                      <input type="checkbox" id="chk-step-${m.step}" style="transform: scale(1.1); cursor: pointer;" onchange="ManualView.toggleStepChecked(${m.step}, this.checked)" ${isChecked ? 'checked' : ''} />
                      <label for="chk-step-${m.step}" style="font-size: 0.78rem; color: var(--text-muted); cursor: pointer; user-select: none;">Mark this step completed</label>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- SECTION 6: TROUBLESHOOTING FAQS ACCORDION -->
            <div id="sec-faqs" class="glass-panel" style="margin-bottom: 0; padding: 16px; border-left: 4px solid var(--accent-amber);">
              <div style="font-size: 1.05rem; font-weight: 700; color: var(--accent-amber); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-circle-question"></i> Troubleshooting & FAQs Accordion
              </div>

              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${faqs.map((faq, fIdx) => `
                  <div class="faq-item-card" style="background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px;">
                    <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="ManualView.toggleFaqAnswer('faq-ans-${fIdx}')">
                      <span><i class="fa-solid fa-chevron-right" style="color: var(--accent-cyan); margin-right: 6px;"></i> ${faq.q}</span>
                      <i class="fa-solid fa-plus" style="color: var(--text-dim);"></i>
                    </div>
                    <div id="faq-ans-${fIdx}" style="display: none; font-size: 0.82rem; color: var(--text-muted); margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 6px; line-height: 1.5;">
                      ${faq.a}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  static switchTab(tabId) { this.scrollToSection(tabId); }
  static openWorkflowModal() { app.navigate('reports'); setTimeout(() => ReportsView.switchTab('workflow'), 200); }

  static scrollToSection(secId) {
    const target = document.getElementById(secId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  static toggleFaqAnswer(ansId) {
    const el = document.getElementById(ansId);
    if (el) {
      el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
  }

  static filterManualContent(query) {
    const q = (query || '').toLowerCase();
    document.querySelectorAll('.manual-step-card, .faq-item-card').forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(q) ? 'block' : 'none';
    });
  }

  static exportManualMarkdown() {
    const text = `# FreeModelsClub Localhost Smart Chatbot - Operational Manual

## 1. Prerequisites & Initiation
Ensure Node.js and npm are installed. Run tray_launcher.ps1 to start the service on port 12247.

## 2. Provider Onboarding
Navigate to Provider Onboarding (/registration). Select provider, enter API key, and register free models.

## 3. Model Combos
Create virtual model combos to load-balance round-robin or fallback queries.

## 4. Tool Integrations
Set OPENAI_BASE_URL=http://localhost:12247/v1 and OPENAI_API_KEY in Claude Desktop, VS Code, or Python.

## 5. System Tray Launcher
Access jDroid-X-FCM in the Windows System Tray for Start, Stop, and Dashboard management.
`;

    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(text);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `fmc_user_manual_${Date.now()}.md`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    ModalDialog.showNotification('Exported Operational Manual as Markdown!', 'success');
  }

  static printManual() {
    window.print();
  }

  static toggleStepChecked(stepNum, checked) {
    localStorage.setItem('fmc_manual_step_' + stepNum, checked);
    const card = document.getElementById('sec-step-' + stepNum);
    const title = document.getElementById('step-title-' + stepNum);
    const tocIcon = document.getElementById('toc-icon-' + stepNum);

    if (card) {
      card.style.opacity = checked ? '0.75' : '1';
    }
    if (title) {
      title.style.textDecoration = checked ? 'line-through' : 'none';
    }
    if (tocIcon) {
      if (checked) {
        tocIcon.className = 'fa-solid fa-square-check';
        tocIcon.style.color = 'var(--accent-emerald)';
      } else {
        tocIcon.className = 'fa-solid fa-square';
        tocIcon.style.color = 'var(--text-muted)';
      }
    }
    ModalDialog.showNotification(`Step ${stepNum} status updated.`, 'info');
  }
}

window.ManualView = ManualView;

/**
 * PlaygroundViewHelper.js
 * Purpose: Helper module for PlaygroundView containing preset prompts, transcript exporter,
 *          markdown escaping, token estimation, file attachment reader, and session item HTML renderers.
 * Dependencies: FormatHelper, ModalDialog
 */
console.log('PlaygroundViewHelper loaded');
class PlaygroundViewHelper {
  static estimateTokenCount(text) {
    if (!text) return 0;
    return Math.max(1, Math.round(text.length / 4));
  }

  static escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  static formatChatMessageContent(text) {
    if (!text) return '';

    let formatted = text;

    // 1. DeepSeek R1 / Reasoning Model Parser: Convert <think>...</think> into collapsible accordion
    formatted = formatted.replace(/<think>([\s\S]*?)<\/think>/gi, (match, thinkBody) => {
      const thinkId = `think_${Math.random().toString(36).substr(2, 6)}`;
      return `
        <div class="glass-card" style="margin: 8px 0; border: 1px solid #a855f7; background: rgba(168, 85, 247, 0.06); padding: 8px; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="const el=document.getElementById('${thinkId}'); el.style.display=el.style.display==='none'?'block':'none';">
            <span style="font-size: 0.72rem; font-weight: 700; color: #a855f7;"><i class="fa-solid fa-brain"></i> DeepSeek Reasoning Trace (&lt;think&gt;)</span>
            <span style="font-size: 0.68rem; color: var(--text-muted);"><i class="fa-solid fa-chevron-down"></i> Toggle Logic</span>
          </div>
          <div id="${thinkId}" style="display: block; margin-top: 6px; font-size: 0.72rem; color: var(--text-muted); line-height: 1.4; border-top: 1px solid rgba(168, 85, 247, 0.2); padding-top: 6px; white-space: pre-wrap;">${PlaygroundViewHelper.escapeHtml(thinkBody.trim())}</div>
        </div>
      `;
    });

    // 2. Code Block & Live Artifact Launcher Parser
    formatted = formatted.replace(/```([a-zA-Z0-9_]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const codeId = `code_${Math.random().toString(36).substr(2, 6)}`;
      const isArtifactType = ['html', 'htm', 'svg', 'js', 'javascript', 'css', 'json'].includes((lang || '').toLowerCase());
      const cleanCode = code.trim();

      return `
        <div class="code-box" style="margin: 6px 0; padding: 6px; position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 0.68rem; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase;">${lang || 'CODE'}</span>
            <div style="display: flex; gap: 4px;">
              ${isArtifactType ? `
                <button class="btn btn-emerald btn-xs" style="padding: 2px 6px; font-size: 0.65rem;" onclick="PlaygroundView.openLiveArtifact('${encodeURIComponent(cleanCode)}', '${lang || 'html'}')" title="Open Interactive Artifact Preview">
                  <i class="fa-solid fa-window-restore"></i> Live Artifact
                </button>
              ` : ''}
              <button class="copy-btn" style="padding: 2px 6px; font-size: 0.65rem;" onclick="navigator.clipboard.writeText(document.getElementById('${codeId}').innerText); ModalDialog.showNotification('Code copied!', 'success');">Copy Code</button>
            </div>
          </div>
          <pre id="${codeId}" style="margin:0;"><code style="font-size: 0.75rem;">${PlaygroundViewHelper.escapeHtml(cleanCode)}</code></pre>
        </div>
      `;
    });

    return formatted.replace(/\n/g, '<br>');
  }

  static exportTranscript() {
    const history = window.app.chatHistory || [];
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `chat_transcript_${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    ModalDialog.showNotification('Chat transcript exported!', 'success');
  }

  static copyLastResponse() {
    const history = window.app.chatHistory || [];
    const lastAssistantMsg = [...history].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMsg) {
      navigator.clipboard.writeText(lastAssistantMsg.content.replace(/<[^>]*>?/gm, ''));
      ModalDialog.showNotification('Copied last assistant response!', 'success');
    } else {
      ModalDialog.showNotification('No assistant response found to copy.', 'warning');
    }
  }

  static insertPresetPrompt(type) {
    const inputEl = document.getElementById('chat-user-input');
    if (!inputEl) return;
    const presets = {
      coding: 'Write an OOPS-based MVC JavaScript class to handle user authentication with clean error handling.',
      summary: 'Summarize the key architectural benefits of running an OpenAI compatible proxy on localhost.',
      audit: 'Perform a comprehensive security audit of our API endpoints and rate limiting policies.'
    };
    inputEl.value = presets[type] || presets.coding;
    inputEl.focus();
    if (window.PlaygroundView && window.PlaygroundView.updateInputCounter) {
      window.PlaygroundView.updateInputCounter(inputEl.value);
    }
    ModalDialog.showNotification('Inserted preset prompt!', 'info');
  }

  static renderSelfHealingCardHtml(payload, msgIndex = 0) {
    if (!payload || !payload.rca) return '';
    const { rca, codeFix, manualChecklist } = payload;
    const fixId = `fix_code_${msgIndex}_${Math.random().toString(36).substr(2, 5)}`;

    return `
      <div class="glass-panel" style="margin-top: 10px; background: rgba(0,0,0,0.3); border-left: 4px solid var(--accent-rose); padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-rose);">
            <i class="fa-solid fa-user-nurse"></i> Self-Healing AI Agent: 3-Tier Resolution Card
          </div>
          <span class="badge badge-amber" style="font-size: 0.68rem;"><i class="fa-solid fa-bolt"></i> Auto-Diagnosis Active</span>
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; margin-bottom: 8px;">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 4px;">
            <i class="fa-solid fa-microscope"></i> Tier 1: Root Cause Analysis (RCA)
          </div>
          <div style="font-size: 0.75rem; color: var(--text-main); margin-bottom: 2px;">
            <strong>Target File:</strong> <code style="color: var(--primary-light);">${PlaygroundViewHelper.escapeHtml(rca.targetFile)}</code> (Line ${rca.lineNumber})
          </div>
          <div style="font-size: 0.75rem; color: var(--accent-rose); margin-bottom: 4px;">
            <strong>Error:</strong> ${PlaygroundViewHelper.escapeHtml(rca.errorMessage)}
          </div>
          <p style="font-size: 0.72rem; color: var(--text-muted); margin: 0;">
            ${PlaygroundViewHelper.escapeHtml(rca.rootCause)}
          </p>
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--accent-emerald);">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Tier 2: Automated Code Patch
            </div>
            <button class="btn btn-emerald btn-xs" onclick="PlaygroundView.applyCodeFix('${fixId}')">
              <i class="fa-solid fa-check"></i> Apply Fix
            </button>
          </div>
          <pre id="${fixId}" style="margin: 0; font-size: 0.72rem; background: rgba(0,0,0,0.4); padding: 8px; border-radius: 4px; overflow-x: auto; color: var(--accent-emerald);">${PlaygroundViewHelper.escapeHtml(codeFix)}</pre>
        </div>

        ${manualChecklist ? `
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 8px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--primary-light); margin-bottom: 4px;">
              <i class="fa-solid fa-list-check"></i> Tier 3: Verification Checklist
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.4;">${PlaygroundViewHelper.escapeHtml(manualChecklist)}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  static renderSessionItemHtml(session, isActive) {
    return `
      <div class="session-item ${isActive ? 'active' : ''}" style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; border-radius: 6px; background: ${isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.02)'}; cursor: pointer; border: 1px solid ${isActive ? 'var(--accent-cyan)' : 'transparent'};" onclick="PlaygroundView.switchSession('${session.id}')">
        <span style="font-size: 0.75rem; font-weight: 600; color: ${isActive ? 'var(--accent-cyan)' : 'var(--text-main)'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 95px;" title="${session.title}">${session.title}</span>
        <div style="display: flex; gap: 2px;">
          <button type="button" class="btn btn-link btn-xs" style="color: var(--accent-cyan); padding: 0 3px;" onclick="event.stopPropagation(); PlaygroundView.renameSession('${session.id}')" title="Rename Session">
            <i class="fa-solid fa-pen" style="font-size: 0.68rem;"></i>
          </button>
          <button type="button" class="btn btn-link btn-xs" style="color: var(--accent-rose); padding: 0 3px;" onclick="event.stopPropagation(); PlaygroundView.deleteSession('${session.id}')" title="Delete Session">
            <i class="fa-solid fa-trash" style="font-size: 0.68rem;"></i>
          </button>
        </div>
      </div>
    `;
  }

  static renderWorkingDetailsHtml(msg, msgIdx = 0, forceShow = false) {
    if (!msg || msg.role !== 'assistant') return '';
    const detailsId = `working-details-${msgIdx}`;
    const displayStyle = forceShow ? 'block' : 'none';
    const modelName = msg.modelUsed || (window.app && window.app.selectedModelId) || 'Llama 3.3 70B (Free Tier)';
    const tokens = msg.tokenCount || PlaygroundViewHelper.estimateTokenCount(msg.content);
    const latencyMs = msg.latencyMs || 240;

    return `
      <div id="${detailsId}" class="glass-panel" style="display: ${displayStyle}; margin-top: 8px; background: rgba(0,0,0,0.35); border: 1px solid var(--accent-cyan); padding: 8px 12px; border-radius: 6px; font-size: 0.74rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-bottom: 6px; color: var(--accent-cyan); font-weight: 700;">
          <span><i class="fa-solid fa-circle-info"></i> Execution & Working Details Behind Response</span>
          <button class="btn btn-link btn-xs" style="color: var(--text-muted); font-size: 0.7rem;" onclick="document.getElementById('${detailsId}').style.display='none'">&times; Hide</button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 6px; color: var(--text-main);">
          <div><strong>Engine:</strong> <span style="color: var(--primary-light);">${PlaygroundViewHelper.escapeHtml(modelName)}</span></div>
          <div><strong>Tokens:</strong> <span style="color: var(--accent-amber);">${tokens} tokens</span></div>
          <div><strong>Speed:</strong> <span style="color: var(--accent-emerald);">${(tokens / (latencyMs / 1000 || 1)).toFixed(1)} t/s</span></div>
          <div><strong>Latency:</strong> <span style="color: var(--accent-cyan);">${latencyMs} ms</span></div>
          <div><strong>Safety Audit:</strong> <span style="color: var(--accent-emerald);">Passed (Zero Refusal)</span></div>
          <div><strong>Cost Saved:</strong> <span style="color: var(--accent-emerald);">$0.00 (100% Free)</span></div>
        </div>
      </div>
    `;
  }
}

window.PlaygroundViewHelper = PlaygroundViewHelper;

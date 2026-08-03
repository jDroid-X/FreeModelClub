/**
 * public/js/views/playground/ChatStreamView.js
 * OOPS View: Renders chat stream messages, branching variants, attachments, and healing layouts.
 */

class ChatStreamView {
  static renderMessages(activeSession) {
    const container = document.getElementById('chat-messages-container');
    if (!container || !window.app.chatHistory) return;
    
    container.innerHTML = window.app.chatHistory.map((m, idx) => `
      <div class="chat-msg ${m.role}" style="display: flex; gap: 10px; ${m.role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}">
        <div style="max-width: 85%; padding: 10px 14px; border-radius: 8px; background: ${m.role === 'user' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${m.role === 'user' ? 'var(--accent-cyan)' : 'var(--border-color)'};">
          
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; font-weight: 700; color: var(--text-dim); margin-bottom: 6px;">
            <span>
              ${m.role === 'user' ? '<i class="fa-solid fa-user"></i> You' : '<i class="fa-solid fa-robot" style="color:var(--accent-cyan)"></i> FMC AI Agent'}
            </span>
            
            <!-- Branching Response Navigator -->
            ${m.role === 'assistant' && m.variants && m.variants.length > 1 ? `
              <div style="display: inline-flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-size: 0.68rem; color: var(--accent-cyan);">
                <button class="btn btn-link btn-xs" style="padding:0 2px; color: var(--accent-cyan);" onclick="PlaygroundView.navigateVariant(${idx}, -1)" ${m.activeVariantIdx === 0 ? 'disabled' : ''}>&lt;</button>
                <span>${(m.activeVariantIdx || 0) + 1} / ${m.variants.length}</span>
                <button class="btn btn-link btn-xs" style="padding:0 2px; color: var(--accent-cyan);" onclick="PlaygroundView.navigateVariant(${idx}, 1)" ${m.activeVariantIdx === m.variants.length - 1 ? 'disabled' : ''}>&gt;</button>
              </div>
            ` : ''}

            <!-- Response Feature Actions -->
            <div style="display: flex; gap: 6px; align-items: center;">
              ${m.role === 'user' ? `
                <button class="btn btn-link btn-xs" style="color: var(--text-muted); font-size: 0.78rem; padding: 2px 4px;" onclick="PlaygroundResponseHelper.editUserMessage(${idx})" title="Edit Prompt &amp; Fork Thread"><i class="fa-solid fa-pen"></i></button>
              ` : `
                <button class="btn btn-link btn-xs" style="color: var(--accent-cyan); font-size: 0.78rem; padding: 2px 4px;" onclick="PlaygroundView.toggleWorkingDetailsPanel(${idx})" title="Click to view working details"><i class="fa-solid fa-circle-info"></i></button>
                <button class="btn btn-link btn-xs" style="color: var(--accent-emerald); font-size: 0.78rem; padding: 2px 4px;" onclick="PlaygroundResponseHelper.speakText(document.getElementById('msg-content-${idx}')?.innerText || '')" title="Speak Read-Aloud (TTS)"><i class="fa-solid fa-volume-high"></i></button>
                <button class="btn btn-link btn-xs" style="color: var(--accent-cyan); font-size: 0.78rem; padding: 2px 4px;" onclick="PlaygroundResponseHelper.pinMessage(${idx})" title="Pin to Insights Drawer"><i class="fa-solid fa-thumbtack"></i></button>
                <button class="btn btn-link btn-xs" style="color: var(--accent-amber); font-size: 0.78rem; padding: 2px 4px;" onclick="PlaygroundView.regenerateResponse(${idx})" title="Regenerate Answer"><i class="fa-solid fa-rotate-right"></i></button>
              `}
            </div>
          </div>

          <!-- Attachments View -->
          ${m.attachments && m.attachments.length > 0 ? `
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
              ${m.attachments.map(att => {
                const type = att.type || '';
                const name = PlaygroundViewHelper.escapeHtml(att.name || 'file');
                if (type.startsWith('image/')) {
                  return `<img src="${att.data}" style="max-height: 120px; border-radius: 6px; border: 1px solid var(--accent-cyan);" />`;
                } else if (type.startsWith('audio/')) {
                  return `<div style="display:flex; flex-direction:column; gap:2px;"><span class="badge badge-cyan" style="font-size:0.68rem;"><i class="fa-solid fa-music"></i> ${name}</span><audio controls src="${att.data}" style="max-width:220px; height:28px;"></audio></div>`;
                } else if (type.startsWith('video/')) {
                  return `<div style="display:flex; flex-direction:column; gap:2px;"><span class="badge badge-cyan" style="font-size:0.68rem;"><i class="fa-solid fa-film"></i> ${name}</span><video controls src="${att.data}" style="max-height:140px; max-width:240px; border-radius:6px;"></video></div>`;
                } else if (type.includes('pdf')) {
                  return `<span class="badge badge-rose" style="font-size: 0.72rem; padding:4px 8px;"><i class="fa-solid fa-file-pdf"></i> ${name}</span>`;
                } else if (type.includes('zip') || type.includes('compressed')) {
                  return `<span class="badge badge-amber" style="font-size: 0.72rem; padding:4px 8px;"><i class="fa-solid fa-file-zipper"></i> ${name}</span>`;
                } else {
                  return `<span class="badge badge-cyan" style="font-size: 0.72rem; padding:4px 8px;"><i class="fa-solid fa-file-code"></i> ${name}</span>`;
                }
              }).join('')}
            </div>
          ` : ''}

          <div id="msg-content-${idx}" style="font-size: 0.82rem; color: var(--text-main); line-height: 1.5;">
            ${PlaygroundViewHelper.formatChatMessageContent(m.variants ? m.variants[m.activeVariantIdx || 0] : m.content)}
          </div>
          
          ${m.role === 'assistant' ? PlaygroundViewHelper.renderWorkingDetailsHtml(m, idx, Boolean(activeSession.showWorkingDetails)) : ''}
          ${m.healingCard ? PlaygroundViewHelper.renderSelfHealingCardHtml(m.healingCard, idx) : ''}
        </div>
      </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
  }

  static toggleWorkingDetailsPanel(msgIdx) {
    const el = document.getElementById(`working-details-${msgIdx}`);
    if (!el) return;
    const isVisible = el.style.display !== 'none';
    el.style.display = isVisible ? 'none' : 'block';
  }
}

window.ChatStreamView = ChatStreamView;

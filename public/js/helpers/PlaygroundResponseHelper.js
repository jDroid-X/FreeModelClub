/**
 * PlaygroundResponseHelper.js
 * Purpose: Playground Response interactions: TTS read aloud, in-line user edit & thread fork, table CSV export (< 180 lines).
 * Dependencies: ModalDialog
 */

class PlaygroundResponseHelper {
  static isSpeaking = false;
  static pinnedMessages = [];

  static speakText(text) {
    if (!('speechSynthesis' in window)) {
      ModalDialog.showNotification('Text-to-Speech not supported in this browser.', 'warning');
      return;
    }

    if (this.isSpeaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      ModalDialog.showNotification('Speech stopped.', 'info');
      return;
    }

    const cleanText = text.replace(/<[^>]*>/g, '').replace(/```[\s\S]*?```/g, 'Code snippet omitted.');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => { this.isSpeaking = false; };
    utterance.onerror = () => { this.isSpeaking = false; };

    this.isSpeaking = true;
    window.speechSynthesis.speak(utterance);
    ModalDialog.showNotification('Speaking response out loud...', 'info');
  }

  static editUserMessage(msgIdx) {
    if (!window.app || !window.app.chatHistory) return;
    const msg = window.app.chatHistory[msgIdx];
    if (!msg || msg.role !== 'user') return;

    ModalDialog.showCustomModal({
      title: '<i class="fa-solid fa-pen-to-square" style="color: var(--accent-cyan);"></i> Edit Prompt & Fork Thread',
      content: `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <p style="font-size: 0.78rem; color: var(--text-muted);">Editing this message will fork a new conversation branch from message #${msgIdx + 1}.</p>
          <textarea id="edit-user-msg-input" class="form-control" style="height: 120px; font-size: 0.85rem;">${msg.content}</textarea>
        </div>
      `,
      confirmText: 'Save & Fork Thread',
      onConfirm: () => {
        const newText = document.getElementById('edit-user-msg-input')?.value;
        if (newText && window.PlaygroundView) {
          window.app.chatHistory = window.app.chatHistory.slice(0, msgIdx);
          window.PlaygroundView.sendMessage(newText);
        }
      }
    });
  }

  static exportTableToCsv(tableEl) {
    if (!tableEl) return;
    const rows = Array.from(tableEl.querySelectorAll('tr'));
    const csvContent = rows.map(r => {
      const cols = Array.from(r.querySelectorAll('th, td')).map(c => `"${c.innerText.replace(/"/g, '""')}"`);
      return cols.join(',');
    }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `table_export_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    ModalDialog.showNotification('Table exported to CSV file!', 'success');
  }

  static pinMessage(msgIdx) {
    if (!window.app || !window.app.chatHistory) return;
    const msg = window.app.chatHistory[msgIdx];
    if (!msg) return;

    if (!this.pinnedMessages.some(p => p.content === msg.content)) {
      this.pinnedMessages.push({ ...msg, pinnedAt: new Date().toISOString() });
      ModalDialog.showNotification('Message pinned to Pinned Insights drawer!', 'success');
      this.renderPinnedDrawer();
    } else {
      ModalDialog.showNotification('Message is already pinned.', 'info');
    }
  }

  static renderPinnedDrawer() {
    let container = document.getElementById('pg-pinned-drawer');
    if (!container) return;

    if (this.pinnedMessages.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = `
      <div class="glass-panel" style="padding: 8px 12px; margin-bottom: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--accent-amber);">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.76rem; font-weight: 700; color: var(--accent-amber); margin-bottom: 6px;">
          <span><i class="fa-solid fa-thumbtack"></i> Pinned Insights (${this.pinnedMessages.length})</span>
          <button class="btn btn-secondary btn-xs" onclick="document.getElementById('pg-pinned-drawer').style.display='none'">Hide</button>
        </div>
        <div style="max-height: 100px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">
          ${this.pinnedMessages.map((p, idx) => `
            <div style="font-size: 0.72rem; padding: 4px 6px; background: rgba(255,255,255,0.03); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
              <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 85%; color: var(--text-main);">${p.content.substring(0, 80)}...</span>
              <button class="btn btn-danger btn-xs" style="padding: 1px 4px; font-size: 0.65rem;" onclick="PlaygroundResponseHelper.unpinMessage(${idx})">Unpin</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  static unpinMessage(idx) {
    this.pinnedMessages.splice(idx, 1);
    this.renderPinnedDrawer();
    ModalDialog.showNotification('Message unpinned.', 'info');
  }

  static filterChatMessages(query) {
    const chatContainer = document.getElementById('chat-messages-container') || document.getElementById('chat-history');
    if (!chatContainer) return;
    const cards = chatContainer.querySelectorAll('.chat-message, .msg-card');
    const q = (query || '').toLowerCase();

    cards.forEach(card => {
      const text = card.innerText.toLowerCase();
      if (!q || text.includes(q)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }
}

window.PlaygroundResponseHelper = PlaygroundResponseHelper;

/**
 * public/js/views/playground/ChatSession.js
 * OOPS Model: Manages chat sessions data structures and storage synchronization.
 */

class ChatSession {
  static loadChatSessions() {
    try {
      const saved = localStorage.getItem('fmc_chat_sessions');
      const activeId = localStorage.getItem('fmc_active_session_id');
      if (saved) window.app.chatSessions = JSON.parse(saved);
      if (activeId) window.app.activeSessionId = activeId;
    } catch (e) {
      console.error('Error loading chat sessions:', e);
    }
  }

  static saveChatSessions() {
    try {
      if (window.app.chatSessions && window.app.activeSessionId) {
        const activeSession = window.app.chatSessions.find(s => s.id === window.app.activeSessionId);
        if (activeSession && window.app.chatHistory) {
          activeSession.messages = window.app.chatHistory;
        }
        localStorage.setItem('fmc_chat_sessions', JSON.stringify(window.app.chatSessions));
        localStorage.setItem('fmc_active_session_id', window.app.activeSessionId);
      }
    } catch (e) {
      console.error('Error saving chat sessions:', e);
    }
  }

  static setupAutoSave(autoSaveTimerRef, onSaveCallback) {
    const enabled = localStorage.getItem('fmc_autosave_enabled') !== 'false';
    const intervalMs = parseInt(localStorage.getItem('fmc_autosave_interval')) || 10000;
    
    if (enabled) {
      return setInterval(() => {
        onSaveCallback();
      }, intervalMs);
    }
    return null;
  }
}

window.ChatSession = ChatSession;

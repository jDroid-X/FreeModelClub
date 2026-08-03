/**
 * public/js/views/playground/ChatSessionViewModel.js
 * OOPS ViewModel: Manages conversational states, session selections, creations, and filters.
 */

class ChatSessionViewModel {
  static createNewSession(selectedModelId) {
    const newSession = {
      id: 'session_' + Date.now(),
      title: 'New Conversation',
      modelId: selectedModelId || '',
      systemPrompt: 'You are a helpful AI assistant.',
      temperature: 0.7,
      topP: 1.0,
      maxTokens: 4096,
      messages: [{
        role: 'assistant',
        content: 'New session started with real-time SSE streaming. How can I assist you?',
        variants: ['New session started with real-time SSE streaming. How can I assist you?'],
        activeVariantIdx: 0
      }]
    };
    window.app.chatSessions.push(newSession);
    window.app.activeSessionId = newSession.id;
    window.app.chatHistory = newSession.messages;
    window.app.selectedModelId = newSession.modelId;
    return newSession;
  }

  static switchSession(sessionId) {
    const session = window.app.chatSessions.find(s => s.id === sessionId);
    if (!session) return null;
    
    window.app.activeSessionId = sessionId;
    window.app.chatHistory = session.messages;
    window.app.selectedModelId = session.modelId || '';
    return session;
  }

  static deleteSession(sessionId, defaultModelId) {
    const idx = window.app.chatSessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return null;
    
    window.app.chatSessions.splice(idx, 1);
    if (window.app.chatSessions.length === 0) {
      // Re-initialize standard session
      const newSession = this.createNewSession(defaultModelId);
      return { sessions: window.app.chatSessions, activeSession: newSession };
    }
    
    // Switch to first remaining session if the deleted session was the active one
    if (window.app.activeSessionId === sessionId) {
      const activeSession = this.switchSession(window.app.chatSessions[0].id);
      return { sessions: window.app.chatSessions, activeSession };
    }
    
    return { sessions: window.app.chatSessions, activeSession: window.app.chatSessions.find(s => s.id === window.app.activeSessionId) };
  }

  static filterSessions(searchQuery) {
    const items = document.querySelectorAll('.session-item');
    const query = (searchQuery || '').toLowerCase().trim();
    items.forEach(el => {
      const title = (el.querySelector('.session-title')?.textContent || '').toLowerCase();
      if (title.includes(query)) {
        el.style.display = 'flex';
      } else {
        el.style.display = 'none';
      }
    });
  }
}

window.ChatSessionViewModel = ChatSessionViewModel;

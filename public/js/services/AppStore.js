/**
 * AppStore.js
 * Purpose: Centralized reactive state store and Pub/Sub EventBus for FreeModelsClub SPA.
 *          Unifies state across DashboardView, PlaygroundView, ModelClubView, SettingsView, and ProvidersView.
 * Dependencies: None (Vanilla JS)
 */

class AppStore {
  constructor() {
    this._state = {
      activeView: 'dashboard',
      selectedModel: localStorage.getItem('fmc_selected_model') || 'llama-3.3-70b-versatile',
      activeTheme: localStorage.getItem('fmc_theme') || 'titanium',
      currentUser: JSON.parse(localStorage.getItem('fmc_user') || 'null'),
      mustChangePassword: false,
      isOnline: true,
      activeProviderCount: 0,
      activeModelCount: 0,
      telemetry: {
        totalTokens: 0,
        requestsToday: 0,
        avgLatencyMs: 0
      },
      hitlModal: {
        isOpen: false,
        title: '',
        message: '',
        command: '',
        onApprove: null,
        onReject: null
      }
    };

    this._listeners = new Set();
    this._eventListeners = new Map();
  }

  /**
   * Retrieve current state snapshot or specific key
   */
  getState(key) {
    if (key) return this._state[key];
    return { ...this._state };
  }

  /**
   * Update state and notify all reactive subscribers
   */
  setState(updates) {
    if (!updates || typeof updates !== 'object') return;
    const prevState = { ...this._state };
    this._state = { ...this._state, ...updates };

    // Persist critical keys
    if (updates.selectedModel !== undefined) {
      localStorage.setItem('fmc_selected_model', updates.selectedModel);
    }
    if (updates.activeTheme !== undefined) {
      localStorage.setItem('fmc_theme', updates.activeTheme);
    }
    if (updates.currentUser !== undefined) {
      localStorage.setItem('fmc_user', JSON.stringify(updates.currentUser));
    }

    // Notify state subscribers
    this._notify(this._state, prevState);
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener (newState, prevState) => void
   * @returns {Function} unsubscribe function
   */
  subscribe(listener) {
    if (typeof listener === 'function') {
      this._listeners.add(listener);
    }
    return () => {
      this._listeners.delete(listener);
    };
  }

  _notify(newState, prevState) {
    for (const listener of this._listeners) {
      try {
        listener(newState, prevState);
      } catch (err) {
        console.error('[AppStore.notify] Listener error:', err);
      }
    }
  }

  /**
   * EventBus: Publish custom domain event
   */
  emit(eventName, data) {
    const handlers = this._eventListeners.get(eventName);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (err) {
          console.error(`[AppStore.emit] Error on event '${eventName}':`, err);
        }
      }
    }
  }

  /**
   * EventBus: Subscribe to custom domain event
   */
  on(eventName, handler) {
    if (!this._eventListeners.has(eventName)) {
      this._eventListeners.set(eventName, new Set());
    }
    this._eventListeners.get(eventName).add(handler);
    return () => {
      this._eventListeners.get(eventName)?.delete(handler);
    };
  }

  /**
   * Trigger Human-In-The-Loop (HITL) confirmation dialog
   */
  requestHITLConfirmation({ title, message, command, onApprove, onReject }) {
    this.setState({
      hitlModal: {
        isOpen: true,
        title: title || 'Human-In-The-Loop Confirmation Required',
        message: message || 'An automated agent action requests permission to execute.',
        command: command || '',
        onApprove: onApprove || (() => {}),
        onReject: onReject || (() => {})
      }
    });
    this.emit('HITL_REQUESTED', this._state.hitlModal);
  }

  closeHITLModal() {
    this.setState({
      hitlModal: {
        isOpen: false,
        title: '',
        message: '',
        command: '',
        onApprove: null,
        onReject: null
      }
    });
    this.emit('HITL_CLOSED', null);
  }
}

// Global Singleton instance
window.appStore = window.appStore || new AppStore();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.appStore;
}

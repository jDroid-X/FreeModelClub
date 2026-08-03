/**
 * public/js/views/playground/ParametersDrawerView.js
 * OOPS View: Manages sliding drawer UI, range sliders, and active settings elements.
 */

class ParametersDrawerView {
  static toggleParametersDrawer(forceShow) {
    const drawer = document.getElementById('chat-parameters-right-drawer');
    const mainWindow = document.getElementById('playground-chat-main-window');
    if (!drawer || !mainWindow) return;

    const isVisible = drawer.style.display !== 'none';
    const shouldShow = forceShow !== null ? forceShow : !isVisible;

    if (shouldShow) {
      drawer.style.display = 'flex';
      mainWindow.style.flex = '1';
      mainWindow.style.minWidth = '0';
    } else {
      drawer.style.display = 'none';
      mainWindow.style.flex = '1';
      mainWindow.style.minWidth = '0';
    }
  }

  static updateHyperDisplay(param, value) {
    if (param === 'temperature') {
      const el = document.getElementById('temp-val-display');
      const badge = document.getElementById('header-temp-badge');
      if (el) el.textContent = value;
      if (badge) badge.textContent = value;
    } else if (param === 'topP') {
      const el = document.getElementById('topp-val-display');
      if (el) el.textContent = value;
    } else if (param === 'maxTokens') {
      const el = document.getElementById('maxtokens-val-display');
      if (el) el.textContent = value;
    } else if (param === 'frequencyPenalty') {
      const el = document.getElementById('freqpen-val-display');
      if (el) el.textContent = value;
    } else if (param === 'presencePenalty') {
      const el = document.getElementById('prespen-val-display');
      if (el) el.textContent = value;
    }
  }
}

window.ParametersDrawerView = ParametersDrawerView;

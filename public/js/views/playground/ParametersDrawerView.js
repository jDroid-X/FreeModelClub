/**
 * public/js/views/playground/ParametersDrawerView.js
 * OOPS View: Manages sliding drawer UI, range sliders, and active settings elements.
 */

class ParametersDrawerView {
  static toggleParametersDrawer(forceShow) {
    const drawer = document.getElementById('chat-parameters-right-drawer');
    const mainWindow = document.getElementById('playground-chat-main-window') || document.getElementById('chat-workspace-pane');
    if (!drawer) return;

    const isVisible = drawer.style.opacity === '1' || (drawer.style.width && drawer.style.width !== '0px');
    const shouldShow = forceShow !== null && forceShow !== undefined ? forceShow : !isVisible;

    if (shouldShow) {
      drawer.style.width = '300px';
      drawer.style.minWidth = '260px';
      drawer.style.maxWidth = '360px';
      drawer.style.padding = '10px';
      drawer.style.borderLeft = '1px solid var(--border-color)';
      drawer.style.opacity = '1';
      drawer.style.pointerEvents = 'auto';
      if (mainWindow) {
        mainWindow.style.flex = '1 1 0%';
        mainWindow.style.minWidth = '280px';
      }
    } else {
      drawer.style.width = '0px';
      drawer.style.minWidth = '0px';
      drawer.style.maxWidth = '0px';
      drawer.style.padding = '0px';
      drawer.style.borderLeftWidth = '0px';
      drawer.style.opacity = '0';
      drawer.style.pointerEvents = 'none';
      if (mainWindow) {
        mainWindow.style.flex = '1 1 0%';
        mainWindow.style.minWidth = '0';
      }
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

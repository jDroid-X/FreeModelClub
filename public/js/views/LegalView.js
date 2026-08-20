class LegalView {
  static async render(container) {
    container.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header">
          <div class="panel-title"><i class="fa-solid fa-scale-balanced"></i> Legal & Privacy</div>
        </div>

        <div style="display: flex; gap: 16px; align-items: flex-start; margin-top: 12px;">
          <!-- Left 20% Width Navigation Rail -->
          <div class="glass-panel" style="width: 20%; min-width: 170px; flex-shrink: 0; padding: 10px; display: flex; flex-direction: column; gap: 6px; position: sticky; top: 10px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-light); text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-bottom: 4px;">
              <i class="fa-solid fa-layer-group"></i> Information
            </div>
            <button class="btn btn-secondary btn-sm toc-link" style="justify-content: flex-start; font-size: 0.72rem; padding: 6px; text-align: left; display: flex; align-items: center; gap: 4px;" onclick="app.navigate('about')">
              <i class="fa-solid fa-circle-info" style="color: var(--text-muted);"></i> <span>About jDroid-X</span>
            </button>
            <button class="btn btn-secondary btn-sm toc-link" style="justify-content: flex-start; font-size: 0.72rem; padding: 6px; text-align: left; display: flex; align-items: center; gap: 4px;" onclick="app.navigate('licenses')">
              <i class="fa-solid fa-id-card" style="color: var(--text-muted);"></i> <span>Licenses</span>
            </button>
            <button class="btn btn-secondary btn-sm toc-link active" style="justify-content: flex-start; font-size: 0.72rem; padding: 6px; text-align: left; display: flex; align-items: center; gap: 4px;" onclick="app.navigate('legal')">
              <i class="fa-solid fa-scale-balanced" style="color: var(--accent-cyan);"></i> <span>Legal & Privacy</span>
            </button>
          </div>

          <!-- Right 80% Width Detail Pane -->
          <div style="flex: 1; display: flex; flex-direction: column; gap: 20px;">
            
            <div class="glass-panel theme-card-tile" style="margin-bottom: 0; border-left: 4px solid var(--accent-rose); padding: 20px;">
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 12px;"><i class="fa-solid fa-triangle-exclamation"></i> Non-Affiliation Disclaimer</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 0;">
                Free Model Club is an independent jDroid-X application and is <strong>not affiliated with, endorsed by, or sponsored by</strong> OpenAI, Google, Anthropic, NVIDIA, Microsoft, Meta, xAI, or other third-party AI providers unless explicitly stated. All product names, logos, and brands are property of their respective owners.
              </p>
            </div>

            <div class="glass-panel theme-card-tile" style="margin-bottom: 0; border-left: 4px solid var(--accent-amber); padding: 20px;">
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 12px;"><i class="fa-solid fa-server"></i> Provider Guarantees</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 0;">
                Free Model Club does not guarantee the availability, performance, pricing, token limits, or free usage quotas of third-party AI providers or models. Provider policies, model availability, API limits, and pricing may change without notice. Users are responsible for complying with the terms and policies of each provider they use.
              </p>
            </div>

            <div class="glass-panel theme-card-tile" style="margin-bottom: 0; border-left: 4px solid var(--primary-light); padding: 20px;">
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 12px;"><i class="fa-solid fa-shield-halved"></i> Privacy & Data Storage</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 12px;">
                Free Model Club operates as a localhost service on your machine.
              </p>
              <ul style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; padding-left: 20px; margin-bottom: 0;">
                <li>Your API keys are stored strictly locally in the <code>data/</code> directory on your machine.</li>
                <li>Your chat history and configurations are stored in your browser's local storage and the local <code>data/</code> folder.</li>
                <li>Free Model Club does not transmit telemetry, prompts, or API keys to any centralized jDroid-X server.</li>
                <li>When you interact with models, your prompts are sent directly from your localhost server to the respective third-party API providers.</li>
              </ul>
            </div>

            <div class="glass-panel theme-card-tile" style="margin-bottom: 0; border-left: 4px solid var(--accent-cyan); padding: 20px;">
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 12px;"><i class="fa-solid fa-file-contract"></i> Terms of Use</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 0;">
                By using Free Model Club, you agree to use the software responsibly and in compliance with the Terms of Service of all third-party providers you connect to. You are solely responsible for securing your API keys and adhering to the usage limits imposed by those providers.
              </p>
            </div>

          </div>
        </div>
      </div>
    `;
  }
}

window.LegalView = LegalView;

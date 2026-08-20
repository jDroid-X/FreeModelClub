class LicensesView {
  static async render(container) {
    container.innerHTML = `
      <div class="glass-panel">
        <div class="panel-header">
          <div class="panel-title"><i class="fa-solid fa-id-card"></i> Open Source & Third-Party Licenses</div>
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
            <button class="btn btn-secondary btn-sm toc-link active" style="justify-content: flex-start; font-size: 0.72rem; padding: 6px; text-align: left; display: flex; align-items: center; gap: 4px;" onclick="app.navigate('licenses')">
              <i class="fa-solid fa-id-card" style="color: var(--accent-cyan);"></i> <span>Licenses</span>
            </button>
            <button class="btn btn-secondary btn-sm toc-link" style="justify-content: flex-start; font-size: 0.72rem; padding: 6px; text-align: left; display: flex; align-items: center; gap: 4px;" onclick="app.navigate('legal')">
              <i class="fa-solid fa-scale-balanced" style="color: var(--text-muted);"></i> <span>Legal & Privacy</span>
            </button>
          </div>

          <!-- Right 80% Width Detail Pane -->
          <div style="flex: 1; display: flex; flex-direction: column; gap: 20px;">
            
            <div class="glass-panel theme-card-tile" style="margin-bottom: 0; border-left: 4px solid var(--accent-emerald); padding: 20px;">
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 12px;"><i class="fa-solid fa-copyright"></i> Free Model Club</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Copyright &copy; ${new Date().getFullYear()} jDroid-X</p>
              
              <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; margin-bottom: 16px;">
                <div style="font-size: 0.9rem; font-weight: 600; color: var(--accent-cyan); margin-bottom: 4px;">jDroid-X Software License</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">Copyright &copy; ${new Date().getFullYear()} jDroid-X</div>
                <button class="btn btn-secondary btn-xs" onclick="window.open('https://github.com/jDroid-X/FreeModelClub/blob/main/LICENSE', '_blank')"><i class="fa-solid fa-arrow-up-right-from-square"></i> View Full License</button>
              </div>
            </div>

            <div class="glass-panel theme-card-tile" style="margin-bottom: 0; border-left: 4px solid var(--primary-light); padding: 20px;">
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 12px;"><i class="fa-solid fa-cubes"></i> Third-Party Software</h3>
              
              <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                  <tbody>
                    <tr style="border-bottom: 1px solid var(--border-color);">
                      <td style="padding: 8px 0; color: var(--text-main); font-weight: 600;">Node.js</td>
                      <td style="padding: 8px 0; color: var(--text-muted); text-align: right;">MIT</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--border-color);">
                      <td style="padding: 8px 0; color: var(--text-main); font-weight: 600;">Express</td>
                      <td style="padding: 8px 0; color: var(--text-muted); text-align: right;">MIT</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--border-color);">
                      <td style="padding: 8px 0; color: var(--text-main); font-weight: 600;">FontAwesome</td>
                      <td style="padding: 8px 0; color: var(--text-muted); text-align: right;">SIL OFL 1.1 / MIT</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: var(--text-main); font-weight: 600;">Google Fonts</td>
                      <td style="padding: 8px 0; color: var(--text-muted); text-align: right;">Apache License, v2.0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="glass-panel theme-card-tile" style="margin-bottom: 0; border-left: 4px solid var(--accent-amber); padding: 20px;">
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 12px;"><i class="fa-solid fa-network-wired"></i> AI Providers</h3>
              
              <p style="font-size: 0.85rem; color: var(--text-main); line-height: 1.6; margin-bottom: 10px;">
                Free Model Club does not own or redistribute third-party AI models unless explicitly stated.
              </p>
              <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 16px;">
                Model availability, pricing, quotas and API policies are controlled by their respective providers.
              </p>

              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted); cursor: pointer;" onclick="window.open('https://github.com/jDroid-X/FreeModelClub', '_blank')">Provider Terms</span>
                <span class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted); cursor: pointer;" onclick="window.open('https://github.com/jDroid-X/FreeModelClub', '_blank')">Privacy</span>
                <span class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted); cursor: pointer;" onclick="window.open('https://github.com/jDroid-X/FreeModelClub', '_blank')">Third-Party Notices</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  }
}

window.LicensesView = LicensesView;

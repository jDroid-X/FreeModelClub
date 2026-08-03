/**
 * LoginView.js
 * Purpose: Login screen & authentication view handler with show/hide password toggle
 */

class LoginView {
  static render() {
    const appEl = document.getElementById('app');
    appEl.innerHTML = `
      <div class="login-wrapper">
        <div class="login-card">
          <div class="login-icon"><i class="fa-solid fa-shield-halved"></i></div>
          <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 6px; color: var(--text-main);">FreeModelsClub</h1>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 24px;">
            Localhost OpenAI Compatible Smart Chatbot Service
          </p>

          <form id="login-form" onsubmit="LoginView.handleLogin(event)">
            <div class="form-group" style="text-align: left;">
              <label class="form-label">Email Address</label>
              <input type="email" id="login-email" class="form-control" value="FreeModelsClub@jdroidxy.com" required />
              <div class="field-hint"><i class="fa-solid fa-circle-info"></i> Pre-filled default login email</div>
            </div>

            <div class="form-group" style="text-align: left;">
              <label class="form-label">Password</label>
              <div style="position: relative;">
                <input type="password" id="login-password" class="form-control" value="Admin@1234" required />
                <button type="button" onclick="LoginView.togglePassword()" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer;">
                  <i class="fa-solid fa-eye" id="pass-toggle-icon"></i>
                </button>
              </div>
              <div class="field-hint"><i class="fa-solid fa-circle-info"></i> Default: Admin@1234</div>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px;">
              <i class="fa-solid fa-right-to-bracket"></i> Sign In to Localhost Service
            </button>
          </form>
        </div>
      </div>
    `;
  }

  static togglePassword() {
    const input = document.getElementById('login-password');
    const icon = document.getElementById('pass-toggle-icon');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fa-solid fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fa-solid fa-eye';
    }
  }

  static async handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const result = await ApiService.login(email, password);
    if (result.success) {
      localStorage.setItem('fmc_user', JSON.stringify(result.user));
      ModalDialog.showNotification('Successfully authenticated!', 'success');
      window.app.currentUser = result.user;
      window.app.init();
    } else {
      ModalDialog.showModal({
        title: 'Authentication Error',
        icon: 'fa-circle-xmark',
        body: `<span style="color: var(--accent-rose);">${result.message || 'Invalid credentials'}</span>`
      });
    }
  }
}

window.LoginView = LoginView;

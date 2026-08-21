/**
 * LoginView.js
 * Purpose: Login screen & authentication view handler with show/hide password toggle
 *          and mandatory first-login password rotation flow.
 */

class LoginView {
  static render() {
    let defaultEmail = 'FreeModelsClub@jdroidxy.com';
    try {
      const stored = localStorage.getItem('fmc_remembered_email') || (JSON.parse(localStorage.getItem('fmc_user') || 'null')?.email);
      if (stored) defaultEmail = stored;
    } catch (_) {}

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
              <input type="email" id="login-email" class="form-control" value="${defaultEmail}" required />
              <div class="field-hint"><i class="fa-solid fa-circle-info"></i> Pre-filled session login email</div>
            </div>

            <div class="form-group" style="text-align: left;">
              <label class="form-label">Password</label>
              <div style="position: relative;">
                <input type="password" id="login-password" class="form-control" placeholder="Enter password..." required />
                <button type="button" onclick="LoginView.togglePassword()" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer;">
                  <i class="fa-solid fa-eye" id="pass-toggle-icon"></i>
                </button>
              </div>
              <div class="field-hint"><i class="fa-solid fa-circle-info"></i> Default: Admin@1234</div>
            </div>

            <div class="form-group" style="text-align: left; margin-bottom: 24px;">
              <label style="display:flex; align-items:center; gap:8px; font-size: 0.88rem; color: var(--text-main); cursor: pointer;">
                <input type="checkbox" id="login-auto" checked /> 
                <strong>Remember Me (Auto Login)</strong>
              </label>
              <div class="field-hint"><i class="fa-solid fa-circle-info"></i> If unticked, password is required every session.</div>
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
      const isAutoLogin = document.getElementById('login-auto').checked;
      
      if (result.user.mustChangePassword) {
        LoginView.promptPasswordChange(email, password, isAutoLogin, result.user);
        return;
      }

      LoginView.finalizeLogin(result.user, isAutoLogin);
    } else {
      ModalDialog.showModal({
        title: 'Authentication Error',
        icon: 'fa-circle-xmark',
        body: `<span style="color: var(--accent-rose);">${result.message || 'Invalid credentials'}</span>`
      });
    }
  }

  static promptPasswordChange(email, currentPassword, isAutoLogin, userObj) {
    ModalDialog.showModal({
      title: 'Security Update: Set Master Password',
      icon: 'fa-key',
      body: `
        <div style="font-size: 0.85rem; color: var(--text-main); line-height: 1.6;">
          <p style="margin-bottom: 12px; color: var(--accent-amber);">
            <i class="fa-solid fa-triangle-exclamation"></i> <strong>Initial Login Security Requirement</strong>:
            You are logging in with default credentials. Please choose your personalized master password to secure your local AI gateway.
          </p>
          <div class="form-group" style="text-align: left; margin-bottom: 12px;">
            <label class="form-label">New Master Password</label>
            <input type="password" id="modal-new-pwd" class="form-control" placeholder="Min 6 characters..." />
          </div>
          <div class="form-group" style="text-align: left; margin-bottom: 16px;">
            <label class="form-label">Confirm New Password</label>
            <input type="password" id="modal-confirm-pwd" class="form-control" placeholder="Repeat new password..." />
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button class="btn btn-secondary" onclick="ModalDialog.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="LoginView.submitPasswordChange('${email}', '${currentPassword}', ${isAutoLogin})">
              <i class="fa-solid fa-lock"></i> Save & Continue
            </button>
          </div>
        </div>
      `
    });
  }

  static async submitPasswordChange(email, currentPassword, isAutoLogin) {
    const newPwd = document.getElementById('modal-new-pwd')?.value || '';
    const confirmPwd = document.getElementById('modal-confirm-pwd')?.value || '';

    if (!newPwd || newPwd.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    if (newPwd !== confirmPwd) {
      alert('Passwords do not match. Please re-enter.');
      return;
    }

    const res = await ApiService.changePassword(email, currentPassword, newPwd);
    if (res.success) {
      ModalDialog.closeModal();
      ModalDialog.showNotification('Master password set successfully!', 'success');
      LoginView.finalizeLogin({ email, role: 'admin', mustChangePassword: false }, isAutoLogin);
    } else {
      alert(res.message || 'Failed to update password.');
    }
  }

  static finalizeLogin(user, isAutoLogin) {
    if (user && user.email) {
      localStorage.setItem('fmc_remembered_email', user.email);
    }
    if (isAutoLogin) {
      localStorage.setItem('fmc_auto_login', 'true');
      localStorage.setItem('fmc_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fmc_auto_login');
      localStorage.removeItem('fmc_user');
      sessionStorage.setItem('fmc_user', JSON.stringify(user));
    }

    if (window.AppStore && window.AppStore.setState) {
      window.AppStore.setState({ currentUser: user });
    } else if (window.appStore && window.appStore.setState) {
      window.appStore.setState({ currentUser: user });
    }

    ModalDialog.showNotification('Successfully authenticated!', 'success');
    window.app.currentUser = user;
    window.app.init();
  }
}

window.LoginView = LoginView;

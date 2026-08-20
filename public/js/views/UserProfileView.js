/**
 * UserProfileView.js
 * Purpose: User Profile management screen with modern glass-panel design.
 */
class UserProfileView {
  static currentProfile = null;
  static isDirty = false;
  static avatarBase64 = null;

  static async render(container) {
    const user = UserProfileView.getCurrentUser();
    const userName = UserProfileView.getInitialName();
    const userEmail = user?.email || 'N/A';
    const userRole = user?.role || 'user';
    const createdAt = UserProfileView.formatDate(user?.createdAt);

    container.innerHTML = `
      <div class="profile-page">
        <div class="glass-panel profile-header">
          <div class="profile-header-content">
            <div class="profile-avatar-section">
              <div class="avatar-wrapper" onclick="UserProfileView.triggerAvatarUpload()">
                <div id="avatar-preview" class="avatar-circle">
                  ${UserProfileView.avatarBase64 ? '<img src="'+UserProfileView.avatarBase64+'" alt="Avatar">' : '<i class="fa-solid fa-user"></i>'}
                </div>
                <div class="avatar-upload-btn"><i class="fa-solid fa-camera"></i></div>
                <input type="file" id="avatar-input" accept="image/*" style="display: none;" onchange="UserProfileView.handleAvatarChange(event)">
              </div>
              <div class="profile-info">
                <h1 class="profile-name">${userName}</h1>
                <p class="profile-email"><i class="fa-solid fa-envelope"></i> ${userEmail}</p>
                <div class="profile-badges">
                  <span class="badge badge-${userRole}">${userRole.toUpperCase()}</span>
                  <span class="badge badge-success"><i class="fa-solid fa-check"></i> Verified</span>
                </div>
              </div>
            </div>
            <div class="profile-actions">
              <button class="btn btn-secondary" onclick="UserProfileView.loadProfile()"><i class="fa-solid fa-rotate"></i> Reset</button>
              <button class="btn btn-primary" id="save-profile-btn" disabled onclick="UserProfileView.saveProfile(event)"><i class="fa-solid fa-save"></i> Save Changes</button>
            </div>
          </div>
        </div>

        <div class="profile-grid">
          <div class="glass-panel profile-card">
            <div class="card-header"><i class="fa-solid fa-user-circle" style="color: var(--accent-cyan);"></i><h3>Personal Information</h3></div>
            <div class="card-body">
              <div class="form-row">
                <div class="form-group"><label><i class="fa-solid fa-user"></i> Full Name</label><input type="text" id="profile-name" class="form-input" value="${UserProfileView.getStoredValue('name')}" oninput="UserProfileView.markDirty()"></div>
                <div class="form-group"><label><i class="fa-solid fa-envelope"></i> Email</label><input type="email" id="profile-email" class="form-input" readonly value="${userEmail}" style="opacity: 0.6;"></div>
              </div>
              <div class="form-row">
                <div class="form-group"><label><i class="fa-solid fa-phone"></i> Phone</label><input type="tel" id="profile-phone" class="form-input" placeholder="+1 (555) 123-4567" value="${UserProfileView.getStoredValue('phone')}" oninput="UserProfileView.markDirty()"></div>
                <div class="form-group"><label><i class="fa-solid fa-calendar"></i> Date of Birth</label><input type="date" id="profile-dob" class="form-input" value="${UserProfileView.getStoredValue('dob')}" oninput="UserProfileView.markDirty()"></div>
              </div>
            </div>
          </div>

          <div class="glass-panel profile-card">
            <div class="card-header"><i class="fa-solid fa-location-dot" style="color: var(--accent-amber);"></i><h3>Address Details</h3></div>
            <div class="card-body">
              <div class="form-row full-width"><div class="form-group"><label><i class="fa-solid fa-road"></i> Street Address</label><input type="text" id="profile-address" class="form-input" placeholder="123 Main Street" value="${UserProfileView.getStoredValue('address')}" oninput="UserProfileView.markDirty()"></div></div>
              <div class="form-row">
                <div class="form-group"><label><i class="fa-solid fa-city"></i> City</label><input type="text" id="profile-city" class="form-input" placeholder="New York" value="${UserProfileView.getStoredValue('city')}" oninput="UserProfileView.markDirty()"></div>
                <div class="form-group"><label><i class="fa-solid fa-map-marker-alt"></i> State</label><input type="text" id="profile-state" class="form-input" placeholder="NY" value="${UserProfileView.getStoredValue('state')}" oninput="UserProfileView.markDirty()"></div>
              </div>
              <div class="form-row">
                <div class="form-group"><label><i class="fa-solid fa-globe"></i> Country</label>
                  <select id="profile-country" class="form-input" onchange="UserProfileView.markDirty()">
                    <option value="">Select Country</option>
                    <option value="US" ${UserProfileView.getStoredValue('country') === 'US' ? 'selected' : ''}>United States</option>
                    <option value="CA" ${UserProfileView.getStoredValue('country') === 'CA' ? 'selected' : ''}>Canada</option>
                    <option value="UK" ${UserProfileView.getStoredValue('country') === 'UK' ? 'selected' : ''}>United Kingdom</option>
                    <option value="IN" ${UserProfileView.getStoredValue('country') === 'IN' ? 'selected' : ''}>India</option>
                    <option value="DE" ${UserProfileView.getStoredValue('country') === 'DE' ? 'selected' : ''}>Germany</option>
                    <option value="FR" ${UserProfileView.getStoredValue('country') === 'FR' ? 'selected' : ''}>France</option>
                    <option value="JP" ${UserProfileView.getStoredValue('country') === 'JP' ? 'selected' : ''}>Japan</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="glass-panel profile-card">
            <div class="card-header"><i class="fa-solid fa-chart-line" style="color: var(--accent-emerald);"></i><h3>Account Statistics</h3></div>
            <div class="card-body">
              <div class="stats-grid">
                <div class="stat-item"><div class="stat-icon" style="background: rgba(59,130,246,0.1);"><i class="fa-solid fa-id-badge" style="color: #3b82f6;"></i></div><div class="stat-content"><div class="stat-label">User ID</div><div class="stat-value" style="font-family:monospace;font-size:0.8rem;">${user?.id || 'N/A'}</div></div></div>
                <div class="stat-item"><div class="stat-icon" style="background: rgba(16,185,129,0.1);"><i class="fa-solid fa-crown" style="color: #10b981;"></i></div><div class="stat-content"><div class="stat-label">Role</div><div class="stat-value">${userRole}</div></div></div>
                <div class="stat-item"><div class="stat-icon" style="background: rgba(245,158,11,0.1);"><i class="fa-solid fa-calendar-plus" style="color: #f59e0b;"></i></div><div class="stat-content"><div class="stat-label">Member Since</div><div class="stat-value">${createdAt}</div></div></div>
                <div class="stat-item"><div class="stat-icon" style="background: rgba(6,182,212,0.1);"><i class="fa-solid fa-shield-halved" style="color: #06b6d4;"></i></div><div class="stat-content"><div class="stat-label">Status</div><div class="stat-value" style="color:var(--accent-emerald);">Verified</div></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    await UserProfileView.loadProfile();
  }

  static getCurrentUser() { try { return JSON.parse(localStorage.getItem('fmc_user') || sessionStorage.getItem('fmc_user') || 'null'); } catch (e) { return null; } }
  static getStoredValue(field) { return localStorage.getItem(`fmc_profile_${field}`) || ''; }
  static markDirty() { UserProfileView.isDirty = true; const b=document.getElementById('save-profile-btn'); if(b){b.disabled=false;b.innerHTML='<i class=\"fa-solid fa-save\"></i> Save Changes <span class=\"save-indicator\">●</span>';} }
  
  static async loadProfile() {
    const user = UserProfileView.getCurrentUser();
    if (!user) return;
    UserProfileView.currentProfile = null;
    UserProfileView.isDirty = false;
    try {
      const res = await fetch(`/api/user/profile?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data?.id) { UserProfileView.currentProfile = data; UserProfileView.populateForm(data); return; }
    } catch (e) { console.warn('API failed:', e); }
    UserProfileView.populateForm({
      name: UserProfileView.getStoredValue('name'), phone: UserProfileView.getStoredValue('phone'),
      address: UserProfileView.getStoredValue('address'), city: UserProfileView.getStoredValue('city'),
      state: UserProfileView.getStoredValue('state'), country: UserProfileView.getStoredValue('country'),
      dob: UserProfileView.getStoredValue('dob'), avatar: UserProfileView.getStoredValue('avatar')
    });
  }

  static populateForm(data) {
    document.getElementById('profile-name').value = data.name || '';
    document.getElementById('profile-phone').value = data.phone || '';
    document.getElementById('profile-address').value = data.address || '';
    document.getElementById('profile-city').value = data.city || '';
    document.getElementById('profile-state').value = data.state || '';
    document.getElementById('profile-country').value = data.country || '';
    document.getElementById('profile-dob').value = data.dob || '';
    if (data.avatar) { UserProfileView.avatarBase64 = data.avatar; const p=document.getElementById('avatar-preview'); if(p)p.innerHTML=`<img src="${data.avatar}">`; }
    if (data.name) { const n=document.querySelector('.profile-name'); if(n)n.textContent=data.name; }
    UserProfileView.isDirty = false;
    const b=document.getElementById('save-profile-btn'); if(b){b.disabled=true;b.innerHTML='<i class="fa-solid fa-save"></i> Save Changes';}
  }

  static async saveProfile(event) {
    event.preventDefault();
    const user = UserProfileView.getCurrentUser();
    if (!user) { ModalDialog.showNotification('No user logged in.', 'error'); return; }
    const profileData = {
      id: UserProfileView.currentProfile?.id || user.id, email: user.email,
      name: document.getElementById('profile-name').value.trim(),
      phone: document.getElementById('profile-phone').value.trim(),
      address: document.getElementById('profile-address').value.trim(),
      city: document.getElementById('profile-city').value.trim(),
      state: document.getElementById('profile-state').value.trim(),
      country: document.getElementById('profile-country').value,
      dob: document.getElementById('profile-dob').value,
      avatar: UserProfileView.avatarBase64, emailVerified: true, role: user.role,
      createdAt: UserProfileView.currentProfile?.createdAt || user.createdAt
    };
    try {
      const res = await fetch('/api/user/profile', { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(profileData) });
      const data = await res.json();
      if (data.success) {
        Object.keys(profileData).forEach(k => { if(!['id','email','password','role','createdAt'].includes(k)) localStorage.setItem(`fmc_profile_${k}`, profileData[k]); });
        UserProfileView.avatarBase64 = null;
        ModalDialog.showNotification('Profile saved successfully!', 'success');
        UserProfileView.isDirty = false;
        const b=document.getElementById('save-profile-btn'); if(b){b.disabled=true;b.innerHTML='<i class="fa-solid fa-save"></i> Save Changes';}
      } else { ModalDialog.showNotification(data.message || 'Failed to save profile.', 'error'); }
    } catch (e) { ModalDialog.showNotification('Error: ' + e.message, 'error'); }
  }

  static triggerAvatarUpload() { document.getElementById('avatar-input').click(); }
  static handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { ModalDialog.showNotification('Image must be less than 2MB.', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = (e) => { UserProfileView.avatarBase64 = e.target.result; const p=document.getElementById('avatar-preview'); if(p)p.innerHTML=`<img src="${e.target.result}">`; UserProfileView.markDirty(); };
    reader.readAsDataURL(file);
  }
  static getInitialName() { const u=UserProfileView.getCurrentUser(); return u?.name || u?.email?.split('@')[0] || 'User'; }
  static formatDate(d) { return d ? new Date(d).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'}) : 'N/A'; }
}
window.UserProfileView = UserProfileView;

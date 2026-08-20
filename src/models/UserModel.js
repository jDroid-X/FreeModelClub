/**
 * UserModel.js
 * Purpose: Manages user authentication, profile security, password lifecycle, and audit logs.
 * Dependencies: Database
 */

const db = require('./Database');

class UserModel {
  static authenticate(email, password) {
    const users = db.read(db.files.users);
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );
    if (user) {
      // Record login system audit log
      db.write(db.files.system_logs, [
        ...db.read(db.files.system_logs),
        {
          id: `sys_auth_${Date.now()}`,
          timestamp: new Date().toISOString(),
          category: 'USER_AUTH',
          level: 'INFO',
          message: `User ${user.email} authenticated successfully.`,
          details: { email: user.email, role: user.role }
        }
      ]);
      return { 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role, 
          mustChangePassword: Boolean(user.mustChangePassword) 
        } 
      };
    }
    return { success: false, message: 'Invalid email or password.' };
  }

  static changePassword(email, currentPassword, newPassword) {
    if (!email || !currentPassword || !newPassword) {
      return { success: false, message: 'All fields are required.' };
    }
    if (newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }
    const users = db.read(db.files.users);
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (userIndex === -1) {
      return { success: false, message: 'User not found.' };
    }
    if (users[userIndex].password !== currentPassword) {
      return { success: false, message: 'Current password is incorrect.' };
    }
    users[userIndex].password = newPassword;
    users[userIndex].mustChangePassword = false;
    users[userIndex].updatedAt = new Date().toISOString();
    db.write(db.files.users, users);

    db.write(db.files.system_logs, [
      ...db.read(db.files.system_logs),
      {
        id: `sys_pwd_change_${Date.now()}`,
        timestamp: new Date().toISOString(),
        category: 'USER_AUTH',
        level: 'INFO',
        message: `Password changed for user ${users[userIndex].email}.`
      }
    ]);

    return { success: true, message: 'Password updated successfully.' };
  }

  static getDefaultUser() {
    const users = db.read(db.files.users);
    return users[0] || { email: 'FreeModelsClub@jdroidxy.com' };
  }

  /** Returns all users (used by AuthController.getUserProfile). */
  static getAllUsers() {
    return db.read(db.files.users) || [];
  }
}

module.exports = UserModel;

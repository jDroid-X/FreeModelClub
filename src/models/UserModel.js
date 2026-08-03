/**
 * UserModel.js
 * Purpose: Manages user authentication & default credentials (FreeModelsClub@jdroidxy.com)
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
      return { success: true, user: { id: user.id, email: user.email, role: user.role } };
    }
    return { success: false, message: 'Invalid credentials. Use default: FreeModelsClub@jdroidxy.com / Admin@1234' };
  }

  static getDefaultUser() {
    const users = db.read(db.files.users);
    return users[0] || { email: 'FreeModelsClub@jdroidxy.com' };
  }
}

module.exports = UserModel;

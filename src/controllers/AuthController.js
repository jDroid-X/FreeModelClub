/**
 * AuthController.js
 * Purpose: Handles user authentication, password changes, and profile diagnostics
 * Dependencies: UserModel
 */

const UserModel = require('../models/UserModel');

class AuthController {
  static login(req, res) {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required. Default: FreeModelsClub@jdroidxy.com / Admin@1234'
      });
    }

    const result = UserModel.authenticate(email, password);
    if (result.success) {
      return res.json({
        success: true,
        message: 'Authentication successful',
        user: result.user
      });
    } else {
      return res.status(401).json(result);
    }
  }

  static changePassword(req, res) {
    const { email, currentPassword, newPassword } = req.body || {};
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, current password, and new password are required.'
      });
    }

    const result = UserModel.changePassword(email, currentPassword, newPassword);
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  }

  static getDefaultCredentials(req, res) {
    return res.json({
      defaultEmail: 'FreeModelsClub@jdroidxy.com',
      defaultPassword: 'Admin@1234'
    });
  }

  /**
   * GET /v1/api/user/profile
   * Returns the first registered user's profile including emailVerified flag.
   */
  static getUserProfile(req, res) {
    try {
      const users = UserModel.getAllUsers ? UserModel.getAllUsers() : [];
      const profile = users.length > 0 ? users[0] : null;
      if (!profile) {
        return res.json({ emailVerified: false, email: null, registered: false });
      }
      return res.json({
        emailVerified: !!(profile.email && profile.emailVerified),
        email: profile.email || null,
        name:  profile.name  || null,
        registered: true
      });
    } catch (e) {
      console.error('[AuthController.getUserProfile]', e.message);
      return res.status(500).json({ emailVerified: false, error: e.message });
    }
  }
}

module.exports = AuthController;

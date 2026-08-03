/**
 * AuthController.js
 * Purpose: Handles user authentication for login screen
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

  static getDefaultCredentials(req, res) {
    return res.json({
      defaultEmail: 'FreeModelsClub@jdroidxy.com',
      defaultPassword: 'Admin@1234'
    });
  }
}

module.exports = AuthController;

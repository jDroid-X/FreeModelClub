/**
 * HelpController.js
 * Purpose: API endpoints for User Manual (HIL steps), screen hints, and help docs
 * Dependencies: HelpModel
 */

const HelpModel = require('../models/HelpModel');

class HelpController {
  static getManual(req, res) {
    const manual = HelpModel.getUserManual();
    return res.json({
      success: true,
      manual
    });
  }

  static getScreenHints(req, res) {
    const hints = HelpModel.getScreenHints();
    return res.json({
      success: true,
      hints
    });
  }
}

module.exports = HelpController;

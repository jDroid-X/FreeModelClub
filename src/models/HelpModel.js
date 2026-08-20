/**
 * HelpModel.js
 * Purpose: Manages User Manual, Human-In-Loop (HIL) operational steps, screen hints, and FAQ docs
 * Dependencies: Database
 */

const db = require('./Database');

class HelpModel {
  static getUserManual() {
    return db.read(db.files.user_manual);
  }

  static getScreenHints() {
    return db.read(db.files.help_docs);
  }

  static getHintForScreen(screenName) {
    const hints = db.read(db.files.help_docs);
    return hints[screenName] || '💡 HINT: Manage and inspect your localhost AI service proxy on port 12247.';
  }
}

module.exports = HelpModel;

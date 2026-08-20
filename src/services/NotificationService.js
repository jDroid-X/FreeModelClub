// src/services/NotificationService.js
/**
 * NotificationService.js
 * Purpose: Provides a simple middleware to send structured notifications from server to client.
 * Dependencies: none
 */

function notificationMiddleware(req, res, next) {
  /**
   * Send a notification response.
   * @param {string} type - one of 'success', 'error', 'info', 'warning'
   * @param {string} message - human‑readable message
   * @param {object} [payload] - optional additional data to merge into the response
   */
  res.notify = (type, message, payload = {}) => {
    const response = {
      success: type === 'success',
      type,
      message,
      ...payload,
    };
    // If headers already sent, fall back to json
    if (res.headersSent) {
      return res.json(response);
    }
    return res.json(response);
  };
  next();
}

module.exports = { middleware: notificationMiddleware };

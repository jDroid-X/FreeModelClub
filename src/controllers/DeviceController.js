/**
 * DeviceController.js
 * Purpose: Exposes the server-generated device ID via REST API.
 *          GET /v1/api/device → returns { deviceId, createdAt }
 * Dependencies: DeviceService
 */
const DeviceService = require('../services/DeviceService');

class DeviceController {
  static getDevice(req, res) {
    try {
      const deviceId = DeviceService.getDeviceId();
      return res.json({ deviceId, createdAt: new Date().toISOString() });
    } catch (e) {
      console.error('[DeviceController]', e.message);
      return res.status(500).json({ error: { message: 'Failed to retrieve device ID', code: 500 } });
    }
  }
}

module.exports = DeviceController;

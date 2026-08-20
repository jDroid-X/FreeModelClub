/**
 * DeviceService.js (Backend / Node.js)
 * Purpose: Generates and persists a hardware-based device identifier.
 *          Uses machine fingerprinting (MAC, CPU, Memory, OS) for stability.
 *          Stored in data/device_key.json as single source of truth.
 * Dependencies: fs, path, crypto, os
 */
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const os   = require('os');

const KEY_FILE = path.join(__dirname, '../../data/device_key.json');

class DeviceService {
  /**
   * Returns the persistent device ID.
   * Creates + saves a new one based on hardware fingerprint if file is missing.
   */
  static getDeviceId() {
    try {
      if (fs.existsSync(KEY_FILE)) {
        const raw = fs.readFileSync(KEY_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.deviceId && String(parsed.deviceId).length >= 12) {
          return parsed.deviceId;
        }
      }
    } catch (e) {
      console.warn('[DeviceService] device_key.json read error — regenerating.', e.message);
    }

    // Generate hardware-fingerprinted device ID
    const id = this._generateHardwareId();
    this._persist(id);
    return id;
  }

  /**
   * Generates a deterministic 16-character hex ID from hardware attributes.
   * Changes only when physical hardware changes.
   */
  static _generateHardwareId() {
    const parts = [
      this._getPrimaryMac(),
      os.cpus()[0]?.model || 'unknown-cpu',
      os.totalmem().toString(),
      os.type() + os.release(),
      os.hostname()
    ];

    // Create stable fingerprint using SHA256
    const hash = crypto.createHash('sha256')
      .update(parts.join('|'))
      .digest('hex')
      .substring(0, 16);

    return hash;
  }

  /**
   * Gets primary non-loopback IPv4 MAC address.
   * Returns 'no-mac' if none found.
   */
  static _getPrimaryMac() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal && iface.mac !== '00:00:00:00:00:00') {
          return iface.mac;
        }
      }
    }
    return 'no-mac';
  }

  /** Overwrites data/device_key.json with the hardware-based device ID. */
  static _persist(deviceId) {
    try {
      fs.writeFileSync(KEY_FILE, JSON.stringify({
        deviceId,
        createdAt: new Date().toISOString(),
        fingerprint: {
          hostname: os.hostname(),
          mac: this._getPrimaryMac(),
          cpu: os.cpus()[0]?.model?.substring(0, 30),
          memGb: (os.totalmem() / 1024 ** 3).toFixed(2),
          platform: `${os.type()} ${os.release()}`
        }
      }, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DeviceService] Failed to write device_key.json:', e.message);
    }
  }
}

module.exports = DeviceService;

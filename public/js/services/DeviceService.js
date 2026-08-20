/**
 * DeviceService.js (Frontend / Browser)
 * Purpose: Generates & persists a 12-16 digit device identifier for this browser/device.
 *          Calls /v1/api/device (GET) to retrieve server-persisted ID on first boot.
 *          Falls back to local random generation if endpoint is unavailable.
 * Dependencies: None (standalone browser-safe service)
 */
class DeviceService {
  static _KEY = 'fmc_device_id';

  /**
   * Returns the device ID. Priority:
   *   1. localStorage (fastest, no network)
   *   2. Server endpoint /v1/api/device (cross-session persistence)
   *   3. Local fallback generation (12 digits)
   */
  static async getDeviceId() {
    const stored = localStorage.getItem(this._KEY);
    if (stored && stored.length >= 12) return stored;

    try {
      const res = await fetch('/v1/api/device', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.deviceId) {
          localStorage.setItem(this._KEY, data.deviceId);
          return data.deviceId;
        }
      }
    } catch (e) {
      console.warn('[DeviceService] Server endpoint unavailable, using local fallback.', e);
    }

    // Fallback: 12-digit numeric ID
    const fallback = String(Date.now()).slice(-12).padStart(12, '0');
    localStorage.setItem(this._KEY, fallback);
    return fallback;
  }

  /** Returns the current stored device ID synchronously (may be null on very first load). */
  static getDeviceIdSync() {
    return localStorage.getItem(this._KEY) || null;
  }

  /** Forces a fresh server fetch and re-persists the ID. */
  static async refresh() {
    localStorage.removeItem(this._KEY);
    return this.getDeviceId();
  }
}

// Expose globally for use in views and components
window.DeviceService = DeviceService;

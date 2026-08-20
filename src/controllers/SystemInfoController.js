/**
 * SystemInfoController.js
 * Purpose: Exposes system hardware & environment information for the About page.
 */
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const DeviceService = require('../services/DeviceService');

class SystemInfoController {
  static getSystemInfo(req, res) {
    try {
      const totalMemGb = (os.totalmem() / (1024 ** 3)).toFixed(2);
      const freeMemGb = (os.freemem() / (1024 ** 3)).toFixed(2);
      const appDir = path.resolve(__dirname, '../..');
      const nodeVer = process.version;
      const platform = `${os.type()} ${os.release()}`;
      const arch = os.arch();
      const cpus = os.cpus();
      const coreCount = cpus.length;
      const cpuModel = cpus[0]?.model || 'Unknown';
      const uptimeSec = Math.floor(process.uptime());
      const uptimeMin = Math.floor(uptimeSec / 60);
      const uptimeH = Math.floor(uptimeMin / 60);
      const uptimeStr = uptimeH > 0 ? `${uptimeH}h ${uptimeMin % 60}m` : `${uptimeMin}m`;
      const hostname = os.hostname();
      const loginUser = os.userInfo()?.username || 'unknown';

      // Use hardware-based device ID from DeviceService
      const deviceId = DeviceService.getDeviceId();

      // Collect all network interfaces
      const allInterfaces = os.networkInterfaces();
      const ipv4Addresses = [];
      const ipv6Addresses = [];
      const macAddresses = [];

      for (const [name, ifaceList] of Object.entries(allInterfaces)) {
        for (const iface of ifaceList) {
          if (!iface.internal) {
            if (iface.family === 'IPv4') {
              ipv4Addresses.push({ address: iface.address, mac: iface.mac, interface: name });
            } else if (iface.family === 'IPv6') {
              ipv6Addresses.push({ address: iface.address, mac: iface.mac, interface: name });
            }
            if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
              macAddresses.push({ mac: iface.mac, interface: name });
            }
          }
        }
      }

      // Get BIOS UUID from Windows Registry
      let biosUuid = 'N/A';
      try {
        const regQuery = execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid', { encoding: 'utf8', windowsHide: true });
        const match = regQuery.match(/MachineGuid\s+REG_SZ\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
        if (match) biosUuid = match[1];
      } catch (e) {
        biosUuid = 'Registry Access Denied';
      }

      res.json({
        deviceId,
        biosUuid,
        platform,
        arch,
        hostname,
        loginUsername: loginUser,
        appDirectory: appDir,
        nodeVersion: nodeVer,
        cpuModel,
        cpuCores: coreCount,
        totalMemoryGb: totalMemGb,
        freeMemoryGb: freeMemGb,
        uptimeStr,
        ipv4Addresses,
        ipv6Addresses,
        macAddresses,
        primaryIP: ipv4Addresses[0]?.address || '127.0.0.1',
        primaryMac: macAddresses[0]?.mac || 'N/A',
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('[SystemInfoController]', e.message);
      return res.status(500).json({ error: e.message });
    }
  }
}

module.exports = SystemInfoController;

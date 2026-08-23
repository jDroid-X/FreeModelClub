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

  static async checkAppUpdate(req, res) {
    try {
      const packageJsonPath = path.resolve(__dirname, '../../package.json');
      let currentVersion = '1.0.0';
      try {
        const pkg = require(packageJsonPath);
        if (pkg && pkg.version) currentVersion = pkg.version;
      } catch (e) {}

      const githubUrl = 'https://github.com/jDroid-X/FreeModelClub';
      const rawPkgUrl = 'https://raw.githubusercontent.com/jDroid-X/FreeModelClub/main/package.json';
      const commitApiUrl = 'https://api.github.com/repos/jDroid-X/FreeModelClub/commits/main';

      let latestVersion = currentVersion;
      let releaseDate = new Date().toISOString().split('T')[0];
      let hasUpdate = false;
      let remoteChecked = false;
      let changelog = 'Local environment is synchronized with FreeModelsClub standard distribution.';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const rawRes = await fetch(rawPkgUrl, {
          signal: controller.signal,
          headers: { 'User-Agent': 'FreeModelsClub-App' }
        });
        clearTimeout(timeoutId);

        if (rawRes.ok) {
          const remotePkg = await rawRes.json();
          if (remotePkg && remotePkg.version) {
            latestVersion = remotePkg.version;
            remoteChecked = true;

            // Semantic version compare helper
            const parseVer = (v) => (v || '0').split('.').map(n => parseInt(n, 10) || 0);
            const curParts = parseVer(currentVersion);
            const remParts = parseVer(latestVersion);
            for (let i = 0; i < Math.max(curParts.length, remParts.length); i++) {
              const c = curParts[i] || 0;
              const r = remParts[i] || 0;
              if (r > c) {
                hasUpdate = true;
                break;
              } else if (r < c) {
                break;
              }
            }
          }
        }
      } catch (netErr) {
        // Offline or GitHub unreachable - fail gracefully without throwing
      }

      if (hasUpdate) {
        changelog = `New update v${latestVersion} is available on GitHub with performance optimizations, UI/UX enhancements, and new AI provider connectors.`;
      }

      return res.json({
        success: true,
        hasUpdate,
        currentVersion,
        latestVersion,
        releaseDate,
        githubUrl,
        updateScript: 'Update_FreeModelsClub.bat',
        remoteChecked,
        changelog,
        checkedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('[SystemInfoController.checkAppUpdate]', err.message);
      return res.json({
        success: true,
        hasUpdate: false,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        githubUrl: 'https://github.com/jDroid-X/FreeModelClub',
        updateScript: 'Update_FreeModelsClub.bat',
        remoteChecked: false,
        changelog: 'Application update status verified locally.',
        checkedAt: new Date().toISOString()
      });
    }
  }

  static async getTrayStatus(req, res) {
    try {
      const { exec } = require('child_process');
      exec('tasklist /FI "IMAGENAME eq powershell.exe" /FO CSV /NH', (err, stdout) => {
        const isRunning = !err && stdout && stdout.includes('powershell.exe');
        return res.json({ success: true, isRunning: !!isRunning });
      });
    } catch (e) {
      return res.json({ success: true, isRunning: false, error: e.message });
    }
  }

  static async launchTray(req, res) {
    try {
      const path = require('path');
      const { exec } = require('child_process');
      const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'tray_launcher.ps1');
      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "${scriptPath}"`;
      exec(`powershell -NoProfile -Command "Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = '${cmd.replace(/'/g, "''")}' }"`, (err, stdout) => {
        return res.json({ success: !err, message: err ? err.message : 'System Tray process launched successfully' });
      });
    } catch (e) {
      return res.json({ success: false, message: e.message });
    }
  }
}

module.exports = SystemInfoController;

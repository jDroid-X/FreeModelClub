/**
 * server.js
 * Purpose: Master Express server entry point running on port 12247
 *          Mounts standard OpenAI API endpoints, MVC routes, Help routes, and Frontend UI
 * Dependencies: express, cors, body-parser, path, compression, express-rate-limit
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/authRoutes');
const providerRoutes = require('./src/routes/providerRoutes');
const modelRoutes = require('./src/routes/modelRoutes');
const openaiRoutes = require('./src/routes/openaiRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const integrationRoutes = require('./src/routes/integrationRoutes');
const helpRoutes = require('./src/routes/helpRoutes');
const validationRoutes = require('./src/routes/validationRoutes');
const jDroidXRoutes = require('./src/routes/jDroidXRoutes');
const LogModel = require('./src/models/LogModel');
const themeRoutes = require('./src/routes/themeRoutes');
const ProviderMonitorAgent = require('./src/services/ProviderMonitorAgent');
const SystemInfoController = require('./src/controllers/SystemInfoController');
const UserController = require('./src/controllers/UserController');

const app = express();
const PORT = process.env.PORT || 12247;

// High-Performance Outbound Socket Pooling (Reuses TCP/TLS connections for cloud LLMs)
const http = require('http');
const https = require('https');
http.globalAgent.keepAlive = true;
http.globalAgent.maxSockets = 100;
https.globalAgent.keepAlive = true;
https.globalAgent.maxSockets = 100;

// Global Exception Resilience Handlers (Rule #10: Continuous Server Uptime)
process.on('uncaughtException', (err) => {
  console.error('[SERVER_UNCAUGHT_EXCEPTION]', err.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[SERVER_UNHANDLED_REJECTION]', reason?.message || reason);
});

// Initialize Background Agents (Parallel)
ProviderMonitorAgent.init();

// Log Rotation: Archive old logs on startup + schedule daily rotation (every 24h)
const LogRotationService = require('./src/services/LogRotationService');
try {
  const rotationResult = LogRotationService.rotateAll();
  const totalArchived = (rotationResult.api_logs.archived || 0) + (rotationResult.system_logs.archived || 0);
  if (totalArchived > 0) console.log(`[Server] Log rotation: Archived ${totalArchived} old log entries on startup.`);
  LogRotationService.cleanupOldArchives();
} catch (err) {
  console.error('[Server] Log rotation error:', err.message);
}
// Schedule daily log rotation (every 24 hours)
setInterval(() => {
  try {
    LogRotationService.rotateAll();
    LogRotationService.cleanupOldArchives();
  } catch (err) {
    console.error('[Server] Scheduled log rotation error:', err.message);
  }
}, 24 * 60 * 60 * 1000);

// Middleware — Performance: Gzip/Brotli compression (~60-70% payload reduction)
app.use(compression({ level: 6, threshold: 1024 }));

// Zero-Trust CORS Policy: Restrict to localhost, 127.0.0.1, IDE webviews, or non-browser API clients
const allowedOriginPatterns = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^vscode-webview:\/\//,
  /^file:\/\//
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, python scripts, vscode backend, direct tools)
    if (!origin) return callback(null, true);
    const isAllowed = allowedOriginPatterns.some(pattern => pattern.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by FreeModelsClub Zero-Trust CORS Security Policy'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Notification Service Middleware (provides res.notify for controllers)
const NotificationService = require('./src/services/NotificationService');
app.use(NotificationService.middleware);

// API Rate Limiting — Prevents request flooding compounding JSON I/O bottleneck
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1-minute window
  max: 120,           // Max 120 API requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Rate limit exceeded. Max 120 requests per minute.', code: 429 } }
});
app.use('/api', apiLimiter);
app.use('/v1', apiLimiter);

// Middleware to handle URL path normalization (e.g., rewriting /v1/v1/chat/completions to /v1/chat/completions)
app.use((req, res, next) => {
  if (req.url.startsWith('/v1/v1/')) {
    req.url = req.url.substring(3);
  }
  if (req.url === '/api/tags' || req.url === '/api/chat' || req.url === '/api/generate' || req.url === '/api/version') {
    return next(); // Preserve exact Ollama/jDroidX endpoints
  }
  if (req.url.startsWith('/chat/completions')) {
    req.url = '/v1' + req.url;
  }
  if (req.url.startsWith('/messages')) {
    req.url = '/v1' + req.url;
  }
  if (req.url.startsWith('/api/v1/')) {
    req.url = '/v1/' + req.url.substring(8);
  }
  next();
});

// Static Frontend Asset Delivery with no-cache headers for instant hard refresh updates
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

app.get('/jdroidxlogo.png', (req, res) => res.sendFile(path.join(__dirname, 'public', 'jdroidxlogo.png')));
app.get('/favicon.ico', (req, res) => res.sendFile(path.join(__dirname, 'public', 'favicon.ico')));

// Self-Healing Playground Routes
const SelfHealingController = require('./src/controllers/SelfHealingController');
app.post('/api/playground/self-heal/detect', SelfHealingController.detect);
app.post('/api/playground/self-heal/apply', SelfHealingController.apply);
app.post('/api/playground/create-folder', SelfHealingController.createFolder);
app.post('/api/playground/select-workspace', SelfHealingController.selectWorkspaceFolder);
app.post('/api/playground/select-file', SelfHealingController.selectLocalFile);
app.post('/api/playground/web-search', SelfHealingController.runWebSearch);
app.post('/api/playground/youtube-transcript', SelfHealingController.runYouTubeTranscript);
app.post('/api/playground/generate-image', SelfHealingController.generateImageArtifact);
app.post('/api/playground/save-code', SelfHealingController.saveCodeFile);
app.post('/api/playground/read-file', SelfHealingController.readFileContent);
app.post('/api/playground/run-powershell', SelfHealingController.runPowerShell);
app.post('/api/playground/extract-image-text', SelfHealingController.extractImageText);
app.post('/api/playground/browse-local', SelfHealingController.browseLocalPath);

// Explicit Model Status Audit API Routes
const LogController = require('./src/controllers/LogController');
app.get('/api/reports/modelstatus', LogController.getModelStatus);
app.post('/api/reports/monitoringconfig', LogController.setMonitoringConfig);

// Blacklist Management & Circuit Breaker Routes
app.get('/api/providers/blacklisted', SelfHealingController.getBlacklistedProviders);
app.post('/api/providers/unblacklist', SelfHealingController.unblacklistProvider);
app.post('/api/providers/unblacklist-all', SelfHealingController.unblacklistAllProviders);
app.delete('/api/providers/blacklisted/all', SelfHealingController.unblacklistAllProviders);
app.delete('/api/providers/blacklisted/:id', (req, res) => {
  req.body = { providerId: req.params.id };
  SelfHealingController.unblacklistProvider(req, res);
});
app.post('/api/providers/blacklist-config', SelfHealingController.setBlacklistConfig);

// System Info & User Profile Routes
app.get('/api/system/info', SystemInfoController.getSystemInfo);
app.get('/api/system/logs', LogController.getSystemLogs);
app.get('/api/user/profiles', UserController.getUsers);
app.get('/api/user/profile', UserController.getUserByEmail);
app.put('/api/user/profile', UserController.updateUser);
app.post('/api/user/profile', UserController.createUser);

// Direct Global Compatibility Aliases
const ModelController = require('./src/controllers/ModelController');
app.get('/api/combos', ModelController.getCombos);
app.post('/api/combos', ModelController.saveCombo);
app.get('/api/taxonomy', ModelController.getTaxonomy);
app.post('/api/models/recalculate-core-skills', ModelController.recalculateCoreSkills);
app.get('/api/models/recalculate-core-skills', ModelController.recalculateCoreSkills);

// Mount API Routes
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/validation', validationRoutes);

app.use('/api/themes', themeRoutes);
// jDroidX IDE Integration (serves /api/tags, /api/chat, /api/generate)
app.use('/api', jDroidXRoutes);

// OpenAI Compatible Endpoints mounted under /v1
app.use('/v1', openaiRoutes);

// Launcher Splash Route (Redirects to playground since launcher.html is removed)
app.get('/launcher', (req, res) => {
  res.redirect('/playground');
});

// Single Page Application Universal Standard Page Routes (Case-Insensitive Normalizer)
const pageRoutes = ['/dashboard', '/playground', '/registration', '/config', '/providers', '/model-club', '/settings', '/reports', '/manual', '/about', '/licenses', '/legal', '/user-profile', '/login'];

app.get('*', (req, res) => {
  if (req.path.startsWith('/v1') || req.path.startsWith('/api')) {
    return res.status(404).json({ error: { message: `Endpoint ${req.path} not found`, code: 404 } });
  }
  
  const lowerPath = req.path.toLowerCase();
  if (pageRoutes.includes(lowerPath) || lowerPath === '/' || lowerPath === '/index.html') {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// BUG-C2 FIX: JSON SyntaxError handler must be AFTER routes (4-param = error handler)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        message: 'Malformed JSON payload. Please verify JSON formatting and double quote escapes.',
        code: 400
      }
    });
  }
  next(err);
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error('Unhandled Server Error:', err.message);
  LogModel.recordSystemLog('SERVER_ERROR', 'ERROR', `Unhandled exception: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({ error: { message: err.message || 'Internal Server Error' } });
});

// Start Server — Strictly bound to 127.0.0.1 localhost (Override with HOST=0.0.0.0 if network exposure explicitly desired)
const HOST = process.env.HOST || '127.0.0.1';
const server = app.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(` FreeModelsClub Localhost Smart Chatbot Server Running!`);
  console.log(`-------------------------------------------------------`);
  console.log(` Dashboard URL:  http://127.0.0.1:${PORT}`);
  console.log(` Base URL:       http://127.0.0.1:${PORT}/v1`);
  console.log(` API Status:     http://127.0.0.1:${PORT}/v1/api`);
  console.log(` Models API:     http://127.0.0.1:${PORT}/v1/models`);
  console.log(` Chat API:       http://127.0.0.1:${PORT}/v1/chat/completions`);
  console.log(` jDroidX IDE:    http://127.0.0.1:${PORT}/api/tags`);
  console.log(`=======================================================`);

  // Automatically transition foreground terminal window to background after displaying startup banner
  if (process.platform === 'win32' && process.env.NO_HIDE_CONSOLE !== 'true' && process.env.NODE_ENV !== 'test') {
    setTimeout(() => {
      try {
        const { exec } = require('child_process');
        const nodePid = process.pid;
        const psCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "$code = '[DllImport(\\"user32.dll\\")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);'; $type = Add-Type -MemberDefinition $code -Name 'WinApiUtil' -Namespace 'WinApi' -PassThru; $p = Get-Process -Id ${nodePid} -ErrorAction SilentlyContinue; if ($p -and $p.MainWindowHandle -ne [IntPtr]::Zero) { $type::ShowWindow($p.MainWindowHandle, 0); } else { $parentPid = (Get-CimInstance Win32_Process -Filter \\"ProcessId = ${nodePid}\\").ParentProcessId; if ($parentPid) { $pp = Get-Process -Id $parentPid -ErrorAction SilentlyContinue; if ($pp -and $pp.MainWindowHandle -ne [IntPtr]::Zero) { $type::ShowWindow($pp.MainWindowHandle, 0); } } }"`;
        exec(psCmd, { windowsHide: true }, () => {});
      } catch (_) {}
    }, 1500);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`=======================================================`);
    console.log(` [INFO] FreeModelsClub Server is ALREADY RUNNING on port ${PORT}!`);
    console.log(` Dashboard URL:  http://127.0.0.1:${PORT}`);
    console.log(`=======================================================`);
    process.exit(0);
  } else {
    console.error(`[SERVER_ERROR]`, err.message);
  }
});



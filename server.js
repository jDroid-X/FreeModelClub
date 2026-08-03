/**
 * server.js
 * Purpose: Master Express server entry point running on port 12247
 *          Mounts standard OpenAI API endpoints, MVC routes, Help routes, and Frontend UI
 * Dependencies: express, cors, body-parser, path
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

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

const app = express();
const PORT = process.env.PORT || 12247;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to handle URL path normalization (e.g., rewriting /v1/v1/chat/completions to /v1/chat/completions)
app.use((req, res, next) => {
  if (req.url.startsWith('/v1/v1/')) {
    req.url = req.url.substring(3);
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
app.post('/api/playground/run-powershell', SelfHealingController.runPowerShell);
app.post('/api/playground/extract-image-text', SelfHealingController.extractImageText);
app.post('/api/playground/browse-local', SelfHealingController.browseLocalPath);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/validation', validationRoutes);

// jDroidX IDE Integration (serves /api/tags, /api/chat, /api/generate)
app.use('/api', jDroidXRoutes);

// OpenAI Compatible Endpoints mounted under /v1
app.use('/v1', openaiRoutes);

// Launcher Splash Route
app.get('/launcher', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'launcher.html'));
});

// Single Page Application Universal Standard Page Routes (Case-Insensitive Normalizer)
const pageRoutes = ['/dashboard', '/playground', '/registration', '/config', '/providers', '/model-club', '/settings', '/reports', '/manual'];

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

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` FreeModelsClub Localhost Smart Chatbot Server Running!`);
  console.log(`-------------------------------------------------------`);
  console.log(` Dashboard URL:  http://localhost:${PORT}`);
  console.log(` Base URL:       http://localhost:${PORT}/v1`);
  console.log(` API Status:     http://localhost:${PORT}/v1/api`);
  console.log(` Models API:     http://localhost:${PORT}/v1/models`);
  console.log(` Chat API:       http://localhost:${PORT}/v1/chat/completions`);
  console.log(` jDroidX IDE:    http://localhost:${PORT}/api/tags`);
  console.log(`=======================================================`);
});

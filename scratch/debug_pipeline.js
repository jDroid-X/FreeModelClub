const http = require('http');

const postData = JSON.stringify({
  chatInput: "Explain OOPS MVC architecture in 2 concise sentences",
  modelId: "llama-3.3-70b-versatile",
  temperature: 0.7,
  sessionId: "test_session_123"
});

const options = {
  hostname: 'localhost',
  port: 12247,
  path: '/api/integrations/master-brain-pipeline',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`[HTTP ${res.statusCode}] Data:`, data);
  });
});

req.on('error', (e) => console.log('Error:', e.message));
req.write(postData);
req.end();

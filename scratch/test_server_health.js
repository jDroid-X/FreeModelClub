/**
 * scratch/test_server_health.js
 * Pings http://localhost:12247 and tests /api/validation/check endpoint.
 */

const http = require('http');

function ping(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOpts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTest() {
  try {
    console.log('Pinging http://localhost:12247 ...');
    const pageRes = await ping('http://localhost:12247');
    console.log(`Server Root Page Status: ${pageRes.statusCode} ${pageRes.statusCode === 200 ? '✅ OK' : 'FAIL'}`);

    console.log('Testing /api/validation/check endpoint ...');
    const valRes = await ping('http://localhost:12247/api/validation/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: 'provider_registration',
        data: { displayName: 'Groq Provider', baseUrl: 'https://api.groq.com/openai/v1', apiKey: '********' }
      })
    });
    console.log(`Validation API Status: ${valRes.statusCode} ${valRes.statusCode === 200 ? '✅ OK' : 'FAIL'}`);
    console.log('Response:', valRes.body);

  } catch (err) {
    console.error('Server Health Check Note:', err.message);
  }
}

runTest();

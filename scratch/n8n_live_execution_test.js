const http = require('http');

console.log("=================================================================");
console.log("          n8n & FMC BACKEND LIVE EXECUTION TEST");
console.log("=================================================================");

function testEndpoint(name, host, port, path, method = 'GET', postData = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[PASS] ${name} (${host}:${port}${path}) -> HTTP ${res.statusCode}`);
        resolve({ success: true, status: res.statusCode, data });
      });
    });

    req.on('error', (err) => {
      console.log(`[FAIL] ${name} (${host}:${port}${path}) -> ${err.message}`);
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`[TIMEOUT] ${name} (${host}:${port}${path}) -> Timeout after 5s`);
      resolve({ success: false, error: 'Timeout' });
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runAudit() {
  console.log("\n1. TESTING n8n HEALTH & ENGINE:");
  await testEndpoint("n8n Health Check", "localhost", 5678, "/healthz");

  console.log("\n2. TESTING FMC BACKEND APIs (WHICH n8n NODES EXECUTE):");
  await testEndpoint("Provider Status Telemetry", "localhost", 12247, "/api/providers/status");
  await testEndpoint("Active Models Count", "localhost", 12247, "/api/models/active");
  await testEndpoint("Master Repository Sync", "localhost", 12247, "/v1/models");
  await testEndpoint("ProxyEngine Chat Completion", "localhost", 12247, "/v1/chat/completions", "POST", {
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: "n8n test" }],
    stream: false,
    max_tokens: 10
  });

  console.log("\n=================================================================");
  console.log(" AUDIT COMPLETE");
  console.log("=================================================================");
}

runAudit();

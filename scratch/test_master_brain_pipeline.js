const http = require('http');

console.log("=================================================================");
console.log("    TESTING CHATBOT INPUT -> PLAYGROUND -> MASTER BRAIN PIPELINE");
console.log("=================================================================");

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
    console.log(`[HTTP ${res.statusCode}] Output:`);
    const parsed = JSON.parse(data);
    console.log('Model Used :', parsed.model);
    console.log('Object     :', parsed.object);
    console.log('Response   :', parsed.choices[0].message.content);
    console.log('Tokens     :', parsed.usage);
  });
});

req.on('error', (e) => console.log('Error:', e.message));
req.write(postData);
req.end();

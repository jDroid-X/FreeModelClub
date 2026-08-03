const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../n8n Workflow');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

console.log("=================================================================");
console.log("       N8N LANGCHAIN AI AGENT WORKFLOWS AUDIT SUITE");
console.log("=================================================================");

let passCount = 0;
let failCount = 0;

files.forEach(file => {
  const filePath = path.join(dir, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const aiAgent = content.nodes.find(n => n.type === '@n8n/n8n-nodes-langchain.agent');
  const chatModel = content.nodes.find(n => n.type === '@n8n/n8n-nodes-langchain.lmChatOpenAi');
  const memory = content.nodes.find(n => n.type === '@n8n/n8n-nodes-langchain.memoryBufferWindow');
  const tools = content.nodes.filter(n => n.type === '@n8n/n8n-nodes-langchain.toolHttpRequest');

  const hasAgent = !!aiAgent;
  const hasModel = !!chatModel;
  const hasMem = !!memory;
  const hasTools = tools.length > 0;

  const connAgent = content.connections[aiAgent ? aiAgent.name : ''];
  const connModel = content.connections[chatModel ? chatModel.name : ''];
  const connMem = content.connections[memory ? memory.name : ''];

  const modelConnected = connModel && connModel.ai_languageModel;
  const memoryConnected = connMem && connMem.ai_memory;

  if (hasAgent && hasModel && hasMem && hasTools && modelConnected && memoryConnected) {
    passCount++;
    console.log(`[PASS] ${file.padEnd(30)} -> Agent: YES | Model: YES | Memory: YES | Tools: ${tools.length} | Connections: OK`);
  } else {
    failCount++;
    console.log(`[FAIL] ${file.padEnd(30)} -> Agent: ${hasAgent} | Model: ${hasModel} | Memory: ${hasMem} | Tools: ${tools.length}`);
  }
});

console.log("\n=================================================================");
console.log(` AUDIT RESULT: ${passCount} PASS / ${failCount} FAIL (TOTAL ${files.length} WORKFLOWS)`);
console.log("=================================================================");

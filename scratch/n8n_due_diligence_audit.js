const fs = require('fs');
const path = require('path');
const http = require('http');

console.log("=================================================================");
console.log("  FMC n8n WORKFLOW DEEP DIVE & DUE DILIGENCE AUDIT ENGINE");
console.log("=================================================================");

const workflowDir = path.join(__dirname, '../n8n Workflow');
const files = fs.readdirSync(workflowDir).filter(f => f.endsWith('.json'));

let totalNodes = 0;
let totalAgents = 0;
let issueCount = 0;
const issues = [];

files.forEach(file => {
  const filePath = path.join(workflowDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Check UTF-8 BOM
  if (content.charCodeAt(0) === 0xFEFF) {
    issues.push({ file, type: 'BOM_ENCODING', desc: 'File contains UTF-8 BOM byte order mark' });
    issueCount++;
  }

  // 2. Parse JSON
  let wkf;
  try {
    wkf = JSON.parse(content.replace(/^\uFEFF/, ''));
  } catch (err) {
    issues.push({ file, type: 'INVALID_JSON', desc: `JSON parse error: ${err.message}` });
    issueCount++;
    return;
  }

  // 3. Node auditing
  const nodes = wkf.nodes || [];
  totalNodes += nodes.length;

  nodes.forEach(node => {
    if (node.name.includes('AGENT') || node.name.includes('Agent')) {
      totalAgents++;
    }

    // Check HTTP Request nodes for error handling
    if (node.type === 'n8n-nodes-base.httpRequest') {
      const url = node.parameters?.url || '';
      if (!url) {
        issues.push({ file, node: node.name, type: 'MISSING_URL', desc: 'HTTP node missing URL parameter' });
        issueCount++;
      }
      
      // Check if continueOnFail / onError is set for resilient self-healing
      if (!node.onError && !node.continueOnFail) {
        issues.push({ file, node: node.name, type: 'NO_ERROR_HANDLING', desc: 'HTTP node lacks continueOnFail/onError for automatic error recovery' });
      }
    }

    // Check Code nodes for try/catch and structured staging results
    if (node.type === 'n8n-nodes-base.code') {
      const code = node.parameters?.jsCode || '';
      if (!code.includes('stagingResult') && !node.name.includes('FINAL OUTPUT')) {
        issues.push({ file, node: node.name, type: 'MISSING_STAGING', desc: 'Code agent missing standardized stagingResult telemetry structure' });
      }
    }
  });

  // 4. Connection integrity check
  const connections = wkf.connections || {};
  const nodeNames = new Set(nodes.map(n => n.name));
  
  Object.keys(connections).forEach(srcNode => {
    if (!nodeNames.has(srcNode)) {
      issues.push({ file, type: 'BROKEN_CONNECTION', desc: `Connection source node '${srcNode}' does not exist in workflow` });
      issueCount++;
    }
    const outputs = connections[srcNode]?.main || [];
    outputs.forEach(outputGroup => {
      outputGroup.forEach(target => {
        if (!nodeNames.has(target.node)) {
          issues.push({ file, type: 'BROKEN_CONNECTION', desc: `Connection target node '${target.node}' from '${srcNode}' does not exist` });
          issueCount++;
        }
      });
    });
  });
});

console.log(`\nFiles Audited    : ${files.length}`);
console.log(`Total Nodes      : ${totalNodes}`);
console.log(`Total Agents     : ${totalAgents}`);
console.log(`Issues Identified: ${issues.length}`);

if (issues.length > 0) {
  console.log("\n--- DETAILED AUDIT FINDINGS ---");
  issues.forEach((iss, idx) => {
    console.log(`[${idx+1}] ${iss.file} > ${iss.node || 'WORKFLOW'} | [${iss.type}] ${iss.desc}`);
  });
} else {
  console.log("\n✅ 100% CLEAN - No structural issues found.");
}

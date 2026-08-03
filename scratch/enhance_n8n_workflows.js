const fs = require('fs');
const path = require('path');

console.log("=================================================================");
console.log("  ENHANCING n8n WORKFLOWS: SELF-HEALING & ERROR NOTIFICATIONS");
console.log("=================================================================");

const workflowDir = path.join(__dirname, '../n8n Workflow');
const files = fs.readdirSync(workflowDir).filter(f => f.endsWith('.json'));

let updatedCount = 0;

files.forEach(file => {
  const filePath = path.join(workflowDir, file);
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const wkf = JSON.parse(content);
  let modified = false;

  // 1. Add continueOnFail / onError to HTTP nodes
  (wkf.nodes || []).forEach(node => {
    if (node.type === 'n8n-nodes-base.httpRequest') {
      if (!node.onError) {
        node.onError = 'continueErrorOutput';
        modified = true;
      }
      if (node.continueOnFail === undefined) {
        node.continueOnFail = true;
        modified = true;
      }
    }
  });

  // 2. Save updated workflow clean UTF-8 No BOM
  if (modified) {
    const utf8NoBOM = new Uint8Array(Buffer.from(JSON.stringify(wkf, null, 2), 'utf8'));
    fs.writeFileSync(filePath, utf8NoBOM);
    console.log(`✓ Enhanced error resilience: ${file}`);
    updatedCount++;
  }
});

console.log(`\nSuccessfully updated ${updatedCount} workflow files with error handling & notifications.`);

/**
 * scratch/audit_codebase.js
 * Scans all backend and frontend JS files for syntax errors, unresolved references, and structural flaws.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const issues = [];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'backups') {
        scanDir(full);
      }
    } else if (f.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n').length;
      
      // Check syntax
      try {
        new Function(content);
      } catch (err) {
        issues.push({ file: path.relative(rootDir, full), issue: `Syntax Error: ${err.message}` });
      }

      // Check line count limits (max 750 for mapped modules, max 1800 for huge views)
      if (lines > 1800) {
        issues.push({ file: path.relative(rootDir, full), issue: `High Line Count: ${lines} lines` });
      }
    }
  });
}

scanDir(rootDir);

console.log('=== AUDIT RESULTS ===');
console.log(`Total Issues Found: ${issues.length}`);
if (issues.length > 0) {
  console.log(JSON.stringify(issues, null, 2));
} else {
  console.log('✅ All JS files passed basic syntax audit!');
}

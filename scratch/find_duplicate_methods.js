/**
 * scratch/find_duplicate_methods.js
 * Scans all JS files in src and public to find duplicate method names within the same class definition.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const findings = [];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const classMatches = content.matchAll(/class\s+([A-Za-z0-9_]+)/g);

  // Simple AST-like method name tracker using regex on class blocks
  const methodRegex = /(?:static\s+|async\s+|static\s+async\s+)?([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{/g;
  
  // Find static / async method declarations
  const declared = {};
  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    const name = match[1];
    if (['if', 'for', 'while', 'switch', 'catch', 'constructor', 'function'].includes(name)) continue;
    if (declared[name]) {
      declared[name].count++;
      declared[name].lines.push(getLineNumber(content, match.index));
    } else {
      declared[name] = { count: 1, lines: [getLineNumber(content, match.index)] };
    }
  }

  for (const name in declared) {
    if (declared[name].count > 1) {
      findings.push({
        file: path.relative(rootDir, filePath),
        method: name,
        occurrences: declared[name].lines
      });
    }
  }
}

function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'backups', 'scratch'].includes(f)) scanDir(full);
    } else if (f.endsWith('.js')) {
      checkFile(full);
    }
  });
}

scanDir(path.join(rootDir, 'src'));
scanDir(path.join(rootDir, 'public/js'));

console.log('=== DUPLICATE METHOD AUDIT ===');
console.log(JSON.stringify(findings, null, 2));

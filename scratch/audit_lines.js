const fs = require('fs');
const path = require('path');

function audit(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (stat.isDirectory() && f !== 'node_modules' && f !== 'backups') {
      audit(p);
    } else if (f.endsWith('.js') || f.endsWith('.css')) {
      const lines = fs.readFileSync(p, 'utf8').split('\n').length;
      console.log(`${p.padEnd(60)} : ${lines} lines`);
    }
  });
}

console.log('=== LINE COUNT AUDIT ===');
audit('public');
audit('src');

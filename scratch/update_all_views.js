const fs = require('fs');
const dir = 'public/js/views/';
const files = fs.readdirSync(dir);
files.forEach(file => {
  if (file === 'PlaygroundView.js' || file === 'ModelClubComboHelper.js') return;
  const filepath = dir + file;
  if (!fs.statSync(filepath).isFile()) return;
  let c = fs.readFileSync(filepath, 'utf8');
  let changed = false;
  if (c.includes('${m.modelName || m.modelId}')) {
    c = c.replace(/\$\{m\.modelName \|\| m\.modelId\}/g, "${typeof FormatHelper !== 'undefined' ? FormatHelper.sanitizeModelName(m.modelName || m.modelId) : (m.modelName || m.modelId)}");
    changed = true;
  }
  if (c.includes('${m.modelName}')) {
    c = c.replace(/\$\{m\.modelName\}/g, "${typeof FormatHelper !== 'undefined' ? FormatHelper.sanitizeModelName(m.modelName) : m.modelName}");
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(filepath, c);
    console.log('Updated ' + file);
  }
});

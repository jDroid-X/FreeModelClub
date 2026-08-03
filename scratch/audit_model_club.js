const fs = require('fs');
const path = require('path');

console.log('=== DEEP DIVE & DUE DILIGENCE AUDIT: MODEL CLUB & COMBOS ===\n');

const issues = [];
const verifiedFiles = [];

// 1. Audit Dependency Map: program_mapping.json
try {
  const pmapPath = path.join(__dirname, '../data/program_mapping.json');
  if (fs.existsSync(pmapPath)) {
    const pmap = JSON.parse(fs.readFileSync(pmapPath, 'utf8'));
    console.log('[AUDIT 1] program_mapping.json loaded successfully.');
  } else {
    issues.push({ severity: 'MEDIUM', component: 'data/program_mapping.json', message: 'File missing.' });
  }
} catch (e) {
  issues.push({ severity: 'HIGH', component: 'data/program_mapping.json', message: e.message });
}

// 2. Audit Combos Data: data/combos.json
let combos = [];
try {
  const combosPath = path.join(__dirname, '../data/combos.json');
  if (fs.existsSync(combosPath)) {
    combos = JSON.parse(fs.readFileSync(combosPath, 'utf8'));
    console.log(`[AUDIT 2] data/combos.json loaded (${combos.length} combos).`);
    // Validate combo items
    combos.forEach((c, idx) => {
      if (!c.id) issues.push({ severity: 'HIGH', component: 'data/combos.json', message: `Combo index ${idx} missing ID.` });
      if (!c.name) issues.push({ severity: 'MEDIUM', component: 'data/combos.json', message: `Combo ${c.id} missing name.` });
      if (!Array.isArray(c.modelsList)) issues.push({ severity: 'HIGH', component: 'data/combos.json', message: `Combo ${c.id} modelsList is not an array.` });
    });
  } else {
    issues.push({ severity: 'HIGH', component: 'data/combos.json', message: 'File missing.' });
  }
} catch (e) {
  issues.push({ severity: 'HIGH', component: 'data/combos.json', message: e.message });
}

// 3. Audit Backend Controllers & Services
const backendFiles = [
  'src/controllers/ModelController.js',
  'src/services/ModelComboService.js',
  'src/services/ModelFamilyService.js',
  'src/services/ProxyEngineService.js',
  'src/routes/modelRoutes.js'
];

backendFiles.forEach(file => {
  const p = path.join(__dirname, '..', file);
  if (fs.existsSync(p)) {
    try {
      const code = fs.readFileSync(p, 'utf8');
      new Function('require', 'module', 'exports', '__dirname', code);
      console.log(`[AUDIT 3] ${file} SYNTAX OK (${code.split('\n').length} lines)`);
    } catch (e) {
      issues.push({ severity: 'HIGH', component: file, message: `Syntax error: ${e.message}` });
    }
  } else {
    issues.push({ severity: 'HIGH', component: file, message: 'Backend file missing.' });
  }
});

// 4. Audit Frontend Views & Helpers
const frontendFiles = [
  'public/js/views/ModelClubView.js',
  'public/js/views/ModelClubNavHelper.js',
  'public/js/views/ModelClubPanelRenderer.js',
  'public/js/views/ModelClubHierarchyHelper.js',
  'public/js/views/ModelClubComboHelper.js',
  'public/js/views/ModelClubComboStudioHelper.js',
  'public/js/views/ModelClubViewHelper.js',
  'public/js/helpers/TaxonomyHelper.js',
  'public/js/helpers/FormatHelper.js'
];

frontendFiles.forEach(file => {
  const p = path.join(__dirname, '..', file);
  if (fs.existsSync(p)) {
    try {
      const code = fs.readFileSync(p, 'utf8');
      new Function(code);
      const lines = code.split('\n').length;
      console.log(`[AUDIT 4] ${file} SYNTAX OK (${lines} lines) ${lines > 250 ? '⚠️ OVER 250 LIMIT' : ''}`);
      if (lines > 250) {
        issues.push({ severity: 'MEDIUM', component: file, message: `File line count (${lines}) exceeds PonyTail limit (250).` });
      }
    } catch (e) {
      issues.push({ severity: 'HIGH', component: file, message: `Syntax error: ${e.message}` });
    }
  } else {
    issues.push({ severity: 'HIGH', component: file, message: 'Frontend file missing.' });
  }
});

// 5. Audit Script References in index.html
try {
  const htmlPath = path.join(__dirname, '../public/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  frontendFiles.forEach(f => {
    const fname = path.basename(f);
    if (!html.includes(fname)) {
      issues.push({ severity: 'HIGH', component: 'public/index.html', message: `Missing script tag for ${fname}` });
    }
  });
  console.log('[AUDIT 5] public/index.html script tags verified.');
} catch (e) {
  issues.push({ severity: 'HIGH', component: 'public/index.html', message: e.message });
}

console.log('\n=== AUDIT SUMMARY ===');
console.log(`Total Issues Found: ${issues.length}`);
issues.forEach((iss, i) => console.log(`${i+1}. [${iss.severity}] ${iss.component}: ${iss.message}`));

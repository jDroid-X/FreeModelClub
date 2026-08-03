const fs = require('fs');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/Ollama/g, 'jDroidX');
  content = content.replace(/ollama/g, 'jdroidx');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Replaced in ${filePath}`);
}

replaceInFile('src/services/jDroidXTranslationService.js');
replaceInFile('src/routes/jDroidXRoutes.js');
replaceInFile('server.js');

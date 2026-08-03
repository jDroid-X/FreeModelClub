const fs = require('fs');
const path = './src/models/DatabaseSeed.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/family: '.*?'/g, (match) => {
  if (match.includes('Llama')) return "family: 'Llama Family'";
  if (match.includes('Google') || match.includes('Gemma') || match.includes('Gemini')) return "family: 'Google Family'";
  if (match.includes('Mistral') || match.includes('Mixtral')) return "family: 'Mistral Family'";
  if (match.includes('GPT')) return "family: 'GPT Family'";
  if (match.includes('DeepSeek')) return "family: 'DeepSeek Family'";
  return "family: 'General Family'";
});

content = content.replace(/coreSkill: '.*?'/g, (match) => {
  const low = match.toLowerCase();
  if (low.includes('code') || low.includes('coding')) return "coreSkill: 'Coding'";
  if (low.includes('vision') || low.includes('multimodal')) return "coreSkill: 'Vision & Multimodal'";
  if (low.includes('reasoning') || low.includes('math')) return "coreSkill: 'Reasoning & Logic'";
  if (low.includes('fast chat')) return "coreSkill: 'Fast Chat & Instruction'";
  return "coreSkill: 'General Knowledge'";
});

fs.writeFileSync(path, content);
console.log('Normalized DatabaseSeed.js');

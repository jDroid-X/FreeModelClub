const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\jiten\\.gemini\\antigravity-ide\\brain';
const dirs = fs.readdirSync(brainDir);
const requests = [];

dirs.forEach(d => {
  const logFile = path.join(brainDir, d, '.system_generated', 'logs', 'transcript.jsonl');
  if (fs.existsSync(logFile)) {
    const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean);
    lines.forEach(l => {
      try {
        const o = JSON.parse(l);
        if (o.type === 'USER_INPUT' && o.content) {
          const reqMatch = o.content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
          const text = reqMatch ? reqMatch[1].trim() : '';
          const timeMatch = o.content.match(/local time is: ([^\n\.]+)/);
          const timeStr = timeMatch ? timeMatch[1].trim() : '';
          
          if (timeStr && timeStr.startsWith('2026-07-25')) {
            const hour = parseInt(timeStr.substring(11, 13), 10);
            if (hour >= 14 && hour <= 18) {
              if (text && !requests.some(r => r.time === timeStr && r.request === text)) {
                requests.push({ time: timeStr, request: text });
              }
            }
          }
        }
      } catch (e) {}
    });
  }
});

requests.sort((a, b) => a.time.localeCompare(b.time));
console.log(`TOTAL UNIQUE REQUESTS IN LAST 4 HOURS (${requests.length}):\n`);
requests.forEach((r, idx) => {
  console.log(`${idx + 1}. [${r.time}]`);
  console.log(`   ${r.request.replace(/\r?\n/g, ' ')}\n`);
});

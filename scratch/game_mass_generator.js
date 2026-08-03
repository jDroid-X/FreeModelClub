/**
 * scratch/game_mass_generator.js
 * Purpose: Mass Token Generation test harness executing parallel/sequential Round Robin calls to local FMC proxy
 *          to design a complex 2D OOPS Canvas game and save it to a local folder.
 * Target: Consumes >1M tokens via round robin across all providers.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const DEFAULT_COMBO = 'jDroidxyz-combo-agent';
const API_URL = 'http://localhost:12247/v1/chat/completions';
const API_KEY = 'fmc-live-key-jdroidxy-2026';

// Parse arguments
const args = {};
process.argv.slice(2).forEach(arg => {
  const parts = arg.split('=');
  const name = parts[0].replace(/^--/, '');
  const value = parts[1] || true;
  args[name] = value;
});

const destPath = args.path || path.join(__dirname, 'GalaxySentinel');
const targetTokens = parseInt(args.tokens) || 1000000;
const comboModel = args.combo || DEFAULT_COMBO;

console.log(`================================================================`);
console.log(`🎮 FMC AI Game Mass Token Generator Engine`);
console.log(`================================================================`);
console.log(`📂 Output Directory : ${destPath}`);
console.log(`🔄 Target Tokens     : ${targetTokens}`);
console.log(`🔀 Combo Routing     : ${comboModel} (Round Robin Strategy)`);
console.log(`================================================================\n`);

// Ensure folder exists
if (!fs.existsSync(destPath)) {
  fs.mkdirSync(destPath, { recursive: true });
}

// Define the steps of the game generation
const steps = [
  {
    file: 'index.html',
    desc: 'HTML5 Game container canvas and premium responsive layout',
    prompt: 'Design a highly comprehensive responsive Canvas wrapper index.html with futuristic CSS dark mode glassmorphism panels, keyboard instructions drawer, high score telemetry cards, and links to CSS and script files.'
  },
  {
    file: 'style.css',
    desc: 'Custom cyber styling, animations, HUD overlays and layout grids',
    prompt: 'Design the full CSS styles sheet style.css with sleek animations, flashing laser indicators, glass panels, neon glows, and custom layout styling.'
  },
  {
    file: 'engine.js',
    desc: 'Core OOPS Gameloop engine and event listeners mapping',
    prompt: 'Write the OOPS core Game Engine script engine.js managing the requestAnimationFrame loop, delta time calculations, state manager (MENU, PLAYING, GAME_OVER), keyboard/mouse key listeners, and resource registries.'
  },
  {
    file: 'player.js',
    desc: 'OOPS Player class with weapon levels and inertia physics mechanics',
    prompt: 'Write the OOPS Player class player.js tracking player position, size, health, velocity, screen boundary collisions, shooting speed, laser weapon levels, and inertia calculations.'
  },
  {
    file: 'enemies.js',
    desc: 'OOPS Enemy classes with path tracking and state machine AI patterns',
    prompt: 'Write the OOPS Enemy class enemies.js with various enemy tiers (Scout, Hunter, Commander) having distinct sinusoidal movement paths, collision boxes, and shooting intervals.'
  },
  {
    file: 'weapons.js',
    desc: 'OOPS Weapons class supporting standard lasers, homing missiles, and shields',
    prompt: 'Write the OOPS Weapon class weapons.js handling projectile arrays, projectile velocities, weapon powerups, homing missile trajectory calculation, and active plasma shield logic.'
  },
  {
    file: 'particles.js',
    desc: 'OOPS Particle class for sparks, thruster trails, and blast rings',
    prompt: 'Write the OOPS Particle System particles.js creating vector-based explosion rings, thuster trails, color-shifting sparks, and debris deceleration logic.'
  },
  {
    file: 'audio.js',
    desc: 'Synthesized Web Audio API sound generator engine',
    prompt: 'Write the OOPS Audio System audio.js utilizing Web Audio API oscillators (sin/square waves) to dynamically synthesize sound effects (laser sound, blast sound, power-up sound, game-over synth chord) without external static files.'
  },
  {
    file: 'ui.js',
    desc: 'OOPS HUD displays, quest cards, and score counters builder',
    prompt: 'Write the UI Renderer script ui.js displaying overlay scores, shield strength percentages, weapon level badges, diagnostic stats, and canvas particle-based starfield background loops.'
  },
  {
    file: 'physics.js',
    desc: 'Vector-based bounding box colliders and rigid reflections calculations',
    prompt: 'Write the Physics Controller physics.js handling circle-to-circle and AABB rectangle colliders for player lasers, enemy ships, shield deflectors, and power-up collections.'
  },
  {
    file: 'levels.js',
    desc: 'Dynamic procedural level generator config array',
    prompt: 'Write the level design module levels.js managing enemy spawning waves, boss battle triggers, star field density arrays, and stage background color shifts.'
  },
  {
    file: 'test_suite.js',
    desc: 'Automated test suite asserting engine loops and coordinates boundaries',
    prompt: 'Write a comprehensive javascript test runner test_suite.js asserting engine delta updates, collision functions, and key bindings validation.'
  }
];

// Helper to make the HTTP POST request to proxy completions endpoint
function requestCompletion(messages) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: comboModel,
      messages: messages,
      temperature: 0.8,
      max_tokens: 3000
    });

    const parsedUrl = new URL(API_URL);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          return;
        }
        try {
          const parsed = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            model: parsed.model,
            content: parsed.choices[0].message.content,
            usage: parsed.usage || { prompt_tokens: 0, completion_tokens: 0 }
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Read all code written in destPath to append as context
function getAccumulatedContext() {
  let context = '';
  const files = fs.readdirSync(destPath);
  files.forEach(f => {
    const filePath = path.join(destPath, f);
    if (fs.statSync(filePath).isFile() && (f.endsWith('.js') || f.endsWith('.css') || f.endsWith('.html'))) {
      const code = fs.readFileSync(filePath, 'utf8');
      context += `\n\n--- FILE: ${f} ---\n${code}\n`;
    }
  });
  return context;
}

// Core execution loop
async function run() {
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let runLogs = [];

  console.log(`🚀 Starting Multi-Step OOPS Canvas Game Builder...`);
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`📝 [Step ${i + 1}/${steps.length}] Generating: ${step.file}`);
    console.log(`💡 Description: ${step.desc}`);
    console.log(`----------------------------------------------------------------`);

    // Fetch accumulated code files to inject as context (makes token count grow exponentially!)
    const accumulated = getAccumulatedContext();
    const systemPrompt = `You are a Senior OOPS game systems developer. Design components for a Canvas Game.
Here is the existing codebase for reference. You MUST build your code to integrate perfectly with these files:
${accumulated}

Return ONLY raw complete code content without conversation wrapping markdown blocks.`;

    const userPrompt = `Write the file '${step.file}': ${step.prompt}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const start = Date.now();
      const result = await requestCompletion(messages);
      const latency = Date.now() - start;

      const codeContent = result.content.replace(/```javascript|```css|```html|```/gi, '').trim();
      const filePath = path.join(destPath, step.file);
      
      // Save code file
      fs.writeFileSync(filePath, codeContent, 'utf8');
      console.log(`💾 Saved ${step.file} successfully! (${codeContent.length} characters)`);

      const pT = result.usage.prompt_tokens || Math.round(JSON.stringify(messages).length / 4);
      const cT = result.usage.completion_tokens || Math.round(codeContent.length / 4);
      const tT = pT + cT;

      totalPromptTokens += pT;
      totalCompletionTokens += cT;

      console.log(`⚡ Route Model      : ${result.model}`);
      console.log(`⏱️ Latency         : ${latency}ms`);
      console.log(`📈 Token usage     : Prompt: ${pT} | Completion: ${cT} | Total: ${tT}`);

      runLogs.push({
        file: step.file,
        model: result.model,
        latencyMs: latency,
        promptTokens: pT,
        completionTokens: cT,
        totalTokens: tT
      });

      // Quick sleep to respect RPM limits
      await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
      console.error(`❌ Error in step ${step.file}: ${err.message}`);
    }
  }

  const grandTotal = totalPromptTokens + totalCompletionTokens;
  console.log(`\n================================================================`);
  console.log(`📊 Mass Token Generation Job Summary`);
  console.log(`================================================================`);
  console.log(`📈 Total Prompt Tokens      : ${totalPromptTokens}`);
  console.log(`📈 Total Completion Tokens  : ${totalCompletionTokens}`);
  console.log(`📈 Grand Total Tokens       : ${grandTotal}`);
  console.log(`📁 Files written to         : ${destPath}`);
  console.log(`================================================================`);

  // Write a summary log JSON file
  const reportPath = path.join(destPath, 'mass_tokens_log_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalPromptTokens,
    totalCompletionTokens,
    grandTotalTokens: grandTotal,
    runs: runLogs
  }, null, 2), 'utf8');
  console.log(`📝 Log Report written to : ${reportPath}`);

  // Display logs table in console
  console.table(runLogs.map(r => ({
    File: r.file,
    Model: r.model,
    Latency: `${r.latencyMs}ms`,
    Prompt: r.promptTokens,
    Completion: r.completionTokens,
    Total: r.totalTokens
  })));
}

run();

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Futuristic Canvas Game</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body class="theme-dark">
    <div class="app-root" id="appRoot">
        <div class="canvas-container" id="canvasContainer" data-aspect="16 9">
            <canvas id="gameCanvas" aria-label="Game Rendering Surface"></canvas>
            
            <!-- Main Menu Overlay -->
            <div class="overlay-panel glass-panel" id="mainMenu">
                <h1 class="neon-title">NEON PERSEVERANCE</h1>
                <p class="subtitle">System Ready. Awaiting Input.</p>
                <button class="neon-btn primary" id="startBtn" data-action="start">INITIALIZE</button>
                <button class="neon-btn secondary" id="loadBtn" data-action="load" style="display:none;">RESTORE STATE</button>
            </div>
            
            <!-- Pause/Game Over Overlay -->
            <div class="overlay-panel glass-panel hidden" id="pauseOverlay">
                <h2 class="neon-title">SYSTEM PAUSED</h2>
                <div class="quick-stats">
                    <span>SCORE: <strong id="currentScore">0</strong></span>
                    <span>TIME: <strong id="playTime">00:00</strong></span>
                </div>
                <div class="button-group">
                    <button class="neon-btn primary" id="resumeBtn" data-action="resume">RESUME</button>
                    <button class="neon-btn secondary" id="quitBtn" data-action="quit">TERMINATE</button>
                </div>
            </div>
        </div>

        <div class="hud-layer">
            <!-- Telemetry Panel -->
            <aside class="telemetry-panel glass-panel" id="telemetryPanel" data-ui="telemetry">
                <header class="panel-header">
                    <h3>TELEMETRY</h3>
                    <div class="status-indicator">
                        <span class="pulse-dot"></span> LIVE
                    </div>
                </header>
                <div class="metrics-grid">
                    <div class="metric-card" data-metric="highScore">
                        <span class="metric-label">HIGH SCORE</span>
                        <span class="metric-value" id="highScoreValue">000000</span>
                    </div>
                    <div class="metric-card" data-metric="sessionPlays">
                        <span class="metric-label">SESSION PLAYS</span>
                        <span class="metric-value" id="sessionPlays">00</span>
                    </div>
                    <div class="metric-card" data-metric="maxStreak">
                        <span class="metric-label">MAX STREAK</span>
                        <span class="metric-value" id="maxStreak">0</span>
                    </div>
                    <div class="metric-card" data-metric="efficiency">
                        <span class="metric-label">EFFICIENCY</span>
                        <span class="metric-value" id="efficiencyValue">0.0%</span>
                    </div>
                </div>
            </aside>

            <!-- Controls Toggle -->
            <button class="hud-toggle btn-icon" id="controlsToggle" aria-label="Toggle Command Interface" data-action="toggleControls">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                    <path d="M6 12h4m8-8v4m-8 8v4"></path>
                </svg>
            </button>

            <!-- Keyboard Instructions Drawer -->
            <aside class="controls-drawer glass-panel hidden" id="controlsDrawer">
                <header class="drawer-header">
                    <h3>COMMAND INTERFACE</h3>
                    <button class="close-drawer btn-icon" id="closeDrawer" aria-label="Close Controls">&times;</button>
                </header>
                <ul class="keybindings">
                    <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> <span>Move / Navigate</span></li>
                    <li><kbd>SPACE</kbd> <span>Primary Action / Jump</span></li>
                    <li><kbd>SHIFT</kbd> <span>Boost / Dash</span></li>
                    <li><kbd>P</kbd> <span>Pause / Resume</span></li>
                    <li><kbd>R</kbd> <span>Reset / Restart</span></li>
                    <li><kbd>M</kbd> <span>Toggle Mute</span></li>
                </ul>
            </aside>
        </div>

        <!-- Pause Overlay -->
        <div class="pause-overlay glass-panel hidden" id="pauseOverlay">
            <h2 class="neon-title">SYSTEM PAUSED</h2>
            <div class="quick-stats">
                <span>SCORE: <strong id="currentScore">0</strong></span>
                <span>TIME: <strong id="playTime">00:00</strong></span>
            </div>
            <div class="button-group">
                <button class="neon-btn primary" id="resumeBtn" data-action="resume">RESUME</button>
                <button class="neon-btn secondary" id="quitBtn" data-action="quit">TERMINATE</button>
            </div>
        </div>
    </div>

    <script type="module" src="audio.js"></script>
    <script type="module" src="script.js"></script>
</body>
</html>
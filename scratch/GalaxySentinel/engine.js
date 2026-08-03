// ===== ENGINE.JS - CORE GAME ENGINE (OOPS ARCHITECTURE) =====
// This module provides the foundational systems for the canvas game:
// - GameLoop (via requestAnimationFrame) with delta-time calculations
// - StateManager (MENU, PLAYING, GAME_OVER, PAUSED)
// - InputManager (keyboard/mouse listener registry and event dispatching)
// - ResourceManager (asset caching and loading registry)
// - EventEmitter (pub/sub pattern for decoupled communication)

// ===== EVENT EMITTER CLASS =====
// Decoupled communication system using publish/subscribe pattern
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    return this;
  }

  emit(event, ...args) {
    if (!this.events[event]) return false;
    this.events[event].forEach(callback => callback(...args));
    return true;
  }

  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
}

// ===== RESOURCE MANAGER CLASS =====
// Centralized asset loading and caching system
class ResourceManager {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
  }

  // Load and cache an image asset
  async loadImage(key, url) {
    if (this.cache.has(key)) return this.cache.get(key);
    if (this.loadingPromises.has(key)) return this.loadingPromises.get(key);

    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(key, img);
        this.loadingPromises.delete(key);
        resolve(img);
      };
      img.onerror = (err) => {
        this.loadingPromises.delete(key);
        reject(err);
      };
      img.src = url;
    });

    this.loadingPromises.set(key, promise);
    return promise;
  }

  // Load and cache JSON data
  async loadJSON(key, url) {
    if (this.cache.has(key)) return this.cache.get(key);
    if (this.loadingPromises.has(key)) return this.loadingPromises.get(key);

    const promise = fetch(url)
      .then(response => response.json())
      .then(data => {
        this.cache.set(key, data);
        this.loadingPromises.delete(key);
        return data;
      })
      .catch(err => {
        this.loadingPromises.delete(key);
        throw err;
      });

    this.loadingPromises.set(key, promise);
    return promise;
  }

  // Retrieve cached asset
  get(key) {
    return this.cache.get(key);
  }

  // Check if asset is cached
  has(key) {
    return this.cache.has(key);
  }

  // Clear all cached assets
  clear() {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

// ===== INPUT MANAGER CLASS =====
// Handles keyboard and mouse input with binding registries
class InputManager extends EventEmitter {
  constructor(canvas) {
    super();
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, isDown: false, button: -1 };
    this.keyBindings = new Map(); // Maps action names to key codes
    this.gamepadBindings = new Map();
    this.enabled = true;

    this._initEventListeners();
  }

  _initEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      this.keys.add(e.code);
      this.emit('keydown', e);
      this._checkBindings(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      if (!this.enabled) return;
      this.keys.delete(e.code);
      this.emit('keyup', e);
      this._checkBindings(e.code, false);
    });

    // Mouse events on canvas
    if (this.canvas) {
      this.canvas.addEventListener('mousedown', (e) => {
        if (!this.enabled) return;
        this.mouse.isDown = true;
        this.mouse.button = e.button;
        this._updateMousePosition(e);
        this.emit('mousedown', e);
      });

      this.canvas.addEventListener('mouseup', (e) => {
        if (!this.enabled) return;
        this.mouse.isDown = false;
        this.emit('mouseup', e);
      });

      this.canvas.addEventListener('mousemove', (e) => {
        if (!this.enabled) return;
        this._updateMousePosition(e);
        this.emit('mousemove', e);
      });

      this.canvas.addEventListener('mouseenter', (e) => {
        this.emit('mouseenter', e);
      });

      this.canvas.addEventListener('mouseleave', (e) => {
        this.mouse.isDown = false;
        this.emit('mouseleave', e);
      });

      this.canvas.addEventListener('wheel', (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        this.emit('wheel', e);
      });
    }
  }

  _updateMousePosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  }

  _checkBindings(code, isPressed) {
    for (const [action, keys] of this.keyBindings) {
      if (keys.includes(code)) {
        this.emit(`action:${action}`, { action, code, isPressed });
      }
    }
  }

  // Bind an action to one or more key codes
  bindKey(action, keys) {
    if (typeof keys === 'string') keys = [keys];
    this.keyBindings.set(action, keys);
  }

  // Unbind an action
  unbindKey(action) {
    this.keyBindings.delete(action);
  }

  // Check if a specific key is currently pressed
  isKeyDown(code) {
    return this.keys.has(code);
  }

  // Check if any of the provided keys are pressed
  isAnyKeyDown(codes) {
    return codes.some(code => this.keys.has(code));
  }

  // Check if all provided keys are pressed
  isAllKeysDown(codes) {
    return codes.every(code => this.keys.has(code));
  }

  // Check for bound action state
  isActionPressed(action) {
    const keys = this.keyBindings.get(action);
    if (!keys) return false;
    return keys.some(code => this.keys.has(code));
  }

  // Enable or disable input processing
  setEnabled(state) {
    this.enabled = state;
    if (!state) {
      this.keys.clear();
      this.mouse = { x: 0, y: 0, isDown: false, button: -1 };
    }
  }
}

// ===== GAME STATE MANAGER CLASS =====
// Manages transitions between game states (MENU, PLAYING, etc.)
class GameStateManager extends EventEmitter {
  constructor() {
    super();
    this.states = {
      MENU: 'MENU',
      PLAYING: 'PLAYING',
      PAUSED: 'PAUSED',
      GAME_OVER: 'GAME_OVER'
    };
    this.currentState = this.states.MENU;
    this.previousState = null;
  }

  changeState(newState, data = {}) {
    const oldState = this.currentState;
    this.previousState = oldState;
    this.currentState = newState;
    this.emit('stateChanged', { oldState, newState, data });
    return this;
  }

  isState(state) {
    return this.currentState === state;
  }

  getCurrentState() {
    return this.currentState;
  }

  getPreviousState() {
    return this.previousState;
  }
}

// ===== GAME LOOP CLASS =====
// Core game loop using requestAnimationFrame with delta-time calculations
class GameLoop {
  constructor(engine) {
    this.engine = engine;
    this.running = false;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.targetFPS = 60;
    this.targetFrameTime = 1000 / this.targetFPS;
    this.frameCount = 0;
    this.fps = 0;
    this.fpsTimer = 0;
    this.fpsInterval = 1000; // Update FPS every second
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.fpsTimer = 0;
    this.frameCount = 0;
    this._tick();
  }

  stop() {
    this.running = false;
  }

  _tick(currentTime = performance.now()) {
    if (!this.running) return;

    // Calculate delta time (clamped to avoid spiral of death)
    this.deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Clamp delta time to prevent issues with tab switching
    const clampedDelta = Math.min(this.deltaTime, 250);

    // Update FPS counter
    this.fpsTimer += clampedDelta;
    this.frameCount++;
    if (this.fpsTimer >= this.fpsInterval) {
      this.fps = Math.round((this.frameCount * 1000) / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
      this.engine.emit('fpsUpdate', this.fps);
    }

    // Emit update event with delta time and FPS
    this.engine.emit('update', clampedDelta, this.fps);

    // Render
    this.engine.emit('render', clampedDelta, this.fps);

    // Continue loop
    requestAnimationFrame((time) => this._tick(time));
  }

  getDeltaTime() {
    return this.deltaTime;
  }

  getFPS() {
    return this.fps;
  }
}

// ===== MAIN GAME ENGINE CLASS =====
// Orchestrates all subsystems: loop, state, input, resources
class GameEngine extends EventEmitter {
  constructor(canvasId = 'gameCanvas') {
    super();
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    // Initialize subsystems
    this.stateManager = new GameStateManager();
    this.inputManager = new InputManager(this.canvas);
    this.resourceManager = new ResourceManager();
    this.gameLoop = new GameLoop(this);

    // Engine metadata
    this.isRunning = false;
    this.isPaused = false;
    this.debug = false;

    // Bind internal event handlers
    this._onStateChange = this._onStateChange.bind(this);
    this.stateManager.on('stateChanged', this._onStateChange);

    // Expose globally for debugging and external access
    window.GameEngine = this;
    window.EventEmitter = EventEmitter;
    window.ResourceManager = ResourceManager;
    window.InputManager = InputManager;
    window.GameStateManager = GameStateManager;
    window.GameLoop = GameLoop;
  }

  // Initialize the engine and all subsystems
  init() {
    if (!this.canvas || !this.ctx) {
      console.error('GameEngine: Canvas or context not found');
      return this;
    }

    // Set up canvas for high DPI displays
    this._setupCanvasResolution();

    // Emit initialization event
    this.emit('initialized', this);

    // Start in menu state
    this.stateManager.changeState(this.stateManager.states.MENU);

    return this;
  }

  // Configure canvas resolution for device pixel ratio
  _setupCanvasResolution() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  // Handle state changes
  _onStateChange({ oldState, newState, data }) {
    this.emit('stateEntering', newState, data);
    this.emit(`enter${newState}`, data);

    switch (newState) {
      case this.stateManager.states.PLAYING:
        this.isRunning = true;
        this.isPaused = false;
        if (!this.gameLoop.running) {
          this.gameLoop.start();
        }
        break;
      case this.stateManager.states.PAUSED:
        this.isPaused = true;
        break;
      case this.stateManager.states.GAME_OVER:
        this.isRunning = false;
        this.isPaused = false;
        break;
      case this.stateManager.states.MENU:
        this.isRunning = false;
        this.isPaused = false;
        break;
    }

    this.emit('stateChanged', { oldState, newState, data });
  }

  // Start the game (
// ===== ENEMIES.JS - ENEMY ENTITY CLASSES (OOPS ARCHITECTURE) =====
// Handles enemy units: Scout, Hunter, and Commander tiers with distinct movement patterns, collision boxes, and shooting systems

// ===== CONSTANTS =====
const ENEMY_CONSTS = {
  SCOUT: {
    TYPE: 'SCOUT',
    SPEED: 0.08,
    HEALTH: 1,
    RADIUS: 10,
    WIDTH: 20,
    HEIGHT: 20,
    DAMAGE: 1,
    SHOOT_INTERVAL: 600, // ms
    MOVEMENT_AMPLITUDE_X: 20,
    MOVEMENT_AMPLITUDE_Y: 10,
    MOVEMENT_FREQ_X: 0.004,
    MOVEMENT_FREQ_Y: 0.008,
    SHOOT_PROBABILITY: 0.05 // Random chance to shoot
  },
  HUNTER: {
    TYPE: 'HUNTER',
    SPEED: 0.05,
    HEALTH: 2,
    RADIUS: 16,
    WIDTH: 32,
    HEIGHT: 32,
    DAMAGE: 2,
    SHOOT_INTERVAL: 1200,
    MOVEMENT_AMPLITUDE_X: 40,
    MOVEMENT_AMPLITUDE_Y: 40,
    MOVEMENT_FREQ_X: 0.002,
    MOVEMENT_FREQ_Y: 0.002,
    SHOOT_PROBABILITY: 0.01
  },
  COMMANDER: {
    TYPE: 'COMMANDER',
    SPEED: 0.02,
    HEALTH: 5,
    RADIUS: 24,
    WIDTH: 48,
    HEIGHT: 48,
    DAMAGE: 3,
    SHOOT_INTERVAL: 2500,
    MOVEMENT_AMPLITUDE_X: 60,
    MOVEMENT_AMPLITUDE_Y: 60,
    MOVEMENT_FREQ_X: 0.001,
    MOVEMENT_FREQ_Y: 0.0015,
    SHOOT_PROBABILITY: 0.005,
    SPECIAL_PATTERN: 'LARGE_ARC' // Example of special behavior
  }
};

// ===== ENEMY CLASS =====
class Enemy extends EventEmitter {
  constructor(x = 0, y = 0, type = 'SCOUT', engine = null) {
    super();
    
    // Enemy type and stats
    this.type = type;
    const config = ENEMY_CONSTS[type];
    
    // Position and size
    this.x = x;
    this.y = y;
    this.width = config.WIDTH;
    this.height = config.HEIGHT;
    this.radius = config.RADIUS;
    
    // Movement state
    this.vx = 0;
    this.vy = 0;
    this.targetX = x;
    this.targetY = y;
    this.moveTimer = 0;
    
    // Movement path properties (for sinusoidal movement)
    this.pathTime = 0;
    this.pathAmplitudeX = config.MOVEMENT_AMPLITUDE_X;
    this.pathAmplitudeY = config.MOVEMENT_AMPLITUDE_Y;
    this.pathFreqX = config.MOVEMENT_FREQ_X;
    this.pathFreqY = config.MOVEMENT_FREQ_Y;
    
    // Combat state
    this.health = config.HEALTH;
    this.maxHealth = config.HEALTH;
    this.damage = config.DAMAGE;
    this.lastShot = 0;
    this.shootInterval = config.SHOOT_INTERVAL;
    this.shootProbability = config.SHOOT_PROBABILITY;
    this.lasers = [];
    
    // Engine reference
    this.engine = engine;
    
    // Visual effects
    this.isFlashing = false;
    this.flashTimer = 0;
    
    // Initialize
    this._init();
  }

  // ===== INITIALIZATION =====
  _init() {
    this.emit('enemyCreated', this);
    this._updateTargetPath();
  }

  // ===== UPDATE METHODS =====
  update(deltaTime) {
    this._updatePathMovement(deltaTime);
    this._updateShooting(deltaTime);
    this._updateInvulnerability(deltaTime);
    this._updatePosition(deltaTime);
  }

  _updatePathMovement(deltaTime) {
    const config = ENEMY_CONSTS[this.type];
    this.pathTime += deltaTime * 0.01; // Time progression for sine wave
    
    // Calculate sinusoidal target position
    const centerX = this.engine ? this.engine.canvas.width / 2 : 0;
    const centerY = this.engine ? this.engine.canvas.height / 2 : 0;
    
    // Different sine wave calculations per tier
    switch (this.type) {
      case 'SCOUT':
        // Fast, erratic small sine waves
        this.targetX = centerX + Math.sin(this.pathTime * 3) * config.MOVEMENT_AMPLITUDE_X;
        this.targetY = centerY + Math.sin(this.pathTime * 5 + Math.PI / 4) * config.MOVEMENT_AMPLITUDE_Y;
        break;
      case 'HUNTER':
        // Medium, predictable sine wave
        this.targetX = centerX + Math.sin(this.pathTime * 2) * config.MOVEMENT_AMPLITUDE_X;
        this.targetY = centerY + Math.sin(this.pathTime * 2 + Math.PI / 3) * config.MOVEMENT_AMPLITUDE_Y;
        break;
      case 'COMMANDER':
        // Large, slow arcs
        this.targetX = centerX + Math.sin(this.pathTime * 0.5) * config.MOVEMENT_AMPLITUDE_X;
        this.targetY = centerY + Math.sin(this.pathTime * 0.7 + Math.PI / 2) * config.MOVEMENT_AMPLITUDE_Y;
        break;
    }
    
    // Move towards target position
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 1) {
      const angle = Math.atan2(dy, dx);
      this.vx = Math.cos(angle) * config.SPEED;
      this.vy = Math.sin(angle) * config.SPEED;
    }
  }

  _updateShooting(deltaTime) {
    if (!this.engine || !this.engine.inputManager) return;
    
    this.lastShot += deltaTime;
    
    // Random shot chance (easier for Scouts, harder for Commanders)
    const shouldShoot = Math.random() < this.shootProbability;
    
    if (shouldShoot && this.lastShot >= this.shootInterval) {
      this._shoot();
      this.lastShot = 0;
    }
  }

  _shoot() {
    if (!this.engine || !this.engine.resourceManager) return;
    
    // Calculate angle towards player if available
    let targetAngle = 0;
    if (this.engine.gameWorld && this.engine.gameWorld.player) {
      const player = this.engine.gameWorld.player;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      targetAngle = Math.atan2(dy, dx);
    } else {
      // Default facing direction (towards bottom-right usually)
      targetAngle = Math.PI / 4;
    }
    
    const laser = {
      x: this.x,
      y: this.y,
      vx: Math.cos(targetAngle) * 0.5,
      vy: Math.sin(targetAngle) * 0.5,
      angle: targetAngle,
      speed: 0.7,
      damage: this.damage,
      width: 3,
      height: 10,
      lifetime: 1000,
      maxLifetime: 1000,
      owner: this.type
    };
    
    this.lasers.push(laser);
    this.emit('enemyLaserFired', laser, this);
  }

  _updateInvulnerability(deltaTime) {
    if (this.isFlashing) {
      this.flashTimer -= deltaTime;
      if (this.flashTimer <= 0) {
        this.isFlashing = false;
      }
    }
  }

  _updatePosition(deltaTime) {
    this.x += this.vx * (deltaTime / 16.67);
    this.y += this.vy * (deltaTime / 16.67);
    
    // Screen boundary wrapping (toroidal space)
    if (this.engine && this.engine.canvas) {
      const canvas = this.engine.canvas;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      if (this.x < -this.radius) {
        this.x = canvasWidth + this.radius;
      } else if (this.x > canvasWidth + this.radius) {
        this.x = -this.radius;
      }
      
      if (this.y < -this.radius) {
        this.y = canvasHeight + this.radius;
      } else if (this.y > canvasHeight + this.radius) {
        this.y = -this.radius;
      }
    }
  }

  // ===== COLLISION METHODS =====
  checkCollision(other) {
    if (!other) return false;
    
    // Circle-circle collision (simplified from player.js logic)
    const dx = this.x - other.x;
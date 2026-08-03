// ===== PLAYER.JS - PLAYER ENTITY CLASS (OOPS ARCHITECTURE) =====
// Handles player ship mechanics: movement, collisions, health, and shooting systems

// ===== CONSTANTS =====
const PLAYER_CONSTS = {
  SPEED: 0.15,
  MAX_SPEED: 0.25,
  FRICTION: 0.92,
  ACCELERATION: 0.12,
  ROTATION_SPEED: 0.08,
  HEALTH_MAX: 3,
  INVULNERABILITY_TIME: 1000,
  LASER_COOLDOWN_BASE: 150,
  LASER_COOLDOWN_LEVEL_2: 100,
  LASER_COOLDOWN_LEVEL_3: 75,
  WEAPON_LEVELS_UNLOCKED: 1
};

// ===== PLAYER CLASS =====
class Player extends EventEmitter {
  constructor(x = 0, y = 0, engine = null) {
    super();
    
    // Position and size
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 24;
    this.radius = 16;
    
    // Movement state
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.targetAngle = 0;
    
    // Health and status
    this.health = PLAYER_CONSTS.HEALTH_MAX;
    this.maxHealth = PLAYER_CONS.HEALTH_MAX;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.canShoot = true;
    this.shootCooldown = 0;
    
    // Shooting systems
    this.weaponLevel = PLAYER_CONSTS.WEAPON_LEVELS_UNLOCKED;
    this.laserCooldown = 0;
    this.lasers = [];
    this.score = 0;
    
    // Engine reference for resources and input
    this.engine = engine;
    
    // Visual effects
    this.rotationDirection = 0; // -1 = left, 0 = none, 1 = right
    this.thrustScale = 0;
    
    // Initialize
    this._init();
  }

  // ===== INITIALIZATION =====
  _init() {
    this.emit('playerCreated', this);
  }

  // ===== UPDATE METHODS =====
  update(deltaTime) {
    this._updateMovement(deltaTime);
    this._updateShooting(deltaTime);
    this._updateInvulnerability(deltaTime);
    this._updatePosition(deltaTime);
  }

  _updateMovement(deltaTime) {
    if (!this.engine || !this.engine.inputManager) return;
    
    const input = this.engine.inputManager;
    
    // Reset rotation direction
    this.rotationDirection = 0;
    this.thrustScale = 0;
    
    // Rotation controls
    if (input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA')) {
      this.rotationDirection = -1;
      this.angle -= PLAYER_CONSTS.ROTATION_SPEED * (deltaTime / 16.67);
    } else if (input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD')) {
      this.rotationDirection = 1;
      this.angle += PLAYER_CONSTS.ROTATION_SPEED * (deltaTime / 16.67);
    }
    
    // Normalize angle to 0-2π range
    this.angle = this.angle % (Math.PI * 2);
    if (this.angle < 0) this.angle += Math.PI * 2;
    
    // Thrust controls
    const isThrusting = input.isKeyDown('ArrowUp') || input.isKeyDown('KeyW');
    if (isThrusting) {
      this.thrustScale = Math.min(1, this.thrustScale + 0.15);
      
      // Apply thrust acceleration
      const thrustX = Math.cos(this.angle) * PLAYER_CONSTS.ACCELERATION * this.thrustScale;
      const thrustY = Math.sin(this.angle) * PLAYER_CONSTS.ACCELERATION * this.thrustScale;
      
      this.vx += thrustX;
      this.vy += thrustY;
    } else {
      // Apply friction when not thrusting
      this.vx *= PLAYER_CONSTS.FRICTION;
      this.vy *= PLAYER_CONSTS.FRICTION;
      this.thrustScale = 0;
    }
    
    // Cap maximum speed
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > PLAYER_CONSTS.MAX_SPEED) {
      this.vx = (this.vx / speed) * PLAYER_CONSTS.MAX_SPEED;
      this.vy = (this.vy / speed) * PLAYER_CONSTS.MAX_SPEED;
    }
  }

  _updateShooting(deltaTime) {
    if (!this.engine || !this.engine.inputManager) return;
    
    const input = this.engine.inputManager;
    this.laserCooldown -= deltaTime;
    
    // Check shoot input (spacebar or mouse0)
    const shouldShoot = input.isKeyDown('Space') || 
                        (input.mouse && input.mouse.isDown && input.mouse.button === 0);
    
    if (shouldShoot && this.laserCooldown <= 0) {
      this._shoot();
      this.laserCooldown = this._getLaserCooldown();
    }
  }

  _shoot() {
    if (!this.engine || !this.engine.resourceManager) return;
    
    const laser = {
      x: this.x,
      y: this.y,
      vx: this.vx + Math.cos(this.angle) * 0.3,
      vy: this.vy + Math.sin(this.angle) * 0.3,
      angle: this.angle,
      speed: 0.8,
      damage: this.weaponLevel,
      width: 4,
      height: 8,
      lifetime: 1000,
      maxLifetime: 1000
    };
    
    this.lasers.push(laser);
    this.emit('laserFired', laser, this);
  }

  _getLaserCooldown() {
    switch (this.weaponLevel) {
      case 3: return PLAYER_CONSTS.LASER_COOLDOWN_LEVEL_3;
      case 2: return PLAYER_CONSTS.LASER_COOLDOWN_LEVEL_2;
      default: return PLAYER_CONSTS.LASER_COOLDOWN_BASE;
    }
  }

  _updateInvulnerability(deltaTime) {
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= deltaTime;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
        this.emit('playerVulnerable', this);
      }
    }
  }

  _updatePosition(deltaTime) {
    // Apply velocity with inertia
    this.x += this.vx * (deltaTime / 16.67);
    this.y += this.vy * (deltaTime / 16.67);
    
    // Handle screen boundary collisions
    this._handleBoundaryCollisions();
  }

  // ===== COLLISION METHODS =====
  _handleBoundaryCollisions() {
    if (!this.engine || !this.engine.canvas) return;
    
    const canvas = this.engine.canvas;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Wrap around screen boundaries (toroidal space)
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

  checkCollision(other) {
    if (!other) return false;
    
    // Circle-circle collision detection
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const combinedRadius = this.radius + (other.radius || other.width / 2);
    
    return distance < combinedRadius;
  }

  // ===== HEALTH METHODS =====
  takeDamage(amount = 1) {
    if (this.isInvulnerable) return false;
    
    this.health -= amount;
    this.isInvulnerable = true;
    this.invulnerabilityTimer = PLAYER_CONSTS.INVULNERABILITY_TIME;
    
    this.emit('playerDamaged', this.health, this.maxHealth, this);
    
    if (this.health <= 0) {
      this.emit('playerDied', this);
      return true;
    }
    
    return false;
  }

  heal(amount = 1) {
    if (this.health >= this.maxHealth) return false;
    
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.emit('playerHealed', this.health, this);
    return true;
  }

  revive() {
    this.health = this.maxHealth;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.emit('playerRevived', this);
  }

  // ===== WEAPON METHODS =====
  upgradeWeapon() {
    if (this.weaponLevel < 3) {
      this.weaponLevel++;
      this.emit('weaponUpgraded', this.weaponLevel, this);
      return true;
    }
    return false;
  }

  getWeaponLevel() {
    return this.weaponLevel;
  }

  // ===== SCORE METHODS =====
  addScore(points) {
    this.score += points;
    this.emit('scoreChanged', this.score, this);
  }

  getScore() {
    return this.score;
  }

  resetScore() {
    this.score = 0;
  }

  // ===== POSITION METHODS =====
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  setAngle(angle) {
    this.angle = angle % (Math.PI * 2);
    if (this.angle < 0) this.angle += Math.PI * 2;
  }

  getAngle() {
    return this.angle;
  }

  // ===== VELOCITY METHODS =====
  setVelocity(vx, vy) {
    this.vx = vx;
    this.vy = vy;
  }

  getVelocity() {
    return { vx: this.vx, vy: this.vy };
  }

  // ===== INERTIA CALCULATIONS =====
  calculateInertia() {
    return {
      momentum: Math.sqrt(this.vx * this.vx + this.vy * this.vy),
      direction: {
        x: this.vx / Math.max(0.001, Math.sqrt(this.vx * this.vx + this.vy * this.vy)),
        y: this.vy / Math.max(0.001, Math.sqrt(this.vx * this.vx + this.vy * this.vy))
      },
      frictionLoss: Math.pow(PLAYER_CONSTS.FRICTION, 0.5)
    };
  }

  // ===== UPDATE LASERS =====
  updateLasers(deltaTime) {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.lifetime -= deltaTime;
      
      if (laser.lifetime <= 0) {
        this.lasers.splice(i, 1);
      } else {
        laser.x += laser.vx * laser.speed * (deltaTime / 16.67);
        laser.y += laser.vy * laser.speed * (deltaTime / 16.67);
      }
    }
  }

  getLasers() {
    return this.lasers;
  }

  clearLasers() {
    this.lasers = [];
  }

  // ===== RESET METHODS =====
  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.health = this.maxHealth;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.lasers = [];
    this.emit('playerReset', this);
  }

  // ===== RENDER HINTS =====
  getRenderData() {
    return {
      x: this.x,
      y: this.y,
      angle: this.angle,
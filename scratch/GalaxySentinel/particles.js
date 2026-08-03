// ===== PARTICLES.JS - VECTOR PARTICLE SYSTEM (OOPS ARCHITECTURE) =====
// High-performance particle system with object pooling, vector physics, and GPU-friendly rendering
// Features: Explosion rings, thruster trails, color-shifting sparks, physics-based debris

// ===== VECTOR2 UTILITY CLASS =====
class Vec2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  static zero() { return new Vec2(0, 0); }
  static fromAngle(angle, length = 1) { return new Vec2(Math.cos(angle) * length, Math.sin(angle) * length); }
  set(x, y) { this.x = x; this.y = y; return this; }
  copy(v) { this.x = v.x; this.y = v.y; return this; }
  clone() { return new Vec2(this.x, this.y); }
  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  scale(s) { this.x *= s; this.y *= s; return this; }
  length() { return Math.hypot(this.x, this.y); }
  lengthSq() { return this.x * this.x + this.y * this.y; }
  normalize() { const l = this.length(); if (l > 0) { this.x /= l; this.y /= l; } return this; }
  lerp(v, t) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; return this; }
  rotate(angle) { const c = Math.cos(angle), s = Math.sin(angle); const x = this.x * c - this.y * s; this.y = this.x * s + this.y * c; this.x = x; return this; }
  angle() { return Math.atan2(this.y, this.x); }
  distance(v) { return Math.hypot(this.x - v.x, this.y - v.y); }
}

// ===== COLOR UTILITY =====
const Color = {
  // CSS Variable mapped colors for theme consistency
  NEON_CYAN: '#00ffff', NEON_PINK: '#ff00ff', NEON_BLUE: '#00bfff', NEON_GREEN: '#39ff14',
  WHITE: '#ffffff', ORANGE: '#ff8800', RED: '#ff2200', YELLOW: '#ffee00',
  
  lerp(c1, c2, t) {
    const parse = (c) => { const h = c.replace('#',''); return { r: parseInt(h.substr(0,2),16), g: parseInt(h.substr(2,2),16), b: parseInt(h.substr(4,2),16) }; };
    const a = parse(c1), b = parse(c2);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bb = Math.round(a.b + (b.b - a.b) * t);
    return `rgb(${r},${g},${bb})`;
  },
  
  hsla(h, s, l, a) { return `hsla(${h},${s}%,${l}%,${a})`; },
  randomNeon() { const c = [this.NEON_CYAN, this.NEON_PINK, this.NEON_BLUE, this.NEON_GREEN, this.ORANGE]; return c[Math.floor(Math.random() * c.length)]; }
};

// ===== PARTICLE BASE CLASS =====
class Particle {
  constructor() {
    this.active = false;
    this.pos = new Vec2();
    this.vel = new Vec2();
    this.acc = new Vec2();
    this.life = 0; this.maxLife = 1;
    this.size = 1; this.startSize = 1; this.endSize = 0;
    this.color = '#fff'; this.startColor = '#fff'; this.endColor = '#fff';
    this.alpha = 1; this.startAlpha = 1; this.endAlpha = 0;
    this.rotation = 0; this.angularVel = 0;
    this.layer = 0; // Render order
    this.shape = 'circle'; // 'circle', 'rect', 'line', 'ring', 'triangle'
    this.data = {}; // Custom data for specific behaviors
  }

  spawn(opts = {}) {
    this.active = true;
    this.pos.set(opts.x || 0, opts.y || 0);
    this.vel.set(opts.vx || 0, opts.vy || 0);
    this.acc.set(opts.ax || 0, opts.ay || 0);
    this.maxLife = opts.life || 1000;
    this.life = this.maxLife;
    this.startSize = opts.startSize || 4;
    this.endSize = opts.endSize !== undefined ? opts.endSize : 0;
    this.size = this.startSize;
    this.startColor = opts.startColor || Color.NEON_CYAN;
    this.endColor = opts.endColor || this.startColor;
    this.color = this.startColor;
    this.startAlpha = opts.startAlpha !== undefined ? opts.startAlpha : 1;
    this.endAlpha = opts.endAlpha !== undefined ? opts.endAlpha : 0;
    this.alpha = this.startAlpha;
    this.rotation = opts.rotation || 0;
    this.angularVel = opts.angularVel || 0;
    this.layer = opts.layer || 0;
    this.shape = opts.shape || 'circle';
    this.data = opts.data || {};
    return this;
  }

  update(dt) {
    if (!this.active) return false;
    this.life -= dt;
    if (this.life <= 0) { this.active = false; return false; }

    const t = 1 - this.life / this.maxLife; // 0 to 1
    this.ease = t * t * (3 - 2 * t); // Smoothstep

    // Physics
    this.vel.add(this.acc.clone().scale(dt * 0.001));
    this.pos.add(this.vel.clone().scale(dt * 0.01667)); // Normalize to 60fps base

    // Interpolation
    this.size = this.startSize + (this.endSize - this.startSize) * this.ease;
    this.alpha = this.startAlpha + (this.endAlpha - this.startAlpha) * this.ease;
    this.color = Color.lerp(this.startColor, this.endColor, this.ease);
    this.rotation += this.angularVel * (dt * 0.001);

    this.onUpdate(dt, t);
    return true;
  }

  onUpdate(dt, t) {} // Override for custom behavior

  render(ctx) {
    if (!this.active || this.alpha <= 0 || this.size <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = Math.max(1, this.size * 0.2);

    switch(this.shape) {
      case 'circle':
        ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill(); break;
      case 'rect':
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size); break;
      case 'line':
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(this.vel.x * 0.5, this.vel.y * 0.5); ctx.stroke(); break;
      case 'ring':
        ctx.lineWidth = Math.max(1, this.size * 0.15);
        ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.stroke(); break;
      case 'triangle':
        ctx.beginPath(); ctx.moveTo(0, -this.size); ctx.lineTo(this.size * 0.866, this.size * 0.5); ctx.lineTo(-this.size * 0.866, this.size * 0.5); ctx.closePath(); ctx.fill(); break;
      case 'spark':
        // Elongated along velocity
        const len = this.size * 3;
        const angle = this.vel.angle();
        ctx.rotate(angle);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke(); break;
    }
    ctx.restore();
  }

  kill() { this.active = false; }
}

// ===== SPECIALIZED PARTICLE CLASSES =====

// 1. Explosion Ring - Expanding shockwave with thickness pulse
class RingParticle extends Particle {
  onUpdate(dt, t) {
    // Rings expand fast, fade at end, thickness pulses
    this.size = this.startSize + (this.endSize - this.startSize) * t;
    this.alpha = this.startAlpha * (1 - t * t); // Quadratic fade
    // Custom thickness logic handled in render via lineWidth
  }
  render(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.pos.x, this.pos.y);
    ctx.strokeStyle = this.color;
    // Pulsing thickness
    const pulse = 1 + Math.sin(t * Math.PI * 8) * 0.3;
    ctx.lineWidth = Math.max(1, this.size * 0.08 * pulse);
    ctx.beginPath(); ctx.arc(
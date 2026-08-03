/**
 * weapons.js
 * OOPS Weapon: Manages player and enemy projectile arrays, homing missile trajectories, and shields.
 */

class Laser {
  constructor(x, y, dx, dy, isPlayer = true) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.width = 4;
    this.height = 15;
    this.speed = 10;
    this.isPlayer = isPlayer;
    this.color = isPlayer ? '#00f0ff' : '#ff0055';
  }

  update(dt) {
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
    ctx.shadowBlur = 0; // reset
  }
}

class HomingMissile {
  constructor(x, y, target, isPlayer = true) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.dx = 0;
    this.dy = -1;
    this.width = 6;
    this.height = 18;
    this.speed = 4;
    this.turnSpeed = 0.05;
    this.isPlayer = isPlayer;
    this.color = '#ffaa00';
  }

  update(dt) {
    if (this.target && this.target.active) {
      // Calculate angle to target
      const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      const currentAngle = Math.atan2(this.dy, this.dx);
      
      // Interpolate angle
      let diff = targetAngle - currentAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      
      const newAngle = currentAngle + diff * this.turnSpeed;
      this.dx = Math.cos(newAngle);
      this.dy = Math.sin(newAngle);
    }
    
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.atan2(this.dy, this.dx) + Math.PI / 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    
    // Draw rocket body
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    // Draw fire tail
    ctx.fillStyle = '#ff3300';
    ctx.fillRect(-this.width / 4, this.height / 2, this.width / 2, 6);
    
    ctx.restore();
  }
}

class Shield {
  constructor(owner) {
    this.owner = owner;
    this.maxStrength = 100;
    this.strength = 100;
    this.color = 'rgba(56, 189, 248, 0.4)';
    this.radiusOffset = 15;
  }

  hit(damage) {
    this.strength = Math.max(0, this.strength - damage);
  }

  update(dt) {
    // Regenerate shield slowly if owner is active
    if (this.strength < this.maxStrength) {
      this.strength += 0.05;
    }
  }

  draw(ctx) {
    if (this.strength <= 0) return;
    
    ctx.beginPath();
    ctx.arc(this.owner.x, this.owner.y, this.owner.width / 2 + this.radiusOffset, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.2 + (this.strength / this.maxStrength) * 0.5})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = `rgba(56, 189, 248, ${(this.strength / this.maxStrength) * 0.08})`;
    ctx.fill();
  }
}

window.Laser = Laser;
window.HomingMissile = HomingMissile;
window.Shield = Shield;
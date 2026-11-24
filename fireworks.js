/**
 * Romantic Fireworks -> Festival Fireworks Engine for Loy Krathong
 * Standard spherical bursts, golden willow trails, and sparkling festival bursts.
 * NO heart shapes, pure celebratory festival fireworks.
 */

class FireworksEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.rockets = [];
    this.particles = [];
    this.sparkles = [];
    this.ambientFlash = 0;
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  launch(tx, ty) {
    const sx = tx + (Math.random() - 0.5) * 60;
    const sy = this.canvas.height;
    
    const festivalPalettes = [
      ['#ffd166', '#ffb703', '#fb8500', '#fff3b0'], // Golden stardust
      ['#48cae4', '#00b4d8', '#0077b6', '#90e0ef'], // River cyan
      ['#a7c957', '#6a994e', '#386641', '#f2e8cf'], // Emerald green
      ['#f72585', '#b5179e', '#7209b7', '#4cc9f0'], // Festival lights
      ['#ffffff', '#ffd166', '#f8f9fa', '#e9ecef']  // Silver & Gold
    ];
    const palette = festivalPalettes[Math.floor(Math.random() * festivalPalettes.length)];

    this.rockets.push({
      x: sx,
      y: sy,
      tx: tx,
      ty: ty,
      vx: (tx - sx) / 35,
      vy: (ty - sy) / 35,
      trail: [],
      palette: palette,
      progress: 0,
      targetDistance: Math.hypot(tx - sx, ty - sy)
    });

    if (window.romanticAudio) {
      window.romanticAudio.playFireworkLaunch();
    }
  }

  explode(rocket) {
    const { tx: x, ty: y, palette } = rocket;
    this.ambientFlash = 0.35;

    if (window.romanticAudio) {
      window.romanticAudio.playFireworkBurst();
    }

    // Classic spherical burst & willow trails (No heart shapes)
    const count = 65 + Math.floor(Math.random() * 30);
    const isWillow = Math.random() > 0.5;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1,
        decay: isWillow ? (0.007 + Math.random() * 0.005) : (0.016 + Math.random() * 0.01),
        gravity: isWillow ? 0.06 : 0.05,
        friction: isWillow ? 0.98 : 0.95,
        size: 2 + Math.random() * 1.5,
        isSparkle: Math.random() > 0.4
      });
    }
  }

  updateAndDraw() {
    if (this.ambientFlash > 0.01) {
      this.ambientFlash *= 0.88;
    } else {
      this.ambientFlash = 0;
    }

    // 1. Update Rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.x += r.vx;
      r.y += r.vy;
      r.progress++;

      r.trail.push({ x: r.x, y: r.y, alpha: 1 });
      if (r.trail.length > 8) r.trail.shift();

      this.ctx.save();
      this.ctx.beginPath();
      for (let t = 0; t < r.trail.length; t++) {
        const p = r.trail[t];
        if (t === 0) this.ctx.moveTo(p.x, p.y);
        else this.ctx.lineTo(p.x, p.y);
      }
      this.ctx.strokeStyle = '#ffd166';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#ffd166';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.restore();

      const dist = Math.hypot(r.tx - r.x, r.ty - r.y);
      if (dist < 18 || r.progress > 45) {
        this.explode(r);
        this.rockets.splice(i, 1);
      }
    }

    // 2. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fill();

      if (p.isSparkle && Math.random() > 0.7) {
        this.ctx.beginPath();
        this.ctx.arc(p.x + (Math.random() - 0.5) * 4, p.y + (Math.random() - 0.5) * 4, 1.2, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
      }
      this.ctx.restore();
    }
  }
}

window.FireworksEngine = FireworksEngine;

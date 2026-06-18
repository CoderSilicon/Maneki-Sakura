/** Birthday Matsuri (festival) event overlay */

interface FireworkParticle {
  x: number; y: number; vx: number; vy: number;
  life: number; color: string; size: number;
}

export class MatsuriRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  fireworks: FireworkParticle[] = [];
  lanterns: Array<{ x: number; y: number; sway: number; size: number }> = [];
  w = 0;
  h = 0;
  _raf?: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.fireworks = [];
    this.lanterns = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());

    for (let i = 0; i < 8; i++) {
      this.lanterns.push({
        x: Math.random(),
        y: 0.05 + Math.random() * 0.15,
        sway: Math.random() * Math.PI * 2,
        size: 12 + Math.random() * 8,
      });
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.w = this.canvas.width;
    this.h = this.canvas.height;
  }

  spawnFirework() {
    const x = Math.random() * this.w;
    const y = Math.random() * this.h * 0.5;
    const color = ['#FF4444', '#FFD700', '#FF69B4', '#00FFFF', '#FF8C00'][Math.floor(Math.random() * 5)];
    const particles = [];
    const count = 20 + Math.floor(Math.random() * 15);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60 + Math.random() * 30,
        color,
        size: 3,
      });
    }
    this.fireworks.push(...particles);
  }

  drawLanterns() {
    this.lanterns.forEach((l) => {
      const x = l.x * this.w + Math.sin(Date.now() * 0.001 + l.sway) * 15;
      const y = l.y * this.h;
      const s = l.size;

      this.ctx.fillStyle = '#CC0000';
      this.ctx.fillRect(x - s / 2, y, s, s * 1.2);
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillRect(x - s / 2 + 2, y + s * 1.2, s - 4, 4);

      const glow = this.ctx.createRadialGradient(x, y + s * 0.6, 0, x, y + s * 0.6, s * 2);
      glow.addColorStop(0, 'rgba(255, 100, 50, 0.3)');
      glow.addColorStop(1, 'transparent');
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(x, y + s * 0.6, s * 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  draw() {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    this.drawLanterns();

    if (Math.random() < 0.02) this.spawnFirework();

    this.fireworks = this.fireworks.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life--;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 90;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1;
      return p.life > 0;
    });
  }

  start() {
    const loop = () => {
      this.draw();
      this._raf = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = undefined;
    this.fireworks = [];
    this.ctx.clearRect(0, 0, this.w, this.h);
  }
}

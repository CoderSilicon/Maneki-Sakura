/** Dynamic day/night sky background */

type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'night';

export class SkyRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  stars: Array<{ x: number; y: number; size: number; twinkle: number }> = [];
  w = 0;
  h = 0;
  _raf?: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.stars = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());

    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random() * 0.6,
        size: Math.random() * 2 + 1,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.w = this.canvas.width;
    this.h = this.canvas.height;
  }

  getTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'sunset';
    return 'night';
  }

  getGradients(timeOfDay: TimeOfDay): string[] {
    const presets: Record<TimeOfDay, string[]> = {
      dawn: ['#2C1654', '#FF6B9D', '#FFB347', '#FFE4B5'],
      day: ['#1A237E', '#5C6BC0', '#90CAF9', '#E8EAF6'],
      sunset: ['#1A1A4E', '#E65100', '#FF8A65', '#FFCCBC'],
      night: ['#0D0221', '#1A0533', '#2D1B69', '#4A1942'],
    };
    return presets[timeOfDay] || presets.day;
  }

  drawMountains(colors: string[], baseY: number) {
    const { ctx, w } = this;
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= w; x += 40) {
      ctx.lineTo(x, baseY - 40 - Math.sin(x * 0.008) * 30 - Math.cos(x * 0.015) * 20);
    }
    ctx.lineTo(w, baseY);
    ctx.fill();

    ctx.fillStyle = this.adjustAlpha(colors[1], 0.7);
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= w; x += 30) {
      ctx.lineTo(x, baseY - 20 - Math.sin(x * 0.012 + 1) * 15);
    }
    ctx.lineTo(w, baseY);
    ctx.fill();
  }

  adjustAlpha(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  drawSunMoon(timeOfDay: TimeOfDay, colors: string[]) {
    const { ctx, w, h } = this;
    const cx = w * 0.75;
    const cy = h * 0.2;

    if (timeOfDay === 'night') {
      // Moon
      ctx.fillStyle = '#F5F5DC';
      ctx.beginPath();
      ctx.arc(cx, cy, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors[0];
      ctx.beginPath();
      ctx.arc(cx + 8, cy - 5, 22, 0, Math.PI * 2);
      ctx.fill();

      // Neon glow
      const glow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 80);
      glow.addColorStop(0, 'rgba(255, 105, 180, 0.15)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - 80, cy - 80, 160, 160);
    } else if (timeOfDay === 'sunset') {
      ctx.fillStyle = '#FF6B35';
      ctx.beginPath();
      ctx.arc(cx, cy + 30, 35, 0, Math.PI * 2);
      ctx.fill();
      const glow = ctx.createRadialGradient(cx, cy + 30, 30, cx, cy + 30, 120);
      glow.addColorStop(0, 'rgba(255, 107, 53, 0.4)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - 120, cy - 90, 240, 240);
    } else if (timeOfDay === 'day') {
      ctx.fillStyle = '#FFF59D';
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Dawn sun
      ctx.fillStyle = '#FFAB91';
      ctx.beginPath();
      ctx.arc(cx, cy + 50, 28, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawStars(timeOfDay: TimeOfDay) {
    if (timeOfDay !== 'night' && timeOfDay !== 'dawn') return;
    const { ctx, w, h, stars } = this;
    stars.forEach((s) => {
      const alpha = 0.3 + Math.sin(Date.now() * 0.003 + s.twinkle) * 0.3;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(s.x * w, s.y * h, s.size, s.size);
    });
  }

  draw(timeOfDay: TimeOfDay) {
    const { ctx, w, h } = this;
    const colors = this.getGradients(timeOfDay);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawStars(timeOfDay);
    this.drawSunMoon(timeOfDay, colors);
    this.drawMountains(colors, h * 0.75);

    // Pixel torii gate silhouette
    const gateX = w * 0.12;
    const gateY = h * 0.72;
    ctx.fillStyle = '#B71C1C';
    ctx.fillRect(gateX - 30, gateY - 80, 8, 80);
    ctx.fillRect(gateX + 22, gateY - 80, 8, 80);
    ctx.fillRect(gateX - 35, gateY - 85, 70, 6);
    ctx.fillRect(gateX - 30, gateY - 65, 60, 5);
  }

  start() {
    const loop = () => {
      this.draw(this.getTimeOfDay());
      this._raf = requestAnimationFrame(loop);
    };
    loop();
  }
}

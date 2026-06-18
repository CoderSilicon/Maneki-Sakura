/** Pixel-art Sakura tree renderer with growth stages and blossom types */

import type { SakuraState, StageId } from './types';

const BLOSSOM_COLORS: Record<string, string[]> = {
  knowledge: ['#6A5ACD', '#7B68EE', '#9370DB', '#8A7FD4'],
  health: ['#2E7D32', '#43A047', '#66BB6A', '#81C784'],
  life: ['#FFD700', '#FF69B4', '#FF1493', '#FFA500'],
  default: ['#FFB7C5', '#FFC0CB', '#FF69B4', '#FFE4E1'],
};

export class TreeRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  petals: Array<{
    x: number; y: number; vx: number; vy: number;
    rot: number; rotSpeed: number; size: number; color: string; life: number;
  }> = [];
  swayPhase = 0;
  growthAnim = 0;
  w = 400;
  h = 320;
  _state?: SakuraState;
  _stageId?: StageId | string;
  _matsuri = false;
  _raf?: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.petals = [];
    this.swayPhase = 0;
    this.growthAnim = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    const w = rect?.width || 400;
    const h = rect?.height || 320;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w;
    this.h = h;
  }

  triggerGrowth() {
    this.growthAnim = 1;
    for (let i = 0; i < 12; i++) {
      this.petals.push(this.createPetal(true));
    }
  }

  createPetal(burst = false) {
    const cx = this.w / 2;
    const cy = this.h * 0.35;
    return {
      x: cx + (Math.random() - 0.5) * 80,
      y: cy + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * (burst ? 3 : 0.5),
      vy: Math.random() * 1.5 + 0.5,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      size: Math.random() * 4 + 3,
      color: BLOSSOM_COLORS.default[Math.floor(Math.random() * 4)],
      life: burst ? 60 + Math.random() * 40 : 200 + Math.random() * 100,
    };
  }

  getStageScale(stageId: StageId | string) {
    const scales: Record<StageId, number> = { seedling: 0.25, sapling: 0.45, young: 0.65, mature: 0.85, bloom: 1.0 };
    return scales[stageId as StageId] ?? 0.25;
  }

  drawPixelRect(x: number, y: number, w: number, h: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
  }

  drawTrunk(cx: number, baseY: number, scale: number, sway: number) {
    const trunkW = 8 * scale;
    const trunkH = 60 * scale;
    const offset = Math.sin(sway) * 3 * scale;

    // Bark texture
    for (let i = 0; i < trunkH; i += 4) {
      const shade = i % 8 === 0 ? '#5D4037' : '#4E342E';
      const wobble = Math.sin(i * 0.1 + sway) * 1.5;
      this.drawPixelRect(cx - trunkW / 2 + wobble + offset * (i / trunkH), baseY - trunkH + i, trunkW, 4, shade);
    }
  }

  drawBranch(x1: number, y1: number, x2: number, y2: number, thickness: number, color: string, sway: number) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t + Math.sin(sway + t * 2) * 2;
      const y = y1 + (y2 - y1) * t;
      this.drawPixelRect(x - thickness / 2, y - thickness / 2, thickness, thickness, color);
    }
  }

  drawBlossom(x: number, y: number, size: number, colors: string[], sway: number) {
    const ox = Math.sin(sway + x * 0.01) * 1.5;
    const oy = Math.cos(sway + y * 0.01) * 1;
    const cx = x + ox;
    const cy = y + oy;

    // 5 petals
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(angle) * size;
      const py = cy + Math.sin(angle) * size;
      this.drawPixelRect(px - size * 0.4, py - size * 0.4, size * 0.8, size * 0.8, colors[i % colors.length]);
    }
    // Center
    this.drawPixelRect(cx - 2, cy - 2, 4, 4, '#FFF8DC');
  }

  drawLeaf(x: number, y: number, size: number, color: string, sway: number) {
    const ox = Math.sin(sway + x * 0.02) * 1;
    this.drawPixelRect(x + ox, y, size, size * 0.6, color);
    this.drawPixelRect(x + ox + size * 0.3, y - size * 0.3, size * 0.5, size * 0.5, color);
  }

  generateBranches(stageId: StageId | string, scale: number, blossoms: SakuraState['blossoms']) {
    const branches = [];
    const total = blossoms.knowledge + blossoms.health + blossoms.life;

    if (stageId === 'seedling') {
      branches.push({ x1: 0, y1: 0, x2: 0, y2: -20 * scale, thickness: 3, type: 'stem' });
      return branches;
    }

    const branchCount = Math.min(3 + Math.floor(total / 3), 12);
    const configs = [
      { angle: -0.8, len: 35, y: -15 },
      { angle: 0.8, len: 35, y: -15 },
      { angle: -1.2, len: 45, y: -35 },
      { angle: 1.2, len: 45, y: -35 },
      { angle: -0.4, len: 30, y: -25 },
      { angle: 0.4, len: 30, y: -25 },
      { angle: -1.5, len: 40, y: -50 },
      { angle: 1.5, len: 40, y: -50 },
      { angle: -0.6, len: 50, y: -55 },
      { angle: 0.6, len: 50, y: -55 },
      { angle: -1.0, len: 55, y: -65 },
      { angle: 1.0, len: 55, y: -65 },
    ];

    for (let i = 0; i < branchCount; i++) {
      const c = configs[i % configs.length];
      const len = c.len * scale;
      branches.push({
        x1: 0,
        y1: c.y * scale,
        x2: Math.cos(c.angle) * len,
        y2: c.y * scale + Math.sin(c.angle) * len * 0.5,
        thickness: Math.max(2, 4 - i * 0.2),
        type: 'branch',
        index: i,
      });
    }
    return branches;
  }

  getBlossomAssignments(blossoms: SakuraState['blossoms'], branchCount: number) {
    const assignments = [];
    const types = [];
    for (const [type, count] of Object.entries(blossoms)) {
      for (let i = 0; i < count; i++) types.push(type);
    }
    // Shuffle deterministically based on counts
    for (let i = types.length - 1; i > 0; i--) {
      const j = (i * 7 + types.length) % (i + 1);
      [types[i], types[j]] = [types[j], types[i]];
    }

    for (let b = 0; b < branchCount; b++) {
      const count = Math.min(3, Math.ceil(types.length / branchCount));
      for (let j = 0; j < count; j++) {
        const idx = (b * count + j) % Math.max(types.length, 1);
        if (types.length > 0) {
          assignments.push({ branch: b, type: types[idx], offset: j * 0.3 + 0.5 });
        }
      }
    }
    return assignments;
  }

  drawSeedling(cx: number, baseY: number, scale: number, sway: number) {
    // Small sprout
    this.drawTrunk(cx, baseY, scale * 0.5, sway);
    const topY = baseY - 30 * scale;
    // Two tiny leaves
    this.drawLeaf(cx - 8, topY, 6, '#66BB6A', sway);
    this.drawLeaf(cx + 4, topY - 4, 6, '#81C784', sway);
    // Tiny pink bud
    this.drawBlossom(cx, topY - 8, 3, BLOSSOM_COLORS.default, sway);
  }

  draw(state: SakuraState, stageId: StageId | string, matsuri = false) {
    const { w, h, ctx } = this;
    ctx.clearRect(0, 0, w, h);

    const scale = this.getStageScale(stageId);
    const cx = w / 2;
    const baseY = h - 30;
    const sway = this.swayPhase;
    const growthBoost = this.growthAnim * 0.15;

    // Ground
    this.drawPixelRect(0, baseY, w, h - baseY, '#2D5016');
    for (let i = 0; i < w; i += 8) {
      this.drawPixelRect(i, baseY, 4, 3, '#3E6B1F');
    }

    if (stageId === 'seedling') {
      this.drawSeedling(cx, baseY, scale + growthBoost, sway);
    } else {
      this.drawTrunk(cx, baseY, scale + growthBoost, sway);

      const branches = this.generateBranches(stageId, scale + growthBoost, state.blossoms);
      const blossomAssign = this.getBlossomAssignments(state.blossoms, branches.length);

      branches.forEach((b, i) => {
        const color = i < 2 ? '#5D4037' : '#6D4C41';
        this.drawBranch(cx + b.x1, baseY + b.y1, cx + b.x2, baseY + b.y2, b.thickness, color, sway + i * 0.3);
      });

      // Leaves on branches
      branches.forEach((b, i) => {
        if (stageId !== 'bloom' && i % 2 === 0) {
          const mx = cx + (b.x1 + b.x2) / 2;
          const my = baseY + (b.y1 + b.y2) / 2;
          this.drawLeaf(mx - 4, my - 2, 5, '#4CAF50', sway + i);
        }
      });

      // Blossoms
      blossomAssign.forEach(({ branch, type, offset }) => {
        const b = branches[branch];
        if (!b) return;
        const tx = cx + b.x1 + (b.x2 - b.x1) * offset;
        const ty = baseY + b.y1 + (b.y2 - b.y1) * offset;
        const colors = BLOSSOM_COLORS[type] || BLOSSOM_COLORS.default;
        const size = type === 'life' ? 6 : 4;
        this.drawBlossom(tx, ty, size, colors, sway + branch);
      });

      // Default sakura blossoms for bloom stage
      if (stageId === 'bloom') {
        const extra = 8 + Math.min(state.blossoms.knowledge + state.blossoms.health + state.blossoms.life, 20);
        for (let i = 0; i < extra; i++) {
          const angle = (i / extra) * Math.PI * 2 + sway;
          const dist = (30 + (i % 5) * 8) * scale;
          const bx = cx + Math.cos(angle) * dist;
          const by = baseY - 50 * scale + Math.sin(angle) * dist * 0.4;
          this.drawBlossom(bx, by, 3 + (i % 3), BLOSSOM_COLORS.default, sway + i * 0.5);
        }
      }

      // Golden rings (birthday permanence)
      if (state.goldenRings?.length > 0) {
        state.goldenRings.forEach((year, i) => {
          const ringY = baseY - 20 - i * 6;
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, ringY, 12 + i * 3, 0, Math.PI);
          ctx.stroke();
          ctx.fillStyle = '#FFD700';
          ctx.font = '8px "Press Start 2P"';
          ctx.fillText(String(year).slice(-2), cx - 6, ringY + 2);
        });
      }
    }

    // Matsuri lanterns on tree
    if (matsuri) {
      for (let i = 0; i < 5; i++) {
        const lx = cx - 40 + i * 20;
        const ly = baseY - 80 * scale - Math.sin(sway + i) * 3;
        this.drawPixelRect(lx, ly, 8, 10, '#FF4444');
        this.drawPixelRect(lx + 1, ly + 10, 6, 3, '#CCAA00');
        ctx.fillStyle = '#FFAA00';
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.005 + i) * 0.2;
        ctx.beginPath();
        ctx.arc(lx + 4, ly + 5, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Falling petals
    if (this.petals.length < 15 && Math.random() < 0.03) {
      this.petals.push(this.createPetal());
    }

    this.petals = this.petals.filter((p) => {
      p.x += p.vx + Math.sin(this.swayPhase + p.y * 0.01) * 0.3;
      p.y += p.vy;
      p.rot += p.rotSpeed;
      p.life--;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();

      return p.life > 0 && p.y < h + 10;
    });

    if (this.growthAnim > 0) this.growthAnim -= 0.02;
  }

  animate() {
    this.swayPhase += 0.02;
    const state = this._state;
    const stageId = this._stageId;
    const matsuri = this._matsuri;
    if (state && stageId) this.draw(state, stageId, matsuri);
    this._raf = requestAnimationFrame(() => this.animate());
  }

  setState(state: SakuraState, stageId: StageId | string, matsuri = false) {
    this._state = state;
    this._stageId = stageId;
    this._matsuri = matsuri;
    if (!this._raf) {
      this.animate();
    }
  }

  updateRefs(state: SakuraState, stageId: StageId | string, matsuri = false) {
    this._state = state;
    this._stageId = stageId;
    this._matsuri = matsuri;
  }
}

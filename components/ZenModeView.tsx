'use client';

import { useEffect, useRef, useState } from 'react';
import { TreeRenderer } from '@/lib/tree-renderer';
import { LoFiRadio } from '@/lib/audio';
import type { SakuraState, StageId } from '@/lib/types';

interface ZenModeViewProps {
  active: boolean;
  state: SakuraState;
  stageId: StageId;
  matsuri: boolean;
  onExit: () => void;
}

export function ZenModeView({ active, state, stageId, matsuri, onExit }: ZenModeViewProps) {
  const treeCanvasRef = useRef<HTMLCanvasElement>(null);
  const petalsCanvasRef = useRef<HTMLCanvasElement>(null);
  const treeRendererRef = useRef<TreeRenderer | null>(null);
  const loFiRadioRef = useRef<LoFiRadio | null>(null);
  const [radioTrack, setRadioTrack] = useState('Synthwave breeze — ambient');

  useEffect(() => {
    loFiRadioRef.current = new LoFiRadio();
    return () => loFiRadioRef.current?.stop();
  }, []);

  useEffect(() => {
    if (!active || !treeCanvasRef.current) return;

    const renderer = new TreeRenderer(treeCanvasRef.current);
    treeRendererRef.current = renderer;
    renderer.resize();
    renderer.setState(state, stageId, matsuri);

    const petalsCanvas = petalsCanvasRef.current;
    if (!petalsCanvas) return;

    const ctx = petalsCanvas.getContext('2d')!;
    const colors = ['#FFB7C5', '#FFC0CB', '#FF69B4', '#FFE4E1', '#FFF0F5'];
    const petals = Array.from({ length: 30 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: Math.random() * 0.8 + 0.3,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const resize = () => {
      petalsCanvas.width = window.innerWidth;
      petalsCanvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let petalRaf: number;
    const loop = () => {
      ctx.clearRect(0, 0, petalsCanvas.width, petalsCanvas.height);
      petals.forEach((p) => {
        p.x += p.vx + Math.sin(Date.now() * 0.001 + p.y * 0.01) * 0.5;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        if (p.y > petalsCanvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * petalsCanvas.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      petalRaf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(petalRaf);
      if (renderer._raf) cancelAnimationFrame(renderer._raf);
      treeRendererRef.current = null;
    };
  }, [active]);

  useEffect(() => {
    if (active && treeRendererRef.current) {
      treeRendererRef.current.updateRefs(state, stageId, matsuri);
    }
  }, [active, state, stageId, matsuri]);

  const handleExit = () => {
    loFiRadioRef.current?.stop();
    setRadioTrack('Synthwave breeze — ambient');
    onExit();
  };

  if (!active) return null;

  return (
    <div className="zen-mode">
      <canvas ref={treeCanvasRef} className="zen-tree-canvas" />
      <canvas ref={petalsCanvasRef} className="zen-petals-canvas" />
      <div className="zen-radio">
        <div className="radio-window">
          <div className="radio-title">🎵 Sakura Radio</div>
          <div className="radio-visualizer">
            <span /><span /><span /><span /><span />
          </div>
          <div className="radio-controls">
            <button
              type="button"
              className="retro-btn"
              onClick={() => {
                loFiRadioRef.current?.start();
                setRadioTrack('♪ Lo-fi sakura breeze — now playing');
              }}
            >
              ▶ Play
            </button>
            <button
              type="button"
              className="retro-btn"
              onClick={() => {
                loFiRadioRef.current?.stop();
                setRadioTrack('Synthwave breeze — ambient');
              }}
            >
              ■ Stop
            </button>
          </div>
          <div className="radio-track">{radioTrack}</div>
        </div>
      </div>
      <button type="button" className="zen-exit" onClick={handleExit} title="Exit Zen Mode">
        ✕
      </button>
    </div>
  );
}

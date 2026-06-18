/** 8-bit chime sound effects via Web Audio API */

import type { BlossomType } from './types';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.08) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playGrowthChime() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.15, 'square', 0.06), i * 80));
}

export function playMilestoneChime(type: BlossomType) {
  const sequences: Record<BlossomType, number[]> = {
    knowledge: [440, 554, 659],
    health: [392, 494, 587],
    life: [523, 659, 784, 988, 1175],
  };
  const notes = sequences[type] || sequences.knowledge;
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.2, 'triangle', 0.07), i * 100));
}

export function playMatsuriFanfare() {
  const melody = [523, 587, 659, 784, 880, 988, 1047, 1175];
  melody.forEach((n, i) => setTimeout(() => playTone(n, 0.25, 'square', 0.08), i * 120));
}

/** Lo-fi ambient synth for Zen mode */
export class LoFiRadio {
  playing = false;
  nodes: OscillatorNode[] = [];
  interval: ReturnType<typeof setInterval> | null = null;

  start() {
    if (this.playing) return;
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    this.playing = true;

    const chords = [
      [261.63, 329.63, 392.00],
      [293.66, 369.99, 440.00],
      [329.63, 415.30, 493.88],
      [246.94, 311.13, 369.99],
    ];
    let chordIdx = 0;

    const playChord = () => {
      if (!this.playing) return;
      const chord = chords[chordIdx % chords.length];
      chordIdx++;

      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 3);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 4);
        this.nodes.push(osc);
      });
    };

    playChord();
    this.interval = setInterval(playChord, 4000);
  }

  stop() {
    this.playing = false;
    if (this.interval) clearInterval(this.interval);
    this.nodes.forEach((n) => { try { n.stop(); } catch {} });
    this.nodes = [];
  }
}

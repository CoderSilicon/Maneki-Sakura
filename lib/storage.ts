import type { BlossomType, GrowthStage, Milestone, SakuraState } from './types';

const STORAGE_KEY = 'sakura-growth-v1';

export const GROWTH_STAGES: GrowthStage[] = [
  { id: 'seedling', name: 'Seedling', minXp: 0, maxXp: 50 },
  { id: 'sapling', name: 'Sapling', minXp: 50, maxXp: 150 },
  { id: 'young', name: 'Young Tree', minXp: 150, maxXp: 300 },
  { id: 'mature', name: 'Mature Tree', minXp: 300, maxXp: 500 },
  { id: 'bloom', name: 'Full Bloom', minXp: 500, maxXp: Infinity },
];

export const BLOSSOM_TYPES: Record<BlossomType, { label: string; xp: number; color: string }> = {
  knowledge: { label: 'Knowledge', xp: 15, color: '#7B68EE' },
  health: { label: 'Health', xp: 12, color: '#4CAF50' },
  life: { label: 'Life Milestone', xp: 50, color: '#FFD700' },
};

export function getDefaultState(): SakuraState {
  return {
    xp: 0,
    blossoms: { knowledge: 0, health: 0, life: 0 },
    milestones: [],
    goldenRings: [],
    settings: {
      name: '',
      birthday: '',
      soundEnabled: true,
    },
    lastVisit: Date.now(),
  };
}

export function loadState(): SakuraState {
  if (typeof window === 'undefined') return getDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as Partial<SakuraState>;
    return {
      ...getDefaultState(),
      ...parsed,
      blossoms: { ...getDefaultState().blossoms, ...parsed.blossoms },
      settings: { ...getDefaultState().settings, ...parsed.settings },
    };
  } catch {
    return getDefaultState();
  }
}

export function saveState(state: SakuraState): void {
  if (typeof window === 'undefined') return;
  state.lastVisit = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getStage(xp: number): GrowthStage {
  for (let i = GROWTH_STAGES.length - 1; i >= 0; i--) {
    if (xp >= GROWTH_STAGES[i].minXp) return GROWTH_STAGES[i];
  }
  return GROWTH_STAGES[0];
}

export function getStageProgress(xp: number): number {
  const stage = getStage(xp);
  if (stage.maxXp === Infinity) return 1;
  const range = stage.maxXp - stage.minXp;
  return Math.min(1, Math.max(0, (xp - stage.minXp) / range));
}

export function addMilestone(state: SakuraState, title: string, type: BlossomType): Milestone | null {
  const config = BLOSSOM_TYPES[type];
  if (!config) return null;

  const milestone: Milestone = {
    id: crypto.randomUUID(),
    title: title.trim(),
    type,
    xp: config.xp,
    date: new Date().toISOString(),
  };

  state.milestones.unshift(milestone);
  if (state.milestones.length > 50) state.milestones.length = 50;

  state.xp += config.xp;
  state.blossoms[type] = (state.blossoms[type] || 0) + 1;

  saveState(state);
  return milestone;
}

export function isBirthdayToday(birthday: string): boolean {
  if (!birthday) return false;
  const today = new Date();
  const bday = new Date(birthday + 'T00:00:00');
  return today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate();
}

export function addGoldenRing(state: SakuraState): void {
  const year = new Date().getFullYear();
  if (!state.goldenRings.includes(year)) {
    state.goldenRings.push(year);
    saveState(state);
  }
}

export function resetState(): SakuraState {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return getDefaultState();
}

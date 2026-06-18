export type BlossomType = 'knowledge' | 'health' | 'life';
export type StageId = 'seedling' | 'sapling' | 'young' | 'mature' | 'bloom';

export interface Milestone {
  id: string;
  title: string;
  type: BlossomType;
  xp: number;
  date: string;
}

export interface SakuraSettings {
  name: string;
  birthday: string;
  soundEnabled: boolean;
}

export interface SakuraState {
  xp: number;
  blossoms: Record<BlossomType, number>;
  milestones: Milestone[];
  goldenRings: number[];
  settings: SakuraSettings;
  lastVisit: number;
}

export interface GrowthStage {
  id: StageId;
  name: string;
  minXp: number;
  maxXp: number;
}

/* ==================== 本地档案（localStorage） ====================
 * 积分 / 段位 / 成就 / 分阵营与分势力胜率。
 */
import type { Camp } from '../core/types';

const KEY = 'zhangmensha_profile_v1';

export interface Profile {
  name: string;
  avatar: string;
  score: number;
  wins: number;
  games: number;
  /** 分阵营胜率 */
  campWins: Record<string, number>;
  /** 分势力胜率 */
  powerWins: Record<string, number>;
  achievements: string[];
  themeMode: 'day' | 'night' | 'dusk';
  themeStyle: 'jade' | 'gold' | 'azure' | 'purple' | 'red' | 'green';
  sound: boolean;
}

const DEFAULT: Profile = {
  name: '本座',
  avatar: '🧙',
  score: 0,
  wins: 0,
  games: 0,
  campWins: {},
  powerWins: {},
  achievements: [],
  themeMode: 'night',
  themeStyle: 'jade',
  sound: true,
};

/** 段位（docs 境界：练气→化神） */
const LEVELS = ['练气', '筑基', '金丹', '元婴', '化神'] as const;

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<Profile>) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveProfile(p: Profile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* 隐私模式下写入失败则忽略 */
  }
}

export function levelOf(score: number): string {
  if (score < 100) return LEVELS[0];
  if (score < 300) return LEVELS[1];
  if (score < 700) return LEVELS[2];
  if (score < 1500) return LEVELS[3];
  return LEVELS[4];
}

export function levelProgress(score: number): number {
  const marks = [0, 100, 300, 700, 1500];
  let i = 0;
  for (let k = 0; k < marks.length; k++) if (score >= marks[k]) i = k;
  const from = marks[i];
  const to = marks[i + 1] ?? marks[i] + 500;
  return Math.min(100, Math.round(((score - from) / (to - from)) * 100));
}

/** 记录一局结果 */
export function recordGame(win: boolean, camp: Camp, power: string, delta: number): Profile {
  const p = loadProfile();
  p.games += 1;
  if (win) p.wins += 1;
  p.score = Math.max(0, p.score + (win ? delta : Math.round(delta / 3)));
  if (win) {
    p.campWins[camp] = (p.campWins[camp] ?? 0) + 1;
    p.powerWins[power] = (p.powerWins[power] ?? 0) + 1;
  }
  saveProfile(p);
  return p;
}

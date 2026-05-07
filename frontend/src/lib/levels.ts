/**
 * Chispa - Niveles, XP y constantes
 */
export type LevelId = 1 | 2 | 3 | 4;

export const LEVELS: Record<LevelId, { id: LevelId; name: string; tagline: string; color: string }> = {
  1: { id: 1, name: 'Chispa', tagline: 'El despertar creativo', color: '#FFEA00' },
  2: { id: 2, name: 'Llama', tagline: 'Saltos laterales', color: '#FF9F1C' },
  3: { id: 3, name: 'Hoguera', tagline: 'Conexiones lejanas', color: '#FF5470' },
  4: { id: 4, name: 'Infierno', tagline: 'Modo experto', color: '#8338EC' },
};

// XP needed to *reach* each level (cumulative)
export const XP_THRESHOLDS: Record<LevelId, number> = {
  1: 0,
  2: 150,
  3: 450,
  4: 1000,
};

export function levelFromXp(xp: number): LevelId {
  if (xp >= XP_THRESHOLDS[4]) return 4;
  if (xp >= XP_THRESHOLDS[3]) return 3;
  if (xp >= XP_THRESHOLDS[2]) return 2;
  return 1;
}

export function xpProgress(xp: number): { level: LevelId; current: number; needed: number; pct: number } {
  const level = levelFromXp(xp);
  const base = XP_THRESHOLDS[level];
  const next = level < 4 ? XP_THRESHOLDS[(level + 1) as LevelId] : XP_THRESHOLDS[4];
  const current = xp - base;
  const needed = level < 4 ? next - base : 1;
  const pct = level < 4 ? Math.min(1, current / needed) : 1;
  return { level, current, needed: level < 4 ? needed : current, pct };
}

export const PURPOSES: { id: string; label: string; emoji: string }[] = [
  { id: 'trabajo', label: 'Trabajo', emoji: '💼' },
  { id: 'arte', label: 'Arte', emoji: '🎨' },
  { id: 'problemas', label: 'Resolver problemas', emoji: '🧩' },
  { id: 'diversion', label: 'Pura diversión', emoji: '✨' },
];

export const COLORS = {
  yellow: '#FFEA00',
  yellowDark: '#DDB800',
  coral: '#FF5470',
  coralDark: '#D83A54',
  violet: '#8338EC',
  violetDark: '#6122B8',
  bg: '#FDF8F5',
  surface: '#FFFFFF',
  text: '#2B2118',
  muted: '#8C7A6B',
  green: '#58CC02',
  greenDark: '#46A302',
  border: '#E5D9D0',
  borderStrong: '#2B2118',
};

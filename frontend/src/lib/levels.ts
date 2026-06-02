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

// Mapea el nivel a una pose de la mascota
export function levelToPose(level: LevelId): 'sit_alert' | 'walking' | 'running' | 'eager_stand' {
  return ({ 1: 'sit_alert', 2: 'walking', 3: 'running', 4: 'eager_stand' } as const)[level];
}

export const COLORS = {
  // primary palette from Chispa mascot art
  orange: '#F2541B',
  orangeDark: '#C43E0F',
  yellow: '#FFD400',
  yellowDark: '#D9B400',
  purple: '#7A2BC4',
  purpleDark: '#5A1FA0',
  red: '#E91E2B',
  redDark: '#B81620',

  // aliases used across the app (mapped to the new palette)
  coral: '#E91E2B',
  coralDark: '#B81620',
  violet: '#7A2BC4',
  violetDark: '#5A1FA0',
  green: '#58CC02',
  greenDark: '#46A302',

  // surfaces
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceWarm: '#FFF6E8',
  text: '#1A1410',
  muted: '#7E6B5B',
  border: '#E8E2DA',
  borderStrong: '#1A1410',
};

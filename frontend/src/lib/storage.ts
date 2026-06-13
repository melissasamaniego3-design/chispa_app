import AsyncStorage from '@react-native-async-storage/async-storage';

// Free tier limits — daily caps
export const FREE_LIMITS = {
  trainerMessagesPerDay: 5,
  fusionsPerDay: 5,
} as const;

// XP rewards
export const XP_REWARDS = {
  challengeRetake: 25, // continue yesterday's challenge
  challengeNew: 15,    // start a fresh one
  challengeDefault: 20, // default if no choice was offered
  fusion: 15,
} as const;

export type DailyUsage = {
  date: string;            // YYYY-MM-DD
  trainerMessages: number;
  fusions: number;
};

export type Profile = {
  purpose: string | null;
  xp: number;
  streak: number;
  lastActive: string | null;
  lastChallengeDate: string | null;
  trainerSessionId: string;
  onboarded: boolean;
  notifications: boolean;
  premium: boolean;        // true if user has upgraded (placeholder)
  dailyUsage: DailyUsage;
};

const KEY = 'chispa.profile.v1';

const defaultUsage = (): DailyUsage => ({ date: todayStr(), trainerMessages: 0, fusions: 0 });

const defaultProfile = (): Profile => ({
  purpose: null,
  xp: 0,
  streak: 0,
  lastActive: null,
  lastChallengeDate: null,
  trainerSessionId: 'trainer-' + Math.random().toString(36).slice(2, 10),
  onboarded: false,
  notifications: true,
  premium: false,
  dailyUsage: defaultUsage(),
});

export async function loadProfile(): Promise<Profile> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return defaultProfile();
    const p = JSON.parse(raw);
    const merged: Profile = { ...defaultProfile(), ...p };
    // Roll over daily usage if the date changed
    if (!merged.dailyUsage || merged.dailyUsage.date !== todayStr()) {
      merged.dailyUsage = defaultUsage();
      await AsyncStorage.setItem(KEY, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return defaultProfile();
  }
}

export async function saveProfile(p: Profile): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
}

export async function updateProfile(patch: Partial<Profile>): Promise<Profile> {
  const cur = await loadProfile();
  const next = { ...cur, ...patch };
  await saveProfile(next);
  return next;
}

export async function resetProfile(): Promise<Profile> {
  const fresh = defaultProfile();
  await saveProfile(fresh);
  await AsyncStorage.removeItem(CHALLENGE_KEY);
  await AsyncStorage.removeItem(CHALLENGES_HISTORY_KEY);
  await AsyncStorage.removeItem(TRAINER_KEY);
  return fresh;
}

export function todayStr(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ============= USAGE TRACKING =============

export function getRemaining(p: Profile, kind: 'trainer' | 'fusion'): number {
  if (p.premium) return Infinity;
  const u = p.dailyUsage || defaultUsage();
  if (u.date !== todayStr()) return kind === 'trainer' ? FREE_LIMITS.trainerMessagesPerDay : FREE_LIMITS.fusionsPerDay;
  const used = kind === 'trainer' ? u.trainerMessages : u.fusions;
  const limit = kind === 'trainer' ? FREE_LIMITS.trainerMessagesPerDay : FREE_LIMITS.fusionsPerDay;
  return Math.max(0, limit - used);
}

export function canUse(p: Profile, kind: 'trainer' | 'fusion'): boolean {
  return getRemaining(p, kind) > 0;
}

export async function bumpUsage(kind: 'trainer' | 'fusion'): Promise<Profile> {
  const p = await loadProfile();
  if (p.premium) return p;
  const today = todayStr();
  let u = p.dailyUsage || defaultUsage();
  if (u.date !== today) u = { date: today, trainerMessages: 0, fusions: 0 };
  if (kind === 'trainer') u.trainerMessages += 1;
  else u.fusions += 1;
  const next = { ...p, dailyUsage: u };
  await saveProfile(next);
  return next;
}

// ============= STREAK / XP =============

export function applyChallengeCompletion(p: Profile, gainedXp: number): Profile {
  const today = todayStr();
  let streak = p.streak;
  if (p.lastChallengeDate === today) {
    // already counted today
  } else if (p.lastChallengeDate === yesterdayStr()) {
    streak = p.streak + 1;
  } else {
    streak = 1;
  }
  return {
    ...p,
    xp: p.xp + gainedXp,
    streak,
    lastActive: today,
    lastChallengeDate: today,
  };
}

// ============= CHALLENGES =============

export type CachedChallenge = {
  date: string;
  level: number;
  data: { title: string; prompt: string; hint: string | null; type: string };
  completed: boolean;
  feedback?: { feedback: string; next_push: string; xp: number };
  response?: string;
  xpReward?: number; // dynamic reward depending on user choice
  origin?: 'new' | 'retake'; // tracks whether user chose to retake
};

const CHALLENGE_KEY = 'chispa.challenge.v1';        // current (today's) challenge
const CHALLENGES_HISTORY_KEY = 'chispa.challenges.history.v1'; // history of past challenges (most recent first)

export async function loadCachedChallenge(): Promise<CachedChallenge | null> {
  const raw = await AsyncStorage.getItem(CHALLENGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveCachedChallenge(c: CachedChallenge): Promise<void> {
  await AsyncStorage.setItem(CHALLENGE_KEY, JSON.stringify(c));
  // also keep in history (replacing entry with same date)
  const hist = await loadChallengeHistory();
  const without = hist.filter((h) => h.date !== c.date);
  const next = [c, ...without].slice(0, 30); // keep last 30 days
  await AsyncStorage.setItem(CHALLENGES_HISTORY_KEY, JSON.stringify(next));
}

export async function loadChallengeHistory(): Promise<CachedChallenge[]> {
  const raw = await AsyncStorage.getItem(CHALLENGES_HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

/** Returns the most recent challenge that is NOT from today (yesterday or older). */
export async function loadPreviousChallenge(): Promise<CachedChallenge | null> {
  const hist = await loadChallengeHistory();
  const today = todayStr();
  const prev = hist.find((h) => h.date !== today);
  return prev ?? null;
}

// ============= TRAINER HISTORY =============

type Message = { role: 'user' | 'assistant'; content: string; ts: number };
const TRAINER_KEY = 'chispa.trainer.v1';

export async function loadTrainerHistory(): Promise<Message[]> {
  const raw = await AsyncStorage.getItem(TRAINER_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveTrainerHistory(msgs: Message[]): Promise<void> {
  await AsyncStorage.setItem(TRAINER_KEY, JSON.stringify(msgs));
}

export async function clearTrainerHistory(): Promise<void> {
  await AsyncStorage.removeItem(TRAINER_KEY);
}

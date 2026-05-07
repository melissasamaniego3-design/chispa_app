import AsyncStorage from '@react-native-async-storage/async-storage';

export type Profile = {
  purpose: string | null;
  xp: number;
  streak: number;
  lastActive: string | null; // YYYY-MM-DD
  lastChallengeDate: string | null;
  trainerSessionId: string;
  onboarded: boolean;
  notifications: boolean;
};

const KEY = 'chispa.profile.v1';

const defaultProfile = (): Profile => ({
  purpose: null,
  xp: 0,
  streak: 0,
  lastActive: null,
  lastChallengeDate: null,
  trainerSessionId: 'trainer-' + Math.random().toString(36).slice(2, 10),
  onboarded: false,
  notifications: true,
});

export async function loadProfile(): Promise<Profile> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return defaultProfile();
    const p = JSON.parse(raw);
    return { ...defaultProfile(), ...p };
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

// streak/xp logic helpers
export function applyChallengeCompletion(p: Profile, gainedXp: number): Profile {
  const today = todayStr();
  let streak = p.streak;
  if (p.lastChallengeDate === today) {
    // already did today, no streak change
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

// Cached daily challenge (per date + level)
type CachedChallenge = {
  date: string;
  level: number;
  data: { title: string; prompt: string; hint: string | null; type: string };
  completed: boolean;
  feedback?: { feedback: string; next_push: string; xp: number };
  response?: string;
};
const CHALLENGE_KEY = 'chispa.challenge.v1';

export async function loadCachedChallenge(): Promise<CachedChallenge | null> {
  const raw = await AsyncStorage.getItem(CHALLENGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveCachedChallenge(c: CachedChallenge): Promise<void> {
  await AsyncStorage.setItem(CHALLENGE_KEY, JSON.stringify(c));
}

// Trainer chat history
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

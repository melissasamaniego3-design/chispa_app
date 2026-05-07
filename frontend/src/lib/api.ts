const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`API ${path} ${res.status}: ${txt}`);
  }
  return res.json();
}

export type DailyChallenge = { title: string; prompt: string; hint: string | null; type: string };
export type ChallengeFeedback = { feedback: string; next_push: string; xp: number };
export type TrainerReply = { reply: string };
export type Concepts = { concept_a: string; concept_b: string; distance: number };
export type Fusion = { fusions: string[]; invitation: string };

export const api = {
  dailyChallenge: (level: number, purpose: string | null, seed?: string) =>
    post<DailyChallenge>('/challenge/daily', { level, purpose, seed }),

  challengeFeedback: (level: number, purpose: string | null, challenge: string, response: string) =>
    post<ChallengeFeedback>('/challenge/feedback', { level, purpose, challenge, response }),

  trainerChat: (sessionId: string, level: number, purpose: string | null, message: string, topic?: string) =>
    post<TrainerReply>('/idea-trainer/chat', {
      session_id: sessionId,
      level,
      purpose,
      message,
      topic,
    }),

  conceptsGenerate: (level: number, purpose: string | null) =>
    post<Concepts>('/concepts/generate', { level, purpose }),

  conceptsFuse: (level: number, purpose: string | null, conceptA: string, conceptB: string, userIdea?: string) =>
    post<Fusion>('/concepts/fuse', {
      level,
      purpose,
      concept_a: conceptA,
      concept_b: conceptB,
      user_idea: userIdea,
    }),
};

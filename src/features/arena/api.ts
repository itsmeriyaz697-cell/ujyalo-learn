/**
 * Thin client for /api/quiz-arena.
 *
 * The token is passed explicitly rather than read from a global so that every
 * call is tied to the signed-in user the caller already knows about. A 401 from
 * here means the session expired mid-quiz; the UI says so plainly instead of
 * quietly scoring the attempt locally, which would produce points that vanish.
 */
import type {
  ArenaDashboard,
  ArenaHome,
  LeaderboardPage,
  ProfileView,
  StartedAttempt,
  SubmitResult,
} from './types';

const ENDPOINT = '/api/quiz-arena';

export class ArenaApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit & { token?: string | null } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (init.token) headers.set('Authorization', `Bearer ${init.token}`);

  let response: Response;
  try {
    response = await fetch(path, { ...init, headers, credentials: 'same-origin' });
  } catch {
    throw new ArenaApiError(0, 'network', 'Could not reach the Arena. Check your connection and try again.');
  }

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const body = payload as { error?: { code?: string; message?: string } } | null;
    throw new ArenaApiError(
      response.status,
      body?.error?.code ?? 'unknown',
      body?.error?.message ?? 'The Arena could not complete that request.',
    );
  }
  return payload as T;
}

export async function getHome(token: string | null): Promise<ArenaHome> {
  return request<ArenaHome>(`${ENDPOINT}?action=home`, { token });
}

export async function getDashboard(token: string | null): Promise<ArenaDashboard> {
  return request<ArenaDashboard>(`${ENDPOINT}?action=me`, { token });
}

export async function getLeaderboard(
  scope: 'global' | 'nepal' | 'weekly',
  offset: number,
  token: string | null,
): Promise<LeaderboardPage> {
  return request<LeaderboardPage>(`${ENDPOINT}?action=leaderboard&scope=${scope}&offset=${offset}`, { token });
}

export async function getProfile(handle: string): Promise<ProfileView> {
  return request<ProfileView>(`${ENDPOINT}?action=profile&handle=${encodeURIComponent(handle)}`);
}

export async function claimHandle(handle: string, country: string, token: string | null): Promise<void> {
  await request(`${ENDPOINT}`, {
    method: 'POST',
    token,
    body: JSON.stringify({ action: 'claim', handle, country }),
  });
}

export async function changeCountry(country: string, token: string | null): Promise<void> {
  await request(`${ENDPOINT}`, {
    method: 'POST',
    token,
    body: JSON.stringify({ action: 'country', country }),
  });
}

export async function startQuiz(
  input: { category?: string; difficulty?: string; length?: number; daily?: boolean },
  token: string | null,
): Promise<StartedAttempt> {
  return request<StartedAttempt>(`${ENDPOINT}`, {
    method: 'POST',
    token,
    body: JSON.stringify({ action: 'start', ...input }),
  });
}

export async function submitQuiz(
  attemptId: string,
  answers: Record<string, number>,
  token: string | null,
): Promise<SubmitResult> {
  return request<SubmitResult>(`${ENDPOINT}`, {
    method: 'POST',
    token,
    body: JSON.stringify({ action: 'submit', attemptId, answers }),
  });
}

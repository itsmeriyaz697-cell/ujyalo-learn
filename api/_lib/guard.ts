import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AiRuntimeConfig } from './config.js';
import { publicAiHealth } from './config.js';
import { verifyFirebaseToken } from './auth.js';
import { checkAndConsume, hashClient, limitKey } from './rateLimit.js';
import { clientIp, sendError } from './http.js';

export interface GuardResult {
  uid: string | null;
  key: string;
  remainingToday: number;
}

/**
 * Shared protection for AI endpoints:
 *   1. provider must be configured (clear, safe message otherwise)
 *   2. authentication when configured/required
 *   3. per-instance rate limits
 *
 * Returns null after sending an error response.
 */
export async function guardAiRequest(
  req: VercelRequest,
  res: VercelResponse,
  config: AiRuntimeConfig,
): Promise<GuardResult | null> {
  if (!config.configured) {
    sendError(
      res,
      503,
      'not_configured',
      'The AI tutor is not configured yet. The site owner must set the AI provider environment variables.',
    );
    return null;
  }

  const auth = await verifyFirebaseToken(req);

  if (auth.configured && auth.reason === 'invalid_token') {
    sendError(res, 401, 'unauthorized', 'Your session has expired. Please log in again.');
    return null;
  }

  if (config.limits.requireAuth) {
    if (!auth.configured) {
      // Fail closed: never silently allow unauthenticated use when the owner
      // asked for authentication but the server cannot verify tokens.
      sendError(
        res,
        503,
        'not_configured',
        'Authentication is required but the server cannot verify accounts. The owner must set FIREBASE_PROJECT_ID and FIREBASE_WEB_API_KEY.',
      );
      return null;
    }
    if (!auth.user) {
      sendError(res, 401, 'unauthorized', 'Please log in to use the AI tutor.');
      return null;
    }
  }

  const ipHash = hashClient(clientIp(req));
  const key = limitKey(auth.user?.uid ?? null, ipHash);
  const decision = checkAndConsume(key, config.limits);

  if (!decision.allowed) {
    const retry = decision.retryAfterSeconds ?? 60;
    sendError(
      res,
      decision.reason === 'day' ? 429 : 429,
      'rate_limited',
      decision.reason === 'day'
        ? 'You have reached today’s AI usage limit. Please continue tomorrow — your notes and quizzes still work.'
        : 'Too many requests in a short time. Please wait a moment and try again.',
      { 'Retry-After': String(retry) },
    );
    return null;
  }

  return { uid: auth.user?.uid ?? null, key, remainingToday: decision.remainingToday };
}

/** Health payload is intentionally minimal and cannot reveal secrets. */
export function healthPayload(config: AiRuntimeConfig) {
  return {
    ok: true,
    ...publicAiHealth(config),
    serverTime: new Date().toISOString(),
  };
}

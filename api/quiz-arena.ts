/**
 * Global Quiz Arena API — /api/quiz-arena
 *
 * One endpoint, several actions, because the whole feature is one domain and
 * splitting it into six serverless functions would triple the cold-start cost
 * for no benefit at this scale.
 *
 *   GET  ?action=meta                       public: categories, points, badges
 *   GET  ?action=home                       public: meta + challenge + top three
 *   GET  ?action=leaderboard&scope=&offset= public
 *   GET  ?action=profile&handle=name        public: another student's profile
 *   GET  ?action=me                         auth:   your full dashboard payload
 *   POST  { action: 'claim', handle, country }        auth
 *   POST  { action: 'start', category, difficulty, length, daily? }  auth
 *   POST  { action: 'submit', attemptId, answers }    auth
 *   POST  { action: 'country', country }               auth
 *
 * Scoring happens here, never in the browser. See api/_lib/arena/service.ts.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleOptions, methodNotAllowed, rejectCrossOrigin, sendError, sendJson } from './_lib/http.js';
import { arenaDb, arenaEnv, arenaStatus, verifyCaller, type Caller } from './_lib/arena/store.js';
import {
  ArenaError,
  consumeRateLimit,
  updateCountry,
  claimProfile,
  getPlayer,
  leaderboard,
  meta,
  nepalRank,
  globalRank,
  pointsHistory,
  previousWeekChampions,
  profileByHandle,
  recentAttempts,
  startAttempt,
  submitAttempt,
  subjectPerformance,
  todaysChallenge,
  toPublicPlayer,
  type LeaderboardScope,
} from './_lib/arena/service.js';

export const config = { maxDuration: 30 };

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

function limited(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}

function queryValue(req: VercelRequest, key: string): string | null {
  const raw = req.query?.[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function bodyOf(req: VercelRequest): Record<string, unknown> {
  const body = req.body;
  if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
    } catch {
      /* falls through */
    }
  }
  return {};
}

function requireUser(caller: Caller | null): Caller {
  if (!caller) throw new ArenaError(401, 'unauthenticated', 'Sign in to take part in the Arena.');
  return caller;
}

/** A player's own dashboard, in one round trip. */
async function myDashboard(db: FirebaseFirestore.Firestore, uid: string) {
  const [player, challenge, recent, points, subjects, gRank, nRank] = await Promise.all([
    getPlayer(db, uid),
    todaysChallenge(db),
    recentAttempts(db, uid, 6),
    pointsHistory(db, uid, 12),
    subjectPerformance(db, uid),
    globalRank(db, uid),
    nepalRank(db, uid),
  ]);
  if (!player) return { needsProfile: true, challenge };
  return {
    needsProfile: false,
    challenge,
    player: toPublicPlayer(player),
    globalRank: gRank,
    nepalRank: nRank,
    recent,
    points,
    subjects,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method === 'POST' && rejectCrossOrigin(req, res)) return;
  limited(res);

  const env = arenaEnv();
  const db = arenaDb();

  // Unconfigured is a legitimate, clearly-reported state: the UI switches to
  // its labelled demo mode rather than pretending the board is real. A key that
  // exists but cannot be parsed is reported differently, because that one is a
  // fixable mistake rather than a missing step.
  if (!db || env.mode === 'unconfigured') {
    const status = arenaStatus();
    return sendJson(res, 200, {
      configured: false,
      reason: status.problem
        ? `Arena storage is misconfigured: ${status.problem}`
        : 'Arena storage is not configured on this deployment.',
      mode: 'demo',
      meta: null,
    });
  }

  const caller = await verifyCaller(req as unknown as { headers: Record<string, string | string[] | undefined> });

  try {
    if (req.method === 'GET') {
      const action = queryValue(req, 'action') ?? 'home';

      if (action === 'meta') {
        return sendJson(res, 200, { configured: true, mode: env.mode, meta: await meta() });
      }

      if (action === 'home') {
        const [metaData, challenge, top, champions] = await Promise.all([
          meta(),
          todaysChallenge(db),
          leaderboard(db, caller?.uid ?? null, 'global', 0, 3),
          previousWeekChampions(db),
        ]);
        let me = null;
        if (caller) {
          const player = await getPlayer(db, caller.uid);
          me = player ? { ...toPublicPlayer(player), globalRank: await globalRank(db, caller.uid) } : null;
        }
        return sendJson(res, 200, {
          configured: true,
          mode: env.mode,
          meta: metaData,
          challenge,
          top: top.rows,
          champions,
          me,
          needsProfile: caller ? me === null : false,
          signedIn: Boolean(caller),
        });
      }

      if (action === 'leaderboard') {
        const rawScope = queryValue(req, 'scope') ?? 'global';
        const scope = (['global', 'nepal', 'weekly'] as LeaderboardScope[]).includes(rawScope as LeaderboardScope)
          ? (rawScope as LeaderboardScope)
          : 'global';
        const offset = Number(queryValue(req, 'offset') ?? 0) || 0;
        return sendJson(res, 200, { configured: true, ...(await leaderboard(db, caller?.uid ?? null, scope, offset)) });
      }

      if (action === 'profile') {
        const handle = queryValue(req, 'handle');
        if (!handle) throw new ArenaError(400, 'missing_handle', 'Which player do you want to look at?');
        const view = await profileByHandle(db, handle);
        if (!view) throw new ArenaError(404, 'not_found', 'No player with that username.');
        return sendJson(res, 200, { configured: true, ...view });
      }

      if (action === 'me') {
        const user = requireUser(caller);
        return sendJson(res, 200, { configured: true, ...(await myDashboard(db, user.uid)) });
      }

      throw new ArenaError(400, 'unknown_action', 'Unknown Arena request.');
    }

    if (req.method === 'POST') {
      const user = requireUser(caller);
      const body = bodyOf(req);
      const action =
        typeof body.action === 'string' && body.action ? body.action : (queryValue(req, 'action') ?? '');

      if (action === 'claim') {
        const player = await claimProfile(db, user.uid, {
          handle: String(body.handle ?? ''),
          country: String(body.country ?? ''),
        });
        return sendJson(res, 200, { ok: true, player: toPublicPlayer(player) });
      }

      if (action === 'country') {
        await updateCountry(db, user.uid, String(body.country ?? ''));
        return sendJson(res, 200, { ok: true });
      }

      if (action === 'start') {
        // Starting is cheap but not free: this caps runaway loops.
        await consumeRateLimit(db, user.uid, { limit: 60, windowMs: 60 * 60 * 1000 });
        const attempt = await startAttempt(db, user.uid, {
          category: body.category,
          difficulty: body.difficulty,
          length: body.length,
          daily: body.daily === true,
        });
        return sendJson(res, 201, { ok: true, ...attempt });
      }

      if (action === 'submit') {
        const answers = (body.answers ?? {}) as Record<string, number>;
        const result = await submitAttempt(db, user.uid, String(body.attemptId ?? ''), answers);
        return sendJson(res, 200, { ok: true, ...result });
      }

      throw new ArenaError(400, 'unknown_action', 'Unknown Arena request.');
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    if (error instanceof ArenaError) {
      return sendError(res, error.status, error.code, error.message);
    }
    // Never leak internals to the browser; log the shape only.
    console.error('[arena] unexpected error', {
      name: (error as Error)?.name,
      message: (error as Error)?.message?.slice(0, 200),
    });
    return sendError(res, 500, 'arena_error', 'The Arena had a problem. Please try again in a moment.');
  }
}

// Keep the no-store helper honest even if a future edit drops the call.
export const __cache = NO_STORE;

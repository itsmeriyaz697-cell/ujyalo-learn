/**
 * Ujyalo Connect — Discord OAuth2 endpoints.
 *
 *   GET /api/connect/start?next=/connect     → 302 to Discord with state+PKCE
 *   GET /api/connect/callback?code&state      → verify, exchange, mint token
 *   GET /api/connect/session                  → hand the custom token over once
 *   POST /api/connect/logout                  → clear the handoff cookie
 *   GET /api/connect/status                   → is this deployment configured?
 *
 * The flow, and why each step is where it is:
 *
 *   1. start runs here, so the state value and the PKCE verifier are created on
 *      the server and never touch JavaScript. They leave only as an encrypted,
 *      httpOnly cookie.
 *   2. Discord redirects back to `callback`. The code is exchanged using the
 *      client secret, which exists only in this process.
 *   3. `callback` writes the profile and identity in one transaction, mints a
 *      Firebase custom token, and seals it into a 2-minute cookie.
 *   4. The browser lands on /connect/auth/finish, which calls `session` once to
 *      take the token. It never appears in a URL, a log or localStorage.
 *
 * Nothing here trusts the browser for identity: the uid comes from Discord's
 * `id` field, fetched with the access token this server obtained.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendError, sendJson } from '../_lib/http.js';
import { checkAndConsume, hashClient } from '../_lib/rateLimit.js';
import {
  authorizeUrl,
  challengeFor,
  configProblem,
  connectConfig,
  createVerifier,
  exchangeCode,
  fetchDiscordUser,
  openState,
  randomState,
  safeEqual,
  safeNext,
  sealState,
  STATE_COOKIE,
  STATE_TTL_MS,
  type StatePayload,
} from '../_lib/connect/oauth.js';
import { customTokenFor, connectStatus, upsertDiscordProfile } from '../_lib/connect/store.js';

export const config = { maxDuration: 20 };

const HANDOFF_COOKIE = 'ujyalo_connect_handoff';
const HANDOFF_TTL_MS = 2 * 60 * 1000;
const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

function cookie(name: string, value: string, maxAgeSeconds: number, path = '/'): string {
  const parts = [
    `${name}=${value}`,
    `Path=${path}`,
    `Max-Age=${maxAgeSeconds}`,
    'HttpOnly',
    // Lax, not Strict: the callback arrives as a top-level navigation from
    // discord.com, and Strict would withhold the cookie and fail every login.
    'SameSite=Lax',
  ];
  if (isProduction()) parts.push('Secure');
  return parts.join('; ');
}

function clearCookie(name: string, path = '/'): string {
  return `${name}=; Path=${path}; Max-Age=0; HttpOnly; SameSite=Lax${isProduction() ? '; Secure' : ''}`;
}

function readCookie(req: VercelRequest, name: string): string | null {
  const header = req.headers.cookie;
  const raw = Array.isArray(header) ? header.join('; ') : (header ?? '');
  for (const part of raw.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === name) return decodeURIComponent(trimmed.slice(eq + 1));
  }
  return null;
}

function clientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (value ?? '').split(',')[0].trim() || 'unknown';
}

function redirect(res: VercelResponse, location: string, cookies: string[] = []): void {
  res.statusCode = 302;
  res.setHeader('Location', location);
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (cookies.length) res.setHeader('Set-Cookie', cookies);
  res.end();
}

/** Where the browser is sent when something goes wrong, with a stable code. */
function authErrorUrl(siteUrl: string, code: string, next: string): string {
  const url = new URL('/connect/auth', siteUrl);
  url.searchParams.set('status', 'error');
  url.searchParams.set('reason', code);
  if (next && next !== '/connect') url.searchParams.set('next', next);
  return url.toString();
}

function siteUrl(req: VercelRequest): string {
  const configured = (process.env.VITE_SITE_URL ?? process.env.SITE_URL ?? '').trim();
  if (configured) return configured.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] ?? req.headers.host ?? 'localhost:5173';
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? (isProduction() ? 'https' : 'http');
  return `${proto}://${Array.isArray(host) ? host[0] : host}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = String((req.query?.action as string | undefined) ?? '').toLowerCase();
  const cfg = connectConfig();
  const site = siteUrl(req);

  // ── Status: public, and deliberately vague about why it is off ────────────
  if (action === 'status') {
    const storage = await connectStatus();
    // The reason is for the owner's eyes (server log), not the visitor's: a
    // public endpoint that names missing environment variables is a map for
    // anyone probing the deployment.
    if (!cfg.configured) console.warn('[connect] not configured:', configProblem(cfg.reason));
    sendJson(
      res,
      200,
      {
        configured: cfg.configured && storage.mode === 'configured',
        oauth: cfg.configured,
        storage: storage.mode,
      },
      NO_STORE,
    );
    return;
  }

  // ── Start ─────────────────────────────────────────────────────────────────
  if (action === 'start') {
    if (!cfg.configured) {
      redirect(res, authErrorUrl(site, 'not_configured', safeNext(req.query?.next as string)));
      return;
    }

    // Cheap abuse guard: starting a flow is free for us but not for Discord.
    const decision = checkAndConsume(`connect-start:${hashClient(clientIp(req))}`, {
      perMinute: 20,
      perDay: 200,
    });
    if (!decision.allowed) {
      redirect(res, authErrorUrl(site, 'rate_limited', safeNext(req.query?.next as string)));
      return;
    }

    const state = randomState();
    const verifier = createVerifier();
    const payload: StatePayload = {
      state,
      verifier,
      next: safeNext(req.query?.next as string),
      issuedAt: Date.now(),
    };

    const sealed = sealState(payload, cfg.sessionSecret);
    redirect(res, authorizeUrl(cfg, state, challengeFor(verifier)), [
      cookie(STATE_COOKIE, sealed, Math.floor(STATE_TTL_MS / 1000), '/api/connect'),
    ]);
    return;
  }

  // ── Callback ──────────────────────────────────────────────────────────────
  if (action === 'callback') {
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const sealed = readCookie(req, STATE_COOKIE);
    const payload = sealed ? openState(sealed, cfg.sessionSecret) : null;
    // The cookie is single-use regardless of what happens next.
    const expireState = clearCookie(STATE_COOKIE, '/api/connect');

    if (query.error) {
      // Someone pressed "Cancel" on the Discord screen. That is not an error
      // worth an alarm — it is a normal choice, and the page says so.
      redirect(res, authErrorUrl(site, query.error === 'access_denied' ? 'cancelled' : 'discord_error', payload?.next ?? '/connect'), [
        expireState,
      ]);
      return;
    }

    if (!payload || !query.state || !safeEqual(payload.state, query.state)) {
      redirect(res, authErrorUrl(site, 'invalid_state', '/connect'), [expireState]);
      return;
    }

    if (Date.now() - payload.issuedAt > STATE_TTL_MS) {
      redirect(res, authErrorUrl(site, 'expired', payload.next), [expireState]);
      return;
    }

    if (!query.code) {
      redirect(res, authErrorUrl(site, 'missing_code', payload.next), [expireState]);
      return;
    }

    const exchanged = await exchangeCode(cfg, query.code, payload.verifier);
    if (!exchanged.ok) {
      redirect(res, authErrorUrl(site, 'token_exchange_failed', payload.next), [expireState]);
      return;
    }

    const discordUser = await fetchDiscordUser(cfg, exchanged.accessToken);
    if (!discordUser) {
      redirect(res, authErrorUrl(site, 'profile_unavailable', payload.next), [expireState]);
      return;
    }

    const upsert = await upsertDiscordProfile(discordUser);
    if (!upsert.ok) {
      redirect(res, authErrorUrl(site, upsert.reason === 'conflict' ? 'identity_conflict' : 'storage_unavailable', payload.next), [
        expireState,
      ]);
      return;
    }

    const token = await customTokenFor(upsert.profile.uid);
    if (!token) {
      redirect(res, authErrorUrl(site, 'session_failed', payload.next), [expireState]);
      return;
    }

    const handoff = sealState(
      { state: upsert.profile.uid, verifier: token, next: payload.next, issuedAt: Date.now() },
      cfg.sessionSecret,
    );

    const finish = new URL('/connect/auth', site);
    finish.searchParams.set('status', 'finish');
    if (payload.next !== '/connect') finish.searchParams.set('next', payload.next);

    redirect(res, finish.toString(), [
      expireState,
      cookie(HANDOFF_COOKIE, handoff, Math.floor(HANDOFF_TTL_MS / 1000), '/api/connect'),
    ]);
    return;
  }

  // ── Session: hand the token over exactly once ─────────────────────────────
  if (action === 'session') {
    const sealed = readCookie(req, HANDOFF_COOKIE);
    const payload = sealed ? openState(sealed, cfg.sessionSecret) : null;
    const expire = clearCookie(HANDOFF_COOKIE, '/api/connect');

    if (!payload) {
      sendError(res, 401, 'no_pending_session', 'That sign-in has already been used or has expired. Start again.', {
        ...NO_STORE,
        'Set-Cookie': expire,
      });
      return;
    }

    res.setHeader('Set-Cookie', expire);
    // `verifier` carries the sealed custom token; `state` carries the uid.
    sendJson(res, 200, { uid: payload.state, token: payload.verifier, next: payload.next }, NO_STORE);
    return;
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  if (action === 'logout') {
    if (req.method !== 'POST') {
      sendError(res, 405, 'invalid_request', 'Use POST for this endpoint.', { ...NO_STORE, Allow: 'POST' });
      return;
    }
    // The Firebase session lives in the browser and is cleared by the client;
    // this only removes the short-lived server cookies so nothing stale can be
    // replayed on a shared device.
    res.setHeader('Set-Cookie', [clearCookie(HANDOFF_COOKIE, '/api/connect'), clearCookie(STATE_COOKIE, '/api/connect')]);
    sendJson(res, 200, { ok: true }, NO_STORE);
    return;
  }

  sendError(res, 404, 'invalid_request', 'Unknown connect action.', NO_STORE);
}

/**
 * Discord OAuth2 — the server half.
 *
 * Authorization Code flow with PKCE (S256), a signed-and-encrypted state
 * cookie, and no credential of any kind in the browser.
 *
 * What never leaves this process:
 *   - DISCORD_CLIENT_SECRET
 *   - the PKCE code verifier
 *   - the access token returned by Discord
 *
 * What the browser receives is a Firebase custom token, once, and then only a
 * Firebase session that Firebase itself manages.
 *
 * On purpose, Discord's endpoints are overridable by environment variable —
 * but only when the deployment is not production. That is what lets the whole
 * flow be tested end to end against a local mock, and it cannot be turned on
 * in production to redirect identity traffic somewhere else.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const PRODUCTION_HOSTS = {
  authorize: 'https://discord.com/oauth2/authorize',
  token: 'https://discord.com/api/oauth2/token',
  user: 'https://discord.com/api/users/@me',
};

export interface ConnectConfig {
  configured: boolean;
  reason:
    | 'ok'
    | 'missing_client_id'
    | 'missing_client_secret'
    | 'missing_redirect_uri'
    | 'missing_session_secret'
    | 'not_https';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  sessionSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userUrl: string;
  scopes: string[];
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

/**
 * Overrides exist for the local mock. In production they are ignored outright
 * rather than merely discouraged: if the env is misconfigured, the real
 * Discord endpoints must be used, not an attacker-controlled one.
 */
function endpoint(override: string | undefined, fallback: string): string {
  if (isProduction()) return fallback;
  if (!override) return fallback;
  try {
    const url = new URL(override);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}

export function connectConfig(): ConnectConfig {
  const clientId = (process.env.DISCORD_CLIENT_ID ?? '').trim();
  const clientSecret = (process.env.DISCORD_CLIENT_SECRET ?? '').trim();
  const redirectUri = (process.env.DISCORD_REDIRECT_URI ?? '').trim();
  const sessionSecret = (process.env.CONNECT_SESSION_SECRET ?? '').trim();

  const reason: ConnectConfig['reason'] = !clientId
    ? 'missing_client_id'
    : !clientSecret
      ? 'missing_client_secret'
      : !redirectUri
        ? 'missing_redirect_uri'
        : !sessionSecret
          ? 'missing_session_secret'
          : isProduction() && !redirectUri.startsWith('https://')
            ? 'not_https'
            : 'ok';

  return {
    configured: reason === 'ok',
    reason,
    clientId,
    clientSecret,
    redirectUri,
    sessionSecret,
    authorizeUrl: endpoint(process.env.DISCORD_AUTHORIZE_URL, PRODUCTION_HOSTS.authorize),
    tokenUrl: endpoint(process.env.DISCORD_TOKEN_URL, PRODUCTION_HOSTS.token),
    userUrl: endpoint(process.env.DISCORD_USER_URL, PRODUCTION_HOSTS.user),
    // Only what the feature uses. `identify` gives id/username/avatar,
    // `email` gives the address the brief asks to show when authorised.
    scopes: ['identify', 'email'],
  };
}

/** Message shown to the owner, never to a visitor. */
export function configProblem(reason: ConnectConfig['reason']): string | null {
  switch (reason) {
    case 'ok':
      return null;
    case 'missing_client_id':
      return 'DISCORD_CLIENT_ID is not set on this deployment.';
    case 'missing_client_secret':
      return 'DISCORD_CLIENT_SECRET is not set on this deployment.';
    case 'missing_redirect_uri':
      return 'DISCORD_REDIRECT_URI is not set on this deployment.';
    case 'missing_session_secret':
      return 'CONNECT_SESSION_SECRET is not set on this deployment.';
    case 'not_https':
      return 'DISCORD_REDIRECT_URI must use https in production.';
  }
}

// ── PKCE ────────────────────────────────────────────────────────────────────

const VERIFIER_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

/** 64 characters from the unreserved set, i.e. a valid RFC 7636 verifier. */
export function createVerifier(random: (n: number) => Buffer = randomBytes): string {
  const bytes = random(64);
  let out = '';
  for (let index = 0; index < 64; index += 1) {
    out += VERIFIER_ALPHABET[bytes[index] % VERIFIER_ALPHABET.length];
  }
  return out;
}

export function challengeFor(verifier: string): string {
  return createHash('sha256').update(verifier, 'ascii').digest('base64url');
}

export function randomState(random: (n: number) => Buffer = randomBytes): string {
  return random(32).toString('base64url');
}

// ── Sealed state cookie ─────────────────────────────────────────────────────

/**
 * The state cookie holds the verifier and the destination, encrypted with
 * AES-256-GCM and authenticated, so a visitor cannot edit it and a leaked
 * cookie cannot be replayed into a different state value.
 */
export interface StatePayload {
  state: string;
  verifier: string;
  next: string;
  issuedAt: number;
}

function keyFor(secret: string): Buffer {
  return createHash('sha256').update(secret, 'utf8').digest();
}

export function sealState(payload: StatePayload, secret: string): string {
  const key = keyFor(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64url');
}

export function openState(sealed: string, secret: string): StatePayload | null {
  try {
    const raw = Buffer.from(sealed, 'base64url');
    if (raw.length < 12 + 16 + 1) return null;
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', keyFor(secret), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(plaintext) as Partial<StatePayload>;
    if (typeof parsed.state !== 'string' || typeof parsed.verifier !== 'string') return null;
    return {
      state: parsed.state,
      verifier: parsed.verifier,
      next: typeof parsed.next === 'string' ? parsed.next : '/connect',
      issuedAt: typeof parsed.issuedAt === 'number' ? parsed.issuedAt : 0,
    };
  } catch {
    return null;
  }
}

/** Constant-time comparison of two strings of any length. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) {
    // Still compare something of equal length so the failure is not obviously
    // about length alone.
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export const STATE_COOKIE = 'ujyalo_connect_state';
export const STATE_TTL_MS = 10 * 60 * 1000;

/**
 * Only same-site relative paths may be used as a post-login destination.
 *
 * A `?next=` that could name another origin is an open redirect, and this site
 * is used by children — the exact bug class GHSA-wrjr-x8rr-h8h6 describes.
 */
export function safeNext(value: string | null | undefined): string {
  if (!value) return '/connect';
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return '/connect';
  }
  if (!decoded.startsWith('/')) return '/connect';
  // Reject protocol-relative (`//evil.com`), backslash tricks and encoded slashes.
  if (decoded.startsWith('//') || decoded.startsWith('/\\') || decoded.includes('\\')) return '/connect';
  if (/^\/%2f/i.test(decoded)) return '/connect';
  // Control characters (a raw tab, for example) can be normalised by the
  // browser into something that looks like a path but is not. Reject them by
  // code point rather than with a regex, which linters rightly flag.
  for (const character of decoded) {
    const code = character.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) return '/connect';
  }
  return decoded;
}

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
  discriminator?: string;
  avatar?: string | null;
  email?: string | null;
  verified?: boolean;
}

export function authorizeUrl(config: ConnectConfig, state: string, challenge: string): string {
  const url = new URL(config.authorizeUrl);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('scope', config.scopes.join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  // No `prompt=consent`: an existing user should be recognised and signed in
  // without being asked to re-approve every time.
  return url.toString();
}

export interface TokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

export async function exchangeCode(
  config: ConnectConfig,
  code: string,
  verifier: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true; accessToken: string; scope: string } | { ok: false; error: string }> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    code_verifier: verifier,
  });

  const response = await fetchImpl(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  });

  const text = await response.text();
  let parsed: TokenResponse = {};
  try {
    parsed = JSON.parse(text) as TokenResponse;
  } catch {
    return { ok: false, error: 'invalid_token_response' };
  }

  if (!response.ok || !parsed.access_token) {
    // Discord reports the reason in the body; keep it in the server log only.
    console.error('[connect] token exchange failed:', response.status, parsed.error, parsed.error_description);
    return { ok: false, error: parsed.error ?? 'token_exchange_failed' };
  }
  return { ok: true, accessToken: parsed.access_token, scope: (parsed as { scope?: string }).scope ?? '' };
}

export async function fetchDiscordUser(
  config: ConnectConfig,
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DiscordUser | null> {
  const response = await fetchImpl(config.userUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as Partial<DiscordUser>;
  if (!user.id || !user.username) return null;
  return {
    id: String(user.id),
    username: String(user.username),
    global_name: user.global_name ?? null,
    discriminator: user.discriminator,
    avatar: user.avatar ?? null,
    email: typeof user.email === 'string' ? user.email : null,
    verified: Boolean(user.verified),
  };
}

/**
 * A Discord identity maps to exactly one Firebase uid, derived rather than
 * allocated. Two sign-ups with the same Discord account therefore cannot
 * create two profiles even if they race: both compute the same uid, and the
 * identity document in Firestore is written in a transaction.
 */
export function uidForDiscordId(discordId: string): string {
  return `discord_${discordId}`;
}

export function avatarUrl(discordId: string, avatar: string | null | undefined, size = 128): string | null {
  if (!avatar) return null;
  const extension = avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${extension}?size=${size}`;
}

/**
 * A local stand-in for Discord's OAuth2 server.
 *
 * The Discord flow is the one part of Ujyalo Connect that cannot be exercised
 * against the real service in CI — it needs a registered application, a client
 * secret and a human clicking "Authorise". Without a mock, the honest report
 * would be "written but never run", which is exactly the kind of claim this
 * project refuses to make.
 *
 * It implements only what the real endpoints do for our two scopes:
 *
 *   GET  /oauth2/authorize   behaves like the consent screen: approves and
 *                            redirects with ?code&state, or refuses with
 *                            ?error=access_denied when asked to
 *   POST /api/oauth2/token   exchanges a code (checking PKCE) for a token
 *   GET  /api/users/@me      returns the profile for the Bearer token
 *
 * Deliberate behaviour worth knowing about:
 *   - the PKCE verifier is checked for real, so removing it from the client
 *     makes this test fail the way Discord would;
 *   - a code is single-use;
 *   - `?as=<name>` picks a different fake account, which is how the isolation
 *     test signs in as a second person.
 *
 * Usage:  node scripts/mock-discord.mjs 9097
 */
import http from 'node:http';
import { createHash, randomBytes } from 'node:crypto';

const PORT = Number(process.argv[2] ?? 9097);

/** Signed-in-as accounts available to the tests. */
const ACCOUNTS = {
  riyaz: {
    id: '100000000000000001',
    username: 'riyaz',
    global_name: 'Riyaz Chalise',
    avatar: 'a_0123456789abcdef',
    email: 'riyaz@example.test',
    verified: true,
  },
  aarati: {
    id: '100000000000000002',
    username: 'aarati',
    global_name: 'Aarati Sharma',
    avatar: null,
    email: 'aarati@example.test',
    verified: true,
  },
};

/** code → { verifierChallenge, account, redirectUri, used } */
const codes = new Map();
/** token → account key */
const tokens = new Map();
/** state → account, so /authorize can remember who approved */
const pendingStates = new Map();

/**
 * Test controls. The browser only ever navigates to our own /start endpoint,
 * so the "who approves" and "do they refuse" decisions are staged here in
 * advance rather than passed through the real authorization URL.
 */
let nextAccount = 'riyaz';
let nextDeny = false;

function json(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

function form(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/x-www-form-urlencoded' });
  res.end(new URLSearchParams(body).toString());
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);

  // ── Consent screen ───────────────────────────────────────────────────────
  if (url.pathname === '/oauth2/authorize') {
    const redirectUri = url.searchParams.get('redirect_uri');
    const state = url.searchParams.get('state') ?? '';
    const challenge = url.searchParams.get('code_challenge');
    const method = url.searchParams.get('code_challenge_method');
    const accountKey = url.searchParams.get('as') ?? nextAccount;
    const account = ACCOUNTS[accountKey];

    if (!redirectUri) return json(res, 400, { error: 'invalid_request', error_description: 'redirect_uri required' });
    if (!account) return json(res, 400, { error: 'unknown_account', error_description: accountKey });
    if (!challenge || method !== 'S256') {
      return json(res, 400, { error: 'invalid_request', error_description: 'PKCE S256 is required' });
    }

    // `deny=1` (or a staged refusal) is how the tests press "Cancel".
    if (url.searchParams.get('deny') === '1' || nextDeny) {
      const back = new URL(redirectUri);
      back.searchParams.set('error', 'access_denied');
      back.searchParams.set('state', state);
      res.writeHead(302, { Location: back.toString() });
      return res.end();
    }

    nextAccount = 'riyaz';
    nextDeny = false;
    const code = randomBytes(18).toString('base64url');
    codes.set(code, { challenge, account: accountKey, redirectUri, used: false });
    pendingStates.set(state, accountKey);

    const back = new URL(redirectUri);
    back.searchParams.set('code', code);
    back.searchParams.set('state', state);
    res.writeHead(302, { Location: back.toString() });
    return res.end();
  }

  // ── Token exchange ───────────────────────────────────────────────────────
  if (url.pathname === '/api/oauth2/token' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const code = params.get('code') ?? '';
      const verifier = params.get('code_verifier') ?? '';
      const clientSecret = params.get('client_secret') ?? '';
      const grantType = params.get('grant_type') ?? '';

      if (grantType !== 'authorization_code') {
        return json(res, 400, { error: 'unsupported_grant_type' });
      }
      if (!clientSecret) {
        // The real server refuses an unauthenticated confidential client.
        return json(res, 401, { error: 'invalid_client' });
      }

      const record = codes.get(code);
      if (!record || record.used) {
        return json(res, 400, { error: 'invalid_grant', error_description: 'code is invalid or already used' });
      }
      record.used = true;

      const computed = createHash('sha256').update(verifier, 'ascii').digest('base64url');
      if (computed !== record.challenge) {
        return json(res, 400, { error: 'invalid_grant', error_description: 'PKCE verification failed' });
      }
      if (params.get('redirect_uri') !== record.redirectUri) {
        return json(res, 400, { error: 'invalid_grant', error_description: 'redirect_uri mismatch' });
      }

      const token = randomBytes(24).toString('base64url');
      tokens.set(token, record.account);
      json(res, 200, { access_token: token, token_type: 'Bearer', expires_in: 604800, scope: 'identify email' });
    });
    return;
  }

  // ── Profile ──────────────────────────────────────────────────────────────
  if (url.pathname === '/api/users/@me') {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const accountKey = tokens.get(token);
    const account = accountKey ? ACCOUNTS[accountKey] : null;
    if (!account) return json(res, 401, { error: 'unauthorized' });
    return json(res, 200, account);
  }

  // ── Test control ─────────────────────────────────────────────────────────
  if (url.pathname === '/health') return json(res, 200, { ok: true });
  if (url.pathname === '/_reset') {
    codes.clear();
    tokens.clear();
    pendingStates.clear();
    nextAccount = 'riyaz';
    nextDeny = false;
    return json(res, 200, { ok: true });
  }
  if (url.pathname === '/_account') {
    const name = url.searchParams.get('name') ?? 'riyaz';
    if (!ACCOUNTS[name]) return json(res, 400, { error: 'unknown_account', name });
    nextAccount = name;
    return json(res, 200, { ok: true, next: name });
  }
  if (url.pathname === '/_deny') {
    nextDeny = url.searchParams.get('on') !== '0';
    return json(res, 200, { ok: true, deny: nextDeny });
  }

  json(res, 404, { error: 'not_found', path: url.pathname });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[mock-discord] listening on http://127.0.0.1:${PORT}`);
});

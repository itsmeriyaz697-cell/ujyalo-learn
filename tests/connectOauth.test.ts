import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  avatarUrl,
  challengeFor,
  configProblem,
  connectConfig,
  createVerifier,
  exchangeCode,
  fetchDiscordUser,
  openState,
  safeEqual,
  safeNext,
  sealState,
  uidForDiscordId,
  type StatePayload,
} from '@/../api/_lib/connect/oauth';

/**
 * The security-critical half of Discord sign-in.
 *
 * These assertions exist because the failure modes here are silent: a state
 * check that compares the wrong two values still "works" in a happy-path test,
 * and an unencrypted cookie still looks like a cookie.
 */

const SECRET = 'test-session-secret-0123456789';

function payload(overrides: Partial<StatePayload> = {}): StatePayload {
  return {
    state: 'state-value',
    verifier: 'verifier-value',
    next: '/connect',
    issuedAt: Date.now(),
    ...overrides,
  };
}

describe('PKCE', () => {
  it('creates a verifier inside RFC 7636 bounds using only unreserved characters', () => {
    const verifier = createVerifier();
    expect(verifier).toHaveLength(64);
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
  });

  it('derives the S256 challenge, not the plain verifier', () => {
    // The RFC 7636 appendix B vector.
    expect(challengeFor('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
    expect(challengeFor('abc')).not.toBe('abc');
  });

  it('produces a different verifier every time', () => {
    const seen = new Set(Array.from({ length: 50 }, () => createVerifier()));
    expect(seen.size).toBe(50);
  });
});

describe('state cookie', () => {
  it('round-trips through seal and open', () => {
    const original = payload();
    const opened = openState(sealState(original, SECRET), SECRET);
    expect(opened).toEqual(original);
  });

  it('never contains the verifier in plain text', () => {
    const sealed = sealState(payload({ verifier: 'super-secret-verifier' }), SECRET);
    expect(sealed).not.toContain('super-secret-verifier');
    expect(Buffer.from(sealed, 'base64url').toString('utf8')).not.toContain('super-secret-verifier');
  });

  it('rejects a cookie sealed with a different secret', () => {
    const sealed = sealState(payload(), SECRET);
    expect(openState(sealed, 'a-different-secret-entirely')).toBeNull();
  });

  it('rejects tampering of any kind', () => {
    const sealed = sealState(payload(), SECRET);
    const raw = Buffer.from(sealed, 'base64url');
    // Flip one bit in the ciphertext, the IV and the tag in turn.
    for (const offset of [0, 12, raw.length - 1]) {
      const copy = Buffer.from(raw);
      copy[offset] ^= 0x01;
      expect(openState(copy.toString('base64url'), SECRET)).toBeNull();
    }
  });

  it('rejects garbage without throwing', () => {
    for (const value of ['', 'not-a-cookie', 'AAAA', Buffer.alloc(200).toString('base64url')]) {
      expect(() => openState(value, SECRET)).not.toThrow();
      expect(openState(value, SECRET)).toBeNull();
    }
  });
});

describe('state comparison', () => {
  it('accepts only an exact match', () => {
    expect(safeEqual('abc123', 'abc123')).toBe(true);
    expect(safeEqual('abc123', 'abc124')).toBe(false);
    expect(safeEqual('abc123', 'abc1234')).toBe(false);
    expect(safeEqual('', '')).toBe(true);
    expect(safeEqual('', 'x')).toBe(false);
  });
});

describe('post-login destination', () => {
  it('allows same-site paths', () => {
    expect(safeNext('/connect')).toBe('/connect');
    expect(safeNext('/connect/c/see-2026?tab=chat')).toBe('/connect/c/see-2026?tab=chat');
    expect(safeNext('/')).toBe('/');
  });

  it('refuses anything that could leave the site', () => {
    for (const value of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      '/%2Fevil.example',
      'javascript:alert(1)',
      '\\\\evil.example',
      '\t/evil.example',
    ]) {
      expect(safeNext(value)).toBe('/connect');
    }
  });

  it('falls back to /connect when absent', () => {
    expect(safeNext(null)).toBe('/connect');
    expect(safeNext(undefined)).toBe('/connect');
    expect(safeNext('')).toBe('/connect');
  });
});

describe('identity mapping', () => {
  it('derives one uid per Discord id, deterministically', () => {
    expect(uidForDiscordId('123456789012345678')).toBe('discord_123456789012345678');
    expect(uidForDiscordId('123456789012345678')).toBe(uidForDiscordId('123456789012345678'));
    expect(uidForDiscordId('1')).not.toBe(uidForDiscordId('2'));
  });

  it('stays inside the Firebase uid length limit', () => {
    // Discord snowflakes are 17-20 digits today; the limit is 128 characters.
    expect(uidForDiscordId('9'.repeat(20)).length).toBeLessThan(128);
  });

  it('builds an avatar URL only when an avatar exists', () => {
    expect(avatarUrl('1', null)).toBeNull();
    expect(avatarUrl('1', 'abc')).toContain('/avatars/1/abc.png');
    // Animated avatars are gifs on Discord's CDN.
    expect(avatarUrl('1', 'a_abc')).toContain('.gif');
  });
});

describe('configuration', () => {
  const saved = { ...process.env };

  beforeEach(() => {
    for (const key of ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_REDIRECT_URI', 'CONNECT_SESSION_SECRET']) {
      delete process.env[key];
    }
    delete process.env.NODE_ENV;
    delete process.env.VERCEL_ENV;
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  it('reports exactly which variable is missing', () => {
    expect(connectConfig().reason).toBe('missing_client_id');
    process.env.DISCORD_CLIENT_ID = 'id';
    expect(connectConfig().reason).toBe('missing_client_secret');
    process.env.DISCORD_CLIENT_SECRET = 'secret';
    expect(connectConfig().reason).toBe('missing_redirect_uri');
    process.env.DISCORD_REDIRECT_URI = 'https://example.test/api/connect/callback';
    expect(connectConfig().reason).toBe('missing_session_secret');
    process.env.CONNECT_SESSION_SECRET = 'x';
    expect(connectConfig().reason).toBe('ok');
    expect(connectConfig().configured).toBe(true);
  });

  it('gives the owner a sentence for each reason', () => {
    expect(configProblem('ok')).toBeNull();
    expect(configProblem('missing_client_secret')).toMatch(/DISCORD_CLIENT_SECRET/);
  });

  it('requests only identify and email', () => {
    const cfg = connectConfig();
    expect(cfg.scopes).toEqual(['identify', 'email']);
  });

  it('ignores endpoint overrides in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.DISCORD_AUTHORIZE_URL = 'https://attacker.example/authorize';
    process.env.DISCORD_TOKEN_URL = 'https://attacker.example/token';
    process.env.DISCORD_USER_URL = 'https://attacker.example/me';
    const cfg = connectConfig();
    expect(cfg.authorizeUrl).toBe('https://discord.com/oauth2/authorize');
    expect(cfg.tokenUrl).toBe('https://discord.com/api/oauth2/token');
    expect(cfg.userUrl).toBe('https://discord.com/api/users/@me');
  });

  it('allows them outside production, for the local mock', () => {
    process.env.DISCORD_TOKEN_URL = 'http://127.0.0.1:9097/token';
    expect(connectConfig().tokenUrl).toBe('http://127.0.0.1:9097/token');
  });

  it('requires https for the redirect URI in production', () => {
    process.env.DISCORD_CLIENT_ID = 'id';
    process.env.DISCORD_CLIENT_SECRET = 'secret';
    process.env.CONNECT_SESSION_SECRET = 'x';
    process.env.DISCORD_REDIRECT_URI = 'http://example.test/cb';
    process.env.NODE_ENV = 'production';
    expect(connectConfig().reason).toBe('not_https');
  });
});

describe('token exchange', () => {
  const cfg = {
    ...connectConfig(),
    configured: true,
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'https://example.test/api/connect/callback',
    tokenUrl: 'https://discord.test/token',
    userUrl: 'https://discord.test/me',
  };

  it('posts the code, verifier and secret as form data', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = String(init.body);
      expect(body).toContain('code=the-code');
      expect(body).toContain('code_verifier=the-verifier');
      expect(body).toContain('grant_type=authorization_code');
      expect(body).toContain('client_secret=client-secret');
      expect(init.method).toBe('POST');
      return new Response(JSON.stringify({ access_token: 'tok', token_type: 'Bearer' }), { status: 200 });
    });

    const result = await exchangeCode(cfg as never, 'the-code', 'the-verifier', fetchMock as unknown as typeof fetch);
    expect(result).toEqual({ ok: true, accessToken: 'tok', scope: '' });
  });

  it('refuses a response with no access token', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 }));
    const result = await exchangeCode(cfg as never, 'c', 'v', fetchMock as unknown as typeof fetch);
    expect(result).toEqual({ ok: false, error: 'invalid_grant' });
  });

  it('survives a non-JSON body without throwing', async () => {
    const fetchMock = vi.fn(async () => new Response('<html>nope</html>', { status: 502 }));
    const result = await exchangeCode(cfg as never, 'c', 'v', fetchMock as unknown as typeof fetch);
    expect(result).toEqual({ ok: false, error: 'invalid_token_response' });
  });

  it('sends the access token as a Bearer header when reading the profile', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
      return new Response(
        JSON.stringify({ id: '42', username: 'riyaz', global_name: 'Riyaz', avatar: 'hash', email: 'a@b.c', verified: true }),
        { status: 200 },
      );
    });
    const user = await fetchDiscordUser(cfg as never, 'tok', fetchMock as unknown as typeof fetch);
    expect(user?.id).toBe('42');
    expect(user?.global_name).toBe('Riyaz');
    expect(user?.email).toBe('a@b.c');
  });

  it('treats a profile without an id as a failure', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ username: 'x' }), { status: 200 }));
    expect(await fetchDiscordUser(cfg as never, 'tok', fetchMock as unknown as typeof fetch)).toBeNull();
  });
});

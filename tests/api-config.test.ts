import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readAiConfig } from '../api/_lib/config';
import { isAdmin } from '../api/_lib/auth';

const ORIGINAL = { ...process.env };

const setEnv = (values: Record<string, string | undefined>) => {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
};

beforeEach(() => {
  process.env = { ...ORIGINAL };
  setEnv({
    AI_API_KEY: 'test-key',
    AI_API_BASE_URL: 'https://api.openai.com/v1',
    AI_MODEL: 'gpt-test',
    AI_ALLOWED_HOSTS: undefined,
    AI_DEV_ALLOW_INSECURE: undefined,
    ADMIN_UIDS: undefined,
  });
});

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe('AI configuration security', () => {
  it('is configured with a valid https provider on the allowlist', () => {
    const config = readAiConfig();
    expect(config.configured).toBe(true);
    expect(config.reason).toBe('ok');
    expect(config.baseUrl).toBe('https://api.openai.com/v1');
  });

  it('is not configured without an API key', () => {
    setEnv({ AI_API_KEY: undefined });
    const config = readAiConfig();
    expect(config.configured).toBe(false);
    expect(config.reason).toBe('missing_api_key');
  });

  it('is not configured without a model', () => {
    setEnv({ AI_MODEL: undefined });
    expect(readAiConfig().configured).toBe(false);
  });

  it('rejects a provider host that is not allowlisted (SSRF protection)', () => {
    setEnv({ AI_API_BASE_URL: 'https://evil.example.com/v1' });
    const config = readAiConfig();
    expect(config.configured).toBe(false);
    expect(config.reason).toBe('host_not_allowed');
  });

  it('rejects plain http providers unless explicitly allowed for local development', () => {
    setEnv({ AI_API_BASE_URL: 'http://api.openai.com/v1' });
    expect(readAiConfig().reason).toBe('invalid_base_url');

    setEnv({ AI_API_BASE_URL: 'http://127.0.0.1:9099/v1', AI_ALLOWED_HOSTS: '127.0.0.1', AI_DEV_ALLOW_INSECURE: 'true' });
    expect(readAiConfig().configured).toBe(true);
  });

  it('rejects URLs containing credentials or query strings', () => {
    setEnv({ AI_API_BASE_URL: 'https://user:pass@api.openai.com/v1' });
    expect(readAiConfig().reason).toBe('invalid_base_url');
    setEnv({ AI_API_BASE_URL: 'https://api.openai.com/v1?target=elsewhere' });
    expect(readAiConfig().reason).toBe('invalid_base_url');
  });

  it('honours a custom allowlist', () => {
    setEnv({ AI_API_BASE_URL: 'https://ai.my-school.edu/v1', AI_ALLOWED_HOSTS: 'ai.my-school.edu' });
    expect(readAiConfig().configured).toBe(true);
  });

  it('clamps numeric limits into safe ranges', () => {
    setEnv({ AI_RATE_LIMIT_PER_MINUTE: '-5', AI_MAX_REQUESTS_PER_DAY: '99999999', AI_MAX_BODY_KB: '0' });
    const config = readAiConfig();
    expect(config.limits.perMinute).toBe(1);
    expect(config.limits.perDay).toBe(100000);
    expect(config.limits.maxBodyKb).toBe(8);
  });
});

describe('admin allowlist', () => {
  it('never grants admin without configuration', () => {
    expect(isAdmin('any-uid')).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it('grants admin only to configured UIDs', () => {
    setEnv({ ADMIN_UIDS: 'uid-one, uid-two' });
    expect(isAdmin('uid-one')).toBe(true);
    expect(isAdmin('uid-two')).toBe(true);
    expect(isAdmin('uid-three')).toBe(false);
    expect(isAdmin('uid-one ')).toBe(false);
  });
});

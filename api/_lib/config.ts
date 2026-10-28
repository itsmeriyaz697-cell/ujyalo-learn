/**
 * Server-side AI configuration.
 *
 * Secrets live only in server environment variables (never VITE_*). The
 * provider base URL is validated against an allowlist to prevent the
 * endpoint from being used as a proxy for arbitrary destinations (SSRF).
 */

export interface AiRuntimeConfig {
  configured: boolean;
  /** Internal reason code; never returned verbatim to clients. */
  reason:
    | 'ok'
    | 'missing_api_key'
    | 'missing_base_url'
    | 'missing_model'
    | 'invalid_base_url'
    | 'host_not_allowed'
  providerName: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
  maxOutputTokens: number;
  temperature: number;
  allowedHosts: string[];
  /** Ask providers for strict JSON where they support it. */
  jsonMode: boolean;
  limits: {
    perMinute: number;
    perDay: number;
    maxBodyKb: number;
    requireAuth: boolean;
  };
  allowInsecureLocal: boolean;
}

const DEFAULT_ALLOWED_HOSTS = [
  'api.openai.com',
  'api.groq.com',
  'openrouter.ai',
  'generativelanguage.googleapis.com',
  'api.mistral.ai',
  'api.together.xyz',
  'api.deepseek.com',
];

function num(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseHosts(raw: string | undefined): string[] {
  const list = (raw ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return list.length ? list : DEFAULT_ALLOWED_HOSTS;
}

function normalizeBaseUrl(raw: string | undefined): { url: URL | null; problem?: AiRuntimeConfig['reason'] } {
  if (!raw?.trim()) return { url: null, problem: 'missing_base_url' };
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { url: null, problem: 'invalid_base_url' };
  }
  if (url.username || url.password) return { url: null, problem: 'invalid_base_url' };
  const allowInsecure = process.env.AI_DEV_ALLOW_INSECURE === 'true';
  const localHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(allowInsecure && localHost && url.protocol === 'http:')) {
    return { url: null, problem: 'invalid_base_url' };
  }
  if (url.search || url.hash) return { url: null, problem: 'invalid_base_url' };
  return { url };
}

export function readAiConfig(): AiRuntimeConfig {
  const allowedHosts = parseHosts(process.env.AI_ALLOWED_HOSTS);
  const { url, problem } = normalizeBaseUrl(process.env.AI_API_BASE_URL);
  const apiKey = (process.env.AI_API_KEY ?? '').trim();
  const model = (process.env.AI_MODEL ?? '').trim();

  let reason: AiRuntimeConfig['reason'] = 'ok';
  if (!apiKey) reason = 'missing_api_key';
  else if (problem) reason = problem;
  else if (url && !allowedHosts.includes(url.hostname.toLowerCase())) reason = 'host_not_allowed';
  else if (!model) reason = 'missing_model';

  return {
    configured: reason === 'ok',
    reason,
    providerName: (process.env.AI_PROVIDER_NAME ?? 'openai-compatible').trim().slice(0, 40),
    baseUrl: url ? url.toString().replace(/\/$/, '') : '',
    model,
    apiKey,
    timeoutMs: num(process.env.AI_REQUEST_TIMEOUT_MS, 45000, 5000, 120000),
    maxOutputTokens: num(process.env.AI_MAX_OUTPUT_TOKENS, 1200, 128, 8192),
    temperature: num(process.env.AI_TEMPERATURE, 0.4, 0, 1.5),
    allowedHosts,
    jsonMode: process.env.AI_JSON_MODE !== 'false',
    limits: {
      perMinute: num(process.env.AI_RATE_LIMIT_PER_MINUTE, 12, 1, 300),
      perDay: num(process.env.AI_MAX_REQUESTS_PER_DAY, 120, 1, 100000),
      maxBodyKb: num(process.env.AI_MAX_BODY_KB, 32, 8, 512),
      requireAuth: process.env.AI_REQUIRE_AUTH === 'true',
    },
    allowInsecureLocal: process.env.AI_DEV_ALLOW_INSECURE === 'true',
  };
}

/** Everest AI — Groq dedicated config with fallback to main AI config */
export function readEverestConfig(): AiRuntimeConfig {
  const everestKey = (process.env.EVEREST_API_KEY ?? '').trim();
  const everestUrl = (process.env.EVEREST_API_BASE_URL ?? '').trim();
  const everestModel = (process.env.EVEREST_MODEL ?? '').trim();
  const everestProvider = (process.env.EVEREST_PROVIDER_NAME ?? '').trim();
  const useEverest = Boolean(everestKey || everestUrl || everestModel);

  if (useEverest) {
    const baseUrl = everestUrl || process.env.AI_API_BASE_URL || '';
    const apiKey = everestKey || process.env.AI_API_KEY || '';
    const model = everestModel || process.env.AI_MODEL || '';
    const providerName = everestProvider || process.env.AI_PROVIDER_NAME || 'everest-groq';
    const allowedHosts = parseHosts(process.env.AI_ALLOWED_HOSTS);
    const { url, problem } = normalizeBaseUrl(baseUrl);
    let reason: AiRuntimeConfig['reason'] = 'ok';
    if (!apiKey) reason = 'missing_api_key';
    else if (problem) reason = problem;
    else if (url && !allowedHosts.includes(url.hostname.toLowerCase())) reason = 'host_not_allowed';
    else if (!model) reason = 'missing_model';
    return {
      configured: reason === 'ok',
      reason,
      providerName: providerName.slice(0, 40),
      baseUrl: url ? url.toString().replace(/\/$/, '') : '',
      model,
      apiKey,
      timeoutMs: num(process.env.AI_REQUEST_TIMEOUT_MS, 60000, 5000, 120000),
      maxOutputTokens: num(process.env.AI_MAX_OUTPUT_TOKENS, 4000, 128, 8192),
      temperature: num(process.env.AI_TEMPERATURE, 0.7, 0, 1.5),
      allowedHosts,
      jsonMode: process.env.AI_JSON_MODE !== 'false',
      limits: {
        perMinute: num(process.env.AI_RATE_LIMIT_PER_MINUTE, 30, 1, 300),
        perDay: num(process.env.AI_MAX_REQUESTS_PER_DAY, 500, 1, 100000),
        maxBodyKb: num(process.env.AI_MAX_BODY_KB, 64, 8, 512),
        requireAuth: process.env.AI_REQUIRE_AUTH === 'true',
      },
      allowInsecureLocal: process.env.AI_DEV_ALLOW_INSECURE === 'true',
    };
  }
  return readAiConfig();
}

/** Safe, public description for /api/health. Never includes the key. */
export function publicAiHealth(config: AiRuntimeConfig) {
  return {
    configured: config.configured,
    provider: config.configured ? config.providerName : undefined,
    model: config.configured ? config.model : undefined,
    authRequired: config.limits.requireAuth,
    limits: { perMinute: config.limits.perMinute, perDay: config.limits.perDay },
  };
}

export function publicEverestHealth(config: AiRuntimeConfig) {
  return {
    configured: config.configured,
    provider: config.configured ? config.providerName : 'everest-groq',
    model: config.configured ? config.model : undefined,
    authRequired: config.limits.requireAuth,
    limits: { perMinute: config.limits.perMinute, perDay: config.limits.perDay },
  };
}

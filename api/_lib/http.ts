import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Small HTTP helpers shared by all API functions. */

export interface ApiErrorBody {
  error: { code: string; message: string };
}

export function sendJson(res: VercelResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(JSON.stringify(body));
}

export function sendError(
  res: VercelResponse,
  status: number,
  code: string,
  message: string,
  headers: Record<string, string> = {},
) {
  sendJson(res, status, { error: { code, message } } satisfies ApiErrorBody, headers);
}

/**
 * Cross-origin write guard.
 *
 * Every state-changing endpoint here is called with fetch() from our own pages,
 * and browsers attach an Origin header to every non-GET request. A request that
 * arrives with an Origin belonging to somebody else is therefore either a
 * cross-site request forgery attempt or a script on another site using our API
 * on a visitor's behalf. Neither is something we want, so it is refused before
 * the body is even read.
 *
 * Requests with no Origin at all are allowed: those are server-to-server calls
 * and the test suites, which cannot be forged by a browser because a browser
 * always sends Origin on a cross-site POST.
 */
export function originAllowed(req: VercelRequest): boolean {
  const origin = header(req, 'origin');
  if (!origin) return true;
  if (origin === 'null') return false;

  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }

  const allowed = new Set<string>();
  for (const candidate of [header(req, 'x-forwarded-host'), header(req, 'host')]) {
    if (candidate) allowed.add(candidate.split(',')[0].trim().toLowerCase());
  }
  // The canonical site URL is a separate permitted origin: a custom domain and
  // the deployment URL both legitimately serve the same app.
  const site = process.env.VITE_SITE_URL || process.env.SITE_URL;
  if (site) {
    try {
      const host = new URL(site).host.toLowerCase();
      allowed.add(host);
      // An apex and its www host are the same site.
      allowed.add(host.startsWith('www.') ? host.slice(4) : `www.${host}`);
    } catch {
      /* an unparseable site URL simply contributes nothing */
    }
  }

  const originPort = new URL(origin).port;
  for (const host of allowed) {
    if (originHost === host) return true;
    // Local development runs the site and the API on different ports of one
    // host; the port is not part of the trust boundary there.
    const isLoopback = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(originHost);
    if (isLoopback && /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) && originPort === '') return true;
    if (isLoopback && host.split(':')[0] === originHost.split(':')[0]) return true;
  }
  return false;
}

function header(req: VercelRequest, name: string): string | undefined {
  const value = req.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

/** Returns true when the request was already answered and the handler must stop. */
export function rejectCrossOrigin(req: VercelRequest, res: VercelResponse): boolean {
  if (originAllowed(req)) return false;
  sendError(res, 403, 'cross_origin', 'This request came from another site and was refused.');
  return true;
}

export function methodNotAllowed(res: VercelResponse, allowed: string[]) {
  sendError(res, 405, 'invalid_request', `Use ${allowed.join(', ')} for this endpoint.`, {
    Allow: allowed.join(', '),
  });
}

const FALLBACK_MAX_BYTES = 32 * 1024;

/**
 * Reads and size-limits a JSON body. Vercel pre-parses JSON bodies, but the
 * local dev server passes raw strings, so both are supported.
 */
export async function readJsonBody(req: VercelRequest, maxKb = 32): Promise<unknown> {
  const limit = Math.max(1, maxKb || FALLBACK_MAX_BYTES / 1024) * 1024;
  const body = (req as VercelRequest & { body?: unknown }).body;
  if (body === undefined || body === null) return {};
  if (typeof body === 'string') {
    if (Buffer.byteLength(body, 'utf8') > limit) throw new BodyTooLargeError();
    try {
      return JSON.parse(body);
    } catch {
      throw new InvalidBodyError();
    }
  }
  if (typeof body === 'object') {
    // Guard against oversized pre-parsed payloads.
    if (Buffer.byteLength(JSON.stringify(body), 'utf8') > limit) throw new BodyTooLargeError();
    return body;
  }
  throw new InvalidBodyError();
}

export class BodyTooLargeError extends Error {}
export class InvalidBodyError extends Error {}

export function clientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : (forwarded ?? '').split(',')[0];
  return (req.headers['x-real-ip'] as string) || first.trim() || 'unknown';
}

export function handleOptions(res: VercelResponse) {
  res.setHeader('Allow', 'POST, OPTIONS');
  res.statusCode = 204;
  res.end();
}

export function noStore(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}

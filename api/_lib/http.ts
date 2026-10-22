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

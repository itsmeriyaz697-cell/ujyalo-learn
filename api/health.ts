import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readAiConfig } from './_lib/config.js';
import { healthPayload } from './_lib/guard.js';
import { handleOptions, methodNotAllowed, sendJson } from './_lib/http.js';

/**
 * Public service health. Exposes only whether the AI provider is configured,
 * the provider/model display names and the rate-limit policy.
 * It never returns key material, endpoints, or student data.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const payload = healthPayload(readAiConfig());
  res.setHeader('Cache-Control', 'no-store');
  return sendJson(res, 200, payload);
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readEverestConfig } from './_lib/config.js';
import { handleOptions, methodNotAllowed, sendJson } from './_lib/http.js';

/**
 * Public Everest health — exposes only whether provider is configured,
 * model/display names and limits. Never leaks keys.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const config = readEverestConfig();
  res.setHeader('Cache-Control', 'no-store');
  return sendJson(res, 200, {
    configured: config.configured,
    provider: config.configured ? config.providerName : undefined,
    model: config.configured ? config.model : undefined,
    models: [
      { id: 'openai/gpt-oss-120b', name: 'Everest Pro', badge: 'Recommended' },
      { id: 'openai/gpt-oss-20b', name: 'Everest Flash', badge: 'Fastest' },
      { id: 'llama-3.3-70b-versatile', name: 'Everest 70B' },
      { id: 'llama-3.1-8b-instant', name: 'Everest Mini' },
    ],
    personas: ['default', 'tutor', 'coder', 'writer', 'researcher', 'creative', 'nepali'],
    limits: { perMinute: config.limits.perMinute, perDay: config.limits.perDay },
  });
}

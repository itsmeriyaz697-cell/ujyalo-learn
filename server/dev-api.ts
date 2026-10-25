/**
 * Local development API server.
 *
 * Mirrors the Vercel serverless routes so `npm run dev` gives the same
 * behaviour as production. It is not used on Vercel.
 *
 *   npm run dev:api   →  http://localhost:8787/api/*
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PORT = Number(process.env.DEV_API_PORT ?? 8787);

// Resolve the repository root from this file, not from the shell's cwd, so the
// server works no matter where it is started from.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_BODY_BYTES = 64 * 1024;

/** Minimal .env loader (no extra dependency). */
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const full = path.resolve(ROOT, file);
    if (!fs.existsSync(full)) continue;
    for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

loadEnv();

type Handler = (req: http.IncomingMessage & { body?: unknown; query?: Record<string, string> }, res: http.ServerResponse) => unknown;

// Paths are relative to the repository root (ROOT below).
const ROUTES: Record<string, string> = {
  '/api/tutor': 'api/tutor.ts',
  '/api/tools': 'api/tools.ts',
  '/api/quiz': 'api/quiz.ts',
  '/api/quiz-arena': 'api/quiz-arena.ts',
  '/api/flashcards': 'api/flashcards.ts',
  '/api/health': 'api/health.ts',
};

/**
 * Dynamic routes, mirroring Vercel's `[action]` naming. The dev server has no
 * router, so the prefix is matched here and the segment is passed through as
 * `?action=`, which is exactly what the deployed function reads from
 * `req.query.action`.
 */
const DYNAMIC_ROUTES: Array<{ prefix: string; file: string; param: string }> = [
  { prefix: '/api/connect/', file: 'api/connect/[action].ts', param: 'action' },
];

function decorate(res: http.ServerResponse) {
  const response = res as http.ServerResponse & {
    status: (code: number) => typeof response;
    json: (body: unknown) => void;
    send: (body: unknown) => void;
  };
  response.status = (code: number) => {
    response.statusCode = code;
    return response;
  };
  response.json = (body: unknown) => {
    if (!response.getHeader('Content-Type')) response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(body));
  };
  response.send = (body: unknown) => {
    if (typeof body === 'object') response.json(body);
    else response.end(String(body));
  };
  return response;
}

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('BODY_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  let route = ROUTES[url.pathname];
  let dynamicParam: { name: string; value: string } | null = null;

  if (!route) {
    const match = DYNAMIC_ROUTES.find((entry) => url.pathname.startsWith(entry.prefix));
    if (match) {
      route = match.file;
      dynamicParam = { name: match.param, value: url.pathname.slice(match.prefix.length).replace(/\/$/, '') };
    }
  }

  if (!route) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: { code: 'invalid_request', message: 'Unknown API route.' } }));
    return;
  }

  const decorated = decorate(res);

  if (req.method === 'POST') {
    try {
      (req as http.IncomingMessage & { body?: unknown }).body = await readBody(req);
    } catch (error) {
      const tooLarge = (error as Error).message === 'BODY_TOO_LARGE';
      res.statusCode = tooLarge ? 413 : 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: {
            code: tooLarge ? 'payload_too_large' : 'invalid_request',
            message: tooLarge ? 'Request body too large.' : 'Request body must be valid JSON.',
          },
        }),
      );
      return;
    }
  }

  const query = Object.fromEntries(url.searchParams);
  if (dynamicParam) query[dynamicParam.name] = dynamicParam.value;
  (req as http.IncomingMessage & { query?: Record<string, string> }).query = query;

  try {
    const module = (await import(pathToFileURL(path.resolve(ROOT, route)).href)) as { default: Handler };
    const result = module.default(
      req as http.IncomingMessage & { body?: unknown; query?: Record<string, string> },
      decorated,
    );
    // Some handlers return a promise; make sure unexpected rejections are logged.
    if (result && typeof (result as Promise<unknown>).catch === 'function') {
      (result as Promise<unknown>).catch((error) => {
        console.error('[dev-api] handler error:', (error as Error).message);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: { code: 'upstream_error', message: 'Unhandled server error.' } }));
        } else {
          res.end();
        }
      });
    }
  } catch (error) {
    console.error('[dev-api] failed to load handler:', (error as Error).message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: { code: 'upstream_error', message: 'Server error.' } }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const configured = Boolean(process.env.AI_API_KEY && process.env.AI_API_BASE_URL && process.env.AI_MODEL);
  console.log(`[ujyalo] dev API on http://localhost:${PORT}  AI provider: ${configured ? 'configured' : 'NOT configured (see .env.example)'}`);
});

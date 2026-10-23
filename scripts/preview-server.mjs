#!/usr/bin/env node
/**
 * Preview the built site the way Vercel actually serves it.
 *
 * `vite preview` does not resolve `/courses` to `dist/courses/index.html`, so it
 * falls through to the SPA shell for every path and any SEO check run against
 * it is meaningless — it audits one page 41 times. Vercel resolves directory
 * indexes, and so does this.
 *
 * Resolution order, matching the deployed behaviour:
 *   /path        → dist/path/index.html → dist/path.html → dist/index.html (SPA)
 *   /path/       → dist/path/index.html
 *   asset        → served as-is
 *
 *   node scripts/preview-server.mjs [port]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

/**
 * SPA routes are declared in vercel.json, not guessed. Vercel resolves static
 * files first, then rewrites, then 404s — so /signup falls back to the shell
 * while /no-such-page genuinely 404s. Getting this order wrong makes a local
 * audit either see the shell on every page or 404 on every client route.
 */
const REWRITES = await readFile(path.resolve(process.cwd(), 'vercel.json'), 'utf8')
  .then((raw) => JSON.parse(raw).rewrites ?? [])
  .catch(() => []);

/**
 * Vercel's source syntax here is only ever an exact path or a `prefix/(.*)`
 * wildcard, so matching on those two shapes is exact and avoids re-inventing
 * path-to-regexp (which mangles `(.*)` when escaped carelessly).
 */
const matchesRewrite = (source, pathname) =>
  source.endsWith('/(.*)')
    ? pathname === source.slice(0, -5) || pathname.startsWith(source.slice(0, -4))
    : pathname === source;

const PORT = Number(process.argv[2] ?? process.env.PORT ?? 4173);
const DIST = path.resolve(process.cwd(), 'dist');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
};

async function isFile(target) {
  try {
    return (await stat(target)).isFile();
  } catch {
    return false;
  }
}

async function resolve(pathname) {
  const clean = decodeURIComponent(pathname.split('?')[0]);
  const candidates = clean.endsWith('/')
    ? [path.join(DIST, clean, 'index.html')]
    : [path.join(DIST, clean, 'index.html'), path.join(DIST, `${clean}.html`), path.join(DIST, clean)];

  for (const candidate of candidates) {
    if (!candidate.startsWith(DIST)) continue; // no traversal
    if (await isFile(candidate)) return candidate;
  }

  // A missing asset is a 404.
  if (path.extname(clean)) return null;

  // Client-side routes declared in vercel.json get the SPA shell.
  const rewrite = REWRITES.find((rule) => matchesRewrite(rule.source, clean));
  if (rewrite) {
    const destination = path.join(DIST, rewrite.destination);
    if (await isFile(destination)) return destination;
  }

  // Anything else is genuinely unknown, and matches what production returns.
  const notFound = path.join(DIST, '404.html');
  if (await isFile(notFound)) return { file: notFound, status: 404 };
  return path.join(DIST, 'index.html');
}

createServer(async (req, res) => {
  const resolved = await resolve(req.url ?? '/');

  if (!resolved) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const file = typeof resolved === 'string' ? resolved : resolved.file;
  const status = typeof resolved === 'string' ? 200 : resolved.status;

  try {
    const body = await readFile(file);
    res.writeHead(status, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('Read error');
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`preview server on http://localhost:${PORT} (resolving like Vercel)`);
});

/**
 * Serves dist/ the way Vercel does: real files and directory indexes win, and
 * only unknown SPA routes fall back to app-shell.html. `vite preview` does not
 * do this (it falls back to index.html for everything), which is why a course
 * page measured locally used to show the home page.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('../dist/', import.meta.url).pathname;
const PORT = Number(process.argv[2] ?? 4180);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

async function resolve(pathname) {
  const clean = normalize(decodeURIComponent(pathname.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const candidates = [join(ROOT, clean), join(ROOT, clean, 'index.html')];
  if (!extname(clean)) candidates.push(join(ROOT, `${clean}.html`));
  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      if (info.isFile()) return { file: candidate, status: 200 };
    } catch {
      /* try the next candidate */
    }
  }
  return { file: join(ROOT, 'app-shell.html'), status: 200 };
}

createServer(async (request, response) => {
  const { file } = await resolve(request.url ?? '/');
  const body = await readFile(file).catch(() => null);
  if (!body) {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  response.end(body);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`dist server on http://127.0.0.1:${PORT} (Vercel routing order)`);
});

#!/usr/bin/env node
/**
 * Internal link checker.
 *
 * Reads the built site in dist/, collects every internal href it can find, and
 * verifies each one resolves to a real page or asset. Runs without a server, so
 * it is fast enough for CI.
 *
 *   node scripts/check-links.mjs
 *
 * Catches: links to routes that do not exist, links to routes deleted from the
 * sitemap, anchors pointing at a page that was renamed, and hrefs left over from
 * a refactor. External links are listed but not fetched — that would make the
 * build depend on other people's servers.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');

if (!fs.existsSync(DIST)) {
  console.error('[links] dist/ not found — run `npm run build` first.');
  process.exit(1);
}

/** Every route the site publishes, from the sitemap. */
const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const routes = new Set(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname),
);

/** Routes served by the SPA but intentionally not in the sitemap. */
const PRIVATE_ROUTES = new Set([
  '/app',
  '/login',
  '/signup',
  '/onboarding',
  '/forgot-password',
  '/verify-email',
  '/search',
  '/admin',
]);

const isPrivate = (p) =>
  PRIVATE_ROUTES.has(p) || [...PRIVATE_ROUTES].some((r) => r !== '/' && p.startsWith(`${r}/`));

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const files = walk(DIST);
const broken = [];
const external = new Set();
const checked = new Set();

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const page = `/${path.relative(DIST, file).replace(/index\.html$/, '').replace(/\\/g, '/')}`;

  for (const match of html.matchAll(/href="([^"#][^"]*?)"/g)) {
    const href = match[1];

    if (/^(https?:)?\/\//i.test(href)) {
      if (!href.includes('ujyalo-learn.vercel.app')) external.add(href);
      continue;
    }
    if (/^(mailto:|tel:|data:|javascript:)/i.test(href)) continue;

    const clean = href.split('#')[0].split('?')[0];
    if (!clean || clean === '/') continue;
    if (checked.has(clean)) continue;
    checked.add(clean);

    const normalized = clean.replace(/\/$/, '') || '/';

    // A real file in dist (asset, icon, xml, txt).
    const assetPath = path.join(DIST, clean.replace(/^\//, ''));
    if (fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) continue;

    // A published route.
    if (routes.has(normalized)) continue;
    if (isPrivate(normalized)) continue;

    broken.push({ page, href });
  }
}

// Every sitemap route must have a file on disk.
const missingRoutes = [...routes].filter((route) => {
  const file = route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, route, 'index.html');
  return !fs.existsSync(file);
});

console.log(`[links] scanned ${files.length} HTML files, ${checked.size} unique internal targets`);
console.log(`[links] ${routes.size} published routes, ${external.size} distinct external links (not fetched)`);

if (missingRoutes.length) {
  console.error(`[links] ${missingRoutes.length} sitemap route(s) with no file:`);
  for (const route of missingRoutes) console.error(`  ✗ ${route}`);
}

if (broken.length) {
  console.error(`[links] ${broken.length} broken internal link(s):`);
  for (const { page, href } of broken.slice(0, 30)) console.error(`  ✗ ${page} -> ${href}`);
  if (broken.length > 30) console.error(`  … and ${broken.length - 30} more`);
  process.exit(1);
}

if (missingRoutes.length) process.exit(1);

console.log('[links] no broken internal links');

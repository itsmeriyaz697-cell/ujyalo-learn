#!/usr/bin/env node
/**
 * Validates the prerendered HTML in dist/ by reading it the way a crawler that
 * does not execute JavaScript would.
 *
 * This exists because the site failed an automated audit that crawled a single
 * page with JavaScript disabled: it saw an empty <div id="root">, reported a
 * missing H1, no footer, no privacy link, no breadcrumb and no call to action.
 * All of those are now present in the static HTML, and this script fails the
 * build if any of them disappears again.
 *
 * Run automatically after `npm run build`, or on its own: npm run check:prerender
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');
const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

if (!fs.existsSync(DIST)) {
  console.error('[prerender] dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const sitemap = path.join(DIST, 'sitemap.xml');
const routes = fs.existsSync(sitemap)
  ? [...fs.readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
      new URL(m[1]).pathname,
    )
  : [];

if (!routes.length) fail('sitemap.xml is missing or lists no routes');

const fileFor = (route) =>
  route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, route, 'index.html');

for (const route of routes) {
  const file = fileFor(route);
  if (!fs.existsSync(file)) {
    fail(`${route}: no prerendered file at ${path.relative(DIST, file)}`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const root = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<noscript>/);
  const body = root ? root[1] : '';

  if (!body) fail(`${route}: #root is empty — a JS-less crawler sees nothing`);
  if (!/<h1[ >]/.test(body)) fail(`${route}: no <h1> in the prerendered content`);
  if ((body.match(/<h1[ >]/g) ?? []).length > 1) fail(`${route}: more than one <h1>`);
  if (!/<header/.test(body) || !/<footer/.test(body)) fail(`${route}: missing <header> or <footer>`);
  if (!/<main/.test(body)) fail(`${route}: missing <main>`);
  if (!/href="\/privacy"/.test(body)) fail(`${route}: no link to /privacy`);
  if (!/href="\/contact"/.test(body)) fail(`${route}: no link to /contact`);
  if (!/href="\/signup"/.test(body)) fail(`${route}: no call to action`);

  if (route !== '/' && !/aria-label="Breadcrumb"/.test(body)) {
    fail(`${route}: no breadcrumb navigation`);
  }

  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!ld.length) fail(`${route}: no JSON-LD`);
  for (const [, json] of ld) {
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch {
      fail(`${route}: JSON-LD does not parse`);
      continue;
    }
    if (!parsed['@type']) fail(`${route}: a JSON-LD block has no @type`);
  }

  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  if (!description) fail(`${route}: no meta description`);
  if (description.length > 160) {
    fail(`${route}: meta description is ${description.length} chars (max 160)`);
  }
}

// FAQPage must only appear where the questions are actually on the page.
for (const route of routes) {
  const html = fs.readFileSync(fileFor(route), 'utf8');
  const hasFaqSchema = /"@type":"FAQPage"/.test(html);
  const allowed = route === '/' || route === '/faq';
  if (hasFaqSchema && !allowed) fail(`${route}: FAQPage schema without visible FAQ content`);
  if (!hasFaqSchema && allowed) fail(`${route}: FAQ is on the page but FAQPage schema is missing`);
}

// llms.txt
const llms = path.join(DIST, 'llms.txt');
if (!fs.existsSync(llms)) {
  fail('llms.txt is missing');
} else {
  const text = fs.readFileSync(llms, 'utf8');
  if (!text.startsWith('# ')) fail('llms.txt should start with an H1');
  // Links may be absolute (production domain) or relative; both must resolve to
  // a route the sitemap actually publishes.
  const listed = [...text.matchAll(/\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g)].map((m) =>
    m[1].startsWith('http') ? new URL(m[1]).pathname : m[1],
  );
  const known = new Set(routes);
  for (const link of listed) {
    if (!known.has(link)) fail(`llms.txt links to ${link}, which is not a public route`);
  }
  if (listed.length < routes.length) {
    fail(`llms.txt lists ${listed.length} pages but the sitemap has ${routes.length}`);
  }
  notes.push(`llms.txt lists ${new Set(listed).size} public pages`);
}

// ── One page per file ───────────────────────────────────────────────────────
// A non-greedy replace of <div id="root"> used to leave the previous page's
// markup behind, so a file could contain two complete pages (two <h1>s, two
// <main>s) and still pass every check above. Guard the shape explicitly.
for (const route of routes) {
  const file = route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, route.slice(1), 'index.html');
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const counts = {
    h1: (html.match(/<h1[\s>]/g) ?? []).length,
    main: (html.match(/<main[\s>]/g) ?? []).length,
    root: (html.match(/<div id="root">/g) ?? []).length,
    style: (html.match(/<style data-prerender>/g) ?? []).length,
  };
  if (counts.h1 !== 1) fail(`${route} has ${counts.h1} <h1> elements (expected 1)`);
  if (counts.main !== 1) fail(`${route} has ${counts.main} <main> elements (expected 1)`);
  if (counts.root !== 1) fail(`${route} has ${counts.root} #root containers (expected 1)`);
  if (counts.style !== 1) fail(`${route} has ${counts.style} prerender style blocks (expected 1)`);
}

// ── The app shell ───────────────────────────────────────────────────────────
// Client-only routes (/login, /app/*, unknown course slugs) are rewritten to
// this file. If it ever contains the home page again, those routes flash a
// page the visitor did not ask for.
const shell = path.join(DIST, 'app-shell.html');
if (!fs.existsSync(shell)) {
  fail('app-shell.html is missing — client-only routes would 404 or show the home page');
} else {
  const html = fs.readFileSync(shell, 'utf8');
  if (/class="pr"/.test(html)) fail('app-shell.html still contains prerendered page markup');
  if (!/<meta name="robots" content="noindex/.test(html)) fail('app-shell.html must be noindex');
  if (!/stylesheet/.test(html)) fail('app-shell.html must load the app stylesheet');
  if (!/id="root"/.test(html)) fail('app-shell.html must contain #root');
  notes.push('app-shell.html is clean, noindex, and carries the app bundle');
}

if (failures.length) {
  console.error(`[prerender] ${failures.length} problem(s):`);
  for (const problem of failures) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

console.log(`[prerender] ${routes.length} routes OK — H1, breadcrumbs, footer, schema and meta verified`);
for (const note of notes) console.log(`[prerender] ${note}`);

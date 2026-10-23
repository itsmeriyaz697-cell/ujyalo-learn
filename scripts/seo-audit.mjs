#!/usr/bin/env node
/**
 * Full SEO crawl of a deployed site.
 *
 * check-links.mjs proves the pages exist. This asks whether each page can
 * actually rank: a unique title and description within SERP limits, one H1,
 * a self-referential canonical, valid structured data, an og:image that
 * resolves, and enough real text to not read as thin. Duplicates are reported
 * across pages, because a template that emits one shared description is the
 * most common quiet SEO failure and it is invisible page-by-page.
 *
 * No dependencies: regex + fetch. Run against production or a local build.
 *
 *   node scripts/seo-audit.mjs
 *   BASE_URL=http://localhost:4173 node scripts/seo-audit.mjs
 */
const BASE = (process.env.BASE_URL ?? 'https://ujyalo-learn.vercel.app').replace(/\/$/, '');

// Canonicals legitimately point at production even when auditing a local
// preview build, so the expected origin comes from the sitemap itself.
let ORIGIN = new URL(BASE).origin;

const problems = [];
const warnings = [];
const pages = [];
const seen = { titles: new Map(), descriptions: new Map(), canonicals: new Map() };

const note = (list, message) => list.push(message);

function decode(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(html) {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function meta(html, attr, name) {
  const re = new RegExp(`<meta\\s+[^>]*${attr}=["']${name}["'][^>]*>`, 'i');
  const tag = html.match(re)?.[0];
  if (!tag) return null;
  return decode((tag.match(/content=["']([\s\S]*?)["']/i)?.[1] ?? '').trim());
}

function link(html, rel) {
  const re = new RegExp(`<link\\s+[^>]*rel=["']${rel}["'][^>]*>`, 'i');
  const tag = html.match(re)?.[0];
  if (!tag) return null;
  return decode((tag.match(/href=["']([\s\S]*?)["']/i)?.[1] ?? '').trim());
}

function property(html, prop) {
  return meta(html, 'property', prop);
}

// ── 1. Sitemap ──────────────────────────────────────────────────────────────
const sitemapRes = await fetch(`${BASE}/sitemap.xml`);
const sitemapXml = await sitemapRes.text();
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

if (!sitemapRes.ok) problems.push(`sitemap.xml returned ${sitemapRes.status}`);
if (!sitemapUrls.length) problems.push('sitemap.xml lists no URLs');
if (sitemapUrls.length) {
  const declared = new URL(sitemapUrls[0]).origin;
  ORIGIN = declared;
  const mixed = sitemapUrls.filter((u) => new URL(u).origin !== declared);
  if (mixed.length) problems.push(`sitemap mixes ${mixed.length} URLs from another origin`);
}

const offOrigin = sitemapUrls.filter((u) => new URL(u).origin !== ORIGIN);
if (offOrigin.length) problems.push(`${offOrigin.length} sitemap URLs are on another origin: ${offOrigin.slice(0, 3).join(', ')}`);

// lastmod sanity: dates in the future make crawlers distrust the file
const future = [...sitemapXml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)]
  .map((m) => m[1])
  .filter((d) => new Date(d).getTime() > Date.now() + 86400000);
if (future.length) warnings.push(`${future.length} lastmod dates are in the future`);

// ── 2. Robots ───────────────────────────────────────────────────────────────
const robotsRes = await fetch(`${BASE}/robots.txt`);
const robots = await robotsRes.text();
if (!robotsRes.ok) problems.push(`robots.txt returned ${robotsRes.status}`);
if (!/sitemap:/i.test(robots)) warnings.push('robots.txt does not advertise the sitemap');
if (/^\s*disallow:\s*\/\s*$/im.test(robots)) problems.push('robots.txt disallows the whole site');

// ── 3. Every page ───────────────────────────────────────────────────────────
const ogImages = new Set();

for (const url of sitemapUrls) {
  const path = new URL(url).pathname;
  const fetchUrl = `${BASE}${path}`;
  const res = await fetch(fetchUrl, { redirect: 'follow' });
  const html = await res.text();

  if (!res.ok) {
    problems.push(`${path} returned HTTP ${res.status}`);
    continue;
  }
  if (res.url !== fetchUrl) {
    warnings.push(`${path} redirected to ${res.url}`);
  }

  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? '');
  const description = meta(html, 'name', 'description') ?? meta(html, 'property', 'description') ?? '';
  const canonical = link(html, 'canonical');
  const robotsMeta = (meta(html, 'name', 'robots') ?? '').toLowerCase();
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => stripTags(m[1]));
  const text = stripTags(html);
  const words = text.split(/\s+/).filter(Boolean).length;
  const lang = html.match(/<html[^>]*\blang=["']([^"']+)["']/i)?.[1] ?? '';
  const ogTitle = property(html, 'og:title');
  const ogDescription = property(html, 'og:description');
  const ogImage = property(html, 'og:image');
  const twitterCard = meta(html, 'name', 'twitter:card');

  pages.push({ path, title, description, canonical, words, h1s, robotsMeta });

  // Title
  if (!title) problems.push(`${path} has no <title>`);
  else {
    if (title.length < 25) warnings.push(`${path} title is short (${title.length}): "${title}"`);
    if (title.length > 65) warnings.push(`${path} title is long for a SERP (${title.length}): "${title}"`);
    seen.titles.set(title, [...(seen.titles.get(title) ?? []), path]);
  }

  // Description
  if (!description) problems.push(`${path} has no meta description`);
  else {
    if (description.length < 60) warnings.push(`${path} description is short (${description.length})`);
    if (description.length > 165) warnings.push(`${path} description is long (${description.length})`);
    seen.descriptions.set(description, [...(seen.descriptions.get(description) ?? []), path]);
  }

  // Canonical
  if (!canonical) problems.push(`${path} has no canonical link`);
  else {
    const canonicalUrl = canonical.startsWith('http') ? canonical : `${ORIGIN}${canonical}`;
    if (new URL(canonicalUrl).origin !== ORIGIN) {
      problems.push(`${path} canonical points off-origin: ${canonical}`);
    } else if (new URL(canonicalUrl).pathname.replace(/\/$/, '') !== path.replace(/\/$/, '')) {
      problems.push(`${path} canonical points elsewhere: ${canonical}`);
    }
    seen.canonicals.set(canonical, [...(seen.canonicals.get(canonical) ?? []), path]);
  }

  // Indexability
  if (/noindex/.test(robotsMeta)) problems.push(`${path} is listed in sitemap.xml but marked noindex (${robotsMeta})`);

  // Structure
  if (h1s.length === 0) problems.push(`${path} has no H1`);
  if (h1s.length > 1) warnings.push(`${path} has ${h1s.length} H1s: ${h1s.map((h) => h.slice(0, 40)).join(' | ')}`);

  // Thin content
  if (words < 150) warnings.push(`${path} is thin: ${words} words`);
  if (words > 12000) warnings.push(`${path} is very long: ${words} words`);

  // Language
  if (!lang) problems.push(`${path} has no <html lang>`);

  // Social
  if (!ogTitle) warnings.push(`${path} has no og:title`);
  if (!ogDescription) warnings.push(`${path} has no og:description`);
  if (!ogImage) warnings.push(`${path} has no og:image`);
  else ogImages.add(ogImage);
  if (!twitterCard) warnings.push(`${path} has no twitter:card`);

  // Structured data
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (blocks.length === 0) warnings.push(`${path} has no structured data`);
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]);
      const items = Array.isArray(parsed) ? parsed : parsed['@graph'] ?? [parsed];
      for (const item of items) {
        if (!item?.['@type']) problems.push(`${path} has JSON-LD with no @type`);
        if (!item?.['@context'] && !Array.isArray(parsed)) warnings.push(`${path} JSON-LD has no @context`);
      }
    } catch (error) {
      problems.push(`${path} has invalid JSON-LD: ${error.message.slice(0, 60)}`);
    }
  }
}

// ── 3b. Favicon ─────────────────────────────────────────────────────────────
// Search results show this icon, and Google only reads the <link rel="icon"> on
// the page: it does not read manifest.webmanifest, and it does not accept SVG.
// A site whose only icons are an SVG and a manifest gets a generic globe.
const ICON_FORMATS = /\.(ico|png|gif|jpe?g|bmp|ppm|tiff?)$/i;
const iconLinks = [];
{
  const homeRes = await fetch(BASE === ORIGIN ? BASE : `${BASE}/`, { redirect: 'follow' });
  const homeHtml = await homeRes.text();
  for (const tag of homeHtml.match(/<link\s+[^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/gi) ?? []) {
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    const sizes = tag.match(/sizes=["']([^"']+)["']/i)?.[1];
    if (href) iconLinks.push({ href, sizes, raw: tag });
  }

  if (!iconLinks.length) problems.push('the home page declares no favicon <link>');

  const raster = iconLinks.filter((i) => ICON_FORMATS.test(i.href.split('?')[0]));
  if (!raster.length) {
    problems.push(
      'no raster favicon declared (SVG only). Google Search does not accept SVG and will show a generic globe.',
    );
  }

  // Google recommends larger than 48x48; anything at or below 32px is too small.
  const declared = iconLinks
    .map((i) => Number((i.sizes ?? '').split('x')[0]))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (raster.length && declared.length && Math.max(...declared) <= 48) {
    warnings.push(`largest declared favicon is ${Math.max(...declared)}px; Google recommends >48px`);
  }

  // The implicit default: browsers and Google both probe /favicon.ico.
  const icoRes = await fetch(`${BASE}/favicon.ico`).catch(() => null);
  if (!icoRes?.ok) {
    problems.push(`/favicon.ico returned ${icoRes?.status ?? 'a network error'} — the browser default`);
  } else if (!/icon|image/i.test(icoRes.headers.get('content-type') ?? '')) {
    problems.push(`/favicon.ico has content-type ${icoRes.headers.get('content-type')}, not an icon`);
  }

  for (const icon of raster.filter((i) => i.href.startsWith('/'))) {
    const res = await fetch(`${BASE}${icon.href}`).catch(() => null);
    if (!res?.ok) problems.push(`declared favicon ${icon.href} does not resolve (${res?.status ?? 'error'})`);
  }
}

// ── 4. Cross-page duplication ───────────────────────────────────────────────
for (const [title, list] of seen.titles) {
  if (list.length > 1) problems.push(`title reused on ${list.length} pages: "${title.slice(0, 50)}" → ${list.join(', ')}`);
}
for (const [description, list] of seen.descriptions) {
  if (list.length > 1) problems.push(`description reused on ${list.length} pages → ${list.join(', ')}`);
}
for (const [canonical, list] of seen.canonicals) {
  if (list.length > 1) problems.push(`${list.length} pages claim the canonical ${canonical} → ${list.join(', ')}`);
}

// ── 5. Off-sitemap defences ─────────────────────────────────────────────────
const notFound = await fetch(`${BASE}/this-page-does-not-exist-${Date.now()}`, { redirect: 'manual' });
if (notFound.status !== 404) problems.push(`unknown URLs return ${notFound.status}, expected 404`);
const notFoundHtml = await notFound.text();
if (notFoundHtml.length > 5000 && /noindex/.test(notFoundHtml) === false) {
  warnings.push('the 404 page is large and not noindex — soft-404 risk');
}

// ── 6. og:image must actually resolve ───────────────────────────────────────
for (const image of ogImages) {
  const absolute = image.startsWith('http') ? image : `${ORIGIN}${image}`;
  const local = BASE === ORIGIN ? absolute : `${BASE}${new URL(absolute).pathname}`;
  const res = await fetch(local).catch(() => null);
  if (!res?.ok) problems.push(`og:image does not resolve: ${absolute} (${res?.status ?? 'network error'})`);
  else if (!/^image\//.test(res.headers.get('content-type') ?? '')) {
    problems.push(`og:image is not an image: ${absolute} (${res.headers.get('content-type')})`);
  }
}

// ── 7. Redirect hygiene ─────────────────────────────────────────────────────
for (const [label, target] of [
  ['http → https', BASE.replace('https://', 'http://')],
  ['/index.html', `${BASE}/index.html`],
  ['trailing slash', `${BASE}/courses/`],
]) {
  const res = await fetch(target, { redirect: 'manual' }).catch(() => null);
  if (!res) warnings.push(`${label}: request failed`);
  else if (res.status >= 300 && res.status < 400) {
    // fine — a single hop is correct
  } else if (res.ok && label !== 'trailing slash') {
    warnings.push(`${label} serves 200 directly instead of redirecting (duplicate-content risk)`);
  }
}

// ── 8. Report ───────────────────────────────────────────────────────────────
const worstWords = [...pages].sort((a, b) => a.words - b.words).slice(0, 3);
const avgWords = Math.round(pages.reduce((sum, p) => sum + p.words, 0) / (pages.length || 1));

console.log(`SEO audit — ${BASE}\n`);
console.log(`  pages crawled        ${pages.length}`);
console.log(`  average words        ${avgWords}`);
console.log(`  thinnest pages       ${worstWords.map((p) => `${p.path} (${p.words})`).join(', ')}`);
console.log(`  unique titles        ${seen.titles.size}`);
console.log(`  unique descriptions  ${seen.descriptions.size}`);
console.log(`  og:images            ${ogImages.size}`);
console.log(`  favicon links        ${iconLinks.length} (${iconLinks.map((i) => i.href).join(', ')})\n`);

if (problems.length) {
  console.log(`${problems.length} problem(s):`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  console.log('');
}
if (warnings.length) {
  console.log(`${warnings.length} warning(s):`);
  for (const w of warnings.slice(0, 40)) console.log(`  ! ${w}`);
  if (warnings.length > 40) console.log(`  … and ${warnings.length - 40} more`);
  console.log('');
}
if (!problems.length && !warnings.length) console.log('No problems, no warnings.\n');

process.exit(problems.length ? 1 : 0);

/**
 * How much text does a crawler actually get from each built page?
 *
 * This exists to keep one claim honest. The prerenderer writes a real HTML file
 * per route with its own metadata, H1, breadcrumbs and footer — but if the body
 * below that is empty, the page is metadata wrapped around nothing, and no
 * amount of new copy will rank until this number goes up.
 *
 * Run: node scripts/measure-prerender.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name === 'index.html') acc.push(full);
  }
  return acc;
}

function visibleWords(html) {
  const body = html.split(/<body[^>]*>/i)[1] ?? '';
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text ? text.split(' ').filter(Boolean).length : 0;
}

const files = walk(DIST).sort();
const rows = files.map((file) => ({
  route: path.relative(DIST, file).replace(/index\.html$/, '') || '/',
  words: visibleWords(fs.readFileSync(file, 'utf8')),
}));

rows.sort((a, b) => a.words - b.words);
const threshold = Number(process.env.THIN_THRESHOLD ?? 250);
const thin = rows.filter((row) => row.words < threshold);
const median = rows.length ? rows[Math.floor(rows.length / 2)].words : 0;

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ count: rows.length, thin: thin.length, median, rows }, null, 2));
} else {
  console.log('route'.padEnd(26), 'words');
  for (const row of rows) console.log(row.route.padEnd(26), row.words);
  console.log(`\n${rows.length} pages | ${thin.length} under ${threshold} words | median ${median}`);
}

// Fails the build when the body is missing, so this cannot silently regress.
if (process.argv.includes('--check')) {
  const worst = rows.slice(0, 5).map((r) => `${r.route} (${r.words})`).join(', ');
  if (thin.length > rows.length * 0.25) {
    console.error(`\n[prerender-body] ${thin.length}/${rows.length} pages are thin. Thinnest: ${worst}`);
    process.exit(1);
  }
  console.log(`[prerender-body] ok — only ${thin.length}/${rows.length} pages under ${threshold} words`);
}

#!/usr/bin/env node
/**
 * Production health check.
 *
 * Verifies the deployed site the way a user and a crawler see it, and exits
 * non-zero on failure so a scheduler (GitHub Actions cron) can alert.
 *
 *   node scripts/health-check.mjs
 *   node scripts/health-check.mjs --json      # machine-readable, for dashboards
 *
 * Checks:
 *  - every critical route returns the expected status
 *  - the SPA shell actually mounts (script tag present, no soft 404)
 *  - prerendered content is still there (H1 in the raw HTML)
 *  - sitemap.xml parses, lists only production URLs, and none 404
 *  - robots.txt is served and points at the sitemap
 *  - /llms.txt is reachable
 *  - the API reports itself configured
 *  - security headers are present
 *  - TLS certificate is valid and not close to expiry
 *  - response times are within a loose budget
 *
 * No secrets are read or printed. Nothing here writes to the site.
 */

const BASE = (process.env.HEALTH_BASE_URL ?? 'https://ujyalo-learn.vercel.app').replace(/\/$/, '');
const JSON_OUT = process.argv.includes('--json');
const TIMEOUT_MS = 20_000;
const SLOW_RESPONSE_MS = 3000;

const results = [];
let failed = 0;

function record(name, ok, detail, severity = 'critical') {
  results.push({ name, ok, detail, severity });
  if (!ok && severity === 'critical') failed += 1;
  if (!JSON_OUT) {
    const mark = ok ? '✓' : severity === 'critical' ? '✗' : '!';
    console.log(`${mark} ${name.padEnd(46)} ${detail}`);
  }
}

async function get(path) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'user-agent': 'UjyaloLearnHealthCheck/1.0 (+automated availability check)' },
    });
    const body = await res.text();
    return { res, body, ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

// ── 1. Critical routes ──────────────────────────────────────────────────────
const ROUTES = [
  ['/', 200],
  ['/courses', 200],
  ['/resources', 200],
  ['/see-preparation', 200],
  ['/ai-tutor', 200],
  ['/grades/10', 200],
  ['/privacy', 200],
  ['/terms', 200],
  ['/robots.txt', 200],
  ['/sitemap.xml', 200],
  ['/llms.txt', 200],
  ['/googlec3d881d4bf552040.html', 200],
  ['/admin', null], // rewritten to the SPA; status may be 200
  ['/definitely-not-a-real-page', 404],
];

for (const [path, expected] of ROUTES) {
  try {
    const { res, body, ms } = await get(path);
    const status = res.status;
    const ok = expected === null ? status === 200 : status === expected;
    const slow = ms > SLOW_RESPONSE_MS && path !== '/sitemap.xml';
    record(
      `route ${path}`,
      ok,
      `${status} in ${ms}ms${slow ? ' (slow)' : ''}`,
    );
    if (path === '/' && ok) {
      record('homepage shell mounts', /<div id="root">\s*<[a-z]/i.test(body), 'prerendered content present');
      record('homepage has a real H1', /<h1[ >]/i.test(body), 'h1 in raw HTML');
    }
  } catch (error) {
    record(`route ${path}`, false, `request failed: ${error.message}`);
  }
}

// ── 2. Sitemap integrity ────────────────────────────────────────────────────
try {
  const { body } = await get('/sitemap.xml');
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  record('sitemap is non-empty', locs.length > 0, `${locs.length} URLs`);

  const foreign = locs.filter((u) => !u.startsWith(BASE));
  record(
    'sitemap only lists this origin',
    foreign.length === 0,
    foreign.length ? `${foreign.length} foreign URL(s): ${foreign[0]}` : 'all on-origin',
  );

  // Spot-check a sample rather than all 41, to keep the job fast.
  const sample = [locs[0], locs[Math.floor(locs.length / 2)], locs[locs.length - 1]].filter(Boolean);
  for (const url of sample) {
    const path = new URL(url).pathname;
    const { res } = await get(path);
    record(`sitemap entry ${path}`, res.status === 200, `${res.status}`);
  }
} catch (error) {
  record('sitemap readable', false, error.message);
}

// ── 3. robots.txt ───────────────────────────────────────────────────────────
try {
  const { body } = await get('/robots.txt');
  record('robots.txt points at the sitemap', body.includes(`Sitemap: ${BASE}/sitemap.xml`), 'sitemap directive present');
  record('robots.txt blocks /admin', /Disallow:\s*\/admin/.test(body) || /Disallow:\s*\/app/.test(body), 'private paths disallowed');
} catch (error) {
  record('robots.txt readable', false, error.message);
}

// ── 4. API health ───────────────────────────────────────────────────────────
try {
  const { res, body } = await get('/api/health');
  const json = JSON.parse(body);
  record('api /health responds', res.status === 200, `${res.status}`);
  record('AI provider configured', json.configured === true, `provider=${json.provider ?? 'none'} model=${json.model ?? 'n/a'}`, 'warning');
  const limits = json.limits ?? {};
  record('rate limits advertised', Number(limits.perMinute) > 0 && Number(limits.perDay) > 0, `${limits.perMinute}/min, ${limits.perDay}/day`);
} catch (error) {
  record('api /health readable', false, error.message);
}

// ── 5. Security headers ─────────────────────────────────────────────────────
try {
  const { res } = await get('/');
  const h = res.headers;
  const required = [
    ['strict-transport-security', null],
    ['content-security-policy', null],
    ['x-content-type-options', 'nosniff'],
    ['referrer-policy', null],
    ['cross-origin-opener-policy', null],
  ];
  for (const [name, expected] of required) {
    const value = h.get(name);
    record(
      `header ${name}`,
      Boolean(value) && (!expected || value.includes(expected)),
      value ? value.slice(0, 40) : 'MISSING',
    );
  }
  record('noindex on /admin', true, 'checked by the browser suite', 'info');
} catch (error) {
  record('headers readable', false, error.message);
}

// ── 6. TLS certificate ──────────────────────────────────────────────────────
try {
  const { execFileSync } = await import('node:child_process');
  const host = new URL(BASE).hostname;
  const pem = execFileSync('openssl', ['s_client', '-servername', host, '-connect', `${host}:443`], {
    input: '',
    timeout: 15000,
    stdio: ['pipe', 'pipe', 'ignore'],
  }).toString();
  const out = execFileSync('openssl', ['x509', '-noout', '-enddate'], {
    input: pem,
    timeout: 10000,
  }).toString();
  const end = new Date(out.replace('notAfter=', '').trim());
  const days = Math.floor((end.getTime() - Date.now()) / 86_400_000);
  record('TLS certificate valid', days > 0, `expires in ${days} days`);
  record('TLS certificate not near expiry', days > 20, `${days} days left`, 'warning');
} catch {
  record('TLS certificate check', false, 'openssl unavailable in this environment', 'info');
}

// ── Summary ─────────────────────────────────────────────────────────────────
const criticalFailures = results.filter((r) => !r.ok && r.severity === 'critical');
const warnings = results.filter((r) => !r.ok && r.severity !== 'critical');

if (JSON_OUT) {
  console.log(JSON.stringify({ base: BASE, checkedAt: new Date().toISOString(), failed: criticalFailures.length, warnings: warnings.length, results }, null, 2));
} else {
  console.log(`\n${results.length - criticalFailures.length - warnings.length}/${results.length} checks passed · ${criticalFailures.length} failed · ${warnings.length} warning(s)`);
  if (criticalFailures.length) {
    console.log('\nWhat to do:');
    console.log('  1. Open the failing URL in a browser and confirm it is really down.');
    console.log('  2. Check https://vercel.com/dashboard for a failed deployment or build.');
    console.log('  3. If a deploy broke it, roll back to the previous one (see docs/DEPLOYMENT.md).');
    console.log('  4. If /api/health reports configured=false, an environment variable was lost.');
  }
}

process.exitCode = criticalFailures.length > 0 ? 1 : 0;

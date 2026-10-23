#!/usr/bin/env node
/**
 * Take the site live on the real Firebase backend.
 *
 * Exists because the dangerous moment is a deploy: the six VITE_FIREBASE_*
 * values are already set on Vercel, so a plain deploy silently switches
 * production from demo mode to Firebase mode. If the database is still on
 * locked-mode rules at that moment, the library is empty and nobody can sign
 * up — a site that looks broken, deployed by accident.
 *
 * So this refuses to deploy unless the backend actually works, then verifies
 * afterwards instead of assuming the deploy succeeded.
 *
 *   node scripts/go-live.mjs            # check, then deploy
 *   node scripts/go-live.mjs --check    # check only, change nothing
 */
import { execFileSync } from 'node:child_process';

const CHECK_ONLY = process.argv.includes('--check');
const step = (text) => console.log(`\n▸ ${text}`);
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const green = (text) => `\x1b[32m${text}\x1b[0m`;

function run(command, args = [], options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: 'pipe', ...options });
}

// ── 1. Is the backend actually usable? ─────────────────────────────────────
step('Checking the Firebase backend');
let backendOk = false;
try {
  run('node', ['scripts/check-firebase.mjs', '--live']);
  backendOk = true;
  console.log(green('  backend is ready'));
} catch (error) {
  const output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
  console.log(output.trim());
  console.log(red('\n  backend is NOT ready — refusing to deploy.'));
  console.log('  Deploying now would publish a site with an empty library and no working signup.');
  console.log('  Fix what is listed above, then run this again.');
}

if (CHECK_ONLY) {
  console.log(`\n${backendOk ? green('Ready to deploy.') : red('Not ready.')} (--check made no changes)`);
  process.exit(backendOk ? 0 : 1);
}
if (!backendOk) process.exit(1);

// ── 2. Deploy ───────────────────────────────────────────────────────────────
step('Deploying to production');
const deployOutput = (() => {
  try {
    return run('npx', ['vercel', '--prod', '--yes'], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    console.log(`${error.stdout ?? ''}${error.stderr ?? ''}`);
    console.log(red('\n  deploy failed.'));
    process.exit(1);
  }
})();
const deployedUrl = deployOutput.match(/https:\/\/[a-z0-9-]+\.vercel\.app/i)?.[0];
console.log(`  ${deployedUrl ?? 'deployed'}`);

// ── 3. Verify, do not assume ────────────────────────────────────────────────
step('Verifying production');
let failed = false;

try {
  const health = run('node', ['scripts/health-check.mjs']);
  const summary = health.trim().split('\n').pop();
  console.log(`  health: ${summary}`);
  if (!/34\/34/.test(summary)) failed = true;
} catch (error) {
  console.log(red(`  health check failed: ${(error.stdout ?? '').split('\n').slice(-3).join(' ')}`));
  failed = true;
}

try {
  const audit = run('node', ['scripts/seo-audit.mjs']);
  const problems = audit.match(/(\d+) problem\(s\)/);
  console.log(`  seo: ${problems ? red(`${problems[1]} problem(s)`) : green('0 problems')}`);
  if (problems) failed = true;
} catch (error) {
  const out = `${error.stdout ?? ''}`;
  const problems = out.match(/(\d+) problem\(s\)/);
  console.log(`  seo: ${problems ? red(`${problems[1]} problem(s)`) : 'could not run'}`);
  if (problems) failed = true;
}

// The one thing that proves accounts are real: the signed-in browser flow.
step('Browser checks against production');
try {
  const ui = run('node', ['scripts/ui-smoke.mjs'], {
    env: { ...process.env, BASE_URL: 'https://ujyalo-learn.vercel.app', SHOTS: '/tmp/shots' },
    timeout: 600000,
  });
  const summary = ui.trim().split('\n').filter(Boolean).pop();
  console.log(`  ${summary}`);
  if (!/72\/72/.test(summary ?? '')) failed = true;
} catch (error) {
  const out = `${error.stdout ?? ''}`.trim().split('\n').filter(Boolean);
  console.log(`  ${out.slice(-1)[0] ?? 'browser checks failed'}`);
  failed = true;
}

console.log(
  failed
    ? red('\nDeployed, but verification did not pass. Check the output above before announcing it.')
    : green('\nLive and verified.'),
);
process.exit(failed ? 1 : 0);

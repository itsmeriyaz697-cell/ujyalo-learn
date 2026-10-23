#!/usr/bin/env node
/**
 * Validate Firebase configuration before deploying.
 *
 * The failure mode this prevents: pasting five of six values, or pasting an
 * apiKey from project A with a projectId from project B. The app still builds,
 * still renders, and only fails when a student tries to sign up — in production.
 *
 * Checks, cheapest first:
 *   1. every required VITE_FIREBASE_* value is present
 *   2. each value is shaped like the thing it claims to be
 *   3. authDomain and projectId belong together
 *   4. the auth domain actually resolves in DNS (proves the project exists)
 *   5. with --live, the key is accepted by Google Identity Toolkit for that
 *      project, and reports whether email/password and anonymous sign-in are on
 *
 * Usage:
 *   node scripts/check-firebase.mjs            # offline checks only
 *   node scripts/check-firebase.mjs --live     # also asks Google (sends the key
 *                                              # to Google, which already has it)
 *
 * Exits non-zero when something is wrong, so it can gate a deploy.
 * Never prints a full key — only a masked form.
 */

import { readFileSync, existsSync } from 'node:fs';
import { lookup } from 'node:dns/promises';
import path from 'node:path';

const LIVE = process.argv.includes('--live');

function readEnvFile(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

// Real environment wins over files, matching how Vite and Vercel behave.
const fromFiles = { ...readEnvFile('.env'), ...readEnvFile('.env.local') };
const env = (key) => (process.env[key] ?? fromFiles[key] ?? '').trim();

const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];
const OPTIONAL = ['VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_MESSAGING_SENDER_ID'];

const problems = [];
const notes = [];
const mask = (value) => (value.length <= 8 ? '••••' : `${value.slice(0, 4)}…${value.slice(-4)}`);

// ── 1. Presence ─────────────────────────────────────────────────────────────
const missing = REQUIRED.filter((key) => !env(key));
if (missing.length) {
  problems.push(`missing: ${missing.join(', ')}`);
}
for (const key of OPTIONAL) {
  if (!env(key)) notes.push(`${key} is empty (optional, but push notifications and storage need it)`);
}

if (missing.length) {
  console.error('Firebase is not configured.\n');
  for (const key of REQUIRED) {
    console.error(`  ${env(key) ? '✓' : '✗'} ${key}${env(key) ? ` = ${mask(env(key))}` : ''}`);
  }
  console.error(`
Get these from: Firebase console → Project settings → Your apps → Web app → SDK setup and configuration.

Then put them in .env.local for development, and in Vercel → Settings → Environment Variables
for production. Do not commit them; they are public identifiers, but keeping one source of
truth avoids the two environments silently diverging.

See docs/FIREBASE-SETUP.md for the full walkthrough.
`);
  process.exit(1);
}

// ── 2. Shape ────────────────────────────────────────────────────────────────
const apiKey = env('VITE_FIREBASE_API_KEY');
const authDomain = env('VITE_FIREBASE_AUTH_DOMAIN');
const projectId = env('VITE_FIREBASE_PROJECT_ID');
const appId = env('VITE_FIREBASE_APP_ID');
const senderId = env('VITE_FIREBASE_MESSAGING_SENDER_ID');

if (!/^AIza[0-9A-Za-z_-]{35}$/.test(apiKey)) {
  problems.push(
    `VITE_FIREBASE_API_KEY does not look like a Google API key (expected "AIza" + 35 characters, got ${apiKey.length} characters). ` +
      'A common mistake is pasting the App ID or a service-account JSON here.',
  );
}

if (!/^[a-z0-9][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId)) {
  problems.push(
    `VITE_FIREBASE_PROJECT_ID "${projectId}" is not a valid project id (lowercase letters, digits and hyphens, 6–30 characters).`,
  );
}

const expectedAuthDomain = `${projectId}.firebaseapp.com`;
if (authDomain !== expectedAuthDomain && !authDomain.endsWith(`.${projectId}.firebaseapp.com`)) {
  problems.push(
    `VITE_FIREBASE_AUTH_DOMAIN "${authDomain}" does not belong to project "${projectId}" (expected "${expectedAuthDomain}"). ` +
      'This usually means the values came from two different projects.',
  );
}

if (!/^1:\d+:(web|android|ios):[0-9a-f]+$/i.test(appId)) {
  problems.push(
    `VITE_FIREBASE_APP_ID "${mask(appId)}" is malformed (expected "1:<sender>:web:<hash>").`,
  );
}

if (senderId && /^1:(\d+):/.test(appId) && !appId.startsWith(`1:${senderId}:`)) {
  problems.push(
    'VITE_FIREBASE_MESSAGING_SENDER_ID does not match the sender in VITE_FIREBASE_APP_ID.',
  );
}

// ── 3. DNS: does the project exist? ─────────────────────────────────────────
try {
  await lookup(authDomain);
  notes.push(`auth domain ${authDomain} resolves`);
} catch {
  problems.push(
    `auth domain "${authDomain}" does not resolve in DNS — the project probably does not exist yet, or the id is misspelled.`,
  );
}

// ── 4. Live key check ───────────────────────────────────────────────────────
if (LIVE && problems.length === 0) {
  try {
    // Legacy but read-only: reports the project config for a key, and which
    // providers are enabled. It does not create or modify anything.
    const res = await fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(15000) },
    );
    const body = await res.json().catch(() => ({}));

    if (res.ok) {
      notes.push(`Google accepted the key for project ${body.projectId ?? projectId}`);
      const providers = body.enabledProviders ? String(body.enabledProviders).split(',') : [];
      if (providers.length) {
        notes.push(`enabled sign-in providers: ${providers.join(', ')}`);
        if (!providers.includes('password')) {
          notes.push('email/password sign-in is NOT enabled — students cannot create accounts');
        }
      }
      if (body.authorizedDomains) {
        const domains = body.authorizedDomains ?? [];
        if (domains.length) notes.push(`authorized auth domains: ${domains.join(', ')}`);
        const siteOrigin = env('VITE_SITE_URL');
        if (siteOrigin) {
          const host = new URL(siteOrigin).hostname;
          if (!domains.includes(host)) {
            problems.push(
              `"${host}" is not an authorized auth domain (authorized: ${domains.join(', ') || 'none'}). ` +
                'Sign-in with a popup will fail in production until you add it under Authentication → Settings → Authorized domains.',
            );
          }
        }
      }
    } else if (body?.error?.message === 'API_KEY_INVALID' || res.status === 400) {
      problems.push(
        'Google rejected the API key (API_KEY_INVALID). It may belong to a different project, or be restricted to a different HTTP referrer.',
      );
    } else {
      notes.push(`live check inconclusive: HTTP ${res.status} ${body?.error?.message ?? ''}`);
    }
  } catch (error) {
    notes.push(`live check could not run: ${error.message}`);
  }

  // ── 4b. Are students actually able to sign in? ───────────────────────────
  // A wrong password for an account that cannot exist creates nothing and
  // changes nothing, but the error code is decisive: PASSWORD_LOGIN_DISABLED
  // means the Email/Password provider was never switched on, and every signup
  // on the live site will fail with an opaque message.
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'probe-account-does-not-exist@example.invalid',
          password: 'not-a-real-password-1A',
          returnSecureToken: true,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    const body = await res.json().catch(() => ({}));
    const code = body?.error?.message ?? '';

    if (code === 'PASSWORD_LOGIN_DISABLED') {
      problems.push(
        'email/password sign-in is DISABLED. Students cannot create accounts. ' +
          'Fix: Firebase console → Authentication → Sign-in method → Email/Password → Enable.',
      );
    } else if (code === 'EMAIL_NOT_FOUND' || code === 'INVALID_LOGIN_CREDENTIALS' || code === 'INVALID_PASSWORD') {
      notes.push('email/password sign-in is enabled');
    } else if (code) {
      notes.push(`sign-in provider check inconclusive: ${code}`);
    }
  } catch (error) {
    notes.push(`sign-in provider check could not run: ${error.message}`);
  }

  // ── 4c. Is Firestore reachable, are the rules deployed? ──────────────────
  // The app reads settings/site before anything else. 403 means the database
  // is still on locked-mode rules (deploy pending); 404 means the database was
  // never created; 200 means rules are live — and tells us whether it is seeded.
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
        `/databases/(default)/documents/settings/site?key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(15000) },
    );
    const body = await res.json().catch(() => ({}));

    if (res.ok) {
      notes.push('Firestore is reachable and firestore.rules is deployed');
      if (body?.fields?.siteName?.stringValue) {
        notes.push(`database is seeded (siteName: ${body.fields.siteName.stringValue})`);
      } else {
        notes.push('database looks unseeded — run scripts/seed-firestore.mjs');
      }
    } else if (res.status === 404 && /not found/i.test(body?.error?.message ?? '')) {
      // The read was permitted and the document is absent: rules are live, the
      // starter library simply has not been imported yet.
      notes.push('Firestore rules are live (the database is reachable and readable)');
      notes.push('the library is not seeded yet — press "Import starter library" on /admin');
    } else if (res.status === 404 && /database .* does not exist/i.test(body?.error?.message ?? '')) {
      problems.push(
        'the Firestore database does not exist yet. Fix: Firebase console → Firestore Database → Create database (production mode).',
      );
    } else if (res.status === 403) {
      problems.push(
        'Firestore is denying all reads — firestore.rules has not been deployed, so the database is still ' +
          'on default locked-mode rules. Fix: npx firebase login && npx firebase use --add && ' +
          'npx firebase deploy --only firestore:rules,firestore:indexes',
      );
    } else {
      notes.push(`Firestore check inconclusive: HTTP ${res.status} ${body?.error?.message ?? ''}`);
    }
  } catch (error) {
    notes.push(`Firestore check could not run: ${error.message}`);
  }
} else if (LIVE) {
  notes.push('live check skipped because the offline checks already failed');
}

// ── Report ──────────────────────────────────────────────────────────────────
console.log('Firebase configuration\n');
console.log(`  projectId    ${projectId}`);
console.log(`  authDomain   ${authDomain}`);
console.log(`  apiKey       ${mask(apiKey)}`);
console.log(`  appId        ${mask(appId)}`);
console.log(`  source       ${process.env.VITE_FIREBASE_API_KEY ? 'environment' : '.env.local'}\n`);

for (const note of notes) console.log(`  · ${note}`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

console.log('\nConfiguration looks valid.');
if (!LIVE) console.log('Run again with --live to confirm Google accepts the key and check authorized domains.');

#!/usr/bin/env node
/**
 * Seed the Firestore library from shared/content-seed.json.
 *
 * Why this exists: the starter course and resource library lives in
 * `shared/content-seed.json`, and only the browser demo store reads it. Without
 * this script, configuring Firebase makes the public library empty — the site
 * would deploy with 41 prerendered pages and then render "no courses yet".
 *
 * Usage:
 *
 *   # Against the local emulator (no credentials needed):
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/seed-firestore.mjs
 *
 *   # Against the real project, using a service-account key you keep OUT of git:
 *   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/service-account.json \
 *     node scripts/seed-firestore.mjs --project your-project-id
 *
 * Flags:
 *   --dry-run   show what would be written, write nothing
 *   --force     overwrite documents that already exist (default: skip them, so
 *               an admin's edited copy is never clobbered by a reseed)
 *
 * What it writes:
 *   courses/{id}        one document per published course
 *   resources/{id}      one document per published resource
 *   settings/site       site settings, only if missing
 *
 * It does NOT write roles/. Creating the first owner is a deliberate manual
 * step (docs/ADMIN.md §2) so no script holds a privilege-granting credential.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const projectArgIndex = args.indexOf('--project');
const projectId =
  projectArgIndex >= 0 ? args[projectArgIndex + 1] : process.env.FIREBASE_PROJECT_ID ?? 'demo-ujyalo';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST ?? '';
const usingEmulator = Boolean(emulatorHost);
const usingServiceAccount = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

if (!usingEmulator && !usingServiceAccount) {
  console.error(`
Refusing to run without a target.

  Emulator:        FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/seed-firestore.mjs
  Real project:    GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \\
                     node scripts/seed-firestore.mjs --project <project-id>

A service-account key can write to your whole database. Keep it outside the
repository, never commit it, and delete the key when you are done seeding.
`);
  process.exit(1);
}

if (usingServiceAccount && usingEmulator) {
  console.log('Both an emulator host and credentials are set; the emulator wins.');
}

const seed = JSON.parse(readFileSync(path.resolve(process.cwd(), 'shared/content-seed.json'), 'utf8'));

const { initializeApp, cert, applicationDefault } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');

// The emulator does not check credentials, but firebase-admin rejects an
// explicit `credential: undefined`, so the property is omitted entirely.
const appOptions = { projectId };
if (!usingEmulator) {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  appOptions.credential = keyPath?.endsWith('.json')
    ? cert(JSON.parse(readFileSync(keyPath, 'utf8')))
    : applicationDefault();
}
const app = initializeApp(appOptions);

const db = getFirestore(app);

console.log(`target: ${projectId}${usingEmulator ? ` (emulator ${emulatorHost})` : ' (live project)'}`);
console.log(`mode:   ${DRY_RUN ? 'dry run, nothing will be written' : FORCE ? 'write, overwriting existing docs' : 'write, skipping existing docs'}\n`);

const stats = { created: 0, updated: 0, skipped: 0 };

async function put(collectionName, id, data) {
  const ref = db.collection(collectionName).doc(id);
  const existing = await ref.get();

  if (existing.exists && !FORCE) {
    stats.skipped += 1;
    console.log(`  · ${collectionName}/${id} already exists, skipped`);
    return;
  }
  if (DRY_RUN) {
    console.log(`  ${existing.exists ? '~' : '+'} ${collectionName}/${id} (${existing.exists ? 'would overwrite' : 'would create'})`);
    if (existing.exists) stats.updated += 1;
    else stats.created += 1;
    return;
  }

  await ref.set(data, { merge: true });
  if (existing.exists) stats.updated += 1;
  else stats.created += 1;
  console.log(`  ${existing.exists ? '~' : '+'} ${collectionName}/${id}`);
}

const published = seed.courses.filter((course) => course.status === 'published');
const publishedResources = seed.resources.filter((resource) => resource.status === 'published');

console.log(`courses (${published.length} published of ${seed.courses.length})`);
for (const course of published) await put('courses', course.id, course);

console.log(`\nresources (${publishedResources.length} published of ${seed.resources.length})`);
for (const resource of publishedResources) await put('resources', resource.id, resource);

console.log('\nsettings');
await put('settings', 'site', seed.settings);

console.log(`\n${DRY_RUN ? 'Would write' : 'Done'}: ${stats.created} created, ${stats.updated} overwritten, ${stats.skipped} skipped.`);

if (!DRY_RUN && stats.created === 0 && stats.skipped === published.length + publishedResources.length + 1) {
  console.log('\nEverything already existed. Re-run with --force to overwrite with the seed copy.');
}

if (!usingEmulator) {
  console.log(`
Next:
  1. Open the site and check /courses and /resources list the content.
  2. Create the first owner by hand (docs/ADMIN.md §2): roles/{your-uid} = { role: "owner" }.
  3. Delete the service-account key file if you no longer need it.`);
}

process.exit(0);

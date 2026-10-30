#!/usr/bin/env node
/**
 * Integrity check for the opportunities directory.
 *
 * The whole value of that page is that a listing can be trusted, so the build
 * refuses to ship a directory that has stopped making sense. Run with:
 *   npm run check:opportunities
 *
 * Rules enforced:
 *   1. ids are unique (a duplicate would render twice and break keys)
 *   2. every listing has a lastVerified date in the past, in ISO form
 *   3. every officialUrl is https and points at a real host
 *   4. a deadline is either null or a valid ISO date
 *   5. a listing verified more than 180 days ago is reported as stale
 *
 * It is deliberately a warning, not a hard failure, on staleness: a stale
 * listing is still true, it just needs re-checking, and blocking a deploy on
 * that would tempt someone to bump the date without looking.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = process.cwd();

// The data module is TypeScript; strip the types we rely on by importing the
// compiled shape through a tiny transform rather than adding a build step.
const source = readFileSync(path.join(root, 'src/features/opportunities/data.ts'), 'utf8');
const match = source.match(/export const OPPORTUNITIES: Opportunity\[\] = (\[[\s\S]*?\n\];)/);
if (!match) {
  console.error('Could not find the OPPORTUNITIES array in src/features/opportunities/data.ts');
  process.exit(1);
}
const literal = match[1].slice(0, -1); // drop the trailing semicolon
const items = new Function(`return ${literal};`)();

const problems = [];
const warnings = [];
const today = new Date().toISOString().slice(0, 10);
const isIso = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const seen = new Set();
for (const item of items) {
  const where = item.id ?? '(no id)';
  if (!item.id) problems.push('A listing has no id.');
  if (seen.has(item.id)) problems.push(`${where}: duplicate id.`);
  seen.add(item.id);

  for (const field of ['title', 'provider', 'category', 'summary', 'eligibility', 'availability', 'deadlineNote', 'cost']) {
    if (!item[field] || String(item[field]).trim() === '') problems.push(`${where}: missing ${field}.`);
  }

  if (!isIso(item.lastVerified)) {
    problems.push(`${where}: lastVerified must be YYYY-MM-DD.`);
  } else if (item.lastVerified > today) {
    problems.push(`${where}: lastVerified is in the future (${item.lastVerified}).`);
  } else {
    const days = (Date.parse(today) - Date.parse(item.lastVerified)) / 86_400_000;
    if (days > 180) warnings.push(`${where}: last checked ${Math.round(days)} days ago — re-open the page.`);
  }

  if (item.deadline !== null && !isIso(item.deadline)) {
    problems.push(`${where}: deadline must be null or YYYY-MM-DD.`);
  }

  try {
    const url = new URL(item.officialUrl);
    if (url.protocol !== 'https:') problems.push(`${where}: officialUrl must be https.`);
    if (!url.hostname.includes('.')) problems.push(`${where}: officialUrl host looks wrong.`);
    if (/google\.com\/search|bit\.ly|linktr\.ee|affiliate/.test(item.officialUrl)) {
      problems.push(`${where}: officialUrl must be the provider’s own page, not a redirect or search link.`);
    }
  } catch {
    problems.push(`${where}: officialUrl is not a valid URL.`);
  }
}

console.log(`[opportunities] ${items.length} listings checked`);
for (const warning of warnings) console.warn(`  warning: ${warning}`);
if (problems.length) {
  for (const problem of problems) console.error(`  error: ${problem}`);
  console.error(`[opportunities] ${problems.length} problem(s)`);
  process.exit(1);
}
console.log('[opportunities] ok — no duplicate ids, every listing carries a verification date.');

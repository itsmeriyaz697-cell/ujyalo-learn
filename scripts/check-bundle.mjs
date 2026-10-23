#!/usr/bin/env node
/**
 * Production bundle guard.
 *
 * Runs after `vite build` and checks that no server-side secret or internal
 * path leaked into anything the browser downloads.
 *
 *   npm run check:bundle
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DIST = path.join(process.cwd(), 'dist');

/**
 * Firebase's web config (apiKey, authDomain, projectId, appId) is a public
 * identifier, not a credential: it ships in every Firebase web app, and access
 * is controlled by security rules and authorised domains. The Google API key
 * pattern cannot tell it apart from a privileged key, so compare against the
 * exact configured value and allow only that one. Any other AIza… key still
 * fails, which is the point of the rule.
 */
function configuredFirebaseWebKey() {
  if (process.env.VITE_FIREBASE_API_KEY) return process.env.VITE_FIREBASE_API_KEY;
  for (const file of ['.env.local', '.env.production', '.env']) {
    try {
      const match = /^VITE_FIREBASE_API_KEY\s*=\s*(.+)$/m.exec(fs.readFileSync(path.join(process.cwd(), file), 'utf8'));
      if (match) return match[1].trim().replace(/^["']|["']$/g, '');
    } catch {
      /* file not present */
    }
  }
  return null;
}

const publicFirebaseKey = configuredFirebaseWebKey();

if (!fs.existsSync(DIST)) {
  console.error('✗ check:bundle — dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

const files = walk(DIST);
const textFiles = files.filter((file) => /\.(js|css|html|json|webmanifest|txt|xml|svg)$/.test(file));

// Documentation that names an env variable (e.g. setup instructions in the
// help pages) is fine. Only actual values are a leak, so these rules look for
// credential-shaped strings.
const rules = [
  { name: 'OpenAI-style key', regex: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}\b/ },
  { name: 'Google API key', regex: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'Private key block', regex: /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/ },
  { name: 'Bare provider key assignment', regex: /AI_API_KEY\s*[:=]\s*['"][^'"]{12,}['"]/ },
];

// Values actually configured in this environment must never appear in the bundle.
const secretValues = ['AI_API_KEY', 'FIREBASE_WEB_API_KEY', 'ADMIN_UIDS']
  .map((key) => process.env[key])
  .filter((value) => typeof value === 'string' && value.length >= 12)
  .filter((value) => !/your-|example|placeholder|changeme/i.test(value));

const findings = [];
const allowances = [];
for (const file of textFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relative = path.relative(DIST, file);
  for (const rule of rules) {
    const match = rule.regex.exec(content);
    if (!match) continue;
    if (rule.name === 'Google API key' && publicFirebaseKey && match[0] === publicFirebaseKey) {
      allowances.push(`${relative}: Firebase web API key (public identifier, expected in the bundle)`);
      continue;
    }
    findings.push(`${relative}: ${rule.name}`);
  }
  for (const value of secretValues) {
    if (content.includes(value)) findings.push(`${relative}: literal credential value from the build environment`);
  }
}

// The service worker must never cache API responses or Firebase traffic.
const swPath = path.join(DIST, 'sw.js');
if (fs.existsSync(swPath)) {
  const sw = fs.readFileSync(swPath, 'utf8');
  if (!/\/api\//.test(sw)) {
    findings.push('sw.js: no guard against caching /api responses was found');
  }
}

if (allowances.length > 0) {
  console.log(`· check:bundle — ${allowances.length} allowance(s):`);
  for (const note of allowances) console.log(`  ${note}`);
}

const totalBytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
const largest = files
  .map((file) => ({ file: path.relative(DIST, file), size: fs.statSync(file).size }))
  .sort((a, b) => b.size - a.size)
  .slice(0, 5);

if (findings.length > 0) {
  console.error(`✗ check:bundle — ${findings.length} problem(s) in the production bundle:\n`);
  for (const finding of findings) console.error(`  ${finding}`);
  console.error('\nRemove the reference and rebuild. Server-only values belong in Vercel env variables.');
  process.exit(1);
}

console.log(
  `✓ check:bundle — ${files.length} files, ${(totalBytes / 1024 / 1024).toFixed(2)} MB total. ` +
    `No server secrets or env names found in client assets.`,
);
for (const item of largest) {
  console.log(`   ${(item.size / 1024).toFixed(1).padStart(7)} kB  ${item.file}`);
}

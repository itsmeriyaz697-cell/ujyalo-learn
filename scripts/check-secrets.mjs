#!/usr/bin/env node
/**
 * Secret scanner.
 *
 * Fails the build if anything that looks like a real credential is present in
 * files that would be committed, or if a private value is exposed through a
 * VITE_* variable (those are compiled into the browser bundle).
 *
 *   npm run check:secrets
 *
 * Deliberately dependency-free so it can run in any CI.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.vercel',
  '.next',
  'build',
]);

const SKIP_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'check-secrets.mjs',
]);

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.mdx', '.html',
  '.css', '.yml', '.yaml', '.env', '.example', '.rules', '.txt', '.svg', '.webmanifest',
]);

const patterns = [
  {
    name: 'OpenAI-style API key',
    // sk-..., sk-proj-..., sk-ant-...
    regex: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    name: 'Google API key',
    regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    name: 'Firebase service-account private key',
    regex: /"private_key"\s*:\s*"-----BEGIN PRIVATE KEY-----/g,
  },
  {
    name: 'PEM private key',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/g,
  },
  {
    name: 'Anthropic / generic bearer token',
    regex: /\bBearer\s+[A-Za-z0-9._-]{30,}\b/g,
  },
  {
    name: 'Hardcoded admin password',
    regex: /\b(?:ADMIN_PASSWORD|adminPassword)\s*[:=]\s*['"`][^'"`]{6,}['"`]/g,
  },
];

/** Values that are obviously placeholders are allowed. */
const placeholderHints = [
  'your-',
  'your_',
  'example',
  'placeholder',
  'changeme',
  'change-me',
  'xxxx',
  'test-',
  'dummy',
  'fake',
  'mock',
  'not-real',
  'redacted',
  '<',
  '${',
  '...',
  'sk-...',
];

function looksLikePlaceholder(match) {
  const value = String(match).toLowerCase();
  return placeholderHints.some((hint) => value.includes(hint));
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.env.example') {
      if (entry.name === '.git') continue;
    }
    const full = path.join(dir, entry.name);
    const relative = path.relative(ROOT, full);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, files);
      continue;
    }
    if (SKIP_FILES.has(entry.name)) continue;
    if (entry.name === '.env' || /^\.env\.(?!example)/.test(entry.name)) {
      files.push(relative);
      continue;
    }
    if (!TEXT_EXTENSIONS.has(path.extname(entry.name))) continue;
    const size = fs.statSync(full).size;
    if (size > 512 * 1024) continue;
    files.push(relative);
  }
  return files;
}

/**
 * Firebase's web apiKey is a public identifier (it ships in every Firebase web
 * app and is protected by rules plus authorised domains), so it is not a leak.
 * Only the exact configured value is exempt; any other Google key still fails.
 */
function configuredFirebaseWebKey() {
  if (process.env.VITE_FIREBASE_API_KEY) return process.env.VITE_FIREBASE_API_KEY;
  for (const file of ['.env.local', '.env.production', '.env']) {
    try {
      const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
      const match = /^VITE_FIREBASE_API_KEY\s*=\s*(.+)$/m.exec(text);
      if (match) return match[1].trim().replace(/^["']|["']$/g, '');
    } catch {
      /* file not present */
    }
  }
  return null;
}

const publicFirebaseKey = configuredFirebaseWebKey();
const allowances = [];
const findings = [];

// 1. Secret-looking strings in the working tree.
for (const file of walk(ROOT)) {
  let content;
  try {
    content = fs.readFileSync(path.join(ROOT, file), 'utf8');
  } catch {
    continue;
  }
  for (const { name, regex } of patterns) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (looksLikePlaceholder(match[0])) continue;
      if (name === 'Google API key' && publicFirebaseKey && match[0] === publicFirebaseKey) {
        allowances.push({ file, rule: 'Firebase web API key (public identifier)' });
        continue;
      }
      const line = content.slice(0, match.index).split('\n').length;
      findings.push({ file, line, rule: name });
    }
  }
}

// 2. Real .env files must never be tracked by git.
let tracked = [];
try {
  tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split('\n')
    .filter(Boolean);
} catch {
  tracked = [];
}
for (const file of tracked) {
  if (/^\.env(\.|$)/.test(file) && file !== '.env.example') {
    findings.push({ file, line: 1, rule: 'Real .env file is tracked by git' });
  }
}

// 3. VITE_* variables are public. Catch private-looking keys there.
const viteKeys = Object.entries(process.env).filter(([key]) => key.startsWith('VITE_'));
const forbiddenPublicKeys = /VITE_.*(?:API_KEY|SECRET|TOKEN|PRIVATE|PASSWORD|SERVICE_ACCOUNT)/i;
for (const [key] of viteKeys) {
  if (forbiddenPublicKeys.test(key)) {
    findings.push({ file: '.env', line: 1, rule: `Private value exposed through a public VITE_ variable: ${key}` });
  }
}

// 4. .gitignore must cover env files, or app .env files would be committed later.
const gitignore = fs.existsSync(path.join(ROOT, '.gitignore')) ? fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8') : '';
if (!/^\.env(\*|\s|$)/m.test(gitignore)) {
  findings.push({ file: '.gitignore', line: 1, rule: 'Env files are not ignored by git' });
}

if (allowances.length > 0) {
  console.log(`· check:secrets — ${allowances.length} allowance(s):`);
  for (const note of allowances) console.log(`  ${note.file}: ${note.rule}`);
}

if (findings.length === 0) {
  console.log(`✓ check:secrets — scanned ${walk(ROOT).length} files, no credentials found.`);
  process.exit(0);
}

console.error(`✗ check:secrets — ${findings.length} potential secret(s) found:\n`);
for (const finding of findings) {
  console.error(`  ${finding.file}:${finding.line}  ${finding.rule}`);
}
console.error('\nRemove the value, rotate the key with the provider, and store it only in the host’s env settings.');
process.exit(1);

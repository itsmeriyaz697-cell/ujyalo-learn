#!/usr/bin/env node
/**
 * Accessibility audit with axe-core.
 *
 * Runs the real app in Chromium and checks the WCAG 2.1 A/AA rule set on the
 * pages students actually use. This is a structural check — it catches missing
 * labels, bad contrast, broken landmark order, heading skips — not a substitute
 * for testing with a screen reader or keyboard.
 *
 *   BASE_URL=http://127.0.0.1:5173 node scripts/a11y-audit.mjs
 *
 * Exit code is non-zero when a serious or critical violation is found, so it can
 * gate a release. Moderate and minor findings are reported but do not fail.
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173';

/** Public pages a student or parent is most likely to land on. */
const PUBLIC_PAGES = [
  '/',
  '/features',
  '/subjects',
  '/pricing',
  '/courses',
  '/resources',
  '/see-preparation',
  '/ai-tutor',
  '/faq',
  '/about',
  '/contact',
  '/privacy',
];

/** Screens that are part of the core study loop. */
const AUTH_PAGES = ['/login', '/signup', '/help'];

const IMPACT_ORDER = { critical: 0, serious: 1, moderate: 2, minor: 3 };

function summarise(violations) {
  return violations
    .filter((v) => v.impact === 'critical' || v.impact === 'serious')
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      sample: v.nodes[0]?.html?.slice(0, 120),
      target: v.nodes[0]?.target?.join(' '),
    }));
}

const browser = await chromium.launch();

async function audit(path, { width = 1280, height = 900, scheme = 'light' } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: scheme });
  const page = await context.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  // Let async content (content store, search) settle before scanning.
  await page.waitForTimeout(900);

  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  await context.close();
  return result.violations;
}

const findings = [];
let failing = 0;
let totalViolations = 0;

for (const path of [...PUBLIC_PAGES, ...AUTH_PAGES]) {
  const violations = await audit(path);
  totalViolations += violations.length;

  const serious = summarise(violations);
  if (serious.length) {
    failing += 1;
    findings.push({ path, serious });
  }

  const counts = violations.reduce((acc, v) => {
    acc[v.impact ?? 'unknown'] = (acc[v.impact ?? 'unknown'] ?? 0) + 1;
    return acc;
  }, {});
  const label = Object.entries(counts)
    .sort((a, b) => IMPACT_ORDER[a[0]] - IMPACT_ORDER[b[0]])
    .map(([k, v]) => `${k}:${v}`)
    .join(' ');

  console.log(`${serious.length ? '✗' : '✓'} ${path.padEnd(20)} ${violations.length} violation(s) ${label || '—'}`);
}

// Dark theme: the accent and primary tokens invert, which historically broke
// contrast in the chat bubbles and warning badges.
for (const path of ['/', '/courses', '/ai-tutor', '/login', '/help']) {
  const violations = await audit(path, { scheme: 'dark' });
  const serious = summarise(violations);
  if (serious.length) {
    failing += 1;
    findings.push({ path: `${path} (dark theme)`, serious });
  }
  totalViolations += violations.length;
  console.log(`${serious.length ? '✗' : '✓'} ${`${path} @dark`.padEnd(20)} ${violations.length} violation(s)`);
}

// Mobile viewport on the two most-used pages: contrast and target size differ.
for (const path of ['/', '/courses']) {
  const violations = await audit(path, { width: 360, height: 640 });
  const serious = summarise(violations);
  if (serious.length) {
    failing += 1;
    findings.push({ path: `${path} (360px wide)`, serious });
  }
  totalViolations += violations.length;
  console.log(`${serious.length ? '✗' : '✓'} ${`${path} @360px`.padEnd(20)} ${violations.length} violation(s)`);
}

await browser.close();

if (findings.length) {
  console.error(`\n${failing} page(s) with serious or critical accessibility problems:\n`);
  for (const { path, serious } of findings) {
    console.error(`  ${path}`);
    for (const item of serious) {
      console.error(`    [${item.impact}] ${item.id}: ${item.help}`);
      console.error(`      ${item.nodes}× ${item.target ?? ''}`);
      if (item.sample) console.error(`      ${item.sample}`);
    }
  }
  process.exit(1);
}

console.log(`\n${totalViolations} violation(s) across 20 page checks (light, dark and mobile), none critical or serious.`);

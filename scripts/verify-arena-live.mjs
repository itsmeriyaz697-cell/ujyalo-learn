/**
 * Live verification of the Global Quiz Arena on the deployed site.
 *
 * Different from scripts/arena-ui.mjs: that runs against a local dev server.
 * This drives https://ujyalo-learn.vercel.app and answers the question the
 * checklist actually asks — can a student, right now, on the real internet,
 * open the Arena, play a quiz and get a scored result?
 *
 * Run: node scripts/verify-arena-live.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.LIVE_URL || 'https://ujyalo-learn.vercel.app';

let passed = 0;
let failed = 0;
const failures = [];
const check = (name, ok, detail = '') => {
  if (ok) {
    passed += 1;
    console.log(`\u2713 ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`\u2717 ${name}${detail ? ` \u2014 ${detail}` : ''}`);
  }
};

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200));
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message.slice(0, 200)}`));

  // --- the page itself ---------------------------------------------------
  const response = await page.goto(`${BASE}/global-quiz`, { waitUntil: 'domcontentloaded' });
  check('the live Arena responds 200', response?.status() === 200, String(response?.status()));
  await page.locator('h1').first().waitFor({ timeout: 20000 });
  const h1 = await page.locator('h1').first().innerText();
  check('the live heading is correct', h1.includes('Global Quiz Arena'), h1);

  const title = await page.title();
  check('the page title is set', title.includes('Global Quiz Arena'), title);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href').catch(() => null);
  check('the canonical URL is absolute and correct', canonical === `${BASE}/global-quiz`, String(canonical));
  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content').catch(() => null);
  check('Open Graph metadata is present', Boolean(ogTitle));

  // --- demo mode is declared, not hidden --------------------------------
  // The Arena resolves its mode from /api/quiz-arena after first paint, so the
  // notice arrives a beat later than the heading. Wait for the state rather than
  // reading the DOM immediately — the first version of this check raced it.
  const demo = await page
    .getByText('Demo mode.')
    .first()
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  check('the unconfigured database is declared on the page', demo);
  const body = await page.locator('body').innerText();

  // --- the nav button ----------------------------------------------------
  check(
    'the Arena is reachable from the main navigation',
    (await page.locator('header').getByRole('link', { name: 'Arena', exact: true }).count()) > 0,
  );
  check('the footer credit is live', body.includes('Built by'));

  // --- existing pages still work ----------------------------------------
  for (const path of ['/', '/courses', '/subjects', '/pricing', '/about', '/ai-tutor', '/features']) {
    const res = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
    const heading = await page.locator('h1').first().innerText().catch(() => '');
    check(`existing page ${path} still renders`, res?.status() === 200 && heading.length > 0, `${res?.status()}`);
  }

  // --- play a full quiz on the live site --------------------------------
  await page.goto(`${BASE}/global-quiz`, { waitUntil: 'domcontentloaded' });
  await page.locator('h1').first().waitFor({ timeout: 20000 });
  await page.getByRole('link', { name: 'Try one free, no account' }).first().click();
  await page.waitForURL(/global-quiz\/play/, { timeout: 20000 });
  await page.locator('input[type="radio"]').first().waitFor({ state: 'visible', timeout: 25000 });
  check('a quiz starts on the live site', page.url().includes('/global-quiz/play'));

  const timer = await page.locator('[role="timer"]').count();
  check('the live timer renders', timer === 1);
  const options = await page.locator('input[type="radio"]').count();
  check('the live question has four options', options === 4, String(options));

  for (let i = 0; i < 8; i += 1) {
    const radios = page.locator('input[type="radio"]');
    if ((await radios.count()) === 0) break;
    await radios.nth(i % 2).check({ force: true });
    const next = page.getByRole('button', { name: 'Next question' });
    if (await next.isVisible().catch(() => false)) {
      await next.click();
      await page.waitForTimeout(150);
      continue;
    }
    const submit = page.getByRole('button', { name: 'Submit quiz' });
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
      break;
    }
    break;
  }
  await page.getByText('Review your answers').first().waitFor({ timeout: 25000 });
  const results = await page.locator('body').innerText();
  check('the live results screen appears', results.includes('Review your answers'));
  check('the live score is shown', /\d+\s*\/\s*\d+/.test(results));
  check('the live explanations are shown', results.includes('Correct answer') || results.includes('pts'));

  // --- leaderboard page on the live site --------------------------------
  await page.goto(`${BASE}/global-quiz/leaderboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  check('the live leaderboard renders', (await page.locator('body').innerText()).includes('Leaderboard'));
  check('the three live tabs exist', (await page.getByRole('tab').count()) === 3);
  const boardText = await page.locator('body').innerText();
  check('the live leaderboard invents no players', !/alice|bob|test|demo-player/i.test(boardText));

  // --- mobile ------------------------------------------------------------
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mp = await mobile.newPage();
  await mp.goto(`${BASE}/global-quiz`, { waitUntil: 'domcontentloaded' });
  await mp.waitForTimeout(1500);
  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('the live mobile layout has no horizontal overflow', overflow <= 1, `${overflow}px`);
  await mobile.close();

  check('no console errors on the live site', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '));

  await context.close();
} finally {
  await browser.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) {
  console.log(`Failures:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}

/**
 * Global Quiz Arena — browser proof.
 *
 * Drives the real UI in a real Chromium: navigates, clicks, plays a whole
 * practice quiz to the results screen, and fails on any console error, page
 * error, horizontal overflow on a phone, or serious accessibility violation.
 *
 * Practice mode is used deliberately: it exercises the same question, timer,
 * scoring and results components a ranked quiz uses, without needing a signed-in
 * Firebase account in CI. The ranked path is covered end-to-end by
 * `npm run test:arena`, which talks to the real API and the Firestore emulator.
 *
 * Run with: node scripts/arena-ui.mjs   (needs `npm run dev` or a preview server)
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`✓ ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.locator('h1, [role="dialog"], form').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
}

const browser = await chromium.launch();

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  // ---------------------------------------------------------------- home
  await page.goto(`${BASE}/global-quiz`, { waitUntil: 'domcontentloaded' });
  await settle(page);

  check('the Arena opens', (await page.locator('h1').first().innerText()).includes('Global Quiz Arena'));
  check(
    'the subtitle is present',
    await page.getByText('Challenge yourself. Earn points. Become a champion.').first().isVisible(),
  );

  const categoryCount = await page.locator('[aria-pressed]').count();
  check('all fifteen categories are offered as choices', categoryCount >= 15, String(categoryCount));
  for (const name of ['Mathematics', 'Astronomy', 'Logical Reasoning', 'Environmental Science']) {
    check(`the ${name} category is listed`, await page.getByRole('button', { name: new RegExp(name) }).first().isVisible());
  }

  check('difficulty choices are offered', (await page.getByRole('group', { name: 'Difficulty' }).innerText()).includes('Hard'));
  check('length choices are offered', (await page.getByRole('group', { name: 'Quiz length' }).innerText()).includes('20 questions'));

  check('the points table is shown', await page.getByText('How to earn points').first().isVisible());
  check('the fair-play rules are shown', await page.getByText('Rules of the Arena').first().isVisible());
  check('a demo notice explains the missing database', await page.getByText('Demo mode.').first().isVisible());

  // Nav integration
  check(
    'the navigation now links to the Arena',
    (await page.locator('header').getByRole('link', { name: 'Arena', exact: true }).count()) > 0,
  );
  check(
    'the footer credits the founder',
    (await page.locator('footer').innerText()).includes('Built by'),
  );

  // --------------------------------------------------- no wall for guests
  // Clicking "Start a quiz" as a signed-out visitor must never bounce to
  // /login or /signup; it has to start the quiz right here (round 20 rule).
  const beforeStart = page.url();
  await page.getByRole('button', { name: 'Start a quiz' }).first().click();
  await page.waitForTimeout(1200);
  const afterStart = page.url();
  check(
    'clicking Start a quiz does not send a guest to login or signup',
    !/\/(login|signup)/.test(afterStart),
    afterStart,
  );
  check(
    'clicking Start a quiz starts a round immediately',
    new URL(afterStart).pathname === '/global-quiz/play',
    afterStart,
  );
  // Back to the lobby so the practice-link path below still starts clean.
  await page.goto(beforeStart, { waitUntil: 'domcontentloaded' });
  await settle(page);

  // ------------------------------------------------------------ play quiz
  await page.getByRole('link', { name: 'Try one free, no account' }).first().click();
  await page.waitForURL(/\/global-quiz\/play/, { timeout: 15000 }).catch(() => {});
  check('the practice quiz starts without an account', new URL(page.url()).pathname === '/global-quiz/play');

  // The play page is a lazy chunk behind Suspense, so wait for the first
  // answer option rather than for a heading that may still be the loader.
  await page.locator('input[type="radio"]').first().waitFor({ state: 'visible', timeout: 20000 });

  check('a countdown timer is running', (await page.locator('[role="timer"]').count()) === 1);
  check('a progress bar is shown', (await page.locator('[role="progressbar"]').count()) === 1);

  const optionCount = await page.locator('input[type="radio"]').count();
  check('the question offers four options', optionCount === 4, String(optionCount));

  // Answer every question by choosing the first option, then submit.
  for (let i = 0; i < 10; i += 1) {
    const radios = page.locator('input[type="radio"]');
    if ((await radios.count()) === 0) break;
    await radios.first().check({ force: true });
    const next = page.getByRole('button', { name: 'Next question' });
    if (await next.isVisible().catch(() => false)) {
      await next.click();
      await page.waitForTimeout(120);
      continue;
    }
    const submit = page.getByRole('button', { name: 'Submit quiz' });
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
      break;
    }
    break;
  }

  await page.getByText('Review your answers').first().waitFor({ timeout: 20000 });
  check('the results screen appears after submitting', await page.getByText('Review your answers').first().isVisible());
  const resultsText = await page.locator('body').innerText();
  check('the score is shown as a fraction', /\d+\s*\/\s*\d+/.test(resultsText), resultsText.slice(0, 120));
  check('the completion bonus is itemised', await page.getByText('Finished the quiz').first().isVisible());

  const explanations = await page.locator('ol li').count();
  check('every question is explained after submission', explanations >= 4, String(explanations));
  check(
    'a practice round says the score was not saved',
    /Practice mode: nothing was saved|not saved anywhere/.test(await page.locator('body').innerText()),
  );
  check('the correct answer is revealed', (await page.locator('body').innerText()).includes('Correct answer'));

  // Answers cannot be changed after submission.
  const editableAnswers = await page.locator('input[type="radio"]').count();
  check('answers can no longer be changed after submitting', editableAnswers === 0, String(editableAnswers));

  // ---------------------------------------------------------- leaderboard
  await page.goto(`${BASE}/global-quiz/leaderboard`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const boardText = await page.locator('body').innerText();
  check('the leaderboard page loads', boardText.includes('Leaderboard'));
  check('there are three leaderboard tabs', (await page.getByRole('tab').count()) === 3);
  check('the empty state does not invent players', boardText.includes('not connected') || boardText.includes('No scores'));

  // ------------------------------------------------------------- profiles
  await page.goto(`${BASE}/global-quiz/player/somebody`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  check(
    'an unknown profile says so instead of showing a fake one',
    (await page.locator('body').innerText()).includes('Profile unavailable'),
  );

  // ------------------------------------------------------------ a11y scan
  await page.goto(`${BASE}/global-quiz`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  check(
    'the Arena has no serious accessibility violations',
    serious.length === 0,
    serious.map((v) => `${v.id} (${v.nodes.length})`).join(', '),
  );

  // ---------------------------------------------------------------- mobile
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${BASE}/global-quiz`, { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForLoadState('domcontentloaded');
  await mobilePage.waitForTimeout(600);

  const overflow = await mobilePage.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check('the mobile layout has no horizontal overflow', overflow <= 1, `${overflow}px`);
  check('the mobile heading is visible', await mobilePage.locator('h1').first().isVisible());
  const startVisible = await mobilePage.getByRole('button', { name: /Start a quiz/ }).first().isVisible();
  check('the primary action is reachable on a phone', startVisible);

  await mobilePage.screenshot({ path: 'docs/screenshots/arena-mobile.png', fullPage: false });
  await mobile.close();

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/global-quiz`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.screenshot({ path: 'docs/screenshots/arena-home.png', fullPage: false });

  check('no console errors during the whole run', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));

  await context.close();
} finally {
  await browser.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) {
  console.log(`Failures:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}

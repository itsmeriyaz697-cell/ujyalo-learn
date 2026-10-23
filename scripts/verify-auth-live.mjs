/**
 * Prove that accounts work on the live site, then leave no trace.
 *
 * Everything else in this repo runs against the emulator. This is the only
 * check that touches the real Firebase project, and it exists because "the
 * rules are deployed" and "a student can actually sign up" are different
 * claims. The first is a deploy; the second is what the site promises.
 *
 * It creates one account with a unique address, completes onboarding (the step
 * that writes the profile to Firestore), reloads to prove the session and data
 * survive, signs out and back in, and finally deletes the account through the
 * app's own delete flow. If deletion is impossible it says so loudly rather
 * than leaving an account behind silently.
 *
 *   node scripts/verify-auth-live.mjs
 */
import { chromium } from 'playwright';

const BASE = (process.env.BASE_URL ?? 'https://ujyalo-learn.vercel.app').replace(/\/$/, '');
const email = `verify.${Date.now()}@example.com`;
const password = 'StudyHard123';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? '✓' : '✗'} ${name}${ok || !detail ? '' : ` — ${detail}`}`);
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

let created = false;

try {
  // ── Signup ────────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/signup`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.getByLabel('Your name').fill('Live Verification');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /create free account|create account/i }).click();
  await page.waitForTimeout(5000);

  created = page.url().includes('/onboarding');
  check('a real account can be created on the live site', created, page.url());

  if (created) {
    // ── Onboarding writes the profile to Firestore ──────────────────────────
    await page.waitForSelector('text=Your learning profile', { timeout: 30000 });
    await page.getByLabel('Your name').fill('Live Verification');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Grade 10', exact: true }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: /Nepal National Curriculum/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: /^English/ }).first().click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Mathematics', exact: true }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: /Prepare for exams/i }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: /Step-by-step detailed/i }).click();
    await page.getByRole('button', { name: /Finish setup/i }).click();
    // Wait for the redirect rather than sleeping: the profile write is a network
    // round trip and a fixed wait made this check flaky against production.
    await page.waitForURL('**/app', { timeout: 30000 }).catch(() => {});

    check('onboarding saves the profile to Firestore', page.url().includes('/app'), page.url());
    const shell = await page.locator('body').innerText();
    check(
      'the app is in cloud mode, not local demo mode',
      !/Local demo mode/i.test(shell),
      shell.match(/Local demo mode[^\n]*/)?.[0] ?? '',
    );

    // ── Session and data survive a reload ───────────────────────────────────
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    check('the session survives a reload', !page.url().includes('/login'), page.url());

    // ── Sign out, then sign back in ─────────────────────────────────────────
    const menu = page.locator('[aria-label="Account menu"]').first();
    await menu.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    await menu.click();
    await page.waitForTimeout(700);
    await page.getByRole('menuitem', { name: /log out/i }).first().click();
    await page.waitForTimeout(2500);
    check('signing out works', !page.url().includes('/app'), page.url());

    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await page.getByLabel(/email/i).first().fill(email);
    await page.getByLabel(/^password$/i).first().fill(password);
    await page.getByRole('button', { name: /^log in$|sign in/i }).first().click();
    await page.waitForTimeout(4000);
    check('signing back in works', page.url().includes('/app'), page.url());

    // ── Clean up: the app must be able to delete its own account ────────────
    await page.goto(`${BASE}/app/settings`, { waitUntil: 'domcontentloaded' });
    const deleteButton = page.locator('button', { hasText: 'Delete account and all data' }).first();
    // The settings route is lazy-loaded and the page waits on profile data, so
    // wait for the control instead of assuming it after an arbitrary delay.
    const canDelete = await deleteButton.waitFor({ state: 'visible', timeout: 25000 }).then(() => true).catch(() => false);
    check('the account-delete control is reachable', canDelete);

    if (canDelete) {
      await deleteButton.click();
      await page.waitForTimeout(800);
      await page.locator('#delete-confirm').fill('DELETE');
      await page.waitForTimeout(400);
      // The dialog must still be open with the word typed; it used to close here.
      const confirmButton = page.locator('[role="dialog"] button').filter({ hasText: 'Delete everything' }).first();
      check('the confirm button stays reachable after typing DELETE', await confirmButton.isEnabled().catch(() => false));
      await confirmButton.click();
      // Deletion removes the account's data before the auth record, which took
      // around six seconds on the live project — longer than a fixed sleep.
      await page.waitForURL((url) => !url.pathname.includes('/app'), { timeout: 30000 }).catch(() => {});

      const stillInApp = page.url().includes('/app');
      check('account deletion completes', !stillInApp, page.url());
      created = stillInApp;
    }
  }

  check('no uncaught page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
} catch (error) {
  check('flow completed without throwing', false, error.message.split('\n')[0]);
} finally {
  await context.close();
  await browser.close();
}

if (created) {
  console.log(`\n⚠  A test account may remain: ${email} (password ${password}).`);
  console.log('   Delete it under Firebase console → Authentication → Users.');
}

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} checks passed against ${BASE}`);
process.exit(passed === results.length ? 0 : 1);

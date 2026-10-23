/**
 * Live checks for the two things round 14 was asked to fix:
 *   1. Google sign-in — the popup must actually open against production, with
 *      no Content-Security-Policy violations.
 *   2. Guest sign-in — a visitor must reach the app without an account.
 *
 * Both can legitimately fail for one reason that is not a code bug: the
 * provider is switched off in the Firebase console. That is reported as
 * "provider disabled" rather than a vague failure, because the fix differs.
 *
 * Self-cleaning: any account it creates is deleted before it finishes.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'https://ujyalo-learn.vercel.app';
const stamp = Date.now();
const results = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
const page = await context.newPage();
const cspViolations = [];
page.on('console', (message) => {
  const text = message.text();
  if (/Content Security Policy|Refused to load/i.test(text)) cspViolations.push(text.slice(0, 200));
});
page.on('pageerror', (error) => cspViolations.push(`pageerror: ${error.message.slice(0, 160)}`));

// ── 1. Google ───────────────────────────────────────────────────────────────
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('form', { timeout: 30000 });

const popupPromise = page.waitForEvent('popup', { timeout: 20000 }).catch(() => null);
await page.getByRole('button', { name: /continue with google/i }).click();
const popup = await popupPromise;

record(
  'Google sign-in opens its popup instead of failing silently',
  Boolean(popup),
  popup ? popup.url().slice(0, 90) : 'no popup opened',
);
record('no Content-Security-Policy violation on the login page', cspViolations.length === 0, cspViolations[0] ?? '');

if (popup) {
  // Firebase opens its own auth handler first, which then redirects to
  // accounts.google.com. Either URL is healthy; what must NOT happen is an
  // error page, which is what a blocked script or disabled provider produces.
  const url = popup.url();
  const healthy = url.startsWith('https://accounts.google.com') || url.includes('/__/auth/handler');
  record('the popup reaches Google sign-in (not an error page)', healthy, url.slice(0, 90));
  const popupText = await popup.locator('body').innerText().catch(() => '');
  record(
    'the popup shows no auth error',
    !/operation-not-allowed|not enabled|unauthorized domain|error/i.test(popupText),
    popupText.slice(0, 120).replace(/\n/g, ' '),
  );
  await popup.close().catch(() => {});
}

const loginBody = await page.locator('body').innerText();
if (/not switched on|not enabled/i.test(loginBody)) {
  record('Google provider is enabled in Firebase', false, 'page says the method is not enabled');
}

// ── 2. Guest ────────────────────────────────────────────────────────────────
const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
const guestPage = await guestContext.newPage();
await guestPage.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await guestPage.waitForSelector('form', { timeout: 30000 });

// Regression guard: the consent bar used to cover the bottom of the page,
// which on a phone made the primary button unclickable.
const guestButton = guestPage.getByRole('button', { name: /try it without an account/i }).first();
await guestButton.scrollIntoViewIfNeeded().catch(() => {});
const clickable = await guestButton
  .evaluate((node) => {
    const box = node.getBoundingClientRect();
    const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return Boolean(top && (top === node || node.contains(top)));
  })
  .catch(() => false);
record('nothing covers the main button on a phone screen', clickable);

// Answer the consent question the way a cautious visitor would.
const consent = guestPage.getByRole('region', { name: /analytics choice/i });
if (await consent.isVisible().catch(() => false)) {
  await guestPage.getByRole('button', { name: /no thanks/i }).click();
  await consent.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  record('declining analytics dismisses the bar', !(await consent.isVisible().catch(() => false)));
}
record('a guest entry point is offered on the live login page', await guestButton.isVisible().catch(() => false));

await guestButton.click();
await guestPage.waitForURL('**/onboarding', { timeout: 30000 }).catch(() => {});
const afterGuest = await guestPage.locator('body').innerText();
const disabled = /not switched on|not enabled|operation-not-allowed/i.test(afterGuest);

record(
  'a visitor can enter without an email',
  guestPage.url().includes('/onboarding') || guestPage.url().includes('/app'),
  disabled ? 'Anonymous provider is disabled in Firebase' : guestPage.url(),
);

if (!disabled && guestPage.url().includes('/onboarding')) {
  // Finish setup so the guest session really reaches the app.
  await guestPage.getByRole('button', { name: 'Continue' }).click();
  await guestPage.getByRole('button', { name: 'Grade 10', exact: true }).click();
  await guestPage.getByRole('button', { name: 'Continue' }).click();
  await guestPage.getByRole('button', { name: /Nepal National Curriculum/ }).click();
  await guestPage.getByRole('button', { name: 'Continue' }).click();
  await guestPage.getByRole('button', { name: /^English/ }).first().click();
  await guestPage.getByRole('button', { name: 'Continue' }).click();
  await guestPage.getByRole('button', { name: 'Mathematics', exact: true }).click();
  await guestPage.getByRole('button', { name: 'Continue' }).click();
  await guestPage.getByRole('button', { name: /Prepare for exams/i }).click();
  await guestPage.getByRole('button', { name: 'Continue' }).click();
  await guestPage.getByRole('button', { name: /Step-by-step detailed/i }).click();
  await guestPage.getByRole('button', { name: /Finish setup/i }).click();
  await guestPage.waitForURL('**/app', { timeout: 40000 }).catch(() => {});
  record('the guest reaches the app on the live site', guestPage.url().includes('/app'), guestPage.url());

  await guestPage.reload({ waitUntil: 'domcontentloaded' });
  await guestPage.waitForTimeout(4000);
  record('the guest session survives a reload', guestPage.url().includes('/app'), guestPage.url());

  const banner = await guestPage.locator('body').innerText();
  record('the guest is warned their work is browser-bound', /guest account/i.test(banner));

  // Clean up: turn the guest into a real (throwaway) account, then delete it.
  const email = `verify.guest.${stamp}@example.com`;
  try {
    await guestPage.getByRole('button', { name: /keep my progress/i }).first().click();
    const dialog = guestPage.getByRole('dialog');
    await dialog.waitFor({ timeout: 15000 });
    await dialog.locator('input[autocomplete="name"]').fill('Verify Guest');
    await dialog.locator('input[type="email"]').fill(email);
    await dialog.locator('input[type="password"]').fill('StudyHard123');
    await dialog.getByRole('button', { name: /save my account/i }).click();
    await guestPage.waitForTimeout(6000);

    const afterUpgrade = await guestPage.locator('body').innerText();
    record('the guest can be upgraded to a full account', !/You are using a guest account/i.test(afterUpgrade));

    await guestPage.goto(`${BASE}/app/settings`, { waitUntil: 'domcontentloaded' });
    await guestPage.waitForTimeout(3500);
    await guestPage.getByRole('button', { name: /delete account/i }).click();
    await guestPage.locator('#delete-confirm').fill('DELETE');
    await guestPage.getByRole('dialog').getByRole('button', { name: /delete everything/i }).click();
    // Signed out is the signal; the app sends a deleted account to the home page.
    await guestPage
      .waitForURL((url) => !url.pathname.startsWith('/app'), { timeout: 60000 })
      .catch(() => {});
    record(
      'the upgraded account can be deleted again',
      !guestPage.url().includes('/app'),
      `${email} -> ${new URL(guestPage.url()).pathname}`,
    );
  } catch (error) {
    record('cleanup of the upgraded account', false, `${email}: ${error.message.slice(0, 120)}`);
  }
}

await guestContext.close();
await context.close();
await browser.close();

const passed = results.filter((result) => result.ok).length;
console.log(`\n${passed}/${results.length} live checks passed against ${BASE}`);
process.exitCode = passed === results.length ? 0 : 1;

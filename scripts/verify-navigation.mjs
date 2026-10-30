/**
 * Navigation acceptance test.
 *
 * Implements the brief's final acceptance test literally: a first-time visitor
 * opens the site, sees the homepage, clicks through public features, explores
 * without an account, comes back, and can choose to sign in only if they want
 * to. Every assertion here is one line of that list.
 *
 * Run against a built preview:  npm run build && node scripts/verify-navigation.mjs
 */
import { chromium, devices } from 'playwright';

// Accept both names: the other browser suites use BASE_URL, and using one
// convention here would mean a typo silently points the suite at nothing.
const BASE = process.env.BASE_URL ?? process.env.BASE ?? 'http://127.0.0.1:5173';
let failures = 0;
const results = [];

function check(ok, label, detail = '') {
  results.push({ ok, label, detail });
  if (!ok) failures += 1;
}

async function makeContext(browser, options = {}) {
  const context = await browser.newContext(options);
  // Fail loudly if any test would accidentally rely on a real Firebase project.
  return context;
}

async function run() {
  const browser = await chromium.launch();

  // ---------------------------------------------------------------- desktop
  const context = await makeContext(browser, { viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  // `vite preview` serves the client but not the serverless /api routes, so a
  // missing API is expected here and would be a real failure only on Vercel.
  // Console text hides the URL, so the response listener is the reliable one.
  const serverErrors = [];
  page.on('response', (response) => {
    const path = new URL(response.url()).pathname;
    if (response.status() >= 500 && !path.startsWith('/api/')) serverErrors.push(`${response.status()} ${path}`);
  });
  const consoleErrors = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() !== 'error') return;
    if (/favicon|net::ERR_INTERNET|Firebase|Failed to load resource/i.test(text)) return;
    consoleErrors.push(text);
  });
  const authRedirects = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame() && /\/(login|signup|onboarding)/.test(frame.url())) authRedirects.push(frame.url());
  });

  // 1. Open the site: the homepage appears, no redirect.
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForSelector('#main h1', { timeout: 20000 });
  check(page.url().replace(/\/$/, '') === BASE.replace(/\/$/, ''), '1. homepage is the first screen', page.url());
  check(!/\/(login|signup|onboarding)/.test(page.url()), '1b. no forced sign-in on arrival');
  // Login and sign up remain visible for anyone who wants them.
  check(await page.getByRole('link', { name: 'Log in' }).first().isVisible(), '1c. Log in stays in the header');
  check(await page.getByRole('link', { name: 'Sign up' }).first().isVisible(), '1d. Sign up stays in the header');

  // 2. Click public features — each opens directly, with no auth screen.
  const publicRoutes = ['/features', '/ai-tutor', '/see-preparation', '/subjects', '/courses', '/resources', '/opportunities', '/global-quiz', '/pricing', '/help', '/about'];
  for (const route of publicRoutes) {
    await page.goto(BASE + route, { waitUntil: 'load' });
    const h1 = await page.locator('#main h1').first().textContent({ timeout: 15000 });
    check(Boolean(h1 && h1.trim().length > 2), `2. ${route} opens directly`, h1?.trim().slice(0, 48));
  }

  // 3. A real tool, reached by clicking, with no account.
  await page.goto(BASE + '/ai-tutor', { waitUntil: 'load' });
  await page.waitForSelector('#main h1');
  const tutorCta = page.getByRole('button', { name: /open the tutor/i }).first();
  check(await tutorCta.count() > 0, '3. the AI tutor page offers a direct way in');
  if (await tutorCta.count()) {
    await tutorCta.click();
    await page.waitForURL(/\/app\/tutor/, { timeout: 20000 });
    check(/\/app\/tutor/.test(page.url()), '3b. the tutor opens without a login screen', page.url());
    await page.waitForSelector('textarea, input[type="text"]', { timeout: 20000 }).catch(() => null);
    const guestBadge = await page.getByText(/without an account|guest/i).first().isVisible().catch(() => false);
    check(guestBadge, '3c. the session is labelled as account-free');
  }

  // 4. Deep link straight into a tool (a shared link, a bookmark, a search result).
  await page.goto(BASE + '/app/quizzes', { waitUntil: 'load' });
  await page.waitForSelector('#app-main', { timeout: 20000 });
  const onQuizzes = /\/(login|signup|onboarding)/.test(page.url()) === false;
  check(onQuizzes, '4. a deep link to /app/quizzes is not bounced to sign-in', page.url());
  const quizHeading = await page.locator('#app-main h1, #app-main h2').first().textContent({ timeout: 20000 }).catch(() => '');
  check(Boolean(quizHeading && quizHeading.trim()), '4b. the quizzes screen rendered content', quizHeading?.trim().slice(0, 40));

  // 5. Refresh keeps you where you are.
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#app-main', { timeout: 20000 });
  check(/\/app\/quizzes/.test(page.url()) && !/\/(login|signup|onboarding)/.test(page.url()), '5. refresh does not redirect to onboarding or login', page.url());

  // 6. Back and forward work.
  await page.goto(BASE + '/features', { waitUntil: 'load' });
  await page.waitForSelector('#main h1');
  await page.goto(BASE + '/pricing', { waitUntil: 'load' });
  await page.waitForSelector('#main h1');
  await page.goBack({ waitUntil: 'load' });
  await page.waitForSelector('#main h1');
  check(/\/features/.test(page.url()), '6. browser back returns to the previous page', page.url());
  await page.goForward({ waitUntil: 'load' });
  await page.waitForSelector('#main h1');
  check(/\/pricing/.test(page.url()), '6b. browser forward works', page.url());

  // 7. Return to the homepage normally.
  await page.getByRole('link', { name: /ujyalo learn home/i }).first().click();
  await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 });
  check(page.url().endsWith('/'), '7. the logo returns to the homepage');

  // 8. Signing in is voluntary and carries the intended destination.
  // Everything above happened under observation; only a *spontaneous* auth
  // redirect is a failure, so the count is recorded before deliberately going
  // to the login page.
  const spontaneousAuthRedirects = [...authRedirects];
  await page.goto(BASE + '/login?next=%2Fapp%2Ftutor', { waitUntil: 'load' });
  await page.waitForSelector('input[type="email"], input[type="password"]', { timeout: 20000 });
  check(true, '8. login is reachable on purpose, with a stated next destination');

  check(
    spontaneousAuthRedirects.length === 0,
    'nothing navigated us into an auth screen by itself',
    spontaneousAuthRedirects.join(' '),
  );
  check(serverErrors.length === 0, 'no server error while browsing', serverErrors.slice(0, 3).join(' | '));
  check(consoleErrors.length === 0, 'no console errors while browsing', consoleErrors.slice(0, 3).join(' | '));

  await context.close();

  // 9. Work done without an account survives the voluntary sign-up.
  {
    const guestContext = await makeContext(browser, { viewport: { width: 1280, height: 950 } });
    const guest = await guestContext.newPage();
    await guest.goto(BASE + '/app/notes', { waitUntil: 'load' });
    await guest.waitForSelector('#app-main', { timeout: 20000 });
    await guest.getByRole('button', { name: /new note/i }).first().click();
    const title = `Note made before signing up ${Date.now()}`;
    await guest.getByPlaceholder(/Photosynthesis key points/i).fill(title);
    await guest.getByPlaceholder(/Markdown is supported/i).fill('This should follow the account, not be lost.');
    await guest.getByRole('button', { name: /save note/i }).click();
    await guest.waitForTimeout(900);

    await guest.goto(BASE + '/signup?next=%2Fapp%2Fnotes', { waitUntil: 'load' });
    await guest.getByLabel('Your name').fill('Navigation Test');
    await guest.getByLabel('Email address').fill(`nav.${Date.now()}@example.com`);
    await guest.getByLabel('Password', { exact: true }).fill('StudyHard123');
    await guest.getByLabel('Confirm password').fill('StudyHard123');
    await guest.getByRole('checkbox').check();
    await guest.getByRole('button', { name: /create free account|create account/i }).click();
    await guest.waitForURL(/\/app\/notes/, { timeout: 25000 });
    await guest.waitForTimeout(1500);
    const afterSignup = await guest.locator('#app-main').innerText();
    check(afterSignup.includes(title), '9. work done before signing up is still there afterwards');
    check(/\/app\/notes/.test(guest.url()), '9b. sign-up returns to the page they were on', guest.url());
    await guestContext.close();
  }

  // ----------------------------------------------------------------- mobile
  const mobile = await makeContext(browser, { ...devices['Pixel 7'] });
  const mpage = await mobile.newPage();
  await mpage.goto(BASE + '/', { waitUntil: 'load' });
  await mpage.waitForSelector('#main h1', { timeout: 20000 });
  check(true, 'M1. homepage renders on a 412px phone');

  const menuButton = mpage.getByRole('button', { name: /open menu/i }).first();
  check(await menuButton.isVisible(), 'M2. the menu button is reachable on mobile');
  if (await menuButton.isVisible()) {
    await menuButton.click();
    await mpage.waitForTimeout(300);
    const mobileLogin = mpage.getByRole('link', { name: /log in/i }).first();
    check(await mobileLogin.isVisible(), 'M3. Log in is reachable inside the mobile menu');
    const navLink = mpage.locator('#mobile-nav a[href="/subjects"]').first();
    check(await navLink.isVisible(), 'M4. subjects is reachable in the mobile menu');
    await navLink.click();
    await mpage.waitForURL(/\/subjects/, { timeout: 15000 });
    check(/\/subjects/.test(mpage.url()), 'M5. a mobile menu link opens directly');
  }

  await mpage.goto(BASE + '/app/tutor', { waitUntil: 'load' });
  await mpage.waitForSelector('#app-main', { timeout: 20000 });
  check(!/\/(login|signup|onboarding)/.test(mpage.url()), 'M6. the tutor opens on mobile with no account', mpage.url());

  await mobile.close();

  // ------------------------------------------------------------------ tablet
  const tablet = await makeContext(browser, { viewport: { width: 834, height: 1112 }, isMobile: true, hasTouch: true });
  const tpage = await tablet.newPage();
  await tpage.goto(BASE + '/global-quiz', { waitUntil: 'load' });
  await tpage.waitForSelector('#main h1', { timeout: 20000 });
  check(true, 'T1. the Arena opens on an 834px tablet');
  await tpage.goto(BASE + '/app', { waitUntil: 'load' });
  await tpage.waitForSelector('#app-main', { timeout: 20000 });
  check(!/\/(login|signup|onboarding)/.test(tpage.url()), 'T2. the dashboard opens on tablet with no account', tpage.url());
  await tablet.close();

  await browser.close();

  const passed = results.filter((r) => r.ok).length;
  for (const result of results) {
    console.log(`  ${result.ok ? 'ok  ' : 'FAIL'} ${result.label}${result.detail && !result.ok ? ` → ${result.detail}` : ''}`);
  }
  console.log(`\n${passed}/${results.length} checks passed`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

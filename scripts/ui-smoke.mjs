/**
 * Browser smoke test for Ujyalo Learn (local demo mode, no credentials needed).
 *
 * Drives the real app in Chromium: public pages, signup, onboarding, dashboard,
 * tutor (AI not configured → must show a clear state, not a fake answer),
 * notes CRUD, planner, progress empty states, settings, mobile layout and
 * dark mode. Fails on any uncaught page error or console error.
 *
 *   node ui-test.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173';
const SHOTS = process.env.SHOTS ?? path.join(process.cwd(), 'docs', 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const consoleErrors = [];

function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`${passed ? '✓' : '✗'} ${name}${passed || !detail ? '' : ` — ${detail}`}`);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1360, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();

page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() !== 'error') return;
  const text = message.text();
  const url = message.location()?.url ?? '';
  // Network failures for the AI endpoints are expected when no provider is
  // configured; the app surfaces them in the UI. Everything else is a bug.
  if (/Failed to load resource/.test(text) && /\/api\/(tutor|tools|quiz|flashcards|health)/.test(url)) return;
  // Navigating to an unknown URL is supposed to be a real HTTP 404 now, and
  // browsers log that as a failed resource. It is an assertion target, not a bug.
  if (/Failed to load resource/.test(text) && /does-not-exist/.test(page.url())) return;
  consoleErrors.push(`console: ${text}`);
});

const shot = async (name, fullPage = true) => {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage });
};

async function visit(pathname) {
  // Not 'networkidle': Firestore keeps a stream open, so that promise never
  // resolves once real Firebase config is present (it worked in CI only
  // because CI runs without one). Wait for the document and a rendered
  // heading instead.
  await page.goto(`${BASE}${pathname}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1, [role="dialog"], form', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(350);
}

// ─── Public pages ────────────────────────────────────────────────────────────
const publicPages = [
  ['/', 'Smart learning.'],
  ['/features', null],
  ['/subjects', null],
  ['/pricing', null],
  ['/help', null],
  ['/about', null],
  ['/contact', null],
  ['/privacy', null],
  ['/terms', null],
];

for (const [pathname, expectedHeading] of publicPages) {
  await visit(pathname);
  const h1 = (await page.locator('h1').first().innerText()).trim();
  const title = await page.title();
  check(
    `public ${pathname} renders`,
    h1.length > 3 && title.includes('Ujyalo Learn'),
    `h1="${h1}" title="${title}"`,
  );
  if (expectedHeading) check(`home hero copy`, h1.includes(expectedHeading), h1);
}

await visit('/');
await shot('01-home');

check(
  'founder credit appears on the public site',
  (await page.content()).includes('Riyaz Chalise'),
  'About page + footer must credit the founder',
);
await visit('/about');
check('about page credits the founder', (await page.content()).includes('Riyaz Chalise'));

// ── Search (⌘K palette) ────────────────────────────────────────────────────
await visit('/');
await page.keyboard.press('Control+k');
await page.waitForTimeout(250);
await page.keyboard.type('quiz');
await page.waitForTimeout(250);
const searchHits = await page.getByRole('option').count();
check('command palette opens with results', searchHits > 0, `${searchHits} results`);
await page.keyboard.press('Escape');
await page.waitForTimeout(150);
check('command palette closes on Escape', (await page.getByRole('option').count()) === 0);


// ─── Search Console ownership file ─────────────────────────────────────────
// Google compares this file byte-for-byte, so the deployed copy is asserted,
// not assumed. A missing or rewritten file silently breaks verification.
const verifyRes = await page.request.get(`${BASE}/googlec3d881d4bf552040.html`);
const verifyBody = (await verifyRes.text()).trim();
check(
  'Google verification file is served verbatim at the site root',
  verifyRes.status() === 200 && verifyBody === 'google-site-verification: googlec3d881d4bf552040.html',
  `${verifyRes.status()} "${verifyBody.slice(0, 60)}"`,
);

// ─── Signed-out protection ──────────────────────────────────────────────────
await visit('/app');
await page.waitForTimeout(1200);
// Signed out, an app URL now offers one-click entry instead of bouncing to a
// login form: a visitor who followed a shared link should be able to start.
const appGateText = await page.locator('body').innerText();
check(
  'a protected route offers a one-click way in, not a dead end',
  /start in one click/i.test(appGateText),
  page.url(),
);
check('the one-click gate offers logging in for existing accounts', /log in/i.test(appGateText));
await visit('/admin');
await page.waitForTimeout(900);
check('admin also redirects to login when signed out', page.url().includes('/login'), page.url());

// ─── Learning library (public) ──────────────────────────────────────────────
await visit('/courses');
const coursesText = await page.locator('body').innerText();
check('courses page lists the starter library', /learning paths|course/i.test(coursesText));
check('courses page explains courses are study paths, not official material', /study paths|not just links/i.test(coursesText));
await shot('19-courses');

await visit('/courses/see-mathematics-core');
const courseText = await page.locator('body').innerText();
check('course detail renders its sessions', /Work through the sessions/i.test(courseText));
check('course detail carries the honesty note', /not official curriculum material/i.test(courseText));
await shot('20-course-detail');

await visit('/resources');
check('resources page lists guides', /resource/i.test(await page.locator('body').innerText()));
await visit('/resources/how-to-use-active-recall');
check('resource page shows attribution and licence', /Ujyalo Learn original/i.test(await page.locator('body').innerText()));
await shot('21-resource');

await visit('/grades/10');
check('grade hub renders', /Grade 10 study hub/i.test(await page.locator('body').innerText()));
await visit('/see-preparation');
check('SEE hub renders', /SEE preparation/i.test(await page.locator('body').innerText()));
await visit('/faq');
// Answers live inside collapsed <details>, so read textContent, not innerText.
await page.getByRole('heading', { name: /Questions students and parents ask/i }).isVisible();
const faqHtml = await page.content();
check(
  'FAQ answers the official-curriculum question',
  /National Examination Board/i.test(faqHtml) && /independent learning tool/i.test(faqHtml),
);
await visit('/content-policy');
check('content policy is published', /copyright policy/i.test(await page.locator('body').innerText()));

// ─── Sign up (local demo mode) ───────────────────────────────────────────────
const email = `test.student.${Date.now()}@example.com`;
await visit('/signup');
await page.getByLabel('Your name').fill('Aarati Test');
await page.getByLabel('Email address').fill(email);
await page.getByLabel('Password', { exact: true }).fill('StudyHard123');
await page.getByLabel('Confirm password').fill('StudyHard123');
await page.getByRole('checkbox').check();
await shot('02-signup', false);
await page.getByRole('button', { name: /create free account|create account/i }).click();
await page.waitForURL('**/onboarding', { timeout: 15000 });
check('signup creates a session and opens onboarding', page.url().includes('/onboarding'));

// ─── Onboarding ─────────────────────────────────────────────────────────────
await page.waitForSelector('text=Your learning profile');
// Step 0: name + country
await page.getByLabel('Your name').fill('Aarati');
await page.getByRole('button', { name: 'Continue' }).click();
// Step 1: grade
await page.getByRole('button', { name: 'Grade 10', exact: true }).click();
await page.getByRole('button', { name: 'Continue' }).click();
// Step 2: curriculum
await page.getByRole('button', { name: /Nepal National Curriculum \(CDC\)/ }).click();
await page.getByRole('button', { name: 'Continue' }).click();
// Step 3: language
await page.getByRole('button', { name: /^English/ }).first().click();
await page.getByRole('button', { name: 'Continue' }).click();
// Step 4: subjects
await page.getByRole('button', { name: 'Mathematics', exact: true }).click();
await page.getByRole('button', { name: 'Science', exact: true }).click();
await page.getByRole('button', { name: 'Continue' }).click();
// Step 5: goals
await page.getByRole('button', { name: /Prepare for exams/i }).click();
await page.getByRole('button', { name: 'Continue' }).click();
// Step 6: explanation style
await page.getByRole('button', { name: /Step-by-step detailed/i }).click();
await shot('03-onboarding', false);
await page.getByRole('button', { name: /Finish setup/i }).click();
await page.waitForURL('**/app', { timeout: 15000 });
check('onboarding finishes and opens the dashboard', page.url().endsWith('/app'));

// ─── Open-redirect guard on ?next= ──────────────────────────────────────────
// Regression guard for GHSA-wrjc-x8rr-h8h6 (React Router open redirect via a
// backslash). The old guard was a string prefix check, so /\\evil.com and
// /<tab>/evil.com passed it and resolved to another origin after login — a
// phishing vector for a site used by children.
{
  // Sign out through the real UI. Do NOT clear localStorage: in demo mode that
  // deletes the account itself, which would make every later login fail.
  async function logOutViaUi() {
    // The dashboard renders after the auth profile resolves, so wait for the
    // control rather than assuming it is already there.
    const menu = page.locator('[aria-label="Account menu"]').first();
    await menu.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    if (await menu.isVisible().catch(() => false)) {
      await menu.click();
      await page.waitForTimeout(400);
      await page.getByRole('menuitem', { name: /log out/i }).first().click().catch(async () => {
        await page.getByRole('button', { name: /^log out$/i }).first().click();
      });
      await page.waitForTimeout(1500);
    }
  }

  async function loginWith(next) {
    await visit(`/login${next === null ? '' : `?next=${encodeURIComponent(next)}`}`);
    await page.getByLabel(/email/i).first().fill(email);
    await page.getByLabel(/^password$/i).first().fill('StudyHard123');
    await page.getByRole('button', { name: /^log in$|sign in/i }).first().click();
    await page.waitForTimeout(2500);
    return page.url();
  }

  // Start signed out: /login redirects an authenticated visitor to /app.
  await visit('/app');
  await logOutViaUi();

  const escapes = [];
  for (const attack of ['//evil.com', '/\\evil.com', '/\t/evil.com', 'https://evil.com']) {
    const landed = await loginWith(attack);
    if (!landed.startsWith(BASE)) escapes.push(`${JSON.stringify(attack)} -> ${landed}`);
    await logOutViaUi();
  }
  check('?next= cannot be used as an open redirect', escapes.length === 0, escapes.join(' '));

  // A blocked redirect must land somewhere real, not on a blank or stuck page.
  const blockedLanding = await loginWith('//evil.com');
  check(
    'a blocked redirect still signs the student in',
    new URL(blockedLanding).pathname === '/app' || new URL(blockedLanding).pathname.startsWith('/app'),
    blockedLanding,
  );
  await logOutViaUi();

  // And a legitimate ?next= must still be honoured, or the guard breaks login.
  const legit = await loginWith('/app/quizzes');
  check('a legitimate ?next= is still honoured', new URL(legit).pathname === '/app/quizzes', legit);

  // Leave the session in the state the dashboard checks below expect.
  await visit('/app');
}

// ─── Dashboard ──────────────────────────────────────────────────────────────
await page.waitForSelector('h1');
const dashText = await page.locator('body').innerText();
check('dashboard greets the student by name', /Aarati/i.test(dashText), dashText.slice(0, 120));
check('dashboard shows a demo-mode notice', /demo|this browser/i.test(dashText));
check('dashboard shows empty states instead of fake data', /no |nothing|start|empty/i.test(dashText));
await shot('04-dashboard');

// ─── Admin panel (demo workspace: local role = owner) ───────────────────────
await visit('/admin');
await page.waitForTimeout(900); // role lookup resolves after mount
const adminText = await page.locator('body').innerText();
check('admin overview loads for the demo owner', /Overview/i.test(adminText));
check('admin labels the demo workspace honestly', /stored in this browser only|Demo workspace/i.test(adminText));

await visit('/admin/courses');
check('admin course list renders', /Courses/i.test(await page.locator('body').innerText()));
await visit('/admin/courses/new');
await page.waitForTimeout(400);
const publishButton = page.getByRole('button', { name: /^Publish$/ });
check('publishing an empty course is blocked', await publishButton.isDisabled());
check('the editor explains what is missing', /Before publishing/i.test(await page.locator('body').innerText()));

await visit('/admin/resources/new');
await page.getByLabel('Title', { exact: true }).fill('Temporary smoke resource');
await page.getByLabel('Description', { exact: true }).fill('A description long enough to satisfy validation.');
await page.getByLabel('Body', { exact: true }).fill('Body text for the smoke test, long enough to pass the minimum length check.');
await page.getByRole('button', { name: 'Save draft' }).click();
await page.waitForTimeout(900);
await visit('/resources');
check('a saved draft never appears publicly', !(await page.locator('body').innerText()).includes('Temporary smoke resource'));
await visit('/resources/temporary-smoke-resource');
check('a draft is not reachable by URL either', /404/.test(await page.locator('body').innerText()));

await visit('/admin/audit');
check('audit log records the saved draft', /Temporary smoke resource/i.test(await page.locator('body').innerText()));
await shot('22-admin-audit');
await visit('/admin/settings');
check('settings page is reachable for an owner', /Site settings/i.test(await page.locator('body').innerText()));

// ─── SEO management ─────────────────────────────────────────────────────────
await visit('/admin/seo');
await page.waitForTimeout(500);
check('SEO page lists every public route', /\/see-preparation/.test(await page.locator('body').innerText()));
await page.getByRole('button', { name: 'Override' }).first().click();
await page.waitForTimeout(250);
await page.locator('input[id^="seo-title-"]').first().fill('<script>alert(1)</script>');
await page.getByRole('button', { name: 'Save', exact: true }).click();
await page.waitForTimeout(300);
check('SEO fields reject markup', /plain text without/i.test(await page.locator('body').innerText()));
await page.locator('input[id^="seo-title-"]').first().fill('Home — Ujyalo Learn');
await page.getByRole('button', { name: 'Save', exact: true }).click();
await page.waitForTimeout(900);
await visit('/');
await page.waitForTimeout(600);
check('a saved SEO override changes the live title', (await page.title()).startsWith('Home — Ujyalo Learn'), await page.title());

// Reset so later runs start from the shipped defaults.
await visit('/admin/seo');
await page.waitForTimeout(400);
await page.getByRole('button', { name: /Edit override/ }).first().click();
await page.getByRole('button', { name: /Reset to default/ }).click();
await page.waitForTimeout(700);
await visit('/');
await page.waitForTimeout(500);
check('resetting restores the default title', /AI Tutor for Grades/i.test(await page.title()), await page.title());


// 404
await visit('/this-page-does-not-exist');
const notFoundText = await page.locator('body').innerText();
check('unknown route shows a 404 page', /404|not found/i.test(notFoundText));


// ─── Tutor ──────────────────────────────────────────────────────────────────
await visit('/app/tutor');
await page.getByPlaceholder(/Ask your question/i).fill('Explain fractions simply, with one example.');
await page.getByRole('button', { name: 'Send message' }).click();
await page.waitForTimeout(3500);
const tutorText = await page.locator('body').innerText();

// This suite runs against a server with no provider key. When a key *is*
// configured (e.g. testing production where Groq is live), assert the opposite:
// a real answer arrives and is labelled as AI-generated. Both branches are
// explicit so the test never silently "passes" by skipping.
const health = await page.evaluate(async () => {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch {
    return { configured: false };
  }
});
if (health.configured) {
  await page.waitForTimeout(6000);
  const live = await page.locator('body').innerText();
  check('tutor returns a real answer from the configured provider', !/not configured|isn’t configured/i.test(live), live.slice(-300));
  check('AI answers carry the AI-generated disclaimer', /AI-generated|AI can make mistakes/i.test(live));
} else {
  const aiUnavailable = /not configured|isn’t configured|isn't configured|AI is not|setup|unavailable|owner/i.test(tutorText);
  check('tutor shows a clear "AI not configured" state (no fake answer)', aiUnavailable, tutorText.slice(-400));
  check('tutor never fabricates an answer when the AI is off', !/fraction.*equal parts/i.test(tutorText));
}
await shot('05-tutor');

// ─── Notes: create, search, favourite, delete ───────────────────────────────
await visit('/app/notes');
await page.getByRole('button', { name: /new note/i }).first().click();
await page.getByLabel('Title', { exact: true }).fill('Photosynthesis basics');
await page.getByLabel('Subject', { exact: true }).selectOption({ label: 'Science' });
await page.getByLabel('Content', { exact: true }).fill('Chlorophyll captures light energy. Plants release oxygen as a by-product.');
await page.getByRole('button', { name: /save note/i }).click();
await page.waitForTimeout(1200);
const notesText = await page.locator('body').innerText();
check('note is saved and listed', notesText.includes('Photosynthesis basics'));
await shot('06-notes');

await page.getByPlaceholder(/search/i).fill('chlorophyll');
await page.waitForTimeout(600);
check('note search finds the saved note', (await page.locator('body').innerText()).includes('Photosynthesis basics'));
await page.getByPlaceholder(/search/i).fill('zzzz-no-match');
await page.waitForTimeout(600);
check('note search shows a filtered empty state', /no notes match|no results|nothing/i.test(await page.locator('body').innerText()));
await page.getByPlaceholder(/search/i).fill('');

// Reload persistence
await page.reload({ waitUntil: 'networkidle' });
check('notes persist across a reload', (await page.locator('body').innerText()).includes('Photosynthesis basics'));

// Delete the note
await page.getByRole('button', { name: /delete photosynthesis basics/i }).first().click();
await page.getByRole('button', { name: /^Delete note$/i }).click();
await page.waitForTimeout(1200);
check('note is deleted after confirmation', !(await page.locator('body').innerText()).includes('Photosynthesis basics'));

// ─── Planner ────────────────────────────────────────────────────────────────
await visit('/app/planner');
const plannerText = await page.locator('body').innerText();
check('planner says reminders are not configured', /reminder|notif/i.test(plannerText));
await page.getByRole('button', { name: /add task/i }).first().click();
await page.getByLabel('What will you study?').fill('Revise algebra for 30 minutes');
await page.getByRole('dialog').getByRole('button', { name: 'Add task', exact: true }).click();
await page.waitForTimeout(1000);
check('planner saves a task', (await page.locator('body').innerText()).includes('Revise algebra'));
await shot('07-planner');

// ─── Progress ───────────────────────────────────────────────────────────────
await visit('/app/progress');
const progressText = await page.locator('body').innerText();
check('progress page renders with honest empty states', /no quiz|not enough|start|attempt/i.test(progressText));
check('progress does not claim mastery from no data', !/you have mastered/i.test(progressText));
await shot('08-progress');

// ─── Quizzes (AI off) ───────────────────────────────────────────────────────
await visit('/app/quizzes');
const quizText = await page.locator('body').innerText();
check('quiz generator explains it cannot generate without AI', /not configured|owner|unavailable|AI/i.test(quizText));
await shot('09-quizzes');

// ─── Tools / Flashcards ─────────────────────────────────────────────────────
await visit('/app/tools');
const toolsText = await page.locator('body').innerText();
check('tools page lists the study tools', /revision|formula|writing|question/i.test(toolsText));
await shot('10-tools');

await visit('/app/flashcards');
check('flashcards page renders an empty state', /no decks|not yet|generate/i.test(await page.locator('body').innerText()));

// ─── Settings ───────────────────────────────────────────────────────────────
await visit('/app/settings');
const settingsText = await page.locator('body').innerText();
check('settings shows the account email', settingsText.includes(email));
check('settings explains the demo-mode storage', /demo|this browser|local/i.test(settingsText));
await shot('11-settings');

// Theme toggle
const themeBefore = await page.evaluate(() => document.documentElement.classList.contains('dark'));
await page.getByRole('button', { name: /dark/i }).first().click();
await page.waitForTimeout(600);
const themeAfter = await page.evaluate(() => document.documentElement.classList.contains('dark'));
check('theme toggle switches theme', themeBefore !== themeAfter, `${themeBefore} → ${themeAfter}`);
await shot('12-settings-dark', false);

// ─── Crawler view (JavaScript disabled) ────────────────────────────────────
// Prerendering is a build artifact, so the dev server cannot be checked for it.
{
  // Decide from the served HTML, not from the hostname: `vite` sends an empty
  // #root (prerendering happens at build time), while a build, a preview and
  // production all send the prerendered skeleton.
  const probe = await page.request.get(`${BASE}/`);
  const probeHtml = await probe.text();
  const prerendered = /<div id="root">\s*<\w/.test(probeHtml);
  if (!prerendered) {
    console.log('· skipping the no-JavaScript crawler checks: this server does not serve prerendered HTML (run against a build or production)');
  } else {
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const crawler = await noJs.newPage();
    const gaps = [];
    for (const route of ['/', '/courses', '/resources/how-to-use-active-recall']) {
      await crawler.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
      const seen = await crawler.evaluate(() => ({
        h1: document.querySelectorAll('h1').length,
        heading: document.querySelector('h1')?.textContent?.trim() ?? '',
        footer: document.querySelectorAll('footer a').length,
        privacy: !!document.querySelector('footer a[href="/privacy"]'),
        contact: !!document.querySelector('footer a[href="/contact"]'),
        cta: !!document.querySelector('.pr-a a, a[href="/signup"]'),
        crumb: !!document.querySelector('nav[aria-label="Breadcrumb"]'),
      }));
      if (seen.h1 !== 1) gaps.push(`${route}: h1=${seen.h1}`);
      if (!seen.heading) gaps.push(`${route}: empty h1`);
      if (seen.footer < 8) gaps.push(`${route}: footer links=${seen.footer}`);
      if (!seen.privacy) gaps.push(`${route}: no privacy link`);
      if (!seen.contact) gaps.push(`${route}: no contact link`);
      if (!seen.cta) gaps.push(`${route}: no call to action`);
      if (route !== '/' && !seen.crumb) gaps.push(`${route}: no breadcrumb`);
    }
    check('a crawler without JavaScript still sees real page content', gaps.length === 0, gaps.join(' '));
    await noJs.close();
  }
}

// ─── Header navigation across breakpoints ──────────────────────────────────
// Regression guard: the desktop nav used to appear at lg while the hamburger
// disappeared at md, leaving 768-1023px with no route to Courses/Resources/SEE.
{
  const widths = [1440, 1280, 1024, 900, 768, 390];
  const dead = [];
  for (const width of widths) {
    const tab = await context.newPage();
    await tab.setViewportSize({ width, height: 900 });
    await tab.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const desktopNav = await tab.locator('nav[aria-label="Main"]').isVisible();
    const burger = await tab.getByRole('button', { name: /open menu|close menu/i }).isVisible();
    if (!desktopNav) {
      // The hamburger must exist and open a panel holding the same links.
      const panel = tab.locator('#mobile-nav');
      if (burger) {
        await tab.getByRole('button', { name: /open menu/i }).click();
        await panel.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      }
      const links = await panel.locator('a').count();
      if (links < 7) dead.push(`${width}px:${links}links`);
    }
    const overflow = await tab.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) dead.push(`${width}px:overflow${overflow}`);
    await tab.close();
  }
  check('header navigation is reachable at every breakpoint', dead.length === 0, dead.join(' '));
}

// ─── Mobile layout + overflow ───────────────────────────────────────────────
const mobile = await context.newPage();
await mobile.setViewportSize({ width: 375, height: 812 });
await mobile.goto(`${BASE}/`, { waitUntil: 'networkidle' });
const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check('home page has no horizontal overflow on mobile', overflow <= 1, `overflow=${overflow}px`);
await mobile.screenshot({ path: path.join(SHOTS, '13-mobile-home.png'), fullPage: true });

await mobile.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
await mobile.waitForTimeout(2000);
const mobileMetrics = await mobile.evaluate(() => {
  const offenders = [];
  document.querySelectorAll('*').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.right > window.innerWidth + 0.5) {
      offenders.push(
        `${el.tagName}.${String(el.className).slice(0, 50)} [w=${Math.round(rect.width)}] "${(el.textContent ?? '').trim().slice(0, 40)}"`,
      );
    }
  });
  return { overflow: document.documentElement.scrollWidth - window.innerWidth, offenders: offenders.slice(0, 5) };
});
check(
  'dashboard has no horizontal overflow on mobile',
  mobileMetrics.overflow <= 1,
  `overflow=${mobileMetrics.overflow}px ${mobileMetrics.offenders.join(' ')}`,
);
await mobile.screenshot({ path: path.join(SHOTS, '14-mobile-dashboard.png'), fullPage: true });

// Keyboard access: skip link
await mobile.keyboard.press('Tab');
const focused = await mobile.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
check('first Tab reaches a skip link or nav control', focused.length > 0, focused);
await mobile.close();

check('no uncaught page or console errors', consoleErrors.length === 0, consoleErrors.slice(0, 4).join(' | '));

await browser.close();

const passed = results.filter((result) => result.passed).length;
console.log(`\n${passed}/${results.length} browser checks passed.`);
if (passed !== results.length) process.exitCode = 1;

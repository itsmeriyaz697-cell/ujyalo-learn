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
  consoleErrors.push(`console: ${text}`);
});

const shot = async (name, fullPage = true) => {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage });
};

async function visit(pathname) {
  await page.goto(`${BASE}${pathname}`, { waitUntil: 'networkidle' });
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

// 404
await visit('/this-page-does-not-exist');
const notFoundText = await page.locator('body').innerText();
check('unknown route shows a 404 page', /404|not found/i.test(notFoundText));

// Login redirect for a protected route
await visit('/app');
check('protected route redirects to login', page.url().includes('/login'), page.url());

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

// ─── Dashboard ──────────────────────────────────────────────────────────────
await page.waitForSelector('h1');
const dashText = await page.locator('body').innerText();
check('dashboard greets the student by name', /Aarati/i.test(dashText), dashText.slice(0, 120));
check('dashboard shows a demo-mode notice', /demo|this browser/i.test(dashText));
check('dashboard shows empty states instead of fake data', /no |nothing|start|empty/i.test(dashText));
await shot('04-dashboard');

// ─── Tutor ──────────────────────────────────────────────────────────────────
await visit('/app/tutor');
await page.getByPlaceholder(/Ask your question/i).fill('Explain fractions simply, with one example.');
await page.getByRole('button', { name: 'Send message' }).click();
await page.waitForTimeout(3500);
const tutorText = await page.locator('body').innerText();
const aiUnavailable = /not configured|isn’t configured|isn't configured|AI is not|setup|unavailable|owner/i.test(tutorText);
check('tutor shows a clear "AI not configured" state (no fake answer)', aiUnavailable, tutorText.slice(-400));
check('tutor never fabricates an answer when the AI is off', !/fraction.*equal parts/i.test(tutorText));
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

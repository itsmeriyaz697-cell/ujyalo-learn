/**
 * End-to-end AI-feature test.
 *
 * Requires the dev server to point at an OpenAI-compatible endpoint. In this
 * workspace it runs against `scripts/mock-provider.mjs`, which proves the whole
 * chain (browser → /api/tutor → provider adapter → SSE → UI) without spending
 * money or holding a real key.
 *
 *   AI_API_BASE_URL=http://127.0.0.1:9099/v1 AI_API_KEY=mock ... npm run dev
 *   node ai-test.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173';
const SHOTS = process.env.SHOTS ?? path.join(process.cwd(), 'docs', 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const errors = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '✓' : '✗'} ${name}${passed || !detail ? '' : ` — ${detail}`}`);
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1360, height: 950 } });
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) errors.push(message.text());
});

const shot = (name) => page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

// ─── Account + onboarding ───────────────────────────────────────────────────
await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle' });
await page.getByLabel('Your name').fill('Bikash Test');
await page.getByLabel('Email address').fill(`ai.student.${Date.now()}@example.com`);
await page.getByLabel('Password', { exact: true }).fill('StudyHard123');
await page.getByLabel('Confirm password').fill('StudyHard123');
await page.getByRole('checkbox').check();
await page.getByRole('button', { name: 'Create account' }).click();
await page.waitForURL('**/onboarding');
await page.waitForTimeout(400);
const next = async () => {
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(250);
};
await next();
await page.getByRole('button', { name: 'Grade 9', exact: true }).click();
await next();
await page.getByRole('button', { name: /Nepal National Curriculum \(CDC\)/ }).click();
await next();
await page.getByRole('button', { name: /^English/ }).first().click();
await next();
await page.getByRole('button', { name: 'Science', exact: true }).click();
await next();
await page.getByRole('button', { name: /Prepare for exams/i }).click();
await next();
await page.getByRole('button', { name: /Simple and friendly/i }).click();
await page.getByRole('button', { name: /Finish setup/i }).click();
await page.waitForURL('**/app');
check('account and onboarding complete', page.url().endsWith('/app'));

// ─── AI status banner should now say configured ─────────────────────────────
await page.waitForTimeout(1200);
const dash = await page.locator('body').innerText();
check('dashboard no longer warns that the AI is missing', !/AI is not configured|not configured/i.test(dash.slice(0, 4000)));

// ─── Tutor: streaming reply ─────────────────────────────────────────────────
await page.goto(`${BASE}/app/tutor`, { waitUntil: 'networkidle' });
await page.getByPlaceholder(/Ask your question/i).fill('Explain fractions with one example.');
await page.getByRole('button', { name: 'Send message' }).click();
await page.waitForSelector('text=The big idea', { timeout: 25000 });
const tutorBody = await page.locator('body').innerText();
check('tutor streams a real answer', tutorBody.includes('The big idea'));
check('markdown math is rendered (KaTeX), not shown as raw LaTeX', (await page.locator('.katex').count()) > 0);
check('tutor shows the AI-generated disclaimer', /AI-generated|AI can make mistakes/i.test(tutorBody));
await shot('15-tutor-answer');

// Save answer to notes
await page.getByRole('button', { name: /save.*note/i }).first().click();
await page.waitForTimeout(1200);
await page.goto(`${BASE}/app/notes`, { waitUntil: 'networkidle' });
const notes = await page.locator('body').innerText();
check('tutor answer can be saved to notes', /fraction/i.test(notes));

// Rename + delete conversation from the sidebar
await page.goto(`${BASE}/app/tutor`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const renameButton = page.getByRole('button', { name: /rename /i }).first();
if (await renameButton.count()) {
  await renameButton.click();
  const input = page.getByLabel(/conversation name|title/i).first();
  await input.fill('Fractions session');
  await page.getByRole('button', { name: /save/i }).last().click();
  await page.waitForTimeout(900);
  check('conversation can be renamed', (await page.locator('body').innerText()).includes('Fractions session'));
} else {
  check('conversation can be renamed', false, 'rename control not found');
}

// ─── Quiz: generate, take, score ────────────────────────────────────────────
await page.goto(`${BASE}/app/quizzes`, { waitUntil: 'networkidle' });
await page.getByLabel(/^Topic/i).first().fill('Fractions');
await page.getByRole('button', { name: /generate quiz/i }).first().click();
await page.waitForURL(/\/app\/quizzes\/quiz_/, { timeout: 30000 });
check('quiz generation creates a quiz and opens it', /\/app\/quizzes\/quiz_/.test(page.url()));

await page.waitForSelector('text=Question 1 of', { timeout: 20000 });
const quizText = await page.locator('body').innerText();
check('quiz shows the first question only', /question 1 of/i.test(quizText), quizText.slice(0, 120));
check('quiz hides answers before submission', !/answer:/i.test(quizText));

// The mock quiz's correct answer is always the second option.
for (let index = 0; index < 5; index += 1) {
  const options = page.locator('button[aria-pressed]');
  await options.nth(1).click();
  if (index < 4) {
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(150);
  }
}
await page.getByRole('button', { name: /submit quiz/i }).click();
const dialog = page.getByRole('dialog');
if (await dialog.count()) {
  await dialog.getByRole('button', { name: /submit anyway/i }).click();
}
await page.waitForTimeout(1800);
const resultText = await page.locator('body').innerText();
check('quiz scores the attempt and shows explanations', /score|correct|explanation|review/i.test(resultText), resultText.slice(0, 200));
check('quiz result reports a real score out of five', /5\/5|five out of five|100%/i.test(resultText), resultText.slice(0, 200));
await shot('16-quiz-result');

// ─── Flashcards ─────────────────────────────────────────────────────────────
await page.goto(`${BASE}/app/flashcards`, { waitUntil: 'networkidle' });
await page.getByLabel(/^Topic/i).first().fill('Photosynthesis');
await page.getByRole('button', { name: /generate/i }).first().click();
await page.waitForTimeout(6000);
const deckText = await page.locator('body').innerText();
check('flashcard deck is generated and listed', /photosynthesis|mock flashcards/i.test(deckText), deckText.slice(0, 300));
await shot('17-flashcards');

// ─── Study tool ─────────────────────────────────────────────────────────────
// Enter through the tools index so a broken link is caught, not just a bad route.
await page.goto(`${BASE}/app/tools`, { waitUntil: 'networkidle' });
await page.getByRole('link', { name: /Revision summary/i }).click();
await page.waitForTimeout(600);
check('tool cards link to real tool routes', page.url().endsWith('/app/tools/revision-summary'), page.url());
await page.goto(`${BASE}/app/tools/revision-summary`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.getByRole('textbox').first().fill('Photosynthesis, grade 9, key definitions and common mistakes');
await page.getByRole('button', { name: /run revision summary/i }).click();
await page.waitForTimeout(6000);
const toolText = await page.locator('body').innerText();
check('study tool returns generated content', /key concepts|fraction|photosynthesis/i.test(toolText));
await shot('18-tool-output');

// ─── Progress now has real attempt data ─────────────────────────────────────
await page.goto(`${BASE}/app/progress`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const progress = await page.locator('body').innerText();
check('progress reflects the real quiz attempt', /1 attempt|attempts/i.test(progress));
check('progress keeps the "estimates, never mastery" wording', /estimates.*mastery|never proves mastery/i.test(progress));

check('no uncaught page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
const passed = results.filter((result) => result.passed).length;
console.log(`\n${passed}/${results.length} AI-feature checks passed.`);
if (passed !== results.length) process.exitCode = 1;

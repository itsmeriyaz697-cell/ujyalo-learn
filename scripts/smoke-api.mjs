/**
 * Integration smoke test for the AI API layer.
 *
 * It starts a mock OpenAI-compatible provider and the real development API
 * server, then exercises the endpoints exactly as the browser does:
 * health, tutor streaming, non-streaming, validation, size limits, quiz
 * parsing, flashcards, tools, rate limiting and auth fail-closed behaviour.
 *
 *   node scripts/smoke-api.mjs
 *
 * This proves the server wiring works without any paid credentials. It does
 * NOT prove a specific external provider behaves identically — see README.
 */
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const MOCK_PORT = await freePort();
const API_PORT = await freePort();
const API_PORT_RL = await freePort();
const API_PORT_AUTH = await freePort();
const API_BASE = `http://127.0.0.1:${API_PORT}`;
const API_BASE_RL = `http://127.0.0.1:${API_PORT_RL}`;
const API_BASE_AUTH = `http://127.0.0.1:${API_PORT_AUTH}`;

/** Ask the OS for a free TCP port so stale test servers never block a run. */
function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

const children = [];
const results = [];

// Resolve the binary directly so no `npx` wrapper is left holding the port.
const TSX = path.join(ROOT, 'node_modules', '.bin', 'tsx');
const BIN = process.platform === 'win32' ? `${TSX}.cmd` : TSX;

function start(command, args, env, label) {
  const child = spawn(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });
  children.push(child);
  child.stdout.on('data', (data) => {
    if (process.env.SMOKE_VERBOSE) process.stdout.write(`[${label}] ${data}`);
  });
  child.stderr.on('data', (data) => {
    if (process.env.SMOKE_VERBOSE) process.stderr.write(`[${label}:err] ${data}`);
  });
  return child;
}

async function waitFor(url, timeoutMs = 15000) {
  const startTime = Date.now();
  for (;;) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      /* not ready */
    }
    if (Date.now() - startTime > timeoutMs) return false;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  const icon = passed ? '✓' : '✗';
  console.log(`${icon} ${name}${passed || !detail ? '' : ` — ${detail}`}`);
}

const baseEnv = {
  AI_API_KEY: 'test-key-not-real',
  AI_API_BASE_URL: `http://127.0.0.1:${MOCK_PORT}/v1`,
  AI_MODEL: 'mock-model',
  AI_DEV_ALLOW_INSECURE: 'true',
  AI_ALLOWED_HOSTS: '127.0.0.1',
  AI_RATE_LIMIT_PER_MINUTE: '60',
  AI_MAX_REQUESTS_PER_DAY: '500',
  AI_MAX_BODY_KB: '8',
  AI_REQUEST_TIMEOUT_MS: '20000',
};

async function post(base, path, body, headers = {}) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return response;
}

async function main() {
  start(process.execPath, ['scripts/mock-provider.mjs', String(MOCK_PORT)], {}, 'mock');
  start(BIN, ['server/dev-api.ts'], { ...baseEnv, DEV_API_PORT: String(API_PORT) }, 'api');
  start(BIN, ['server/dev-api.ts'], { ...baseEnv, DEV_API_PORT: String(API_PORT_RL), AI_RATE_LIMIT_PER_MINUTE: '1', AI_MAX_REQUESTS_PER_DAY: '100' }, 'api-rl');
  start(BIN, ['server/dev-api.ts'], {
    ...baseEnv,
    DEV_API_PORT: String(API_PORT_AUTH),
    AI_REQUIRE_AUTH: 'true',
    FIREBASE_PROJECT_ID: '',
    FIREBASE_WEB_API_KEY: '',
  }, 'api-auth');

  const ok = await waitFor(`${API_BASE}/api/health`);
  const okRl = await waitFor(`${API_BASE_RL}/api/health`);
  const okAuth = await waitFor(`${API_BASE_AUTH}/api/health`);
  if (!ok || !okRl || !okAuth) {
    console.error('Servers failed to start.');
    process.exit(1);
  }

  // 1. Health
  const healthResponse = await fetch(`${API_BASE}/api/health`);
  const health = await healthResponse.json();
  check('health reports the provider as configured', health.configured === true, JSON.stringify(health));
  check(
    'health never exposes the API key',
    !JSON.stringify(health).includes('test-key-not-real') && !('apiKey' in health),
  );

  // 2. Non-streaming tutor
  const nonStream = await post(API_BASE, '/api/tutor', {
    mode: 'step-by-step',
    stream: false,
    messages: [{ role: 'user', content: 'Explain fractions' }],
    context: { grade: '8', curriculum: 'nepal-national', language: 'en', subjects: ['mathematics'], explanationStyle: 'simple', country: 'NP' },
  });
  const nonStreamJson = await nonStream.json();
  check('non-streaming tutor returns text', nonStream.status === 200 && typeof nonStreamJson.text === 'string' && nonStreamJson.text.length > 20);

  // 3. Streaming tutor (the path the UI uses)
  const streamResponse = await post(API_BASE, '/api/tutor', {
    mode: 'explain-simply',
    stream: true,
    messages: [{ role: 'user', content: 'What is a fraction?' }],
    context: { grade: '6', curriculum: 'nepal-national', language: 'en', subjects: ['mathematics'], explanationStyle: 'simple', country: 'NP' },
  });
  const streamText = await streamResponse.text();
  check('tutor streams SSE deltas', streamResponse.status === 200 && streamText.includes('event: delta'));
  check('tutor stream ends with a done event', streamText.includes('event: done'));
  check('streamed answer contains the tutor content', streamText.includes('fraction'));

  // 4. Validation
  const invalidMode = await post(API_BASE, '/api/tutor', {
    mode: 'invent-a-mode',
    messages: [{ role: 'user', content: 'hi' }],
  });
  check('invalid tutoring mode is rejected with 400', invalidMode.status === 400);

  const emptyMessages = await post(API_BASE, '/api/tutor', { messages: [] });
  check('empty conversation is rejected with 400', emptyMessages.status === 400);

  const assistantLast = await post(API_BASE, '/api/tutor', {
    mode: 'explain-simply',
    messages: [{ role: 'assistant', content: 'I am the assistant' }],
  });
  check('conversation must end with a student message', assistantLast.status === 400);

  // 5. Body size limit
  const oversized = await post(
    API_BASE,
    '/api/tutor',
    JSON.stringify({ mode: 'explain-simply', messages: [{ role: 'user', content: 'x'.repeat(20000) }] }),
  );
  check('oversized request is rejected with 413', oversized.status === 413);

  // 6. Quiz generation + structure validation + repair
  const quizResponse = await post(API_BASE, '/api/quiz', {
    subject: 'Mathematics',
    grade: '6',
    topic: 'Fractions',
    difficulty: 'easy',
    count: 3,
    questionTypes: ['mcq'],
    language: 'en',
  });
  const quizBody = await quizResponse.json();
  const quiz = quizBody.quiz;
  check(
    'quiz endpoint returns validated questions',
    quizResponse.status === 200 && Array.isArray(quiz?.questions) && quiz.questions.length === 3,
    JSON.stringify(quizBody).slice(0, 200),
  );
  check(
    'quiz questions include answers and explanations',
    Boolean(quiz?.questions?.every((question) => question.answer && question.explanation && question.options?.includes(question.answer))),
  );

  const badQuizRequest = await post(API_BASE, '/api/quiz', {
    subject: 'Mathematics',
    grade: '6',
    topic: 'Fractions',
    count: 99,
  });
  check('invalid quiz count is rejected', badQuizRequest.status === 400);

  // 7. Flashcards
  const flashcardResponse = await post(API_BASE, '/api/flashcards', {
    topic: 'Photosynthesis',
    grade: '8',
    count: 4,
  });
  const flashcardBody = await flashcardResponse.json();
  check(
    'flashcard endpoint returns cards',
    flashcardResponse.status === 200 && flashcardBody.flashcards?.cards?.length === 4,
  );

  // 8. Study tools
  const toolResponse = await post(API_BASE, '/api/tools', {
    tool: 'revision-summary',
    input: 'Photosynthesis for grade 8',
    grade: '8',
    language: 'en',
    stream: true,
  });
  const toolText = await toolResponse.text();
  check('study tool streams a response', toolResponse.status === 200 && toolText.includes('event: delta'));

  // 9. Provider failure is surfaced as a structured error
  const failure = await post(API_BASE, '/api/tutor', {
    mode: 'explain-simply',
    stream: false,
    messages: [{ role: 'user', content: 'TRIGGER_FAIL please' }],
  });
  const failureBody = await failure.json();
  check(
    'provider failure returns a safe structured error',
    failure.status >= 500 && failureBody.error?.code && !JSON.stringify(failureBody).includes('test-key'),
    JSON.stringify(failureBody),
  );

  // 10. Rate limiting (separate instance with 1 request/minute)
  const first = await post(API_BASE_RL, '/api/tutor', {
    mode: 'explain-simply',
    stream: false,
    messages: [{ role: 'user', content: 'hello' }],
  });
  await first.text();
  const second = await post(API_BASE_RL, '/api/tutor', {
    mode: 'explain-simply',
    stream: false,
    messages: [{ role: 'user', content: 'hello again' }],
  });
  const secondBody = await second.json();
  check(
    'rate limit returns 429 with Retry-After',
    second.status === 429 && secondBody.error?.code === 'rate_limited' && Boolean(second.headers.get('retry-after')),
    `${second.status} ${JSON.stringify(secondBody)}`,
  );

  // 11. Authentication required but unverifiable → fail closed
  const authResponse = await post(API_BASE_AUTH, '/api/tutor', {
    mode: 'explain-simply',
    stream: false,
    messages: [{ role: 'user', content: 'hello' }],
  });
  const authBody = await authResponse.json();
  check(
    'require-auth without token verification fails closed with 503',
    authResponse.status === 503 && authBody.error?.code === 'not_configured',
    `${authResponse.status} ${JSON.stringify(authBody)}`,
  );

  // 12. Unauthenticated request when auth is optional
  const optionalAuth = await post(API_BASE, '/api/tutor', {
    mode: 'quick-answer',
    stream: false,
    messages: [{ role: 'user', content: 'Quick: what is 2+2?' }],
  });
  check('unauthenticated use is allowed when auth is optional', optionalAuth.status === 200);
  await optionalAuth.text();

  // 13. Wrong HTTP method
  const getTutor = await fetch(`${API_BASE}/api/tutor`);
  check('GET /api/tutor is method-not-allowed', getTutor.status === 405);

  // 14. Cross-origin writes
  // A browser attaches Origin to every cross-site POST, so a request carrying
  // somebody else's origin must be refused before any work is done. A POST
  // from the site itself, and one with no Origin at all (server-to-server and
  // the suites), must still go through.
  const foreign = await post(
    API_BASE,
    '/api/tutor',
    { messages: [{ role: 'user', content: 'Hello' }] },
    { Origin: 'https://evil.example' },
  );
  check('a cross-origin POST to the tutor is refused', foreign.status === 403, String(foreign.status));
  const foreignBody = await foreign.json().catch(() => ({}));
  check('the refusal is a structured error, not a leak', foreignBody?.error?.code === 'cross_origin');

  const sameOrigin = await post(API_BASE, '/api/health', {}, { Origin: API_BASE });
  check('a same-origin POST is not blocked by the guard', sameOrigin.status !== 403, String(sameOrigin.status));
  await sameOrigin.text();

  const passed = results.filter((result) => result.passed).length;
  console.log(`\n${passed}/${results.length} smoke checks passed.\n`);

  if (passed !== results.length) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error('Smoke test failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    for (const child of children) {
      try {
        if (process.platform === 'win32') child.kill('SIGTERM');
        else process.kill(-child.pid, 'SIGTERM');
      } catch {
        /* already stopped */
      }
    }
    setTimeout(() => process.exit(process.exitCode ?? 0), 500);
  });

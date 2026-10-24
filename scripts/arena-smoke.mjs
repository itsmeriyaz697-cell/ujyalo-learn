/**
 * Global Quiz Arena — end-to-end proof against the Firestore emulator.
 *
 * This is the test that matters for this feature. It drives the real HTTP API
 * (not the service functions) and asserts the rules a leaderboard depends on:
 *
 *   - the answer key never reaches the client
 *   - scoring is computed by the server from the options actually chosen
 *   - a replayed submission awards nothing the second time
 *   - an impossibly fast submission is refused, not scored
 *   - a tampered answer map cannot invent correct answers
 *   - leaderboards only show players who have actually scored
 *   - a public profile exposes no email or account id
 *
 * Run with: npm run test:arena
 */
const API = process.env.ARENA_API_URL || 'http://127.0.0.1:8788/api/quiz-arena';

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

async function call(action, { method = 'GET', uid = null, body = null, query = '' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (uid) headers['x-arena-test-uid'] = uid;
  const url = `${API}?action=${action}${query}`;
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify({ action, ...body }) : undefined,
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: response.status, json };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const alice = `alice_${Date.now().toString(36)}`;
  const bob = `bob_${Date.now().toString(36)}`;

  // --- meta -------------------------------------------------------------
  const meta = await call('meta');
  check('meta is public and lists 15 categories', meta.status === 200 && meta.json.meta.categories.length === 15);
  check('meta reports the real question count', meta.json.meta.questionCount === 315, String(meta.json.meta.questionCount));

  // --- auth required ----------------------------------------------------
  const noAuth = await call('start', { method: 'POST', body: { category: 'mathematics', difficulty: 'easy', length: 5 } });
  check('starting a quiz without a token is refused', noAuth.status === 401, `got ${noAuth.status}`);

  // --- profile ----------------------------------------------------------
  const claim = await call('claim', { method: 'POST', uid: alice, body: { handle: alice.toUpperCase(), country: 'NP' } });
  check('a player can claim a username', claim.status === 200 && claim.json.player.handle.length > 0);

  const badHandle = await call('claim', { method: 'POST', uid: bob, body: { handle: 'x', country: 'NP' } });
  check('an invalid username is rejected', badHandle.status === 400, `got ${badHandle.status}`);

  const badCountry = await call('claim', { method: 'POST', uid: bob, body: { handle: 'bobby_01', country: 'ZZ' } });
  check('an unknown country is rejected', badCountry.status === 400, `got ${badCountry.status}`);

  const stolen = await call('claim', { method: 'POST', uid: bob, body: { handle: alice.toUpperCase(), country: 'IN' } });
  check('another player cannot take a claimed username', stolen.status === 409, `got ${stolen.status}`);

  // --- start ------------------------------------------------------------
  const started = await call('start', {
    method: 'POST',
    uid: alice,
    body: { category: 'mathematics', difficulty: 'medium', length: 5 },
  });
  check('a quiz can be started', started.status === 201 && Array.isArray(started.json.questions));
  const questions = started.json?.questions ?? [];
  check('the quiz contains the requested number of questions', questions.length === 5, String(questions.length));
  check(
    'no question ever carries its answer index',
    questions.every((q) => !('answerIndex' in q) && !('answer' in q) && !('explanation' in q)),
    JSON.stringify(Object.keys(questions[0] ?? {})),
  );
  check('each question has exactly four options', questions.every((q) => q.options.length === 4));
  check('question ids are unique within an attempt', new Set(questions.map((q) => q.id)).size === 5);

  // --- impossibly fast submission --------------------------------------
  const fast = await call('submit', {
    method: 'POST',
    uid: alice,
    body: { attemptId: started.json.attemptId, answers: Object.fromEntries(questions.map((q) => [q.id, 0])) },
  });
  check('a submission faster than reading time is refused', fast.status === 400 && fast.json?.error?.code === 'too_fast', `got ${fast.status} ${fast.json?.error?.code ?? ''}`);

  // --- scoring ----------------------------------------------------------
  const answers = Object.fromEntries(questions.map((q, i) => [q.id, i % 4]));
  await sleep(11_000); // length 5 × 2s minimum
  const submitted = await call('submit', {
    method: 'POST',
    uid: alice,
    body: { attemptId: started.json.attemptId, answers },
  });
  check('a normal submission is scored', submitted.status === 200 && typeof submitted.json.pointsThisAttempt === 'number');

  const scored = submitted.json;
  const correctFromServer = scored.answers.filter((a) => a.correct).length;
  check('the server says what is correct, per question', scored.answers.length === 5 && scored.answers.every((a) => typeof a.correctIndex === 'number'));
  check('the correct count matches the per-question verdicts', scored.correct === correctFromServer);
  check(
    'points equal the sum of the individual question awards',
    scored.answerPoints === scored.answers.reduce((sum, a) => sum + a.points, 0),
  );
  check(
    'every awarded point is one of the three published values',
    scored.answers.every((a) => a.points === 0 || [5, 10, 15].includes(a.points)),
  );
  check('a wrong answer earned nothing', scored.answers.every((a) => a.correct || a.points === 0));
  check('the completion bonus was paid', scored.completionBonus === 5);
  check('an explanation comes back with every question', scored.answers.every((a) => typeof a.explanation === 'string' && a.explanation.length > 3));
  check('the running total was returned', scored.totals.totalPoints === scored.pointsThisAttempt);

  // --- replay -----------------------------------------------------------
  const replay = await call('submit', {
    method: 'POST',
    uid: alice,
    body: { attemptId: started.json.attemptId, answers: Object.fromEntries(questions.map((q) => [q.id, 0])) },
  });
  check('replaying the same submission is marked duplicate', replay.status === 200 && replay.json.duplicate === true);
  check('the replayed submission returns the original score', replay.json.pointsThisAttempt === scored.pointsThisAttempt);
  check('the replayed submission awards nothing new', replay.json.totals.totalPoints === scored.totals.totalPoints);

  const dashboard = await call('me', { uid: alice });
  check('points were only counted once', dashboard.json.player.totalPoints === scored.totals.totalPoints, `${dashboard.json.player?.totalPoints}`);
  check('the quiz was only counted once', dashboard.json.player.quizzes === 1, String(dashboard.json.player?.quizzes));

  // --- tampering --------------------------------------------------------
  const second = await call('start', {
    method: 'POST',
    uid: alice,
    body: { category: 'physics', difficulty: 'easy', length: 5 },
  });
  await sleep(11_000);
  const tampered = await call('submit', {
    method: 'POST',
    uid: alice,
    body: {
      attemptId: second.json.attemptId,
      answers: { 'fake-question-id': 1, 'another/fake': 0 },
    },
  });
  check('answers for questions not in the attempt score nothing', tampered.status === 200 && tampered.json.answerPoints === 0);

  const forgeAttempt = await call('submit', { method: 'POST', uid: alice, body: { attemptId: 'not-a-real-attempt', answers: {} } });
  check('an unknown attempt id is refused', forgeAttempt.status === 404 || forgeAttempt.status === 400);

  // Someone else's attempt.
  const stranger = await call('submit', { method: 'POST', uid: bob, body: { attemptId: second.json.attemptId, answers: {} } });
  check("another player cannot submit someone else's attempt", stranger.status === 403 || stranger.status === 404, `got ${stranger.status}`);

  // --- second player, to prove ranking is real --------------------------
  await call('claim', { method: 'POST', uid: bob, body: { handle: `${bob}_x`, country: 'IN' } });
  const bobStart = await call('start', {
    method: 'POST',
    uid: bob,
    body: { category: 'astronomy', difficulty: 'hard', length: 5 },
  });
  await sleep(11_000);
  await call('submit', { method: 'POST', uid: bob, body: { attemptId: bobStart.json.attemptId, answers: {} } });

  const board = await call('leaderboard');
  check('the global leaderboard returns rows', board.status === 200 && Array.isArray(board.json.rows));
  check(
    'the leaderboard is ordered by points, highest first',
    board.json.rows.every((row, i, arr) => i === 0 || arr[i - 1].points >= row.points),
  );
  check('nobody with zero points is ranked', board.json.rows.every((row) => row.points > 0));

  const nepalBoard = await call('leaderboard', { query: '&scope=nepal' });
  check(
    'the Nepal board only contains Nepali players',
    nepalBoard.json.rows.every((row) => row.country === 'NP'),
    JSON.stringify(nepalBoard.json.rows.map((r) => r.country)),
  );
  check('the Nepal board contains the Nepali player', nepalBoard.json.rows.some((row) => row.handle.toLowerCase() === alice));

  const weekly = await call('leaderboard', { query: '&scope=weekly' });
  check('the weekly board is scoped to the current week', typeof weekly.json.weekKey === 'string' && weekly.json.weekKey.length >= 7);

  // --- profiles ---------------------------------------------------------
  const profile = await call('profile', { query: `&handle=${encodeURIComponent(alice)}` });
  const serialised = JSON.stringify(profile.json);
  check('a public profile can be read by handle', profile.status === 200 && profile.json.player.handle.toLowerCase() === alice);
  check('a public profile exposes no email', !/@/.test(serialised.replace(/uyjalo-learn/g, '')));
  check('a public profile exposes no account id', !('uid' in profile.json.player));
  check('a public profile reports a real global rank', typeof profile.json.globalRank === 'number' && profile.json.globalRank >= 1);

  const missing = await call('profile', { query: '&handle=nobody-here-9999' });
  check('an unknown handle returns a clean 404', missing.status === 404);

  // --- daily challenge --------------------------------------------------
  const daily = await call('start', { method: 'POST', uid: alice, body: { daily: true } });
  check('the daily challenge can be started', daily.status === 201 && daily.json.daily === true);
  check('the daily challenge is five questions', daily.json.length === 5);
  const dailyAgain = await call('start', { method: 'POST', uid: bob, body: { daily: true } });
  check(
    'every player gets the same daily questions',
    JSON.stringify(daily.json.questions.map((q) => q.id)) === JSON.stringify(dailyAgain.json.questions.map((q) => q.id)),
  );

  // --- rate limit -------------------------------------------------------
  // The limit is per account, so this must hammer one uid: 60 starts per hour.
  let rateLimited = false;
  for (let i = 0; i < 65; i += 1) {
    const response = await call('start', {
      method: 'POST',
      uid: alice,
      body: { category: 'general-knowledge', difficulty: 'easy', length: 5 },
    });
    if (response.status === 429) {
      rateLimited = true;
      break;
    }
  }
  check('a burst of quiz starts is rate limited', rateLimited);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) {
    console.log(`Failures:\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Arena smoke run crashed:', error);
  process.exit(1);
});

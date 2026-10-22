/**
 * Local mock of an OpenAI-compatible chat-completions provider.
 * Used ONLY for automated tests. It never runs in production.
 *
 *   node scripts/mock-provider.mjs [port]
 */
import http from 'node:http';

const PORT = Number(process.argv[2] ?? 9099);

const TUTOR_TEXT = `Great question! Let's break it down.

## The big idea

A **fraction** shows part of a whole. If you cut one momo into 4 equal pieces and eat 1, you ate $\\frac{1}{4}$.

## Try it yourself

1. What is $\\frac{1}{2} + \\frac{1}{4}$?
2. Which is larger: $\\frac{2}{3}$ or $\\frac{1}{2}$?

> AI-generated practice. Check with your textbook.`;

function quizJson(count) {
  const questions = Array.from({ length: count }, (_, index) => ({
    id: `q${index + 1}`,
    type: 'mcq',
    question: `Mock question ${index + 1}: what is ${index + 1} + 1?`,
    options: [String(index + 1), String(index + 2), String(index + 3), String(index + 4)],
    answer: String(index + 2),
    explanation: 'Add one to the number to get the next number.',
    difficulty: 'easy',
  }));
  return { title: 'Mock fractions quiz', topic: 'Fractions', questions };
}

function flashcardJson(count) {
  return {
    title: 'Mock flashcards',
    cards: Array.from({ length: count }, (_, index) => ({
      id: `c${index + 1}`,
      front: `Question ${index + 1}?`,
      back: `Answer ${index + 1}.`,
    })),
  };
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || !req.url?.includes('/chat/completions')) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: { message: 'Not found' } }));
    return;
  }

  const body = await readBody(req);
  const system = body.messages?.find((message) => message.role === 'system')?.content ?? '';
  const user = body.messages?.filter((message) => message.role === 'user').at(-1)?.content ?? '';
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ') || auth.length < 12) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: { message: 'Missing key' } }));
    return;
  }
  if (user.includes('TRIGGER_FAIL')) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: { message: 'Simulated provider failure' } }));
    return;
  }
  if (user.includes('TRIGGER_SLOW')) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  const isQuiz = system.includes('practice quizzes');
  const isFlashcards = system.includes('flashcards');

  let content = TUTOR_TEXT;
  if (isQuiz) {
    const match = user.match(/Exactly (\d+) questions/);
    content = JSON.stringify(quizJson(Number(match?.[1] ?? 5)));
  } else if (isFlashcards) {
    const match = user.match(/Exactly (\d+) cards/);
    content = JSON.stringify(flashcardJson(Number(match?.[1] ?? 8)));
  }

  if (!body.stream) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        id: 'mock',
        model: body.model,
        choices: [{ message: { role: 'assistant', content }, finish_reason: 'stop' }],
      }),
    );
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  const words = content.match(/.{1,18}/gs) ?? [content];
  for (const word of words) {
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: word } }] })}\n\n`);
    await new Promise((resolve) => setTimeout(resolve, 3));
  }
  res.write('data: [DONE]\n\n');
  res.end();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[mock-provider] listening on http://127.0.0.1:${PORT}/v1`);
});

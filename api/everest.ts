import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readEverestConfig } from './_lib/config.js';
import { guardAiRequest } from './_lib/guard.js';
import {
  BodyTooLargeError,
  InvalidBodyError,
  handleOptions,
  methodNotAllowed,
  rejectCrossOrigin,
  readJsonBody,
  sendError,
  sendJson,
} from './_lib/http.js';
import { ProviderError, completeChat } from './_lib/provider.js';

export const config = { maxDuration: 60 };

const EVEREST_SYSTEM_BASE = `You are Everest AI — a helpful, friendly, and highly capable AI assistant built by Ujyalo Learn and powered by Groq's ultra-fast inference.

Identity:
- Name: Everest AI ( Everest • एभरेस्ट )
- Creator: Ujyalo Learn — built for students in Nepal and learners worldwide
- Personality: Warm, encouraging, clear, and concise. Like a knowledgeable friend who happens to be an expert.
- You are named after Mount Everest (Sagarmatha), the world's highest peak in Nepal.

Capabilities:
- Answer questions, explain concepts, write & debug code, help with essays, brainstorm ideas, do maths step-by-step, translate Nepali ↔ English, and more.
- Use Markdown (headings, lists, tables, code blocks) and LaTeX maths ($...$, $$...$$) where helpful.
- Be honest about uncertainty — say "I'm not sure" rather than hallucinating.
- Never claim to be ChatGPT, Gemini, Claude, or any other model. You are Everest AI.

Guidelines:
- Mirror the user's language: English, Nepali (Devanagari), or Hinglish/nepali-romanized.
- For code: provide runnable examples, explain briefly, and mention edge cases.
- For maths: show steps, not just the answer, unless they ask for quick answer.
- For sensitive topics (medical, legal, financial): give general info and advise consulting a professional.
- Keep answers focused — avoid excessive verbosity unless asked.
- Never invent citations, textbook page numbers, or official exam marking schemes.
`;

const PERSONA_ADDITIONS: Record<string, string> = {
  default: '',
  tutor: `\n\n[PERSONA: Study Buddy]\nYou are now acting as a patient tutor for Grades 1-12 in Nepal. Adapt explanations to the student's grade. Use simple words, everyday Nepali examples, and end with a practice question. Encourage them.`,
  coder: `\n\n[PERSONA: Code Assistant]\nYou are now acting as an expert programmer. Provide clean code with comments, explain the approach, and suggest tests or improvements. Support Python, JS/TS, Java, C, HTML/CSS.`,
  writer: `\n\n[PERSONA: Writing Coach]\nYou are now acting as a writing coach. Help improve clarity, grammar, structure, and style while preserving the writer's voice. Give before/after when rewriting.`,
  researcher: `\n\n[PERSONA: Researcher]\nYou are now acting as a research analyst. Structure answers with headings, tables, and bullet points. Separate facts from opinions. Be thorough and balanced.`,
  creative: `\n\n[PERSONA: Creative]\nYou are now acting as a creative partner — imaginative, original, and inspiring. Help with stories, poems, slogans, and brainstorming. Be vivid but still helpful.`,
  nepali: `\n\n[PERSONA: Nepali Saathi]\nअबदेखि नेपाली (देवनागरी) मा जवाफ दिनुहोस्। सरल, स्कुले नेपाली प्रयोग गर्नुहोस्। प्राविधिक शब्दहरू आवश्यक परे अंग्रेजीमा (कोष्ठकमा) राख्नुहोस्। नेपालको सन्दर्भमा उदाहरण दिनुहोस्।`,
};

function buildSystemPrompt(persona?: string, customSystem?: string): string {
  let base = EVEREST_SYSTEM_BASE;
  if (customSystem?.trim()) {
    base += `\n\n[USER'S CUSTOM INSTRUCTIONS]\n${customSystem.trim().slice(0, 4000)}`;
  }
  const pid = (persona ?? 'default').toLowerCase();
  if (PERSONA_ADDITIONS[pid]) base += PERSONA_ADDITIONS[pid];
  return base;
}

function isValidModelId(model: string): boolean {
  return /^[a-z0-9/@._-]{3,80}$/i.test(model) && !model.includes('..');
}

/** Demo fallback when Groq is unreachable (sandbox or provider down). Streams a realistic answer locally. */
function mockEverestAnswer(prompt: string, persona?: string): string {
  const lower = prompt.toLowerCase();
  const p = (persona ?? 'default').toLowerCase();

  if (p === 'nepali' || /nepali|नेपाल|नमस्ते/.test(lower)) {
    return `नमस्ते! म **Everest AI** हुँ — तपाईंको नेपाली साथी 🏔️\n\nतपाईंले सोध्नुभयो: _“${prompt.slice(0, 120)}”_\n\n## जवाफ (उदाहरण मोड — Groq demo)\n\nयो उत्तर **demo मोड** मा देखाइएको हो किनकि Groq API अहिले स्थानीय नेटवर्कमा उपलब्ध छैन (sandbox सीमितता)।\n\n### मुख्य कुरा\n- **Everest AI** Groq को ultra-fast inference (500–1000 tok/s) मा चल्छ — ChatGPT / Gemini जस्तै streaming, code, र LaTeX समर्थन।\n- **वास्तविक deployment** मा (Vercel + Groq API key) यही प्रश्नले पूर्ण, live उत्तर दिन्छ।\n\n### तपाईंले के गर्न सक्नुहुन्छ\n- \`openai/gpt-oss-120b\` (Pro) वा \`20b\` (Flash) मा स्विच गर्नुहोस्\n- English, Nepali, Hinglish मा जुनसुकै भाषा प्रयोग गर्नुहोस्\n- कोड, गणित, निबन्ध, अनुवाद सबै सोध्नुहोस्\n\n> **Note:** यो demo उत्तर हो। Groq API key मिलाएपछि (Vercel env मा \`EVEREST_API_KEY=gsk_...\` राखेपछि) वास्तविक AI ले जवाफ दिन्छ।`;
  }

  if (p === 'coder' || /code|python|javascript|function|debug|error|api/.test(lower)) {
    return `Got it — **Everest Code** here 💻 (demo mode — Groq unreachable locally)\n\nYou asked: _“${prompt.slice(0, 140)}”_\n\n## Example answer (what Groq will return live)\n\nEverest runs on **Groq LPU** at 500–1000 tok/s with streaming, so code appears word-by-word like ChatGPT.\n\n### Quick example — Python\n\n\`\`\`python\ndef is_prime(n: int) -> bool:\n    \"\"\"Return True if n is prime.\"\"\"\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True\n\n# Test: primes up to 20 → [2, 3, 5, 7, 11, 13, 17, 19]\nprint([x for x in range(20) if is_prime(x)])\n\`\`\`\n\n### How I explain (persona: Coder)\n- **What it does** — checks divisibility up to √n\n- **Edge cases** — n < 2, even numbers\n- **Next** — try \`O(√n)\` vs sieve for large ranges\n\n> **Live mode:** On Vercel with your Groq key (\`gsk_...\`), this same prompt streams a full tailored solution in ~0.8s. This demo shows layout only — networking to \`api.groq.com\` is blocked in this sandbox.`;
  }

  if (lower.includes('homework') || lower.includes('solve') || lower.includes('mathe') || lower.includes('explain')) {
    return `Great question! **Everest Study Buddy** here 📚 (demo — Groq offline in sandbox)\n\n> _“${prompt.slice(0, 140)}”_\n\n## Why this is demo only\n\nLocal sandbox blocks \`-api.groq.com\` egress. On Vercel, Everest streams answers at **500–1000 tokens/sec** via:\n\n- **\`openai/gpt-oss-120b\`** — flagship, best reasoning, 131k context\n- **\`openai/gpt-oss-20b\`** — fastest, 1000 tok/s\n\n## Example live answer (simulated)\n\n### The big idea\nEverest shows steps, not just the result — like a patient tutor.\n\n### Worked example\n\n**Q:** Train travels $240\\\\,\\\\text{km}$ in $3\\\\,\\\\text{h}$. Average speed?\n\n$$\n\\\\text{speed} = \\\\frac{\\\\text{distance}}{\\\\text{time}} = \\\\frac{240}{3} = 80\\\\,\\\\text{km/h}\n$$\n\n**Check:** $80 \\\\times 3 = 240$ ✓\n\n### Try yourself\nWhat if it travelled 360 km in 4.5 h?\n\n> When deployed with \`EVEREST_API_KEY=gsk_YOUR_GROQ_API_KEY_HERE\`, this exact flow streams live from Groq.`;
  }

  // Default
  return `Hello! I'm **Everest AI** 🏔️ — your Groq-powered assistant (demo mode)\n\nYou said: _“${prompt.slice(0, 160)}”_\n\n## What you're seeing\nThis is a **local demo answer** because this sandbox blocks outbound traffic to \`api.groq.com\` (only GitHub/npm/pypi allowed). On real Vercel, Everest streams live:\n\n### Everest vs ChatGPT / Gemini\n| Feature | ChatGPT | Gemini | **Everest (Groq)** |\n|---|---|---|---|\n| Streaming | ✓ | ✓ | **✓ 500–1000 tok/s** |\n| Code & LaTeX | ✓ | ✓ | **✓** |\n| History + search | ✓ | ✓ | **✓** |\n| Voice input | — | ✓ | **✓ (Web Speech)** |\n| Nepali | basic | basic | **✓ Native (ने + romanized)** |\n| Models | 1–3 | 2–3 | **4 Groq models** |\n\n### Next steps\n1. Deploy to Vercel → set **Environment Variable**: \`EVEREST_API_KEY=gsk_YOUR_GROQ_API_KEY_HERE\` + \`EVEREST_API_BASE_URL=https://api.groq.com/openai/v1\` + \`EVEREST_MODEL=openai/gpt-oss-120b\`\n2. Or keep using **\`AI_API_KEY\`** — Everest falls back to it automatically.\n3. Ask anything — code, maths, essays, translation, brainstorming.\n\n> **Tip:** On this demo, try switching **Pro ↔ Flash**, personas, and custom instructions — they all work; only the *generation* is mocked until Groq is reachable.`;
}

async function streamMock(res: VercelResponse, prompt: string, persona: string | undefined, model: string) {
  const content = mockEverestAnswer(prompt, persona);
  const writeEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  // Stream word-by-word like Groq does
  const chunks = content.match(/.{1,22}/gs) ?? [content];
  for (const chunk of chunks) {
    writeEvent('delta', { delta: chunk });
    await new Promise((r) => setTimeout(r, 12));
  }
  writeEvent('notice', { notice: 'Demo mode — Groq unreachable in this sandbox. On Vercel with your API key, answers stream live at 500-1000 tok/s.' });
  writeEvent('done', { done: true, model, provider: 'everest-mock' });
  res.end();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (rejectCrossOrigin(req, res)) return;

  const aiConfig = readEverestConfig();
  const guard = await guardAiRequest(req, res, aiConfig);
  if (!guard) return;

  let body: unknown;
  try {
    body = await readJsonBody(req, aiConfig.limits.maxBodyKb);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return sendError(res, 413, 'payload_too_large', 'That request is too large. Please shorten it.');
    }
    if (error instanceof InvalidBodyError) {
      return sendError(res, 400, 'invalid_request', 'Request body must be valid JSON.');
    }
    throw error;
  }

  const raw = body as Record<string, unknown>;
  const messages = raw.messages as Array<{ role: string; content: string }> | undefined;
  const modelRaw = typeof raw.model === 'string' ? raw.model.trim() : '';
  const persona = typeof raw.persona === 'string' ? raw.persona.trim().slice(0, 24) : undefined;
  const customSystem = typeof raw.systemPrompt === 'string' ? raw.systemPrompt : undefined;
  const stream = raw.stream !== false;
  const temperature = typeof raw.temperature === 'number' ? raw.temperature : undefined;
  const maxTokens = typeof raw.maxTokens === 'number' ? raw.maxTokens : undefined;

  if (!Array.isArray(messages) || messages.length === 0) {
    return sendError(res, 400, 'invalid_request', 'messages must be a non-empty array.');
  }
  if (messages.length > 30) {
    return sendError(res, 400, 'invalid_request', 'Too many messages — max 30.');
  }
  for (const m of messages) {
    if (!m || typeof m.content !== 'string' || !m.content.trim()) {
      return sendError(res, 400, 'invalid_request', 'Each message needs non-empty content.');
    }
    if (m.content.length > 8000) {
      return sendError(res, 400, 'invalid_request', 'A message is too long (max 8000 chars).');
    }
    if (!['user', 'assistant', 'system'].includes(m.role)) {
      return sendError(res, 400, 'invalid_request', 'Message role must be user, assistant or system.');
    }
  }

  const last = messages[messages.length - 1];
  if (last.role !== 'user') {
    return sendError(res, 400, 'invalid_request', 'The last message must be from the user.');
  }

  let model = aiConfig.model;
  if (modelRaw) {
    if (!isValidModelId(modelRaw)) {
      return sendError(res, 400, 'invalid_request', 'Invalid model id.');
    }
    model = modelRaw;
  }

  const hasSystem = messages.some((m) => m.role === 'system');
  const systemContent = buildSystemPrompt(persona, customSystem);
  const providerMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  if (!hasSystem) {
    providerMessages.push({ role: 'system', content: systemContent });
  }

  for (const m of messages) {
    if (m.role === 'system') {
      providerMessages.push({ role: 'system', content: `${systemContent}\n\n[CONVERSATION SYSTEM]\n${m.content}` });
    } else {
      providerMessages.push({ role: m.role as 'user' | 'assistant', content: m.content });
    }
  }

  const systemMsgs = providerMessages.filter((m) => m.role === 'system');
  const chatHistory = providerMessages.filter((m) => m.role !== 'system').slice(-16);
  const finalMessages = [...systemMsgs, ...chatHistory];

  const requestConfig = { ...aiConfig, model };

  const safeTemp = typeof temperature === 'number' ? Math.min(2, Math.max(0, temperature)) : undefined;
  const safeMaxTokens = typeof maxTokens === 'number' ? Math.min(8192, Math.max(128, Math.floor(maxTokens))) : undefined;

  if (!stream) {
    try {
      const result = await completeChat(requestConfig, {
        messages: finalMessages,
        stream: false,
        temperature: safeTemp,
        maxTokens: safeMaxTokens,
      });
      return sendJson(res, 200, {
        text: result.text,
        model,
        truncated: result.truncated,
        notice: result.truncated ? 'The answer reached the length limit and was cut off.' : undefined,
      });
    } catch (error) {
      // Fallback to mock when provider unreachable (sandbox or outage)
      const code = (error as ProviderError)?.code;
      if (code === 'provider_unavailable' || code === 'timeout' || code === 'upstream_error') {
        const mockText = mockEverestAnswer(last.content, persona);
        return sendJson(res, 200, {
          text: mockText,
          model,
          truncated: false,
          notice: 'Demo mode — live Groq response unavailable; showing mock answer. On Vercel it streams live.',
        });
      }
      return sendProviderError(res, error);
    }
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const writeEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { streamChat: doStream } = await import('./_lib/provider.js');
    await doStream(
      requestConfig,
      { messages: finalMessages, temperature: safeTemp, maxTokens: safeMaxTokens },
      {
        onDelta: (text) => writeEvent('delta', { delta: text }),
        onDone: ({ truncated }) => {
          if (truncated) {
            writeEvent('notice', { notice: 'The answer reached the length limit. Ask a follow-up for the rest.' });
          }
          writeEvent('done', { done: true, model, provider: requestConfig.providerName });
          res.end();
        },
      },
    );
  } catch (error) {
    const code = (error as ProviderError)?.code;
    if (code === 'provider_unavailable' || code === 'timeout' || code === 'upstream_error') {
      // Mock streaming fallback — keeps demo usable in sandbox
      await streamMock(res, last.content, persona, model);
      return;
    }
    const { code: errCode, message } = describeProviderError(error);
    writeEvent('error', { error: { code: errCode, message } });
    res.end();
  }
}

function describeProviderError(error: unknown): { code: string; message: string } {
  if (error instanceof ProviderError) {
    switch (error.code) {
      case 'provider_auth_error':
        return { code: 'provider_auth_error', message: 'The AI provider rejected the configured API key.' };
      case 'provider_rate_limited':
        return { code: 'rate_limited', message: 'The AI provider’s rate limit was reached. Please try again shortly.' };
      case 'timeout':
        return { code: 'timeout', message: 'The AI provider took too long to respond.' };
      case 'provider_unavailable':
        return { code: 'provider_unavailable', message: 'The AI provider is temporarily unavailable.' };
      default:
        return { code: 'upstream_error', message: 'The AI provider returned an error.' };
    }
  }
  return { code: 'upstream_error', message: 'The AI service failed unexpectedly.' };
}

function sendProviderError(res: VercelResponse, error: unknown) {
  const { code, message } = describeProviderError(error);
  const status = code === 'timeout' ? 504 : code === 'rate_limited' ? 429 : code === 'provider_auth_error' ? 502 : 502;
  return sendError(res, status, code, message);
}

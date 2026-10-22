import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readAiConfig } from './_lib/config.js';
import { guardAiRequest } from './_lib/guard.js';
import {
  BodyTooLargeError,
  InvalidBodyError,
  handleOptions,
  methodNotAllowed,
  readJsonBody,
  sendError,
  sendJson,
} from './_lib/http.js';
import { ProviderError, streamChat, completeChat } from './_lib/provider.js';
import { buildTutorSystemPrompt } from './_lib/prompts.js';
import { formatZodError, tutorRequestSchema } from '../shared/schemas.js';

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const aiConfig = readAiConfig();
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

  const parsed = tutorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return sendError(res, 400, 'invalid_request', formatZodError(parsed.error));
  }
  const request = parsed.data;
  const lastMessage = request.messages[request.messages.length - 1];
  if (lastMessage.role !== 'user') {
    return sendError(res, 400, 'invalid_request', 'The last message must come from the student.');
  }

  const systemPrompt = buildTutorSystemPrompt(request.mode, {
    grade: request.context.grade,
    curriculum: request.context.curriculum,
    language: request.context.language,
    subjects: request.context.subjects,
    explanationStyle: request.context.explanationStyle,
    country: request.context.country,
    studentName: request.context.studentName,
    subjectId: request.subjectId,
  });

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...request.messages.slice(-16).map((m) => ({ role: m.role, content: m.content })),
  ];

  const wantsStream = request.stream !== false;

  if (!wantsStream) {
    try {
      const result = await completeChat(aiConfig, { messages, stream: false });
      return sendJson(res, 200, {
        text: result.text,
        notice: result.truncated ? 'The answer reached the length limit and was cut off.' : undefined,
      });
    } catch (error) {
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
    await streamChat(aiConfig, { messages }, {
      onDelta: (text) => writeEvent('delta', { delta: text }),
      onDone: ({ truncated }) => {
        if (truncated) {
          writeEvent('notice', {
            notice: 'The answer reached the length limit. Ask a follow-up if you need the rest.',
          });
        }
        writeEvent('done', { done: true, provider: aiConfig.providerName });
        res.end();
      },
    });
  } catch (error) {
    const { code, message } = describeProviderError(error);
    // If headers are already sent, only an SSE error event can reach the client.
    writeEvent('error', { error: { code, message } });
    res.end();
  }
}

export function describeProviderError(error: unknown): { code: string; message: string } {
  if (error instanceof ProviderError) {
    switch (error.code) {
      case 'provider_auth_error':
        return {
          code: 'provider_auth_error',
          message: 'The AI provider rejected the configured API key.',
        };
      case 'provider_rate_limited':
        return {
          code: 'rate_limited',
          message: 'The AI provider’s rate limit was reached. Please try again shortly.',
        };
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

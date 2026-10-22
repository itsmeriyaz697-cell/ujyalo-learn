import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readAiConfig } from './_lib/config';
import { guardAiRequest } from './_lib/guard';
import {
  BodyTooLargeError,
  InvalidBodyError,
  handleOptions,
  methodNotAllowed,
  readJsonBody,
  sendError,
} from './_lib/http';
import { streamChat } from './_lib/provider';
import { buildToolSystemPrompt } from './_lib/prompts';
import { describeProviderError } from './tutor';
import { formatZodError, studyToolRequestSchema } from '../shared/schemas';

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

  const parsed = studyToolRequestSchema.safeParse(body);
  if (!parsed.success) return sendError(res, 400, 'invalid_request', formatZodError(parsed.error));

  const { tool, input, subject, grade, language } = parsed.data;
  const messages = [
    { role: 'system' as const, content: buildToolSystemPrompt(tool, grade, language) },
    {
      role: 'user' as const,
      content: subject ? `Subject: ${subject}\n\n${input}` : input,
    },
  ];

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
          writeEvent('notice', { notice: 'The answer reached the length limit and was cut off.' });
        }
        writeEvent('done', { done: true });
        res.end();
      },
    });
  } catch (error) {
    const described = describeProviderError(error);
    writeEvent('error', { error: described });
    res.end();
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readAiConfig } from './_lib/config.js';
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
import { buildQuizUserPrompt } from './_lib/prompts.js';
import { describeProviderError } from './tutor.js';
import { extractJsonObject, formatZodError, quizRequestSchema, validateGeneratedQuiz } from '../shared/schemas.js';

export const config = { maxDuration: 60 };

const QUIZ_SYSTEM = `You write practice quizzes for school students inside Ujyalo Learn.
You must reply with ONLY valid JSON — no Markdown fences, no explanation before or after.
Questions must be original, accurate and appropriate for the stated grade level.
Never claim a question is from an official examination, past paper, or textbook.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (rejectCrossOrigin(req, res)) return;

  const aiConfig = readAiConfig();
  const guard = await guardAiRequest(req, res, aiConfig);
  if (!guard) return;

  let body: unknown;
  try {
    body = await readJsonBody(req, aiConfig.limits.maxBodyKb);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return sendError(res, 413, 'payload_too_large', 'That request is too large.');
    }
    if (error instanceof InvalidBodyError) {
      return sendError(res, 400, 'invalid_request', 'Request body must be valid JSON.');
    }
    throw error;
  }

  const parsed = quizRequestSchema.safeParse(body);
  if (!parsed.success) return sendError(res, 400, 'invalid_request', formatZodError(parsed.error));

  const request = parsed.data;
  const messages = [
    { role: 'system' as const, content: QUIZ_SYSTEM },
    { role: 'user' as const, content: buildQuizUserPrompt(request) },
  ];

  try {
    const result = await completeChat(aiConfig, {
      messages,
      stream: false,
      json: true,
      temperature: 0.5,
      maxTokens: Math.min(aiConfig.maxOutputTokens * 2, 4000),
    });

    let quiz;
    try {
      quiz = validateGeneratedQuiz(extractJsonObject(result.text), request.count);
    } catch (error) {
      return sendError(
        res,
        502,
        'malformed_response',
        `The AI returned an unusable quiz (${(error as Error).message}). Please generate it again.`,
      );
    }

    return sendJson(res, 200, { quiz });
  } catch (error) {
    if (error instanceof ProviderError) {
      const { code, message } = describeProviderError(error);
      return sendError(res, code === 'timeout' ? 504 : 502, code, message);
    }
    return sendError(res, 502, 'upstream_error', 'The quiz could not be generated. Please try again.');
  }
}

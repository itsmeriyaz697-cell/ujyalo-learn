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
  sendJson,
} from './_lib/http';
import { ProviderError, completeChat } from './_lib/provider';
import { buildFlashcardPrompt } from './_lib/prompts';
import { describeProviderError } from './tutor';
import {
  extractJsonObject,
  flashcardRequestSchema,
  formatZodError,
  generatedFlashcardsSchema,
} from '../shared/schemas';

export const config = { maxDuration: 60 };

const SYSTEM = `You create concise study flashcards for school students inside Ujyalo Learn.
Reply with ONLY valid JSON — no Markdown fences and no commentary.
Each card tests exactly one idea and must be answerable from the deck topic alone.`;

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
    if (error instanceof BodyTooLargeError) return sendError(res, 413, 'payload_too_large', 'That request is too large.');
    if (error instanceof InvalidBodyError) return sendError(res, 400, 'invalid_request', 'Request body must be valid JSON.');
    throw error;
  }

  const parsed = flashcardRequestSchema.safeParse(body);
  if (!parsed.success) return sendError(res, 400, 'invalid_request', formatZodError(parsed.error));

  try {
    const result = await completeChat(aiConfig, {
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: buildFlashcardPrompt(parsed.data) },
      ],
      stream: false,
      json: true,
      temperature: 0.4,
      maxTokens: Math.min(aiConfig.maxOutputTokens * 2, 3500),
    });

    try {
      const flashcards = generatedFlashcardsSchema.parse(extractJsonObject(result.text));
      return sendJson(res, 200, { flashcards });
    } catch (error) {
      return sendError(
        res,
        502,
        'malformed_response',
        `The AI returned unusable flashcards (${(error as Error).message}). Please try again.`,
      );
    }
  } catch (error) {
    if (error instanceof ProviderError) {
      const { code, message } = describeProviderError(error);
      return sendError(res, code === 'timeout' ? 504 : 502, code, message);
    }
    return sendError(res, 502, 'upstream_error', 'Flashcards could not be generated. Please try again.');
  }
}

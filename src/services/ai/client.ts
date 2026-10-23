import type { GeneratedFlashcards, GeneratedQuiz, QuizRequest, FlashcardRequest } from '@shared/schemas';
import {
  extractJsonObject,
  generatedFlashcardsSchema,
  validateGeneratedQuiz,
} from '@shared/schemas';
import { friendlyApiError } from '@/lib/errors';
import { interpretSseEvent, parseSseBuffer } from './parser';
import type {
  AiErrorShape,
  AiHealth,
  IdTokenProvider,
  SendTutorOptions,
  ToolGenerationOptions,
  TutorResult,
} from './types';

/**
 * Browser-side AI client. It never knows the provider API key: all model
 * calls go through the serverless `/api/*` endpoints.
 */

export class AiRequestError extends Error {
  code: string;
  status?: number;
  constructor(shape: AiErrorShape) {
    super(friendlyApiError(shape.code, shape.message));
    this.name = 'AiRequestError';
    this.code = shape.code;
    this.status = shape.status;
  }
}

let tokenProvider: IdTokenProvider | null = null;

/** Registered by AuthProvider when authentication is available. */
export function registerTokenProvider(provider: IdTokenProvider | null) {
  tokenProvider = provider;
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = await tokenProvider?.getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // Continue unauthenticated; the server decides whether auth is required.
  }
  return headers;
}

async function toError(response: Response): Promise<AiRequestError> {
  let code = 'upstream_error';
  let message = '';
  try {
    const body = (await response.json()) as { error?: { code?: string; message?: string } };
    code = body?.error?.code ?? code;
    message = body?.error?.message ?? '';
  } catch {
    // Non-JSON error body — use status-based message.
  }
  if (code === 'upstream_error' && response.status === 413) code = 'payload_too_large';
  if (code === 'upstream_error' && response.status === 429) code = 'rate_limited';
  if (code === 'upstream_error' && response.status === 401) code = 'unauthorized';
  if (code === 'upstream_error' && response.status === 503) code = 'provider_unavailable';
  if (code === 'upstream_error' && response.status === 504) code = 'timeout';
  return new AiRequestError({ code, message, status: response.status });
}

export async function checkAiHealth(): Promise<AiHealth> {
  try {
    const response = await fetch('/api/health', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('health check failed');
    const data = (await response.json()) as Omit<AiHealth, 'checkedAt'>;
    return { ...data, checkedAt: Date.now() };
  } catch {
    return { configured: false, checkedAt: Date.now() };
  }
}

/**
 * Sends a tutoring request and streams tokens as they arrive.
 * Falls back to a buffered JSON response if the server/proxy cannot stream.
 */
export async function sendTutorMessage(options: SendTutorOptions): Promise<TutorResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new AiRequestError({ code: 'network', message: 'Offline' });
  }

  let response: Response;
  try {
    response = await fetch('/api/tutor', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        mode: options.mode,
        messages: options.messages,
        context: options.context,
        subjectId: options.subjectId ?? undefined,
        stream: true,
      }),
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new AiRequestError({ code: 'network', message: 'Network request failed' });
  }

  if (!response.ok) throw await toError(response);

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('text/event-stream') && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    let notice: string | undefined;
    const authWarning = false;

    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSseBuffer(buffer);
        buffer = parsed.rest;
        for (const raw of parsed.events) {
          const event = interpretSseEvent(raw);
          if (!event) continue;
          if (event.type === 'delta') {
            text += event.text;
            options.onDelta(event.text);
          } else if (event.type === 'notice') {
            notice = event.text;
            options.onNotice?.(event.text);
          } else if (event.type === 'error') {
            throw new AiRequestError({ code: event.code, message: event.message ?? '' });
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    if (!text.trim()) throw new AiRequestError({ code: 'upstream_error', message: 'Empty response' });
    return { text, notice, authWarning };
  }

  // Non-streaming fallback.
  const data = (await response.json()) as { text?: string; notice?: string; authWarning?: boolean };
  if (!data.text) throw new AiRequestError({ code: 'upstream_error', message: 'Empty response' });
  options.onDelta(data.text);
  return { text: data.text, notice: data.notice, authWarning: data.authWarning };
}

/** Streams a structured study-tool result (revision summary, formula help, etc.). */
export async function runStudyTool(options: ToolGenerationOptions): Promise<{ text: string }> {
  let response: Response;
  try {
    response = await fetch('/api/tools', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        tool: options.tool,
        input: options.input,
        subject: options.subject,
        grade: options.grade,
        language: options.language,
        stream: true,
      }),
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new AiRequestError({ code: 'network', message: 'Network request failed' });
  }
  if (!response.ok) throw await toError(response);

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/event-stream') && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parsed = parseSseBuffer(buffer);
      buffer = parsed.rest;
      for (const raw of parsed.events) {
        const event = interpretSseEvent(raw);
        if (!event) continue;
        if (event.type === 'delta') {
          text += event.text;
          options.onDelta(event.text);
        } else if (event.type === 'error') {
          throw new AiRequestError({ code: event.code, message: event.message ?? '' });
        }
      }
    }
    if (!text.trim()) throw new AiRequestError({ code: 'upstream_error', message: 'Empty response' });
    return { text };
  }

  const data = (await response.json()) as { text?: string };
  if (!data.text) throw new AiRequestError({ code: 'upstream_error', message: 'Empty response' });
  options.onDelta(data.text);
  return { text: data.text };
}

export async function generateQuizViaApi(
  request: QuizRequest,
  signal?: AbortSignal,
): Promise<GeneratedQuiz> {
  let response: Response;
  try {
    response = await fetch('/api/quiz', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new AiRequestError({ code: 'network', message: 'Network request failed' });
  }
  if (!response.ok) throw await toError(response);
  const data = (await response.json()) as { quiz?: unknown; raw?: string };
  try {
    const candidate = data.quiz ?? extractJsonObject(data.raw ?? '');
    return validateGeneratedQuiz(candidate, request.count);
  } catch (error) {
    throw new AiRequestError({
      code: 'malformed_response',
      message: (error as Error).message,
    });
  }
}

export async function generateFlashcardsViaApi(
  request: FlashcardRequest,
  signal?: AbortSignal,
): Promise<GeneratedFlashcards> {
  let response: Response;
  try {
    response = await fetch('/api/flashcards', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new AiRequestError({ code: 'network', message: 'Network request failed' });
  }
  if (!response.ok) throw await toError(response);
  const data = (await response.json()) as { flashcards?: unknown; raw?: string };
  try {
    const candidate = data.flashcards ?? extractJsonObject(data.raw ?? '');
    return generatedFlashcardsSchema.parse(candidate);
  } catch (error) {
    throw new AiRequestError({ code: 'malformed_response', message: (error as Error).message });
  }
}

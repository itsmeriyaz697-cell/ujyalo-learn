import { friendlyApiError } from '@/lib/errors';
import { interpretSseEvent, parseSseBuffer } from './parser';

export class EverestError extends Error {
  code: string;
  status?: number;
  constructor(shape: { code: string; message: string; status?: number }) {
    super(friendlyApiError(shape.code, shape.message));
    this.name = 'EverestError';
    this.code = shape.code;
    this.status = shape.status;
  }
}

let tokenProvider: { getIdToken(): Promise<string | null> } | null = null;

export function registerEverestTokenProvider(provider: { getIdToken(): Promise<string | null> } | null) {
  tokenProvider = provider;
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = await tokenProvider?.getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {/* continue unauthenticated */}
  return headers;
}

async function toError(response: Response): Promise<EverestError> {
  let code = 'upstream_error';
  let message = '';
  try {
    const body = (await response.json()) as { error?: { code?: string; message?: string } };
    code = body?.error?.code ?? code;
    message = body?.error?.message ?? '';
  } catch {/* ignore */}
  if (code === 'upstream_error' && response.status === 413) code = 'payload_too_large';
  if (code === 'upstream_error' && response.status === 429) code = 'rate_limited';
  if (code === 'upstream_error' && response.status === 401) code = 'unauthorized';
  if (code === 'upstream_error' && response.status === 503) code = 'provider_unavailable';
  if (code === 'upstream_error' && response.status === 504) code = 'timeout';
  return new EverestError({ code, message, status: response.status });
}

export interface EverestHealth {
  configured: boolean;
  provider?: string;
  model?: string;
  models: Array<{ id: string; name: string; badge?: string }>;
  personas: string[];
  limits: { perMinute: number; perDay: number };
}

export async function checkEverestHealth(): Promise<EverestHealth | null> {
  try {
    const res = await fetch('/api/everest-health', { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return (await res.json()) as EverestHealth;
  } catch {
    return null;
  }
}

export interface EverestSendOptions {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model?: string;
  persona?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
  onNotice?: (text: string) => void;
}

export interface EverestResult {
  text: string;
  model?: string;
  notice?: string;
}

export async function sendEverestMessage(options: EverestSendOptions): Promise<EverestResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new EverestError({ code: 'network', message: 'Offline' });
  }

  let response: Response;
  try {
    response = await fetch('/api/everest', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        messages: options.messages,
        model: options.model,
        persona: options.persona,
        systemPrompt: options.systemPrompt,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        stream: options.stream !== false,
      }),
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new EverestError({ code: 'network', message: 'Network request failed' });
  }

  if (!response.ok) throw await toError(response);

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('text/event-stream') && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    let notice: string | undefined;
    let model: string | undefined;

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
          } else if (event.type === 'done') {
            model = (event as { provider?: string }).provider;
          } else if (event.type === 'error') {
            throw new EverestError({ code: event.code, message: event.message ?? '' });
          }
        }
      }
    } finally {
      try { reader.releaseLock(); } catch {/* ignore */}
    }
    if (!text.trim()) throw new EverestError({ code: 'upstream_error', message: 'Empty response' });
    return { text, notice, model };
  }

  // Non-streaming JSON fallback
  const data = (await response.json()) as { text?: string; notice?: string; model?: string };
  if (!data.text) throw new EverestError({ code: 'upstream_error', message: 'Empty response' });
  options.onDelta(data.text);
  return { text: data.text, notice: data.notice, model: data.model };
}

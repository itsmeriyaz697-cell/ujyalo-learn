import type { AiRuntimeConfig } from './config';

/**
 * OpenAI-compatible chat-completions adapter.
 *
 * Any provider that implements the `/chat/completions` contract works:
 * OpenAI, Groq, OpenRouter, Together, Mistral, DeepSeek, and Gemini's
 * OpenAI-compatibility endpoint. Swapping providers is configuration only.
 */

export type ProviderErrorCode =
  | 'provider_auth_error'
  | 'provider_rate_limited'
  | 'provider_unavailable'
  | 'timeout'
  | 'upstream_error'
  | 'not_configured';

export class ProviderError extends Error {
  code: ProviderErrorCode;
  status: number;
  constructor(code: ProviderErrorCode, status = 502, message = '') {
    super(message || code);
    this.code = code;
    this.status = status;
  }
}

export interface ChatMessageInput {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderRequest {
  messages: ChatMessageInput[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  /** Ask the provider for JSON output where supported. */
  json?: boolean;
  signal?: AbortSignal;
}

function mapStatus(status: number): ProviderErrorCode {
  if (status === 401 || status === 403) return 'provider_auth_error';
  if (status === 429) return 'provider_rate_limited';
  if (status === 404) return 'upstream_error';
  if (status >= 500) return 'provider_unavailable';
  return 'upstream_error';
}

function providerUrl(config: AiRuntimeConfig): string {
  const base = config.baseUrl.replace(/\/$/, '');
  // Never allow callers to supply a path; only this fixed endpoint is used.
  return `${base}/chat/completions`;
}

async function providerFetch(config: AiRuntimeConfig, body: object, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const response = await fetch(providerUrl(config), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new ProviderError('timeout', 504, 'Provider request timed out.');
    }
    throw new ProviderError('provider_unavailable', 503, 'Could not reach the AI provider.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/**
 * Reasoning-style models (OpenAI o-series / gpt-5, and open-weight gpt-oss
 * models on Groq) reject `max_tokens` and some of them reject `temperature`.
 */
function isReasoningModel(model: string): boolean {
  return /^(o1|o3|o4|gpt-5)|gpt-oss/i.test(model.trim());
}

function buildBody(config: AiRuntimeConfig, request: ProviderRequest, compat = false) {
  const reasoning = isReasoningModel(config.model);
  const body: Record<string, unknown> = {
    model: config.model,
    messages: request.messages,
    stream: Boolean(request.stream),
  };

  // `max_completion_tokens` is accepted by both current OpenAI models and the
  // OpenAI-compatible gateways that implement gpt-oss.
  if (reasoning || compat) body.max_completion_tokens = request.maxTokens ?? config.maxOutputTokens;
  else body.max_tokens = request.maxTokens ?? config.maxOutputTokens;

  if (!reasoning && !compat) body.temperature = request.temperature ?? config.temperature;
  if (request.json && config.jsonMode && !compat) body.response_format = { type: 'json_object' };
  return body;
}

/**
 * A 400 from a provider usually means one optional field is unsupported
 * (temperature on a reasoning model, response_format on a gateway, or the
 * max-token field name). Release the body and signal a single safe retry.
 */
function shouldRetryWithCompatibleBody(response: Response): boolean {
  if (response.status !== 400) return false;
  void response.body?.cancel().catch(() => undefined);
  return true;
}

/** Non-streaming completion returning the assistant text. */
export async function completeChat(
  config: AiRuntimeConfig,
  request: ProviderRequest,
): Promise<{ text: string; truncated: boolean }> {
  let response = await providerFetch(config, buildBody(config, { ...request, stream: false }), request.signal);
  if (!response.ok && shouldRetryWithCompatibleBody(response)) {
    // Retry once with the most conservative payload (no temperature, no
    // response_format, max_completion_tokens) before giving up.
    response = await providerFetch(config, buildBody(config, { ...request, stream: false }, true), request.signal);
  }
  if (!response.ok) {
    throw new ProviderError(mapStatus(response.status), response.status);
  }
  let data: {
    choices?: Array<{ message?: { content?: string | null }; finish_reason?: string }>;
    error?: { message?: string };
  };
  try {
    data = await response.json();
  } catch {
    throw new ProviderError('upstream_error', 502, 'Provider returned invalid JSON.');
  }
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text.trim()) throw new ProviderError('upstream_error', 502, 'Provider returned an empty answer.');
  const truncated = data.choices?.[0]?.finish_reason === 'length';
  return { text, truncated };
}

export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onDone: (info: { truncated: boolean }) => void;
}

/**
 * Streams a completion, calling `onDelta` for each text fragment.
 * Parses the provider's SSE stream without buffering the whole answer.
 */
export async function streamChat(
  config: AiRuntimeConfig,
  request: ProviderRequest,
  callbacks: StreamCallbacks,
): Promise<void> {
  let response = await providerFetch(config, buildBody(config, { ...request, stream: true }), request.signal);
  if (!response.ok && shouldRetryWithCompatibleBody(response)) {
    response = await providerFetch(config, buildBody(config, { ...request, stream: true }, true), request.signal);
  }
  if (!response.ok) {
    throw new ProviderError(mapStatus(response.status), response.status);
  }
  if (!response.body) throw new ProviderError('upstream_error', 502, 'Provider response had no body.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let truncated = false;

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':') || !trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string | null }; finish_reason?: string }>;
            error?: { message?: string };
          };
          if (json.error) throw new ProviderError('upstream_error', 502, 'Provider stream error.');
          const choice = json.choices?.[0];
          const delta = choice?.delta?.content;
          if (delta) callbacks.onDelta(delta);
          if (choice?.finish_reason === 'length') truncated = true;
        } catch (error) {
          if (error instanceof ProviderError) throw error;
          // Ignore malformed keep-alive fragments; the stream continues.
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Reader already released.
    }
  }
  callbacks.onDone({ truncated });
}

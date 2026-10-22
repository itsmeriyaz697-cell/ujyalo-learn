/**
 * Minimal, dependency-free SSE parser used by the tutor client.
 * Kept pure so it can be unit-tested without a network.
 */
export interface SseEvent {
  event: string;
  data: string;
}

export function parseSseBuffer(buffer: string): { events: SseEvent[]; rest: string } {
  const events: SseEvent[] = [];
  const normalized = buffer.replace(/\r\n/g, '\n');
  const blocks = normalized.split('\n\n');
  const rest = blocks.pop() ?? '';

  for (const block of blocks) {
    if (!block.trim()) continue;
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
    }
    if (dataLines.length) events.push({ event, data: dataLines.join('\n') });
  }
  return { events, rest };
}

export type TutorStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'notice'; text: string }
  | { type: 'done'; provider?: string }
  | { type: 'error'; code: string; message?: string };

export function interpretSseEvent(event: SseEvent): TutorStreamEvent | null {
  try {
    const payload = JSON.parse(event.data) as Record<string, unknown>;
    if (event.event === 'error' || payload.error) {
      const error = payload.error as { code?: string; message?: string } | string | undefined;
      if (typeof error === 'string') return { type: 'error', code: 'upstream_error', message: error };
      return { type: 'error', code: error?.code ?? 'upstream_error', message: error?.message };
    }
    if (event.event === 'done' || payload.done) {
      return { type: 'done', provider: typeof payload.provider === 'string' ? payload.provider : undefined };
    }
    if (event.event === 'notice' || typeof payload.notice === 'string') {
      return { type: 'notice', text: String(payload.notice) };
    }
    const delta = payload.delta ?? payload.text ?? payload.content;
    if (typeof delta === 'string') return { type: 'delta', text: delta };
    return null;
  } catch {
    return null;
  }
}

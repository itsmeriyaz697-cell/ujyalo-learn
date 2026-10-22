import { describe, expect, it } from 'vitest';
import { interpretSseEvent, parseSseBuffer } from '../src/services/ai/parser';

describe('parseSseBuffer', () => {
  it('parses complete SSE events and keeps the remainder', () => {
    const { events, rest } = parseSseBuffer('event: delta\ndata: {"delta":"Hel"}\n\nevent: delta\ndata: {"delta":"lo"}\n\nevent: del');
    expect(events).toHaveLength(2);
    expect(rest).toBe('event: del');
  });

  it('handles CRLF line endings', () => {
    const { events } = parseSseBuffer('data: {"delta":"a"}\r\n\r\n');
    expect(events[0].data).toBe('{"delta":"a"}');
  });

  it('joins multi-line data fields', () => {
    const { events } = parseSseBuffer('data: line one\ndata: line two\n\n');
    expect(events[0].data).toBe('line one\nline two');
  });

  it('ignores empty blocks', () => {
    expect(parseSseBuffer('\n\n\n').events).toHaveLength(0);
  });
});

describe('interpretSseEvent', () => {
  it('parses text deltas', () => {
    expect(interpretSseEvent({ event: 'delta', data: '{"delta":"hello"}' })).toEqual({ type: 'delta', text: 'hello' });
  });

  it('parses notices and done events', () => {
    expect(interpretSseEvent({ event: 'notice', data: '{"notice":"Truncated"}' })).toEqual({
      type: 'notice',
      text: 'Truncated',
    });
    expect(interpretSseEvent({ event: 'done', data: '{"done":true,"provider":"openai"}' })).toEqual({
      type: 'done',
      provider: 'openai',
    });
  });

  it('parses error events without exposing internals', () => {
    expect(
      interpretSseEvent({ event: 'error', data: '{"error":{"code":"rate_limited","message":"Slow down"}}' }),
    ).toEqual({ type: 'error', code: 'rate_limited', message: 'Slow down' });
  });

  it('returns null for malformed payloads', () => {
    expect(interpretSseEvent({ event: 'delta', data: 'not json' })).toBeNull();
    expect(interpretSseEvent({ event: 'delta', data: '{"other":1}' })).toBeNull();
  });
});

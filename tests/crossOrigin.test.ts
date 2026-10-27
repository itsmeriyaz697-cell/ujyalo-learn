import { describe, expect, it } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { originAllowed, rejectCrossOrigin } from '../api/_lib/http';

/**
 * A request with no Origin is not something a browser can produce for a
 * cross-site write, so it is allowed (this is how the test suites and any
 * server-to-server caller reach the API).
 */
function request(headers: Record<string, string | undefined>): VercelRequest {
  return { headers } as unknown as VercelRequest;
}

function captureResponse() {
  const state = { status: 0, body: '' };
  const res = {
    set statusCode(value: number) {
      state.status = value;
    },
    get statusCode() {
      return state.status;
    },
    setHeader() {},
    end(value?: string) {
      state.body = value ?? '';
    },
  } as unknown as VercelResponse;
  return { res, state };
}

describe('originAllowed', () => {
  it('allows a request with no Origin header', () => {
    expect(originAllowed(request({ host: 'ujyalo-learn.vercel.app' }))).toBe(true);
  });

  it('allows a same-origin write', () => {
    expect(
      originAllowed(request({ host: 'ujyalo-learn.vercel.app', origin: 'https://ujyalo-learn.vercel.app' })),
    ).toBe(true);
  });

  it('allows the host Vercel forwards, not just the internal one', () => {
    expect(
      originAllowed(request({ host: '10.0.0.1', 'x-forwarded-host': 'ujyalo-learn.vercel.app', origin: 'https://ujyalo-learn.vercel.app' })),
    ).toBe(true);
  });

  it('refuses a different site', () => {
    expect(originAllowed(request({ host: 'ujyalo-learn.vercel.app', origin: 'https://evil.example' }))).toBe(false);
  });

  it('refuses a lookalike host', () => {
    expect(
      originAllowed(request({ host: 'ujyalo-learn.vercel.app', origin: 'https://ujyalo-learn.vercel.app.evil.example' })),
    ).toBe(false);
  });

  it('refuses the "null" origin an opaque sandbox sends', () => {
    expect(originAllowed(request({ host: 'ujyalo-learn.vercel.app', origin: 'null' }))).toBe(false);
  });

  it('refuses a malformed Origin', () => {
    expect(originAllowed(request({ host: 'ujyalo-learn.vercel.app', origin: 'not a url' }))).toBe(false);
  });

  it('allows the scheme-less host comparison to fail closed on http vs https of another host', () => {
    expect(originAllowed(request({ host: 'ujyalo-learn.vercel.app', origin: 'http://ujyalo-learn.vercel.app.evil.example' }))).toBe(false);
  });

  it('treats the configured canonical site as trusted', () => {
    const previous = process.env.VITE_SITE_URL;
    process.env.VITE_SITE_URL = 'https://ujyalolearn.com.np';
    try {
      expect(originAllowed(request({ host: 'ujyalo-learn.vercel.app', origin: 'https://ujyalolearn.com.np' }))).toBe(true);
      expect(originAllowed(request({ host: 'ujyalo-learn.vercel.app', origin: 'https://www.ujyalolearn.com.np' }))).toBe(true);
    } finally {
      if (previous === undefined) delete process.env.VITE_SITE_URL;
      else process.env.VITE_SITE_URL = previous;
    }
  });

  it('allows a local dev app on another port of the same loopback host', () => {
    expect(originAllowed(request({ host: '127.0.0.1:8787', origin: 'http://127.0.0.1:5173' }))).toBe(true);
    expect(originAllowed(request({ host: 'localhost:8787', origin: 'http://localhost:5173' }))).toBe(true);
  });

  it('does not let a non-loopback origin borrow the loopback exception', () => {
    expect(originAllowed(request({ host: '127.0.0.1:8787', origin: 'http://127.0.0.1.evil.example:5173' }))).toBe(false);
  });
});

describe('rejectCrossOrigin', () => {
  it('answers 403 with a structured error and reports that it handled the request', () => {
    const { res, state } = captureResponse();
    const handled = rejectCrossOrigin(request({ host: 'ujyalo-learn.vercel.app', origin: 'https://evil.example' }), res);
    expect(handled).toBe(true);
    expect(state.status).toBe(403);
    expect(JSON.parse(state.body)).toMatchObject({ error: { code: 'cross_origin' } });
  });

  it('stays out of the way of a same-origin request', () => {
    const { res, state } = captureResponse();
    const handled = rejectCrossOrigin(request({ host: 'ujyalo-learn.vercel.app', origin: 'https://ujyalo-learn.vercel.app' }), res);
    expect(handled).toBe(false);
    expect(state.status).toBe(0);
  });
});

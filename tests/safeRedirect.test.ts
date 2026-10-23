import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from '../src/lib/safeRedirect';

const ORIGIN = 'https://ujyalo-learn.vercel.app';

describe('safeRedirectPath — rejects cross-origin targets', () => {
  // These are the exact payloads that defeated the previous prefix check.
  const attacks = [
    '//evil.com',
    '/\\evil.com', // backslash is normalised to a slash by the URL parser
    '/\\/evil.com',
    '/\\evil.com/..',
    '/\t/evil.com', // literal tab
    '\\/evil.com',
    'https://evil.com',
    'http://evil.com/app',
    '//evil.com/app?x=1',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'HTTPS://EVIL.COM',
    ' //evil.com',
    '\n//evil.com',
  ];

  it.each(attacks)('blocks %j', (payload) => {
    expect(safeRedirectPath(payload, ORIGIN)).toBe('');
  });

  it('blocks a protocol-relative URL even when it points at a similar host', () => {
    expect(safeRedirectPath('//ujyalo-learn.vercel.app.evil.com', ORIGIN)).toBe('');
  });
});

describe('safeRedirectPath — keeps legitimate in-app paths', () => {
  it.each([
    ['/app', '/app'],
    ['/admin', '/admin'],
    ['/courses/see-mathematics-core', '/courses/see-mathematics-core'],
    ['/app/tutor?mode=step-by-step&subject=math', '/app/tutor?mode=step-by-step&subject=math'],
    ['/app/quizzes#top', '/app/quizzes#top'],
    ['/grades/10', '/grades/10'],
  ])('allows %j', (input, expected) => {
    expect(safeRedirectPath(input, ORIGIN)).toBe(expected);
  });

  it('accepts an absolute URL that is already on our origin', () => {
    expect(safeRedirectPath(`${ORIGIN}/app`, ORIGIN)).toBe('/app');
  });

  it('roots a relative path rather than resolving it against the current route', () => {
    expect(safeRedirectPath('app', ORIGIN)).toBe('/app');
  });

  it('returns an empty string for missing or empty input', () => {
    expect(safeRedirectPath(null, ORIGIN)).toBe('');
    expect(safeRedirectPath(undefined, ORIGIN)).toBe('');
    expect(safeRedirectPath('', ORIGIN)).toBe('');
  });
});

describe('safeRedirectPath — avoids login loops', () => {
  it.each(['/login', '/login?next=/app', '/signup', '/forgot-password', '/verify-email'])(
    'refuses to redirect back to %j',
    (path) => {
      expect(safeRedirectPath(path, ORIGIN)).toBe('');
    },
  );

  it('still allows app paths that merely start with the same letters', () => {
    expect(safeRedirectPath('/loginfo', ORIGIN)).toBe('/loginfo');
  });
});

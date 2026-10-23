import { describe, expect, it } from 'vitest';
import { safeMarkdownUrl } from '../src/lib/markdownUrl';

describe('safeMarkdownUrl — blocks dangerous schemes', () => {
  const blocked = [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    ' javascript:alert(1)',
    'javascript&colon;alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'blob:https://x/y',
    '//evil.com',
    '\\/evil.com',
  ];

  it.each(blocked)('drops %j', (url) => {
    expect(safeMarkdownUrl(url)).toBe('');
  });
});

describe('safeMarkdownUrl — keeps real links', () => {
  it.each([
    ['https://example.com/page', 'https://example.com/page'],
    ['http://example.com', 'http://example.com'],
    ['mailto:hello@ujyalo-learn.com', 'mailto:hello@ujyalo-learn.com'],
    ['/courses/see-mathematics-core', '/courses/see-mathematics-core'],
    ['/app/tutor?mode=step-by-step', '/app/tutor?mode=step-by-step'],
    ['#section-2', '#section-2'],
  ])('allows %j', (input, expected) => {
    expect(safeMarkdownUrl(input)).toBe(expected);
  });

  it('treats an empty string as no link', () => {
    expect(safeMarkdownUrl('')).toBe('');
    expect(safeMarkdownUrl('   ')).toBe('');
  });
});

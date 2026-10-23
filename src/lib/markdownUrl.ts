/**
 * URL allowlist for links produced by the AI tutor or written by a student.
 *
 * Model output is untrusted input. react-markdown already refuses
 * `javascript:`, `data:` and `vbscript:` URLs, but that behaviour is a library
 * default that could change between versions, and it passes through
 * entity-encoded payloads such as `javascript&colon;alert(1)`. This allowlist
 * makes the guarantee ours and explicit.
 *
 * Allowed: http(s), mailto, and in-app relative links. Everything else is
 * dropped, which makes react-markdown render the anchor text without a link.
 */

const ALLOWED = /^(https?:|mailto:)/i;

export function safeMarkdownUrl(url: string): string {
  const trimmed = url.trim();

  if (!trimmed) return '';

  // Relative and in-app links: must start with a path or fragment, never with
  // a scheme-ish prefix. `//host` is protocol-relative and is rejected.
  if (trimmed.startsWith('//')) return '';
  if (/^[/#?]/.test(trimmed)) return trimmed;

  if (!ALLOWED.test(trimmed)) return '';

  // A URL that parses to a non-http(s) scheme is not what it claims to be.
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) return '';
    return trimmed;
  } catch {
    return '';
  }
}

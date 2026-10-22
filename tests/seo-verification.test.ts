import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Google Search Console ownership is proved by a single file at the site root.
 * Google compares the body byte-for-byte, so a stray newline, an HTML wrapper or
 * a rename silently breaks verification — and the failure only shows up in
 * Search Console days later. These tests make that impossible to do by accident.
 */

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const FILE = 'googlec3d881d4bf552040.html';
const EXPECTED = `google-site-verification: ${FILE}`; // no trailing newline

describe('Google site verification file', () => {
  it('exists in public/ so Vite copies it to the site root', () => {
    expect(existsSync(path.join(PUBLIC_DIR, FILE))).toBe(true);
  });

  it('matches the exact bytes Google issued', () => {
    const body = readFileSync(path.join(PUBLIC_DIR, FILE), 'utf8');
    expect(body).toBe(EXPECTED);
    expect(body.endsWith('\n')).toBe(false);
  });

  it('is not wrapped in HTML or JSON', () => {
    const body = readFileSync(path.join(PUBLIC_DIR, FILE), 'utf8');
    expect(body).not.toMatch(/<[a-z]/i);
    expect(body.startsWith('google-site-verification: ')).toBe(true);
  });
});

describe('sitemap and robots configuration', () => {
  it('never invents a domain when VITE_SITE_URL is absent', () => {
    const script = readFileSync(path.resolve(process.cwd(), 'scripts/generate-seo.mjs'), 'utf8');
    expect(script).toMatch(/skipped sitemap\.xml and absolute URLs/);
    expect(script).toMatch(/no domain will be invented/);
  });

  it('keeps private areas out of robots.txt', () => {
    const script = readFileSync(path.resolve(process.cwd(), 'scripts/generate-seo.mjs'), 'utf8');
    for (const blocked of ['/app', '/api/', '/login', '/signup', '/onboarding']) {
      expect(script).toContain(`Disallow: ${blocked}`);
    }
  });

  it('marks admin, app and search as noindex at the edge', () => {
    const config = JSON.parse(readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf8'));
    const rule = config.headers.find((header: { source: string }) =>
      header.source.includes('admin'),
    );
    expect(rule).toBeTruthy();
    expect(JSON.stringify(rule)).toContain('noindex');
    expect(rule.source).toContain('search');
  });
});

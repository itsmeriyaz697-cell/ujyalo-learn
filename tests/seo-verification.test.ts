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

describe('paste-ready URL list (docs/urls-to-submit.txt)', () => {
  const file = path.resolve(process.cwd(), 'docs/urls-to-submit.txt');
  const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean);

  it('contains only absolute https URLs, one per line', () => {
    // Bing's submission box takes URLs and nothing else; a stray comment line
    // makes the whole paste fail, so the file is deliberately bare.
    for (const line of lines) {
      expect(line).toMatch(/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/[^\s]*)?$/);
    }
  });

  it('lists every public route exactly once', () => {
    expect(new Set(lines).size).toBe(lines.length);
    expect(lines.length).toBe(41); // 16 listed + 12 grades + 7 courses + 6 guides
  });

  it('points at the production domain, not localhost or a placeholder', () => {
    for (const line of lines) {
      expect(line.startsWith('https://ujyalo-learn.vercel.app')).toBe(true);
    }
  });

  it('puts the highest-intent pages first, because quota is capped', () => {
    expect(lines[0]).toBe('https://ujyalo-learn.vercel.app/');
    expect(lines[1]).toBe('https://ujyalo-learn.vercel.app/see-preparation');
  });
});

describe('homepage brand search signals', () => {
  const pages = JSON.parse(readFileSync(path.resolve(process.cwd(), 'shared/seo-pages.json'), 'utf8')) as {
    pages: Array<{ path: string; title: string; description: string; h1?: string }>;
  };
  const home = pages.pages.find((page) => page.path === '/');

  it('leads with the exact brand in the title, description and visible H1', () => {
    expect(home).toBeTruthy();
    expect(home?.title.startsWith('Ujyalo Learn')).toBe(true);
    expect(home?.description).toContain('Ujyalo Learn');
    expect(home?.h1).toContain('Ujyalo Learn');
    expect((home?.description.length ?? 0) <= 160).toBe(true);
  });

  it('uses the same H1 in React and in the crawler-prerendered page', () => {
    const source = readFileSync(path.resolve(process.cwd(), 'src/pages/HomePage.tsx'), 'utf8');
    expect(home?.h1).toBeTruthy();
    expect(source).toContain(home?.h1 as string);
  });

  it('ships matching brand metadata before the post-build prerender runs', () => {
    const shell = readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    expect(shell).toContain(`<title>${home?.title}</title>`);
    const description = shell.match(/<meta\s+name="description"\s+content="([^"]*)">/)?.[1];
    expect(description).toBe(home?.description);
    expect(shell).toContain('<meta name="application-name" content="Ujyalo Learn">');
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

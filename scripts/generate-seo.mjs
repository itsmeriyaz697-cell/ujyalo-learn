/**
 * Generates dist/sitemap.xml and dist/robots.txt after the production build.
 *
 * A sitemap is published ONLY when VITE_SITE_URL is set, so the project never
 * invents a domain or lists pages that do not exist.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');
const rawUrl = (process.env.VITE_SITE_URL || readEnvFile() || '').trim().replace(/\/$/, '');

function readEnvFile() {
  for (const file of ['.env.local', '.env']) {
    try {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      const line = content.split('\n').find((l) => l.trim().startsWith('VITE_SITE_URL='));
      if (line) return line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    } catch {
      /* file not present */
    }
  }
  return '';
}

const robotsBase = `# Ujyalo Learn
User-agent: *
Allow: /
Disallow: /app
Disallow: /app/
Disallow: /api/
Disallow: /login
Disallow: /signup
Disallow: /forgot-password
Disallow: /onboarding
`;

if (!fs.existsSync(DIST)) {
  console.error('[seo] dist/ not found — run the build first.');
  process.exit(0);
}

if (!rawUrl) {
  fs.writeFileSync(path.join(DIST, 'robots.txt'), robotsBase);
  console.warn('[seo] VITE_SITE_URL is not set: skipped sitemap.xml (no domain will be invented).');
  process.exit(0);
}

let origin;
try {
  origin = new URL(rawUrl).origin;
} catch {
  console.error(`[seo] VITE_SITE_URL is not a valid URL: ${rawUrl}`);
  process.exit(1);
}

const pages = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/features', priority: '0.8', changefreq: 'monthly' },
  { path: '/subjects', priority: '0.8', changefreq: 'monthly' },
  { path: '/pricing', priority: '0.6', changefreq: 'monthly' },
  { path: '/help', priority: '0.6', changefreq: 'monthly' },
  { path: '/about', priority: '0.5', changefreq: 'yearly' },
  { path: '/contact', priority: '0.5', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.4', changefreq: 'yearly' },
  { path: '/terms', priority: '0.4', changefreq: 'yearly' },
];

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${origin}${page.path === '/' ? '/' : page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `${robotsBase}\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`[seo] wrote sitemap.xml and robots.txt for ${origin}`);

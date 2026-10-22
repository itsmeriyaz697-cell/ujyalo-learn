/**
 * Post-build SEO.
 *
 * 1. Copies robots.txt and (when VITE_SITE_URL is set) writes sitemap.xml.
 * 2. Rewrites absolute URLs (canonical, og:url, og:image) in dist/index.html.
 * 3. Generates a real static HTML file for every public route, each with its
 *    own title, description, canonical URL and Open Graph tags. Crawlers and
 *    link previews read these without running JavaScript; the SPA then boots
 *    over them and takes over client-side navigation.
 * 4. Injects site-level JSON-LD (Organization, WebSite, FAQPage).
 *
 * No domain is ever invented: if VITE_SITE_URL is missing, absolute tags are
 * left out and the sitemap is skipped.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');
const THEME_COLOR = '#15245F';
const SITE_NAME = 'Ujyalo Learn';

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

const rawUrl = (process.env.VITE_SITE_URL || readEnvFile() || '').trim().replace(/\/+$/, '');

let origin = '';
if (rawUrl) {
  try {
    origin = new URL(rawUrl).origin;
  } catch {
    console.error(`[seo] VITE_SITE_URL is not a valid URL: ${rawUrl}`);
    process.exit(1);
  }
}

const abs = (pathname) => (origin ? `${origin}${pathname}` : pathname);

const robotsBase = `# Ujyalo Learn
User-agent: *
Allow: /
Disallow: /app
Disallow: /app/
Disallow: /api/
Disallow: /login
Disallow: /signup
Disallow: /forgot-password
Disallow: /verify-email
Disallow: /onboarding
${origin ? `\nSitemap: ${origin}/sitemap.xml\n` : ''}`;

const { pages: PAGES } = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'shared/seo-pages.json'), 'utf8'),
);

if (!fs.existsSync(DIST)) {
  console.error('[seo] dist/ not found — run the build first.');
  process.exit(0);
}

const indexPath = path.join(DIST, 'index.html');
const shell = fs.readFileSync(indexPath, 'utf8');

const escapeHtml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const FAQ = [
  {
    q: 'Is Ujyalo Learn free to use?',
    a: 'Yes. AI tutoring, quizzes, notes, flashcards, the study planner and progress tracking are free, with fair-use limits on AI requests. No payment is taken on this site.',
  },
  {
    q: 'Which grades and subjects are supported?',
    a: 'Grades 1–12, including SEE preparation in Nepal, across nine subjects: Mathematics, Science, English, Nepali, Social Studies, Computer Science, Optional Mathematics, Health & Physical Education and Economics.',
  },
  {
    q: 'Can the tutor explain things in Nepali?',
    a: 'Yes. You can choose Nepali as your preferred language during setup or use the Nepali Explanation mode for a single answer.',
  },
  {
    q: 'Is this official curriculum or exam material?',
    a: 'No. Ujyalo Learn is an independent learning tool. Explanations are AI-generated and are not official textbooks or exam papers.',
  },
  {
    q: 'Will the AI do my homework for me?',
    a: 'The tutor guides you through the reasoning and explains each step so you can reproduce the method yourself.',
  },
  {
    q: 'Who can see my conversations and notes?',
    a: 'Only your own account. Database security rules restrict every record to its owner, and you can delete individual items or your whole account at any time.',
  },
];

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE_NAME,
    alternateName: 'Ujyalo Learn — Learn Smarter. Shine Brighter.',
    ...(origin ? { url: `${origin}/`, logo: `${origin}/icons/icon-512.png` } : {}),
    description:
      'AI-powered learning and tutoring platform for students in Nepal: Grades 1–12, SEE preparation, practice quizzes, notes, flashcards and a study planner.',
    founder: { '@type': 'Person', name: 'Riyaz Chalise' },
    areaServed: { '@type': 'Country', name: 'Nepal' },
    knowsLanguage: ['en', 'ne'],
    ...(origin ? { sameAs: [] } : {}),
  },
  ...(origin
    ? [
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: `${origin}/`,
          inLanguage: 'en',
          publisher: { '@type': 'Organization', name: SITE_NAME },
        },
      ]
    : []),
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  },
];

/** Replace (or insert) a meta tag in the shell. */
function upsertMeta(html, { name, property }, content) {
  const attr = name ? `name="${name}"` : `property="${property}"`;
  const pattern = new RegExp(`<meta\\s+${attr}\\s+content="[^"]*"\\s*/?>`, 'i');
  const tag = `<meta ${attr} content="${escapeHtml(content)}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function upsertLink(html, rel, href) {
  const pattern = new RegExp(`<link\\s+rel="${rel}"\\s+href="[^"]*"\\s*/?>`, 'i');
  const tag = `<link rel="${rel}" href="${escapeHtml(href)}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function renderPage(page) {
  let html = shell;
  const url = abs(page.path);
  const image = abs('/og-image.png');
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  html = upsertMeta(html, { name: 'description' }, page.description);
  html = upsertMeta(html, { name: 'robots' }, 'index, follow, max-image-preview:large');
  html = upsertMeta(html, { property: 'og:type' }, 'website');
  html = upsertMeta(html, { property: 'og:site_name' }, SITE_NAME);
  html = upsertMeta(html, { property: 'og:title' }, page.title);
  html = upsertMeta(html, { property: 'og:description' }, page.description);
  html = upsertMeta(html, { property: 'og:image' }, image);
  html = upsertMeta(html, { property: 'og:image:alt' }, 'Ujyalo Learn — an AI tutor for students in Nepal');
  html = upsertMeta(html, { name: 'twitter:card' }, 'summary_large_image');
  html = upsertMeta(html, { name: 'twitter:title' }, page.title);
  html = upsertMeta(html, { name: 'twitter:description' }, page.description);
  html = upsertMeta(html, { name: 'twitter:image' }, image);

  if (origin) {
    html = upsertLink(html, 'canonical', url);
    html = upsertMeta(html, { property: 'og:url' }, url);
  }

  // Per-page breadcrumb so search results show a path rather than a bare URL.
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement:
      page.path === '/'
        ? [{ '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') }]
        : [
            { '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') },
            { '@type': 'ListItem', position: 2, name: page.title.split(' — ')[0], item: url },
          ],
  };

  const ld = JSON.stringify([...structuredData, breadcrumb]).replace(/</g, '\\u003c');
  html = html.replace(
    '</head>',
    `    <script type="application/ld+json">${ld}</script>\n  </head>`,
  );

  // The noscript block doubles as crawlable content for JS-less crawlers.
  const noscript = `<noscript>
      <div style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 44rem; margin: 0 auto; line-height: 1.6">
        <h1>${escapeHtml(page.title)}</h1>
        <p>${escapeHtml(page.description)}</p>
        <p><a href="/signup">Create a free account</a> · <a href="/features">Features</a> · <a href="/subjects">Subjects</a> · <a href="/pricing">Pricing</a> · <a href="/help">Help</a></p>
        <p>Ujyalo Learn needs JavaScript for the AI tutor, quizzes and study tools. Founded by Riyaz Chalise.</p>
      </div>
    </noscript>`;
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, noscript);

  return html;
}

// ── 1. robots.txt + sitemap.xml ──────────────────────────────────────────────
fs.writeFileSync(path.join(DIST, 'robots.txt'), robotsBase);

if (origin) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = PAGES.map(
    (page) => `  <url>
    <loc>${origin}${page.path === '/' ? '/' : page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  ).join('\n');

  fs.writeFileSync(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
  );
  console.log(`[seo] wrote sitemap.xml and robots.txt for ${origin}`);
} else {
  console.warn('[seo] VITE_SITE_URL is not set: skipped sitemap.xml and absolute URLs (no domain will be invented).');
}

// ── 2. Static HTML per public route ─────────────────────────────────────────
for (const page of PAGES) {
  const html = renderPage(page);
  if (page.path === '/') {
    fs.writeFileSync(indexPath, html);
    continue;
  }
  const dir = path.join(DIST, page.path.replace(/^\//, ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

console.log(`[seo] prerendered ${PAGES.length} public routes with static metadata.`);

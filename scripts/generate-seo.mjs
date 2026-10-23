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

const { pages: LISTED_PAGES } = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'shared/seo-pages.json'), 'utf8'),
);

// Twelve grade hubs share one template, so they are generated rather than
// listed. They are real pages with real content, not keyword duplicates.
const GRADE_PAGES = Array.from({ length: 12 }, (_, index) => {
  const grade = index + 1;
  return {
    path: `/grades/${grade}`,
    title: `Grade ${grade} — subjects, courses and study tools | Ujyalo Learn`,
    h1: `Grade ${grade} study hub`,
    description: `What to study in Grade ${grade} in Nepal: the subject list, published Ujyalo Learn courses that cover Grade ${grade}, and the study tools that help at this stage.`,
    priority: grade === 10 ? '0.9' : '0.6',
    changefreq: 'monthly',
    grade,
  };
});

/**
 * Published starter content gets its own static page too, so a crawl of the
 * site finds real course and resource URLs. Content published later through
 * the admin panel is served by the SPA (see docs/CONTENT.md).
 */
const CONTENT_SEED = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'shared/content-seed.json'), 'utf8'),
);

const CONTENT_PAGES = [
  ...CONTENT_SEED.courses
    .filter((course) => course.status === 'published')
    .map((course) => ({
      path: `/courses/${course.slug}`,
      title: `${course.title} — Ujyalo Learn`,
      h1: course.title,
      description: course.summary,
      priority: '0.7',
      changefreq: 'monthly',
      kind: 'course',
      course,
    })),
  ...CONTENT_SEED.resources
    .filter((resource) => resource.status === 'published')
    .map((resource) => ({
      path: `/resources/${resource.slug}`,
      title: `${resource.title} — Ujyalo Learn`,
      h1: resource.title,
      description: resource.description,
      priority: '0.6',
      changefreq: 'monthly',
      kind: 'resource',
      updated: resource.updatedAt,
      created: resource.createdAt,
      source: resource.source,
      license: resource.license,
      type: resource.type,
      resource,
    })),
];

const PAGES = [
  ...LISTED_PAGES.map((page) => ({ ...page, kind: 'page' })),
  ...GRADE_PAGES.map((page) => ({ ...page, kind: 'grade' })),
  ...CONTENT_PAGES.map((page) => ({ ...page, kind: page.kind })),
];

if (!fs.existsSync(DIST)) {
  console.error('[seo] dist/ not found — run the build first.');
  process.exit(0);
}

const indexPath = path.join(DIST, 'index.html');
const shell = fs.readFileSync(indexPath, 'utf8');

const escapeHtml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');


/**
 * Prerendered static content.
 *
 * The SPA renders into an empty #root, so a crawler that does not execute
 * JavaScript previously saw nothing but a <noscript> block — no heading, no
 * navigation, no footer, no privacy link. That hurts search indexing and, more
 * importantly now, AI crawlers (GPTBot, ClaudeBot, PerplexityBot) that fetch
 * HTML and never run scripts.
 *
 * Every route therefore ships a small, honest, visible content skeleton inside
 * #root: the same <h1> the app renders, the page description as a direct
 * answer, a link to the tools, breadcrumb navigation and a real footer.
 * React replaces it on load, so it is a preview of the page, not a substitute:
 * no content here is hidden from people, and none of it is absent from the app.
 */
const SITE_NAV = [
  ['/courses', 'Courses'],
  ['/subjects', 'Subjects'],
  ['/resources', 'Resources'],
  ['/see-preparation', 'SEE'],
  ['/ai-tutor', 'AI tutor'],
  ['/pricing', 'Pricing'],
  ['/about', 'About'],
];

const FOOTER_LINKS = [
  ['/courses', 'Courses'],
  ['/resources', 'Resources'],
  ['/subjects', 'Subjects'],
  ['/grades/10', 'Grade 10'],
  ['/see-preparation', 'SEE preparation'],
  ['/ai-tutor', 'AI tutor'],
  ['/search', 'Search'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
  ['/help', 'Help'],
  ['/faq', 'FAQ'],
  ['/privacy', 'Privacy'],
  ['/terms', 'Terms'],
  ['/content-policy', 'Content policy'],
  ['/accessibility', 'Accessibility'],
];

const PRERENDER_CSS = `
.pr{display:flex;flex-direction:column;min-height:100dvh;background:#f6f8fc;color:#0b1b3a;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.pr-c{width:100%;max-width:76rem;margin:0 auto;padding:0 1rem}
.pr-h{border-bottom:1px solid #dde5f2;background:#fff}
.pr-h .pr-c{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:64px;flex-wrap:wrap;padding-top:.5rem;padding-bottom:.5rem}
.pr-b{font-weight:700;font-size:1.05rem;color:#0b1b3a;text-decoration:none;letter-spacing:-.01em}
.pr-n{display:flex;flex-wrap:wrap;gap:.15rem .9rem}
.pr-n a{color:#33425f;text-decoration:none;font-size:.875rem}
.pr-n a:hover{color:#2947d6}
.pr-m{flex:1;padding-top:2.5rem;padding-bottom:3rem}
.pr-cr{font-size:.8rem;color:#5b6b8c;margin:0 0 1rem}
.pr-cr ol{list-style:none;display:flex;flex-wrap:wrap;gap:.4rem;padding:0;margin:0}
.pr-cr li+li::before{content:"/";margin-right:.4rem;color:#a9b5cc}
.pr-cr a{color:#5b6b8c;text-decoration:none}
.pr h1{font-size:clamp(1.75rem,4vw,2.75rem);line-height:1.15;letter-spacing:-.02em;margin:0 0 1rem;max-width:46rem}
.pr-l{font-size:1.05rem;line-height:1.6;color:#33425f;max-width:44rem;margin:0 0 1.5rem}
.pr-meta{font-size:.8rem;color:#5b6b8c;margin:0 0 1.25rem}
.pr-a a{display:inline-block;background:#2947d6;color:#fff;text-decoration:none;font-weight:600;font-size:.9rem;padding:.6rem 1.1rem;border-radius:.6rem;margin:.25rem .5rem .25rem 0}
.pr-a a+a{background:transparent;color:#2947d6;border:1px solid #c6d3e8}
.pr-f{border-top:1px solid #dde5f2;background:#fff;padding:1.75rem 0}
.pr-f nav{display:flex;flex-wrap:wrap;gap:.5rem 1.1rem;margin-bottom:.9rem}
.pr-f nav a{color:#33425f;text-decoration:none;font-size:.85rem}
.pr-f p{color:#5b6b8c;font-size:.8rem;margin:.3rem 0;line-height:1.6}
.dark .pr{background:#081226;color:#eef3ff}
.dark .pr-h,.dark .pr-f{background:#0e1c38;border-color:#22355c}
.dark .pr-b{color:#eef3ff}
.dark .pr-n a,.dark .pr-f nav a{color:#c9d5ee}
.dark .pr-l{color:#c9d5ee}
.dark .pr-cr,.dark .pr-cr a,.dark .pr-meta,.dark .pr-f p{color:#94a6c8}
`;

/** Home > Courses > This page, matching the breadcrumb JSON-LD. */
function crumbsFor(page) {
  const label = page.crumb ?? page.title.split(' — ')[0];
  if (page.path === '/') return [{ href: '/', label: 'Home' }];

  const trail = [{ href: '/', label: 'Home' }];
  if (page.path.startsWith('/courses/')) trail.push({ href: '/courses', label: 'Courses' });
  else if (page.path.startsWith('/resources/')) trail.push({ href: '/resources', label: 'Resources' });
  else if (page.path.startsWith('/grades/')) trail.push({ href: '/subjects', label: 'Subjects' });

  trail.push({ label });
  return trail;
}

function renderBreadcrumbs(page) {
  const trail = crumbsFor(page);
  if (trail.length < 2) return '';
  const items = trail
    .map((item, index) => {
      const last = index === trail.length - 1;
      return last
        ? `<li aria-current="page">${escapeHtml(item.label)}</li>`
        : `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`;
    })
    .join('');
  return `<nav class="pr-cr" aria-label="Breadcrumb"><ol>${items}</ol></nav>`;
}

/**
 * The skeleton used to stop at the H1 and one description line, which left
 * every public page around 130 words — boilerplate plus a sentence. Search
 * engines will render the app eventually, but AI crawlers (GPTBot, ClaudeBot,
 * PerplexityBot, OAI-SearchBot) fetch HTML and never execute JavaScript, so for
 * them the site had no content at all.
 *
 * These render the same material the app renders, from the same seed data, so
 * the static copy cannot drift from what a visitor sees. Nothing here is
 * hidden from people or absent from the app.
 */
const SUBJECT_NAMES = [
  'Mathematics',
  'Science',
  'English',
  'Nepali',
  'Social Studies',
  'Computer Science',
  'Optional Mathematics',
  'Health & Physical Education',
  'Economics',
];

function renderCourseBody(course) {
  if (!course) return '';
  const outcomes = (course.outcomes ?? [])
    .map((outcome) => `<li>${escapeHtml(outcome)}</li>`)
    .join('');
  const lessons = (course.lessons ?? [])
    .map(
      (lesson) =>
        `<li><strong>${escapeHtml(lesson.title)}</strong>${
          lesson.summary ? ` — ${escapeHtml(lesson.summary)}` : ''
        }<span class="pr-meta"> · ${lesson.minutes} min · ${escapeHtml(lesson.action)}</span></li>`,
    )
    .join('');
  const minutes = (course.lessons ?? []).reduce((sum, lesson) => sum + (lesson.minutes ?? 0), 0);

  return `<section class="pr-s">
      <h2>About this study path</h2>
      <p>${escapeHtml(course.description ?? course.summary ?? '')}</p>
      <p class="pr-meta">${(course.lessons ?? []).length} sessions · about ${minutes} minutes · ${
        course.gradeMin === course.gradeMax
          ? `Grade ${course.gradeMin}`
          : `Grades ${course.gradeMin}–${course.gradeMax}`
      }</p>
      ${outcomes ? `<h2>What you will be able to do</h2><ul>${outcomes}</ul>` : ''}
      ${lessons ? `<h2>Work through the sessions</h2><ol>${lessons}</ol>` : ''}
      <p class="pr-meta">These sessions are a study plan written by Ujyalo Learn, not official curriculum material. Examinations are set by your school board, not by this site.</p>
    </section>`;
}

function renderResourceBody(resource) {
  if (!resource) return '';
  const body = (resource.body ?? []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');
  if (!body) return '';
  return `<section class="pr-s">
      <h2>The guide</h2>
      ${body}
      <p class="pr-meta">Source: ${escapeHtml(resource.source ?? 'Ujyalo Learn')} · Licence: ${escapeHtml(
        resource.license ?? 'Ujyalo Learn original',
      )}</p>
    </section>`;
}

function renderGradeBody(grade) {
  const courses = CONTENT_SEED.courses.filter(
    (course) =>
      course.status === 'published' &&
      (course.gradeMin ?? 0) <= grade &&
      (course.gradeMax ?? 12) >= grade,
  );
  const list = courses
    .map(
      (course) =>
        `<li><a href="/courses/${course.slug}">${escapeHtml(course.title)}</a> — ${escapeHtml(
          course.summary,
        )}</li>`,
    )
    .join('');
  const subjects = SUBJECT_NAMES.map((name) => `<li>${escapeHtml(name)}</li>`).join('');

  return `<section class="pr-s">
      <h2>Subjects at this level</h2>
      <ul>${subjects}</ul>
      <h2>Courses covering Grade ${grade}</h2>
      ${
        list
          ? `<ul>${list}</ul>`
          : `<p>No published course covers Grade ${grade} yet. The practice tools work for any subject you are studying.</p>`
      }
      <p class="pr-meta">Grade names follow the Nepali school system. This is a study aid, not an official syllabus.</p>
    </section>`;
}

function renderLibraryBody(kind, heading) {
  const items =
    kind === 'courses'
      ? CONTENT_SEED.courses.filter((course) => course.status === 'published').map((course) => ({
          href: `/courses/${course.slug}`,
          title: course.title,
          description: course.summary,
        }))
      : CONTENT_SEED.resources.filter((resource) => resource.status === 'published').map((resource) => ({
          href: `/resources/${resource.slug}`,
          title: resource.title,
          description: resource.description,
        }));

  if (!items.length) return '';
  return `<section class="pr-s">
      <h2>${escapeHtml(heading)}</h2>
      <ul>${items
        .map(
          (item) =>
            `<li><a href="${item.href}">${escapeHtml(item.title)}</a> — ${escapeHtml(item.description)}</li>`,
        )
        .join('')}</ul>
    </section>`;
}

/**
 * / and /faq carry FAQPage structured data. Google requires marked-up content
 * to be visible on the page, so the questions must exist in the HTML itself —
 * a JSON-LD block whose questions appear nowhere in the document is a policy
 * mismatch, not just thin content.
 */
function renderFaqBody() {
  const items = FAQ.map(
    (entry) =>
      `<h3>${escapeHtml(entry.q)}</h3><p>${escapeHtml(entry.a)}</p>`,
  ).join('');
  return `<section class="pr-s">
      <h2>Questions students ask</h2>
      ${items}
    </section>`;
}

function renderStaticContent(page) {
  const h1 = page.h1 ?? page.title.split(' — ')[0];
  const updated =
    page.updated && page.kind === 'resource'
      ? `<p class="pr-meta">Published by Ujyalo Learn · Updated <time datetime="${escapeHtml(
          String(page.updated).slice(0, 10),
        )}">${escapeHtml(
          new Date(page.updated).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        )}</time>${
          page.license ? ` · ${escapeHtml(page.license)}` : ''
        }</p>`
      : '';

  return `<div class="pr">
  <header class="pr-h">
    <div class="pr-c">
      <a class="pr-b" href="/">Ujyalo Learn</a>
      <nav class="pr-n" aria-label="Main">${SITE_NAV.map(
        ([href, label]) => `<a href="${href}">${label}</a>`,
      ).join('')}</nav>
    </div>
  </header>
  <main class="pr-m pr-c">
    ${renderBreadcrumbs(page)}
    <h1>${escapeHtml(h1)}</h1>
    <p class="pr-l">${escapeHtml(page.description)}</p>
    ${updated}
    <p class="pr-a"><a href="/signup">Create a free account</a><a href="/ai-tutor">See how the tutor works</a></p>
    ${
      page.kind === 'course'
        ? renderCourseBody(page.course)
        : page.kind === 'resource'
          ? renderResourceBody(page.resource)
          : page.kind === 'grade'
            ? renderGradeBody(page.grade)
            : page.path === '/courses'
              ? renderLibraryBody('courses', 'Learning paths in the library')
              : page.path === '/resources'
                ? renderLibraryBody('resources', 'Guides in the library')
                : page.path === '/' || page.path === '/faq'
                  ? renderFaqBody()
                  : ''
    }
  </main>
  <footer class="pr-f">
    <div class="pr-c">
      <nav aria-label="Footer">${FOOTER_LINKS.map(
        ([href, label]) => `<a href="${href}">${label}</a>`,
      ).join('')}</nav>
      <p>Free AI tutor for Grades 1–12 and SEE preparation in Nepal. AI answers are generated, labelled as AI, and can be wrong; verified curriculum content is marked separately.</p>
      <p>Founded by Riyaz Chalise. <a href="/contact">Contact us</a> · <a href="/privacy">Privacy policy</a></p>
    </div>
  </footer>
</div>`;
}

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
    '@type': ['EducationalOrganization', 'Organization'],
    name: SITE_NAME,
    alternateName: 'Ujyalo Learn — Learn Smarter. Shine Brighter.',
    ...(origin ? { url: `${origin}/`, logo: `${origin}/icons/icon-512.png` } : {}),
    description:
      'AI-powered learning and tutoring platform for students in Nepal: Grades 1–12, SEE preparation, practice quizzes, notes, flashcards and a study planner.',
    founder: { '@type': 'Person', name: 'Riyaz Chalise' },
    areaServed: { '@type': 'Country', name: 'Nepal' },
    knowsLanguage: ['en', 'ne'],
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
  const tag = `<meta ${attr} content="${escapeHtml(content)}">`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function upsertLink(html, rel, href) {
  const pattern = new RegExp(`<link\\s+rel="${rel}"\\s+href="[^"]*"\\s*/?>`, 'i');
  const tag = `<link rel="${rel}" href="${escapeHtml(href)}">`;
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

  // One <script> per node, each with its own @type. A single JSON array is
  // valid schema.org, but naive validators read only the first block and report
  // the rest as "missing @type", so each entity ships separately.
  const article =
    page.kind === 'resource'
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: page.h1 ?? page.title,
            description: page.description,
            ...(origin ? { url: url, mainEntityOfPage: url } : {}),
            // The site publishes these guides itself; no individual writer is
            // claimed, because none is recorded.
            author: { '@type': 'Organization', name: SITE_NAME },
            publisher: { '@type': 'EducationalOrganization', name: SITE_NAME },
            inLanguage: 'en',
            isAccessibleForFree: true,
            ...(page.created ? { datePublished: new Date(page.created).toISOString() } : {}),
            ...(page.updated ? { dateModified: new Date(page.updated).toISOString() } : {}),
          },
        ]
      : [];

  // FAQPage is only valid where those questions are visible on the page —
  // the home page and /faq — not on all 41 routes.
  const pageStructuredData = structuredData.filter(
    (node) => node['@type'] !== 'FAQPage' || page.path === '/' || page.path === '/faq',
  );
  const ldNodes = [...pageStructuredData, breadcrumb, ...article];
  const ldTags = ldNodes
    .map((node) => {
      const json = JSON.stringify(node).replace(/</g, '\\u003c');
      return `    <script type="application/ld+json">${json}</script>`;
    })
    .join('\n');
  html = html.replace('</head>', `${ldTags}\n  </head>`);

  // Visible static content inside #root. React clears the container on mount,
  // so this is what a JS-less crawler reads and what a visitor sees for the
  // first few hundred milliseconds.
  const staticContent = renderStaticContent(page);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${staticContent}</div>`);

  // Scoped styles for the skeleton only; the app's own stylesheet takes over.
  html = html.replace('</head>', `    <style data-prerender>${PRERENDER_CSS}</style>\n  </head>`);

  // The skeleton is already visible without JavaScript, so <noscript> only has
  // to explain what needs scripting rather than repeating the page.
  const noscript = `<noscript>
      <p style="font-family: system-ui, sans-serif; padding: 0 1rem 2rem; max-width: 46rem; margin: 0 auto; line-height: 1.6">
        The AI tutor, quizzes and study tools need JavaScript. Everything above is readable without it.
      </p>
    </noscript>`;
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, noscript);

  return html;
}


// ── llms.txt ────────────────────────────────────────────────────────────────
// A plain-text map for AI crawlers (https://llmstxt.org). Generated from the
// same page list as the sitemap, so it only ever names pages that exist.
{
  const lines = [
    '# Ujyalo Learn',
    '',
    '> Free AI tutor and study tools for students in Nepal: Grades 1–12 and SEE',
    '> preparation. Explanations in English or Nepali, practice quizzes, saved',
    '> notes, flashcards and a study planner.',
    '',
    'Important context for summarising this site:',
    '',
    '- Explanations from the AI tutor are generated, labelled as AI-generated and can be wrong.',
    '- Ujyalo Learn is an independent study tool, not an official curriculum body,',
    '  exam board or textbook publisher, and does not claim accreditation.',
    '- Study guides under /resources are written by Ujyalo Learn and show their source and licence.',
    '- The core tutor is free with fair-use rate limits; no payment is taken on the site.',
    '- Founded by Riyaz Chalise.',
    '',
    '## Main pages',
    '',
    ...LISTED_PAGES.map(
      (page) => `- [${page.h1 ?? page.title.split(' — ')[0]}](${abs(page.path)}): ${page.description}`,
    ),
    '',
    '## Grade hubs',
    '',
    ...GRADE_PAGES.map((page) => `- [${page.h1}](${abs(page.path)}): ${page.description}`),
    '',
    '## Courses',
    '',
    ...CONTENT_SEED.courses
      .filter((course) => course.status === 'published')
      .map((course) => `- [${course.title}](${abs(`/courses/${course.slug}`)}): ${course.summary}`),
    '',
    '## Study guides',
    '',
    ...CONTENT_SEED.resources
      .filter((resource) => resource.status === 'published')
      .map(
        (resource) =>
          `- [${resource.title}](${abs(`/resources/${resource.slug}`)}): ${resource.description}`,
      ),
    '',
    '## Not for indexing',
    '',
    '- /app, /login, /signup, /onboarding, /admin and /api are private and disallowed in robots.txt.',
    '',
  ];
  fs.writeFileSync(path.join(DIST, 'llms.txt'), lines.join('\n'));
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

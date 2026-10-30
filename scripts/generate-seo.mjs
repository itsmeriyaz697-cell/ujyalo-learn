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

// Body copy for the traffic pages, shared with the React app so the prerendered
// HTML and the mounted page show the same words. See shared/page-content.json.
const pageContent = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'shared/page-content.json'), 'utf8'),
);

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
const GETTING_STARTED = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'shared/getting-started.json'), 'utf8'),
);

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

const PRERENDER_LOGO = `<svg width="34" height="34" viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect width="64" height="64" rx="15" fill="#15245F"/><g stroke="#F7B733" stroke-width="2.4" stroke-linecap="round"><path d="M32 9v4.6"/><path d="M19.6 13l2.8 3.4"/><path d="M44.4 13l-2.8 3.4"/><path d="M12.5 23.6l4.3 1.4"/><path d="M51.5 23.6l-4.3 1.4"/></g><circle cx="32" cy="26.5" r="7.6" fill="#F7B733"/><path d="M8 37.5c7-4 16-3.4 24 2 8-5.4 17-6 24-2V50c-7-4-16-3.5-24 1.7C24 47.5 15 47 8 50V37.5Z" fill="#FFFFFF"/><path d="M32 39.5v12.1" stroke="#92B0FF" stroke-width="1.5" stroke-linecap="round"/><path d="M13.5 40c4.5-2.1 9.9-2.1 14.5.4M50.5 40c-4.5-2.1-9.9-2.1-14.5.4" stroke="#2947D6" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></svg>`;

const PRERENDER_MENU_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`;

/*
 * The HTML below is what a visitor sees for the first ~1 second, before React
 * mounts and replaces it. It therefore has to look like the app, not like a
 * plain document: same sticky 64px header, same wordmark, same hero scale,
 * same buttons, same footer. Every colour comes from the app's own CSS
 * variables, so light/dark, contrast and future palette changes stay in one
 * place. The app stylesheet is render-blocking, so these rules are always
 * applied before the first paint.
 */
const PRERENDER_CSS = `
.pr{display:flex;flex-direction:column;min-height:100dvh;background:var(--bg);color:var(--text)}
.pr-body{padding-bottom:3rem!important;display:grid;gap:2rem}
@media (min-width:1024px){.pr-body{grid-template-columns:1fr 1fr;gap:2rem 3rem}.pr-body .pr-sec:first-child{grid-column:1/-1}}
.pr-sec h2{font-size:1.15rem;font-weight:700;letter-spacing:-.01em;margin:0 0 .6rem;color:var(--pr-text,#111827)}
.pr-sec p{margin:0 0 .7rem;font-size:.9rem;line-height:1.7;color:var(--pr-soft,#4b5563)}
.pr-sec ul{margin:.2rem 0 .7rem;padding-left:1.1rem}
.pr-sec li{font-size:.9rem;line-height:1.7;color:var(--pr-soft,#4b5563);margin-bottom:.3rem}
.pr-c{width:100%;max-width:76rem;margin:0 auto;padding:0 1rem}
@media (min-width:640px){.pr-c{padding:0 1.5rem}}
@media (min-width:1024px){.pr-c{padding:0 2rem}}
.pr a{color:inherit}

/* Header — mirrors PublicLayout: sticky, 64px, blurred, hairline border. */
.pr-h{position:sticky;top:0;z-index:40;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--bg) 88%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.pr-h .pr-c{display:flex;height:4rem;align-items:center;justify-content:space-between;gap:.75rem}
.pr-b{display:inline-flex;align-items:center;gap:.625rem;border-radius:.5rem;text-decoration:none}
.pr-bt{display:flex;flex-direction:column;line-height:1}
.pr-bn{font-size:17px;font-weight:700;letter-spacing:-.01em;color:var(--text)}
.pr-bn span{color:var(--primary)}
.pr-bs{display:none;margin-top:.25rem;font-size:10px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
@media (min-width:640px){.pr-bs{display:block}}
.pr-n{display:none;align-items:center;gap:.125rem}
@media (min-width:1280px){.pr-n{display:flex}}
.pr-n a{padding:.5rem .75rem;border-radius:.75rem;font-size:.875rem;font-weight:500;color:var(--text-soft);text-decoration:none}
.pr-r{display:flex;align-items:center;gap:.375rem}
.pr-login,.pr-start{display:none;align-items:center;min-height:2.25rem;padding:.375rem .75rem;border-radius:.75rem;font-size:.8125rem;font-weight:600;white-space:nowrap;text-decoration:none}
@media (min-width:640px){.pr-login,.pr-start{display:inline-flex}}
.pr-login{color:var(--text-soft)}
.pr-start{background:var(--primary);color:var(--primary-contrast)}
.pr-mn{display:inline-flex;height:2.5rem;width:2.5rem;align-items:center;justify-content:center;border:0;border-radius:.75rem;background:transparent;color:var(--text-soft)}
@media (min-width:1280px){.pr-mn{display:none}}

/* Hero — same scale and rhythm as the real home page. */
.pr-hero{position:relative;overflow:hidden;background:var(--sage);border-bottom:1px solid var(--border);padding:3rem 0 2.5rem}
.pr-hero-bg{display:none}
.pr-hero .pr-c{position:relative}
@media (min-width:640px){.pr-hero{padding:4rem 0 3rem}}
.pr-badge{display:block;color:var(--muted);font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase}
.pr-badge::before{content:"";display:block;width:2rem;height:2px;margin-bottom:.9rem;background:var(--accent)}
.pr h1{margin:1rem 0 0;font-size:2.6rem;line-height:1.03;letter-spacing:-.03em;font-weight:600;max-width:22ch;color:var(--text);font-family:ui-serif,'Iowan Old Style','Palatino Linotype',Palatino,Georgia,'Times New Roman',serif}
@media (min-width:640px){.pr h1{font-size:3.4rem}}
@media (min-width:1024px){.pr h1{font-size:3.75rem}}
.pr h1 .hl{color:var(--text)}
.pr-ul{position:relative;display:inline-block}
.pr-ul::after{content:"";position:absolute;left:0;right:0;bottom:-.35rem;height:.28rem;border-radius:9999px;background:var(--accent)}
.dark .pr-ul::after{opacity:.85}
.pr-lead{margin:1.5rem 0 0;max-width:36rem;font-size:15px;line-height:1.7;color:var(--text-soft)}
@media (min-width:640px){.pr-lead{font-size:17px}}
.pr-cta{display:flex;flex-direction:column;gap:.625rem;margin-top:1.75rem}
@media (min-width:640px){.pr-cta{flex-direction:row}}
.pr-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;min-height:3.25rem;padding:.75rem 1.5rem;border-radius:.75rem;font-size:1rem;font-weight:600;text-decoration:none}
.pr-btn-p{background:var(--primary);color:var(--primary-contrast)}
.pr-btn-s{background:var(--surface);color:var(--text);border:1px solid var(--border-strong)}
.pr-trust{display:flex;flex-wrap:wrap;gap:.5rem 1.25rem;margin:1.5rem 0 0;padding:0;list-style:none;font-size:13px;color:var(--muted)}
.pr-trust li::before{content:"✓";margin-right:.4rem;color:var(--success);font-weight:700}

/* Inner pages keep a page-title block instead of the hero. */
.pr-ph{padding:3.5rem 0 .5rem}
@media (min-width:640px){.pr-ph{padding:5rem 0 .5rem}}
.pr-eyebrow{margin:1.25rem 0 0;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
.pr-ph h1{font-size:1.5rem;line-height:1.25;letter-spacing:-.01em;max-width:none;margin:.5rem 0 0}
@media (min-width:640px){.pr-ph h1{font-size:1.875rem}}
.pr-ph .pr-lead{margin:1rem 0 0;font-size:15px;max-width:44rem}
@media (min-width:640px){.pr-ph .pr-lead{font-size:16px}}
.pr-ph .pr-cta{margin-top:1.5rem;flex-wrap:wrap}
.pr-ph .pr-btn{min-height:2.75rem;padding:.625rem 1rem;font-size:.875rem;border-radius:.75rem}
.pr-cr{margin:0 0 .75rem;font-size:.75rem;color:var(--muted)}
.pr-cr ol{display:flex;flex-wrap:wrap;gap:.4rem;list-style:none;padding:0;margin:0}
.pr-cr li+li::before{content:"/";margin-right:.4rem;color:var(--border-strong)}
.pr-meta{margin:.75rem 0 0;font-size:.8125rem;color:var(--muted)}
.pr-m{flex:1;padding-bottom:1rem}

/* Sections and lists — quiet, like the app's article pages. */
.pr-s{margin-top:2.5rem}
.pr-s h2{margin:2rem 0 .5rem;font-size:1.125rem;font-weight:700;letter-spacing:-.01em;color:var(--text)}
.pr-s h3{margin:1.25rem 0 .25rem;font-size:.9375rem;font-weight:650;color:var(--text)}
.pr-s p,.pr-s li{font-size:15px;line-height:1.7;color:var(--text-soft)}
.pr-s p{margin:.5rem 0}
.pr-s ul,.pr-s ol{margin:.5rem 0;padding-left:1.15rem;display:grid;gap:.45rem}
.pr-s a{color:var(--primary);text-decoration:underline;text-underline-offset:2px}
.pr-s strong{color:var(--text)}

/* Footer — matches the app footer's band and link rhythm. */
.pr-f{margin-top:4rem;border-top:1px solid var(--border);background:var(--surface);padding:2.5rem 0}
.pr-f nav{display:flex;flex-wrap:wrap;gap:.5rem 1.1rem;margin-bottom:1rem}
.pr-f nav a{font-size:.8125rem;color:var(--text-soft);text-decoration:none}
.pr-f p{margin:.35rem 0;font-size:.75rem;line-height:1.7;color:var(--muted)}
.pr-f a{color:var(--muted)}
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

/**
 * Grade-band copy: the same honest narrative shared by every grade in a stage.
 * Grades 1-5 share one section rather than 5 near-identical paragraphs, which
 * is what makes the pages substantive instead of templated.
 */
function renderGradeBand(grade) {
  const key = grade <= 5 ? '1-5' : grade <= 8 ? '6-8' : grade <= 10 ? '9-10' : '11-12';
  const band = pageContent.gradeBands[key];
  if (!band) return '';
  return `<div class="pr-c pr-body"><section class="pr-sec">
        <h2>${escapeHtml(band.heading)}</h2>
        ${band.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n        ')}
      </section></div>`;
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
/**
 * Render the shared body copy for a marketing page.
 *
 * This is the fix for thin prerendered pages: crawlers used to receive a
 * heading, a one-line description and a footer — about 130 words of chrome.
 * Pages that exist to earn search traffic now carry their real body text in
 * the static HTML, from the same JSON the React app renders, so the crawler
 * and the student read the same words.
 *
 * Deliberately absent for legal and utility routes, which should stay short.
 */
function renderPageContent(pagePath) {
  const entry = pageContent.pages.find((page) => page.path === pagePath);
  if (!entry) return '';
  const sections = entry.sections
    .map(
      (section) => `
      <section class="pr-sec">
        <h2>${escapeHtml(section.heading)}</h2>
        ${section.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n        ')}
        ${
          section.bullets && section.bullets.length
            ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
            : ''
        }
      </section>`,
    )
    .join('');
  return `<div class="pr-c pr-body">${sections}</div>`;
}

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

/**
 * The beginner guide lives in shared/getting-started.json so the page React
 * renders and the HTML a crawler reads are the same words. Without this the
 * route would prerender as a single sentence.
 */
function renderGuideBody() {
  const escape = escapeHtml;
  const sections = GETTING_STARTED.sections
    .map((section) => {
      const paragraphs = (section.paragraphs ?? []).map((text) => `<p>${escape(text)}</p>`).join('');
      const bullets = section.bullets
        ? `<ul>${section.bullets.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>`
        : '';
      const steps = section.steps
        ? `<ol>${section.steps
            .map((step) => `<li><strong>${escape(step.title)}</strong> — ${escape(step.body)}</li>`)
            .join('')}</ol>`
        : '';
      const items = section.items
        ? section.items
            .map((item) => `<h3>${escape(item.question)}</h3><p>${escape(item.answer)}</p>`)
            .join('')
        : '';
      return `<section class="pr-s"><h2>${escape(section.heading)}</h2>${paragraphs}${bullets}${steps}${items}</section>`;
    })
    .join('\n');

  return `<section class="pr-s"><p>${escape(GETTING_STARTED.intro)}</p></section>\n${sections}`;
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

  const isHome = page.path === '/';
  const [firstLine, secondLine] = splitHeadline(h1);

  // The home page gets the same two-line headline treatment as the real hero,
  // so the first paint and the mounted page line up instead of jumping.
  const headline = isHome && secondLine
    ? `${escapeHtml(firstLine)}<br><span class="hl">${escapeHtml(secondLine)}</span>`
    : escapeHtml(h1);

  // The hero text is the app's own copy, verbatim: a first paint that says one
  // thing and a mounted page that says another is the flash being fixed here.
  const HERO_LEAD =
    'Discover better ways to learn, practice with purpose and build the confidence to achieve more.';

  const body = isHome
    ? `<section class="pr-hero">
    <div class="pr-hero-bg" aria-hidden="true"></div>
    <div class="pr-c">
      <span class="pr-badge">Ujyalo Learn · Nepal</span>
      <h1>${headline}</h1>
      <p class="pr-lead">${HERO_LEAD}</p>
      <div class="pr-cta">
        <a class="pr-btn pr-btn-p" href="/app">Start learning</a>
        <a class="pr-btn pr-btn-s" href="/subjects">Explore subjects</a>
      </div>
      <ul class="pr-trust">
        <li>Free to use</li>
        <li>No account needed to browse</li>
        <li>Built for a 360px screen</li>
      </ul>
    </div>
  </section>`
    : `<div class="pr-ph">
    <div class="pr-c">
      ${renderBreadcrumbs(page)}
      ${
        page.kind === 'course' && page.course
          ? `<p class="pr-eyebrow">${escapeHtml(
              [
                page.course.subjectId ? subjectName(page.course.subjectId) : '',
                page.course.gradeMin === page.course.gradeMax
                  ? `Grade ${page.course.gradeMin}`
                  : `Grades ${page.course.gradeMin}–${page.course.gradeMax}`,
              ]
                .filter(Boolean)
                .join(' · '),
            )}</p>`
          : ''
      }
      <h1>${headline}</h1>
      <p class="pr-lead">${escapeHtml(page.description)}</p>
      ${updated}
      <div class="pr-cta">
        <a class="pr-btn pr-btn-p" href="/app">Start learning free</a>
        <a class="pr-btn pr-btn-s" href="/ai-tutor">See how the tutor works</a>
      </div>
    </div>
  </div>`;

  return `<div class="pr">
  <header class="pr-h">
    <div class="pr-c">
      <a class="pr-b" href="/" aria-label="Ujyalo Learn home">
        ${PRERENDER_LOGO}
        <span class="pr-bt">
          <span class="pr-bn">Ujyalo <span>Learn</span></span>
          <span class="pr-bs">Grades 1–12 · Nepal</span>
        </span>
      </a>
      <nav class="pr-n" aria-label="Main">${SITE_NAV.map(
        ([href, label]) => `<a href="${href}">${label}</a>`,
      ).join('')}</nav>
      <div class="pr-r">
        <a class="pr-login" href="/login">Log in</a>
        <a class="pr-start" href="/signup">Start free</a>
        <span class="pr-mn" aria-hidden="true">${PRERENDER_MENU_ICON}</span>
      </div>
    </div>
  </header>
  <main class="pr-m" id="main">
    ${body}
    <div class="pr-c">
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
                  : page.path === '/getting-started'
                    ? renderGuideBody()
                    : ''
    }
    </div>
    ${renderPageContent(page.path)}
    ${page.kind === 'grade' ? renderGradeBand(page.grade) : ''}
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

function subjectName(subjectId) {
  const subject = SUBJECT_NAMES.find((name) => name.toLowerCase().replace(/[^a-z]/g, '') === String(subjectId).replace(/[^a-z]/g, ''));
  return subject ?? (subjectId ? String(subjectId).replace(/-/g, ' ') : '');
}

/** "Smart learning. Brighter future." -> ["Smart learning.", "Brighter future."] */
function splitHeadline(text) {
  const trimmed = text.trim();
  const match = trimmed.match(/^(.+?[.!?])\s+(.+)$/);
  return match ? [match[1], match[2]] : [trimmed, ''];
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
    alternateName: 'Ujyalo Learn — study companion for Grades 1–12 in Nepal',
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

/**
 * Replaces the contents of <div id="root"> with `content`, finding the real
 * closing tag by counting nested <div>s.
 *
 * A non-greedy /<div id="root">[\s\S]*?<\/div>/ stops at the first inner
 * </div>, which silently left the previous page's markup in place and produced
 * two pages in one document when the script ran twice.
 */
function replaceRootContent(html, content) {
  const marker = '<div id="root">';
  const start = html.indexOf(marker);
  if (start === -1) return html.replace('</body>', `  ${marker}${content}</div>\n  </body>`);

  let depth = 1;
  const tagPattern = /<div\b|<!--|<\/div>/gi;
  tagPattern.lastIndex = start + marker.length;
  let match;
  while ((match = tagPattern.exec(html))) {
    if (match[0] === '<div' || match[0].toLowerCase() === '<div') depth += 1;
    else if (match[0] === '</div>') depth -= 1;
    // A comment could hide a </div>; skip to the end of it.
    if (match[0] === '<!--') {
      const end = html.indexOf('-->', match.index);
      if (end !== -1) tagPattern.lastIndex = end + 3;
      continue;
    }
    if (depth === 0) {
      return `${html.slice(0, start)}${marker}${content}</div>${html.slice(match.index + '</div>'.length)}`;
    }
  }
  throw new Error('replaceRootContent: unbalanced #root markup');
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
  // Strip blocks a previous run injected, so re-running is safe.
  html = html
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '')
    .replace(/<style data-prerender>[\s\S]*?<\/style>\n?/g, '');
  html = html.replace('</head>', `${ldTags}\n  </head>`);

  // Visible static content inside #root. React clears the container on mount,
  // so this is what a JS-less crawler reads and what a visitor sees for the
  // first few hundred milliseconds.
  const staticContent = renderStaticContent(page);
  html = replaceRootContent(html, staticContent);

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

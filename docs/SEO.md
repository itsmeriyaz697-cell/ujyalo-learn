# Search engine setup (Google + Bing)

This project ships everything a crawler needs: static HTML per route, per-page
canonical URLs, JSON-LD, a real `sitemap.xml` and a `robots.txt` that keeps
private areas out. What it cannot do by itself is tell Google that *you* own the
domain — that is the one step only the owner can complete.

Status of that step: the **verification file is in place** and deployed. The
owner still has to press **Verify** in Search Console and submit the sitemap
(steps 2 and 3 below). Nothing is indexed until Google crawls the site; a
sitemap is a request to crawl, not a promise.

---

## 1. Google Search Console

### 1a. The verification file (already done)

```
public/googlec3d881d4bf552040.html
```

Contents (53 bytes, no trailing newline):

```
google-site-verification: googlec3d881d4bf552040.html
```

Why it lives in `public/`:

- Vite copies `public/**` to the site root, so it is served at
  `https://ujyalo-learn.vercel.app/googlec3d881d4bf552040.html`.
- Google fetches exactly that URL and compares the body byte-for-byte. Do not
  reformat it, add a newline, wrap it in HTML, or rename it — either of those
  breaks verification with a confusing "content mismatch" error.
- A unit test (`tests/seo-verification.test.ts`) fails the suite if the file is
  missing, renamed, or edited, so a future refactor cannot silently delete it.

**Never delete this file**, even after verification succeeds. Google re-checks it
periodically; if it 404s, Search Console can drop the property.

To confirm it is live:

```bash
curl -s https://ujyalo-learn.vercel.app/googlec3d881d4bf552040.html
# google-site-verification: googlec3d881d4bf552040.html
```

It must return `200` and `text/html`.

### 1b. Press Verify

1. Open <https://search.google.com/search-console>.
2. Add property → **URL prefix** → `https://ujyalo-learn.vercel.app/`
   (a *Domain* property instead requires DNS access; URL prefix is enough here
   and works with the HTML file).
3. Choose **HTML file** as the verification method, confirm the filename shown
   matches `googlec3d881d4bf552040.html`, and press **Verify**.

If it fails: check the URL above returns 200 (not a 404 and not the SPA shell),
and that your deploy of this commit is the one aliased to the production domain.

### 1c. Submit the sitemap

Search Console → **Sitemaps** → enter `sitemap.xml` → Submit.

The build writes `dist/sitemap.xml` from `shared/seo-pages.json` plus the twelve
grade hubs and every published course/guide — currently **41 URLs**. It is only
generated when `VITE_SITE_URL` is a valid URL, so it will never contain an
invented domain.

### 1d. After that

- **URL Inspection** → paste a page → *Request indexing* for the handful of
  pages that matter most (home, courses, SEE preparation). Do not request
  hundreds; there is a quota and it is not necessary.
- Check **Pages** weekly for "Crawled – currently not indexed" and
  "Discovered – currently not indexed". Those mean the content is too thin or
  too new, not that the sitemap is broken.
- Watch **Core Web Vitals** once you have real traffic.
- Expect days to weeks before meaningful impressions. Nothing here guarantees
  ranking.

---

## 2. Bing Webmaster Tools

1. Open <https://www.bing.com/webmasters>.
2. Sign in and choose **Import from Google Search Console** — this copies the
   verification and the sitemap in one step.
3. Without that, add the site and use the same HTML file method (Bing also
   accepts it) or a DNS TXT record.

Bing is worth doing separately from Google: it also feeds **ChatGPT search and
Copilot**, which is how a large share of "explain this topic" queries now start.

### 2a. Submit URLs by hand (the 100-a-day quota)

Bing's **Submit URLs** box is rate-limited per site — 100 in a day is typical for
a new domain. The site has **41 indexable URLs**, so one paste uses 41 of 100.

The list is in **`docs/urls-to-submit.txt`**: one bare URL per line, no headers,
no comments, no blank lines. Paste the whole file into the box, submit, done.

Order is deliberate — the home page and `/see-preparation` first, then the library hubs, then
courses, guides and grade hubs. If your quota is ever smaller than the list, the
pages most likely to earn traffic are the ones that get through.

`docs/urls-to-submit.txt` is generated from the live sitemap and a test keeps it
honest: 41 entries, no duplicates, absolute `https` on the production domain.

### 2b. Submit with the API instead (no clicking)

Bing's URL Submission API skips the web form entirely and returns a real error
when something is wrong:

```bash
# 1. Bing Webmaster Tools -> Settings -> API Access -> Generate
export BING_WEBMASTER_API_KEY=xxxxxxxx

# 2. See exactly what would be sent, without sending anything
npm run urls:print

# 3. Send it
npm run submit:bing
```

The script (`scripts/submit-urls.mjs`):

- reads `sitemap.xml` **live**, so it can never submit a URL the site no longer
  publishes, and picks up new courses as soon as they ship;
- calls `GetUrlSubmissionQuota` first and trims the list to whatever is left
  today, instead of failing at the last URL;
- batches at 500 per request (Bing's cap) with a JSON body and
  `Content-Type: application/json; charset=utf-8` — the header this API rejects
  requests without;
- exits non-zero on the first failed batch so CI or a cron job notices.

Use the key from the environment. It is per-user and valid for every verified
site, so it is effectively an account credential: do not commit it, and
regenerating it breaks anything still using the old one.

### 2c. What submission does and does not do

It **queues a crawl**. It does not index anything, guarantee a ranking, or make
new pages appear in a day. A page that gets submitted still has to be worth
crawling: unique content, a real title, links from other pages, and no
`noindex`. If a page is submitted and stays "Discovered – not indexed" for weeks,
the problem is the content, not the submission. `docs/ROADMAP.md` tracks the
content work that actually moves this.

---

## 3. What is already handled in code

| Requirement | Where |
| --- | --- |
| Unique title + description per indexable page | `shared/seo-pages.json` → `scripts/generate-seo.mjs` |
| Static HTML for each public route (no JS needed) | same script, `dist/<route>/index.html` |
| Canonical + `og:url` on the production domain | generated only when `VITE_SITE_URL` is set |
| Open Graph / Twitter cards, 1200×630 image | `public/og-image.png` |
| Structured data: Organization, WebSite, FAQPage, BreadcrumbList | `scripts/generate-seo.mjs` |
| `sitemap.xml` — public content only | build output |
| `robots.txt` — disallows `/app`, `/api`, auth screens | build output |
| Real 404 status for unknown URLs (no soft 404) | `public/404.html`, `vercel.json` |
| Private routes marked noindex | `src/components/seo/Seo.tsx` + `vercel.json` headers |
| `/privacy-policy` → `/privacy` permanent redirect (no duplicate URL) | `vercel.json` |
| Drafts excluded from the sitemap and from crawling | `src/features/content/*`, build script |

### Checks you can run yourself

```bash
# Title, canonical and description per route
curl -s https://ujyalo-learn.vercel.app/courses | grep -E '<title>|canonical|description'

# Structured data parses and lists the right types
curl -s https://ujyalo-learn.vercel.app/ | \
  python3 -c "import sys,re,json; h=sys.stdin.read(); \
  print([x['@type'] for x in json.loads(re.search(r'ld\+json\">(.*?)</script>', h, re.S).group(1))])"

# Sitemap size and robots rules
curl -s https://ujyalo-learn.vercel.app/sitemap.xml | grep -c '<url>'
curl -s https://ujyalo-learn.vercel.app/robots.txt

# Unknown URLs must be a real 404, not a 200 page
curl -s -o /dev/null -w '%{http_code}\n' https://ujyalo-learn.vercel.app/no-such-page
```

---

## 4. Analytics (not installed)

There is **no** analytics or tracking script on this site. When one is added it
must respect consent (no cookies before opt-in for EU visitors), and the privacy
policy must be updated in the same change. `docs/ROADMAP.md` tracks this.

The sitemap existing does not mean the site is indexed, ranked, or visited.
Those depend on content quality, competition and time.

---

## 5. Third-party audit flags

Automated site checkers sometimes report **"no CDN active"** for this site. That
is a false positive: the site is served by Vercel's global edge network. The
response headers prove it:

```
server: Vercel
x-vercel-cache: HIT        # served from an edge cache, not origin
x-vercel-id: pdx1::...      # which edge region answered
age: 605                    # seconds since this object was cached
cache-control: public, max-age=31536000, immutable   # on /assets/*
content-encoding: br        # Brotli, negotiated per client
```

Checkers that only recognise CNAME-based CDNs (Cloudflare, Akamai, Fastly) cannot
see this, because Vercel terminates TLS on anycast IPs rather than behind a
customer CNAME. There is nothing to "enable", and adding a second CDN in front of
Vercel would add a hop and break its cache.

If a checker insists, the only defensible next step is a custom domain with your
own DNS — the CDN is already there either way.

### What a checker cannot see, and what it can

| Claim | Reality |
| --- | --- |
| "CDN not active" | False — see headers above |
| "JavaScript required" | True for the app, but all 41 public routes ship real prerendered HTML |
| "Could not verify sitemap/robots/privacy" | Limits of the tool, not the site — all return 200 |
| "Add security headers" | Six are set; CSP was missing and is now added |

---

## 6. Prerendering, and why the audits were wrong about it

The site is a React SPA, but every public route is also written as a static HTML
file at build time. Until recently that static file contained only head tags and
an empty `<div id="root">`, so any crawler that does not execute JavaScript —
including the ones GPTBot, ClaudeBot and PerplexityBot use — saw almost nothing.

That is why automated audits reported "missing H1", "no footer", "no privacy
policy link", "no breadcrumb", "no call to action" and "low semantic HTML". None
of those were true in a browser; all of them were true of the HTML.

Each route now ships a **visible** content skeleton inside `#root`:

- the same `<h1>` the app renders (taken from `shared/seo-pages.json`);
- the meta description as a direct answer paragraph;
- breadcrumb navigation, matching the BreadcrumbList JSON-LD;
- a real `<header>`, `<main>` and `<footer>` with 15 site links;
- a call to action to `/signup` and `/ai-tutor`;
- `<time>` and licence for study guides.

React replaces the skeleton on mount, so nothing here is hidden from readers and
nothing is missing from the app. It is a preview, not a second version of the page.

### Guardrails

| Check | Catches |
| --- | --- |
| `npm run check:prerender` (runs on every build) | Any route whose static HTML loses its H1, breadcrumb, footer, privacy/contact links, CTA, JSON-LD `@type`, or has a description over 160 characters |
| `npm run test:ui` → "crawler without JavaScript" | The same, read through a real browser with JS disabled |
| `check-prerender.mjs` → llms.txt | Links to pages that are not in the sitemap |

### Limits worth knowing

- The skeleton is a summary. Real educational depth (lesson bodies, guide text)
  is rendered by React and is not in the static HTML.
- Study guides and courses published later through `/admin` are served by the SPA
  and are **not** prerendered until the next deploy that includes them in
  `shared/content-seed.json`. Their titles and descriptions still come from
  Firebase at runtime for people.

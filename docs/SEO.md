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

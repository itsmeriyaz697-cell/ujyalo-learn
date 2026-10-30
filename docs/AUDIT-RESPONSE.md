# Audit response — 30 October 2026

The audit at `/uploads/Ujyalo_Learn__SEO,_GEO,_product_and_marketing_audi.md` rated the
site 6/10 and asked for reliability before any marketing push. This file records what
changed, how each claim was checked, and what is still open. Everything marked **fixed**
was verified against `https://ujyalo-learn.vercel.app` in a real browser, not just locally.

## P0 — reliability and the guest journey

| # | Audit finding | State | Evidence |
|---|---|---|---|
| 1 | `/courses` and `/resources` showed a load error and an empty list while detail pages were live | **Fixed** | Both collections have no composite index and no documents, so the `orderBy` query failed. The store now reads without `orderBy`, sorts in memory, and falls back to the bundled starter library when the database is empty. The failure banner appears only when nothing can be listed at all. Live: `/courses` renders 7 detail links, `/resources` 6, no banner. |
| 2 | A five-question quiz served four, and the timer did not match | **Fixed** | The bank held four questions per category and `startPractice` clamped to `Math.min(length, 4)`. The clamp is gone, the bank holds 144 questions across all 15 categories (minimum eight each), and the timer is `delivered questions × 45 s`. When a category genuinely cannot fill the round, the page says so next to "Question n of N". Live: `category=mathematics&length=5` → "Question 1 of 5"; `astronomy&length=10` → "Question 1 of 8" plus the notice. |
| 3 | Help, SEE, FAQ and Arena copy contradicted each other | **Fixed** | Help now offers the guest tutor first; the SEE page names the three published SEE courses instead of saying none exist; the Arena hero describes practice mode rather than a world leaderboard; the FAQ explains the arena and privacy in the same words the Arena page uses. |
| 4 | Privacy wording did not match what the arena actually does | **Fixed** | The FAQ, the Arena home panel and the privacy policy now describe the same thing: the leaderboard is the only public surface, it shows a chosen username, a country flag and scores, never a real name or an email, and demo mode keeps scores in the browser. |
| 5 | Missing nested slugs returned 200 with an app shell | **Fixed** | The two catch-all rewrites in `vercel.json` were removed (17 → 15). Live: `/courses/no-such-course-98765` and `/resources/no-such-guide-98765` both return **404**. |

## P1 — search, sources and citeability

- **Home title and message** — **fixed**. Title is now "Ujyalo Learn — Free study help and
  SEE prep for Grades 1–12 in Nepal" and the hero badge says "Free study help · Grades 1–12 · SEE".
  The H1 stays as the brand line; the concrete promise sits directly under it.
- **Sitemap freshness** — **fixed**. `generate-seo.mjs` stamps `lastmod` per page from the
  course or resource `updatedAt`, or from a hand-set date in `shared/seo-pages.json`, and omits
  it when no real date exists. The build emits 14 `<lastmod>` values out of 44 URLs instead of
  one build-date stamp on all of them.
- **Arena search snippet** — **fixed**. `/global-quiz` is titled "Free practice quizzes for
  school subjects" with a 133-character description; no leaderboard promise.
- **Primary sources for SEE material** — **partly fixed**. `/see-preparation` links the
  Curriculum Development Centre and the National Examination Board with the date checked
  (30 October 2026) and says plainly what the hub does not publish. Claim-level sources for
  study-science advice are still to do.
- **Grade 9 hub parity** — **open**. Grade 10 lists subjects and courses; Grade 9 is thinner.
- **Named author and reviewer** — **open**. Nothing invented; it needs a real teacher reviewer.
- **Search Console and Bing Webmaster Tools** — **open**. Needs the owner's account.

## What changed in the code

`src/features/content/firestoreContentStore.ts` · `ContentProvider.tsx` ·
`src/features/arena/practiceBank.ts` · `localArena.ts` · `ArenaPlayPage.tsx` ·
`ArenaHomePage.tsx` · `CoursesPage.tsx` · `ResourcesPage.tsx` · `HelpPage.tsx` ·
`FaqPage.tsx` · `SeePrepPage.tsx` · `HomePage.tsx` · `vercel.json` ·
`shared/seo-pages.json` · `scripts/generate-seo.mjs` · `scripts/ui-smoke.mjs` ·
`tests/practiceBank.test.ts` (new).

## Gates at the time of writing

`typecheck` 0 errors · `lint` 0 errors (37 pre-existing warnings) · `vitest` 251 passing ·
`build` 44 prerendered routes, 0 broken internal links · `a11y` 0 violations across 20
page checks · `verify-navigation` 38/38 · `ui-smoke` 73/73 in demo mode ·
`check:opportunities` and `check:secrets` clean.

`ui-smoke` now refuses to run when a real Firebase project is configured: it signs a
throwaway account up through the UI, which would both create a live Auth user and fail the
admin checks for the right reason on the wrong environment. Run it with `.env.local` moved
aside.

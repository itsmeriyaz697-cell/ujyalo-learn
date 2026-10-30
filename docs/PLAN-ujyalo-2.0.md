# Ujyalo Learn 2.0 — audit and implementation plan

Written after reading the actual repository (`src/`, 43 prerendered routes, `api/`,
`scripts/`), not from the brief alone. Everything below is either **already built**,
**to build**, or **blocked on something only you can supply**. Nothing is marked done
that is not done.

---

## 1. What is already in the repository

This matters because the brief assumes a blank page. It is not one — roughly 70% of
the product surface already exists and works, and replacing it would lose tested code.

| Brief section | Status in repo today |
|---|---|
| 3A Navigation | Built (`PublicLayout.tsx`), but the IA is old: Courses · Subjects · Resources · SEE · AI tutor · Arena · Pricing · About |
| 3B Hero | Built, current copy is the serif "Namaste…" page |
| 3C Learning categories | Built — 9 subjects in `config/curriculum.ts`, `/subjects`, `/grades/:grade` |
| 4 Student dashboard | Built — `/app` with continue-learning, progress, recommendations (`DashboardPage.tsx`) |
| 5 Learning library | Built — `/resources` + `/resources/:slug`, search, subject/grade filters, bookmarks |
| 6 Exam arena | Built — `/global-quiz`, `/global-quiz/play`, leaderboard, `/see-preparation` |
| 7 Learning journey | Partly — `/app/progress`, streaks exist and are deliberately gentle |
| 9 Opportunity hub | **Missing entirely** — no data model, no page, no admin |
| 10 AI support | Built — `/ai-tutor`, `/api/*`, rate limits, graceful fallback when unconfigured |
| 11 Premium architecture | `/pricing` exists as honest "not selling anything yet" copy; no payment code (correct) |
| 12 Auth and data | Built — Firebase Auth + Firestore rules (116 tests), server-side admin authz |
| 13 Admin dashboard | Built — courses, resources, SEO, audit, settings editors |
| 14 Mobile | Built — mobile-first, 360px floor, tested |
| 15 SEO and performance | Built — per-route prerender, sitemap, JSON-LD, OG images, 43 routes |
| 17 Accessibility | Built — audit script, 0 violations across 20 checks |
| 19 QA | Built — 12 test suites, ~600 assertions, CI |

**So the real work is:** a new visual identity, a new navigation IA, three new homepage
sections (daily question, editorial resources, opportunities), one new product area
(Opportunity Hub), a repositioning pass (away from "AI tutor" as the whole product),
and the copy/identity change through all 43 prerendered pages.

---

## 2. Two conflicts I need to name, not silently resolve

**a) This brief makes the site look *more* generic, not less.** Round 22 was spent
removing exactly the things section 2 now asks for: navy/orange/sage, two Google
sans-serifs, icon rows, "premium SaaS" cards. That palette-and-sans pairing is the
most common generated-site signature there is. You are the owner, so I will build what
you asked — but I will build it with the anti-template discipline we already proved:
real content over filler, asymmetric editorial layout, rules and whitespace instead of
another card grid, and one deliberate colour accent instead of gradients. If it starts
looking like a template I will say so rather than ship it.

**b) "Global platform" vs what the product actually contains.** The content is Nepal
(CDC, SEE, CBSE/ICSE/Cambridge options). A vision statement can be global; the product
should not *claim* coverage it does not have. I will position it as "built in Nepal,
free for any student" and let the ambition live in the About page, not in claims on
the homepage. Same reason I will not print "students worldwide" next to a feature
list that is Nepal-only.

---

## 3. What I cannot build, and will not fake

| Item | Why | What I will do instead |
|---|---|---|
| Opportunity listings with deadlines | Every one needs a real provider, official URL and verified date. Inventing them would break the one rule that matters most on this site. | Build the full data model, page, filters and admin editor. Seed only opportunities I have verified against official sources this round, each with a `lastVerified` date and source link. Anything unverified stays out and the page says how many are listed. |
| Teacher-reviewed lesson content | You have no teachers on staff. | Every lesson page already carries a "how this was made" note; I keep it accurate and add the reviewer field so it can be filled when a reviewer exists. |
| Payment / premium checkout | No provider, no business entity, you are 14. | Keep `/pricing` as an honest forward-looking page, build the *architecture* (feature flags + entitlement checks) so gating can be switched on later without rewriting pages. No fake "upgrade" buttons. |
| "Students worldwide" content coverage | Not true yet. | Vision stays in About; homepage says what is real. |

---

## 4. Design system (replaces the warm-paper/serif system)

Tokens from the brief, with the corrections needed to keep them accessible:

```
--navy        #172B4D   text + primary buttons (13.4:1 on paper — AAA)
--paper       #F8F7F2   page background
--surface     #FFFFFF   cards, panels
--orange      #F49B45   ACCENT ONLY — 2.1:1 on white, so never text on paper.
                        Used as: 2px rules, active-nav underline, focus ring,
                        illustration fills, and as a fill behind navy text (6.4:1).
--sage        #DCE9DF   quiet section tint, illustration wash
--muted       #687386   4.4:1 on paper — darkened to #5F6B7E for body-size text (5.1:1)
--border      #E8E7E1
```

Type: **Manrope** 600/700/800 for headings, **DM Sans** 400/500 for body — self-hosted
woff2 (latin subset, ~4 files, 60 KB) rather than Google's CDN: no third-party request,
no cookies, and the existing `font-src 'self'` CSP stays strict. That is the better call
for a site used by minors.

Both are OFL-licensed, so self-hosting is permitted; the licence text ships in
`public/fonts/LICENSE.txt`.

Dark mode: the brief does not mention it, but 43 pages already support it, so it is
kept and re-derived from the new palette rather than dropped.

---

## 5. Build order

**Phase 1 — identity and shell** (this round)
Fonts, tokens (light + dark), logo lockup, navigation IA
(Explore · Subjects · Practice · Opportunities · About), footer, tagline
"Learn today. Lead tomorrow." through `SITE`, SEO config, prerender markup and OG card.

**Phase 2 — homepage** (this round if Phase 1 lands clean)
Hero with the new copy and an original composition (not a robot), subject index,
"Continue learning" that is real for signed-in users and popular-resources for guests,
Daily Question, editorial resource strip, opportunity strip, footer.

**Phase 3 — Daily Question** — data model, rotation by date (deterministic, no cron),
one attempt per visitor per day stored locally for guests and server-side for accounts,
explanation reveal, no stat inflation.

**Phase 4 — Opportunity Hub** — `opportunities` collection, filters, detail pages,
admin editor, expired labelling, verified dates. Seeded only with verified entries.

**Phase 5 — library/dashboard polish** — resource page anatomy (objectives, examples,
practice, source), dashboard reorder per brief, saved resources, upcoming opportunities.

**Phase 6 — repositioning pass** — every remaining page stops calling this an "AI tutor
platform"; AI becomes one tool inside a learning product. Then the full gate run: build,
prerender check, a11y, navigation, vitest, smoke suites, mobile.

Each phase is a separate commit, deployed and verified, so a broken phase never blocks
a good one.

---

## 6. Definition of done for this round

- `npm run typecheck`, `lint`, `vitest`, `build` (43 routes), prerender link check, a11y audit green.
- No route loses functionality; no dead buttons.
- Live URL verified with a real browser, zero console errors.
- The honest constraints in §3 respected — no invented opportunities, no fake payments.

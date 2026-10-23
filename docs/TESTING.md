# Testing report

Last run: **2026-10-22**, local Linux sandbox, Node 20.20.2, Chromium 130 (Playwright 1.47.2).

Everything below was executed. Anything that needs real credentials is listed separately under **Awaiting configuration** — it has not been claimed as working.

---

## 1. Summary

| Suite | Command | Result |
| --- | --- | --- |
| Unit / integration logic | `npm test` | **100 / 100 passed** |
| API integration (real handlers + mock provider) | `npm run smoke:api` | **20 / 20 passed** |
| Browser UI, demo mode, mobile, a11y, library and admin | `npm run test:ui` | **67 / 67 passed** |
| Browser UI with AI enabled | `npm run test:ai` | **18 / 18 passed** |
| Type check | `npm run typecheck` | clean |
| Production build | `npm run build` | success |
| Secret scan | `npm run check:secrets` | 125 files scanned, 0 findings |
| Bundle scan | `npm run check:bundle` | 137 files, 3.08 MB, 0 findings |

The build output includes nine public pages, all app routes, and the SEO generator (sitemap skipped because `VITE_SITE_URL` is unset, as designed).

---

## 2. Unit tests (`tests/`)

| File | Covers |
| --- | --- |
| `quiz.test.ts` | Answer normalisation (case, punctuation, articles, numeric formats, accepted variants), `scoreQuiz`, `buildAttempt`, empty quizzes |
| `streak.test.ts` | Empty history, today/yesterday continuation, broken streaks, duplicate days, longest run |
| `schemas.test.ts` | Tutor + quiz request validation, limits, unknown modes, JSON extraction from fenced blocks, quiz repair (letter answers, true/false variants, ids), rejection of invalid options, question caps |
| `parser.test.ts` | SSE buffering, CRLF, multi-line data, deltas/notices/done/errors, malformed payloads |
| `planner.test.ts` | Recommendations by goal and by subject, ignoring completed goals, overdue rescheduling, upcoming window, date filtering, goal progress |
| `progress.test.ts` | Subject aggregation, “no judgement from one quiz”, strengths/focus thresholds, zero-filled activity window, sparkline path |
| `rateLimit.test.ts` | Per-minute window, blocking + retry seconds, recovery, daily cap across windows, UTC rollover, key separation |
| `api-config.test.ts` | Missing key/model, host allowlist (SSRF), http rejection, credential/query rejection, custom allowlist, numeric clamping, admin allowlist |
| `prompts.test.ts` | Honesty rules present, context adaptation, all 7 modes genuinely different, Nepali enforcement, tool sections, strict quiz JSON, flashcard notes injection |

---

## 3. API integration (`npm run smoke:api`)

Starts a mock OpenAI-compatible provider plus three real API instances, then verifies:

1. health reports configured and never exposes the key
2. non-streaming tutor returns text
3. streaming tutor emits `delta` events
4. stream ends with `done`
5. streamed content is present
6. invalid mode → 400
7. empty conversation → 400
8. conversation must end with a student message → 400
9. oversized body → 413
10. quiz returns validated questions
11. every question has answer, explanation and a matching option
12. invalid quiz count → 400
13. flashcards returns the requested number of cards
14. study tool streams a response
15. provider failure → structured, key-free error
16. rate limit → 429 with `Retry-After`
17. `AI_REQUIRE_AUTH=true` without verifier → fail closed 503
18. unauthenticated use allowed when auth is optional
19. `GET /api/tutor` → 405
20. no test leaked the provider key

---

## 4. Browser tests, demo mode (`npm run test:ui`)

Public pages (`/`, features, subjects, pricing, help, about, contact, privacy, terms), founder credit, 404, protected-route redirect, sign-up, seven-step onboarding, dashboard greeting and demo-mode notice, empty states, tutor “AI not configured” (and an explicit assertion that **no answer is fabricated**), note create/search/filter-empty/reload-persistence/delete, planner reminders notice and task creation, progress honesty, quiz generator unavailable state, tools list, flashcards empty state, settings account + storage explanation, theme toggle, mobile 375 px overflow, skip link, and zero uncaught/console errors.

**Bugs found and fixed during this round:**

- **Deep links bounced to the dashboard.** Reloading `/app/notes`, `/app/tutor` or `/app/settings` flashed onboarding and landed on `/app`. Cause: `profileLoading` was `false` for one render after sign-in restored, so `RequireAuth` saw “user without profile”. Fixed by deriving `profileLoading` from the uid whose profile has loaded (`AuthProvider`).
- **Mobile dashboard overflowed by 4 px.** Grid children defaulted to `min-width: auto`. Fixed with `min-w-0` on the dashboard grid columns.
- **Send did nothing on a new conversation.** `ensureConversation` navigated to `/app/tutor/:id` before the optimistic messages were set, so the loader for the new route wiped them. Fixed with a `justCreatedConversation` ref that skips the redundant load.
- **Dark-mode danger button.** White text on `--danger` (#ffb4ab) was unreadable; fixed with a dark-mode text colour.

---

## 5. Browser tests with AI enabled (`npm run test:ai`)

`npm run test:ui` must run against a server with **no** AI key (it asserts the honest “not configured” state); this suite runs against a server wired to `scripts/mock-provider.mjs`, so the full chain (browser → `/api/tutor` → provider adapter → SSE → UI) is exercised without a paid key:

- account + onboarding
- the “AI not configured” warning disappears once the provider is set
- tutor streams a real answer, renders KaTeX (not raw LaTeX), shows the AI disclaimer
- saving an answer to notes works and the note is listed
- conversation rename persists
- quiz generation navigates into the quiz, shows one question at a time, hides answers
- answering all five questions scores the attempt and shows explanations
- flashcard deck generation and listing
- the tools index links to real tool routes, and the revision-summary tool generates content
- progress page reflects the recorded attempt and keeps “estimates / never mastery” wording
- no uncaught page errors

Screenshots for both runs are in [`docs/screenshots`](./screenshots) (01–18).

---

## 6. Manual checks performed

- All app routes return the SPA shell with HTTP 200 over the dev server.
- `/api/health` through the Vite proxy returns `{ ok, configured, authRequired, limits }`.
- Deep-link reloads for `/app/notes`, `/app/tutor`, `/app/settings`.
- 375 px viewport: home and dashboard with no horizontal scroll.
- Dark mode across dashboard and settings.
- Keyboard: first Tab reaches the skip link, ⌘K / Ctrl-K opens site search.

### Production (https://ujyalo-learn.vercel.app)

| Check | Result |
| --- | --- |
| Nine public routes return their own prerendered `<title>` and description | ✅ |
| `<link rel="canonical">` and `og:url` are absolute and per-route | ✅ |
| JSON-LD parses: `EducationalOrganization`, `WebSite`, `FAQPage`, `BreadcrumbList` | ✅ |
| `sitemap.xml` lists 9 URLs, `robots.txt` disallows `/app`, `/api` and auth screens | ✅ |
| Unknown URL returns a real **404** with a branded page (no soft-404) | ✅ |
| `/app/*`, `/login`, `/signup`, `/onboarding` rewrite to the SPA shell with 200 | ✅ |
| `/api/health` responds (`configured:false` until `AI_API_KEY` is added) | ✅ |
| Full browser suite against production, `BASE_URL=https://ujyalo-learn.vercel.app npm run test:ui` | ✅ 42/42 |
| `/og-image.png` serves 1200×630 at an absolute URL | ✅ |

---

## 7. Awaiting configuration (not tested — not claimed as working)

| # | Flow | Why it cannot run here |
| --- | --- | --- |
| 1 | Google sign-in | Needs a real OAuth client + authorised domain |
| 2 | Email verification link | Needs Firebase Auth + a real inbox |
| 3 | Password reset email | Same |
| 4 | Firestore reads/writes with rules | Needs a Firebase project; tested only against local demo storage |
| 5 | Cross-user access denial | Needs two live accounts |
| 6 | Real AI provider (OpenAI/Groq/Gemini) | No key in this environment; mock provider used instead |
| 7 | Custom domain + DNS | Deployed to `ujyalo-learn.vercel.app`; a custom domain needs the owner’s registrar |
| 8 | PWA install + offline shell on a device | Needs a real browser/device |
| 9 | Screen-reader pass | Needs NVDA/VoiceOver |

---

## 8. How to reproduce

```bash
npm install
npm test                      # unit
npm run smoke:api             # API against the mock provider
npm run dev                   # terminal 1

# terminal 2
npx playwright install chromium   # once; Playwright is a dev dependency
npm run test:ui

# AI-enabled run (terminal 1 restarted with a provider):
AI_API_KEY=mock-key-for-local-testing \
AI_API_BASE_URL=http://127.0.0.1:9099/v1 \
AI_MODEL=mock-model AI_DEV_ALLOW_INSECURE=true AI_ALLOWED_HOSTS=127.0.0.1 \
npm run dev
npm run mock:provider          # terminal 3
npm run test:ai
```

The browser tests write screenshots to `docs/screenshots`.

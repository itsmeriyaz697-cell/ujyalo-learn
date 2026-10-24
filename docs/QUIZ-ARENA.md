# Global Quiz Arena — how it works and how to turn it on

**Status as of 24 October 2026: deployed and live at
<https://ujyalo-learn.vercel.app/global-quiz>.** Everything works today except
one thing — saving scores — which needs a single environment variable only you
can add. Until then the page runs its labelled demo mode. Section 4.

---

## 1. What is built and working

| Piece | State |
| --- | --- |
| `/global-quiz` page with the dashboard, categories, scoring table, badges, rules | Built, styled, dark mode, mobile |
| 15 categories, 3 difficulties, 5/10/20-question quizzes | Working |
| Quiz play: one question at a time, progress bar, countdown, keyboard 1–4 | Working |
| Results: score, points itemised, every answer explained, answers frozen | Working |
| Server-side scoring, replay protection, timing checks, rate limiting | **Tested — 45/45 against the Firestore emulator** |
| Leaderboards: global, Nepal, weekly, pagination, "your rank" | Working against real data |
| Profiles: username, flag, ranks, accuracy, streak, badges | Working; no email or account id anywhere |
| Practice mode with no account | Working, clearly labelled |
| Demo mode when no database is configured | Working, clearly labelled |
| Firestore rules closing the Arena to every browser | **Tested — 22 new assertions** |
| SEO: title, description, canonical, OG, sitemap, prerendered HTML | Built (43 public routes now) |

**Live now, scoring off until one variable is added.** The page is on the real
site and plays a real quiz start to finish; the results screen appears, the
explanations appear, the leaderboard is honest about being empty. What does not
happen yet is a *saved* score, because the API has no database credentials.
That is section 4, and it is one variable.

---

## 2. The one design decision that matters

**Scores are decided by the server, never by the browser.**

That is not a detail. A leaderboard where points live in the client is not a
leaderboard, it is a suggestion — anyone can open dev tools and give themselves
a million. So:

- The **315 ranked questions live in `api/_lib/arena/bank.ts`**, which is server-only.
  They are never bundled into the site.
- When a quiz starts, the API sends the questions and options but **not the
  answer key**. You can inspect the network tab and learn nothing useful.
- When you submit, the API looks up its own copy of the answers, scores them,
  writes your points in a transaction, and returns the verdict.
- Submitting the same quiz twice returns the first result and awards **nothing**.
- A submission faster than two seconds per question is **refused**, not scored.
- No browser can read or write any `arena*` collection — the rules deny
  everything, because only the Admin SDK writes there.

There is a second, smaller question set in
`src/features/arena/practiceBank.ts` that *does* ship to the browser, because
practice has to work with no account and no server round-trip. It is separate on
purpose: it is never used for ranked play, so its answers being visible costs
nothing.

### Questions are written by hand, not generated

The AI tutor elsewhere on the site is labelled as AI content because AI can be
wrong. A leaderboard cannot be built on answers that might be wrong, so all 315
questions were written and checked individually, each with one answer key and an
explanation. If you add questions, add them to the server bank and check them
yourself — do not generate them.

---

## 3. Scoring, streaks and weeks

| Achievement | Points |
| --- | --- |
| Correct easy answer | +5 |
| Correct medium answer | +10 |
| Correct hard answer | +15 |
| Complete a quiz | +5 |
| Perfect score | +20 |
| 7-day streak | +25 |

- Wrong answers score **zero**. Nothing is ever subtracted.
- A perfect score needs every question answered *and* correct, so skipping the
  hard ones cannot buy the bonus.
- The streak bonus lands every seventh **consecutive** day (7, 14, 21…), not
  only on day seven.
- Playing twice in one day never advances or breaks a streak.
- **Days and weeks follow Nepal time (UTC+05:45).** A student revising at 1am
  counts for the day they are actually awake.
- Weekly points sit in their own bucket and reset every Monday at midnight,
  Nepal time. **Lifetime points are never reset.**

Points are chosen so a 20-question hard quiz done perfectly is worth 300 from
answers + 5 + 20 = **325**, while a 5-question easy quiz is worth at most
25 + 5 + 20 = **50**. Long quizzes are worth more, which is the point.

---

## 4. What you must do to switch it on

**Nothing below can be done for you. It needs your accounts and your consent.**

### 4.1 Create the service account (5 minutes)

You need to add **one** variable: `FIREBASE_SERVICE_ACCOUNT`. You do **not** need
`FIREBASE_PROJECT_ID` or `FIREBASE_WEB_API_KEY` for the Arena — the project id is
read out of the key file itself. (Those two are worth adding separately for a
different reason; see section 6, "one unrelated gap".)

The API writes with Admin credentials. It needs a private key, which must live in
Vercel's environment settings — **never in this repository, never in a message**.

1. Go to <https://console.firebase.google.com> → your project → ⚙️ **Project settings**
2. Tab **Service accounts** → **Generate new private key** → **Generate key**
3. A `.json` file downloads. Open it in a text editor and copy **the whole file
   contents**, from `{` to `}`.

### 4.2 Add it to Vercel

1. Go to <https://vercel.com> → your `ujyalo-learn` project → **Settings** → **Environment Variables**
2. Add **Name**: `FIREBASE_SERVICE_ACCOUNT` — **Value**: paste the whole JSON
3. Tick **Production**, **Preview** and **Development**
4. **Save**, then redeploy: **Deployments** → the newest one → **⋯** → **Redeploy**

If pasting the whole JSON is awkward, the value is also accepted base64-encoded.
Either form works.

**If the key is present but broken**, the API now says so explicitly instead of
silently reporting "not configured": `/api/quiz-arena?action=meta` returns a
`reason` beginning `Arena storage is misconfigured:` followed by what went wrong.
That message means the variable exists — paste the file contents again, making
sure you did not copy only part of it.

### 4.3 Check it actually turned on

Open <https://ujyalo-learn.vercel.app/global-quiz> and look:

- **The yellow "Demo mode" bar should be gone.** If it is still there, the
  environment variable is missing or misspelled, or the redeploy did not happen.
- Play a quiz. The results should show a running total and, after a reload, the
  total should still be there.

Then open `https://ujyalo-learn.vercel.app/api/quiz-arena?action=meta` in a
browser. You should see `"configured": true` and a list of 15 categories. If it
says `"configured": false`, read its `reason` field — it now distinguishes "no
key at all" from "key present but unreadable" — and fix section 4.2 before
telling anyone.

### 4.4 Delete the key you downloaded

Once it is in Vercel, delete the `.json` file from your computer. If it ever
leaks, go back to the service accounts page and delete that key, then make a new
one.

### 4.5 Firestore indexes

Two leaderboard queries (Nepal, weekly) sort a filtered set, and **Firestore will
ask for a composite index the first time they run**. It is normal, it is free,
and it does not break anything: the first request logs an error with a link. Open
that link, click **Create index**, wait a few minutes. Until then the global board
works and the Nepal and weekly boards show an error message rather than inventing
rows.

---

## 5. Testing, and how to run it yourself

| Command | What it proves | Needs |
| --- | --- | --- |
| `npx vitest run` | 28 scoring rules, streaks, Nepal time, badges, fair play | nothing |
| `npm run test:arena` | 45 checks against the real API + Firestore emulator | Java 21 |
| `npm run test:rules` | 90 rule assertions, 22 of them Arena denials | Java 21 |
| `node scripts/arena-ui.mjs` | 35 browser checks: play a quiz, results, mobile, a11y | a running dev server |
| `node scripts/verify-arena-live.mjs` | 26 checks against the **deployed** site: live quiz, live SEO, existing pages still working | nothing |

**What has actually been run, on 24 October 2026:**

- `npx vitest run` → **198 passed** (28 new Arena tests)
- `npm run test:arena` → **45 passed, 0 failed**
- `npm run test:rules` → **90 passed**
- `node scripts/arena-ui.mjs` → **35 passed, 0 failed**
- `node scripts/verify-arena-live.mjs` → **26 passed, 0 failed** against
  `https://ujyalo-learn.vercel.app`
- `npm run health` → **34/34**
- `npm run build` → 43 prerendered routes, links OK
- typecheck clean; lint 0 errors

**What has not been tested:** the ranked path with a *real signed-in Firebase
account in production*, because that needs section 4 done first. The live run
above proves the page, the quiz, the scoring maths and the empty states on the
real internet; it cannot prove saved scores until the key exists. The emulator run
covers the same code path with a verified-shaped identity, but it is not the same
thing as a real token from Google, and I will not claim it is.

---

## 6. Honest limitations

- **The Arena is small.** With one player it is not a global competition, it is a
  quiz with a leaderboard waiting for people. The empty states say that instead
  of faking a crowd.
- **Badges that depend on rank** (`Top 10 Player`, `Global Champion`) are only as
  meaningful as the number of players. They are awarded on real rank, whatever
  the board size.
- **Weekly champions** appears only once a full week has been played.
- **Country flags are emoji**, not images — no extra download, works offline, but
  they render as letters on a few old Windows machines.
- **One username, chosen once.** That is deliberate (a name at the top of the
  board has to be earned) but it means a typo is permanent. There is no rename
  flow yet.
- **No chat, no friends, no messages.** A competition site for 14-year-olds with
  private messaging between strangers is a safeguarding problem, not a feature.
- **Practice mode and ranked mode use different question sets.** Practice
  questions are easier and shallower. That is the price of not shipping the
  ranked answers to the browser.
- **One unrelated gap I found while deploying.** Vercel has the public
  `VITE_FIREBASE_*` variables but **not** the server-side `FIREBASE_PROJECT_ID`
  and `FIREBASE_WEB_API_KEY`. Those two are what `api/_lib/auth.ts` uses to
  verify a signed-in student's token on the AI endpoints. Without them the tutor
  API cannot check who is calling, so it is protected by rate limits only. The
  Arena does not depend on them (it verifies tokens through the service
  account), but adding them would close that hole. I have not changed the
  behaviour — `requireAuth` is your setting, not mine.

---

## 7. Where the code is

```
shared/arena/scoring.ts          points, streaks, Nepal time, badges, timing  (used by both)
api/_lib/arena/bank.ts           315 hand-written questions + answer keys     (SERVER ONLY)
api/_lib/arena/service.ts        scoring, leaderboards, profiles, rate limit (SERVER ONLY)
api/_lib/arena/store.ts          Firebase Admin bootstrap, token verification
api/quiz-arena.ts                the HTTP endpoint
src/features/arena/              client API, types, practice bank, local demo engine
src/pages/arena/                 the four pages
tests/arenaScoring.test.ts       28 unit tests
scripts/arena-smoke.mjs          45 API checks (npm run test:arena)
scripts/arena-ui.mjs             35 browser checks
```

Routes: `/global-quiz`, `/global-quiz/play`, `/global-quiz/leaderboard`,
`/global-quiz/me`, `/global-quiz/player/:handle`.

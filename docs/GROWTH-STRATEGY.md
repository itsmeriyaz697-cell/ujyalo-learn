# Growth strategy — from "a site people can use" to "a site people use"

Written 23 October 2026, for Ujyalo Learn as it exists today: a Vite + React
SPA on Vercel, Firebase auth/Firestore, an AI tutor with configurable providers,
quizzes, notes, flashcards and a planner; free, no payments, no advertising.

Nothing in this document invents traffic numbers, testimonials or partnerships.
Where a number is a target rather than a measurement, it says **target**.

---

## 1. The honest starting position

| What we have | What that means |
| --- | --- |
| A complete product that works without an account | The hardest part of conversion — the first 30 seconds — is solved |
| 42 public pages, prerendered, structured data, sitemap | Crawlable, but most marketing pages are 120–140 words of HTML |
| One real domain, no backlinks, no brand searches | Distribution is the bottleneck, not the product |
| Firebase + Vercel + AI provider, no paid marketing | Growth must come from content, word of mouth and search |
| Content is Nepal-specific (Grades 1–12, SEE, NEB) | "Global" traffic means: Nepali students abroad, Nepal-adjacent curricula, and anyone who needs an AI study helper |

The product is not the constraint. **Distribution and retention are.**

### Who this is actually for (in priority order)

1. **Nepali students in Grades 9–12 preparing for SEE / NEB exams.** Highest need,
   highest intent, most likely to share with classmates.
2. **Nepali students abroad** (Gulf, Malaysia, Australia, India) who want an
   explanation in Nepali or English on a phone.
3. **Parents** looking for a free alternative to paid tuition, who decide in 60
   seconds whether the site is safe and understandable.
4. **Teachers** building practice quizzes — a multiplier, because one teacher can
   bring a class.
5. **Anyone** who wants an AI study helper — smallest segment, but the only one
   that makes "global" literally true.

Do not aim at #5 first. Win #1, because every asset you build (SEE guides, Nepali
explanations, grade pages) is *specific*, and specific content is what ranks and
gets shared.

---

## 2. The funnel, and what changed this round

```
Google / share link / social
        │
        ▼
Landing page (public, prerendered, fast)
        │  one press: "Start learning free"
        ▼
Guest account (no form, no email)  ← built this round
        │  optional, skippable setup
        ▼
First useful action (ask a question / take a quiz)  ← the "aha" moment
        │
        ▼
"Keep my progress" → email + password (same uid, nothing lost)
        │
        ▼
Return visits: streak, saved notes, progress
```

### Why no-signup-first is the right default
- A student deciding whether to trust a website will not hand over an email to
  find out. Every extra field before value is a place to lose them.
- The upgrade prompt ("Keep my progress") arrives **after** they have something
  worth keeping — notes, a quiz score, a chat. That is the strongest possible
  moment to ask.
- It is also the honest framing: we are not hiding that a guest lives in one
  browser; the banner says so, and the upgrade explains that the same uid keeps
  everything.

### The two questions every visitor asks
1. *What does this do for me?* → the hero says it in one line, and the
   `/getting-started` page answers it for someone who has never used an AI tutor.
2. *Is it safe / free / official?* → "No credit card", "Private by default",
   and a plain statement that AI answers can be wrong and this is not an official
   curriculum body. Say it early; it builds trust with parents.

---

## 3. Measurement — what to look at, and what to ignore

GA4 is installed with **opt-in consent**. That means the numbers are a *sample*
of consenting visitors, not a census. Treat them as directional.

Events already wired (no personal data in any of them):

| Event | Fires when | What it tells you |
| --- | --- | --- |
| `page_view` | any public route | which pages attract people (search vs. direct) |
| `guest_start` | one-click start, from a CTA or a shared link | the front door works |
| `sign_up` (`method: email/google`) | account created | how many people commit |
| `guest_upgrade` | guest attaches an email | whether the "save progress" moment converts |
| `onboarding_complete` / `onboarding_skipped` | end of setup | whether setup is too long |
| `login` | returning user | retention proxy |

**The three numbers that matter**
1. **Start rate** — `guest_start` ÷ public sessions. Target: >8% on landing pages.
   If it is lower, the hero is not understood; if it is much higher but retention
   is not, the promise and the product disagree.
2. **First-value rate** — sessions where the tutor or a quiz is used. Not
   instrumented yet (privacy: the tutor endpoint is server-side); add a
   `first_action` event next.
3. **Guest→account rate** — `guest_upgrade` ÷ `guest_start`. Target: >15% within
   7 days. This is the single best signal of product-market fit at this stage.

**Ignore for now:** bounce rate (meaningless in a SPA), average session duration
(inflated by open tabs), and any "AI traffic" dashboard claims. Watch Search
Console impressions/clicks instead — that is the real top of funnel.

---

## 4. Acquisition: what to do, in the order that pays

### 4.1 Search — the compounding channel (start now, pays in 3–9 months)
Search rewards exactly what this product can produce cheaply: specific pages that
answer one question well.

**Content plan, by intent**
1. **"How do I…" study questions** (already started): "how to prepare for SEE in
   3 months", "how to memorise formulas", "how to take notes that work".
   One page each, 600–900 words, with a worked example and a link into the tool.
2. **Subject explainers** — "quadratic equations explained simply", "photosynthesis
   for Grade 10", "Nepali essay structure". These are the pages students actually
   search for, and each one can end with "practise this with a quiz".
3. **Grade hubs** (exist) — strengthen with real study plans per grade.
4. **Nepali-language pages** — currently the app supports Nepali explanations, but
   there are no Nepali pages. Devanagari search demand for exam terms is real and
   nearly uncontested. This is the largest open opportunity.

**Fix first:** the twelve marketing pages are 120–140 words of *HTML* (the app
renders more after JS). Add 300–500 words of genuinely useful, page-specific
content to `/features`, `/subjects`, `/pricing`, `/ai-tutor`, `/see-preparation`,
`/help` — not filler, but the questions a parent or student asks next.

**Technical hygiene already in place:** prerendered HTML per route, JSON-LD,
canonical URLs, sitemap, `llms.txt`, OG images, no LCP-blocking fonts. Keep it
that way — every new route needs an entry in `shared/seo-pages.json`.

### 4.2 Communities — the fastest first 1,000 users
- **School and exam groups** on Facebook/Viber/WhatsApp are where Nepali students
  actually organise. Share the *guide* page, not the home page: a specific answer
  is shareable, a home page is not.
- **Reddit r/Nepal and r/StudyTips**, Quora — answer the question in the thread,
  then link only if the page genuinely answers it again. Never drop a bare link.
- **Teachers**: offer to build a practice quiz for their next unit, free, with
  their name on it if they want. One teacher = 30–60 students.
- **Do not** spam groups with links. Two useful posts a week beats ten links a day,
  and gets you banned less.

### 4.3 Short video — highest ceiling, highest effort
60-second screen recordings answering one question ("Why does the AI explain it
three different ways?"). TikTok/YouTube Shorts/Instagram Reels reach students
where they are. Reuse each script as a page in the content plan — one recording
should produce a video, a page and a shareable image.

### 4.4 Search Console and Bing — free, do it properly
Submit the sitemap, then watch the **Queries** report. Every query where you get
impressions but few clicks is a page that needs a better title or a better answer.
This loop is worth more than any one-off launch.

### 4.5 What not to do
- No paid ads until the guest→account rate is known. You cannot buy your way out
  of a funnel you have not measured.
- No fabricated testimonials, user counts or "10,000 students" claims. One
  discoverable lie destroys the trust the rest of the site is built on.
- No buying links, no link exchanges, no AI-generated 500-page content farms.
  Google's spam policies target exactly this, and the site's whole positioning is
  "honest and clear".

---

## 5. Retention: the part that decides whether any of this matters

Acquisition without retention is a leaky bucket. Three loops, in order of leverage:

1. **The streak and the plan.** A student who has a plan for tomorrow comes back
   tomorrow. Keep the daily goal small (15–30 minutes) and make the dashboard show
   *today's* next action, not a wall of charts.
2. **Saved work.** Notes, flashcards and quiz history are switching costs. This is
   why the guest→account upgrade matters: an account makes the switching cost real
   across devices.
3. **Notifications — only when they exist.** There is no notification service
   configured, and the site does not claim one. Email digests would help; they
   need a provider, consent and an unsubscribe path. Treat that as a project, not
   a checkbox.

**Target:** 30% of accounts return within 7 days (target, to be measured, not a
claim). If `guest_upgrade` is healthy but returns are not, the product is
interesting but not habit-forming; fix the loop before spending on acquisition.

---

## 6. Beginner-friendliness checklist (what "anyone can use it" means)

- [x] One press to enter, no form (`/start` behaviour on every primary CTA)
- [x] Skippable setup with sensible defaults
- [x] A written guide for people who have never used an AI tutor (`/getting-started`)
- [x] Plain-language errors: "pop-up blocked", "this sign-in method is not
      switched on yet", never a raw Firebase code
- [x] Guest banner that explains the browser-bound risk before the work is lost
- [x] Works on a 390 px phone; mobile-first layouts audited at 360 px
- [x] WCAG 2.1 AA audit clean on 20 page checks, light and dark
- [ ] **Next:** a 3-frame welcome inside the app on first entry (what the tutor
      does, where notes live, how to save progress) — the page-level guide covers
      the concept, but the first in-app screen is still a form
- [ ] **Next:** translate the interface itself into Nepali (currently only tutor
      explanations can be Nepali). This is a real project: string extraction,
      `lang` attribute per route, hreflang pairs. It would roughly double the
      addressable audience.
- [ ] **Next:** offline "continue last quiz" for flaky connections

---

## 7. 30 / 60 / 90 days

### Days 0–30 — instrument, fix, seed
- Enable Anonymous + Google providers, create the owner, import the library
  (owner actions — the site cannot do it for you).
- Watch GA4 Realtime to confirm consent and page views behave.
- Submit sitemap in Search Console and Bing; verify the property.
- Rewrite the six thin marketing pages with real content.
- Publish four subject explainers and two SEE guides.
- Post three genuinely useful answers in communities; note which get replies.

### Days 31–60 — double down on what responded
- Whatever got clicks in Search Console, expand into a cluster (5–8 pages).
- Ship `first_action` instrumentation; compute guest→account rate.
- Ship the in-app 3-frame welcome; A/B the hero line.
- Start short video: one per week, repurposed from the top pages.
- Recruit 3–5 teachers; build a quiz for each class's next unit.

### Days 61–90 — localise and systemise
- Nepali UI (Phase 1: navigation, buttons, onboarding copy; Phase 2: everything).
- hreflang for `/` and `/ne` pairs; separate sitemaps per language.
- Email digest — only if consent, unsubscribe and a provider are all in place.
- Review: if 7-day return rate is below target, stop acquisition work and fix the
  loop. If it is above, raise the content cadence instead of the ad budget.

---

## 8. Budget (deliberately near zero)

| Item | Cost | Note |
| --- | --- | --- |
| Hosting (Vercel) | free tier | fine until real traffic |
| Firebase auth + Firestore | free tier | anonymous users count toward MAU — watch it before a big push |
| AI provider | per-token | the real variable cost; keep the fair-use limits |
| Domain | ~$10–15/year | already configured |
| Search Console / Bing | free | the highest-ROI "tools" here |
| Content | your time | the actual investment |

**Before any large campaign:** check the AI provider quota and Firebase MAU, or a
viral moment becomes an outage.

---

## 9. Decisions only the owner can make

1. **Which market first** — Nepal-first (recommended) or English-first broad?
   The content plan changes completely.
2. **Nepali UI** — is a translated interface acceptable if the translation is
   plain and honest, or should a native speaker review every string first?
3. **Monetisation, later** — the site promises free core features. Any paid tier
   must keep that promise, and needs legal pages and a payment provider.
4. **Notification channel** — email digests need a provider and consent; SMS is
   expensive and unnecessary.
5. **Brand voice** — "study helper that admits when it is unsure" is the current
   voice. Keep it; it is the differentiator against every confident-sounding
   chatbot.

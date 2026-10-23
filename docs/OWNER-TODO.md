# Owner TODO

Verified 2026-10-23, after the rules were published and the site deployed.

**Done:** rules published and verified live · site deployed with Firebase
configured · real signup, onboarding, reload, sign-out and sign-in verified
against production (10/10) · account deletion verified and fixed · favicon fixed
· SEO audit 0 problems · health 34/34.

**What is left needs your account, and it is now one step plus a button.**
---

## A. Blocking — the last step (~2 minutes)

The library is empty, so `/courses` says it is being set up. Importing it needs
an owner, and the first owner can only be created by hand.

1. Sign up (or log in) on **https://ujyalo-learn.vercel.app**
2. Open **https://ujyalo-learn.vercel.app/admin** — the page prints your account
   ID with a **Copy** button, because you are not an owner yet
3. In Firebase → **Firestore Database → Start collection** → collection id
   `roles` → document id = the ID you copied → add field `role` (string) =
   `owner` → save
4. Reload **/admin** — the header now shows you as Owner, and a card offers
   **Import starter library**
5. Press it. It reports how many records were written.

- [ ] Owner created
- [ ] Library imported (expect 14 records)
- [ ] `/courses` lists the 7 courses and 6 guides

## B. Do this week (~30 minutes)

### B1. Set a contact email
The live contact page currently tells visitors:

> "The site owner has not set `VITE_CONTACT_EMAIL` yet, so this form cannot send email."

That is honest, but it reads as unfinished. Vercel → Settings → Environment
Variables → add `VITE_CONTACT_EMAIL` for Production, then redeploy.

- [ ] Set, redeployed, page no longer shows the notice

### B2. Create the GitHub repo and push
**There is no git remote on this project.** Nothing has been pushed, which means:

- `ci.yml` (lint, types, tests, build, browser, Firebase E2E, rules) has **never run**
- `health.yml` (every 6 hours) has **never run**
- There is no backup of this work outside this workspace

Needs a Personal Access Token or the GitHub CLI logged in.

- [ ] Repo exists, `main` pushed, Actions tab shows both workflows passing

### B3. Get monitoring running
Right now **nothing checks production**. Options, cheapest first:

- **Free:** push to GitHub (B2) — the health workflow then runs 34 checks every 6 hours
- **Better:** a Vercel cron hitting `/api/health` plus a notification channel
  (Slack code exists but is inactive and needs a webhook you create)

- [ ] Something would actually tell you if the site went down tonight

---

## C. Search visibility (needs your Google/Microsoft accounts, ~20 minutes)

The verification file is already live and correct at
`/googlec3d881d4bf552040.html`. What is missing is everything after it.

### C1. Google Search Console
- [ ] Verify the property (the file is there; click Verify)
- [ ] Submit `https://ujyalo-learn.vercel.app/sitemap.xml`
- [ ] Request indexing for `/`, `/courses`, `/see-preparation`, `/grades/10`
- [ ] Check back in 2 weeks: Coverage → are pages "Indexed" or "Discovered — not indexed"?

### C2. Bing Webmaster Tools
Mirrors Google and feeds ChatGPT search. Submit the same sitemap.
Optional: an API key lets `scripts/submit-urls.mjs` push URLs automatically.

- [ ] Site added, sitemap submitted

### C3. Expect a delay on the favicon
Google recrawls icons on its own schedule — days to weeks. There is no button.
The fix ships with the next deploy (A1 unblocks it).

---

## D. Content — the real work, and the biggest lever (weeks)

### D1. Review the starter library
7 courses and 6 guides exist. They are written as **study paths, not official
curriculum** — labelled that way on every page. Before you promote the site,
read them once and confirm you are happy standing behind them.

- [ ] Read all 13 and agree with them, or edit them in `/admin`

### D2. Real curriculum content
Search traffic needs genuine pages: one per chapter per subject, plus past
papers with worked solutions. Roughly **300–500 pages** before search becomes a
serious channel, and 6–9 months before it compounds.

This cannot be AI-generated and passed off as official — that is both dishonest
and against Google's spam policy. It needs you, or teachers you work with.

- [ ] Decide who writes it
- [ ] Start with SEE Science, Maths and English (highest demand)

---

## E. Decisions only you can make

- [ ] **Analytics** — none installed. Without it, nothing about traffic is
      measurable. Cookieless option needs no cookie banner.
- [ ] **Custom domain** — currently `ujyalo-learn.vercel.app`. A `.com.np` or
      `.com` is better for trust and for search.
- [ ] **Growth build order** — measurement → share loop → content → teacher kit
      (see `docs/GROWTH-PLAN.md`). I have not started any of it.
- [ ] **Notification channel** — nothing alerts anyone if the site breaks.
- [ ] **Teachers** — twenty teachers brings ~1,000 students daily and costs
      conversations, not code. Entirely yours.

---

## Already done — do not redo

| Item | State |
| --- | --- |
| Firebase project + web app | created |
| Email/Password sign-in | enabled (verified) |
| Authorized domains | `localhost`, `.firebaseapp.com`, `.web.app`, `.vercel.app` |
| Six `VITE_FIREBASE_*` values | set in Vercel (Production + Preview) |
| `firestore.rules` | **published and verified live**; 72/72 emulator tests, mutation-tested |
| Site deployed with Firebase | `ujyalo-learn.vercel.app`, health 34/34 |
| Real signup on production | verified 10/10, including delete-your-account |
| Account deletion | was impossible (typing DELETE closed the dialog) — fixed |
| Onboarding escape | a student could not sign out mid-setup — fixed |
| Seeding | a button in `/admin`, no service-account key needed |
| Favicon | fixed: `/favicon.ico` 404 was the cause of the generic globe |
| SEO audit | 0 problems on the live site |

---

## Order that works

1. **A** (2 min) → owner + import → the site is complete and usable
2. **B1** contact email, **B2** GitHub repo, **B3** monitoring
3. **C** Search Console and Bing → pages become eligible for indexing
4. **D** content → the only durable traffic source

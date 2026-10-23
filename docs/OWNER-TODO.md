# Owner TODO

Everything below needs your account. Nothing here can be done from the repo or
by an agent — each item either requires your Google/Microsoft/GitHub login, or
requires a decision only you can make.

Verified 2026-10-23 against production and your live Firebase project.

---

## A. Blocking — auth does not work until these are done (~5 minutes)

### A1. Publish the Firestore rules

**Option 1 — console (30 seconds).** **Firestore Database → Rules** → select all
→ paste the contents of `firestore.rules` → **Publish**.

**Option 2 — from a terminal, no console.** Needs Node installed.

```bash
unzip ujyalo-learn.zip -d ujyalo-learn
cd ujyalo-learn
npx firebase-tools@latest login                          # opens a browser; approve it
npx firebase-tools@latest deploy --only firestore:rules,firestore:indexes --project ujyalo-learn
```

The deploy prints `✔ Deploy complete!`. Rules deploys do not need Java — only
the local emulator does.

| If you see | It means |
| --- | --- |
| `Could not find a firestore.rules file` | you are not inside the unzipped folder |
| `Failed to get Firebase project` | `login` did not finish, or a different Google account |
| `403 The caller does not have permission` | that Google account does not own `ujyalo-learn` |
| `command not found: npx` | install Node first, or use Option 1 |

Until then every read and write returns `PERMISSION_DENIED`. Signup creates the
account and then strands the student on onboarding with "your preferences could
not be saved".

- [ ] Published
- Verify: `node scripts/check-firebase.mjs --live` should stop reporting a problem.

### A2. Make yourself the owner
Sign up on the site first, then **Firestore → Start collection → `roles`**:
- Document ID: **your uid** (Authentication → Users)
- Field: `role` (string) = `owner`

There is deliberately no default admin password.

- [ ] `roles/{your-uid}` exists with `role: "owner"`
- Check: `/admin` header shows your email and "Owner".

### A3. Import the starter library
Open **`/admin`** → **Import starter library**. One click, no service-account
key, writes 7 courses + 6 guides + site settings through your session.

- [ ] Import reports 14 records written
- Check: `/courses` lists them.

**When A1–A3 are done, tell me. I deploy and verify signup → sign-out →
sign-in on a second browser, which is the only way to prove accounts sync.**

---

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
| Email/Password sign-in | **enabled** (verified) |
| Authorized domains | `localhost`, `.firebaseapp.com`, `.web.app`, `.vercel.app` |
| Google sign-in | appears enabled — the probe reached Google's token parser instead of being refused |
| Six `VITE_FIREBASE_*` values | set in Vercel for Production + Preview |
| `firestore.rules` | written, **72/72 emulator tests**, mutation-tested |
| Seeding | now a button — no service-account key needed |
| App in Firebase mode | **tested end to end, 15/15** against the emulator |
| Site deployed | `ujyalo-learn.vercel.app`, health 34/34 |
| SEO audit | 0 problems once the pending build ships |
| Favicon | fixed, waiting on the deploy |

---

## Order that works

1. **A1 → A2 → A3** (5 min) → tell me → I deploy and verify auth on the live site
2. **B1** (2 min) → contact page stops saying it is unfinished
3. **B2 → B3** (~20 min) → CI and monitoring actually exist
4. **C1 → C2** (~20 min) → pages become eligible for indexing
5. **D2** (weeks) → the only thing that produces durable traffic

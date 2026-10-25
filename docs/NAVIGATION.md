# Navigation and the first visit

**Status: implemented and verified.** `scripts/verify-navigation.mjs` runs the acceptance
list in a real browser on desktop, tablet and phone, and is part of CI.

The rule the whole site follows: **browse first, learn first, account only when necessary.**
Nothing in the public site or in the learning tools asks who you are before it does
something useful.

## What a first-time visitor experiences

| Step | Before | Now |
| --- | --- | --- |
| Open the site | homepage | homepage (unchanged) |
| Click **AI tutor** | marketing page, then a CTA, then a gate screen, then a 7-step form | marketing page, then the tutor itself |
| Open a shared `/app/tutor` link | "Start in one click" screen | the tutor |
| Skip personal setup | impossible — the form had to be finished | not required; it is offered inside the app |
| Sign up | required to keep anything | voluntary, at the moment saving matters |

## How a session exists without an account

`src/features/auth/guestSession.ts` and `src/services/data/index.ts`.

A visitor who opens any `/app/*` route is given a **browser session**: a stable identity
(`uid = guest-local`) whose records live in `localStorage`, namespaced per collection
exactly like a signed-in student's. Three consequences, all deliberate:

1. **No network.** The session cannot fail because a provider is switched off in a
   Firebase console, because the database is not configured, or because the visitor is
   offline. There is no screen to get stuck on.
2. **Ownership is still real.** Every record carries `ownerId`, and `DataStore` still
   takes a uid for every call, so the privacy model does not weaken. Nothing is shared
   between visitors, and nothing is written to the cloud under an unverified identity.
3. **It is labelled, not hidden.** Inside the app the banner says the work is saved in
   this browser only, and offers to create an account — with the reason stated first.

The storage backend is chosen at render time (`activateLocalStore()` /
`activateCloudStore()`) behind a delegating `dataStore` proxy, so no page needed rewriting
to make this work.

## Upgrading to a real account

When someone signs up or signs in from a browser session, `migrateGuestData()` copies
conversations, messages, notes, quizzes, attempts, decks, goals and tasks to the new uid,
rewriting `ownerId`. Details that matter:

- It reads the guest records from `localStorage` **explicitly**, because the active store
  has already switched to the cloud by then.
- The browser copy is deleted only after the cloud write succeeds — a failed migration
  never destroys the only copy. In local demo mode both copies are kept.
- A migration that half-fails still lets the person into their account; it reports what
  moved rather than blocking.
- The check runs against the **stored marker**, not against React state: a full page load
  (a refresh, or landing on `/signup` from a link) clears the provider, and the first
  version of this silently stranded the work. `scripts/verify-navigation.mjs` check 9
  now creates a note before sign-up and asserts it is still there afterwards.

## What still requires an account, and why

| Area | Why it needs one |
| --- | --- |
| `/admin` | Server-side role check; the content library is not a public write surface. |
| Global Quiz Arena ranking | A rank must belong to a persistent identity. Practice quizzes do not need one. |
| Cloud sync across devices | The whole point of an account. The ask appears when saving is the thing they want. |

## Onboarding

`/onboarding` still exists and still writes a real profile — it is simply no longer a
destination that sign-in redirects into. `SetupNudge` offers it from inside the app, can be
dismissed, and says what it is for ("answers are pitched at a default grade until you set
yours"). The page keeps its own skip button, which saves the pre-filled defaults.

## Links, redirects and history

- All public routes render directly; there is no redirect from a public URL to an auth
  page. Every route is a real URL that survives a refresh (prerendered HTML + SPA
  fallback).
- `?next=` is parsed through `safeRedirectPath()` on login **and** signup, so a crafted
  value cannot bounce a visitor off-site (GHSA-wrjr-x8rr-h8h6).
- Back and forward work because navigation is ordinary browser history; nothing calls
  `history.replaceState` outside `replace` navigations after auth.
- `GuestOnly` sends an already-signed-in visitor to `/app` (or their `?next=`), never to a
  setup form.

## Verification

```bash
npm run build
npm run dev            # web + dev API
BASE_URL=http://127.0.0.1:5173 node scripts/verify-navigation.mjs
```

37 checks: homepage first, 10 public routes opening directly, the tutor and quizzes reached
with no account, a deep link not bouncing, refresh not redirecting, back/forward, the logo
returning home, login reachable on purpose, no spontaneous auth redirect, no console or
server errors, guest work surviving sign-up — on desktop, Pixel 7 and an 834 px tablet.

Unit coverage for the storage and migration layer: `tests/navigation.test.ts` (9 tests).

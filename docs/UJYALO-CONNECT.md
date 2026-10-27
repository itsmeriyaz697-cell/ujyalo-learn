# Ujyalo Connect

Communities and messaging for Ujyalo Learn, with Discord used **only** to sign
people in.

Status: **deployed, and tested end to end against a local Discord stand-in.**
The pages are live; sign-in is not yet switched on, because it needs four things
that only the owner can add (§2, §2.6). Until then `/connect` is honest about
it: it says sign-in is not configured and does not pretend to have accounts.

- Live build: `main` at `4129ba3`, deployed 2026-10-25.
- `GET /api/connect/status` on the live site returns
  `{"configured":false,"oauth":false,"storage":"unconfigured"}` — the server
  has no Discord credentials and no Firebase service account yet. That is the
  accurate answer, not a bug.

---

## 1. What it is, and what it deliberately is not

| Is | Is not |
| --- | --- |
| A separate community platform, with its own communities, channels and messages stored in Firestore | A Discord client. Nothing here reads or writes Discord servers, channels or DMs |
| Discord as an identity provider (`identify` + `email`) | A way to join a Discord server, or a request for a Discord password |
| Public to browse — the community list and channel names need no account | Public to read. Messages require membership |

The distinction is enforced, not just documented: messages live in a Firestore
subcollection whose rules require a member document, and the OAuth token is
discarded immediately after the profile read.

## 2. Owner setup (about 10 minutes)

### 2.1 Create the Discord application

1. Open **https://discord.com/developers/applications** → **New Application**.
2. Name it `Ujyalo Connect` (this is what users see on the consent screen).
3. Left sidebar → **OAuth2**.
4. Copy **Client ID** → this becomes `DISCORD_CLIENT_ID`.
5. Press **Reset Secret** → copy it → `DISCORD_CLIENT_SECRET`.
   *Never paste this into chat, a commit, or any `VITE_*` variable.*
6. Under **Redirects**, add exactly:

   ```
   https://ujyalo-learn.vercel.app/api/connect/callback
   ```

   Add the local one too if you want to test on your machine:

   ```
   http://127.0.0.1:5173/api/connect/callback
   ```

   The match is exact, including the path. A trailing slash will fail.
7. **Scopes**: the app requests `identify` and `email` — nothing else. No
   `guilds`, no `bot`, no `connections`. You can leave the Scopes section empty;
   the request supplies them.

### 2.2 Add the environment variables on Vercel

Project → **Settings** → **Environment Variables** (add to Production, Preview
and Development):

| Name | Value | Notes |
| --- | --- | --- |
| `DISCORD_CLIENT_ID` | from 2.1 step 4 | public identifier |
| `DISCORD_CLIENT_SECRET` | from 2.1 step 5 | **secret** — server only |
| `DISCORD_REDIRECT_URI` | `https://ujyalo-learn.vercel.app/api/connect/callback` | must match the portal exactly |
| `CONNECT_SESSION_SECRET` | 32+ random characters | encrypts the OAuth state cookie |
| `FIREBASE_SERVICE_ACCOUNT` | the service-account JSON | already needed by the Arena |
| `VITE_SITE_URL` | `https://ujyalo-learn.vercel.app` | used to build redirects |

Generate the session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.3 Firebase console

1. **Authentication → Sign-in method → Advanced** → make sure
   *Custom token* sign-in is available (it is on by default; the error
   `auth/operation-not-allowed` means it was switched off).
2. Authorised domains already include `ujyalo-learn.vercel.app`.
3. Deploy the rules — this is not optional, the community collections are
   closed until you do:

   ```bash
   firebase deploy --only firestore:rules
   ```

   Or paste `firestore.rules` into Firebase console → Firestore → Rules.

### 2.4 Verify

Open `https://ujyalo-learn.vercel.app/connect`. The hub should show
**Continue with Discord** as enabled. If it shows "not configured", the server
reports which variable is missing in the Vercel function log
(`[connect] not configured: …`) — that line is deliberately not shown to
visitors.

## 2.5 Why the live URL can lag behind `main`

Worth knowing before debugging a "my change is not live" moment.

This project has **automatically assign custom domains to new deployments**
switched off, and its Git integration has deployments switched off too. So a
push to `main` builds nothing, and a deployment created from the CLI or API
builds and is ready but does **not** take over `ujyalo-learn.vercel.app` by
itself. The alias stays with whichever deployment last owned it — which is why
the site can look days out of date while the code is perfectly fine.

Two ways to move it:

- In the dashboard: **Deployments → the deployment → ⋯ → Promote to
  Production**. This is the reliable one, and the only one that needs nothing
  but a browser.
- Or re-attach the domain: **Settings → Domains → ujyalo-learn.vercel.app →
  Edit → Remove**, then **Add** it again *without* a branch, and deploy once
  more.

### Where it stands at `d04d40e`

The last promoted deployment is still `dpl_ARizPcNXTyGbmeYGSVCvUm6J29Zu`
(`47b5a28`, 22 October). Everything since then is built, ready, and **staged**:
`dpl_8DwonDYqNHi1hNsDjNvSPFQ9VhT4` is the production build of `d04d40e` and it
is what the team aliases serve —

```
ujyalo-learn-itsmeriyaz697-cells-projects.vercel.app   assets/index-WFrMRix4.js
ujyalo-learn-git-main-itsmeriyaz697-cells-projects.vercel.app   same
ujyalo-learn.vercel.app   assets/index-Bz6xqjyQ.js   ← promoted 22 Oct, stale
```

Re-adding the domain through the API is now refused with *“Cannot add
ujyalo-learn.vercel.app since it's already assigned to another project”*, so
the promote button in the dashboard is the only route left that does not
involve deleting anything. Until it is pressed, `ujyalo-learn.vercel.app`
serves a build from 22 October: no Connect routes, no quiz-arena rewrite, and
`/api/health` reporting the AI provider as unconfigured.

Do **not** attach the production domain to a Git branch. A branch-linked domain
serves the latest deployment of that branch as a preview, and this project
protects preview deployments with Vercel Authentication — visitors are then met
with a login wall instead of the site.

## 2.6 The four things still needed before sign-in works

Nothing else is missing; the code is deployed and tested.

1. **Firestore rules** — paste `firestore.rules` into Firebase console →
   Firestore Database → Rules → Publish. Until this is done every community
   read and write is refused. (There is no `firebase` login on the deployment
   machine, so this one is a console job.)
2. **`FIREBASE_SERVICE_ACCOUNT`** — Firebase console → Project settings →
   Service accounts → *Generate new private key*. Paste the whole JSON as the
   value of that variable in Vercel. Without it the server cannot write a
   profile or mint a custom token, and `status` keeps reporting
   `"storage":"unconfigured"`.
3. **`DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`** — from §2.1.
4. **`CONNECT_SESSION_SECRET`** — 32+ random characters, generated by you. In a
   browser console (F12 → Console) run
   `crypto.randomUUID().replaceAll('-','') + crypto.randomUUID().replaceAll('-','')`
   and paste the result into the Vercel variable. Never put it in a `VITE_`
   variable.

After adding them, redeploy (they are read at build/run time).

## 3. How the sign-in works

```
browser ──GET /api/connect/start──▶ server
                                     │ creates state + PKCE verifier
                                     │ seals them into an AES-GCM cookie
                                     ▼
                         302 ──▶ discord.com/oauth2/authorize
                                     │ user approves (or cancels)
                                     ▼
browser ──GET /api/connect/callback?code&state──▶ server
                                     │ opens cookie, compares state (constant time)
                                     │ POST /oauth2/token  (client secret + code_verifier)
                                     │ GET  /users/@me     (Bearer token)
                                     │ transaction: connectIdentities + connectProfiles
                                     │ createCustomToken(uid)
                                     ▼
                         302 ──▶ /connect/auth?status=finish
browser ──GET /api/connect/session──▶ once-only custom token
                                     │ signInWithCustomToken
                                     ▼
                                 Firestore session
```

Why it is shaped this way:

- **The secret never reaches the browser.** The code exchange happens on the
  server; the browser only ever sees a Firebase custom token, once, from an
  httpOnly cookie.
- **PKCE anyway.** Discord requires a client secret for confidential clients, so
  PKCE is not the only protection — but it binds the code to this browser, and
  the local mock refuses a flow without it.
- **State is encrypted, not merely stored.** A cookie that can be edited is not
  a CSRF defence. AES-256-GCM with a server-side key means tampering fails
  closed.
- **One Discord id → one uid, derived.** `uid = discord_<id>` is computed, not
  allocated, so two simultaneous first sign-ins converge on the same document
  rather than creating two accounts. `connectIdentities/{discordId}` records the
  mapping in a transaction and is unreadable from any client.
- **Endpoints are overridable only outside production.** `DISCORD_TOKEN_URL`
  and friends exist so the local mock can stand in; in production the overrides
  are ignored outright, so a misconfigured environment cannot redirect identity
  traffic.

## 4. Data model and rules

```
connectIdentities/{discordId}       { uid, createdAt, lastSeenAt }        server-only
connectProfiles/{uid}               { discordId, discordUsername, displayName,
                                      avatarUrl, email, createdAt, memberships, bio }
communities/{communityId}           { name, slug, description, ownerUid, memberCount }
communities/{id}/members/{uid}      { uid, role, joinedAt }               members only
communities/{id}/channels/{chId}    { name, topic, createdAt }
communities/{id}/channels/{chId}/messages/{msgId}
                                    { authorUid, authorName, authorAvatar, body, createdAt }
```

Joining and leaving are `POST /api/connect/join` and `/leave`, not client
writes. One join changes three documents — the member record (which the rules
read to decide whether messages are visible), the community's counter, and the
membership list on the profile — and a browser may write none of the last two.
The server does all three in one transaction, which also means the member list
can stay private: only that community's members can read who is in it.

What the rules guarantee (23 tests in `tests/rules/connect.test.ts`):

- community metadata and channel names: readable by anyone;
- messages: readable and writable only by members of that community;
- the member list: readable by that community's members and by you, for your
  own record — never by visitors or by signed-in non-members. Clients cannot
  write it at all, so nobody can add themselves to a community;
- messages are immutable once sent (no silent edits), and deletable only by
  their author or the community owner;
- a profile cannot be created from a browser at all — only the server mints one
  — and its Discord fields cannot be rewritten by editing your own document;
- an anonymous (browser-guest) session is not a credential for posting.

## 5. Environments without credentials

| Situation | What happens |
| --- | --- |
| No Discord variables | `/connect` says sign-in is not configured, with a pointer to this file. No fake accounts, no fake communities. |
| No `FIREBASE_SERVICE_ACCOUNT` | The callback reports `storage_unavailable`; nothing is written. |
| Firebase not configured in the client | `completeSignIn` explains that a session cannot be created rather than failing silently. |
| The owner has not deployed the rules | Community writes fail with `permission-denied`; the UI shows the error instead of pretending success. |

## 6. Testing

```bash
npm run test:connect     # 44 checks: OAuth, profile, join, live messages, isolation, cancel, logout, mobile
npx vitest run tests/connectOauth.test.ts   # 26 unit tests: PKCE, sealing, safeNext, config
npm run test:rules       # includes 26 Connect rules tests
```

`npm run test:connect` starts the Firestore/Auth emulators, a local Discord
stand-in (`scripts/mock-discord.mjs`) and the real dev server, then drives
Chromium through the actual flow. It covers the brief's testing list: new
account registration, existing-user login, invalid/cancelled authorisation,
expired session (a used handoff returns 401), logout, profile creation, mobile
and desktop layout, and Firestore security.

**Not tested, and cannot be until §2 is done:**

- the real Discord consent screen (the mock implements the same code flow);
- a real deployment's cookie behaviour behind Vercel's proxy;
- account linking where a Discord account is later deleted on Discord's side.

## 7. Known limits

- **One staff-run community can be created by anyone.** There is no moderation
  queue, rate limit or reporting flow yet. For a public launch, channel
  creation should be owner-only (it is), and messages need a report path.
- **No attachment support.** Text only, 2000 characters, matching Discord's own
  message limit.
- **`memberCount` is maintained by the join/leave endpoint**, and the community
  page shows a live count of member documents to anyone allowed to read them.
  It is cosmetic either way: access comes from the member document, never the
  counter.
- **The Discord mark is a simplified drawing**, not Discord's official asset.
  Replace it from Discord's brand kit before a public launch.
- **No email verification gate.** Discord accounts with unverified email can
  sign in; only the identity matters here.

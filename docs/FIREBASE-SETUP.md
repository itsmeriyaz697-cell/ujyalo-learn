# Firebase setup

This turns Ujyalo Learn from **browser-only demo mode** into a real multi-device
product. Until it is done, everything works but nothing is saved beyond one
browser, and the UI says so on every screen.

Time: about 20 minutes. Cost: **free tier** (Spark plan) is enough for a pilot.
No credit card is required for the steps below.

> **What I could and could not verify.** The security rules in `firestore.rules`
> are now **tested against the Firestore emulator** — 72 assertions covering
> student isolation, role escalation, draft leakage and the append-only audit
> log (`npm run test:rules`). They have **not been deployed to a live project**,
> because that needs your Google account. Deploying is step 6.

---

## 1. Create the project

1. <https://console.firebase.google.com> → **Add project**.
2. Name: `ujyalo-learn`. Google will suggest an id like `ujyalo-learn-4f2c1` —
   note it exactly, you need it later.
3. Google Analytics: turn **off**. Not needed, and it adds cookies you would then
   have to disclose.

## 2. Enable sign-in

**Authentication → Get started**

- **Email/Password** → Enable → Save.
- **Google** → Enable → pick a support email → Save.

Then **Authentication → Settings → Authorized domains** and add:

| Domain | Why |
| --- | --- |
| `localhost` | already present; needed for development |
| `ujyalo-learn.vercel.app` | **production. Sign-in popups fail without it.** |

If you later use a custom domain, add that too.

> Password reset emails come from Firebase's own sender by default and can land
> in spam. That is a deliverability issue, not a bug in this app. Improve it
> later under Authentication → Templates / SMTP.

## 3. Create the database

**Firestore Database → Create database**

- **Production mode** (rules are written and tested — do not use test mode).
- Location: `asia-south1` (Mumbai) is the lowest latency for Nepal.
  **This cannot be changed later.**
- If offered a choice between "Standard" and "Enterprise", choose **Standard**.

## 4. Register the web app and copy the config

**Project settings → Your apps → Web (`</>`)** → register the app (nickname
`ujyalo-learn-web`, no Hosting needed).

Copy the six values from *SDK setup and configuration* → **Config**:

```
apiKey:            AIza…
authDomain:        <project-id>.firebaseapp.com
projectId:         <project-id>
storageBucket:     <project-id>.firebasestorage.app
messagingSenderId: 123456789012
appId:             1:123456789012:web:abc123…
```

These are **public identifiers**, not secrets. They ship in the browser bundle by
design; the database rules are what protect the data.

### Put them where they belong

Local development — add to `.env.local` (git-ignored):

```bash
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123
```

Production — Vercel → **Settings → Environment Variables**, same six names, set
for **Production** (and Preview, if you use preview deploys). Then redeploy:
environment variables are baked in at build time.

### Check before deploying

```bash
node scripts/check-firebase.mjs          # presence, shape, project/domain agreement, DNS
node scripts/check-firebase.mjs --live   # also asks Google whether the key and domain are accepted
```

This exists because the failure mode is silent: five of six values still builds,
renders, and only breaks when a student tries to sign up.

## 5. Deploy the rules

```bash
npx firebase login
npx firebase use --add          # select your project
npx firebase deploy --only firestore:rules,firestore:indexes
```

The indexes are required: the app queries `status == 'published'` combined with
`updatedAt` ordering, and without the composite index those queries fail with a
"missing index" error and a link to create it.

### Confirm the rules work before you deploy

```bash
npm run test:rules
```

72 assertions against the emulator: one student cannot read another's notes,
a student cannot make themselves an owner, drafts are invisible to the public,
the audit log cannot be edited, and unknown collections are denied. This needs
Java 21.

## 6. Seed the library (easy to forget)

The starter courses and guides live in `shared/content-seed.json` and, before
this step, only the browser demo store reads them. **Without seeding, the public
library is empty the moment Firebase is configured.**

Create a service account key: **Project settings → Service accounts → Generate
new private key**. Save the JSON **outside the repository**.

```bash
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/key.json \
  node scripts/seed-firestore.mjs --project your-project-id --dry-run   # preview

GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/key.json \
  node scripts/seed-firestore.mjs --project your-project-id             # write
```

Re-running skips documents that already exist, so it never overwrites an edit
made in the admin panel. `--force` overwrites deliberately.

Delete the key file when you are done. It can write to your whole database.

## 7. Make yourself the owner

There is deliberately **no default admin password and no self-promotion path**.
Create the first owner by hand, once:

1. Sign up on the site, then open **Firestore → `users`** and copy your document
   id — that is your uid. (Or Authentication → Users → User UID.)
2. **Firestore → Start collection**: `roles`
3. Document id: *your uid*, field `role` (string) = `owner`
4. Reload `/admin`. The header shows your email and "Owner".

Everyone after that is granted from the admin panel or the console.

## 8. Verify

```bash
node scripts/health-check.mjs                       # 34 production checks
BASE_URL=https://ujyalo-learn.vercel.app npm run test:ui   # 72 browser checks
```

Then, by hand, because no automated test covers a real account:

- [ ] Sign up with a new email → onboarding → dashboard shows a **cloud** badge,
      not "local demo mode"
- [ ] Ask the tutor something, reload the page — the conversation is still there
- [ ] Sign out, sign in on a different browser — the same conversation is there
- [ ] Forgot password → the email arrives → the link works
- [ ] Make a second account, confirm it **cannot** see the first account's notes
      (this is the one to do carefully: it is the promise the rules make)
- [ ] Delete the second account → its data is gone

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Still says "Local demo mode" | env vars not present at **build** time | set them in Vercel, then redeploy — editing them does not rebuild |
| `auth/unauthorized-domain` on sign-in | domain not authorized | §2, add `ujyalo-learn.vercel.app` |
| `auth/invalid-api-key` | key from another project, or copied with a stray space | re-copy; run `check-firebase.mjs` |
| `Missing or insufficient permissions` | rules deployed before the role document existed, or you are not signed in | §7, and check `roles/{uid}` exists |
| Library is empty | seed not run | §6 |
| "The query requires an index" | indexes not deployed | `npx firebase deploy --only firestore:indexes` |
| Chat history empty after reload | signed in with a different account than you think | check the email in the sidebar |

## What changes once this is done

| | Before | After |
| --- | --- | --- |
| Accounts | this browser only | real, with password reset |
| Notes, quizzes, chats | lost on cache clear | synced across devices |
| Admin panel | local demo workspace | real, enforced by rules |
| Student privacy | not enforceable | enforced by the database |
| Cost | 0 | free tier; watch Reads/Writes for a large pilot |

The UI removes the demo banner automatically — it is driven by
`isFirebaseConfigured`, not by a manual switch.

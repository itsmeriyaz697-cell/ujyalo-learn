# Deploying Ujyalo Learn to Vercel

**Status on 22 Oct 2026:** the Vercel project is **created and configured**, but **no deployment exists yet**. The source code is ready in this repository (one commit on `main`), and this sandbox has no way to push it to your Git account or upload ~700 KB of source through the deployment API. One short step from you finishes it.

| Item | Value |
| --- | --- |
| Vercel project | `ujyalo-learn` |
| Project ID | `prj_47vCu0YYG9Ia5LH2jX2ilVCmIsDD` |
| Team | `team_8aSlMHA5REps8m9O4Wv9c7AF` (your account) |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Status | ⏳ awaiting first deployment |

## Environment variables already set on the project

These are non-secret defaults, chosen because your Vercel account already uses Groq:

| Key | Value |
| --- | --- |
| `AI_API_BASE_URL` | `https://api.groq.com/openai/v1` |
| `AI_MODEL` | `openai/gpt-oss-120b` |
| `AI_PROVIDER_NAME` | `groq` |
| `AI_ALLOWED_HOSTS` | `api.groq.com` |
| `AI_MAX_OUTPUT_TOKENS` | `2000` |

Still missing (you must add these — I will not put keys in a repository or invent them):

| Key | Where to get it |
| --- | --- |
| `AI_API_KEY` | <https://console.groq.com/keys> (or any OpenAI-compatible provider) |
| `VITE_FIREBASE_API_KEY` | Firebase console → Project settings → Your apps → Web app |
| `VITE_FIREBASE_AUTH_DOMAIN` | same |
| `VITE_FIREBASE_PROJECT_ID` | same |
| `VITE_FIREBASE_APP_ID` | same |
| `VITE_SITE_URL` | set **after** the first deploy, to the real domain |
| `AI_REQUIRE_AUTH` | `true` once Firebase is configured (recommended) |
| `FIREBASE_PROJECT_ID`, `FIREBASE_WEB_API_KEY` | needed for server-side token checks |

If you switch to OpenAI, change `AI_API_BASE_URL` to `https://api.openai.com/v1`, `AI_MODEL` to `gpt-4o-mini`, `AI_PROVIDER_NAME` to `openai`, and `AI_ALLOWED_HOSTS` to `api.openai.com`.

---

## Option A — GitHub (recommended, ~2 minutes)

The repository is already committed locally. From this workspace:

```bash
cd ujyalo-learn

# 1. Create an empty repo named ujyalo-learn at https://github.com/new
#    (no README, no .gitignore — keep it completely empty)

# 2. Point this repo at it and push
git remote add origin https://github.com/<your-username>/ujyalo-learn.git
git push -u origin main
```

Then in Vercel: **Add New → Project → Import** `ujyalo-learn`.
Vercel will read `vercel.json` and the settings above, so accept the defaults and press **Deploy**.

Every later `git push` to `main` redeploys automatically.

## Option B — Vercel CLI (~3 minutes)

If you would rather not use GitHub:

```bash
npm i -g vercel
cd ujyalo-learn
vercel login
vercel link --project ujyalo-learn      # links to the project already created
vercel --prod
```

The CLI uploads the working directory (respecting `.gitignore`), which is exactly what this sandbox cannot do.

## Option C — let me deploy from here

If you create a Vercel access token (<https://vercel.com/account/tokens>, scope: your team) and paste it in the chat, I can run the CLI in this workspace and finish the deployment myself. Treat the token as disposable: revoke it afterwards.

---

## After the first successful deployment

1. **Copy the production URL** Vercel shows (e.g. `https://ujyalo-learn.vercel.app`).
2. Set `VITE_SITE_URL` to that exact URL in Vercel → Settings → Environment Variables (Production), then **Redeploy**.
   This enables canonical links, `og:url`, and generates `sitemap.xml`. Until it is set, those tags are omitted rather than pointing at a domain that is not live.
3. **Firebase authorised domains** → Authentication → Settings → Authorized domains → add the Vercel domain.
4. **Publish Firestore rules** (from this repo):
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add          # pick your project
   firebase deploy --only firestore:rules,firestore:indexes
   ```
5. **Verify**:
   ```bash
   curl https://<your-domain>/api/health
   # { "ok": true, "configured": true, "provider": "groq", ... }
   ```
   `configured: false` means `AI_API_KEY` is missing or the provider settings do not match.
6. Sign up on the live site and confirm the header no longer says *Local demo mode*.

## What works immediately after deploy (no extra keys)

- Every public page, SEO metadata, 404, PWA install, offline shell
- Sign-up / sign-in in clearly labelled **local demo mode** (data stays in the visitor's browser)
- Onboarding, dashboard, notes, flashcards (manual), planner, progress, settings, data export
- The AI screens show an explicit *“AI provider not configured”* state with setup help — they never invent an answer

## What needs the keys above

- Real accounts, cloud sync, cross-device data (Firebase)
- AI tutor, quiz generation, flashcard generation, all four study tools (`AI_API_KEY`)
- Google sign-in (Firebase Google provider + authorised domain)
- Email verification / password reset emails (Firebase Auth)

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Build fails: `tsc: not found` | dependencies not installed | `npm install` (Vercel does this automatically) |
| `/api/*` returns 404 | `api/` folder not uploaded | check the deployment file tree; `api/**/*.ts` must be present |
| Functions time out | provider slow | raise `AI_REQUEST_TIMEOUT_MS`, Vercel `maxDuration` is 60 s in `vercel.json` |
| `configured: false` in `/api/health` | missing `AI_API_KEY` or host not allowlisted | add the key; confirm `AI_ALLOWED_HOSTS` contains your provider host |
| `401 provider_auth_error` | wrong/expired key | rotate the key in the provider dashboard |
| Blank page after deploy | `VITE_SITE_URL` wrong or SPA rewrite missing | keep the rewrite in `vercel.json`; clear the service-worker cache |
| “Local demo mode” banner in production | `VITE_FIREBASE_*` missing | add them and redeploy |

# Deployment and rollback

Production: `https://ujyalo-learn.vercel.app` (team `itsmeriyaz697-cells-projects`).

## Deploy

```bash
VITE_SITE_URL=https://ujyalo-learn.vercel.app npm run build   # gate: prerender + links
./node_modules/.bin/vercel --prod --yes --token "$VERCEL_TOKEN"
./node_modules/.bin/vercel alias set <deployment-url> ujyalo-learn.vercel.app --token "$VERCEL_TOKEN"
```

`vercel --prod` does **not** move the alias — always run `alias set` afterwards.

Never hardcode the token. Export it for the session or use `vercel login`.

## Verify after deploying

```bash
node scripts/health-check.mjs                              # 34 checks, exits non-zero on failure
BASE_URL=https://ujyalo-learn.vercel.app npm run test:ui   # 72 browser checks
BASE_URL=https://ujyalo-learn.vercel.app npm run test:a11y # 20 a11y checks
```

## Rollback

Promote the previous deployment. This is a pointer move — instant, and no data
migration is involved.

```bash
vercel ls --token "$VERCEL_TOKEN"          # find the previous Ready deployment
vercel alias set <previous-url> ujyalo-learn.vercel.app --token "$VERCEL_TOKEN"
```

Or in the dashboard: Deployments → choose the last good one → *Promote to Production*.

## If a build fails on Vercel but passes locally

Almost always the lockfile. Vercel runs plain `npm install`; if you installed
locally with `--legacy-peer-deps` or `--force`, the tree may not resolve for it.

```bash
rm -rf node_modules package-lock.json && npm install   # must succeed with no flags
npm ci                                                  # must also succeed
```

## Scheduled health checks

`health.yml` runs every 6 hours once the repo is on GitHub. To run the same check
locally on a schedule (for example on a small server):

```cron
17 */6 * * * cd /path/to/ujyalo-learn && /usr/bin/node scripts/health-check.mjs >> /var/log/ujyalo-health.log 2>&1
```

A failed run writes one line per failing check plus recovery steps. It never
modifies the site.

#!/usr/bin/env node
/**
 * Submit the site's URLs to Bing Webmaster Tools.
 *
 * Two ways to use it:
 *
 *   node scripts/submit-urls.mjs                    # dry run: show what would be sent
 *   node scripts/submit-urls.mjs --submit           # actually submit
 *
 * Auth: put your key in the environment, never in a file that gets committed.
 *
 *   BING_WEBMASTER_API_KEY=xxxx node scripts/submit-urls.mjs --submit
 *
 * Get the key in Bing Webmaster Tools -> Settings -> API Access -> Generate.
 * It is per-user, valid for every verified site, and can be regenerated (which
 * breaks anything still using the old one).
 *
 * The list comes from the live sitemap, so it can never drift from what the site
 * actually publishes. Quota is read first and the list is trimmed to fit, because
 * submitting more than the daily allowance returns an error.
 */

const DEFAULT_SITE = 'https://ujyalo-learn.vercel.app';
const API = 'https://ssl.bing.com/webmaster/api.svc/json';
const MAX_BATCH = 500;

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const valueOf = (name, fallback) => {
  const withEquals = args.find((a) => a.startsWith(`${name}=`));
  if (withEquals) return withEquals.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const siteUrl = valueOf('--site', DEFAULT_SITE).replace(/\/$/, '');
const submit = flag('--submit');
const limit = Number(valueOf('--limit', '0')) || 0;
const apiKey = process.env.BING_WEBMASTER_API_KEY || valueOf('--key', '');

/**
 * Priority order: if the daily quota is smaller than the site, the pages that
 * earn traffic go first. Mirrors docs/urls-to-submit.txt.
 */
const ORDER = [
  /^\/$/,
  /^\/see-preparation$/,
  /^\/grades\/10$/,
  /^\/subjects$/,
  /^\/courses$/,
  /^\/resources$/,
  /^\/ai-tutor$/,
  /^\/courses\/see-mathematics-core$/,
  /^\/courses\/see-science-concepts$/,
  /^\/features$/,
  /^\/pricing$/,
  /^\/about$/,
  /^\/faq$/,
  /^\/courses\//,
  /^\/resources\//,
  /^\/grades\//,
];

function rank(url) {
  const path = new URL(url).pathname;
  const index = ORDER.findIndex((pattern) => pattern.test(path));
  return index === -1 ? ORDER.length : index;
}

async function readSitemap() {
  const response = await fetch(`${siteUrl}/sitemap.xml`);
  if (!response.ok) throw new Error(`sitemap fetch failed: HTTP ${response.status}`);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (!urls.length) throw new Error('sitemap contained no <loc> entries');
  // Stable sort: rank first, then sitemap order.
  return urls
    .map((url, i) => ({ url, i }))
    .sort((a, b) => rank(a.url) - rank(b.url) || a.i - b.i)
    .map((entry) => entry.url);
}

async function getQuota() {
  const url = `${API}/GetUrlSubmissionQuota?apikey=${encodeURIComponent(apiKey)}&siteUrl=${encodeURIComponent(siteUrl)}`;
  const response = await fetch(url);
  const body = await response.text();
  if (!response.ok) throw new Error(`quota check failed: HTTP ${response.status} ${body.slice(0, 200)}`);
  const parsed = JSON.parse(body);
  return parsed?.d ?? {};
}

async function submitBatch(urlList) {
  const response = await fetch(`${API}/SubmitUrlBatch?apikey=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ siteUrl, urlList }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`submit failed: HTTP ${response.status} ${body.slice(0, 400)}`);
  return body;
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

async function main() {
  const all = await readSitemap();
  console.log(`sitemap: ${all.length} URLs from ${siteUrl}`);

  let planned = all;
  if (!submit) {
    console.log('\nDRY RUN — nothing was sent. Add --submit to send for real.\n');
    planned.forEach((url, i) => console.log(`${String(i + 1).padStart(3)}. ${url}`));
    console.log(`\n${planned.length} URLs would be submitted (priority order, see docs/urls-to-submit.txt).`);
    return;
  }

  if (!apiKey) {
    console.error('\nMissing API key. Set BING_WEBMASTER_API_KEY, or pass --key=<key>.');
    console.error('Bing Webmaster Tools -> Settings -> API Access -> Generate.\n');
    process.exitCode = 1;
    return;
  }

  const quota = await getQuota();
  const daily = Number(quota.DailyQuota ?? quota.dailyQuota ?? 0);
  console.log(`quota: ${daily} URLs left today`);

  if (daily > 0) planned = planned.slice(0, daily);
  if (limit > 0) planned = planned.slice(0, limit);

  if (!planned.length) {
    console.log('No quota left — nothing to do. Try again after the daily reset.');
    return;
  }

  const batches = chunk(planned, MAX_BATCH);
  console.log(`submitting ${planned.length} URLs in ${batches.length} batch(es)...\n`);

  let ok = 0;
  for (const [index, batch] of batches.entries()) {
    try {
      await submitBatch(batch);
      ok += batch.length;
      console.log(`  batch ${index + 1}/${batches.length}: ${batch.length} URLs accepted`);
    } catch (error) {
      console.error(`  batch ${index + 1}/${batches.length}: FAILED — ${error.message}`);
      process.exitCode = 1;
      break;
    }
  }

  console.log(`\n${ok}/${planned.length} URLs submitted.`);
  if (ok < planned.length) {
    console.log(`Remaining ${planned.length - ok} URLs are still listed in docs/urls-to-submit.txt.`);
  }
  console.log('This queues a crawl. It does not guarantee indexing.');
}

main().catch((error) => {
  console.error(`\n${error.message}\n`);
  process.exitCode = 1;
});

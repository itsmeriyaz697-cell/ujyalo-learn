/**
 * Measures what a first-time visitor actually sees on a throttled phone:
 * the prerendered HTML paint, then React taking over.
 *
 * Reports FCP/LCP/CLS plus every layout shift with the element that moved, so
 * "something jumps before the page appears" can be traced to a real node
 * instead of guessed at.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173';
const OUT = '/home/user/shots-firstpaint';
mkdirSync(OUT, { recursive: true });

const pages = process.argv.slice(3).length ? process.argv.slice(3) : ['/', '/courses', '/login'];

const browser = await chromium.launch();

for (const path of pages) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  // Slow 4G, as Chrome DevTools defines it.
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await page.addInitScript(() => {
    window.__shifts = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__shifts.push({
            value: entry.value,
            at: Math.round(entry.startTime),
            sources: (entry.sources ?? []).map((source) => ({
              node: source.node
                ? (source.node.nodeName + ' ' + (source.node.className || '')).slice(0, 90)
                : '(detached)',
              prev: source.previousRect
                ? `${Math.round(source.previousRect.x)},${Math.round(source.previousRect.y)} ${Math.round(source.previousRect.width)}x${Math.round(source.previousRect.height)}`
                : '',
              next: source.currentRect
                ? `${Math.round(source.currentRect.x)},${Math.round(source.currentRect.y)} ${Math.round(source.currentRect.width)}x${Math.round(source.currentRect.height)}`
                : '',
            })),
          });
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  const started = Date.now();
  await page.goto(BASE + path, { waitUntil: 'commit' });

  const tag = path.replace(/\//g, '_') || '_home';
  const box = () =>
    page.evaluate(() => {
      const pick = (selector) => {
        const node = document.querySelector(selector);
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y + window.scrollY),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        };
      };
      return {
        header: pick('header'),
        h1: pick('h1'),
        cta: pick('a.pr-btn, header a[class*="btn"], main a.btn, .pr-cta a'),
        footer: pick('footer'),
        isPrerender: Boolean(document.querySelector('.pr')),
      };
    });

  // A: the prerendered HTML, before React has touched it.
  await page.waitForSelector('.pr, #root > *', { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));
  const prerender = await box();
  await page.screenshot({ path: `${OUT}/${tag}-A-prerender.png` });
  const paintAt = Date.now() - started;

  // B: the real app after React mounts.
  await page.waitForFunction(() => !document.querySelector('.pr'), null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(400);
  const mounted = await box();
  await page.screenshot({ path: `${OUT}/${tag}-B-mounted.png` });
  const mountAt = Date.now() - started;

  // C: after the page's own data has arrived (course pages fetch Firestore).
  await page.waitForSelector('main h1, #root h1', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
  const loaded = await box();
  await page.screenshot({ path: `${OUT}/${tag}-C-loaded.png` });

  console.log(`\n=== ${path} ===`);
  console.log(`prerender visible at ${paintAt}ms, React mounted at ${mountAt}ms`);
  for (const key of ['header', 'h1', 'cta', 'footer']) {
    const a = prerender[key];
    const b = loaded[key];
    if (!a && !b) continue;
    const delta = a && b
      ? `Δy=${b.y - a.y}px Δh=${b.h - a.h}px Δw=${b.w - a.w}px`
      : 'present in only one state';
    console.log(`  ${key}: prerender ${JSON.stringify(a)}  mounted ${JSON.stringify(b)}  ${delta}`);
  }

  const metrics = await page.evaluate(() => {
    const paint = performance.getEntriesByType('paint').map((p) => ({ name: p.name, at: Math.round(p.startTime) }));
    const lcp = performance.getEntriesByType('largest-contentful-paint').at(-1);
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      paint,
      lcp: lcp ? { at: Math.round(lcp.startTime), size: Math.round(lcp.size) } : null,
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      load: nav ? Math.round(nav.loadEventEnd) : null,
      cls: (window.__shifts ?? []).reduce((sum, shift) => sum + shift.value, 0),
      shifts: window.__shifts ?? [],
      textNow: document.body.innerText.slice(0, 120),
    };
  });

  console.log('paint:', JSON.stringify(metrics.paint), 'lcp:', JSON.stringify(metrics.lcp));
  console.log('domContentLoaded:', metrics.domContentLoaded, 'load:', metrics.load);
  console.log('CLS:', metrics.cls.toFixed(4));
  for (const shift of metrics.shifts) {
    console.log(`  shift ${shift.value.toFixed(4)} at ${shift.at}ms`);
    for (const source of shift.sources) console.log(`     moved: ${source.node} ${source.prev} -> ${source.next}`);
  }

  await context.close();
}

await browser.close();

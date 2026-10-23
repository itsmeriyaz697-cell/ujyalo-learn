/**
 * Builds dist/app-shell.html — the HTML served for client-only routes.
 *
 * Why this exists: the SPA rewrites used to send /login, /signup, /app/*
 * and every unmatched course slug to /index.html. dist/index.html is the
 * *prerendered home page*, so opening /login showed the home hero for about a
 * second and then swapped to the login form — a visibly wrong page before the
 * right one. The shell keeps the same stylesheet, fonts and theme bootstrap
 * (so colours and layout are already correct) but renders a neutral brand
 * splash in #root instead of somebody else's page.
 *
 * It is `noindex`: crawlers should never treat these URLs as a copy of home.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');

const shellSplash = `<div class="app-shell" aria-hidden="true">
      <svg width="56" height="56" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="15" fill="#15245F"/><g stroke="#F7B733" stroke-width="2.4" stroke-linecap="round"><path d="M32 9v4.6"/><path d="M19.6 13l2.8 3.4"/><path d="M44.4 13l-2.8 3.4"/><path d="M12.5 23.6l4.3 1.4"/><path d="M51.5 23.6l-4.3 1.4"/></g><circle cx="32" cy="26.5" r="7.6" fill="#F7B733"/><path d="M8 37.5c7-4 16-3.4 24 2 8-5.4 17-6 24-2V50c-7-4-16-3.5-24 1.7C24 47.5 15 47 8 50V37.5Z" fill="#FFFFFF"/><path d="M32 39.5v12.1" stroke="#92B0FF" stroke-width="1.5" stroke-linecap="round"/><path d="M13.5 40c4.5-2.1 9.9-2.1 14.5.4M50.5 40c-4.5-2.1-9.9-2.1-14.5.4" stroke="#2947D6" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></svg>
    </div>`;

const shellCss = `<style>
      .app-shell{display:flex;min-height:100dvh;align-items:center;justify-content:center;background:var(--bg)}
      .app-shell svg{opacity:.9}
    </style>`;

let out = html;

// Replace everything inside #root with the neutral splash.
const open = out.indexOf('<div id="root">');
if (open === -1) throw new Error('app-shell: #root not found in dist/index.html');
const close = out.lastIndexOf('</div>', out.indexOf('</body>'));
out = out.slice(0, open) + `<div id="root">${shellSplash}</div>` + out.slice(close + '</div>'.length);

// Nothing about the home page may leak into a route that is not the home page.
out = out
  .replace(/<title>[\s\S]*?<\/title>/, '<title>Ujyalo Learn</title>')
  .replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, nofollow">')
  .replace(/<meta name="description"[^>]*>/, '')
  .replace(/<link rel="canonical"[^>]*>/, '')
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
  .replace(/<meta property="og:[^"]*"[^>]*>/g, '')
  .replace(/<meta name="twitter:[^"]*"[^>]*>/g, '');

// Put the splash style immediately before </head>.
out = out.replace('</head>', `${shellCss}\n  </head>`);

writeFileSync('dist/app-shell.html', out);

const leftover = out.includes('class="pr"');
console.log(
  `[app-shell] wrote dist/app-shell.html (${(out.length / 1024).toFixed(1)} KB), prerendered home markup removed: ${!leftover}`,
);
if (leftover) throw new Error('app-shell: home markup still present');

/*
 * Theme bootstrap — runs before first paint so the page never flashes the
 * wrong colour scheme.
 *
 * This lives in its own file rather than an inline <script> so the site can
 * ship a strict Content-Security-Policy with `script-src 'self'` and no
 * 'unsafe-inline'. Keep it dependency-free and synchronous: it must finish
 * before the body renders, which is why it is not deferred or async.
 */
(function () {
  try {
    var stored = localStorage.getItem('ujyalo:theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {
    /* localStorage can throw in private mode; the default theme is fine. */
  }
})();

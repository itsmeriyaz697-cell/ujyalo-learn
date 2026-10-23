/*
 * Google Analytics (GA4) loader.
 *
 * Three constraints shape this file:
 *
 * 1. The site ships a strict Content-Security-Policy with no 'unsafe-inline',
 *    so Google's copy-paste snippet cannot be inlined into index.html. Loading
 *    from a same-origin file is the CSP-safe equivalent.
 * 2. This site is used by school students, including children, so analytics is
 *    opt-in. Nothing is sent until the visitor accepts, and the choice is
 *    remembered. Declining is as easy as accepting and never blocks the app.
 * 3. It must never delay the page. Nothing is fetched until after load.
 *
 * React sends the page views and events (src/lib/analytics.ts); this file only
 * makes `window.gtag` available once consent exists.
 */
(function () {
  var MEASUREMENT_ID = 'G-5WQBY059FZ';
  var CONSENT_KEY = 'ujyalo:analytics-consent';
  var loaded = false;

  function readConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY);
    } catch (error) {
      return null; // Private mode: treat as "not decided" — do not track.
    }
  }

  function load() {
    if (loaded) return;
    loaded = true;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      // GA's own queueing contract: arguments, not an array.
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    // Advertising is never enabled; this site does not run ads or remarketing.
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
    });
    window.gtag('config', MEASUREMENT_ID, {
      anonymize_ip: true,
      send_page_view: false, // React Router reports each route instead.
    });

    window.dispatchEvent(new Event('ujyalo:analytics-ready'));
  }

  if (readConsent() === 'granted') load();

  window.addEventListener('ujyalo:consent', function (event) {
    if (event.detail === 'granted') load();
  });

  // Exposed for the consent banner and for tests.
  window.ujyaloAnalytics = {
    state: readConsent,
    load: load,
    measurementId: MEASUREMENT_ID,
  };
})();

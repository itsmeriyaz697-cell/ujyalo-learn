import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsEnabled, trackPageView } from '@/lib/analytics';

/**
 * Reports one page view per route change.
 *
 * Private screens are not counted at all: what a signed-in student reads is
 * their business, and it is not useful for growth analysis either.
 */
const PRIVATE_PREFIXES = ['/app', '/admin', '/onboarding', '/verify-email', '/forgot-password', '/login', '/signup'];

export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return;

    const send = () => trackPageView(path, document.title);
    if (analyticsEnabled()) send();
    // If consent was granted in this session, analytics.js announces itself
    // after loading; send the first page view then, not before.
    else window.addEventListener('ujyalo:analytics-ready', send, { once: true });

    return () => window.removeEventListener('ujyalo:analytics-ready', send);
  }, [location.pathname]);

  return null;
}

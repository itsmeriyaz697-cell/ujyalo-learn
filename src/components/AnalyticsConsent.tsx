import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { readConsent, setConsent } from '@/lib/analytics';

/**
 * Analytics is opt-in because many users are school students, some of them
 * children. The app is fully usable either way: declining changes nothing
 * except whether page views are counted.
 *
 * The bar sits above the footer instead of covering the page, and it never
 * blocks scrolling or the tutor.
 */
export function AnalyticsConsent() {
  // Read once, on first render: the app is client-rendered, so this cannot
  // disagree with the HTML. `null` means "not decided yet" — show the bar.
  const [choice, setChoice] = useState<'granted' | 'denied' | null | 'hidden'>(() =>
    readConsent() === null ? null : 'hidden',
  );
  const barRef = useRef<HTMLDivElement | null>(null);

  // The bar is fixed to the bottom of the viewport. Without this, it covered
  // the last row of whatever page was open — on a phone that was the
  // onboarding "Continue" button, so a first-time visitor could not get past
  // step one until they answered a question about analytics. Reserve the same
  // height in the page so every control can scroll clear of it.
  useEffect(() => {
    if (choice !== null) return;
    const bar = barRef.current;
    if (!bar) return;

    const apply = () => {
      document.body.style.paddingBottom = `${bar.offsetHeight}px`;
    };
    apply();

    const observer = new ResizeObserver(apply);
    observer.observe(bar);
    window.addEventListener('resize', apply);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', apply);
      document.body.style.paddingBottom = '';
    };
  }, [choice]);

  if (choice === 'hidden') return null;

  function decide(value: 'granted' | 'denied') {
    setConsent(value);
    setChoice(value);
  }

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-50 border-t px-3 py-2.5 shadow-lift sm:px-4 sm:py-3"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
      role="region"
      aria-label="Analytics choice"
    >
      <div className="container-page flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <BarChart3 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <p className="text-[12px] leading-snug sm:text-[13px] sm:leading-relaxed" style={{ color: 'var(--text-soft)' }}>
            May we count page views with Google Analytics? It shows which lessons help and which confuse. No names,
            emails or answers are sent — and everything still works if you say no.{' '}
            <Link to="/privacy" className="underline" style={{ color: 'var(--primary)' }}>
              Privacy policy
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="secondary" onClick={() => decide('denied')}>
            No thanks
          </Button>
          <Button size="sm" onClick={() => decide('granted')}>
            Allow analytics
          </Button>
        </div>
      </div>
    </div>
  );
}

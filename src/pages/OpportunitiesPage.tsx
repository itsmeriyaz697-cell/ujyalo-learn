import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, Filter, ShieldCheck } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { seoFor } from '@/config/seoPages';
import {
  CATEGORIES,
  OPPORTUNITIES,
  formatDate,
  isExpired,
  todayInNepal,
  type OpportunityCategory,
} from '@/features/opportunities/data';
import { cn } from '@/lib/utils';

type FilterValue = OpportunityCategory | 'All';

export function OpportunitiesPage() {
  const [filter, setFilter] = useState<FilterValue>('All');
  const [showExpired, setShowExpired] = useState(false);
  const today = todayInNepal();

  const items = useMemo(() => {
    const matching = OPPORTUNITIES.filter((item) => filter === 'All' || item.category === filter);
    const visible = matching.filter((item) => showExpired || !isExpired(item, today));
    // Soonest deadline first; rolling listings after dated ones, alphabetically.
    return [...visible].sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return a.title.localeCompare(b.title);
    });
  }, [filter, showExpired, today]);

  const expiredCount = OPPORTUNITIES.filter((item) => isExpired(item, today)).length;
  const lastChecked = OPPORTUNITIES.reduce((latest, item) => (item.lastVerified > latest ? item.lastVerified : latest), '');

  return (
    <>
      <Seo
        {...seoFor('/opportunities')}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Educational opportunities for students in Nepal',
          numberOfItems: OPPORTUNITIES.length,
          itemListElement: OPPORTUNITIES.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.title,
            url: item.officialUrl,
          })),
        }}
      />

      <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
        <div className="container-page py-12 sm:py-14">
          <p className="eyebrow">Opportunities</p>
          <h1
            className="mt-3 max-w-3xl text-[2rem] font-extrabold leading-[1.1] tracking-[-0.025em] sm:text-[2.6rem]"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
          >
            Opportunities worth the application
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
            Scholarships, free courses, competitions and programmes a student in Nepal can actually enter. Every
            listing links to the organisation running it, and carries the date we last opened that page.
          </p>

          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div className="flex items-baseline gap-2">
              <dt style={{ color: 'var(--muted)' }}>Listed</dt>
              <dd className="font-bold" style={{ color: 'var(--text)' }}>
                {OPPORTUNITIES.length}
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt style={{ color: 'var(--muted)' }}>Last checked</dt>
              <dd className="font-bold" style={{ color: 'var(--text)' }}>
                {lastChecked ? formatDate(lastChecked) : '—'}
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt style={{ color: 'var(--muted)' }}>Expired, still visible</dt>
              <dd className="font-bold" style={{ color: 'var(--text)' }}>
                {expiredCount}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="container-page py-10">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            Filter
          </span>
          {(['All', ...CATEGORIES] as FilterValue[]).map((value) => {
            const count =
              value === 'All'
                ? OPPORTUNITIES.length
                : OPPORTUNITIES.filter((item) => item.category === value).length;
            const active = filter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={active}
                className={cn('chip', active && 'chip-active')}
                disabled={count === 0 && value !== 'All'}
                title={count === 0 && value !== 'All' ? 'Nothing verified in this category yet' : undefined}
              >
                {value}
                <span className="opacity-60">{count}</span>
              </button>
            );
          })}
          {expiredCount > 0 && (
            <label className="ml-auto inline-flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
              <input
                type="checkbox"
                checked={showExpired}
                onChange={(event) => setShowExpired(event.target.checked)}
                className="h-4 w-4 rounded"
              />
              Show expired
            </label>
          )}
        </div>

        {/* Listings */}
        {items.length === 0 ? (
          <div className="mt-8 rounded-lg border p-8 text-center" style={{ borderColor: 'var(--border)' }}>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>
              Nothing verified in this category yet.
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              We publish a listing only after opening the provider’s own page and confirming the details. An empty
              category means we have not checked anything worth listing there — not that nothing exists.
            </p>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4">
            {items.map((item) => {
              const expired = isExpired(item, today);
              return (
                <li key={item.id}>
                  <article
                    className="rounded-lg border p-5 sm:p-6"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--surface)',
                      opacity: expired ? 0.72 : 1,
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span
                        className="rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em]"
                        style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}
                      >
                        {item.category}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>
                        {item.provider}
                      </span>
                      {expired && (
                        <span
                          className="rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em]"
                          style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
                        >
                          Closed
                        </span>
                      )}
                    </div>

                    <h2
                      className="mt-3 text-xl font-bold tracking-[-0.01em]"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
                    >
                      {item.title}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                      {item.summary}
                    </p>

                    <dl className="mt-4 grid gap-x-8 gap-y-3 border-t pt-4 text-sm sm:grid-cols-2" style={{ borderColor: 'var(--border)' }}>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--muted)' }}>
                          Who can apply
                        </dt>
                        <dd className="mt-1" style={{ color: 'var(--text-soft)' }}>
                          {item.eligibility}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--muted)' }}>
                          Where
                        </dt>
                        <dd className="mt-1" style={{ color: 'var(--text-soft)' }}>
                          {item.availability}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--muted)' }}>
                          Deadline
                        </dt>
                        <dd className="mt-1" style={{ color: 'var(--text-soft)' }}>
                          {item.deadline ? formatDate(item.deadline) : item.deadlineNote}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--muted)' }}>
                          Cost
                        </dt>
                        <dd className="mt-1" style={{ color: 'var(--text-soft)' }}>
                          {item.cost}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <a
                        href={item.officialUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="btn btn-primary btn-sm"
                      >
                        Official page
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Checked {formatDate(item.lastVerified)} on {new URL(item.officialUrl).hostname}
                      </span>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}

        {/* How we verify */}
        <section className="mt-12 rounded-lg border p-6 sm:p-8" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            <ShieldCheck className="h-5 w-5" style={{ color: 'var(--accent-text)' }} aria-hidden="true" />
            How these are checked
          </h2>
          <ul className="mt-4 grid gap-3 text-sm leading-relaxed sm:grid-cols-2" style={{ color: 'var(--text-soft)' }}>
            <li>
              We open the organisation’s own page and confirm the programme exists, who it is for and what it costs.
              Nothing is copied from a list of “top scholarships”.
            </li>
            <li>
              A deadline appears only when the provider publishes one. “Rolling” means we found no fixed date, not
              that we could not be bothered to look.
            </li>
            <li>
              Closed opportunities stay on the page, labelled. Removing them would hide the pattern of what recurs
              each year.
            </li>
            <li>
              Nothing here is paid placement or an affiliate link. If we ever accept sponsorship it will be labelled
              on the listing itself.
            </li>
          </ul>
          <p className="mt-4 text-xs" style={{ color: 'var(--muted)' }}>
            Spotted something out of date?{' '}
            <Link to="/contact" className="underline" style={{ color: 'var(--text)' }}>
              Tell us
            </Link>{' '}
            and it gets re-checked.
          </p>
        </section>
      </div>
    </>
  );
}

/** Lazy routes import the default export. */
export default OpportunitiesPage;

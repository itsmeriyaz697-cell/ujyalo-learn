import { Link } from 'react-router-dom';
import { Check, Info } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Section, SectionHeading } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/Feedback';
import { PRICING_TIERS } from '@/config/curriculum';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  return (
    <>
      <Seo
        title="Pricing"
        description="Ujyalo Learn is free to use, with fair-use AI limits. Optional Plus and School plans are planned for later — no payments are taken today."
        path="/pricing"
      />

      <Section className="!pb-8">
        <SectionHeading
          as="h1"
          eyebrow="Pricing"
          title="Start free. Stay free while you need it."
          description="The core learning experience is free, with fair-use limits that keep AI costs manageable. Paid plans are planned — nothing on this page takes payment."
          align="center"
        />
        <div className="mx-auto mt-5 max-w-2xl">
          <InlineAlert tone="info" title="No payments are enabled">
            Ujyalo Learn does not process payments. The Plus and School tiers below describe intended future plans, not
            purchasable products. Any change will be announced before it takes effect.
          </InlineAlert>
        </div>
      </Section>

      <Section className="!pt-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={cn('card relative flex flex-col p-6', tier.available && 'ring-2')}
              style={tier.available ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary)' } : undefined}
            >
              {tier.available && (
                <span className="absolute -top-3 left-6 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ background: 'var(--primary)', color: 'var(--primary-contrast)' }}>
                  Available now
                </span>
              )}
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {tier.name}
              </h2>
              <p className="mt-1 text-sm text-muted">{tier.tagline}</p>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                  {tier.price}
                </span>
                <span className="text-sm text-muted">{tier.period === 'forever' ? '' : `· ${tier.period}`}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-soft">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-lg px-3 py-2 text-[11px] leading-relaxed" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                {tier.limits}
              </p>
              <div className="mt-4">
                {tier.available ? (
                  <Button asChild fullWidth>
                    <Link to="/signup">Start Learning Free</Link>
                  </Button>
                ) : (
                  <Button asChild variant="secondary" fullWidth>
                    <Link to={tier.id === 'school' ? '/contact' : '/help'}>{tier.cta}</Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            How fair-use limits work
          </h2>
          <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
            <p>
              To keep the service affordable for every student, AI requests have a per-minute and per-day limit. The limits
              are configurable by the site owner and are shown in the app when you approach them.
            </p>
            <p>
              Reading your notes, planning study tasks and reviewing quiz history do not use AI credits, so you can keep
              learning even after you reach a limit for the day.
            </p>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl border p-3 text-xs text-muted" style={{ borderColor: 'var(--border)' }}>
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              We do not currently offer “unlimited” AI access. If infrastructure ever supports it, the limits will be
              updated openly rather than advertised ahead of time.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}

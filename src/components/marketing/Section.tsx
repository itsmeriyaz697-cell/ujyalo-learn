import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Section({
  children,
  className,
  tone = 'default',
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: 'default' | 'surface';
  id?: string;
}) {
  return (
    <section id={id} className={cn('py-14 sm:py-20', className)} style={tone === 'surface' ? { background: 'var(--surface)' } : undefined}>
      <div className="container-page">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  as: Tag = 'h2',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2';
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag className={cn('section-title', eyebrow && 'mt-2')}>{title}</Tag>
      {description && <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>}
    </div>
  );
}

export function FeatureCard({
  icon,
  title,
  description,
  meta,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  meta?: string;
}) {
  return (
    <div className="card card-hover p-5">
      <span
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <h3 className="mt-4 text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
      {meta && <p className="mt-3 text-xs font-medium" style={{ color: 'var(--primary)' }}>{meta}</p>}
    </div>
  );
}

export function Faq({
  items,
}: {
  items: Array<{ question: string; answer: string }>;
}) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${index}`}
                id={`faq-button-${index}`}
                onClick={() => setOpen(isOpen ? null : index)}
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {item.question}
                </span>
                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
                  style={{ color: 'var(--muted)' }}
                  aria-hidden="true"
                />
              </button>
            </h3>
            {isOpen && (
              <div id={`faq-panel-${index}`} role="region" aria-labelledby={`faq-button-${index}`} className="px-5 pb-5">
                <p className="max-w-2xl text-sm leading-relaxed text-muted">{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

/**
 * Hero art: an illustration of a student with mountains behind, plus a small
 * labelled mock of the tutor card. Both are decorative — the card is a design
 * preview, not a real conversation, and it says so for screen readers.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[540px] lg:max-w-none">
      <div
        className="relative overflow-hidden rounded-[28px] border shadow-lift"
        style={{
          borderColor: 'color-mix(in srgb, var(--primary) 18%, var(--border))',
          background: 'linear-gradient(180deg, #E8F2FF 0%, #F6FAFF 70%, #FDF8EC 100%)',
        }}
      >
        <img
          src="/hero-student.webp"
          alt=""
          width={620}
          height={764}
          {...{ fetchpriority: 'high' }}
          decoding="async"
          className="h-[330px] w-full object-cover object-top sm:h-[400px] lg:h-[470px]"
          onError={(event) => {
            const image = event.currentTarget;
            if (!image.src.endsWith('.png')) image.src = '/hero-student.png';
          }}
        />

        {/* Soft fade so the illustration sits inside the card. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{ background: 'linear-gradient(180deg, transparent, color-mix(in srgb, var(--surface) 92%, transparent))' }}
          aria-hidden="true"
        />
      </div>

      {/* Floating tutor card */}
      <figure
        className="absolute -bottom-6 left-0 w-[290px] rounded-2xl border p-3 shadow-xl sm:-left-6 sm:w-[320px]"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'var(--primary)', color: '#fff' }}
            aria-hidden="true"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <p className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>
            Ujyalo AI Tutor
          </p>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--success)' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)' }} aria-hidden="true" />
            Online
          </span>
        </div>

        <div
          className="mt-2.5 rounded-xl rounded-bl-sm px-2.5 py-2 text-[11.5px] leading-relaxed"
          style={{ background: 'var(--surface-2)', color: 'var(--text-soft)' }}
        >
          Explain photosynthesis simply, with one example from Nepal.
        </div>
        <div className="mt-1.5 flex items-start gap-1.5">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--success)' }} aria-hidden="true" />
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Step-by-step answer, then 2 practice questions.
          </p>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1">
          {['Explain a concept', 'SEE revision', 'Quiz me'].map((chip) => (
            <span key={chip} className="chip !px-2 !py-0.5 !text-[10px]">
              {chip}
            </span>
          ))}
        </div>
        <figcaption className="sr-only">
          Illustration of the Ujyalo Learn tutor interface. Answers are AI-generated and can be wrong.
        </figcaption>
      </figure>

      {/* Gold badge */}
      <div
        className="absolute -right-2 top-4 hidden items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold shadow-lg sm:inline-flex"
        style={{ background: 'var(--accent)', color: '#2B1D00' }}
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        AI-powered learning
      </div>

      <div className="mt-10 flex items-center justify-end gap-2 sm:mt-8">
        <Link
          to="/features"
          className="inline-flex items-center gap-1 text-[12px] font-medium hover:underline"
          style={{ color: 'var(--primary)' }}
        >
          See what the tutor can do
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

import { Lightbulb, Send, Sparkles } from 'lucide-react';

/**
 * A static, clearly-labelled preview of the tutor interface.
 * It is a design illustration — not a real conversation or student data.
 */
export function TutorPreview() {
  return (
    <figure className="relative mx-auto w-full max-w-lg">
      <div
        className="card overflow-hidden shadow-lift"
        style={{ background: 'var(--surface)' }}
        aria-label="Preview of the Ujyalo Learn AI tutor interface"
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                Your tutor
              </p>
              <p className="text-[11px] text-muted">Grade 10 · Explain Simply</p>
            </div>
          </div>
          <span className="badge badge-gold">
            <Lightbulb className="h-3 w-3" aria-hidden="true" /> Explain Simply
          </span>
        </div>

        <div className="space-y-3 px-4 py-4" style={{ background: 'var(--bg)' }}>
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13px] leading-relaxed" style={{ background: 'var(--primary)', color: 'var(--primary-contrast)' }}>
            Why does a rainbow have seven colours? 🌈
          </div>

          <div className="max-w-[92%] rounded-2xl rounded-bl-md border px-3.5 py-3 text-[13px] leading-relaxed" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-soft)' }}>
            <p>
              Sunlight looks white, but it is actually a mix of many colours. When sunlight enters a raindrop, it bends —
              and each colour bends by a slightly different amount.
            </p>
            <p className="mt-2 text-[12px] font-medium" style={{ color: 'var(--text)' }}>
              That spreading-out is called <em>dispersion</em>.
            </p>
            <div className="mt-2.5 rounded-lg border px-3 py-2 text-[12px]" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              Red bends the least · Violet bends the most
            </div>
            <p className="mt-2.5 text-[11px] text-muted">Want a 3-question quiz to check this?</p>
          </div>

          <div className="flex items-center gap-1.5">
            {['Check my understanding', 'Explain with an example'].map((chip) => (
              <span key={chip} className="chip !py-1 !text-[11px]">
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t p-3" style={{ borderColor: 'var(--border)' }}>
          <div className="input !min-h-0 flex-1 !py-2 text-[12px] text-muted">Ask anything you are studying…</div>
          <span className="btn btn-primary !min-h-9 !px-3 !py-2" aria-hidden="true">
            <Send className="h-4 w-4" />
          </span>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-[11px] text-muted">
        Interface preview. Answers are AI-generated and may contain mistakes.
      </figcaption>
    </figure>
  );
}

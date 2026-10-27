import { useId } from 'react';

/**
 * The hero's right-hand panel: a real question with a real explanation, drawn
 * in type and one small SVG rather than as a cartoon or a fake dashboard.
 *
 * A screenshot of a dashboard says "we have a dashboard". A worked answer says
 * what the product actually does in the four seconds a visitor gives a page,
 * and it is honest: the label underneath says it is a sample.
 */
export function WorkedExample() {
  const lineId = useId();

  return (
    <figure
      className="relative mx-auto w-full max-w-[540px] lg:max-w-none"
      aria-label="A sample question and the tutor's answer"
    >
      <div
        className="relative overflow-hidden rounded-lg border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* The margin rule of a notebook page — a small, human detail. */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-10 border-r sm:w-12"
          style={{ borderColor: 'color-mix(in srgb, var(--accent) 35%, var(--border))' }}
          aria-hidden="true"
        />

        <div className="relative pl-10 pr-5 py-6 sm:pl-12 sm:pr-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
            Grade 9 · Mathematics
          </p>

          <p
            className="mt-3 text-[17px] leading-snug sm:text-[19px]"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}
          >
            “Why does a negative times a negative give a positive?”
          </p>

          <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
              Multiplying by −1 turns you around. Turn twice and you face the way you started, so the answer is
              positive. On a number line:
            </p>

            <svg viewBox="0 0 320 54" className="mt-3 h-12 w-full" role="img" aria-labelledby={lineId}>
              <title id={lineId}>A number line showing minus three times minus four landing on plus twelve</title>
              <line x1="8" y1="38" x2="312" y2="38" stroke="var(--border-strong)" strokeWidth="1.5" />
              {[-12, -8, -4, 0, 4, 8, 12].map((value) => {
                const x = 160 + value * 12;
                return (
                  <g key={value}>
                    <line x1={x} y1="34" x2={x} y2="42" stroke="var(--border-strong)" strokeWidth="1.5" />
                    <text x={x} y="52" textAnchor="middle" fontSize="9" fill="var(--muted)">
                      {value}
                    </text>
                  </g>
                );
              })}
              <path d="M160 26 L112 26" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#a)" />
              <path d="M112 18 L304 18" stroke="var(--primary)" strokeWidth="1.5" markerEnd="url(#b)" />
              <circle cx="304" cy="38" r="3.5" fill="var(--accent)" />
              <defs>
                <marker id="a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6" fill="var(--muted)" />
                </marker>
                <marker id="b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6" fill="var(--primary)" />
                </marker>
              </defs>
            </svg>

            <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
              (−3) × (−4) = +12.
            </p>

            <p className="mt-4 border-t pt-3 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>
                Check yourself:
              </span>{' '}
              what is (−2) × (−5)? The tutor asks this before moving on.
            </p>
          </div>
        </div>
      </div>

      <figcaption className="mt-3 text-[11.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        A sample answer, not a recorded one. Real answers are labelled AI-generated, can be wrong, and are worth
        checking against your textbook.
      </figcaption>
    </figure>
  );
}

import { Link } from 'react-router-dom';
import { Seo } from '@/components/seo/Seo';
import { seoFor } from '@/config/seoPages';
import { Section } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';

const COMMITMENTS = [
  {
    heading: 'Keyboard and screen readers',
    body: 'Every action can be reached with a keyboard. The site starts with a skip link, dialogs trap focus and return it on close, and interactive components expose names, roles and states to assistive technology.',
  },
  {
    heading: 'Contrast and text size',
    body: 'Text meets WCAG 2.2 AA contrast in both light and dark themes. The layout respects your browser font size, and long paragraphs are capped at a readable line length.',
  },
  {
    heading: 'Motion and animation',
    body: 'Animations are short and non-essential. When your device asks for reduced motion, transitions are switched off.',
  },
  {
    heading: 'Small screens and slow connections',
    body: 'The layout is tested from 320 px upwards with no horizontal scrolling. Pages are text-first, images are compressed, and the offline shell keeps the app usable on a weak connection.',
  },
  {
    heading: 'Language',
    body: 'Pages declare their language so screen readers pronounce content correctly. Tutor answers can be requested in Nepali or English.',
  },
];

export default function AccessibilityPage() {
  return (
    <>
      <Seo {...seoFor('/accessibility')} />
      <Section className="!pb-6">
        <div className="max-w-3xl">
          <p className="eyebrow">Accessibility</p>
          <h1 className="section-title mt-2">Accessibility statement</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-soft sm:text-base">
            Ujyalo Learn is used on cheap Android phones, shared laptops and school computers. Accessibility is part of
            whether the product works at all, not a checklist applied at the end.
          </p>
        </div>
      </Section>

      <Section className="!pt-2">
        <div className="max-w-3xl space-y-6">
          {COMMITMENTS.map((item) => (
            <div key={item.heading}>
              <h2 className="text-lg font-bold tracking-tight">{item.heading}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-soft">{item.body}</p>
            </div>
          ))}

          <div className="rounded-2xl p-5" style={{ background: 'var(--surface-2)' }}>
            <h2 className="text-base font-bold">Known limitations</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-soft">
              <li>AI answers are plain Markdown with maths; very long equations can wrap awkwardly on 320 px screens.</li>
              <li>The site has not yet been tested with every screen reader and browser combination.</li>
              <li>Nepali typography uses the system font, which differs between Android and Windows devices.</li>
            </ul>
            <p className="mt-3 text-sm text-soft">
              If something is hard to use, tell us which page and which device — that is how this list gets shorter.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/contact">Report an accessibility problem</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/faq">Read the FAQ</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}

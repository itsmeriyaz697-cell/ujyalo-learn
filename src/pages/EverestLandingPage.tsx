import { Link } from 'react-router-dom';
import { ArrowRight, Mountain, Check } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Button } from '@/components/ui/Button';
import { Section, SectionHeading } from '@/components/marketing/Section';
import { useEverestHealth } from '@/hooks/useEverestHealth';
import { InlineAlert } from '@/components/ui/Feedback';
import { EVEREST_FEATURES, EVEREST_MODELS, EVEREST_PERSONAS } from '@/config/everest';

export default function EverestLandingPage() {
  const { health, configured } = useEverestHealth();

  return (
    <>
      <Seo title="Everest AI — Ultra-fast Groq-powered ChatGPT alternative | Ujyalo Learn" description="Everest AI: ChatGPT & Gemini-like features powered by Groq's 500-1000 tok/s inference. Code, maths, Nepali & English, streaming, personas — free to start." path="/everest" />

      {/* Hero */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: 'var(--border)', background: 'radial-gradient(1200px 600px at 20% -10%, #e8eeff 0%, transparent 60%), radial-gradient(1000px 500px at 90% 0%, #fff4d6 0%, transparent 60%)' }}>
        <div className="container-page relative pb-12 pt-10 sm:pb-16 sm:pt-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                <span className="h-2 w-2 rounded-full bg-green-500" /> Live on Groq • Up to 1000 tok/s • Free to start
              </p>
              <h1 className="mt-4 text-[2.6rem] font-bold leading-[1.05] tracking-tight sm:text-[3.2rem]" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                Everest AI
                <span className="block text-[1.9rem] font-semibold sm:text-[2.2rem]" style={{ color: 'var(--primary)' }}>Reach the summit of knowledge</span>
              </h1>
              <p className="mt-4 max-w-[52ch] text-[16px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                ChatGPT & Gemini-like features — streaming, personas, code & maths, Nepali & English — powered by Groq's ultra-fast inference (500–1000 tokens/sec). Built for students in Nepal, useful for everyone.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                  <Link to="/app/everest">Open Everest AI</Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link to="/app/tutor">Try AI Tutor instead</Link>
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--muted)' }}>
                <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" /> No card needed</span>
                <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" /> Works on any phone</span>
                <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" /> Nepali & English</span>
              </div>
              {!configured && health && (
                <div className="mt-5">
                  <InlineAlert tone="warning">Demo mode — AI provider not configured on this deployment. The chat UI works, but answers will show a friendly error until the owner adds the Groq key. Local dev is already configured.</InlineAlert>
                </div>
              )}
            </div>

            {/* Mock chat card */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <span className="inline-flex items-center gap-2 text-sm font-semibold"><Mountain className="h-4 w-4" /> Everest AI • Pro</span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: 'var(--primary)' }}>Groq 500 tok/s</span>
              </div>
              <div className="space-y-3 p-4 text-sm">
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2" style={{ background: 'var(--primary)', color: 'var(--primary-contrast)' }}>
                  Explain photosynthesis for Grade 8 in simple words?
                </p>
                <div className="max-w-[92%] rounded-2xl rounded-bl-sm px-3.5 py-3" style={{ background: 'var(--surface-2)' }}>
                  <p className="font-medium" style={{ color: 'var(--text)' }}>Photosynthesis — how plants make food 🌱</p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-soft)' }}>Plants use sunlight to turn water + CO₂ into glucose (food) and oxygen. Think of leaves as solar kitchens.</p>
                  <p className="mt-2 font-mono text-xs" style={{ color: 'var(--muted)' }}>6CO₂ + 6H₂O + sunlight → C₆H₁₂O₆ + 6O₂</p>
                  <div className="mt-3 flex gap-2">
                    <span className="rounded-full px-2 py-1 text-[11px]" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>📋 Copy</span>
                    <span className="rounded-full px-2 py-1 text-[11px]" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>🔁 Regenerate</span>
                  </div>
                </div>
                <p className="text-center text-[11px]" style={{ color: 'var(--muted)' }}>⚡ Streamed at 500 tok/s • Markdown + LaTeX • Code copy</p>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-10 grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
            {[
              { k: 'Speed', v: '1000 tok/s' },
              { k: 'Context', v: '131k tokens' },
              { k: 'Models', v: '4 choices' },
              { k: 'Personas', v: '7 styles' },
              { k: 'Languages', v: 'EN + ने' },
              { k: 'Uptime', v: 'Groq 99.9%' },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border px-3 py-2.5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{s.k}</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <Section>
        <SectionHeading eyebrow="Why Everest AI" title="ChatGPT & Gemini features — tuned for Nepal" description="Everything you love about the big AI chats, plus what they miss for students here: Nepali, grade-level explanations, and honesty about limits." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EVEREST_FEATURES.map((f) => (
            <div key={f.title} className="card p-5">
              <div className="text-xl">{f.icon}</div>
              <h3 className="mt-2 text-sm font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Models */}
      <Section tone="surface" className="border-y">
        <SectionHeading eyebrow="Models • Groq" title="Four models, one API — pick your speed" description="Everest runs on Groq's LPU inference. Same chat, four engines. Switch anytime, even mid-conversation." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EVEREST_MODELS.map((m) => (
            <div key={m.id} className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">{m.name}</h3>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: m.badgeColor }}>{m.badge}</span>
              </div>
              <p className="mt-1 font-mono text-xs" style={{ color: 'var(--muted)' }}>{m.id}</p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>{m.description}</p>
              <p className="mt-3 text-xs font-medium" style={{ color: 'var(--primary)' }}>{m.speed} • 131k context • Groq</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs" style={{ color: 'var(--muted)' }}>Free tier: 30 RPM, 14.4k RPD for Flash • Paid scales automatically. Get a key at console.groq.com</p>
      </Section>

      {/* Personas */}
      <Section>
        <SectionHeading eyebrow="Personas" title="Seven personalities in one assistant" description="Like ChatGPT\'s custom instructions & Gemini\'s experts — but one-click. Each has its own system prompt and style." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EVEREST_PERSONAS.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="text-2xl">{p.icon}</div>
              <h3 className="mt-2 text-sm font-semibold">{p.label}</h3>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{p.subtitle}</p>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-soft)' }}>{p.system.slice(0, 110)}...</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Feature comparison */}
      <Section tone="surface" className="border-y">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow rule-gold">ChatGPT vs Gemini vs Everest</p>
            <h2 className="section-title mt-1">What Everest copies — and what it adds</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                'Streaming answers word-by-word with stop & regenerate (ChatGPT ✓, Gemini ✓, Everest ✓)',
                'Markdown, tables, code blocks with copy, and LaTeX maths (all ✓)',
                'Conversation history grouped by Today / Yesterday / 7 days (ChatGPT ✓, Everest ✓)',
                'Voice input via Web Speech, file attach, and prompt starters (Gemini ✓, Everest ✓)',
                '7 personas + custom instructions (ChatGPT custom GPTs-like, Everest one-click)',
                'Nepali (Devanagari + romanized) and Hinglish — tuned for Nepal (Everest only ✓)',
                'Groq 500–1000 tok/s — noticeably faster than hosted ChatGPT (Everest advantage)',
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> <span style={{ color: 'var(--text-soft)' }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold">What Everest is NOT (and why that's honest)</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm" style={{ color: 'var(--text-soft)' }}>
              <li>No fake “human” claims — every answer is labelled AI-generated.</li>
              <li>No invented user counts, testimonials, or pass rates.</li>
              <li>No browser-use or image generation yet — those need different models (coming if you want them).</li>
              <li>No training on your chats without consent — localStorage by default, Firestore only if you sign in.</li>
              <li>No 1M token “memory” magic — 131k is real, and we show it honestly.</li>
            </ul>
            <p className="mt-4 text-xs" style={{ color: 'var(--muted)' }}>Everest uses Groq's OpenAI-compatible API. It is not affiliated with OpenAI, Google, or Groq — like many AI apps, it builds on their inference.</p>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="text-center">
        <div className="mx-auto max-w-2xl rounded-3xl border p-8" style={{ background: 'linear-gradient(135deg,var(--primary-soft),var(--surface))', borderColor: 'var(--border)' }}>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold text-white" style={{ background: 'var(--primary)' }}>🏔️</div>
          <h2 className="mt-4 text-2xl font-bold">Try Everest AI free — no card</h2>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--text-soft)' }}>
            Open a chat, pick Pro for deep work or Flash for speed, and ask in English or Nepali. Your first chat is already waiting.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
              <Link to="/app/everest">Start chatting</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/ai-tutor">Compare with AI Tutor</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs" style={{ color: 'var(--muted)' }}>Powered by Groq • Model: openai/gpt-oss-120b • Owner: Riyaz Chalise, Kathmandu</p>
        </div>
      </Section>
    </>
  );
}

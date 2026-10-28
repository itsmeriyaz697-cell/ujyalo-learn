import { useState } from 'react';
import { ChevronDown, Zap, Crown, Layers, Cpu } from 'lucide-react';
import { EVEREST_MODELS, EVEREST_PERSONAS, getEverestModel, getEverestPersona } from '@/config/everest';
import { cn } from '@/lib/utils';

export function EverestModelPicker({ model, persona, onModelChange, onPersonaChange }: {
  model: string;
  persona: string;
  onModelChange: (id: string) => void;
  onPersonaChange: (id: string) => void;
}) {
  const [open, setOpen] = useState<'model' | 'persona' | null>(null);
  const currentModel = getEverestModel(model);
  const currentPersona = getEverestPersona(persona);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <button onClick={() => setOpen(open === 'model' ? null : 'model')} className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <Crown className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <span className="font-medium">{currentModel.name}</span>
          <span className="hidden text-xs sm:inline" style={{ color: 'var(--muted)' }}>{currentModel.speed}</span>
          <ChevronDown className={cn('h-4 w-4 transition', open === 'model' && 'rotate-180')} />
        </button>
        {open === 'model' && (
          <div className="absolute left-0 top-full z-20 mt-2 w-80 rounded-2xl border p-2 shadow-xl" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="px-2 pb-1 text-xs font-semibold" style={{ color: 'var(--muted)' }}>CHOOSE MODEL — powered by Groq</p>
            {EVEREST_MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => { onModelChange(m.id); setOpen(null); }}
                className={cn('flex w-full items-start gap-3 rounded-xl p-2.5 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06]', currentModel.id === m.id && 'bg-[var(--primary-soft)]')}
              >
                <span className="mt-0.5">
                  {m.id.includes('120b') ? <Crown className="h-4 w-4" /> : m.id.includes('20b') ? <Zap className="h-4 w-4" /> : m.id.includes('70b') ? <Layers className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{m.name}</span>
                    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: m.badgeColor }}>{m.badge}</span>
                  </span>
                  <span className="block text-xs" style={{ color: 'var(--muted)' }}>{m.description} • {m.speed}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button onClick={() => setOpen(open === 'persona' ? null : 'persona')} className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <span>{currentPersona.icon}</span>
          <span className="font-medium">{currentPersona.label}</span>
          <ChevronDown className={cn('h-4 w-4 transition', open === 'persona' && 'rotate-180')} />
        </button>
        {open === 'persona' && (
          <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-2xl border p-2 shadow-xl" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="px-2 pb-1 text-xs font-semibold" style={{ color: 'var(--muted)' }}>PERSONA</p>
            {EVEREST_PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => { onPersonaChange(p.id); setOpen(null); }}
                className={cn('flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06]', currentPersona.id === p.id && 'bg-[var(--primary-soft)]')}
              >
                <span className="text-lg">{p.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{p.label}</span>
                  <span className="block text-xs" style={{ color: 'var(--muted)' }}>{p.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

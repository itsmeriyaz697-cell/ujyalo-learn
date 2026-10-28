import { z } from 'zod';

/** Everest AI — Groq-powered conversational assistant */
export const EVEREST_MODELS = [
  {
    id: 'openai/gpt-oss-120b',
    name: 'Everest Pro',
    short: 'Pro',
    description: 'Most capable — 120B params, best reasoning, 131k context',
    contextWindow: 131072,
    maxOutput: 65536,
    speed: '~500 tok/s',
    provider: 'Groq',
    recommended: true,
    badge: 'Recommended',
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'Everest Flash',
    short: 'Flash',
    description: 'Ultra-fast — 1000 tok/s, great for chat & code',
    contextWindow: 131072,
    maxOutput: 65536,
    speed: '~1000 tok/s',
    provider: 'Groq',
    recommended: false,
    badge: 'Fastest',
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Everest 70B',
    short: '70B',
    description: 'Llama 3.3 70B — balanced, versatile',
    contextWindow: 131072,
    maxOutput: 32768,
    speed: '~280 tok/s',
    provider: 'Groq',
    recommended: false,
    badge: 'Legacy',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Everest Mini',
    short: 'Mini',
    description: 'Llama 3.1 8B — instant responses, lowest latency',
    contextWindow: 131072,
    maxOutput: 131072,
    speed: '~560 tok/s',
    provider: 'Groq',
    recommended: false,
    badge: 'Instant',
  },
] as const;

export type EverestModelId = (typeof EVEREST_MODELS)[number]['id'];

export const EVEREST_PERSONAS = [
  { id: 'default', label: 'Everest', description: 'Helpful general assistant', icon: '🏔️' },
  { id: 'tutor', label: 'Study Buddy', description: 'Patient tutor for grades 1-12', icon: '📚' },
  { id: 'coder', label: 'Code Assistant', description: 'Expert programmer & debugger', icon: '💻' },
  { id: 'writer', label: 'Writing Coach', description: 'Essay, story & email help', icon: '✍️' },
  { id: 'researcher', label: 'Researcher', description: 'Deep analysis & citations', icon: '🔍' },
  { id: 'creative', label: 'Creative', description: 'Stories, ideas & brainstorming', icon: '🎨' },
  { id: 'nepali', label: 'Nepali Saathi', description: 'नेपालीमा जवाफ दिने साथी', icon: '🇳🇵' },
] as const;

export type EverestPersonaId = (typeof EVEREST_PERSONAS)[number]['id'];

export const everestMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(8000),
});

export const everestRequestSchema = z.object({
  messages: z.array(everestMessageSchema).min(1).max(30),
  model: z.string().max(80).optional(),
  persona: z.string().max(24).optional(),
  systemPrompt: z.string().max(4000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(128).max(8192).optional(),
  stream: z.boolean().default(true),
});

export type EverestRequest = z.infer<typeof everestRequestSchema>;

export function formatZodError(error: z.ZodError): string {
  return error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
}

export function getModelMeta(id: string) {
  return EVEREST_MODELS.find((m) => m.id === id) ?? EVEREST_MODELS[0];
}

export function getPersonaMeta(id: string) {
  return EVEREST_PERSONAS.find((p) => p.id === id) ?? EVEREST_PERSONAS[0];
}

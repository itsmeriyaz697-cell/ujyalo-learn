/**
 * Everest AI configuration — Groq ultra-fast inference
 * Central registry for UI; backend validates separately.
 */
export const EVEREST_MODELS = [
  {
    id: 'openai/gpt-oss-120b',
    name: 'Everest Pro',
    short: 'Pro',
    description: 'Flagship — 120B params, deep reasoning, 131k context',
    speed: '500 tok/s',
    provider: 'Groq',
    badge: 'Recommended',
    badgeColor: 'var(--primary)',
    contextWindow: 131072,
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'Everest Flash',
    short: 'Flash',
    description: 'Ultra-fast — 1000 tok/s for quick chats & code',
    speed: '1000 tok/s',
    provider: 'Groq',
    badge: 'Fastest',
    badgeColor: '#0E9F6E',
    contextWindow: 131072,
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Everest 70B',
    short: '70B',
    description: 'Llama 3.3 70B — balanced & versatile',
    speed: '280 tok/s',
    provider: 'Groq',
    badge: 'Legacy',
    badgeColor: '#B45309',
    contextWindow: 131072,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Everest Mini',
    short: 'Mini',
    description: 'Llama 3.1 8B Instant — lowest latency',
    speed: '560 tok/s',
    provider: 'Groq',
    badge: 'Instant',
    badgeColor: '#7C3AED',
    contextWindow: 131072,
  },
] as const;

export type EverestModelId = (typeof EVEREST_MODELS)[number]['id'];

export const EVEREST_PERSONAS = [
  { id: 'default', label: 'Everest', subtitle: 'General assistant', icon: '🏔️', system: 'You are Everest AI — a helpful, friendly, knowledgeable assistant created by Ujyalo Learn. You are named after Mount Everest, the highest peak in Nepal. Be warm, clear, and concise. Use Markdown and LaTeX when helpful. You can converse in English, Nepali, and Hinglish — mirror the user’s language. You are honest about limits and cite uncertainty.' },
  { id: 'tutor', label: 'Study Buddy', subtitle: 'Grades 1–12 tutor', icon: '📚', system: 'You are Everest Study Buddy — a patient tutor for students in Nepal (Grades 1-12 and SEE). Explain step-by-step, show working, give practice questions. Adapt to grade level. Use Nepali examples when relevant. Be encouraging.' },
  { id: 'coder', label: 'Code Assistant', subtitle: 'Code & debug', icon: '💻', system: 'You are Everest Code — an expert programming assistant. Write clean, correct code with explanations. Support Python, JavaScript/TypeScript, Java, C, and web development. Show runnable examples, explain edge cases, and suggest tests.' },
  { id: 'writer', label: 'Writing Coach', subtitle: 'Essays & stories', icon: '✍️', system: 'You are Everest Writing Coach. Help with essays, stories, emails, and creative writing. Preserve the writer’s voice, improve clarity, grammar, and structure. Give before/after when rewriting.' },
  { id: 'researcher', label: 'Researcher', subtitle: 'Deep analysis', icon: '🔍', system: 'You are Everest Researcher — thorough, analytical, and balanced. Structure answers with headings, tables, and citations where possible. Separate facts from interpretation. Acknowledge uncertainty.' },
  { id: 'creative', label: 'Creative', subtitle: 'Ideas & brainstorm', icon: '🎨', system: 'You are Everest Creative — imaginative and inspiring. Help brainstorm ideas, write stories, poems, slogans, and design concepts. Be original and playful while staying helpful.' },
  { id: 'nepali', label: 'Nepali Saathi', subtitle: 'नेपाली साथी', icon: '🇳🇵', system: 'You are Everest Nepali Saathi — answer in Nepali (Devanagari) by default. Use simple, school-level Nepali. Keep technical terms in English in brackets when helpful. Be warm and culturally aware of Nepal.' },
] as const;

export type EverestPersonaId = (typeof EVEREST_PERSONAS)[number]['id'];

export const EVEREST_QUICK_PROMPTS = [
  { title: 'Explain like I’m 10', prompt: 'Explain quantum computing in simple words with an everyday analogy.' },
  { title: 'Write code', prompt: 'Write a Python function to find prime numbers up to n with explanation.' },
  { title: 'Help with homework', prompt: 'Solve step-by-step: A train travels 240 km in 3 hours. What is its average speed? Show working.' },
  { title: 'Brainstorm ideas', prompt: 'Give me 5 creative project ideas for a Grade 10 science exhibition.' },
  { title: 'Essay helper', prompt: 'Help me write an essay outline on “Importance of Education in Nepal”.' },
  { title: 'Translate', prompt: 'Translate “Education is the most powerful weapon” into Nepali and explain its meaning.' },
];

export const EVEREST_FEATURES = [
  { icon: '⚡', title: 'Groq Ultra-Fast', desc: 'Up to 1000 tokens/sec — feels instant, like ChatGPT-4o' },
  { icon: '🧠', title: 'Long Context', desc: '131k token window — handle long docs, code, and chats' },
  { icon: '💬', title: 'Streaming', desc: 'Word-by-word streaming with stop & regenerate' },
  { icon: '🎨', title: 'Code & Math', desc: 'Syntax-highlighted code, tables, and LaTeX maths' },
  { icon: '🌏', title: 'Nepali + English', desc: 'Natively speaks Nepali, English & Hinglish' },
  { icon: '🔒', title: 'Private', desc: 'Your chats stay yours — never trained on without consent' },
];

export function getEverestModel(id?: string) {
  return EVEREST_MODELS.find((m) => m.id === id) ?? EVEREST_MODELS[0];
}
export function getEverestPersona(id?: string) {
  return EVEREST_PERSONAS.find((p) => p.id === id) ?? EVEREST_PERSONAS[0];
}

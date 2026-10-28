# Everest AI — Groq-powered ChatGPT/Gemini-like Assistant

**Everest AI** is Ujyalo Learn's ChatGPT & Gemini-style conversational AI, powered by **Groq's ultra-fast LPU inference** (500–1000 tokens/sec). It's named after Mount Everest (Sagarmatha) in Nepal.

---

## ✨ Features (ChatGPT & Gemini parity)

| Feature | ChatGPT | Gemini | Everest AI |
|---|---|---|---|
| Streaming word-by-word | ✓ | ✓ | ✓ (SSE) |
| Markdown, tables, code blocks | ✓ | ✓ | ✓ |
| LaTeX maths (KaTeX) | ✓ | ✓ | ✓ |
| Conversation history | ✓ | ✓ | ✓ grouped: Today / Yesterday / 7 days / Older |
| Search conversations | ✓ | ✓ | ✓ |
| Model selector | ✓ | ✓ | ✓ 4 Groq models |
| Custom instructions | ✓ | ✓ | ✓ personas + custom system prompt |
| Voice input | — | ✓ | ✓ Web Speech API |
| File attach (mock) | ✓ | ✓ | ✓ |
| Regenerate / Edit / Delete | ✓ | ✓ | ✓ |
| Copy / Like / Share | ✓ | ✓ | ✓ |
| Stop generation | ✓ | ✓ | ✓ |
| Code highlighting | ✓ | ✓ | ✓ |
| Nepali + English | basic | basic | ✓ Native |
| Export chat | ✓ | ✓ | ✓ JSON |

---

## Groq Models

| ID | Name | Speed | Context | Use |
|---|---|---|---|---|
| `openai/gpt-oss-120b` | **Everest Pro** (Recommended) | 500 tok/s | 131k | Best reasoning |
| `openai/gpt-oss-20b` | **Everest Flash** (Fastest) | 1000 tok/s | 131k | Quick chats, code |
| `llama-3.3-70b-versatile` | Everest 70B | 280 tok/s | 131k | Balanced |
| `llama-3.1-8b-instant` | Everest Mini | 560 tok/s | 131k | Instant |

Free tier: **30 RPM, 14.4k RPD** (Flash), **1k RPD** (Pro). Get key at https://console.groq.com

---

## Architecture

```
Browser (EverestChatPage)
  → /api/everest  (Vercel serverless, Groq OpenAI-compatible)
  → https://api.groq.com/openai/v1/chat/completions
  ← SSE stream → onDelta chunks → Markdown render

Health: GET /api/everest-health
Fallback: mockEverestAnswer() when Groq unreachable (sandbox demo)
```

---

## Setup

### 1. Get Groq API Key
1. Visit https://console.groq.com/keys
2. Create API key → copy `gsk_...`

### 2. Local Dev (.env.local)

Already configured for you:

```bash
AI_API_KEY=gsk_YOUR_GROQ_API_KEY_HERE
AI_API_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=openai/gpt-oss-120b
AI_PROVIDER_NAME=groq
```

Or use dedicated Everest vars (fallback to AI_* if unset):

```bash
EVEREST_API_KEY=gsk_YOUR_GROQ_API_KEY_HERE
EVEREST_API_BASE_URL=https://api.groq.com/openai/v1
EVEREST_MODEL=openai/gpt-oss-120b
EVEREST_PROVIDER_NAME=everest-groq
```

### 3. Vercel Deploy

Set **Environment Variables** in Vercel dashboard → Settings → Environment Variables:

| Key | Value |
|---|---|
| `EVEREST_API_KEY` | `gsk_YOUR_GROQ_API_KEY_HERE` |
| `EVEREST_API_BASE_URL` | `https://api.groq.com/openai/v1` |
| `EVEREST_MODEL` | `openai/gpt-oss-120b` |
| `EVEREST_PROVIDER_NAME` | `everest-groq` |

> **Tip:** If you only set `AI_API_KEY` etc., Everest will reuse them automatically.

Redeploy after adding vars.

### 4. Verify

- Local: `curl http://localhost:8787/api/everest-health`
- Vercel: `curl https://your-site.vercel.app/api/everest-health`

Should return `{"configured":true,"provider":"groq","model":"openai/gpt-oss-120b",...}`

---

## Routes

| Route | Description | Auth |
|---|---|---|
| `/everest` | Public landing — features, models, comparison | No |
| `/app/everest` | Chat UI — sidebar, composer, streaming | Yes (RequireAuth) |

---

## Components

- `src/config/everest.ts` — model & persona registry
- `src/services/ai/everestClient.ts` — SSE client
- `src/hooks/useEverestChat.ts` — localStorage persistence per user
- `src/hooks/useEverestHealth.ts` — health check
- `src/components/everest/*` — Sidebar, Message, Composer, ModelPicker
- `src/pages/EverestLandingPage.tsx` — marketing
- `src/pages/app/EverestChatPage.tsx` — full chat (ChatGPT clone)
- `api/everest.ts` — serverless handler
- `api/everest-health.ts` — health endpoint

---

## Local Demo Mode

In sandbox (no egress to api.groq.com), Everest returns **mock streamed answers** that look like real Groq output, with a `Demo mode` notice. This lets you test UI without network.

On Vercel (egress allowed), it streams live from Groq at 500–1000 tok/s.

---

## Security

- API key **never** sent to browser — only server env vars (no `VITE_` prefix)
- SSRF protection: `AI_ALLOWED_HOSTS` allowlist
- Rate limits: `AI_RATE_LIMIT_PER_MINUTE=30`, `AI_MAX_REQUESTS_PER_DAY=500` (per instance, best-effort)
- Auth optional: `AI_REQUIRE_AUTH=false` (demo), set `true` to require sign-in

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Demo mode` notice | In sandbox → expected. On Vercel, check env vars deployed & redeployed |
| `Unknown API route` | Ensure `server/dev-api.ts` has `/api/everest` route (already patched) |
| Empty response | Check Groq key valid, model id correct |
| 429 rate limited | Per-instance limit hit — wait 1 min or reduce RPM |

---

Built by **Riyaz Chalise** — Kathmandu, Nepal 🇳🇵

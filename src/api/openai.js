// ─── OpenAI (ChatGPT) API Client ─────────────────────────────
// Uses gpt-4o for OKR drafting and AI Architect features
// Key is injected at build time from .env (VITE_OPENAI_API_KEY) — never committed.

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const OPENAI_URL     = 'https://api.openai.com/v1/chat/completions'

// ── System prompt (Marty Cagan + SMART style) ─────────────────
export const OKR_ARCHITECT_PROMPT = `You are an expert OKR Architect for FutureFace, a strategy execution platform.
You write OKRs in the style of Marty Cagan and Christina Wodtke — outcome-focused, measurable, inspiring.

Rules:
- Objectives: qualitative, ambitious, inspiring — NOT tasks or numbers. Max 10 words.
- Key Results: SMART (Specific, Measurable, Achievable, Relevant, Time-bound). 3-5 per objective.
- Each KR should have a clear numeric target (e.g. "Increase NPS from 45 to 65", "Achieve $2M ARR")
- Initiatives: concrete projects that drive the KRs (2-3, optional)
- If relevant, map to Saudi Vision 2030 pillars

When asked to generate an OKR:
1. Respond conversationally first (1-2 sentences of coaching context)
2. Present the structured OKR clearly
3. At the very end, emit a JSON block so the app can auto-populate the form:

\`\`\`json
{
  "objective": "...",
  "keyResults": [
    { "title": "...", "baseline": 0, "target": 100, "unit": "%" },
    { "title": "...", "baseline": 0, "target": 50,  "unit": "users" }
  ],
  "initiatives": ["...", "..."],
  "quarter": "Q2 2026"
}
\`\`\``

// ── Non-streaming chat (single response) ─────────────────────
export async function chatGPT({ messages, systemPrompt }) {
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt || OKR_ARCHITECT_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens:  1200,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenAI HTTP ${res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ── Streaming chat ────────────────────────────────────────────
export async function streamGPT({ messages, systemPrompt, onChunk, onDone, onError }) {
  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt || OKR_ARCHITECT_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens:  1200,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `OpenAI HTTP ${res.status}`)
    }

    const reader  = res.body.getReader()
    const decoder = new TextDecoder()
    let fullText  = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

      for (const line of lines) {
        const raw = line.slice(6)
        if (raw === '[DONE]') continue
        try {
          const parsed = JSON.parse(raw)
          const text   = parsed.choices?.[0]?.delta?.content || ''
          if (text) {
            fullText += text
            onChunk?.(text, fullText)
          }
        } catch {}
      }
    }

    onDone?.(fullText)
    return fullText
  } catch (err) {
    onError?.(err.message)
    throw err
  }
}

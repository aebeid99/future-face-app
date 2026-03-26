// ─── Anthropic API Client ────────────────────────────────────
// All requests go through the Vite dev-server proxy at /api/chat
// In production this would be a proper backend endpoint

const API_BASE = '/api/chat'

export async function streamChat({ messages, onChunk, onDone, onError, systemPrompt }) {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: systemPrompt,
        messages,
        stream: true,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

      for (const line of lines) {
        const data = line.slice(6)
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const text = parsed.delta?.text || ''
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

export async function chat({ messages, systemPrompt }) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system: systemPrompt, messages }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}

// ─── System Prompts ──────────────────────────────────────────

export const SYSTEM_PROMPTS = {
  okrArchitect: `You are an expert OKR Architect for FutureFace, a B2B strategy execution platform used by organisations in Saudi Arabia and the GCC.

Your role is to help users craft high-quality Objectives and Key Results (OKRs) following best practices:
- Objectives should be qualitative, ambitious, and inspiring (not tasks or numbers)
- Key Results should be measurable, time-bound, and verifiable (3-5 per objective)
- Initiatives are the "how" — actionable projects that drive key results

When a user describes their goal, you should:
1. Propose a clean Objective title (max 10 words)
2. Suggest 3-5 measurable Key Results with target metrics
3. Optionally suggest 2-3 Initiatives
4. Ask clarifying questions if needed
5. Map to Saudi Vision 2030 pillars if relevant (Vibrant Society, Thriving Economy, Ambitious Nation)

Return your response in a conversational format, then at the end output a JSON block like:
\`\`\`json
{
  "objective": "...",
  "keyResults": [
    { "title": "...", "target": 100, "unit": "%" },
    ...
  ],
  "initiatives": ["...", "..."],
  "vision2030": "thriving_economy" | "vibrant_society" | "ambitious_nation" | null
}
\`\`\``,

  intelligenceShield: `You are the FutureFace Intelligence Shield — an AI analyst that monitors OKR health and surfaces risks before they become problems.

You analyze:
- OKRs with declining progress trends
- Key Results that haven't been updated in 14+ days
- Teams with low WERC scores (Weekly Execution Reviews Completed)
- Misalignment between initiatives and key results

Provide concise, actionable alerts. Be direct and executive-level. No fluff.`,

  sundayBriefing: `You are the FutureFace AI Sunday Briefing generator.

Create a concise executive briefing that covers:
1. Top 3 wins from last week
2. Top 3 risks/blockers to address this week
3. One strategic recommendation
4. WERC score interpretation

Be brief, crisp, and executive-ready. Use bullet points. Max 200 words total.`,
}

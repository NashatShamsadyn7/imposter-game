// ═══════════════════════════════════════════════════════════
//  Supabase Edge Function: bot-turn
//  بۆتە زیرەکەکان — وەسف (clue) دروستدەکات یان دەنگ دەدات بە یارمەتی LLM.
//
//  API ـی هاوگونجاو لەگەڵ OpenAI بەکاردێنێت → دەتوانیت بگۆڕیت بۆ هەر
//  دابینکەرێک تەنها بە گۆڕینی BOT_API_URL / BOT_API_KEY / BOT_MODEL.
//
//  داواکاری (لە کلاینتەوە بە supabase.functions.invoke):
//   { action:'describe'|'vote', role, word, category, lang,
//     clues:[{name,text}], candidates:[{id,name}], impostorCount, botName }
//  وەڵام:
//   describe → { text: "<یەک وشە>" }
//   vote     → { targetIds: ["<id>", ...] }
//
//  ناردن (Deploy):
//    supabase functions deploy bot-turn
//  Secrets (نموونەی Groq — بەخۆڕایی):
//    supabase secrets set BOT_API_KEY=gsk_... \
//      BOT_API_URL=https://api.groq.com/openai/v1/chat/completions \
//      BOT_MODEL=llama-3.3-70b-versatile
// ═══════════════════════════════════════════════════════════

const API_URL = Deno.env.get('BOT_API_URL') || 'https://api.groq.com/openai/v1/chat/completions'
const API_KEY = Deno.env.get('BOT_API_KEY') || ''
const MODEL = Deno.env.get('BOT_MODEL') || 'llama-3.3-70b-versatile'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// بانگکردنی LLM ـی هاوگونجاو لەگەڵ OpenAI
async function chat(system: string, user: string, maxTokens = 24): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.8,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  if (!res.ok) throw new Error(`LLM error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return (data.choices?.[0]?.message?.content || '').trim()
}

// زمانی وەڵام
const langName = (l: string) => (l === 'ar' ? 'Arabic' : 'Kurdish Sorani')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    if (!API_KEY) return json({ error: 'BOT_API_KEY not configured' }, 500)
    const body = await req.json()
    const { action, role, word, category, lang = 'ku', clues = [], candidates = [], impostorCount = 1, botName = 'Bot' } = body

    const lname = langName(lang)
    const clueText = clues.length
      ? clues.map((c: { name: string; text: string }) => `- ${c.name}: ${c.text}`).join('\n')
      : '(no clues yet)'

    // ───── وەسفکردن (clue) ─────
    if (action === 'describe') {
      const isImpostor = role === 'impostor'
      let system: string
      if (isImpostor) {
        system =
          `You are "${botName}", the IMPOSTOR in a social word-guessing game (like Spyfall). ` +
          `You do NOT know the secret word. Other players gave these one-word clues:\n${clueText}\n` +
          `Give ONE short, vague but plausible clue word in ${lname} that blends in so nobody suspects you. ` +
          `Reply with ONLY the single word — no quotes, no punctuation, no explanation.`
      } else {
        system =
          `You are "${botName}", a CREW member in a social word-guessing game (like Spyfall). ` +
          `The secret word is "${word}" (category: ${category}). ` +
          `Give ONE short clue word in ${lname} that hints at the secret word WITHOUT saying it, ` +
          `any part of it, or being too obvious. Avoid clues already used:\n${clueText}\n` +
          `Reply with ONLY the single word — no quotes, no punctuation, no explanation.`
      }
      const raw = await chat(system, 'Your one-word clue:', 16)
      const textVal = raw.split(/\s+/)[0]?.replace(/["'.,!?:؛،]/g, '') || raw
      return json({ text: textVal.slice(0, 40) })
    }

    // ───── دەنگدان (vote) ─────
    if (action === 'vote') {
      if (!candidates.length) return json({ targetIds: [] })
      const numbered = candidates.map((c: { id: string; name: string }, i: number) => `${i + 1}. ${c.name}`).join('\n')
      const system =
        `You are "${botName}" voting in a social word-guessing game. ` +
        `${impostorCount} player(s) are impostors who do NOT know the secret word and gave vague/off-topic clues. ` +
        `Clues given:\n${clueText}\n\nCandidates:\n${numbered}\n\n` +
        `Pick the ${impostorCount} most suspicious candidate(s). ` +
        `Reply with ONLY a JSON array of their numbers, e.g. [1]. No other text.`
      let picks: number[] = []
      try {
        const raw = await chat(system, 'Your vote (JSON array of numbers):', 24)
        const m = raw.match(/\[[\d,\s]*\]/)
        if (m) picks = JSON.parse(m[0])
      } catch { /* fallback خوارەوە */ }
      // فلتەر + گەڕانەوە بۆ id ؛ ئەگەر شکستی هێنا، هەرەمەکی هەڵدەبژێرێت
      let ids = picks
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= candidates.length)
        .slice(0, impostorCount)
        .map((n) => candidates[n - 1].id)
      if (!ids.length) {
        const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, impostorCount)
        ids = shuffled.map((c: { id: string }) => c.id)
      }
      return json({ targetIds: ids })
    }

    return json({ error: 'unknown action' }, 400)
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════
//  Supabase Edge Function: bot-turn  (بۆتە زۆر زیرەکەکان — IQ بەرز)
//  وەسف (clue) دروستدەکات یان دەنگ دەدات بە بیرکردنەوەی قووڵ (reasoning).
//
//  API ـی هاوگونجاو لەگەڵ OpenAI بەکاردێنێت → دەتوانیت بیگۆڕیت تەنها بە
//  گۆڕینی BOT_API_URL / BOT_API_KEY / BOT_MODEL.
//
//  داواکاری (لە کلاینتەوە بە supabase.functions.invoke):
//   { action:'describe'|'vote', role, word, category, lang,
//     clues:[{name,text}], candidates:[{id,name}], impostorCount, botName,
//     round }
//  وەڵام:
//   describe → { text: "<یەک وشە>" }
//   vote     → { targetIds: ["<id>", ...] }
//
//  ناردن (Deploy):  supabase functions deploy bot-turn
//  Secrets (نموونەی Groq):
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

// بانگکردنی LLM. temperature نزم بۆ لۆژیک، بەرز بۆ سەرنجڕاکێشان.
async function chat(system: string, user: string, maxTokens = 400, temperature = 0.5): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature,
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

const langName = (l: string) => (l === 'ar' ? 'Arabic' : 'Kurdish Sorani')

// دەرهێنانی دوایین JSON object/array لە دەقێکدا (بۆ reasoning + answer)
function lastJson(raw: string): unknown {
  // یەکەم: array
  const arr = raw.match(/\[[\s\S]*?\]/g)
  const obj = raw.match(/\{[\s\S]*?\}/g)
  const cand = [...(obj || []), ...(arr || [])]
  for (let i = cand.length - 1; i >= 0; i--) {
    try { return JSON.parse(cand[i]) } catch { /* بەردەوام */ }
  }
  return null
}

function cleanWord(s: string): string {
  return (s || '').split(/[\n،,]/)[0].replace(/["'`.!?:؛()]/g, '').trim().split(/\s+/).slice(0, 2).join(' ').slice(0, 40)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    if (!API_KEY) return json({ error: 'BOT_API_KEY not configured' }, 500)
    const body = await req.json()
    const {
      action, role, word, category, lang = 'ku',
      clues = [], candidates = [], impostorCount = 1, botName = 'Bot', round = 1,
    } = body

    const lname = langName(lang)
    const clueText = clues.length
      ? clues.map((c: { name: string; text: string }) => `- ${c.name}: ${c.text}`).join('\n')
      : '(no clues given yet — you may be among the first to speak)'

    // ═════════════ وەسفکردن (clue) ═════════════
    if (action === 'describe') {
      const isImpostor = role === 'impostor'
      let system: string

      if (isImpostor) {
        // مخادع زۆر زیرەک: یەکەم وشە نهێنییەکە تەخمین دەکات، پاشان ئاماژەیەکی
        // گونجاو دەدات کە تێکەڵ دەبێت و گومانی لەسەر دروست ناکات.
        system =
`You are "${botName}", the IMPOSTOR in a Spyfall-style word game. You do NOT know the secret word (category: ${category || 'unknown'}).
The other players gave these one-word clues (each clue secretly describes the SAME hidden word):
${clueText}

Think like a genius (IQ 150+). Reason step by step PRIVATELY:
1) From the clues, infer the 1-3 MOST LIKELY secret words and pick the single best guess.
2) Decide a clue word that a real insider for that guess would plausibly say.
3) Make it SAFE: specific enough to look knowledgeable, but generic enough that it still fits if your guess is wrong. Must NOT duplicate an existing clue, must NOT reveal you're guessing, must NOT be off-topic for the category.
4) If very few clues exist, stay a bit broad to avoid contradiction.

Output STRICT JSON on the last line: {"guess":"<your inferred word in English>","clue":"<ONE clue word in ${lname}>"}`
      } else {
        system =
`You are "${botName}", a CREW member in a Spyfall-style word game. The secret word is "${word}" (category: ${category || 'unknown'}). Round ${round}.
Clues already given by others:
${clueText}

Think like a genius (IQ 150+). Reason step by step PRIVATELY:
1) Give ONE clue word that truly relates to "${word}" so other crew recognize you know it.
2) Do NOT say the word, any part/translation of it, or an instantly obvious giveaway that hands it to the impostor.
3) Do NOT duplicate clues already used. Pick a DIFFERENT angle (use, place, part, feeling, category cousin).
4) Early rounds: subtler. Later rounds: a touch more specific to help expose the impostor.

Output STRICT JSON on the last line: {"clue":"<ONE clue word in ${lname}>"}`
      }

      const raw = await chat(system, 'Reason briefly, then output the JSON.', 400, isImpostor ? 0.7 : 0.6)
      const parsed = lastJson(raw) as { clue?: string } | null
      let textVal = parsed?.clue ? cleanWord(parsed.clue) : ''
      if (!textVal) {
        // fallback: دوایین وشەی واتادار لە دەقەکە
        const words = raw.replace(/[{}[\]"':,]/g, ' ').trim().split(/\s+/).filter(Boolean)
        textVal = cleanWord(words[words.length - 1] || raw)
      }
      return json({ text: textVal })
    }

    // ═════════════ دەنگدان (vote) ═════════════
    if (action === 'vote') {
      if (!candidates.length) return json({ targetIds: [] })
      const numbered = candidates
        .map((c: { id: string; name: string }, i: number) => `${i + 1}. ${c.name}`)
        .join('\n')
      const isImpostor = role === 'impostor'
      let system: string

      if (isImpostor) {
        // مخادع: مەبەست مانەوەیە — دەنگ بدە بە کەسێکی تر (نەک خۆت)، باشترە
        // ئەو کەسەی ئاماژەکەی لاوازترە یان گومانی لەسەرە، بۆ لادانی گومان.
        system =
`You are "${botName}", an IMPOSTOR voting in a Spyfall-style game. You do NOT know the secret word.
Clues:
${clueText}

Candidates:
${numbered}

Goal: SURVIVE and deflect suspicion. Reason step by step PRIVATELY:
1) You must vote for someone OTHER than yourself.
2) Prefer a CREW member who looks suspicious or gave a weak/vague clue, so the group follows your vote.
3) Pick exactly ${impostorCount} candidate number(s).
Output STRICT JSON on the last line: {"votes":[<numbers>]}`
      } else {
        // طاقم زیرەک: کلمەکە دەزانێت → ئاماژەی هەر کەسێک بەراورد دەکات لەگەڵ کلمەکە.
        system =
`You are "${botName}", a CREW member voting in a Spyfall-style game. The secret word is "${word || 'unknown'}" (category: ${category || 'unknown'}).
There are ${impostorCount} impostor(s) who do NOT know the word and gave clues that are vague, generic, off-category, or only loosely related.
Clues (name: clue):
${clueText}

Candidates:
${numbered}

Think like a genius (IQ 150+). Reason step by step PRIVATELY:
1) For EACH candidate, judge how well their clue fits "${word}": a true insider's clue is specific and clearly related; an impostor's clue is broad/safe, fits many words, or is slightly off.
2) Ignore your own clue. Rank candidates from most-suspicious to least.
3) Pick exactly the ${impostorCount} MOST suspicious candidate number(s).
Output STRICT JSON on the last line: {"votes":[<numbers>]}`
      }

      let picks: number[] = []
      try {
        const raw = await chat(system, 'Reason briefly, then output the JSON.', 450, 0.2)
        const parsed = lastJson(raw)
        if (Array.isArray(parsed)) picks = parsed as number[]
        else if (parsed && Array.isArray((parsed as { votes?: number[] }).votes)) picks = (parsed as { votes: number[] }).votes
      } catch { /* fallback خوارەوە */ }

      let ids = picks
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= candidates.length)
        .slice(0, impostorCount)
        .map((n) => candidates[n - 1].id)
      // ناهێڵین بۆتی مخادع دەنگ بداتە خۆی (ئەگەر بە هەڵە ڕوویدا)
      ids = [...new Set(ids)]
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

// ═══════════════════════════════════════════════════════════
// Gemini match commentator for مزادی ئەستێرەکان.
// The local match engine already determines every score and winner. Gemini only
// writes a short report from those verified facts; it never selects a winner.
//
// Deploy: supabase functions deploy football-commentary
// Secret: supabase secrets set GEMINI_API_KEY=<newly-rotated-key>
// Optional: supabase secrets set GEMINI_MODEL=gemini-3.5-flash
// ═══════════════════════════════════════════════════════════

const API_KEY = Deno.env.get('GEMINI_API_KEY') || ''
const MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-3.5-flash'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
})

function fallback(match: Record<string, unknown>) {
  const home = match.home as { name?: string } | undefined
  const away = match.away as { name?: string } | undefined
  return `ڕاپۆرتی AI بەردەست نییە. ${home?.name || 'Team A'} بەرامبەر ${away?.name || 'Team B'} یارییەکی گرنگیان کرد.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  try {
    const { match, fallback: localFallback } = await req.json()
    if (!match?.home?.name || !match?.away?.name || typeof match.homeGoals !== 'number' || typeof match.awayGoals !== 'number') {
      return json({ error: 'invalid match payload' }, 400)
    }
    if (!API_KEY) return json({ commentary: localFallback || fallback(match), source: 'local' })

    const facts = {
      home: match.home.name,
      away: match.away.name,
      score: `${match.homeGoals}-${match.awayGoals}`,
      penalties: match.penalties || null,
      winnerId: match.winner || null,
      playerOfMatch: match.topPlayer || null,
      homeScorers: match.homeScorers || [],
      awayScorers: match.awayScorers || [],
    }
    const prompt = `You are a lively football commentator. Write exactly 2 short sentences in Kurdish Sorani about this completed fictional match. Use only these facts; never change the score, winner, or invent goals. Avoid real-world claims. Facts: ${JSON.stringify(facts)}`
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.65, maxOutputTokens: 180 } }),
    })
    if (!response.ok) return json({ commentary: localFallback || fallback(match), source: 'local' })
    const data = await response.json()
    const commentary = data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('').trim()
    return json({ commentary: commentary || localFallback || fallback(match), source: commentary ? 'gemini' : 'local' })
  } catch {
    return json({ commentary: 'ڕاپۆرتی AI ئێستا بەردەست نییە.', source: 'local' })
  }
})

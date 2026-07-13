import { localCommentary } from './football'
import { supabase } from './supabase'

// API ئارەزوومەندانەی AI. ئەگەر URL یان ئینتەرنێت نەبێت، یارییەکە هەر بەردەوامە
// و ڕاپۆرتی خۆکار بەکاردهێنێت؛ AI هیچ کاتێک بڕیار لە سەر براوە ناکات.
export async function getMatchCommentary(match) {
  const fallback = localCommentary(match)
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('football-commentary', { body: { match, fallback } })
      if (!error && typeof data?.commentary === 'string' && data.commentary.trim()) return data.commentary.trim()
    } catch { /* use the safe local report */ }
  }
  const endpoint = import.meta.env.VITE_FOOTBALL_AI_ENDPOINT
  if (!endpoint) return fallback
  try {
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match, fallback }),
    })
    if (!response.ok) return fallback
    const data = await response.json()
    return typeof data.commentary === 'string' && data.commentary.trim() ? data.commentary.trim() : fallback
  } catch {
    return fallback
  }
}

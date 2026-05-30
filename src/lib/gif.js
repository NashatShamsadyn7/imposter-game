// ═══════════════════════════════════════════════════════════
//  GIF — گەڕان لە Tenor (Google)
//  کلیلی API لە VITE_TENOR_KEY دادەنرێت. بڕوانە GIF_SETUP.md
// ═══════════════════════════════════════════════════════════

const KEY = import.meta.env.VITE_TENOR_KEY
export const isGifEnabled = Boolean(KEY)

// گەڕان (یان بەناوبانگەکان ئەگەر q بەتاڵ بوو)
export async function searchGifs(q = '', limit = 24) {
  if (!KEY) return []
  const query = q.trim()
  const endpoint = query ? 'search' : 'featured'
  const params = new URLSearchParams({
    key: KEY,
    limit: String(limit),
    media_filter: 'gif,tinygif,nanogif',
    client_key: 'imposter_game',
    contentfilter: 'medium',
  })
  if (query) params.set('q', query)
  try {
    const res = await fetch(`https://tenor.googleapis.com/v2/${endpoint}?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map((r) => {
      const f = r.media_formats || {}
      return {
        id: r.id,
        preview: f.nanogif?.url || f.tinygif?.url || f.gif?.url,
        full: f.tinygif?.url || f.gif?.url,
        desc: r.content_description || 'GIF',
      }
    }).filter((g) => g.full)
  } catch {
    return []
  }
}

// ═══════════════════════════════════════════════════════════
//  GIF — گەڕان لە GIPHY
//  کلیلی API لە VITE_GIPHY_KEY دادەنرێت. بڕوانە GIF_SETUP.md
//  (تێبینی: Tenor بۆ تۆمارکردنی نوێ داخراوە، بۆیە GIPHY بەکاردێنین)
// ═══════════════════════════════════════════════════════════

const KEY = import.meta.env.VITE_GIPHY_KEY
export const isGifEnabled = Boolean(KEY)

// گەڕان (یان ترێندینگ ئەگەر q بەتاڵ بوو)
export async function searchGifs(q = '', limit = 24) {
  if (!KEY) return []
  const query = q.trim()
  const endpoint = query ? 'search' : 'trending'
  const params = new URLSearchParams({
    api_key: KEY,
    limit: String(limit),
    rating: 'pg-13',
    bundle: 'messaging_non_clips',
  })
  if (query) params.set('q', query)
  try {
    const res = await fetch(`https://api.giphy.com/v1/gifs/${endpoint}?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.data || [])
      .map((g) => {
        const im = g.images || {}
        return {
          id: g.id,
          preview: im.fixed_width_small?.url || im.fixed_width?.url || im.preview_gif?.url,
          full: im.fixed_height?.url || im.downsized_medium?.url || im.original?.url,
          desc: g.title || 'GIF',
        }
      })
      .filter((g) => g.full)
  } catch {
    return []
  }
}

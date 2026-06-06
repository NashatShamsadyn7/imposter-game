// ═══════════════════════════════════════════════════════════
//  پلەبەندی (Ranked) — خاڵی پێشبڕکێ → پلە
//  هەر بردنەوەیەک +٢٥، هەر دۆڕانێک −١٥ (لە سێرڤەرەوە لە record_result)
//  سەرەتا: ١٠٠٠ خاڵ. پلەکان لێرە لە خاڵەوە دەژمێردرێن.
// ═══════════════════════════════════════════════════════════

export const RANK_WIN = 25
export const RANK_LOSS = 15
export const RANK_START = 1000

// پلەکان — min = کەمترین خاڵ بۆ گەیشتن بەو پلەیە (ڕیزکراو لە کەمەوە بۆ زۆر)
export const RANKS = [
  { id: 'bronze', name: 'برۆنز', min: 0, color: '#cd7f32', icon: '🥉' },
  { id: 'silver', name: 'زیو', min: 1100, color: '#9ca3af', icon: '🥈' },
  { id: 'gold', name: 'ئاڵتوون', min: 1300, color: '#fbbf24', icon: '🥇' },
  { id: 'platinum', name: 'پلاتین', min: 1550, color: '#22d3ee', icon: '💠' },
  { id: 'diamond', name: 'ئەڵماس', min: 1850, color: '#60a5fa', icon: '💎' },
  { id: 'master', name: 'مامۆستا', min: 2200, color: '#a855f7', icon: '👑' },
  { id: 'legend', name: 'ئەفسانە', min: 2600, color: '#ef4444', icon: '🔥' },
]

// زانیاری پلە بۆ ژمارەیەکی خاڵ — { rank, next, intoRank, needed, progress }
export function rankInfo(points = RANK_START) {
  const pts = Math.max(0, points ?? RANK_START)
  let idx = 0
  for (let i = 0; i < RANKS.length; i++) {
    if (pts >= RANKS[i].min) idx = i
  }
  const rank = RANKS[idx]
  const next = RANKS[idx + 1] || null
  const intoRank = pts - rank.min
  const needed = next ? next.min - rank.min : 0
  const progress = next ? Math.min(1, intoRank / needed) : 1
  return { rank, next, intoRank, needed, progress, points: pts }
}

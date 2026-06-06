// ═══════════════════════════════════════════════════════════
//  ئامار — لێکدانەوەی مێژووی یاری بۆ ئامارە بەسوودەکان
//  computeStats(results) → نەخشەیەکی ئامار (پاک، بێ کاریگەری لایەنی)
//  results: [{ role, won, points, category_id, created_at }]
// ═══════════════════════════════════════════════════════════

// ڕێژە بە سەدا (٠ ئەگەر هیچ یارییەک نەبوو)
function pct(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

export function computeStats(results = []) {
  const games = results.length
  let wins = 0
  let asImpostor = 0
  let impostorWins = 0
  let asCrew = 0
  let crewWins = 0
  let points = 0
  const byCategory = {} // category_id → ژمارەی یاری

  for (const r of results) {
    if (r.won) wins++
    points += r.points || 0
    if (r.role === 'impostor') {
      asImpostor++
      if (r.won) impostorWins++
    } else {
      asCrew++
      if (r.won) crewWins++
    }
    const cat = r.category_id || 'unknown'
    byCategory[cat] = (byCategory[cat] || 0) + 1
  }

  // هاوپۆڵی دڵخواز — زۆرترین یاریکراو
  let favoriteCategory = null
  let favoriteCount = 0
  for (const [cat, n] of Object.entries(byCategory)) {
    if (n > favoriteCount) {
      favoriteCount = n
      favoriteCategory = cat
    }
  }

  // دۆخی دوایی — ١٠ یاری کۆتایی (results پێشتر بەپێی کات ڕیزکراون: نوێ → کۆن)
  const recentForm = results.slice(0, 10).map((r) => !!r.won)

  return {
    games,
    wins,
    losses: games - wins,
    winRate: pct(wins, games),
    points,
    asImpostor,
    impostorWins,
    impostorWinRate: pct(impostorWins, asImpostor),
    asCrew,
    crewWins,
    crewWinRate: pct(crewWins, asCrew),
    favoriteCategory,
    favoriteCount,
    recentForm,
  }
}

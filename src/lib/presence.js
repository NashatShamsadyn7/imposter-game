// ═══════════════════════════════════════════════════════════
//  یارمەتیدەری حزوور — ئاسەواری ئۆنلاین و دەقی «دواین بینین»
// ═══════════════════════════════════════════════════════════

// ئەگەر last_seen لە ٧٠ چرکەی ڕابردوودا بوو، ئۆنلاینە
export function isOnline(lastSeen) {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 70 * 1000
}

// دەقی کوردیی «دواین بینین»
export function lastSeenText(lastSeen) {
  if (!lastSeen) return 'دیار نییە'
  if (isOnline(lastSeen)) return 'ئێستا ئۆنلاین'
  const diff = Date.now() - new Date(lastSeen).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'چەند چرکەیەک لەمەوبەر'
  if (min < 60) return `${min} خولەک لەمەوبەر`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} کاتژمێر لەمەوبەر`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} ڕۆژ لەمەوبەر`
  return new Date(lastSeen).toLocaleDateString()
}

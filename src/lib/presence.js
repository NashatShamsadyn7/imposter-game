// ═══════════════════════════════════════════════════════════
//  یارمەتیدەری حزوور — ئاسەواری ئۆنلاین و دەقی «دواین بینین»
// ═══════════════════════════════════════════════════════════

// ئەگەر last_seen لە ٧٠ چرکەی ڕابردوودا بوو، ئۆنلاینە
export function isOnline(lastSeen) {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 70 * 1000
}

// ───── حزووری ناو ژوور (نبض خێراتر) ─────
// ماوەی نێوان نبضەکان (کڵاینت) — دەبێت لە سنووری ئۆنلاین کەمتر بێت
export const ROOM_PRESENCE_INTERVAL = 12 * 1000
// مۆڵەتی گواستنەوەی خانەخوێ — هاوتای v_grace لە claim_host
export const HOST_GRACE_MS = 30 * 1000

// یاریزانی ناو ژوور — ئەگەر last_seen لە ٣٠ چرکەی ڕابردوودا بوو، ئۆنلاینە
export function isPlayerOnline(lastSeen) {
  if (!lastSeen) return true // تازە هاتووە/نبضی نەناردووە — وەک ئۆنلاین دایبنێ
  return Date.now() - new Date(lastSeen).getTime() < HOST_GRACE_MS
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

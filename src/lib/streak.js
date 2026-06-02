// ═══════════════════════════════════════════════════════════
//  زنجیرەی بردنەوە (Win Streak) — لە localStorage پاشەکەوت دەکرێت
//  هەر بردنەوەیەک زنجیرە زیاد دەکات؛ دۆڕان سفری دەکاتەوە.
//  بەکاردێت بۆ خەڵاتی زیاتر + فشاری «وەندانی زنجیرە» (loss aversion).
// ═══════════════════════════════════════════════════════════

const KEY = 'imposter:winstreak'

export function getStreak() {
  if (typeof localStorage === 'undefined') return 0
  return parseInt(localStorage.getItem(KEY) || '0', 10) || 0
}

// نوێکردنەوەی زنجیرە لەدوای یاری.
// won=true → زیادکردن و گەڕاندنەوەی زنجیرەی نوێ.
// won=false → سفرکردنەوە و گەڕاندنەوەی ٠.
export function updateStreak(won) {
  if (typeof localStorage === 'undefined') return won ? 1 : 0
  const next = won ? getStreak() + 1 : 0
  localStorage.setItem(KEY, String(next))
  return next
}

// زیادکەری خەڵات بەپێی زنجیرە — هەر بردنەوەیەک ١٥٪ زیاتر، تا زۆرترین ٢.٥ ئەوەند
export function streakMultiplier(streak = 0) {
  return Math.min(2.5, 1 + streak * 0.15)
}

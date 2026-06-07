// ═══════════════════════════════════════════════════════════
//  هاپتیک (لەرینەوەی مۆبایل) — تەنها ئەگەر ئامێر پشتگیری بکات
//  Android پشتگیری دەکات؛ iOS Safari navigator.vibrate ناناسێت
//  (بێ کاریگەری بەسەردەچێت — بەبێ هەڵە).
// ═══════════════════════════════════════════════════════════

let enabled = true
export function setHapticsEnabled(on) { enabled = on }

function buzz(pattern) {
  if (!enabled) return
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
  } catch { /* noop */ }
}

export const haptic = {
  light: () => buzz(8),
  medium: () => buzz(18),
  heavy: () => buzz([0, 28, 18, 28]),
  success: () => buzz([0, 18, 36, 18, 36, 55]),
  warn: () => buzz([0, 40, 28, 40]),
}

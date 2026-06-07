// ═══════════════════════════════════════════════════════════
//  useWakeLock — ڕێگری لە کوژانەوەی شاشە لە کاتی یاریدا
//  (Screen Wake Lock API). ئەگەر ئامێر پشتگیری نەکات، بێ کاریگەرییە.
// ═══════════════════════════════════════════════════════════

import { useEffect } from 'react'

export function useWakeLock(active) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return
    let lock = null
    let cancelled = false

    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
      } catch { /* ڕەتکرایەوە/پشتگیری نییە */ }
    }
    request()

    // دوای گەڕانەوە بۆ ئەپ (tab دیسان چالاک), داوای wake lock بکەرەوە
    const onVisible = () => {
      if (document.visibilityState === 'visible' && active && !cancelled) request()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      try { lock && lock.release() } catch { /* noop */ }
    }
  }, [active])
}

// ═══════════════════════════════════════════════════════════
//  CountUp — ژمارەیەک بە نەرمی لە ٠ بۆ نرخەکە دەژمێرێت (ئەنیمەیشن)
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'

export default function CountUp({ value = 0, duration = 800, className = '' }) {
  const [n, setN] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const target = Number(value) || 0
    // ڕێزلێنانی reduced-motion — یەکسەر نرخەکە پیشان بدە
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setN(target)
      return
    }
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(target * eased))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return <span className={className}>{n}</span>
}

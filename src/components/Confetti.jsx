// ═══════════════════════════════════════════════════════════
//  Confetti — بارینی کۆنفێتی بەبێ کتێبخانەی دەرەکی (CSS تەنها)
//  count: ژمارەی پارچەکان · جۆر: ئاسایی یان «jackpot» (زیاتر و گەشاوەتر)
// ═══════════════════════════════════════════════════════════

const COLORS = ['#2dd4bf', '#f0716d', '#fbbf24', '#a855f7', '#60a5fa', '#34d399']

export default function Confetti({ count = 80, durationBase = 2.6 }) {
  const pieces = Array.from({ length: count }, (_, i) => {
    const left = Math.random() * 100
    const delay = Math.random() * 0.6
    const duration = durationBase + Math.random() * 1.4
    const size = 6 + Math.random() * 8
    const color = COLORS[i % COLORS.length]
    const rounded = Math.random() > 0.5
    return (
      <span
        key={i}
        className="absolute top-0"
        style={{
          left: `${left}%`,
          width: `${size}px`,
          height: `${size * (rounded ? 1 : 0.4)}px`,
          backgroundColor: color,
          borderRadius: rounded ? '9999px' : '2px',
          animation: `confetti-fall ${duration}s linear ${delay}s forwards`,
        }}
      />
    )
  })

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces}
    </div>
  )
}

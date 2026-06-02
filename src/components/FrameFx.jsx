// ═══════════════════════════════════════════════════════════
//  FrameFx — کاریگەری بزواوی دەوری ئەڤاتار (نار/ثلج/برق/نجوم...)
//  هەر چوارچێوەیەک دەتوانێت fx ـێکی هەبێت. جوسیمەکان (emoji) بە
//  CSS keyframe بزاو دەکرێن. لەسەر چوارچێوەکە دەنیشێت بەبێ سووڕانەوە.
// ═══════════════════════════════════════════════════════════

// هەر کاریگەرییەک: emoji + ئەنیمەیشن + شوێنەکان [x%, y%]
const FX = {
  fire:     { emoji: '🔥', anim: 'fx-flicker', spots: [[50, 102], [27, 96], [73, 96]] },
  ice:      { emoji: '❄️', anim: 'fx-drift',   spots: [[20, 4], [54, -2], [82, 8]] },
  electric: { emoji: '⚡', anim: 'fx-blink',   spots: [[6, 22], [94, 30], [50, -6]] },
  stars:    { emoji: '✨', anim: 'fx-twinkle', spots: [[4, 12], [92, 16], [86, 86], [12, 84]] },
  bubbles:  { emoji: '🫧', anim: 'fx-rise',    spots: [[32, 100], [60, 98], [48, 104]] },
  hearts:   { emoji: '💖', anim: 'fx-rise',    spots: [[34, 100], [66, 98]] },
  leaves:   { emoji: '🍃', anim: 'fx-drift',   spots: [[16, 6], [84, 10], [50, -4]] },
}

export const FX_TYPES = Object.keys(FX)

export default function FrameFx({ fx, size = 56 }) {
  const cfg = FX[fx]
  if (!cfg) return null
  const fontSize = Math.max(10, Math.round(size * 0.3))
  return (
    <div className="pointer-events-none absolute inset-0" style={{ overflow: 'visible' }}>
      {cfg.spots.map(([x, y], i) => (
        <span
          key={i}
          className="absolute"
          style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <span
            style={{
              display: 'block',
              fontSize,
              lineHeight: 1,
              animation: `${cfg.anim} ${1.3 + i * 0.3}s ease-in-out ${i * 0.25}s infinite`,
              filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.35))',
            }}
          >
            {cfg.emoji}
          </span>
        </span>
      ))}
    </div>
  )
}

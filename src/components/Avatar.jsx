import { levelFrame } from '../lib/achievements'

// ئەڤاتاری یاریزان — وێنەی پرۆفایل یان یەکەم پیتی ناو
// ئەگەر level بدرێت و ئاستەکە بەرز بێت، چوارچێوەیەکی ڕەنگاوڕەنگ پیشان دەدرێت
export default function Avatar({ url, name, size = 40, ring = false, ringColor = 'crew', level = null }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()

  const inner = (
    <div
      className="h-full w-full overflow-hidden rounded-full bg-surface"
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-crew/20 font-bold text-crew"
          style={{ fontSize: size * 0.4 }}
        >
          {initial}
        </div>
      )}
    </div>
  )

  // چوارچێوەی ئاست (پاشایەتی نوێ) — کاتێک level دەدرێت
  const frame = level != null ? levelFrame(level) : null
  if (frame) {
    const pad = Math.max(2, Math.round(size * 0.07))
    return (
      <div
        className={`shrink-0 rounded-full bg-gradient-to-br ${frame.ring} ${frame.glow}`}
        style={{ width: size + pad * 2, height: size + pad * 2, padding: pad }}
      >
        <div style={{ width: size, height: size }}>{inner}</div>
      </div>
    )
  }

  const ringCls = ring
    ? ringColor === 'impostor'
      ? 'ring-2 ring-impostor'
      : 'ring-2 ring-crew'
    : ''
  return (
    <div className={`shrink-0 rounded-full ${ringCls}`} style={{ width: size, height: size }}>
      {inner}
    </div>
  )
}

import { levelFrame } from '../lib/achievements'
import FrameFx from './FrameFx'

// ئەڤاتاری یاریزان — وێنەی پرۆفایل یان یەکەم پیتی ناو
// ئەگەر level بدرێت و ئاستەکە بەرز بێت، چوارچێوەیەکی ڕەنگاوڕەنگ پیشان دەدرێت.
// cosmeticFrame (لە دوکانەوە) سەرووی چوارچێوەی ئاست دەگرێت ئەگەر هەبوو.
export default function Avatar({ url, name, size = 40, ring = false, ringColor = 'crew', level = null, cosmeticFrame = null }) {
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

  // چوارچێوە: یەکەم کۆمەتیکی بەرکراو، ئەگەرنا چوارچێوەی ئاست
  const frame = cosmeticFrame || (level != null ? levelFrame(level) : null)
  if (frame) {
    const pad = Math.max(2, Math.round(size * 0.07))
    const anim = frame.anim || ''
    const spins = anim.includes('cos-spin')
    const total = size + pad * 2
    return (
      <div className="relative shrink-0" style={{ width: total, height: total }}>
        <div
          className={`h-full w-full rounded-full bg-gradient-to-br ${frame.ring} ${frame.glow} ${anim}`}
          style={{ padding: pad }}
        >
          {/* وێنە بەرەو سەرەوە دەمێنێتەوە کاتێک چوارچێوەکە دەسوڕێتەوە */}
          <div className={spins ? 'cos-spin-rev' : ''} style={{ width: size, height: size }}>{inner}</div>
        </div>
        {/* کاریگەری بزواو (نار/ثلج/...) — سەرووی چوارچێوە، بەبێ سووڕانەوە */}
        {frame.fx && <FrameFx fx={frame.fx} size={total} />}
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

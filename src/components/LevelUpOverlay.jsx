// ═══════════════════════════════════════════════════════════
//  LevelUpOverlay — ئەنیمەیشنی «بەرزبوونەوەی ئاست» کاتێک ئاستت زیاد دەبێت
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import { Sparkles, ChevronUp } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { levelInfo, levelTitle } from '../lib/achievements'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'

export default function LevelUpOverlay() {
  const { profile } = useAuth()
  const t = useT()
  const prevLevel = useRef(null)
  const [show, setShow] = useState(null) // { level, title }

  useEffect(() => {
    if (!profile) return
    const lvl = levelInfo(profile.total_points || 0).level
    // یەکەم جار: تەنها تۆمار بکە، ئەنیمەیشن مەنیشێنە
    if (prevLevel.current === null) {
      prevLevel.current = lvl
      return
    }
    if (lvl > prevLevel.current) {
      setShow({ level: lvl, title: levelTitle(lvl) })
      try {
        sfx.win?.()
      } catch { /* noop */ }
      const t = setTimeout(() => setShow(null), 4200)
      prevLevel.current = lvl
      return () => clearTimeout(t)
    }
    prevLevel.current = lvl
  }, [profile?.total_points])

  if (!show) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" />
      <div className="relative flex flex-col items-center rounded-3xl border-2 border-amber-400/60 bg-surface px-8 py-7 text-center shadow-soft animate-scale-in">
        {/* درەوشانەوە */}
        <div className="relative mb-3">
          <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/30" />
          <div className="relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-[0_0_30px_rgba(251,191,36,0.6)]">
            <ChevronUp className="h-10 w-10" strokeWidth={3} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-amber-500">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-bold tracking-wide">{t('ئاستت بەرزبووەوە!')}</span>
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="mt-1 text-4xl font-black text-ink">{t('ئاستی')} {show.level}</p>
        <p className="mt-1 text-sm font-bold text-crew">{show.title}</p>
      </div>
    </div>
  )
}

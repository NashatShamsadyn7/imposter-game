// ═══════════════════════════════════════════════════════════
//  Onboarding — ڕێنمایی کورتی یاری بۆ یاریزانی نوێ (یەک جار)
//  لە MainMenu ـدا یەکەم جار دەردەکەوێت. لە localStorage تۆمار دەکرێت.
//  دەکرێت دووبارە بکرێتەوە لە دوگمەی «؟».
// ═══════════════════════════════════════════════════════════

import { useState } from 'react'
import { Search, KeyRound, MessagesSquare, Vote, PartyPopper, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from './ui'
import { useT } from '../lib/i18n'

const KEY = 'imposter:onboarded:v1'

export function shouldShowOnboarding() {
  try { return !localStorage.getItem(KEY) } catch { return false }
}
export function markOnboarded() {
  try { localStorage.setItem(KEY, '1') } catch { /* noop */ }
}

const SLIDES = [
  { icon: Search, color: 'text-crew',
    title: 'بەخێربێیت بۆ ساختەکار!',
    body: 'یارییەکی گرووپییە کە تێیدا یەکێک ساختەکارە. ئامانج: بدۆزەرەوە کێ ساختەکارە — یان ئەگەر تۆ ساختەکاری، خۆت بشارەوە!' },
  { icon: KeyRound, color: 'text-amber-400',
    title: 'وشە نهێنی',
    body: 'هەموو یاریزانان وشەیەکی نهێنی وەردەگرن — جگە لە ساختەکار. ساختەکار نازانێت وشەکە چییە، بۆیە دەبێت بڵف بکات!' },
  { icon: MessagesSquare, color: 'text-crew',
    title: 'گفتوگۆ',
    body: 'بە نۆرە وشەکە وەسف بکە بەبێ ئەوەی ڕاستەوخۆ بیڵێیت. ساختەکاریش هەوڵ دەدات وا دەربکەوێت کە دەیزانێت.' },
  { icon: Vote, color: 'text-impostor',
    title: 'دەنگدان',
    body: 'لە کۆتاییدا دەنگ بدە بۆ ئەوەی گومانت لێیەتی. ئەگەر ساختەکارەکە دۆزرایەوە، تیمەکە دەباتەوە و خاڵ و دراو وەردەگریت!' },
  { icon: PartyPopper, color: 'text-crew',
    title: 'ئامادەیت!',
    body: 'یاری بکە بە ئۆنلاین لەگەڵ هاوڕێکانت، یان ناوخۆیی لەسەر یەک ئامێر. بەخت یارت بێت! 🎭' },
]

export default function Onboarding({ onClose }) {
  const t = useT()
  const [i, setI] = useState(0)
  const slide = SLIDES[i]
  const last = i === SLIDES.length - 1
  const Icon = slide.icon

  const finish = () => { markOnboarded(); onClose() }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 text-center">
        {/* داخستن/تێپەڕاندن */}
        <div className="mb-2 flex justify-end">
          <button onClick={finish} className="text-muted hover:text-ink" title={t('تێپەڕاندن')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-ink/5 ${slide.color}`}>
          <Icon className="h-10 w-10" />
        </div>
        <h2 className="mb-2 text-xl font-black text-ink">{t(slide.title)}</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted">{t(slide.body)}</p>

        {/* خاڵەکان */}
        <div className="mb-5 flex justify-center gap-1.5">
          {SLIDES.map((_, j) => (
            <span key={j} className={`h-1.5 rounded-full transition-all ${j === i ? 'w-5 bg-crew' : 'w-1.5 bg-ink/20'}`} />
          ))}
        </div>

        {/* ناڤیگەیشن */}
        <div className="flex items-center gap-2">
          {i > 0 && (
            <Button variant="ghost" className="px-4" onClick={() => setI((v) => v - 1)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
          {last ? (
            <Button className="flex-1" onClick={finish}>{t('دەستپێبکە')}</Button>
          ) : (
            <Button className="flex-1" onClick={() => setI((v) => v + 1)}>
              {t('دواتر')} <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

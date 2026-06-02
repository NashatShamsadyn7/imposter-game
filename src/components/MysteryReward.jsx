// ═══════════════════════════════════════════════════════════
//  MysteryReward — سندووقی خەڵاتی نهێنی دوای یاری
//  دۆخی «خەڵاتی گۆڕاو» (variable reward): زۆربەی جار کەم، جاروبار
//  جاکپۆتی گەورە لەگەڵ کۆنفێتی و دەنگی تایبەت — ئەمە کلیلی «ئیدمان»ـە.
//  زنجیرەی بردنەوەش خەڵات زیاد دەکات و فشار دروست دەکات بۆ گەڕانەوە.
// ═══════════════════════════════════════════════════════════

import { useState, useRef } from 'react'
import { Gift, Sparkles, Flame } from 'lucide-react'
import { Panel } from './ui'
import Confetti from './Confetti'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'
import { streakMultiplier } from '../lib/streak'

// ───── خشتەی خەڵات (بەشە، کەمترین، زۆرترین) — کۆی بەشەکان = ١٠٠ ─────
const TIERS = [
  { id: 'common', weight: 60, min: 10, max: 25 },
  { id: 'rare', weight: 25, min: 30, max: 55 },
  { id: 'epic', weight: 10, min: 70, max: 110 },
  { id: 'jackpot', weight: 5, min: 180, max: 300 },
]

function rollReward(streak) {
  const r = Math.random() * 100
  let acc = 0
  let tier = TIERS[0]
  for (const t of TIERS) {
    acc += t.weight
    if (r < acc) { tier = t; break }
  }
  const base = tier.min + Math.floor(Math.random() * (tier.max - tier.min + 1))
  const amount = Math.round((base * streakMultiplier(streak)) / 5) * 5
  return { amount, tier: tier.id }
}

const TIER_STYLE = {
  common: { ring: 'border-crew/40 bg-crew/10', text: 'text-crew' },
  rare: { ring: 'border-blue-400/50 bg-blue-400/10', text: 'text-blue-400' },
  epic: { ring: 'border-fuchsia-500/50 bg-fuchsia-500/10', text: 'text-fuchsia-400' },
  jackpot: { ring: 'border-amber-400/60 bg-amber-400/15', text: 'text-amber-400' },
}

// claimKey: کلیلێکی تایبەت بۆ هەر یاریەک — ڕێگری لە دووبارە وەرگرتن دەکات
// streak: زنجیرەی بردنەوەی ئێستا · onGrant(amount): بۆ زیادکردنی XP ـی ڕاستەقینە (ئۆنلاین)
export default function MysteryReward({ claimKey, streak = 0, onGrant }) {
  const t = useT()
  const storeKey = claimKey ? `imposter:chest:${claimKey}` : null
  const claimedRef = useRef(false)

  // ئەگەر پێشتر کرابێتەوە بۆ هەمان یاری، خەڵاتەکە دیسان پیشان بدە (بەبێ دووبارە دان)
  const initial = (() => {
    if (!storeKey || typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(storeKey)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
  })()

  const [reward, setReward] = useState(initial)
  const [confetti, setConfetti] = useState(false)

  const open = () => {
    if (reward || claimedRef.current) return
    claimedRef.current = true
    const res = rollReward(streak)
    setReward(res)
    if (storeKey) {
      try { localStorage.setItem(storeKey, JSON.stringify(res)) } catch { /* noop */ }
    }
    const big = res.tier === 'epic' || res.tier === 'jackpot'
    if (res.tier === 'jackpot') sfx.jackpot()
    else sfx.chest()
    if (big) {
      setConfetti(true)
      setTimeout(() => setConfetti(false), 4000)
    }
    onGrant?.(res.amount)
  }

  const style = reward ? TIER_STYLE[reward.tier] : null
  const isJackpot = reward?.tier === 'jackpot'
  const mult = streakMultiplier(streak)

  return (
    <Panel className="mb-5 overflow-hidden text-center !p-5">
      {confetti && <Confetti count={isJackpot ? 130 : 70} />}

      {!reward ? (
        <>
          <button
            onClick={open}
            className="btn-press mx-auto block"
            aria-label={t('کردنەوەی سندووق')}
          >
            <div className="mx-auto grid h-24 w-24 animate-chest-shake place-items-center rounded-3xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-400/25 to-amber-600/10 text-amber-400 shadow-[0_0_28px_rgba(251,191,36,0.4)]">
              <Gift className="h-12 w-12" />
            </div>
          </button>
          <p className="mt-4 text-lg font-black text-ink">{t('سندووقی خەڵاتی نهێنی')}</p>
          <p className="mt-1 text-sm text-muted">{t('بیکەرەوە — کێ دەزانێت چی تێدایە!')}</p>
          {streak >= 2 && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-500">
              <Flame className="h-3.5 w-3.5" /> {t('زنجیرەی بردنەوە')} ×{streak} · {t('خەڵاتی')} ×{mult.toFixed(2)}
            </p>
          )}
        </>
      ) : (
        <div className="animate-reward-pop">
          <div className={`mx-auto grid h-24 w-24 place-items-center rounded-3xl border-2 ${style.ring} ${style.text}`}>
            {isJackpot ? <Sparkles className="h-12 w-12" /> : <Gift className="h-12 w-12" />}
          </div>
          {isJackpot && (
            <p className="mt-3 text-xl font-black text-amber-400">{t('جاکپۆت! 🎉')}</p>
          )}
          <p className={`mt-2 text-4xl font-black ${style.text}`}>+{reward.amount} XP</p>
          {streak >= 2 && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-500">
              <Flame className="h-3.5 w-3.5" /> {t('زنجیرەی بردنەوە')} ×{streak}
            </p>
          )}
        </div>
      )}
    </Panel>
  )
}

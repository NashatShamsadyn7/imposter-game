// ═══════════════════════════════════════════════════════════
//  ShareApp — هاوبەشکردنی ئەپ + پاداشتی ڕۆژانەی هاوبەشکردن
//  بانگهێشتی هاوڕێیان بەهۆی لینکی ?ref=username . هەردووکیان دراو وەردەگرن.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react'
import { Share2, Coins, Check, Copy, Gift } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useEconomy } from '../state/EconomyContext'
import { claimShareReward } from '../lib/supabase'
import { Panel } from './ui'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'

export default function ShareApp() {
  const { profile } = useAuth()
  const { syncCoins } = useEconomy()
  const t = useT()
  const [copied, setCopied] = useState(false)
  const [reward, setReward] = useState(null)

  const today = new Date().toISOString().slice(0, 10)
  const claimed = profile?.last_share === today
  const username = profile?.username
  const link = username
    ? `${window.location.origin}/?ref=${username}`
    : window.location.origin

  // هاوبەشکردن + هەوڵدان بۆ وەرگرتنی پاداشتی ڕۆژانە
  const grantReward = async () => {
    if (claimed) return
    const res = await claimShareReward()
    if (res?.ok) {
      sfx.win()
      if (typeof res.coins === 'number') syncCoins(res.coins)
      setReward(res.reward)
      // last_share لە سێرڤەر نوێ بووە؛ profile لە کاتی نوێبوونەوەی داهاتوو دەگونجێ
      if (profile) profile.last_share = today
      setTimeout(() => setReward(null), 2500)
    }
  }

  const share = async () => {
    sfx.tap()
    const text = `یاری ساختەکار بکە لەگەڵم! 🚀\n${link}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ساختەکار', text, url: link })
        await grantReward()
      } catch { /* بەکارهێنەر هەڵوەشاندیەوە */ }
    } else {
      navigator.clipboard?.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      await grantReward()
    }
  }

  return (
    <Panel className="mb-4 !p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-crew/12 text-crew">
          <Share2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">{t('بانگهێشتی هاوڕێیان')}</p>
          <p className="flex items-center gap-1 text-xs text-muted">
            <Gift className="h-3 w-3 text-amber-500" />
            {t('تۆ و هاوڕێکەت دراو وەردەگرن')}
          </p>
        </div>
        {reward ? (
          <span className="flex items-center gap-1 rounded-xl bg-amber-400/20 px-3 py-1.5 text-sm font-black text-amber-500">
            +{reward} <Coins className="h-4 w-4" />
          </span>
        ) : (
          <button
            onClick={share}
            className="btn-press flex items-center gap-1.5 rounded-xl bg-crew px-4 py-1.5 text-sm font-black text-white"
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? t('کۆپیکرا') : t('هاوبەشکردن')}
          </button>
        )}
      </div>
      {!claimed && (
        <p className="mt-2 flex items-center gap-1 text-xs text-amber-500">
          <Coins className="h-3 w-3" /> {t('+٢٥ دراو بۆ یەکەم هاوبەشکردنی ئەمڕۆ')}
        </p>
      )}
    </Panel>
  )
}

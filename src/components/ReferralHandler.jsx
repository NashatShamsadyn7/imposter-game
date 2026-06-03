// ═══════════════════════════════════════════════════════════
//  ReferralHandler — وەرگرتنی پاداشتی بانگهێشت دوای چوونەژوورەوە
//  ?ref=username لە یەکەم سەرداندا لە localStorage پاشەکەوت دەکرێت
//  (App.jsx)، چونکە چوونەژوورەوەی Google URL ـەکە دەشوات.
//  دوای چوونەژوورەوە، ئەگەر بەکارهێنەر پێشتر بانگهێشتی وەرنەگرتبێت،
//  پاداشت دەدرێت بە هەردووکیان.
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react'
import { useAuth } from '../state/AuthContext'
import { useEconomy } from '../state/EconomyContext'
import { useNotify } from '../state/NotificationContext'
import { claimReferral } from '../lib/supabase'

export const REF_KEY = 'imposter:ref'

export default function ReferralHandler() {
  const { user, profile, refreshProfile } = useAuth()
  const { syncCoins } = useEconomy()
  const notify = useNotify()
  const triedRef = useRef(false)

  useEffect(() => {
    if (triedRef.current) return
    if (!user || !profile) return
    const ref = (() => {
      try { return localStorage.getItem(REF_KEY) } catch { return null }
    })()
    if (!ref) return
    // پێشتر بانگهێشتی وەرگرتووە یان خۆیەتی → پاکی بکەرەوە
    if (profile.referred_by || profile.username === ref) {
      try { localStorage.removeItem(REF_KEY) } catch { /* noop */ }
      return
    }
    triedRef.current = true
    ;(async () => {
      const res = await claimReferral(ref)
      try { localStorage.removeItem(REF_KEY) } catch { /* noop */ }
      if (res?.ok) {
        if (typeof res.coins === 'number') syncCoins(res.coins)
        notify?.({
          title: 'بەخێربێیت! 🎉',
          body: `بەهۆی بانگهێشتەوە +${res.reward} دراوت وەرگرت`,
          type: 'reward',
        })
        await refreshProfile?.()
      }
    })()
  }, [user, profile, syncCoins, notify, refreshProfile])

  return null
}

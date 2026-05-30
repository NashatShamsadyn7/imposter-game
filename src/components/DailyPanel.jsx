// ═══════════════════════════════════════════════════════════
//  DailyPanel — پاداشتی چوونەژوورەوەی ڕۆژانە + سلسلە + مەرجی ڕۆژانە
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { Gift, Flame, Target, Check, Loader2 } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { claimDaily, claimDailyQuest, todayGameCount } from '../lib/supabase'
import { Panel } from './ui'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'

const QUEST_GOAL = 3

export default function DailyPanel() {
  const { profile, user, refreshProfile } = useAuth()
  const t = useT()
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD بە UTC
  const [games, setGames] = useState(0)
  const [busy, setBusy] = useState(false)
  const [reward, setReward] = useState(null)

  const dailyClaimed = profile?.last_daily === today
  const questClaimed = profile?.quest_day === today
  const streak = profile?.login_streak || 0
  const questDone = games >= QUEST_GOAL

  useEffect(() => {
    if (!user) return
    todayGameCount(user.id).then(setGames).catch(() => {})
  }, [user])

  const doClaimDaily = async () => {
    setBusy(true)
    try {
      const res = await claimDaily()
      if (res?.ok) {
        sfx.win()
        setReward(res.reward)
        setTimeout(() => setReward(null), 2500)
        await refreshProfile?.()
      }
    } catch { /* migration هێشتا جێبەجێ نەکراوە */ } finally {
      setBusy(false)
    }
  }

  const doClaimQuest = async () => {
    setBusy(true)
    try {
      const res = await claimDailyQuest()
      if (res?.ok) {
        sfx.win()
        await refreshProfile?.()
      }
    } catch { /* noop */ } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="mb-4 !p-4">
      {/* پاداشتی ڕۆژانە */}
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-500">
          <Gift className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">{t('پاداشتی ڕۆژانە')}</p>
          <p className="flex items-center gap-1 text-xs text-muted">
            <Flame className="h-3 w-3 text-amber-500" /> {t('سلسلە:')} {streak} {t('ڕۆژ')}
          </p>
        </div>
        {reward ? (
          <span className="rounded-xl bg-amber-400/20 px-3 py-1.5 text-sm font-black text-amber-500">+{reward} XP</span>
        ) : dailyClaimed ? (
          <span className="flex items-center gap-1 rounded-xl bg-crew/15 px-3 py-1.5 text-sm font-bold text-crew">
            <Check className="h-4 w-4" /> {t('وەرگیرا')}
          </span>
        ) : (
          <button
            onClick={doClaimDaily}
            disabled={busy}
            className="btn-press rounded-xl bg-amber-500 px-4 py-1.5 text-sm font-black text-white disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('وەرگرتن')}
          </button>
        )}
      </div>

      {/* مەرجی ڕۆژانە */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-bold text-ink">
            <Target className="h-4 w-4 text-crew" /> {QUEST_GOAL} {t('یاری ئەمڕۆ بکە')}
          </span>
          {questClaimed ? (
            <span className="flex items-center gap-1 text-xs font-bold text-crew">
              <Check className="h-3.5 w-3.5" /> +50 XP
            </span>
          ) : questDone ? (
            <button
              onClick={doClaimQuest}
              disabled={busy}
              className="btn-press rounded-lg bg-crew px-2.5 py-1 text-xs font-black text-white disabled:opacity-50"
            >
              {t('وەرگرتنی +٥٠')}
            </button>
          ) : (
            <span className="text-xs text-muted">{Math.min(games, QUEST_GOAL)}/{QUEST_GOAL}</span>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-crew to-crew/60 transition-all"
            style={{ width: `${Math.min(100, (games / QUEST_GOAL) * 100)}%` }}
          />
        </div>
      </div>
    </Panel>
  )
}

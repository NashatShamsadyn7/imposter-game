// ═══════════════════════════════════════════════════════════
//  PlayerProfileModal — پرۆفایلی یاریزان: ئاست، XP، ئامار + داوای هاوڕێیەتی
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { X, Loader2, Star, Trophy, Gamepad2, Percent, UserPlus, Check, Clock, UserCheck } from 'lucide-react'
import { fetchPublicProfile } from '../lib/supabase'
import { levelInfo, levelTitle, winRate } from '../lib/achievements'
import { useAuth } from '../state/AuthContext'
import { useFriends } from '../state/FriendsContext'
import Avatar from './Avatar'
import { sfx } from '../lib/sound'

export default function PlayerProfileModal({ userId, fallbackName, fallbackAvatar, onClose }) {
  const { user } = useAuth()
  const friends = useFriends()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchPublicProfile(userId)
      .then((p) => !cancelled && setStats(p))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [userId])

  const name = stats?.display_name || fallbackName || 'یاریزان'
  const avatar = stats?.avatar_url || fallbackAvatar
  const lvl = levelInfo(stats?.total_points || 0)
  const wr = Math.round(winRate(stats || {}) * 100)
  const status = friends?.friendStatusWith?.(userId) || 'self'
  const isSelf = userId === user?.id

  const handleAdd = async () => {
    sfx.click()
    const res = await friends?.addFriendById?.(userId)
    if (res?.ok) setSent(true)
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-line bg-surface p-5 shadow-soft animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* سەرپەڕە */}
        <div className="mb-4 flex justify-end">
          <button onClick={onClose} className="btn-press rounded-full bg-ink/5 p-1.5 text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-crew" />
          </div>
        ) : (
          <>
            {/* ئەڤاتار + ناو + ئاست */}
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full ring-4 ring-crew/30">
                <Avatar url={avatar} name={name} size={84} />
              </div>
              <h2 className="mt-3 text-xl font-black text-ink">{name}</h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full bg-crew/15 px-3 py-0.5 text-sm font-bold text-crew">
                  ئاستی {lvl.level}
                </span>
                <span className="text-xs text-muted">{levelTitle(lvl.level)}</span>
              </div>
            </div>

            {/* بارەی XP */}
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted">
                <span>XP</span>
                <span>
                  {lvl.intoLevel} / {lvl.needed}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-crew to-crew/60 transition-all"
                  style={{ width: `${Math.round(lvl.progress * 100)}%` }}
                />
              </div>
            </div>

            {/* ئامار */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat icon={Gamepad2} label="یاری" value={stats?.games_played || 0} />
              <Stat icon={Trophy} label="بردنەوە" value={stats?.wins || 0} />
              <Stat icon={Percent} label="ڕێژە" value={`${wr}%`} />
            </div>
            <div className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/10 py-2 text-amber-500">
              <Star className="h-4 w-4" />
              <span className="font-black">{stats?.total_points || 0}</span>
              <span className="text-xs">کۆی خاڵ</span>
            </div>

            {/* داوای هاوڕێیەتی */}
            {!isSelf && (
              <div className="mt-4">
                {status === 'friend' ? (
                  <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-crew/15 py-3 font-bold text-crew">
                    <UserCheck className="h-5 w-5" /> هاوڕێن
                  </div>
                ) : status === 'outgoing' || sent ? (
                  <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-ink/5 py-3 font-bold text-muted">
                    <Clock className="h-5 w-5" /> داواکاری نێردرا
                  </div>
                ) : status === 'incoming' ? (
                  <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-amber-500/15 py-3 text-sm font-bold text-amber-500">
                    <UserPlus className="h-5 w-5" /> داوای هاوڕێیەتیت بۆ کردووە
                  </div>
                ) : (
                  <button
                    onClick={handleAdd}
                    className="btn-press flex w-full items-center justify-center gap-1.5 rounded-2xl bg-crew py-3 font-bold text-white"
                  >
                    <UserPlus className="h-5 w-5" /> داوای هاوڕێیەتی
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-ink/5 py-2.5">
      <Icon className="h-4 w-4 text-crew" />
      <span className="font-black text-ink">{value}</span>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  )
}

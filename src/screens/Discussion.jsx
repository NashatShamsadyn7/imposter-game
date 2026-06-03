import { useState, useEffect } from 'react'
import { Clock, Vote, Users, SkipForward, Megaphone, Eye } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useRoom } from '../state/RoomContext'
import { Button, Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import Chat from '../components/Chat'
import Reactions from '../components/Reactions'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'

export default function Discussion() {
  const { user } = useAuth()
  const { room, players, me, isHost, nextTurn, beginVoting } = useRoom()
  const t = useT()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(i)
  }, [])

  const endsAt = room.phase_ends_at ? new Date(room.phase_ends_at).getTime() : null
  const remaining = endsAt
    ? Math.max(0, Math.round((endsAt - now) / 1000))
    : room.discussion_seconds

  // خانەخوێ خۆکار دەچێتە دەنگدان کاتێک کات تەواو دەبێت
  useEffect(() => {
    if (isHost && endsAt && remaining === 0 && room.status === 'discussion') {
      beginVoting()
    }
  }, [isHost, endsAt, remaining, room.status, beginVoting])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const urgent = remaining <= 10

  const ordered = [...players].sort((a, b) => a.order_index - b.order_index)
  const turnPlayer = players.find((p) => p.user_id === room.turn_player_id)
  const myTurn = room.turn_player_id === user.id

  return (
    // pb-28: شوێن بۆ شریتی دەنگ (VoiceBar) کە لە ژێرەوە دەمێنێتەوە، تاکو لەسەر مۆبایل
    // لەگەڵ خانەی نووسینی چات تێکەڵ نەبێت
    <div className="mx-auto max-w-5xl px-4 py-5 pb-28">
      {/* بانەری نۆرە */}
      {myTurn && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-crew bg-crew/15 px-4 py-3 animate-pulse-glow">
          <Megaphone className="h-6 w-6 shrink-0 text-crew" />
          <p className="text-sm font-bold text-ink">
            نۆرەی تۆیە! بە یەک وشە (کەمتر لە ٢٠ پیت) وەسفی بکە — بەبێ ئەوەی ڕاستەوخۆ بیڵێیت.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[340px_1fr]">
        {/* ───── لای چەپ: تایمەر + نۆرە + کۆنترۆڵ ───── */}
        <div className="space-y-4">
          {/* HUD */}
          <div className="grid grid-cols-2 gap-3">
            <Panel className="!p-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-crew" />
              <div>
                <p className="text-xs text-ink/50">{t('یاریزان')}</p>
                <p className="font-black text-ink">{players.length}</p>
              </div>
            </Panel>
            <Panel className="!p-3 flex items-center gap-2">
              <Eye className="h-5 w-5 text-crew" />
              <div>
                <p className="text-xs text-ink/50">{t('ڕۆڵی تۆ')}</p>
                <p className={`font-black ${me?.is_spectator ? 'text-ink/50' : me?.role === 'impostor' ? 'text-impostor' : 'text-crew'}`}>
                  {me?.is_spectator ? t('بینەر') : me?.role === 'impostor' ? t('ساختەکار') : t('کەشتی')}
                </p>
              </div>
            </Panel>
          </div>

          {/* تایمەر */}
          <Panel className={`flex flex-col items-center py-6 ${urgent ? '' : 'panel-glow'}`}>
            <div className="mb-2 flex items-center gap-2 text-ink/60">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{t('کاتی گفتوگۆ')}</span>
            </div>
            <p
              className={`text-5xl font-black tabular-nums neon-text ${
                urgent ? 'animate-pulse text-impostor' : 'text-ink'
              }`}
            >
              {minutes}:{String(seconds).padStart(2, '0')}
            </p>
          </Panel>

          {/* ڕیزی قسەکردن */}
          <Panel>
            <p className="mb-3 text-sm font-bold text-ink">{t('ڕیزی وەسفکردن')}</p>
            <div className="space-y-1.5">
              {ordered.map((p) => {
                const active = p.user_id === room.turn_player_id
                return (
                  <div
                    key={p.user_id}
                    className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${
                      active ? 'bg-crew/15 ring-1 ring-crew' : ''
                    }`}
                  >
                    <Avatar url={p.avatar_url} name={p.display_name} size={28} ring={active} />
                    <span className={`flex-1 truncate text-sm ${active ? 'font-bold text-crew' : 'text-ink/70'}`}>
                      {p.display_name}
                    </span>
                    {active && <Megaphone className="h-4 w-4 text-crew" />}
                  </div>
                )
              })}
            </div>

            {isHost && (
              <Button
                variant="ghost"
                onClick={() => {
                  nextTurn()
                  sfx.tap()
                }}
                className="mt-3 w-full !py-2 !text-sm"
              >
                <SkipForward className="h-4 w-4" />
                {turnPlayer ? t('نۆرەی دواتر') : t('دەستپێکردنی ڕیز')}
              </Button>
            )}
          </Panel>

          {/* کاردانەوەی خێرا */}
          <Panel className="!p-3">
            <p className="mb-2 text-center text-xs font-bold text-ink/60">{t('کاردانەوەی خێرا')}</p>
            <Reactions />
          </Panel>

          {/* چوون بۆ دەنگدان */}
          {isHost && (
            <Button onClick={beginVoting} variant="danger" className="w-full !py-4">
              <Vote className="h-5 w-5" />
              {t('چوون بەرەو قۆناغی دەنگدان')}
            </Button>
          )}
        </div>

        {/* ───── لای ڕاست: چات ───── */}
        <Chat className="h-[52vh] md:h-[78vh]" />
      </div>
    </div>
  )
}

import { useState, useMemo, useEffect } from 'react'
import { Vote, Check, Loader2, Gavel, Users } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useRoom } from '../state/RoomContext'
import { Button, Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'

export default function Voting() {
  const { user } = useAuth()
  const { room, players, votes, me, isHost, submitVote, finishGame } = useRoom()
  const t = useT()
  const [picked, setPicked] = useState([])
  const [submitted, setSubmitted] = useState(false)

  const need = room.impostor_count
  // بینەرەکان نە دەنگ دەدەن نە دەنگیان بۆ دەدرێت
  const activePlayers = players.filter((p) => !p.is_spectator)
  const candidates = activePlayers.filter((p) => p.user_id !== user.id)
  const isSpectator = !!me?.is_spectator

  // ژمارەی دەنگدەرە جیاوازەکان
  const voterCount = useMemo(() => new Set(votes.map((v) => v.voter_id)).size, [votes])
  const allVoted = voterCount > 0 && voterCount >= activePlayers.length

  // خانەخوێ خۆکار کۆتایی پێدەهێنێت کاتێک هەموان دەنگیان دا
  useEffect(() => {
    if (isHost && allVoted && room.status === 'voting') {
      const t = setTimeout(() => finishGame(), 800)
      return () => clearTimeout(t)
    }
  }, [isHost, allVoted, room.status, finishGame])

  const toggle = (id) => {
    sfx.tap()
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= need) return [...prev.slice(1), id] // جێگرەوەی کۆنترین
      return [...prev, id]
    })
  }

  const submit = () => {
    submitVote(picked)
    setSubmitted(true)
  }

  // بینەر: ناتوانێت دەنگ بدات
  if (isSpectator) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="animate-scale-in">
          <Vote className="mx-auto mb-4 h-16 w-16 text-ink/30" />
          <h1 className="mb-2 text-2xl font-black text-ink">{t('دەنگدان بەردەوامە')}</h1>
          <p className="mb-6 text-ink/60">{t('تۆ بینەریت — چاوەڕێی ئەنجام بکە…')}</p>
          <div className="flex items-center justify-center gap-2 text-crew">
            <Users className="h-5 w-5" />
            <span className="font-bold">
              {voterCount} / {activePlayers.length} دەنگیان دا
            </span>
          </div>
        </div>
      </div>
    )
  }

  // دوای دەنگدان — چاوەڕوانی
  if (submitted) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="animate-scale-in">
          <Check className="mx-auto mb-4 h-16 w-16 text-crew" />
          <h1 className="mb-2 text-2xl font-black text-ink">{t('دەنگەکەت تۆمارکرا')}</h1>
          <p className="mb-6 text-ink/60">{t('چاوەڕێی یاریزانانی تر بکە…')}</p>
          <div className="flex items-center justify-center gap-2 text-crew">
            <Users className="h-5 w-5" />
            <span className="font-bold">
              {voterCount} / {activePlayers.length} دەنگیان دا
            </span>
          </div>
          {isHost && (
            <Button onClick={finishGame} variant="danger" className="mt-8">
              <Gavel className="h-5 w-5" />
              {t('کۆتاییهێنان بە دەنگدان ئێستا')}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-5 text-center animate-fade-in">
        <Vote className="mx-auto mb-2 h-10 w-10 text-impostor" />
        <h1 className="text-2xl font-black text-ink">{t('دەنگدانی نهێنی')}</h1>
        <p className="mt-1 text-sm text-ink/60">
          {need === 1 ? t('یەک کەس هەڵبژێرە کە گومانی لێ دەکەیت') : `${need} ${t('کەس هەڵبژێرە کە گومانیان لێ دەکەیت')}`}
        </p>
        <p className="mt-1 text-xs text-crew">{picked.length} / {need} {t('هەڵبژێردرا')}</p>
      </div>

      <div className="space-y-2">
        {candidates.map((p) => {
          const active = picked.includes(p.user_id)
          return (
            <button
              key={p.user_id}
              onClick={() => toggle(p.user_id)}
              className={`btn-press flex w-full items-center gap-3 rounded-2xl border px-4 py-3 ${
                active
                  ? 'border-impostor bg-impostor/20'
                  : 'border-ink/10 bg-ink/5 hover:bg-ink/10'
              }`}
            >
              <Avatar url={p.avatar_url} name={p.display_name} size={40} ring={active} ringColor="impostor" />
              <span className="flex-1 text-right font-bold text-ink">{p.display_name}</span>
              {active && <Check className="h-5 w-5 text-impostor" />}
            </button>
          )
        })}
      </div>

      <Button
        onClick={submit}
        disabled={picked.length !== need}
        variant="danger"
        className="mt-6 w-full !py-4 !text-lg"
      >
        {t('پشتڕاستکردنەوەی دەنگ')}
      </Button>
    </div>
  )
}

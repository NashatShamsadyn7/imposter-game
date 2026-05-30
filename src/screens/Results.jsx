import { useEffect } from 'react'
import { Trophy, Skull, ShieldCheck, RotateCcw, LogOut, Star, UserX } from 'lucide-react'
import { useRoom } from '../state/RoomContext'
import { useAuth } from '../state/AuthContext'
import { useProfileViewer } from '../state/ProfileViewer'
import { CATEGORIES, findWord } from '../data/words'
import { Button, Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import WordImage from '../components/WordImage'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'

export default function Results() {
  const { room, players, isHost, playAgain, leaveRoom } = useRoom()
  const { refreshProfile } = useAuth()
  const { openProfile } = useProfileViewer() || {}
  const t = useT()
  const impostorWin = room.winner_side === 'impostor'
  const category = CATEGORIES.find((c) => c.id === room.category_id)

  useEffect(() => {
    if (impostorWin) sfx.lose()
    else sfx.win()
  }, [impostorWin])

  // نوێکردنەوەی خاڵەکانی پرۆفایلی خۆم — بۆ ئەنیمەیشنی بەرزبوونەوەی ئاست
  useEffect(() => {
    const t = setTimeout(() => refreshProfile?.(), 1200)
    return () => clearTimeout(t)
  }, [])

  // ڕیزکردن بەپێی خاڵ (بینەرەکان نیشان نادرێن)
  const ranked = [...players]
    .filter((p) => !p.is_spectator)
    .sort((a, b) => b.points_this_game - a.points_this_game)

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <div className="animate-scale-in text-center">
        <div
          className={`mb-4 inline-flex rounded-full border-2 p-5 ${
            impostorWin
              ? 'border-impostor bg-impostor/15 animate-pulse-glow-red'
              : 'border-crew bg-crew/15 animate-pulse-glow'
          }`}
        >
          {impostorWin ? (
            <Skull className="h-14 w-14 text-impostor" />
          ) : (
            <Trophy className="h-14 w-14 text-crew" />
          )}
        </div>
        <h1 className={`mb-4 text-3xl font-black ${impostorWin ? 'text-impostor' : 'text-crew'}`}>
          {impostorWin ? t('ساختەکارەکان سەرکەوتن!') : t('دەستەی کەشتی سەرکەوتن!')}
        </h1>
      </div>

      {/* وشەی نهێنی */}
      <Panel className="mb-5 text-center">
        <p className="mb-1 text-xs text-ink/50">{t('وشەی نهێنی')} ({category?.name})</p>
        <p className="mb-4 text-2xl font-black text-ink">{room.secret_word_ku}</p>
        <div className="flex justify-center">
          <WordImage englishPrompt={room.secret_word_en} emoji={findWord(room.secret_word_ku)?.emoji} size={200} />
        </div>
        {room.mode === 'undercover' && room.decoy_word_ku && (
          <p className="mt-4 text-sm text-ink/50">
            {t('وشەی ساختەکار')}: <span className="font-bold text-impostor">{room.decoy_word_ku}</span>
          </p>
        )}
      </Panel>

      {/* ئەنجامەکان */}
      <Panel className="mb-6">
        <h2 className="mb-3 text-center font-bold text-ink">{t('ئەنجام و خاڵەکان')}</h2>
        <div className="space-y-2">
          {ranked.map((p) => (
            <button
              key={p.user_id}
              onClick={() => openProfile?.(p.user_id, p.display_name, p.avatar_url)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-right ${
                p.role === 'impostor'
                  ? 'border-impostor/40 bg-impostor/10'
                  : 'border-crew/25 bg-crew/5'
              }`}
            >
              <Avatar url={p.avatar_url} name={p.display_name} size={38} />
              <div className="flex-1">
                <p className="flex items-center gap-1.5 font-bold text-ink">
                  {p.role === 'impostor' ? (
                    <Skull className="h-4 w-4 text-impostor" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-crew" />
                  )}
                  {p.display_name}
                  {p.ejected && (
                    <span className="flex items-center gap-0.5 text-xs text-ink/40">
                      <UserX className="h-3 w-3" /> {t('دەرکرا')}
                    </span>
                  )}
                </p>
                <p className="text-xs text-ink/50">
                  {p.role === 'impostor' ? t('ساختەکار') : t('دەستەی کەشتی')} · {p.votes || 0} {t('دەنگ')}
                </p>
              </div>
              <span className="flex items-center gap-1 font-black text-crew">
                <Star className="h-4 w-4" />+{p.points_this_game}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      {/* کۆنترۆڵ */}
      {isHost ? (
        <Button onClick={playAgain} className="w-full !py-4 !text-lg">
          <RotateCcw className="h-6 w-6" />
          {t('یاری دووبارە')}
        </Button>
      ) : (
        <p className="mb-3 rounded-2xl border border-ink/10 bg-ink/5 py-4 text-center text-ink/60">
          {t('چاوەڕێی خانەخوێ بکە بۆ یاری دووبارە…')}
        </p>
      )}

      <button
        onClick={() => leaveRoom()}
        className="btn-press mx-auto mt-4 flex items-center gap-2 text-sm text-ink/50 hover:text-ink"
      >
        <LogOut className="h-4 w-4" />
        {t('دەرچوون لە ژوور')}
      </button>
    </div>
  )
}

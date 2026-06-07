import { useEffect, useState, useRef } from 'react'
import { Trophy, Skull, ShieldCheck, RotateCcw, LogOut, Star, UserX } from 'lucide-react'
import { useRoom } from '../state/RoomContext'
import { useAuth } from '../state/AuthContext'
import { useProfileViewer } from '../state/ProfileViewer'
import { useWords } from '../state/WordsContext'
import { Button, Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import WordImage from '../components/WordImage'
import Confetti from '../components/Confetti'
import MysteryReward from '../components/MysteryReward'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'
import { addPoints } from '../lib/supabase'
import { updateStreak } from '../lib/streak'

export default function Results() {
  const { room, players, votes, me, isHost, playAgain, leaveRoom } = useRoom()
  const { user, refreshProfile } = useAuth()
  const { openProfile } = useProfileViewer() || {}
  const { categories: CATEGORIES, findWord } = useWords()
  const t = useT()
  const impostorWin = room.winner_side === 'impostor'
  const category = CATEGORIES.find((c) => c.id === room.category_id)

  // بردنەوەی منی ئێستا (بەپێی ڕۆڵ) — بینەران ناژمێردرێن
  const isPlayer = me && !me.is_spectator
  const myWin = isPlayer && (me.role === 'impostor' ? impostorWin : !impostorWin)

  // زنجیرەی بردنەوە — یەک جار نوێ دەکرێتەوە لە کاتی هاتنە ئەم شاشە
  const [streak, setStreak] = useState(0)
  const streakDone = useRef(false)
  useEffect(() => {
    if (!isPlayer || streakDone.current) return
    streakDone.current = true
    setStreak(updateStreak(myWin))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayer])

  useEffect(() => {
    if (impostorWin) sfx.lose()
    else sfx.win()
  }, [impostorWin])

  // زیادکردنی XPـی سندووق بۆ خۆم (هەمان شێوازی add_points ـی ئامادە)
  const grantBonus = async (amount) => {
    if (!user) return
    try {
      await addPoints(user.id, amount, false)
      setTimeout(() => refreshProfile?.(), 600)
    } catch { /* migration هێشتا نەکراوە */ }
  }

  // نوێکردنەوەی خاڵەکانی پرۆفایلی خۆم — بۆ ئەنیمەیشنی بەرزبوونەوەی ئاست
  useEffect(() => {
    const t = setTimeout(() => refreshProfile?.(), 1200)
    return () => clearTimeout(t)
  }, [])

  // ڕیزکردن بەپێی خاڵ (بینەرەکان نیشان نادرێن)
  const ranked = [...players]
    .filter((p) => !p.is_spectator)
    .sort((a, b) => b.points_this_game - a.points_this_game)

  // کێ دەنگی بۆ کێ دا — لە دەنگە ڕاستەقینەکانەوە (نەک ستوونی نەبوو)
  const nameById = Object.fromEntries(players.map((p) => [p.user_id, p.display_name]))
  const votersFor = (uid) =>
    (votes || []).filter((v) => v.target_id === uid).map((v) => nameById[v.voter_id] || '؟')

  return (
    <div className={`mx-auto max-w-md px-4 py-6 pb-24 ${impostorWin ? 'animate-shake' : ''}`}>
      {myWin && <Confetti count={90} />}
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
        <h1 className={`mb-4 text-3xl font-black neon-text ${impostorWin ? 'text-impostor' : 'text-crew'}`}>
          {impostorWin ? t('ساختەکارەکان سەرکەوتن!') : t('دەستەی کەشتی سەرکەوتن!')}
        </h1>
      </div>

      {/* سندووقی خەڵاتی نهێنی — خەڵاتی گۆڕاو + زنجیرە */}
      {isPlayer && (
        <MysteryReward
          claimKey={`${room.id}:${room.secret_word_ku}`}
          streak={streak}
          onGrant={grantBonus}
        />
      )}

      {/* وشەی نهێنی */}
      <Panel className="mb-5 text-center">
        <p className="mb-1 text-xs text-ink/50">{t('وشەی نهێنی')} ({category?.name})</p>
        <p className="mb-4 text-2xl font-black text-ink">{room.secret_word_ku}</p>
        <div className="flex justify-center">
          <WordImage imageUrl={findWord(room.secret_word_ku)?.image_url} englishPrompt={room.secret_word_en} emoji={findWord(room.secret_word_ku)?.emoji} size={200} />
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
          {ranked.map((p) => {
            const voters = votersFor(p.user_id)
            return (
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
              <div className="min-w-0 flex-1">
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
                  {p.role === 'impostor' ? t('ساختەکار') : t('دەستەی کەشتی')} · {voters.length} {t('دەنگ')}
                </p>
                {/* کێ دەنگی بۆ ئەم دا — بە نووسینی بچووک */}
                {voters.length > 0 && (
                  <p className="truncate text-[11px] text-ink/40">
                    {t('دەنگیان دا:')} {voters.join('، ')}
                  </p>
                )}
              </div>
              <span className="flex items-center gap-1 font-black text-crew">
                <Star className="h-4 w-4" />+{p.points_this_game}
              </span>
            </button>
          )})}
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

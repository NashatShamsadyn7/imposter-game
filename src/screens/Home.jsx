import { useEffect, useState } from 'react'
import { Rocket, ChevronRight, Plus, LogIn, Trophy, Crown, Loader2, Star, Zap } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useRoom } from '../state/RoomContext'
import { useFriends } from '../state/FriendsContext'
import { useProfileViewer } from '../state/ProfileViewer'
import { getLeaderboard, getSeasonLeaderboard } from '../lib/supabase'
import { levelInfo } from '../lib/achievements'
import { useT } from '../lib/i18n'
import { Button, Panel } from '../components/ui'
import Avatar from '../components/Avatar'

export default function Home({ onExit }) {
  const { profile } = useAuth()
  const { createRoom, joinRoom, quickPlay, busy, error } = useRoom()
  const { friends } = useFriends()
  const { openProfile } = useProfileViewer() || {}
  const t = useT()
  const [code, setCode] = useState('')
  const [board, setBoard] = useState([])
  const [seasonBoard, setSeasonBoard] = useState([])
  const [loadingBoard, setLoadingBoard] = useState(true)
  const [loadingSeason, setLoadingSeason] = useState(false)
  const [scope, setScope] = useState('global') // global | friends | season

  useEffect(() => {
    getLeaderboard(20)
      .then(setBoard)
      .finally(() => setLoadingBoard(false))
  }, [])

  // لیدەربۆردی هەفتانە — لە سەرەتای هەفتەی ئێستاوە (دووشەممە UTC)
  useEffect(() => {
    if (scope !== 'season' || seasonBoard.length) return
    const now = new Date()
    const day = (now.getUTCDay() + 6) % 7 // دووشەممە = 0
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day))
    setLoadingSeason(true)
    getSeasonLeaderboard(monday.toISOString(), 20)
      .then(setSeasonBoard)
      .finally(() => setLoadingSeason(false))
  }, [scope, seasonBoard.length])

  // لیستی هاوڕێیان (+ خۆم) ڕیزکراو بەپێی خاڵ
  const friendsBoard = [
    ...(profile ? [{ id: profile.id, display_name: profile.display_name, avatar_url: profile.avatar_url, total_points: profile.total_points || 0 }] : []),
    ...friends.map((f) => ({
      id: f.id,
      display_name: f.profile?.display_name,
      avatar_url: f.profile?.avatar_url,
      total_points: f.profile?.total_points || 0,
    })),
  ].sort((a, b) => b.total_points - a.total_points)

  const shown = scope === 'friends' ? friendsBoard : scope === 'season' ? seasonBoard : board

  return (
    <div className="mx-auto max-w-md px-4 py-5 pb-24">
      {/* پرۆفایل */}
      <header className="mb-8 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3 rounded-full bg-surface py-1.5 pl-4 pr-1.5 shadow-card">
          <Avatar url={profile?.avatar_url} name={profile?.display_name} size={40} level={levelInfo(profile?.total_points).level} ring />
          <div className="leading-tight">
            <p className="text-sm font-bold text-ink">{profile?.display_name}</p>
            <p className="flex items-center gap-1 text-xs text-crew">
              <Star className="h-3 w-3 fill-crew" />
              {profile?.total_points ?? 0} خاڵ
            </p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="btn-press flex items-center gap-1 rounded-full bg-surface px-3 py-2.5 text-sm text-muted shadow-card hover:text-ink"
          title={t('گەڕانەوە بۆ مێنیو')}
        >
          <ChevronRight className="h-4 w-4" />
          {t('مێنیو')}
        </button>
      </header>

      {/* هیرۆ */}
      <div className="mb-8 flex flex-col items-center text-center animate-scale-in">
        <div className="relative mb-3">
          <span className="absolute inset-0 -z-10 rounded-3xl bg-crew/30 blur-xl" />
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-impostor to-crew shadow-soft neon-ring">
            <Rocket className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-ink neon-text">{t('ساختەکار')}</h1>
        <p className="mt-1 text-sm text-muted">{t('ژوورێک دروست بکە یان بەشداربە')}</p>
      </div>

      {error && (
        <p className="mb-4 rounded-2xl bg-impostor/10 px-4 py-3 text-center text-sm font-medium text-impostor">
          {error}
        </p>
      )}

      {/* یاری خێرا — بەشداربوونی هەرەمەکی خێرا */}
      <Button
        onClick={() => quickPlay()}
        disabled={busy}
        className="mb-3 w-full !py-4 !text-lg !bg-gradient-to-r !from-amber-500 !to-impostor"
      >
        {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Zap className="h-6 w-6" />}
        {t('یاری خێرا')}
      </Button>

      {/* دروستکردنی ژوور */}
      <Button
        onClick={() => createRoom()}
        disabled={busy}
        variant="danger"
        className="mb-5 w-full !py-4 !text-lg"
      >
        {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
        {t('دروستکردنی ژووری نوێ')}
      </Button>

      {/* بەشداربوون بە کۆد */}
      <Panel className="mb-5 !p-4">
        <p className="mb-3 text-sm font-bold text-ink">{t('بەشداربوون بە کۆد')}</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && code && joinRoom(code)}
          placeholder={t('کۆدی ژوور')}
          maxLength={5}
          className="mb-3 w-full rounded-2xl border border-line bg-surface2 px-4 py-3.5 text-center text-2xl font-black tracking-[0.3em] text-ink placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-muted/60 outline-none focus:border-crew focus:bg-surface"
        />
        <Button onClick={() => joinRoom(code)} disabled={busy || !code} className="w-full !py-3.5">
          <LogIn className="h-5 w-5" />
          {t('بەشداری')}
        </Button>
      </Panel>

      {/* لیدەربۆرد */}
      <Panel className="!p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-crew/10">
            <Trophy className="h-4 w-4 text-crew" />
          </div>
          <h2 className="font-bold text-ink">{t('پاڵەوانان')}</h2>
        </div>

        {/* جیاکردنەوەی گشتی / هاوڕێیان / هەفتانە */}
        <div className="mb-4 flex rounded-2xl bg-surface2 p-1">
          {[
            { k: 'global', label: t('گشتی') },
            { k: 'friends', label: t('هاوڕێیان') },
            { k: 'season', label: t('هەفتانە') },
          ].map((tab) => (
            <button
              key={tab.k}
              onClick={() => setScope(tab.k)}
              className={`flex-1 rounded-xl py-1.5 text-sm font-bold transition ${
                scope === tab.k ? 'bg-crew text-white shadow-card' : 'text-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {(scope === 'global' && loadingBoard) || (scope === 'season' && loadingSeason) ? (
          <div className="flex justify-center py-6 text-crew">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : shown.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            {scope === 'friends'
              ? t('هێشتا هاوڕێیەکت نییە')
              : scope === 'season'
              ? t('ئەم هەفتە کەس خاڵی نەهێناوە')
              : t('هێشتا کەس یاری نەکردووە')}
          </p>
        ) : (
          <div className="space-y-1.5">
            {shown.map((p, i) => (
              <button
                key={p.id}
                onClick={() => openProfile?.(p.id, p.display_name, p.avatar_url)}
                className={`btn-press flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-right ${
                  i === 0 ? 'bg-amber-400/10' : 'bg-surface2'
                }`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-black ${
                    i === 0
                      ? 'bg-amber-400/30 text-amber-600'
                      : i === 1
                      ? 'bg-ink/10 text-ink'
                      : i === 2
                      ? 'bg-orange-400/25 text-orange-600'
                      : 'bg-ink/5 text-muted'
                  }`}
                >
                  {i === 0 ? <Crown className="h-4 w-4" /> : i + 1}
                </span>
                <Avatar url={p.avatar_url} name={p.display_name} size={32} level={levelInfo(p.total_points).level} />
                <span className="flex-1 truncate font-bold text-ink">{p.display_name}</span>
                <span className="flex items-center gap-1 rounded-full bg-crew/10 px-2.5 py-1 text-sm font-bold text-crew">
                  {scope === 'season' ? p.season_points : p.total_points}
                </span>
              </button>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

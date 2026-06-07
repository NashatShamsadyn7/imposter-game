import { useEffect, useState, useCallback } from 'react'
import { Rocket, ChevronRight, Plus, LogIn, Loader2, Star, Zap, Users, RefreshCw, DoorOpen } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useRoom } from '../state/RoomContext'
import { useWords } from '../state/WordsContext'
import { listOpenRooms } from '../lib/supabase'
import { levelInfo } from '../lib/achievements'
import { useT } from '../lib/i18n'
import { Button, Panel } from '../components/ui'
import Avatar from '../components/Avatar'

export default function Home({ onExit }) {
  const { profile } = useAuth()
  const { createRoom, joinRoom, quickPlay, busy, error } = useRoom()
  const { getCategoryById } = useWords()
  const t = useT()
  const [code, setCode] = useState('')
  const [rooms, setRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(true)

  // هێنانی ژوورە کراوەکان + نوێکردنەوەی خۆکار هەر ٦ چرکە
  const loadRooms = useCallback(async () => {
    const data = await listOpenRooms()
    setRooms(data)
    setLoadingRooms(false)
  }, [])

  useEffect(() => {
    loadRooms()
    const i = setInterval(loadRooms, 6000)
    return () => clearInterval(i)
  }, [loadRooms])

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

      {/* ژوورە کراوەکان — بەشداربە لە یارییەکانی ئێستا */}
      <Panel className="!p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-crew/10">
              <DoorOpen className="h-4 w-4 text-crew" />
            </div>
            <h2 className="font-bold text-ink">{t('ژوورە کراوەکان')}</h2>
          </div>
          <button
            onClick={loadRooms}
            className="btn-press grid h-8 w-8 place-items-center rounded-xl bg-surface2 text-muted hover:text-crew"
            title={t('نوێکردنەوە')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loadingRooms ? (
          <div className="flex justify-center py-6 text-crew">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <p className="py-5 text-center text-sm text-muted">
            {t('هیچ ژوورێکی کراوە نییە ئێستا — یەکێک دروست بکە!')}
          </p>
        ) : (
          <div className="space-y-2">
            {rooms.map((r) => {
              const cat = getCategoryById(r.category_id)
              return (
                <button
                  key={r.id}
                  onClick={() => !busy && joinRoom(r.code)}
                  disabled={busy}
                  className="btn-press flex w-full items-center gap-3 rounded-2xl border border-line bg-surface2 px-3 py-2.5 text-right hover:border-crew/50 disabled:opacity-50"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-crew/10 text-xl">
                    {cat?.icon || '🎮'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">
                      {cat?.name || r.category_id}
                      {r.mode === 'undercover' && <span className="mr-1 text-xs text-impostor"> · شاراوە</span>}
                    </p>
                    <p className="truncate text-xs text-muted">{r.host_name}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-crew/10 px-2.5 py-1 text-sm font-bold text-crew">
                    <Users className="h-3.5 w-3.5" /> {Number(r.player_count)}
                  </span>
                  <LogIn className="h-4 w-4 shrink-0 text-muted" />
                </button>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}

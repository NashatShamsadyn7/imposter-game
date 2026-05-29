import { useEffect, useState } from 'react'
import { Rocket, ChevronRight, Plus, LogIn, Trophy, Crown, Loader2, Star } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useRoom } from '../state/RoomContext'
import { getLeaderboard } from '../lib/supabase'
import { Button, Panel } from '../components/ui'
import Avatar from '../components/Avatar'

export default function Home({ onExit }) {
  const { profile } = useAuth()
  const { createRoom, joinRoom, busy, error } = useRoom()
  const [code, setCode] = useState('')
  const [board, setBoard] = useState([])
  const [loadingBoard, setLoadingBoard] = useState(true)

  useEffect(() => {
    getLeaderboard(10)
      .then(setBoard)
      .finally(() => setLoadingBoard(false))
  }, [])

  return (
    <div className="mx-auto max-w-md px-4 py-5 pb-24">
      {/* پرۆفایل */}
      <header className="mb-8 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3 rounded-full bg-surface py-1.5 pl-4 pr-1.5 shadow-card">
          <Avatar url={profile?.avatar_url} name={profile?.display_name} size={40} ring />
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
          title="گەڕانەوە بۆ مێنیو"
        >
          <ChevronRight className="h-4 w-4" />
          مێنیو
        </button>
      </header>

      {/* هیرۆ */}
      <div className="mb-8 flex flex-col items-center text-center animate-scale-in">
        <div className="mb-3 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-impostor to-crew shadow-soft">
          <Rocket className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-ink">ساختەکار</h1>
        <p className="mt-1 text-sm text-muted">ژوورێک دروست بکە یان بەشداربە</p>
      </div>

      {error && (
        <p className="mb-4 rounded-2xl bg-impostor/10 px-4 py-3 text-center text-sm font-medium text-impostor">
          {error}
        </p>
      )}

      {/* دروستکردنی ژوور */}
      <Button
        onClick={() => createRoom()}
        disabled={busy}
        variant="danger"
        className="mb-5 w-full !py-4 !text-lg"
      >
        {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
        دروستکردنی ژووری نوێ
      </Button>

      {/* بەشداربوون بە کۆد */}
      <Panel className="mb-5 !p-4">
        <p className="mb-3 text-sm font-bold text-ink">بەشداربوون بە کۆد</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && code && joinRoom(code)}
          placeholder="کۆدی ژوور"
          maxLength={5}
          className="mb-3 w-full rounded-2xl border border-line bg-surface2 px-4 py-3.5 text-center text-2xl font-black tracking-[0.3em] text-ink placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-muted/60 outline-none focus:border-crew focus:bg-surface"
        />
        <Button onClick={() => joinRoom(code)} disabled={busy || !code} className="w-full !py-3.5">
          <LogIn className="h-5 w-5" />
          بەشداری
        </Button>
      </Panel>

      {/* لیدەربۆرد */}
      <Panel className="!p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-crew/10">
            <Trophy className="h-4 w-4 text-crew" />
          </div>
          <h2 className="font-bold text-ink">پاڵەوانان</h2>
        </div>
        {loadingBoard ? (
          <div className="flex justify-center py-6 text-crew">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : board.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">هێشتا کەس یاری نەکردووە</p>
        ) : (
          <div className="space-y-1.5">
            {board.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${
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
                <Avatar url={p.avatar_url} name={p.display_name} size={32} />
                <span className="flex-1 truncate font-bold text-ink">{p.display_name}</span>
                <span className="flex items-center gap-1 rounded-full bg-crew/10 px-2.5 py-1 text-sm font-bold text-crew">
                  {p.total_points}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

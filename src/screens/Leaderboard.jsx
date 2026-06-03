// ═══════════════════════════════════════════════════════════
//  Leaderboard — لیدەربۆردی پێشبڕکێ (هەفتە/مانگ/هەمیشە)
//  پێشبڕکێ یاریزانان دەهێنێتەوە — کلیلێکی گرنگی گەڕانەوەیە.
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { ChevronRight, Crown, Medal, Loader2, Trophy } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useProfileViewer } from '../state/ProfileViewer'
import { Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import { getSeasonLeaderboard } from '../lib/supabase'
import { levelInfo } from '../lib/achievements'
import { useT } from '../lib/i18n'

const DAY = 86400000

// ماوەکان — since بە ISO دەنێردرێت بۆ فلتەرکردنی ئەنجامەکان
const RANGES = [
  { id: 'week', label: 'هەفتە', days: 7 },
  { id: 'month', label: 'مانگ', days: 30 },
  { id: 'all', label: 'هەمیشە', days: null },
]

export default function Leaderboard({ onBack }) {
  const { user } = useAuth()
  const { openProfile } = useProfileViewer() || {}
  const t = useT()
  const [range, setRange] = useState('week')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    const cfg = RANGES.find((r) => r.id === range)
    const since = cfg.days
      ? new Date(Date.now() - cfg.days * DAY).toISOString()
      : new Date(0).toISOString()
    getSeasonLeaderboard(since, 50)
      .then((data) => { if (active) setRows(data) })
      .catch(() => { if (active) setRows([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [range])

  const myRank = rows.findIndex((r) => r.id === user?.id)

  return (
    <div className="mx-auto max-w-md px-5 py-6 pb-24">
      {/* سەردێڕ */}
      <header className="mb-6 flex items-center gap-3 animate-fade-in">
        <button
          onClick={onBack}
          className="btn-press grid h-11 w-11 place-items-center rounded-full bg-surface text-ink shadow-card"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <h1 className="flex items-center gap-2 text-2xl font-black text-ink">
          <Trophy className="h-6 w-6 text-amber-500" /> {t('لیدەربۆرد')}
        </h1>
      </header>

      {/* تابی ماوە */}
      <div className="mb-5 flex gap-2 rounded-2xl bg-ink/5 p-1">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`btn-press flex-1 rounded-xl py-2 text-sm font-bold transition ${
              range === r.id ? 'bg-crew text-white shadow-card' : 'text-muted'
            }`}
          >
            {t(r.label)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-crew">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <Panel className="py-12 text-center text-muted">{t('هێشتا ئەنجامێک نییە')}</Panel>
      ) : (
        <>
          {/* منصّة التتويج — الثلاثة الأوائل */}
          {rows.length >= 3 && (
            <Podium
              top={rows.slice(0, 3)}
              meId={user?.id}
              onOpen={(r) => openProfile?.(r.id, r.display_name, r.avatar_url)}
              t={t}
            />
          )}
          <div className="space-y-2">
            {rows.slice(rows.length >= 3 ? 3 : 0).map((r, i) => (
              <Row
                key={r.id}
                rank={(rows.length >= 3 ? 3 : 0) + i + 1}
                row={r}
                isMe={r.id === user?.id}
                onClick={() => openProfile?.(r.id, r.display_name, r.avatar_url)}
                t={t}
              />
            ))}
          </div>
        </>
      )}

      {/* پلەی من ئەگەر لە لیستدا نەبووم */}
      {!loading && myRank === -1 && user && (
        <Panel className="mt-4 py-4 text-center text-sm text-muted">
          {t('تۆ هێشتا لە ٥٠ی سەرەوەدا نیت — زیاتر یاری بکە!')}
        </Panel>
      )}
    </div>
  )
}

const MEDAL = {
  1: { icon: Crown, cls: 'text-amber-400 bg-amber-400/15' },
  2: { icon: Medal, cls: 'text-slate-300 bg-slate-300/15' },
  3: { icon: Medal, cls: 'text-orange-400 bg-orange-400/15' },
}

// منصّة التتويج — ٢ | ١ | ٣
function Podium({ top, meId, onOpen, t }) {
  // ڕیزبەندی پیشاندان: دووەم، یەکەم (بەرز)، سێیەم
  const order = [
    { r: top[1], rank: 2, h: 'h-20', glow: 'shadow-[0_0_22px_-6px_rgba(203,213,225,0.7)]', ring: 'ring-slate-300', size: 56 },
    { r: top[0], rank: 1, h: 'h-28', glow: 'shadow-[0_0_30px_-6px_rgba(251,191,36,0.85)]', ring: 'ring-amber-400', size: 72 },
    { r: top[2], rank: 3, h: 'h-16', glow: 'shadow-[0_0_22px_-6px_rgba(251,146,60,0.7)]', ring: 'ring-orange-400', size: 56 },
  ]
  return (
    <div className="mb-5 grid grid-cols-3 items-end gap-2">
      {order.map(({ r, rank, h, glow, ring, size }) => {
        const { level } = levelInfo(r.total_points)
        return (
          <button
            key={r.id}
            onClick={() => onOpen(r)}
            className="btn-press flex flex-col items-center"
          >
            <div className={`relative mb-2 rounded-full ring-2 ${ring} ${glow}`}>
              {rank === 1 && <Crown className="absolute -top-5 left-1/2 h-6 w-6 -translate-x-1/2 text-amber-400" />}
              <Avatar url={r.avatar_url} name={r.display_name} size={size} level={level} />
              <span className="absolute -bottom-1 left-1/2 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full bg-surface text-xs font-black text-ink shadow-card">
                {rank}
              </span>
            </div>
            <p className="max-w-full truncate px-1 text-xs font-bold text-ink">{r.display_name}</p>
            <span className="text-xs font-black text-crew">{r.season_points}</span>
            <div className={`mt-1 w-full rounded-t-xl bg-gradient-to-t from-crew/5 to-crew/25 ${h} ${r.id === meId ? 'ring-1 ring-crew' : ''}`} />
          </button>
        )
      })}
    </div>
  )
}

function Row({ rank, row, isMe, onClick, t }) {
  const m = MEDAL[rank]
  const { level } = levelInfo(row.total_points)
  return (
    <button
      onClick={onClick}
      className={`btn-press flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-right ${
        isMe ? 'border-crew bg-crew/10' : 'border-line bg-surface'
      }`}
    >
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${
        m ? m.cls : 'bg-ink/8 text-muted'
      }`}>
        {m ? <m.icon className="h-5 w-5" /> : rank}
      </div>
      <Avatar url={row.avatar_url} name={row.display_name} size={40} level={level} ring />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-ink">
          {row.display_name}
          {isMe && <span className="mr-1 text-xs text-crew"> ({t('تۆ')})</span>}
        </p>
        <p className="text-xs text-muted">{t('ئاستی')} {level}</p>
      </div>
      <span className="shrink-0 font-black text-crew">{row.season_points}</span>
    </button>
  )
}

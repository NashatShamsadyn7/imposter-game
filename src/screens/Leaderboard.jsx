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
        <div className="space-y-2">
          {rows.map((r, i) => (
            <Row
              key={r.id}
              rank={i + 1}
              row={r}
              isMe={r.id === user?.id}
              onClick={() => openProfile?.(r.id, r.display_name, r.avatar_url)}
              t={t}
            />
          ))}
        </div>
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

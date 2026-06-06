import { useEffect, useState } from 'react'
import { ChevronRight, Gamepad2, Trophy, Star, Skull, ShieldCheck, Percent, Loader2 } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { Panel } from '../components/ui'
import { CATEGORIES } from '../data/words'
import { fetchUserResults } from '../lib/supabase'
import { computeStats } from '../lib/stats'
import { rankInfo } from '../lib/rank'
import { useT } from '../lib/i18n'

// شاشەی ئامار — لێکدانەوەی مێژووی یاری
export default function Stats({ onBack }) {
  const { user, profile } = useAuth()
  const t = useT()
  const rk = rankInfo(profile?.rank_points)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchUserResults(user?.id)
      .then((rows) => {
        if (!cancelled) setStats(computeStats(rows))
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const catName = stats?.favoriteCategory
    ? CATEGORIES.find((c) => c.id === stats.favoriteCategory)?.name || stats.favoriteCategory
    : null

  return (
    <div className="mx-auto max-w-md px-5 py-6 pb-24 md:max-w-2xl">
      {/* سەردێڕ */}
      <header className="mb-6 flex items-center gap-3 animate-fade-in">
        <button
          onClick={onBack}
          className="btn-press grid h-11 w-11 place-items-center rounded-full bg-surface text-ink shadow-card"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-black text-ink">{t('ئامار')}</h1>
      </header>

      {loading ? (
        <div className="flex justify-center py-20 text-crew">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : !stats || stats.games === 0 ? (
        <Panel className="py-12 text-center text-muted">
          <Gamepad2 className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p>{t('هیچ یارییەک تۆمار نەکراوە')}</p>
        </Panel>
      ) : (
        <>
          {/* کارتی پلە (Ranked) */}
          <Panel className="mb-4 animate-scale-in" style={{ borderColor: `${rk.rank.color}55` }}>
            <div className="flex items-center gap-3">
              <span className="text-4xl" style={{ filter: `drop-shadow(0 0 8px ${rk.rank.color})` }}>
                {rk.rank.icon}
              </span>
              <div className="flex-1">
                <p className="text-lg font-black" style={{ color: rk.rank.color }}>{t(rk.rank.name)}</p>
                <p className="text-xs text-muted">{rk.points} {t('خاڵی پلە')}</p>
              </div>
              {rk.next && (
                <div className="text-left text-xs text-muted">
                  <p>{t('پلەی داهاتوو')}</p>
                  <p className="font-bold" style={{ color: rk.next.color }}>{rk.next.icon} {t(rk.next.name)}</p>
                </div>
              )}
            </div>
            {rk.next && (
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.round(rk.progress * 100)}%`, background: rk.rank.color }}
                />
              </div>
            )}
          </Panel>

          {/* ئامارە سەرەکییەکان */}
          <div className="mb-4 grid grid-cols-3 gap-3 animate-scale-in">
            <StatBox icon={Gamepad2} value={stats.games} label={t('یاری')} />
            <StatBox icon={Trophy} value={stats.wins} label={t('سەرکەوتن')} />
            <StatBox icon={Percent} value={`${stats.winRate}%`} label={t('ڕێژەی سەرکەوتن')} accent />
          </div>

          {/* دۆخی دوایی */}
          <Panel className="mb-4">
            <p className="mb-3 text-sm font-bold text-ink">{t('دۆخی دوایی')}</p>
            <div className="flex gap-1.5">
              {stats.recentForm.map((won, i) => (
                <span
                  key={i}
                  className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-black text-white ${
                    won ? 'bg-crew' : 'bg-impostor/70'
                  }`}
                  title={won ? t('سەرکەوتن') : t('دۆڕان')}
                >
                  {won ? 'W' : 'L'}
                </span>
              ))}
            </div>
          </Panel>

          {/* تەفصیلی ڕۆڵ */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <RoleCard
              icon={Skull}
              border="border-impostor/30"
              text="text-impostor"
              title={t('وەک ساختەکار')}
              games={stats.asImpostor}
              winRate={stats.impostorWinRate}
              t={t}
            />
            <RoleCard
              icon={ShieldCheck}
              border="border-crew/30"
              text="text-crew"
              title={t('وەک دەستەی کەشتی')}
              games={stats.asCrew}
              winRate={stats.crewWinRate}
              t={t}
            />
          </div>

          {/* هاوپۆڵی دڵخواز + کۆی خاڵ */}
          <div className="grid grid-cols-2 gap-3">
            <Panel className="!p-4 text-center">
              <Star className="mx-auto mb-1 h-5 w-5 text-amber-500" />
              <p className="text-xl font-black text-ink">{stats.points}</p>
              <p className="text-xs text-muted">{t('کۆی خاڵ')}</p>
            </Panel>
            <Panel className="!p-4 text-center">
              <p className="mb-1 text-2xl">🏷️</p>
              <p className="truncate text-base font-black text-ink">{catName || '—'}</p>
              <p className="text-xs text-muted">{t('هاوپۆڵی دڵخواز')}</p>
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}

function StatBox({ icon: Icon, value, label, accent }) {
  return (
    <Panel className="!p-3 text-center">
      <Icon className={`mx-auto mb-1 h-5 w-5 ${accent ? 'text-amber-500' : 'text-crew'}`} />
      <p className="text-xl font-black text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </Panel>
  )
}

function RoleCard({ icon: Icon, border, text, title, games, winRate, t }) {
  return (
    <Panel className={`!p-4 ${border}`}>
      <div className={`mb-2 inline-flex items-center gap-2 ${text}`}>
        <Icon className="h-5 w-5" />
        <span className="text-sm font-bold">{title}</span>
      </div>
      <p className="text-lg font-black text-ink">
        {games} <span className="text-sm font-normal text-muted">{t('یاری')}</span>
      </p>
      <p className={`text-sm font-bold ${text}`}>
        {winRate}% {t('سەرکەوتن')}
      </p>
    </Panel>
  )
}

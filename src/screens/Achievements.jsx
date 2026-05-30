import { ChevronRight, Lock, Star, Trophy, Gamepad2 } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import { ACHIEVEMENTS, levelInfo, levelTitle, unlockedCount } from '../lib/achievements'
import { useT } from '../lib/i18n'

// شاشەی دەستکەوت و ئاست
export default function Achievements({ onBack }) {
  const { profile } = useAuth()
  const t = useT()
  const stats = profile || {}
  const points = stats.total_points || 0
  const { level, intoLevel, needed, progress } = levelInfo(points)
  const unlocked = unlockedCount(stats)

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
        <h1 className="text-2xl font-black text-ink">{t('دەستکەوت و ئاست')}</h1>
      </header>

      {/* کارتی ئاست */}
      <Panel className="mb-5 animate-scale-in">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar url={stats.avatar_url} name={stats.display_name} size={64} level={level} ring />
            <span className="absolute -bottom-1 -left-1 grid h-7 min-w-7 place-items-center rounded-full bg-crew px-1.5 text-xs font-black text-white shadow-card">
              {level}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-lg font-black text-ink">{stats.display_name}</p>
            <p className="text-sm text-crew">{t('ئاستی')} {level} · {levelTitle(level)}</p>
          </div>
        </div>

        {/* بارەی پێشکەوتنی XP */}
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>XP</span>
            <span>{intoLevel} / {needed}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-crew to-impostor transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      </Panel>

      {/* ئامارەکان */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatBox icon={Star} value={points} label={t('خاڵ')} />
        <StatBox icon={Trophy} value={stats.wins || 0} label={t('سەرکەوتن')} />
        <StatBox icon={Gamepad2} value={stats.games_played || 0} label={t('یاری')} />
      </div>

      {/* دەستکەوتەکان */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-black text-ink">{t('دەستکەوتەکان')}</h2>
        <span className="text-sm text-muted">{unlocked} / {ACHIEVEMENTS.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const done = a.check(stats)
          const Icon = a.icon
          return (
            <div
              key={a.id}
              className={`rounded-2xl border p-3 transition ${
                done
                  ? 'border-crew/40 bg-crew/10'
                  : 'border-line bg-surface opacity-60'
              }`}
            >
              <div
                className={`mb-2 grid h-11 w-11 place-items-center rounded-xl ${
                  done ? 'bg-crew/20 text-crew' : 'bg-ink/10 text-muted'
                }`}
              >
                {done ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
              </div>
              <p className="text-sm font-bold text-ink">{a.name}</p>
              <p className="text-xs text-muted">{a.desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatBox({ icon: Icon, value, label }) {
  return (
    <Panel className="!p-3 text-center">
      <Icon className="mx-auto mb-1 h-5 w-5 text-crew" />
      <p className="text-xl font-black text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </Panel>
  )
}

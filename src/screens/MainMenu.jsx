import { Rocket, Wifi, Smartphone, Settings as SettingsIcon, LogOut, Star, ChevronLeft, Trophy } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import { levelInfo } from '../lib/achievements'
import { sfx, unlockAudio } from '../lib/sound'

// مێنیوی سەرەکی دوای چوونەژوورەوە
export default function MainMenu({ onOnline, onLocal, onSettings, onAchievements }) {
  const { profile, signOut } = useAuth()
  const { level } = levelInfo(profile?.total_points)

  const go = (fn) => {
    unlockAudio()
    sfx.click()
    fn()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      {/* پرۆفایل */}
      <header className="mb-8 flex items-center justify-between animate-fade-in">
        <button
          onClick={() => go(onAchievements)}
          className="btn-press flex items-center gap-3 rounded-full bg-surface py-1.5 pl-4 pr-1.5 shadow-card transition hover:border-crew"
          title="دەستکەوت و ئاست"
        >
          <div className="relative">
            <Avatar url={profile?.avatar_url} name={profile?.display_name} size={40} ring />
            <span className="absolute -bottom-1 -left-1 grid h-5 min-w-5 place-items-center rounded-full bg-crew px-1 text-[10px] font-black text-white">
              {level}
            </span>
          </div>
          <div className="text-right leading-tight">
            <p className="text-sm font-bold text-ink">{profile?.display_name}</p>
            <p className="flex items-center gap-1 text-xs text-crew">
              <Star className="h-3 w-3 fill-crew" />
              {profile?.total_points ?? 0} خاڵ
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => go(onAchievements)}
            className="btn-press grid h-11 w-11 place-items-center rounded-full bg-surface text-crew shadow-card hover:brightness-110"
            title="دەستکەوت و ئاست"
          >
            <Trophy className="h-5 w-5" />
          </button>
          <button
            onClick={() => signOut()}
            className="btn-press grid h-11 w-11 place-items-center rounded-full bg-surface text-muted shadow-card hover:text-impostor"
            title="چوونەدەرەوە"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* هیرۆ */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-3 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-impostor to-crew shadow-soft">
          <Rocket className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-ink">ساختەکار</h1>
        <p className="mt-1 text-sm text-muted">شێوازی یاری هەڵبژێرە</p>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-4">
        {/* ئۆنلاین */}
        <button onClick={() => go(onOnline)} className="btn-press block w-full text-right">
          <Panel className="flex items-center gap-4 !p-4 transition hover:border-crew">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-crew/12 text-crew">
              <Wifi className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-ink">یاریکردنی ئۆنلاین</p>
              <p className="text-sm text-muted">هەر کەس لە ئامێری خۆی + چات</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted" />
          </Panel>
        </button>

        {/* ناوخۆیی */}
        <button onClick={() => go(onLocal)} className="btn-press block w-full text-right">
          <Panel className="flex items-center gap-4 !p-4 transition hover:border-impostor">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-impostor/12 text-impostor">
              <Smartphone className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-ink">یاریکردنی ناوخۆیی</p>
              <p className="text-sm text-muted">یەک ئامێر — Pass and Play</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted" />
          </Panel>
        </button>

        {/* ڕێکخستن */}
        <button onClick={() => go(onSettings)} className="btn-press block w-full text-right">
          <Panel className="flex items-center gap-4 !p-4 transition hover:border-ink/30">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink/8 text-ink">
              <SettingsIcon className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-ink">ڕێکخستنەکان</p>
              <p className="text-sm text-muted">دەنگ، مۆسیقا، ڕووکار</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted" />
          </Panel>
        </button>
      </div>
    </div>
  )
}

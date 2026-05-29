import { ChevronRight, Volume2, Music, Sun, Moon, Settings as SettingsIcon } from 'lucide-react'
import { Panel } from '../components/ui'
import { sfx } from '../lib/sound'

function Toggle({ on }) {
  return (
    <span className={`relative h-7 w-12 rounded-full transition ${on ? 'bg-crew' : 'bg-ink/20'}`}>
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${on ? 'right-1' : 'right-6'}`} />
    </span>
  )
}

// شاشەی ڕێکخستنەکان
export default function Settings({ ui, onBack }) {
  const { theme, setTheme, sfxOn, setSfxOn, musicOn, setMusicOn } = ui

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <header className="mb-6 flex items-center gap-3 animate-fade-in">
        <button
          onClick={onBack}
          className="btn-press grid h-10 w-10 place-items-center rounded-xl bg-surface text-muted shadow-card hover:text-ink"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-crew" />
          <h1 className="text-2xl font-black text-ink">ڕێکخستنەکان</h1>
        </div>
      </header>

      {/* دەنگ */}
      <Panel className="mb-5 !p-2">
        <button
          onClick={() => { sfx.tap(); setSfxOn(!sfxOn) }}
          className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-surface2"
        >
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-crew/12 text-crew">
            <Volume2 className="h-5 w-5" />
          </div>
          <div className="flex-1 text-right">
            <p className="font-bold text-ink">دەنگی کرتە</p>
            <p className="text-xs text-muted">دەنگی کلیک و ئاگادارکردنەوە</p>
          </div>
          <Toggle on={sfxOn} />
        </button>

        <button
          onClick={() => { sfx.tap(); setMusicOn(!musicOn) }}
          className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-surface2"
        >
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-crew/12 text-crew">
            <Music className="h-5 w-5" />
          </div>
          <div className="flex-1 text-right">
            <p className="font-bold text-ink">مۆسیقای پاشبنە</p>
            <p className="text-xs text-muted">مۆسیقای هێمنی فەزایی</p>
          </div>
          <Toggle on={musicOn} />
        </button>
      </Panel>

      {/* ڕووکار */}
      <Panel className="!p-2">
        <p className="px-3 pb-1 pt-2 text-sm font-bold text-ink">ڕووکار</p>
        <div className="flex gap-2 p-2">
          <button
            onClick={() => { sfx.tap(); setTheme('dark') }}
            className={`btn-press flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 font-bold ${
              theme === 'dark' ? 'border-crew bg-crew/12 text-crew' : 'border-line bg-surface2 text-muted'
            }`}
          >
            <Moon className="h-5 w-5" /> تاریک
          </button>
          <button
            onClick={() => { sfx.tap(); setTheme('light') }}
            className={`btn-press flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 font-bold ${
              theme === 'light' ? 'border-crew bg-crew/12 text-crew' : 'border-line bg-surface2 text-muted'
            }`}
          >
            <Sun className="h-5 w-5" /> ڕووناک
          </button>
        </div>
      </Panel>
    </div>
  )
}

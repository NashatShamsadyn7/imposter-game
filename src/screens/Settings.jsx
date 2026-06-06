import { useEffect, useState } from 'react'
import { ChevronRight, Volume2, Music, Settings as SettingsIcon, Ban, Languages, Coins, Check, Lock, Palette } from 'lucide-react'
import { Panel } from '../components/ui'
import PushToggle from '../components/PushToggle'
import Avatar from '../components/Avatar'
import { useFriends } from '../state/FriendsContext'
import { useEconomy } from '../state/EconomyContext'
import { useLang } from '../lib/i18n'
import { fetchProfilesByIds } from '../lib/supabase'
import { THEMES } from '../lib/cosmetics'
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
  const { lang, setLang, t } = useLang()

  return (
    <div className="mx-auto max-w-md px-4 py-6 md:max-w-2xl">
      <header className="mb-6 flex items-center gap-3 animate-fade-in">
        <button
          onClick={onBack}
          className="btn-press grid h-10 w-10 place-items-center rounded-xl bg-surface text-muted shadow-card hover:text-ink"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-crew" />
          <h1 className="text-2xl font-black text-ink">{t('ڕێکخستنەکان')}</h1>
        </div>
      </header>

      {/* زمان */}
      <Panel className="mb-5 !p-2">
        <div className="flex items-center gap-3 p-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-crew/12 text-crew">
            <Languages className="h-5 w-5" />
          </div>
          <p className="flex-1 font-bold text-ink">{t('زمان')}</p>
          <div className="flex gap-1 rounded-xl bg-surface2 p-1">
            <button
              onClick={() => { sfx.tap(); setLang('ku') }}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                lang === 'ku' ? 'bg-crew text-white' : 'text-muted'
              }`}
            >
              کوردی
            </button>
            <button
              onClick={() => { sfx.tap(); setLang('ar') }}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                lang === 'ar' ? 'bg-crew text-white' : 'text-muted'
              }`}
            >
              العربية
            </button>
          </div>
        </div>
      </Panel>

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
            <p className="font-bold text-ink">{t('دەنگی کرتە')}</p>
            <p className="text-xs text-muted">{t('دەنگی کلیک و ئاگادارکردنەوە')}</p>
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
            <p className="font-bold text-ink">{t('مۆسیقای پاشبنە')}</p>
            <p className="text-xs text-muted">{t('ڕادیۆی هاوبەش — هاوکات لەسەر هەموو ئامێرەکان')}</p>
          </div>
          <Toggle on={musicOn} />
        </button>

        <PushToggle />
      </Panel>

      {/* ڕووکار — ثیمەکان */}
      <ThemePicker theme={theme} setTheme={setTheme} t={t} />

      {/* کەسە بلۆککراوەکان */}
      <BlockedList />
    </div>
  )
}

// هەڵبژاردنی ثیم — بەخۆڕایی (dark/light) + کڕدراوەکان بە دراو
function ThemePicker({ theme, setTheme, t }) {
  const { coins, isOwned, buy } = useEconomy()
  const [busy, setBusy] = useState(false)

  const onPick = async (th) => {
    const unlocked = th.free || isOwned(th.id)
    if (unlocked) {
      sfx.tap()
      setTheme(th.id)
      return
    }
    if (busy || coins < th.price) { sfx.lose?.(); return }
    setBusy(true)
    try {
      const ok = await buy(th)
      if (ok) { sfx.chest?.(); setTheme(th.id) }
      else sfx.lose?.()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="!p-3">
      <p className="mb-2 flex items-center gap-1.5 px-1 text-sm font-bold text-ink">
        <Palette className="h-4 w-4 text-crew" /> {t('ڕووکار')}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {THEMES.map((th) => {
          const active = theme === th.id
          const unlocked = th.free || isOwned(th.id)
          const affordable = coins >= th.price
          return (
            <button
              key={th.id}
              onClick={() => onPick(th)}
              disabled={busy}
              className={`btn-press relative overflow-hidden rounded-2xl border p-2 text-center transition ${
                active ? 'border-crew panel-glow' : 'border-line bg-surface2'
              }`}
            >
              {/* پێشبینینی ڕەنگ */}
              <div className="mb-2 flex h-10 items-center justify-center gap-1 rounded-xl">
                {th.swatch.map((c, i) => (
                  <span key={i} className={`h-7 w-3 rounded-full ${c}`} />
                ))}
              </div>
              <p className="truncate text-xs font-bold text-ink">{t(th.name)}</p>
              {active ? (
                <span className="mt-1 flex items-center justify-center gap-0.5 text-[11px] font-black text-crew">
                  <Check className="h-3 w-3" /> {t('چالاک')}
                </span>
              ) : unlocked ? (
                <span className="mt-1 block text-[11px] font-bold text-muted">{t('بەرکردن')}</span>
              ) : (
                <span className={`mt-1 flex items-center justify-center gap-0.5 text-[11px] font-black ${affordable ? 'text-amber-500' : 'text-muted'}`}>
                  {affordable ? <Coins className="h-3 w-3" /> : <Lock className="h-3 w-3" />} {th.price}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </Panel>
  )
}

// لیستی کەسە بلۆککراوەکان + لابردنیان
function BlockedList() {
  const { blocked, unblock } = useFriends() || {}
  const { t } = useLang()
  const [profiles, setProfiles] = useState([])

  useEffect(() => {
    if (!blocked?.length) {
      setProfiles([])
      return
    }
    fetchProfilesByIds(blocked).then(setProfiles).catch(() => {})
  }, [blocked])

  if (!blocked?.length) return null

  return (
    <Panel className="mt-5 !p-3">
      <p className="mb-2 flex items-center gap-1.5 px-1 text-sm font-bold text-ink">
        <Ban className="h-4 w-4 text-impostor" /> {t('بلۆککراوەکان')} ({blocked.length})
      </p>
      <div className="space-y-2">
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl bg-ink/5 px-3 py-2">
            <Avatar url={p.avatar_url} name={p.display_name} size={36} />
            <span className="min-w-0 flex-1 truncate font-bold text-ink">{p.display_name}</span>
            <button
              onClick={() => { sfx.tap(); unblock?.(p.id) }}
              className="btn-press rounded-xl bg-ink/10 px-3 py-1.5 text-sm font-bold text-ink hover:text-crew"
            >
              {t('لابردن')}
            </button>
          </div>
        ))}
      </div>
    </Panel>
  )
}

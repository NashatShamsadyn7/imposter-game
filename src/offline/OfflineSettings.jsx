// ═══════════════════════════════════════════════════════════
//  ڕێکخستنەکانی ئەپی ئۆفلاین — زمان، ڕووکار، دەنگ، لەرینەوە.
//  هەموو ڕووکارەکان بەخۆڕایین (ئابووری لە ئەپدا نییە).
// ═══════════════════════════════════════════════════════════

import { ArrowRight, Check, Languages, Palette, Volume2, Vibrate, WifiOff, Send, Instagram, MessageCircle, Github, Mail, Globe } from 'lucide-react'
import { Button, Panel } from '../components/ui'
import { LANGS, useLang } from '../lib/i18n'
import { THEMES } from '../lib/cosmetics'
import { sfx } from '../lib/sound'
import { haptic } from '../lib/haptics'
import { VERSION_NAME } from './updateCheck'

const SOCIALS = [
  { label: 'Telegram', icon: Send, url: 'https://t.me/iosbb' },
  { label: 'Instagram', icon: Instagram, url: 'https://instagram.com/iosbb0' },
  { label: 'WhatsApp', icon: MessageCircle, url: 'https://wa.me/9647510462910' },
  { label: 'GitHub', icon: Github, url: 'https://github.com/NashatShamsadyn7' },
  { label: 'Email', icon: Mail, url: 'mailto:nashatgameryt17@gmail.com' },
  { label: 'Website', icon: Globe, url: 'https://iosbb0.web.app' },
]

// بەستەر دەبێت لە دەرەوەی ئەپەکە بکرێتەوە (وێبگەڕ/ئەپی پەیوەندیدار)،
// نەک لەناو WebView ـەکە — ئەپەکە ڕووکاری وێبگەڕی نییە و ناشیبێت
// بەکارهێنەر لەناو یارییەکەدا ون بێت. Capacitor بە '_blank' ئەمە دەکات.
function openExternal(url) {
  try {
    window.open(url, '_blank')
  } catch {
    /* ئەگەر ئامێرەکە ئەپی گونجاوی نەبوو — هیچ ڕوونادات */
  }
}

function Toggle({ on, onChange, label, icon: Icon }) {
  return (
    <button
      onClick={() => {
        sfx.tap()
        haptic.light()
        onChange(!on)
      }}
      className="btn-press flex w-full items-center justify-between rounded-2xl border border-line bg-surface2 px-4 py-3"
    >
      <span className="flex items-center gap-2 font-bold text-ink">
        <Icon className="h-4 w-4 text-crew" /> {label}
      </span>
      <span
        className={`relative h-7 w-12 rounded-full transition ${on ? 'bg-crew' : 'bg-line'}`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
            on ? 'left-1' : 'left-6'
          }`}
        />
      </span>
    </button>
  )
}

export default function OfflineSettings({ ui, onBack }) {
  const { lang, setLang, t } = useLang()
  const { theme, setTheme, sfxOn, setSfxOn, hapticsOn, setHapticsOn } = ui

  return (
    <div className="mx-auto min-h-screen max-w-md px-5 py-6">
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label={t('گەڕانەوە')}
          className="btn-press grid h-11 w-11 place-items-center rounded-full bg-surface text-ink shadow-card"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-black text-ink">{t('ڕێکخستنەکان')}</h1>
      </header>

      {/* زمان */}
      <Panel className="mb-4 !p-3">
        <p className="mb-2 flex items-center gap-1.5 px-1 text-sm font-bold text-ink">
          <Languages className="h-4 w-4 text-crew" /> {t('زمان')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                sfx.tap()
                setLang(l.code)
              }}
              dir={l.dir}
              className={`btn-press rounded-2xl border px-3 py-3 font-bold transition ${
                lang === l.code ? 'border-crew panel-glow text-crew' : 'border-line bg-surface2 text-ink'
              }`}
            >
              {l.name}
              {lang === l.code && <Check className="mr-1 inline h-4 w-4" />}
            </button>
          ))}
        </div>
      </Panel>

      {/* ڕووکار — لە ئەپدا هەموویان کراوەن */}
      <Panel className="mb-4 !p-3">
        <p className="mb-2 flex items-center gap-1.5 px-1 text-sm font-bold text-ink">
          <Palette className="h-4 w-4 text-crew" /> {t('ڕووکار')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((th) => {
            const active = theme === th.id
            return (
              <button
                key={th.id}
                onClick={() => {
                  sfx.tap()
                  haptic.light()
                  setTheme(th.id)
                }}
                className={`btn-press relative overflow-hidden rounded-2xl border p-2 text-center transition ${
                  active ? 'border-crew panel-glow' : 'border-line bg-surface2'
                }`}
              >
                <div className="mb-2 flex h-10 items-center justify-center gap-1 rounded-xl">
                  {th.swatch.map((c, i) => (
                    <span key={i} className={`h-7 w-3 rounded-full ${c}`} />
                  ))}
                </div>
                <p className="truncate text-xs font-bold text-ink">{t(th.name)}</p>
                {active && (
                  <span className="mt-1 flex items-center justify-center gap-0.5 text-[11px] font-black text-crew">
                    <Check className="h-3 w-3" /> {t('چالاک')}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </Panel>

      {/* دەنگ و لەرینەوە */}
      <div className="mb-4 flex flex-col gap-2">
        <Toggle on={sfxOn} onChange={setSfxOn} label={t('دەنگ')} icon={Volume2} />
        <Toggle on={hapticsOn} onChange={setHapticsOn} label={t('لەرینەوە')} icon={Vibrate} />
      </div>

      <Panel className="mb-4 !p-4 text-center">
        <p className="mb-1 flex items-center justify-center gap-2 text-sm font-bold text-crew">
          <WifiOff className="h-4 w-4" /> {t('ئەم ئەپە بەبێ ئینتەرنێت کاردەکات')}
        </p>
        <p className="text-xs text-muted">{t('وشە و وێنەکان لەناو ئەپەکەدان. هیچ هەژمارێک پێویست نییە.')}</p>
        <p className="mt-2 border-t border-line pt-2 text-xs text-muted">
          {t('تەنها لە کاتی کردنەوەدا وەشان پشکنین دەکرێت — ئەگەر ئینتەرنێت نەبوو، هیچ گرفتێک نییە.')}
        </p>
      </Panel>

      {/* وەشان */}
      <Panel className="mb-4 !p-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm text-muted">{t('وەشان')}</span>
          <b className="font-mono text-sm text-ink">{VERSION_NAME}</b>
        </div>
      </Panel>

      <Panel className="!p-3">
        <p className="mb-1 px-1 text-center text-sm font-bold text-ink">Nashat Shamsadyn</p>
        <p className="mb-3 px-1 text-center text-xs text-muted">{t('دروستکەری یاری')}</p>
        <div className="grid grid-cols-3 gap-2">
          {SOCIALS.map((s) => (
            <button
              key={s.label}
              onClick={() => openExternal(s.url)}
              className="btn-press flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-surface2 px-2 py-3 transition hover:border-crew"
            >
              <s.icon className="h-5 w-5 text-crew" />
              <span className="truncate text-[11px] font-bold text-muted">{s.label}</span>
            </button>
          ))}
        </div>
      </Panel>

      <div className="mt-6">
        <Button onClick={onBack} variant="ghost" className="w-full">
          {t('گەڕانەوە')}
        </Button>
      </div>
    </div>
  )
}

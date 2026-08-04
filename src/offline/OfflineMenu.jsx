// ═══════════════════════════════════════════════════════════
//  مێنیوی سەرەکی ئەپی ئۆفلاین — سێ بژاردە، هیچی زیاتر.
//  بێ هەژمار، بێ خاڵی گشتی، بێ دراو.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react'
import { Smartphone, Settings as SettingsIcon, HelpCircle, ChevronLeft, WifiOff } from 'lucide-react'
import { Panel } from '../components/ui'
import RulesModal from '../components/RulesModal'
import { useT } from '../lib/i18n'
import { sfx, unlockAudio } from '../lib/sound'
import { haptic } from '../lib/haptics'

export default function OfflineMenu({ onPlay, onSettings }) {
  const t = useT()
  const [showRules, setShowRules] = useState(false)

  const go = (fn) => {
    unlockAudio()
    sfx.click()
    haptic.light()
    fn()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-8">
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {/* هیرۆ */}
      <div className="mb-10 flex flex-col items-center text-center animate-fade-in">
        <div className="relative mb-4">
          <span className="absolute inset-0 -z-10 rounded-3xl bg-crew/30 blur-xl" />
          <div className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-impostor to-crew shadow-soft neon-ring">
            <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true">
              <circle cx="32" cy="28" r="11" fill="#e84545" />
              <ellipse cx="37" cy="26" rx="6" ry="7.5" fill="#00d4ff" />
              <rect x="23" y="37" width="18" height="17" rx="8" fill="#e84545" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-ink neon-text">{t('ساختەکار')}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <WifiOff className="h-3.5 w-3.5" /> {t('یەک ئامێر — Pass and Play')}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* دەستپێکردن */}
        <button onClick={() => go(onPlay)} className="btn-press block w-full text-right">
          <Panel className="panel-glow flex items-center gap-4 !p-4 transition hover:border-impostor">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-impostor/12 text-impostor">
              <Smartphone className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-ink">{t('دەستپێکردنی یاری')}</p>
              <p className="text-sm text-muted">{t('٣ بۆ ٤٠ یاریزان لەسەر یەک مۆبایل')}</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted" />
          </Panel>
        </button>

        {/* ڕێنمایی */}
        <button onClick={() => go(() => setShowRules(true))} className="btn-press block w-full text-right">
          <Panel className="flex items-center gap-4 !p-4 transition hover:border-crew">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-crew/15 text-crew">
              <HelpCircle className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-ink">{t('چۆن یاری دەکرێت؟')}</p>
              <p className="text-sm text-muted">{t('ڕێساکان بە کورتی')}</p>
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
              <p className="text-lg font-black text-ink">{t('ڕێکخستنەکان')}</p>
              <p className="text-sm text-muted">{t('زمان، ڕووکار، دەنگ')}</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted" />
          </Panel>
        </button>
      </div>
    </div>
  )
}

import { Rocket, Wifi, Smartphone, ChevronLeft } from 'lucide-react'
import { Panel } from '../components/ui'
import { useT } from '../lib/i18n'
import { sfx, unlockAudio } from '../lib/sound'

// شاشەی هەڵبژاردنی شێوازی یاری
export default function ModeSelect({ onSelect }) {
  const t = useT()
  const pick = (mode) => {
    unlockAudio()
    sfx.click()
    onSelect(mode)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-10">
      <div className="w-full animate-scale-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <span className="absolute inset-0 -z-10 rounded-3xl bg-crew/30 blur-xl" />
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-impostor to-crew shadow-soft neon-ring">
              <Rocket className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-ink neon-text">{t('ساختەکار')}</h1>
          <p className="mt-1 text-sm text-muted">{t('شێوازی یاری هەڵبژێرە')}</p>
        </div>

        {/* ئۆنلاین */}
        <button onClick={() => pick('online')} className="btn-press mb-4 block w-full text-right">
          <Panel className="panel-glow flex items-center gap-4 !p-4 transition hover:border-crew">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-crew/15 text-crew neon-ring">
              <Wifi className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-ink">{t('یاریکردنی ئۆنلاین')}</p>
              <p className="text-sm text-muted">{t('هەر کەس لە ئامێری خۆی + چات + خاڵی کلاود')}</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted" />
          </Panel>
        </button>

        {/* ناوخۆیی */}
        <button onClick={() => pick('local')} className="btn-press block w-full text-right">
          <Panel className="flex items-center gap-4 !p-4 transition hover:border-impostor">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-impostor/12 text-impostor">
              <Smartphone className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-ink">{t('یاریکردنی ناوخۆیی')}</p>
              <p className="text-sm text-muted">{t('یەک ئامێر — بەبێ ئینتەرنێت و چوونەژوورەوە')}</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted" />
          </Panel>
        </button>
      </div>
    </div>
  )
}

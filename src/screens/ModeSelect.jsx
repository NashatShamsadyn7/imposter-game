import { Rocket, Wifi, Smartphone, ChevronLeft } from 'lucide-react'
import { Panel } from '../components/ui'
import { sfx, unlockAudio } from '../lib/sound'

// شاشەی هەڵبژاردنی شێوازی یاری
export default function ModeSelect({ onSelect }) {
  const pick = (mode) => {
    unlockAudio()
    sfx.click()
    onSelect(mode)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-10">
      <div className="w-full animate-scale-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-impostor to-crew shadow-soft">
            <Rocket className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-ink">ساختەکار</h1>
          <p className="mt-1 text-sm text-muted">شێوازی یاری هەڵبژێرە</p>
        </div>

        {/* ئۆنلاین */}
        <button onClick={() => pick('online')} className="btn-press mb-4 block w-full text-right">
          <Panel className="flex items-center gap-4 !p-4 transition hover:border-crew">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-crew/12 text-crew">
              <Wifi className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-ink">یاریکردنی ئۆنلاین</p>
              <p className="text-sm text-muted">هەر کەس لە ئامێری خۆی + چات + خاڵی کلاود</p>
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
              <p className="text-lg font-black text-ink">یاریکردنی ناوخۆیی</p>
              <p className="text-sm text-muted">یەک ئامێر — بەبێ ئینتەرنێت و چوونەژوورەوە</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted" />
          </Panel>
        </button>
      </div>
    </div>
  )
}

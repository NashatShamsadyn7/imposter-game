import { Brain, Wifi, Smartphone, ChevronLeft, ArrowRight } from 'lucide-react'
import { Panel } from '../../components/ui'
import { useT } from '../../lib/i18n'
import { sfx, unlockAudio } from '../../lib/sound'
import { TOTAL_QUESTIONS } from '../../data/iq'

// شاشەی هەڵبژاردنی شێوازی یاری IQ (ئۆنلاین / ناوخۆیی)
export default function IQModeSelect({ onSelect, onBack }) {
  const t = useT()
  const pick = (mode) => {
    unlockAudio()
    sfx.click()
    onSelect(mode)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
      <button
        onClick={() => { sfx.tap(); onBack() }}
        className="btn-press mb-6 flex items-center gap-1 self-start text-sm text-muted hover:text-ink"
      >
        <ArrowRight className="h-4 w-4" />
        {t('گەڕانەوە')}
      </button>

      <div className="mb-8 flex flex-col items-center text-center animate-scale-in">
        <div className="mb-3 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 to-crew shadow-soft">
          <Brain className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-ink">IQ</h1>
        <p className="mt-1 text-sm text-muted">
          {t('تاقیکردنەوەی زیرەکی')} · {TOTAL_QUESTIONS}+ {t('پرسیار')}
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-4">
        {/* ناوخۆیی */}
        <button onClick={() => pick('local')} className="btn-press block w-full text-right">
          <Panel className="flex items-center gap-4 !p-4 transition hover:border-crew">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-crew/12 text-crew">
              <Smartphone className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-ink">IQ {t('ناوخۆیی')}</p>
              <p className="text-sm text-muted">{t('یەک ئامێر — بەبێ ئینتەرنێت')}</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted" />
          </Panel>
        </button>

        {/* ئۆنلاین — بەزووی */}
        <button onClick={() => pick('online')} className="btn-press block w-full text-right">
          <Panel className="flex items-center gap-4 !p-4 transition hover:border-amber-400">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-500">
              <Wifi className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-ink">IQ {t('ئۆنلاین')}</p>
              <p className="text-sm text-muted">{t('خێراترین وەڵامی ڕاست دەباتەوە')}</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted" />
          </Panel>
        </button>
      </div>
    </div>
  )
}

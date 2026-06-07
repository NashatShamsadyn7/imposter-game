// ═══════════════════════════════════════════════════════════
//  UpdatePrompt — شریتی «وەشانی نوێ ئامادەیە»
//  کاتێک Service Worker ـی نوێ چاوەڕوانە (sw-waiting)، شریتێک
//  دەردەکەوێت. کلیک → worker ـی نوێ چالاک دەکات و ئەپ نوێ دەبێتەوە.
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useT } from '../lib/i18n'

export default function UpdatePrompt() {
  const t = useT()
  const [reg, setReg] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onWaiting = (e) => setReg(e.detail)
    window.addEventListener('sw-waiting', onWaiting)
    return () => window.removeEventListener('sw-waiting', onWaiting)
  }, [])

  if (!reg) return null

  const update = () => {
    setBusy(true)
    // worker ـی چاوەڕوان دەستپێبکات → controllerchange → reload (لە main.jsx)
    reg.waiting?.postMessage({ type: 'SKIP_WAITING' })
  }

  return (
    <div className="fixed inset-x-3 top-3 z-[95] mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-crew/40 bg-surface/95 p-3 shadow-xl backdrop-blur-xl animate-fade-in">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-crew/15 text-crew">
        <RefreshCw className={`h-5 w-5 ${busy ? 'animate-spin' : ''}`} />
      </div>
      <p className="min-w-0 flex-1 text-sm font-bold text-ink">{t('وەشانێکی نوێ ئامادەیە')}</p>
      <button
        onClick={update}
        disabled={busy}
        className="btn-press shrink-0 rounded-xl bg-crew px-4 py-2 text-sm font-bold text-white"
      >
        {t('نوێکردنەوە')}
      </button>
      <button onClick={() => setReg(null)} className="shrink-0 text-muted hover:text-ink">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

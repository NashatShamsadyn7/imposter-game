// ═══════════════════════════════════════════════════════════
//  دەرگای نوێکردنەوە
//   · required → شاشەی ڕێگر، ناتوانرێت داخرێت
//   · optional → شریتێکی بچووک کە دەتوانرێت لابدرێت
// ═══════════════════════════════════════════════════════════

import { useState } from 'react'
import { Download, X, ArrowUpCircle } from 'lucide-react'
import { Button, Panel } from '../components/ui'
import { useLang } from '../lib/i18n'
import { openDownload, VERSION_NAME } from './updateCheck'

export function UpdateRequired({ info }) {
  const { t, lang } = useLang()
  const note = info.notes?.[lang] || info.notes?.ku || null

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="w-full animate-scale-in">
        <div className="mb-6 flex justify-center">
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-crew/15 text-crew neon-ring">
            <ArrowUpCircle className="h-10 w-10" />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-black text-ink">{t('وەشانێکی نوێ پێویستە')}</h1>
        <p className="mb-6 text-sm text-muted">
          {t('بۆ بەردەوامبوون، پێویستە ئەپەکە نوێ بکەیتەوە.')}
        </p>

        <Panel className="mb-6 !p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{t('وەشانی تۆ')}</span>
            <b className="text-ink">{VERSION_NAME}</b>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted">{t('وەشانی نوێ')}</span>
            <b className="text-crew">{info.latestName}</b>
          </div>
          {note && <p className="mt-3 border-t border-line pt-3 text-xs text-muted">{note}</p>}
        </Panel>

        <Button onClick={() => openDownload(info.url)} className="w-full">
          <Download className="h-5 w-5" /> {t('داگرتنی وەشانی نوێ')}
        </Button>
      </div>
    </div>
  )
}

export function UpdateBanner({ info }) {
  const { t } = useLang()
  const [hidden, setHidden] = useState(false)
  if (hidden) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
      <Panel className="mx-auto flex max-w-md items-center gap-3 !p-3 animate-fade-in">
        <ArrowUpCircle className="h-5 w-5 shrink-0 text-crew" />
        <div className="min-w-0 flex-1 text-right">
          <p className="truncate text-sm font-bold text-ink">{t('وەشانی نوێ بەردەستە')}</p>
          <p className="truncate text-xs text-muted">{info.latestName}</p>
        </div>
        <button
          onClick={() => openDownload(info.url)}
          className="btn-press shrink-0 rounded-xl bg-crew px-3 py-2 text-sm font-bold text-white"
        >
          {t('داگرتن')}
        </button>
        <button
          onClick={() => setHidden(true)}
          aria-label={t('داخستن')}
          className="btn-press shrink-0 rounded-xl p-2 text-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </Panel>
    </div>
  )
}

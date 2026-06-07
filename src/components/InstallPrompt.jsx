// ═══════════════════════════════════════════════════════════
//  InstallPrompt — بانگەشەی دامەزراندنی ئەپ (Add to Home Screen)
//  Android/Chrome: دوگمەی دامەزراندنی ڕاستەوخۆ (beforeinstallprompt).
//  iOS Safari: ڕێنمایی دەستی (Share → Add to Home Screen).
//  دوای داخستن لە localStorage بیردەکرێتەوە (دووبارە نایەتەوە).
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { X, Download, Share, Plus } from 'lucide-react'
import { useT } from '../lib/i18n'

const DISMISS_KEY = 'imposter:installDismissed'

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}
function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream
}

export default function InstallPrompt() {
  const t = useT()
  const [deferred, setDeferred] = useState(null) // ڕووداوی beforeinstallprompt (Android)
  const [show, setShow] = useState(false)
  const [iosHelp, setIosHelp] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem(DISMISS_KEY)) return

    // Android/Chrome
    const onBip = (e) => {
      e.preventDefault()
      setDeferred(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onBip)

    // iOS: هیچ ڕووداوێک نییە — دوای کەمێک ڕێنمایی پیشان بدە
    let timer
    if (isIos()) {
      timer = setTimeout(() => { setIosHelp(true); setShow(true) }, 2500)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      clearTimeout(timer)
    }
  }, [])

  if (!show) return null

  const dismiss = () => {
    setShow(false)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* noop */ }
  }

  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    try { await deferred.userChoice } catch { /* noop */ }
    setDeferred(null)
    dismiss()
  }

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-sm rounded-2xl border border-line bg-surface/95 p-3 shadow-xl backdrop-blur-xl md:bottom-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-crew/15 text-crew">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-ink">{t('ئەپەکە دامەزرێنە')}</p>
          {iosHelp ? (
            <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted">
              {t('بۆ دامەزراندن:')} <Share className="inline h-3.5 w-3.5" /> {t('پاشان')}
              <span className="inline-flex items-center gap-0.5 font-bold text-ink">
                <Plus className="h-3.5 w-3.5" /> {t('زیادکردن بۆ شاشەی سەرەکی')}
              </span>
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted">{t('بۆ یاریی خێراتر و ئاگادارکردنەوە')}</p>
          )}
        </div>
        <button onClick={dismiss} className="shrink-0 text-muted hover:text-ink"><X className="h-4 w-4" /></button>
      </div>
      {!iosHelp && deferred && (
        <button
          onClick={install}
          className="btn-press mt-2 w-full rounded-xl bg-crew py-2 text-sm font-bold text-white"
        >
          {t('دامەزراندن')}
        </button>
      )}
    </div>
  )
}

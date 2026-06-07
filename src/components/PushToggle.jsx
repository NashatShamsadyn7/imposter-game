import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2, Share, Plus } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { isPushSupported, getPushState, enablePush, disablePush, iosNeedsInstall } from '../lib/push'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'

// کلیلی چالاک/ناچالاککردنی ئاگادارکردنەوەی Push
export default function PushToggle() {
  const { user } = useAuth()
  const t = useT()
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [supported, setSupported] = useState(true)
  const [error, setError] = useState(null)
  const [needsInstall, setNeedsInstall] = useState(false)

  useEffect(() => {
    if (!isPushSupported()) {
      setSupported(false)
      setNeedsInstall(iosNeedsInstall())
      return
    }
    getPushState().then((s) => {
      setSupported(s.supported)
      setEnabled(!!s.enabled)
    })
  }, [])

  // iPhone بەبێ دامەزراندن — ڕێنمایی پیشان بدە لە جیاتی شاردنەوە
  if (!supported) {
    if (!needsInstall) return null
    return (
      <div className="flex items-start gap-3 rounded-xl bg-surface2 p-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-crew/12 text-crew">
          <Bell className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-ink">{t('ئاگادارکردنەوە لە iPhone')}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted">
            {t('سەرەتا ئەپ دامەزرێنە:')} <Share className="inline h-3.5 w-3.5" />
            <span className="inline-flex items-center gap-0.5 font-bold text-ink">
              <Plus className="h-3.5 w-3.5" /> {t('زیادکردن بۆ شاشەی سەرەکی')}
            </span>
            {t('پاشان ئەپەکە بکەرەوە و ئاگادارکردنەوە چالاک بکە.')}
          </p>
        </div>
      </div>
    )
  }

  const toggle = async () => {
    if (!user || busy) return
    sfx.tap()
    setBusy(true)
    setError(null)
    try {
      if (enabled) {
        await disablePush(user.id)
        setEnabled(false)
      } else {
        await enablePush(user.id)
        setEnabled(true)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={busy}
        className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-surface2"
      >
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-crew/12 text-crew">
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : enabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 text-right">
          <p className="font-bold text-ink">{t('ئاگادارکردنەوەی Push')}</p>
          <p className="text-xs text-muted">
            {t('وەرگرتنی ئاگادارکردنەوە تەنانەت کاتێک ئەپ داخراوە')}
          </p>
        </div>
        <span className={`relative h-7 w-12 rounded-full transition ${enabled ? 'bg-crew' : 'bg-ink/20'}`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${enabled ? 'right-1' : 'right-6'}`} />
        </span>
      </button>
      {error && <p className="px-3 pb-2 text-xs text-impostor">{error}</p>}
    </div>
  )
}

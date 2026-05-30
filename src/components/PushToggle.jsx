import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { isPushSupported, getPushState, enablePush, disablePush } from '../lib/push'
import { sfx } from '../lib/sound'

// کلیلی چالاک/ناچالاککردنی ئاگادارکردنەوەی Push
export default function PushToggle() {
  const { user } = useAuth()
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [supported, setSupported] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isPushSupported()) {
      setSupported(false)
      return
    }
    getPushState().then((s) => {
      setSupported(s.supported)
      setEnabled(!!s.enabled)
    })
  }, [])

  if (!supported) return null

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
          <p className="font-bold text-ink">ئاگادارکردنەوەی Push</p>
          <p className="text-xs text-muted">
            وەرگرتنی ئاگادارکردنەوە تەنانەت کاتێک ئەپ داخراوە
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

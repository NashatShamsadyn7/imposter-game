// ═══════════════════════════════════════════════════════════
//  دۆخی ئاگادارکردنەوە — توستی ناوەوەی ئەپ + ئاگادارکردنەوەی سیستەم
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { Bell, MessageCircle, UserPlus, Gamepad2, X } from 'lucide-react'

const NotificationContext = createContext(null)
export const useNotify = () => useContext(NotificationContext)?.notify || (() => {})

const ICONS = { dm: MessageCircle, friend: UserPlus, invite: Gamepad2, default: Bell }

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  // داواکردنی مۆڵەتی ئاگادارکردنەوەی سیستەم (جارێک)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // دوای کەمێک، تاکو بەزۆر نەبێت
      const t = setTimeout(() => Notification.requestPermission().catch(() => {}), 4000)
      return () => clearTimeout(t)
    }
  }, [])

  const notify = useCallback(({ title, body, type = 'default', onClick }) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev.slice(-3), { id, title, body, type, onClick }])
    // خۆکار لابردن دوای ٥ چرکە
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)

    // ئاگادارکردنەوەی سیستەم ئەگەر تابەکە لە پشتەوە بوو
    if (
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.visibilityState !== 'visible'
    ) {
      try {
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.ready.then((reg) =>
            reg.showNotification(title, { body, icon: '/favicon.svg', badge: '/favicon.svg', tag: `n-${type}` })
          )
        } else {
          new Notification(title, { body, icon: '/favicon.svg' })
        }
      } catch (e) {
        /* ئاسایی */
      }
    }
  }, [])

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {/* توستەکان */}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || ICONS.default
          return (
            <button
              key={t.id}
              onClick={() => {
                t.onClick?.()
                dismiss(t.id)
              }}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-right shadow-soft animate-scale-in"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-crew/15 text-crew">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{t.title}</p>
                {t.body && <p className="truncate text-xs text-muted">{t.body}</p>}
              </div>
              <X className="h-4 w-4 shrink-0 text-muted" />
            </button>
          )
        })}
      </div>
    </NotificationContext.Provider>
  )
}

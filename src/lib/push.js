// ═══════════════════════════════════════════════════════════
//  Web Push — ئەندامبوون لە دەرەوەی وەرگرتنی ئاگادارکردنەوە (تەنانەت کاتێک ئەپ داخراوە)
// ═══════════════════════════════════════════════════════════

import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export const isPushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

// ئامێری iOS ـە؟ (iPhone/iPad)
export const isIosDevice = () =>
  typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream

// ئەپ وەک PWA دامەزراوە (standalone)؟
export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)

// iOS بەڵام هێشتا دامەزرنەکراوە → Push کار ناکات تا دامەزراندن
// (iOS 16.4+ تەنها لە دۆخی standalone پشتگیری Web Push دەکات)
export const iosNeedsInstall = () => isIosDevice() && !isStandalone() && !isPushSupported()

// گۆڕینی کلیلی VAPID لە base64 بۆ Uint8Array
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

// دۆخی ئەندامبوونی ئێستا
export async function getPushState() {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return { supported: false }
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return { supported: true, enabled: !!sub, permission: Notification.permission }
}

// چالاککردنی ئاگادارکردنەوەی Push و پاشەکەوتکردنی ئەندامبوون لە Supabase
export async function enablePush(userId) {
  if (!isPushSupported()) throw new Error('وێبگەڕەکەت پشتگیری ناکات')
  if (!VAPID_PUBLIC_KEY) throw new Error('VITE_VAPID_PUBLIC_KEY ڕێکنەخراوە')

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('مۆڵەتی ئاگادارکردنەوە ڕەتکرایەوە')

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: 'endpoint' }
  )
  if (error) throw error
  return true
}

// ناچالاککردن — لابردنی ئەندامبوون
export async function disablePush(userId) {
  if (!isPushSupported()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    const endpoint = sub.endpoint
    await sub.unsubscribe()
    await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint)
  }
}

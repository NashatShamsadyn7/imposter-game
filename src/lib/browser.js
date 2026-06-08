// ═══════════════════════════════════════════════════════════
//  ناسینەوەی وێبگەڕی ناو-ئەپ (in-app browser) و کردنەوە لە وێبگەڕی ڕاستەقینە
//  چارەسەری کێشەی «تەختەکلیل دەرناکەوێت» لە کاتی چوونەژوورەوە بە Google:
//  وێبگەڕە ناو-ئەپەکان (Instagram, Facebook, TikTok, …) ڕێگە بە
//  تەختەکلیل و چوونەژوورەوەی Google نادەن.
// ═══════════════════════════════════════════════════════════

export function isEmbeddedBrowser() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || navigator.vendor || ''
  // ئەپە باوەکان کە وێبگەڕی ناوەکی بەکاردێنن
  return /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|MicroMessenger|WeChat|Snapchat|TikTok|musical_ly|Pinterest|LinkedInApp|GSA\//i.test(ua)
}

export function isAndroid() {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent || '')
}

// هەوڵدان بۆ کردنەوەی ئێستا لە وێبگەڕی سیستەم (Chrome/Safari)
// لە Android ـدا بە intent دەکرێتەوە؛ لە iOS تەنها ڕێنمایی پیشان دەدرێت.
export function openInExternalBrowser() {
  const url = window.location.href
  if (isAndroid()) {
    const noScheme = url.replace(/^https?:\/\//, '')
    window.location.href =
      `intent://${noScheme}#Intent;scheme=https;package=com.android.chrome;end`
    return true
  }
  return false // iOS: ناتوانرێت بەزۆر بکرێتەوە — ڕێنمایی پیشان دەدرێت
}

// ═══════════════════════════════════════════════════════════
//  پشکنینی وەشان
//
//  تاکە شوێنێکە کە ئەپەکە تۆڕ بەکاردەهێنێت. یارییەکە خۆی —
//  وشە، وێنە، فۆنت — تەواو لەناو APK ـەکەدایە.
//
//  ⚠️ یاسای سەرەکی: شکستی پشکنین هەرگیز نابێتە ڕێگر لە یاریکردن.
//     ئەگەر ئینتەرنێت نەبوو، سێرڤەر وەڵامی نەدایەوە، یان پەڕگەکە
//     خراپ بوو → بێدەنگ تێدەپەڕین. ئەپێکی ئۆفلاین کە بەبێ تۆڕ
//     ناکرێتەوە، هیچ مانایەکی نییە.
// ═══════════════════════════════════════════════════════════

const MANIFEST_URL = 'https://iosbb0.web.app/imposter-version.json'
const TIMEOUT_MS = 6000
const CACHE_KEY = 'imposter:update:v1'
// تەنها یەک جار لە ٦ کاتژمێردا داوا دەکەین — نەک لە هەر کردنەوەیەکدا
const CACHE_TTL = 6 * 60 * 60 * 1000

// لە کاتی بنیاتناندا لە app-version.json ـەوە دادەنرێن
export const VERSION_CODE = __APP_VERSION_CODE__
export const VERSION_NAME = __APP_VERSION_NAME__

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (c && Date.now() - c.at < CACHE_TTL) return c.data
  } catch {
    /* ئاسایی */
  }
  return null
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }))
  } catch {
    /* ئاسایی */
  }
}

async function fetchManifest() {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-store', signal: ctrl.signal })
    if (!res.ok) return null
    const j = await res.json()
    // پشکنینی شێوە — پەڕگەی خراپ نابێت ئەپەکە بشکێنێت
    if (typeof j?.latestVersionCode !== 'number') return null
    return j
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * دۆخی وەشان دەگەڕێنێتەوە:
 *   { state: 'ok' | 'optional' | 'required', latest, url, notes }
 * ھەمیشە 'ok' دەگەڕێنێتەوە ئەگەر پشکنین نەکرا.
 */
export async function checkForUpdate() {
  let m = readCache()
  if (!m) {
    m = await fetchManifest()
    if (m) writeCache(m)
  }
  if (!m) return { state: 'ok' }

  const min = typeof m.minVersionCode === 'number' ? m.minVersionCode : 0
  const latest = m.latestVersionCode
  const common = {
    latest,
    latestName: m.latestVersionName || String(latest),
    url: m.url || '',
    notes: m.notes || null,
  }

  if (VERSION_CODE < min) return { state: 'required', ...common }
  if (VERSION_CODE < latest) return { state: 'optional', ...common }
  return { state: 'ok' }
}

// ئەپەکە ناتوانێت APK دابەزێنێت — دەیدەینە دەستی وێبگەڕی سیستەم
export function openDownload(url) {
  try {
    window.open(url || MANIFEST_URL, '_blank')
  } catch {
    /* ئەگەر وێبگەڕ نەبوو — هیچ ڕوونادات */
  }
}

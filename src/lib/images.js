// ═══════════════════════════════════════════════════════════
//  وێنەی وشەکان
//
//  ١) وێنە ناوخۆییەکان (/w/*.webp) — لەسەر CDN ـی Cloudflare، ~٥٠ms
//  ٢) LQIP — وێنۆچکەی ١٦px بە base64، یەکسەر دەردەکەوێت (بێ داواکاری)
//  ٣) پاشەکشە: Pollinations AI بۆ وشە نوێیەکان کە هێشتا وێنەیان نەداگیراوە
// ═══════════════════════════════════════════════════════════

const STYLE_SUFFIX =
  ', realistic photography, high quality, highly detailed, no text, no words, no letters'

const memoryCache = new Map()

// دروستکردنی URLـی وێنە بۆ پڕۆمپتێکی ئینگلیزی
export function buildImageUrl(englishPrompt, { width = 400, height = 400 } = {}) {
  const seed = hashString(englishPrompt) % 100000
  const prompt = encodeURIComponent(englishPrompt + STYLE_SUFFIX)
  return `https://image.pollinations.ai/prompt/${prompt}?width=${width}&height=${height}&nologo=true&seed=${seed}`
}

// وەرگرتنی URL لە کاشەوە یان دروستکردنی نوێ
export function getWordImageUrl(englishPrompt, opts) {
  if (!englishPrompt) return null
  const key = `${englishPrompt}-${opts?.width || 400}`
  if (memoryCache.has(key)) return memoryCache.get(key)
  const url = buildImageUrl(englishPrompt, opts)
  memoryCache.set(key, url)
  return url
}

// ───────────────────────────────────────────────
//  LQIP — وێنۆچکەی خاوێن
// ───────────────────────────────────────────────

// { slug: 'data:image/webp;base64,…' } — یەک جار دادەگیرێت و لە بیرەوەری دەمێنێتەوە.
// هەروەها وەک پێڕستی وێنە ناوخۆییەکان کار دەکات: هەر کلیلێکی تێدابێت،
// واتە /w/<کلیل>.webp لەسەر سێرڤەرەکەمان بەردەستە.
let lqipMap = null
let lqipPromise = null

// ناوی پەڕگە لە /w/cat-98262.webp دەردەهێنێت → 'cat-98262'
export function slugFromUrl(url) {
  if (!url || !url.startsWith('/w/')) return null
  return url.slice(3).replace(/\.webp$/, '')
}

// هەمان لۆژیکی scripts/fetch-word-images.mjs — دەبێت وەک یەک بمێننەوە
export function slugForPrompt(en) {
  if (!en) return null
  const base = en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  return `${base}-${hashString(en) % 100000}`
}

// بەستەری کۆتایی بۆ وشەیەک.
//  ئەگەر وێنەکەی ناوخۆییمان هەبێت → /w/*.webp (خێرا، لەسەر CDN)
//  ئەگەرنا → بەستەرەکەی بنکەداتا، یان Pollinations وەک دواهەمین چارە.
// بەمە پێویست ناکات بەستەرەکانی ناو بنکەداتا بگۆڕین.
export function resolveImageUrl({ imageUrl, englishPrompt, width = 400 } = {}) {
  const slug = slugForPrompt(englishPrompt)
  if (slug && lqipMap && lqipMap[slug]) return `/w/${slug}.webp`
  if (imageUrl) return imageUrl
  return getWordImageUrl(englishPrompt, { width, height: width })
}

// داگرتنی نەخشەی LQIP (~٢٧٠KB، یەک جار بۆ هەموو ژیانی ئەپ)
export function loadLqipMap() {
  if (lqipMap) return Promise.resolve(lqipMap)
  if (!lqipPromise) {
    lqipPromise = fetch('/w/lqip.json')
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}))
      .then((map) => { lqipMap = map; return map })
  }
  return lqipPromise
}

// خوێندنەوەی هاوکات — ئەگەر نەخشەکە هێشتا نەگەیشتبێت null دەگەڕێنێتەوە
export function lqipFor(url) {
  const slug = slugFromUrl(url)
  if (!slug || !lqipMap) return null
  return lqipMap[slug] || null
}

// ───────────────────────────────────────────────
//  پێشوەخت داگرتن — تاکو شاشەی پیشاندان خێرا بێت
// ───────────────────────────────────────────────

const preloaded = new Set()

// وێنەی وشەیەک پێشوەخت دادەگرێت (بێدەنگ — هەڵە پشتگوێ دەخرێت)
export function preloadWordImage(word) {
  if (!word) return
  loadLqipMap().then(() => {
    const url = resolveImageUrl({ imageUrl: word.image_url, englishPrompt: word.en })
    if (!url || preloaded.has(url)) return
    preloaded.add(url)
    const img = new Image()
    img.decoding = 'async'
    img.src = url
  })
}

// وێنەی چەند وشەیەک پێشوەخت دادەگرێت
export function preloadWordImages(words = []) {
  words.filter(Boolean).forEach(preloadWordImage)
}

// hashی سادە بۆ seedی نەگۆڕ بۆ هەر وشەیەک
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

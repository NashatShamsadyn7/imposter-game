// ═══════════════════════════════════════════════════════════
//  دروستکردنی وێنە بە Pollinations AI + کاشکردن (cache)
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

// hashی سادە بۆ seedی نەگۆڕ بۆ هەر وشەیەک
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// ═══════════════════════════════════════════════════════════
//  داگرتنی وێنەی وشەکان — جارێک بۆ هەمیشە
//
//  چۆن کار دەکات:
//   ١) بانکی وشە دەخوێنێتەوە (public/word-bank-kurdish-2250.json)
//   ٢) هەر وێنەیەکی Pollinations دادەگرێت (بە هاوکات)
//   ٣) دەیگۆڕێت بۆ WebP و لە public/w/<hash>.webp پاشەکەوتی دەکات
//   ٤) LQIP دروست دەکات (وێنەی ١٦px ـی خاوێن) → public/w/lqip.json
//   ٥) بانکێکی نوێ دەنووسێت کە image_url ـەکانی ناوخۆیین
//
//  بەکارهێنان:
//    node scripts/fetch-word-images.mjs            # هەمووی
//    node scripts/fetch-word-images.mjs --limit 20 # تاقیکردنەوە
//    node scripts/fetch-word-images.mjs --force    # داگرتنەوەی هەمووی
//
//  ئاگاداری: Pollinations وێنەی نوێ لە کاتی داواکردندا دروست دەکات
//  (٢٥–٥٠ چرکە بۆ هەر یەکێک). بۆیە داگرتنی هەموو بانکەکە چەند کاتژمێرێک
//  دەخایەنێت. سکریپتەکە دووبارە کارپێکردنی سەلامەتە — ئەوانەی داگیراون
//  تێدەپەڕێنێت، بۆیە دەتوانیت چەند جار بەسەر چەند ڕۆژدا کاری پێبکەیت.
//  ئەپەکە خۆی بۆ هەر وشەیەکی وێنە-نەداگیراو دەگەڕێتەوە بۆ Pollinations.
// ═══════════════════════════════════════════════════════════

import { mkdirSync, existsSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'

const BANK_IN = resolve('public/word-bank-kurdish-2250.json')
const BANK_OUT = resolve('public/word-bank-local.json')
const IMG_DIR = resolve('public/w')
const LQIP_OUT = resolve('public/w/lqip.json')

// ───── ڕێکخستنەکان ─────
const SIZE = 400        // پانی وێنەی کۆتایی (وەک سەرچاوە — گەورەکردن نییە)
const QUALITY = 74      // جۆری WebP — تەرازووی باش لە نێوان جوانی و قەبارە
const LQIP_SIZE = 16    // وێنۆچکەی خاوێن کە ڕاستەوخۆ دەردەکەوێت
const RETRIES = 5
const TIMEOUT_MS = 60000

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const value = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const LIMIT = value('--limit', Infinity)
const FORCE = flag('--force')
const CONCURRENCY = value('--concurrency', 3) // Pollinations زوو 429 دەدات — کەم بیهێڵەوە

// hashـی جێگیر بۆ ناوی پەڕگە — هەمان لۆژیکی src/lib/images.js
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// ناوی پەڕگە لە وەسفی ئینگلیزییەوە — یەکسان بۆ هەموو وشەیەکی هاوشێوە
const slugFor = (en) =>
  `${en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}-${hashString(en) % 100000}`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// کاتی «هەموو کرێکارەکان ڕاوەستن» — کاتێک 429 دێت، هەمووی پشوو دەدەن نەک تەنها یەکێک
let throttledUntil = 0

async function fetchWithRetry(url) {
  let lastError
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    const wait = throttledUntil - Date.now()
    if (wait > 0) await sleep(wait)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, { signal: controller.signal })
      if (res.status === 429) {
        // سنووری ڕێژە — هەموو کرێکارەکان بۆ ماوەیەکی زیادبوو ڕادەگرین
        const backoff = Math.min(20000, 3000 * attempt)
        throttledUntil = Math.max(throttledUntil, Date.now() + backoff)
        throw new Error('HTTP 429')
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buffer = Buffer.from(await res.arrayBuffer())
      if (buffer.length < 1000) throw new Error('وێنەی زۆر بچووک')
      return buffer
    } catch (error) {
      lastError = error
      if (attempt < RETRIES) await sleep(attempt * 1500)
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError
}

// یەک وشە: داگرتن → WebP → LQIP
async function processWord(word, lqipMap) {
  const slug = slugFor(word.en || word.ku)
  const file = resolve(IMG_DIR, `${slug}.webp`)
  const publicPath = `/w/${slug}.webp`

  // پێشتر داگیراوە؟ تەنها LQIP ـەکەی وەربگرە
  if (!FORCE && existsSync(file) && statSync(file).size > 500) {
    if (!lqipMap[slug]) lqipMap[slug] = await makeLqip(readFileSync(file))
    return { publicPath, slug, skipped: true }
  }

  const source = await fetchWithRetry(word.image_url)
  const webp = await sharp(source)
    .resize(SIZE, SIZE, { fit: 'cover', withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 5 })
    .toBuffer()

  writeFileSync(file, webp)
  lqipMap[slug] = await makeLqip(webp)
  return { publicPath, slug, bytes: webp.length }
}

async function makeLqip(buffer) {
  const tiny = await sharp(buffer)
    .resize(LQIP_SIZE, LQIP_SIZE, { fit: 'cover' })
    .webp({ quality: 32, alphaQuality: 0 })
    .toBuffer()
  return `data:image/webp;base64,${tiny.toString('base64')}`
}

// ───── کارکردنی سەرەکی ─────
const bank = JSON.parse(readFileSync(BANK_IN, 'utf8'))
const items = bank.items.slice(0, LIMIT === Infinity ? undefined : LIMIT)
mkdirSync(IMG_DIR, { recursive: true })

const lqipMap = existsSync(LQIP_OUT) ? JSON.parse(readFileSync(LQIP_OUT, 'utf8')) : {}
const stats = { done: 0, skipped: 0, failed: 0, bytes: 0 }
const failures = []
const startedAt = Date.now()

// چەند کرێکار بە هاوکات لەسەر هەمان ڕیز کار دەکەن
let cursor = 0
async function worker() {
  while (cursor < items.length) {
    const index = cursor
    cursor += 1
    const word = items[index]
    try {
      const result = await processWord(word, lqipMap)
      word.image_url = result.publicPath
      if (result.skipped) stats.skipped += 1
      else { stats.done += 1; stats.bytes += result.bytes }
    } catch (error) {
      stats.failed += 1
      failures.push({ ku: word.ku, en: word.en, reason: error?.message || String(error) })
      // بەستەری کۆن بەجێدەهێڵین — وەک پاشەکشە کار دەکات
    }
    const total = stats.done + stats.skipped + stats.failed
    if (total % 25 === 0 || total === items.length) {
      const seconds = Math.round((Date.now() - startedAt) / 1000)
      const rate = total / Math.max(seconds, 1)
      const left = Math.round((items.length - total) / Math.max(rate, 0.01))
      process.stdout.write(
        `\r${total}/${items.length} · نوێ ${stats.done} · پێشتر ${stats.skipped} · شکست ${stats.failed} · ${seconds}s · ماوە ~${left}s   `
      )
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker))

// LQIP و بانکی نوێ بنووسە
writeFileSync(LQIP_OUT, JSON.stringify(lqipMap), 'utf8')
writeFileSync(BANK_OUT, `${JSON.stringify({ ...bank, items: bank.items, local_images: true, generated_at: new Date().toISOString() }, null, 2)}\n`, 'utf8')

const avgKb = stats.done ? (stats.bytes / stats.done / 1024).toFixed(1) : '—'
const lqipKb = (Buffer.byteLength(JSON.stringify(lqipMap)) / 1024).toFixed(0)
console.log(`\n
تەواو بوو لە ${Math.round((Date.now() - startedAt) / 1000)} چرکەدا
  نوێ داگیرا : ${stats.done}  (ناوەندی ${avgKb} KB)
  پێشتر هەبوو: ${stats.skipped}
  شکستی هێنا : ${stats.failed}
  LQIP       : ${Object.keys(lqipMap).length} دانە (${lqipKb} KB)
  بانکی نوێ  : ${BANK_OUT}`)

if (failures.length) {
  console.log('\nشکستەکان (دووبارە سکریپتەکە کار پێبکە بۆ هەوڵدانەوە):')
  failures.slice(0, 20).forEach((f) => console.log(`  · ${f.ku} (${f.en}) — ${f.reason}`))
  if (failures.length > 20) console.log(`  … و ${failures.length - 20} ی تر`)
}

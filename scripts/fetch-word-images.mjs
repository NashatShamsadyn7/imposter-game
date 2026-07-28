// ═══════════════════════════════════════════════════════════
//  داگرتنی وێنەی وشەکان — وێنەی ڕاستەقینەی ئامادە، نەک وێنەی AI
//
//  بۆچی: Pollinations وێنە لە کاتی داواکردندا دروست دەکات — ٢٥ بۆ ٥٠
//  چرکە بۆ هەر یەکێکی نوێ. وێنەی ئامادە لە کەمتر لە چرکەیەکدا دێت.
//
//  دوو قۆناغ:
//   قۆناغی ١ — ویکیپیدیا بە کۆمەڵ: ٥٠ ناونیشان لە یەک داواکاریدا
//     (2250 وشە = تەنها ~٤٥ داواکاری). وێنەی سەرەکی وتارەکان پاکترین
//     و ڕوونترین سەرچاوەن بۆ یاری — ناوەڕاست، یەک بابەت، بێ تێکەڵی.
//   قۆناغی ٢ — Openverse بۆ ئەوانەی وتاریان نییە (وێنەی CC، بێ سنوور).
//
//  پاشان: WebP ٤٠٠px → public/w/<slug>.webp
//         LQIP ١٦px base64 → public/w/lqip.json
//         خاوەن و مۆڵەت → public/w/credits.json
//
//  بەکارهێنان:
//    npm run images                 # هەمووی
//    npm run images -- --limit 60   # تاقیکردنەوە
//    npm run images -- --force      # داگرتنەوەی هەمووی
//
//  دووبارە کارپێکردن سەلامەتە — ئەوانەی داگیراون تێدەپەڕێنێت.
// ═══════════════════════════════════════════════════════════

import { mkdirSync, existsSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'

const BANK_IN = resolve('public/word-bank-kurdish-2250.json')
const IMG_DIR = resolve('public/w')
const LQIP_OUT = resolve('public/w/lqip.json')
const CREDITS_OUT = resolve('public/w/credits.json')

const SIZE = 400
const QUALITY = 74
const LQIP_SIZE = 16
const TITLES_PER_REQUEST = 50   // سنووری ویکیپیدیا بۆ هەر داواکارییەک
const TIMEOUT_MS = 30000
const MAX_BYTES = 12 * 1024 * 1024
const UA = 'imposter-game/1.0 (word bank image fetcher)'

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const value = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const LIMIT = value('--limit', Infinity)
const FORCE = flag('--force')
const CONCURRENCY = value('--concurrency', 3)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// دەبێت وەک slugForPrompt لە src/lib/images.js بمێنێتەوە
const slugFor = (en) =>
  `${en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}-${hashString(en) % 100000}`

// ناونیشانی ویکیپیدیا: تەنها پیتی یەکەم گەورە («polar bear» → «Polar bear»)
const toTitle = (text) => text.charAt(0).toUpperCase() + text.slice(1)

const normalize = (text = '') =>
  text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

async function getJson(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

// ───────────────────────────────────────────────
//  قۆناغی ١ — ویکیپیدیا بە کۆمەڵ
// ───────────────────────────────────────────────
// یەک داواکاری بۆ ٥٠ ناونیشان. ویکیپیدیا خۆی ناوەکان ڕێک دەخات و
// ڕەوانەکردنەکان (redirects) شوێن دەکەوێت، بۆیە هاومانا ـەکانیش دەگرێت.
async function resolveWikipediaBatch(queries) {
  const titles = queries.map(toTitle).join('|')
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&redirects=1' +
    '&prop=pageimages&piprop=thumbnail&pithumbsize=640&format=json' +
    '&titles=' + encodeURIComponent(titles)
  const data = await getJson(url)
  const query = data?.query || {}

  // ناوی ڕێکخراو/ڕەوانەکراو → ناوی داواکراوی سەرەتا
  const backToOriginal = new Map()
  queries.forEach((q) => backToOriginal.set(normalize(toTitle(q)), q))
  ;[...(query.normalized || []), ...(query.redirects || [])].forEach(({ from, to }) => {
    const origin = backToOriginal.get(normalize(from))
    if (origin) backToOriginal.set(normalize(to), origin)
  })

  const found = new Map()
  Object.values(query.pages || {}).forEach((page) => {
    if (page.missing !== undefined || !page.thumbnail?.source) return
    if (/\.svg$/i.test(page.thumbnail.source)) return
    const origin = backToOriginal.get(normalize(page.title))
    if (!origin) return
    found.set(origin, {
      url: page.thumbnail.source,
      credit: {
        source: 'wikipedia',
        title: page.title,
        creator: '',
        license: 'Wikimedia Commons — see file page',
        page: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      },
    })
  })
  return found
}

// ───────────────────────────────────────────────
//  قۆناغی ٢ — Openverse (پاشەکشە)
// ───────────────────────────────────────────────
function titleScore(title, query) {
  const t = normalize(title).replace(/\s+\d+$/, '')
  const q = normalize(query)
  if (!t) return 0
  if (t === q) return 100
  if (q.startsWith(`${t} `)) return 60
  if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(t)) return 30
  return 10
}

// وێنەی Wikimedia زۆر گەورەن — داوای وەشانی بچووککراو دەکەین
function shrinkWikimedia(url) {
  const match = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[^/]+)\/([0-9a-f])\/([0-9a-f]{2})\/(.+)$/)
  if (!match || url.includes('/thumb/') || /\.svg$/i.test(url)) return url
  const [, base, a, b, file] = match
  return `${base}/thumb/${a}/${b}/${file}/640px-${file}`
}

// داواکاری Openverse بە زنجیرە دەکەین — هاوکات 429 دەداتەوە
function makePacer(minGapMs) {
  let chain = Promise.resolve()
  let last = 0
  return (task) => {
    const run = chain.then(async () => {
      const wait = last + minGapMs - Date.now()
      if (wait > 0) await sleep(wait)
      last = Date.now()
      return task()
    })
    chain = run.then(() => {}, () => {})
    return run
  }
}
const paceOpenverse = makePacer(120)

async function findOnOpenverse(query) {
  const url =
    'https://api.openverse.org/v1/images/?q=' + encodeURIComponent(query) +
    '&page_size=8&license_type=commercial,modification'
  const data = await paceOpenverse(() => getJson(url))
  const usable = (data.results || []).filter(
    (r) => r.url && ['jpg', 'jpeg', 'png', 'webp'].includes(String(r.filetype || 'jpg').toLowerCase())
  )
  if (!usable.length) return null
  const best = usable
    .map((r, index) => ({
      r,
      score: titleScore(r.title, query) + ((r.width || 0) >= SIZE ? 5 : 0) - index * 0.1,
    }))
    .sort((a, b) => b.score - a.score)[0].r
  return {
    url: shrinkWikimedia(best.url),
    original: best.url,
    credit: {
      source: 'openverse',
      title: best.title || '',
      creator: best.creator || '',
      license: [best.license, best.license_version].filter(Boolean).join(' ').toUpperCase(),
      page: best.foreign_landing_url || '',
    },
  }
}

// ───────────────────────────────────────────────
//  داگرتن و گۆڕین
// ───────────────────────────────────────────────
// داگرتنی وێنە لە Wikimedia ـیش دەبێت ڕێکخراو بێت — بەبێ ئەوە دوای
// چەند دەیەیەک داواکاری 429 دەداتەوە. ~٥ وێنە لە چرکەیەکدا سەلامەتە.
const paceDownload = makePacer(350)

async function fetchOnce(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: controller.signal })
    if (res.status === 429) throw Object.assign(new Error('HTTP 429'), { rateLimited: true })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (Number(res.headers.get('content-length') || 0) > MAX_BYTES) throw new Error('وێنە زۆر گەورەیە')
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 1000) throw new Error('وێنەی زۆر بچووک')
    return buffer
  } finally {
    clearTimeout(timer)
  }
}

async function download(url) {
  let lastError
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await paceDownload(() => fetchOnce(url))
    } catch (error) {
      lastError = error
      if (!error.rateLimited || attempt === 4) throw error
      await sleep(2000 * attempt)
    }
  }
  throw lastError
}

async function makeLqip(buffer) {
  const tiny = await sharp(buffer)
    .resize(LQIP_SIZE, LQIP_SIZE, { fit: 'cover' })
    .webp({ quality: 32, alphaQuality: 0 })
    .toBuffer()
  return `data:image/webp;base64,${tiny.toString('base64')}`
}

// ───────────────────────────────────────────────
//  کارکردنی سەرەکی
// ───────────────────────────────────────────────
const bank = JSON.parse(readFileSync(BANK_IN, 'utf8'))
const allItems = LIMIT === Infinity ? bank.items : bank.items.slice(0, LIMIT)
mkdirSync(IMG_DIR, { recursive: true })

const lqipMap = existsSync(LQIP_OUT) ? JSON.parse(readFileSync(LQIP_OUT, 'utf8')) : {}
const credits = existsSync(CREDITS_OUT) ? JSON.parse(readFileSync(CREDITS_OUT, 'utf8')) : {}

function saveMaps() {
  writeFileSync(LQIP_OUT, JSON.stringify(lqipMap), 'utf8')
  writeFileSync(CREDITS_OUT, JSON.stringify(credits, null, 1), 'utf8')
}

// ئەوانەی پێشتر داگیراون تێدەپەڕێنین
const pending = []
let alreadyHave = 0
for (const item of allItems) {
  const query = item.en || item.ku
  if (!query) continue
  const slug = slugFor(query)
  const file = resolve(IMG_DIR, `${slug}.webp`)
  if (!FORCE && existsSync(file) && statSync(file).size > 500) {
    alreadyHave += 1
    if (!lqipMap[slug]) lqipMap[slug] = await makeLqip(readFileSync(file))
    continue
  }
  pending.push({ query, slug, ku: item.ku })
}

console.log(`${allItems.length} وشە · ${alreadyHave} پێشتر داگیراوە · ${pending.length} ماوە\n`)

const startedAt = Date.now()
const sources = new Map() // query → { url, credit }

// ───── قۆناغی ١: ویکیپیدیا بە کۆمەڵ ─────
if (pending.length) {
  const batches = []
  for (let i = 0; i < pending.length; i += TITLES_PER_REQUEST) {
    batches.push(pending.slice(i, i + TITLES_PER_REQUEST))
  }
  process.stdout.write(`قۆناغی ١ — ویکیپیدیا (${batches.length} داواکاری)… `)
  for (const [index, batch] of batches.entries()) {
    try {
      const found = await resolveWikipediaBatch(batch.map((p) => p.query))
      found.forEach((hit, query) => sources.set(query, hit))
    } catch (error) {
      process.stdout.write(`\n  کۆمەڵەی ${index + 1} شکستی هێنا: ${error.message}`)
    }
    process.stdout.write(`\rقۆناغی ١ — ویکیپیدیا: ${index + 1}/${batches.length} کۆمەڵە · ${sources.size} دۆزرایەوە   `)
    await sleep(200)
  }
  console.log('')
}

// ───── قۆناغی ٢ + داگرتن ─────
const stats = { done: 0, failed: 0, bytes: 0, wikipedia: 0, openverse: 0 }
const failures = []
let cursor = 0
let lastSave = Date.now()

async function worker() {
  while (cursor < pending.length) {
    const { query, slug, ku } = pending[cursor]
    cursor += 1
    try {
      const found = sources.get(query) || (await findOnOpenverse(query))
      if (!found) throw new Error('هیچ وێنەیەک نەدۆزرایەوە')

      let raw
      try {
        raw = await download(found.url)
      } catch (error) {
        if (found.original && found.original !== found.url) raw = await download(found.original)
        else throw error
      }

      const webp = await sharp(raw)
        .resize(SIZE, SIZE, { fit: 'cover', position: 'attention' })
        .webp({ quality: QUALITY, effort: 5 })
        .toBuffer()

      writeFileSync(resolve(IMG_DIR, `${slug}.webp`), webp)
      lqipMap[slug] = await makeLqip(webp)
      credits[slug] = found.credit
      stats.done += 1
      stats.bytes += webp.length
      stats[found.credit.source] = (stats[found.credit.source] || 0) + 1
    } catch (error) {
      stats.failed += 1
      failures.push({ ku, query, reason: error?.message || String(error) })
    }

    const total = stats.done + stats.failed
    if (Date.now() - lastSave > 20000) { saveMaps(); lastSave = Date.now() }
    if (total % 25 === 0 || total === pending.length) {
      const seconds = Math.round((Date.now() - startedAt) / 1000)
      const left = Math.round((pending.length - total) / Math.max(total / Math.max(seconds, 1), 0.01) / 60)
      process.stdout.write(
        `\rقۆناغی ٢ — ${total}/${pending.length} · سەرکەوتوو ${stats.done} · شکست ${stats.failed} · ${seconds}s · ماوە ~${left}خ   `
      )
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker))
saveMaps()

const avgKb = stats.done ? (stats.bytes / stats.done / 1024).toFixed(1) : '—'
const lqipKb = (Buffer.byteLength(JSON.stringify(lqipMap)) / 1024).toFixed(0)
console.log(`\n
تەواو بوو لە ${Math.round((Date.now() - startedAt) / 1000)} چرکەدا
  نوێ داگیرا : ${stats.done}  (ناوەندی ${avgKb} KB)
    ویکیپیدیا: ${stats.wikipedia}
    Openverse: ${stats.openverse}
  پێشتر هەبوو: ${alreadyHave}
  شکستی هێنا : ${stats.failed}
  LQIP       : ${Object.keys(lqipMap).length} دانە (${lqipKb} KB)`)

if (failures.length) {
  console.log('\nشکستەکان (دووبارە سکریپتەکە کار پێبکە بۆ هەوڵدانەوە):')
  failures.slice(0, 20).forEach((f) => console.log(`  · ${f.ku} (${f.query}) — ${f.reason}`))
  if (failures.length > 20) console.log(`  … و ${failures.length - 20} ی تر`)
}

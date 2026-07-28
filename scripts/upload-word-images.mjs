// ═══════════════════════════════════════════════════════════
//  بارکردنی وێنەی وشەکان بۆ Supabase Storage
//
//  وێنەکان لە دوو شوێن دەمێننەوە:
//   ١) public/w/ → Cloudflare Pages (سەرەکی — خێراترین، باندویدی بێ سنوور)
//   ٢) Supabase Storage → پاڵپشت، ئەگەر یەکەم بەردەست نەبوو
//
//  پێویستە: SUPABASE_SERVICE_ROLE_KEY لە .env دابنێیت.
//  (Supabase Dashboard → Project Settings → API → service_role)
//  ئەم کلیلە RLS تێدەپەڕێنێت، بۆیە هەرگیز مەیخە ناو کۆدی browser ـەوە.
//
//  بەکارهێنان:
//    npm run images:upload              # تەنها ئەوانەی نەبارکراون
//    npm run images:upload -- --force   # هەمووی دووبارە
// ═══════════════════════════════════════════════════════════

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, basename } from 'node:path'

const IMG_DIR = resolve('public/w')
const BUCKET = 'word-images'
const PREFIX = 'bank' // هەموو وێنەکانی بانک لەژێر ئەم فۆڵدەرە
const CONCURRENCY = 6

const args = process.argv.slice(2)
const FORCE = args.includes('--force')

// ───── خوێندنەوەی .env ─────
function readEnv() {
  const env = { ...process.env }
  if (existsSync('.env')) {
    readFileSync('.env', 'utf8').split(/\r?\n/).forEach((line) => {
      if (!line.includes('=') || line.trim().startsWith('#')) return
      const i = line.indexOf('=')
      const key = line.slice(0, i).trim()
      const val = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
      if (!env[key]) env[key] = val
    })
  }
  return env
}

const env = readEnv()
const URL_BASE = env.VITE_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!URL_BASE) {
  console.error('VITE_SUPABASE_URL لە .env نەدۆزرایەوە')
  process.exit(1)
}
if (!SERVICE_KEY) {
  console.error(`
SUPABASE_SERVICE_ROLE_KEY لە .env نەدۆزرایەوە.

  ١) بڕۆ بۆ Supabase Dashboard → Project Settings → API
  ٢) کلیلی «service_role» کۆپی بکە
  ٣) ئەم دێڕە بخە ناو .env (کە لە گیت پاراستراوە):

     SUPABASE_SERVICE_ROLE_KEY=eyJ...

ئاگاداری: ئەم کلیلە دەسەڵاتی تەواوی هەیە — هەرگیز لە کۆدی ناو براوزەردا بەکاری مەهێنە.`)
  process.exit(1)
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
}

// ───── دڵنیابوون لە بوونی bucket ـەکە ─────
async function ensureBucket() {
  const res = await fetch(`${URL_BASE}/storage/v1/bucket/${BUCKET}`, { headers })
  if (res.ok) return 'هەبوو'
  const created = await fetch(`${URL_BASE}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  })
  if (!created.ok) throw new Error(`دروستکردنی bucket شکستی هێنا: ${await created.text()}`)
  return 'دروستکرا'
}

// ───── لیستی ئەوانەی پێشتر بارکراون ─────
async function listUploaded() {
  const names = new Set()
  let offset = 0
  for (;;) {
    const res = await fetch(`${URL_BASE}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: `${PREFIX}/`, limit: 1000, offset }),
    })
    if (!res.ok) break
    const page = await res.json()
    if (!Array.isArray(page) || !page.length) break
    page.forEach((entry) => names.add(entry.name))
    if (page.length < 1000) break
    offset += page.length
  }
  return names
}

async function upload(file, contentType) {
  const path = `${PREFIX}/${basename(file)}`
  const body = readFileSync(file)
  const res = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'x-upsert': 'true',
    },
    body,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${(await res.text()).slice(0, 120)}`)
  return body.length
}

// ───── کارکردنی سەرەکی ─────
if (!existsSync(IMG_DIR)) {
  console.error(`${IMG_DIR} نییە — سەرەتا «npm run images» کار پێبکە`)
  process.exit(1)
}

console.log(`bucket «${BUCKET}»: ${await ensureBucket()}`)

const files = readdirSync(IMG_DIR).filter((f) => f.endsWith('.webp'))
const jsonFiles = ['lqip.json', 'credits.json'].filter((f) => existsSync(resolve(IMG_DIR, f)))
const uploaded = FORCE ? new Set() : await listUploaded()

const todo = files.filter((f) => !uploaded.has(f))
console.log(`${files.length} وێنە لە ناوخۆدا · ${uploaded.size} پێشتر بارکراوە · ${todo.length} بۆ بارکردن\n`)

const stats = { done: 0, failed: 0, bytes: 0 }
const failures = []
const startedAt = Date.now()
let cursor = 0

async function worker() {
  while (cursor < todo.length) {
    const file = todo[cursor]
    cursor += 1
    try {
      stats.bytes += await upload(resolve(IMG_DIR, file), 'image/webp')
      stats.done += 1
    } catch (error) {
      stats.failed += 1
      failures.push({ file, reason: error.message })
    }
    const total = stats.done + stats.failed
    if (total % 25 === 0 || total === todo.length) {
      const seconds = Math.round((Date.now() - startedAt) / 1000)
      process.stdout.write(`\r${total}/${todo.length} · شکست ${stats.failed} · ${seconds}s   `)
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker))

// نەخشەکانیش بار بکە (هەمیشە نوێ دەکرێنەوە)
for (const file of jsonFiles) {
  try {
    await upload(resolve(IMG_DIR, file), 'application/json')
    console.log(`\n${file} بارکرا`)
  } catch (error) {
    console.log(`\n${file} شکستی هێنا: ${error.message}`)
  }
}

console.log(`
تەواو بوو لە ${Math.round((Date.now() - startedAt) / 1000)} چرکەدا
  بارکرا     : ${stats.done} (${(stats.bytes / 1024 / 1024).toFixed(1)} MB)
  شکستی هێنا : ${stats.failed}

بنەڕەتی بەستەری گشتی:
  ${URL_BASE}/storage/v1/object/public/${BUCKET}/${PREFIX}/<ناو>.webp`)

if (failures.length) {
  console.log('\nشکستەکان:')
  failures.slice(0, 15).forEach((f) => console.log(`  · ${f.file} — ${f.reason}`))
  if (failures.length > 15) console.log(`  … و ${failures.length - 15} ی تر`)
}

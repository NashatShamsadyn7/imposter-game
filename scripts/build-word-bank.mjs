// ═══════════════════════════════════════════════════════════
//  دروستکردنی فایلی بانکی وشە لە بانکی ناوبنکەوە (src/data/words.js)
//
//  دەرئەنجام: public/word-bank-static.json — ئامادەیە بۆ «بارکردنی
//  فایلی بانکی JSON» لە پەڕەی بەڕێوەبردنی وشەدا.
//
//  بەکارهێنان: node scripts/build-word-bank.mjs
//
//  تێبینی: بەستەری وێنە ئاراستەی Pollinations دەکات. دوای کارپێکردنی
//  scripts/fetch-word-images.mjs بەستەرەکان دەبنە ناوخۆیی (/w/*.webp).
// ═══════════════════════════════════════════════════════════

import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const { CATEGORIES } = await import(pathToFileURL(resolve('src/data/words.js')).href)

const STYLE_SUFFIX =
  ', realistic photography, high quality, highly detailed, no text, no words, no letters'

function hashString(value) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const slugFor = (en) =>
  `${en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}-${hashString(en) % 100000}`

// ئەگەر وێنەکە پێشتر داگیرابێت، بەستەری ناوخۆیی بەکاردەهێنین (خێراتر)
function imageUrl(prompt) {
  if (!prompt) return ''
  const local = `/w/${slugFor(prompt)}.webp`
  if (existsSync(resolve(`public${local}`))) return local
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + STYLE_SUFFIX)}?width=400&height=400&nologo=true&seed=${hashString(prompt) % 100000}`
}

const categories = CATEGORIES.map((category, sort) => ({
  id: category.id,
  name_ku: category.name,
  name_ar: category.name_ar || '',
  icon: category.icon,
  sort,
  enabled: true,
}))

const items = CATEGORIES.flatMap((category) =>
  category.words.map((word, sort) => ({
    category_id: category.id,
    ku: word.ku,
    ar: word.ar || '',
    en: word.en || '',
    emoji: word.emoji || '',
    image_url: imageUrl(word.en || ''),
    sort,
    enabled: true,
  }))
)

const localCount = items.filter((item) => item.image_url.startsWith('/w/')).length
const bank = {
  version: 2,
  language: 'ku-Arab',
  generated_at: new Date().toISOString(),
  description: `${items.length} وشە لە بانکی ناوبنکەوە، بە کوردی و عەرەبی و وێنە.`,
  categories,
  items,
}

const output = resolve('public/word-bank-static.json')
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, `${JSON.stringify(bank, null, 2)}\n`, 'utf8')
console.log(
  `دروستکرا ${output}\n  ${categories.length} هاوپۆڵ · ${items.length} وشە · ${localCount} وێنەی ناوخۆیی · ${items.length - localCount} لەسەر Pollinations`
)

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import vm from 'node:vm'

const source = execFileSync('git', ['show', 'HEAD:src/data/words.js'], { encoding: 'utf8' })
const categoryNames = {
  animals: 'الحيوانات', food: 'الطعام والمشروبات', produce: 'الفواكه والخضار',
  body: 'جسم الإنسان', clothes: 'الملابس', home: 'أدوات المنزل', kitchen: 'المطبخ',
  transport: 'المواصلات', nature: 'الطبيعة', sports: 'الرياضة والألعاب', professions: 'المهن',
  tech: 'التكنولوجيا', tools: 'الأدوات والعدّة', music: 'الموسيقى والفنون', places: 'الأماكن والدول',
}

// نقرأ المصدر السابق المحفوظ في Git حتى يبقى هذا المولّد قابلاً للإعادة،
// ثم نضيف رابط صورة ثابتاً لكل كلمة (ولا يعتمد على مولّد الصور داخل المتصفح).
const executable = `${source.slice(0, source.indexOf('const CATEGORY_NAME_AR'))}\n;globalThis.__categories = ALL_CATEGORIES;`
const context = {}
vm.runInNewContext(executable, context)

function hashString(value) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function imageUrl(prompt) {
  if (!prompt) return ''
  const suffix = ', realistic photography, high quality, highly detailed, no text, no words, no letters'
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(`${prompt}${suffix}`)}?width=400&height=400&nologo=true&seed=${hashString(prompt) % 100000}`
}

const categories = context.__categories.map((category, sort) => ({
  id: category.id,
  name_ku: category.name,
  name_ar: categoryNames[category.id] || '',
  icon: category.icon,
  sort,
  enabled: true,
}))

const items = context.__categories.flatMap((category) => category.words.map((word, sort) => ({
  category_id: category.id,
  ku: word.ku,
  ar: word.ar || '',
  en: word.en || '',
  emoji: word.emoji || '',
  image_url: imageUrl(word.en || ''),
  sort,
  enabled: true,
})))

const bank = {
  version: 1,
  language: 'ku-Arab',
  generated_at: new Date().toISOString(),
  description: '۲۲۵۰ وشەی کوردی بە وەرگێڕانی عەرەبیی سروشتی و بەستەری وێنەی تایبەت بۆ هەر وشەیەک.',
  categories,
  items,
}

const output = resolve('public/word-bank-kurdish-2250.json')
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, `${JSON.stringify(bank, null, 2)}\n`, 'utf8')
console.log(`Created ${output}: ${categories.length} categories, ${items.length} words, ${items.filter((item) => item.image_url).length} image URLs.`)

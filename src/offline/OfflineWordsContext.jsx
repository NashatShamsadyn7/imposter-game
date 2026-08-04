// ═══════════════════════════════════════════════════════════
//  بانکی وشە بۆ ئەپی ئۆفلاین
//
//  هەمان ڕووکاری WordsContext ـی وێب دەدات (useWords)، بەڵام
//  لە جیاتی Supabase، بانکەکە لە پەڕگەیەکی هاوپێچکراوەوە
//  دەخوێنێتەوە: /word-bank-kurdish-2250.json
//
//  ⚠️ هیچ داواکارییەکی تۆڕ لێرەدا نییە — پەڕگەکە لەناو APK ـەکەدایە
//     و Capacitor لە خۆماڵییەوە پێشکەشی دەکات.
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import {
  CATEGORIES as STATIC_CATEGORIES,
  RANDOM_CATEGORY,
  pickRandomWord,
  pickDecoyWord,
} from '../data/words'
import { loadLqipMap } from '../lib/images'

const BANK_URL = '/word-bank-kurdish-2250.json'

const WordsContext = createContext(null)

// هەمان گۆڕینی WordsContext ـی وێب — دەبێت وەک یەک بمێننەوە
function mapBank(categories, items) {
  const byCat = new Map()
  categories.forEach((c) => byCat.set(c.id, []))
  items.forEach((w) => {
    if (!byCat.has(w.category_id)) byCat.set(w.category_id, [])
    byCat.get(w.category_id).push({
      ku: w.ku,
      ar: w.ar || '',
      en: w.en || '',
      emoji: w.emoji || '',
      image_url: w.image_url || '',
    })
  })
  return categories
    .map((c) => ({
      id: c.id,
      name: c.name_ku || c.name_ar || c.id,
      name_ar: c.name_ar || '',
      icon: c.icon || '🗂️',
      words: byCat.get(c.id) || [],
    }))
    .filter((c) => c.words.length > 0)
}

export function WordsProvider({ children }) {
  // بانکی ناوبنکە وەک دەستپێک — ئەگەر پەڕگەکە بۆ هەر هۆیەک
  // نەخوێنرایەوە، یاری هێشتا کاردەکات.
  const [categories, setCategories] = useState(STATIC_CATEGORIES)

  useEffect(() => {
    let alive = true
    fetch(BANK_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((bank) => {
        if (!alive || !bank?.categories?.length || !bank?.items?.length) return
        const enabledCats = bank.categories.filter((c) => c.enabled !== false)
        const enabledItems = bank.items.filter((w) => w.enabled !== false)
        const mapped = mapBank(enabledCats, enabledItems)
        if (mapped.length) setCategories(mapped)
      })
      .catch(() => {
        /* بانکی ناوبنکە دەمێنێتەوە */
      })
    return () => {
      alive = false
    }
  }, [])

  // نەخشەی LQIP — لە APK ـەکەدایە، یەکسەر دێت
  useEffect(() => {
    loadLqipMap()
  }, [])

  const getCategoryById = useCallback(
    (id) => categories.find((c) => c.id === id) || categories[0],
    [categories]
  )
  const resolveCategory = useCallback(
    (id) => {
      if (id === 'random') return categories[Math.floor(Math.random() * categories.length)]
      return getCategoryById(id)
    },
    [categories, getCategoryById]
  )
  const findWord = useCallback(
    (ku) => {
      for (const c of categories) {
        const w = c.words.find((x) => x.ku === ku)
        if (w) return w
      }
      return null
    },
    [categories]
  )

  const value = useMemo(
    () => ({
      categories,
      randomCategory: RANDOM_CATEGORY,
      // لە ئۆفلایندا بەڕێوەبەر نییە و هیچ شتێک بۆ نوێکردنەوە نییە
      isAdmin: false,
      reload: () => {},
      getCategoryById,
      resolveCategory,
      findWord,
      pickRandomWord,
      pickDecoyWord,
    }),
    [categories, getCategoryById, resolveCategory, findWord]
  )

  return <WordsContext.Provider value={value}>{children}</WordsContext.Provider>
}

export function useWords() {
  const ctx = useContext(WordsContext)
  if (!ctx) throw new Error('useWords دەبێت لەناو WordsProvider بێت')
  return ctx
}

// ═══════════════════════════════════════════════════════════
//  WordsContext — بانکی وشەی زیندوو
//  وشەکان لە Supabase دەهێنرێن (بەڕێوەبەر دەیانگۆڕێت)، ئەگەر نەبوون
//  دەگەڕێینەوە بۆ بانکی ناوبنکە (data/words.js). بانک لە localStorage
//  کاش دەکرێت بۆ بارکردنی خێرا و کارکردن بەبێ ئینتەرنێت.
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import {
  CATEGORIES as STATIC_CATEGORIES,
  RANDOM_CATEGORY,
  pickRandomWord,
  pickDecoyWord,
} from '../data/words'
import { fetchWordBank, amIAdmin } from '../lib/supabase'

const CACHE_KEY = 'imposter:wordbank:v1'

const WordsContext = createContext(null)

// گۆڕینی ڕیزەکانی بنکەداتا بۆ شێوەی یاری: { id, name, icon, words:[{ku,ar,en,emoji,image_url}] }
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

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch { /* noop */ }
  return null
}

export function WordsProvider({ children }) {
  const { user } = useAuth()
  // سەرەتا: کاش ئەگەر هەبوو، ئەگەرنا بانکی ناوبنکە
  const [categories, setCategories] = useState(() => loadCache() || STATIC_CATEGORIES)
  const [isAdmin, setIsAdmin] = useState(false)

  // هێنانی بانک لە بنکەداتا
  const reload = useCallback(async () => {
    const bank = await fetchWordBank()
    // null = خشتە نییە/هەڵە → بانکی ناوبنکە بەکاردێنین
    if (!bank) {
      setCategories(STATIC_CATEGORIES)
      return
    }
    // بەتاڵ = خشتە هەیە بەڵام وشەی تێدا نییە → هێشتا بانکی ناوبنکە
    if (!bank.categories.length) {
      setCategories(STATIC_CATEGORIES)
      return
    }
    const mapped = mapBank(bank.categories, bank.items)
    if (!mapped.length) {
      setCategories(STATIC_CATEGORIES)
      return
    }
    setCategories(mapped)
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(mapped)) } catch { /* noop */ }
  }, [])

  useEffect(() => { reload() }, [reload])

  // بەڕێوەبەر؟
  useEffect(() => {
    let alive = true
    if (!user) { setIsAdmin(false); return }
    amIAdmin().then((v) => { if (alive) setIsAdmin(v) })
    return () => { alive = false }
  }, [user])

  // ───── یاریدەدەرە زیندووەکان (لەسەر categories) ─────
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
      isAdmin,
      reload,
      getCategoryById,
      resolveCategory,
      findWord,
      pickRandomWord,
      pickDecoyWord,
    }),
    [categories, isAdmin, reload, getCategoryById, resolveCategory, findWord]
  )

  return <WordsContext.Provider value={value}>{children}</WordsContext.Provider>
}

export function useWords() {
  const ctx = useContext(WordsContext)
  if (!ctx) throw new Error('useWords دەبێت لەناو WordsProvider بێت')
  return ctx
}

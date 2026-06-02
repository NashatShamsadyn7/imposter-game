// ═══════════════════════════════════════════════════════════
//  EconomyContext — دراو (coins) + شتومەکی کڕدراو + بەرکراوەکان
//  لە localStorage پاشەکەوت دەکرێت، بەپێی ناسنامەی بەکارهێنەر (uid).
//  ئەمە بنەمای حلقەی «کۆکردنەوە و خاوەنداریەتی»ـە بۆ ئیدمان.
//  تێبینی: ئێستا تەنها ناوخۆییە (هەر ئامێرێک جیا). هاوکاتکردن لەگەڵ
//  Supabase دەکرێت دواتر زیاد بکرێت بەبێ گۆڕینی ئەم API ـیە.
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { getCosmetic } from '../lib/cosmetics'

const EconomyContext = createContext(null)
export const useEconomy = () => useContext(EconomyContext) || FALLBACK

// ئەگەر provider نەبوو (پاراستن) — هیچ ناکات
const FALLBACK = {
  coins: 0,
  owned: new Set(),
  equipped: {},
  addCoins: () => {},
  buy: () => false,
  equip: () => {},
  isOwned: () => false,
}

const keyFor = (uid) => `imposter:econ:${uid || 'guest'}`

function load(uid) {
  if (typeof localStorage === 'undefined') return { coins: 0, owned: [], equipped: {} }
  try {
    const raw = localStorage.getItem(keyFor(uid))
    if (!raw) return { coins: 0, owned: [], equipped: {} }
    const d = JSON.parse(raw)
    return {
      coins: Math.max(0, d.coins || 0),
      owned: Array.isArray(d.owned) ? d.owned : [],
      equipped: d.equipped && typeof d.equipped === 'object' ? d.equipped : {},
    }
  } catch {
    return { coins: 0, owned: [], equipped: {} }
  }
}

export function EconomyProvider({ children }) {
  const { user } = useAuth() || {}
  const uid = user?.id || 'guest'

  const [coins, setCoins] = useState(() => load(uid).coins)
  const [owned, setOwned] = useState(() => new Set(load(uid).owned))
  const [equipped, setEquipped] = useState(() => load(uid).equipped)
  const uidRef = useRef(uid)

  // گۆڕینی بەکارهێنەر → دۆخی نوێ باربکە
  useEffect(() => {
    if (uidRef.current === uid) return
    uidRef.current = uid
    const d = load(uid)
    setCoins(d.coins)
    setOwned(new Set(d.owned))
    setEquipped(d.equipped)
  }, [uid])

  // پاشەکەوتکردنی هەر گۆڕانکارییەک
  useEffect(() => {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(
        keyFor(uid),
        JSON.stringify({ coins, owned: [...owned], equipped }),
      )
    } catch { /* noop */ }
  }, [uid, coins, owned, equipped])

  const addCoins = useCallback((n) => {
    const amt = Math.round(n || 0)
    if (amt <= 0) return
    setCoins((c) => c + amt)
  }, [])

  const isOwned = useCallback((id) => owned.has(id), [owned])

  // کڕین — true ئەگەر سەرکەوتوو بوو
  const buy = useCallback((item) => {
    const cos = typeof item === 'string' ? getCosmetic(item) : item
    if (!cos) return false
    if (owned.has(cos.id)) return false
    let ok = false
    setCoins((c) => {
      if (c < cos.price) return c
      ok = true
      return c - cos.price
    })
    if (ok) setOwned((s) => new Set(s).add(cos.id))
    return ok
  }, [owned])

  // بەرکردن/لابردن — ئەگەر هەمان شت بوو، لایدەبات (toggle)
  const equip = useCallback((item) => {
    const cos = typeof item === 'string' ? getCosmetic(item) : item
    if (!cos || !owned.has(cos.id)) return
    setEquipped((e) => {
      const next = { ...e }
      if (next[cos.type] === cos.id) delete next[cos.type]
      else next[cos.type] = cos.id
      return next
    })
  }, [owned])

  const value = useMemo(
    () => ({ coins, owned, equipped, addCoins, buy, equip, isOwned }),
    [coins, owned, equipped, addCoins, buy, equip, isOwned],
  )

  return <EconomyContext.Provider value={value}>{children}</EconomyContext.Provider>
}

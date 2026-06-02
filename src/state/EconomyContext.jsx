// ═══════════════════════════════════════════════════════════
//  EconomyContext — دراو (coins) + شتومەکی کڕدراو + بەرکراوەکان
//  دوو دۆخ:
//   • db    — کاتێک Supabase ڕێکخراوە و migration ـی کۆمەتیک جێبەجێ کراوە
//             (profiles.coins, owned_cosmetics, equipped_cosmetics).
//             هەموو یاریزانان ڕووکاری یەکتر دەبینن لە ئۆنلاین.
//   • local — یەدەگ: لە localStorage (بەبێ Supabase یان پێش migration).
//  API ـیەکە لە هەردوو دۆخدا هەمان شێوەیە.
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase, isSupabaseEnabled } from '../lib/supabase'
import { getCosmetic } from '../lib/cosmetics'

const EconomyContext = createContext(null)
export const useEconomy = () => useContext(EconomyContext) || FALLBACK

const FALLBACK = {
  coins: 0,
  owned: new Set(),
  equipped: {},
  addCoins: () => {},
  buy: async () => false,
  equip: () => {},
  isOwned: () => false,
}

const keyFor = (uid) => `imposter:econ:${uid || 'guest'}`

function loadLocal(uid) {
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
  const { user, profile } = useAuth() || {}
  const uid = user?.id || 'guest'

  const [coins, setCoins] = useState(0)
  const [owned, setOwned] = useState(() => new Set())
  const [equipped, setEquipped] = useState({})
  // 'db' یان 'local' — دوای seed دیاری دەکرێت
  const [mode, setMode] = useState('local')
  const seededRef = useRef(null) // کلیلی ئەو دۆخەی seed کراوە (uid:mode)

  // ───── seed ـی یەکجارەیی بەپێی سەرچاوەی بەردەست ─────
  useEffect(() => {
    // دۆخی db: Supabase ڕێکخراوە + بەکارهێنەر + ستوونی coins هەیە (migration کراوە)
    const dbReady = isSupabaseEnabled && user?.id && profile && profile.coins !== undefined
    if (dbReady) {
      const tag = `${uid}:db`
      if (seededRef.current === tag) return
      seededRef.current = tag
      setMode('db')
      setCoins(Math.max(0, profile.coins || 0))
      setOwned(new Set(Array.isArray(profile.owned_cosmetics) ? profile.owned_cosmetics : []))
      setEquipped(profile.equipped_cosmetics && typeof profile.equipped_cosmetics === 'object' ? profile.equipped_cosmetics : {})
      return
    }
    // ئەگەر Supabase هەیە بەڵام profile هێشتا نەهاتووە، چاوەڕێ بکە
    if (isSupabaseEnabled && user?.id && !profile) return
    // دۆخی local
    const tag = `${uid}:local`
    if (seededRef.current === tag) return
    seededRef.current = tag
    setMode('local')
    const d = loadLocal(uid)
    setCoins(d.coins)
    setOwned(new Set(d.owned))
    setEquipped(d.equipped)
  }, [uid, user?.id, profile])

  // پاشەکەوتی localStorage — هەمیشە وەک کاش (لە db دۆخیشدا بێ زیان)
  useEffect(() => {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(keyFor(uid), JSON.stringify({ coins, owned: [...owned], equipped }))
    } catch { /* noop */ }
  }, [uid, coins, owned, equipped])

  // ref ـەکان بۆ خوێندنەوەی نوێترین بەها لە ناو callback ـەکان (بەبێ closure ـی کۆن)
  const ownedRef = useRef(owned)
  const equippedRef = useRef(equipped)
  useEffect(() => { ownedRef.current = owned }, [owned])
  useEffect(() => { equippedRef.current = equipped }, [equipped])

  // ───── زیادکردنی دراو ─────
  const addCoins = useCallback((n) => {
    const amt = Math.round(n || 0)
    if (amt <= 0) return
    if (mode === 'db' && supabase) {
      // باڵانسی نوێ لە سێرڤەرەوە وەربگرە (atomic)
      supabase.rpc('add_coins', { amount: amt })
        .then(({ data, error }) => {
          if (!error && typeof data === 'number') setCoins(data)
          else setCoins((c) => c + amt) // یەدەگ ئەگەر RPC نەبوو
        })
        .catch(() => setCoins((c) => c + amt))
    } else {
      setCoins((c) => c + amt)
    }
  }, [mode])

  const isOwned = useCallback((id) => owned.has(id), [owned])

  // ───── کڕین (async) — true ئەگەر سەرکەوتوو بوو ─────
  const buy = useCallback(async (item) => {
    const cos = typeof item === 'string' ? getCosmetic(item) : item
    if (!cos || owned.has(cos.id)) return false

    if (mode === 'db' && supabase) {
      try {
        const { data, error } = await supabase.rpc('purchase_cosmetic', {
          cosmetic_id: cos.id,
          price: cos.price,
        })
        if (error || !data?.ok) return false
        if (typeof data.coins === 'number') setCoins(data.coins)
        const nextOwned = Array.isArray(data.owned)
          ? new Set(data.owned)
          : new Set(ownedRef.current).add(cos.id)
        ownedRef.current = nextOwned // یەکسەر نوێ بکەرەوە بۆ equip ـی دوای کڕین
        setOwned(nextOwned)
        return true
      } catch {
        return false
      }
    }

    // دۆخی local
    if (coins < cos.price) return false
    setCoins((c) => c - cos.price)
    const nextOwned = new Set(ownedRef.current).add(cos.id)
    ownedRef.current = nextOwned
    setOwned(nextOwned)
    return true
  }, [mode, coins])

  // ───── بەرکردن/لابردن (toggle) ─────
  const equip = useCallback((item) => {
    const cos = typeof item === 'string' ? getCosmetic(item) : item
    if (!cos || !ownedRef.current.has(cos.id)) return
    const cur = equippedRef.current
    const next = { ...cur }
    if (next[cos.type] === cos.id) delete next[cos.type] // لابردن ئەگەر هەمان شت بەرکراوە
    else next[cos.type] = cos.id
    equippedRef.current = next
    setEquipped(next)
    if (mode === 'db' && supabase) {
      supabase.rpc('set_equipped', { equipped: next }).catch(() => {})
    }
  }, [mode])

  const value = useMemo(
    () => ({ coins, owned, equipped, addCoins, buy, equip, isOwned }),
    [coins, owned, equipped, addCoins, buy, equip, isOwned],
  )

  return <EconomyContext.Provider value={value}>{children}</EconomyContext.Provider>
}

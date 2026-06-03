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
  syncCoins: () => {},
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
  // ref ـەکان بۆ خوێندنەوەی نوێترین بەها لە ناو callback/effect (بەبێ closure ـی کۆن)
  const ownedRef = useRef(owned)
  const equippedRef = useRef(equipped)

  // ───── seed ـی یەکجارەیی بەپێی سەرچاوەی بەردەست ─────
  useEffect(() => {
    // دۆخی db: Supabase ڕێکخراوە + بەکارهێنەر + ستوونی coins هەیە (migration کراوە)
    const dbReady = isSupabaseEnabled && user?.id && profile && profile.coins !== undefined
    if (dbReady) {
      const tag = `${uid}:db`
      if (seededRef.current === tag) return
      seededRef.current = tag
      setMode('db')
      const dbOwned = Array.isArray(profile.owned_cosmetics) ? profile.owned_cosmetics : []
      const dbEquipped = profile.equipped_cosmetics && typeof profile.equipped_cosmetics === 'object' ? profile.equipped_cosmetics : {}
      const local = loadLocal(uid)
      // یەکجارە: db بەتاڵە بەڵام داتای ناوخۆیی هەیە → بیگوازەوە بۆ سێرڤەر (نەک ون بێت)
      if (dbOwned.length === 0 && local.owned.length > 0 && supabase) {
        setCoins(Math.max(local.coins, profile.coins || 0)) // یەکسەر پیشان بدە
        setOwned(new Set(local.owned))
        setEquipped(local.equipped)
        ownedRef.current = new Set(local.owned)
        equippedRef.current = local.equipped
        supabase.rpc('restore_economy', { p_coins: local.coins, p_owned: local.owned, p_equipped: local.equipped })
          .then(({ data, error }) => {
            if (error || !data?.ok) return
            if (typeof data.coins === 'number') setCoins(data.coins)
            if (Array.isArray(data.owned)) { setOwned(new Set(data.owned)); ownedRef.current = new Set(data.owned) }
            if (data.equipped && typeof data.equipped === 'object') { setEquipped(data.equipped); equippedRef.current = data.equipped }
          })
          .catch(() => {})
        return
      }
      setCoins(Math.max(0, profile.coins || 0))
      setOwned(new Set(dbOwned))
      setEquipped(dbEquipped)
      ownedRef.current = new Set(dbOwned)
      equippedRef.current = dbEquipped
      return
    }
    // Supabase هەیە بەڵام profile هێشتا نەهاتووە → لە کاش پیشان بدە (بەبێ flash/ون بوون)
    if (isSupabaseEnabled && user?.id && !profile) {
      const tag = `${uid}:pending`
      if (seededRef.current === tag || seededRef.current === `${uid}:db`) return
      seededRef.current = tag
      const d = loadLocal(uid)
      setCoins(d.coins)
      setOwned(new Set(d.owned))
      setEquipped(d.equipped)
      return
    }
    // دۆخی local (بەبێ Supabase)
    const tag = `${uid}:local`
    if (seededRef.current === tag) return
    seededRef.current = tag
    setMode('local')
    const d = loadLocal(uid)
    setCoins(d.coins)
    setOwned(new Set(d.owned))
    setEquipped(d.equipped)
  }, [uid, user?.id, profile])

  // پاشەکەوتی localStorage — تەنها دوای seed بۆ ئەم uid ـە (پێشگری لە سڕینەوەی کاش)
  useEffect(() => {
    if (typeof localStorage === 'undefined') return
    if (!seededRef.current || !seededRef.current.startsWith(`${uid}:`)) return
    try {
      localStorage.setItem(keyFor(uid), JSON.stringify({ coins, owned: [...owned], equipped }))
    } catch { /* noop */ }
  }, [uid, coins, owned, equipped])

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

  // ───── هاوکاتکردنی باڵانس لەگەڵ سێرڤەر ─────
  // بۆ پاداشتە سێرڤەرییەکان (بانگهێشت/هاوبەشکردن/ڕۆژانە) کە
  // ڕاستەوخۆ coins لە بنکەی دراوەدا نوێ دەکەنەوە و باڵانسی نوێ دەگەڕێننەوە.
  const syncCoins = useCallback((n) => {
    if (typeof n === 'number' && n >= 0) setCoins(n)
  }, [])

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
    if (mode === 'db' && supabase && user?.id) {
      // نوێکردنەوەی ڕاستەوخۆ (RLS ڕێگە دەدات بۆ پرۆفایلی خۆت) — جێگیرتر لە RPC.
      // ئەگەر سەرکەوتوو نەبوو، یەدەگ بۆ RPC.
      supabase
        .from('profiles')
        .update({ equipped_cosmetics: next })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) supabase.rpc('set_equipped', { equipped: next }).catch(() => {})
        })
    }
  }, [mode, user?.id])

  const value = useMemo(
    () => ({ coins, owned, equipped, addCoins, syncCoins, buy, equip, isOwned }),
    [coins, owned, equipped, addCoins, syncCoins, buy, equip, isOwned],
  )

  return <EconomyContext.Provider value={value}>{children}</EconomyContext.Provider>
}

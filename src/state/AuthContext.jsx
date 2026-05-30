// ═══════════════════════════════════════════════════════════
//  دۆخی چوونەژوورەوە — Google (مەرج) + پرۆفایل
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseEnabled, ensureProfile, signOut, touchLastSeen } from '../lib/supabase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// پرۆفایلی جێگرەوە لە زانیاری گووگڵ — بۆ ئەوەی ئەپڵیکەیشن هەرگیز
// لە شاشەی بارکردن نەمێنێتەوە ئەگەر بنکەی دراوە بەردەست نەبوو
function fallbackProfile(user) {
  const meta = user.user_metadata || {}
  return {
    id: user.id,
    display_name: meta.full_name || meta.name || user.email?.split('@')[0] || 'یاریزان',
    avatar_url: meta.avatar_url || meta.picture || null,
    total_points: 0,
    games_played: 0,
    wins: 0,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) {
      setLoading(false)
      return
    }
    supabase.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user || null))
      .catch((e) => console.warn('getSession:', e.message))
      .finally(() => setLoading(false))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // دروستکردن/هێنانی پرۆفایل کاتێک بەکارهێنەر دەچێتە ژوورەوە
  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }
    let cancelled = false
    ensureProfile(user)
      .then((p) => {
        if (!cancelled) setProfile(p || fallbackProfile(user))
      })
      .catch((e) => {
        console.warn('ensureProfile:', e.message)
        // ئەگەر بنکەی دراوە سەرکەوتوو نەبوو، بە پرۆفایلی جێگرەوە بەردەوام بە
        if (!cancelled) setProfile(fallbackProfile(user))
      })
    return () => {
      cancelled = true
    }
  }, [user])

  // حزووری ئۆنلاین — نوێکردنەوەی last_seen هەر ٤٠ چرکە (و کاتی کرانەوە)
  useEffect(() => {
    if (!user) return
    touchLastSeen()
    const iv = setInterval(touchLastSeen, 40000)
    const onVisible = () => document.visibilityState === 'visible' && touchLastSeen()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(iv)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user])

  const refreshProfile = async () => {
    if (user) setProfile(await ensureProfile(user))
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, isSupabaseEnabled, signOut, refreshProfile, setProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

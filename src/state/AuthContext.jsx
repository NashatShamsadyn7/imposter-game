// ═══════════════════════════════════════════════════════════
//  دۆخی چوونەژوورەوە — Google (مەرج) + پرۆفایل
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseEnabled, ensureProfile, signOut } from '../lib/supabase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
      setLoading(false)
    })
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
    ensureProfile(user)
      .then(setProfile)
      .catch((e) => console.warn('ensureProfile:', e.message))
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

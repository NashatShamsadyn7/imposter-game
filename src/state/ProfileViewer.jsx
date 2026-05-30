// ═══════════════════════════════════════════════════════════
//  ProfileViewer — کرتە لەسەر هەر یاریزانێک بکە بۆ بینینی پرۆفایلەکەی
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useState, useCallback } from 'react'
import PlayerProfileModal from '../components/PlayerProfileModal'

const ProfileViewerContext = createContext(null)
export const useProfileViewer = () => useContext(ProfileViewerContext)

export function ProfileViewerProvider({ children }) {
  const [target, setTarget] = useState(null) // { userId, name, avatar }

  const openProfile = useCallback((userId, name, avatar) => {
    if (!userId) return
    setTarget({ userId, name, avatar })
  }, [])

  const close = useCallback(() => setTarget(null), [])

  return (
    <ProfileViewerContext.Provider value={{ openProfile }}>
      {children}
      {target && (
        <PlayerProfileModal
          userId={target.userId}
          fallbackName={target.name}
          fallbackAvatar={target.avatar}
          onClose={close}
        />
      )}
    </ProfileViewerContext.Provider>
  )
}

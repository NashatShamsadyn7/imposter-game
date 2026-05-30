// ═══════════════════════════════════════════════════════════
//  دۆخی هاوڕێیان — لیست، داواکاری، حزوور، نامە نەخوێندراوەکان
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { useNotify } from './NotificationContext'
import {
  supabase,
  fetchFriendships,
  fetchProfilesByIds,
  fetchUnreadCounts,
  findProfileByCode,
  sendFriendRequest,
  respondFriendRequest,
  removeFriendship,
  subscribeFriendships,
  subscribeDirectMessages,
  fetchBlockedIds,
  blockUser,
  unblockUser,
} from '../lib/supabase'

const FriendsContext = createContext(null)
export const useFriends = () => useContext(FriendsContext)

export function FriendsProvider({ children }) {
  const { user } = useAuth()
  const notify = useNotify()
  const [friendships, setFriendships] = useState([])
  const [profiles, setProfiles] = useState({}) // id -> profile
  const [unread, setUnread] = useState({}) // id -> count
  const [blocked, setBlocked] = useState([]) // idـی بلۆککراوەکان
  const idsRef = useRef([])
  const profilesRef = useRef({})
  const incomingIdsRef = useRef(null) // ناسینەوەی داواکاری نوێ

  // ───── بارکردنی هەموو پەیوەندییەکان ─────
  const load = useCallback(async () => {
    if (!user) return
    const fs = await fetchFriendships(user.id)
    setFriendships(fs)
    const ids = [
      ...new Set(fs.map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id))),
    ]
    idsRef.current = ids
    const [profs, counts, blk] = await Promise.all([
      fetchProfilesByIds(ids),
      fetchUnreadCounts(user.id),
      fetchBlockedIds(user.id).catch(() => []),
    ])
    const profMap = Object.fromEntries(profs.map((p) => [p.id, p]))
    profilesRef.current = profMap
    setProfiles(profMap)
    setUnread(counts)
    setBlocked(blk)

    // ناسینەوەی داواکاری هاوڕێیەتیی نوێ بۆ ئاگادارکردنەوە
    const incomingIds = fs
      .filter((f) => f.status === 'pending' && f.addressee_id === user.id)
      .map((f) => f.requester_id)
    if (incomingIdsRef.current === null) {
      incomingIdsRef.current = new Set(incomingIds) // یەکەم بارکردن — ئاگادار مەکەرەوە
    } else {
      incomingIds.forEach((rid) => {
        if (!incomingIdsRef.current.has(rid)) {
          notify({
            title: 'داواکاری هاوڕێیەتی',
            body: `${profMap[rid]?.display_name || 'یاریزانێک'} دەیەوێت ببێتە هاوڕێت`,
            type: 'friend',
          })
        }
      })
      incomingIdsRef.current = new Set(incomingIds)
    }
  }, [user, notify])

  // نوێکردنەوەی حزووری هاوڕێیان (last_seen) بەبێ بارکردنەوەی هەمووی
  const refreshPresence = useCallback(async () => {
    if (!idsRef.current.length) return
    const profs = await fetchProfilesByIds(idsRef.current)
    setProfiles((prev) => {
      const next = { ...prev }
      profs.forEach((p) => (next[p.id] = p))
      return next
    })
  }, [])

  useEffect(() => {
    if (!user || !supabase) {
      setFriendships([])
      setProfiles({})
      setUnread({})
      setBlocked([])
      return
    }
    load()
    const unsubF = subscribeFriendships(user.id, load)
    const unsubD = subscribeDirectMessages(user.id, (msg) => {
      setUnread((prev) => ({ ...prev, [msg.sender_id]: (prev[msg.sender_id] || 0) + 1 }))
      const name = profilesRef.current[msg.sender_id]?.display_name || 'یاریزانێک'
      if (msg.kind === 'invite') {
        notify({
          title: 'بانگهێشت بۆ ژوور 🎮',
          body: `${name} بانگهێشتی کردیت — کۆد: ${msg.content}`,
          type: 'invite',
        })
      } else {
        notify({ title: name, body: msg.content, type: 'dm' })
      }
    })
    const iv = setInterval(refreshPresence, 30000)
    return () => {
      unsubF?.()
      unsubD?.()
      clearInterval(iv)
    }
  }, [user, load, refreshPresence, notify])

  // ───── کردارەکان ─────
  const addFriendByCode = useCallback(
    async (code) => {
      if (!user) return { error: 'چوونەژوورەوە پێویستە' }
      const target = await findProfileByCode(code)
      if (!target) return { error: 'بەکارهێنەر نەدۆزرایەوە' }
      if (target.id === user.id) return { error: 'ناتوانیت خۆت زیاد بکەیت' }
      const exists = friendships.find(
        (f) => f.requester_id === target.id || f.addressee_id === target.id
      )
      if (exists) return { error: 'پێشتر داواکاری/هاوڕێیەتی هەیە' }
      try {
        await sendFriendRequest(user.id, target.id)
        await load()
        return { ok: true, name: target.display_name }
      } catch (e) {
        return { error: e.message }
      }
    },
    [user, friendships, load]
  )

  // ناردنی داواکاری بە id (لە ناو ژوور/گرووپ)
  const addFriendById = useCallback(
    async (targetId) => {
      if (!user) return { error: 'چوونەژوورەوە پێویستە' }
      if (targetId === user.id) return { error: 'ناتوانیت خۆت زیاد بکەیت' }
      const exists = friendships.find(
        (f) => f.requester_id === targetId || f.addressee_id === targetId
      )
      if (exists) return { error: 'پێشتر داواکاری/هاوڕێیەتی هەیە' }
      try {
        await sendFriendRequest(user.id, targetId)
        await load()
        return { ok: true }
      } catch (e) {
        return { error: e.message }
      }
    },
    [user, friendships, load]
  )

  // دۆخی پەیوەندی لەگەڵ بەکارهێنەرێک
  const friendStatusWith = useCallback(
    (otherId) => {
      if (!otherId || otherId === user?.id) return 'self'
      const f = friendships.find(
        (x) => x.requester_id === otherId || x.addressee_id === otherId
      )
      if (!f) return 'none'
      if (f.status === 'accepted') return 'friend'
      if (f.status === 'pending') return f.requester_id === user?.id ? 'outgoing' : 'incoming'
      return 'none'
    },
    [friendships, user]
  )

  const accept = useCallback(async (id) => { await respondFriendRequest(id, true); await load() }, [load])
  const reject = useCallback(async (id) => { await respondFriendRequest(id, false); await load() }, [load])
  const remove = useCallback(async (id) => { await removeFriendship(id); await load() }, [load])

  // ───── بلۆککردن ─────
  const block = useCallback(async (id) => {
    if (!user || id === user.id) return
    setBlocked((p) => (p.includes(id) ? p : [...p, id]))
    try { await blockUser(user.id, id) } catch { /* noop */ }
  }, [user])
  const unblock = useCallback(async (id) => {
    if (!user) return
    setBlocked((p) => p.filter((x) => x !== id))
    try { await unblockUser(user.id, id) } catch { /* noop */ }
  }, [user])
  const isBlocked = useCallback((id) => blocked.includes(id), [blocked])

  // پاککردنەوەی نەخوێندراوەکان بۆ هاوڕێیەک (دوای کردنەوەی گفتوگۆ)
  const clearUnread = useCallback((otherId) => {
    setUnread((prev) => {
      if (!prev[otherId]) return prev
      const next = { ...prev }
      delete next[otherId]
      return next
    })
  }, [])

  // ───── دەرهێنانەکان ─────
  const accepted = friendships.filter((f) => f.status === 'accepted')
  const friends = accepted
    .map((f) => {
      const otherId = f.requester_id === user?.id ? f.addressee_id : f.requester_id
      return { friendshipId: f.id, profile: profiles[otherId], id: otherId }
    })
    .filter((f) => f.profile)
  const incoming = friendships
    .filter((f) => f.status === 'pending' && f.addressee_id === user?.id)
    .map((f) => ({ friendshipId: f.id, profile: profiles[f.requester_id], id: f.requester_id }))
    .filter((f) => f.profile)
  const outgoing = friendships
    .filter((f) => f.status === 'pending' && f.requester_id === user?.id)
    .map((f) => ({ friendshipId: f.id, profile: profiles[f.addressee_id], id: f.addressee_id }))
    .filter((f) => f.profile)

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0)

  const value = {
    friends,
    incoming,
    outgoing,
    profiles,
    unread,
    totalUnread,
    addFriendByCode,
    addFriendById,
    friendStatusWith,
    accept,
    reject,
    remove,
    clearUnread,
    blocked,
    block,
    unblock,
    isBlocked,
    reload: load,
  }

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>
}

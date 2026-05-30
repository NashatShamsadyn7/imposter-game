// ═══════════════════════════════════════════════════════════
//  دۆخی ژوور — حاڵەتی ڕاستەوخۆ + ڕێڕەوی یاری
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { resolveCategory, pickRandomWord } from '../data/words'
import { resolveGame } from '../lib/scoring'
import {
  supabase,
  createRoom as apiCreateRoom,
  joinRoom as apiJoinRoom,
  leaveRoom as apiLeaveRoom,
  updateRoom,
  updatePlayer,
  reorderPlayers as apiReorder,
  fetchRoom,
  fetchPlayers,
  fetchMessages,
  fetchVotes,
  sendMessage as apiSendMessage,
  castVotes as apiCastVotes,
  clearVotes,
  addPoints,
  subscribeRoom,
} from '../lib/supabase'

const RoomContext = createContext(null)
export const useRoom = () => useContext(RoomContext)

const LS_ROOM = 'imposter:roomId'

export function RoomProvider({ children }) {
  const { user, profile } = useAuth()

  const [roomId, setRoomId] = useState(() => localStorage.getItem(LS_ROOM) || null)
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [messages, setMessages] = useState([])
  const [votes, setVotes] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const resultsRef = useRef(false)
  const prevStatusRef = useRef(null)

  // ───── هاوکاتکردنی ڕاستەوخۆ ─────
  const refreshAll = useCallback(async (rid) => {
    const [r, p, m, v] = await Promise.all([
      fetchRoom(rid),
      fetchPlayers(rid),
      fetchMessages(rid),
      fetchVotes(rid),
    ])
    setRoom(r)
    setPlayers(p)
    setMessages(m)
    setVotes(v)
    return r
  }, [])

  useEffect(() => {
    if (!roomId || !supabase) return
    let unsub = null
    let cancelled = false

    refreshAll(roomId).then((r) => {
      if (!r && !cancelled) {
        // ژوور نەماوە
        localStorage.removeItem(LS_ROOM)
        setRoomId(null)
      }
    })

    unsub = subscribeRoom(roomId, {
      onRoom: (payload) => {
        if (payload.eventType === 'DELETE') {
          localStorage.removeItem(LS_ROOM)
          setRoomId(null)
          setRoom(null)
        } else {
          setRoom(payload.new)
        }
      },
      onPlayers: () => fetchPlayers(roomId).then(setPlayers),
      onMessage: (msg) => setMessages((prev) => [...prev, msg]),
      onVote: () => fetchVotes(roomId).then(setVotes),
    })

    return () => {
      cancelled = true
      unsub?.()
    }
  }, [roomId, refreshAll])

  // کاتێک دەنگدان دەستپێدەکات، دەنگە کۆنەکان پاک بکەرەوە و دووبارە بیانهێنە.
  // (Supabase realtime ڕووداوەکانی DELETE بە فلتەر دەستەبەر ناکات، بۆیە
  //  ناتوانین پشت بە onVote ببەستین بۆ سڕینەوەی دەنگەکانی جۆلی پێشوو)
  useEffect(() => {
    if (!room) return
    if (room.status === 'voting' && prevStatusRef.current !== 'voting') {
      setVotes([])
      if (roomId) fetchVotes(roomId).then(setVotes)
    }
    prevStatusRef.current = room.status
  }, [room?.status, roomId])

  // ───── کردارەکانی ژوور ─────
  const createRoom = useCallback(
    async (settings) => {
      if (!user || !profile) return
      setBusy(true)
      setError(null)
      try {
        const r = await apiCreateRoom(user, profile, settings)
        localStorage.setItem(LS_ROOM, r.id)
        setRoomId(r.id)
      } catch (e) {
        setError(e.message)
      } finally {
        setBusy(false)
      }
    },
    [user, profile]
  )

  const joinRoom = useCallback(
    async (code) => {
      if (!user || !profile) return
      setBusy(true)
      setError(null)
      try {
        const r = await apiJoinRoom(code, user, profile)
        localStorage.setItem(LS_ROOM, r.id)
        setRoomId(r.id)
      } catch (e) {
        setError(e.message)
      } finally {
        setBusy(false)
      }
    },
    [user, profile]
  )

  const leaveRoom = useCallback(async () => {
    if (roomId && user) await apiLeaveRoom(roomId, user.id)
    localStorage.removeItem(LS_ROOM)
    setRoomId(null)
    setRoom(null)
    setPlayers([])
    setMessages([])
    setVotes([])
  }, [roomId, user])

  const isHost = room && user && room.host_id === user.id
  const me = players.find((p) => p.user_id === user?.id) || null

  // ───── ڕێکخستن (خانەخوێ) ─────
  const setSettings = useCallback(
    (patch) => {
      if (!isHost) return
      const map = {
        categoryId: 'category_id',
        impostorCount: 'impostor_count',
        discussionSeconds: 'discussion_seconds',
        multiplier: 'multiplier',
      }
      const dbPatch = {}
      Object.entries(patch).forEach(([k, v]) => (dbPatch[map[k] || k] = v))
      updateRoom(roomId, dbPatch)
    },
    [isHost, roomId]
  )

  const reorderPlayers = useCallback(
    (orderedIds) => {
      if (!isHost) return
      apiReorder(orderedIds, roomId)
    },
    [isHost, roomId]
  )

  const kickPlayer = useCallback(
    (uid) => {
      if (!isHost) return
      apiLeaveRoom(roomId, uid)
    },
    [isHost, roomId]
  )

  // ───── دەستپێکردنی یاری (خانەخوێ) ─────
  const startGame = useCallback(async () => {
    if (!isHost) return
    const category = resolveCategory(room.category_id)
    const word = pickRandomWord(category, room.secret_word_ku)

    const ids = players.map((p) => p.user_id)
    const shuffled = [...ids].sort(() => Math.random() - 0.5)
    const impostorIds = new Set(shuffled.slice(0, room.impostor_count))

    await clearVotes(roomId)
    await Promise.all(
      players.map((p) =>
        updatePlayer(roomId, p.user_id, {
          role: impostorIds.has(p.user_id) ? 'impostor' : 'crew',
          ejected: false,
          points_this_game: 0,
        })
      )
    )
    resultsRef.current = false
    await updateRoom(roomId, {
      status: 'reveal',
      category_id: category.id, // ئەگەر 'random' بوو، هاوپۆڵە دیاریکراوەکە هەڵدەگرێت
      secret_word_ku: word.ku,
      secret_word_en: word.en,
      turn_player_id: null,
    })
  }, [isHost, room, players, roomId])

  // دەستپێکردنی گفتوگۆ
  const beginDiscussion = useCallback(async () => {
    if (!isHost) return
    const ordered = [...players].sort((a, b) => a.order_index - b.order_index)
    const endsAt = new Date(Date.now() + room.discussion_seconds * 1000).toISOString()
    await updateRoom(roomId, {
      status: 'discussion',
      phase_ends_at: endsAt,
      turn_player_id: ordered[0]?.user_id || null,
    })
  }, [isHost, players, room, roomId])

  // نۆرەی دواتر بۆ وەسفکردن
  const nextTurn = useCallback(async () => {
    if (!isHost) return
    const ordered = [...players].sort((a, b) => a.order_index - b.order_index)
    const idx = ordered.findIndex((p) => p.user_id === room.turn_player_id)
    const next = ordered[idx + 1]
    await updateRoom(roomId, { turn_player_id: next?.user_id || null })
  }, [isHost, players, room, roomId])

  // دەستپێکردنی دەنگدان
  const beginVoting = useCallback(async () => {
    if (!isHost) return
    await clearVotes(roomId)
    await updateRoom(roomId, { status: 'voting', turn_player_id: null, phase_ends_at: null })
  }, [isHost, roomId])

  // دەنگدان
  const submitVote = useCallback(
    async (targetIds) => {
      if (!user) return
      await apiCastVotes(roomId, user.id, targetIds)
    },
    [roomId, user]
  )

  // کۆتاییهێنان و لێکدانەوەی ئەنجام (تەنها خانەخوێ)
  const finishGame = useCallback(async () => {
    if (!isHost || resultsRef.current) return
    resultsRef.current = true
    const freshVotes = await fetchVotes(roomId)
    const freshPlayers = await fetchPlayers(roomId)
    const { results, winner } = resolveGame(
      freshPlayers,
      freshVotes,
      room.impostor_count,
      room.multiplier
    )

    await Promise.all(
      results.map((r) =>
        updatePlayer(roomId, r.user_id, {
          points_this_game: r.points,
          ejected: r.ejected,
        })
      )
    )
    // زیادکردنی خاڵ بۆ پرۆفایلی هەموان
    await Promise.all(
      results.map((r) => {
        const won = winner === r.role
        return addPoints(r.user_id, r.points, won)
      })
    )
    await updateRoom(roomId, { status: 'results', winner_side: winner })
  }, [isHost, roomId, room])

  // یاری دووبارە — گەڕانەوە بۆ لۆبی
  const playAgain = useCallback(async () => {
    if (!isHost) return
    await clearVotes(roomId)
    await Promise.all(
      players.map((p) =>
        updatePlayer(roomId, p.user_id, { role: null, ejected: false, points_this_game: 0 })
      )
    )
    resultsRef.current = false
    await updateRoom(roomId, { status: 'lobby', turn_player_id: null, phase_ends_at: null })
  }, [isHost, players, roomId])

  // ───── کۆنترۆڵی مایک ─────
  // یاریزان داوای مایک دەکات
  const requestMic = useCallback(() => {
    if (!user || !roomId) return
    updatePlayer(roomId, user.id, { mic_requested: true })
  }, [user, roomId])

  // خانەخوێ ڕێگە دەدات/دەسەنێتەوە
  const setSpeak = useCallback(
    (uid, can) => {
      if (!isHost) return
      updatePlayer(roomId, uid, { can_speak: can, mic_requested: false })
    },
    [isHost, roomId]
  )

  // ───── چات ─────
  const sendMessage = useCallback(
    (content, kind = 'chat') => {
      if (!user || !profile || !content.trim()) return
      apiSendMessage(roomId, user, profile, content.trim().slice(0, 300), kind)
    },
    [roomId, user, profile]
  )

  const value = {
    roomId,
    room,
    players,
    messages,
    votes,
    me,
    isHost,
    error,
    busy,
    createRoom,
    joinRoom,
    leaveRoom,
    setSettings,
    reorderPlayers,
    kickPlayer,
    startGame,
    beginDiscussion,
    nextTurn,
    beginVoting,
    submitVote,
    finishGame,
    playAgain,
    sendMessage,
    requestMic,
    setSpeak,
  }

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>
}

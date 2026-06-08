// ═══════════════════════════════════════════════════════════
//  دۆخی ژوور — حاڵەتی ڕاستەوخۆ + ڕێڕەوی یاری
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useWords } from './WordsContext'
import { resolveGame } from '../lib/scoring'
import { ROOM_PRESENCE_INTERVAL, isPlayerOnline } from '../lib/presence'
import {
  supabase,
  createRoom as apiCreateRoom,
  joinRoom as apiJoinRoom,
  quickMatch as apiQuickMatch,
  addBot as apiAddBot,
  castBotVotes as apiCastBotVotes,
  botTurn as apiBotTurn,
  postBotMessage as apiPostBotMessage,
  leaveRoom as apiLeaveRoom,
  kickPlayer as apiKickPlayer,
  touchRoomPresence,
  claimHost as apiClaimHost,
  pruneStalePlayers as apiPruneStalePlayers,
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
  recordResult,
  subscribeRoom,
  assignRoles as apiAssignRoles,
  getMyRole as apiGetMyRole,
  getMyAllies as apiGetMyAllies,
  getDetectiveTarget as apiGetDetectiveTarget,
  getBotRoles as apiGetBotRoles,
  revealRoles as apiRevealRoles,
} from '../lib/supabase'

const RoomContext = createContext(null)
export const useRoom = () => useContext(RoomContext)

const LS_ROOM = 'imposter:roomId'

export function RoomProvider({ children }) {
  const { user, profile } = useAuth()
  const { resolveCategory, pickRandomWord, pickDecoyWord } = useWords()

  const [roomId, setRoomId] = useState(() => localStorage.getItem(LS_ROOM) || null)
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [messages, setMessages] = useState([])
  const [votes, setVotes] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const resultsRef = useRef(false)
  const prevStatusRef = useRef(null)
  const botVoteRef = useRef(new Set()) // بۆتانی ئەم جۆلەیان دەنگیان داوە
  const botCluedRef = useRef(new Set()) // بۆتانی ئەم جۆلە وەسفیان کردووە

  // ───── ڕۆڵە نهێنییەکان (P0#1) — کڵاینت تەنها زانیاری خۆی وەردەگرێت ─────
  const [myRole, setMyRole] = useState(null)         // ڕۆڵی خۆم (لە سێرڤەرەوە)
  const [myAllies, setMyAllies] = useState([])       // هاوپەیمانەکان (ئەگەر ساختەکار بم)
  const [detectiveTarget, setDetectiveTarget] = useState(null) // ئامانجی لێکۆڵەر
  const botRolesRef = useRef({})                     // { [bot_user_id]: role } — تەنها خانەخوێ

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

  // ───── هێنانی ڕۆڵی خۆم (P0#1) ─────
  // کاتێک یاری چالاکە (reveal/discussion/voting)، ڕۆڵی خۆم + هاوپەیمان +
  // ئامانجی لێکۆڵەر لە سێرڤەرەوە وەردەگرم. لە لۆبی/ئەنجام پاک دەکرێنەوە.
  const activeRolePhase = ['reveal', 'discussion', 'voting'].includes(room?.status)
  useEffect(() => {
    if (!roomId || !supabase) return
    if (!activeRolePhase) {
      setMyRole(null)
      setMyAllies([])
      setDetectiveTarget(null)
      botRolesRef.current = {}
      return
    }
    let cancelled = false
    ;(async () => {
      const role = await apiGetMyRole(roomId)
      if (cancelled) return
      setMyRole(role)
      if (role === 'impostor') {
        apiGetMyAllies(roomId).then((a) => !cancelled && setMyAllies(a))
      } else {
        setMyAllies([])
      }
      if (role === 'detective') {
        apiGetDetectiveTarget(roomId).then((t) => !cancelled && setDetectiveTarget(t))
      } else {
        setDetectiveTarget(null)
      }
      // خانەخوێ ڕۆڵی بۆتەکان وەردەگرێت بۆ بەڕێوەبردنیان (ئەگەر لەدەستچووبێت)
      if (room?.host_id === user?.id && !Object.keys(botRolesRef.current).length) {
        apiGetBotRoles(roomId).then((m) => { botRolesRef.current = m })
      }
    })()
    return () => { cancelled = true }
  }, [roomId, activeRolePhase, room?.host_id, user?.id])

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

  // یاری خێرا — ژوورێکی گشتی بدۆزەرەوە/دروستبکە و بەشداربە
  const quickPlay = useCallback(async () => {
    if (!user || !profile) return
    setBusy(true)
    setError(null)
    try {
      const r = await apiQuickMatch()
      await apiJoinRoom(r.code, user, profile)
      localStorage.setItem(LS_ROOM, r.id)
      setRoomId(r.id)
      // تجربەی یەکەم یاری باشتر: ئەگەر ژوورێکی نوێ دروستکرا (من خانەخوێم و
      // تەنها خۆم)، دوو بۆت زیاد بکە تاکو یەکسەر بتوانرێت دەست بە یاری بکرێت
      // (بەبێ چاوەڕوانی بەتەنها). یاریزانی ڕاستەقینەش دەتوانن دواتر بێنە ناوەوە.
      if (r.host_id === user.id) {
        try {
          await apiAddBot(r.id, 1, 1)
          await apiAddBot(r.id, 2, 2)
        } catch { /* بۆت زیادکردن سەرکەوتوو نەبوو — گرنگ نییە */ }
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }, [user, profile])

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

  // ئەگەر یاریزان دەرکرا (خانەخوێ ڕیزەکەی سڕییەوە)، ڕاستەوخۆ لە ژوور دەرچێت
  useEffect(() => {
    if (!room || !user || isHost) return
    if (players.length > 0 && !players.some((p) => p.user_id === user.id)) {
      setError('لە ژوورەکە دەرکرایت')
      leaveRoom()
    }
  }, [players, room, user, isHost, leaveRoom])

  // ───── نبضی حزووری ناو ژوور (P3) ─────
  // هەر ~١٢ چرکە (و کاتی گەڕانەوەی تاب) last_seen ـی خۆم نوێ دەکەمەوە تاکو
  // یاریزانانی تر بزانن من ئۆنلاینم و گواستنەوەی خانەخوێ بەهەڵە ڕووی نەدات.
  useEffect(() => {
    if (!roomId || !supabase) return
    touchRoomPresence(roomId)
    const iv = setInterval(() => touchRoomPresence(roomId), ROOM_PRESENCE_INTERVAL)
    const onVisible = () =>
      document.visibilityState === 'visible' && touchRoomPresence(roomId)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(iv)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [roomId])

  // ───── چاودێری خانەخوێ + پاککردنەوە (P2 + P3) ─────
  // ئەگەر خانەخوێ ئۆفلاین بوو، تاکە یاریزانی پێشەنگ (کۆنترین ئۆنلاین) داوای
  // خانەخوێیەتی دەکات — سێرڤەر بە دەترمینی حەکەم دەکات. بەمەش یاری ناوەستێت.
  // خانەخوێی ئێستاش هەر چرکەیەک یاریزانە دیرپچڕاوەکان دەسڕێتەوە (ghost cleanup).
  useEffect(() => {
    if (!roomId || !supabase || !user) return
    const tick = () => {
      // خانەخوێی ئێستا: پاککردنەوەی دڕکەکان
      if (isHost) {
        apiPruneStalePlayers(roomId).catch(() => {})
        return
      }
      // نا-خانەخوێ: ئایا خانەخوێ ئۆفلاینە؟
      const host = players.find((p) => p.user_id === room?.host_id)
      const hostOffline = !host || !isPlayerOnline(host.last_seen)
      if (!hostOffline) return
      // تەنها پێشەنگی ڕیز (کۆنترین یاریزانی ئۆنلاینی نا-بۆت) داوا دەکات،
      // تاکو هەموو کڵاینتەکان هاوکات بانگی نەکەن.
      const eligible = players
        .filter(
          (p) =>
            !p.is_bot &&
            !p.is_spectator &&
            p.user_id !== room?.host_id &&
            isPlayerOnline(p.last_seen)
        )
        .sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at))
      if (eligible[0]?.user_id === user.id) {
        apiClaimHost(roomId).catch(() => {})
      }
    }
    const iv = setInterval(tick, 8000)
    return () => clearInterval(iv)
  }, [roomId, user, isHost, players, room?.host_id])

  // ───── ڕێکخستن (خانەخوێ) ─────
  const setSettings = useCallback(
    (patch) => {
      if (!isHost) return
      const map = {
        categoryId: 'category_id',
        impostorCount: 'impostor_count',
        discussionSeconds: 'discussion_seconds',
        multiplier: 'multiplier',
        mode: 'mode',
        revealSeconds: 'reveal_seconds',
        locked: 'locked',
        allowLateJoin: 'allow_late_join',
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
      // دەرکردنی ڕاستەوخۆ + قەدەغەی ٢٠ چرکە (لە سێرڤەرەوە)
      apiKickPlayer(roomId, uid).catch(() => apiLeaveRoom(roomId, uid))
    },
    [isHost, roomId]
  )

  // زیادکردنی بۆت (تەنها خانەخوێ، تەنها لە لۆبی)
  const addBotPlayer = useCallback(async () => {
    if (!isHost) return
    const botCount = players.filter((p) => p.is_bot).length
    try {
      await apiAddBot(roomId, players.length, botCount + 1)
    } catch (e) {
      setError(e.message)
    }
  }, [isHost, players, roomId])

  // ───── دەنگدانی بۆتەکان (خانەخوێ بەڕێوەی دەبات) ─────
  // کاتێک قۆناغی دەنگدان دەستپێدەکات، خانەخوێ بۆ هەر بۆتێک دەنگ دەنێرێت:
  //  • بە یارمەتی مێشکی زیرەک (bot-turn) بەپێی ئاماژەکانی گفتوگۆ
  //  • ئەگەر API بەردەست نەبوو → دەنگی هەرەمەکی (fallback)
  useEffect(() => {
    if (room?.status !== 'voting') {
      botVoteRef.current = new Set()
      return
    }
    if (!isHost) return
    const active = players.filter((p) => !p.is_spectator)
    const lang = localStorage.getItem('imposter:lang') || 'ku'
    const clues = messages
      .filter((m) => m.kind === 'chat' || m.kind === 'clue')
      .slice(-20)
      .map((m) => ({ name: m.display_name, text: m.content }))
    active
      .filter((p) => p.is_bot)
      .forEach((bot) => {
        if (botVoteRef.current.has(bot.user_id)) return
        botVoteRef.current.add(bot.user_id)
        const candidates = active
          .filter((p) => p.user_id !== bot.user_id)
          .map((p) => ({ id: p.user_id, name: p.display_name }))
        if (!candidates.length) return
        const randomPicks = () =>
          [...candidates].sort(() => Math.random() - 0.5).slice(0, room.impostor_count).map((c) => c.id)
        ;(async () => {
          const botRole = botRolesRef.current[bot.user_id] || 'crew'
          const res = await apiBotTurn({
            action: 'vote',
            role: botRole,
            // طاقم وقت التصويت يعرف الكلمة → يحكم على بقية التلميحات بذكاء
            word: botRole === 'impostor' ? null : room.secret_word_ku,
            category: resolveCategory(room.category_id)?.name,
            lang,
            clues,
            candidates,
            impostorCount: room.impostor_count,
            botName: bot.display_name,
          })
          const picks = res?.targetIds?.length ? res.targetIds : randomPicks()
          apiCastBotVotes(roomId, bot.user_id, picks).catch(() => {})
        })()
      })
  }, [isHost, room?.status, room?.impostor_count, room?.secret_word_ku, room?.category_id, players, messages, roomId, resolveCategory])

  // ───── دەستپێکردنی یاری (خانەخوێ) ─────
  const startGame = useCallback(async () => {
    if (!isHost) return
    const category = resolveCategory(room.category_id)
    const word = pickRandomWord(category, room.secret_word_ku)
    // دۆخی «متخفّی»: ساختەکار وشەیەکی نزیکی هاوپۆڵ وەردەگرێت لە جیاتی هیچ
    const decoy = room.mode === 'undercover' ? pickDecoyWord(category, word.ku) : null

    await clearVotes(roomId)

    // P0#1: ڕۆڵەکان لە لای سێرڤەرەوە بە هەرەمەکی دابەش دەکرێن (room_roles).
    // کڵاینت ناتوانێت ڕۆڵی کەسانی تر ببینێت. assign_roles هاوکات
    // room_players.role بەتاڵ دەکاتەوە و ejected/points ڕیسێت دەکات.
    await apiAssignRoles(roomId, room.impostor_count, room.mode)

    // خانەخوێ ڕۆڵی بۆتەکان وەردەگرێت بۆ بەڕێوەبردنیان لە جۆلەکەدا
    botRolesRef.current = await apiGetBotRoles(roomId)

    resultsRef.current = false
    await updateRoom(roomId, {
      status: 'reveal',
      category_id: category.id, // ئەگەر 'random' بوو، هاوپۆڵە دیاریکراوەکە هەڵدەگرێت
      secret_word_ku: word.ku,
      secret_word_en: word.en,
      decoy_word_ku: decoy?.ku || null,
      decoy_word_en: decoy?.en || null,
      turn_player_id: null,
    })
  }, [isHost, room, roomId, resolveCategory, pickRandomWord, pickDecoyWord])

  // دەستپێکردنی گفتوگۆ
  const beginDiscussion = useCallback(async () => {
    if (!isHost) return
    const ordered = players
      .filter((p) => !p.is_spectator)
      .sort((a, b) => a.order_index - b.order_index)
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
    const ordered = players
      .filter((p) => !p.is_spectator)
      .sort((a, b) => a.order_index - b.order_index)
    const idx = ordered.findIndex((p) => p.user_id === room.turn_player_id)
    const next = ordered[idx + 1]
    await updateRoom(roomId, { turn_player_id: next?.user_id || null })
  }, [isHost, players, room, roomId])

  // ───── وەسفکردنی بۆتەکان لە گفتوگۆ (خانەخوێ بەڕێوەی دەبات) ─────
  // کاتێک نۆرەی بۆتێک دێت، خانەخوێ وەسفێکی زیرەک دروستدەکات، دەینێرێت،
  // پاشان نۆرە دەگوازێتەوە. ئەگەر API نەبوو، تەنها نۆرە دەگوازێتەوە.
  useEffect(() => {
    if (room?.status !== 'discussion') {
      botCluedRef.current = new Set()
      return
    }
    if (!isHost) return
    const turnId = room?.turn_player_id
    if (!turnId || botCluedRef.current.has(turnId)) return
    const bot = players.find((p) => p.user_id === turnId && p.is_bot)
    if (!bot) return
    botCluedRef.current.add(turnId)
    ;(async () => {
      const lang = localStorage.getItem('imposter:lang') || 'ku'
      const clues = messages
        .filter((m) => m.kind === 'chat' || m.kind === 'clue')
        .slice(-12)
        .map((m) => ({ name: m.display_name, text: m.content }))
      const botRole = botRolesRef.current[bot.user_id] || 'crew'
      const activeCount = players.filter((p) => !p.is_spectator).length || 1
      const totalClues = messages.filter((m) => m.kind === 'chat' || m.kind === 'clue').length
      const cat = resolveCategory(room.category_id)
      const res = await apiBotTurn({
        action: 'describe',
        role: botRole,
        word: botRole === 'impostor' ? null : room.secret_word_ku,
        category: cat?.name,
        // المخادع ياخذ قائمة كلمات المجموعة → يستنتج الكلمة السرية بدقة (ذكاء عالٍ)
        wordPool: botRole === 'impostor' ? (cat?.words || []).map((w) => w.ku).filter(Boolean) : undefined,
        lang,
        clues,
        round: Math.floor(totalClues / activeCount) + 1,
        botName: bot.display_name,
      })
      if (res?.text) {
        try {
          await apiPostBotMessage(roomId, bot.user_id, bot.display_name, bot.avatar_url, res.text)
        } catch { /* noop */ }
      }
      // دوای ماوەیەکی کورت نۆرە بگوازەوە (تەنانەت ئەگەر وەسف نەنێردرا)
      setTimeout(() => { nextTurn() }, 1600)
    })()
  }, [isHost, room?.status, room?.turn_player_id, players, messages, roomId, nextTurn, room, resolveCategory])

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
    // P0#1: ڕۆڵەکان لە سێرڤەرەوە ئاشکرا دەکرێن (یاری تەواوبووە) و
    // دەخرێنە سەر room_players. پاشان لۆجیکی تاقیکراوی scoring.js بەکاردێنین.
    const roleMap = await apiRevealRoles(roomId)
    const freshPlayers = (await fetchPlayers(roomId)).map((p) => ({
      ...p,
      role: p.role ?? roleMap[p.user_id] ?? null,
    }))
    // بینەرەکان لە لێکدانەوەی ئەنجام بەدەر دەکرێن
    const active = freshPlayers.filter((p) => !p.is_spectator)
    const { results, winner } = resolveGame(
      active,
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
    // تۆمارکردنی ئەنجام + زیادکردنی خاڵ (بۆتەکان تۆمار ناکرێن — پرۆفایلیان نییە)
    await Promise.all(
      results
        .filter((r) => !active.find((p) => p.user_id === r.user_id)?.is_bot)
        .map((r) => {
          const won = winner === r.role
          return recordResult(r.user_id, r.points, won, r.role, room.category_id, room.secret_word_ku)
        })
    )
    await updateRoom(roomId, { status: 'results', winner_side: winner })
  }, [isHost, roomId, room])

  // یاری دووبارە — گەڕانەوە بۆ لۆبی
  const playAgain = useCallback(async () => {
    if (!isHost) return
    await clearVotes(roomId)
    // بینەرەکانیش دەبنەوە یاریزان بۆ یاری داهاتوو
    await Promise.all(
      players.map((p) =>
        updatePlayer(roomId, p.user_id, {
          role: null,
          ejected: false,
          points_this_game: 0,
          is_spectator: false,
        })
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
    (content, kind = 'chat', bubble = null) => {
      if (!user || !profile || !content.trim()) return
      apiSendMessage(roomId, user, profile, content.trim().slice(0, 300), kind, bubble)
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
    myRole,
    myAllies,
    detectiveTarget,
    createRoom,
    joinRoom,
    quickPlay,
    leaveRoom,
    setSettings,
    reorderPlayers,
    kickPlayer,
    addBotPlayer,
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

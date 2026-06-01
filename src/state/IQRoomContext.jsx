// ═══════════════════════════════════════════════════════════
//  دۆخی ژووری IQ ـی ئۆنلاین — خێرایی (خێراترین وەڵامی ڕاست)
//  خانەخوێ پێشکەوتنی خۆکار بەڕێوەدەبات (تایمەر → ئاشکراکردن → دواتر)
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { pickQuestions } from '../data/iq'
import {
  iqCreateRoom, iqJoinRoom, iqLeaveRoom, iqUpdateRoom,
  iqFetchRoom, iqFetchPlayers, iqFetchAnswers, iqSubmitAnswer,
  subscribeIQRoom, addPoints, supabase,
} from '../lib/supabase'

const IQRoomContext = createContext(null)
export const useIQRoom = () => useContext(IQRoomContext)

const LS = 'iq:roomId'
const REVEAL_MS = 4000 // ماوەی پیشاندانی وەڵامی ڕاست

// خاڵی هەر پرسیار: وەڵامی ڕاست + پاداشتی خێرایی
function scoreFor(isCorrect, ms, secondsPerQ) {
  if (!isCorrect) return 0
  const frac = Math.min(1, ms / (secondsPerQ * 1000))
  return Math.max(100, Math.round(1000 - frac * 600))
}

export function IQRoomProvider({ children }) {
  const { user, profile } = useAuth()
  const [roomId, setRoomId] = useState(() => localStorage.getItem(LS) || null)
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [answers, setAnswers] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const pointsSavedRef = useRef(false)

  const isHost = room && user && room.host_id === user.id

  // ───── هاوکاتکردنی ڕاستەوخۆ ─────
  const refreshAll = useCallback(async (rid) => {
    const [r, p, a] = await Promise.all([iqFetchRoom(rid), iqFetchPlayers(rid), iqFetchAnswers(rid)])
    setRoom(r); setPlayers(p); setAnswers(a)
    return r
  }, [])

  useEffect(() => {
    if (!roomId || !supabase) return
    let cancelled = false
    refreshAll(roomId).then((r) => {
      if (!r && !cancelled) { localStorage.removeItem(LS); setRoomId(null) }
    })
    const unsub = subscribeIQRoom(roomId, {
      onRoom: (payload) => {
        if (payload.eventType === 'DELETE') { localStorage.removeItem(LS); setRoomId(null); setRoom(null) }
        else setRoom(payload.new)
      },
      onPlayers: () => iqFetchPlayers(roomId).then(setPlayers),
      onAnswers: () => iqFetchAnswers(roomId).then(setAnswers),
    })
    return () => { cancelled = true; unsub?.() }
  }, [roomId, refreshAll])

  // ───── کردارەکان ─────
  const createRoom = useCallback(async (settings) => {
    if (!user || !profile) return
    setBusy(true); setError(null)
    try {
      const r = await iqCreateRoom(user, profile, settings)
      localStorage.setItem(LS, r.id); setRoomId(r.id)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }, [user, profile])

  const joinRoom = useCallback(async (code) => {
    if (!user || !profile) return
    setBusy(true); setError(null)
    try {
      const r = await iqJoinRoom(code, user, profile)
      localStorage.setItem(LS, r.id); setRoomId(r.id)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }, [user, profile])

  const leaveRoom = useCallback(async () => {
    if (roomId && user) await iqLeaveRoom(roomId, user.id)
    localStorage.removeItem(LS); setRoomId(null); setRoom(null); setPlayers([]); setAnswers([])
  }, [roomId, user])

  // خانەخوێ: دەستپێکردنی یاری
  const startGame = useCallback(async () => {
    if (!isHost) return
    const qs = pickQuestions(room.category_id, room.question_count)
    pointsSavedRef.current = false
    await iqUpdateRoom(roomId, {
      questions: qs, status: 'playing', current_index: 0,
      question_started_at: new Date().toISOString(),
    })
  }, [isHost, room, roomId])

  // یاریزان: ناردنی وەڵام
  const submitAnswer = useCallback(async (choiceIdx) => {
    if (!room || !user || room.status !== 'playing') return
    const q = room.questions?.[room.current_index]
    if (!q) return
    const started = new Date(room.question_started_at).getTime()
    const ms = Math.max(0, Date.now() - started)
    const isCorrect = choiceIdx === q.correct
    await iqSubmitAnswer({
      room_id: roomId, q_index: room.current_index, user_id: user.id,
      display_name: profile.display_name, avatar_url: profile.avatar_url,
      choice: choiceIdx ?? -1, is_correct: isCorrect, ms,
      points: scoreFor(isCorrect, ms, room.seconds_per_q),
    })
  }, [room, user, profile, roomId])

  // وەڵامی من بۆ پرسیاری ئێستا
  const myAnswer = useMemo(() => {
    if (!room || !user) return null
    return answers.find((a) => a.user_id === user.id && a.q_index === room.current_index) || null
  }, [answers, room, user])

  // ژمارەی وەڵامەکانی پرسیاری ئێستا
  const answeredCount = useMemo(
    () => (room ? answers.filter((a) => a.q_index === room.current_index).length : 0),
    [answers, room]
  )

  // پێشەنگی گشتی (کۆی خاڵ بۆ هەر یاریزان)
  const scoreboard = useMemo(() => {
    const totals = {}
    players.forEach((p) => { totals[p.user_id] = { ...p, score: 0 } })
    answers.forEach((a) => {
      if (!totals[a.user_id]) totals[a.user_id] = { user_id: a.user_id, display_name: a.display_name, avatar_url: a.avatar_url, score: 0 }
      totals[a.user_id].score += a.points || 0
    })
    return Object.values(totals).sort((x, y) => y.score - x.score)
  }, [players, answers])

  // ───── خانەخوێ: بەڕێوەبردنی خۆکاری پێشکەوتن ─────
  // 1) لە دۆخی playing: کاتێک کات تەواو بوو یان هەمووان وەڵامیان دا → reveal
  useEffect(() => {
    if (!isHost || !room || room.status !== 'playing' || !room.question_started_at) return
    const started = new Date(room.question_started_at).getTime()
    const endsAt = started + room.seconds_per_q * 1000
    const everyoneAnswered = players.length > 0 && answeredCount >= players.length

    if (everyoneAnswered) { iqUpdateRoom(roomId, { status: 'reveal' }); return }

    const ms = Math.max(0, endsAt - Date.now())
    const t = setTimeout(() => iqUpdateRoom(roomId, { status: 'reveal' }), ms + 200)
    return () => clearTimeout(t)
  }, [isHost, room, roomId, players.length, answeredCount])

  // 2) لە دۆخی reveal: دوای ماوەیەک → پرسیاری دواتر یان ئەنجام
  useEffect(() => {
    if (!isHost || !room || room.status !== 'reveal') return
    const t = setTimeout(() => {
      const next = room.current_index + 1
      if (next >= (room.questions?.length || 0)) {
        iqUpdateRoom(roomId, { status: 'results' })
      } else {
        iqUpdateRoom(roomId, { status: 'playing', current_index: next, question_started_at: new Date().toISOString() })
      }
    }, REVEAL_MS)
    return () => clearTimeout(t)
  }, [isHost, room, roomId])

  // 3) لە کۆتایی: خاڵ زیاد بکە بۆ پرۆفایلی هەر یاریزانێک (تەنها خانەخوێ، یەک جار)
  useEffect(() => {
    if (!isHost || !room || room.status !== 'results' || pointsSavedRef.current) return
    pointsSavedRef.current = true
    const top = scoreboard[0]
    scoreboard.forEach((s) => {
      const won = top && s.user_id === top.user_id && s.score > 0
      if (s.score > 0) addPoints(s.user_id, Math.round(s.score / 10), won).catch(() => {})
    })
  }, [isHost, room?.status, scoreboard])

  // یاری دووبارە — گەڕانەوە بۆ لۆبی
  const playAgain = useCallback(async () => {
    if (!isHost) return
    if (roomId) await supabase.from('iq_answers').delete().eq('room_id', roomId)
    pointsSavedRef.current = false
    await iqUpdateRoom(roomId, { status: 'lobby', current_index: 0, questions: null, question_started_at: null })
  }, [isHost, roomId])

  const value = {
    roomId, room, players, answers, error, busy,
    isHost, myAnswer, answeredCount, scoreboard,
    createRoom, joinRoom, leaveRoom, startGame, submitAnswer, playAgain,
  }
  return <IQRoomContext.Provider value={value}>{children}</IQRoomContext.Provider>
}

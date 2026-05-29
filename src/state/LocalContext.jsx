// ═══════════════════════════════════════════════════════════
//  مۆدی ناوخۆیی (Pass-and-Play) — یەک ئامێر، بێ ئینتەرنێت/چوونەژوورەوە
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { resolveCategory, pickRandomWord, CATEGORIES, RANDOM_CATEGORY } from '../data/words'
import { resolveGame } from '../lib/scoring'
import { sfx } from '../lib/sound'

const LocalContext = createContext(null)
export const useLocal = () => useContext(LocalContext)

const MAX_PLAYERS = 40
const STORAGE_KEY = 'imposter:local:v1'

const DEFAULT_SETTINGS = {
  categoryId: CATEGORIES[0].id,
  impostorCount: 1,
  discussionSeconds: 60,
  multiplier: 1,
}

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

export function LocalProvider({ children }) {
  const saved = loadLocal()

  const [players, setPlayers] = useState(
    saved?.players || [
      { id: makeId(), name: 'یاریزان ١' },
      { id: makeId(), name: 'یاریزان ٢' },
      { id: makeId(), name: 'یاریزان ٣' },
    ]
  )
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS, ...(saved?.settings || {}) })
  const [scores, setScores] = useState(saved?.scores || {}) // {playerId: totalPoints}
  const [phase, setPhase] = useState('lobby')
  const [game, setGame] = useState(null)

  // پاشەکەوتی ناوخۆیی
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, settings, scores }))
    } catch {
      /* ئاسایی */
    }
  }, [players, settings, scores])

  // ───── ڕۆستەر ─────
  const addPlayer = useCallback((name) => {
    setPlayers((r) => {
      if (r.length >= MAX_PLAYERS) return r
      const clean = (name || '').trim() || `یاریزان ${r.length + 1}`
      return [...r, { id: makeId(), name: clean }]
    })
  }, [])
  const removePlayer = useCallback((id) => setPlayers((r) => r.filter((p) => p.id !== id)), [])
  const renamePlayer = useCallback(
    (id, name) => setPlayers((r) => r.map((p) => (p.id === id ? { ...p, name } : p))),
    []
  )
  const movePlayer = useCallback((idx, dir) => {
    setPlayers((r) => {
      const arr = [...r]
      const j = idx + dir
      if (j < 0 || j >= arr.length) return r
      ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
      return arr
    })
  }, [])
  const updateSettings = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), [])

  // ───── دەستپێکردن ─────
  const startGame = useCallback(() => {
    const category = resolveCategory(settings.categoryId)
    const word = pickRandomWord(category, game?.secretWord?.ku)
    const ids = players.map((p) => p.id)
    const shuffled = [...ids].sort(() => Math.random() - 0.5)
    const impostorIds = new Set(shuffled.slice(0, settings.impostorCount))

    setGame({
      players: players.map((p) => ({
        id: p.id,
        name: p.name,
        role: impostorIds.has(p.id) ? 'impostor' : 'crew',
      })),
      category,
      secretWord: word,
      revealIndex: 0,
      results: null,
      winner: null,
    })
    setPhase('reveal')
  }, [players, settings, game])

  const nextReveal = useCallback(() => {
    setGame((g) => {
      if (!g) return g
      const next = g.revealIndex + 1
      if (next >= g.players.length) {
        setPhase('discussion')
        return { ...g, revealIndex: g.players.length }
      }
      return { ...g, revealIndex: next }
    })
  }, [])

  const goToVoting = useCallback(() => setPhase('voting'), [])

  // votesList: [{voterId, targetIds:[...]}]
  const finishGame = useCallback(
    (votesList) => {
      setGame((g) => {
        if (!g) return g
        // گۆڕین بۆ فۆرماتی resolveGame
        const gp = g.players.map((p) => ({
          user_id: p.id,
          display_name: p.name,
          avatar_url: null,
          role: p.role,
        }))
        const votes = []
        votesList.forEach((v) =>
          v.targetIds.forEach((t) => votes.push({ voter_id: v.voterId, target_id: t }))
        )
        const { results, winner } = resolveGame(gp, votes, settings.impostorCount, settings.multiplier)

        // زیادکردنی خاڵ بۆ کۆی کۆبوونەوەکە
        setScores((prev) => {
          const next = { ...prev }
          results.forEach((r) => {
            next[r.user_id] = (next[r.user_id] || 0) + r.points
          })
          return next
        })

        setPhase('results')
        return { ...g, results, winner }
      })
    },
    [settings]
  )

  const playAgain = useCallback(() => {
    setGame(null)
    setPhase('lobby')
  }, [])

  const resetScores = useCallback(() => setScores({}), [])

  const value = {
    MAX_PLAYERS,
    CATEGORIES,
    players,
    settings,
    scores,
    phase,
    game,
    addPlayer,
    removePlayer,
    renamePlayer,
    movePlayer,
    updateSettings,
    startGame,
    nextReveal,
    goToVoting,
    finishGame,
    playAgain,
    resetScores,
  }

  return <LocalContext.Provider value={value}>{children}</LocalContext.Provider>
}

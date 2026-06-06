// تاقیکردنەوەی لۆجیکی دەنگدان و خاڵدان
import { describe, it, expect } from 'vitest'
import {
  tallyVotes,
  computeEjected,
  resolveGame,
  XP,
} from './scoring.js'

describe('tallyVotes', () => {
  it('counts votes per target', () => {
    const votes = [
      { voter_id: 'a', target_id: 'x' },
      { voter_id: 'b', target_id: 'x' },
      { voter_id: 'c', target_id: 'y' },
    ]
    expect(tallyVotes(votes)).toEqual({ x: 2, y: 1 })
  })

  it('returns empty object for no votes', () => {
    expect(tallyVotes([])).toEqual({})
  })
})

describe('computeEjected', () => {
  const players = [{ user_id: 'a' }, { user_id: 'b' }, { user_id: 'c' }]

  it('ejects the top N most-voted players', () => {
    const counts = { a: 3, b: 1, c: 0 }
    const ejected = computeEjected(players, counts, 1)
    expect([...ejected]).toEqual(['a'])
  })

  it('never ejects a player with zero votes', () => {
    const counts = { a: 0, b: 0, c: 0 }
    const ejected = computeEjected(players, counts, 2)
    expect(ejected.size).toBe(0)
  })

  it('ejects up to impostorCount when enough have votes', () => {
    const counts = { a: 5, b: 3, c: 1 }
    const ejected = computeEjected(players, counts, 2)
    expect([...ejected].sort()).toEqual(['a', 'b'])
  })
})

describe('resolveGame', () => {
  const players = [
    { user_id: 'imp', display_name: 'Imp', role: 'impostor' },
    { user_id: 'c1', display_name: 'C1', role: 'crew' },
    { user_id: 'c2', display_name: 'C2', role: 'crew' },
  ]

  it('crew wins when the impostor is ejected', () => {
    const votes = [
      { voter_id: 'c1', target_id: 'imp' },
      { voter_id: 'c2', target_id: 'imp' },
    ]
    const { winner, ejected } = resolveGame(players, votes, 1)
    expect(winner).toBe('crew')
    expect(ejected).toContain('imp')
  })

  it('impostor wins when not ejected', () => {
    const votes = [
      { voter_id: 'c1', target_id: 'c2' },
      { voter_id: 'imp', target_id: 'c2' },
    ]
    const { winner } = resolveGame(players, votes, 1)
    expect(winner).toBe('impostor')
  })

  it('rewards crew who voted correctly', () => {
    const votes = [
      { voter_id: 'c1', target_id: 'imp' },
      { voter_id: 'c2', target_id: 'imp' },
    ]
    const { results } = resolveGame(players, votes, 1)
    const c1 = results.find((r) => r.user_id === 'c1')
    // play + crewCorrect + crewWin
    expect(c1.points).toBe(XP.play + XP.crewCorrect + XP.crewWin)
  })

  it('gives impostor the clean bonus when receiving no votes', () => {
    const votes = [{ voter_id: 'c1', target_id: 'c2' }]
    const { results } = resolveGame(players, votes, 1)
    const imp = results.find((r) => r.user_id === 'imp')
    expect(imp.points).toBe(XP.play + XP.impostorClean)
  })

  it('applies the multiplier to points', () => {
    const votes = [{ voter_id: 'c1', target_id: 'c2' }]
    const { results } = resolveGame(players, votes, 1, 2)
    const imp = results.find((r) => r.user_id === 'imp')
    expect(imp.points).toBe((XP.play + XP.impostorClean) * 2)
  })
})

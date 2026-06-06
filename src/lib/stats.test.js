// تاقیکردنەوەی لێکدانەوەی ئامار
import { describe, it, expect } from 'vitest'
import { computeStats } from './stats.js'

describe('computeStats', () => {
  it('returns zeroed stats for an empty history', () => {
    const s = computeStats([])
    expect(s.games).toBe(0)
    expect(s.winRate).toBe(0)
    expect(s.favoriteCategory).toBeNull()
    expect(s.recentForm).toEqual([])
  })

  it('aggregates games, wins and losses', () => {
    const s = computeStats([
      { role: 'crew', won: true, points: 30, category_id: 'food' },
      { role: 'crew', won: false, points: 5, category_id: 'food' },
      { role: 'impostor', won: true, points: 35, category_id: 'sport' },
    ])
    expect(s.games).toBe(3)
    expect(s.wins).toBe(2)
    expect(s.losses).toBe(1)
    expect(s.winRate).toBe(67) // round(2/3*100)
    expect(s.points).toBe(70)
  })

  it('splits impostor vs crew win rates', () => {
    const s = computeStats([
      { role: 'impostor', won: true, category_id: 'a' },
      { role: 'impostor', won: false, category_id: 'a' },
      { role: 'crew', won: true, category_id: 'a' },
    ])
    expect(s.asImpostor).toBe(2)
    expect(s.impostorWins).toBe(1)
    expect(s.impostorWinRate).toBe(50)
    expect(s.asCrew).toBe(1)
    expect(s.crewWinRate).toBe(100)
  })

  it('finds the most-played category as favorite', () => {
    const s = computeStats([
      { role: 'crew', category_id: 'food' },
      { role: 'crew', category_id: 'food' },
      { role: 'crew', category_id: 'sport' },
    ])
    expect(s.favoriteCategory).toBe('food')
    expect(s.favoriteCount).toBe(2)
  })

  it('buckets missing category under "unknown"', () => {
    const s = computeStats([{ role: 'crew' }])
    expect(s.favoriteCategory).toBe('unknown')
  })

  it('caps recent form at the latest 10 results', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      role: 'crew',
      won: i % 2 === 0,
      category_id: 'a',
    }))
    const s = computeStats(many)
    expect(s.recentForm).toHaveLength(10)
    expect(s.recentForm[0]).toBe(true)
  })
})

// تاقیکردنەوەی پلەبەندی
import { describe, it, expect } from 'vitest'
import { rankInfo, RANKS, RANK_START } from './rank.js'

describe('rankInfo', () => {
  it('defaults to the bronze rank at the start points', () => {
    const info = rankInfo(RANK_START)
    expect(info.rank.id).toBe('bronze')
    expect(info.next.id).toBe('silver')
  })

  it('returns the highest rank with no next at the top', () => {
    const info = rankInfo(9999)
    expect(info.rank.id).toBe('legend')
    expect(info.next).toBeNull()
    expect(info.progress).toBe(1)
  })

  it('picks the correct rank at exact thresholds', () => {
    expect(rankInfo(1100).rank.id).toBe('silver')
    expect(rankInfo(1300).rank.id).toBe('gold')
    expect(rankInfo(2600).rank.id).toBe('legend')
  })

  it('clamps negative points to bronze', () => {
    const info = rankInfo(-500)
    expect(info.rank.id).toBe('bronze')
    expect(info.points).toBe(0)
  })

  it('computes fractional progress toward the next rank', () => {
    // halfway between bronze(0) and silver(1100)
    const info = rankInfo(550)
    expect(info.progress).toBeCloseTo(0.5, 5)
  })

  it('uses RANK_START when called with no argument', () => {
    expect(rankInfo().rank.id).toBe('bronze')
  })

  it('keeps RANKS sorted ascending by min', () => {
    const mins = RANKS.map((r) => r.min)
    expect([...mins].sort((a, b) => a - b)).toEqual(mins)
  })
})

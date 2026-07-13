import { describe, expect, it } from 'vitest'
import { FOOTBALL_PLAYERS, PLAYER_COUNT, buildDraftPool } from '../data/footballCatalog'
import { runWorldCup, simulateMatch } from './football'

describe('football market game', () => {
  it('has more than 1,500 league-tagged player cards', () => {
    expect(PLAYER_COUNT).toBeGreaterThan(1500)
    expect(FOOTBALL_PLAYERS.every((player) => player.name && player.club && player.leagueId && player.price > 0 && player.image_url && player.heightCm && player.weightKg && player.jump)).toBe(true)
  })

  it('creates a role-balanced draft and completes an eight-team World Cup', () => {
    const pool = buildDraftPool(4, 5)
    expect(pool).toHaveLength(20)
    expect(pool.filter((player) => player.position === 'GK')).toHaveLength(4)
    const teams = Array.from({ length: 4 }, (_, index) => ({
      id: `team-${index}`, name: `Team ${index + 1}`, budget: 100,
      players: pool.slice(index * 5, index * 5 + 5),
    }))
    const cup = runWorldCup(teams, 5)
    expect(cup.groups).toHaveLength(2)
    expect(cup.groups.every((group) => group.matches.length === 6)).toBe(true)
    expect(cup.semiFinals).toHaveLength(2)
    expect(cup.champion).toBeTruthy()
    expect(cup.final.winner).toBeTruthy()
    expect(simulateMatch(teams[0], teams[1]).homeGoals).toBeGreaterThanOrEqual(0)
  })
})

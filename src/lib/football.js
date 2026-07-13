import { FOOTBALL_PLAYERS, shuffle } from '../data/footballCatalog'

function average(players, key = 'rating') {
  if (!players.length) return 50
  return Math.round(players.reduce((total, player) => total + (player[key] || 0), 0) / players.length)
}

export function teamPower(team) {
  const squad = team.players || []
  const base = average(squad)
  const positions = new Set(squad.map((player) => player.position))
  const balance = ['GK', 'DEF', 'MID', 'FWD'].filter((position) => positions.has(position)).length * 2
  return Math.min(99, base + balance)
}

function scorer(team, index) {
  const attackers = team.players.filter((player) => player.position === 'FWD' || player.position === 'MID')
  const list = attackers.length ? attackers : team.players
  return list[index % list.length]?.name || 'Unknown Player'
}

export function simulateMatch(home, away, { knockout = false } = {}) {
  const homePower = teamPower(home) + Math.floor(Math.random() * 10)
  const awayPower = teamPower(away) + Math.floor(Math.random() * 10)
  let homeGoals = Math.max(0, Math.min(6, Math.round((homePower - 56) / 15 + Math.random() * 2 - 0.6)))
  let awayGoals = Math.max(0, Math.min(6, Math.round((awayPower - 56) / 15 + Math.random() * 2 - 0.6)))
  let penalties = null
  if (knockout && homeGoals === awayGoals) {
    const homePens = 3 + Math.floor(Math.random() * 3) + (homePower > awayPower ? 1 : 0)
    const awayPens = 3 + Math.floor(Math.random() * 3) + (awayPower > homePower ? 1 : 0)
    penalties = homePens === awayPens ? { home: homePens + 1, away: awayPens } : { home: homePens, away: awayPens }
  }
  const winner = penalties
    ? penalties.home > penalties.away ? home.id : away.id
    : homeGoals === awayGoals ? null : homeGoals > awayGoals ? home.id : away.id
  const winnerTeam = winner === home.id ? home : winner === away.id ? away : null
  const topPlayer = winnerTeam ? scorer(winnerTeam, 0) : scorer(home, 0)
  return {
    home, away, homeGoals, awayGoals, penalties, winner,
    homeScorers: Array.from({ length: homeGoals }, (_, index) => scorer(home, index)),
    awayScorers: Array.from({ length: awayGoals }, (_, index) => scorer(away, index)),
    topPlayer,
    homePower: teamPower(home), awayPower: teamPower(away),
  }
}

function groupTable(group, results) {
  const table = group.map((team) => ({ team, played: 0, points: 0, goalDifference: 0, goals: 0 }))
  results.forEach((match) => {
    const home = table.find((item) => item.team.id === match.home.id)
    const away = table.find((item) => item.team.id === match.away.id)
    home.played += 1; away.played += 1
    home.goals += match.homeGoals; away.goals += match.awayGoals
    home.goalDifference += match.homeGoals - match.awayGoals
    away.goalDifference += match.awayGoals - match.homeGoals
    if (match.homeGoals > match.awayGoals) home.points += 3
    else if (match.awayGoals > match.homeGoals) away.points += 3
    else { home.points += 1; away.points += 1 }
  })
  return table.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goals - a.goals)
}

function makeBotTeam(index, squadSize, excluded) {
  const pool = shuffle(FOOTBALL_PLAYERS.filter((player) => !excluded.has(player.id)))
  const players = pool.slice(0, squadSize)
  players.forEach((player) => excluded.add(player.id))
  return { id: `bot-${index}`, name: `AI Club ${index + 1}`, players, budget: 0, isBot: true }
}

export function runWorldCup(humanTeams, squadSize) {
  const excluded = new Set(humanTeams.flatMap((team) => team.players.map((player) => player.id)))
  const teams = [...humanTeams]
  while (teams.length < 8) teams.push(makeBotTeam(teams.length, squadSize, excluded))
  const seeded = shuffle(teams).slice(0, 8)
  const groups = [seeded.slice(0, 4), seeded.slice(4, 8)]
  const groupResults = groups.map((group) => {
    const matches = []
    for (let i = 0; i < group.length; i += 1) for (let j = i + 1; j < group.length; j += 1) matches.push(simulateMatch(group[i], group[j]))
    return { teams: group, matches, table: groupTable(group, matches) }
  })
  const [a, b] = groupResults
  const semiFinals = [
    simulateMatch(a.table[0].team, b.table[1].team, { knockout: true }),
    simulateMatch(b.table[0].team, a.table[1].team, { knockout: true }),
  ]
  const final = simulateMatch(
    semiFinals[0].winner === semiFinals[0].home.id ? semiFinals[0].home : semiFinals[0].away,
    semiFinals[1].winner === semiFinals[1].home.id ? semiFinals[1].home : semiFinals[1].away,
    { knockout: true }
  )
  const champion = final.winner === final.home.id ? final.home : final.away
  return { teams: seeded, groups: groupResults, semiFinals, final, champion }
}

export function localCommentary(match) {
  const winner = match.winner === match.home.id ? match.home : match.winner === match.away.id ? match.away : null
  if (!winner) return `یاریی نێوان ${match.home.name} و ${match.away.name} بە یەکسانی تەواو بوو. ${match.topPlayer} کاریگەریی زۆری هەبوو.`
  const score = `${match.homeGoals}–${match.awayGoals}`
  const penalty = match.penalties ? ` دوای پێنالتی ${match.penalties.home}–${match.penalties.away}.` : ''
  return `${winner.name} بە ئەنجامی ${score} سەرکەوت.${penalty} ${match.topPlayer} یاریزانی یاری بوو؛ هێزی تیم و ڕێکخستنی خانەکان جیاوازی دروست کرد.`
}

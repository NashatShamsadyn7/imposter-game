// ═══════════════════════════════════════════════════════════
//  لۆجیکی دەنگدان و خاڵدان
// ═══════════════════════════════════════════════════════════

// کۆکردنەوەی دەنگەکان → ژمارەی دەنگ بۆ هەر یاریزانێک
export function tallyVotes(votes) {
  const counts = {}
  votes.forEach((v) => {
    counts[v.target_id] = (counts[v.target_id] || 0) + 1
  })
  return counts
}

// دیاریکردنی ئەو N کەسەی دەردەکرێن (زۆرترین دەنگ)
export function computeEjected(players, counts, impostorCount) {
  const ranked = [...players]
    .map((p) => ({ id: p.user_id, votes: counts[p.user_id] || 0 }))
    .filter((p) => p.votes > 0)
    .sort((a, b) => b.votes - a.votes)

  const ejected = new Set()
  for (const p of ranked) {
    if (ejected.size >= impostorCount) break
    ejected.add(p.id)
  }
  return ejected
}

// ───── خاڵی دەستەی کەشتی ─────
// = ژمارەی ساختەکارە دروستەکان لە هەڵبژاردنەکانیدا (لانیکەم ١)
function crewScore(myVoteTargetIds, impostorIds) {
  let correct = 0
  myVoteTargetIds.forEach((t) => {
    if (impostorIds.has(t)) correct++
  })
  return Math.max(1, correct)
}

// ───── خاڵی ساختەکار ─────
// ڕزگاربوو: ٠ دەنگ→٣ | ١–٢ دەنگ→٢ | زیاتر→١ | دەرکراو→٠
function impostorScore(votesReceived, wasEjected) {
  if (wasEjected) return 0
  if (votesReceived === 0) return 3
  if (votesReceived <= 2) return 2
  return 1
}

// لێکدانەوەی ئەنجامی تەواوی یاری
// players: [{user_id, role, ...}]
// votes:   [{voter_id, target_id}]
export function resolveGame(players, votes, impostorCount, multiplier = 1) {
  const counts = tallyVotes(votes)
  const ejected = computeEjected(players, counts, impostorCount)

  const impostorIds = new Set(
    players.filter((p) => p.role === 'impostor').map((p) => p.user_id)
  )

  // دەنگەکانی هەر یاریزانێک
  const votesByVoter = {}
  votes.forEach((v) => {
    ;(votesByVoter[v.voter_id] ||= []).push(v.target_id)
  })

  const results = players.map((p) => {
    const isImpostor = p.role === 'impostor'
    let points
    if (isImpostor) {
      points = impostorScore(counts[p.user_id] || 0, ejected.has(p.user_id))
    } else {
      points = crewScore(votesByVoter[p.user_id] || [], impostorIds)
    }
    points *= multiplier
    return {
      user_id: p.user_id,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      role: p.role,
      votes: counts[p.user_id] || 0,
      ejected: ejected.has(p.user_id),
      points,
    }
  })

  // براوە: دەستەی کەشتی ئەگەر هەموو ساختەکارەکان دەرکرابن
  const caughtImpostors = [...impostorIds].filter((id) => ejected.has(id)).length
  const crewWon = caughtImpostors === impostorIds.size
  const winner = crewWon ? 'crew' : 'impostor'

  return { results, ejected: [...ejected], winner, counts }
}

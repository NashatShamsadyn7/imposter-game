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

// ───── ڕێژەی XP (لە یەک شوێن بۆ ئاسانی گۆڕین + جۆرە یارییە داهاتووەکان) ─────
// هەموو ژمارەیەک = XP/خاڵ. زیادکردنیان = ئاست خێراتر بەرز دەبێتەوە.
export const XP = {
  play: 5, // تەواوکردنی یاری (هەموو بەشداربووان)
  crewCorrect: 10, // هەر ساختەکارێکی دروست ناسرایەوە
  crewWin: 15, // پاداشتی بردنەوەی دەستەی کەشتی
  impostorClean: 30, // ساختەکار: هیچ دەنگێکی نەهات
  impostorOk: 22, // ساختەکار: ١–٢ دەنگ
  impostorLow: 14, // ساختەکار: زیاتر لە ٢ دەنگ بەڵام دەرنەکرا
  impostorCaught: 4, // ساختەکار دەرکرا (پاداشتی بەشداری)
}

// ───── خاڵی دەستەی کەشتی ─────
// XP بنەڕەتی + پاداشت بۆ هەر ساختەکارێکی دروست + پاداشتی بردنەوە
function crewScore(myVoteTargetIds, impostorIds, crewWon) {
  let correct = 0
  myVoteTargetIds.forEach((t) => {
    if (impostorIds.has(t)) correct++
  })
  let pts = XP.play + correct * XP.crewCorrect
  if (crewWon) pts += XP.crewWin
  return pts
}

// ───── خاڵی ساختەکار ─────
// XP بنەڕەتی + پاداشت بەپێی ئەوەی چەند دەنگی هاتووە/دەرکراوە
function impostorScore(votesReceived, wasEjected) {
  if (wasEjected) return XP.play + XP.impostorCaught
  if (votesReceived === 0) return XP.play + XP.impostorClean
  if (votesReceived <= 2) return XP.play + XP.impostorOk
  return XP.play + XP.impostorLow
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

  // براوە: دەستەی کەشتی ئەگەر هەموو ساختەکارەکان دەرکرابن (پێش خاڵدان دەزانرێت)
  const caughtImpostors = [...impostorIds].filter((id) => ejected.has(id)).length
  const crewWon = caughtImpostors === impostorIds.size

  const results = players.map((p) => {
    const isImpostor = p.role === 'impostor'
    let points
    if (isImpostor) {
      points = impostorScore(counts[p.user_id] || 0, ejected.has(p.user_id))
    } else {
      points = crewScore(votesByVoter[p.user_id] || [], impostorIds, crewWon)
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

  const winner = crewWon ? 'crew' : 'impostor'

  return { results, ejected: [...ejected], winner, counts }
}

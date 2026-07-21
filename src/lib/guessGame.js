import { POSITIONS, playersByCategory } from '../data/guessPlayers'

export const CLUE_POINTS = [100, 70, 40, 20]
export const TOTAL_CLUES = CLUE_POINTS.length
export const ROUND_TIME = 25 // ثانية لكل لغز عند تفعيل المؤقّت
export const BEST_KEY = 'guessPlayerBest'
const bestKey = (category = 'mix') => `${BEST_KEY}_${category}`

function shuffle(list) {
  const items = [...list]
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

// تلميحات اللاعب من الأعم إلى الأخص
export function buildClues(player) {
  return [
    { icon: '🧭', label: 'المركز والجنسية', value: `${POSITIONS[player.pos]} · من ${player.country}` },
    { icon: '👕', label: 'النادي الأشهر', value: player.club },
    { icon: '#️⃣', label: 'رقم القميص', value: `${player.number}` },
    { icon: '💡', label: 'تلميح خاص', value: player.hint },
  ]
}

// جولة جديدة: لاعب + 4 خيارات ضمن الفئة المختارة (يفضّل نفس المركز)
export function nextRound(recentNames = [], category = 'mix') {
  const catPlayers = playersByCategory(category)
  const fresh = catPlayers.filter((p) => !recentNames.includes(p.name))
  const pool = fresh.length >= 8 ? fresh : catPlayers
  const answer = pool[Math.floor(Math.random() * pool.length)]

  const samePos = shuffle(catPlayers.filter((p) => p.name !== answer.name && p.pos === answer.pos))
  const others = shuffle(catPlayers.filter((p) => p.name !== answer.name && p.pos !== answer.pos))
  const decoys = [...samePos, ...others].slice(0, 3)
  const choices = shuffle([answer, ...decoys])

  return { answer, choices, clues: buildClues(answer) }
}

// أي خيارين خطأ نستبعدهما عند استخدام 50/50
export function fiftyTargets(choices, answerName) {
  const wrong = shuffle(choices.filter((c) => c.name !== answerName))
  return wrong.slice(0, 2).map((c) => c.name)
}

// نقاط الإجابة الصحيحة: تقلّ بكشف التلميحات، وتُنصَّف مع 50/50، + مكافأة السلسلة
export function scoreFor(cluesShown, streak, used5050 = false) {
  const base = CLUE_POINTS[Math.min(cluesShown - 1, CLUE_POINTS.length - 1)] || 10
  const afterHint = used5050 ? Math.round(base / 2) : base
  const bonus = Math.min(streak, 5) * 10
  return afterHint + bonus
}

export function loadBest(category = 'mix') {
  const raw = Number(localStorage.getItem(bestKey(category)))
  return Number.isFinite(raw) ? raw : 0
}

export function saveBest(score, category = 'mix') {
  const best = loadBest(category)
  if (score > best) {
    localStorage.setItem(bestKey(category), String(score))
    return score
  }
  return best
}

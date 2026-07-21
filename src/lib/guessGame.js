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

// تلميحات متنوّعة وعشوائية: نختار 3 تلميحات مختلفة كل جولة (تتغيّر أنواعها
// وترتيبها) + التلميح الخاص دائمًا في النهاية (الأكثر كشفًا).
// هكذا لا تظهر الجنسية في كل مرة، وقد يظهر بدلها "لاعب اعتزل" أو "لعب سابقًا في ...".
export function buildClues(player) {
  const era = player.era === 'legend' ? 'لاعب سابق (اعتزل)' : 'لا يزال يلعب حاليًا'
  const pool = [
    { icon: '🧭', label: 'المركز', value: POSITIONS[player.pos] },
    { icon: '🌍', label: 'الجنسية', value: player.country },
    { icon: '⏳', label: 'الحقبة', value: era },
    { icon: '👕', label: 'ناديه الأشهر', value: player.club },
    { icon: '#️⃣', label: 'رقم القميص', value: `${player.number}` },
  ]
  if (player.former && player.former.length) {
    const club = player.former[Math.floor(Math.random() * player.former.length)]
    pool.push({ icon: '🔙', label: 'نادٍ سابق', value: `لعب سابقًا في ${club}` })
  }
  const varied = shuffle(pool).slice(0, TOTAL_CLUES - 1)
  return [...varied, { icon: '💡', label: 'تلميح خاص', value: player.hint }]
}

export const DIFFICULTIES = [
  { id: 'easy', label: '🟢 سهل', desc: '٤ خيارات مختلفة' },
  { id: 'medium', label: '🟡 متوسط', desc: '٤ خيارات متقاربة' },
  { id: 'hard', label: '🔴 صعب', desc: '٦ خيارات من نفس البلد' },
]

function dedupe(list) {
  const seen = new Set()
  return list.filter((p) => (seen.has(p.name) ? false : seen.add(p.name)))
}

// جولة جديدة: لاعب + خيارات حسب الصعوبة
// easy: بدائل عشوائية (يسهل استبعادها بالجنسية)
// medium: بدائل من نفس المركز
// hard: ٦ بدائل من نفس الجنسية والمركز (تلميح الجنسية لا يفيد)
export function nextRound(recentNames = [], category = 'mix', difficulty = 'medium') {
  const catPlayers = playersByCategory(category)
  const fresh = catPlayers.filter((p) => !recentNames.includes(p.name))
  const pool = fresh.length >= 8 ? fresh : catPlayers
  const answer = pool[Math.floor(Math.random() * pool.length)]

  const others = catPlayers.filter((p) => p.name !== answer.name)
  const sameNatPos = shuffle(others.filter((p) => p.country === answer.country && p.pos === answer.pos))
  const sameNat = shuffle(others.filter((p) => p.country === answer.country))
  const samePos = shuffle(others.filter((p) => p.pos === answer.pos))
  const rest = shuffle(others)

  const choiceCount = difficulty === 'hard' ? 6 : 4
  let ranked
  if (difficulty === 'hard') ranked = dedupe([...sameNatPos, ...sameNat, ...samePos, ...rest])
  else if (difficulty === 'medium') ranked = dedupe([...samePos, ...rest])
  else ranked = rest // سهل: عشوائي تمامًا

  const decoys = ranked.slice(0, choiceCount - 1)
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

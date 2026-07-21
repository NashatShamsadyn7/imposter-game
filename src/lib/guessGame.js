import { playersByCategory, posLabel, countryLabel, clubLabel, pick } from '../data/guessPlayers'

export const CLUE_POINTS = [100, 70, 40, 20]
export const TOTAL_CLUES = CLUE_POINTS.length
export const ROUND_TIME = 25 // چرکە بۆ هەر پرسیار کاتێک کاتژمێر چالاکە
export const BEST_KEY = 'guessPlayerBest'
const bestKey = (category = 'mix') => `${BEST_KEY}_${category}`

export const DIFFICULTIES = [
  { id: 'easy', label: { ku: '🟢 ئاسان', ar: '🟢 سهل' }, desc: { ku: '٤ هەڵبژاردەی جیاواز', ar: '٤ خيارات مختلفة' } },
  { id: 'medium', label: { ku: '🟡 مامناوەند', ar: '🟡 متوسط' }, desc: { ku: '٤ هەڵبژاردەی نزیک', ar: '٤ خيارات متقاربة' } },
  { id: 'hard', label: { ku: '🔴 سەخت', ar: '🔴 صعب' }, desc: { ku: '٦ هەڵبژاردە هەمان وڵات', ar: '٦ خيارات من نفس البلد' } },
]

// دەقی نیشانەکان بە دوو زمان
const LABELS = {
  pos: { ku: 'مەرکەز', ar: 'المركز' },
  country: { ku: 'ڕەگەزنامە', ar: 'الجنسية' },
  era: { ku: 'سەردەم', ar: 'الحقبة' },
  club: { ku: 'ناودارترین یانەی', ar: 'ناديه الأشهر' },
  number: { ku: 'ژمارەی کۆنکۆ', ar: 'رقم القميص' },
  former: { ku: 'یانەی پێشوو', ar: 'نادٍ سابق' },
  special: { ku: 'ئاماژەی تایبەت', ar: 'تلميح خاص' },
}
const ERA_TEXT = {
  legend: { ku: 'یاریزانی پێشوو (خانەنشین)', ar: 'لاعب سابق (اعتزل)' },
  star: { ku: 'هێشتا یاری دەکات', ar: 'لا يزال يلعب حاليًا' },
}
const FORMER_PREFIX = { ku: 'پێشتر یاری کردووە لە ', ar: 'لعب سابقًا في ' }

function shuffle(list) {
  const items = [...list]
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

// ئاماژە جۆراوجۆر و هەڕەمەکی: ٣ ئاماژەی جیاواز هەر گەڕێک + ئاماژەی تایبەت لە کۆتایی.
// بەم شێوەیە ڕەگەزنامە هەموو جارێک دەرناکەوێت، لەبری ئەوە «یاریزانی پێشوو» یان
// «پێشتر یاری کردووە لە ...» دەردەکەوێت.
export function buildClues(player, lang = 'ku') {
  const pool = [
    { icon: '🧭', label: pick(LABELS.pos, lang), value: posLabel(player.p, lang) },
    { icon: '🌍', label: pick(LABELS.country, lang), value: countryLabel(player.c, lang) },
    { icon: '⏳', label: pick(LABELS.era, lang), value: pick(ERA_TEXT[player.era], lang) },
    { icon: '👕', label: pick(LABELS.club, lang), value: clubLabel(player.club, lang) },
  ]
  if (player.num != null) {
    pool.push({ icon: '#️⃣', label: pick(LABELS.number, lang), value: `${player.num}` })
  }
  if (player.former && player.former.length) {
    const club = player.former[Math.floor(Math.random() * player.former.length)]
    pool.push({ icon: '📜', label: pick(LABELS.former, lang), value: pick(FORMER_PREFIX, lang) + clubLabel(club, lang) })
  }
  // ئاماژەی تایبەت ئارەزوومەندانەیە؛ ئەگەر نەبوو، ٤ ئاماژەی جۆراوجۆر بەکاردێت.
  const special = pick(player.h, lang)
  if (!special) return shuffle(pool).slice(0, TOTAL_CLUES)
  const varied = shuffle(pool).slice(0, TOTAL_CLUES - 1)
  return [...varied, { icon: '💡', label: pick(LABELS.special, lang), value: special }]
}

function dedupe(list) {
  const seen = new Set()
  return list.filter((p) => (seen.has(p.name) ? false : seen.add(p.name)))
}

// گەڕی نوێ: یاریزان + هەڵبژاردەکان بەگوێرەی ئاستی سەختی
// easy: هەڕەمەکی · medium: هەمان مەرکەز · hard: ٦ لە هەمان وڵات و مەرکەز
export function nextRound(recentNames = [], category = 'mix', difficulty = 'medium', lang = 'ku') {
  const catPlayers = playersByCategory(category)
  const fresh = catPlayers.filter((p) => !recentNames.includes(p.name))
  const pool = fresh.length >= 8 ? fresh : catPlayers
  const answer = pool[Math.floor(Math.random() * pool.length)]

  const others = catPlayers.filter((p) => p.name !== answer.name)
  const sameNatPos = shuffle(others.filter((p) => p.c === answer.c && p.p === answer.p))
  const sameNat = shuffle(others.filter((p) => p.c === answer.c))
  const samePos = shuffle(others.filter((p) => p.p === answer.p))
  const rest = shuffle(others)

  const choiceCount = difficulty === 'hard' ? 6 : 4
  let ranked
  if (difficulty === 'hard') ranked = dedupe([...sameNatPos, ...sameNat, ...samePos, ...rest])
  else if (difficulty === 'medium') ranked = dedupe([...samePos, ...rest])
  else ranked = rest

  const decoys = ranked.slice(0, choiceCount - 1)
  const choices = shuffle([answer, ...decoys])

  return { answer, choices, clues: buildClues(answer, lang) }
}

// کام دوو هەڵبژاردەی هەڵە لادەبرێن لە کاتی 50/50
export function fiftyTargets(choices, answerName) {
  const wrong = shuffle(choices.filter((c) => c.name !== answerName))
  return wrong.slice(0, 2).map((c) => c.name)
}

// خاڵی وەڵامی ڕاست: بە دەرخستنی ئاماژە کەم دەبێت، بە 50/50 نیوە دەبێت، + پاداشتی زنجیرە
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

import { useState, useEffect, useRef, useCallback } from 'react'
import { Brain, ArrowRight, Check, X, Trophy, RotateCcw, Clock } from 'lucide-react'
import { Button, Panel } from '../../components/ui'
import { useLang } from '../../lib/i18n'
import { sfx } from '../../lib/sound'
import { IQ_CATEGORIES, pickQuestions, localizeQuestion } from '../../data/iq'

const BEST_KEY = 'iq:local:best:v1'
const COUNT_OPTIONS = [10, 20, 30, 50]
const TIME_OPTIONS = [10, 15, 20, 30]

function loadBest() {
  try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {} } catch { return {} }
}

export default function IQLocal({ onExit }) {
  const { t, lang } = useLang()
  const [phase, setPhase] = useState('setup') // setup | play | results
  const [catId, setCatId] = useState('mix')
  const [count, setCount] = useState(10)
  const [secondsPerQ, setSecondsPerQ] = useState(15)

  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState(null)   // فهرستی هەڵبژاردراو (locked)
  const [log, setLog] = useState([])           // [{q, correct, chosen, ok}]
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef(null)

  const best = loadBest()

  // ───── تایمەر ─────
  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  useEffect(() => () => stopTimer(), [])

  const startGame = () => {
    const qs = pickQuestions(catId, count)
    setQuestions(qs)
    setIndex(0); setScore(0); setLog([]); setPicked(null)
    setPhase('play')
  }

  const current = localizeQuestion(questions[index], lang)

  // دەستپێکردنی تایمەری هەر پرسیارێک
  useEffect(() => {
    if (phase !== 'play' || !current) return
    setTimeLeft(secondsPerQ)
    stopTimer()
    timerRef.current = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) { stopTimer(); handleAnswer(null); return 0 }
        if (s <= 4) sfx.tick()
        return s - 1
      })
    }, 1000)
    return () => stopTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, phase])

  const handleAnswer = useCallback((choiceIdx) => {
    if (picked !== null) return
    stopTimer()
    const ok = choiceIdx === current.correct
    setPicked(choiceIdx ?? -1)
    if (ok) { sfx.reveal(); setScore((s) => s + 1) } else { sfx.eliminate() }
    setLog((l) => [...l, { q: current.q, correct: current.correct, choices: current.choices, chosen: choiceIdx ?? -1, ok }])
    // دوای ساتێک بڕۆ بۆ پرسیاری دواتر
    setTimeout(() => {
      setPicked(null)
      if (index + 1 >= questions.length) finish(ok ? score + 1 : score)
      else setIndex((i) => i + 1)
    }, 1100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked, current, index, questions.length, score])

  const finish = (finalScore) => {
    // پاشەکەوتی باشترین ئەنجام بۆ هەر هاوپۆڵێک
    const prev = best[catId] ?? 0
    const pct = Math.round((finalScore / questions.length) * 100)
    if (pct > prev) {
      const next = { ...best, [catId]: pct }
      try { localStorage.setItem(BEST_KEY, JSON.stringify(next)) } catch { /* */ }
    }
    if (pct >= 50) sfx.win(); else sfx.lose()
    setPhase('results')
  }

  // ═══════════ SETUP ═══════════
  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-md px-4 py-6 pb-24">
        <button onClick={() => { sfx.tap(); onExit() }} className="btn-press mb-6 flex items-center gap-1 self-start text-sm text-muted hover:text-ink">
          <ArrowRight className="h-4 w-4" />{t('گەڕانەوە')}
        </button>

        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 to-crew shadow-soft">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-ink">IQ {t('ناوخۆیی')}</h1>
          <p className="mt-1 text-sm text-muted">{t('هاوپۆڵ و ڕێکخستن هەڵبژێرە')}</p>
        </div>

        {/* هاوپۆڵ */}
        <p className="mb-2 text-sm font-bold text-muted">{t('هاوپۆڵ')}</p>
        <div className="mb-5 grid grid-cols-2 gap-2">
          {IQ_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => { sfx.tap(); setCatId(c.id) }}
              className={`btn-press flex items-center gap-2 rounded-2xl border p-3 text-right transition ${catId === c.id ? 'border-crew bg-crew/10' : 'border-line bg-surface'}`}>
              <span className="text-xl">{c.icon}</span>
              <div className="flex-1 leading-tight">
                <p className="text-sm font-bold text-ink">{c.name}</p>
                {best[c.id] != null && <p className="text-[11px] text-amber-500">{t('باشترین')}: {best[c.id]}%</p>}
              </div>
            </button>
          ))}
        </div>

        {/* ژمارەی پرسیار */}
        <p className="mb-2 text-sm font-bold text-muted">{t('ژمارەی پرسیار')}</p>
        <div className="mb-5 flex gap-2">
          {COUNT_OPTIONS.map((n) => (
            <button key={n} onClick={() => { sfx.tap(); setCount(n) }}
              className={`btn-press flex-1 rounded-2xl border py-3 font-bold transition ${count === n ? 'border-crew bg-crew/10 text-crew' : 'border-line bg-surface text-ink'}`}>{n}</button>
          ))}
        </div>

        {/* کاتی هەر پرسیار */}
        <p className="mb-2 text-sm font-bold text-muted">{t('چرکە بۆ هەر پرسیار')}</p>
        <div className="mb-8 flex gap-2">
          {TIME_OPTIONS.map((s) => (
            <button key={s} onClick={() => { sfx.tap(); setSecondsPerQ(s) }}
              className={`btn-press flex-1 rounded-2xl border py-3 font-bold transition ${secondsPerQ === s ? 'border-crew bg-crew/10 text-crew' : 'border-line bg-surface text-ink'}`}>{s}s</button>
          ))}
        </div>

        <Button onClick={startGame} className="w-full">{t('دەستپێکردن')}</Button>
      </div>
    )
  }

  // ═══════════ RESULTS ═══════════
  if (phase === 'results') {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="mx-auto max-w-md px-4 py-6 pb-24">
        <div className="mb-6 flex flex-col items-center text-center animate-scale-in">
          <div className="mb-3 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 to-crew shadow-soft">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-ink">{score} / {questions.length}</h1>
          <p className="mt-1 text-lg font-bold text-crew">{pct}%</p>
        </div>

        <div className="mb-6 space-y-2">
          {log.map((l, i) => (
            <Panel key={i} className="!p-3">
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${l.ok ? 'bg-crew text-white' : 'bg-impostor text-white'}`}>
                  {l.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-ink">{l.q}</p>
                  {!l.ok && <p className="text-xs text-crew">{t('وەڵامی ڕاست')}: {l.choices[l.correct]}</p>}
                </div>
              </div>
            </Panel>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setPhase('setup')} className="flex-1">
            <RotateCcw className="h-4 w-4" />{t('دووبارە')}
          </Button>
          <Button onClick={() => { sfx.tap(); onExit() }} className="flex-1">{t('مێنیو')}</Button>
        </div>
      </div>
    )
  }

  // ═══════════ PLAY ═══════════
  if (!current) return null
  const danger = timeLeft <= 4
  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      {/* سەرپەڕە: پێشکەوتن + خاڵ + کات */}
      <div className="mb-5 flex items-center justify-between">
        <span className="text-sm font-bold text-muted">{index + 1} / {questions.length}</span>
        <span className="flex items-center gap-1 rounded-full bg-crew/12 px-3 py-1 text-sm font-black text-crew">
          <Trophy className="h-3.5 w-3.5" />{score}
        </span>
        <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-black ${danger ? 'bg-impostor/15 text-impostor animate-pulse' : 'bg-surface2 text-ink'}`}>
          <Clock className="h-3.5 w-3.5" />{timeLeft}
        </span>
      </div>

      {/* پێشکەوتن */}
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-surface2">
        <div className="h-full bg-crew transition-all" style={{ width: `${((index) / questions.length) * 100}%` }} />
      </div>

      {/* پرسیار */}
      <Panel className="mb-6 flex min-h-[120px] items-center justify-center text-center">
        <p className="text-xl font-black leading-relaxed text-ink">{current.q}</p>
      </Panel>

      {/* هەڵبژاردەکان */}
      <div className="grid gap-3">
        {current.choices.map((c, i) => {
          let cls = 'border-line bg-surface text-ink hover:border-crew'
          if (picked !== null) {
            if (i === current.correct) cls = 'border-crew bg-crew/15 text-crew'
            else if (i === picked) cls = 'border-impostor bg-impostor/15 text-impostor'
            else cls = 'border-line bg-surface opacity-50 text-muted'
          }
          return (
            <button key={i} disabled={picked !== null} onClick={() => handleAnswer(i)}
              className={`btn-press flex items-center gap-3 rounded-2xl border p-4 text-right font-bold transition ${cls}`}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/5 text-sm">
                {['أ', 'ب', 'ج', 'د'][i]}
              </span>
              <span className="flex-1">{c}</span>
              {picked !== null && i === current.correct && <Check className="h-5 w-5" />}
              {picked !== null && i === picked && i !== current.correct && <X className="h-5 w-5" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

import { useState, useEffect, useRef, useCallback } from 'react'
import { Brain, ArrowRight, Check, X, Trophy, RotateCcw, Clock, Bomb, User, Plus, Trash2, Skull } from 'lucide-react'
import { Button, Panel } from '../../components/ui'
import { useLang } from '../../lib/i18n'
import { sfx } from '../../lib/sound'
import { IQ_CATEGORIES, pickQuestions, localizeQuestion } from '../../data/iq'

const BEST_KEY = 'iq:local:best:v1'
const COUNT_OPTIONS = [10, 20, 30, 50]
const TIME_OPTIONS = [10, 15, 20, 30]
const LETTERS = ['أ', 'ب', 'ج', 'د']
const FUSE_MIN = 18 // کەمترین چرکەی بۆمب (شاراوە)
const FUSE_MAX = 40

function loadBest() {
  try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {} } catch { return {} }
}
const makeId = () => Math.random().toString(36).slice(2, 9)

export default function IQLocal({ onExit }) {
  const { t, lang } = useLang()
  const [mode, setMode] = useState('solo')   // solo | bomb
  const [phase, setPhase] = useState('setup') // setup | play | results | bomb | bombEnd
  const [catId, setCatId] = useState('mix')
  const [count, setCount] = useState(10)
  const [secondsPerQ, setSecondsPerQ] = useState(15)

  // ───── تاکە کەس ─────
  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState(null)
  const [log, setLog] = useState([])
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef(null)

  // ───── بۆمبی گەردان ─────
  const [players, setPlayers] = useState([{ id: makeId(), name: '' }, { id: makeId(), name: '' }])
  const [bomb, setBomb] = useState(null) // {alive:[{id,name}], curIdx, q, status:'play'|'boom', loserName}
  const fuseRef = useRef(null)            // {startedAt, fuse}
  const bombTimerRef = useRef(null)
  const lastTickRef = useRef(0)
  const poolRef = useRef([])

  const best = loadBest()
  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  const stopBomb = () => { if (bombTimerRef.current) { clearInterval(bombTimerRef.current); bombTimerRef.current = null } }
  useEffect(() => () => { stopTimer(); stopBomb() }, [])

  // ═══════════════ تاکە کەس ═══════════════
  const startSolo = () => {
    setQuestions(pickQuestions(catId, count))
    setIndex(0); setScore(0); setLog([]); setPicked(null)
    setPhase('play')
  }
  const current = localizeQuestion(questions[index], lang)

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
    setTimeout(() => {
      setPicked(null)
      if (index + 1 >= questions.length) finishSolo(ok ? score + 1 : score)
      else setIndex((i) => i + 1)
    }, 1100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked, current, index, questions.length, score])

  const finishSolo = (finalScore) => {
    const prev = best[catId] ?? 0
    const pct = Math.round((finalScore / questions.length) * 100)
    if (pct > prev) {
      try { localStorage.setItem(BEST_KEY, JSON.stringify({ ...best, [catId]: pct })) } catch { /* */ }
    }
    if (pct >= 50) sfx.win(); else sfx.lose()
    setPhase('results')
  }

  // ═══════════════ بۆمبی گەردان ═══════════════
  const addPlayer = () => setPlayers((p) => (p.length >= 10 ? p : [...p, { id: makeId(), name: '' }]))
  const removePlayer = (id) => setPlayers((p) => (p.length <= 2 ? p : p.filter((x) => x.id !== id)))
  const renamePlayer = (id, name) => setPlayers((p) => p.map((x) => (x.id === id ? { ...x, name } : x)))

  const drawQuestion = () => {
    if (poolRef.current.length === 0) poolRef.current = pickQuestions(catId, 200)
    return localizeQuestion(poolRef.current.pop(), lang)
  }

  const startRound = (alive) => {
    fuseRef.current = { startedAt: Date.now(), fuse: (FUSE_MIN + Math.random() * (FUSE_MAX - FUSE_MIN)) * 1000 }
    lastTickRef.current = 0
    setBomb({ alive, curIdx: 0, q: drawQuestion(), status: 'play', loserName: null })
  }

  const startBomb = () => {
    const named = players.map((p, i) => ({ id: p.id, name: p.name.trim() || `${t('یاریزان')} ${i + 1}` }))
    poolRef.current = pickQuestions(catId, 200)
    setPhase('bomb')
    startRound(named)
  }

  // تایمەری شاراوەی بۆمب
  useEffect(() => {
    if (phase !== 'bomb' || !bomb || bomb.status !== 'play') { stopBomb(); return }
    bombTimerRef.current = setInterval(() => {
      const { startedAt, fuse } = fuseRef.current
      const elapsed = Date.now() - startedAt
      const frac = elapsed / fuse
      // دەنگی تیک — خێراتر دەبێت بەبێ پیشاندانی کات
      const gap = Math.max(180, 900 - frac * 750)
      if (Date.now() - lastTickRef.current >= gap) { sfx.tick(); lastTickRef.current = Date.now() }
      if (elapsed >= fuse) explode()
    }, 120)
    return () => stopBomb()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, bomb?.status, bomb?.curIdx])

  const explode = () => {
    stopBomb()
    sfx.impostor()
    setBomb((b) => {
      if (!b) return b
      const loser = b.alive[b.curIdx]
      const remaining = b.alive.filter((p) => p.id !== loser.id)
      return { ...b, status: 'boom', loserName: loser.name, remaining }
    })
  }

  // دوای ئاگاداری تەقینەوە: یان جۆلی نوێ یان کۆتایی
  const afterBoom = () => {
    const remaining = bomb.remaining
    if (remaining.length <= 1) {
      sfx.win()
      setBomb((b) => ({ ...b, winner: remaining[0] || null }))
      setPhase('bombEnd')
    } else {
      startRound(remaining)
    }
  }

  const bombAnswer = (choiceIdx) => {
    if (!bomb || bomb.status !== 'play') return
    const ok = choiceIdx === bomb.q.correct
    if (ok) {
      sfx.reveal()
      // گواستنەوە بۆ یاریزانی داهاتوو + پرسیاری نوێ (بۆمب بەردەوامە)
      setBomb((b) => ({ ...b, curIdx: (b.curIdx + 1) % b.alive.length, q: drawQuestion() }))
    } else {
      sfx.eliminate()
      // پرسیاری نوێ بۆ هەمان کەس — بۆمب بەردەوامە
      setBomb((b) => ({ ...b, q: drawQuestion() }))
    }
  }

  const resetAll = () => { stopTimer(); stopBomb(); setBomb(null); setPhase('setup') }

  // ═══════════════ SETUP ═══════════════
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
        </div>

        {/* دۆخی یاری */}
        <p className="mb-2 text-sm font-bold text-muted">{t('دۆخی یاری')}</p>
        <div className="mb-5 grid grid-cols-2 gap-2">
          <button onClick={() => { sfx.tap(); setMode('solo') }}
            className={`btn-press flex items-center gap-2 rounded-2xl border p-3 text-right transition ${mode === 'solo' ? 'border-crew bg-crew/10' : 'border-line bg-surface'}`}>
            <User className="h-5 w-5 text-crew" />
            <span className="text-sm font-bold text-ink">{t('تاکە کەس')}</span>
          </button>
          <button onClick={() => { sfx.tap(); setMode('bomb') }}
            className={`btn-press flex items-center gap-2 rounded-2xl border p-3 text-right transition ${mode === 'bomb' ? 'border-impostor bg-impostor/10' : 'border-line bg-surface'}`}>
            <Bomb className="h-5 w-5 text-impostor" />
            <span className="text-sm font-bold text-ink">{t('بۆمبی گەردان')}</span>
          </button>
        </div>

        {/* هاوپۆڵ */}
        <p className="mb-2 text-sm font-bold text-muted">{t('هاوپۆڵ')}</p>
        <div className="mb-5 grid grid-cols-2 gap-2">
          {IQ_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => { sfx.tap(); setCatId(c.id) }}
              className={`btn-press flex items-center gap-2 rounded-2xl border p-3 text-right transition ${catId === c.id ? 'border-crew bg-crew/10' : 'border-line bg-surface'}`}>
              <span className="text-xl">{c.icon}</span>
              <div className="flex-1 leading-tight">
                <p className="text-sm font-bold text-ink">{t(c.name)}</p>
                {mode === 'solo' && best[c.id] != null && <p className="text-[11px] text-amber-500">{t('باشترین')}: {best[c.id]}%</p>}
              </div>
            </button>
          ))}
        </div>

        {mode === 'solo' ? (
          <>
            <p className="mb-2 text-sm font-bold text-muted">{t('ژمارەی پرسیار')}</p>
            <div className="mb-5 flex gap-2">
              {COUNT_OPTIONS.map((n) => (
                <button key={n} onClick={() => { sfx.tap(); setCount(n) }}
                  className={`btn-press flex-1 rounded-2xl border py-3 font-bold transition ${count === n ? 'border-crew bg-crew/10 text-crew' : 'border-line bg-surface text-ink'}`}>{n}</button>
              ))}
            </div>
            <p className="mb-2 text-sm font-bold text-muted">{t('چرکە بۆ هەر پرسیار')}</p>
            <div className="mb-8 flex gap-2">
              {TIME_OPTIONS.map((s) => (
                <button key={s} onClick={() => { sfx.tap(); setSecondsPerQ(s) }}
                  className={`btn-press flex-1 rounded-2xl border py-3 font-bold transition ${secondsPerQ === s ? 'border-crew bg-crew/10 text-crew' : 'border-line bg-surface text-ink'}`}>{s}s</button>
              ))}
            </div>
            <Button onClick={startSolo} className="w-full">{t('دەستپێکردن')}</Button>
          </>
        ) : (
          <>
            <p className="mb-2 text-sm font-bold text-muted">{t('یاریزانان')} ({players.length})</p>
            <div className="mb-3 space-y-2">
              {players.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2">
                  <input value={p.name} onChange={(e) => renamePlayer(p.id, e.target.value)} maxLength={16}
                    placeholder={`${t('یاریزان')} ${i + 1}`}
                    className="flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 text-ink outline-none focus:border-crew" />
                  {players.length > 2 && (
                    <button onClick={() => { sfx.tap(); removePlayer(p.id) }} className="btn-press grid h-10 w-10 place-items-center rounded-xl bg-surface text-impostor">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {players.length < 10 && (
              <button onClick={() => { sfx.tap(); addPlayer() }} className="btn-press mb-4 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-line py-2.5 text-sm font-bold text-crew">
                <Plus className="h-4 w-4" />{t('زیادکردنی یاریزان')}
              </button>
            )}
            <div className="mb-6 rounded-2xl bg-impostor/8 p-3 text-center text-xs leading-relaxed text-muted">
              💣 {t('وەڵامی ڕاست بدە و خێرا بیگوازەرەوە بۆ کەسی داهاتوو. ئەوەی کاتی تەقینەوە بۆمبەکەی پێیە، دەردەچێت!')}
            </div>
            <Button variant="danger" onClick={startBomb} className="w-full">
              <Bomb className="h-4 w-4" />{t('دەستپێکردن')}
            </Button>
          </>
        )}
      </div>
    )
  }

  // ═══════════════ بۆمب: یاری ═══════════════
  if (phase === 'bomb' && bomb) {
    if (bomb.status === 'boom') {
      return (
        <div className="mx-auto max-w-md px-4 py-6 pb-24">
          <div className="flex min-h-[70vh] flex-col items-center justify-center text-center animate-scale-in">
            <div className="mb-4 text-7xl animate-pulse">💥</div>
            <h1 className="text-4xl font-black text-impostor">{t('بووووم!')}</h1>
            <p className="mt-3 flex items-center gap-2 text-xl font-bold text-ink">
              <Skull className="h-6 w-6 text-impostor" />{bomb.loserName} {t('دەرچوو')}
            </p>
            <p className="mt-2 text-sm text-muted">{bomb.remaining.length} {t('یاریزان ماون')}</p>
            <Button variant="danger" onClick={afterBoom} className="mt-8">
              {bomb.remaining.length <= 1 ? t('بینینی پاڵەوان') : t('جۆلی دواتر')}
            </Button>
          </div>
        </div>
      )
    }
    const cur = bomb.alive[bomb.curIdx]
    return (
      <div className="mx-auto max-w-md px-4 py-6 pb-24">
        {/* بۆمب + نۆرە */}
        <div className="mb-4 flex flex-col items-center">
          <div className="mb-2 text-5xl animate-bounce">💣</div>
          <p className="rounded-full bg-impostor/12 px-4 py-1 text-lg font-black text-impostor">
            {t('نۆرەی')}: {cur.name}
          </p>
          <p className="mt-1 text-xs text-muted">{t('وەڵامی ڕاست بدە و بیگوازەرەوە!')}</p>
        </div>

        {/* پرسیار */}
        <Panel className="mb-6 flex min-h-[110px] items-center justify-center text-center">
          <p className="text-xl font-black leading-relaxed text-ink">{bomb.q.q}</p>
        </Panel>

        {/* هەڵبژاردەکان */}
        <div className="grid gap-3">
          {bomb.q.choices.map((c, i) => (
            <button key={i} onClick={() => bombAnswer(i)}
              className="btn-press flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-right font-bold text-ink transition hover:border-crew">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/5 text-sm">{LETTERS[i]}</span>
              <span className="flex-1">{c}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ═══════════════ بۆمب: کۆتایی ═══════════════
  if (phase === 'bombEnd' && bomb) {
    return (
      <div className="mx-auto max-w-md px-4 py-6 pb-24">
        <div className="flex min-h-[70vh] flex-col items-center justify-center text-center animate-scale-in">
          <div className="mb-3 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-crew shadow-soft">
            <Trophy className="h-12 w-12 text-white" />
          </div>
          <p className="text-sm text-muted">{t('پاڵەوان')}</p>
          <h1 className="mt-1 text-4xl font-black text-ink">{bomb.winner?.name || '—'}</h1>
          <div className="mt-8 flex gap-3">
            <Button variant="ghost" onClick={() => { sfx.tap(); onExit() }}>{t('مێنیو')}</Button>
            <Button variant="danger" onClick={resetAll}><RotateCcw className="h-4 w-4" />{t('دووبارە')}</Button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════ تاکە کەس: ئەنجام ═══════════════
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
          <Button variant="ghost" onClick={() => setPhase('setup')} className="flex-1"><RotateCcw className="h-4 w-4" />{t('دووبارە')}</Button>
          <Button onClick={() => { sfx.tap(); onExit() }} className="flex-1">{t('مێنیو')}</Button>
        </div>
      </div>
    )
  }

  // ═══════════════ تاکە کەس: یاری ═══════════════
  if (!current) return null
  const danger = timeLeft <= 4
  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-sm font-bold text-muted">{index + 1} / {questions.length}</span>
        <span className="flex items-center gap-1 rounded-full bg-crew/12 px-3 py-1 text-sm font-black text-crew">
          <Trophy className="h-3.5 w-3.5" />{score}
        </span>
        <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-black ${danger ? 'bg-impostor/15 text-impostor animate-pulse' : 'bg-surface2 text-ink'}`}>
          <Clock className="h-3.5 w-3.5" />{timeLeft}
        </span>
      </div>
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-surface2">
        <div className="h-full bg-crew transition-all" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <Panel className="mb-6 flex min-h-[120px] items-center justify-center text-center">
        <p className="text-xl font-black leading-relaxed text-ink">{current.q}</p>
      </Panel>
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
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/5 text-sm">{LETTERS[i]}</span>
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

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, Crown, Eye, Flame, HelpCircle, Minus, Plus, RotateCcw, Timer, Trophy, User, Users, X, Zap } from 'lucide-react'
import { Button, Panel } from '../components/ui'
import Confetti from '../components/Confetti'
import { CATEGORIES, countryLabel, pick } from '../data/guessPlayers'
import { nextRound, scoreFor, fiftyTargets, loadBest, saveBest, TOTAL_CLUES, ROUND_TIME, DIFFICULTIES } from '../lib/guessGame'
import { useLang } from '../lib/i18n'
import { sfx } from '../lib/sound'
import { haptic } from '../lib/haptics'

const LIVES = 3
const MIN_PLAYERS = 2
const MAX_PLAYERS = 8

// ═══════════════════════════════════════════════════════════
//  بطاقة الجولة — مشتركة بين الفردي والجماعي
// ═══════════════════════════════════════════════════════════
function PlayRound({ roundData, timerOn, streak, nextLabel, onAnswered, onNext }) {
  const { t, lang } = useLang()
  const { answer, choices, clues } = roundData
  const [cluesShown, setCluesShown] = useState(1)
  const [picked, setPicked] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [used5050, setUsed5050] = useState(false)
  const [hidden, setHidden] = useState([])
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [party, setParty] = useState(false)
  const reported = useRef(false)

  const canReveal = cluesShown < TOTAL_CLUES && !answered
  const pointsNow = useMemo(() => scoreFor(cluesShown, streak, used5050), [cluesShown, streak, used5050])

  const finish = (didWin, choiceName) => {
    if (reported.current) return
    reported.current = true
    setPicked(choiceName)
    setCorrect(didWin)
    setAnswered(true)
    const points = didWin ? scoreFor(cluesShown, streak, used5050) : 0
    if (didWin) { sfx.win(); haptic.success(); setParty(true) }
    else { sfx.eliminate(); haptic.warn() }
    onAnswered({ correct: didWin, points, cluesShown, used5050 })
  }

  useEffect(() => {
    if (!timerOn || answered) return
    if (timeLeft <= 0) { finish(false, null); return }
    const id = setTimeout(() => setTimeLeft((tt) => tt - 1), 1000)
    return () => clearTimeout(id)
  }, [timerOn, answered, timeLeft])

  const revealClue = () => {
    if (!canReveal) return
    setCluesShown((n) => n + 1)
    sfx.tap(); haptic.light()
  }

  const useFifty = () => {
    if (used5050 || answered) return
    setUsed5050(true)
    setHidden(fiftyTargets(choices, answer.name))
    sfx.vote(); haptic.medium()
  }

  const guess = (choice) => {
    if (answered) return
    finish(choice.name === answer.name, choice.name)
  }

  const timePct = Math.max(0, (timeLeft / ROUND_TIME) * 100)
  const timeLow = timeLeft <= 6

  return (
    <>
      {party && <Confetti count={70} />}
      {timerOn && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1 text-muted"><Timer className="h-3.5 w-3.5" /> {t('کات')}</span>
            <span className={timeLow ? 'text-impostor' : 'text-muted'}>{Math.max(0, timeLeft)} {t('چرکە')}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface2">
            <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${timeLow ? 'bg-impostor' : 'bg-crew'}`} style={{ width: `${timePct}%` }} />
          </div>
        </div>
      )}

      <Panel className="mb-4 !p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 rounded-full bg-crew/12 px-3 py-1 text-xs font-black text-crew"><HelpCircle className="h-4 w-4" /> {t('ئەم یاریزانە کێیە؟')}</span>
          <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black text-amber-600">+{pointsNow} {t('خاڵ')}</span>
        </div>
        <div className="space-y-2">
          {clues.slice(0, cluesShown).map((clue, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-surface2 px-3 py-2.5">
              <span className="text-xl">{clue.icon}</span>
              <div className="min-w-0 flex-1 text-right">
                <p className="text-[10px] text-muted">{clue.label}</p>
                <p className="truncate font-black text-ink">{clue.value}</p>
              </div>
            </div>
          ))}
          {Array.from({ length: TOTAL_CLUES - cluesShown }, (_, i) => (
            <div key={`h-${i}`} className="flex items-center gap-3 rounded-2xl border border-dashed border-line px-3 py-2.5 opacity-50">
              <span className="text-xl">🔒</span>
              <p className="text-sm text-muted">{t('ئاماژەی شاراوە')}</p>
            </div>
          ))}
        </div>
        {!answered && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={revealClue} disabled={!canReveal}
              className="btn-press flex items-center justify-center gap-2 rounded-2xl border border-crew/40 bg-crew/8 py-2.5 text-sm font-black text-crew disabled:opacity-30">
              <Eye className="h-4 w-4" /> {t('ئاماژە')}
            </button>
            <button onClick={useFifty} disabled={used5050}
              className="btn-press flex items-center justify-center gap-2 rounded-2xl border border-amber-400/50 bg-amber-400/10 py-2.5 text-sm font-black text-amber-600 disabled:opacity-30">
              <Zap className="h-4 w-4" /> 50/50
            </button>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-2.5">
        {choices.map((choice) => {
          const isAnswer = choice.name === answer.name
          const isPicked = choice.name === picked
          const isHidden = hidden.includes(choice.name)
          let cls = 'border-line bg-surface2 text-ink'
          if (answered && isAnswer) cls = 'border-crew bg-crew/15 text-crew'
          else if (answered && isPicked) cls = 'border-impostor bg-impostor/12 text-impostor'
          else if (answered || isHidden) cls = 'border-line bg-surface2 text-muted opacity-40'
          return (
            <button key={choice.name} onClick={() => guess(choice)} disabled={answered || isHidden}
              className={`btn-press flex items-center justify-between rounded-2xl border p-4 text-right font-black transition ${cls}`}>
              <span>{choice.name}</span>
              {answered && isAnswer && <Check className="h-5 w-5 text-crew" />}
              {answered && isPicked && !isAnswer && <X className="h-5 w-5 text-impostor" />}
            </button>
          )
        })}
      </div>

      {answered && (
        <Panel className="mt-4 text-center !p-4">
          {correct ? (
            <>
              <p className="text-lg font-black text-crew">✅ {t('ڕاستە!')} +{scoreFor(cluesShown, streak, used5050)} {t('خاڵ')}</p>
              <p className="mt-1 text-sm text-muted">{answer.name} — {answer.latin} ({countryLabel(answer.c, lang)})</p>
            </>
          ) : (
            <>
              <p className="text-lg font-black text-impostor">❌ {picked ? t('هەڵە') : t('کات تەواوبوو')}</p>
              <p className="mt-1 text-sm text-muted">{t('ڕاست')}: {answer.name} ({countryLabel(answer.c, lang)})</p>
            </>
          )}
          <Button onClick={onNext} className="mt-3 w-full">{nextLabel}</Button>
        </Panel>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════
//  الحاوية الرئيسية
// ═══════════════════════════════════════════════════════════
export default function GuessPlayer({ onBack }) {
  const { t, lang } = useLang()
  const [phase, setPhase] = useState('menu') // menu | setup | handoff | play | results
  const [mode, setMode] = useState('single')
  const [category, setCategory] = useState('mix')
  const [difficulty, setDifficulty] = useState('medium')
  const [timerOn, setTimerOn] = useState(false)

  const [roundData, setRoundData] = useState(null)
  const [roundKey, setRoundKey] = useState(0)
  const [recent, setRecent] = useState([])

  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [best, setBest] = useState(() => loadBest())

  const [names, setNames] = useState(['یاریزان ١', 'یاریزان ٢', 'یاریزان ٣'])
  const [roundsPer, setRoundsPer] = useState(3)
  const [players, setPlayers] = useState([])
  const [order, setOrder] = useState([])
  const [turnIndex, setTurnIndex] = useState(0)

  const catLabel = (id) => pick(CATEGORIES.find((c) => c.id === id)?.label, lang)
  const diffLabel = (id) => pick(DIFFICULTIES.find((d) => d.id === id)?.label, lang)

  const drawRound = (recentList) => {
    const rd = nextRound(recentList, category, difficulty, lang)
    setRoundData(rd)
    setRoundKey((k) => k + 1)
    return rd
  }

  const startSingle = () => {
    setMode('single')
    setScore(0); setStreak(0); setLives(LIVES); setRecent([])
    setBest(loadBest(category))
    drawRound([])
    setPhase('play')
    sfx.reveal()
  }

  const startGroup = () => {
    const clean = names.map((n) => n.trim()).filter(Boolean)
    if (clean.length < MIN_PLAYERS) return
    const built = clean.map((name) => ({ name, score: 0 }))
    const ord = []
    for (let r = 0; r < roundsPer; r += 1) for (let i = 0; i < built.length; i += 1) ord.push(i)
    setPlayers(built)
    setOrder(ord)
    setTurnIndex(0)
    setRecent([])
    setPhase('handoff')
    sfx.reveal()
  }

  const beginTurn = () => {
    drawRound(recent)
    setPhase('play')
  }

  const handleAnswered = ({ correct, points }) => {
    if (mode === 'single') {
      if (correct) {
        const ns = score + points
        setScore(ns); setStreak((s) => s + 1); setBest(saveBest(ns, category))
      } else {
        setLives((l) => l - 1); setStreak(0)
      }
    } else {
      const pIdx = order[turnIndex]
      setPlayers((list) => list.map((p, i) => i === pIdx ? { ...p, score: p.score + points } : p))
    }
  }

  const handleNext = () => {
    const nextRecent = [roundData.answer.name, ...recent].slice(0, 14)
    setRecent(nextRecent)
    if (mode === 'single') {
      if (lives <= 0) { sfx.lose(); setPhase('results'); return }
      drawRound(nextRecent); setPhase('play')
    } else {
      if (turnIndex + 1 >= order.length) { sfx.win(); setPhase('results'); return }
      setTurnIndex((i) => i + 1)
      setPhase('handoff')
    }
  }

  const backToMenu = () => setPhase('menu')

  const setName = (i, v) => setNames((list) => list.map((n, idx) => idx === i ? v : n))
  const addName = () => names.length < MAX_PLAYERS && setNames((l) => [...l, `یاریزان ${l.length + 1}`])
  const removeName = (i) => names.length > MIN_PLAYERS && setNames((l) => l.filter((_, idx) => idx !== i))

  // ═══════════ القائمة ═══════════
  if (phase === 'menu') return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <header className="mb-6 flex items-center justify-between">
        <button onClick={onBack} className="btn-press flex items-center gap-1 rounded-xl bg-surface px-3 py-2 text-sm text-muted shadow-card"><ArrowRight className="h-4 w-4" /> {t('گەڕانەوە')}</button>
        <div className="text-center"><h1 className="text-xl font-black text-ink">{t('بدۆزەرەوە یاریزان')} ⚽</h1><p className="text-xs text-muted">{t('یاریزانی ڕاستەقینە')}</p></div>
        <div className="w-16" />
      </header>

      <Panel className="mb-4 !p-4">
        <p className="mb-3 font-bold text-ink">{t('پۆل')}</p>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className={`btn-press rounded-2xl border p-3 text-center ${category === c.id ? 'border-crew bg-crew/12 text-crew' : 'border-line bg-surface2 text-muted'}`}>
              <p className="text-sm font-black">{pick(c.label, lang)}</p>
              <p className="mt-0.5 text-[10px] opacity-75">{pick(c.desc, lang)}</p>
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="mb-4 !p-4">
        <p className="mb-3 font-bold text-ink">{t('ئاستی سەختی')}</p>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map((d) => (
            <button key={d.id} onClick={() => setDifficulty(d.id)}
              className={`btn-press rounded-2xl border p-3 text-center ${difficulty === d.id ? 'border-crew bg-crew/12 text-crew' : 'border-line bg-surface2 text-muted'}`}>
              <p className="text-sm font-black">{pick(d.label, lang)}</p>
              <p className="mt-0.5 text-[10px] opacity-75">{pick(d.desc, lang)}</p>
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="mb-5 !p-4">
        <button onClick={() => setTimerOn((v) => !v)} className="btn-press flex w-full items-center justify-between">
          <span className="flex items-center gap-2 font-bold text-ink"><Timer className="h-5 w-5 text-amber-500" /> {t('کاتژمێر بۆ هەر پرسیار')} ({ROUND_TIME} {t('چرکە')})</span>
          <span className={`relative h-6 w-11 rounded-full transition ${timerOn ? 'bg-crew' : 'bg-surface2'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${timerOn ? 'right-0.5' : 'right-5'}`} />
          </span>
        </button>
      </Panel>

      <div className="space-y-3">
        <Button onClick={startSingle} className="w-full !py-4 !text-lg"><User className="h-5 w-5" /> {t('یاری تاکەکەسی')}</Button>
        <Button onClick={() => setPhase('setup')} variant="outline" className="w-full !py-4 !text-lg"><Users className="h-5 w-5" /> {t('یاری گرووپی')}</Button>
      </div>
    </div>
  )

  // ═══════════ إعداد الجماعي ═══════════
  if (phase === 'setup') return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <header className="mb-6 flex items-center justify-between">
        <button onClick={backToMenu} className="btn-press flex items-center gap-1 rounded-xl bg-surface px-3 py-2 text-sm text-muted shadow-card"><ArrowRight className="h-4 w-4" /> {t('گەڕانەوە')}</button>
        <h1 className="text-xl font-black text-ink">{t('یاری گرووپی')}</h1>
        <div className="w-16" />
      </header>

      <Panel className="mb-4 !p-4">
        <div className="mb-3 flex items-center gap-2"><Users className="h-5 w-5 text-crew" /><h2 className="font-bold text-ink">{t('یاریزانەکان')} ({names.length}/{MAX_PLAYERS})</h2></div>
        <div className="space-y-2">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-surface2 px-3 py-2">
              <span className="w-5 text-center text-xs font-black text-muted">{i + 1}</span>
              <input value={name} onChange={(e) => setName(i, e.target.value)} maxLength={16} className="min-w-0 flex-1 bg-transparent font-bold text-ink outline-none" />
              <button onClick={() => removeName(i)} disabled={names.length <= MIN_PLAYERS} className="p-1 text-impostor disabled:opacity-30"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <button onClick={addName} disabled={names.length >= MAX_PLAYERS} className="btn-press mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface2 py-2.5 text-sm font-black text-crew disabled:opacity-30"><Plus className="h-4 w-4" /> {t('یاریزان زیاد بکە')}</button>
      </Panel>

      <Panel className="mb-5 !p-4">
        <p className="mb-3 font-bold text-ink">{t('ژمارەی گەڕەکان بۆ هەر یاریزان')}</p>
        <div className="flex items-center justify-between">
          <button onClick={() => setRoundsPer((r) => Math.max(1, r - 1))} className="btn-press grid h-11 w-11 place-items-center rounded-xl bg-surface2 text-ink"><Minus className="h-5 w-5" /></button>
          <span className="text-3xl font-black text-crew">{roundsPer}</span>
          <button onClick={() => setRoundsPer((r) => Math.min(10, r + 1))} className="btn-press grid h-11 w-11 place-items-center rounded-xl bg-surface2 text-ink"><Plus className="h-5 w-5" /></button>
        </div>
        <p className="mt-2 text-center text-xs text-muted">{t('کۆ')}: {names.filter((n) => n.trim()).length * roundsPer} {t('پرسیار')}</p>
      </Panel>

      <Button onClick={startGroup} disabled={names.filter((n) => n.trim()).length < MIN_PLAYERS} className="w-full !py-4 !text-lg"><Users className="h-6 w-6" /> {t('دەستپێبکە')}</Button>
    </div>
  )

  // ═══════════ تسليم الجهاز (جماعي) ═══════════
  if (phase === 'handoff') {
    const p = players[order[turnIndex]]
    const roundNo = Math.floor(turnIndex / players.length) + 1
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-6 pb-24 text-center">
        <p className="text-sm text-muted">{t('گەڕ')} {roundNo} {t('لە')} {roundsPer}</p>
        <User className="mx-auto my-4 h-16 w-16 text-crew" />
        <p className="text-sm text-muted">{t('ئامێرەکە بدە بە')}</p>
        <p className="my-2 text-4xl font-black text-ink">{p.name}</p>
        <p className="mb-6 text-xs text-muted">{t('خاڵە ئێستاکانی')}: {p.score}</p>
        <Button onClick={beginTurn} className="w-full !py-4 !text-lg">{t('ئامادەم')}</Button>
      </div>
    )
  }

  // ═══════════ النتائج ═══════════
  if (phase === 'results') {
    if (mode === 'single') return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-6 pb-24 text-center">
        <Trophy className="mx-auto mb-3 h-16 w-16 text-amber-500" />
        <h1 className="text-3xl font-black text-ink">{t('یاری تەواوبوو')}</h1>
        <p className="mt-2 text-muted">{t('هەوڵەکانت تەواوبوون')}</p>
        <Panel className="my-5 !p-5"><p className="text-sm text-muted">{t('ئەنجامەکەت')}</p><p className="my-1 text-5xl font-black text-crew">{score}</p><p className="text-sm font-bold text-amber-600">{t('باشترین ئەنجام')}: {best}</p></Panel>
        <div className="space-y-3">
          <Button onClick={startSingle} className="w-full !py-4 !text-lg"><RotateCcw className="h-5 w-5" /> {t('دووبارە یاری بکە')}</Button>
          <Button onClick={backToMenu} variant="ghost" className="w-full">{t('گەڕانەوە بۆ لیست')}</Button>
        </div>
      </div>
    )
    const ranked = [...players].sort((a, b) => b.score - a.score)
    return (
      <div className="mx-auto max-w-md px-4 py-7 pb-24 text-center">
        <Confetti count={90} />
        <Crown className="mx-auto mb-3 h-14 w-14 text-amber-500" />
        <h1 className="text-3xl font-black text-ink">{t('براوە')}: {ranked[0].name} 👑</h1>
        <p className="mt-1 text-muted">{t('بە')} {ranked[0].score} {t('خاڵ')}</p>
        <div className="my-5 space-y-2 text-right">
          {ranked.map((p, i) => (
            <div key={p.name} className={`flex items-center gap-3 rounded-2xl border p-3 ${i === 0 ? 'border-amber-400/50 bg-amber-400/10' : 'border-line bg-surface2'}`}>
              <span className={`w-7 text-center text-lg font-black ${i === 0 ? 'text-amber-500' : 'text-muted'}`}>{i + 1}</span>
              <span className="flex-1 font-black text-ink">{p.name}</span>
              <span className="font-black text-crew">{p.score}</span>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <Button onClick={() => setPhase('setup')} className="w-full !py-4 !text-lg"><RotateCcw className="h-5 w-5" /> {t('گەڕی نوێ')}</Button>
          <Button onClick={backToMenu} variant="ghost" className="w-full">{t('گەڕانەوە بۆ لیست')}</Button>
        </div>
      </div>
    )
  }

  // ═══════════ اللعب ═══════════
  const nextLabel = mode === 'single'
    ? (lives <= 0 ? t('ئەنجام') : t('یاریزانی دواتر'))
    : (turnIndex + 1 >= order.length ? t('ئەنجامی کۆتایی') : t('یاریزانی دواتر'))
  const groupPlayer = mode === 'group' ? players[order[turnIndex]] : null

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 pb-24">
      <header className="mb-4 flex items-center justify-between">
        <button onClick={backToMenu} className="btn-press flex items-center gap-1 rounded-xl bg-surface px-3 py-2 text-sm text-muted shadow-card"><ArrowRight className="h-4 w-4" /> {t('دەرچوون')}</button>
        <div className="text-center"><h1 className="text-lg font-black text-ink">{t('بدۆزەرەوە یاریزان')}</h1><p className="text-[11px] text-muted">{catLabel(category)} · {diffLabel(difficulty)}</p></div>
        {mode === 'single'
          ? <div className="flex gap-0.5">{Array.from({ length: LIVES }, (_, i) => <span key={i}>{i < lives ? '❤️' : '🤍'}</span>)}</div>
          : <div className="w-16 text-left text-xs font-black text-crew">{groupPlayer?.name}</div>}
      </header>

      {mode === 'single' && (
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-surface2 p-2"><p className="text-[10px] text-muted">{t('خاڵ')}</p><p className="text-xl font-black text-crew">{score}</p></div>
          <div className="rounded-2xl bg-surface2 p-2"><p className="text-[10px] text-muted">{t('زنجیرە')}</p><p className="flex items-center justify-center gap-1 text-xl font-black text-amber-500"><Flame className="h-4 w-4" />{streak}</p></div>
          <div className="rounded-2xl bg-surface2 p-2"><p className="text-[10px] text-muted">{t('باشترین')}</p><p className="text-xl font-black text-ink">{best}</p></div>
        </div>
      )}
      {mode === 'group' && (
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-surface2 px-4 py-2.5">
          <span className="text-sm font-black text-ink">{t('نۆرەی')}: {groupPlayer?.name}</span>
          <span className="rounded-full bg-crew/12 px-2.5 py-0.5 text-xs font-black text-crew">{t('پرسیار')} {turnIndex + 1}/{order.length}</span>
          <span className="text-sm font-bold text-muted">{t('خاڵی')}: {groupPlayer?.score}</span>
        </div>
      )}

      {roundData && (
        <PlayRound
          key={roundKey}
          roundData={roundData}
          timerOn={timerOn}
          streak={mode === 'single' ? streak : 0}
          nextLabel={nextLabel}
          onAnswered={handleAnswered}
          onNext={handleNext}
        />
      )}
    </div>
  )
}

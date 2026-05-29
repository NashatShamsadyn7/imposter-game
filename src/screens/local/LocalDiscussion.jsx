import { useState, useEffect, useRef } from 'react'
import { Clock, Play, Pause, Vote, RotateCcw, Megaphone, SkipForward } from 'lucide-react'
import { useLocal } from '../../state/LocalContext'
import { Button, Panel } from '../../components/ui'
import { sfx } from '../../lib/sound'

export default function LocalDiscussion() {
  const { game, settings, goToVoting } = useLocal()
  const [remaining, setRemaining] = useState(settings.discussionSeconds)
  const [running, setRunning] = useState(true)
  const [turn, setTurn] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (!running) return
    ref.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(ref.current); setRunning(false); sfx.eliminate(); return 0 }
        if (r <= 6) sfx.tick()
        return r - 1
      })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [running])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const pct = (remaining / settings.discussionSeconds) * 100
  const urgent = remaining <= 10

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
      {/* نۆرەی قسەکردن */}
      <Panel className="mb-4 flex items-center gap-3 !p-4 animate-fade-in">
        <Megaphone className="h-6 w-6 shrink-0 text-crew" />
        <div className="flex-1">
          <p className="text-xs text-muted">نۆرەی وەسفکردن</p>
          <p className="text-lg font-black text-ink">{game.players[turn]?.name}</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => { sfx.tap(); setTurn((t) => (t + 1) % game.players.length) }}
          className="!px-3 !py-2 !text-sm"
        >
          <SkipForward className="h-4 w-4" /> دواتر
        </Button>
      </Panel>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-3 flex items-center gap-2 text-muted">
          <Clock className="h-5 w-5" /><span>کاتی گفتوگۆ</span>
        </div>
        <div className="relative mb-6 flex h-56 w-56 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(42,51,70,0.08)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={urgent ? '#e15b57' : '#0e9c8e'} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={283} strokeDashoffset={283 - (283 * pct) / 100}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
            />
          </svg>
          <p className={`text-5xl font-black tabular-nums ${urgent ? 'animate-pulse text-impostor' : 'text-ink'}`}>
            {minutes}:{String(seconds).padStart(2, '0')}
          </p>
        </div>
        <p className="max-w-xs text-center text-sm text-muted">
          هەر یاریزانێک بە یەک وشە وەسفی بکات — بەبێ ئەوەی ڕاستەوخۆ بیڵێت.
        </p>
      </div>

      <div className="space-y-3 pb-4">
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setRunning((r) => !r)} className="flex-1">
            {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            {running ? 'وەستان' : 'بەردەوامبوون'}
          </Button>
          <Button variant="ghost" onClick={() => { setRemaining(settings.discussionSeconds); setRunning(true) }} className="!px-4">
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
        <Button onClick={goToVoting} variant="danger" className="w-full !py-4 !text-lg">
          <Vote className="h-6 w-6" /> چوون بەرەو دەنگدان
        </Button>
      </div>
    </div>
  )
}

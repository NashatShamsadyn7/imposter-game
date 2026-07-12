import { useEffect, useRef, useState } from 'react'
import { Bomb, Flame, Zap } from 'lucide-react'
import { useLocal } from '../../state/LocalContext'
import { Button, Panel } from '../../components/ui'
import { sfx } from '../../lib/sound'
import { haptic } from '../../lib/haptics'

// یارییەکی خێرا بۆ یەک مۆبایل: وشەیەکی نوێ لە هاوپۆلەکە بڵێ، کرتە بکە و مۆبایل بگەیەنەوە.
export default function BombGame() {
  const { game, scoreBombTurn, finishBombRound } = useLocal()
  const [remaining, setRemaining] = useState(game.bombSeconds)
  const ended = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((seconds) => {
        if (seconds <= 1) {
          clearInterval(interval)
          if (!ended.current) {
            ended.current = true
            sfx.eliminate()
            haptic.heavy()
            finishBombRound()
          }
          return 0
        }
        if (seconds <= 6) { sfx.tick(); haptic.light() }
        return seconds - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [finishBombRound])

  const player = game.players[game.currentIndex]
  const urgent = remaining <= 8
  const percentage = (remaining / game.bombSeconds) * 100
  const nextPoints = 4 + Math.min(game.streak, 6)

  const passBomb = () => {
    if (ended.current) return
    sfx.reveal()
    haptic.success()
    scoreBombTurn()
  }

  return (
    <div className={`mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 ${urgent ? 'animate-shake' : ''}`}>
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="rounded-full bg-crew/10 px-3 py-1 font-bold text-crew">خولی {game.round}</span>
        <span className="flex items-center gap-1 text-muted"><Flame className="h-4 w-4 text-amber-500" /> زنجیرە: {game.streak}</span>
      </div>

      <Panel className="mb-4 !p-4 text-center">
        <p className="text-xs font-bold text-muted">نۆرەی ئێستا</p>
        <p className="mt-1 text-2xl font-black text-ink">{player.name}</p>
        <p className="mt-3 text-sm text-muted">لە هاوپۆلی <span className="font-bold text-crew">{game.category.icon} {game.category.name}</span> وشەیەکی جیاواز بڵێ!</p>
      </Panel>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative mb-5 grid h-64 w-64 place-items-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(42,51,70,0.1)" strokeWidth="6" />
            <circle cx="50" cy="50" r="45" fill="none" stroke={urgent ? '#e15b57' : '#f59e0b'} strokeWidth="6" strokeLinecap="round" strokeDasharray={283} strokeDashoffset={283 - (283 * percentage) / 100} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className={`grid h-40 w-40 place-items-center rounded-full ${urgent ? 'animate-pulse bg-impostor/15' : 'bg-amber-400/15'}`}>
            <Bomb className={`h-20 w-20 ${urgent ? 'text-impostor' : 'text-amber-500'}`} />
          </div>
          <p className={`absolute bottom-2 text-4xl font-black tabular-nums ${urgent ? 'text-impostor' : 'text-ink'}`}>{remaining}</p>
        </div>
        <p className="max-w-xs text-center text-sm text-muted">نەبێت وشەی دووبارە بڵێیت. بە خێرایی بیڵێ، پاشان مۆبایل بگەیەنەوە!</p>
      </div>

      <Button onClick={passBomb} className="w-full !py-4 !text-lg">
        <Zap className="h-6 w-6" /> وتم! بگەیەنەوە <span className="mr-1 rounded-full bg-white/20 px-2 py-0.5 text-sm">+{nextPoints}</span>
      </Button>
    </div>
  )
}

import { Bomb, RotateCcw, Trophy } from 'lucide-react'
import { useLocal } from '../../state/LocalContext'
import { Button, Panel } from '../../components/ui'
import Confetti from '../../components/Confetti'

export default function BombResults() {
  const { game, scores, nextBombRound, playAgain } = useLocal()
  const lostPlayer = game.players.find((player) => player.id === game.lostPlayerId)
  const ranked = [...game.players].map((player) => ({ ...player, points: scores[player.id] || 0 })).sort((a, b) => b.points - a.points)

  return (
    <div className="mx-auto max-w-md px-4 py-8 pb-24 text-center">
      <div className="mb-5 inline-flex rounded-full border-2 border-impostor bg-impostor/10 p-5 animate-pulse-glow-red"><Bomb className="h-14 w-14 text-impostor" /></div>
      <h1 className="text-3xl font-black text-impostor">بۆمبەکە تەقی! 💥</h1>
      <p className="mt-2 text-muted"><span className="font-black text-ink">{lostPlayer?.name}</span> بۆمبەکەی پێ بوو</p>

      <Panel className="my-6 !p-4 text-right">
        <div className="mb-3 flex items-center gap-2"><Trophy className="h-5 w-5 text-crew" /><h2 className="font-black text-ink">خاڵەکانی کۆبوونەوە</h2></div>
        <div className="space-y-2">
          {ranked.map((player, index) => (
            <div key={player.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${player.id === game.lostPlayerId ? 'bg-impostor/10' : 'bg-crew/5'}`}>
              <span className="w-5 text-center font-black text-muted">{index + 1}</span>
              <span className="flex-1 font-bold text-ink">{player.name}</span>
              <span className="rounded-full bg-crew/12 px-3 py-1 text-sm font-black text-crew">{player.points}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Confetti count={55} />
      <Button onClick={nextBombRound} className="mb-3 w-full !py-4 !text-lg"><Bomb className="h-6 w-6" /> بۆمبەی نوێ</Button>
      <Button onClick={playAgain} variant="ghost" className="w-full"><RotateCcw className="h-5 w-5" /> گەڕانەوە بۆ یارییەکان</Button>
    </div>
  )
}

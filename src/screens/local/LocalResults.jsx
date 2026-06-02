import { useEffect } from 'react'
import { Trophy, Skull, ShieldCheck, RotateCcw, Star, UserX } from 'lucide-react'
import { useLocal } from '../../state/LocalContext'
import { Button, Panel } from '../../components/ui'
import WordImage from '../../components/WordImage'
import Confetti from '../../components/Confetti'
import MysteryReward from '../../components/MysteryReward'
import { useT } from '../../lib/i18n'
import { sfx } from '../../lib/sound'

export default function LocalResults() {
  const { game, scores, playAgain } = useLocal()
  const t = useT()
  const { results, winner } = game
  const impostorWin = winner === 'impostor'

  useEffect(() => {
    if (impostorWin) sfx.lose()
    else sfx.win()
  }, [impostorWin])

  const ranked = [...results].sort((a, b) => b.points - a.points)

  return (
    <div className={`mx-auto max-w-md px-4 py-6 pb-24 ${impostorWin ? 'animate-shake' : ''}`}>
      {!impostorWin && <Confetti count={90} />}
      <div className="text-center animate-scale-in">
        <div className={`mb-4 inline-flex rounded-full border-2 p-5 ${impostorWin ? 'border-impostor bg-impostor/12 animate-pulse-glow-red' : 'border-crew bg-crew/12 animate-pulse-glow'}`}>
          {impostorWin ? <Skull className="h-14 w-14 text-impostor" /> : <Trophy className="h-14 w-14 text-crew" />}
        </div>
        <h1 className={`mb-4 text-3xl font-black ${impostorWin ? 'text-impostor' : 'text-crew'}`}>
          {impostorWin ? t('ساختەکارەکان سەرکەوتن!') : t('دەستەی کەشتی سەرکەوتن!')}
        </h1>
      </div>

      {/* سندووقی خەڵات — بینراو (لە دۆخی ناوخۆیی هەژمار نییە) */}
      <MysteryReward streak={0} />

      <Panel className="mb-5 text-center">
        <p className="mb-1 text-xs text-muted">{t('وشەی نهێنی')} ({game.category.name})</p>
        <p className="mb-4 text-2xl font-black text-ink">{game.secretWord.ku}</p>
        <div className="flex justify-center">
          <WordImage englishPrompt={game.secretWord.en} emoji={game.secretWord.emoji} size={200} />
        </div>
        {game.decoyWord && (
          <p className="mt-4 text-sm text-muted">
            {t('وشەی ساختەکار')}: <span className="font-bold text-impostor">{game.decoyWord.ku}</span>
          </p>
        )}
      </Panel>

      <Panel className="mb-6 !p-4">
        <h2 className="mb-3 text-center font-bold text-ink">{t('ئەنجام و خاڵەکان')}</h2>
        <div className="space-y-2">
          {ranked.map((r) => (
            <div key={r.user_id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${r.role === 'impostor' ? 'border-impostor/30 bg-impostor/8' : 'border-crew/25 bg-crew/5'}`}>
              <div className="flex-1">
                <p className="flex items-center gap-1.5 font-bold text-ink">
                  {r.role === 'impostor' ? <Skull className="h-4 w-4 text-impostor" /> : <ShieldCheck className="h-4 w-4 text-crew" />}
                  {r.display_name}
                  {r.ejected && <span className="flex items-center gap-0.5 text-xs text-muted"><UserX className="h-3 w-3" /> {t('دەرکرا')}</span>}
                </p>
                <p className="text-xs text-muted">
                  {r.role === 'impostor' ? t('ساختەکار') : t('دەستەی کەشتی')} · {r.votes} {t('دەنگ')} · {t('کۆ:')} {scores[r.user_id] || 0}
                </p>
              </div>
              <span className="flex items-center gap-1 font-black text-crew"><Star className="h-4 w-4" />+{r.points}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Button onClick={playAgain} className="w-full !py-4 !text-lg">
        <RotateCcw className="h-6 w-6" /> {t('یاری دووبارە')}
      </Button>
    </div>
  )
}

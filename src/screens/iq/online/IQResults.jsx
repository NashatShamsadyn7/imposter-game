import { useEffect } from 'react'
import { Trophy, Crown, RotateCcw, LogOut } from 'lucide-react'
import { Button, Panel } from '../../../components/ui'
import Avatar from '../../../components/Avatar'
import { useT } from '../../../lib/i18n'
import { sfx } from '../../../lib/sound'
import { useAuth } from '../../../state/AuthContext'
import { useIQRoom } from '../../../state/IQRoomContext'

// ئەنجامی کۆتایی یاری IQ ئۆنلاین
export default function IQResults() {
  const t = useT()
  const { user, refreshProfile } = useAuth()
  const { scoreboard, answers, isHost, playAgain, leaveRoom } = useIQRoom()

  useEffect(() => { sfx.win() }, [])

  // نوێکردنەوەی خاڵەکانی پرۆفایلی خۆم — بۆ ئەنیمەیشنی بەرزبوونەوەی ئاست
  useEffect(() => {
    const id = setTimeout(() => refreshProfile?.(), 1400)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const winner = scoreboard[0]
  // XP ـی خۆم بۆ پیشاندان (٥ بۆ هەر وەڵامی ڕاست + ٣٠ بۆ براوە)
  const myCorrect = answers.filter((a) => a.user_id === user?.id && a.is_correct).length
  const iWon = winner && winner.user_id === user?.id && winner.score > 0
  const myXp = myCorrect * 5 + (iWon ? 30 : 0)

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <div className="mb-6 flex flex-col items-center text-center animate-scale-in">
        <div className="mb-3 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 to-crew shadow-soft">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-black text-ink">{t('ئەنجامەکان')}</h1>
        {winner && (
          <p className="mt-2 flex items-center gap-1 text-lg font-bold text-amber-500">
            <Crown className="h-5 w-5" />{winner.display_name}
          </p>
        )}
        {myXp > 0 && (
          <p className="mt-3 rounded-full bg-amber-400/15 px-4 py-1 text-sm font-black text-amber-500">+{myXp} XP</p>
        )}
      </div>

      <div className="mb-6 space-y-2">
        {scoreboard.map((s, idx) => (
          <Panel key={s.user_id} className={`flex items-center gap-3 !p-3 ${idx === 0 ? 'border-amber-400' : ''}`}>
            <span className="w-6 text-center text-lg font-black text-muted">{idx + 1}</span>
            <Avatar url={s.avatar_url} name={s.display_name} size={40} />
            <span className="flex-1 font-bold text-ink">{s.display_name}</span>
            <span className="flex items-center gap-1 font-black text-crew"><Trophy className="h-4 w-4" />{s.score}</span>
          </Panel>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => { sfx.tap(); leaveRoom() }} className="flex-1">
          <LogOut className="h-4 w-4" />{t('دەرچوون')}
        </Button>
        {isHost && (
          <Button onClick={playAgain} className="flex-1">
            <RotateCcw className="h-4 w-4" />{t('دووبارە')}
          </Button>
        )}
      </div>
    </div>
  )
}

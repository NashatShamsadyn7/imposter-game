import { useState, useEffect } from 'react'
import { Clock, Check, X, Trophy } from 'lucide-react'
import { Panel } from '../../../components/ui'
import Avatar from '../../../components/Avatar'
import { useLang } from '../../../lib/i18n'
import { sfx } from '../../../lib/sound'
import { useIQRoom } from '../../../state/IQRoomContext'
import { localizeQuestion } from '../../../data/iq'

const LETTERS = ['أ', 'ب', 'ج', 'د']

// شاشەی یاری IQ ئۆنلاین — پرسیار + تایمەر + ئاشکراکردن
export default function IQPlay() {
  const { t, lang } = useLang()
  const { room, myAnswer, answeredCount, players, scoreboard, submitAnswer } = useIQRoom()
  const [timeLeft, setTimeLeft] = useState(0)

  const q = localizeQuestion(room?.questions?.[room.current_index], lang)
  const revealing = room?.status === 'reveal'

  // تایمەری هاوکات لەسەر بنەمای question_started_at
  useEffect(() => {
    if (!room || !room.question_started_at) return
    const started = new Date(room.question_started_at).getTime()
    const tick = () => {
      const left = Math.max(0, room.seconds_per_q - Math.floor((Date.now() - started) / 1000))
      setTimeLeft(left)
      if (left <= 3 && left > 0) sfx.tick()
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [room?.current_index, room?.question_started_at, room?.status])

  // دەنگ لە کاتی ئاشکراکردن
  useEffect(() => {
    if (revealing && myAnswer) { myAnswer.is_correct ? sfx.reveal() : sfx.eliminate() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealing])

  if (!q) return null
  const danger = timeLeft <= 3 && !revealing

  const onPick = (i) => {
    if (myAnswer || revealing) return
    sfx.tap()
    submitAnswer(i)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      {/* سەرپەڕە */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-muted">{room.current_index + 1} / {room.questions.length}</span>
        <span className="text-xs text-muted">{t('وەڵامدا')}: {answeredCount}/{players.length}</span>
        <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-black ${danger ? 'bg-impostor/15 text-impostor animate-pulse' : 'bg-surface2 text-ink'}`}>
          <Clock className="h-3.5 w-3.5" />{revealing ? '✓' : timeLeft}
        </span>
      </div>

      {/* پێشکەوتن */}
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-surface2">
        <div className="h-full bg-crew transition-all duration-500" style={{ width: `${(room.current_index / room.questions.length) * 100}%` }} />
      </div>

      {/* پرسیار */}
      <Panel className="mb-6 flex min-h-[110px] flex-col items-center justify-center gap-3 text-center">
        {q.image && <img src={q.image} alt="" loading="lazy" className="h-24 w-auto max-w-[70%] object-contain" />}
        <p className="text-xl font-black leading-relaxed text-ink">{q.q}</p>
      </Panel>

      {/* هەڵبژاردەکان */}
      <div className="grid gap-3">
        {q.choices.map((c, i) => {
          let cls = 'border-line bg-surface text-ink hover:border-crew'
          if (revealing) {
            if (i === q.correct) cls = 'border-crew bg-crew/15 text-crew'
            else if (myAnswer?.choice === i) cls = 'border-impostor bg-impostor/15 text-impostor'
            else cls = 'border-line bg-surface opacity-50 text-muted'
          } else if (myAnswer?.choice === i) {
            cls = 'border-crew bg-crew/15 text-crew'
          }
          return (
            <button key={i} disabled={!!myAnswer || revealing} onClick={() => onPick(i)}
              className={`btn-press flex items-center gap-3 rounded-2xl border p-4 text-right font-bold transition ${cls}`}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/5 text-sm">{LETTERS[i]}</span>
              <span className="flex-1">{c}</span>
              {revealing && i === q.correct && <Check className="h-5 w-5" />}
              {revealing && myAnswer?.choice === i && i !== q.correct && <X className="h-5 w-5" />}
            </button>
          )
        })}
      </div>

      {/* دۆخی چاوەڕوانی */}
      {myAnswer && !revealing && (
        <p className="mt-4 text-center text-sm text-crew">{t('وەڵامەکەت تۆمارکرا — چاوەڕێی یەکانی تر…')}</p>
      )}

      {/* پێشەنگ لە کاتی ئاشکراکردن */}
      {revealing && (
        <div className="mt-5 space-y-1.5">
          {scoreboard.slice(0, 3).map((s, idx) => (
            <Panel key={s.user_id} className="flex items-center gap-2 !p-2">
              <span className="w-5 text-center font-black text-muted">{idx + 1}</span>
              <Avatar url={s.avatar_url} name={s.display_name} size={28} />
              <span className="flex-1 text-sm font-bold text-ink">{s.display_name}</span>
              <span className="flex items-center gap-1 text-sm font-black text-crew"><Trophy className="h-3.5 w-3.5" />{s.score}</span>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}

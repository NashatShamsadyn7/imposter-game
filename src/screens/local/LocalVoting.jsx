import { useState } from 'react'
import { Hand, Vote, Check, EyeOff } from 'lucide-react'
import { useLocal } from '../../state/LocalContext'
import { Button } from '../../components/ui'
import { useT } from '../../lib/i18n'
import { sfx } from '../../lib/sound'

export default function LocalVoting() {
  const { game, settings, finishGame } = useLocal()
  const t = useT()
  const need = settings.impostorCount
  const voters = game.players

  const [voterIndex, setVoterIndex] = useState(0)
  const [handed, setHanded] = useState(false)
  const [picked, setPicked] = useState([])
  const [collected, setCollected] = useState([]) // [{voterId, targetIds}]

  const voter = voters[voterIndex]
  const isLast = voterIndex === voters.length - 1
  const candidates = game.players.filter((p) => p.id !== voter.id)

  const toggle = (id) => {
    sfx.tap()
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= need) return [...prev.slice(1), id]
      return [...prev, id]
    })
  }

  const submit = () => {
    sfx.vote()
    const next = [...collected, { voterId: voter.id, targetIds: picked }]
    setPicked([])
    if (isLast) {
      finishGame(next)
    } else {
      setCollected(next)
      setVoterIndex((i) => i + 1)
      setHanded(false)
    }
  }

  // گواستنەوەی ئامێر
  if (!handed) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-8 text-center">
        <div className="animate-fade-in">
          <div className="mb-3 flex items-center justify-center gap-2 text-impostor">
            <EyeOff className="h-5 w-5" /><span className="font-bold">{t('دەنگدانی نهێنی')}</span>
          </div>
          <Hand className="mx-auto mb-4 h-14 w-14 text-crew" />
          <p className="mb-2 text-muted">{t('ئامێرەکە بدە بە')}</p>
          <h1 className="mb-1 text-4xl font-black text-ink">{voter.name}</h1>
          <p className="mb-10 text-sm text-muted">{t('دەنگدەر')} {voterIndex + 1} {t('لە')} {voters.length}</p>
          <button
            onClick={() => { sfx.click(); setHanded(true) }}
            className="btn-press animate-pulse-glow neon-ring mx-auto flex h-44 w-44 flex-col items-center justify-center gap-3 rounded-full border-2 border-crew/40 bg-surface shadow-soft"
          >
            <Vote className="h-12 w-12 text-crew" />
            <span className="font-bold text-crew">{t('دەنگدان')}</span>
          </button>
        </div>
      </div>
    )
  }

  // هەڵبژاردن
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
      <div className="mb-5 text-center animate-fade-in">
        <h1 className="text-xl font-black text-ink"><span className="text-crew">{voter.name}</span> — {t('کێ ساختەکارە؟')}</h1>
        <p className="mt-1 text-sm text-muted">
          {need === 1 ? t('یەک کەس هەڵبژێرە') : `${need} ${t('کەس هەڵبژێرە')}`} · {picked.length}/{need}
        </p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {candidates.map((p) => {
          const active = picked.includes(p.id)
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`btn-press flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 ${
                active ? 'border-impostor bg-impostor/15 text-ink' : 'border-line bg-surface text-ink hover:bg-surface2'
              }`}
            >
              <span className="font-bold">{p.name}</span>
              {active && <Check className="h-5 w-5 text-impostor" />}
            </button>
          )
        })}
      </div>

      <Button onClick={submit} disabled={picked.length !== need} variant="danger" className="mt-4 w-full !py-4">
        {isLast ? t('تەواوکردنی دەنگدان') : t('پشتڕاستکردنەوە و یاریزانی دواتر')}
      </Button>
    </div>
  )
}

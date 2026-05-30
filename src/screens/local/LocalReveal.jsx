import { useState, useEffect, useRef } from 'react'
import { Eye, Skull, ShieldCheck, EyeOff, Hand, ArrowLeft, Users } from 'lucide-react'
import { useLocal } from '../../state/LocalContext'
import { Button, Panel } from '../../components/ui'
import WordImage from '../../components/WordImage'
import { useT } from '../../lib/i18n'
import { sfx, playGameStart } from '../../lib/sound'

const REVEAL_SECONDS = 10

export default function LocalReveal() {
  const { game, nextReveal } = useLocal()
  const t = useT()
  const [flipped, setFlipped] = useState(false)
  const [countdown, setCountdown] = useState(REVEAL_SECONDS)
  const timerRef = useRef(null)

  // دەنگی دەستپێکردنی یاری — یەک جار لە سەرەتای یاری
  useEffect(() => {
    playGameStart()
  }, [])

  const player = game.players[game.revealIndex]
  const isImpostor = player.role === 'impostor'
  const isUndercover = !!game.decoyWord
  const isLast = game.revealIndex === game.players.length - 1
  const allies = game.players.filter((p) => p.role === 'impostor' && p.id !== player.id)

  useEffect(() => {
    setFlipped(false)
  }, [game.revealIndex])

  // شاردنەوەی خۆکار بۆ دەستەی کەشتی
  useEffect(() => {
    if (!flipped || isImpostor) return
    setCountdown(REVEAL_SECONDS)
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [flipped, isImpostor])

  const handleFlip = () => {
    setFlipped(true)
    if (isImpostor) sfx.impostor()
    else sfx.reveal()
  }

  // پەردەی گواستنەوەی ئامێر
  if (!flipped) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-8 text-center">
        <div className="animate-fade-in">
          <Hand className="mx-auto mb-4 h-14 w-14 text-crew" />
          <p className="mb-2 text-muted">{t('ئامێرەکە بدە بە')}</p>
          <h1 className="mb-1 text-4xl font-black text-ink">{player.name}</h1>
          <p className="mb-10 text-sm text-muted">{t('یاریزانی')} {game.revealIndex + 1} {t('لە')} {game.players.length}</p>
          <button
            onClick={handleFlip}
            className="btn-press animate-pulse-glow group mx-auto flex h-48 w-48 flex-col items-center justify-center gap-3 rounded-full border-2 border-crew/40 bg-surface shadow-soft"
          >
            <Eye className="h-12 w-12 text-crew transition group-hover:scale-110" />
            <span className="font-bold text-crew">{t('پیشاندانی ڕۆڵ')}</span>
          </button>
          <p className="mt-10 text-xs text-muted">{t('دڵنیابە کەسی تر سەیر ناکات!')}</p>
        </div>
      </div>
    )
  }

  // ساختەکار
  if (isImpostor) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-8 text-center">
        <div className="w-full animate-scale-in">
          <div className="animate-pulse-glow-red mb-5 inline-flex rounded-full border-2 border-impostor bg-impostor/12 p-6">
            <Skull className="h-16 w-16 text-impostor" />
          </div>
          <h1 className="mb-2 text-4xl font-black text-impostor">{t('ساختەکار')}</h1>
          {isUndercover ? (
            <>
              <p className="mb-4 text-xl font-bold text-ink">{t('وشەی تۆ نزیکە — بەڵام لەوانەیە جیاواز بێت!')}</p>
              <Panel className="mx-auto mb-5 max-w-xs border-impostor/40">
                <p className="mb-2 text-xs text-muted">{t('وشەی تۆ')}</p>
                <h2 className="mb-3 text-3xl font-black text-impostor">{game.decoyWord.ku}</h2>
                <div className="flex justify-center">
                  <WordImage englishPrompt={game.decoyWord.en} emoji={game.decoyWord.emoji} size={150} />
                </div>
              </Panel>
            </>
          ) : (
            <p className="mb-5 text-xl font-bold text-ink">{t('تۆ وشەکە نازانیت!')}</p>
          )}
          <Panel className="mx-auto mb-6 max-w-xs">
            {allies.length > 0 ? (
              <>
                <p className="mb-3 flex items-center justify-center gap-2 text-sm text-muted">
                  <Users className="h-4 w-4" /> {t('هاوەڵە ساختەکارەکانت')}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {allies.map((a) => (
                    <span key={a.id} className="rounded-full bg-impostor/12 px-3 py-1 font-bold text-impostor">{a.name}</span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">{t('تۆ تاکە ساختەکاریت. بەختت یارت بێت!')}</p>
            )}
          </Panel>
          <Button onClick={nextReveal} variant="danger" className="w-full">
            {isLast ? t('تەواوبوون — چوون بەرەو گفتوگۆ') : t('ئامێرەکە بگەڕێنەوە')}
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>
    )
  }

  // دەستەی کەشتی
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-8 text-center">
      <div className="w-full animate-scale-in">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-crew/40 bg-crew/10 px-3 py-1 text-crew">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-sm font-bold">{t('دەستەی کەشتی')}</span>
        </div>
        <p className="mb-1 text-xs text-muted">{t('هاوپۆل:')} {game.category.name}</p>
        <h1 className="mb-4 text-4xl font-black text-ink">{game.secretWord.ku}</h1>
        <div className="mb-5 flex justify-center">
          <WordImage englishPrompt={game.secretWord.en} emoji={game.secretWord.emoji} size={210} />
        </div>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-impostor/12 px-4 py-2 text-impostor">
          <EyeOff className="h-4 w-4" />
          <span className="text-sm font-bold">{t('دەشاردرێتەوە لە')} {countdown} {t('چرکە')}</span>
        </div>
        <Button onClick={nextReveal} className="w-full">
          {isLast ? t('تەواوبوون — چوون بەرەو گفتوگۆ') : t('ئامێرەکە بگەڕێنەوە')}
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

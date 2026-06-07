import { useState, useEffect, useRef } from 'react'
import { Eye, Skull, ShieldCheck, EyeOff, MessageSquare, Users, Loader2, Search } from 'lucide-react'
import { useRoom } from '../state/RoomContext'
import { useWords } from '../state/WordsContext'
import { Button, Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import WordImage from '../components/WordImage'
import { useT } from '../lib/i18n'
import { sfx, playGameStart } from '../lib/sound'

const DEFAULT_REVEAL_SECONDS = 10

export default function Reveal() {
  const { room, me, isHost, beginDiscussion, myRole, myAllies, detectiveTarget } = useRoom()
  const { categories: CATEGORIES, findWord } = useWords()
  const t = useT()
  // ماوەی شاردنەوەی کارت — ڕێکخراوی خانەخوێ (یەدەگ: ١٠ چرکە)
  const revealSeconds = room.reveal_seconds || DEFAULT_REVEAL_SECONDS
  const [flipped, setFlipped] = useState(false)
  const [countdown, setCountdown] = useState(revealSeconds)
  const timerRef = useRef(null)

  // دەنگی دەستپێکردنی یاری — یەک جار کاتێک قۆناغی ئاشکراکردن دەستپێدەکات
  useEffect(() => {
    playGameStart()
  }, [])

  // P0#1: ڕۆڵ + هاوپەیمان + ئامانجی لێکۆڵەر لە سێرڤەرەوە دێن (نەک room_players)
  const isImpostor = myRole === 'impostor'
  // لێکۆڵەر: یاریزانی دەستەی کەشتی کە ناسنامەی ساختەکارێک دەزانێت
  const isDetective = myRole === 'detective'
  const knownImpostor = isDetective ? detectiveTarget : null
  const category = CATEGORIES.find((c) => c.id === room.category_id)
  const allies = myAllies
  // دۆخی «متخفّی»: ساختەکار وشەیەکی نزیک وەردەگرێت لە جیاتی هیچ
  const isUndercover = room.mode === 'undercover' && !!room.decoy_word_ku

  // شاردنەوەی خۆکاری کارت بۆ دەستەی کەشتی دوای ١٠ چرکە
  useEffect(() => {
    if (!flipped || isImpostor) return
    setCountdown(revealSeconds)
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current)
          setFlipped(false)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [flipped, isImpostor, revealSeconds])

  const handleFlip = () => {
    setFlipped(true)
    if (isImpostor) sfx.impostor()
    else sfx.reveal()
  }

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center text-crew">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // ───── بینەر (spectator) ─────
  if (me.is_spectator) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-8 text-center">
        <div className="animate-scale-in">
          <div className="mb-4 inline-flex rounded-full border-2 border-ink/20 bg-ink/5 p-5">
            <Eye className="h-14 w-14 text-ink/40" />
          </div>
          <h1 className="mb-1 text-3xl font-black text-ink">{t('بینەر')}</h1>
          <p className="mb-6 text-ink/60">{t('یاری دەستی پێکردووە — تۆ سەیری دەکەیت. لە یاری داهاتوودا بەشدار دەبیت.')}</p>
          <p className="text-sm text-ink/40">{t('چاوەڕێی قۆناغی گفتوگۆ بکە…')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-8 pb-28">
      {/* پێش کلیک */}
      {!flipped ? (
        <div className="animate-fade-in text-center">
          <p className="mb-2 text-ink/60">{t('کارتەکەت ئامادەیە')}</p>
          <h1 className="mb-1 text-2xl font-black text-ink">{me.display_name}</h1>
          <p className="mb-10 text-sm text-ink/40">{t('کلیک بکە بۆ بینینی ڕۆڵەکەت')}</p>

          <button
            onClick={handleFlip}
            disabled={!myRole}
            className="btn-press animate-pulse-glow neon-ring group mx-auto flex h-52 w-52 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-crew/40 bg-surface/60 backdrop-blur disabled:opacity-50"
          >
            {myRole ? (
              <>
                <Eye className="h-14 w-14 text-crew transition group-hover:scale-110" />
                <span className="font-bold text-crew">{t('بینینی ڕۆڵ')}</span>
              </>
            ) : (
              <Loader2 className="h-10 w-10 animate-spin text-crew" />
            )}
          </button>
        </div>
      ) : isImpostor ? (
        // ───── ساختەکار ─────
        <div className="animate-flip-in w-full text-center">
          <div className="animate-pulse-glow-red mb-4 inline-flex rounded-full border-2 border-impostor bg-impostor/15 p-5">
            <Skull className="h-14 w-14 text-impostor" />
          </div>
          <h1 className="mb-1 text-3xl font-black text-impostor">{t('ساختەکار')}</h1>
          {isUndercover ? (
            <>
              <p className="mb-3 text-lg font-bold text-ink">{t('وشەی تۆ نزیکە — بەڵام لەوانەیە جیاواز بێت!')}</p>
              <Panel className="mb-6 border-impostor/40">
                <p className="mb-2 text-xs text-ink/50">{t('وشەی تۆ')}</p>
                <h2 className="mb-3 text-3xl font-black text-impostor">{room.decoy_word_ku}</h2>
                <div className="flex justify-center">
                  <WordImage imageUrl={findWord(room.decoy_word_ku)?.image_url} englishPrompt={room.decoy_word_en} emoji={findWord(room.decoy_word_ku)?.emoji} size={160} />
                </div>
                <p className="mt-3 text-xs text-ink/50">{t('خۆت دەربخە وەک دەستەی کەشتی — ئەوان لەوانەیە وشەیەکی تری هاوپۆڵیان هەبێت.')}</p>
              </Panel>
            </>
          ) : (
            <p className="mb-6 text-lg font-bold text-ink">{t('تۆ وشەکە نازانیت!')}</p>
          )}

          <Panel className="mb-6 border-impostor/30">
            {allies.length > 0 ? (
              <>
                <p className="mb-3 flex items-center justify-center gap-2 text-sm text-ink/60">
                  <Users className="h-4 w-4" />
                  {t('هاوەڵە ساختەکارەکانت')}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {allies.map((a) => (
                    <div key={a.user_id} className="flex flex-col items-center gap-1">
                      <Avatar url={a.avatar_url} name={a.display_name} size={48} ring ringColor="impostor" />
                      <span className="text-sm font-medium text-ink">{a.display_name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-ink/60">{t('تۆ تاکە ساختەکاریت. بەختت یارت بێت!')}</p>
            )}
          </Panel>

          <p className="text-sm text-ink/50">
            {t('گوێ بگرە لە ئاماژەکان و خۆت وەک دەستەی کەشتی دەربخە.')}
          </p>
        </div>
      ) : (
        // ───── دەستەی کەشتی ─────
        <div className="animate-flip-in w-full text-center">
          {isDetective ? (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-400/10 px-3 py-1 text-amber-500">
              <Search className="h-4 w-4" />
              <span className="text-sm font-bold">{t('لێکۆڵەر')}</span>
            </div>
          ) : (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-crew/40 bg-crew/10 px-3 py-1 text-crew">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-sm font-bold">{t('دەستەی کەشتی')}</span>
            </div>
          )}
          <p className="mb-1 text-xs text-ink/50">هاوپۆل: {category?.name}</p>
          <h1 className="mb-4 text-4xl font-black text-ink neon-text">{room.secret_word_ku}</h1>

          <div className="mb-4 flex justify-center">
            <WordImage imageUrl={findWord(room.secret_word_ku)?.image_url} englishPrompt={room.secret_word_en} emoji={findWord(room.secret_word_ku)?.emoji} size={220} />
          </div>

          {/* ئاماژەی لێکۆڵەر — ناسنامەی ساختەکارێک */}
          {isDetective && knownImpostor && (
            <Panel className="mb-4 border-amber-400/40 bg-amber-400/5">
              <p className="mb-2 flex items-center justify-center gap-2 text-xs text-ink/60">
                <Search className="h-4 w-4 text-amber-500" />
                {t('زانیاری نهێنی')}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Avatar url={knownImpostor.avatar_url} name={knownImpostor.display_name} size={40} ring ringColor="impostor" />
                <div className="text-right">
                  <p className="font-bold text-impostor">{knownImpostor.display_name}</p>
                  <p className="text-xs text-ink/50">{t('ساختەکارە! بەبێ ئاشکراکردن دەستەکەت ئاراستە بکە.')}</p>
                </div>
              </div>
            </Panel>
          )}

          <p className="mb-5 text-sm text-ink/60">
            {t('ئەمە وشە نهێنیەکەتە. بیری لێ بکەرەوە چۆن بەبێ ئاشکراکردن وەسفی بکەیت.')}
          </p>

          <div className="inline-flex items-center gap-2 rounded-full bg-impostor/15 px-4 py-2 text-impostor">
            <EyeOff className="h-4 w-4" />
            <span className="text-sm font-bold">دەشاردرێتەوە لە {countdown} چرکە</span>
          </div>
        </div>
      )}

      {/* کۆنترۆڵی خانەخوێ */}
      <div className="mt-10 w-full">
        {isHost ? (
          <Button onClick={beginDiscussion} className="w-full !py-4">
            <MessageSquare className="h-5 w-5" />
            {t('دەستپێکردنی گفتوگۆ')}
          </Button>
        ) : (
          <p className="text-center text-sm text-ink/40">
            {t('چاوەڕێی خانەخوێ بکە بۆ دەستپێکردنی گفتوگۆ…')}
          </p>
        )}
      </div>
    </div>
  )
}

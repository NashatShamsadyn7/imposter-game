// ═══════════════════════════════════════════════════════════
//  DirectVoiceBar — پەیوەندیی دەنگی لەناو گفتوگۆی تایبەت (١-بۆ-١)
//  هەردوو لا دەتوانن قسە بکەن (canSpeak=true). دەبێتە منداڵی VoiceProvider.
// ═══════════════════════════════════════════════════════════

import { Mic, MicOff, PhoneOff, Loader2, Volume2, WifiOff } from 'lucide-react'
import { useVoice } from '../state/VoiceContext'
import Avatar from './Avatar'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'

export default function DirectVoiceBar({ onEnd, otherIdentity, other }) {
  const voice = useVoice()
  const t = useT()
  if (!voice) return null

  const { status, micOn, toggleMic, speakers, participants, available } = voice

  // LiveKit ڕێکنەخراوە — ئاگادارکردنەوە و کۆتاییهێنان
  if (!available) {
    return (
      <div className="mb-3 flex items-center justify-between rounded-2xl border border-impostor/30 bg-impostor/10 px-4 py-2.5 animate-fade-in">
        <span className="flex items-center gap-2 text-sm font-bold text-impostor">
          <WifiOff className="h-4 w-4" /> {t('دەنگ ڕێکنەخراوە')}
        </span>
        <button
          onClick={onEnd}
          className="btn-press rounded-xl bg-impostor/15 px-3 py-1.5 text-xs font-bold text-impostor"
        >
          {t('کۆتایی')}
        </button>
      </div>
    )
  }

  const otherInCall = participants.has(otherIdentity)
  const otherTalking = speakers.has(otherIdentity)

  let statusText
  if (status === 'connecting') statusText = t('پەیوەستبوون…')
  else if (!otherInCall) statusText = t('چاوەڕێی بەرامبەر…')
  else if (otherTalking) statusText = `${other?.display_name || t('بەرامبەر')} ${t('قسە دەکات')}`
  else statusText = t('لە پەیوەندیدا')

  const handleMic = () => {
    sfx.tap()
    toggleMic()
  }

  return (
    <div className="mb-3 flex items-center gap-3 rounded-2xl border border-crew/30 bg-crew/10 px-3 py-2 animate-fade-in">
      <div className={otherTalking ? 'rounded-full ring-2 ring-crew' : ''}>
        <Avatar url={other?.avatar_url} name={other?.display_name} size={32} />
      </div>
      <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm font-bold text-ink">
        {status === 'connecting' && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-crew" />}
        {otherTalking && <Volume2 className="h-4 w-4 shrink-0 animate-pulse text-crew" />}
        {statusText}
      </span>

      {/* کتم/کردنەوەی مایک */}
      <button
        onClick={handleMic}
        disabled={status !== 'connected'}
        className={`btn-press grid h-10 w-10 shrink-0 place-items-center rounded-full transition disabled:opacity-40 ${
          micOn ? 'bg-crew text-white' : 'bg-impostor/15 text-impostor'
        }`}
        title={micOn ? t('مایک داخستن') : t('مایک کردنەوە')}
      >
        {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>

      {/* کۆتاییهێنان بە پەیوەندی */}
      <button
        onClick={() => { sfx.tap(); onEnd() }}
        className="btn-press grid h-10 w-10 shrink-0 place-items-center rounded-full bg-impostor text-white"
        title={t('کۆتایی پەیوەندی')}
      >
        <PhoneOff className="h-5 w-5" />
      </button>
    </div>
  )
}

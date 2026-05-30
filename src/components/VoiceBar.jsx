// ═══════════════════════════════════════════════════════════
//  VoiceBar — کۆنترۆڵی دەنگ + ڕێگەپێدانی مایک
//  هەموو کەس کتمە؛ خانەخوێ ڕێگە دەدات. یاریزان داوای مایک دەکات.
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import {
  Mic,
  MicOff,
  Hand,
  Clock,
  Check,
  Loader2,
  Volume2,
  ChevronUp,
  ChevronDown,
  WifiOff,
  ShieldCheck,
} from 'lucide-react'
import { useVoice } from '../state/VoiceContext'
import { useRoom } from '../state/RoomContext'
import { useNotify } from '../state/NotificationContext'
import Avatar from './Avatar'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'

export default function VoiceBar() {
  const voice = useVoice()
  const { players, me, isHost, requestMic, setSpeak } = useRoom()
  const notify = useNotify()
  const t = useT()
  const [open, setOpen] = useState(false)
  const wasGranted = useRef(me?.can_speak)

  // ئاگادارکردنەوە کاتێک خانەخوێ ڕێگەی پێدا
  useEffect(() => {
    if (me?.can_speak && !wasGranted.current && !me?.is_host) {
      notify({ title: 'مایک 🎤', body: 'خانەخوێ ڕێگەی پێدایت قسە بکەیت', type: 'default' })
      sfx.tap()
    }
    wasGranted.current = me?.can_speak
  }, [me?.can_speak, me?.is_host, notify])

  if (!voice || !voice.available) return null

  const { status, micOn, toggleMic, speakers, participants, selfIdentity, error, canSpeak } = voice

  const byId = (id) => players.find((p) => p.user_id === id)
  const speakerList = [...speakers].map((id) => byId(id)).filter(Boolean)
  const inVoice = [...participants]

  // داواکارییەکانی مایک (بۆ خانەخوێ)
  const pendingReqs = isHost
    ? players.filter((p) => p.mic_requested && !p.can_speak)
    : []

  const handleMicBtn = () => {
    sfx.tap()
    if (canSpeak) toggleMic()
    else if (!me?.mic_requested) requestMic()
  }

  // دەردانی دۆخی دوگمەی مایک
  let micBtn
  if (canSpeak) {
    micBtn = (
      <button
        onClick={handleMicBtn}
        disabled={status !== 'connected'}
        className={`btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition disabled:opacity-40 ${
          micOn
            ? 'bg-crew text-white shadow-[0_6px_18px_-6px_rgba(14,156,142,0.7)]'
            : 'bg-impostor/15 text-impostor'
        }`}
        title={micOn ? t('مایک داخستن') : t('مایک کردنەوە')}
      >
        {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>
    )
  } else if (me?.mic_requested) {
    micBtn = (
      <div
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-amber-500/15 px-3 text-amber-500"
        title={t('چاوەڕێی ڕەزامەندیی خانەخوێ')}
      >
        <Clock className="h-4 w-4 animate-pulse" />
        <span className="text-xs font-bold">{t('چاوەڕێ…')}</span>
      </div>
    )
  } else {
    micBtn = (
      <button
        onClick={handleMicBtn}
        disabled={status !== 'connected'}
        className="btn-press flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-crew/15 px-3 text-crew disabled:opacity-40"
        title={t('داوای مایک بکە')}
      >
        <Hand className="h-4 w-4" />
        <span className="text-xs font-bold">{t('داوای مایک')}</span>
      </button>
    )
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3">
      <div className="pointer-events-auto w-full max-w-md">
        {/* پانێڵی کراوە */}
        {open && (
          <div className="mb-2 max-h-72 overflow-y-auto rounded-2xl border border-line bg-surface/95 p-3 shadow-card backdrop-blur animate-fade-in">
            {/* داواکارییەکانی مایک — تەنها خانەخوێ */}
            {isHost && pendingReqs.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Hand className="h-3.5 w-3.5" /> {t('داوای مایک')} ({pendingReqs.length})
                </p>
                <div className="space-y-1.5">
                  {pendingReqs.map((p) => (
                    <div
                      key={p.user_id}
                      className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-2 py-1.5"
                    >
                      <Avatar url={p.avatar_url} name={p.display_name} size={28} />
                      <span className="flex-1 truncate text-sm text-ink">{p.display_name}</span>
                      <button
                        onClick={() => {
                          sfx.tap()
                          setSpeak(p.user_id, true)
                        }}
                        className="btn-press flex items-center gap-1 rounded-lg bg-crew px-2.5 py-1 text-xs font-bold text-white"
                      >
                        <Check className="h-3.5 w-3.5" /> {t('ڕێگەپێدان')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* لیستی ئەوانەی لە دەنگدان */}
            <p className="mb-2 text-xs font-bold text-muted">{t('لە دەنگدا')} ({inVoice.length})</p>
            <div className="space-y-1.5">
              {inVoice.map((id) => {
                const p = byId(id)
                const talking = speakers.has(id)
                const allowed = p?.can_speak
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition ${
                      talking ? 'bg-crew/15' : 'bg-ink/5'
                    }`}
                  >
                    <div className={talking ? 'rounded-full ring-2 ring-crew' : ''}>
                      <Avatar url={p?.avatar_url} name={p?.display_name || '?'} size={28} />
                    </div>
                    <span className="flex-1 truncate text-sm text-ink">
                      {p?.display_name || t('یاریزان')}
                      {id === selfIdentity && <span className="text-xs text-crew"> ({t('تۆ')})</span>}
                    </span>
                    {talking && <Volume2 className="h-4 w-4 animate-pulse text-crew" />}
                    {allowed ? (
                      <Mic className="h-3.5 w-3.5 text-crew/70" />
                    ) : (
                      <MicOff className="h-3.5 w-3.5 text-ink/30" />
                    )}
                    {/* خانەخوێ: سەنینەوەی ڕێگە */}
                    {isHost && allowed && !p?.is_host && (
                      <button
                        onClick={() => {
                          sfx.tap()
                          setSpeak(p.user_id, false)
                        }}
                        className="btn-press rounded-lg bg-impostor/15 px-2 py-1 text-xs font-bold text-impostor"
                        title={t('سەنینەوەی مایک')}
                      >
                        {t('کتم')}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* شریتی سەرەکی */}
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface/95 px-3 py-2 shadow-card backdrop-blur">
          {status === 'connecting' && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-crew" />}
          {status === 'error' && (
            <span title={error || ''}>
              <WifiOff className="h-5 w-5 shrink-0 text-impostor" />
            </span>
          )}

          <button
            onClick={() => {
              sfx.tap()
              setOpen((o) => !o)
            }}
            className="relative flex min-w-0 flex-1 items-center gap-1.5"
          >
            <div className="flex -space-x-2">
              {speakerList.slice(0, 3).map((p) => (
                <div key={p.user_id} className="rounded-full ring-2 ring-crew">
                  <Avatar url={p.avatar_url} name={p.display_name} size={26} />
                </div>
              ))}
            </div>
            <span className="truncate text-sm text-ink/80">
              {status === 'connecting'
                ? t('پەیوەستبوون…')
                : speakerList.length === 0
                ? `${t('دەنگ')} • ${inVoice.length} ${t('یاریزان')}`
                : speakerList.length === 1
                ? `${speakerList[0].display_name} ${t('قسە دەکات')}`
                : `${speakerList.length} ${t('کەس قسە دەکەن')}`}
            </span>
            {/* بیجی داواکاری بۆ خانەخوێ */}
            {isHost && pendingReqs.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-black text-white">
                {pendingReqs.length}
              </span>
            )}
            {open ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
            ) : (
              <ChevronUp className="h-4 w-4 shrink-0 text-muted" />
            )}
          </button>

          {isHost && (
            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-500" title={t('تۆ خانەخوێیت')} />
          )}

          {micBtn}
        </div>
      </div>
    </div>
  )
}

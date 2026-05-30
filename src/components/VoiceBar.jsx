// ═══════════════════════════════════════════════════════════
//  VoiceBar — پەنجەرەیەکی لیوزراو بۆ کۆنترۆڵی دەنگ
//  مایک کتم/کردنەوە + پیشاندانی ئەوەی ئێستا قسە دەکات.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react'
import { Mic, MicOff, Loader2, Volume2, ChevronUp, ChevronDown, WifiOff } from 'lucide-react'
import { useVoice } from '../state/VoiceContext'
import { useRoom } from '../state/RoomContext'
import Avatar from './Avatar'
import { sfx } from '../lib/sound'

export default function VoiceBar() {
  const voice = useVoice()
  const { players } = useRoom()
  const [open, setOpen] = useState(false)

  if (!voice || !voice.available) return null

  const { status, micOn, toggleMic, speakers, participants, selfIdentity, error } = voice

  // مابینگی identity → یاریزان
  const byId = (id) => players.find((p) => p.user_id === id)
  const speakerList = [...speakers].map((id) => byId(id)).filter(Boolean)
  const inVoice = [...participants]

  const handleMic = () => {
    sfx.tap()
    toggleMic()
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3">
      <div className="pointer-events-auto w-full max-w-md">
        {/* لیستی ئەوانەی لە دەنگدان (دەکرێتەوە) */}
        {open && (
          <div className="mb-2 max-h-52 overflow-y-auto rounded-2xl border border-line bg-surface/95 p-3 shadow-card backdrop-blur animate-fade-in">
            <p className="mb-2 text-xs font-bold text-muted">
              لە دەنگدا ({inVoice.length})
            </p>
            <div className="space-y-1.5">
              {inVoice.map((id) => {
                const p = byId(id)
                const talking = speakers.has(id)
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
                      {p?.display_name || 'یاریزان'}
                      {id === selfIdentity && <span className="text-xs text-crew"> (تۆ)</span>}
                    </span>
                    {talking && <Volume2 className="h-4 w-4 animate-pulse text-crew" />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* شریتی سەرەکی */}
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface/95 px-3 py-2 shadow-card backdrop-blur">
          {/* دۆخ */}
          {status === 'connecting' && (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-crew" />
          )}
          {status === 'error' && (
            <span title={error || ''}>
              <WifiOff className="h-5 w-5 shrink-0 text-impostor" />
            </span>
          )}

          {/* ئەوانەی قسە دەکەن (پێشبینین) */}
          <button
            onClick={() => {
              sfx.tap()
              setOpen((o) => !o)
            }}
            className="flex min-w-0 flex-1 items-center gap-1.5"
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
                ? 'پەیوەستبوون…'
                : speakerList.length === 0
                ? `دەنگ • ${inVoice.length} یاریزان`
                : speakerList.length === 1
                ? `${speakerList[0].display_name} قسە دەکات`
                : `${speakerList.length} کەس قسە دەکەن`}
            </span>
            {open ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
            ) : (
              <ChevronUp className="h-4 w-4 shrink-0 text-muted" />
            )}
          </button>

          {/* دوگمەی مایک */}
          <button
            onClick={handleMic}
            disabled={status !== 'connected'}
            className={`btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition disabled:opacity-40 ${
              micOn
                ? 'bg-crew text-white shadow-[0_6px_18px_-6px_rgba(14,156,142,0.7)]'
                : 'bg-impostor/15 text-impostor'
            }`}
            title={micOn ? 'مایک داخستن' : 'مایک کردنەوە'}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

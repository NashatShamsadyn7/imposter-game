import { useState, useRef, useEffect } from 'react'
import { Send, Smile, X } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useRoom } from '../state/RoomContext'
import Avatar from './Avatar'
import { sfx } from '../lib/sound'

// ئیمۆجی و دەستەواژەی خێرا بۆ کاردانەوەی خێرا
const QUICK_EMOJIS = ['😂', '😮', '🤔', '👍', '👎', '🔥', '😡', '🤫', '🕵️', '❤️']
const QUICK_PHRASES = ['ئەو ساختەکارە!', 'من نیم!', 'گومانم لێیەتی', 'دڵنیام', 'کێ؟', 'دەنگ بدەن!']

// ناسینەوەی نامەی تەنها ئیمۆجی (بۆ پیشاندانی گەورەتر)
const EMOJI_ONLY = /^[\p{Extended_Pictographic}‍️\s]+$/u

// چاتی ڕاستەوخۆ
export default function Chat({ disabled = false, className = '' }) {
  const { user } = useAuth()
  const { messages, sendMessage } = useRoom()
  const [text, setText] = useState('')
  const [showQuick, setShowQuick] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submit = (e) => {
    e.preventDefault()
    if (!text.trim() || disabled) return
    sendMessage(text)
    sfx.tap()
    setText('')
  }

  // ناردنی خێرا (ئیمۆجی یان دەستەواژە)
  const quickSend = (content) => {
    if (disabled) return
    sendMessage(content)
    sfx.tap()
  }

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-surface/40 ${className}`}>
      {/* نامەکان */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-ink/30">هێشتا نامەیەک نییە — دەست بکە!</p>
        )}
        {messages.map((m) => {
          if (m.kind === 'system') {
            return (
              <p key={m.id} className="text-center text-xs text-ink/40 py-1">
                {m.content}
              </p>
            )
          }
          const mine = m.user_id === user?.id
          const emojiOnly = m.content.length <= 8 && EMOJI_ONLY.test(m.content)
          return (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <Avatar url={m.avatar_url} name={m.display_name} size={28} />
              <div className={`max-w-[75%] ${mine ? 'text-left' : 'text-right'}`}>
                {!mine && <p className="mb-0.5 text-xs text-ink/50">{m.display_name}</p>}
                {emojiOnly ? (
                  <div className={`text-4xl leading-none ${mine ? 'text-left' : 'text-right'}`}>
                    {m.content}
                  </div>
                ) : (
                  <div
                    className={`inline-block rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? 'bg-crew text-white rounded-br-sm'
                        : 'bg-ink/10 text-ink rounded-bl-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* کاردانەوەی خێرا — ئیمۆجی و دەستەواژە */}
      {showQuick && !disabled && (
        <div className="border-t border-ink/10 p-2 animate-fade-in">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => quickSend(e)}
                className="btn-press grid h-9 w-9 place-items-center rounded-xl bg-ink/5 text-xl hover:bg-ink/10"
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PHRASES.map((p) => (
              <button
                key={p}
                onClick={() => quickSend(p)}
                className="btn-press rounded-full border border-ink/10 bg-ink/5 px-3 py-1 text-xs text-ink hover:bg-ink/10"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* نووسین */}
      <form onSubmit={submit} className="flex gap-2 border-t border-ink/10 p-2">
        <button
          type="button"
          onClick={() => setShowQuick((v) => !v)}
          disabled={disabled}
          className={`btn-press flex shrink-0 items-center justify-center rounded-xl px-3 disabled:opacity-40 ${
            showQuick ? 'bg-crew/20 text-crew' : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
          }`}
          title="کاردانەوەی خێرا"
        >
          {showQuick ? <X className="h-5 w-5" /> : <Smile className="h-5 w-5" />}
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabled ? 'ناتوانیت چات بکەیت' : 'نامەیەک بنووسە…'}
          disabled={disabled}
          maxLength={300}
          className="min-w-0 flex-1 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-ink placeholder:text-ink/30 outline-none focus:border-crew/60 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="btn-press flex items-center justify-center rounded-xl bg-crew px-4 text-white disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}

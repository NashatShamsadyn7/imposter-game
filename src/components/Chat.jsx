import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useRoom } from '../state/RoomContext'
import Avatar from './Avatar'
import { sfx } from '../lib/sound'

// چاتی ڕاستەوخۆ
export default function Chat({ disabled = false, className = '' }) {
  const { user } = useAuth()
  const { messages, sendMessage } = useRoom()
  const [text, setText] = useState('')
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
          return (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <Avatar url={m.avatar_url} name={m.display_name} size={28} />
              <div className={`max-w-[75%] ${mine ? 'text-left' : 'text-right'}`}>
                {!mine && <p className="mb-0.5 text-xs text-ink/50">{m.display_name}</p>}
                <div
                  className={`inline-block rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? 'bg-crew text-white rounded-br-sm'
                      : 'bg-ink/10 text-ink rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* نووسین */}
      <form onSubmit={submit} className="flex gap-2 border-t border-ink/10 p-2">
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

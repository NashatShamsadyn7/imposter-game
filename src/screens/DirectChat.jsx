import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Send, Gamepad2, LogIn, Film } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useFriends } from '../state/FriendsContext'
import Avatar from '../components/Avatar'
import GifPicker from '../components/GifPicker'
import { isGifEnabled } from '../lib/gif'
import {
  fetchDirectMessages,
  sendDirectMessage,
  markMessagesRead,
  subscribeDirectMessages,
} from '../lib/supabase'
import { isOnline, lastSeenText } from '../lib/presence'
import { sfx } from '../lib/sound'

// گفتوگۆی تایبەت لەگەڵ هاوڕێیەک
export default function DirectChat({ friend, onBack, onJoinRoom }) {
  const { user } = useAuth()
  const { clearUnread } = useFriends()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [showGif, setShowGif] = useState(false)
  const endRef = useRef(null)
  const other = friend.profile
  const online = isOnline(other?.last_seen)

  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    fetchDirectMessages(user.id, friend.id)
      .then((m) => active && setMessages(m))
      .catch((e) => active && setError(e.message))
    markMessagesRead(user.id, friend.id).catch(() => {})
    clearUnread(friend.id)
    const unsub = subscribeDirectMessages(user.id, (msg) => {
      if (msg.sender_id === friend.id) {
        setMessages((prev) => [...prev, msg])
        markMessagesRead(user.id, friend.id).catch(() => {})
      }
    })
    return () => {
      active = false
      unsub?.()
    }
  }, [user.id, friend.id, clearUnread])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMsg = async (content, kind = 'text') => {
    if (!content.trim()) return
    sfx.tap()
    try {
      const row = await sendDirectMessage(user.id, friend.id, content.trim().slice(0, 500), kind)
      setMessages((prev) => [...prev, row])
    } catch (err) {
      setError(err.message)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    const content = text
    setText('')
    await sendMsg(content)
  }

  return (
    <div className="mx-auto flex h-screen max-w-md flex-col px-4 py-4">
      {/* سەردێڕ */}
      <header className="mb-3 flex items-center gap-3 animate-fade-in">
        <button
          onClick={onBack}
          className="btn-press grid h-10 w-10 place-items-center rounded-xl bg-surface text-muted shadow-card hover:text-ink"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="relative">
          <Avatar url={other?.avatar_url} name={other?.display_name} size={42} ring />
          {online && (
            <span className="absolute bottom-0 left-0 h-3 w-3 rounded-full border-2 border-surface bg-crew" />
          )}
        </div>
        <div className="leading-tight">
          <p className="font-bold text-ink">{other?.display_name}</p>
          <p className="text-xs text-muted">{lastSeenText(other?.last_seen)}</p>
        </div>
      </header>

      {error && (
        <p className="mb-2 rounded-xl bg-impostor/10 px-3 py-2 text-center text-xs text-impostor" dir="ltr">
          {error}
        </p>
      )}

      {/* نامەکان */}
      <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl border border-ink/10 bg-surface/40 p-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-ink/30">هێشتا نامەیەک نییە — سڵاو بکە! 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user.id
          if (m.kind === 'invite') {
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-[80%] rounded-2xl border border-crew/40 bg-crew/10 p-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold text-crew">
                    <Gamepad2 className="h-4 w-4" />
                    بانگهێشت بۆ ژوور
                  </p>
                  <p className="mb-2 font-mono text-xl font-black tracking-widest text-ink">
                    {m.content}
                  </p>
                  {!mine && (
                    <button
                      onClick={() => onJoinRoom?.(m.content)}
                      className="btn-press flex w-full items-center justify-center gap-1.5 rounded-xl bg-crew py-2 text-sm font-bold text-white"
                    >
                      <LogIn className="h-4 w-4" />
                      بەشداربوون
                    </button>
                  )}
                </div>
              </div>
            )
          }
          if (m.kind === 'gif') {
            return (
              <div key={m.id} className={`flex ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                <img
                  src={m.content}
                  alt="GIF"
                  loading="lazy"
                  className="max-h-52 w-auto rounded-2xl border border-line object-contain"
                />
              </div>
            )
          }
          return (
            <div key={m.id} className={`flex ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? 'bg-crew text-white rounded-br-sm'
                    : 'bg-ink/10 text-ink rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* هەڵبژاردنی GIF */}
      {showGif && (
        <GifPicker
          onSelect={(url) => {
            sendMsg(url, 'gif')
            setShowGif(false)
          }}
          onClose={() => setShowGif(false)}
        />
      )}

      {/* نووسین */}
      <form onSubmit={submit} className="mt-3 flex gap-2">
        {isGifEnabled && (
          <button
            type="button"
            onClick={() => setShowGif((s) => !s)}
            className="btn-press grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink/5 text-crew"
            title="GIF"
          >
            <Film className="h-5 w-5" />
          </button>
        )}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="نامەیەک بنووسە…"
          maxLength={500}
          className="min-w-0 flex-1 rounded-2xl border border-ink/10 bg-ink/5 px-4 py-3 text-ink placeholder:text-ink/30 outline-none focus:border-crew/60"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="btn-press flex items-center justify-center rounded-2xl bg-crew px-5 text-white disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}

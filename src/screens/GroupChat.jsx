// ═══════════════════════════════════════════════════════════
//  GroupChat — گفتوگۆی گرووپ: نامە، ئیمۆجی، ئەندامان، پرۆفایل
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Send, Smile, Users, Copy, Check, LogOut, Crown, Film } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useProfileViewer } from '../state/ProfileViewer'
import Avatar from '../components/Avatar'
import GifPicker from '../components/GifPicker'
import { isGifEnabled } from '../lib/gif'
import {
  fetchGroupMessages,
  fetchGroupMembers,
  sendGroupMessage,
  subscribeGroup,
  leaveGroup,
  deleteGroup,
} from '../lib/supabase'
import { isOnline } from '../lib/presence'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'

const QUICK_EMOJIS = ['😂', '😮', '🤔', '👍', '🔥', '❤️', '🎮', '🕵️', '👏', '🥳']
const EMOJI_ONLY = /^[\p{Extended_Pictographic}‍️\s]+$/u

export default function GroupChat({ group, onBack, onLeft }) {
  const { user, profile } = useAuth()
  const { openProfile } = useProfileViewer() || {}
  const t = useT()
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState([])
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showGif, setShowGif] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)
  const endRef = useRef(null)

  const isOwner = group.owner_id === user.id

  const loadMembers = () => fetchGroupMembers(group.id).then(setMembers).catch(() => {})

  useEffect(() => {
    let active = true
    fetchGroupMessages(group.id)
      .then((m) => active && setMessages(m))
      .catch((e) => active && setError(e.message))
    loadMembers()
    const unsub = subscribeGroup(group.id, {
      onMessage: (msg) => {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
      },
      onMembers: loadMembers,
    })
    return () => {
      active = false
      unsub?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (content, kind = 'text') => {
    if (!content.trim()) return
    sfx.tap()
    try {
      const row = await sendGroupMessage(group.id, user, profile, content.trim().slice(0, 500), kind)
      setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]))
    } catch (e) {
      setError(e.message)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    send(text)
    setText('')
  }

  const copyCode = () => {
    navigator.clipboard?.writeText(group.code)
    sfx.click()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleLeave = async () => {
    if (isOwner) {
      if (!confirm(t('تۆ خاوەنی گرووپیت — سڕینەوەی گرووپ بۆ هەمووان؟'))) return
      await deleteGroup(group.id)
    } else {
      if (!confirm(t('دەرچوون لە گرووپ؟'))) return
      await leaveGroup(group.id, user.id)
    }
    onLeft?.()
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
        <Avatar url={group.avatar_url} name={group.name} size={42} ring />
        <button onClick={() => setShowMembers((s) => !s)} className="min-w-0 flex-1 text-right leading-tight">
          <p className="truncate font-bold text-ink">{group.name}</p>
          <p className="flex items-center justify-end gap-1 text-xs text-muted">
            <Users className="h-3 w-3" /> {members.length} {t('ئەندام')}
          </p>
        </button>
        <button
          onClick={copyCode}
          className="btn-press flex items-center gap-1 rounded-xl border border-crew/40 bg-crew/10 px-2.5 py-1.5"
          title={t('کۆدی گرووپ')}
        >
          <span className="font-mono text-sm font-black tracking-wider text-crew">{group.code}</span>
          {copied ? <Check className="h-3.5 w-3.5 text-crew" /> : <Copy className="h-3.5 w-3.5 text-ink/50" />}
        </button>
      </header>

      {/* پانێڵی ئەندامان */}
      {showMembers && (
        <div className="mb-3 max-h-48 overflow-y-auto rounded-2xl border border-line bg-surface p-3 shadow-card animate-fade-in">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold text-muted">{t('ئەندامان')} ({members.length})</p>
            <button onClick={handleLeave} className="flex items-center gap-1 text-xs font-bold text-impostor">
              <LogOut className="h-3.5 w-3.5" /> {isOwner ? t('سڕینەوەی گرووپ') : t('دەرچوون')}
            </button>
          </div>
          <div className="space-y-1.5">
            {members.map((m) => (
              <button
                key={m.user_id}
                onClick={() => openProfile?.(m.user_id, m.profile?.display_name, m.profile?.avatar_url)}
                className="flex w-full items-center gap-2 rounded-xl bg-ink/5 px-2 py-1.5 text-right"
              >
                <div className="relative">
                  <Avatar url={m.profile?.avatar_url} name={m.profile?.display_name} size={30} />
                  {isOnline(m.profile?.last_seen) && (
                    <span className="absolute bottom-0 left-0 h-2.5 w-2.5 rounded-full border-2 border-surface bg-crew" />
                  )}
                </div>
                <span className="flex-1 truncate text-sm text-ink">
                  {m.profile?.display_name || t('یاریزان')}
                  {m.user_id === user.id && <span className="text-xs text-crew"> ({t('تۆ')})</span>}
                </span>
                {(m.role === 'owner' || m.role === 'admin') && (
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="mb-2 rounded-xl bg-impostor/10 px-3 py-2 text-center text-xs text-impostor" dir="ltr">
          {error}
        </p>
      )}

      {/* نامەکان */}
      <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl border border-ink/10 bg-surface/40 p-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-ink/30">{t('یەکەم نامە بنێرە! 👋')}</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user.id
          const emojiOnly = EMOJI_ONLY.test(m.content) && m.content.length <= 6
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
              {!mine && (
                <button onClick={() => openProfile?.(m.sender_id, m.display_name, m.avatar_url)} className="shrink-0 self-end">
                  <Avatar url={m.avatar_url} name={m.display_name} size={28} />
                </button>
              )}
              <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                {!mine && <span className="mb-0.5 px-1 text-[11px] text-muted">{m.display_name}</span>}
                {m.kind === 'gif' ? (
                  <img
                    src={m.content}
                    alt="GIF"
                    loading="lazy"
                    className="max-h-52 w-auto rounded-2xl border border-line object-contain"
                  />
                ) : emojiOnly ? (
                  <span className="text-4xl leading-tight">{m.content}</span>
                ) : (
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm ${
                      mine ? 'rounded-br-sm bg-crew text-white' : 'rounded-bl-sm bg-ink/10 text-ink'
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

      {/* ئیمۆجی خێرا */}
      {showEmoji && (
        <div className="mt-2 flex flex-wrap gap-1.5 rounded-2xl border border-line bg-surface p-2 animate-fade-in">
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => {
                send(e)
                setShowEmoji(false)
              }}
              className="btn-press grid h-9 w-9 place-items-center rounded-xl text-xl hover:bg-ink/10"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* هەڵبژاردنی GIF */}
      {showGif && (
        <GifPicker
          onSelect={(url) => {
            send(url, 'gif')
            setShowGif(false)
          }}
          onClose={() => setShowGif(false)}
        />
      )}

      {/* نووسین */}
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setShowEmoji((s) => !s)
            setShowGif(false)
          }}
          className="btn-press grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink/5 text-crew"
        >
          <Smile className="h-5 w-5" />
        </button>
        {isGifEnabled && (
          <button
            type="button"
            onClick={() => {
              setShowGif((s) => !s)
              setShowEmoji(false)
            }}
            className="btn-press grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink/5 text-crew"
            title="GIF"
          >
            <Film className="h-5 w-5" />
          </button>
        )}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('نامەیەک بنووسە…')}
          maxLength={500}
          enterKeyHint="send"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="sentences"
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

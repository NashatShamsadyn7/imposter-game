import { useState } from 'react'
import {
  ChevronRight,
  UserPlus,
  Check,
  X,
  MessageCircle,
  Users,
  Loader2,
  Trash2,
} from 'lucide-react'
import { useFriends } from '../state/FriendsContext'
import { useProfileViewer } from '../state/ProfileViewer'
import { useT } from '../lib/i18n'
import { Button, Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import DirectChat from './DirectChat'
import { isOnline, lastSeenText } from '../lib/presence'
import { sfx } from '../lib/sound'

// شاشەی هاوڕێیان
export default function Friends({ onBack, onJoinRoom }) {
  const { friends, incoming, outgoing, unread, addFriendByCode, accept, reject, remove } =
    useFriends()
  const { openProfile } = useProfileViewer() || {}
  const t = useT()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null)
  const [adding, setAdding] = useState(false)
  const [chatWith, setChatWith] = useState(null)

  if (chatWith) {
    return (
      <DirectChat friend={chatWith} onBack={() => setChatWith(null)} onJoinRoom={onJoinRoom} />
    )
  }

  const submitAdd = async () => {
    if (!code.trim()) return
    setAdding(true)
    setMsg(null)
    const res = await addFriendByCode(code)
    setAdding(false)
    if (res.error) {
      setMsg({ type: 'error', text: res.error })
    } else {
      setMsg({ type: 'ok', text: `داواکاری نێردرا بۆ ${res.name}` })
      setCode('')
      sfx.tap()
    }
  }

  // ڕیزکردنی هاوڕێیان: ئۆنلاینەکان سەرەوە
  const sorted = [...friends].sort(
    (a, b) => Number(isOnline(b.profile?.last_seen)) - Number(isOnline(a.profile?.last_seen))
  )

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <header className="mb-6 flex items-center gap-3 animate-fade-in">
        <button
          onClick={onBack}
          className="btn-press grid h-10 w-10 place-items-center rounded-xl bg-surface text-muted shadow-card hover:text-ink"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-crew" />
          <h1 className="text-2xl font-black text-ink">{t('هاوڕێیان')}</h1>
        </div>
      </header>

      {/* زیادکردن بە کۆد */}
      <Panel className="mb-5 !p-4">
        <p className="mb-3 text-sm font-bold text-ink">{t('زیادکردنی هاوڕێ بە کۆد')}</p>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
            placeholder={t('کۆدی هاوڕێ')}
            maxLength={6}
            className="min-w-0 flex-1 rounded-2xl border border-line bg-surface2 px-4 py-3 text-center font-mono text-lg font-black tracking-widest text-ink placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-muted/60 outline-none focus:border-crew"
          />
          <Button onClick={submitAdd} disabled={adding || !code.trim()} className="!px-4">
            {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
          </Button>
        </div>
        {msg && (
          <p
            className={`mt-2 text-center text-sm font-medium ${
              msg.type === 'error' ? 'text-impostor' : 'text-crew'
            }`}
          >
            {msg.text}
          </p>
        )}
      </Panel>

      {/* داواکارییە هاتووەکان */}
      {incoming.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-2 text-sm font-bold text-ink">{t('داواکاری هاوڕێیەتی')} ({incoming.length})</h2>
          <div className="space-y-2">
            {incoming.map((f) => (
              <Panel key={f.friendshipId} className="flex items-center gap-3 !p-3">
                <button
                  onClick={() => { sfx.tap(); openProfile?.(f.id, f.profile?.display_name, f.profile?.avatar_url) }}
                  className="btn-press flex min-w-0 flex-1 items-center gap-3 text-right"
                >
                  <Avatar url={f.profile?.avatar_url} name={f.profile?.display_name} size={40} />
                  <span className="min-w-0 flex-1 truncate font-bold text-ink">{f.profile?.display_name}</span>
                </button>
                <button
                  onClick={() => { sfx.tap(); accept(f.friendshipId) }}
                  className="btn-press grid h-9 w-9 place-items-center rounded-xl bg-crew text-white"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => { sfx.tap(); reject(f.friendshipId) }}
                  className="btn-press grid h-9 w-9 place-items-center rounded-xl bg-ink/10 text-ink hover:text-impostor"
                >
                  <X className="h-5 w-5" />
                </button>
              </Panel>
            ))}
          </div>
        </div>
      )}

      {/* لیستی هاوڕێیان */}
      <h2 className="mb-2 text-sm font-bold text-ink">{t('هاوڕێیانم')} ({friends.length})</h2>
      {sorted.length === 0 ? (
        <Panel className="py-8 text-center text-sm text-muted">
          {t('هێشتا هاوڕێیەکت نییە — کۆدێک زیاد بکە بۆ دەستپێکردن')}
        </Panel>
      ) : (
        <div className="space-y-2">
          {sorted.map((f) => {
            const online = isOnline(f.profile?.last_seen)
            const badge = unread[f.id] || 0
            return (
              <Panel key={f.friendshipId} className="flex items-center gap-3 !p-3">
                <button
                  onClick={() => { sfx.tap(); openProfile?.(f.id, f.profile?.display_name, f.profile?.avatar_url) }}
                  className="btn-press flex min-w-0 flex-1 items-center gap-3 text-right"
                >
                  <div className="relative shrink-0">
                    <Avatar url={f.profile?.avatar_url} name={f.profile?.display_name} size={44} />
                    <span
                      className={`absolute bottom-0 left-0 h-3.5 w-3.5 rounded-full border-2 border-surface ${
                        online ? 'bg-crew' : 'bg-ink/30'
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink">{f.profile?.display_name}</p>
                    <p className={`text-xs ${online ? 'text-crew' : 'text-muted'}`}>
                      {lastSeenText(f.profile?.last_seen)}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => { sfx.tap(); setChatWith(f) }}
                  className="btn-press relative grid h-10 w-10 place-items-center rounded-xl bg-crew/12 text-crew hover:bg-crew/20"
                  title={t('چات')}
                >
                  <MessageCircle className="h-5 w-5" />
                  {badge > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-impostor px-1 text-[10px] font-black text-white">
                      {badge}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { sfx.tap(); remove(f.friendshipId) }}
                  className="btn-press grid h-10 w-10 place-items-center rounded-xl bg-ink/5 text-muted hover:text-impostor"
                  title={t('سڕینەوە')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Panel>
            )
          })}
        </div>
      )}

      {/* داواکاری نێردراوەکان */}
      {outgoing.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-2 text-sm font-bold text-muted">{t('چاوەڕوانی وەڵام')} ({outgoing.length})</h2>
          <div className="space-y-2">
            {outgoing.map((f) => (
              <Panel key={f.friendshipId} className="flex items-center gap-3 !p-3 opacity-70">
                <Avatar url={f.profile?.avatar_url} name={f.profile?.display_name} size={36} />
                <span className="flex-1 truncate text-sm font-bold text-ink">
                  {f.profile?.display_name}
                </span>
                <button
                  onClick={() => remove(f.friendshipId)}
                  className="btn-press text-xs text-muted hover:text-impostor"
                >
                  {t('هەڵوەشاندنەوە')}
                </button>
              </Panel>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import {
  ChevronRight,
  UserPlus,
  Check,
  X,
  MessageCircle,
  Users,
  Loader2,
  Trash2,
  Search,
  AtSign,
  MessagesSquare,
} from 'lucide-react'
import { useFriends } from '../state/FriendsContext'
import { useProfileViewer } from '../state/ProfileViewer'
import { useT } from '../lib/i18n'
import { Button, Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import DirectChat from './DirectChat'
import Groups from './Groups'
import { isOnline, lastSeenText } from '../lib/presence'
import { sfx } from '../lib/sound'

// شاشەی هاوڕێیان
export default function Friends({ onBack, onJoinRoom }) {
  const { friends, incoming, outgoing, unread, searchUsers, addFriendByUsername, accept, reject, remove } =
    useFriends()
  const { openProfile } = useProfileViewer() || {}
  const t = useT()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [msg, setMsg] = useState(null)
  const [sentTo, setSentTo] = useState({}) // id -> true
  const [chatWith, setChatWith] = useState(null)
  const [tab, setTab] = useState('friends') // friends | groups

  // گەڕانی خۆکار (debounce) — کاتێک ٢ پیت یان زیاتر بنووسرێت
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    let cancelled = false
    setSearching(true)
    const id = setTimeout(async () => {
      const rows = await searchUsers(q)
      if (!cancelled) {
        setResults(rows)
        setSearching(false)
      }
    }, 350)
    return () => { cancelled = true; clearTimeout(id) }
  }, [query, searchUsers])

  if (chatWith) {
    return (
      <DirectChat friend={chatWith} onBack={() => setChatWith(null)} onJoinRoom={onJoinRoom} />
    )
  }

  const sendRequest = async (username, id) => {
    setMsg(null)
    const res = await addFriendByUsername(username)
    if (res.error) {
      setMsg({ type: 'error', text: res.error })
    } else {
      setSentTo((p) => ({ ...p, [id]: true }))
      setMsg({ type: 'ok', text: `داواکاری نێردرا بۆ ${res.name}` })
      sfx.tap()
    }
  }

  // ڕیزکردنی هاوڕێیان: ئۆنلاینەکان سەرەوە
  const sorted = [...friends].sort(
    (a, b) => Number(isOnline(b.profile?.last_seen)) - Number(isOnline(a.profile?.last_seen))
  )

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24 md:max-w-2xl">
      <header className="mb-6 flex items-center gap-3 animate-fade-in">
        <button
          onClick={onBack}
          className="btn-press grid h-10 w-10 place-items-center rounded-xl bg-surface text-muted shadow-card hover:text-ink"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-crew" />
          <h1 className="text-2xl font-black text-ink">{t('هاوڕێیان و گرووپەکان')}</h1>
        </div>
      </header>

      {/* تابەکان: هاوڕێیان | گرووپەکان */}
      <div className="mb-5 flex rounded-2xl bg-surface2 p-1">
        <button
          onClick={() => { sfx.tap(); setTab('friends') }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold transition ${
            tab === 'friends' ? 'bg-crew text-white shadow-card' : 'text-muted'
          }`}
        >
          <Users className="h-4 w-4" /> {t('هاوڕێیان')}
        </button>
        <button
          onClick={() => { sfx.tap(); setTab('groups') }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold transition ${
            tab === 'groups' ? 'bg-crew text-white shadow-card' : 'text-muted'
          }`}
        >
          <MessagesSquare className="h-4 w-4" /> {t('گرووپەکان')}
        </button>
      </div>

      {tab === 'groups' && <Groups embedded />}

      {tab === 'friends' && (
      <>
      {/* گەڕان بەپێی یوزەرنەیم */}
      <Panel className="mb-5 !p-4">
        <p className="mb-3 text-sm font-bold text-ink">{t('گەڕان بۆ هاوڕێ بە ناوی بەکارهێنەر')}</p>
        <div className="flex items-center rounded-2xl border border-line bg-surface2 px-3 focus-within:border-crew">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder={t('ناوی بەکارهێنەر بنووسە')}
            dir="ltr"
            className="min-w-0 flex-1 bg-transparent px-2 py-3 text-left font-mono text-ink outline-none placeholder:font-sans placeholder:text-muted/60"
          />
          {searching && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" />}
        </div>

        {/* ئەنجامەکانی گەڕان */}
        {results.length > 0 && (
          <div className="mt-3 space-y-2">
            {results.map((r) => {
              const sent = sentTo[r.id]
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-ink/5 px-3 py-2">
                  <Avatar url={r.avatar_url} name={r.display_name} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink">{r.display_name}</p>
                    <p dir="ltr" className="flex items-center gap-0.5 truncate text-right text-xs text-muted">
                      <AtSign className="h-3 w-3" />{r.username}
                    </p>
                  </div>
                  <button
                    onClick={() => sendRequest(r.username, r.id)}
                    disabled={sent}
                    className={`btn-press flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold ${
                      sent ? 'bg-crew/15 text-crew' : 'bg-crew text-white'
                    }`}
                  >
                    {sent ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {sent ? t('نێردرا') : t('زیادکردن')}
                  </button>
                </div>
              )
            })}
          </div>
        )}
        {query.trim().length >= 2 && !searching && results.length === 0 && (
          <p className="mt-3 text-center text-sm text-muted">{t('بەکارهێنەر نەدۆزرایەوە')}</p>
        )}
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
      </>
      )}
    </div>
  )
}

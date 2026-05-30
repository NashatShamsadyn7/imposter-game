import { useState } from 'react'
import { UserPlus, X, Check, Send, Loader2 } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useFriends } from '../state/FriendsContext'
import Avatar from './Avatar'
import { sendDirectMessage } from '../lib/supabase'
import { isOnline } from '../lib/presence'
import { sfx } from '../lib/sound'

// بانگهێشتی هاوڕێیان بۆ ژوور — نامەی بانگهێشت دەنێرێت بە کۆدی ژوور
export default function InviteFriends({ roomCode }) {
  const { user } = useAuth()
  const { friends } = useFriends()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState({}) // id -> true

  const invite = async (friendId) => {
    sfx.tap()
    await sendDirectMessage(user.id, friendId, roomCode, 'invite')
    setSent((p) => ({ ...p, [friendId]: true }))
  }

  // ئۆنلاینەکان سەرەوە
  const sorted = [...friends].sort(
    (a, b) => Number(isOnline(b.profile?.last_seen)) - Number(isOnline(a.profile?.last_seen))
  )

  return (
    <>
      <button
        onClick={() => { sfx.tap(); setOpen(true) }}
        className="btn-press flex items-center gap-1.5 rounded-xl bg-crew/12 px-3 py-2 text-sm font-bold text-crew hover:bg-crew/20"
      >
        <UserPlus className="h-4 w-4" />
        بانگهێشت
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-surface p-5 shadow-soft animate-scale-in sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-ink">بانگهێشتی هاوڕێیان</h2>
              <button
                onClick={() => setOpen(false)}
                className="btn-press grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {sorted.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                هیچ هاوڕێیەکت نییە بۆ بانگهێشتکردن
              </p>
            ) : (
              <div className="max-h-[60vh] space-y-2 overflow-y-auto">
                {sorted.map((f) => {
                  const online = isOnline(f.profile?.last_seen)
                  const isSent = sent[f.id]
                  return (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 rounded-2xl bg-ink/5 px-3 py-2.5"
                    >
                      <div className="relative">
                        <Avatar url={f.profile?.avatar_url} name={f.profile?.display_name} size={40} />
                        <span
                          className={`absolute bottom-0 left-0 h-3 w-3 rounded-full border-2 border-surface ${
                            online ? 'bg-crew' : 'bg-ink/30'
                          }`}
                        />
                      </div>
                      <span className="flex-1 truncate font-bold text-ink">
                        {f.profile?.display_name}
                      </span>
                      <button
                        onClick={() => invite(f.id)}
                        disabled={isSent}
                        className={`btn-press flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold ${
                          isSent
                            ? 'bg-crew/15 text-crew'
                            : 'bg-crew text-white'
                        }`}
                      >
                        {isSent ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                        {isSent ? 'نێردرا' : 'بانگهێشت'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

import { Brain, LogOut, Copy, Crown, Users, Play } from 'lucide-react'
import { Button, Panel } from '../../../components/ui'
import Avatar from '../../../components/Avatar'
import { useT } from '../../../lib/i18n'
import { sfx } from '../../../lib/sound'
import { useIQRoom } from '../../../state/IQRoomContext'
import { resolveIQCategory } from '../../../data/iq'

// لۆبی پێش دەستپێکردنی یاری IQ ئۆنلاین
export default function IQLobby() {
  const t = useT()
  const { room, players, isHost, startGame, leaveRoom, busy } = useIQRoom()
  if (!room) return null
  const cat = resolveIQCategory(room.category_id)

  const copyCode = () => {
    navigator.clipboard?.writeText(room.code).catch(() => {})
    sfx.tap()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-amber-500" />
          <h1 className="text-xl font-black text-ink">IQ {t('ئۆنلاین')}</h1>
        </div>
        <button onClick={() => { sfx.tap(); leaveRoom() }} className="btn-press grid h-10 w-10 place-items-center rounded-full bg-surface text-impostor shadow-card">
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* کۆدی ژوور */}
      <button onClick={copyCode} className="btn-press mb-5 w-full">
        <Panel className="flex items-center justify-between !p-4">
          <div className="text-right">
            <p className="text-xs text-muted">{t('کۆدی ژوور')}</p>
            <p className="text-3xl font-black tracking-widest text-crew">{room.code}</p>
          </div>
          <Copy className="h-5 w-5 text-muted" />
        </Panel>
      </button>

      {/* ڕێکخستن */}
      <div className="mb-5 flex gap-3 text-center text-sm">
        <Panel className="flex-1 !p-3"><p className="text-muted">{t('هاوپۆڵ')}</p><p className="font-black text-ink">{cat.icon} {cat.name}</p></Panel>
        <Panel className="flex-1 !p-3"><p className="text-muted">{t('ژمارەی پرسیار')}</p><p className="font-black text-ink">{room.question_count}</p></Panel>
        <Panel className="flex-1 !p-3"><p className="text-muted">{t('چرکە')}</p><p className="font-black text-ink">{room.seconds_per_q}s</p></Panel>
      </div>

      {/* یاریزانان */}
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-muted">
        <Users className="h-4 w-4" />{t('یاریزانان')} ({players.length})
      </div>
      <div className="mb-6 flex-1 space-y-2 overflow-y-auto">
        {players.map((p) => (
          <Panel key={p.user_id} className="flex items-center gap-3 !p-3">
            <Avatar url={p.avatar_url} name={p.display_name} size={36} />
            <span className="flex-1 font-bold text-ink">{p.display_name}</span>
            {p.is_host && <Crown className="h-4 w-4 text-amber-500" />}
          </Panel>
        ))}
      </div>

      {isHost ? (
        <Button disabled={busy} onClick={startGame} className="w-full">
          <Play className="h-4 w-4" />{t('دەستپێکردن')}
        </Button>
      ) : (
        <p className="text-center text-sm text-muted">{t('چاوەڕێی خانەخوێ بکە بۆ دەستپێکردن…')}</p>
      )}
    </div>
  )
}

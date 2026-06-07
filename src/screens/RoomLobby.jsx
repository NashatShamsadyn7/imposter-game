import { useState } from 'react'
import {
  Users,
  Copy,
  Check,
  LogOut,
  Play,
  Skull,
  Clock,
  X as XIcon,
  ChevronUp,
  ChevronDown,
  Crown,
  Sparkles,
  Tag,
  Share2,
  VenetianMask,
  Eye,
  Lock,
  Unlock,
  LogIn,
  Bot,
  Plus,
} from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useRoom } from '../state/RoomContext'
import { useProfileViewer } from '../state/ProfileViewer'
import { useWords } from '../state/WordsContext'
import { Button, Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import InviteFriends from '../components/InviteFriends'
import SuggestSection from '../components/SuggestSection'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'

export default function RoomLobby() {
  const { user } = useAuth()
  const { categories: CATEGORIES, randomCategory: RANDOM_CATEGORY } = useWords()
  const {
    room,
    players,
    isHost,
    leaveRoom,
    setSettings,
    reorderPlayers,
    kickPlayer,
    addBotPlayer,
    startGame,
  } = useRoom()
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const [showSuggest, setShowSuggest] = useState(false)
  const { openProfile } = useProfileViewer() || {}
  const t = useT()

  // هاوبەشکردنی لینکی بانگهێشت — Web Share یان کۆپی بۆ کلیپبۆرد
  const shareLink = async () => {
    const url = `${window.location.origin}/?join=${room.code}`
    sfx.tap()
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ساختەکار',
          text: `بەشداربە لە یارییەکەم! کۆد: ${room.code}`,
          url,
        })
      } catch { /* بەکارهێنەر هەڵیوەشاندەوە */ }
    } else {
      navigator.clipboard?.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 1500)
    }
  }

  const ordered = [...players].sort((a, b) => a.order_index - b.order_index)
  const maxImpostors = Math.max(1, Math.floor((players.length - 1) / 2))
  const canStart = players.length >= 3 && room.impostor_count < players.length

  const copyCode = () => {
    navigator.clipboard?.writeText(room.code)
    sfx.click()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const move = (idx, dir) => {
    const arr = [...ordered]
    const j = idx + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
    reorderPlayers(arr.map((p) => p.user_id))
    sfx.tap()
  }

  const category = CATEGORIES.find((c) => c.id === room.category_id)

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      {showSuggest && <SuggestSection onClose={() => setShowSuggest(false)} />}
      {/* سەرپەڕە */}
      <header className="mb-5 animate-fade-in">
        {/* کۆدی ژوور — بەرچاو، بە درێژایی ڕیز (ناشاردرێتەوە لە مۆبایل) */}
        <button
          onClick={copyCode}
          className="btn-press neon-ring mb-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-crew/40 bg-crew/10 px-4 py-3"
        >
          <span className="text-xs text-ink/60">{t('کۆد')}</span>
          <span className="text-2xl font-black tracking-[0.35em] text-crew neon-text">{room.code}</span>
          {copied ? (
            <Check className="h-5 w-5 text-crew" />
          ) : (
            <Copy className="h-5 w-5 text-ink/50" />
          )}
        </button>

        {/* کردارەکان */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => leaveRoom()}
            className="btn-press flex flex-1 items-center justify-center gap-1 rounded-xl bg-ink/5 px-2 py-2 text-sm text-ink/70 hover:bg-ink/10"
          >
            <LogOut className="h-4 w-4" />
            {t('دەرچوون')}
          </button>
          <InviteFriends roomCode={room.code} />
          <button
            onClick={shareLink}
            className="btn-press flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink/5 px-2 py-2 text-sm font-bold text-ink/70 hover:bg-ink/10"
            title={t('هاوبەشکردنی لینک')}
          >
            {shared ? <Check className="h-4 w-4 text-crew" /> : <Share2 className="h-4 w-4" />}
            {shared ? t('کۆپیکرا') : t('لینک')}
          </button>
        </div>
      </header>

      {/* یاریزانان */}
      <Panel className="mb-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-crew" />
            <h2 className="font-bold text-ink">{t('یاریزانان')}</h2>
          </div>
          <span className="text-sm text-ink/50">{players.length}</span>
        </div>

        <div className="space-y-2">
          {ordered.map((p, i) => (
            <div key={p.user_id} className="flex items-center gap-2 rounded-xl bg-ink/5 px-3 py-2">
              <span className="w-5 text-center text-sm font-bold text-ink/40">{i + 1}</span>
              <button
                onClick={() => openProfile?.(p.user_id, p.display_name, p.avatar_url)}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                <Avatar url={p.avatar_url} name={p.display_name} size={36} />
                <span className="truncate font-medium text-ink">
                  {p.display_name}
                  {p.user_id === user.id && <span className="text-xs text-crew"> ({t('تۆ')})</span>}
                </span>
              </button>
              {p.is_bot && <Bot className="h-4 w-4 text-impostor/70" title={t('بۆت')} />}
              {p.is_host && <Crown className="h-4 w-4 text-amber-500" title={t('خانەخوێ')} />}

              {isHost && p.user_id !== user.id && (
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => move(i, -1)}
                    className="btn-press rounded p-1 text-ink/40 hover:text-crew"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    className="btn-press rounded p-1 text-ink/40 hover:text-crew"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => kickPlayer(p.user_id)}
                    className="btn-press rounded p-1 text-ink/40 hover:text-impostor"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {players.length < 3 && (
          <p className="mt-3 text-center text-sm text-ink/40">
            {t('چاوەڕێی یاریزانی زیاتر… (لانیکەم ٣)')}
          </p>
        )}

        {/* زیادکردنی بۆت — بۆ پڕکردنەوەی ژوور */}
        {isHost && players.length < 10 && (
          <button
            onClick={() => { sfx.tap(); addBotPlayer() }}
            className="btn-press mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-impostor/40 bg-impostor/5 py-2.5 text-sm font-bold text-impostor/80 hover:bg-impostor/10"
          >
            <Plus className="h-4 w-4" />
            <Bot className="h-4 w-4" />
            {t('زیادکردنی بۆت')}
          </button>
        )}
      </Panel>

      {/* ڕێکخستنەکان */}
      <Panel className="mb-6 space-y-5">
        <h2 className="font-bold text-ink">{t('ڕێکخستنەکان')} {!isHost && t('(تەنها خانەخوێ دەیگۆڕێت)')}</h2>

        {/* هاوپۆل */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Tag className="h-4 w-4 text-crew" />
            <span className="text-sm font-bold text-ink">{t('هاوپۆلی وشە')}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[RANDOM_CATEGORY, ...CATEGORIES].map((c) => {
              const active = room.category_id === c.id
              return (
                <button
                  key={c.id}
                  disabled={!isHost}
                  onClick={() => {
                    sfx.tap()
                    setSettings({ categoryId: c.id })
                  }}
                  className={`btn-press rounded-xl border px-2 py-2 text-xs font-medium disabled:opacity-60 ${
                    active
                      ? c.id === 'random'
                        ? 'border-impostor bg-impostor/15 text-impostor'
                        : 'border-crew bg-crew/15 text-crew'
                      : 'border-ink/10 bg-ink/5 text-ink/70'
                  }`}
                >
                  <span className="mr-1">{c.icon}</span>
                  {c.name}
                </button>
              )
            })}
          </div>
          {/* پێشنیاری قسمی نوێ — بۆ هەموو یاریزانان */}
          <button
            onClick={() => { sfx.tap(); setShowSuggest(true) }}
            className="btn-press mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-crew/40 py-2 text-xs font-bold text-crew"
          >
            <Sparkles className="h-3.5 w-3.5" /> {t('پێشنیاری قسمی نوێ')}
          </button>
        </div>

        {/* دۆخی یاری */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <VenetianMask className="h-4 w-4 text-crew" />
            <span className="text-sm font-bold text-ink">{t('دۆخی یاری')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'classic', label: t('کلاسیک'), desc: t('ساختەکار هیچ نازانێت') },
              { id: 'undercover', label: t('شاراوە'), desc: t('ساختەکار وشەیەکی نزیک وەردەگرێت') },
              { id: 'detective', label: t('لێکۆڵەر'), desc: t('یەک یاریزان ناسنامەی ساختەکارێک دەزانێت') },
            ].map((m) => {
              const active = (room.mode || 'classic') === m.id
              return (
                <button
                  key={m.id}
                  disabled={!isHost}
                  onClick={() => { sfx.tap(); setSettings({ mode: m.id }) }}
                  className={`btn-press rounded-xl border px-3 py-2.5 text-right disabled:opacity-60 ${
                    active ? 'border-crew bg-crew/15' : 'border-ink/10 bg-ink/5'
                  }`}
                >
                  <p className={`text-sm font-bold ${active ? 'text-crew' : 'text-ink/70'}`}>{m.label}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-ink/50">{m.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ژمارەی ساختەکار */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skull className="h-4 w-4 text-impostor" />
              <span className="text-sm font-bold text-ink">{t('ژمارەی ساختەکار')}</span>
            </div>
            <span className="font-black text-impostor">{room.impostor_count}</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: maxImpostors }).map((_, i) => {
              const val = i + 1
              return (
                <button
                  key={val}
                  disabled={!isHost}
                  onClick={() => {
                    sfx.tap()
                    setSettings({ impostorCount: val })
                  }}
                  className={`btn-press flex-1 rounded-xl border py-2 font-bold disabled:opacity-60 ${
                    room.impostor_count === val
                      ? 'border-impostor bg-impostor/20 text-impostor'
                      : 'border-ink/10 bg-ink/5 text-ink/60'
                  }`}
                >
                  {val}
                </button>
              )
            })}
          </div>
        </div>

        {/* کاتی گفتوگۆ */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-crew" />
              <span className="text-sm font-bold text-ink">{t('کاتی گفتوگۆ')}</span>
            </div>
            <span className="font-bold text-crew">
              {Math.floor(room.discussion_seconds / 60)}:
              {String(room.discussion_seconds % 60).padStart(2, '0')}
            </span>
          </div>
          <input
            type="range"
            min="30"
            max="300"
            step="15"
            disabled={!isHost}
            value={room.discussion_seconds}
            onChange={(e) => setSettings({ discussionSeconds: Number(e.target.value) })}
            className="w-full accent-crew disabled:opacity-60"
          />
        </div>

        {/* کاتی بینینی ڕۆڵ (شاردنەوەی کارتی دەستەی کەشتی) */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-crew" />
              <span className="text-sm font-bold text-ink">{t('کاتی بینینی ڕۆڵ')}</span>
            </div>
            <span className="font-bold text-crew">{room.reveal_seconds ?? 10}{t('چ')}</span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="5"
            disabled={!isHost}
            value={room.reveal_seconds ?? 10}
            onChange={(e) => setSettings({ revealSeconds: Number(e.target.value) })}
            className="w-full accent-crew disabled:opacity-60"
          />
        </div>

        {/* ژوور داخراو + بەشداربوونی درەنگ */}
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={!isHost}
            onClick={() => { sfx.tap(); setSettings({ locked: !room.locked }) }}
            className={`btn-press flex items-center justify-between rounded-xl border px-3 py-2.5 disabled:opacity-60 ${
              room.locked ? 'border-impostor bg-impostor/15' : 'border-ink/10 bg-ink/5'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-ink">
              {room.locked ? <Lock className="h-4 w-4 text-impostor" /> : <Unlock className="h-4 w-4 text-ink/50" />}
              {t('ژووری داخراو')}
            </span>
            <span className={`text-xs font-bold ${room.locked ? 'text-impostor' : 'text-ink/40'}`}>
              {room.locked ? t('بەڵێ') : t('نا')}
            </span>
          </button>
          <button
            disabled={!isHost}
            onClick={() => { sfx.tap(); setSettings({ allowLateJoin: !(room.allow_late_join ?? true) }) }}
            className={`btn-press flex items-center justify-between rounded-xl border px-3 py-2.5 disabled:opacity-60 ${
              (room.allow_late_join ?? true) ? 'border-crew bg-crew/15' : 'border-ink/10 bg-ink/5'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-ink">
              <LogIn className="h-4 w-4 text-crew" />
              {t('بەشداربوونی درەنگ')}
            </span>
            <span className={`text-xs font-bold ${(room.allow_late_join ?? true) ? 'text-crew' : 'text-ink/40'}`}>
              {(room.allow_late_join ?? true) ? t('بەڵێ') : t('نا')}
            </span>
          </button>
        </div>

        {/* Multiplier */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-crew" />
              <span className="text-sm font-bold text-ink">{t('قەبارەی خاڵ (Multiplier)')}</span>
            </div>
            <span className="font-black text-crew">×{room.multiplier}</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((val) => (
              <button
                key={val}
                disabled={!isHost}
                onClick={() => {
                  sfx.tap()
                  setSettings({ multiplier: val })
                }}
                className={`btn-press flex-1 rounded-xl border py-2 font-bold disabled:opacity-60 ${
                  room.multiplier === val
                    ? 'border-crew bg-crew/15 text-crew'
                    : 'border-ink/10 bg-ink/5 text-ink/60'
                }`}
              >
                ×{val}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {/* دەستپێکردن */}
      {isHost ? (
        <>
          <Button
            onClick={startGame}
            disabled={!canStart}
            variant="danger"
            className="w-full !py-4 !text-lg"
          >
            <Play className="h-6 w-6" />
            {t('دەستپێکردنی یاری')}
          </Button>
          {!canStart && (
            <p className="mt-3 text-center text-sm text-ink/40">
              {t('پێویستە بەلایەنی کەم ٣ یاریزان هەبن')}
            </p>
          )}
        </>
      ) : (
        <p className="rounded-2xl border border-ink/10 bg-ink/5 py-4 text-center text-ink/60">
          {t('چاوەڕێی خانەخوێ بکە بۆ دەستپێکردن…')}
        </p>
      )}
    </div>
  )
}

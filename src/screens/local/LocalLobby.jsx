import { useState } from 'react'
import {
  Plus, Trash2, Users, Play, Skull, Clock, Sparkles, Tag,
  ChevronUp, ChevronDown, ChevronRight, HelpCircle, Trophy, RotateCcw, VenetianMask,
} from 'lucide-react'
import { useLocal } from '../../state/LocalContext'
import { RANDOM_CATEGORY } from '../../data/words'
import { Button, Panel } from '../../components/ui'
import RulesModal from '../../components/RulesModal'
import SuggestSection from '../../components/SuggestSection'
import { useT } from '../../lib/i18n'
import { sfx } from '../../lib/sound'

export default function LocalLobby({ onExit }) {
  const t = useT()
  const {
    players, settings, scores, CATEGORIES, MAX_PLAYERS,
    addPlayer, removePlayer, renamePlayer, movePlayer, updateSettings, startGame, resetScores,
  } = useLocal()

  const [newName, setNewName] = useState('')
  const [showRules, setShowRules] = useState(false)
  const [showSuggest, setShowSuggest] = useState(false)

  const maxImpostors = Math.max(1, Math.floor((players.length - 1) / 2))
  const canStart = players.length >= 3 && settings.impostorCount < players.length

  const handleAdd = () => {
    if (players.length >= MAX_PLAYERS) return
    addPlayer(newName)
    setNewName('')
  }

  // ڕیزکردنی خاڵی کۆبوونەوە
  const ranked = [...players]
    .map((p) => ({ ...p, pts: scores[p.id] || 0 }))
    .filter((p) => p.pts > 0)
    .sort((a, b) => b.pts - a.pts)

  return (
    <div className="mx-auto max-w-md px-4 py-5 pb-24">
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {showSuggest && <SuggestSection onClose={() => setShowSuggest(false)} />}

      {/* سەرپەڕە */}
      <header className="mb-6 flex items-center justify-between animate-fade-in">
        <button
          onClick={onExit}
          className="btn-press flex items-center gap-1 rounded-xl bg-surface px-3 py-2 text-sm text-muted shadow-card hover:text-ink"
        >
          <ChevronRight className="h-4 w-4" />
          {t('گەڕانەوە')}
        </button>
        <div className="text-center">
          <h1 className="text-xl font-black text-ink">{t('یاریکردنی ناوخۆیی')}</h1>
          <p className="text-xs text-muted">{t('یەک ئامێر')}</p>
        </div>
        <button
          onClick={() => { sfx.click(); setShowRules(true) }}
          className="btn-press grid h-10 w-10 place-items-center rounded-xl bg-surface text-crew shadow-card"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </header>

      {/* خاڵی کۆبوونەوە */}
      {ranked.length > 0 && (
        <Panel className="mb-5 !p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-crew" />
              <h2 className="font-bold text-ink">{t('خاڵەکانی ئەم کۆبوونەوەیە')}</h2>
            </div>
            <button
              onClick={() => { sfx.tap(); resetScores() }}
              className="btn-press flex items-center gap-1 rounded-lg bg-ink/5 px-2 py-1 text-xs text-muted hover:text-impostor"
            >
              <RotateCcw className="h-3 w-3" /> {t('سفرکردنەوە')}
            </button>
          </div>
          <div className="space-y-1.5">
            {ranked.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${i === 0 ? 'bg-amber-400/10' : 'bg-surface2'}`}>
                <span className="w-5 text-center text-sm font-black text-muted">{i + 1}</span>
                <span className="flex-1 truncate font-bold text-ink">{p.name}</span>
                <span className="rounded-full bg-crew/10 px-2.5 py-0.5 text-sm font-bold text-crew">{p.pts}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* یاریزانان */}
      <Panel className="mb-5 !p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-crew" />
            <h2 className="font-bold text-ink">{t('یاریزانان')}</h2>
          </div>
          <span className="text-sm text-muted">{players.length} / {MAX_PLAYERS}</span>
        </div>

        <div className="mb-3 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={t('ناوی یاریزان…')}
            maxLength={20}
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface2 px-4 py-2.5 text-ink placeholder:text-muted/60 outline-none focus:border-crew"
          />
          <Button onClick={handleAdd} disabled={players.length >= MAX_PLAYERS} className="!px-4">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2 rounded-xl bg-surface2 px-2 py-1.5">
              <span className="w-5 text-center text-xs font-bold text-muted">{i + 1}</span>
              <input
                value={p.name}
                onChange={(e) => renamePlayer(p.id, e.target.value)}
                maxLength={20}
                className="min-w-0 flex-1 bg-transparent font-medium text-ink outline-none"
              />
              <button onClick={() => movePlayer(i, -1)} className="btn-press rounded p-1 text-muted hover:text-crew">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button onClick={() => movePlayer(i, 1)} className="btn-press rounded p-1 text-muted hover:text-crew">
                <ChevronDown className="h-4 w-4" />
              </button>
              <button onClick={() => { sfx.tap(); removePlayer(p.id) }} className="btn-press rounded p-1 text-muted hover:text-impostor">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Panel>

      {/* ڕێکخستنەکان */}
      <Panel className="mb-6 space-y-5 !p-4">
        {/* هاوپۆل */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Tag className="h-4 w-4 text-crew" />
            <span className="text-sm font-bold text-ink">{t('هاوپۆلی وشە')}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[RANDOM_CATEGORY, ...CATEGORIES].map((c) => (
              <button
                key={c.id}
                onClick={() => { sfx.tap(); updateSettings({ categoryId: c.id }) }}
                className={`btn-press rounded-xl border px-2 py-2 text-xs font-medium ${
                  settings.categoryId === c.id
                    ? c.id === 'random' ? 'border-impostor bg-impostor/12 text-impostor' : 'border-crew bg-crew/12 text-crew'
                    : 'border-line bg-surface2 text-muted'
                }`}
              >
                <span className="ml-1">{c.icon}</span>{c.name}
              </button>
            ))}
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
            ].map((m) => {
              const active = (settings.mode || 'classic') === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => { sfx.tap(); updateSettings({ mode: m.id }) }}
                  className={`btn-press rounded-xl border px-3 py-2.5 text-right ${
                    active ? 'border-crew bg-crew/12' : 'border-line bg-surface2'
                  }`}
                >
                  <p className={`text-sm font-bold ${active ? 'text-crew' : 'text-muted'}`}>{m.label}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-muted">{m.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ساختەکار */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skull className="h-4 w-4 text-impostor" />
              <span className="text-sm font-bold text-ink">{t('ژمارەی ساختەکار')}</span>
            </div>
            <span className="font-black text-impostor">{settings.impostorCount}</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: maxImpostors }).map((_, i) => {
              const val = i + 1
              return (
                <button
                  key={val}
                  onClick={() => { sfx.tap(); updateSettings({ impostorCount: val }) }}
                  className={`btn-press flex-1 rounded-xl border py-2 font-bold ${
                    settings.impostorCount === val ? 'border-impostor bg-impostor/15 text-impostor' : 'border-line bg-surface2 text-muted'
                  }`}
                >{val}</button>
              )
            })}
          </div>
        </div>

        {/* کات */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-crew" />
              <span className="text-sm font-bold text-ink">{t('کاتی گفتوگۆ')}</span>
            </div>
            <span className="font-bold text-crew">
              {Math.floor(settings.discussionSeconds / 60)}:{String(settings.discussionSeconds % 60).padStart(2, '0')}
            </span>
          </div>
          <input
            type="range" min="30" max="300" step="15"
            value={settings.discussionSeconds}
            onChange={(e) => updateSettings({ discussionSeconds: Number(e.target.value) })}
            className="w-full accent-crew"
          />
        </div>

        {/* Multiplier */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-crew" />
              <span className="text-sm font-bold text-ink">{t('قەبارەی خاڵ')}</span>
            </div>
            <span className="font-black text-crew">×{settings.multiplier}</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((val) => (
              <button
                key={val}
                onClick={() => { sfx.tap(); updateSettings({ multiplier: val }) }}
                className={`btn-press flex-1 rounded-xl border py-2 font-bold ${
                  settings.multiplier === val ? 'border-crew bg-crew/12 text-crew' : 'border-line bg-surface2 text-muted'
                }`}
              >×{val}</button>
            ))}
          </div>
        </div>
      </Panel>

      <Button onClick={startGame} disabled={!canStart} variant="danger" className="w-full !py-4 !text-lg">
        <Play className="h-6 w-6" />
        {t('دەستپێکردنی یاری')}
      </Button>
      {!canStart && <p className="mt-3 text-center text-sm text-muted">{t('پێویستە بەلایەنی کەم ٣ یاریزان هەبن')}</p>}
    </div>
  )
}

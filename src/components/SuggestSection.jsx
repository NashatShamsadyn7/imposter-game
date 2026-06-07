// ═══════════════════════════════════════════════════════════
//  پێشنیارکردنی قسم — یاریزان قسمێکی نوێ دروستدەکات و دەینێرێت
//  بۆ پەسەندکردنی بەڕێوەبەر. دوای پەسەندکردن دەبێتە قسمی سەرەکی.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react'
import { X, Plus, Trash2, Send, Loader2, CheckCircle2, Sparkles } from 'lucide-react'
import { Button } from './ui'
import { submitSection } from '../lib/supabase'
import { sfx } from '../lib/sound'

const MIN_WORDS = 5
const MAX_WORDS = 80

export default function SuggestSection({ onClose }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [words, setWords] = useState([
    { ku: '', emoji: '' }, { ku: '', emoji: '' }, { ku: '', emoji: '' },
    { ku: '', emoji: '' }, { ku: '', emoji: '' },
  ])
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  const setWord = (i, patch) => setWords((ws) => ws.map((w, j) => (j === i ? { ...w, ...patch } : w)))
  const addWord = () => { if (words.length < MAX_WORDS) { sfx.tap(); setWords((ws) => [...ws, { ku: '', emoji: '' }]) } }
  const removeWord = (i) => setWords((ws) => ws.filter((_, j) => j !== i))

  const validWords = words.filter((w) => w.ku.trim())
  const canSubmit = name.trim() && validWords.length >= MIN_WORDS

  const submit = async () => {
    if (!canSubmit || busy) return
    setBusy(true); setErr('')
    try {
      const payload = validWords.map((w) => ({ ku: w.ku.trim(), emoji: (w.emoji || '').trim() }))
      const res = await submitSection(name.trim(), icon.trim(), payload)
      if (res.ok) { sfx.chest?.(); setDone(true) }
      else { setErr(res.error || 'هەڵە ڕوویدا'); sfx.lose?.() }
    } catch (e) {
      setErr(e?.message || 'هەڵە ڕوویدا')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl border border-line bg-surface sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* سەرپەڕە */}
        <div className="flex items-center justify-between border-b border-line p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-crew" />
            <h2 className="font-black text-ink">پێشنیاری قسمی نوێ</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-crew" />
            <p className="mb-1 text-lg font-bold text-ink">نێردرا! سوپاس 🎉</p>
            <p className="mb-5 text-sm text-muted">
              پێشنیارەکەت گەیشت بە بەڕێوەبەر. دوای پەسەندکردن دەبێتە قسمێکی سەرەکی بۆ هەمووان.
            </p>
            <Button onClick={onClose}>تەواو</Button>
          </div>
        ) : (
          <>
            {/* ناوەڕۆک */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="flex gap-2">
                <label className="flex-1">
                  <span className="mb-1 block text-xs font-bold text-muted">ناوی قسم</span>
                  <input
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="وەک: ئەکتەرە ناودارەکان"
                    className="w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-sm text-ink outline-none focus:border-crew"
                  />
                </label>
                <label className="w-20">
                  <span className="mb-1 block text-xs font-bold text-muted">ئیمۆجی</span>
                  <input
                    value={icon} onChange={(e) => setIcon(e.target.value)}
                    placeholder="🎬" dir="ltr"
                    className="w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-center text-sm text-ink outline-none focus:border-crew"
                  />
                </label>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-muted">
                    وشەکان ({validWords.length}/{MIN_WORDS} لانیکەم)
                  </span>
                </div>
                <div className="space-y-2">
                  {words.map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={w.ku} onChange={(e) => setWord(i, { ku: e.target.value })}
                        placeholder={`وشە ${i + 1}`}
                        className="flex-1 rounded-xl border border-line bg-surface2 px-3 py-2 text-sm text-ink outline-none focus:border-crew"
                      />
                      <input
                        value={w.emoji} onChange={(e) => setWord(i, { emoji: e.target.value })}
                        placeholder="🙂" dir="ltr"
                        className="w-14 rounded-xl border border-line bg-surface2 px-2 py-2 text-center text-sm text-ink outline-none focus:border-crew"
                      />
                      {words.length > MIN_WORDS && (
                        <button onClick={() => removeWord(i)} className="btn-press rounded-lg p-2 text-impostor hover:bg-impostor/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addWord}
                  disabled={words.length >= MAX_WORDS}
                  className="btn-press mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-line py-2 text-sm font-bold text-crew disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" /> وشەی تر
                </button>
              </div>

              {err && <p className="rounded-xl bg-impostor/10 px-3 py-2 text-center text-sm font-bold text-impostor">{err}</p>}
            </div>

            {/* ناردن */}
            <div className="border-t border-line p-4">
              <Button className="w-full" onClick={submit} disabled={!canSubmit || busy}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                ناردن بۆ پەسەندکردن
              </Button>
              {!canSubmit && (
                <p className="mt-2 text-center text-xs text-muted">
                  ناو + لانیکەم {MIN_WORDS} وشە پێویستن
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  پێشنیارکردنی قسم — یاریزان قسمێکی نوێ دروستدەکات و دەینێرێت
//  بۆ پەسەندکردنی بەڕێوەبەر. هەر وشەیەک دەبێت وێنەی هەبێت
//  (بارکردن لە مۆبایلەوە یان بەستەری URL).
// ═══════════════════════════════════════════════════════════

import { useState, useRef } from 'react'
import { X, Plus, Trash2, Send, Loader2, CheckCircle2, Sparkles, ImagePlus, Link2 } from 'lucide-react'
import { Button } from './ui'
import { useAuth } from '../state/AuthContext'
import { submitSection, uploadWordImage } from '../lib/supabase'
import { sfx } from '../lib/sound'

const MIN_WORDS = 5
const MAX_WORDS = 80

// ───── ڕیزی یەک وشە: ناو + وێنە (بارکردن یان URL) ─────
function WordRow({ index, word, onChange, onRemove, canRemove, userId }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [showUrl, setShowUrl] = useState(false)

  const pickFile = () => fileRef.current?.click()
  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // ڕێگە بدە هەمان فایل دووبارە هەڵبژێردرێت
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadWordImage(userId, file)
      onChange({ image: url })
    } catch (err) {
      alert('بارکردنی وێنە سەرکەوتوو نەبوو: ' + (err?.message || err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface2 p-2">
      <div className="flex items-center gap-2">
        {/* وێنە / بارکردن */}
        <button
          onClick={pickFile}
          disabled={uploading}
          className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-ink/5 text-muted"
          title="بارکردنی وێنە"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-crew" />
          ) : word.image ? (
            <img src={word.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

        <input
          value={word.ku}
          onChange={(e) => onChange({ ku: e.target.value })}
          placeholder={`وشە ${index + 1}`}
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-crew"
        />

        <button
          onClick={() => setShowUrl((s) => !s)}
          className={`btn-press rounded-lg p-2 ${showUrl || word.image ? 'text-crew' : 'text-muted'} hover:bg-crew/10`}
          title="بەستەری وێنە (URL)"
        >
          <Link2 className="h-4 w-4" />
        </button>
        {canRemove && (
          <button onClick={onRemove} className="btn-press rounded-lg p-2 text-impostor hover:bg-impostor/10">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* خانەی URL (ئیختیاری — یان بەستەر یان بارکردن) */}
      {showUrl && (
        <input
          value={word.image || ''}
          onChange={(e) => onChange({ image: e.target.value })}
          placeholder="https://… بەستەری وێنە"
          dir="ltr"
          className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-crew"
        />
      )}
    </div>
  )
}

export default function SuggestSection({ onClose }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [words, setWords] = useState(
    Array.from({ length: MIN_WORDS }, () => ({ ku: '', image: '' }))
  )
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  const setWord = (i, patch) => setWords((ws) => ws.map((w, j) => (j === i ? { ...w, ...patch } : w)))
  const addWord = () => { if (words.length < MAX_WORDS) { sfx.tap(); setWords((ws) => [...ws, { ku: '', image: '' }]) } }
  const removeWord = (i) => setWords((ws) => ws.filter((_, j) => j !== i))

  // وشەی دروست = ناوی هەیە + وێنەی هەیە
  const validWords = words.filter((w) => w.ku.trim() && w.image.trim())
  const canSubmit = name.trim() && validWords.length >= MIN_WORDS

  const submit = async () => {
    if (!canSubmit || busy) return
    setBusy(true); setErr('')
    try {
      const payload = validWords.map((w) => ({ ku: w.ku.trim(), image_url: w.image.trim() }))
      const res = await submitSection(name.trim(), '', payload)
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
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-muted">ناوی قسم</span>
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="وەک: ئەکتەرە ناودارەکان"
                  className="w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-sm text-ink outline-none focus:border-crew"
                />
              </label>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-muted">
                    وشەکان ({validWords.length}/{MIN_WORDS} لانیکەم)
                  </span>
                  <span className="text-[11px] text-muted">هەر وشە دەبێت وێنەی هەبێت</span>
                </div>
                <div className="space-y-2">
                  {words.map((w, i) => (
                    <WordRow
                      key={i}
                      index={i}
                      word={w}
                      userId={user?.id}
                      onChange={(patch) => setWord(i, patch)}
                      onRemove={() => removeWord(i)}
                      canRemove={words.length > MIN_WORDS}
                    />
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
                  ناو + لانیکەم {MIN_WORDS} وشە (هەریەکە بە وێنە) پێویستن
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

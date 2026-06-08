// ═══════════════════════════════════════════════════════════
//  پەڕەی بەڕێوەبردنی وشە (تەنها بەڕێوەبەر)
//  بینین/گۆڕین/زیادکردن/سڕینەوەی وشە و وێنە و ئیمۆجی — لە مۆبایلیشەوە.
//  گۆڕانکارییەکان یەکسەر لە بنکەداتا پاشەکەوت دەکرێن و بۆ یاری دەردەکەون.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronRight, Search, Plus, Pencil, Trash2, Save, X, Download, Loader2,
  ShieldAlert, FolderPlus, EyeOff, Sparkles, Check, ChevronDown,
} from 'lucide-react'
import { useWords } from '../../state/WordsContext'
import { useNotify } from '../../state/NotificationContext'
import { CATEGORIES as STATIC_CATEGORIES } from '../../data/words'
import { Button, Panel } from '../../components/ui'
import WordImage from '../../components/WordImage'
import {
  adminFetchWordBank, adminInsertWord, adminUpdateWord, adminDeleteWord,
  adminUpsertCategory, adminDeleteCategory, adminBulkImport, adminReplaceBank,
  adminPendingSections, approveSection, rejectSection, adminFetchCategoryItems,
} from '../../lib/supabase'

const EMPTY_WORD = { ku: '', ar: '', en: '', emoji: '', image_url: '', enabled: true }

// ───── خانەی نووسین ─────
function Field({ label, value, onChange, placeholder, dir = 'rtl' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-sm text-ink outline-none focus:border-crew"
      />
    </label>
  )
}

export default function WordsAdmin({ onBack }) {
  const { isAdmin, reload: reloadGameBank } = useWords()
  const notify = useNotify()
  const [bank, setBank] = useState({ categories: [], items: [] })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [selectedCat, setSelectedCat] = useState('all')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // وشەی دەستکاریکراو یان { _new:true }
  const [newCat, setNewCat] = useState(null)   // { id, name_ku, name_ar, icon }
  const [pending, setPending] = useState([])   // پێشنیارە چاوەڕوانەکان
  const [expanded, setExpanded] = useState(null) // idی پێشنیاری کراوە
  const [expandedItems, setExpandedItems] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, pend] = await Promise.all([adminFetchWordBank(), adminPendingSections()])
      setBank(data)
      setPending(pend)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  // پێشبینینی وشەکانی پێشنیارێک
  const toggleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); setExpandedItems([]); return }
    setExpanded(id)
    setExpandedItems(await adminFetchCategoryItems(id))
  }

  const approve = async (id) => {
    setBusy(true)
    try {
      await approveSection(id)
      setExpanded(null)
      await load()
      await reloadGameBank()
      notify({ title: 'قسم پەسەندکرا ✅', type: 'success' })
    } catch (e) {
      notify({ title: 'هەڵە', body: e?.message || String(e), type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const reject = async (id, label) => {
    if (!window.confirm(`ڕەتکردنەوە و سڕینەوەی پێشنیاری «${label}»؟`)) return
    setBusy(true)
    try {
      await rejectSection(id)
      setExpanded(null)
      await load()
      notify({ title: 'پێشنیار ڕەتکرایەوە', type: 'info' })
    } catch (e) {
      notify({ title: 'هەڵە', body: e?.message || String(e), type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const catName = useCallback(
    (id) => bank.categories.find((c) => c.id === id)?.name_ku || id,
    [bank.categories]
  )

  // ───── فلتەری وشەکان ─────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bank.items.filter((w) => {
      if (selectedCat !== 'all' && w.category_id !== selectedCat) return false
      if (!q) return true
      return (
        (w.ku || '').toLowerCase().includes(q) ||
        (w.ar || '').toLowerCase().includes(q) ||
        (w.en || '').toLowerCase().includes(q)
      )
    })
  }, [bank.items, selectedCat, query])

  // ───── هاوردەکردنی بانکی ناوبنکە (یەکەم جار) ─────
  const handleImport = async () => {
    if (!window.confirm('بانکی ناوبنکە (هەموو هاوپۆڵ و وشەکان) بهێنرێتە بنکەداتا؟')) return
    setBusy(true)
    try {
      const cats = STATIC_CATEGORIES.map((c, i) => ({
        id: c.id, name_ku: c.name, name_ar: c.name_ar || '', icon: c.icon, sort: i, enabled: true,
      }))
      const items = []
      STATIC_CATEGORIES.forEach((c) => {
        c.words.forEach((w, i) => {
          items.push({
            category_id: c.id, ku: w.ku, ar: w.ar || '', en: w.en || '',
            emoji: w.emoji || '', image_url: '', sort: i, enabled: true,
          })
        })
      })
      await adminBulkImport(cats, items)
      await load()
      await reloadGameBank()
      notify({ title: `هاوردەکرا: ${cats.length} هاوپۆڵ، ${items.length} وشە`, type: 'success' })
    } catch (e) {
      notify({ title: 'هەڵە لە هاوردەکردن', body: e?.message || String(e), type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  // ───── جێگرتنەوەی تەواوی بانک بە بانکی نوێی ناوبنکە ─────
  // هەموو وشە کۆنەکان دەسڕێتەوە و وشە نوێیەکانی words.js دادەنرێن.
  const handleReplace = async () => {
    if (!window.confirm('ئاگاداری: هەموو هاوپۆڵ و وشە کۆنەکان دەسڕێنەوە و بانکی نوێ (وشە جیهانییەکان بە کوردی/عەرەبی) جێیان دەگرێتەوە. بەردەوام دەبیت؟')) return
    setBusy(true)
    try {
      const cats = STATIC_CATEGORIES.map((c, i) => ({
        id: c.id, name_ku: c.name, name_ar: c.name_ar || '', icon: c.icon, sort: i, enabled: true,
      }))
      const items = []
      STATIC_CATEGORIES.forEach((c) => {
        c.words.forEach((w, i) => {
          items.push({
            category_id: c.id, ku: w.ku, ar: w.ar || '', en: w.en || '',
            emoji: w.emoji || '', image_url: '', sort: i, enabled: true,
          })
        })
      })
      await adminReplaceBank(cats, items)
      await load()
      await reloadGameBank()
      notify({ title: `نوێکرایەوە: ${cats.length} هاوپۆڵ، ${items.length} وشە`, type: 'success' })
    } catch (e) {
      notify({ title: 'هەڵە لە نوێکردنەوە', body: e?.message || String(e), type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  // ───── پاشەکەوتی وشە ─────
  const saveWord = async () => {
    const w = editing
    if (!w.ku?.trim()) { notify({ title: 'ناوی کوردی پێویستە', type: 'warn' }); return }
    if (!w.category_id) { notify({ title: 'هاوپۆڵ هەڵبژێرە', type: 'warn' }); return }
    setBusy(true)
    try {
      const patch = {
        category_id: w.category_id,
        ku: w.ku.trim(), ar: (w.ar || '').trim(), en: (w.en || '').trim(),
        emoji: (w.emoji || '').trim(), image_url: (w.image_url || '').trim(),
        enabled: w.enabled !== false,
      }
      if (w._new) await adminInsertWord(patch)
      else await adminUpdateWord(w.id, patch)
      setEditing(null)
      await load()
      await reloadGameBank()
      notify({ title: w._new ? 'وشە زیادکرا' : 'وشە نوێکرایەوە', type: 'success' })
    } catch (e) {
      notify({ title: 'هەڵە', body: e?.message || String(e), type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const removeWord = async (w) => {
    if (!window.confirm(`سڕینەوەی «${w.ku}»؟`)) return
    setBusy(true)
    try {
      await adminDeleteWord(w.id)
      await load()
      await reloadGameBank()
    } finally {
      setBusy(false)
    }
  }

  // ───── پاشەکەوتی هاوپۆڵ ─────
  const saveCat = async () => {
    const c = newCat
    if (!c.id?.trim() || !c.name_ku?.trim()) { notify({ title: 'ناسنامە و ناوی کوردی پێویستن', type: 'warn' }); return }
    setBusy(true)
    try {
      await adminUpsertCategory({
        id: c.id.trim().toLowerCase().replace(/\s+/g, '_'),
        name_ku: c.name_ku.trim(), name_ar: (c.name_ar || '').trim(),
        icon: (c.icon || '🗂️').trim(), sort: bank.categories.length, enabled: true,
      })
      setNewCat(null)
      await load()
      await reloadGameBank()
      notify({ title: 'هاوپۆڵ زیادکرا', type: 'success' })
    } catch (e) {
      notify({ title: 'هەڵە', body: e?.message || String(e), type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const removeCat = async (id) => {
    if (!window.confirm(`سڕینەوەی هاوپۆڵ «${catName(id)}» و هەموو وشەکانی؟`)) return
    setBusy(true)
    try {
      await adminDeleteCategory(id)
      if (selectedCat === id) setSelectedCat('all')
      await load()
      await reloadGameBank()
    } finally {
      setBusy(false)
    }
  }

  // ───── دەسەڵات ─────
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <ShieldAlert className="mx-auto mb-3 h-12 w-12 text-impostor" />
        <p className="text-lg font-bold text-ink">ئەم پەڕەیە تەنها بۆ بەڕێوەبەرە</p>
        <Button variant="ghost" className="mt-5" onClick={onBack}>گەڕانەوە</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-5 pb-24">
      {/* سەرپەڕە */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="btn-press flex items-center gap-1 text-muted hover:text-ink">
          <ChevronRight className="h-5 w-5" /> گەڕانەوە
        </button>
        <h1 className="text-lg font-black text-ink">بەڕێوەبردنی وشە</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-crew"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : bank.categories.length === 0 ? (
        // بنکەی بەتاڵ — هاوردەکردنی یەکەم جار
        <Panel className="text-center">
          <Download className="mx-auto mb-3 h-10 w-10 text-crew" />
          <p className="mb-2 font-bold text-ink">بانکی وشە بەتاڵە</p>
          <p className="mb-4 text-sm text-muted">
            وشە ناوبنکەکان بهێنە بۆ بنکەداتا تاکو دەستبکەیت بە گۆڕین و زیادکردن.
          </p>
          <Button onClick={handleImport} disabled={busy}>
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            هاوردەکردنی بانکی ناوبنکە
          </Button>
        </Panel>
      ) : (
        <>
          {/* نوێکردنەوەی بانک بە بانکی نوێی ناوبنکە (جێگرتنەوەی هەمووی) */}
          <Panel className="mb-4 border-crew/30 !p-3">
            <p className="mb-2 text-sm font-bold text-ink">نوێکردنەوەی بانک</p>
            <p className="mb-3 text-xs text-muted">
              بانکی کۆن دەسڕێتەوە و وشە جیهانییە نوێیەکان (کوردی + عەرەبی) جێیان دەگرنەوە.
            </p>
            <Button variant="ghost" className="w-full" onClick={handleReplace} disabled={busy}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              جێگرتنەوەی بانک بە نوێ
            </Button>
          </Panel>

          {/* پێشنیارە چاوەڕوانەکان */}
          {pending.length > 0 && (
            <Panel className="mb-4 border-crew/40 !p-3">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-black text-crew">
                <Sparkles className="h-4 w-4" /> پێشنیاری یاریزانان ({pending.length})
              </p>
              <div className="space-y-2">
                {pending.map((s) => (
                  <div key={s.id} className="rounded-xl border border-line bg-surface2 p-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleExpand(s.id)} className="flex min-w-0 flex-1 items-center gap-2 text-right">
                        <span className="text-xl">{s.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-ink">{s.name_ku}</span>
                          <span className="block truncate text-[11px] text-muted">{s.submitter} · {Number(s.word_count)} وشە</span>
                        </span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition ${expanded === s.id ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {expanded === s.id && (
                      <div className="mt-2 flex flex-wrap gap-1.5 border-t border-line pt-2">
                        {expandedItems.map((w) => (
                          <span key={w.id} className="flex items-center gap-1 rounded-lg bg-ink/5 py-1 pe-2 ps-1 text-xs text-ink">
                            <WordImage imageUrl={w.image_url} englishPrompt={w.en} emoji={w.emoji} size={24} className="!rounded" />
                            {w.ku}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Button className="flex-1 py-1.5 text-sm" onClick={() => approve(s.id)} disabled={busy}>
                        <Check className="h-4 w-4" /> پەسەند
                      </Button>
                      <Button variant="ghost" className="flex-1 py-1.5 text-sm" onClick={() => reject(s.id, s.name_ku)} disabled={busy}>
                        <X className="h-4 w-4 text-impostor" /> ڕەت
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* گەڕان */}
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-line bg-surface2 px-3">
            <Search className="h-4 w-4 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="گەڕان بە کوردی/عەرەبی/ئینگلیزی…"
              className="w-full bg-transparent py-2.5 text-sm text-ink outline-none"
            />
          </div>

          {/* هاوپۆڵەکان */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCat('all')}
              className={`rounded-full px-3 py-1 text-xs font-bold ${selectedCat === 'all' ? 'bg-crew text-white' : 'bg-surface2 text-muted'}`}
            >
              هەموو ({bank.items.length})
            </button>
            {bank.categories.map((c) => {
              const n = bank.items.filter((w) => w.category_id === c.id).length
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${selectedCat === c.id ? 'bg-crew text-white' : 'bg-surface2 text-muted'}`}
                >
                  {c.icon} {c.name_ku} ({n})
                </button>
              )
            })}
            <button
              onClick={() => setNewCat({ id: '', name_ku: '', name_ar: '', icon: '' })}
              className="rounded-full bg-surface2 px-3 py-1 text-xs font-bold text-crew"
            >
              <FolderPlus className="inline h-3.5 w-3.5" /> هاوپۆڵ
            </button>
          </div>

          {/* کردارەکان */}
          <div className="mb-3 flex gap-2">
            <Button
              className="flex-1 py-2 text-sm"
              onClick={() => setEditing({ ...EMPTY_WORD, _new: true, category_id: selectedCat !== 'all' ? selectedCat : bank.categories[0]?.id })}
            >
              <Plus className="h-4 w-4" /> وشەی نوێ
            </Button>
            {selectedCat !== 'all' && (
              <Button variant="ghost" className="py-2 text-sm" onClick={() => removeCat(selectedCat)}>
                <Trash2 className="h-4 w-4 text-impostor" />
              </Button>
            )}
          </div>

          {/* لیستی وشەکان */}
          <p className="mb-2 text-xs text-muted">{filtered.length} وشە</p>
          <div className="space-y-2">
            {filtered.slice(0, 300).map((w) => (
              <div key={w.id} className={`flex items-center gap-3 rounded-xl border border-line bg-surface2 p-2 ${w.enabled === false ? 'opacity-50' : ''}`}>
                <WordImage imageUrl={w.image_url} englishPrompt={w.en} emoji={w.emoji} size={48} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{w.emoji} {w.ku}</p>
                  <p className="truncate text-xs text-muted">{w.ar || '—'} · {w.en || '—'}</p>
                  <p className="truncate text-[10px] text-muted">{catName(w.category_id)}{w.enabled === false && ' · ناچالاک'}</p>
                </div>
                <button onClick={() => setEditing({ ...w })} className="btn-press rounded-lg p-2 text-crew hover:bg-crew/10">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => removeWord(w)} className="btn-press rounded-lg p-2 text-impostor hover:bg-impostor/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {filtered.length > 300 && (
              <p className="py-2 text-center text-xs text-muted">… {filtered.length - 300} وشەی تر (گەڕان بکە)</p>
            )}
          </div>
        </>
      )}

      {/* ───── مۆداڵی دەستکاری/زیادکردنی وشە ───── */}
      {editing && createPortal((
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-black text-ink">{editing._new ? 'وشەی نوێ' : 'دەستکاری وشە'}</h2>
              <button onClick={() => setEditing(null)} className="text-muted hover:text-ink"><X className="h-5 w-5" /></button>
            </div>

            <div className="mb-3 flex justify-center">
              <WordImage imageUrl={editing.image_url} englishPrompt={editing.en} emoji={editing.emoji} size={120} />
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-muted">هاوپۆڵ</span>
                <select
                  value={editing.category_id || ''}
                  onChange={(e) => setEditing((s) => ({ ...s, category_id: e.target.value }))}
                  className="w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-sm text-ink outline-none focus:border-crew"
                >
                  {bank.categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name_ku}</option>)}
                </select>
              </label>
              <Field label="ناوی کوردی" value={editing.ku} onChange={(v) => setEditing((s) => ({ ...s, ku: v }))} placeholder="وەک: مەیمون" />
              <Field label="ناوی عەرەبی" value={editing.ar} onChange={(v) => setEditing((s) => ({ ...s, ar: v }))} placeholder="مثلاً: قرد" />
              <Field label="وەسفی ئینگلیزی (بۆ وێنەی AI)" value={editing.en} onChange={(v) => setEditing((s) => ({ ...s, en: v }))} placeholder="e.g. monkey" dir="ltr" />
              <Field label="ئیمۆجی" value={editing.emoji} onChange={(v) => setEditing((s) => ({ ...s, emoji: v }))} placeholder="🐵" dir="ltr" />
              <Field label="بەستەری وێنە (URL — ئارەزوومەندانە)" value={editing.image_url} onChange={(v) => setEditing((s) => ({ ...s, image_url: v }))} placeholder="https://…" dir="ltr" />
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={editing.enabled !== false} onChange={(e) => setEditing((s) => ({ ...s, enabled: e.target.checked }))} />
                <EyeOff className="h-4 w-4 text-muted" /> چالاک (لە یاریدا دەردەکەوێت)
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              <Button className="flex-1" onClick={saveWord} disabled={busy}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} پاشەکەوت
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>هەڵوەشاندنەوە</Button>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* ───── مۆداڵی هاوپۆڵی نوێ ───── */}
      {newCat && createPortal((
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => setNewCat(null)}>
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-black text-ink">هاوپۆڵی نوێ</h2>
              <button onClick={() => setNewCat(null)} className="text-muted hover:text-ink"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <Field label="ناسنامە (ئینگلیزی، بێ بۆشایی)" value={newCat.id} onChange={(v) => setNewCat((s) => ({ ...s, id: v }))} placeholder="movies" dir="ltr" />
              <Field label="ناوی کوردی" value={newCat.name_ku} onChange={(v) => setNewCat((s) => ({ ...s, name_ku: v }))} placeholder="فیلمەکان" />
              <Field label="ناوی عەرەبی" value={newCat.name_ar} onChange={(v) => setNewCat((s) => ({ ...s, name_ar: v }))} placeholder="الأفلام" />
              <Field label="ئیمۆجی" value={newCat.icon} onChange={(v) => setNewCat((s) => ({ ...s, icon: v }))} placeholder="🎬" dir="ltr" />
            </div>
            <div className="mt-5 flex gap-2">
              <Button className="flex-1" onClick={saveCat} disabled={busy}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} زیادکردن
              </Button>
              <Button variant="ghost" onClick={() => setNewCat(null)}>هەڵوەشاندنەوە</Button>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  )
}

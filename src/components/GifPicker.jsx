// ═══════════════════════════════════════════════════════════
//  GifPicker — گەڕان و هەڵبژاردنی GIF (Tenor)
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { searchGifs } from '../lib/gif'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'

export default function GifPicker({ onSelect, onClose }) {
  const t = useT()
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const timer = useRef(null)

  useEffect(() => {
    setLoading(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      searchGifs(q)
        .then(setResults)
        .finally(() => setLoading(false))
    }, 350)
    return () => clearTimeout(timer.current)
  }, [q])

  return (
    <div className="mt-2 rounded-2xl border border-line bg-surface p-2 shadow-card animate-fade-in">
      {/* گەڕان */}
      <div className="mb-2 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-ink/5 px-3">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('گەڕان بۆ GIF…')}
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink/30"
          />
        </div>
        <button onClick={onClose} className="btn-press grid h-9 w-9 place-items-center rounded-xl bg-ink/5 text-muted">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ئەنجامەکان */}
      <div className="h-48 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-crew" />
          </div>
        ) : results.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted">{t('هیچ نەدۆزرایەوە')}</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {results.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  sfx.tap()
                  onSelect(g.full)
                }}
                className="btn-press overflow-hidden rounded-lg bg-ink/5"
              >
                <img src={g.preview} alt={g.desc} loading="lazy" className="h-24 w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="mt-1 text-center text-[10px] text-muted">Powered by GIPHY</p>
    </div>
  )
}

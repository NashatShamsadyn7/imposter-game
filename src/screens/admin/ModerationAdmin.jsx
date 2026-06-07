// ═══════════════════════════════════════════════════════════
//  پەڕەی بەڕێوەبردنی ڕاپۆرتەکان (تەنها بەڕێوەبەر)
//  لیستی یاریزانە ڕاپۆرتکراوەکان بەپێی ژمارەی ڕاپۆرت + حظر/لابردنی حظر.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, Loader2, ShieldAlert, Ban, Check, Flag } from 'lucide-react'
import { useWords } from '../../state/WordsContext'
import { useNotify } from '../../state/NotificationContext'
import { Button, Panel } from '../../components/ui'
import Avatar from '../../components/Avatar'
import { SkeletonList } from '../../components/Skeleton'
import { adminReports, adminSetBan } from '../../lib/supabase'

function timeAgo(iso) {
  if (!iso) return ''
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60) return 'ئێستا'
  if (s < 3600) return `${Math.floor(s / 60)} خولەک`
  if (s < 86400) return `${Math.floor(s / 3600)} کاتژمێر`
  return `${Math.floor(s / 86400)} ڕۆژ`
}

export default function ModerationAdmin({ onBack }) {
  const { isAdmin } = useWords()
  const notify = useNotify()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setRows(await adminReports()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  const toggleBan = async (row) => {
    const next = !row.banned
    if (next && !window.confirm(`حظری «${row.display_name}»؟`)) return
    setBusy(row.reported_id)
    try {
      await adminSetBan(row.reported_id, next)
      setRows((rs) => rs.map((r) => (r.reported_id === row.reported_id ? { ...r, banned: next } : r)))
      notify({ title: next ? `«${row.display_name}» حظرکرا` : `حظر لابرا`, type: next ? 'warn' : 'success' })
    } catch (e) {
      notify({ title: 'هەڵە', body: e?.message || String(e), type: 'error' })
    } finally {
      setBusy(null)
    }
  }

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
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="btn-press flex items-center gap-1 text-muted hover:text-ink">
          <ChevronRight className="h-5 w-5" /> گەڕانەوە
        </button>
        <h1 className="flex items-center gap-1.5 text-lg font-black text-ink">
          <Flag className="h-5 w-5 text-impostor" /> ڕاپۆرتەکان
        </h1>
      </div>

      {loading ? (
        <SkeletonList rows={6} />
      ) : rows.length === 0 ? (
        <Panel className="text-center text-muted">هیچ ڕاپۆرتێک نییە ✅</Panel>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.reported_id} className={`flex items-center gap-3 rounded-xl border p-2.5 ${r.banned ? 'border-impostor/40 bg-impostor/5' : 'border-line bg-surface2'}`}>
              <Avatar url={r.avatar_url} name={r.display_name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{r.display_name}{r.banned && <span className="text-xs text-impostor"> · حظرکراو</span>}</p>
                <p className="text-xs text-muted">{Number(r.cnt)} ڕاپۆرت · {timeAgo(r.last_at)}</p>
              </div>
              <button
                onClick={() => toggleBan(r)}
                disabled={busy === r.reported_id}
                className={`btn-press flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold ${
                  r.banned ? 'bg-crew/15 text-crew' : 'bg-impostor/15 text-impostor'
                }`}
              >
                {busy === r.reported_id ? <Loader2 className="h-4 w-4 animate-spin" /> : r.banned ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                {r.banned ? 'لابردن' : 'حظر'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

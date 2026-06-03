// ═══════════════════════════════════════════════════════════
//  UsernamePrompt — بۆردی ناچاری دانانی یوزەرنەیم لە یەکەم جار
//  بەبێ یوزەرنەیم ناتوانرێت بەردەوام بێت (هاوڕێیان بەمە دەتدۆزنەوە).
// ═══════════════════════════════════════════════════════════

import { useState } from 'react'
import { AtSign, Check, Loader2, Sparkles } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { setUsername as saveUsername } from '../lib/supabase'
import { Button, Panel } from '../components/ui'
import { sfx } from '../lib/sound'

const ERR = {
  invalid: 'ناو دەبێت ٣–٢٠ پیت بێت (a-z، 0-9، _ )',
  taken: 'ئەم ناوە وەرگیراوە — یەکێکی تر تاقی بکەرەوە',
  reserved: 'ئەم ناوە ڕێگەپێدراو نییە',
  error: 'هەڵەیەک ڕوویدا — دووبارە هەوڵ بدە',
}

export default function UsernamePrompt() {
  const { profile, refreshProfile } = useAuth()
  const [username, setUsernameInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    const clean = username.trim().toLowerCase()
    if (clean.length < 3) return setError(ERR.invalid)
    setSaving(true)
    setError(null)
    try {
      const res = await saveUsername(clean)
      if (res?.ok) {
        sfx.win()
        await refreshProfile?.()
        // refreshProfile ناوەکە دادەنێت → ئەم بۆردە خۆکار دەڕوات
      } else {
        setError(ERR[res?.reason] || ERR.error)
      }
    } catch {
      setError(ERR.error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-10 text-center">
      <div className="animate-scale-in w-full">
        <div className="mb-6 inline-flex rounded-full border-2 border-crew bg-crew/15 p-6">
          <Sparkles className="h-14 w-14 text-crew" />
        </div>
        <h1 className="mb-2 text-3xl font-black text-ink">ناوێک هەڵبژێرە</h1>
        <p className="mb-8 text-sm text-muted">
          بەخێربێیت {profile?.display_name || ''}! ناوێکی بەکارهێنەری بێهاوتا دابنێ تاکو
          هاوڕێیانت بتدۆزنەوە و بانگهێشتت بکەن.
        </p>

        <Panel className="!p-4">
          <div className="flex items-center rounded-2xl border border-line bg-surface2 px-3 focus-within:border-crew">
            <AtSign className="h-5 w-5 shrink-0 text-muted" />
            <input
              autoFocus
              value={username}
              onChange={(e) =>
                setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))
              }
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="username"
              dir="ltr"
              className="min-w-0 flex-1 bg-transparent px-2 py-3 text-left font-mono text-lg text-ink outline-none"
            />
          </div>
          {error ? (
            <p className="mt-2 text-xs font-medium text-impostor">{error}</p>
          ) : (
            <p className="mt-2 text-xs text-muted">
              ٣–٢٠ پیت · تەنها پیتی ئینگلیزی بچووک، ژمارە و _
            </p>
          )}
          <Button
            onClick={submit}
            disabled={saving || username.trim().length < 3}
            className="mt-4 w-full !py-3.5 !text-lg"
          >
            {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Check className="h-6 w-6" />}
            دەستپێکردن
          </Button>
        </Panel>
      </div>
    </div>
  )
}

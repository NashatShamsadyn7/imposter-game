import { useState, useRef } from 'react'
import { ChevronRight, Camera, Check, Copy, Loader2, IdCard } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { Button, Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import { uploadAvatar, updateMyProfile } from '../lib/supabase'
import { sfx } from '../lib/sound'

// شاشەی دەستکاریکردنی پرۆفایل — ناو + وێنە + کۆدی هاوڕێیەتی
export default function ProfileEdit({ onBack }) {
  const { user, profile, setProfile } = useAuth()
  const [name, setName] = useState(profile?.display_name || '')
  const [avatar, setAvatar] = useState(profile?.avatar_url || null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  const pickFile = () => fileRef.current?.click()

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      setError('قەبارەی وێنە زۆرە (زۆرترین ٤ مێگابایت)')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const url = await uploadAvatar(user.id, file)
      setAvatar(url)
    } catch (err) {
      setError('بارکردنی وێنە سەرکەوتوو نەبوو: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!name.trim()) return setError('ناو پێویستە')
    setSaving(true)
    setError(null)
    try {
      const updated = await updateMyProfile(user.id, {
        display_name: name.trim().slice(0, 30),
        avatar_url: avatar,
      })
      setProfile(updated)
      sfx.win()
      setDone(true)
      setTimeout(() => setDone(false), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const copyCode = () => {
    if (!profile?.friend_code) return
    navigator.clipboard?.writeText(profile.friend_code)
    sfx.tap()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <header className="mb-6 flex items-center gap-3 animate-fade-in">
        <button
          onClick={onBack}
          className="btn-press grid h-10 w-10 place-items-center rounded-xl bg-surface text-muted shadow-card hover:text-ink"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-black text-ink">پرۆفایلی من</h1>
      </header>

      {/* وێنە */}
      <div className="mb-6 flex flex-col items-center">
        <button onClick={pickFile} className="btn-press relative">
          <Avatar url={avatar} name={name} size={104} ring />
          <span className="absolute bottom-0 left-0 grid h-9 w-9 place-items-center rounded-full bg-crew text-white shadow-card">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <p className="mt-2 text-xs text-muted">کرتە بکە بۆ گۆڕینی وێنە</p>
      </div>

      {/* ناو */}
      <Panel className="mb-4 !p-4">
        <label className="mb-2 block text-sm font-bold text-ink">ناوی پیشاندان</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="ناوەکەت بنووسە"
          className="w-full rounded-2xl border border-line bg-surface2 px-4 py-3 text-ink outline-none focus:border-crew"
        />
      </Panel>

      {/* کۆدی هاوڕێیەتی */}
      <Panel className="mb-6 !p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-crew/12 text-crew">
            <IdCard className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">کۆدی هاوڕێیەتی</p>
            <p className="font-mono text-lg font-black tracking-widest text-crew">
              {profile?.friend_code || '—'}
            </p>
          </div>
          <button
            onClick={copyCode}
            className="btn-press grid h-10 w-10 place-items-center rounded-xl bg-ink/5 text-ink hover:bg-ink/10"
            title="کۆپیکردن"
          >
            {copied ? <Check className="h-5 w-5 text-crew" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">ئەم کۆدە بدە بە هاوڕێیەکانت بۆ زیادکردنت</p>
      </Panel>

      {error && (
        <p className="mb-4 rounded-2xl bg-impostor/10 px-4 py-3 text-center text-sm font-medium text-impostor">
          {error}
        </p>
      )}

      <Button onClick={save} disabled={saving || uploading} className="w-full !py-4 !text-lg">
        {saving ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : done ? (
          <Check className="h-6 w-6" />
        ) : null}
        {done ? 'پاشەکەوتکرا' : 'پاشەکەوتکردن'}
      </Button>
    </div>
  )
}

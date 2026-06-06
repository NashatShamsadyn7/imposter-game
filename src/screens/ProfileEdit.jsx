import { useState, useRef } from 'react'
import { ChevronRight, Camera, Check, Copy, Loader2, AtSign, Share2 } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { Button, Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import { uploadAvatar, updateMyProfile, setUsername as saveUsername } from '../lib/supabase'
import { sfx } from '../lib/sound'

// نووسینی هۆکاری شکستی یوزەرنەیم
const USERNAME_ERR = {
  invalid: 'ناو دەبێت ٣–٢٠ پیت بێت (a-z، 0-9، _ )',
  taken: 'ئەم ناوە وەرگیراوە',
  reserved: 'ئەم ناوە ڕێگەپێدراو نییە',
  error: 'هەڵەیەک ڕوویدا',
}

// شاشەی دەستکاریکردنی پرۆفایل — ناو + وێنە + یوزەرنەیم + لینکی بانگهێشت
export default function ProfileEdit({ onBack }) {
  const { user, profile, setProfile, refreshProfile } = useAuth()
  const [name, setName] = useState(profile?.display_name || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [avatar, setAvatar] = useState(profile?.avatar_url || null)
  const [saving, setSaving] = useState(false)
  const [savingU, setSavingU] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [uDone, setUDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)
  const [uError, setUError] = useState(null)
  const fileRef = useRef(null)

  const hasUsername = !!profile?.username
  const shareLink = profile?.username
    ? `${window.location.origin}/?ref=${profile.username}`
    : null

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

  const saveUname = async () => {
    const clean = username.trim().toLowerCase()
    if (!clean) return setUError(USERNAME_ERR.invalid)
    setSavingU(true)
    setUError(null)
    try {
      const res = await saveUsername(clean)
      if (res?.ok) {
        sfx.win()
        setUDone(true)
        setTimeout(() => setUDone(false), 1500)
        await refreshProfile?.()
      } else {
        setUError(USERNAME_ERR[res?.reason] || USERNAME_ERR.error)
      }
    } catch {
      setUError(USERNAME_ERR.error)
    } finally {
      setSavingU(false)
    }
  }

  const copyLink = () => {
    if (!shareLink) return
    navigator.clipboard?.writeText(shareLink)
    sfx.tap()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const shareInvite = async () => {
    if (!shareLink) return
    sfx.tap()
    const text = `یاری ساختەکار بکە لەگەڵم! 🚀\n${shareLink}`
    if (navigator.share) {
      try { await navigator.share({ title: 'ساختەکار', text, url: shareLink }) } catch { /* لابردن */ }
    } else {
      copyLink()
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 md:max-w-2xl">
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

      {/* ناوی پیشاندان */}
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

      {/* یوزەرنەیم — هاوڕێیان بەمە دەتدۆزنەوە */}
      <Panel className="mb-4 !p-4">
        <label className="mb-2 block text-sm font-bold text-ink">
          ناوی بەکارهێنەر (username)
        </label>
        <div className="flex gap-2">
          <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-line bg-surface2 px-3 focus-within:border-crew">
            <AtSign className="h-4 w-4 shrink-0 text-muted" />
            <input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))
              }
              onKeyDown={(e) => e.key === 'Enter' && saveUname()}
              placeholder="username"
              dir="ltr"
              className="min-w-0 flex-1 bg-transparent px-2 py-3 text-left font-mono text-ink outline-none"
            />
          </div>
          <Button
            onClick={saveUname}
            disabled={savingU || !username.trim() || username === profile?.username}
            className="!px-4"
          >
            {savingU ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : uDone ? (
              <Check className="h-5 w-5" />
            ) : (
              'پاشەکەوت'
            )}
          </Button>
        </div>
        {uError ? (
          <p className="mt-2 text-xs font-medium text-impostor">{uError}</p>
        ) : (
          <p className="mt-2 text-xs text-muted">
            ٣–٢٠ پیت. تەنها پیتی ئینگلیزی بچووک، ژمارە و _ . هاوڕێیان بەمە دەتدۆزنەوە.
          </p>
        )}
      </Panel>

      {/* لینکی بانگهێشت — دراو بۆ تۆ و هاوڕێکەت */}
      <Panel className="mb-6 !p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-500">
            <Share2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">لینکی بانگهێشتی هاوڕێیان</p>
            <p className="text-xs text-muted">
              هەرکەسێک بەم لینکە بچێتە ژوورەوە، هەردووکتان دراو وەردەگرن
            </p>
          </div>
        </div>
        {hasUsername ? (
          <>
            <div className="flex items-center gap-2 rounded-2xl bg-surface2 px-3 py-2.5">
              <span dir="ltr" className="min-w-0 flex-1 truncate text-left font-mono text-xs text-crew">
                {shareLink}
              </span>
              <button
                onClick={copyLink}
                className="btn-press grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink/5 text-ink hover:bg-ink/10"
                title="کۆپیکردن"
              >
                {copied ? <Check className="h-5 w-5 text-crew" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            <Button onClick={shareInvite} className="mt-3 w-full">
              <Share2 className="h-5 w-5" /> هاوبەشکردنی لینک
            </Button>
          </>
        ) : (
          <p className="rounded-2xl bg-ink/5 px-3 py-3 text-center text-xs text-muted">
            سەرەتا ناوی بەکارهێنەرێک دابنێ بۆ دروستکردنی لینکی بانگهێشت
          </p>
        )}
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

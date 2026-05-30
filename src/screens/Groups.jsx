// ═══════════════════════════════════════════════════════════
//  Groups — لیستی گرووپەکانم + دروستکردن + بەشداربوون بە کۆد
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { ChevronRight, Plus, LogIn, Users, Crown, Loader2, X } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { Button, Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import GroupChat from './GroupChat'
import {
  fetchMyGroups,
  createGroup,
  joinGroupByCode,
  subscribeMyGroupMemberships,
} from '../lib/supabase'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'

export default function Groups({ onBack }) {
  const { user, profile } = useAuth()
  const t = useT()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null) // گرووپی کراوە
  const [modal, setModal] = useState(null) // 'create' | 'join'
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const load = () => {
    if (!user) return
    fetchMyGroups(user.id)
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    if (!user) return
    const unsub = subscribeMyGroupMemberships(user.id, load)
    return () => unsub?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // گرووپی کراوە
  if (active) {
    return (
      <GroupChat
        group={active}
        onBack={() => setActive(null)}
        onLeft={() => {
          setActive(null)
          load()
        }}
      />
    )
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      const g = await createGroup(user, profile, name)
      setModal(null)
      setName('')
      load()
      setActive({ ...g, myRole: 'owner' })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async () => {
    if (!code.trim()) return
    setBusy(true)
    setError(null)
    try {
      const g = await joinGroupByCode(code, user)
      setModal(null)
      setCode('')
      load()
      setActive(g)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      {/* سەردێڕ */}
      <header className="mb-5 flex items-center gap-3 animate-fade-in">
        <button
          onClick={onBack}
          className="btn-press grid h-10 w-10 place-items-center rounded-xl bg-surface text-muted shadow-card hover:text-ink"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <h1 className="flex items-center gap-2 text-xl font-black text-ink">
          <Users className="h-6 w-6 text-crew" /> {t('گرووپەکان')}
        </h1>
      </header>

      {/* دوگمەکان */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <Button onClick={() => { sfx.click(); setModal('create'); setError(null) }} className="!py-3">
          <Plus className="h-5 w-5" /> {t('گرووپی نوێ')}
        </Button>
        <Button onClick={() => { sfx.click(); setModal('join'); setError(null) }} variant="outline" className="!py-3">
          <LogIn className="h-5 w-5" /> {t('بەشداربوون')}
        </Button>
      </div>

      {/* لیست */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-crew" />
        </div>
      ) : groups.length === 0 ? (
        <Panel className="text-center text-muted">
          <Users className="mx-auto mb-2 h-10 w-10 text-ink/20" />
          {t('هێشتا هیچ گرووپێکت نییە.')}
          <br />
          {t('گرووپێک دروست بکە یان بە کۆد بەشداربە!')}
        </Panel>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => { sfx.tap(); setActive(g) }}
              className="btn-press block w-full text-right"
            >
              <Panel className="flex items-center gap-3 !p-3 transition hover:border-crew">
                <Avatar url={g.avatar_url} name={g.name} size={46} ring />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-bold text-ink">
                    {g.name}
                    {g.myRole === 'owner' && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                  </p>
                  <p className="font-mono text-xs text-muted">{t('کۆد:')} {g.code}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted" />
              </Panel>
            </button>
          ))}
        </div>
      )}

      {/* مۆداڵی دروستکردن/بەشداربوون */}
      {modal && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-line bg-surface p-5 shadow-soft animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-ink">
                {modal === 'create' ? t('گرووپی نوێ') : t('بەشداربوون بە کۆد')}
              </h2>
              <button onClick={() => setModal(null)} className="btn-press rounded-full bg-ink/5 p-1.5 text-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modal === 'create' ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('ناوی گرووپ…')}
                maxLength={40}
                className="mb-3 w-full rounded-2xl border border-ink/10 bg-ink/5 px-4 py-3 text-ink outline-none focus:border-crew/60"
              />
            ) : (
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t('کۆدی گرووپ (٦ پیت)')}
                maxLength={6}
                className="mb-3 w-full rounded-2xl border border-ink/10 bg-ink/5 px-4 py-3 text-center font-mono text-lg font-black tracking-widest text-ink outline-none focus:border-crew/60"
              />
            )}

            {error && (
              <p className="mb-3 rounded-xl bg-impostor/10 px-3 py-2 text-center text-sm text-impostor">{error}</p>
            )}

            <Button
              onClick={modal === 'create' ? handleCreate : handleJoin}
              disabled={busy || (modal === 'create' ? !name.trim() : !code.trim())}
              className="w-full"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : modal === 'create' ? t('دروستکردن') : t('بەشداربوون')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

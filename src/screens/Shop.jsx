// ═══════════════════════════════════════════════════════════
//  Shop — دوکانی جوانکاری: کڕین بە دراو + بەرکردن (equip)
//  چوار تاب: چوارچێوە · ڕەنگی ناو · ناونیشان · شێوەی سندووق
// ═══════════════════════════════════════════════════════════

import { useState } from 'react'
import { ChevronRight, Coins, Check, Gift, Lock } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useEconomy } from '../state/EconomyContext'
import { Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import FrameFx from '../components/FrameFx'
import { levelInfo } from '../lib/achievements'
import {
  FRAMES, NAME_COLORS, TITLES, CHEST_SKINS,
  equippedFrameStyle, equippedNameColor, equippedTitle,
} from '../lib/cosmetics'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'

const TABS = [
  { id: 'frame',     label: 'چوارچێوە',  items: FRAMES },
  { id: 'nameColor', label: 'ڕەنگی ناو', items: NAME_COLORS },
  { id: 'title',     label: 'ناونیشان',  items: TITLES },
  { id: 'chestSkin', label: 'سندووق',    items: CHEST_SKINS },
]

// نموونەی بچووکی هەر شتومەکێک بەپێی جۆر
function Swatch({ item }) {
  if (item.type === 'frame') {
    const spins = (item.anim || '').includes('cos-spin')
    return (
      <div className="relative h-12 w-12">
        <div className={`grid h-full w-full place-items-center rounded-full bg-gradient-to-br ${item.ring} ${item.glow} ${item.anim || ''}`}>
          <div className={`h-8 w-8 rounded-full bg-surface ${spins ? 'cos-spin-rev' : ''}`} />
        </div>
        {item.fx && <FrameFx fx={item.fx} size={48} />}
      </div>
    )
  }
  if (item.type === 'nameColor') {
    return <span className={`text-xl font-black ${item.className}`}>ناو</span>
  }
  if (item.type === 'title') {
    return <span className="rounded-full bg-crew/15 px-3 py-1 text-sm font-black text-crew">{item.text}</span>
  }
  // chestSkin
  return (
    <div className={`grid h-12 w-12 place-items-center rounded-2xl border-2 bg-gradient-to-br ${item.ring} ${item.glow}`}>
      <Gift className={`h-6 w-6 ${item.iconColor}`} />
    </div>
  )
}

export default function Shop({ onBack }) {
  const t = useT()
  const { profile } = useAuth()
  const { coins, equipped, isOwned, buy, equip } = useEconomy()
  const [tab, setTab] = useState('frame')
  const [flash, setFlash] = useState(null) // id ـی ئەو شتەی نوێ کڕدرا (بۆ ئەنیمەیشن)

  const { level } = levelInfo(profile?.total_points)
  const frameStyle = equippedFrameStyle(equipped)
  const nameColor = equippedNameColor(equipped)
  const title = equippedTitle(equipped)

  const items = TABS.find((x) => x.id === tab).items

  const [busy, setBusy] = useState(false) // ڕێگری لە دووجار کلیک لە کاتی کڕینی سێرڤەر

  const onBuy = async (item) => {
    if (busy) return
    setBusy(true)
    try {
      const ok = await buy(item)
      if (ok) {
        sfx.chest()
        setFlash(item.id)
        setTimeout(() => setFlash(null), 700)
        equip(item) // خۆکار بەری بکە دوای کڕین
      } else {
        sfx.lose()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      {/* سەرپەڕە */}
      <header className="mb-5 flex items-center justify-between">
        <button onClick={onBack} className="btn-press grid h-10 w-10 place-items-center rounded-full bg-surface text-ink shadow-card">
          <ChevronRight className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-black text-ink">{t('دوکان')}</h1>
        <span className="flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1.5 text-sm font-black text-amber-500">
          <Coins className="h-4 w-4" /> {coins}
        </span>
      </header>

      {/* پێشبینینی زیندوو */}
      <Panel className="mb-5 flex items-center gap-4 !p-4">
        <Avatar url={profile?.avatar_url} name={profile?.display_name} size={56} level={level} cosmeticFrame={frameStyle} />
        <div className="min-w-0">
          <p className={`truncate text-lg font-black ${nameColor || 'text-ink'}`}>
            {profile?.display_name || t('یاریزان')}
          </p>
          {title && <p className="text-xs font-bold text-muted">{title}</p>}
          <p className="mt-0.5 text-xs text-muted">{t('پێشبینینی ڕووکارت')}</p>
        </div>
      </Panel>

      {/* تابەکان */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((x) => (
          <button
            key={x.id}
            onClick={() => { sfx.tap?.(); setTab(x.id) }}
            className={`btn-press shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              tab === x.id ? 'bg-crew text-white shadow-card' : 'bg-surface text-muted hover:text-ink'
            }`}
          >
            {t(x.label)}
          </button>
        ))}
      </div>

      {/* گرید */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const owned = isOwned(item.id)
          const isEquipped = equipped[item.type] === item.id
          const affordable = coins >= item.price
          return (
            <Panel key={item.id} className={`!p-4 text-center transition ${flash === item.id ? 'animate-reward-pop' : ''} ${isEquipped ? 'border-crew' : ''}`}>
              <div className="mb-3 flex h-14 items-center justify-center">
                <Swatch item={item} />
              </div>
              <p className="mb-2 truncate text-sm font-bold text-ink">{t(item.name)}</p>

              {isEquipped ? (
                <button
                  onClick={() => { sfx.tap?.(); equip(item) }}
                  className="btn-press w-full rounded-xl bg-crew px-3 py-2 text-xs font-black text-white"
                >
                  <Check className="mx-auto h-4 w-4" />
                </button>
              ) : owned ? (
                <button
                  onClick={() => { sfx.tap?.(); equip(item) }}
                  className="btn-press w-full rounded-xl bg-crew/15 px-3 py-2 text-xs font-black text-crew"
                >
                  {t('بەرکردن')}
                </button>
              ) : (
                <button
                  onClick={() => onBuy(item)}
                  disabled={!affordable || busy}
                  className={`btn-press flex w-full items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-black ${
                    affordable && !busy ? 'bg-amber-500 text-white' : 'cursor-not-allowed bg-ink/10 text-muted'
                  }`}
                >
                  {affordable ? <Coins className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {item.price}
                </button>
              )}
            </Panel>
          )
        })}
      </div>

      {/* تێبینی چۆن دراو بەدەست بهێنیت */}
      <p className="mt-6 text-center text-xs text-muted">
        {t('دراو لە هەر یارییەک و لە سندووقی خەڵاتەوە بەدەست دەهێنیت.')}
      </p>
    </div>
  )
}

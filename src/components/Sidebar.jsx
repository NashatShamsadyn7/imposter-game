// ═══════════════════════════════════════════════════════════
//  Sidebar — شریتی ناڤیگەیشنی باریک (RTL: لای ڕاست)
//  دیسکتۆپ: شریتی ئایکۆن کە لە کاتی هۆڤەردا فراوان دەبێت.
//  مۆبایل: شریتێکی خوارەوە بە ئایکۆنە سەرەکییەکان.
// ═══════════════════════════════════════════════════════════

import { Home, Wifi, Smartphone, ShoppingBag, Crown, Users, BarChart3, Trophy, Settings as SettingsIcon, User, LogOut, BookA } from 'lucide-react'
import { useT } from '../lib/i18n'
import { sfx } from '../lib/sound'

// هەموو خاڵەکانی ناڤیگەیشن (id دەبێت لەگەڵ view ـەکانی Shell بگونجێت)
const ITEMS = [
  { id: 'menu', icon: Home, label: 'سەرەکی' },
  { id: 'online', icon: Wifi, label: 'ئۆنلاین' },
  { id: 'local', icon: Smartphone, label: 'ناوخۆیی' },
  { id: 'shop', icon: ShoppingBag, label: 'دوکان' },
  { id: 'leaderboard', icon: Crown, label: 'لیدەربۆرد' },
  { id: 'friends', icon: Users, label: 'هاوڕێیان' },
  { id: 'stats', icon: BarChart3, label: 'ئامار' },
  { id: 'achievements', icon: Trophy, label: 'دەستکەوت' },
  { id: 'profile', icon: User, label: 'پرۆفایل' },
  { id: 'settings', icon: SettingsIcon, label: 'ڕێکخستن' },
]

// خاڵە سەرەکییەکانی مۆبایل (شریتی خوارەوە)
const MOBILE_IDS = ['menu', 'online', 'shop', 'leaderboard', 'friends']

export default function Sidebar({ view, onNavigate, onSignOut, isAdmin = false }) {
  const t = useT()
  const go = (id) => {
    sfx.tap()
    onNavigate(id)
  }
  // خاڵی بەڕێوەبردنی وشە تەنها بۆ بەڕێوەبەر دەردەکەوێت
  const items = isAdmin ? [...ITEMS, { id: 'admin', icon: BookA, label: 'وشەکان' }] : ITEMS
  const mobileItems = items.filter((i) => MOBILE_IDS.includes(i.id))

  return (
    <>
      {/* ───── دیسکتۆپ: شریتی باریک لای ڕاست ───── */}
      <aside className="group fixed right-0 top-0 z-40 hidden h-screen w-16 flex-col gap-1 overflow-hidden border-l border-line bg-surface/85 p-2 backdrop-blur-xl transition-all duration-200 hover:w-52 md:flex">
        <div className="mb-2 grid h-12 shrink-0 place-items-center text-crew">
          <Home className="h-6 w-6" />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((it) => {
            const active = view === it.id
            return (
              <button
                key={it.id}
                onClick={() => go(it.id)}
                title={t(it.label)}
                className={`btn-press flex items-center gap-3 rounded-xl px-3 py-2.5 text-right ${
                  active ? 'bg-crew/15 text-crew' : 'text-muted hover:bg-ink/5 hover:text-ink'
                }`}
              >
                <it.icon className="h-5 w-5 shrink-0" />
                <span className="whitespace-nowrap text-sm font-bold opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {t(it.label)}
                </span>
              </button>
            )
          })}
        </nav>
        <button
          onClick={() => { sfx.tap(); onSignOut() }}
          title={t('چوونەدەرەوە')}
          className="btn-press mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted hover:bg-impostor/10 hover:text-impostor"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="whitespace-nowrap text-sm font-bold opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {t('چوونەدەرەوە')}
          </span>
        </button>
      </aside>

      {/* ───── مۆبایل: شریتی خوارەوە ───── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-line bg-surface/90 backdrop-blur-xl md:hidden">
        {mobileItems.map((it) => {
          const active = view === it.id
          return (
            <button
              key={it.id}
              onClick={() => go(it.id)}
              className={`btn-press flex h-full flex-1 flex-col items-center justify-center gap-0.5 ${
                active ? 'text-crew' : 'text-muted'
              }`}
            >
              <it.icon className="h-5 w-5" />
              <span className="text-[10px] font-bold">{t(it.label)}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}

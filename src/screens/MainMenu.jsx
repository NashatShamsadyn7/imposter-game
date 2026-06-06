import { Rocket, Wifi, Smartphone, Settings as SettingsIcon, LogOut, Star, ChevronLeft, Trophy, Users, MessagesSquare, Crown, ShoppingBag, Coins, BarChart3 } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useFriends } from '../state/FriendsContext'
import { useEconomy } from '../state/EconomyContext'
import { Panel } from '../components/ui'
import Avatar from '../components/Avatar'
import DailyPanel from '../components/DailyPanel'
import ShareApp from '../components/ShareApp'
import { levelInfo } from '../lib/achievements'
import { equippedFrameStyle, equippedNameColor, equippedTitle, equippedAvatar } from '../lib/cosmetics'
import { useT } from '../lib/i18n'
import { sfx, unlockAudio } from '../lib/sound'

// مێنیوی سەرەکی دوای چوونەژوورەوە
export default function MainMenu({ onOnline, onLocal, onSettings, onAchievements, onStats, onLeaderboard, onProfile, onFriends, onGroups, onShop }) {
  const { profile, signOut } = useAuth()
  const { totalUnread, incoming } = useFriends()
  const { coins, equipped } = useEconomy()
  const { level } = levelInfo(profile?.total_points)
  const t = useT()
  const friendBadge = totalUnread + incoming.length
  const frameStyle = equippedFrameStyle(equipped)
  const nameColor = equippedNameColor(equipped)
  const title = equippedTitle(equipped)
  const avatarChar = equippedAvatar(equipped)

  const go = (fn) => {
    unlockAudio()
    sfx.click()
    fn()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6 md:max-w-3xl">
      {/* پرۆفایل */}
      <header className="mb-8 flex items-center justify-between animate-fade-in">
        <button
          onClick={() => go(onProfile)}
          className="btn-press flex items-center gap-3 rounded-full bg-surface py-1.5 pl-4 pr-1.5 shadow-card transition hover:border-crew"
          title={t('پرۆفایلی من')}
        >
          <div className="relative">
            <Avatar url={profile?.avatar_url} name={profile?.display_name} size={40} level={level} cosmeticFrame={frameStyle} avatarChar={avatarChar} ring />
            <span className="absolute -bottom-1 -left-1 grid h-5 min-w-5 place-items-center rounded-full bg-crew px-1 text-[10px] font-black text-white">
              {level}
            </span>
          </div>
          <div className="text-right leading-tight">
            <p className={`text-sm font-bold ${nameColor || 'text-ink'}`}>{profile?.display_name}</p>
            {title && <p className="text-[11px] font-bold text-muted">{title}</p>}
            <p className="flex items-center gap-2 text-xs text-crew">
              <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-crew" />{profile?.total_points ?? 0}</span>
              <span className="flex items-center gap-1 text-amber-500"><Coins className="h-3 w-3" />{coins}</span>
            </p>
          </div>
        </button>
        {/* ئایکۆنەکان: لە دیسکتۆپ بە شریتی لاتەنیشت دەردەکەون (md:hidden).
            هاوڕێیان و لیدەربۆرد لە شریتی خوارەوەی مۆبایلن، بۆیە لێرە لانەبراون. */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => go(onGroups)}
            className="btn-press grid h-11 w-11 place-items-center rounded-full bg-surface text-crew shadow-card hover:brightness-110"
            title={t('گرووپەکان')}
          >
            <MessagesSquare className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(onAchievements)}
            className="btn-press grid h-11 w-11 place-items-center rounded-full bg-surface text-crew shadow-card hover:brightness-110"
            title={t('دەستکەوت و ئاست')}
          >
            <Trophy className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(onStats)}
            className="btn-press grid h-11 w-11 place-items-center rounded-full bg-surface text-crew shadow-card hover:brightness-110"
            title={t('ئامار')}
          >
            <BarChart3 className="h-5 w-5" />
          </button>
          <button
            onClick={() => signOut()}
            className="btn-press grid h-11 w-11 place-items-center rounded-full bg-surface text-muted shadow-card hover:text-impostor"
            title={t('چوونەدەرەوە')}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* هیرۆ */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="relative mb-3">
          <span className="absolute inset-0 -z-10 rounded-3xl bg-crew/30 blur-xl" />
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-impostor to-crew shadow-soft neon-ring">
            <Rocket className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-ink neon-text">{t('ساختەکار')}</h1>
        <p className="mt-1 text-sm text-muted">{t('شێوازی یاری هەڵبژێرە')}</p>
      </div>

      {/* پاداشتی ڕۆژانە + مەرج */}
      <DailyPanel />

      {/* بانگهێشتی هاوڕێیان + پاداشتی هاوبەشکردن */}
      <ShareApp />

      <div className="flex flex-1 flex-col justify-center gap-4 md:grid md:grid-cols-2 md:content-start">
        {/* ئۆنلاین */}
        <button onClick={() => go(onOnline)} className="btn-press block w-full text-right">
          <Panel className="panel-glow flex items-center gap-4 !p-4 transition hover:border-crew">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-crew/15 text-crew neon-ring">
              <Wifi className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-ink">{t('یاریکردنی ئۆنلاین')}</p>
              <p className="text-sm text-muted">{t('هەر کەس لە ئامێری خۆی + چات')}</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted" />
          </Panel>
        </button>

        {/* ناوخۆیی */}
        <button onClick={() => go(onLocal)} className="btn-press block w-full text-right">
          <Panel className="flex items-center gap-4 !p-4 transition hover:border-impostor">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-impostor/12 text-impostor">
              <Smartphone className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-ink">{t('یاریکردنی ناوخۆیی')}</p>
              <p className="text-sm text-muted">{t('یەک ئامێر — Pass and Play')}</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted" />
          </Panel>
        </button>

        {/* دوکان */}
        <button onClick={() => go(onShop)} className="btn-press block w-full text-right">
          <Panel className="flex items-center gap-4 !p-4 transition hover:border-amber-400">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-400/12 text-amber-500">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-ink">{t('دوکان')}</p>
              <p className="text-sm text-muted">{t('چوارچێوە، ڕەنگی ناو و ناونیشان بکڕە')}</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-black text-amber-500">
              <Coins className="h-3.5 w-3.5" />{coins}
            </span>
          </Panel>
        </button>

        {/* ڕێکخستن */}
        <button onClick={() => go(onSettings)} className="btn-press block w-full text-right">
          <Panel className="flex items-center gap-4 !p-4 transition hover:border-ink/30">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink/8 text-ink">
              <SettingsIcon className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-ink">{t('ڕێکخستنەکان')}</p>
              <p className="text-sm text-muted">{t('دەنگ، مۆسیقا، ڕووکار')}</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted" />
          </Panel>
        </button>
      </div>
    </div>
  )
}

import { useEffect, useState, lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './state/AuthContext'
import { RoomProvider, useRoom } from './state/RoomContext'
import { ProfileViewerProvider } from './state/ProfileViewer'
import { LocalProvider, useLocal } from './state/LocalContext'
import { FriendsProvider } from './state/FriendsContext'
import { EconomyProvider } from './state/EconomyContext'
import { NotificationProvider } from './state/NotificationContext'
import { LanguageProvider } from './lib/i18n'
import Background from './components/Background'
import ErrorBoundary from './components/ErrorBoundary'
import LevelUpOverlay from './components/LevelUpOverlay'
import Login from './screens/Login'
import MainMenu from './screens/MainMenu'
// ───── بارکردنی درەنگ (code-splitting) — هەر شاشە بە پێویست دادەبەزرێت ─────
const SettingsScreen = lazy(() => import('./screens/Settings'))
const Home = lazy(() => import('./screens/Home'))
const Achievements = lazy(() => import('./screens/Achievements'))
const Leaderboard = lazy(() => import('./screens/Leaderboard'))
const ProfileEdit = lazy(() => import('./screens/ProfileEdit'))
const Friends = lazy(() => import('./screens/Friends'))
const Groups = lazy(() => import('./screens/Groups'))
const RoomLobby = lazy(() => import('./screens/RoomLobby'))
const Reveal = lazy(() => import('./screens/Reveal'))
const Discussion = lazy(() => import('./screens/Discussion'))
const Voting = lazy(() => import('./screens/Voting'))
const Results = lazy(() => import('./screens/Results'))
const LocalLobby = lazy(() => import('./screens/local/LocalLobby'))
const LocalReveal = lazy(() => import('./screens/local/LocalReveal'))
const LocalDiscussion = lazy(() => import('./screens/local/LocalDiscussion'))
const LocalVoting = lazy(() => import('./screens/local/LocalVoting'))
const LocalResults = lazy(() => import('./screens/local/LocalResults'))
const Shop = lazy(() => import('./screens/Shop'))
// چینی دەنگ بە درەنگ — livekit-client لە بەستەی سەرەکی دادەبڕێت
const VoiceLayer = lazy(() => import('./state/VoiceLayer'))
import { startMusic, unlockAudio, setSfxEnabled, setMusicEnabled } from './lib/sound'

function FullLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center text-crew">
      <Loader2 className="h-10 w-10 animate-spin" />
    </div>
  )
}

// ───── ڕێڕەوی ئۆنلاین ─────
function OnlineRoomRouter({ onExit, joinCode, onJoinHandled }) {
  const { room, joinRoom, me } = useRoom()
  const { user, profile } = useAuth()

  // بانگهێشت: ئەگەر کۆدی پەیوەستبوون هەبوو، خۆکار بەشداربە
  useEffect(() => {
    if (joinCode && !room) {
      joinRoom(joinCode)
      onJoinHandled?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinCode])

  if (!room) return <Home onExit={onExit} />

  let screen
  switch (room.status) {
    case 'reveal': screen = <Reveal />; break
    case 'discussion': screen = <Discussion />; break
    case 'voting': screen = <Voting />; break
    case 'results': screen = <Results />; break
    default: screen = <RoomLobby />
  }

  // دەنگی ڕاستەوخۆ لە تەواوی ژوور (لۆبی → ئەنجام)
  // شاشە لە دەرەوەی چینی دەنگ دەمێنێتەوە، بۆیە دواخستنی LiveKit
  // ناکاتە هۆی دووبارە-سواربوونی شاشە یان لەدەستدانی دۆخ.
  return (
    <>
      {screen}
      <Suspense fallback={null}>
        <VoiceLayer
          roomId={room.id}
          identity={user?.id}
          name={profile?.display_name}
          canSpeak={!!me?.can_speak}
        />
      </Suspense>
    </>
  )
}

// ───── ڕێڕەوی ناوخۆیی ─────
function LocalRouter({ onExit }) {
  const { phase } = useLocal()
  switch (phase) {
    case 'reveal': return <LocalReveal />
    case 'discussion': return <LocalDiscussion />
    case 'voting': return <LocalVoting />
    case 'results': return <LocalResults />
    default: return <LocalLobby onExit={onExit} />
  }
}

// ───── ناوەوەی دوای چوونەژوورەوە ─────
function Shell({ ui }) {
  const { user, profile, loading, isSupabaseEnabled } = useAuth()
  // کۆدی بانگهێشت لە لینکی هاوبەشکراو (?join=CODE) — پاکی دەکەینەوە لە URL
  const [pendingJoin, setPendingJoin] = useState(() => {
    const c = new URLSearchParams(window.location.search).get('join')
    if (c) {
      window.history.replaceState({}, '', window.location.pathname)
      return c.toUpperCase()
    }
    return null
  })
  const [view, setView] = useState(pendingJoin ? 'online' : 'menu') // menu | online | local | settings | achievements | profile | friends

  if (!isSupabaseEnabled) return <Login />
  if (loading) return <FullLoader />
  if (!user) return <Login />
  if (!profile) return <FullLoader />

  const toMenu = () => setView('menu')
  // بانگهێشت بۆ ژوور: کۆد هەڵبگرە و بڕۆ بۆ ئۆنلاین
  const joinByCode = (code) => {
    setPendingJoin(code)
    setView('online')
  }

  let inner
  switch (view) {
    case 'online':
      inner = (
        <RoomProvider>
          <OnlineRoomRouter
            onExit={toMenu}
            joinCode={pendingJoin}
            onJoinHandled={() => setPendingJoin(null)}
          />
        </RoomProvider>
      )
      break
    case 'local':
      inner = (
        <LocalProvider>
          <LocalRouter onExit={toMenu} />
        </LocalProvider>
      )
      break
    case 'settings':
      inner = <SettingsScreen ui={ui} onBack={toMenu} />
      break
    case 'achievements':
      inner = <Achievements onBack={toMenu} />
      break
    case 'leaderboard':
      inner = <Leaderboard onBack={toMenu} />
      break
    case 'profile':
      inner = <ProfileEdit onBack={toMenu} />
      break
    case 'friends':
      inner = <Friends onBack={toMenu} onJoinRoom={joinByCode} />
      break
    case 'groups':
      inner = <Groups onBack={toMenu} />
      break
    case 'shop':
      inner = <Shop onBack={toMenu} />
      break
    default:
      inner = (
        <MainMenu
          onOnline={() => setView('online')}
          onLocal={() => setView('local')}
          onSettings={() => setView('settings')}
          onAchievements={() => setView('achievements')}
          onLeaderboard={() => setView('leaderboard')}
          onProfile={() => setView('profile')}
          onFriends={() => setView('friends')}
          onGroups={() => setView('groups')}
          onShop={() => setView('shop')}
        />
      )
  }

  return (
    <EconomyProvider>
      <NotificationProvider>
        <FriendsProvider>
          <ProfileViewerProvider>
            <ErrorBoundary onReset={toMenu}>
              <Suspense fallback={<FullLoader />}>{inner}</Suspense>
            </ErrorBoundary>
          </ProfileViewerProvider>
          <LevelUpOverlay />
        </FriendsProvider>
      </NotificationProvider>
    </EconomyProvider>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('imposter:theme') || 'dark')
  const [sfxOn, setSfxOn] = useState(() => localStorage.getItem('imposter:sfx') !== 'off')
  const [musicOn, setMusicOn] = useState(() => localStorage.getItem('imposter:music') !== 'off')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('imposter:theme', theme)
  }, [theme])

  useEffect(() => {
    setSfxEnabled(sfxOn)
    localStorage.setItem('imposter:sfx', sfxOn ? 'on' : 'off')
  }, [sfxOn])

  useEffect(() => {
    setMusicEnabled(musicOn)
    localStorage.setItem('imposter:music', musicOn ? 'on' : 'off')
  }, [musicOn])

  // چالاککردنی ئۆدیۆ لەدوای یەکەم کرتە
  useEffect(() => {
    const handler = () => {
      unlockAudio()
      if (musicOn) startMusic()
      window.removeEventListener('pointerdown', handler)
    }
    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [musicOn])

  const ui = { theme, setTheme, sfxOn, setSfxOn, musicOn, setMusicOn }

  return (
    <LanguageProvider>
      <Background />
      <AuthProvider>
        <Shell ui={ui} />
      </AuthProvider>
    </LanguageProvider>
  )
}

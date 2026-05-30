import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './state/AuthContext'
import { RoomProvider, useRoom } from './state/RoomContext'
import { LocalProvider, useLocal } from './state/LocalContext'
import { FriendsProvider } from './state/FriendsContext'
import { NotificationProvider } from './state/NotificationContext'
import Background from './components/Background'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './screens/Login'
import MainMenu from './screens/MainMenu'
import SettingsScreen from './screens/Settings'
import Home from './screens/Home'
import Achievements from './screens/Achievements'
import ProfileEdit from './screens/ProfileEdit'
import Friends from './screens/Friends'
import RoomLobby from './screens/RoomLobby'
import Reveal from './screens/Reveal'
import Discussion from './screens/Discussion'
import Voting from './screens/Voting'
import Results from './screens/Results'
import LocalLobby from './screens/local/LocalLobby'
import LocalReveal from './screens/local/LocalReveal'
import LocalDiscussion from './screens/local/LocalDiscussion'
import LocalVoting from './screens/local/LocalVoting'
import LocalResults from './screens/local/LocalResults'
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
  const { room, joinRoom } = useRoom()

  // بانگهێشت: ئەگەر کۆدی پەیوەستبوون هەبوو، خۆکار بەشداربە
  useEffect(() => {
    if (joinCode && !room) {
      joinRoom(joinCode)
      onJoinHandled?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinCode])

  if (!room) return <Home onExit={onExit} />
  switch (room.status) {
    case 'reveal': return <Reveal />
    case 'discussion': return <Discussion />
    case 'voting': return <Voting />
    case 'results': return <Results />
    default: return <RoomLobby />
  }
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
  const [view, setView] = useState('menu') // menu | online | local | settings | achievements | profile | friends
  const [pendingJoin, setPendingJoin] = useState(null)

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
    case 'profile':
      inner = <ProfileEdit onBack={toMenu} />
      break
    case 'friends':
      inner = <Friends onBack={toMenu} onJoinRoom={joinByCode} />
      break
    default:
      inner = (
        <MainMenu
          onOnline={() => setView('online')}
          onLocal={() => setView('local')}
          onSettings={() => setView('settings')}
          onAchievements={() => setView('achievements')}
          onProfile={() => setView('profile')}
          onFriends={() => setView('friends')}
        />
      )
  }

  return (
    <NotificationProvider>
      <FriendsProvider>
        <ErrorBoundary onReset={toMenu}>{inner}</ErrorBoundary>
      </FriendsProvider>
    </NotificationProvider>
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
    <>
      <Background />
      <AuthProvider>
        <Shell ui={ui} />
      </AuthProvider>
    </>
  )
}

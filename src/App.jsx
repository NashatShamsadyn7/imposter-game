import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './state/AuthContext'
import { RoomProvider, useRoom } from './state/RoomContext'
import { LocalProvider, useLocal } from './state/LocalContext'
import Background from './components/Background'
import Login from './screens/Login'
import MainMenu from './screens/MainMenu'
import SettingsScreen from './screens/Settings'
import Home from './screens/Home'
import Achievements from './screens/Achievements'
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
function OnlineRoomRouter({ onExit }) {
  const { room } = useRoom()
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
  const [view, setView] = useState('menu') // menu | online | local | settings

  if (!isSupabaseEnabled) return <Login />
  if (loading) return <FullLoader />
  if (!user) return <Login />
  if (!profile) return <FullLoader />

  const toMenu = () => setView('menu')

  switch (view) {
    case 'online':
      return (
        <RoomProvider>
          <OnlineRoomRouter onExit={toMenu} />
        </RoomProvider>
      )
    case 'local':
      return (
        <LocalProvider>
          <LocalRouter onExit={toMenu} />
        </LocalProvider>
      )
    case 'settings':
      return <SettingsScreen ui={ui} onBack={toMenu} />
    case 'achievements':
      return <Achievements onBack={toMenu} />
    default:
      return (
        <MainMenu
          onOnline={() => setView('online')}
          onLocal={() => setView('local')}
          onSettings={() => setView('settings')}
          onAchievements={() => setView('achievements')}
        />
      )
  }
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

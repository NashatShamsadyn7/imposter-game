// ═══════════════════════════════════════════════════════════
//  ئەپی ئەندرۆید — ساختەکار (ئۆفلاین)
//
//  تەنها مۆدی «یەک ئامێر» (Pass and Play). بێ چوونەژوورەوە،
//  بێ Supabase، بێ ژووری ئۆنلاین، بێ دراو و دوکان.
//
//  شاشەکانی یاری (screens/local/*) بەبێ هیچ گۆڕانکارییەک
//  هەروەک خۆیان بەکاردێن — یەک سەرچاوەی ڕاستی لەگەڵ وێب.
// ═══════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { App as CapacitorApp } from '@capacitor/app'

import { LanguageProvider, useT } from '../lib/i18n'
import Background from '../components/Background'
import ErrorBoundary from '../components/ErrorBoundary'
import { Button, Panel } from '../components/ui'
// ⚠️ بە ئەنقەست لە «state/WordsContext» ـەوە هاوردە دەکرێت، نەک
//    ڕاستەوخۆ لە OfflineWordsContext. بەمە هەردوو لای گواستنەوەکە
//    (ئێرە و LocalContext) بە هەمان ڕێگەی پێوەکراو تێدەپەڕن و
//    دڵنیا دەبین کە یەک مۆدیوول و یەک context ـیان هەیە.
import { WordsProvider } from '../state/WordsContext'
import { LocalProvider, useLocal } from '../state/LocalContext'
import LanguagePick, { hasPickedLang } from './LanguagePick'
import OfflineMenu from './OfflineMenu'
import OfflineSettings from './OfflineSettings'
import { setSfxEnabled, unlockAudio, sfx } from '../lib/sound'
import { setHapticsEnabled, haptic } from '../lib/haptics'
import { useWakeLock } from '../lib/useWakeLock'

const LocalLobby = lazy(() => import('../screens/local/LocalLobby'))
const LocalReveal = lazy(() => import('../screens/local/LocalReveal'))
const LocalDiscussion = lazy(() => import('../screens/local/LocalDiscussion'))
const LocalVoting = lazy(() => import('../screens/local/LocalVoting'))
const LocalResults = lazy(() => import('../screens/local/LocalResults'))

function FullLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center text-crew">
      <Loader2 className="h-10 w-10 animate-spin" />
    </div>
  )
}

// ───── ڕێڕەوی قۆناغەکانی یاری ─────
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

// ───── دڵنیاکردنەوەی دەرچوون لە ناوەڕاستی یاری ─────
function ConfirmExit({ onConfirm, onCancel }) {
  const t = useT()
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6 backdrop-blur-sm">
      <Panel className="w-full max-w-xs animate-scale-in text-center">
        <p className="mb-2 text-lg font-black text-ink">{t('یاری بەجێبهێڵیت؟')}</p>
        <p className="mb-5 text-sm text-muted">{t('ئەم یارییە لەدەست دەچێت.')}</p>
        <div className="flex gap-2">
          <Button onClick={onCancel} variant="ghost" className="flex-1">
            {t('نەخێر')}
          </Button>
          <Button onClick={onConfirm} variant="danger" className="flex-1">
            {t('بەڵێ')}
          </Button>
        </div>
      </Panel>
    </div>
  )
}

// ───── ناوەوە — دەبێت لەناو LocalProvider بێت تاکو دوگمەی گەڕانەوە
//        بزانێت لە چ قۆناغێکداین ─────
function Shell({ ui }) {
  const { phase, playAgain } = useLocal()
  const [view, setView] = useState('menu') // menu | game | settings
  const [confirmExit, setConfirmExit] = useState(false)

  // شاشە بەخەبەر بمێنێتەوە لە کاتی یاری — مۆبایل دەست بە دەست دەگوازرێتەوە
  useWakeLock(view === 'game')

  const toMenu = useCallback(() => {
    playAgain()
    setView('menu')
  }, [playAgain])

  // ───── دوگمەی گەڕانەوەی ئەندرۆید ─────
  // ڕەفتاری قۆناغ-ئاگادار: لە ناوەڕاستی یاری بەبێ دڵنیاکردنەوە دەرناچێت،
  // چونکە دەرچوونی هەڵە هەموو یارییەکە لەناودەبات.
  useEffect(() => {
    let remove = null
    CapacitorApp.addListener('backButton', () => {
      haptic.light()
      if (confirmExit) { setConfirmExit(false); return }
      if (view === 'settings') { setView('menu'); return }
      if (view === 'game') {
        if (phase === 'lobby') { setView('menu'); return }
        if (phase === 'results') { playAgain(); return }
        setConfirmExit(true)
        return
      }
      // لە مێنیوی سەرەکی — دەرچوون لە ئەپ
      CapacitorApp.exitApp()
    }).then((h) => { remove = h })
    return () => { remove?.remove() }
  }, [view, phase, confirmExit, playAgain])

  let inner
  if (view === 'settings') {
    inner = <OfflineSettings ui={ui} onBack={() => setView('menu')} />
  } else if (view === 'game') {
    inner = <LocalRouter onExit={toMenu} />
  } else {
    inner = <OfflineMenu onPlay={() => setView('game')} onSettings={() => setView('settings')} />
  }

  return (
    <>
      {/* pt safe-area: بۆ ئەوەی سەرپەڕە نەچێتە ژێر شریتی دۆخ */}
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <ErrorBoundary onReset={toMenu}>
          <Suspense fallback={<FullLoader />}>
            <div key={view + phase} className="animate-page-in">{inner}</div>
          </Suspense>
        </ErrorBoundary>
      </div>
      {confirmExit && (
        <ConfirmExit
          onCancel={() => setConfirmExit(false)}
          onConfirm={() => { setConfirmExit(false); toMenu() }}
        />
      )}
    </>
  )
}

export default function AppOffline() {
  const [theme, setTheme] = useState(() => localStorage.getItem('imposter:theme') || 'dark')
  const [sfxOn, setSfxOn] = useState(() => localStorage.getItem('imposter:sfx') !== 'off')
  const [hapticsOn, setHapticsOn] = useState(() => localStorage.getItem('imposter:haptics') !== 'off')
  const [langPicked, setLangPicked] = useState(hasPickedLang)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('imposter:theme', theme)
  }, [theme])

  useEffect(() => {
    setSfxEnabled(sfxOn)
    localStorage.setItem('imposter:sfx', sfxOn ? 'on' : 'off')
  }, [sfxOn])

  useEffect(() => {
    setHapticsEnabled(hapticsOn)
    localStorage.setItem('imposter:haptics', hapticsOn ? 'on' : 'off')
  }, [hapticsOn])

  // چالاککردنی ئۆدیۆ لەدوای یەکەم کرتە (سیاسەتی وێبڤیو)
  useEffect(() => {
    const handler = () => {
      unlockAudio()
      window.removeEventListener('pointerdown', handler)
    }
    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [])

  const ui = { theme, setTheme, sfxOn, setSfxOn, hapticsOn, setHapticsOn }

  // ⚠️ حاجزی هەڵە دەبێت لە سەرەوەی هەموو provider ـەکان بێت.
  //    ئەگەر لە ژێریان بێت، هەڵەیەک لەناو WordsProvider/LocalProvider
  //    دەگاتە ڕەگی React و ئەنجامەکەی شاشەیەکی ڕەشی بێدەنگە،
  //    نەک پەیامێکی هەڵە.
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <Background />
        {langPicked ? (
          <WordsProvider>
            <LocalProvider>
              <Shell ui={ui} />
            </LocalProvider>
          </WordsProvider>
        ) : (
          <LanguagePick onDone={() => { sfx.reveal(); setLangPicked(true) }} />
        )}
      </LanguageProvider>
    </ErrorBoundary>
  )
}

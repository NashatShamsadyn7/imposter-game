import { Rocket, LogIn, AlertTriangle, ChevronRight, Skull, ShieldCheck, Mic, Users, ShoppingBag, Lock, ExternalLink, Copy } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../state/AuthContext'
import { signInWithGoogle } from '../lib/supabase'
import { Button, Panel } from '../components/ui'
import { useT } from '../lib/i18n'
import { isEmbeddedBrowser, isAndroid, openInExternalBrowser } from '../lib/browser'

const FEATURES = [
  { icon: Mic, label: 'دەنگ' },
  { icon: Users, label: 'هاوڕێیان' },
  { icon: ShoppingBag, label: 'دوکان' },
]

export default function Login({ onExit }) {
  const { isSupabaseEnabled } = useAuth()
  const t = useT()
  const embedded = isEmbeddedBrowser()
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center overflow-hidden px-5 py-10 text-center">
      {/* ئایکۆنە مەلەکەرە لە پشتەوە — جوانکاری */}
      <Skull className="animate-float pointer-events-none absolute left-6 top-24 h-12 w-12 text-impostor/10" />
      <ShieldCheck className="animate-float pointer-events-none absolute right-8 top-40 h-14 w-14 text-crew/10" style={{ animationDelay: '2s' }} />
      <Skull className="animate-float pointer-events-none absolute bottom-28 right-10 h-10 w-10 text-impostor/10" style={{ animationDelay: '4s' }} />
      <ShieldCheck className="animate-float pointer-events-none absolute bottom-40 left-8 h-12 w-12 text-crew/10" style={{ animationDelay: '1s' }} />

      {onExit && (
        <button
          onClick={onExit}
          className="btn-press absolute right-4 top-4 flex items-center gap-1 rounded-xl bg-surface px-3 py-2 text-sm text-muted shadow-card hover:text-ink"
        >
          <ChevronRight className="h-4 w-4" />
          {t('گەڕانەوە')}
        </button>
      )}
      <div className="animate-scale-in w-full">
        <div className="relative mb-6 inline-flex">
          {/* هاڵەی توهج لە پشتەوە */}
          <span className="absolute inset-0 -z-10 rounded-full bg-crew/30 blur-2xl" />
          <div className="animate-pulse-glow inline-flex rounded-full border-2 border-crew/70 bg-gradient-to-br from-crew/25 to-impostor/20 p-6 neon-ring">
            <Rocket className="h-16 w-16 text-crew" />
          </div>
        </div>
        <h1 className="mb-2 text-5xl font-black tracking-tight text-ink neon-text">{t('ساختەکار')}</h1>
        <p className="mb-6 text-ink/60">{t('یاری گرووپیی فەزایی — ئۆنلاین لەگەڵ هاوڕێکانت')}</p>

        {/* تایبەتمەندییەکان */}
        <div className="mb-8 flex justify-center gap-2">
          {FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-1.5 rounded-full border border-line bg-surface/60 px-3 py-1.5 backdrop-blur">
              <f.icon className="h-3.5 w-3.5 text-crew" />
              <span className="text-xs font-bold text-ink/70">{t(f.label)}</span>
            </div>
          ))}
        </div>

        {isSupabaseEnabled ? (
          embedded ? (
            // ─ وێبگەڕی ناو-ئەپ: Google و تەختەکلیل کار ناکەن — ڕێنمایی بکە ─
            <Panel className="border-amber-400/50 text-right">
              <div className="mb-3 flex items-center justify-center gap-2 text-amber-500">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="font-bold">{t('بیکەرەوە لە وێبگەڕەکەت')}</h2>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-ink/70">
                {t('ئێستا ئەپەکە لەناو ئەپێکی تردا (وەک Instagram/Facebook) کراوەتەوە. چوونەژوورەوە بە Google و تەختەکلیل لێرە کار ناکەن. تکایە لە Chrome یان Safari بیکەرەوە.')}
              </p>
              {isAndroid() ? (
                <Button onClick={openInExternalBrowser} className="mb-2 w-full">
                  <ExternalLink className="h-5 w-5" /> {t('کردنەوە لە Chrome')}
                </Button>
              ) : (
                <p className="mb-3 text-xs leading-relaxed text-muted">
                  {t('لە iPhone: لە گۆشەی سەرەوە دوگمەی ⋯ یان «Open in Safari» لێبدە.')}
                </p>
              )}
              <Button variant="ghost" onClick={copyLink} className="w-full">
                <Copy className="h-4 w-4" /> {copied ? t('کۆپیکرا ✓') : t('کۆپیکردنی بەستەر')}
              </Button>
            </Panel>
          ) : (
          <Panel className="panel-glow">
            <p className="text-ink/70 mb-5 text-sm leading-relaxed">
              {t('بۆ یاریکردن پێویستە بچیتە ژوورەوە. ئەمە وێنەی پرۆفایل و کۆکردنەوەی خاڵەکانت پاشەکەوت دەکات.')}
            </p>
            <Button onClick={() => signInWithGoogle()} className="w-full !py-4 !text-lg">
              <LogIn className="h-6 w-6" />
              {t('چوونەژوورەوە بە Google')}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
              <Lock className="h-3 w-3" /> {t('پارێزراو بە Google — بێ وشەی نهێنی')}
            </p>
          </Panel>
          )
        ) : (
          <Panel className="border-impostor/40 text-right">
            <div className="mb-3 flex items-center gap-2 text-impostor">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-bold">Supabase ڕێکنەخراوە</h2>
            </div>
            <p className="text-sm text-ink/70 leading-relaxed">
              بۆ یاری ئۆنلاین، پێویستە کلیلەکانی Supabase دابنێیت لە فایلی{' '}
              <code className="text-crew">.env</code>. ڕێنماییەکان لە{' '}
              <code className="text-crew">README.md</code> هەن.
            </p>
          </Panel>
        )}
      </div>
    </div>
  )
}

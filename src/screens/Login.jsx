import { Rocket, LogIn, AlertTriangle, ChevronRight } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { signInWithGoogle } from '../lib/supabase'
import { Button, Panel } from '../components/ui'
import { useT } from '../lib/i18n'

export default function Login({ onExit }) {
  const { isSupabaseEnabled } = useAuth()
  const t = useT()

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-10 text-center">
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
        <p className="mb-10 text-ink/60">{t('یاری گرووپیی فەزایی — ئۆنلاین لەگەڵ هاوڕێکانت')}</p>

        {isSupabaseEnabled ? (
          <Panel className="panel-glow">
            <p className="text-ink/70 mb-5 text-sm leading-relaxed">
              {t('بۆ یاریکردن پێویستە بچیتە ژوورەوە. ئەمە وێنەی پرۆفایل و کۆکردنەوەی خاڵەکانت پاشەکەوت دەکات.')}
            </p>
            <Button onClick={() => signInWithGoogle()} className="w-full !py-4 !text-lg">
              <LogIn className="h-6 w-6" />
              {t('چوونەژوورەوە بە Google')}
            </Button>
          </Panel>
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

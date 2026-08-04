// ═══════════════════════════════════════════════════════════
//  هەڵبژاردنی زمان — تەنها یەک جار، لە یەکەم کردنەوەی ئەپ
//
//  ⚠️ ئاڵۆزییەکی ورد: i18next خۆی زمان لە navigator دەدۆزێتەوە و
//     لە localStorage ('imposter:lang') کاشی دەکات. بۆیە ئەو کلیلە
//     ناتوانێت وەک نیشانەی «هەڵیبژاردووە» بەکاربێت — کلیلێکی
//     جیاواز بەکاردەهێنین.
// ═══════════════════════════════════════════════════════════

import { Check } from 'lucide-react'
import { LANGS, useLang } from '../lib/i18n'
import { sfx, unlockAudio } from '../lib/sound'
import { haptic } from '../lib/haptics'

export const PICKED_KEY = 'imposter:offline:lang-chosen'

export function hasPickedLang() {
  try {
    return localStorage.getItem(PICKED_KEY) === '1'
  } catch {
    return false
  }
}

export default function LanguagePick({ onDone }) {
  const { lang, setLang } = useLang()

  const choose = (code) => {
    unlockAudio()
    sfx.click()
    haptic.light()
    setLang(code)
    try {
      localStorage.setItem(PICKED_KEY, '1')
    } catch {
      /* ئاسایی */
    }
    onDone?.()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="w-full animate-scale-in">
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-4">
            <span className="absolute inset-0 -z-10 rounded-3xl bg-crew/30 blur-xl" />
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-impostor to-crew shadow-soft neon-ring">
              <svg viewBox="0 0 64 64" className="h-11 w-11" aria-hidden="true">
                <circle cx="32" cy="28" r="11" fill="#e84545" />
                <ellipse cx="37" cy="26" rx="6" ry="7.5" fill="#00d4ff" />
                <rect x="23" y="37" width="18" height="17" rx="8" fill="#e84545" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-black text-ink neon-text">ساختەکار</h1>
        </div>

        {/* بە هەردوو زمان دەنووسرێت — چونکە هێشتا نازانین کامەیان دەخوێنێتەوە */}
        <p className="mb-1 text-lg font-bold text-ink">زمانەکەت هەڵبژێرە</p>
        <p className="mb-8 text-sm text-muted" dir="rtl">
          اختر لغتك
        </p>

        <div className="flex flex-col gap-3">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              dir={l.dir}
              className="btn-press flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4 shadow-card transition hover:border-crew"
            >
              <span className="text-xl font-black text-ink">{l.name}</span>
              {lang === l.code && <Check className="h-5 w-5 text-crew" />}
            </button>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted">
          لە ڕێکخستنەکان دەتوانیت بیگۆڕیت · يمكنك تغييرها من الإعدادات
        </p>
      </div>
    </div>
  )
}

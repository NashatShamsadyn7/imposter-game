// ═══════════════════════════════════════════════════════════
//  i18n — پشتگیری زمان (i18next)
//  کلیلەکان دەقی سەرچاوەی کوردین (t('کوردی')) — هیچ شوێنێک نەگۆڕدراوە.
//  زمان نوێ زیاد بکە: ملف بخە ناو locales/ و لێرە register بکە.
//  زمانی نەوەرگێڕدراو → دەگەڕێتەوە سەر کوردی (کلیل).
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useEffect, useState } from 'react'
import i18next from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { AR } from './translations'
import { EN } from './locales/en'

const LS_KEY = 'imposter:lang'

// زمانە پشتگیریکراوەکان + ئاراستە (RTL/LTR)
export const LANGS = [
  { code: 'ku', name: 'کوردی', dir: 'rtl' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'en', name: 'English', dir: 'ltr' },
]

const RTL = new Set(['ku', 'ar', 'fa', 'he', 'ur'])
export const dirFor = (code) => (RTL.has(code) ? 'rtl' : 'ltr')

if (!i18next.isInitialized) {
  i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      // کلیلەکان دەقی کوردین → کوردی resource ـی بەتاڵە (کلیل وەک خۆی دەگەڕێتەوە)
      resources: {
        ku: { translation: {} },
        ar: { translation: AR },
        en: { translation: EN },
      },
      fallbackLng: 'ku',
      supportedLngs: ['ku', 'ar', 'en'],
      // کلیلەکان ':' و '.' لەخۆدەگرن — جیاکەرەوەکان ناکارا بکە
      keySeparator: false,
      nsSeparator: false,
      returnEmptyString: false,
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: LS_KEY,
        caches: ['localStorage'],
      },
    })
}

// دڵنیابوون لە هاوکاتی localStorage ـی کۆن (imposter:lang) + ئاراستەی <html>
function applyLang(code) {
  localStorage.setItem(LS_KEY, code)
  document.documentElement.lang = code
  document.documentElement.dir = dirFor(code)
}

const LangContext = createContext(null)

export function LanguageProvider({ children }) {
  const { t, i18n } = useTranslation()
  const [lang, setLangState] = useState(i18n.language || 'ku')

  useEffect(() => {
    applyLang(lang)
  }, [lang])

  const setLang = (code) => {
    i18n.changeLanguage(code)
    setLangState(code)
  }

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext) || { lang: 'ku', setLang: () => {}, t: (s) => s }
}

// قورتکراوە: تەنها فەنکشنی t
export function useT() {
  return useLang().t
}

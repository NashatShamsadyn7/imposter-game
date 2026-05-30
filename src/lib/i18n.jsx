// ═══════════════════════════════════════════════════════════
//  i18n — پشتگیری زمان (کوردی ↔ عەرەبی)
//  t(kurdishText) → ئەگەر زمان عەرەبی بێت وەرگێڕانەکەی دەگەڕێنێتەوە،
//  ئەگەرنا هەمان دەقی کوردی. بەمە دەقە وەرنەگێڕدراوەکان بە کوردی دەمێننەوە.
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useEffect, useState } from 'react'
import { AR } from './translations'

const LangContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('imposter:lang') || 'ku')

  useEffect(() => {
    localStorage.setItem('imposter:lang', lang)
    document.documentElement.lang = lang
    document.documentElement.dir = 'rtl' // هەردوو زمان لە ڕاستەوە بۆ چەپە
  }, [lang])

  const t = (s) => (lang === 'ar' ? AR[s] ?? s : s)
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext) || { lang: 'ku', setLang: () => {}, t: (s) => s }
}

// قورتکراوە: تەنها فەنکشنی t
export function useT() {
  return useLang().t
}

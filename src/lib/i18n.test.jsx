// @vitest-environment jsdom
// تاقیکردنەوەی ڕاستەقینەی ڕێندەر — دڵنیابوون لە نەکەوتنی شاشەی سپی
// (i18next دەبێت هاوکات init بکات و useTranslation نابێت suspend بکات)
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import i18next from 'i18next'
import { LanguageProvider, useT } from './i18n.jsx'

function Probe() {
  const t = useT()
  return <div data-testid="probe">{t('سەرەکی')}</div>
}

describe('i18n runtime', () => {
  it('initializes i18next synchronously (no async/Suspense)', () => {
    expect(i18next.isInitialized).toBe(true)
  })

  it('renders LanguageProvider + consumer without crashing (no blank screen)', () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    )
    // ئەگەر suspend/throw بکردایە، getByTestId هەڵە دەداتەوە (probe ڕێندەر نەکراوە)
    const el = screen.getByTestId('probe')
    // دەبێت دەقێک ڕێندەر بکرێت (کوردی کلیل وەک خۆی، یان عەرەبی)
    expect(['سەرەکی', 'الرئيسية']).toContain(el.textContent)
  })
})

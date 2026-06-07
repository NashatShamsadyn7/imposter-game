import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// لابردنی شاشەی دەستپێک دوای بارکردنی React (بە لابردنی نەرم/fade)
requestAnimationFrame(() => {
  const splash = document.getElementById('splash')
  if (!splash) return
  // کەمێک بهێڵەرەوە تاکو fade دیار بێت، پاشان لایببە
  setTimeout(() => {
    splash.classList.add('hide')
    setTimeout(() => splash.remove(), 450)
  }, 300)
})

// تۆمارکردنی Service Worker بۆ دامەزراندن و کارکردن بەبێ ئینتەرنێت (PWA)
// وەشانی نوێ خۆکار چالاک نابێت — بەکارهێنەر دوگمەی «نوێکردنەوە» دەکات
// (ڕووداوی 'sw-waiting' بۆ UI دەنێرین، و دوای چالاکبوون یەک جار reload دەکەین)
if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })

  // ئاگادارکردنەوەی UI کاتێک وەشانی نوێ ئامادەیە (worker چاوەڕوانە)
  const notifyWaiting = (reg) => {
    if (reg.waiting) {
      window.dispatchEvent(new CustomEvent('sw-waiting', { detail: reg }))
    }
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      notifyWaiting(reg) // ئەگەر پێشتر وەشانێکی نوێ چاوەڕوان بوو
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing
        if (!nw) return
        nw.addEventListener('statechange', () => {
          // نوێ دامەزرا + کۆنترۆڵەرێک هەیە = نوێکردنەوەیە (نەک یەکەم دامەزراندن)
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            notifyWaiting(reg)
          }
        })
      })
      reg.update().catch(() => {})
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000)
    }).catch((e) => console.warn('SW:', e.message))
  })
}

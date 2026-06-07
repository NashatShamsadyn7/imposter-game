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
// + بارکردنەوەی خۆکار کاتێک وەشانێکی نوێ چالاک دەبێت (بۆ ئەوەی کۆدی کۆن نەمێنێتەوە)
if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // هەر کاتژمێرێک پشکنین بکە بۆ وەشانی نوێ
      reg.update().catch(() => {})
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000)
    }).catch((e) => console.warn('SW:', e.message))
  })
}

// ═══════════════════════════════════════════════════════════
//  خاڵی دەستپێکی بەستەی ئۆفلاین (ئەپی ئەندرۆید)
//
//  جیاوازی لەگەڵ main.jsx:
//   · AppOffline بەکاردەهێنێت نەک App
//   · Service Worker تۆمار ناکرێت — ئەپەکە خۆی لە خۆماڵییەوە
//     پێشکەش دەکرێت، و SW تەنها دەبێتە هۆی ئاڵۆزی لە WebView
//   · فۆنتی ناوخۆیی هاوپێچ دەکرێت (بێ CDN)
// ═══════════════════════════════════════════════════════════

import React from 'react'
import ReactDOM from 'react-dom/client'
import AppOffline from './offline/AppOffline.jsx'
import './index.css'
import './offline/fonts.css'

// ───── تۆڕی سەلامەتی ─────
// حاجزی هەڵەی React تەنها هەڵەی ڕێندەر دەگرێت. ئەمە ئەوانەی تر
// دەگرێت (بارکردنی مۆدیوول، Promise ـی نەگیراو) و لە جیاتی شاشەی
// ڕەش، دەقی هەڵەکە پیشان دەدات — لەسەر ئامێری ڕاستەقینە ئەمە تاکە
// ڕێگەیە بۆ زانینی ئەوەی ڕوویداوە.
function showFatal(err) {
  const msg = (err && (err.stack || err.message)) || String(err)
  console.error('FATAL:', msg)
  const root = document.getElementById('root')
  if (!root) return
  document.getElementById('splash')?.remove()
  root.innerHTML =
    '<pre style="white-space:pre-wrap;word-break:break-word;direction:ltr;' +
    'padding:20px;color:#ff8080;font:12px/1.5 monospace;background:#0b0f1c;' +
    'min-height:100vh;margin:0">' +
    msg.replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;')) +
    '</pre>'
}
window.addEventListener('error', (e) => showFatal(e.error || e.message))
window.addEventListener('unhandledrejection', (e) => showFatal(e.reason))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppOffline />
  </React.StrictMode>
)

// لابردنی شاشەی دەستپێک دوای بارکردنی React
requestAnimationFrame(() => {
  const splash = document.getElementById('splash')
  if (!splash) return
  setTimeout(() => {
    splash.classList.add('hide')
    setTimeout(() => splash.remove(), 450)
  }, 300)
})

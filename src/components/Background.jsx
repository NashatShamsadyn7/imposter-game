// پاشبنەیەکی نەرمی ڕووناک — بلۆبی ڕەنگاوڕەنگی مات کە بەنەرمی دەجوڵێن.
// ڕەنگەکان لە پاشبنەی بەرکراوی بەکارهێنەرەوە دێن (دوکان → جوانکاری).
import { useEffect, useState } from 'react'
import { getBackground } from '../lib/cosmetics'

function readBg() {
  try {
    return getBackground(localStorage.getItem('imposter:bg'))
  } catch {
    return getBackground(null)
  }
}

export default function Background() {
  const [bg, setBg] = useState(readBg)

  // گوێگرتن لە گۆڕینی پاشبنە (بەرکردن لە دوکان) + لە تابەکانی تر
  useEffect(() => {
    const update = () => setBg(readBg())
    window.addEventListener('imposter:bg', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('imposter:bg', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  const [c1, c2, c3] = bg.blobs || ['#0e9c8e', '#be64f5', '#608cfa']

  return (
    <div className="aurora">
      {/* چینی شەفەقی چەرخاو — پاشبنە زیندوو دەکات */}
      <div className="aurora-rot" />
      {/* وێنەی پاشبنە (ئەگەر هەبوو) */}
      {bg.image && (
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${bg.image})` }}
        />
      )}
      <div
        className="blob animate-float"
        style={{ top: '-6%', right: '-4%', width: '40vw', height: '40vw', maxWidth: 420, maxHeight: 420, background: c1, opacity: 0.16 }}
      />
      <div
        className="blob animate-float"
        style={{ bottom: '-8%', left: '-6%', width: '45vw', height: '45vw', maxWidth: 460, maxHeight: 460, background: c2, opacity: 0.16, animationDelay: '3s' }}
      />
      <div
        className="blob animate-float"
        style={{ top: '40%', left: '55%', width: '32vw', height: '32vw', maxWidth: 340, maxHeight: 340, background: c3, opacity: 0.14, animationDelay: '5s' }}
      />
    </div>
  )
}

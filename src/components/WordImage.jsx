import { useEffect, useState, useRef } from 'react'
import { backupImageUrl, loadLqipMap, lqipFor, resolveImageUrl } from '../lib/images'

// وێنەی وشە
//  ١) LQIP (وێنۆچکەی خاوێن) یەکسەر وەک پاشبنە — بێ داواکاری، بێ چاوەڕوانی
//  ٢) وێنەی ڕەسەن لەسەری دەنیشێت کاتێک گەیشت
//  ٣) ئەگەر هیچیان نەبوو، ئیمۆجی
export default function WordImage({ imageUrl, englishPrompt, emoji, size = 220, className = '' }) {
  const [status, setStatus] = useState('loading') // loading | loaded | error
  const [url, setUrl] = useState(null)
  const [lqip, setLqip] = useState(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    let alive = true
    setStatus('loading')
    setUrl(null)
    setLqip(null)

    // تێبینی: قەبارەی داواکراو بە ئەنقەست هەمیشە ٤٠٠ ـە. Pollinations بۆ هەر
    // قەبارەیەکی جیاواز وێنەیەکی نوێ دروست دەکات (٢٥–٥٠ چرکە)، بۆیە قەبارەی
    // جۆراوجۆر کاشەکەی پارچەپارچە دەکات لە جیاتی خێراکردنی.
    // چاوەڕێی پێڕستی وێنە ناوخۆییەکان دەکەین (فایلێکی بچووکی کاشکراو)
    // تاکو ڕاستەوخۆ بەستەری خێرا هەڵبژێرین و داواکاری بەفیڕۆ نەدەین.
    loadLqipMap().then(() => {
      if (!alive) return
      const next = resolveImageUrl({ imageUrl, englishPrompt })
      setUrl(next)
      setLqip(lqipFor(next))
    })

    // ئەگەر لە ٨ چرکەدا نەگەیشت، ئیمۆجی پیشان بدە
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setStatus((s) => (s === 'loaded' ? s : 'error'))
    }, 8000)
    return () => { alive = false; clearTimeout(timeoutRef.current) }
  }, [imageUrl, englishPrompt])

  const showEmoji = status !== 'loaded' && !lqip

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line bg-surface2 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* LQIP — پاشبنەی خاوێن، بێ هیچ داواکارییەکی تۆڕ */}
      {lqip && status !== 'loaded' && (
        <img
          src={lqip}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-lg"
        />
      )}

      {/* ئیمۆجی وەک پاشبنە/جێگرەوە */}
      {showEmoji && emoji && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize: size * 0.42 }}
        >
          {emoji}
        </div>
      )}

      {url && (
        <img
          src={url}
          alt=""
          width={size}
          height={size}
          loading="eager"
          decoding="async"
          fetchpriority={size >= 120 ? 'high' : 'auto'}
          onLoad={() => setStatus('loaded')}
          onError={() => {
            // وێنەی ناوخۆیی نەگەیشت — هەوڵی نوسخەی Supabase بدە پێش ئیمۆجی
            const backup = backupImageUrl(url)
            if (backup) setUrl(backup)
            else setStatus('error')
          }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}

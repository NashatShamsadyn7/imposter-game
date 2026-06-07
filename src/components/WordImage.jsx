import { useEffect, useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { getWordImageUrl } from '../lib/images'

// وێنەی وشە — یەکەم بەستەری ڕاستەوخۆ (imageUrl)، ئەگەر نەبوو وێنەی AI،
// ئەگەر هیچیان نەگەیشت ئیمۆجی پیشان دەدات
export default function WordImage({ imageUrl, englishPrompt, emoji, size = 220, className = '' }) {
  const [status, setStatus] = useState('loading') // loading | loaded | error
  const [url, setUrl] = useState(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    setStatus('loading')
    // بەستەری ڕاستەوخۆ پێشینەی هەیە بەسەر وێنەی AI
    setUrl(imageUrl || getWordImageUrl(englishPrompt, { width: 400, height: 400 }))
    // ئەگەر لە ٨ چرکەدا نەگەیشت، ئیمۆجی پیشان بدە
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setStatus((s) => (s === 'loaded' ? s : 'error'))
    }, 8000)
    return () => clearTimeout(timeoutRef.current)
  }, [imageUrl, englishPrompt])

  const showEmoji = status !== 'loaded'

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line bg-surface2 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* ئیمۆجی وەک پاشبنە/جێگرەوە */}
      {showEmoji && emoji && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize: size * 0.42 }}
        >
          {emoji}
        </div>
      )}

      {status === 'loading' && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-crew">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {url && (
        <img
          src={url}
          alt=""
          loading="eager"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}

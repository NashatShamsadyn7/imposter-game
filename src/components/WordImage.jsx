import { useEffect, useMemo, useState, useRef } from 'react'
import { imageUrlChain, loadLqipMap, lqipFor } from '../lib/images'

// وێنەی وشە
//  ١) LQIP (وێنۆچکەی خاوێن) وەک پاشبنە — بێ داواکاری، ڕێگر نییە
//  ٢) وێنەی ڕەسەن لەسەری دەنیشێت کاتێک گەیشت
//  ٣) ئەگەر سەرچاوەیەک نەگەیشت، خۆی دەچێتە سەرچاوەی دواتری زنجیرەکە
//  ٤) ئەگەر هیچیان نەبوو، ئیمۆجی
export default function WordImage({ imageUrl, englishPrompt, emoji, size = 220, className = '' }) {
  const [status, setStatus] = useState('loading') // loading | loaded | error
  const [step, setStep] = useState(0)
  const [lqip, setLqip] = useState(null)
  const timeoutRef = useRef(null)

  // زنجیرەی بەستەرەکان: ناوخۆیی → پاڵپشتی Supabase → بنکەداتا → دروستکراو
  const chain = useMemo(
    () => imageUrlChain({ imageUrl, englishPrompt }),
    [imageUrl, englishPrompt]
  )
  const url = chain[step] || null

  // دۆخ ڕێسێت دەکەینەوە کاتێک وشەکە دەگۆڕێت — هاوکات لەگەڵ ڕێندەرکردن
  const [lastChain, setLastChain] = useState(chain)
  if (lastChain !== chain) {
    setLastChain(chain)
    setStep(0)
    setStatus('loading')
    setLqip(lqipFor(chain[0]))
  }

  useEffect(() => {
    let alive = true
    // نەخشەی LQIP لە پاشبنەدا دادەگیرێت — پیشاندانی وێنە ڕانەدەگرێت
    if (!lqipFor(chain[0])) {
      loadLqipMap().then(() => { if (alive) setLqip(lqipFor(chain[0])) })
    }
    // ئەگەر لە ٨ چرکەدا هیچ نەگەیشت، ئیمۆجی پیشان بدە
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setStatus((s) => (s === 'loaded' ? s : 'error'))
    }, 8000)
    return () => { alive = false; clearTimeout(timeoutRef.current) }
  }, [chain])

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
          key={url}
          src={url}
          alt=""
          width={size}
          height={size}
          loading="eager"
          decoding="async"
          fetchpriority={size >= 120 ? 'high' : 'auto'}
          onLoad={() => setStatus('loaded')}
          onError={() => {
            // ئەم سەرچاوەیە نەگەیشت — بڕۆ بۆ ئەوەی دواتر
            if (step + 1 < chain.length) setStep(step + 1)
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

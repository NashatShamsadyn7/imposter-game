// ═══════════════════════════════════════════════════════════
//  Reactions — کاردانەوەی خێرای ئیمۆجی لە کاتی گفتوگۆ
//  ئیمۆجییەکان بە broadcast ـی ڕاستەوخۆ دەنێردرێن (پاشەکەوت ناکرێن)
//  و بە ئەنیمەیشن بەرەو سەرەوە هەڵدەفڕن بۆ هەموو یاریزانان
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import { useRoom } from '../state/RoomContext'
import { useAuth } from '../state/AuthContext'
import { joinReactionChannel } from '../lib/supabase'
import { sfx } from '../lib/sound'

const EMOJIS = ['😂', '😮', '🤔', '🔥', '👏', '😡', '🤫', '🕵️', '❤️', '💀']

export default function Reactions() {
  const { roomId } = useRoom()
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const chanRef = useRef(null)

  useEffect(() => {
    if (!roomId) return
    const chan = joinReactionChannel(roomId, (p) => {
      const item = { ...p, left: 8 + Math.random() * 80 }
      setItems((prev) => [...prev, item])
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== p.id)), 2600)
    })
    chanRef.current = chan
    return () => chan.close()
  }, [roomId])

  const send = (emoji) => {
    sfx.tap()
    chanRef.current?.send(emoji, profile?.display_name)
  }

  return (
    <>
      {/* لایەری هەڵفڕینی ئیمۆجی */}
      <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
        {items.map((it) => (
          <div
            key={it.id}
            className="absolute bottom-28 flex flex-col items-center animate-float-up"
            style={{ left: `${it.left}%` }}
          >
            <span className="text-4xl drop-shadow">{it.emoji}</span>
            {it.name && (
              <span className="rounded-full bg-ink/60 px-1.5 text-[10px] font-bold text-white">
                {it.name}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* بارەی کاردانەوە */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => send(e)}
            className="btn-press grid h-10 w-10 place-items-center rounded-xl bg-ink/5 text-xl hover:bg-ink/10"
          >
            {e}
          </button>
        ))}
      </div>
    </>
  )
}

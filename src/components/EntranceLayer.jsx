// ═══════════════════════════════════════════════════════════
//  EntranceLayer — کاریگەری هاتنە ژوورەوە
//  کاتێک یاریزان دێتە ژوورەوە و کاریگەری «entrance»ی بەرکردووە،
//  بانەرێکی ئەنیمەیشندار بۆ هەموو یاریزانان دەردەکەوێت (broadcast).
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import { useRoom } from '../state/RoomContext'
import { useAuth } from '../state/AuthContext'
import { useEconomy } from '../state/EconomyContext'
import { joinEntranceChannel } from '../lib/supabase'
import { getEntrance } from '../lib/cosmetics'
import { sfx } from '../lib/sound'

export default function EntranceLayer() {
  const { roomId } = useRoom()
  const { profile } = useAuth()
  const { equipped } = useEconomy() || {}
  const [banners, setBanners] = useState([])
  const chanRef = useRef(null)
  const announcedRef = useRef(null)

  useEffect(() => {
    if (!roomId) return
    const chan = joinEntranceChannel(roomId, (p) => {
      const ent = getEntrance(p.entranceId)
      if (!ent) return
      const banner = { ...p, ent }
      setBanners((prev) => [...prev, banner])
      sfx.tap?.()
      setTimeout(() => setBanners((prev) => prev.filter((b) => b.id !== p.id)), 3200)
    })
    chanRef.current = chan

    // ڕاگەیاندنی هاتنی خۆم — یەک جار بۆ هەر ژوور (ئەگەر کاریگەری بەرکردبێت)
    if (equipped?.entrance && announcedRef.current !== roomId) {
      announcedRef.current = roomId
      // کەمێک دواخستن تاکو ئەندامبوونی کەناڵ تەواو بێت
      setTimeout(() => chan.announce(equipped.entrance, profile?.display_name), 700)
    }

    return () => chan.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  if (!banners.length) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[85] flex flex-col items-center gap-2 px-3">
      {banners.map((b) => (
        <div
          key={b.id}
          className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r ${b.ent.ring} px-4 py-2.5 text-white shadow-xl animate-fade-in`}
        >
          <span className="text-2xl drop-shadow">{b.ent.emoji}</span>
          <span className="text-sm font-black">
            {b.name || 'یاریزان'} <span className="font-bold opacity-90">{b.ent.text}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

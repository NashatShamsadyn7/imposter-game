// ═══════════════════════════════════════════════════════════
//  دۆخی دەنگ — LiveKit (٢ تا ٩٩+ یاریزان)
//  پەیوەندیی دەنگیی ڕاستەوخۆ لەناو ژوور بە SFU، نەک mesh.
//  دەنگ تەنها بۆ ئەو کەسانە دەگوازرێتەوە کە قسە دەکەن (active speaker).
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
} from 'livekit-client'
import { supabase } from '../lib/supabase'

const VoiceContext = createContext(null)
export const useVoice = () => useContext(VoiceContext)

export function VoiceProvider({ roomId, identity, name, children }) {
  const roomRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | connecting | connected | error
  const [micOn, setMicOn] = useState(false)
  const [speakers, setSpeakers] = useState(() => new Set()) // identityـەکانی ئەوانەی قسە دەکەن
  const [participants, setParticipants] = useState(() => new Set()) // identityـی هەموو ئەوانەی لە دەنگدان
  const [error, setError] = useState(null)
  const [available, setAvailable] = useState(true) // ئایا LiveKit ڕێکخراوە؟

  // دەنگی هاتوو پەخش بکە
  const attachAudio = useCallback((track, participant) => {
    if (track.kind !== Track.Kind.Audio) return
    const el = track.attach()
    el.setAttribute('data-lk', participant?.identity || 'audio')
    el.autoplay = true
    el.style.display = 'none'
    document.body.appendChild(el)
  }, [])

  const refreshParticipants = useCallback((room) => {
    const set = new Set()
    room.remoteParticipants.forEach((p) => set.add(p.identity))
    if (room.localParticipant) set.add(room.localParticipant.identity)
    setParticipants(set)
  }, [])

  // ───── پەیوەستبوون ─────
  useEffect(() => {
    if (!roomId || !identity || !supabase) {
      setAvailable(false)
      return
    }
    let cancelled = false
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      // تەنها دەنگی کەسانی چالاک وەربگرە بۆ ژووری گەورە
      audioCaptureDefaults: { autoGainControl: true, echoCancellation: true, noiseSuppression: true },
    })
    roomRef.current = room

    room
      .on(RoomEvent.TrackSubscribed, (track, _pub, participant) => attachAudio(track, participant))
      .on(RoomEvent.TrackUnsubscribed, (track) => track.detach().forEach((el) => el.remove()))
      .on(RoomEvent.ActiveSpeakersChanged, (sps) => {
        setSpeakers(new Set(sps.map((s) => s.identity)))
      })
      .on(RoomEvent.ParticipantConnected, () => refreshParticipants(room))
      .on(RoomEvent.ParticipantDisconnected, () => refreshParticipants(room))
      .on(RoomEvent.LocalTrackPublished, () => setMicOn(room.localParticipant.isMicrophoneEnabled))
      .on(RoomEvent.LocalTrackUnpublished, () => setMicOn(room.localParticipant.isMicrophoneEnabled))
      .on(RoomEvent.ConnectionStateChanged, (s) => {
        if (s === ConnectionState.Connected) setStatus('connected')
        else if (s === ConnectionState.Reconnecting) setStatus('connecting')
      })
      .on(RoomEvent.Disconnected, () => {
        if (!cancelled) setStatus('idle')
      })

    const connect = async () => {
      setStatus('connecting')
      setError(null)
      try {
        const { data, error: fnErr } = await supabase.functions.invoke('livekit-token', {
          body: { room: roomId, identity, name },
        })
        if (fnErr) throw fnErr
        if (data?.error) throw new Error(data.error)
        if (!data?.token || !data?.url) {
          // LiveKit ڕێکنەخراوە — دەنگ نادیار بکە بەبێ هەڵە
          setAvailable(false)
          setStatus('idle')
          return
        }
        if (cancelled) return
        await room.connect(data.url, data.token)
        if (cancelled) {
          room.disconnect()
          return
        }
        refreshParticipants(room)
        setStatus('connected')
      } catch (e) {
        if (cancelled) return
        // ئەگەر فەنکشن نەدۆزرایەوە، دەنگ نادیار بکە
        const msg = e?.message || String(e)
        if (/not.?found|404|configured/i.test(msg)) {
          setAvailable(false)
          setStatus('idle')
        } else {
          setError(msg)
          setStatus('error')
        }
      }
    }
    connect()

    return () => {
      cancelled = true
      try {
        room.disconnect()
      } catch { /* noop */ }
      document.querySelectorAll('audio[data-lk]').forEach((el) => el.remove())
      roomRef.current = null
    }
  }, [roomId, identity, name, attachAudio, refreshParticipants])

  // ───── کتم/کردنەوەی مایک ─────
  const toggleMic = useCallback(async () => {
    const room = roomRef.current
    if (!room || status !== 'connected') return
    try {
      const next = !room.localParticipant.isMicrophoneEnabled
      await room.localParticipant.setMicrophoneEnabled(next)
      setMicOn(next)
    } catch (e) {
      setError(e?.message || 'مایک کاری نەکرد')
    }
  }, [status])

  const value = {
    status,
    micOn,
    toggleMic,
    speakers,
    participants,
    error,
    available,
    selfIdentity: identity,
    isSpeaking: useCallback((id) => speakers.has(id), [speakers]),
  }

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
}

// ═══════════════════════════════════════════════════════════
//  بەڕێوەبردنی دەنگ — کرتە (SFX) + مۆسیقای پاشبنە (ئەمبیێنتی فەزایی)
//  بەبێ فایلی دەرەکی، هەمووی بە Web Audio API دروست دەکرێت.
// ═══════════════════════════════════════════════════════════

let ctx = null
let musicNodes = null
let sfxEnabled = true
let musicEnabled = true
let musicGain = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function setSfxEnabled(v) {
  sfxEnabled = v
}
export function setMusicEnabled(v) {
  musicEnabled = v
  if (v) startMusic()
  else stopMusic()
}

// ───── کرتەکان ─────
function blip(freq, duration = 0.12, type = 'sine', vol = 0.18) {
  if (!sfxEnabled) return
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, c.currentTime)
  gain.gain.linearRampToValueAtTime(vol, c.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration)
  osc.connect(gain).connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + duration)
}

export const sfx = {
  click: () => blip(520, 0.08, 'triangle', 0.14),
  tap: () => blip(380, 0.06, 'sine', 0.1),
  reveal: () => {
    blip(440, 0.12, 'sine')
    setTimeout(() => blip(660, 0.16, 'sine'), 90)
  },
  impostor: () => {
    blip(180, 0.3, 'sawtooth', 0.16)
    setTimeout(() => blip(120, 0.4, 'sawtooth', 0.16), 120)
  },
  vote: () => blip(600, 0.1, 'square', 0.12),
  eliminate: () => {
    blip(300, 0.2, 'sawtooth', 0.14)
    setTimeout(() => blip(200, 0.3, 'sawtooth', 0.14), 150)
  },
  win: () => {
    ;[523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => blip(f, 0.25, 'triangle', 0.16), i * 130)
    )
  },
  lose: () => {
    ;[392, 330, 262].forEach((f, i) =>
      setTimeout(() => blip(f, 0.3, 'sawtooth', 0.16), i * 160)
    )
  },
  tick: () => blip(880, 0.04, 'sine', 0.08),
}

// ═══════════════════════════════════════════════════════════
//  مۆسیقای پاشبنە — فایلی mp3 (لووپ) + یەدەگی ئەمبیێنتی ئەگەر فایل نەبوو
//  فایلەکان لە public/music/ دادەنرێن. بەکارهێنەر دەتوانێت ئاوازەکە بگۆڕێت.
// ═══════════════════════════════════════════════════════════

// لیستی ئاوازەکان — فایلەکان لە public/music/ دابنێ بەم ناوانە
export const MUSIC_TRACKS = [
  { id: 'calm', name: 'هادئ', src: '/music/calm.mp3' },
  { id: 'mystery', name: 'غموض', src: '/music/mystery.mp3' },
  { id: 'oud', name: 'عربي', src: '/music/oud.mp3' },
]

const TRACK_KEY = 'imposter:musictrack'
let musicEl = null // <audio> element
let usingFallback = false // ئایا یەدەگی ئەمبیێنتی کارا کراوە؟

export function getMusicTrackId() {
  if (typeof localStorage === 'undefined') return MUSIC_TRACKS[0].id
  return localStorage.getItem(TRACK_KEY) || MUSIC_TRACKS[0].id
}

function currentTrack() {
  return MUSIC_TRACKS.find((t) => t.id === getMusicTrackId()) || MUSIC_TRACKS[0]
}

// دروستکردن/گەڕاندنەوەی ئێلێمێنتی ئۆدیۆ
function ensureEl() {
  if (typeof Audio === 'undefined') return null
  if (!musicEl) {
    musicEl = new Audio()
    musicEl.loop = true
    musicEl.volume = 0.35
    musicEl.preload = 'auto'
    // ئەگەر فایلەکە نەدۆزرایەوە/بار نەبوو → یەدەگی ئەمبیێنتی
    musicEl.addEventListener('error', () => {
      if (musicEnabled) startAmbient()
    })
  }
  return musicEl
}

// ───── دەستپێکردنی مۆسیقا ─────
export function startMusic() {
  if (!musicEnabled) return
  const el = ensureEl()
  if (!el) {
    startAmbient()
    return
  }
  const track = currentTrack()
  // ئەگەر سۆرس نوێیە، دایبنێ
  if (!el.src || !el.src.endsWith(track.src)) el.src = track.src
  stopAmbient() // ئەگەر یەدەگ کارا بوو، بیکوژێنەوە
  el.play().catch(() => {
    // ڕێگەپێنەدراو (autoplay) یان هەڵە → یەدەگی ئەمبیێنتی
    startAmbient()
  })
}

export function stopMusic() {
  if (musicEl) {
    musicEl.pause()
  }
  stopAmbient()
}

// گۆڕینی ئاواز
export function setMusicTrack(id) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(TRACK_KEY, id)
  const el = ensureEl()
  if (!el) return
  const track = MUSIC_TRACKS.find((t) => t.id === id) || MUSIC_TRACKS[0]
  el.src = track.src
  if (musicEnabled) {
    stopAmbient()
    el.play().catch(() => startAmbient())
  }
}

// ───── یەدەگ: دڕۆنی ئەمبیێنتی فەزایی (ئەگەر فایلی mp3 نەبوو) ─────
function startAmbient() {
  if (!musicEnabled || usingFallback) return
  const c = getCtx()
  if (!c || musicNodes) return
  usingFallback = true

  musicGain = c.createGain()
  musicGain.gain.value = 0.05
  musicGain.connect(c.destination)

  const freqs = [55, 82.4, 110, 164.8]
  const oscs = freqs.map((f, i) => {
    const osc = c.createOscillator()
    osc.type = i % 2 === 0 ? 'sine' : 'triangle'
    osc.frequency.value = f

    const lfo = c.createOscillator()
    const lfoGain = c.createGain()
    lfo.frequency.value = 0.05 + i * 0.03
    lfoGain.gain.value = 1.5
    lfo.connect(lfoGain).connect(osc.frequency)

    const g = c.createGain()
    g.gain.value = 0.25
    osc.connect(g).connect(musicGain)
    osc.start()
    lfo.start()
    return { osc, lfo }
  })
  musicNodes = oscs
}

function stopAmbient() {
  usingFallback = false
  if (!musicNodes) return
  const c = getCtx()
  musicNodes.forEach(({ osc, lfo }) => {
    try {
      osc.stop()
      lfo.stop()
    } catch (e) {
      /* ئاسایی */
    }
  })
  musicNodes = null
  if (musicGain && c) musicGain.disconnect()
}

// ───── دەنگی دەستپێکردنی یاری — یەک جار کاتێک یاری دەستپێدەکات ─────
//  فایل لە public/game-start/start.mp3 ـەوە. ئەگەر نەبوو → یەدەگی synth.
//  بۆ هەموو جۆرە یاریەکان (نەک تەنها ساختەکار).
let startEl = null
export function playGameStart() {
  if (!sfxEnabled) return
  if (typeof Audio === 'undefined') {
    sfx.reveal()
    return
  }
  if (!startEl) {
    startEl = new Audio('/game-start/start.mp3')
    startEl.volume = 0.6
  }
  try {
    startEl.currentTime = 0
    const p = startEl.play()
    if (p) p.catch(() => sfx.reveal()) // فایل نەبوو/ڕێگەپێنەدراو → یەدەگ
  } catch {
    sfx.reveal()
  }
}

// چالاککردنی ئۆدیۆ لەدوای یەکەم کرتەی بەکارهێنەر
export function unlockAudio() {
  getCtx()
}

// ───── بەردەوامی: کاتێک بەکارهێنەر دەگەڕێتەوە بۆ موقع، مۆسیقا بەردەوام بکە ─────
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && musicEnabled) {
      if (ctx && ctx.state === 'suspended') ctx.resume()
      if (musicEl && musicEl.paused && !usingFallback) {
        musicEl.play().catch(() => {})
      }
    }
  })
}

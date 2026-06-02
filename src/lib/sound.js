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
  // دەنگی کردنەوەی سندووقی خەڵات — بەرزبوونەوەی نەرم
  chest: () => {
    ;[392, 523, 659].forEach((f, i) =>
      setTimeout(() => blip(f, 0.14, 'triangle', 0.14), i * 80)
    )
  },
  // دەنگی جاکپۆت — زنجیرەی گەشاوەی درێژ بۆ لحظەی شۆک
  jackpot: () => {
    ;[523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
      setTimeout(() => blip(f, 0.22, 'triangle', 0.18), i * 90)
    )
  },
}

// ═══════════════════════════════════════════════════════════
//  مۆسیقای پاشبنە — فایلی mp3 (لووپ) + یەدەگی ئەمبیێنتی ئەگەر فایل نەبوو
//  فایلەکان لە public/music/ دادەنرێن. بەکارهێنەر دەتوانێت ئاوازەکە بگۆڕێت.
// ═══════════════════════════════════════════════════════════

// لیستی ئاوازەکان — فایلەکان لە public/music/ ـدان
export const MUSIC_TRACKS = [
  { id: 'wildflower', name: 'Wildflower', src: '/music/billie-wildflower.mp3' },
  { id: 'iwannabeyours', name: 'I Wanna Be Yours', src: '/music/arctic-i-wanna-be-yours.mp3' },
  { id: 'noonenoticed', name: 'No One Noticed', src: '/music/themarias-no-one-noticed.mp3' },
  { id: 'bonibaran', name: 'بۆنی باران', src: '/music/hardi-boni-baran.mp3' },
  { id: 'durit', name: 'دووریت', src: '/music/haydeh-durit.mp3' },
  { id: 'shoofwajhak', name: 'شوف وجهك', src: '/music/saif-shoof-wajhak.mp3' },
  { id: 'warqa', name: 'ورقة', src: '/music/saif-warqa.mp3' },
]

let musicEl = null // <audio> element
let usingFallback = false // ئایا یەدەگی ئەمبیێنتی کارا کراوە؟
let durations = null // چرکەی هەر ئاوازێک (هاوڕیز لەگەڵ MUSIC_TRACKS)
let metaPromise = null
let driftTimer = null

// بارکردنی درێژایی هەموو ئاوازەکان (یەک جار) — پێویستە بۆ هەژمارکردنی «ڕادیۆ»
function loadDurations() {
  if (metaPromise) return metaPromise
  metaPromise = Promise.all(
    MUSIC_TRACKS.map(
      (tk) =>
        new Promise((resolve) => {
          if (typeof Audio === 'undefined') return resolve(180)
          const a = new Audio()
          a.preload = 'metadata'
          a.src = tk.src
          a.addEventListener('loadedmetadata', () =>
            resolve(isFinite(a.duration) && a.duration > 0 ? a.duration : 180)
          )
          a.addEventListener('error', () => resolve(180)) // فایل نەبوو → بنەڕەت
        })
    )
  ).then((d) => {
    durations = d
    return d
  })
  return metaPromise
}

// «ڕادیۆ»: لە کاتی جیهانیەوە (Date.now) دیاری دەکات کام ئاواز و کام چرکە بدرێت.
// هەموو ئامێرەکان هەمان ژمێریاری دەکەن → هاوکات دەبن (هەر ئامێرێک خۆی هاوڕیز دەکات).
function radioPosition() {
  if (!durations || !durations.length) return { index: 0, offset: 0 }
  const total = durations.reduce((s, d) => s + d, 0)
  if (total <= 0) return { index: 0, offset: 0 }
  let t = (Date.now() / 1000) % total
  for (let i = 0; i < durations.length; i++) {
    if (t < durations[i]) return { index: i, offset: t }
    t -= durations[i]
  }
  return { index: 0, offset: 0 }
}

// دروستکردن/گەڕاندنەوەی ئێلێمێنتی ئۆدیۆ
function ensureEl() {
  if (typeof Audio === 'undefined') return null
  if (!musicEl) {
    musicEl = new Audio()
    musicEl.loop = false
    musicEl.volume = 0.2
    musicEl.preload = 'auto'
    // دوای کۆتایی ئاوازێک → هاوکاتکردنەوە (خۆکار دەچێتە ئاوازی دواتری ڕادیۆ)
    musicEl.addEventListener('ended', () => {
      if (musicEnabled) syncPlay()
    })
    musicEl.addEventListener('error', () => {
      if (musicEnabled) startAmbient()
    })
  }
  return musicEl
}

// لێدانی هاوکات بەپێی کاتی ڕادیۆ (هەمان ئاواز و هەمان چرکە لەسەر هەموو ئامێرەکان)
function syncPlay() {
  const el = ensureEl()
  if (!el || !durations) return
  const { index, offset } = radioPosition()
  const track = MUSIC_TRACKS[index]
  stopAmbient()
  const seekAndPlay = () => {
    try {
      el.currentTime = offset
    } catch { /* noop */ }
    el.play().catch(() => startAmbient())
  }
  if (el.src && el.src.endsWith(track.src)) {
    if (el.readyState >= 1) seekAndPlay()
    else el.addEventListener('loadedmetadata', seekAndPlay, { once: true })
  } else {
    el.src = track.src
    el.addEventListener('loadedmetadata', seekAndPlay, { once: true })
  }
}

// چاککردنەوەی لادان (drift) — هەر ٢٠ چرکە دڵنیادەبینەوە لە هاوکاتبوون
function startDriftTimer() {
  if (driftTimer) return
  driftTimer = setInterval(() => {
    if (!musicEnabled || !musicEl || musicEl.paused || !durations) return
    const { index, offset } = radioPosition()
    const track = MUSIC_TRACKS[index]
    if (!musicEl.src.endsWith(track.src)) {
      syncPlay()
      return
    }
    if (Math.abs(musicEl.currentTime - offset) > 2.5) {
      try {
        musicEl.currentTime = offset
      } catch { /* noop */ }
    }
  }, 20000)
}

// ───── دەستپێکردنی مۆسیقا ─────
export function startMusic() {
  if (!musicEnabled) return
  const el = ensureEl()
  if (!el) {
    startAmbient()
    return
  }
  loadDurations().then(() => {
    if (!musicEnabled) return
    syncPlay()
    startDriftTimer()
  })
}

export function stopMusic() {
  if (musicEl) musicEl.pause()
  if (driftTimer) {
    clearInterval(driftTimer)
    driftTimer = null
  }
  stopAmbient()
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

// ───── بەردەوامی + هاوکاتکردنەوە: کاتێک بەکارهێنەر دەگەڕێتەوە، خۆی هاوڕیز دەکات ─────
//  ئەوانەی ماونەتەوە نەوەستاون؛ ئەمەی گەڕاوەتەوە دەچێتە هەمان خاڵی ڕادیۆ.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && musicEnabled) {
      if (ctx && ctx.state === 'suspended') ctx.resume()
      if (durations) syncPlay()
    }
  })
}

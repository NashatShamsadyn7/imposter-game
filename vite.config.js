/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// ═══════════════════════════════════════════════════════════
//  دوو دەرچوون لە یەک سەرچاوە:
//
//   npm run build          → dist/          (وێبسایت — هەروەک خۆی)
//   npm run build:offline  → dist-offline/  (ئەپی ئەندرۆید)
//
//  کۆدی یاری (screens/local/*) لە هەردووکیاندا هەمانە.
// ═══════════════════════════════════════════════════════════

// کۆمپۆنێنتەکانی پێویستیان بە Supabase/ئابووری هەیە — لە بەستەی
// ئۆفلایندا بە جێگرەوەیەکی بەتاڵ دەگۆڕدرێن. بەمە هیچ گۆڕانکارییەک
// لە کۆدی هاوبەشدا ناکەین و بەستەی وێب دەستنەخراو دەمێنێتەوە.
const OFFLINE_STUBS = ['SuggestSection', 'MysteryReward']

// ⚠️ Vite/Rollup ناسنامەی مۆدیوول بە «/» نۆرماڵ دەکات. ئەگەر لێرەدا
//    ڕێڕەوێکی ویندۆزی بە «\» بگەڕێنینەوە، ئەوا «C:\…\x.jsx» و
//    «C:/…/x.jsx» دوو ناسنامەی جیاواز دەبن → یەک پەڕگە دوو جار
//    سوار دەبێت → دوو createContext → Provider لە یەکێکیان
//    دەنووسێت و useContext لەوی تر دەخوێنێتەوە → null.
const modId = (rel) => path.resolve(process.cwd(), rel).replace(/\\/g, '/')

function offlineStubs() {
  const stub = modId('src/offline/stubs/Empty.jsx')
  return {
    name: 'offline-stubs',
    enforce: 'pre',
    resolveId(source) {
      const base = source.split('/').pop().replace(/\.jsx?$/, '')
      return OFFLINE_STUBS.includes(base) ? stub : null
    },
  }
}

// WordsContext ـی وێب Supabase بانگ دەکات. لە ئۆفلایندا بە نەخشەیەکی
// هاوشێوە دەگۆڕدرێت کە بانکەکە لە پەڕگەی هاوپێچکراوەوە دەخوێنێتەوە.
function offlineWords() {
  const replacement = modId('src/offline/OfflineWordsContext.jsx')
  return {
    name: 'offline-words',
    enforce: 'pre',
    resolveId(source, importer) {
      const base = source.split('/').pop().replace(/\.jsx?$/, '')
      // خۆی ناگۆڕێت بۆ خۆی — ئەگەرنا سووڕێکی بێکۆتایی دروست دەبێت
      if (base !== 'WordsContext' || importer === replacement) return null
      return replacement
    },
  }
}

// تەنها ئەو ئەسڵانە هاوپێچ دەکەین کە ئەپەکە پێویستی پێیانە.
// مۆسیقا (٢٨٫٨MB)، Service Worker و manifest ناچنە ناو APK.
const OFFLINE_ASSETS = [
  'w', // ٢٬٢٤٨ وێنەی وشە + lqip.json
  'fonts', // فۆنتی ناوخۆیی
  'game-start/start.mp3', // دەنگی دەستپێکردنی یاری
  'word-bank-kurdish-2250.json', // بانکی وشە
  'favicon.svg',
]

function* walk(p) {
  const st = fs.statSync(p)
  if (st.isFile()) return yield p
  for (const e of fs.readdirSync(p)) yield* walk(path.join(p, e))
}

function offlineAssets(outDir) {
  return {
    name: 'offline-assets',
    closeBundle() {
      const out = path.resolve(process.cwd(), outDir)

      // Vite بە ناوی «index.offline.html» دەریدەکات — Capacitor
      // «index.html» دەخوازێت.
      const src = path.join(out, 'index.offline.html')
      if (fs.existsSync(src)) fs.renameSync(src, path.join(out, 'index.html'))

      let files = 0
      let bytes = 0
      for (const rel of OFFLINE_ASSETS) {
        const from = path.resolve(process.cwd(), 'public', rel)
        if (!fs.existsSync(from)) {
          this.warn(`ئەسڵی ونبوو: public/${rel}`)
          continue
        }
        const to = path.join(out, rel)
        fs.mkdirSync(path.dirname(to), { recursive: true })
        fs.cpSync(from, to, { recursive: true })
        for (const f of walk(to)) {
          files++
          bytes += fs.statSync(f).size
        }
      }
      console.log(
        `\n  ئەسڵە هاوپێچکراوەکان: ${files} پەڕگە · ${(bytes / 1048576).toFixed(1)} MB\n`
      )
    },
  }
}

export default defineConfig(({ mode }) => {
  const offline = mode === 'offline'
  const outDir = 'dist-offline'

  return {
    plugins: offline
      ? [react(), offlineStubs(), offlineWords(), offlineAssets(outDir)]
      : [react()],

    // لە ئۆفلایندا خۆمان ئەسڵەکان بە هەڵبژاردن کۆپی دەکەین، نەک
    // هەموو public/ — چونکە مۆسیقا بە تەنها ٢٨٫٨MB ـە.
    publicDir: offline ? false : 'public',

    // تاقیکردنەوە (Vitest) — لۆجیکی پاک: scoring/rank/stats
    test: {
      environment: 'node',
      include: ['src/**/*.{test,spec}.{js,jsx}'],
      coverage: {
        provider: 'v8',
        include: ['src/lib/scoring.js', 'src/lib/rank.js', 'src/lib/stats.js'],
      },
    },
    server: {
      port: 5173,
      host: true,
    },
    build: offline
      ? {
          outDir,
          emptyOutDir: true,
          rollupOptions: {
            input: path.resolve(process.cwd(), 'index.offline.html'),
            output: {
              manualChunks(id) {
                if (!id.includes('node_modules')) return
                if (id.includes('react-dom') || id.includes('/scheduler/')) return 'react-vendor'
              },
            },
          },
        }
      : {
          // دابەشکردنی بەستەکان (vendor chunks) بۆ کاشکردنی باشتر و بارکردنی خێراتر
          rollupOptions: {
            output: {
              manualChunks(id) {
                if (!id.includes('node_modules')) return
                if (id.includes('livekit-client')) return 'livekit'
                if (id.includes('@supabase')) return 'supabase'
                if (id.includes('react-dom') || id.includes('/scheduler/')) return 'react-vendor'
              },
            },
          },
        },
  }
})

/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
  build: {
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
})

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ڕەنگەکان لە گۆڕاوەکانی CSSـەوە دێن (بۆ گۆڕینی ڕووناک/تاریک)
        space: 'rgb(var(--c-space) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        surface2: 'rgb(var(--c-surface2) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        crew: 'rgb(var(--c-crew) / <alpha-value>)',
        impostor: 'rgb(var(--c-impostor) / <alpha-value>)',
      },
      fontFamily: {
        sorani: ['NRT', 'Vazirmatn', 'Tahoma', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 6px 24px var(--shadow)',
        card: '0 2px 12px var(--shadow)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--c-crew) / 0.35)' },
          '50%': { boxShadow: '0 0 0 8px rgb(var(--c-crew) / 0)' },
        },
        'pulse-glow-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--c-impostor) / 0.38)' },
          '50%': { boxShadow: '0 0 0 8px rgb(var(--c-impostor) / 0)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-18px)' },
        },
        'float-up': {
          '0%': { opacity: '0', transform: 'translateY(0) scale(0.6)' },
          '15%': { opacity: '1', transform: 'translateY(-10px) scale(1.1)' },
          '100%': { opacity: '0', transform: 'translateY(-180px) scale(1)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'pulse-glow-red': 'pulse-glow-red 2.4s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        float: 'float 9s ease-in-out infinite',
        'float-up': 'float-up 2.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}

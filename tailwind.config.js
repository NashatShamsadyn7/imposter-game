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
        // ───── لەرینەوەی شاشە (دراما) ─────
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-6px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(6px)' },
        },
        // ───── لەرینەوەی سندووق پێش کردنەوە ─────
        'chest-shake': {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '20%': { transform: 'rotate(-6deg) scale(1.04)' },
          '40%': { transform: 'rotate(6deg) scale(1.04)' },
          '60%': { transform: 'rotate(-4deg) scale(1.06)' },
          '80%': { transform: 'rotate(4deg) scale(1.06)' },
        },
        // ───── دەرکەوتنی خەڵات (پۆپ) ─────
        'reward-pop': {
          '0%': { opacity: '0', transform: 'scale(0.3) translateY(20px)' },
          '60%': { opacity: '1', transform: 'scale(1.15) translateY(-6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        // ───── بارینی کۆنفێتی ─────
        'confetti-fall': {
          '0%': { opacity: '1', transform: 'translateY(-10vh) rotate(0deg)' },
          '100%': { opacity: '0', transform: 'translateY(110vh) rotate(720deg)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'pulse-glow-red': 'pulse-glow-red 2.4s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        float: 'float 9s ease-in-out infinite',
        'float-up': 'float-up 2.5s ease-out forwards',
        shake: 'shake 0.6s ease-in-out',
        'chest-shake': 'chest-shake 0.9s ease-in-out infinite',
        'reward-pop': 'reward-pop 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
      },
    },
  },
  plugins: [],
}

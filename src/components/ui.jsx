import { sfx, unlockAudio } from '../lib/sound'

// دوگمەی سەرەکی
export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
  ...rest
}) {
  const base =
    'btn-press inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-bold text-base select-none disabled:opacity-40 disabled:cursor-not-allowed'
  const variants = {
    primary:
      'bg-crew text-white hover:brightness-110 shadow-[0_6px_28px_-6px_rgb(var(--c-crew)/0.7)] ring-1 ring-crew/40',
    danger:
      'bg-impostor text-white hover:brightness-110 shadow-[0_6px_28px_-6px_rgb(var(--c-impostor)/0.7)] ring-1 ring-impostor/40',
    ghost: 'bg-surface/70 backdrop-blur text-ink border border-line hover:bg-surface2 shadow-card',
    outline: 'bg-transparent text-crew border border-crew/50 hover:bg-crew/10 hover:shadow-[0_0_18px_-4px_rgb(var(--c-crew)/0.6)]',
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={(e) => {
        unlockAudio()
        sfx.click()
        onClick?.(e)
      }}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

// کارتی ڕووناک
export function Panel({ children, className = '' }) {
  return <div className={`panel p-5 ${className}`}>{children}</div>
}

// ناونیشانی قۆناغ
export function PhaseTitle({ icon: Icon, title, subtitle, accent = 'crew' }) {
  const color = accent === 'impostor' ? 'text-impostor' : 'text-crew'
  return (
    <div className="text-center mb-6 animate-fade-in">
      {Icon && (
        <div className="flex justify-center mb-3">
          <Icon className={`w-10 h-10 ${color}`} />
        </div>
      )}
      <h1 className="text-2xl sm:text-3xl font-black text-ink">{title}</h1>
      {subtitle && <p className="text-muted mt-2 text-sm">{subtitle}</p>}
    </div>
  )
}

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
      'bg-crew text-white hover:brightness-105 shadow-[0_8px_22px_-8px_rgba(14,156,142,0.65)]',
    danger:
      'bg-impostor text-white hover:brightness-105 shadow-[0_8px_22px_-8px_rgba(225,91,87,0.65)]',
    ghost: 'bg-surface text-ink border border-line hover:bg-surface2 shadow-card',
    outline: 'bg-transparent text-crew border border-crew/50 hover:bg-crew/10',
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

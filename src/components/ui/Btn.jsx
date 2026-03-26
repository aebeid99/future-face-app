import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

const BASE = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:opacity-50 disabled:pointer-events-none select-none'

const VARIANTS = {
  primary:   'bg-gold hover:bg-gold-400 text-dark-400 shadow-sm',
  secondary: 'bg-surface-hover hover:bg-surface-active border border-border text-ink',
  ghost:     'hover:bg-surface-hover text-ink-muted hover:text-ink',
  danger:    'bg-error/10 hover:bg-error/20 border border-error/30 text-error',
  outline:   'border border-gold/40 hover:border-gold/70 hover:bg-gold/5 text-gold',
  link:      'text-gold hover:text-gold-400 underline-offset-4 hover:underline p-0 h-auto',
}

const SIZES = {
  xs:  'h-7  px-3   text-xs',
  sm:  'h-8  px-3.5 text-sm',
  md:  'h-9  px-4   text-sm',
  lg:  'h-10 px-5   text-base',
  xl:  'h-12 px-6   text-base',
  icon:'h-9  w-9    p-0',
}

const Btn = forwardRef(function Btn({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  icon,
  iconRight,
  className = '',
  children,
  ...props
}, ref) {
  const classes = [BASE, VARIANTS[variant] || VARIANTS.primary, SIZES[size] || SIZES.md, className].join(' ')

  return (
    <button ref={ref} className={classes} disabled={loading || props.disabled} {...props}>
      {loading
        ? <Loader2 size={14} className="animate-spin" />
        : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
})

export default Btn

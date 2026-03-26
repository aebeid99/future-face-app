// Badge — compact status / label chip

const VARIANTS = {
  default:   'bg-ink-faint/20 text-ink-muted',
  gold:      'bg-gold/15 text-gold border border-gold/25',
  success:   'bg-success/10 text-success border border-success/20',
  warning:   'bg-warning/10 text-warning border border-warning/20',
  error:     'bg-error/10 text-error border border-error/20',
  info:      'bg-info/10 text-info border border-info/20',
  on_track:  'bg-success/10 text-success border border-success/20',
  at_risk:   'bg-warning/10 text-warning border border-warning/20',
  off_track: 'bg-error/10 text-error border border-error/20',
  completed: 'bg-info/10 text-info border border-info/20',
  paused:    'bg-ink-faint/20 text-ink-muted border border-ink-faint/20',
  free:      'bg-ink-faint/20 text-ink-muted',
  pro:       'bg-gold/15 text-gold border border-gold/25',
  enterprise:'bg-info/10 text-info border border-info/20',
}

const SIZES = {
  xs:  'text-[10px] px-1.5 py-0.5 rounded',
  sm:  'text-xs px-2 py-0.5 rounded',
  md:  'text-xs px-2.5 py-1 rounded-md',
}

export default function Badge({ variant = 'default', size = 'md', dot = false, className = '', children }) {
  const cls = [
    'inline-flex items-center gap-1.5 font-medium',
    VARIANTS[variant] || VARIANTS.default,
    SIZES[size] || SIZES.md,
    className,
  ].join(' ')

  const dotColor = {
    success: '#10B981', warning: '#F59E0B', error: '#EF4444', info: '#3B82F6',
    on_track: '#10B981', at_risk: '#F59E0B', off_track: '#EF4444', completed: '#3B82F6',
    gold: '#D4920E',
  }[variant]

  return (
    <span className={cls}>
      {dot && dotColor && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: dotColor }}
        />
      )}
      {children}
    </span>
  )
}

// Card — generic surface container

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'p-5',
  onClick,
}) {
  const cls = [
    'bg-surface border border-border rounded-xl',
    padding,
    hover ? 'card-hover cursor-pointer' : '',
    className,
  ].join(' ')

  return (
    <div className={cls} onClick={onClick}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  )
}

export function StatCard({ label, value, delta, icon: Icon, color = '#D4920E', className = '' }) {
  const isPositive = delta >= 0

  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink-muted mb-1">{label}</p>
          <p className="text-2xl font-bold text-ink">{value}</p>
          {delta !== undefined && (
            <p className={`text-xs mt-1 ${isPositive ? 'text-success' : 'text-error'}`}>
              {isPositive ? '+' : ''}{delta}% vs last period
            </p>
          )}
        </div>
        {Icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: color + '18' }}
          >
            <Icon size={18} style={{ color }} />
          </div>
        )}
      </div>
    </Card>
  )
}

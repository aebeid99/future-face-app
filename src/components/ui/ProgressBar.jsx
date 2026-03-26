import { progressColor } from '../../utils/formatting.js'

export default function ProgressBar({
  value = 0,         // 0–100
  color,             // override auto color
  size = 'md',
  showLabel = false,
  label,
  animated = false,
  className = '',
}) {
  const pct   = Math.min(100, Math.max(0, value))
  const fill  = color || progressColor(pct)

  const HEIGHTS = { xs: 'h-1', sm: 'h-1.5', md: 'h-2', lg: 'h-3', xl: 'h-4' }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-ink-muted">{label}</span>}
          {showLabel && <span className="text-xs font-medium text-ink">{pct}%</span>}
        </div>
      )}
      <div className={`w-full bg-border rounded-full overflow-hidden ${HEIGHTS[size] || HEIGHTS.md}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${animated ? 'animate-pulse-gold' : ''}`}
          style={{ width: `${pct}%`, backgroundColor: fill }}
        />
      </div>
    </div>
  )
}

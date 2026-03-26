import { progressColor } from '../../utils/formatting.js'

export default function ProgressRing({
  value    = 0,      // 0–100
  size     = 60,
  stroke   = 5,
  color,
  label,
  sublabel,
  showPercent = true,
  className = '',
}) {
  const pct    = Math.min(100, Math.max(0, value))
  const fill   = color || progressColor(pct)
  const r      = (size - stroke) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(30,37,64,0.8)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={fill}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="progress-ring__circle"
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercent && !label && (
          <span className="text-xs font-bold text-ink leading-none">{pct}%</span>
        )}
        {label && <span className="text-xs font-bold text-ink leading-none">{label}</span>}
        {sublabel && <span className="text-[9px] text-ink-faint leading-none mt-0.5">{sublabel}</span>}
      </div>
    </div>
  )
}

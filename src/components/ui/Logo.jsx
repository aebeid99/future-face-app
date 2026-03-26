export default function Logo({ size = 32, showText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Mark */}
      <div
        className="flex items-center justify-center rounded-lg font-black text-dark-400 flex-shrink-0"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #D4920E 0%, #F5A623 100%)',
          fontSize: Math.round(size * 0.6),
          letterSpacing: '-0.02em',
        }}
      >
        F
      </div>
      {/* Wordmark */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold text-ink tracking-tight">FutureFace</span>
          <span className="text-[9px] text-ink-faint tracking-widest uppercase">Strategy to Execution</span>
        </div>
      )}
    </div>
  )
}

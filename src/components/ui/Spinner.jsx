export default function Spinner({ size = 20, color = '#D4920E', className = '' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Loading"
    >
      <circle
        cx="12" cy="12" r="10"
        stroke={color}
        strokeOpacity="0.2"
        strokeWidth="2.5"
      />
      <path
        d="M12 2C6.477 2 2 6.477 2 12"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Full-screen loading overlay
export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-dark-400 z-50">
      <Spinner size={36} />
      <p className="text-sm text-ink-muted">{message}</p>
    </div>
  )
}

// Inline loading state
export function InlineLoader({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <Spinner size={24} />
    </div>
  )
}

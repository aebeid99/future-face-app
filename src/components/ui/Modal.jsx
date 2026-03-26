import { useEffect } from 'react'
import { X } from 'lucide-react'
import Btn from './Btn.jsx'

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const SIZES = {
    sm:  'max-w-sm',
    md:  'max-w-lg',
    lg:  'max-w-2xl',
    xl:  'max-w-4xl',
    full:'max-w-[95vw]',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark-400/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={[
          'relative w-full bg-surface border border-border rounded-2xl shadow-panel animate-slide-up',
          SIZES[size] || SIZES.md,
          className,
        ].join(' ')}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-start justify-between p-5 border-b border-border">
            <div>
              {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
              {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
            </div>
            {onClose && (
              <Btn
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-ink-muted -mt-1 -mr-1 ml-4"
                aria-label="Close"
              >
                <X size={16} />
              </Btn>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

import Btn from './Btn.jsx'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-surface-hover border border-border flex items-center justify-center mb-4">
          <Icon size={22} className="text-ink-faint" />
        </div>
      )}
      {title && <h3 className="text-sm font-semibold text-ink mb-1">{title}</h3>}
      {description && <p className="text-xs text-ink-muted max-w-xs mb-4">{description}</p>}
      {action && (
        <Btn variant="secondary" size="sm" onClick={action}>
          {actionLabel || 'Get started'}
        </Btn>
      )}
    </div>
  )
}

import { forwardRef } from 'react'

const Input = forwardRef(function Input({
  label,
  error,
  hint,
  icon,
  iconRight,
  className = '',
  containerClass = '',
  ...props
}, ref) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClass}`}>
      {label && (
        <label className="ff-label">
          {label}
          {props.required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={[
            'ff-input',
            icon ? 'pl-9' : '',
            iconRight ? 'pr-9' : '',
            error ? '!border-error/50 !ring-error/20' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">
            {iconRight}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
  )
})

export default Input

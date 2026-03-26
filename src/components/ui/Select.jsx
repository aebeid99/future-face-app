import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(function Select({
  label,
  error,
  hint,
  options = [],    // [{ value, label }]
  placeholder,
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
        <select
          ref={ref}
          className={[
            'ff-input appearance-none pr-9 cursor-pointer',
            error ? '!border-error/50' : '',
            className,
          ].join(' ')}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
        />
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
  )
})

export default Select

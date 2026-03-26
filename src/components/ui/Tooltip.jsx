import { useState } from 'react'

export default function Tooltip({ content, children, placement = 'top', delay = 300 }) {
  const [visible, setVisible] = useState(false)
  const [timer, setTimer]     = useState(null)

  const show = () => setTimer(setTimeout(() => setVisible(true), delay))
  const hide = () => { clearTimeout(timer); setVisible(false) }

  const POS = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && content && (
        <div className={`absolute z-50 whitespace-nowrap pointer-events-none ${POS[placement]}`}>
          <div className="bg-dark-100 border border-border rounded-md px-2.5 py-1.5 text-xs text-ink shadow-panel animate-fade-in">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}

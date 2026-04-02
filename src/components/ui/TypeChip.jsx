/**
 * TypeChip — inline "type label" badge displayed before titles so users always
 * know what kind of item they are looking at.
 *
 * Supported types:  'objective'  |  'keyresult'  |  'initiative'
 *
 * Props:
 *   type   – one of the above strings  (required)
 *   short  – if true, shows abbreviated form (OBJ / KR / INIT) instead of full text
 *   className – extra classes to override spacing etc.
 */
export default function TypeChip({ type, short = false, className = '' }) {
  const cfg = CHIP_CFG[type] || null
  if (!cfg) return null

  const label = short ? cfg.short : cfg.label

  return (
    <span
      className={[
        'inline-flex items-center shrink-0 font-bold tracking-widest uppercase rounded',
        'border text-[9px] px-1.5 py-0.5 leading-none',
        cfg.text,
        cfg.bg,
        cfg.border,
        className,
      ].join(' ')}
    >
      {label}
    </span>
  )
}

// ── Config ──────────────────────────────────────────────────────────────────
const CHIP_CFG = {
  objective: {
    label:  'Objective',
    short:  'OBJ',
    text:   'text-violet-300',
    bg:     'bg-violet-500/15',
    border: 'border-violet-500/20',
  },
  keyresult: {
    label:  'Key Result',
    short:  'KR',
    text:   'text-teal-300',
    bg:     'bg-teal-500/15',
    border: 'border-teal-500/20',
  },
  initiative: {
    label:  'Initiative',
    short:  'INIT',
    text:   'text-sky-300',
    bg:     'bg-sky-500/15',
    border: 'border-sky-500/20',
  },
}

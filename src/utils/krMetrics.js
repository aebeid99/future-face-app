// ── KR Metric Types ───────────────────────────────────────────────────────────
// Supported types: 'numeric' | 'boolean' | 'milestone'
//
// numeric  → baseline (from) + current + target (to) + unit
//            progress = clamp((current − baseline) / (target − baseline) × 100, 0, 100)
//
// boolean  → done: true/false
//            progress = done ? 100 : 0
//
// milestone → dueDate target, manual progressOverride (0–100)
//             progress = progressOverride ?? time-elapsed %

export const KR_TYPES = [
  { value: 'numeric',   label: 'Numeric (From → To)' },
  { value: 'boolean',   label: 'Boolean (Done / Not Done)' },
  { value: 'milestone', label: 'Milestone (Date target)' },
]

export const KR_UNITS = ['%', 'SAR', 'AED', 'USD', 'deals', 'users', 'points', 'score', 'hrs', 'days', 'x', '#', 'NPS', 'CSAT', 'MoM%', 'YoY%']

/**
 * Calculate a KR's progress percentage (0–100) from its data.
 * @param {object} kr
 * @returns {number}
 */
export function calcKrProgress(kr) {
  const type = kr.type || 'numeric'

  if (type === 'boolean') {
    return kr.done ? 100 : 0
  }

  if (type === 'milestone') {
    // Use explicit progressOverride if set, otherwise estimate from time elapsed
    if (typeof kr.progressOverride === 'number') return Math.min(Math.max(kr.progressOverride, 0), 100)
    if (!kr.startDate || !kr.dueDate) return 0
    const start = new Date(kr.startDate).getTime()
    const end   = new Date(kr.dueDate).getTime()
    const now   = Date.now()
    if (end <= start) return 0
    return Math.min(Math.max(Math.round(((now - start) / (end - start)) * 100), 0), 100)
  }

  // Default: numeric
  const baseline = typeof kr.baseline === 'number' ? kr.baseline : 0
  const current  = typeof kr.current  === 'number' ? kr.current  : 0
  const target   = typeof kr.target   === 'number' ? kr.target   : 100
  if (target === baseline) return current >= target ? 100 : 0
  return Math.min(Math.max(Math.round(((current - baseline) / (target - baseline)) * 100), 0), 100)
}

/**
 * Format a KR's progress as a human-readable string.
 * @param {object} kr
 * @returns {string}
 */
export function formatKrValue(kr) {
  const type = kr.type || 'numeric'

  if (type === 'boolean') {
    return kr.done ? 'Done ✓' : 'Not done'
  }

  if (type === 'milestone') {
    const pct = calcKrProgress(kr)
    const due = kr.dueDate ? new Date(kr.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
    return `${pct}% · Due ${due}`
  }

  // Numeric
  const baseline = typeof kr.baseline === 'number' ? kr.baseline : 0
  const fmt = (n) => {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
    return String(n)
  }
  const unit = kr.unit || ''
  if (baseline !== 0) {
    return `${fmt(baseline)} → ${fmt(kr.current)} / ${fmt(kr.target)} ${unit}`
  }
  return `${fmt(kr.current)} / ${fmt(kr.target)} ${unit}`
}

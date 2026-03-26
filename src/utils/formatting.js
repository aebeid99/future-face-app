// ─── Date / Time ───────────────────────────────────────────────
export function formatDate(dateStr, lang = 'en', style = 'medium') {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return ''
  return d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    dateStyle: style,
  })
}

export function formatRelative(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const s = Math.floor(diff / 1000)
  if (s < 60)    return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)    return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)    return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30)    return `${d}d ago`
  const mo = Math.floor(d / 30)
  if (mo < 12)   return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}

// ─── Numbers ───────────────────────────────────────────────────
export function formatNumber(n, decimals = 0) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatPercent(n, decimals = 0) {
  if (n === null || n === undefined) return '—'
  return `${Number(n).toFixed(decimals)}%`
}

// ─── Progress ─────────────────────────────────────────────────
export function progressColor(value) {
  if (value >= 80) return '#10B981'   // success green
  if (value >= 50) return '#F59E0B'   // warning amber
  return '#EF4444'                     // danger red
}

export function progressStatus(value) {
  if (value >= 80) return 'on_track'
  if (value >= 40) return 'at_risk'
  return 'off_track'
}

// ─── Status Color ─────────────────────────────────────────────
export const STATUS_COLORS = {
  on_track:  { bg: 'bg-success/10',  text: 'text-success',  dot: '#10B981' },
  at_risk:   { bg: 'bg-warning/10',  text: 'text-warning',  dot: '#F59E0B' },
  off_track: { bg: 'bg-error/10',    text: 'text-error',    dot: '#EF4444' },
  completed: { bg: 'bg-info/10',     text: 'text-info',     dot: '#3B82F6' },
  paused:    { bg: 'bg-ink-faint/10',text: 'text-ink-muted',dot: '#505974' },
}

// ─── Quarter ──────────────────────────────────────────────────
export function currentQuarter() {
  const now = new Date()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  return `Q${q} ${now.getFullYear()}`
}

export function quarterList(count = 8) {
  const now = new Date()
  let q = Math.ceil((now.getMonth() + 1) / 3)
  let y = now.getFullYear()
  const list = []
  for (let i = 0; i < count; i++) {
    list.push(`Q${q} ${y}`)
    q++; if (q > 4) { q = 1; y++ }
  }
  return list
}

// ─── Initials ─────────────────────────────────────────────────
export function initials(name = '') {
  return name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2)
}

// ─── Domain from email ────────────────────────────────────────
export function domainFromEmail(email = '') {
  return email.split('@')[1] || ''
}

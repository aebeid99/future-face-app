import { useState, useRef, useMemo } from 'react'
import {
  Plus, Flag, ChevronDown, ChevronRight, Target,
  Pencil, Trash2, CheckSquare, Calendar, Circle,
  CheckCircle2, Clock, MinusCircle, Layers, BarChart2,
  AlignLeft, ZoomIn, ZoomOut,
} from 'lucide-react'
import Card, { CardHeader } from '../../components/ui/Card.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Avatar from '../../components/ui/Avatar.jsx'
import { useApp } from '../../state/AppContext.jsx'
import {
  OKR_CREATE, OKR_UPDATE, OKR_DELETE,
  INITIATIVE_UPDATE, INITIATIVE_DELETE,
} from '../../state/actions.js'
import { t } from '../../utils/i18n.js'
import { quarterList, currentQuarter } from '../../utils/formatting.js'
import { calcKrProgress } from '../../utils/krMetrics.js'

const QUARTERS = quarterList(8)

// ─── Initiative statuses ──────────────────────────────────────────────────────
const INI_STATUS = {
  not_started: { icon: Circle,       color: 'text-ink-muted',  bar: 'bg-ink-faint/40',  label: 'Not Started' },
  in_progress: { icon: Clock,        color: 'text-blue-400',   bar: 'bg-blue-500',       label: 'In Dev'      },
  done:        { icon: CheckCircle2, color: 'text-success',    bar: 'bg-success',        label: 'Shipped'     },
  blocked:     { icon: MinusCircle,  color: 'text-error',      bar: 'bg-red-500',        label: 'Blocked'     },
}

const PRIORITY_COLORS = { p1: 'text-red-400', p2: 'text-gold', p3: 'text-ink-muted' }

// ─── Date utilities ───────────────────────────────────────────────────────────
const parseDate = (s) => s ? new Date(s) : null
const clamp01   = (v) => Math.max(0, Math.min(1, v))

function getZoomColumns(zoom, allDates) {
  const now   = new Date()
  const min   = allDates.length ? new Date(Math.min(...allDates)) : new Date(now.getFullYear(), now.getMonth(), 1)
  const max   = allDates.length ? new Date(Math.max(...allDates)) : new Date(now.getFullYear(), now.getMonth() + 4, 1)

  // Pad 1 unit before/after
  const cols  = []
  if (zoom === 'monthly') {
    let d = new Date(min.getFullYear(), min.getMonth() - 1, 1)
    const end = new Date(max.getFullYear(), max.getMonth() + 2, 1)
    while (d <= end) {
      cols.push({
        key:   `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        start: new Date(d),
        end:   new Date(d.getFullYear(), d.getMonth() + 1, 0),
      })
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    }
  } else if (zoom === 'quarterly') {
    let qYear = min.getFullYear()
    let qNum  = Math.floor(min.getMonth() / 3)
    const endYear = max.getFullYear()
    const endQ    = Math.floor(max.getMonth() / 3)
    while (qYear < endYear || (qYear === endYear && qNum <= endQ + 1)) {
      const startM = qNum * 3
      const s = new Date(qYear, startM, 1)
      const e = new Date(qYear, startM + 3, 0)
      cols.push({ key: `${qYear}-Q${qNum+1}`, label: `Q${qNum+1} ${qYear}`, start: s, end: e })
      qNum++
      if (qNum > 3) { qNum = 0; qYear++ }
    }
  } else { // yearly
    let y = min.getFullYear() - 1
    const ey = max.getFullYear() + 2
    while (y <= ey) {
      cols.push({ key: `${y}`, label: `${y}`, start: new Date(y, 0, 1), end: new Date(y, 11, 31) })
      y++
    }
  }
  return cols
}

function barPosition(startDate, endDate, columns) {
  if (!columns.length) return null
  const rangeStart = columns[0].start.getTime()
  const rangeEnd   = columns[columns.length - 1].end.getTime()
  const total      = rangeEnd - rangeStart
  if (total <= 0) return null

  const s = startDate ? clamp01((startDate.getTime() - rangeStart) / total) : 0
  const e = endDate   ? clamp01((endDate.getTime()   - rangeStart) / total) : s + 0.05
  return { left: `${s * 100}%`, width: `${Math.max(0.5, (e - s)) * 100}%` }
}

function todayPosition(columns) {
  if (!columns.length) return null
  const now        = Date.now()
  const rangeStart = columns[0].start.getTime()
  const rangeEnd   = columns[columns.length - 1].end.getTime()
  const pct        = clamp01((now - rangeStart) / (rangeEnd - rangeStart))
  if (pct <= 0 || pct >= 1) return null
  return `${pct * 100}%`
}

// ══════════════════════════════════════════════════════════════════════════════
// GANTT TIMELINE PANEL
// ══════════════════════════════════════════════════════════════════════════════
function GanttPanel({ rows, columns, rowHeight = 36 }) {
  const todayX = todayPosition(columns)

  return (
    <div className="relative overflow-x-auto overflow-y-hidden flex-1 min-w-0 select-none">
      {/* Column headers */}
      <div className="flex border-b border-border sticky top-0 bg-surface z-10">
        {columns.map(col => (
          <div key={col.key} className="flex-1 min-w-[52px] text-center py-2 px-1 text-[10px] text-ink-faint font-medium border-r border-border/40 last:border-r-0">
            {col.label}
          </div>
        ))}
      </div>

      {/* Rows area */}
      <div className="relative">
        {/* Column grid lines */}
        <div className="absolute inset-0 flex pointer-events-none">
          {columns.map((col, i) => (
            <div key={col.key} className="flex-1 min-w-[52px] border-r border-border/20 last:border-r-0 h-full" />
          ))}
        </div>

        {/* Today line */}
        {todayX && (
          <div className="absolute top-0 bottom-0 z-20 pointer-events-none" style={{ left: todayX }}>
            <div className="w-px h-full bg-gold/60" />
            <div className="absolute -top-0 left-0 -translate-x-1/2 text-[9px] text-gold bg-gold/10 border border-gold/30 px-1 py-0.5 rounded whitespace-nowrap">
              Today
            </div>
          </div>
        )}

        {/* Bars */}
        {rows.map((row, rowIdx) => {
          const isHeader  = row.type === 'quarter' || row.type === 'okr'
          const rowBg     = rowIdx % 2 === 0 ? '' : 'bg-dark/20'
          const h         = isHeader ? rowHeight + 4 : rowHeight

          if (row.type === 'quarter') {
            return (
              <div key={row.key} style={{ height: h }} className="flex items-center px-2 bg-dark/40 border-b border-border/40">
                <span className="text-[10px] text-ink-faint uppercase tracking-wider">{row.label}</span>
              </div>
            )
          }

          if (row.type === 'okr') {
            const pos = barPosition(row.startDate, row.endDate, columns)
            return (
              <div key={row.key} style={{ height: h }} className={`relative flex items-center ${rowBg}`}>
                {pos && (
                  <div className="absolute rounded-sm opacity-30 bg-gold"
                    style={{ top: 10, bottom: 10, left: pos.left, width: pos.width }} />
                )}
              </div>
            )
          }

          // Initiative bar
          const pos    = barPosition(row.startDate, row.endDate, columns)
          const cfg    = INI_STATUS[row.status] || INI_STATUS.not_started
          const isDone = row.status === 'done'

          return (
            <div key={row.key} style={{ height: h }} className={`relative flex items-center ${rowBg}`}>
              {pos ? (
                <div
                  className={`absolute rounded-full flex items-center px-2 text-[10px] font-medium text-white/90 truncate
                    ${cfg.bar} ${isDone ? 'opacity-70' : 'opacity-90'} hover:opacity-100 transition-opacity cursor-default`}
                  style={{ top: 8, bottom: 8, left: pos.left, width: pos.width, minWidth: 12 }}
                  title={`${row.label} · ${cfg.label}`}
                >
                  <span className="truncate hidden sm:block">{pos.width.replace('%', '') > 8 ? row.label : ''}</span>
                </div>
              ) : (
                <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-gold/60 border border-gold"
                  title={row.label} style={{ top: '50%', marginTop: -6 }} />
              )}
              {isDone && pos && (
                <div className="absolute z-10" style={{ left: pos.left, top: '50%', marginTop: -5, transform: 'translateX(-50%)' }}>
                  <CheckCircle2 size={10} className="text-success" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// LEFT PANE — OKR + Initiative tree
// ══════════════════════════════════════════════════════════════════════════════
function LeftTree({ rows, expanded, toggleOkr, onEdit, dispatch, lang, statusLabel }) {
  const INI_ORDER = ['not_started', 'in_progress', 'done', 'blocked']

  return (
    <div className="w-80 shrink-0 border-r border-border overflow-y-auto">
      {/* Header row */}
      <div className="flex items-center px-3 py-2 bg-surface border-b border-border sticky top-0 z-10">
        <span className="text-[10px] uppercase tracking-wider text-ink-faint">Objective / Initiative</span>
      </div>

      {rows.map((row) => {
        if (row.type === 'quarter') {
          return (
            <div key={row.key}
              className="flex items-center gap-2 px-3 py-2 bg-dark/40 border-b border-border/40 select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">{row.label}</span>
              <span className="text-[10px] text-ink-faint ml-auto">{row.avgProgress}% avg</span>
            </div>
          )
        }

        if (row.type === 'okr') {
          return (
            <div key={row.key}
              className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50 hover:bg-dark/20 cursor-pointer group transition-colors select-none"
              onClick={() => toggleOkr(row.okrId)}>
              <button className="text-ink-faint shrink-0">
                {expanded[row.okrId] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink truncate">{row.label}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {row.owner && <Avatar name={row.owner} size="xs" />}
                  <span className="text-[10px] text-ink-faint">{row.krsCount} KRs · {row.inisCount} ini</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-semibold text-gold">{row.progress}%</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={() => onEdit(row.okr)}
                    className="w-5 h-5 rounded hover:bg-gold/10 text-ink-faint hover:text-gold flex items-center justify-center">
                    <Pencil size={9} />
                  </button>
                  <button onClick={() => dispatch({ type: OKR_DELETE, id: row.okrId })}
                    className="w-5 h-5 rounded hover:bg-red-500/10 text-ink-faint hover:text-red-400 flex items-center justify-center">
                    <Trash2 size={9} />
                  </button>
                </div>
              </div>
            </div>
          )
        }

        if (row.type === 'ini') {
          const cfg  = INI_STATUS[row.status] || INI_STATUS.not_started
          const Icon = cfg.icon
          const pri  = PRIORITY_COLORS[row.priority] || 'text-ink-faint'

          const cycleStatus = () => {
            const next = INI_ORDER[(INI_ORDER.indexOf(row.status) + 1) % INI_ORDER.length]
            dispatch({ type: INITIATIVE_UPDATE, okrId: row.okrId, initiativeId: row.id, updates: { status: next } })
          }

          return (
            <div key={row.key}
              className="flex items-center gap-2 pl-8 pr-3 py-2 border-b border-border/30 hover:bg-dark/10 group transition-colors">
              <button onClick={cycleStatus} className="shrink-0">
                <Icon size={11} className={`${cfg.color} transition-colors`} />
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] truncate ${row.status === 'done' ? 'line-through text-ink-faint' : 'text-ink'}`}>
                  {row.label}
                </p>
              </div>
              {row.priority && <span className={`text-[9px] font-bold ${pri} shrink-0`}>{row.priority?.toUpperCase()}</span>}
              {row.owner && <Avatar name={row.owner} size="xs" className="shrink-0" />}
              <button onClick={() => dispatch({ type: INITIATIVE_DELETE, okrId: row.okrId, initiativeId: row.id })}
                className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded hover:bg-red-500/10 text-ink-faint hover:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 size={8} />
              </button>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ROADMAP PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function RoadmapPage() {
  const { state, dispatch } = useApp()
  const { lang, okrs, org, members, user } = state
  const tr = (k) => t(k, lang)

  const statusLabel = (s) => org.statusLabels?.[s] || s?.replace('_', ' ')

  // ── View / filter state ──────────────────────────────────────────────────
  const [zoom,      setZoom]      = useState('monthly')     // monthly | quarterly | yearly
  const [viewMode,  setViewMode]  = useState('gantt')       // gantt | list
  const [filterStatus, setFilterStatus] = useState('')      // '' | 'not_started' | 'in_progress' | 'done' | 'blocked'
  const [expanded,  setExpanded]  = useState(() => {
    const init = {}
    okrs.forEach(o => { init[o.id] = true })
    return init
  })

  // ── Edit / create OKR state ──────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState(null)
  const [editForm,   setEditForm]   = useState({ title: '', quarter: currentQuarter(), owner: '' })
  const [newOpen,    setNewOpen]    = useState(false)
  const [newForm,    setNewForm]    = useState({ title: '', quarter: currentQuarter(), owner: user?.name || '' })

  const openEdit = (okr) => {
    setEditTarget(okr)
    setEditForm({ title: okr.title, quarter: okr.quarter, owner: okr.owner || '' })
  }

  const saveEdit = () => {
    if (!editForm.title.trim() || !editTarget) return
    dispatch({ type: OKR_UPDATE, id: editTarget.id, updates: {
      title: editForm.title.trim(), quarter: editForm.quarter, owner: editForm.owner,
    }})
    setEditTarget(null)
  }

  const createOkr = () => {
    if (!newForm.title.trim()) return
    dispatch({ type: OKR_CREATE, ...newForm })
    setNewForm({ title: '', quarter: currentQuarter(), owner: user?.name || '' })
    setNewOpen(false)
  }

  const toggleOkr = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  // ── Data derived from OKRs ───────────────────────────────────────────────
  const liveOkrs  = okrs.filter(o => !o.archived)
  const allInis   = liveOkrs.flatMap(o => (o.initiatives || []))
  const filtered  = filterStatus ? allInis.filter(i => i.status === filterStatus) : allInis

  // Collect all dates to auto-scale Gantt
  const allDates = useMemo(() => {
    const dates = []
    liveOkrs.forEach(o => {
      ;(o.initiatives || []).forEach(ini => {
        if (ini.startDate) dates.push(new Date(ini.startDate).getTime())
        if (ini.dueDate)   dates.push(new Date(ini.dueDate).getTime())
      })
      ;(o.keyResults || []).forEach(kr => {
        if (kr.startDate) dates.push(new Date(kr.startDate).getTime())
        if (kr.dueDate)   dates.push(new Date(kr.dueDate).getTime())
      })
    })
    return dates
  }, [liveOkrs])

  const columns = useMemo(() => getZoomColumns(zoom, allDates), [zoom, allDates])

  // ── Build flat rows for synchronized left tree + Gantt ───────────────────
  const quarters  = [...new Set(liveOkrs.map(o => o.quarter))].sort()

  const rows = useMemo(() => {
    const result = []
    quarters.forEach(q => {
      const qOkrs = liveOkrs.filter(o => o.quarter === q)
      const avgProgress = qOkrs.length
        ? Math.round(qOkrs.reduce((s, o) => s + o.progress, 0) / qOkrs.length)
        : 0

      result.push({ type: 'quarter', key: `q_${q}`, label: q, avgProgress })

      qOkrs.forEach(okr => {
        // Derive OKR date span from initiatives
        const iniDates = (okr.initiatives || []).flatMap(i =>
          [i.startDate ? new Date(i.startDate) : null, i.dueDate ? new Date(i.dueDate) : null].filter(Boolean)
        )
        const okrStartDate = iniDates.length ? new Date(Math.min(...iniDates.map(d => d.getTime()))) : null
        const okrEndDate   = iniDates.length ? new Date(Math.max(...iniDates.map(d => d.getTime()))) : null

        result.push({
          type: 'okr', key: `okr_${okr.id}`, okrId: okr.id, okr,
          label: okr.title, owner: okr.owner,
          progress: okr.progress, status: okr.status,
          krsCount: okr.keyResults?.length || 0,
          inisCount: okr.initiatives?.length || 0,
          startDate: okrStartDate, endDate: okrEndDate,
        })

        if (expanded[okr.id]) {
          const inis = filterStatus
            ? (okr.initiatives || []).filter(i => i.status === filterStatus)
            : (okr.initiatives || [])

          inis.forEach(ini => {
            result.push({
              type: 'ini', key: `ini_${ini.id}`, id: ini.id, okrId: okr.id,
              label: ini.title, status: ini.status,
              owner: ini.owner, priority: ini.priority,
              startDate: ini.startDate ? new Date(ini.startDate) : null,
              endDate:   ini.dueDate   ? new Date(ini.dueDate)   : null,
            })
          })
        }
      })
    })
    return result
  }, [liveOkrs, expanded, filterStatus, quarters])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const shippedCount    = allInis.filter(i => i.status === 'done').length
  const inDevCount      = allInis.filter(i => i.status === 'in_progress').length
  const toDoCount       = allInis.filter(i => i.status === 'not_started').length
  const blockedCount    = allInis.filter(i => i.status === 'blocked').length
  const timelineConf    = allInis.length
    ? Math.round(((shippedCount + inDevCount * 0.6) / allInis.length) * 100)
    : 0

  // ── Empty state ───────────────────────────────────────────────────────────
  if (liveOkrs.length === 0) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-muted">No objectives on the roadmap yet.</p>
          <Btn size="sm" icon={<Plus size={14} />} onClick={() => setNewOpen(true)}>
            {lang === 'ar' ? 'هدف جديد' : 'New Objective'}
          </Btn>
        </div>

        {/* Empty state — Gantt preview card */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: illustration */}
            <div className="p-8 flex flex-col items-center justify-center bg-dark/30 border-r border-border">
              <div className="w-full max-w-[240px] space-y-2.5">
                {['80%', '55%', '30%', '92%'].map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-14 h-2 rounded bg-border/60 shrink-0" />
                    <div className="flex-1 h-5 rounded-full bg-border/30 relative overflow-hidden">
                      <div className={`absolute left-${i*3} top-1 bottom-1 rounded-full ${
                        i===0 ? 'bg-gold/50' : i===1 ? 'bg-blue-500/50' : i===2 ? 'bg-success/50' : 'bg-gold/30'
                      }`} style={{ left: `${i*8}%`, width: w }} />
                    </div>
                  </div>
                ))}
                <div className="w-px h-8 bg-gold/60 mx-auto mt-2" />
              </div>
            </div>
            {/* Right: copy */}
            <div className="p-8 flex flex-col justify-center">
              <p className="text-[10px] uppercase tracking-widest text-gold mb-2">Strategic Clarity</p>
              <h2 className="text-xl font-bold text-ink mb-3">Master your delivery flow</h2>
              <p className="text-sm text-ink-muted mb-5 leading-relaxed">
                Visualise your strategic delivery timeline and identify dependencies before they cause delays.
                Impactor turns complex roadmaps into executable paths.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Btn icon={<Plus size={14} />} onClick={() => setNewOpen(true)}>Create First Objective</Btn>
              </div>
            </div>
          </div>
          {/* Feature cards */}
          <div className="grid grid-cols-3 border-t border-border">
            {[
              { icon: Layers,   title: 'Dependency Mapping',   desc: 'Automatically detect critical paths and overlapping schedules.' },
              { icon: ZoomIn,   title: 'Dynamic Adjustments',  desc: 'Shift timelines with one click and recalibrate connected items.' },
              { icon: BarChart2, title: 'Progress Analytics',  desc: 'Real-time completion tracking synced with your execution teams.' },
            ].map(f => (
              <div key={f.title} className="p-4 border-r last:border-r-0 border-border">
                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center mb-2">
                  <f.icon size={15} className="text-gold" />
                </div>
                <p className="text-xs font-semibold text-ink mb-1">{f.title}</p>
                <p className="text-[11px] text-ink-muted leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Create OKR modal */}
        <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New Objective"
          footer={<><Btn variant="secondary" size="sm" onClick={() => setNewOpen(false)}>Cancel</Btn><Btn size="sm" onClick={createOkr} disabled={!newForm.title.trim()}>Save</Btn></>}>
          <div className="space-y-4">
            <Input label="Objective Title" value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))} autoFocus />
            <Select label="Quarter" value={newForm.quarter} onChange={e => setNewForm(f => ({ ...f, quarter: e.target.value }))} options={QUARTERS.map(q => ({ value: q, label: q }))} />
          </div>
        </Modal>
      </div>
    )
  }

  // ── Full view ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full animate-fade-in" style={{ minHeight: 0 }}>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* View toggle */}
        <div className="flex items-center gap-0.5 bg-surface border border-border rounded-lg p-0.5">
          {[
            { id: 'gantt', icon: AlignLeft,  label: 'Gantt' },
            { id: 'list',  icon: Layers,     label: 'List'  },
          ].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === v.id ? 'bg-gold/10 text-gold' : 'text-ink-muted hover:text-ink'
              }`}>
              <v.icon size={12} />
              {v.label}
            </button>
          ))}
        </div>

        {/* Zoom toggle (Gantt only) */}
        {viewMode === 'gantt' && (
          <div className="flex items-center gap-0.5 bg-surface border border-border rounded-lg p-0.5">
            {['monthly', 'quarterly', 'yearly'].map(z => (
              <button key={z} onClick={() => setZoom(z)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                  zoom === z ? 'bg-surface text-ink shadow-sm border border-border' : 'text-ink-muted hover:text-ink'
                }`}>
                {z === 'monthly' ? 'Monthly' : z === 'quarterly' ? 'Quarterly' : 'Yearly'}
              </button>
            ))}
          </div>
        )}

        {/* Status filter */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-ink-muted outline-none focus:border-gold/40 ml-auto">
          <option value="">All Statuses</option>
          {Object.entries(INI_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <Btn size="sm" icon={<Plus size={13} />} onClick={() => setNewOpen(true)}>
          {lang === 'ar' ? 'هدف جديد' : 'New Objective'}
        </Btn>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      {viewMode === 'list' ? (
        /* ── LIST VIEW ───────────────────────────────────────────────────── */
        <div className="space-y-3 overflow-y-auto flex-1">
          {quarters.map(q => {
            const qOkrs = liveOkrs.filter(o => o.quarter === q)
            const avgProgress = qOkrs.length
              ? Math.round(qOkrs.reduce((s, o) => s + o.progress, 0) / qOkrs.length)
              : 0

            return (
              <Card key={q}>
                <CardHeader
                  title={q}
                  subtitle={`${qOkrs.length} objectives · avg ${avgProgress}%`}
                  action={<div className="flex items-center gap-2"><ProgressBar value={avgProgress} size="xs" className="w-20" /><span className="text-xs text-ink-muted">{avgProgress}%</span></div>}
                />
                <div className="space-y-2">
                  {qOkrs.map(okr => {
                    const inis    = okr.initiatives || []
                    const doneIni = inis.filter(i => i.status === 'done').length
                    return (
                      <div key={okr.id} className="border border-border rounded-xl overflow-hidden group/row">
                        <div className="flex items-center gap-3 p-3 cursor-pointer bg-surface hover:bg-dark/30 transition-colors select-none"
                          onClick={() => toggleOkr(okr.id)}>
                          <button className="text-ink-muted shrink-0">
                            {expanded[okr.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{okr.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Avatar name={okr.owner} size="xs" />
                              <span className="text-xs text-ink-muted">{okr.owner}</span>
                              {inis.length > 0 && <span className="text-xs text-ink-faint">{doneIni}/{inis.length} done</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <ProgressBar value={okr.progress} size="xs" className="w-16" />
                            <span className="text-xs text-ink-muted w-8">{okr.progress}%</span>
                            <Badge variant={okr.status} dot size="sm">{statusLabel(okr.status)}</Badge>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openEdit(okr)} className="w-7 h-7 rounded hover:bg-gold/10 text-ink-muted hover:text-gold flex items-center justify-center"><Pencil size={12} /></button>
                            <button onClick={() => dispatch({ type: OKR_DELETE, id: okr.id })} className="w-7 h-7 rounded hover:bg-red-500/10 text-ink-muted hover:text-red-400 flex items-center justify-center"><Trash2 size={12} /></button>
                          </div>
                        </div>
                        {expanded[okr.id] && inis.length > 0 && (
                          <div className="border-t border-border/50 bg-dark/20 py-1">
                            {inis.map(ini => {
                              const cfg  = INI_STATUS[ini.status] || INI_STATUS.not_started
                              const Icon = cfg.icon
                              return (
                                <div key={ini.id} className="flex items-center gap-2.5 pl-10 pr-3 py-1.5 hover:bg-dark/40 group transition-colors">
                                  <Icon size={12} className={`${cfg.color} shrink-0`} />
                                  <span className={`text-xs flex-1 truncate ${ini.status === 'done' ? 'line-through text-ink-faint' : 'text-ink'}`}>{ini.title}</span>
                                  {ini.owner && <Avatar name={ini.owner} size="xs" />}
                                  {ini.dueDate && <span className="text-[10px] text-ink-faint flex items-center gap-0.5"><Calendar size={8} />{new Date(ini.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.color} bg-dark border border-border/60`}>{cfg.label}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        /* ── GANTT VIEW ──────────────────────────────────────────────────── */
        <div className="flex flex-1 border border-border rounded-xl overflow-hidden bg-surface" style={{ minHeight: 400 }}>
          <LeftTree
            rows={rows}
            expanded={expanded}
            toggleOkr={toggleOkr}
            onEdit={openEdit}
            dispatch={dispatch}
            lang={lang}
            statusLabel={statusLabel}
          />
          <GanttPanel rows={rows} columns={columns} rowHeight={36} />
        </div>
      )}

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      {liveOkrs.length > 0 && (
        <div className="flex items-center gap-4 mt-3 px-1 flex-wrap">
          <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success inline-block" />
              {shippedCount} shipped
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              {inDevCount} in dev
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-ink-faint/50 inline-block" />
              {toDoCount} to do
            </span>
            {blockedCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                {blockedCount} blocked
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-ink-muted">Timeline Confidence:</span>
            <ProgressBar value={timelineConf} size="xs" className="w-24" />
            <span className="text-xs font-semibold text-gold">{timelineConf}%</span>
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)}
        title={lang === 'ar' ? 'هدف جديد' : 'New Objective'}
        footer={
          <>
            <Btn variant="secondary" size="sm" onClick={() => setNewOpen(false)}>Cancel</Btn>
            <Btn size="sm" onClick={createOkr} disabled={!newForm.title.trim()}>Save</Btn>
          </>
        }>
        <div className="space-y-4">
          <Input label={lang === 'ar' ? 'عنوان الهدف' : 'Objective Title'}
            value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
            autoFocus onKeyDown={e => e.key === 'Enter' && createOkr()} />
          <Select label={lang === 'ar' ? 'الربع المالي' : 'Quarter'}
            value={newForm.quarter} onChange={e => setNewForm(f => ({ ...f, quarter: e.target.value }))}
            options={QUARTERS.map(q => ({ value: q, label: q }))} />
          {members.length > 0 ? (
            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Owner</label>
              <select value={newForm.owner} onChange={e => setNewForm(f => ({ ...f, owner: e.target.value }))} className="ff-input w-full text-sm">
                <option value="">Select owner…</option>
                {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                <option value={user?.name || 'Me'}>{user?.name || 'Me'} (you)</option>
              </select>
            </div>
          ) : (
            <Input label="Owner" value={newForm.owner} onChange={e => setNewForm(f => ({ ...f, owner: e.target.value }))} />
          )}
        </div>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)}
        title={lang === 'ar' ? 'تعديل الهدف' : 'Edit Objective'}
        footer={
          <>
            <Btn variant="secondary" size="sm" onClick={() => setEditTarget(null)}>Cancel</Btn>
            <Btn size="sm" onClick={saveEdit} disabled={!editForm.title.trim()}>Save</Btn>
          </>
        }>
        <div className="space-y-4">
          <Input label={lang === 'ar' ? 'عنوان الهدف' : 'Objective Title'}
            value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
            autoFocus onKeyDown={e => e.key === 'Enter' && saveEdit()} />
          <Select label={lang === 'ar' ? 'الربع المالي' : 'Quarter'}
            value={editForm.quarter} onChange={e => setEditForm(f => ({ ...f, quarter: e.target.value }))}
            options={QUARTERS.map(q => ({ value: q, label: q }))} />
          {members.length > 0 ? (
            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Owner</label>
              <select value={editForm.owner} onChange={e => setEditForm(f => ({ ...f, owner: e.target.value }))} className="ff-input w-full text-sm">
                <option value="">Select owner…</option>
                {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                <option value={user?.name || 'Me'}>{user?.name || 'Me'} (you)</option>
              </select>
            </div>
          ) : (
            <Input label="Owner" value={editForm.owner} onChange={e => setEditForm(f => ({ ...f, owner: e.target.value }))} />
          )}
        </div>
      </Modal>
    </div>
  )
}

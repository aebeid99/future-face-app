import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import {
  Plus, Flag, ChevronDown, ChevronRight, Target,
  Pencil, Trash2, CheckSquare, Calendar, Circle,
  CheckCircle2, Clock, MinusCircle, Layers, BarChart2,
  AlignLeft, ZoomIn, ZoomOut, GripVertical, TrendingUp,
  ExternalLink, MessageSquare, Hash,
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
import IssueDetailDrawer from '../../components/ui/IssueDetailDrawer.jsx'
import { useApp } from '../../state/AppContext.jsx'
import {
  OKR_CREATE, OKR_UPDATE, OKR_DELETE,
  INITIATIVE_UPDATE, INITIATIVE_DELETE,
  KR_UPDATE, OKR_REORDER, INITIATIVE_MOVE,
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
const FMT_DATE  = (d) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'

function getZoomColumns(zoom, allDates) {
  const now   = new Date()
  const min   = allDates.length ? new Date(Math.min(...allDates)) : new Date(now.getFullYear(), now.getMonth(), 1)
  const max   = allDates.length ? new Date(Math.max(...allDates)) : new Date(now.getFullYear(), now.getMonth() + 4, 1)
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
    let qYear = min.getFullYear(), qNum = Math.floor(min.getMonth() / 3)
    const endYear = max.getFullYear(), endQ = Math.floor(max.getMonth() / 3)
    while (qYear < endYear || (qYear === endYear && qNum <= endQ + 1)) {
      const startM = qNum * 3
      cols.push({ key: `${qYear}-Q${qNum+1}`, label: `Q${qNum+1} ${qYear}`,
        start: new Date(qYear, startM, 1), end: new Date(qYear, startM + 3, 0) })
      qNum++; if (qNum > 3) { qNum = 0; qYear++ }
    }
  } else {
    let y = min.getFullYear() - 1, ey = max.getFullYear() + 2
    while (y <= ey) {
      cols.push({ key: `${y}`, label: `${y}`, start: new Date(y, 0, 1), end: new Date(y, 11, 31) })
      y++
    }
  }
  return cols
}

function barPosition(startDate, endDate, columns) {
  if (!columns.length) return null
  const rangeStart = columns[0].start.getTime(), rangeEnd = columns[columns.length - 1].end.getTime()
  const total = rangeEnd - rangeStart
  if (total <= 0) return null
  const s = startDate ? clamp01((startDate.getTime() - rangeStart) / total) : 0
  const e = endDate   ? clamp01((endDate.getTime()   - rangeStart) / total) : s + 0.05
  return { left: `${s * 100}%`, width: `${Math.max(0.5, (e - s)) * 100}%` }
}

function todayPosition(columns) {
  if (!columns.length) return null
  const now = Date.now(), rangeStart = columns[0].start.getTime(), rangeEnd = columns[columns.length - 1].end.getTime()
  const pct = clamp01((now - rangeStart) / (rangeEnd - rangeStart))
  if (pct <= 0 || pct >= 1) return null
  return `${pct * 100}%`
}

// ══════════════════════════════════════════════════════════════════════════════
// GANTT CONFIRM MODAL — mandatory comment before applying timeline change
// ══════════════════════════════════════════════════════════════════════════════
function GanttConfirmModal({ change, onConfirm, onCancel }) {
  const [comment, setComment] = useState('')
  if (!change) return null
  return (
    <Modal open={!!change} onClose={onCancel} title="Confirm Timeline Change">
      <div className="space-y-4">
        <div className="bg-dark rounded-xl p-4 border border-border">
          <p className="text-xs font-semibold text-ink mb-3 truncate">{change.label}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-ink-muted mb-1">Current timeline</p>
              <p className="text-xs text-red-400 font-medium line-through">
                {FMT_DATE(change.oldStart)} — {FMT_DATE(change.oldEnd)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-ink-muted mb-1">New timeline</p>
              <p className="text-xs text-green-400 font-semibold">
                {FMT_DATE(change.newStart)} — {FMT_DATE(change.newEnd)}
              </p>
            </div>
          </div>
        </div>
        <div>
          <label className="ff-label">Reason for change <span className="text-red-400">*</span></label>
          <textarea
            autoFocus
            className="ff-input resize-none w-full mt-1"
            rows={3}
            placeholder="Why is this timeline changing? Add context for the team…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey && comment.trim()) onConfirm(comment) }}
          />
          <p className="text-[10px] text-ink-faint mt-1">Comment is required to confirm the change.</p>
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <Btn variant="ghost" size="sm" onClick={onCancel}>Cancel</Btn>
          <Btn variant="primary" size="sm" onClick={() => onConfirm(comment)} disabled={!comment.trim()}>
            Confirm Change
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// GANTT TIMELINE PANEL
// ══════════════════════════════════════════════════════════════════════════════
function GanttPanel({ rows, columns, rowHeight = 36, onPendingChange, scrollRef, onScroll }) {
  const todayX       = todayPosition(columns)
  const containerRef = useRef(null)
  const dragState    = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [preview, setPreview] = useState(null)

  // Connect the external scroll ref to this container
  useEffect(() => {
    if (scrollRef) scrollRef.current = containerRef.current
  })

  const fracToDate = useCallback((frac) => {
    if (!columns.length) return null
    const rangeStart = columns[0].start.getTime(), rangeEnd = columns[columns.length - 1].end.getTime()
    return new Date(rangeStart + frac * (rangeEnd - rangeStart))
  }, [columns])

  const clientXToFrac = useCallback((clientX) => {
    const el = containerRef.current; if (!el) return 0
    const rect = el.getBoundingClientRect()
    return Math.max(0, Math.min(1, (clientX - rect.left + el.scrollLeft) / el.scrollWidth))
  }, [])

  const handlePointerMove = useCallback((e) => {
    const ds = dragState.current; if (!ds) return
    const frac = clientXToFrac(e.clientX), delta = frac - ds.grabFrac
    let text, previewLeft, previewWidth
    if (ds.type === 'resize') {
      const newEndFrac = Math.max(frac, ds.startFrac + 0.005)
      const newEnd = fracToDate(newEndFrac)
      text = `End: ${FMT_DATE(newEnd)}`
      previewLeft = `${ds.startFrac * 100}%`
      previewWidth = `${Math.max(0.5, (newEndFrac - ds.startFrac)) * 100}%`
    } else {
      const newStartFrac = Math.max(0, ds.startFrac + delta), newEndFrac = Math.min(1, ds.endFrac + delta)
      const newStart = fracToDate(newStartFrac), newEnd = fracToDate(newEndFrac)
      text = `${FMT_DATE(newStart)} → ${FMT_DATE(newEnd)}`
      previewLeft = `${newStartFrac * 100}%`
      previewWidth = `${Math.max(0.5, (newEndFrac - newStartFrac)) * 100}%`
    }
    const el = containerRef.current, rect = el?.getBoundingClientRect() || { left: 0, top: 0 }
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 32, text })
    setPreview({ rowKey: `ini_${ds.id}`, left: previewLeft, width: previewWidth })
  }, [clientXToFrac, fracToDate])

  const handlePointerUp = useCallback((e) => {
    const ds = dragState.current; if (!ds) return
    const frac = clientXToFrac(e.clientX), delta = frac - ds.grabFrac
    const row = rows.find(r => r.id === ds.id)

    if (ds.type === 'resize') {
      const newEnd = fracToDate(Math.max(frac, ds.startFrac + 0.005))
      onPendingChange({
        id: ds.id, okrId: ds.okrId, type: 'resize',
        label: row?.label || 'Initiative',
        oldStart: fracToDate(ds.startFrac),
        oldEnd:   fracToDate(ds.endFrac),
        newStart: fracToDate(ds.startFrac),
        newEnd,
      })
    } else {
      const newStart = fracToDate(Math.max(0, ds.startFrac + delta))
      const newEnd   = fracToDate(Math.min(1, ds.endFrac   + delta))
      onPendingChange({
        id: ds.id, okrId: ds.okrId, type: 'move',
        label: row?.label || 'Initiative',
        oldStart: fracToDate(ds.startFrac),
        oldEnd:   fracToDate(ds.endFrac),
        newStart, newEnd,
      })
    }
    dragState.current = null
    setTooltip(null); setPreview(null)
    containerRef.current?.releasePointerCapture?.(e.pointerId)
  }, [clientXToFrac, fracToDate, onPendingChange, rows])

  return (
    <div
      ref={containerRef}
      className="relative overflow-x-auto overflow-y-auto flex-1 min-w-0 select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => { if (!dragState.current) { setTooltip(null); setPreview(null) } }}
      onScroll={onScroll}
    >
      {/* Column headers — sticky within x-scroll container */}
      <div className="flex border-b border-border sticky top-0 bg-surface z-10">
        {columns.map(col => (
          <div key={col.key} className="flex-1 min-w-[52px] text-center py-2 px-1 text-[10px] text-ink-faint font-medium border-r border-border/40 last:border-r-0">
            {col.label}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute z-50 pointer-events-none bg-dark border border-gold/40 text-gold text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)' }}>
          {tooltip.text}
        </div>
      )}

      <div className="relative">
        {/* Column grid lines */}
        <div className="absolute inset-0 flex pointer-events-none">
          {columns.map((col) => (
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
          const isHeader = row.type === 'quarter' || row.type === 'okr'
          const rowBg    = rowIdx % 2 === 0 ? '' : 'bg-dark/20'
          const h        = isHeader ? rowHeight + 4 : rowHeight

          if (row.type === 'quarter') {
            return (
              <div key={row.key} style={{ height: h }}
                className="flex items-center px-2 bg-dark/40 border-b border-border/40">
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

          // KR bar — non-draggable, gold/amber tint
          if (row.type === 'kr') {
            const pos = barPosition(row.startDate, row.endDate, columns)
            return (
              <div key={row.key} style={{ height: h }} className={`relative flex items-center ${rowBg}`}>
                {pos ? (
                  <div className="absolute rounded-full opacity-60 bg-gold/70 border border-gold/40"
                    style={{ top: 10, bottom: 10, left: pos.left, width: pos.width, minWidth: 16 }}
                    title={`${row.label} (Key Result)`}
                  >
                    <div className="h-full flex items-center px-2 text-[9px] font-medium text-dark/80 truncate">
                      {parseFloat(pos.width) > 8 ? row.label : ''}
                    </div>
                  </div>
                ) : (
                  <div className="absolute left-1/2 -translate-x-1/2 text-gold opacity-60"
                    title={row.label} style={{ top: '50%', marginTop: -5 }}>
                    <Target size={10} />
                  </div>
                )}
              </div>
            )
          }

          // Initiative bar — draggable
          const pos = barPosition(row.startDate, row.endDate, columns)
          const cfg = INI_STATUS[row.status] || INI_STATUS.not_started
          const isDone = row.status === 'done'

          const rangeStart = columns.length ? columns[0].start.getTime() : 0
          const rangeEnd   = columns.length ? columns[columns.length - 1].end.getTime() : 1
          const total      = rangeEnd - rangeStart || 1
          const startFrac  = row.startDate ? clamp01((row.startDate.getTime() - rangeStart) / total) : 0
          const endFrac    = row.endDate   ? clamp01((row.endDate.getTime()   - rangeStart) / total) : startFrac + 0.05

          const startDrag = (e, type) => {
            e.stopPropagation()
            containerRef.current?.setPointerCapture?.(e.pointerId)
            dragState.current = { type, id: row.id, okrId: row.okrId, startFrac, endFrac, grabFrac: clientXToFrac(e.clientX) }
            setTooltip({ x: 0, y: 0, text: '…' })
          }

          const isDragging  = dragState.current?.id === row.id
          const ghostActive = preview?.rowKey === row.key

          return (
            <div key={row.key} style={{ height: h }} className={`relative flex items-center ${rowBg}`}>
              {pos ? (
                <>
                  {ghostActive && (
                    <div className="absolute rounded-full border-2 border-white/30 pointer-events-none z-10"
                      style={{ top: 8, bottom: 8, left: preview.left, width: preview.width, minWidth: 16,
                        background: 'rgba(255,255,255,.15)', boxShadow: '0 0 0 2px rgba(212,146,14,.6)' }} />
                  )}
                  <div
                    className={`absolute rounded-full flex items-center text-[10px] font-medium text-white/90 overflow-hidden group/bar
                      ${cfg.bar} ${isDone ? 'opacity-70' : 'opacity-90'} hover:opacity-100 transition-opacity
                      ${isDragging ? 'opacity-25' : ''}`}
                    style={{ top: 8, bottom: 8, left: pos.left, width: pos.width, minWidth: 16 }}
                    title={`${row.label} · ${cfg.label}`}>
                    <div className="flex-1 h-full flex items-center px-2 cursor-grab active:cursor-grabbing"
                      onPointerDown={e => startDrag(e, 'move')}>
                      <span className="truncate hidden sm:block leading-none">
                        {parseFloat(pos.width) > 8 ? row.label : ''}
                      </span>
                    </div>
                    <div className="w-2.5 h-full cursor-col-resize shrink-0 flex items-center justify-center hover:bg-white/20 transition-colors"
                      onPointerDown={e => startDrag(e, 'resize')}>
                      <div className="w-0.5 h-3/5 bg-white/50 rounded-full" />
                    </div>
                  </div>
                </>
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
// LEFT PANE — OKR + KR + Initiative tree with ticket count summaries
// ══════════════════════════════════════════════════════════════════════════════
function LeftTree({
  rows, expanded, expandedKrs, toggleOkr, toggleKr,
  onEdit, onOpenIssue, dispatch, lang, statusLabel, allOkrs, width,
  scrollRef, onScroll,
}) {
  const INI_ORDER = ['not_started', 'in_progress', 'done', 'blocked']

  const [dragKey, setDragKey] = useState(null)
  const [overKey, setOverKey] = useState(null)
  const [overPos, setOverPos] = useState('after')
  const containerRef = useRef(null)

  // Connect external scrollRef
  useEffect(() => {
    if (scrollRef) scrollRef.current = containerRef.current
  })

  const dragRow = dragKey ? rows.find(r => r.key === dragKey) : null

  const canDrop = (target) => {
    if (!dragRow || !target || dragRow.key === target.key) return false
    if (dragRow.type === 'okr') return target.type === 'okr'
    if (dragRow.type === 'ini') return target.type === 'ini' || target.type === 'okr'
    return false
  }

  const handleDragOver = (e, row) => {
    if (!canDrop(row)) return
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    setOverKey(row.key)
    setOverPos(e.clientY < rect.top + rect.height / 2 ? 'before' : 'after')
  }

  const handleDrop = (e, targetRow) => {
    e.preventDefault()
    if (!canDrop(targetRow)) { setDragKey(null); setOverKey(null); return }
    if (dragRow.type === 'okr' && targetRow.type === 'okr') {
      const fromIdx = allOkrs.findIndex(o => o.id === dragRow.okrId)
      const toIdx   = allOkrs.findIndex(o => o.id === targetRow.okrId)
      if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx)
        dispatch({ type: OKR_REORDER, fromIndex: fromIdx, toIndex: toIdx })
    } else if (dragRow.type === 'ini') {
      const toOkrId = targetRow.type === 'okr' ? targetRow.okrId : targetRow.okrId
      if (dragRow.okrId !== toOkrId || dragRow.id !== targetRow.id)
        dispatch({ type: INITIATIVE_MOVE, iniId: dragRow.id, fromOkrId: dragRow.okrId, toOkrId, toKrId: null })
    }
    setDragKey(null); setOverKey(null)
  }

  const DropLine = () => (
    <div className="h-0.5 bg-gold/70 rounded-full mx-2 transition-none pointer-events-none" />
  )

  // ── Ticket count pill ────────────────────────────────────────────────────
  const TicketCount = ({ count, done, blocked, label }) => {
    if (!count) return null
    return (
      <div className="flex items-center gap-1 shrink-0">
        <span className="flex items-center gap-0.5 text-[9px] text-ink-faint bg-border/60 px-1.5 py-0.5 rounded-full"
          title={`${count} ${label || 'tickets'}${done ? ` · ${done} done` : ''}${blocked ? ` · ${blocked} blocked` : ''}`}>
          <Hash size={8} className="opacity-60" />
          {count}
          {done > 0 && (
            <span className="text-green-400 font-semibold ml-0.5">{done}✓</span>
          )}
          {blocked > 0 && (
            <span className="text-red-400 font-semibold ml-0.5">{blocked}!</span>
          )}
        </span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="shrink-0 border-r border-border overflow-y-auto"
      style={{ width: width || 280 }}
      onScroll={onScroll}
    >
      <div className="flex items-center px-3 py-2 bg-surface border-b border-border sticky top-0 z-10">
        <span className="text-[10px] uppercase tracking-wider text-ink-faint">Objective / KR / Initiative</span>
      </div>

      {rows.map((row) => {
        const isDropTarget = overKey === row.key && canDrop(row)

        if (row.type === 'quarter') {
          return (
            <div key={row.key} className="flex items-center gap-2 px-3 py-2 bg-dark/40 border-b border-border/40 select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">{row.label}</span>
              <span className="text-[10px] text-ink-faint ml-auto">{row.avgProgress}% avg</span>
            </div>
          )
        }

        if (row.type === 'okr') {
          return (
            <div key={row.key}>
              {isDropTarget && overPos === 'before' && <DropLine />}
              <div
                draggable
                onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragKey(row.key) }}
                onDragOver={e => handleDragOver(e, row)}
                onDragLeave={() => setOverKey(null)}
                onDrop={e => handleDrop(e, row)}
                onDragEnd={() => { setDragKey(null); setOverKey(null) }}
                className={[
                  'flex items-center gap-2 px-3 py-2.5 border-b border-border/50 hover:bg-dark/20 cursor-pointer group transition-colors select-none',
                  dragKey === row.key ? 'opacity-40' : '',
                  isDropTarget ? 'bg-gold/5' : '',
                ].join(' ')}
                onClick={() => toggleOkr(row.okrId)}>
                <span className="text-ink-faint opacity-0 group-hover:opacity-60 cursor-grab active:cursor-grabbing shrink-0 transition-opacity"
                  onClick={e => e.stopPropagation()}><GripVertical size={12} /></span>
                <button className="text-ink-faint shrink-0">
                  {expanded[row.okrId] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink truncate">{row.label}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {row.owner && <Avatar name={row.owner} size="xs" />}
                    <span className="text-[10px] text-ink-faint">{row.krsCount} KRs</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Ticket summary for this OKR */}
                  <TicketCount
                    count={row.totalTickets}
                    done={row.doneTickets}
                    blocked={row.blockedTickets}
                    label="tickets"
                  />
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
              {isDropTarget && overPos === 'after' && <DropLine />}
            </div>
          )
        }

        // ── KR row ───────────────────────────────────────────────────────────
        if (row.type === 'kr') {
          const prog = row.kr?.progress ?? Math.round(((row.kr?.current ?? 0) - (row.kr?.baseline ?? 0)) / Math.max(1, (row.kr?.target ?? 1) - (row.kr?.baseline ?? 0)) * 100)
          return (
            <div key={row.key}>
              <div
                className="flex items-center gap-2 pl-5 pr-3 py-2 border-b border-border/40 hover:bg-dark/15 cursor-pointer group transition-colors select-none"
                onClick={() => toggleKr(row.id)}>
                <button className="text-ink-faint shrink-0">
                  {expandedKrs[row.id] ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>
                <Target size={10} className="text-gold/70 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-ink truncate">{row.label}</p>
                  {row.kr?.target && (
                    <p className="text-[10px] text-ink-faint">{row.kr.current ?? row.kr.baseline ?? 0} / {row.kr.target} {row.kr.unit}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Ticket count for this KR */}
                  <TicketCount
                    count={row.krTickets}
                    done={row.krDoneTickets}
                    blocked={row.krBlockedTickets}
                    label="tickets"
                  />
                  <span className="text-[10px] font-medium text-gold/80">{prog}%</span>
                  <button
                    onClick={e => { e.stopPropagation(); onOpenIssue(row.kr, 'kr') }}
                    className="w-5 h-5 rounded hover:bg-gold/10 text-ink-faint hover:text-gold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Open Key Result">
                    <ExternalLink size={9} />
                  </button>
                </div>
              </div>
            </div>
          )
        }

        // ── Initiative row ────────────────────────────────────────────────────
        if (row.type === 'ini') {
          const cfg  = INI_STATUS[row.status] || INI_STATUS.not_started
          const Icon = cfg.icon
          const pri  = PRIORITY_COLORS[row.priority] || 'text-ink-faint'

          const cycleStatus = (e) => {
            e.stopPropagation()
            const next = INI_ORDER[(INI_ORDER.indexOf(row.status) + 1) % INI_ORDER.length]
            dispatch({ type: INITIATIVE_UPDATE, okrId: row.okrId, initiativeId: row.id, updates: { status: next } })
          }

          return (
            <div key={row.key}>
              {isDropTarget && overPos === 'before' && <DropLine />}
              <div
                draggable
                onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.stopPropagation(); setDragKey(row.key) }}
                onDragOver={e => handleDragOver(e, row)}
                onDragLeave={() => setOverKey(null)}
                onDrop={e => handleDrop(e, row)}
                onDragEnd={() => { setDragKey(null); setOverKey(null) }}
                className={[
                  'flex items-center gap-2 border-b border-border/30 hover:bg-dark/10 group transition-colors',
                  row.isUnderKr ? 'pl-9 pr-3 py-1.5' : 'pl-6 pr-3 py-2',
                  dragKey === row.key ? 'opacity-40' : '',
                  isDropTarget ? 'bg-blue-500/5' : '',
                  row.status === 'blocked' ? 'bg-red-500/5' : '',
                ].join(' ')}>
                <span className="text-ink-faint opacity-0 group-hover:opacity-60 cursor-grab active:cursor-grabbing shrink-0 transition-opacity"
                  onMouseDown={e => e.stopPropagation()}>
                  <GripVertical size={10} />
                </span>
                <button onClick={cycleStatus} className="shrink-0">
                  <Icon size={11} className={`${cfg.color} transition-colors`} />
                </button>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpenIssue(row.ini, 'initiative')}>
                  <p className={`text-[11px] truncate ${row.status === 'done' ? 'line-through text-ink-faint' : 'text-ink hover:text-gold transition-colors'}`}>
                    {row.label}
                  </p>
                </div>
                {row.priority && <span className={`text-[9px] font-bold ${pri} shrink-0`}>{row.priority?.toUpperCase()}</span>}
                {row.owner && <Avatar name={row.owner} size="xs" className="shrink-0" />}
                <button onClick={e => { e.stopPropagation(); dispatch({ type: INITIATIVE_DELETE, okrId: row.okrId, initiativeId: row.id }) }}
                  className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded hover:bg-red-500/10 text-ink-faint hover:text-red-400 flex items-center justify-center shrink-0">
                  <Trash2 size={8} />
                </button>
              </div>
              {isDropTarget && overPos === 'after' && <DropLine />}
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
  const [zoom,         setZoom]         = useState('monthly')
  const [viewMode,     setViewMode]     = useState('gantt')
  const [filterStatus, setFilterStatus] = useState('')
  const [expanded,     setExpanded]     = useState(() => {
    const init = {}; okrs.forEach(o => { init[o.id] = true }); return init
  })
  const [expandedKrs, setExpandedKrs]  = useState({})

  // ── Resizable splitter — default 50% of content area ─────────────────────
  const [splitPos, setSplitPos] = useState(() => {
    if (typeof window === 'undefined') return 340
    // Approximate: window - sidebar (64px) - padding (~40px) → half that
    return Math.round((window.innerWidth - 104) * 0.5)
  })
  const splitDragRef   = useRef(null)

  const handleSplitterDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    splitDragRef.current = { startX: e.clientX, startWidth: splitPos }
  }
  const handleSplitterMove = (e) => {
    if (!splitDragRef.current) return
    const delta    = e.clientX - splitDragRef.current.startX
    const newWidth = Math.max(160, Math.min(720, splitDragRef.current.startWidth + delta))
    setSplitPos(newWidth)
  }
  const handleSplitterUp = () => { splitDragRef.current = null }

  // ── Synchronized scroll between LeftTree and GanttPanel ──────────────────
  const leftScrollRef  = useRef(null)
  const ganttScrollRef = useRef(null)
  const scrollLock     = useRef(false)

  const onLeftScroll = useCallback(() => {
    if (scrollLock.current) return
    scrollLock.current = true
    if (ganttScrollRef.current && leftScrollRef.current) {
      ganttScrollRef.current.scrollTop = leftScrollRef.current.scrollTop
    }
    requestAnimationFrame(() => { scrollLock.current = false })
  }, [])

  const onGanttScroll = useCallback(() => {
    if (scrollLock.current) return
    scrollLock.current = true
    if (leftScrollRef.current && ganttScrollRef.current) {
      leftScrollRef.current.scrollTop = ganttScrollRef.current.scrollTop
    }
    requestAnimationFrame(() => { scrollLock.current = false })
  }, [])

  // ── Edit / create OKR ────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState(null)
  const [editForm,   setEditForm]   = useState({ title: '', quarter: currentQuarter(), owner: '' })
  const [newOpen,    setNewOpen]    = useState(false)
  const [newForm,    setNewForm]    = useState({ title: '', quarter: currentQuarter(), owner: user?.name || '' })

  const openEdit = (okr) => { setEditTarget(okr); setEditForm({ title: okr.title, quarter: okr.quarter, owner: okr.owner || '' }) }
  const saveEdit = () => {
    if (!editForm.title.trim() || !editTarget) return
    dispatch({ type: OKR_UPDATE, id: editTarget.id, updates: { title: editForm.title.trim(), quarter: editForm.quarter, owner: editForm.owner } })
    setEditTarget(null)
  }
  const createOkr = () => {
    if (!newForm.title.trim()) return
    dispatch({ type: OKR_CREATE, ...newForm })
    setNewForm({ title: '', quarter: currentQuarter(), owner: user?.name || '' })
    setNewOpen(false)
  }
  const toggleOkr = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))
  const toggleKr  = (id) => setExpandedKrs(e => ({ ...e, [id]: !e[id] }))

  // ── Issue detail drawer ───────────────────────────────────────────────────
  const [openIssue, setOpenIssue] = useState(null)

  const handleOpenIssue = (item, itemType, okrId) => setOpenIssue({ item, itemType, okrId })

  const handleSaveIssue = (updates) => {
    if (!openIssue) return
    const { item, itemType, okrId } = openIssue
    if (itemType === 'initiative') {
      dispatch({ type: INITIATIVE_UPDATE, okrId, initiativeId: item.id, updates })
    } else if (itemType === 'kr') {
      dispatch({ type: KR_UPDATE, okrId, krId: item.id, updates })
    }
    setOpenIssue(prev => ({ ...prev, item: { ...prev.item, ...updates } }))
  }

  // ── Gantt pending change ──────────────────────────────────────────────────
  const [pendingChange, setPendingChange] = useState(null)

  const confirmGanttChange = (comment) => {
    if (!pendingChange) return
    const { id, okrId, type, newStart, newEnd } = pendingChange
    if (type === 'resize') {
      dispatch({ type: INITIATIVE_UPDATE, okrId, initiativeId: id, updates: { dueDate: newEnd.toISOString().split('T')[0], _lastComment: comment } })
    } else {
      dispatch({ type: INITIATIVE_UPDATE, okrId, initiativeId: id, updates: {
        startDate: newStart.toISOString().split('T')[0],
        dueDate:   newEnd.toISOString().split('T')[0],
        _lastComment: comment,
      }})
    }
    setPendingChange(null)
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const liveOkrs  = okrs.filter(o => !o.archived)
  const allInis   = liveOkrs.flatMap(o => (o.initiatives || []))
  const allDates  = useMemo(() => {
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

  const columns   = useMemo(() => getZoomColumns(zoom, allDates), [zoom, allDates])
  const quarters  = [...new Set(liveOkrs.map(o => o.quarter))].sort()

  // ── Build flat rows for synchronised tree + Gantt ─────────────────────────
  const rows = useMemo(() => {
    const result = []
    quarters.forEach(q => {
      const qOkrs = liveOkrs.filter(o => o.quarter === q)
      const avgProgress = qOkrs.length ? Math.round(qOkrs.reduce((s, o) => s + o.progress, 0) / qOkrs.length) : 0
      result.push({ type: 'quarter', key: `q_${q}`, label: q, avgProgress })

      qOkrs.forEach(okr => {
        const iniDates = (okr.initiatives || []).flatMap(i =>
          [i.startDate ? new Date(i.startDate) : null, i.dueDate ? new Date(i.dueDate) : null].filter(Boolean)
        )
        const krDates = (okr.keyResults || []).flatMap(kr =>
          [kr.startDate ? new Date(kr.startDate) : null, kr.dueDate ? new Date(kr.dueDate) : null].filter(Boolean)
        )
        const allSpanDates = [...iniDates, ...krDates]
        const okrStartDate = allSpanDates.length ? new Date(Math.min(...allSpanDates.map(d => d.getTime()))) : null
        const okrEndDate   = allSpanDates.length ? new Date(Math.max(...allSpanDates.map(d => d.getTime()))) : null

        // Compute ticket summaries for OKR
        const okrAllInis = okr.initiatives || []
        const totalTickets   = okrAllInis.length
        const doneTickets    = okrAllInis.filter(i => i.status === 'done').length
        const blockedTickets = okrAllInis.filter(i => i.status === 'blocked').length

        result.push({
          type: 'okr', key: `okr_${okr.id}`, okrId: okr.id, okr,
          label: okr.title, owner: okr.owner,
          progress: okr.progress, status: okr.status,
          krsCount: okr.keyResults?.length || 0,
          inisCount: totalTickets,
          totalTickets, doneTickets, blockedTickets,
          startDate: okrStartDate, endDate: okrEndDate,
        })

        if (expanded[okr.id]) {
          // ── KR rows ──────────────────────────────────────────────────────
          ;(okr.keyResults || []).forEach(kr => {
            const krAllInis   = (okr.initiatives || []).filter(i => i.krId === kr.id)
            const krTickets       = krAllInis.length
            const krDoneTickets   = krAllInis.filter(i => i.status === 'done').length
            const krBlockedTickets = krAllInis.filter(i => i.status === 'blocked').length

            result.push({
              type: 'kr', key: `kr_${kr.id}`, id: kr.id, okrId: okr.id, kr,
              label: kr.title,
              startDate: kr.startDate ? new Date(kr.startDate) : null,
              endDate:   kr.dueDate   ? new Date(kr.dueDate)   : null,
              krTickets, krDoneTickets, krBlockedTickets,
            })

            // Initiatives under this KR
            if (expandedKrs[kr.id]) {
              const krInis = filterStatus
                ? (okr.initiatives || []).filter(i => i.krId === kr.id && i.status === filterStatus)
                : (okr.initiatives || []).filter(i => i.krId === kr.id)

              krInis.forEach(ini => {
                result.push({
                  type: 'ini', key: `ini_${ini.id}`, id: ini.id, okrId: okr.id, ini,
                  label: ini.title, status: ini.status,
                  owner: ini.owner, priority: ini.priority,
                  startDate: ini.startDate ? new Date(ini.startDate) : null,
                  endDate:   ini.dueDate   ? new Date(ini.dueDate)   : null,
                  isUnderKr: true,
                })
              })
            }
          })

          // ── Orphan initiatives (no krId) ──────────────────────────────────
          const orphanInis = filterStatus
            ? (okr.initiatives || []).filter(i => !i.krId && i.status === filterStatus)
            : (okr.initiatives || []).filter(i => !i.krId)

          orphanInis.forEach(ini => {
            result.push({
              type: 'ini', key: `ini_${ini.id}`, id: ini.id, okrId: okr.id, ini,
              label: ini.title, status: ini.status,
              owner: ini.owner, priority: ini.priority,
              startDate: ini.startDate ? new Date(ini.startDate) : null,
              endDate:   ini.dueDate   ? new Date(ini.dueDate)   : null,
              isUnderKr: false,
            })
          })
        }
      })
    })
    return result
  }, [liveOkrs, expanded, expandedKrs, filterStatus, quarters])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const shippedCount = allInis.filter(i => i.status === 'done').length
  const inDevCount   = allInis.filter(i => i.status === 'in_progress').length
  const toDoCount    = allInis.filter(i => i.status === 'not_started').length
  const blockedCount = allInis.filter(i => i.status === 'blocked').length
  const timelineConf = allInis.length ? Math.round(((shippedCount + inDevCount * 0.6) / allInis.length) * 100) : 0

  // ── Empty state ───────────────────────────────────────────────────────────
  if (liveOkrs.length === 0) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-muted">No objectives on the roadmap yet.</p>
          <Btn size="sm" icon={<Plus size={14} />} onClick={() => setNewOpen(true)}>New Objective</Btn>
        </div>
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-8 flex flex-col items-center justify-center bg-dark/30 border-r border-border">
              <div className="w-full max-w-[240px] space-y-2.5">
                {['80%', '55%', '30%', '92%'].map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-14 h-2 rounded bg-border/60 shrink-0" />
                    <div className="flex-1 h-5 rounded-full bg-border/30 relative overflow-hidden">
                      <div className={`absolute top-1 bottom-1 rounded-full ${i===0?'bg-gold/50':i===1?'bg-blue-500/50':i===2?'bg-success/50':'bg-gold/30'}`}
                        style={{ left: `${i*8}%`, width: w }} />
                    </div>
                  </div>
                ))}
                <div className="w-px h-8 bg-gold/60 mx-auto mt-2" />
              </div>
            </div>
            <div className="p-8 flex flex-col justify-center">
              <p className="text-[10px] uppercase tracking-widest text-gold mb-2">Strategic Clarity</p>
              <h2 className="text-xl font-bold text-ink mb-3">Master your delivery flow</h2>
              <p className="text-sm text-ink-muted mb-5 leading-relaxed">
                Visualise your strategic delivery timeline and identify dependencies before they cause delays.
              </p>
              <Btn icon={<Plus size={14} />} onClick={() => setNewOpen(true)}>Create First Objective</Btn>
            </div>
          </div>
        </div>
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

  // ── Full view ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full animate-fade-in" style={{ minHeight: 0 }}>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-0.5 bg-surface border border-border rounded-lg p-0.5">
          {[{ id: 'gantt', icon: AlignLeft, label: 'Gantt' }, { id: 'list', icon: Layers, label: 'List' }].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === v.id ? 'bg-gold/10 text-gold' : 'text-ink-muted hover:text-ink'}`}>
              <v.icon size={12} />{v.label}
            </button>
          ))}
        </div>

        {viewMode === 'gantt' && (
          <div className="flex items-center gap-0.5 bg-surface border border-border rounded-lg p-0.5">
            {['monthly', 'quarterly', 'yearly'].map(z => (
              <button key={z} onClick={() => setZoom(z)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${zoom === z ? 'bg-surface text-ink shadow-sm border border-border' : 'text-ink-muted hover:text-ink'}`}>
                {z === 'monthly' ? 'Monthly' : z === 'quarterly' ? 'Quarterly' : 'Yearly'}
              </button>
            ))}
          </div>
        )}

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-ink-muted outline-none focus:border-gold/40 ml-auto">
          <option value="">All Statuses</option>
          {Object.entries(INI_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        <Btn size="sm" icon={<Plus size={13} />} onClick={() => setNewOpen(true)}>New Objective</Btn>
      </div>

      {/* Main content */}
      {viewMode === 'list' ? (
        <div className="space-y-3 overflow-y-auto flex-1">
          {quarters.map(q => {
            const qOkrs = liveOkrs.filter(o => o.quarter === q)
            const avgProgress = qOkrs.length ? Math.round(qOkrs.reduce((s, o) => s + o.progress, 0) / qOkrs.length) : 0
            return (
              <Card key={q}>
                <CardHeader title={q} subtitle={`${qOkrs.length} objectives · avg ${avgProgress}%`}
                  action={<div className="flex items-center gap-2"><ProgressBar value={avgProgress} size="xs" className="w-20" /><span className="text-xs text-ink-muted">{avgProgress}%</span></div>} />
                <div className="space-y-2">
                  {qOkrs.map(okr => {
                    const inis = okr.initiatives || [], doneIni = inis.filter(i => i.status === 'done').length
                    const blockedIni = inis.filter(i => i.status === 'blocked').length
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
                              {inis.length > 0 && (
                                <span className="text-xs text-ink-faint">
                                  {doneIni}/{inis.length} done
                                  {blockedIni > 0 && <span className="text-red-400 ml-1">· {blockedIni} blocked</span>}
                                </span>
                              )}
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
                              const cfg = INI_STATUS[ini.status] || INI_STATUS.not_started
                              const Icon = cfg.icon
                              return (
                                <div key={ini.id}
                                  className="flex items-center gap-2.5 pl-10 pr-3 py-1.5 hover:bg-dark/40 group cursor-pointer transition-colors"
                                  onClick={() => handleOpenIssue(ini, 'initiative', okr.id)}>
                                  <Icon size={12} className={`${cfg.color} shrink-0`} />
                                  <span className={`text-xs flex-1 truncate ${ini.status === 'done' ? 'line-through text-ink-faint' : 'text-ink hover:text-gold'}`}>{ini.title}</span>
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
        /* GANTT VIEW — synchronized scroll between left tree and timeline */
        <div className="flex flex-1 border border-border rounded-xl overflow-hidden bg-surface" style={{ minHeight: 400 }}>
          <LeftTree
            rows={rows}
            expanded={expanded}
            expandedKrs={expandedKrs}
            toggleOkr={toggleOkr}
            toggleKr={toggleKr}
            onEdit={openEdit}
            onOpenIssue={(item, type) => handleOpenIssue(item, type, item.okrId || item.parentOkrId)}
            dispatch={dispatch}
            lang={lang}
            statusLabel={statusLabel}
            allOkrs={okrs}
            width={splitPos}
            scrollRef={leftScrollRef}
            onScroll={onLeftScroll}
          />

          {/* ── Resizable splitter ─────────────────────────────────── */}
          <div
            className="w-1.5 shrink-0 bg-border/50 hover:bg-gold/50 active:bg-gold cursor-col-resize transition-colors z-10 flex items-center justify-center group"
            onPointerDown={handleSplitterDown}
            onPointerMove={handleSplitterMove}
            onPointerUp={handleSplitterUp}
            title="Drag to resize panels">
            <div className="w-0.5 h-8 rounded-full bg-border group-hover:bg-gold/60 transition-colors" />
          </div>

          <GanttPanel
            rows={rows}
            columns={columns}
            rowHeight={36}
            onPendingChange={setPendingChange}
            scrollRef={ganttScrollRef}
            onScroll={onGanttScroll}
          />
        </div>
      )}

      {/* Stats bar */}
      {liveOkrs.length > 0 && (
        <div className="flex items-center gap-4 mt-3 px-1 flex-wrap">
          <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
            {[
              { color: 'bg-success', count: shippedCount, label: 'shipped' },
              { color: 'bg-blue-500', count: inDevCount, label: 'in dev' },
              { color: 'bg-ink-faint/50', count: toDoCount, label: 'to do' },
              ...(blockedCount > 0 ? [{ color: 'bg-red-500', count: blockedCount, label: 'blocked' }] : []),
            ].map(s => (
              <span key={s.label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${s.color} inline-block`} />
                {s.count} {s.label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-ink-muted">Timeline Confidence:</span>
            <ProgressBar value={timelineConf} size="xs" className="w-24" />
            <span className="text-xs font-semibold text-gold">{timelineConf}%</span>
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────── */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New Objective"
        footer={<><Btn variant="secondary" size="sm" onClick={() => setNewOpen(false)}>Cancel</Btn><Btn size="sm" onClick={createOkr} disabled={!newForm.title.trim()}>Save</Btn></>}>
        <div className="space-y-4">
          <Input label="Objective Title" value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))} autoFocus onKeyDown={e => e.key === 'Enter' && createOkr()} />
          <Select label="Quarter" value={newForm.quarter} onChange={e => setNewForm(f => ({ ...f, quarter: e.target.value }))} options={QUARTERS.map(q => ({ value: q, label: q }))} />
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

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Objective"
        footer={<><Btn variant="secondary" size="sm" onClick={() => setEditTarget(null)}>Cancel</Btn><Btn size="sm" onClick={saveEdit} disabled={!editForm.title.trim()}>Save</Btn></>}>
        <div className="space-y-4">
          <Input label="Objective Title" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} autoFocus onKeyDown={e => e.key === 'Enter' && saveEdit()} />
          <Select label="Quarter" value={editForm.quarter} onChange={e => setEditForm(f => ({ ...f, quarter: e.target.value }))} options={QUARTERS.map(q => ({ value: q, label: q }))} />
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

      <GanttConfirmModal
        change={pendingChange}
        onConfirm={confirmGanttChange}
        onCancel={() => setPendingChange(null)}
      />

      <IssueDetailDrawer
        open={!!openIssue}
        onClose={() => setOpenIssue(null)}
        item={openIssue?.item}
        itemType={openIssue?.itemType}
        onSave={handleSaveIssue}
        currentUser={user?.name || 'You'}
      />
    </div>
  )
}

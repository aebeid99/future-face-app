import { useState, useRef } from 'react'
import {
  Star, Plus, ChevronDown, ChevronRight, Edit2, Trash2, Check,
  Target, TrendingUp, AlertTriangle, Clock, GripVertical,
  BarChart2, Shield, X, Save, ChevronUp,
} from 'lucide-react'
import { useApp } from '@/state/AppContext'
import {
  OKR_CREATE, OKR_UPDATE, OKR_DELETE, OKR_REORDER,
  KR_CREATE, KR_UPDATE, KR_DELETE,
  NORTHSTAR_SET,
} from '@/state/actions'
import Btn from '@/components/ui/Btn'
import Badge from '@/components/ui/Badge'

// ── Status config ───────────────────────────────────────────────────────────
const STATUS_CFG = {
  not_started: { label: 'Not Started', color: 'text-ink-muted bg-border',        dot: 'bg-gray-400'  },
  on_track:    { label: 'On Track',    color: 'text-green-300 bg-green-500/15',   dot: 'bg-green-400' },
  at_risk:     { label: 'At Risk',     color: 'text-amber-300 bg-amber-500/15',   dot: 'bg-amber-400' },
  off_track:   { label: 'Off Track',   color: 'text-red-300 bg-red-500/15',       dot: 'bg-red-400'   },
  completed:   { label: 'Completed',   color: 'text-blue-300 bg-blue-500/15',     dot: 'bg-blue-400'  },
  paused:      { label: 'Paused',      color: 'text-gray-300 bg-gray-500/15',     dot: 'bg-gray-400'  },
}

const CADENCE_OPTIONS = ['Weekly', 'Monthly', 'Quarterly', 'Annual']
const BLANK_OKR = { title: '', owner: '', cadence: 'Quarterly', status: 'not_started', confidence: 60, summary: '' }
const BLANK_KR  = { title: '', type: 'numeric', current: '', target: '', unit: '%', dueDate: '' }

// ── Helpers ─────────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.not_started
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function ConfidenceBar({ value }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-ink-muted w-8 text-right">{value}%</span>
    </div>
  )
}

// ── North Star Section ───────────────────────────────────────────────────────
function NorthStarSection({ northStar, isAdmin }) {
  const { dispatch } = useApp()
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState(northStar)

  const save = () => {
    dispatch({ type: NORTHSTAR_SET, updates: { ...form, target: Number(form.target), current: Number(form.current) } })
    setEditing(false)
  }
  const pct = northStar.target > 0 ? Math.min(100, Math.round((northStar.current / northStar.target) * 100)) : 0

  return (
    <div className="bg-surface border border-border rounded-xl p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gold/15 flex items-center justify-center">
            <Star size={14} className="text-gold" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-ink-muted tracking-widest uppercase">North Star</p>
            <p className="text-xs text-ink-muted">Single measurable north star metric for the business</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditing(!editing); setForm(northStar) }}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-border transition-colors">
            {editing ? <X size={14} /> : <Edit2 size={14} />}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="ff-label">North Star Title</label>
              <input className="ff-input text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Weekly Active Paying Workspaces" />
            </div>
            <div>
              <label className="ff-label">Metric Label</label>
              <input className="ff-input text-sm" value={form.metricLabel} onChange={e => setForm(f => ({ ...f, metricLabel: e.target.value }))} placeholder="WAW" />
            </div>
            <div>
              <label className="ff-label">Target</label>
              <input type="number" className="ff-input text-sm" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} placeholder="1500" />
            </div>
          </div>
          <div>
            <label className="ff-label">Current Value</label>
            <input type="number" className="ff-input text-sm w-40" value={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.value }))} placeholder="124" />
          </div>
          <div className="flex gap-2 pt-1">
            <Btn size="sm" variant="primary" onClick={save}><Save size={12} />Save North Star</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Btn>
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-6">
          <div>
            <p className="text-2xl font-bold text-ink">{northStar.title || '—'}</p>
            <p className="text-xs text-ink-muted mt-0.5">Metric: <span className="text-gold font-semibold">{northStar.metricLabel || '—'}</span></p>
          </div>
          <div className="flex-1 min-w-0 pb-0.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-ink-muted">Progress</span>
              <span className="text-xs font-semibold text-ink">{northStar.current.toLocaleString()} <span className="text-ink-muted font-normal">/ {northStar.target.toLocaleString()}</span></span>
            </div>
            <div className="h-2 bg-dark rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-right text-[10px] text-ink-muted mt-1">{pct}% of target</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── OKR Card (left list) ─────────────────────────────────────────────────────
function OKRCard({ okr, selected, onClick, onDelete, dragHandlers, isDragging, isOver }) {
  const krCount = (okr.keyResults || []).length
  const sCfg    = STATUS_CFG[okr.status] || STATUS_CFG.not_started

  return (
    <div
      {...dragHandlers}
      onClick={onClick}
      className={[
        'group relative flex items-start gap-2 p-4 rounded-xl border cursor-pointer transition-all',
        selected     ? 'border-gold/60 bg-gold/5 shadow-[0_0_0_1px_rgba(212,146,14,0.4)]' : 'border-border bg-surface hover:border-border-hover hover:bg-surface-hover',
        isDragging   ? 'opacity-30 scale-95' : '',
        isOver       ? 'border-gold/60 bg-gold/5' : '',
      ].join(' ')}
    >
      {/* Drag handle */}
      <div className="mt-0.5 text-ink-faint group-hover:text-ink-muted cursor-grab active:cursor-grabbing touch-none">
        <GripVertical size={14} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-semibold text-ink leading-snug">{okr.title}</p>
          <button
            onClick={e => { e.stopPropagation(); onDelete(okr.id) }}
            className="opacity-0 group-hover:opacity-100 p-1 text-ink-faint hover:text-red-400 transition-all flex-shrink-0"
          >
            <Trash2 size={12} />
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-ink-muted">{okr.owner} · {okr.cadence || 'Quarterly'}</span>
          <StatusPill status={okr.status} />
          {krCount > 0 && (
            <span className="text-[10px] font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-full">
              {krCount} KR{krCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {okr.confidence !== undefined && (
          <div className="mt-2">
            <ConfidenceBar value={okr.confidence} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Selected OKR Detail Panel ────────────────────────────────────────────────
function OKRDetailPanel({ okr, onClose }) {
  const { dispatch } = useApp()
  const [form, setForm] = useState({ title: okr.title, owner: okr.owner || '', cadence: okr.cadence || 'Quarterly', status: okr.status || 'not_started', confidence: okr.confidence ?? 60, summary: okr.summary || '' })
  const [addKR, setAddKR] = useState(false)
  const [krForm, setKrForm] = useState(BLANK_KR)
  const [editingKrId, setEditingKrId] = useState(null)
  const [editKrForm, setEditKrForm] = useState({})

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const dirty = JSON.stringify(form) !== JSON.stringify({ title: okr.title, owner: okr.owner || '', cadence: okr.cadence || 'Quarterly', status: okr.status || 'not_started', confidence: okr.confidence ?? 60, summary: okr.summary || '' })

  const saveOKR = () => {
    dispatch({ type: OKR_UPDATE, id: okr.id, updates: { ...form, confidence: Number(form.confidence) } })
  }

  const saveNewKR = () => {
    if (!krForm.title.trim()) return
    dispatch({ type: KR_CREATE, okrId: okr.id, ...krForm, krType: krForm.type })
    setKrForm(BLANK_KR)
    setAddKR(false)
  }

  const saveEditKR = (krId) => {
    dispatch({ type: KR_UPDATE, okrId: okr.id, krId, updates: editKrForm })
    setEditingKrId(null)
  }

  const deleteKR = (krId) => {
    dispatch({ type: KR_DELETE, okrId: okr.id, krId })
  }

  const krs = okr.keyResults || []

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 pb-4 border-b border-border">
        <div>
          <p className="text-[10px] font-semibold text-gold tracking-widest uppercase mb-1">Selected Objective</p>
          <h2 className="text-xl font-bold text-ink">{okr.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">{krs.length} key result{krs.length !== 1 ? 's' : ''}</span>
          <button onClick={onClose} className="p-1.5 text-ink-muted hover:text-ink hover:bg-border rounded-lg transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Edit form */}
        <div className="bg-dark rounded-xl p-4 space-y-3">
          <div>
            <label className="ff-label">Objective Title</label>
            <input className="ff-input text-sm" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ff-label">Owner</label>
              <input className="ff-input text-sm" value={form.owner} onChange={e => set('owner', e.target.value)} />
            </div>
            <div>
              <label className="ff-label">Cadence</label>
              <select className="ff-input text-sm" value={form.cadence} onChange={e => set('cadence', e.target.value)}>
                {CADENCE_OPTIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ff-label">Status</label>
              <select className="ff-input text-sm" value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="ff-label">Confidence %</label>
              <input type="number" min={0} max={100} className="ff-input text-sm" value={form.confidence} onChange={e => set('confidence', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="ff-label">Summary</label>
            <textarea className="ff-input text-sm resize-none" rows={2} value={form.summary} onChange={e => set('summary', e.target.value)} />
          </div>
          {dirty && (
            <div className="flex gap-2">
              <Btn size="sm" variant="primary" onClick={saveOKR}><Save size={12} />Save Changes</Btn>
              <Btn size="sm" variant="ghost" onClick={() => setForm({ title: okr.title, owner: okr.owner || '', cadence: okr.cadence || 'Quarterly', status: okr.status || 'not_started', confidence: okr.confidence ?? 60, summary: okr.summary || '' })}>Reset</Btn>
            </div>
          )}
        </div>

        {/* Key Results */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-ink-muted tracking-widest uppercase">Key Results</p>
            <Btn size="xs" variant="ghost" onClick={() => setAddKR(!addKR)}>
              <Plus size={12} />Add KR
            </Btn>
          </div>

          {/* Add KR form */}
          {addKR && (
            <div className="bg-dark border border-gold/30 rounded-xl p-4 mb-3 space-y-3">
              <p className="text-xs font-semibold text-gold">New Key Result</p>
              <input className="ff-input text-sm" placeholder="KR title…" value={krForm.title} onChange={e => setKrForm(f => ({ ...f, title: e.target.value }))} autoFocus />
              <div className="grid grid-cols-3 gap-2">
                <input type="number" className="ff-input text-sm" placeholder="Current" value={krForm.current} onChange={e => setKrForm(f => ({ ...f, current: e.target.value }))} />
                <input type="number" className="ff-input text-sm" placeholder="Target" value={krForm.target} onChange={e => setKrForm(f => ({ ...f, target: e.target.value }))} />
                <input className="ff-input text-sm" placeholder="Unit (%, deals…)" value={krForm.unit} onChange={e => setKrForm(f => ({ ...f, unit: e.target.value }))} />
              </div>
              <input type="date" className="ff-input text-sm" value={krForm.dueDate} onChange={e => setKrForm(f => ({ ...f, dueDate: e.target.value }))} />
              <div className="flex gap-2">
                <Btn size="sm" variant="primary" onClick={saveNewKR}>Add Key Result</Btn>
                <Btn size="sm" variant="ghost" onClick={() => { setAddKR(false); setKrForm(BLANK_KR) }}>Cancel</Btn>
              </div>
            </div>
          )}

          {krs.length === 0 && !addKR && (
            <div className="text-center py-8 text-ink-muted text-sm border border-dashed border-border rounded-xl">
              No key results yet.{' '}
              <button className="text-gold hover:underline" onClick={() => setAddKR(true)}>Add the first KR</button>
            </div>
          )}

          <div className="space-y-2">
            {krs.map(kr => (
              <div key={kr.id} className="group bg-dark rounded-xl border border-border p-4 hover:border-border-hover transition-all">
                {editingKrId === kr.id ? (
                  <div className="space-y-2">
                    <input className="ff-input text-sm" value={editKrForm.title} onChange={e => setEditKrForm(f => ({ ...f, title: e.target.value }))} />
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" className="ff-input text-sm" placeholder="Current" value={editKrForm.current ?? kr.current} onChange={e => setEditKrForm(f => ({ ...f, current: e.target.value }))} />
                      <input type="number" className="ff-input text-sm" placeholder="Target" value={editKrForm.target ?? kr.target} onChange={e => setEditKrForm(f => ({ ...f, target: e.target.value }))} />
                      <input className="ff-input text-sm" placeholder="Unit" value={editKrForm.unit ?? kr.unit} onChange={e => setEditKrForm(f => ({ ...f, unit: e.target.value }))} />
                    </div>
                    <input type="date" className="ff-input text-sm" value={editKrForm.dueDate ?? kr.dueDate ?? ''} onChange={e => setEditKrForm(f => ({ ...f, dueDate: e.target.value }))} />
                    <div className="flex gap-2">
                      <Btn size="xs" variant="primary" onClick={() => saveEditKR(kr.id)}>Save</Btn>
                      <Btn size="xs" variant="ghost" onClick={() => setEditingKrId(null)}>Cancel</Btn>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-ink">{kr.title}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingKrId(kr.id); setEditKrForm({ title: kr.title, current: kr.current, target: kr.target, unit: kr.unit, dueDate: kr.dueDate }) }}
                          className="p-1 text-ink-faint hover:text-ink rounded transition-colors">
                          <Edit2 size={11} />
                        </button>
                        <button onClick={() => deleteKR(kr.id)}
                          className="p-1 text-ink-faint hover:text-red-400 rounded transition-colors">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <StatusPill status={kr.status} />
                      {kr.dueDate && <span className="text-[10px] text-ink-muted">Due {kr.dueDate}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-ink-muted">Current: <span className="text-ink font-medium">{kr.current} {kr.unit}</span></span>
                      <span className="text-xs text-ink-muted">Target: <span className="text-ink font-medium">{kr.target} {kr.unit}</span></span>
                    </div>
                    {/* Progress bar */}
                    {kr.target > 0 && (
                      <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gold/60 transition-all"
                          style={{ width: `${Math.min(100, Math.round((kr.current / kr.target) * 100))}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Strategy Page ───────────────────────────────────────────────────────
export default function StrategyPage() {
  const { state, dispatch }   = useApp()
  const { okrs, northStar, user } = state
  const [selectedId, setSelectedId] = useState(null)
  const [showAddOKR, setShowAddOKR] = useState(false)
  const [form, setForm]             = useState(BLANK_OKR)

  // Drag state
  const [dragIdx, setDragIdx]   = useState(null)
  const [overIdx, setOverIdx]   = useState(null)

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin' || true // always true for demo

  const selectedOkr = okrs.find(o => o.id === selectedId)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addOKR = () => {
    if (!form.title.trim()) return
    dispatch({ type: OKR_CREATE, ...form })
    setForm(BLANK_OKR)
    setShowAddOKR(false)
  }

  const deleteOKR = (id) => {
    dispatch({ type: OKR_DELETE, id })
    if (selectedId === id) setSelectedId(null)
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const handleDragStart = (e, idx) => {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, idx) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverIdx(idx)
  }

  const handleDrop = (e, idx) => {
    e.preventDefault()
    if (dragIdx !== null && dragIdx !== idx) {
      dispatch({ type: OKR_REORDER, fromIndex: dragIdx, toIndex: idx })
    }
    setDragIdx(null)
    setOverIdx(null)
  }

  const handleDragEnd = () => {
    setDragIdx(null)
    setOverIdx(null)
  }

  return (
    <div className="p-0 max-w-screen-xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-semibold text-ink-muted tracking-widest uppercase mb-1">Phase 2 — Strategy Core</p>
          <h1 className="text-2xl font-bold text-ink">North Star, Objectives, and Key Results</h1>
          <p className="text-ink-muted text-sm mt-0.5">Configure your company direction and manage OKRs visible to all teams.</p>
        </div>
      </div>

      {/* North Star */}
      <NorthStarSection northStar={northStar} isAdmin={isAdmin} />

      {/* Two-column layout */}
      <div className={`grid gap-5 ${selectedOkr ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl'}`}>

        {/* Left: OKR List */}
        <div>
          {/* Section header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-semibold text-ink-muted tracking-widest uppercase">Business Objectives</p>
              <p className="text-base font-bold text-ink">Company direction</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted italic">Up to 6 recommended</span>
              <Btn size="sm" variant="primary" onClick={() => setShowAddOKR(!showAddOKR)}>
                <Plus size={13} />New Objective
              </Btn>
            </div>
          </div>

          {/* OKR cards (draggable) */}
          <div className="space-y-2 mb-4" onDragOver={e => e.preventDefault()}>
            {okrs.map((okr, idx) => (
              <OKRCard
                key={okr.id}
                okr={okr}
                selected={selectedId === okr.id}
                onClick={() => setSelectedId(selectedId === okr.id ? null : okr.id)}
                onDelete={deleteOKR}
                isDragging={dragIdx === idx}
                isOver={overIdx === idx && dragIdx !== null && dragIdx !== idx}
                dragHandlers={{
                  draggable: true,
                  onDragStart: (e) => handleDragStart(e, idx),
                  onDragOver:  (e) => handleDragOver(e, idx),
                  onDrop:      (e) => handleDrop(e, idx),
                  onDragEnd:   handleDragEnd,
                }}
              />
            ))}
            {okrs.length === 0 && !showAddOKR && (
              <div className="text-center py-10 border border-dashed border-border rounded-xl text-ink-muted text-sm">
                No objectives yet.{' '}
                <button className="text-gold hover:underline" onClick={() => setShowAddOKR(true)}>Add the first one</button>
              </div>
            )}
          </div>

          {/* Add Objective form */}
          {showAddOKR && (
            <div className="bg-surface border border-gold/30 rounded-xl p-5">
              <p className="text-sm font-bold text-ink mb-4">Add Objective</p>
              <div className="space-y-3">
                <div>
                  <label className="ff-label">Objective Title *</label>
                  <input className="ff-input text-sm" placeholder="e.g. Grow private-sector SaaS adoption" value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="ff-label">Owner</label>
                    <input className="ff-input text-sm" placeholder="CEO, Product Lead…" value={form.owner} onChange={e => set('owner', e.target.value)} />
                  </div>
                  <div>
                    <label className="ff-label">Cadence</label>
                    <select className="ff-input text-sm" value={form.cadence} onChange={e => set('cadence', e.target.value)}>
                      {CADENCE_OPTIONS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="ff-label">Status</label>
                    <select className="ff-input text-sm" value={form.status} onChange={e => set('status', e.target.value)}>
                      {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="ff-label">Confidence %</label>
                    <input type="number" min={0} max={100} className="ff-input text-sm" value={form.confidence} onChange={e => set('confidence', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="ff-label">Summary</label>
                  <input className="ff-input text-sm" placeholder="One-line description of this objective…" value={form.summary} onChange={e => set('summary', e.target.value)} />
                </div>
                <div className="flex gap-2 pt-1">
                  <Btn variant="primary" onClick={addOKR} disabled={!form.title.trim()}>Add Objective</Btn>
                  <Btn variant="ghost" onClick={() => { setShowAddOKR(false); setForm(BLANK_OKR) }}>Cancel</Btn>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Selected OKR detail */}
        {selectedOkr && (
          <div className="bg-surface border border-border rounded-xl p-5 min-h-[500px]">
            <OKRDetailPanel okr={selectedOkr} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>
    </div>
  )
}

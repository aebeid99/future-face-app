import { useState, useRef, useEffect } from 'react'
import {
  Plus, Target, ChevronDown, ChevronRight, Trash2, Sparkles,
  Send, Bot, X, Check, TrendingUp, CheckSquare, MessageSquare,
  Archive, RotateCcw, Flag, Calendar, Circle, CheckCircle2,
  AlertCircle, MinusCircle, Clock, Pencil, Zap, Share2,
  MoreHorizontal, DollarSign, Link2, ChevronUp,
} from 'lucide-react'
import Card from '../../components/ui/Card.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Modal from '../../components/ui/Modal.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import ProgressRing from '../../components/ui/ProgressRing.jsx'
import Avatar from '../../components/ui/Avatar.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useApp } from '../../state/AppContext.jsx'
import {
  OKR_CREATE, OKR_UPDATE, OKR_DELETE,
  KR_CREATE, KR_UPDATE, KR_DELETE,
  INITIATIVE_CREATE, INITIATIVE_UPDATE, INITIATIVE_DELETE,
  CHECKIN_ADD, CHECKIN_DELETE,
  CHAT_ADD, CHAT_UPDATE_LAST,
  HIGHLIGHT,
} from '../../state/actions.js'
import { t } from '../../utils/i18n.js'
import { currentQuarter, quarterList, formatRelative } from '../../utils/formatting.js'
import { streamChat, SYSTEM_PROMPTS } from '../../api/anthropic.js'
import { calcKrProgress, formatKrValue, KR_TYPES, KR_UNITS } from '../../utils/krMetrics.js'

const QUARTERS  = quarterList(8)

// ─── Initiative statuses ───────────────────────────────────────────────────────
const INI_STATUSES = {
  not_started: { label: 'Not Started', icon: Circle,       color: 'text-ink-muted',  bg: 'bg-surface'          },
  in_progress: { label: 'In Dev',      icon: Clock,        color: 'text-blue-400',   bg: 'bg-blue-500/10'      },
  done:        { label: 'Shipped',     icon: CheckCircle2, color: 'text-success',    bg: 'bg-success/10'       },
  blocked:     { label: 'Blocked',     icon: MinusCircle,  color: 'text-error',      bg: 'bg-red-500/10'       },
}

const PRIORITY_CFG = {
  p1: { label: 'P1', bg: 'bg-red-500/15 text-red-400',    border: 'border-red-500/30'    },
  p2: { label: 'P2', bg: 'bg-gold/15 text-gold',          border: 'border-gold/30'       },
  p3: { label: 'P3', bg: 'bg-surface text-ink-muted',     border: 'border-border'        },
}

// ─── Check-in status colours ──────────────────────────────────────────────────
const CI_VARIANT = { on_track: 'success', at_risk: 'warning', off_track: 'error' }

// ─── KR status options ────────────────────────────────────────────────────────
const KR_STATUSES = [
  { value: 'on_track',  label: 'On Track'  },
  { value: 'at_risk',   label: 'At Risk'   },
  { value: 'off_track', label: 'Off Track' },
  { value: 'completed', label: 'Completed' },
]

// ══════════════════════════════════════════════════════════════════════════════
// KR ADD ROW  — type-aware (Boolean / Numeric / Milestone) + tags
// ══════════════════════════════════════════════════════════════════════════════
function KrAddRow({ okrId, onDone }) {
  const { dispatch } = useApp()
  const [form, setForm] = useState({
    type: 'numeric', title: '', baseline: '0', current: '0', target: '100', unit: '%',
    done: false, startDate: '', dueDate: '', progressOverride: '', tags: [],
  })
  const [tagInput, setTagInput] = useState('')
  const titleRef = useRef(null)
  useEffect(() => { titleRef.current?.focus() }, [])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) set('tags', [...form.tags, tag])
    setTagInput('')
  }

  const save = () => {
    if (!form.title.trim()) return
    if (form.type === 'numeric'   && !form.target)  return
    if (form.type === 'milestone' && !form.dueDate) return
    dispatch({ type: KR_CREATE, okrId,
      title: form.title, krType: form.type, tags: form.tags,
      baseline: parseFloat(form.baseline) || 0,
      current:  parseFloat(form.current)  || 0,
      target:   parseFloat(form.target)   || 100,
      unit:     form.unit,
      done: form.done,
      startDate:        form.startDate,
      dueDate:          form.dueDate,
      progressOverride: form.progressOverride !== '' ? parseFloat(form.progressOverride) : undefined,
    })
    onDone()
  }

  return (
    <div className="rounded-xl bg-gold/5 border border-gold/25 p-3 space-y-2.5 animate-fade-in">
      <div className="flex items-center gap-2">
        <select value={form.type} onChange={e => set('type', e.target.value)}
          className="bg-dark border border-border rounded px-2 py-1.5 text-xs text-ink-muted outline-none focus:border-gold/60 w-36 shrink-0">
          {KR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input ref={titleRef} value={form.title} onChange={e => set('title', e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="Key result title…"
          className="flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink-muted min-w-0" />
        <button onClick={save} className="w-7 h-7 rounded bg-gold/20 hover:bg-gold/30 text-gold flex items-center justify-center shrink-0" title="Save KR">
          <Check size={12} />
        </button>
        <button onClick={onDone} className="w-7 h-7 rounded hover:bg-border text-ink-muted flex items-center justify-center shrink-0">
          <X size={12} />
        </button>
      </div>
      {form.type === 'numeric' && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-ink-faint">From</span>
          <input type="number" value={form.baseline} onChange={e => set('baseline', e.target.value)}
            placeholder="0" className="w-16 bg-dark border border-border rounded px-2 py-1 text-xs text-ink text-center outline-none focus:border-gold/60" />
          <span className="text-[10px] text-ink-faint">Current</span>
          <input type="number" value={form.current} onChange={e => set('current', e.target.value)}
            placeholder="0" className="w-16 bg-dark border border-border rounded px-2 py-1 text-xs text-ink text-center outline-none focus:border-gold/60" />
          <span className="text-[10px] text-ink-faint">Target</span>
          <input type="number" value={form.target} onChange={e => set('target', e.target.value)}
            placeholder="100" className="w-16 bg-dark border border-border rounded px-2 py-1 text-xs text-ink text-center outline-none focus:border-gold/60" />
          <select value={form.unit} onChange={e => set('unit', e.target.value)}
            className="bg-dark border border-border rounded px-1.5 py-1 text-xs text-ink-muted outline-none focus:border-gold/60 w-16">
            {KR_UNITS.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
      )}
      {form.type === 'boolean' && (
        <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
          <input type="checkbox" checked={form.done} onChange={e => set('done', e.target.checked)} className="accent-gold w-4 h-4 rounded" />
          Mark as done already
        </label>
      )}
      {form.type === 'milestone' && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-ink-faint">Start</span>
          <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
            className="bg-dark border border-border rounded px-2 py-1 text-xs text-ink outline-none focus:border-gold/60 w-32" />
          <span className="text-[10px] text-ink-faint">Due</span>
          <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
            className="bg-dark border border-border rounded px-2 py-1 text-xs text-ink outline-none focus:border-gold/60 w-32" />
          <span className="text-[10px] text-ink-faint">Progress override %</span>
          <input type="number" min={0} max={100} value={form.progressOverride} onChange={e => set('progressOverride', e.target.value)}
            placeholder="auto" className="w-16 bg-dark border border-border rounded px-2 py-1 text-xs text-ink text-center outline-none focus:border-gold/60" />
        </div>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-ink-faint shrink-0">Tags:</span>
        {form.tags.map(tag => (
          <span key={tag} className="flex items-center gap-0.5 text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full">
            {tag}
            <button onClick={() => set('tags', form.tags.filter(t => t !== tag))} className="ml-0.5 hover:text-white"><X size={8} /></button>
          </span>
        ))}
        <input value={tagInput} onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
          placeholder="Add tag + Enter"
          className="bg-transparent text-[10px] text-ink outline-none placeholder:text-ink-faint w-24" />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// KR ROW  — type-aware display + full edit mode
// ══════════════════════════════════════════════════════════════════════════════
function KrRow({ kr, okrId }) {
  const { dispatch } = useApp()
  const type = kr.type || 'numeric'
  const [editing,  setEditing]  = useState(false)
  const [editForm, setEditForm] = useState({})
  const [tagInput, setTagInput] = useState('')
  const editTitleRef = useRef(null)

  const pct    = calcKrProgress(kr)
  const valStr = formatKrValue(kr)

  const openEdit = () => {
    setEditForm({
      title: kr.title, type: kr.type || 'numeric', tags: kr.tags || [],
      baseline: String(kr.baseline ?? 0), current: String(kr.current ?? 0),
      target: String(kr.target ?? 100), unit: kr.unit || '%',
      done: !!kr.done, startDate: kr.startDate || '', dueDate: kr.dueDate || '',
      progressOverride: kr.progressOverride !== undefined ? String(kr.progressOverride) : '',
    })
    setEditing(true)
  }
  useEffect(() => { if (editing) editTitleRef.current?.focus() }, [editing])

  const setF = (k, v) => setEditForm(f => ({ ...f, [k]: v }))

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !editForm.tags?.includes(tag)) setF('tags', [...(editForm.tags || []), tag])
    setTagInput('')
  }

  const commitEdit = () => {
    const updates = {
      title: editForm.title.trim() || kr.title,
      type:  editForm.type,
      tags:  editForm.tags || [],
    }
    if (editForm.type === 'numeric') {
      updates.baseline = parseFloat(editForm.baseline) || 0
      updates.current  = parseFloat(editForm.current)  || 0
      updates.target   = parseFloat(editForm.target)   || 100
      updates.unit     = editForm.unit
    } else if (editForm.type === 'boolean') {
      updates.done = editForm.done
    } else if (editForm.type === 'milestone') {
      updates.startDate = editForm.startDate
      updates.dueDate   = editForm.dueDate
      if (editForm.progressOverride !== '') updates.progressOverride = parseFloat(editForm.progressOverride)
      else updates.progressOverride = undefined
    }
    dispatch({ type: KR_UPDATE, okrId, krId: kr.id, updates })
    setEditing(false)
  }

  const TYPE_BADGE_COLOR = { numeric: 'text-gold', boolean: 'text-blue-400', milestone: 'text-purple-400' }
  const TYPE_LABEL       = { numeric: '123',       boolean: '✓/✗',           milestone: '📅' }

  if (editing) {
    return (
      <div className="rounded-xl bg-gold/5 border border-gold/30 p-3 space-y-2 animate-fade-in">
        <div className="flex items-center gap-2">
          <select value={editForm.type} onChange={e => setF('type', e.target.value)}
            className="bg-dark border border-border rounded px-2 py-1 text-xs text-ink-muted outline-none focus:border-gold/60 w-36 shrink-0">
            {KR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input ref={editTitleRef} value={editForm.title} onChange={e => setF('title', e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false) }}
            className="flex-1 bg-dark border border-border rounded px-2 py-1 text-xs text-ink outline-none focus:border-gold/60 min-w-0" />
          <button onClick={commitEdit} className="w-6 h-6 rounded bg-gold/20 hover:bg-gold/30 text-gold flex items-center justify-center shrink-0"><Check size={11} /></button>
          <button onClick={() => setEditing(false)} className="w-6 h-6 rounded hover:bg-border text-ink-muted flex items-center justify-center shrink-0"><X size={11} /></button>
        </div>
        {editForm.type === 'numeric' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-ink-faint">From</span>
            <input type="number" value={editForm.baseline} onChange={e => setF('baseline', e.target.value)}
              className="w-16 bg-dark border border-border rounded px-2 py-1 text-xs text-ink text-center outline-none focus:border-gold/60" />
            <span className="text-[10px] text-ink-faint">Current</span>
            <input type="number" value={editForm.current} onChange={e => setF('current', e.target.value)}
              className="w-16 bg-dark border border-border rounded px-2 py-1 text-xs text-ink text-center outline-none focus:border-gold/60" />
            <span className="text-[10px] text-ink-faint">Target</span>
            <input type="number" value={editForm.target} onChange={e => setF('target', e.target.value)}
              className="w-16 bg-dark border border-border rounded px-2 py-1 text-xs text-ink text-center outline-none focus:border-gold/60" />
            <select value={editForm.unit} onChange={e => setF('unit', e.target.value)}
              className="bg-dark border border-border rounded px-1.5 py-1 text-xs text-ink-muted outline-none w-16">
              {KR_UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        )}
        {editForm.type === 'boolean' && (
          <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
            <input type="checkbox" checked={editForm.done} onChange={e => setF('done', e.target.checked)} className="accent-gold w-4 h-4 rounded" />
            Mark as done
          </label>
        )}
        {editForm.type === 'milestone' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-ink-faint">Start</span>
            <input type="date" value={editForm.startDate} onChange={e => setF('startDate', e.target.value)}
              className="bg-dark border border-border rounded px-2 py-1 text-xs text-ink outline-none w-32" />
            <span className="text-[10px] text-ink-faint">Due</span>
            <input type="date" value={editForm.dueDate} onChange={e => setF('dueDate', e.target.value)}
              className="bg-dark border border-border rounded px-2 py-1 text-xs text-ink outline-none w-32" />
            <span className="text-[10px] text-ink-faint">Override %</span>
            <input type="number" min={0} max={100} value={editForm.progressOverride} onChange={e => setF('progressOverride', e.target.value)}
              placeholder="auto" className="w-16 bg-dark border border-border rounded px-2 py-1 text-xs text-ink text-center outline-none" />
          </div>
        )}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-ink-faint">Tags:</span>
          {(editForm.tags || []).map(tag => (
            <span key={tag} className="flex items-center gap-0.5 text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full">
              {tag}<button onClick={() => setF('tags', editForm.tags.filter(t => t !== tag))}><X size={8} /></button>
            </span>
          ))}
          <input value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
            placeholder="Tag + Enter" className="bg-transparent text-[10px] text-ink outline-none placeholder:text-ink-faint w-20" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-dark hover:bg-dark/60 group transition-colors">
      {type === 'boolean' ? (
        <button onClick={() => dispatch({ type: KR_UPDATE, okrId, krId: kr.id, updates: { done: !kr.done } })}
          className="w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          style={{ borderColor: kr.done ? '#10B981' : '#4B5563' }}>
          {kr.done && <Check size={14} className="text-success" />}
        </button>
      ) : (
        <ProgressRing value={pct} size={32} stroke={3} className="shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-mono px-1 py-0.5 rounded bg-surface ${TYPE_BADGE_COLOR[type] || 'text-ink-faint'}`}>
            {TYPE_LABEL[type] || '123'}
          </span>
          <p className="text-xs font-medium text-ink leading-tight truncate">{kr.title}</p>
        </div>
        <p className="text-[10px] text-ink-muted mt-0.5 truncate">{valStr}</p>
        {(kr.tags?.length > 0) && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {kr.tags.map(tag => (
              <span key={tag} className="text-[9px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}
      </div>
      {type !== 'boolean' && (
        <select value={kr.status || 'on_track'}
          onChange={e => dispatch({ type: KR_UPDATE, okrId, krId: kr.id, updates: { status: e.target.value } })}
          className="bg-dark border border-border rounded text-[10px] text-ink-muted px-1.5 py-1 outline-none focus:border-gold/40 cursor-pointer shrink-0" style={{ maxWidth: 82 }}>
          {KR_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      )}
      <button onClick={openEdit}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded hover:bg-gold/10 text-ink-muted hover:text-gold flex items-center justify-center transition-all shrink-0">
        <Pencil size={11} />
      </button>
      <button onClick={() => dispatch({ type: KR_DELETE, okrId, krId: kr.id })}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded hover:bg-red-500/10 text-ink-muted hover:text-red-400 flex items-center justify-center transition-all shrink-0">
        <Trash2 size={11} />
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// INITIATIVE DETAIL DRAWER  — right slide-in panel (screenshot 3 inspired)
// ══════════════════════════════════════════════════════════════════════════════
function InitiativeDetailDrawer({ ini, okr, onClose, onDispatch }) {
  const { dispatch } = useApp()
  const [comment, setComment] = useState('')
  if (!ini) return null

  const cfg      = INI_STATUSES[ini.status] || INI_STATUSES.not_started
  const StatusIcon = cfg.icon
  const STATUS_ORDER = ['not_started', 'in_progress', 'done', 'blocked']
  const SEGMENT_LABELS = { not_started: 'To Do', in_progress: 'In Dev', done: 'Shipped', blocked: 'Blocked' }

  const parentKr    = okr.keyResults?.find(k => k.id === ini.krId)
  const completion  = ini.status === 'done' ? 100 : ini.status === 'in_progress' ? 60 : ini.status === 'blocked' ? 30 : 0
  const budgetPct   = ini.budget && ini.actualSpend ? Math.round((ini.actualSpend / ini.budget) * 100) : 0
  const allocated   = ini.budget      || 0
  const actualSpend = ini.actualSpend || 0
  const efficiency  = allocated > 0 ? Math.min(100, Math.round((1 - Math.abs(actualSpend - allocated) / allocated) * 100)) : 100

  const setStatus = (s) => onDispatch({ type: INITIATIVE_UPDATE, okrId: okr.id, initiativeId: ini.id, updates: { status: s } })

  const addComment = () => {
    if (!comment.trim()) return
    const c = { id: `c_${Date.now()}`, author: 'You', text: comment.trim(), date: new Date().toISOString() }
    onDispatch({ type: INITIATIVE_UPDATE, okrId: okr.id, initiativeId: ini.id,
      updates: { comments: [...(ini.comments || []), c] } })
    setComment('')
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-dark/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-sm bg-surface border-l border-border flex flex-col shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-ink-faint mb-1">Initiative Detail</p>
            <h3 className="text-sm font-semibold text-ink leading-snug">{ini.title}</h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button className="w-7 h-7 rounded hover:bg-border text-ink-muted flex items-center justify-center"><Share2 size={13} /></button>
            <button className="w-7 h-7 rounded hover:bg-border text-ink-muted flex items-center justify-center"><MoreHorizontal size={13} /></button>
            <button onClick={onClose} className="w-7 h-7 rounded hover:bg-border text-ink-muted flex items-center justify-center"><X size={14} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Execution Status segmented */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink-faint mb-2">Execution Status</p>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {STATUS_ORDER.map((s, i) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`flex-1 py-2 text-[11px] font-medium transition-all border-r last:border-r-0 border-border
                    ${ini.status === s ? 'bg-gold/15 text-gold' : 'bg-dark text-ink-muted hover:bg-surface hover:text-ink'}`}>
                  {SEGMENT_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Overall Completion */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wider text-ink-faint">Overall Completion</p>
              {ini.dueDate && (
                <span className="text-[10px] text-ink-faint flex items-center gap-1">
                  <Calendar size={9} />
                  Target: {new Date(ini.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-ink">{completion}<span className="text-sm font-normal text-ink-muted">%</span></span>
            </div>
            <ProgressBar value={completion} size="sm" className="mt-2"
              style={completion === 100 ? { '--bar-color': '#10B981' } : {}} />
          </div>

          {/* Linked Objective */}
          <div className="rounded-xl bg-dark border border-border p-3">
            <p className="text-[10px] uppercase tracking-wider text-ink-faint mb-2">Linked Objective</p>
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                <Target size={13} className="text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink leading-snug">{okr.title}</p>
                {parentKr && (
                  <p className="text-[10px] text-ink-muted mt-0.5 flex items-center gap-1">
                    <Link2 size={9} />
                    {parentKr.title}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Budget Utilization */}
          {allocated > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ink-faint mb-2">Budget Utilization</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="rounded-lg bg-dark border border-border p-2.5">
                  <p className="text-[10px] text-ink-faint">Allocated</p>
                  <p className="text-sm font-semibold text-ink mt-0.5">${allocated.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-dark border border-border p-2.5">
                  <p className="text-[10px] text-ink-faint">Actual Spend</p>
                  <p className={`text-sm font-semibold mt-0.5 ${actualSpend > allocated ? 'text-error' : 'text-ink'}`}>
                    ${actualSpend.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-ink-faint mb-1">
                <span>Efficiency Rate</span>
                <span>{efficiency}%</span>
              </div>
              <ProgressBar value={efficiency} size="xs" />
            </div>
          )}

          {/* Collaborative Thread */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-ink-faint">Collaborative Thread</p>
              {(ini.comments?.length > 0) && (
                <span className="text-[10px] text-ink-faint">{ini.comments.length} messages</span>
              )}
            </div>
            <div className="space-y-2 mb-3">
              {(ini.comments || []).map(c => (
                <div key={c.id} className="flex gap-2">
                  <Avatar name={c.author} size="xs" className="shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-medium text-ink">{c.author}</span>
                      <span className="text-[10px] text-ink-faint">{formatRelative(c.date)}</span>
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
              {(!ini.comments?.length) && (
                <p className="text-xs text-ink-faint italic py-2 text-center">No comments yet — start the thread below.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input value={comment} onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addComment()}
                placeholder="Write a comment…"
                className="ff-input flex-1 text-xs" />
              <button onClick={addComment}
                className="w-8 h-8 rounded-lg bg-gold/15 hover:bg-gold/25 text-gold flex items-center justify-center shrink-0 transition-colors">
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// INITIATIVE ADD ROW  — with required parent KR + startDate
// ══════════════════════════════════════════════════════════════════════════════
function InitiativeAddRow({ okrId, okr, members, onDone }) {
  const { dispatch } = useApp()
  const krs = okr?.keyResults || []
  const [form, setForm] = useState({
    title: '', owner: '', startDate: '', dueDate: '', priority: 'p2', krId: krs.length === 1 ? krs[0].id : '',
  })
  const titleRef = useRef(null)
  useEffect(() => { titleRef.current?.focus() }, [])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    if (!form.title.trim()) return
    if (krs.length > 0 && !form.krId) return  // KR required when KRs exist
    dispatch({ type: INITIATIVE_CREATE, okrId, ...form })
    onDone()
  }

  return (
    <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-3 space-y-2.5 animate-fade-in">
      {/* Row 1: title */}
      <div className="flex items-center gap-2">
        <CheckSquare size={13} className="text-blue-400 shrink-0" />
        <input ref={titleRef} value={form.title} onChange={e => set('title', e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="Initiative title…"
          className="flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink-muted min-w-0" />
        <button onClick={save} disabled={!form.title.trim() || (krs.length > 0 && !form.krId)}
          className="w-7 h-7 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 flex items-center justify-center disabled:opacity-40 transition-colors">
          <Check size={12} />
        </button>
        <button onClick={onDone} className="w-7 h-7 rounded hover:bg-border text-ink-muted flex items-center justify-center">
          <X size={12} />
        </button>
      </div>
      {/* Row 2: meta fields */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Parent KR — required if KRs exist */}
        {krs.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Link2 size={10} className="text-ink-faint shrink-0" />
            <select value={form.krId} onChange={e => set('krId', e.target.value)}
              className={`bg-dark border rounded px-1.5 py-1 text-xs text-ink-muted outline-none focus:border-gold/40 max-w-[160px] truncate ${!form.krId ? 'border-red-500/40' : 'border-border'}`}>
              <option value="">Parent KR *</option>
              {krs.map(k => <option key={k.id} value={k.id}>{k.title.length > 28 ? k.title.slice(0, 28) + '…' : k.title}</option>)}
            </select>
          </div>
        )}
        {/* Owner */}
        {members.length > 0 ? (
          <select value={form.owner} onChange={e => set('owner', e.target.value)}
            className="bg-dark border border-border rounded px-1.5 py-1 text-xs text-ink-muted outline-none w-28">
            <option value="">Owner…</option>
            {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        ) : (
          <input value={form.owner} onChange={e => set('owner', e.target.value)}
            placeholder="Owner" className="w-24 bg-dark border border-border rounded px-2 py-1 text-xs text-ink-muted outline-none focus:border-gold/40" />
        )}
        {/* Priority */}
        <select value={form.priority} onChange={e => set('priority', e.target.value)}
          className="bg-dark border border-border rounded px-1.5 py-1 text-xs text-ink-muted outline-none w-16">
          <option value="p1">P1</option>
          <option value="p2">P2</option>
          <option value="p3">P3</option>
        </select>
        {/* Dates */}
        <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
          placeholder="Start" title="Start date"
          className="bg-dark border border-border rounded px-2 py-1 text-xs text-ink-muted outline-none focus:border-gold/40 w-32" />
        <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
          title="Due date"
          className="bg-dark border border-border rounded px-2 py-1 text-xs text-ink-muted outline-none focus:border-gold/40 w-32" />
      </div>
      {krs.length > 0 && !form.krId && (
        <p className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={9} /> Parent KR is required</p>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// INITIATIVE ROW  — with KR pill, priority badge, click-for-detail
// ══════════════════════════════════════════════════════════════════════════════
function InitiativeRow({ ini, okr, onSelect }) {
  const { dispatch } = useApp()
  const cfg    = INI_STATUSES[ini.status] || INI_STATUSES.not_started
  const Icon   = cfg.icon
  const priCfg = PRIORITY_CFG[ini.priority] || PRIORITY_CFG.p2

  const cycleStatus = () => {
    const order = ['not_started', 'in_progress', 'done', 'blocked']
    const next  = order[(order.indexOf(ini.status) + 1) % order.length]
    dispatch({ type: INITIATIVE_UPDATE, okrId: okr.id, initiativeId: ini.id, updates: { status: next } })
  }

  const dateRange = (() => {
    if (!ini.startDate && !ini.dueDate) return null
    const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (ini.startDate && ini.dueDate) return `${fmt(ini.startDate)} – ${fmt(ini.dueDate)}`
    if (ini.dueDate) return `Due ${fmt(ini.dueDate)}`
    return null
  })()

  return (
    <div
      onClick={() => onSelect(ini)}
      className="flex items-center gap-2.5 px-3 py-2.5 bg-dark hover:bg-surface border-b border-border/50 last:border-b-0 group transition-colors cursor-pointer"
    >
      {/* Status icon (cycle on click, stop propagation) */}
      <button onClick={e => { e.stopPropagation(); cycleStatus() }} title="Cycle status" className="shrink-0">
        <Icon size={14} className={`${cfg.color} transition-colors`} />
      </button>

      {/* Title + KR chip */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium leading-tight ${ini.status === 'done' ? 'line-through text-ink-faint' : 'text-ink'}`}>
          {ini.title}
        </p>
        {ini.comments?.length > 0 && (
          <p className="text-[10px] text-ink-faint mt-0.5 flex items-center gap-0.5">
            <MessageSquare size={8} /> {ini.comments.length} comment{ini.comments.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Priority */}
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${priCfg.bg} ${priCfg.border}`}>
        {priCfg.label}
      </span>

      {/* Owner avatar */}
      {ini.owner && (
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <Avatar name={ini.owner} size="xs" />
          <span className="text-[10px] text-ink-faint hidden lg:block">{ini.owner.split(' ')[0]}</span>
        </div>
      )}

      {/* Status chip */}
      <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium ${cfg.bg} ${cfg.color}`}>
        {cfg.label}
      </span>

      {/* Date range */}
      {dateRange && (
        <span className="text-[10px] text-ink-faint shrink-0 hidden sm:flex items-center gap-0.5">
          <Calendar size={9} />{dateRange}
        </span>
      )}

      {/* Delete */}
      <button onClick={e => { e.stopPropagation(); dispatch({ type: INITIATIVE_DELETE, okrId: okr.id, initiativeId: ini.id }) }}
        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded hover:bg-red-500/10 text-ink-muted hover:text-red-400 flex items-center justify-center transition-all shrink-0">
        <Trash2 size={10} />
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK-IN ROW
// ══════════════════════════════════════════════════════════════════════════════
function CheckInRow({ ci, okrId }) {
  const { dispatch } = useApp()
  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center shrink-0">
        <Avatar name={ci.author} size="sm" />
        <div className="w-px flex-1 bg-border mt-1.5 min-h-[16px]" />
      </div>
      <div className="flex-1 pb-3 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-ink">{ci.author}</span>
          <Badge variant={CI_VARIANT[ci.status] || 'default'} size="xs">
            {ci.status?.replace('_', ' ')}
          </Badge>
          <span className="text-[10px] text-ink-faint ml-auto">{formatRelative(ci.date)}</span>
          <button onClick={() => dispatch({ type: CHECKIN_DELETE, okrId, checkinId: ci.id })}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded hover:bg-red-500/10 text-ink-muted hover:text-red-400 flex items-center justify-center transition-all">
            <Trash2 size={9} />
          </button>
        </div>
        <p className="text-xs text-ink-muted leading-relaxed">{ci.note}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <ProgressBar value={ci.progressSnapshot} size="xs" className="w-20" />
          <span className="text-[10px] text-ink-faint">{ci.progressSnapshot}% at check-in</span>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK-IN MODAL
// ══════════════════════════════════════════════════════════════════════════════
function CheckInModal({ open, onClose, okrId, currentProgress, userName }) {
  const { dispatch } = useApp()
  const [note,   setNote]   = useState('')
  const [status, setStatus] = useState('on_track')

  const save = () => {
    if (!note.trim()) return
    dispatch({ type: CHECKIN_ADD, okrId, note, status, author: userName || 'You' })
    setNote(''); setStatus('on_track')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Weekly Check-in"
      subtitle={`Current progress: ${currentProgress}%`}
      footer={
        <>
          <Btn variant="secondary" size="sm" onClick={onClose}>Cancel</Btn>
          <Btn size="sm" onClick={save} disabled={!note.trim()}>Save Check-in</Btn>
        </>
      }>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-ink-muted mb-1.5 block">Status this week</label>
          <div className="flex gap-2">
            {[
              { v: 'on_track',  l: 'On Track',  c: 'border-success/60  bg-success/10  text-success'  },
              { v: 'at_risk',   l: 'At Risk',   c: 'border-warning/60  bg-warning/10  text-warning'  },
              { v: 'off_track', l: 'Off Track', c: 'border-error/60    bg-error/10    text-error'    },
            ].map(s => (
              <button key={s.v} onClick={() => setStatus(s.v)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${status === s.v ? s.c : 'border-border text-ink-muted hover:border-gold/30'}`}>
                {s.l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted mb-1.5 block">Update note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
            placeholder="What happened this week? What's blocking progress? What's next?"
            className="ff-input w-full text-sm resize-none" autoFocus />
        </div>
      </div>
    </Modal>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPANDED OKR PANEL — KRs + Initiatives (grouped by KR) + Check-ins
// ══════════════════════════════════════════════════════════════════════════════
function OkrExpandedPanel({ okr, members, user }) {
  const { dispatch } = useApp()
  const [addingKr,    setAddingKr]    = useState(false)
  const [addingIni,   setAddingIni]   = useState(false)
  const [addingKrId,  setAddingKrId]  = useState(null)   // which KR bucket to add under
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [activeTab,   setActiveTab]   = useState('krs')
  const [selectedIni, setSelectedIni] = useState(null)
  const [collapsedKrs, setCollapsedKrs] = useState({})

  const krs      = okr.keyResults  || []
  const inis     = okr.initiatives || []
  const krsCount = krs.length
  const iniCount = inis.length
  const ciCount  = okr.checkins?.length || 0

  const TABS = [
    { id: 'krs',         label: 'Key Results',  count: krsCount },
    { id: 'initiatives', label: 'Initiatives',  count: iniCount },
    { id: 'checkins',    label: 'Check-ins',    count: ciCount  },
  ]

  // Group initiatives by krId
  const groupedInis = (() => {
    const groups = {}
    // First add all KR buckets (even empty)
    krs.forEach(kr => { groups[kr.id] = { kr, inis: [] } })
    // Add an "Unlinked" bucket
    groups['_unlinked'] = { kr: null, inis: [] }
    // Fill buckets
    inis.forEach(ini => {
      const key = (ini.krId && groups[ini.krId]) ? ini.krId : '_unlinked'
      groups[key].inis.push(ini)
    })
    // Return as array, skip empty unlinked
    return Object.entries(groups)
      .filter(([k, g]) => k !== '_unlinked' || g.inis.length > 0)
      .map(([k, g]) => ({ key: k, ...g }))
  })()

  // Execution insight
  const doneCount    = inis.filter(i => i.status === 'done').length
  const activeCount  = inis.filter(i => i.status === 'in_progress').length
  const blockedCount = inis.filter(i => i.status === 'blocked').length
  const confidence   = iniCount === 0 ? 0
    : Math.round(((doneCount + activeCount * 0.5) / iniCount) * 100)

  const toggleKrCollapse = (krId) => setCollapsedKrs(c => ({ ...c, [krId]: !c[krId] }))

  return (
    <div className="mt-4 ml-9 border-t border-border pt-4">
      {/* Tab bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-0.5 bg-dark rounded-lg p-0.5">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.id ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}>
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-gold/20 text-gold' : 'bg-border text-ink-faint'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {activeTab === 'krs' && (
            <Btn variant="ghost" size="xs" className={`text-ink-muted hover:text-gold ${addingKr ? 'opacity-30 pointer-events-none' : ''}`}
              onClick={() => setAddingKr(true)}>
              <Plus size={11} /> Add KR
            </Btn>
          )}
          {activeTab === 'initiatives' && (
            <Btn variant="ghost" size="xs" className={`text-ink-muted hover:text-blue-400 ${addingIni ? 'opacity-30 pointer-events-none' : ''}`}
              onClick={() => { setAddingKrId(null); setAddingIni(true) }}>
              <Plus size={11} /> Add Initiative
            </Btn>
          )}
          {activeTab === 'checkins' && (
            <Btn variant="ghost" size="xs" className="text-ink-muted hover:text-ink" onClick={() => setCheckInOpen(true)}>
              <Plus size={11} /> Add Check-in
            </Btn>
          )}
        </div>
      </div>

      {/* ── KRS TAB ─────────────────────────────────────────── */}
      {activeTab === 'krs' && (
        <div className="space-y-1.5">
          {krsCount === 0 && !addingKr && (
            <button onClick={() => setAddingKr(true)}
              className="w-full flex items-center gap-2 p-3 rounded-lg border border-dashed border-border hover:border-gold/40 hover:bg-gold/5 text-ink-muted hover:text-gold transition-all">
              <Plus size={13} className="shrink-0" />
              <span className="text-xs">Add your first Key Result to measure progress</span>
            </button>
          )}
          {krs.map(kr => <KrRow key={kr.id} kr={kr} okrId={okr.id} />)}
          {addingKr && <KrAddRow okrId={okr.id} onDone={() => setAddingKr(false)} />}
        </div>
      )}

      {/* ── INITIATIVES TAB — grouped by KR ─────────────────── */}
      {activeTab === 'initiatives' && (
        <div className="space-y-3">
          {iniCount === 0 && !addingIni && krs.length === 0 && (
            <button onClick={() => setAddingIni(true)}
              className="w-full flex items-center gap-2 p-3 rounded-lg border border-dashed border-border hover:border-blue-400/40 hover:bg-blue-500/5 text-ink-muted hover:text-blue-400 transition-all">
              <Plus size={13} className="shrink-0" />
              <span className="text-xs">Add an initiative — a project or action tied to this objective</span>
            </button>
          )}

          {/* KR Grouped buckets */}
          {groupedInis.map(({ key, kr, inis: krInis }) => {
            const krPct     = kr ? Math.round(calcKrProgress(kr)) : 0
            const isCollapsed = collapsedKrs[key]
            const headerText  = kr ? kr.title.toUpperCase() : 'UNLINKED INITIATIVES'
            const krOwner     = kr?.owner || okr.owner

            return (
              <div key={key} className="rounded-xl overflow-hidden border border-border">
                {/* KR Header — dark navy style from screenshot 2 */}
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none ${
                    kr ? 'bg-[#0d1b2a] hover:bg-[#0f2035]' : 'bg-dark/80 hover:bg-dark'
                  } transition-colors`}
                  onClick={() => toggleKrCollapse(key)}
                >
                  {kr ? (
                    <div className="w-6 h-6 rounded-md bg-gold/20 flex items-center justify-center shrink-0">
                      <TrendingUp size={11} className="text-gold" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-border flex items-center justify-center shrink-0">
                      <Flag size={11} className="text-ink-faint" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold tracking-wide text-ink truncate">{headerText}</p>
                    {kr && (
                      <div className="flex items-center gap-2 mt-0.5">
                        {krOwner && <span className="text-[10px] text-ink-faint">Owner: {krOwner}</span>}
                        {kr.dueDate && <span className="text-[10px] text-ink-faint">· Due {new Date(kr.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>}
                      </div>
                    )}
                  </div>
                  {kr && (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <ProgressBar value={krPct} size="xs" className="w-16 hidden sm:block" />
                        <span className="text-xs font-semibold text-gold">{krPct}%</span>
                      </div>
                      <span className="text-[10px] text-ink-faint">{krInis.length}/{krInis.length} active</span>
                    </div>
                  )}
                  <button className="text-ink-faint shrink-0">
                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {/* Initiative rows */}
                {!isCollapsed && (
                  <div>
                    {/* Column headers */}
                    {krInis.length > 0 && (
                      <div className="flex items-center gap-2.5 px-3 py-1.5 bg-dark/30 border-b border-border/50">
                        <div className="w-4 shrink-0" />
                        <span className="text-[9px] uppercase tracking-wider text-ink-faint flex-1">Initiative Name</span>
                        <span className="text-[9px] uppercase tracking-wider text-ink-faint w-7 shrink-0 text-center">Pri</span>
                        <span className="text-[9px] uppercase tracking-wider text-ink-faint hidden lg:block" style={{width: 56}}>Champion</span>
                        <span className="text-[9px] uppercase tracking-wider text-ink-faint hidden sm:block" style={{width: 68}}>Status</span>
                        <span className="text-[9px] uppercase tracking-wider text-ink-faint hidden sm:block" style={{width: 110}}>Timeline</span>
                        <div className="w-5 shrink-0" />
                      </div>
                    )}
                    {krInis.length === 0 && (
                      <div className="px-3 py-3 text-xs text-ink-faint italic">
                        No initiatives under this KR yet.
                        <button onClick={() => { setAddingKrId(key === '_unlinked' ? null : key); setAddingIni(true) }}
                          className="ml-2 text-blue-400 hover:underline">+ Add one</button>
                      </div>
                    )}
                    {krInis.map(ini => (
                      <InitiativeRow key={ini.id} ini={ini} okr={okr} onSelect={setSelectedIni} />
                    ))}
                    {/* Inline add row for this KR bucket */}
                    {addingIni && (addingKrId === key || (addingKrId === null && key === (groupedInis[0]?.key || '_unlinked'))) && (
                      <div className="px-3 pt-2 pb-2">
                        <InitiativeAddRow
                          okrId={okr.id} okr={{ ...okr, keyResults: kr ? [kr] : [] }}
                          members={members}
                          onDone={() => { setAddingIni(false); setAddingKrId(null) }}
                        />
                      </div>
                    )}
                    {/* Per-KR add button */}
                    {!addingIni && (
                      <button
                        onClick={() => { setAddingKrId(key === '_unlinked' ? null : key); setAddingIni(true) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-ink-faint hover:text-blue-400 hover:bg-blue-500/5 transition-colors text-xs">
                        <Plus size={10} /> Add new initiative…
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* If no KRs yet, global add row */}
          {krs.length === 0 && addingIni && (
            <InitiativeAddRow okrId={okr.id} okr={okr} members={members} onDone={() => setAddingIni(false)} />
          )}

          {/* Execution Insight strip */}
          {iniCount > 0 && (
            <div className="rounded-xl bg-gradient-to-r from-[#0d1b2a] to-[#1a2d45] border border-border p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap size={12} className="text-gold" />
                <p className="text-[10px] uppercase tracking-widest text-ink-faint">Execution Insight</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-ink-muted">
                    Predictive Confidence:{' '}
                    <span className={`font-semibold ${confidence >= 70 ? 'text-success' : confidence >= 40 ? 'text-gold' : 'text-error'}`}>
                      {confidence >= 70 ? 'High' : confidence >= 40 ? 'Medium' : 'Low'} ({confidence}%)
                    </span>
                  </p>
                  <p className="text-[10px] text-ink-faint mt-0.5">
                    {doneCount} shipped · {activeCount} in dev · {blockedCount} blocked
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <div className="text-center">
                    <p className="text-lg font-bold text-ink">{iniCount}</p>
                    <p className="text-[9px] text-ink-faint">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gold">{activeCount}</p>
                    <p className="text-[9px] text-ink-faint">Active</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CHECK-INS TAB ─────────────────────────────────── */}
      {activeTab === 'checkins' && (
        <div>
          {ciCount === 0 && (
            <button onClick={() => setCheckInOpen(true)}
              className="w-full flex items-center gap-2 p-3 rounded-lg border border-dashed border-border hover:border-ink-muted/40 hover:bg-ink-muted/5 text-ink-muted transition-all">
              <MessageSquare size={13} className="shrink-0" />
              <span className="text-xs">Log a weekly check-in to track progress over time</span>
            </button>
          )}
          <div className="space-y-0">
            {(okr.checkins || []).map(ci => <CheckInRow key={ci.id} ci={ci} okrId={okr.id} />)}
          </div>
        </div>
      )}

      {/* Check-in modal */}
      <CheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        okrId={okr.id}
        currentProgress={okr.progress}
        userName={user?.name}
      />

      {/* Initiative detail drawer */}
      {selectedIni && (
        <InitiativeDetailDrawer
          ini={selectedIni}
          okr={okr}
          onClose={() => setSelectedIni(null)}
          onDispatch={dispatch}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function ImpactorPage() {
  const { state, dispatch } = useApp()
  const { lang, okrs, org, user, chatHistory, members } = state
  const tr = (k) => t(k, lang)

  const [filterQ,       setFilterQ]       = useState(currentQuarter())
  const [showArchived,  setShowArchived]  = useState(false)
  const [expanded,      setExpanded]      = useState({})
  const [newOkrOpen,    setNewOkrOpen]    = useState(false)
  const [editOkrTarget, setEditOkrTarget] = useState(null)
  const [editOkrForm,   setEditOkrForm]   = useState({ title: '', quarter: currentQuarter(), owner: '' })
  const [aiOpen,        setAiOpen]        = useState(false)
  const [aiMsg,         setAiMsg]         = useState('')
  const [aiLoading,     setAiLoading]     = useState(false)
  const [newOkr,        setNewOkr]        = useState({ title: '', quarter: currentQuarter(), owner: user?.name || '' })
  const [highlightId,   setHighlightId]   = useState(null)

  const cardRefs = useRef({})

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  // ── Phase 4c: scroll-to and pulse-highlight on HIGHLIGHT action ────────────
  useEffect(() => {
    if (!state.highlight) return
    const { id, okrId, ts } = state.highlight
    const targetId = okrId || id
    // Auto-expand the OKR
    if (targetId) setExpanded(e => ({ ...e, [targetId]: true }))
    setHighlightId(targetId)
    // Scroll into view
    setTimeout(() => {
      const el = cardRefs.current[targetId]
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
    // Clear after 3s
    const timer = setTimeout(() => {
      setHighlightId(null)
      dispatch({ type: HIGHLIGHT, id: null, okrId: null })
    }, 3000)
    return () => clearTimeout(timer)
  }, [state.highlight?.ts])

  const allOkrs      = okrs.filter(o => !filterQ || o.quarter === filterQ)
  const filteredOkrs = showArchived ? allOkrs : allOkrs.filter(o => !o.archived)
  const archivedCount = allOkrs.filter(o => o.archived).length

  const statusLabel = (s) => org.statusLabels?.[s] || s?.replace('_', ' ')

  const createOkr = () => {
    if (!newOkr.title.trim()) return
    dispatch({ type: OKR_CREATE, ...newOkr })
    setNewOkr({ title: '', quarter: currentQuarter(), owner: user?.name || '' })
    setNewOkrOpen(false)
  }

  const openEditOkr = (okr) => {
    setEditOkrTarget(okr)
    setEditOkrForm({ title: okr.title, quarter: okr.quarter, owner: okr.owner || '' })
  }

  const saveEditOkr = () => {
    if (!editOkrForm.title.trim() || !editOkrTarget) return
    dispatch({ type: OKR_UPDATE, id: editOkrTarget.id, updates: {
      title:   editOkrForm.title.trim(),
      quarter: editOkrForm.quarter,
      owner:   editOkrForm.owner,
    }})
    setEditOkrTarget(null)
  }

  const archiveOkr = (id) => dispatch({ type: OKR_UPDATE, id, updates: { archived: true  } })
  const restoreOkr = (id) => dispatch({ type: OKR_UPDATE, id, updates: { archived: false } })

  // AI Architect
  const sendAiMsg = async () => {
    if (!aiMsg.trim() || aiLoading) return
    const userMsg = { role: 'user', content: aiMsg }
    dispatch({ type: CHAT_ADD, message: userMsg })
    setAiMsg('')
    setAiLoading(true)
    dispatch({ type: CHAT_ADD, message: { role: 'assistant', content: '...' } })
    try {
      await streamChat({
        messages: [...chatHistory, userMsg],
        systemPrompt: SYSTEM_PROMPTS.okrArchitect,
        onChunk: (_, full) => dispatch({ type: CHAT_UPDATE_LAST, updates: { content: full } }),
        onDone: (full) => {
          dispatch({ type: CHAT_UPDATE_LAST, updates: { content: full } })
          const m = full.match(/```json\n([\s\S]*?)\n```/)
          if (m) {
            try {
              const p = JSON.parse(m[1])
              if (p.objective) { setNewOkr({ title: p.objective, quarter: currentQuarter(), owner: user?.name || '' }); setNewOkrOpen(true) }
            } catch {}
          }
        },
        onError: (err) => dispatch({ type: CHAT_UPDATE_LAST, updates: { content: `Error: ${err}` } }),
      })
    } finally { setAiLoading(false) }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterQ} onChange={e => setFilterQ(e.target.value)}
            options={QUARTERS.map(q => ({ value: q, label: q }))} className="text-sm w-28" />
          <span className="text-sm text-ink-muted">{filteredOkrs.length} objectives</span>
          {archivedCount > 0 && (
            <button onClick={() => setShowArchived(v => !v)}
              className="text-xs text-ink-faint hover:text-ink-muted flex items-center gap-1 transition-colors">
              <Archive size={11} />
              {showArchived ? 'Hide' : `Show`} {archivedCount} archived
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" size="sm" onClick={() => setAiOpen(true)} icon={<Sparkles size={13} />}>
            {lang === 'ar' ? 'مهندس الأهداف AI' : 'AI Architect'}
          </Btn>
          <Btn size="sm" onClick={() => setNewOkrOpen(true)} icon={<Plus size={14} />}>
            {tr('okr_new')}
          </Btn>
        </div>
      </div>

      {/* OKR list */}
      {filteredOkrs.length === 0 ? (
        <EmptyState icon={Target}
          title={lang === 'ar' ? 'لا توجد أهداف بعد' : 'No objectives yet'}
          description={lang === 'ar' ? 'أنشئ هدفاً جديداً أو استخدم مهندس الأهداف' : 'Create your first objective or use the AI Architect to get started'}
          action={() => setNewOkrOpen(true)} actionLabel={tr('okr_new')} />
      ) : (
        <div className="space-y-3">
          {filteredOkrs.map(okr => (
            <div key={okr.id} ref={el => { cardRefs.current[okr.id] = el }}
              className={`rounded-xl transition-all ${highlightId === okr.id ? 'ring-2 ring-gold/60 shadow-[0_0_20px_rgba(234,197,12,0.15)]' : ''}`}>
            <Card
              className={`overflow-hidden group/card ${okr.archived ? 'opacity-60' : ''}`}
            >
              {/* OKR header */}
              <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => toggle(okr.id)}>
                <button className="text-ink-muted shrink-0">
                  {expanded[okr.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <ProgressRing value={okr.progress} size={40} stroke={4} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold text-ink ${okr.archived ? 'line-through text-ink-muted' : ''}`}>{okr.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Avatar name={okr.owner} size="xs" />
                    <span className="text-xs text-ink-muted">{okr.owner}</span>
                    <span className="text-ink-muted">·</span>
                    <span className="text-xs text-ink-muted">{okr.quarter}</span>
                    <span className="text-ink-muted">·</span>
                    <span className="text-xs text-ink-muted">
                      {okr.keyResults?.length || 0} KR{okr.keyResults?.length !== 1 ? 's' : ''}
                      {okr.initiatives?.length > 0 && ` · ${okr.initiatives.length} initiatives`}
                    </span>
                  </div>
                </div>
                <Badge variant={okr.status} dot size="sm">{statusLabel(okr.status)}</Badge>
                <div className="flex items-center gap-1 ml-1 opacity-0 group-hover/card:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <Btn variant="ghost" size="icon" className="w-7 h-7 text-ink-muted hover:text-gold" onClick={() => openEditOkr(okr)} title="Edit OKR">
                    <Pencil size={13} />
                  </Btn>
                  {okr.archived ? (
                    <Btn variant="ghost" size="icon" className="w-7 h-7 text-ink-muted hover:text-success" onClick={() => restoreOkr(okr.id)} title="Restore">
                      <RotateCcw size={13} />
                    </Btn>
                  ) : (
                    <Btn variant="ghost" size="icon" className="w-7 h-7 text-ink-muted hover:text-warning" onClick={() => archiveOkr(okr.id)} title="Archive">
                      <Archive size={13} />
                    </Btn>
                  )}
                  <Btn variant="ghost" size="icon" className="w-7 h-7 text-ink-muted hover:text-red-400" onClick={() => dispatch({ type: OKR_DELETE, id: okr.id })} title="Delete">
                    <Trash2 size={13} />
                  </Btn>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 ml-9">
                <ProgressBar value={okr.progress} showLabel size="sm" />
              </div>

              {/* Expanded panel */}
              {expanded[okr.id] && <OkrExpandedPanel okr={okr} members={members} user={user} />}
            </Card>
            </div>
          ))}
        </div>
      )}

      {/* Create OKR modal */}
      <Modal open={newOkrOpen} onClose={() => setNewOkrOpen(false)} title={tr('okr_new')}
        footer={
          <>
            <Btn variant="secondary" size="sm" onClick={() => setNewOkrOpen(false)}>{tr('btn_cancel')}</Btn>
            <Btn size="sm" onClick={createOkr} disabled={!newOkr.title.trim()}>{tr('btn_save')}</Btn>
          </>
        }>
        <div className="space-y-4">
          <Input label={lang === 'ar' ? 'عنوان الهدف' : 'Objective Title'}
            value={newOkr.title} onChange={e => setNewOkr(o => ({ ...o, title: e.target.value }))}
            placeholder="e.g. Increase customer satisfaction by 30%"
            autoFocus onKeyDown={e => e.key === 'Enter' && createOkr()} />
          <Select label={lang === 'ar' ? 'الربع المالي' : 'Quarter'}
            value={newOkr.quarter} onChange={e => setNewOkr(o => ({ ...o, quarter: e.target.value }))}
            options={QUARTERS.map(q => ({ value: q, label: q }))} />
          {members.length > 0 ? (
            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Owner</label>
              <select value={newOkr.owner} onChange={e => setNewOkr(o => ({ ...o, owner: e.target.value }))}
                className="ff-input w-full text-sm">
                <option value="">Select owner…</option>
                {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                <option value={user?.name || 'Me'}>{user?.name || 'Me'} (you)</option>
              </select>
            </div>
          ) : (
            <Input label={lang === 'ar' ? 'المسؤول' : 'Owner'}
              value={newOkr.owner} onChange={e => setNewOkr(o => ({ ...o, owner: e.target.value }))}
              placeholder={user?.name || 'Your name'} />
          )}
        </div>
      </Modal>

      {/* Edit OKR modal */}
      <Modal open={!!editOkrTarget} onClose={() => setEditOkrTarget(null)} title={lang === 'ar' ? 'تعديل الهدف' : 'Edit Objective'}
        footer={
          <>
            <Btn variant="secondary" size="sm" onClick={() => setEditOkrTarget(null)}>{tr('btn_cancel')}</Btn>
            <Btn size="sm" onClick={saveEditOkr} disabled={!editOkrForm.title.trim()}>{tr('btn_save')}</Btn>
          </>
        }>
        <div className="space-y-4">
          <Input label={lang === 'ar' ? 'عنوان الهدف' : 'Objective Title'}
            value={editOkrForm.title} onChange={e => setEditOkrForm(f => ({ ...f, title: e.target.value }))}
            autoFocus onKeyDown={e => e.key === 'Enter' && saveEditOkr()} />
          <Select label={lang === 'ar' ? 'الربع المالي' : 'Quarter'}
            value={editOkrForm.quarter} onChange={e => setEditOkrForm(f => ({ ...f, quarter: e.target.value }))}
            options={QUARTERS.map(q => ({ value: q, label: q }))} />
          {members.length > 0 ? (
            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">{lang === 'ar' ? 'المسؤول' : 'Owner'}</label>
              <select value={editOkrForm.owner} onChange={e => setEditOkrForm(f => ({ ...f, owner: e.target.value }))}
                className="ff-input w-full text-sm">
                <option value="">Select owner…</option>
                {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                <option value={user?.name || 'Me'}>{user?.name || 'Me'} (you)</option>
              </select>
            </div>
          ) : (
            <Input label={lang === 'ar' ? 'المسؤول' : 'Owner'}
              value={editOkrForm.owner} onChange={e => setEditOkrForm(f => ({ ...f, owner: e.target.value }))}
              placeholder={user?.name || 'Your name'} />
          )}
        </div>
      </Modal>

      {/* AI Architect drawer */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-dark/60 backdrop-blur-sm" onClick={() => setAiOpen(false)} />
          <div className="w-full max-w-md bg-surface border-l border-border flex flex-col animate-slide-in shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Sparkles size={14} className="text-gold" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{tr('okr_ai_architect')}</p>
                  <p className="text-[10px] text-ink-muted">Powered by Claude</p>
                </div>
              </div>
              <Btn variant="ghost" size="icon" onClick={() => setAiOpen(false)}><X size={16} /></Btn>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                    <Bot size={22} className="text-gold" />
                  </div>
                  <p className="text-sm text-ink-muted">
                    {lang === 'ar' ? 'صِف هدفك وسأساعدك في بناء أهداف OKR مع نتائج رئيسية قابلة للقياس' : "Describe your goal and I'll craft OKRs with measurable Key Results"}
                  </p>
                  <div className="mt-4 space-y-2">
                    {[
                      lang === 'ar' ? 'نريد زيادة مبيعاتنا في المنطقة الشرقية' : 'Grow sales in the eastern region by 40%',
                      lang === 'ar' ? 'نهدف لتقليل معدل دوران الموظفين' : 'Reduce employee turnover below 10%',
                      lang === 'ar' ? 'تحسين رضا العملاء' : 'Improve NPS score to 70+',
                    ].map(s => (
                      <button key={s} onClick={() => setAiMsg(s)}
                        className="w-full text-left text-xs bg-dark hover:bg-border border border-border rounded-lg px-3 py-2 text-ink-muted hover:text-ink transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-gold/15 text-ink' : 'bg-dark border border-border text-ink'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-dark border border-border rounded-xl px-3.5 py-2.5 flex gap-1">
                    {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input value={aiMsg} onChange={e => setAiMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendAiMsg()}
                  placeholder={tr('okr_ai_placeholder')}
                  className="ff-input flex-1 text-sm" disabled={aiLoading} />
                <Btn size="icon" onClick={sendAiMsg} disabled={!aiMsg.trim() || aiLoading}><Send size={14} /></Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

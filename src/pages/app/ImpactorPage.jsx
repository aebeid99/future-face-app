import { useState, useRef, useEffect } from 'react'
import {
  Plus, Target, ChevronDown, ChevronRight, Trash2, Sparkles,
  Send, Bot, X, Check, TrendingUp, CheckSquare, MessageSquare,
  Archive, RotateCcw, Flag, Calendar, Circle, CheckCircle2,
  AlertCircle, MinusCircle, Clock,
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
} from '../../state/actions.js'
import { t } from '../../utils/i18n.js'
import { currentQuarter, quarterList, formatRelative } from '../../utils/formatting.js'
import { streamChat, SYSTEM_PROMPTS } from '../../api/anthropic.js'

const QUARTERS  = quarterList(8)
const KR_UNITS  = ['%', 'SAR', 'AED', 'USD', 'users', 'leads', 'calls', 'deals', 'days', 'score', 'NPS']

// ─── Initiative statuses ───────────────────────────────────────────────────────
const INI_STATUSES = {
  not_started: { label: 'Not Started', icon: Circle,       color: 'text-ink-muted'  },
  in_progress: { label: 'In Progress', icon: Clock,        color: 'text-blue-400'   },
  done:        { label: 'Done',        icon: CheckCircle2, color: 'text-success'    },
  blocked:     { label: 'Blocked',     icon: MinusCircle,  color: 'text-error'      },
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
// KR ADD ROW
// ══════════════════════════════════════════════════════════════════════════════
function KrAddRow({ okrId, onDone }) {
  const { dispatch } = useApp()
  const [form, setForm] = useState({ title: '', target: '', current: '0', unit: '%' })
  const titleRef = useRef(null)
  useEffect(() => { titleRef.current?.focus() }, [])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const save = () => {
    if (!form.title.trim() || !form.target) return
    dispatch({ type: KR_CREATE, okrId, ...form })
    onDone()
  }
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gold/5 border border-gold/20 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
        <TrendingUp size={12} className="text-gold" />
      </div>
      <input ref={titleRef} value={form.title} onChange={e => set('title', e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()}
        placeholder="Key result title…"
        className="flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink-muted min-w-0" />
      <input type="number" value={form.current} onChange={e => set('current', e.target.value)}
        placeholder="0" className="w-12 bg-dark border border-border rounded px-2 py-1 text-xs text-ink text-center outline-none focus:border-gold/60" />
      <span className="text-ink-muted text-xs">/</span>
      <input type="number" value={form.target} onChange={e => set('target', e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()}
        placeholder="100" className="w-12 bg-dark border border-border rounded px-2 py-1 text-xs text-ink text-center outline-none focus:border-gold/60" />
      <select value={form.unit} onChange={e => set('unit', e.target.value)}
        className="bg-dark border border-border rounded px-1.5 py-1 text-xs text-ink-muted outline-none focus:border-gold/60 w-16">
        {KR_UNITS.map(u => <option key={u}>{u}</option>)}
      </select>
      <button onClick={save} className="w-7 h-7 rounded bg-gold/20 hover:bg-gold/30 text-gold flex items-center justify-center transition-colors" title="Save">
        <Check size={12} />
      </button>
      <button onClick={onDone} className="w-7 h-7 rounded hover:bg-border text-ink-muted flex items-center justify-center transition-colors" title="Cancel">
        <X size={12} />
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// KR ROW
// ══════════════════════════════════════════════════════════════════════════════
function KrRow({ kr, okrId }) {
  const { dispatch } = useApp()
  const [editingVal,   setEditingVal]   = useState(false)
  const [val,          setVal]          = useState(String(kr.current))
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal,     setTitleVal]     = useState(kr.title)
  const titleRef = useRef(null)

  useEffect(() => { setVal(String(kr.current)) },   [kr.current])
  useEffect(() => { setTitleVal(kr.title) },         [kr.title])
  useEffect(() => { if (editingTitle) titleRef.current?.focus() }, [editingTitle])

  const pct = Math.min(Math.round((kr.current / kr.target) * 100), 100)

  const commitVal = () => {
    const n = parseFloat(val)
    if (!isNaN(n) && n !== kr.current) dispatch({ type: KR_UPDATE, okrId, krId: kr.id, updates: { current: n } })
    setEditingVal(false)
  }
  const commitTitle = () => {
    const t = titleVal.trim()
    if (t && t !== kr.title) dispatch({ type: KR_UPDATE, okrId, krId: kr.id, updates: { title: t } })
    else setTitleVal(kr.title)
    setEditingTitle(false)
  }

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-dark hover:bg-dark/60 group transition-colors">
      <ProgressRing value={pct} size={32} stroke={3} className="shrink-0" />
      <div className="flex-1 min-w-0">
        {editingTitle ? (
          <input ref={titleRef} value={titleVal} onChange={e => setTitleVal(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setTitleVal(kr.title); setEditingTitle(false) } }}
            className="w-full bg-surface border border-gold/60 rounded px-2 py-0.5 text-xs text-ink outline-none" />
        ) : (
          <p className="text-xs font-medium text-ink leading-tight truncate cursor-text hover:text-gold/90 transition-colors"
            onDoubleClick={() => setEditingTitle(true)} title="Double-click to edit title">
            {kr.title}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1">
          {editingVal ? (
            <input autoFocus type="number" value={val} onChange={e => setVal(e.target.value)}
              onBlur={commitVal}
              onKeyDown={e => { if (e.key === 'Enter') commitVal(); if (e.key === 'Escape') { setVal(String(kr.current)); setEditingVal(false) } }}
              className="w-16 bg-surface border border-gold/60 rounded px-1.5 py-0.5 text-xs text-ink outline-none" />
          ) : (
            <button onClick={() => setEditingVal(true)}
              className="text-[10px] text-ink-muted hover:text-gold transition-colors" title="Click to update">
              {kr.current.toLocaleString()} / {kr.target.toLocaleString()} {kr.unit}
            </button>
          )}
          <span className="text-[10px] text-ink-faint ml-1">({pct}%)</span>
        </div>
      </div>
      <select value={kr.status || 'on_track'} onChange={e => dispatch({ type: KR_UPDATE, okrId, krId: kr.id, updates: { status: e.target.value } })}
        className="bg-dark border border-border rounded text-[10px] text-ink-muted px-1.5 py-1 outline-none focus:border-gold/40 cursor-pointer shrink-0" style={{ maxWidth: 80 }}>
        {KR_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <button onClick={() => dispatch({ type: KR_DELETE, okrId, krId: kr.id })}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded hover:bg-red-500/10 text-ink-muted hover:text-red-400 flex items-center justify-center transition-all shrink-0" title="Delete KR">
        <Trash2 size={11} />
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// INITIATIVE ADD ROW
// ══════════════════════════════════════════════════════════════════════════════
function InitiativeAddRow({ okrId, members, onDone }) {
  const { dispatch } = useApp()
  const [form, setForm] = useState({ title: '', owner: '', dueDate: '' })
  const titleRef = useRef(null)
  useEffect(() => { titleRef.current?.focus() }, [])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const save = () => {
    if (!form.title.trim()) return
    dispatch({ type: INITIATIVE_CREATE, okrId, ...form })
    onDone()
  }
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 animate-fade-in">
      <CheckSquare size={13} className="text-blue-400 shrink-0" />
      <input ref={titleRef} value={form.title} onChange={e => set('title', e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()}
        placeholder="Initiative title…"
        className="flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink-muted min-w-0" />
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
      <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
        className="bg-dark border border-border rounded px-2 py-1 text-xs text-ink-muted outline-none focus:border-gold/40 w-32" />
      <button onClick={save} className="w-7 h-7 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 flex items-center justify-center transition-colors">
        <Check size={12} />
      </button>
      <button onClick={onDone} className="w-7 h-7 rounded hover:bg-border text-ink-muted flex items-center justify-center transition-colors">
        <X size={12} />
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// INITIATIVE ROW
// ══════════════════════════════════════════════════════════════════════════════
function InitiativeRow({ ini, okrId }) {
  const { dispatch } = useApp()
  const cfg = INI_STATUSES[ini.status] || INI_STATUSES.not_started
  const Icon = cfg.icon

  const cycleStatus = () => {
    const order = ['not_started', 'in_progress', 'done', 'blocked']
    const next = order[(order.indexOf(ini.status) + 1) % order.length]
    dispatch({ type: INITIATIVE_UPDATE, okrId, initiativeId: ini.id, updates: { status: next } })
  }

  return (
    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-dark hover:bg-dark/60 group transition-colors">
      <button onClick={cycleStatus} title="Click to cycle status" className="shrink-0">
        <Icon size={14} className={`${cfg.color} transition-colors`} />
      </button>
      <p className={`text-xs flex-1 min-w-0 truncate transition-colors ${ini.status === 'done' ? 'line-through text-ink-faint' : 'text-ink'}`}>
        {ini.title}
      </p>
      {ini.owner && (
        <div className="flex items-center gap-1 shrink-0">
          <Avatar name={ini.owner} size="xs" />
          <span className="text-[10px] text-ink-faint hidden sm:block">{ini.owner.split(' ')[0]}</span>
        </div>
      )}
      {ini.dueDate && (
        <span className="text-[10px] text-ink-faint shrink-0 flex items-center gap-0.5">
          <Calendar size={9} />
          {new Date(ini.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
      <button onClick={() => dispatch({ type: INITIATIVE_DELETE, okrId, initiativeId: ini.id })}
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
// EXPANDED OKR PANEL — KRs + Initiatives + Check-ins
// ══════════════════════════════════════════════════════════════════════════════
function OkrExpandedPanel({ okr, members, user }) {
  const [addingKr,     setAddingKr]     = useState(false)
  const [addingIni,    setAddingIni]    = useState(false)
  const [checkInOpen,  setCheckInOpen]  = useState(false)
  const [activeTab,    setActiveTab]    = useState('krs')   // krs | initiatives | checkins

  const krsCount  = okr.keyResults?.length  || 0
  const iniCount  = okr.initiatives?.length || 0
  const ciCount   = okr.checkins?.length    || 0

  const TABS = [
    { id: 'krs',         label: 'Key Results',  count: krsCount  },
    { id: 'initiatives', label: 'Initiatives',  count: iniCount  },
    { id: 'checkins',    label: 'Check-ins',    count: ciCount   },
  ]

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

        {/* Tab-contextual action */}
        <div className="flex items-center gap-1.5">
          {activeTab === 'krs' && (
            <Btn variant="ghost" size="xs" className={`text-ink-muted hover:text-gold ${addingKr ? 'opacity-30 pointer-events-none' : ''}`}
              onClick={() => setAddingKr(true)}>
              <Plus size={11} /> Add KR
            </Btn>
          )}
          {activeTab === 'initiatives' && (
            <Btn variant="ghost" size="xs" className={`text-ink-muted hover:text-blue-400 ${addingIni ? 'opacity-30 pointer-events-none' : ''}`}
              onClick={() => setAddingIni(true)}>
              <Plus size={11} /> Add Initiative
            </Btn>
          )}
          {activeTab === 'checkins' && (
            <Btn variant="ghost" size="xs" className="text-ink-muted hover:text-ink"
              onClick={() => setCheckInOpen(true)}>
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
          {okr.keyResults?.map(kr => <KrRow key={kr.id} kr={kr} okrId={okr.id} />)}
          {addingKr && <KrAddRow okrId={okr.id} onDone={() => setAddingKr(false)} />}
        </div>
      )}

      {/* ── INITIATIVES TAB ─────────────────────────────────── */}
      {activeTab === 'initiatives' && (
        <div className="space-y-1">
          {iniCount === 0 && !addingIni && (
            <button onClick={() => setAddingIni(true)}
              className="w-full flex items-center gap-2 p-3 rounded-lg border border-dashed border-border hover:border-blue-400/40 hover:bg-blue-500/5 text-ink-muted hover:text-blue-400 transition-all">
              <Plus size={13} className="shrink-0" />
              <span className="text-xs">Add an initiative — a project or action tied to this objective</span>
            </button>
          )}
          {okr.initiatives?.map(ini => <InitiativeRow key={ini.id} ini={ini} okrId={okr.id} />)}
          {addingIni && <InitiativeAddRow okrId={okr.id} members={members} onDone={() => setAddingIni(false)} />}

          {/* Progress summary */}
          {iniCount > 0 && (
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
              {Object.entries(INI_STATUSES).map(([k, cfg]) => {
                const n = okr.initiatives.filter(i => i.status === k).length
                if (!n) return null
                const Icon = cfg.icon
                return (
                  <div key={k} className="flex items-center gap-1">
                    <Icon size={11} className={cfg.color} />
                    <span className="text-[10px] text-ink-faint">{n}</span>
                  </div>
                )
              })}
              <span className="text-[10px] text-ink-faint ml-auto">
                {okr.initiatives.filter(i => i.status === 'done').length}/{iniCount} done
              </span>
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

  const [filterQ,      setFilterQ]      = useState(currentQuarter())
  const [showArchived, setShowArchived] = useState(false)
  const [expanded,     setExpanded]     = useState({})
  const [newOkrOpen,   setNewOkrOpen]   = useState(false)
  const [aiOpen,       setAiOpen]       = useState(false)
  const [aiMsg,        setAiMsg]        = useState('')
  const [aiLoading,    setAiLoading]    = useState(false)
  const [newOkr,       setNewOkr]       = useState({ title: '', quarter: currentQuarter(), owner: user?.name || '' })

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

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
            <Card key={okr.id} className={`overflow-hidden group/card transition-opacity ${okr.archived ? 'opacity-60' : ''}`}>
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
                {/* Card actions — stop propagation so click doesn't toggle expand */}
                <div className="flex items-center gap-1 ml-1 opacity-0 group-hover/card:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
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
          {/* Owner: dropdown if members exist, otherwise free text */}
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

import { useState, useMemo } from 'react'
import {
  Layers, List, LayoutGrid, GitBranch, Settings2, Plus,
  Filter, Search, ChevronDown, GripVertical, Circle,
  CheckCircle2, AlertCircle, Clock, Zap, Bug, Star, BookOpen,
  MoreHorizontal, Tag, User2, Calendar, ArrowUpRight, X, Save,
  ChevronRight, Trash2, Edit2,
} from 'lucide-react'
import { useApp } from '@/state/AppContext'
import { INITIATIVE_UPDATE, INITIATIVE_CREATE, INITIATIVE_DELETE, OKR_UPDATE } from '@/state/actions'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Btn from '@/components/ui/Btn'

// ── Issue types ─────────────────────────────────────────────────────────────
const ISSUE_TYPES = {
  feature:  { label: 'Feature',  icon: Star,       color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  bug:      { label: 'Bug',      icon: Bug,        color: 'text-red-400',    bg: 'bg-red-500/10'    },
  task:     { label: 'Task',     icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10'  },
  epic:     { label: 'Epic',     icon: BookOpen,   color: 'text-purple-400', bg: 'bg-purple-500/10' },
}

// ── Status config ───────────────────────────────────────────────────────────
const STATUS_CFG = {
  not_started: { label: 'To Do',       color: 'text-ink-muted bg-border',          dot: 'bg-gray-400'   },
  in_progress: { label: 'In Progress', color: 'text-blue-300 bg-blue-500/15',      dot: 'bg-blue-400'   },
  in_review:   { label: 'In Review',   color: 'text-purple-300 bg-purple-500/15',  dot: 'bg-purple-400' },
  done:        { label: 'Shipped',     color: 'text-green-300 bg-green-500/15',    dot: 'bg-green-400'  },
  blocked:     { label: 'Blocked',     color: 'text-red-300 bg-red-500/15',        dot: 'bg-red-400'    },
}

const PRIORITY_CFG = {
  p1: { label: 'P1 High',   color: 'text-red-400 bg-red-500/10',    dot: '🔴' },
  p2: { label: 'P2 Medium', color: 'text-amber-400 bg-amber-500/10', dot: '🟡' },
  p3: { label: 'P3 Low',    color: 'text-gray-400 bg-gray-500/10',   dot: '⚪' },
}

const KANBAN_COLS = [
  { id: 'not_started', label: 'To Do',       icon: Circle },
  { id: 'in_progress', label: 'In Progress', icon: Clock },
  { id: 'in_review',   label: 'In Review',   icon: Zap },
  { id: 'done',        label: 'Shipped',     icon: CheckCircle2 },
  { id: 'blocked',     label: 'Blocked',     icon: AlertCircle },
]

// ── Helpers ─────────────────────────────────────────────────────────────────
function StatusPill({ status, size = 'sm' }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.not_started
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function TypeBadge({ type }) {
  const cfg = ISSUE_TYPES[type] || ISSUE_TYPES.feature
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
      <Icon size={9} />
      {cfg.label}
    </span>
  )
}

// ── Collect all initiatives from all OKRs ────────────────────────────────────
function useAllIssues() {
  const { state } = useApp()
  return useMemo(() => {
    const issues = []
    for (const okr of (state.okrs || [])) {
      for (const ini of (okr.initiatives || [])) {
        const kr = (okr.keyResults || []).find(k => k.id === ini.krId)
        issues.push({
          ...ini,
          issueType: ini.issueType || 'feature',
          okrId:     okr.id,
          okrTitle:  okr.title,
          krTitle:   kr?.title || null,
        })
      }
    }
    return issues
  }, [state.okrs])
}

// ── Issue row (backlog) ──────────────────────────────────────────────────────
function IssueRow({ issue, okrs, onUpdate, onDelete, dragHandlers, isDragging }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: issue.title, status: issue.status, priority: issue.priority, issueType: issue.issueType || 'feature' })

  const save = () => {
    onUpdate(issue.okrId, issue.id, form)
    setEditing(false)
  }

  const TypeIcon = (ISSUE_TYPES[issue.issueType || 'feature']?.icon) || Star

  return (
    <div
      {...(dragHandlers || {})}
      className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl border border-transparent hover:border-border hover:bg-surface transition-all ${isDragging ? 'opacity-30' : ''}`}
    >
      <div className="text-ink-faint group-hover:text-ink-muted cursor-grab flex-shrink-0">
        <GripVertical size={13} />
      </div>
      <TypeBadge type={issue.issueType || 'feature'} />
      <span className={`text-[10px] font-medium px-1.5 rounded ${PRIORITY_CFG[issue.priority]?.color || ''}`}>
        {issue.priority?.toUpperCase() || 'P2'}
      </span>
      {editing ? (
        <input className="ff-input text-sm flex-1 py-1" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus onBlur={save} onKeyDown={e => e.key === 'Enter' && save()} />
      ) : (
        <span className="flex-1 text-sm text-ink truncate">{issue.title}</span>
      )}
      <StatusPill status={issue.status} />
      <span className="text-xs text-ink-faint truncate max-w-[120px] hidden lg:block" title={issue.okrTitle}>{issue.krTitle || issue.okrTitle}</span>
      {issue.owner && <Avatar name={issue.owner} size="xs" />}
      {issue.dueDate && <span className="text-[10px] text-ink-muted hidden xl:block">{issue.dueDate}</span>}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1 text-ink-faint hover:text-ink rounded"><Edit2 size={11} /></button>
        <button onClick={() => onDelete(issue.okrId, issue.id)} className="p-1 text-ink-faint hover:text-red-400 rounded"><Trash2 size={11} /></button>
      </div>
    </div>
  )
}

// ── Backlog Tab ──────────────────────────────────────────────────────────────
function BacklogTab({ issues, okrs, onUpdate, onDelete }) {
  const [search, setSearch]   = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dragIdx, setDragIdx] = useState(null)

  const filtered = issues.filter(i => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterType !== 'all' && (i.issueType || 'feature') !== filterType) return false
    if (filterStatus !== 'all' && i.status !== filterStatus) return false
    return true
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input className="ff-input pl-8 text-sm" placeholder="Search issues…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="ff-input text-sm w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All types</option>
          {Object.entries(ISSUE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="ff-input text-sm w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-semibold text-ink-muted uppercase tracking-wider border-b border-border mb-1">
        <span className="w-4" />
        <span className="w-14">Type</span>
        <span className="w-10">Pri</span>
        <span className="flex-1">Title</span>
        <span className="w-24">Status</span>
        <span className="hidden lg:block w-28">Parent</span>
        <span className="w-6" />
        <span className="hidden xl:block w-20">Due</span>
        <span className="w-12" />
      </div>

      <div className="space-y-0.5">
        {filtered.map((issue, idx) => (
          <IssueRow
            key={issue.id}
            issue={issue}
            okrs={okrs}
            onUpdate={onUpdate}
            onDelete={onDelete}
            isDragging={dragIdx === idx}
            dragHandlers={{
              draggable: true,
              onDragStart: () => setDragIdx(idx),
              onDragEnd: () => setDragIdx(null),
            }}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-ink-muted text-sm">
            No issues match your filters.
          </div>
        )}
      </div>

      <div className="mt-3 text-[10px] text-ink-muted pl-4">{filtered.length} issue{filtered.length !== 1 ? 's' : ''}</div>
    </div>
  )
}

// ── Kanban Card ──────────────────────────────────────────────────────────────
function KanbanCard({ issue, onUpdate, isDragOver, dragHandlers }) {
  const TypeIcon = ISSUE_TYPES[issue.issueType || 'feature']?.icon || Star
  const pCfg     = PRIORITY_CFG[issue.priority] || PRIORITY_CFG.p2

  return (
    <div
      {...(dragHandlers || {})}
      className={`group bg-surface border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all ${isDragOver ? 'border-gold/60 bg-gold/5 scale-[1.02]' : 'border-border hover:border-border-hover'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <TypeBadge type={issue.issueType || 'feature'} />
          <span className={`text-[9px] font-semibold px-1.5 rounded ${pCfg.color}`}>{issue.priority?.toUpperCase()}</span>
        </div>
      </div>
      <p className="text-xs font-medium text-ink leading-snug mb-2">{issue.title}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-ink-faint truncate max-w-[110px]">{issue.krTitle || issue.okrTitle}</span>
        {issue.owner && <Avatar name={issue.owner} size="xs" />}
      </div>
      {issue.dueDate && (
        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-ink-faint">
          <Calendar size={9} />
          {issue.dueDate}
        </div>
      )}
    </div>
  )
}

// ── Kanban Tab ───────────────────────────────────────────────────────────────
function KanbanTab({ issues, onUpdate }) {
  const [dragging, setDragging] = useState(null)
  const [overCol, setOverCol]   = useState(null)

  const handleDrop = (colId) => {
    if (dragging && dragging.status !== colId) {
      onUpdate(dragging.okrId, dragging.id, { status: colId })
    }
    setDragging(null)
    setOverCol(null)
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 520 }}>
      {KANBAN_COLS.map(col => {
        const colIssues = issues.filter(i => i.status === col.id)
        const ColIcon   = col.icon
        return (
          <div
            key={col.id}
            className={`flex flex-col flex-shrink-0 w-64 rounded-xl transition-all ${overCol === col.id && dragging ? 'ring-1 ring-gold/40 bg-gold/5' : ''}`}
            onDragOver={e => { e.preventDefault(); setOverCol(col.id) }}
            onDragLeave={() => setOverCol(null)}
            onDrop={() => handleDrop(col.id)}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <ColIcon size={13} className={STATUS_CFG[col.id]?.dot.replace('bg-', 'text-') || 'text-ink-muted'} />
              <span className="text-xs font-semibold text-ink">{col.label}</span>
              <span className="ml-auto text-xs text-ink-muted bg-border px-1.5 py-0.5 rounded-full">{colIssues.length}</span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 px-1">
              {colIssues.map(issue => (
                <KanbanCard
                  key={issue.id}
                  issue={issue}
                  onUpdate={onUpdate}
                  isDragOver={overCol === col.id && dragging?.id !== issue.id}
                  dragHandlers={{
                    draggable: true,
                    onDragStart: () => setDragging(issue),
                    onDragEnd:   () => { setDragging(null); setOverCol(null) },
                  }}
                />
              ))}
              {colIssues.length === 0 && (
                <div className="text-center py-8 text-[11px] text-ink-faint border border-dashed border-border/40 rounded-lg">
                  Drop here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Epics Tab ────────────────────────────────────────────────────────────────
function EpicsTab({ issues }) {
  const { state } = useApp()
  const [expanded, setExpanded] = useState({})
  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  return (
    <div className="space-y-3">
      {(state.okrs || []).map(okr => {
        const okrIssues = issues.filter(i => i.okrId === okr.id)
        if (okrIssues.length === 0) return null
        const shipped = okrIssues.filter(i => i.status === 'done').length
        const pct = okrIssues.length > 0 ? Math.round((shipped / okrIssues.length) * 100) : 0
        const open = expanded[okr.id] !== false

        return (
          <div key={okr.id} className="bg-surface border border-border rounded-xl overflow-hidden">
            {/* Epic header (the OKR as epic) */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-dark transition-colors"
              onClick={() => toggle(okr.id)}
            >
              <div className="w-6 h-6 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                <BookOpen size={12} className="text-purple-400" />
              </div>
              <span className="font-semibold text-sm text-ink flex-1">{okr.title}</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-20 h-1 bg-dark rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-ink-muted">{pct}%</span>
                </div>
                <span className="text-xs text-ink-muted">{okrIssues.length} issues</span>
                {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </div>
            </div>

            {/* KR groups + initiatives */}
            {open && (
              <div className="border-t border-border">
                {(okr.keyResults || []).map(kr => {
                  const krIssues = okrIssues.filter(i => i.krId === kr.id)
                  return (
                    <div key={kr.id} className="border-b border-border/50 last:border-b-0">
                      <div className="flex items-center gap-2 px-6 py-2 bg-dark/30">
                        <GitBranch size={11} className="text-gold" />
                        <span className="text-xs font-medium text-ink-muted">{kr.title}</span>
                        <span className="text-[10px] text-ink-faint ml-auto">{krIssues.length} issues</span>
                      </div>
                      {krIssues.map(issue => (
                        <div key={issue.id} className="flex items-center gap-3 px-8 py-2 hover:bg-surface transition-colors">
                          <TypeBadge type={issue.issueType || 'feature'} />
                          <span className="flex-1 text-xs text-ink">{issue.title}</span>
                          <StatusPill status={issue.status} />
                          {issue.owner && <Avatar name={issue.owner} size="xs" />}
                        </div>
                      ))}
                    </div>
                  )
                })}
                {/* Unlinked initiatives */}
                {okrIssues.filter(i => !i.krId).map(issue => (
                  <div key={issue.id} className="flex items-center gap-3 px-6 py-2 hover:bg-surface transition-colors border-t border-border/50">
                    <TypeBadge type={issue.issueType || 'feature'} />
                    <span className="flex-1 text-xs text-ink">{issue.title}</span>
                    <StatusPill status={issue.status} />
                    {issue.owner && <Avatar name={issue.owner} size="xs" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Workflow Config Tab ──────────────────────────────────────────────────────
function WorkflowTab() {
  const { state, dispatch } = useApp()
  const cfg = state.workflowConfig || { stages: [], issueTypes: [] }
  const [newStage, setNewStage] = useState('')
  const [newType, setNewType]   = useState('')

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-ink mb-3">Workflow Stages</p>
        <p className="text-xs text-ink-muted mb-3">Define the stages issues move through. Drag to reorder.</p>
        <div className="space-y-2 mb-3">
          {cfg.stages.map((stage, i) => (
            <div key={i} className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2">
              <GripVertical size={13} className="text-ink-faint" />
              <span className="flex-1 text-sm text-ink">{stage}</span>
              <button
                onClick={() => dispatch({ type: 'WORKFLOW_CONFIG_SET', updates: { stages: cfg.stages.filter((_, j) => j !== i) } })}
                className="p-1 text-ink-faint hover:text-red-400 rounded transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="ff-input text-sm flex-1" placeholder="Add new stage…" value={newStage} onChange={e => setNewStage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newStage.trim()) { dispatch({ type: 'WORKFLOW_CONFIG_SET', updates: { stages: [...cfg.stages, newStage.trim()] } }); setNewStage('') } }} />
          <Btn size="sm" variant="primary" onClick={() => { if (newStage.trim()) { dispatch({ type: 'WORKFLOW_CONFIG_SET', updates: { stages: [...cfg.stages, newStage.trim()] } }); setNewStage('') } }}>
            <Plus size={13} />Add
          </Btn>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-ink mb-3">Issue Types</p>
        <div className="space-y-2 mb-3">
          {cfg.issueTypes.map((type, i) => (
            <div key={i} className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2">
              <span className="flex-1 text-sm text-ink">{type}</span>
              <button onClick={() => dispatch({ type: 'WORKFLOW_CONFIG_SET', updates: { issueTypes: cfg.issueTypes.filter((_, j) => j !== i) } })}
                className="p-1 text-ink-faint hover:text-red-400 rounded transition-colors"><X size={11} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="ff-input text-sm flex-1" placeholder="Add issue type…" value={newType} onChange={e => setNewType(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newType.trim()) { dispatch({ type: 'WORKFLOW_CONFIG_SET', updates: { issueTypes: [...cfg.issueTypes, newType.trim()] } }); setNewType('') } }} />
          <Btn size="sm" variant="primary" onClick={() => { if (newType.trim()) { dispatch({ type: 'WORKFLOW_CONFIG_SET', updates: { issueTypes: [...cfg.issueTypes, newType.trim()] } }); setNewType('') } }}>
            <Plus size={13} />Add
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ── Main All Issues Page ─────────────────────────────────────────────────────
export default function AllIssuesPage() {
  const { state, dispatch } = useApp()
  const issues              = useAllIssues()
  const [tab, setTab]       = useState('backlog')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', status: 'not_started', priority: 'p2', issueType: 'feature', owner: '', dueDate: '', okrId: '', krId: '' })

  const TABS = [
    { id: 'backlog',   label: 'Backlog',   icon: List       },
    { id: 'board',     label: 'Board',     icon: LayoutGrid },
    { id: 'epics',     label: 'Epics',     icon: GitBranch  },
    { id: 'workflow',  label: 'Workflow',  icon: Settings2  },
  ]

  const onUpdate = (okrId, iniId, updates) => {
    dispatch({ type: INITIATIVE_UPDATE, okrId, initiativeId: iniId, updates })
  }

  const onDelete = (okrId, iniId) => {
    dispatch({ type: INITIATIVE_DELETE, okrId, initiativeId: iniId })
  }

  const createIssue = () => {
    if (!createForm.title.trim() || !createForm.okrId) return
    dispatch({ type: INITIATIVE_CREATE, ...createForm })
    setCreateForm({ title: '', status: 'not_started', priority: 'p2', issueType: 'feature', owner: '', dueDate: '', okrId: '', krId: '' })
    setShowCreate(false)
  }

  const selectedOkrKRs = state.okrs?.find(o => o.id === createForm.okrId)?.keyResults || []

  return (
    <div className="p-0 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">All Issues</h1>
          <p className="text-ink-muted text-sm mt-0.5">Jira-like work management across all objectives and initiatives</p>
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={14} />New Issue
        </Btn>
      </div>

      {/* Create issue panel */}
      {showCreate && (
        <div className="bg-surface border border-gold/30 rounded-xl p-5 mb-5">
          <p className="text-sm font-bold text-ink mb-4">Create Issue</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="md:col-span-2">
              <label className="ff-label">Issue Title *</label>
              <input className="ff-input text-sm" placeholder="Describe the issue or feature…" value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} autoFocus />
            </div>
            <div>
              <label className="ff-label">Type</label>
              <select className="ff-input text-sm" value={createForm.issueType} onChange={e => setCreateForm(f => ({ ...f, issueType: e.target.value }))}>
                {Object.entries(ISSUE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="ff-label">Priority</label>
              <select className="ff-input text-sm" value={createForm.priority} onChange={e => setCreateForm(f => ({ ...f, priority: e.target.value }))}>
                {Object.entries(PRIORITY_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="ff-label">Status</label>
              <select className="ff-input text-sm" value={createForm.status} onChange={e => setCreateForm(f => ({ ...f, status: e.target.value }))}>
                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="ff-label">Assignee</label>
              <input className="ff-input text-sm" placeholder="Owner name" value={createForm.owner} onChange={e => setCreateForm(f => ({ ...f, owner: e.target.value }))} />
            </div>
            <div>
              <label className="ff-label">Parent Objective *</label>
              <select className="ff-input text-sm" value={createForm.okrId} onChange={e => setCreateForm(f => ({ ...f, okrId: e.target.value, krId: '' }))}>
                <option value="">Select objective…</option>
                {(state.okrs || []).map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
            </div>
            <div>
              <label className="ff-label">Parent Key Result</label>
              <select className="ff-input text-sm" value={createForm.krId} onChange={e => setCreateForm(f => ({ ...f, krId: e.target.value }))} disabled={!createForm.okrId}>
                <option value="">None (unlinked)</option>
                {selectedOkrKRs.map(kr => <option key={kr.id} value={kr.id}>{kr.title}</option>)}
              </select>
            </div>
            <div>
              <label className="ff-label">Due Date</label>
              <input type="date" className="ff-input text-sm" value={createForm.dueDate} onChange={e => setCreateForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Btn variant="primary" onClick={createIssue} disabled={!createForm.title.trim() || !createForm.okrId}>Create Issue</Btn>
            <Btn variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-dark rounded-xl p-1 w-fit mb-5">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}>
              <Icon size={13} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Stats strip */}
      <div className="flex gap-4 mb-5">
        {Object.entries(STATUS_CFG).map(([status, cfg]) => {
          const count = issues.filter(i => i.status === status).length
          return (
            <div key={status} className="flex items-center gap-1.5 text-xs text-ink-muted">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span>{cfg.label}</span>
              <span className="font-semibold text-ink">{count}</span>
            </div>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'backlog'  && <BacklogTab  issues={issues} okrs={state.okrs} onUpdate={onUpdate} onDelete={onDelete} />}
      {tab === 'board'    && <KanbanTab   issues={issues} onUpdate={onUpdate} />}
      {tab === 'epics'    && <EpicsTab    issues={issues} />}
      {tab === 'workflow' && <WorkflowTab />}
    </div>
  )
}

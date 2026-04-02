import { useState } from 'react'
import { Zap, Plus, Play, CheckCircle2, Clock, Target, ChevronRight, X, Calendar, Users2, ArrowRight, Flag, BarChart2 } from 'lucide-react'
import { useApp } from '../../state/AppContext.jsx'
import { SPRINT_CREATE, SPRINT_UPDATE, SPRINT_DELETE, SPRINT_START, SPRINT_COMPLETE, SPRINT_ISSUE_ADD, SPRINT_ISSUE_REMOVE, NOTIF_ADD } from '../../state/actions.js'
import Btn from '../../components/ui/Btn.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Card, { CardHeader } from '../../components/ui/Card.jsx'

// ─── Status meta ──────────────────────────────────────────────────────────────
const STATUS_META = {
  planned:   { label: 'Planned',   color: 'text-ink-muted',  bg: 'bg-surface-hover',   badge: 'neutral'  },
  active:    { label: 'Active',    color: 'text-teal-400',   bg: 'bg-teal-400/10',     badge: 'success'  },
  completed: { label: 'Completed', color: 'text-ink-faint',  bg: 'bg-surface-hover',   badge: 'info'     },
}

// ─── Sprint create modal ───────────────────────────────────────────────────────
function SprintModal({ onClose, onSave }) {
  const [name,      setName]      = useState('')
  const [goal,      setGoal]      = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')

  function handleSave() {
    if (!name.trim()) return
    onSave({ name: name.trim(), goal: goal.trim(), startDate, endDate })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-dark-400/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl shadow-panel w-full max-w-md p-6 space-y-4 animate-scale-in">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">New Sprint</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X size={16} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-ink-muted mb-1.5 font-medium">Sprint name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sprint 12 — Growth"
              className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-muted mb-1.5 font-medium">Sprint goal</label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="What does this sprint aim to achieve?"
              rows={2}
              className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-gold/50 transition-colors resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink-muted mb-1.5 font-medium">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-gold/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1.5 font-medium">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-gold/50 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Btn variant="ghost" size="sm" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" size="sm" onClick={handleSave} disabled={!name.trim()}>
            Create sprint
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Sprint board (active sprint view) ────────────────────────────────────────
function SprintBoard({ sprint, issues, allIssues, onAddIssue, onRemoveIssue }) {
  const sprintIssues = issues.filter(i => sprint.issueIds.includes(i.id))

  const byStatus = {
    todo:        sprintIssues.filter(i => i.status === 'todo'),
    in_progress: sprintIssues.filter(i => i.status === 'in_progress'),
    done:        sprintIssues.filter(i => i.status === 'done' || i.status === 'completed'),
  }

  const progress = sprintIssues.length
    ? Math.round((byStatus.done.length / sprintIssues.length) * 100)
    : 0

  // Issues not in sprint (for backlog sidebar)
  const backlog = allIssues.filter(i => !sprint.issueIds.includes(i.id) && i.status !== 'done' && i.status !== 'completed')

  const COLS = [
    { key: 'todo',        label: 'To Do',       color: 'border-border' },
    { key: 'in_progress', label: 'In Progress',  color: 'border-sky-400/40' },
    { key: 'done',        label: 'Done',         color: 'border-teal-400/40' },
  ]

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-surface-hover overflow-hidden">
          <div
            className="h-full rounded-full bg-teal-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-bold text-ink w-10 text-right">{progress}%</span>
        <span className="text-xs text-ink-faint">{byStatus.done.length}/{sprintIssues.length} done</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {COLS.map(col => (
          <div key={col.key} className={`rounded-xl border ${col.color} bg-surface p-3`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">{col.label}</span>
              <span className="text-xs text-ink-faint bg-surface-hover rounded-full px-2 py-0.5">{byStatus[col.key].length}</span>
            </div>
            <div className="space-y-2 min-h-[60px]">
              {byStatus[col.key].map(issue => (
                <div key={issue.id} className="bg-surface-hover rounded-lg p-2.5 group relative">
                  <p className="text-xs text-ink font-medium leading-snug pr-4">{issue.title}</p>
                  {issue.priority && (
                    <Badge variant={issue.priority === 'high' ? 'danger' : issue.priority === 'medium' ? 'warning' : 'neutral'} size="xs" className="mt-1.5">
                      {issue.priority}
                    </Badge>
                  )}
                  <button
                    onClick={() => onRemoveIssue(sprint.id, issue.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-ink-faint hover:text-ink transition-all"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Backlog section */}
      {backlog.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Backlog — add to sprint</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {backlog.slice(0, 6).map(issue => (
              <div key={issue.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border hover:bg-surface-hover">
                <p className="text-xs text-ink-muted truncate flex-1 mr-2">{issue.title}</p>
                <button
                  onClick={() => onAddIssue(sprint.id, issue.id)}
                  className="text-[10px] font-semibold text-gold hover:text-gold/80 flex items-center gap-0.5 flex-shrink-0"
                >
                  <Plus size={11} />Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sprint card (list view) ───────────────────────────────────────────────────
function SprintCard({ sprint, issues, onStart, onComplete, onDelete, onSelect, isSelected }) {
  const meta         = STATUS_META[sprint.status] || STATUS_META.planned
  const sprintIssues = issues.filter(i => sprint.issueIds.includes(i.id))
  const done         = sprintIssues.filter(i => i.status === 'done' || i.status === 'completed').length
  const pct          = sprintIssues.length ? Math.round((done / sprintIssues.length) * 100) : 0

  function fmt(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <div
      className={`rounded-2xl border bg-surface p-4 cursor-pointer transition-all hover:bg-surface-hover ${
        isSelected ? 'border-gold/40 shadow-[0_0_0_1px_var(--th-gold)]' : 'border-border'
      }`}
      onClick={() => onSelect(sprint.id)}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-ink text-sm">{sprint.name}</p>
            <Badge variant={meta.badge} size="xs">{meta.label}</Badge>
          </div>
          {sprint.goal && <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{sprint.goal}</p>}
        </div>
        <ChevronRight size={14} className="text-ink-faint mt-0.5 flex-shrink-0" />
      </div>

      <div className="flex items-center gap-4 text-[11px] text-ink-faint mb-3">
        <span className="flex items-center gap-1"><Calendar size={11} />{fmt(sprint.startDate)} → {fmt(sprint.endDate)}</span>
        <span className="flex items-center gap-1"><Target size={11} />{sprintIssues.length} issues</span>
        {sprint.velocity > 0 && <span className="flex items-center gap-1"><BarChart2 size={11} />vel. {sprint.velocity}</span>}
      </div>

      {sprintIssues.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
            <div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] font-bold text-ink">{pct}%</span>
        </div>
      )}

      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        {sprint.status === 'planned' && (
          <Btn variant="primary" size="sm" className="gap-1" onClick={() => onStart(sprint.id)}>
            <Play size={11} />Start
          </Btn>
        )}
        {sprint.status === 'active' && (
          <Btn variant="outline" size="sm" className="gap-1 text-teal-400 border-teal-400/40 hover:bg-teal-400/10" onClick={() => onComplete(sprint.id)}>
            <CheckCircle2 size={11} />Complete
          </Btn>
        )}
        <Btn variant="ghost" size="sm" className="text-ink-faint" onClick={() => onDelete(sprint.id)}>
          Delete
        </Btn>
      </div>
    </div>
  )
}

// ─── Main SprintPage ──────────────────────────────────────────────────────────
export default function SprintPage() {
  const { state, dispatch } = useApp()
  const [showModal,    setShowModal]    = useState(false)
  const [selectedId,   setSelectedId]   = useState(null)

  const sprints = state.sprints || []
  const issues  = [...(state.issues || []), ...((state.okrs || []).flatMap(o => (o.initiatives || []).map(i => ({ id: i.id, title: i.title, status: i.status, priority: 'medium' }))))]

  const activeSprint    = sprints.find(s => s.status === 'active')
  const selectedSprint  = sprints.find(s => s.id === selectedId) || activeSprint || sprints[0]

  function handleCreate(data) {
    dispatch({ type: SPRINT_CREATE, ...data })
    dispatch({ type: NOTIF_ADD, notification: { title: 'Sprint created', body: `"${data.name}" is ready to start.` } })
  }

  function handleStart(id) {
    dispatch({ type: SPRINT_START, id })
    setSelectedId(id)
  }

  function handleComplete(id) {
    const sprint = sprints.find(s => s.id === id)
    dispatch({ type: SPRINT_COMPLETE, id })
    dispatch({ type: NOTIF_ADD, notification: { title: 'Sprint completed!', body: `"${sprint?.name}" has been marked complete.` } })
  }

  function handleDelete(id) {
    dispatch({ type: SPRINT_DELETE, id })
    if (selectedId === id) setSelectedId(null)
  }

  function handleAddIssue(sprintId, issueId) {
    dispatch({ type: SPRINT_ISSUE_ADD, sprintId, issueId })
  }

  function handleRemoveIssue(sprintId, issueId) {
    dispatch({ type: SPRINT_ISSUE_REMOVE, sprintId, issueId })
  }

  const planned   = sprints.filter(s => s.status === 'planned')
  const active    = sprints.filter(s => s.status === 'active')
  const completed = sprints.filter(s => s.status === 'completed')

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={18} className="text-gold" />
            <h1 className="text-xl font-bold text-ink">Sprint Mode</h1>
          </div>
          <p className="text-sm text-ink-muted">Plan, run, and review time-boxed sprints to hit your objectives.</p>
        </div>
        <Btn variant="primary" size="sm" className="gap-1.5" onClick={() => setShowModal(true)}>
          <Plus size={13} />New sprint
        </Btn>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <p className="text-2xl font-bold text-ink">{active.length}</p>
          <p className="text-[11px] text-teal-400 font-semibold mt-0.5">Active</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <p className="text-2xl font-bold text-ink">{planned.length}</p>
          <p className="text-[11px] text-ink-muted font-semibold mt-0.5">Planned</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <p className="text-2xl font-bold text-ink">{completed.length}</p>
          <p className="text-[11px] text-ink-faint font-semibold mt-0.5">Completed</p>
        </div>
      </div>

      {sprints.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center">
            <Zap size={22} className="text-ink-faint" />
          </div>
          <div>
            <p className="font-semibold text-ink">No sprints yet</p>
            <p className="text-xs text-ink-muted mt-1 max-w-xs">
              Create your first sprint to start organising issues into time-boxed cycles.
            </p>
          </div>
          <Btn variant="primary" size="sm" className="gap-1.5" onClick={() => setShowModal(true)}>
            <Plus size={12} />Create sprint
          </Btn>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Sprint list */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">All sprints</p>
            {[...active, ...planned, ...completed].map(sprint => (
              <SprintCard
                key={sprint.id}
                sprint={sprint}
                issues={issues}
                onStart={handleStart}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onSelect={setSelectedId}
                isSelected={selectedSprint?.id === sprint.id}
              />
            ))}
          </div>

          {/* Sprint board */}
          <div className="lg:col-span-2">
            {selectedSprint ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Flag size={14} className="text-gold" />
                  <h2 className="font-semibold text-ink">{selectedSprint.name}</h2>
                  <Badge variant={STATUS_META[selectedSprint.status]?.badge} size="xs">
                    {STATUS_META[selectedSprint.status]?.label}
                  </Badge>
                </div>
                {selectedSprint.goal && (
                  <p className="text-xs text-ink-muted italic border-l-2 border-gold/30 pl-3">
                    Goal: {selectedSprint.goal}
                  </p>
                )}
                <SprintBoard
                  sprint={selectedSprint}
                  issues={issues}
                  allIssues={issues}
                  onAddIssue={handleAddIssue}
                  onRemoveIssue={handleRemoveIssue}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-ink-faint text-sm">
                Select a sprint to view its board
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <SprintModal onClose={() => setShowModal(false)} onSave={handleCreate} />
      )}
    </div>
  )
}

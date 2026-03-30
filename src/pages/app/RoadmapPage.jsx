import { useState } from 'react'
import {
  Plus, Flag, ChevronDown, ChevronRight, Target,
  Pencil, Trash2, CheckSquare, Calendar, Circle,
  CheckCircle2, Clock, MinusCircle,
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

const QUARTERS = quarterList(8)

// Initiative status icons
const INI_STATUS_CFG = {
  not_started: { icon: Circle,       color: 'text-ink-muted', label: 'Not Started' },
  in_progress: { icon: Clock,        color: 'text-blue-400',  label: 'In Progress' },
  done:        { icon: CheckCircle2, color: 'text-success',   label: 'Done'        },
  blocked:     { icon: MinusCircle,  color: 'text-error',     label: 'Blocked'     },
}

// ══════════════════════════════════════════════════════════════════════════════
// INITIATIVE ROW  (inside roadmap OKR card)
// ══════════════════════════════════════════════════════════════════════════════
function IniRow({ ini, okrId }) {
  const { dispatch } = useApp()
  const cfg  = INI_STATUS_CFG[ini.status] || INI_STATUS_CFG.not_started
  const Icon = cfg.icon
  const ORDER = ['not_started', 'in_progress', 'done', 'blocked']

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(ini.status) + 1) % ORDER.length]
    dispatch({ type: INITIATIVE_UPDATE, okrId, initiativeId: ini.id, updates: { status: next } })
  }

  return (
    <div className="flex items-center gap-2.5 pl-4 pr-2 py-1.5 rounded hover:bg-dark/50 group transition-colors">
      <button onClick={cycle} title="Cycle status" className="shrink-0">
        <Icon size={13} className={`${cfg.color} transition-colors`} />
      </button>
      <span className={`text-xs flex-1 min-w-0 truncate ${ini.status === 'done' ? 'line-through text-ink-faint' : 'text-ink-muted'}`}>
        {ini.title}
      </span>
      {ini.owner && <span className="text-[10px] text-ink-faint shrink-0">{ini.owner.split(' ')[0]}</span>}
      {ini.dueDate && (
        <span className="text-[10px] text-ink-faint shrink-0 flex items-center gap-0.5">
          <Calendar size={9} />
          {new Date(ini.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
      <button onClick={() => dispatch({ type: INITIATIVE_DELETE, okrId, initiativeId: ini.id })}
        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded hover:bg-red-500/10 text-ink-muted hover:text-red-400 flex items-center justify-center transition-all shrink-0">
        <Trash2 size={9} />
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// OKR CARD ROW  (expandable, editable)
// ══════════════════════════════════════════════════════════════════════════════
function OkrRoadmapRow({ okr, statusLabel, onEdit }) {
  const { dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const inis = okr.initiatives || []
  const krs  = okr.keyResults  || []

  const doneIni = inis.filter(i => i.status === 'done').length

  return (
    <div className="border border-border rounded-xl overflow-hidden group/row transition-colors hover:border-border/80">
      {/* Row header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer select-none bg-surface hover:bg-dark/30 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <button className="text-ink-muted shrink-0" onClick={e => { e.stopPropagation(); setOpen(v => !v) }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Progress ring substitute — horizontal bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm font-medium text-ink truncate ${okr.archived ? 'opacity-50 line-through' : ''}`}>
              {okr.title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Avatar name={okr.owner} size="xs" />
            <span className="text-xs text-ink-muted">{okr.owner}</span>
            {krs.length > 0 && (
              <span className="text-xs text-ink-faint">{krs.length} KR{krs.length !== 1 ? 's' : ''}</span>
            )}
            {inis.length > 0 && (
              <span className="text-xs text-ink-faint">{doneIni}/{inis.length} done</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <ProgressBar value={okr.progress} size="xs" className="w-16" />
            <span className="text-xs text-ink-muted w-8">{okr.progress}%</span>
          </div>
          <Badge variant={okr.status} dot size="sm">{statusLabel(okr.status)}</Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}>
          <Btn variant="ghost" size="icon" className="w-7 h-7 text-ink-muted hover:text-gold"
            onClick={() => onEdit(okr)} title="Edit OKR">
            <Pencil size={12} />
          </Btn>
          <Btn variant="ghost" size="icon" className="w-7 h-7 text-ink-muted hover:text-red-400"
            onClick={() => dispatch({ type: OKR_DELETE, id: okr.id })} title="Delete OKR">
            <Trash2 size={12} />
          </Btn>
        </div>
      </div>

      {/* Expanded initiatives */}
      {open && (
        <div className="border-t border-border/50 bg-dark/20 py-2">
          {inis.length === 0 ? (
            <p className="text-xs text-ink-faint italic pl-10 py-1">No initiatives linked to this objective.</p>
          ) : (
            inis.map(ini => <IniRow key={ini.id} ini={ini} okrId={okr.id} />)
          )}
          {krs.length > 0 && (
            <div className="pl-10 pt-2 pb-1 space-y-1">
              <p className="text-[10px] uppercase text-ink-faint tracking-wide mb-1.5">Key Results</p>
              {krs.map(kr => {
                const pct = Math.min(Math.round((kr.current / kr.target) * 100), 100)
                return (
                  <div key={kr.id} className="flex items-center gap-2 pr-2">
                    <span className="text-xs text-ink-muted flex-1 truncate">{kr.title}</span>
                    <span className="text-[10px] text-ink-faint shrink-0">
                      {kr.current.toLocaleString()}/{kr.target.toLocaleString()} {kr.unit}
                    </span>
                    <ProgressBar value={pct} size="xs" className="w-12 shrink-0" />
                    <span className="text-[10px] text-ink-faint w-7 text-right shrink-0">{pct}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function RoadmapPage() {
  const { state, dispatch } = useApp()
  const { lang, okrs, org, members, user } = state
  const tr = (k) => t(k, lang)

  const statusLabel = (s) => org.statusLabels?.[s] || s?.replace('_', ' ')

  // Edit OKR state
  const [editTarget, setEditTarget] = useState(null)
  const [editForm,   setEditForm]   = useState({ title: '', quarter: currentQuarter(), owner: '' })

  // New OKR state
  const [newOpen, setNewOpen] = useState(false)
  const [newForm, setNewForm] = useState({ title: '', quarter: currentQuarter(), owner: user?.name || '' })

  const openEdit = (okr) => {
    setEditTarget(okr)
    setEditForm({ title: okr.title, quarter: okr.quarter, owner: okr.owner || '' })
  }

  const saveEdit = () => {
    if (!editForm.title.trim() || !editTarget) return
    dispatch({ type: OKR_UPDATE, id: editTarget.id, updates: {
      title:   editForm.title.trim(),
      quarter: editForm.quarter,
      owner:   editForm.owner,
    }})
    setEditTarget(null)
  }

  const createOkr = () => {
    if (!newForm.title.trim()) return
    dispatch({ type: OKR_CREATE, ...newForm })
    setNewForm({ title: '', quarter: currentQuarter(), owner: user?.name || '' })
    setNewOpen(false)
  }

  // Group non-archived OKRs by quarter
  const liveOkrs  = okrs.filter(o => !o.archived)
  const quarters  = [...new Set(liveOkrs.map(o => o.quarter))].sort()
  const totalInis = okrs.reduce((s, o) => s + (o.initiatives?.length || 0), 0)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {liveOkrs.length} {lang === 'ar' ? 'هدف' : 'objectives'} ·&nbsp;
          {totalInis} {lang === 'ar' ? 'مبادرة' : 'initiatives'} ·&nbsp;
          {quarters.length} {lang === 'ar' ? 'أرباع' : 'quarters'}
        </p>
        <Btn size="sm" icon={<Plus size={14} />} onClick={() => setNewOpen(true)}>
          {lang === 'ar' ? 'هدف جديد' : 'New Objective'}
        </Btn>
      </div>

      {/* Empty state */}
      {liveOkrs.length === 0 && (
        <EmptyState icon={Target}
          title={lang === 'ar' ? 'لا توجد أهداف بعد' : 'No objectives yet'}
          description={lang === 'ar' ? 'أنشئ هدفاً جديداً لبدء خارطة الطريق' : 'Create your first objective to start building the roadmap'}
          action={() => setNewOpen(true)} actionLabel={lang === 'ar' ? 'هدف جديد' : 'New Objective'} />
      )}

      {/* Quarters */}
      {quarters.map(q => {
        const qOkrs = liveOkrs.filter(o => o.quarter === q)
        const qInis = qOkrs.reduce((s, o) => s + (o.initiatives?.length || 0), 0)
        const avgProgress = qOkrs.length
          ? Math.round(qOkrs.reduce((s, o) => s + o.progress, 0) / qOkrs.length)
          : 0

        return (
          <Card key={q}>
            <CardHeader
              title={q}
              subtitle={`${qOkrs.length} ${lang === 'ar' ? 'هدف' : 'objectives'} · ${qInis} ${lang === 'ar' ? 'مبادرة' : 'initiatives'} · avg ${avgProgress}%`}
              action={
                <div className="flex items-center gap-2">
                  <ProgressBar value={avgProgress} size="xs" className="w-20" />
                  <span className="text-xs text-ink-muted">{avgProgress}%</span>
                </div>
              }
            />
            <div className="space-y-2">
              {qOkrs.map(okr => (
                <OkrRoadmapRow
                  key={okr.id}
                  okr={okr}
                  statusLabel={statusLabel}
                  onEdit={openEdit}
                />
              ))}
            </div>
          </Card>
        )
      })}

      {/* Create OKR modal */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)}
        title={lang === 'ar' ? 'هدف جديد' : 'New Objective'}
        footer={
          <>
            <Btn variant="secondary" size="sm" onClick={() => setNewOpen(false)}>{tr('btn_cancel')}</Btn>
            <Btn size="sm" onClick={createOkr} disabled={!newForm.title.trim()}>{tr('btn_save')}</Btn>
          </>
        }>
        <div className="space-y-4">
          <Input label={lang === 'ar' ? 'عنوان الهدف' : 'Objective Title'}
            value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Grow enterprise market share"
            autoFocus onKeyDown={e => e.key === 'Enter' && createOkr()} />
          <Select label={lang === 'ar' ? 'الربع المالي' : 'Quarter'}
            value={newForm.quarter} onChange={e => setNewForm(f => ({ ...f, quarter: e.target.value }))}
            options={QUARTERS.map(q => ({ value: q, label: q }))} />
          {members.length > 0 ? (
            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">{lang === 'ar' ? 'المسؤول' : 'Owner'}</label>
              <select value={newForm.owner} onChange={e => setNewForm(f => ({ ...f, owner: e.target.value }))}
                className="ff-input w-full text-sm">
                <option value="">Select owner…</option>
                {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                <option value={user?.name || 'Me'}>{user?.name || 'Me'} (you)</option>
              </select>
            </div>
          ) : (
            <Input label={lang === 'ar' ? 'المسؤول' : 'Owner'}
              value={newForm.owner} onChange={e => setNewForm(f => ({ ...f, owner: e.target.value }))}
              placeholder={user?.name || 'Your name'} />
          )}
        </div>
      </Modal>

      {/* Edit OKR modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)}
        title={lang === 'ar' ? 'تعديل الهدف' : 'Edit Objective'}
        footer={
          <>
            <Btn variant="secondary" size="sm" onClick={() => setEditTarget(null)}>{tr('btn_cancel')}</Btn>
            <Btn size="sm" onClick={saveEdit} disabled={!editForm.title.trim()}>{tr('btn_save')}</Btn>
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
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">{lang === 'ar' ? 'المسؤول' : 'Owner'}</label>
              <select value={editForm.owner} onChange={e => setEditForm(f => ({ ...f, owner: e.target.value }))}
                className="ff-input w-full text-sm">
                <option value="">Select owner…</option>
                {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                <option value={user?.name || 'Me'}>{user?.name || 'Me'} (you)</option>
              </select>
            </div>
          ) : (
            <Input label={lang === 'ar' ? 'المسؤول' : 'Owner'}
              value={editForm.owner} onChange={e => setEditForm(f => ({ ...f, owner: e.target.value }))}
              placeholder={user?.name || 'Your name'} />
          )}
        </div>
      </Modal>
    </div>
  )
}

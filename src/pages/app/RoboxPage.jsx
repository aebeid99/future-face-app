import { useState, useMemo, useEffect } from 'react'
import {
  UserPlus, Download, CheckCircle2, XCircle, Clock, Building2,
  Search, ChevronRight, ChevronDown, X, Pencil, Trash2,
  Users, Mail, Phone, Calendar, GitBranch,
} from 'lucide-react'
import Card, { CardHeader, StatCard } from '../../components/ui/Card.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Avatar from '../../components/ui/Avatar.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Input from '../../components/ui/Input.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { MEMBER_ADD, MEMBER_UPDATE, MEMBER_DELETE, CHECKIN_LOG, ATTENDANCE_POLICY_SET } from '../../state/actions.js'
import { t } from '../../utils/i18n.js'

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  checked_in: { label: 'Checked In', variant: 'success', icon: CheckCircle2, next: 'late'       },
  late:       { label: 'Late',       variant: 'warning', icon: Clock,        next: 'absent'     },
  absent:     { label: 'Absent',     variant: 'error',   icon: XCircle,      next: 'checked_in' },
}

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCSV(members) {
  const header = ['Name', 'Role', 'Department', 'Email', 'Phone', 'Start Date', 'Status', 'Attendance %']
  const rows = members.map(m =>
    [m.name, m.role, m.dept, m.email || '', m.phone || '', m.startDate || '', m.status, m.attendance ?? 0]
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  )
  const csv = [header.join(','), ...rows].join('\n')
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  a.download = `robox-team-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

// ── Blank form ────────────────────────────────────────────────────────────────
const BLANK = { name: '', role: '', dept: '', email: '', phone: '', managerId: '', startDate: '' }

// ══════════════════════════════════════════════════════════════════════════════
// MEMBER MODAL  (Add / Edit)
// ══════════════════════════════════════════════════════════════════════════════
function MemberModal({ open, onClose, initial, existingMembers }) {
  const { dispatch } = useApp()
  const isEdit = !!initial
  const [form, setForm] = useState(BLANK)
  const [err,  setErr]  = useState({})

  useEffect(() => {
    if (open) { setForm(initial ? { ...BLANK, ...initial } : BLANK); setErr({}) }
  }, [open, initial])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.role.trim()) e.role = 'Role is required'
    if (!form.dept.trim()) e.dept = 'Department is required'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    setErr(e)
    return Object.keys(e).length === 0
  }

  const save = () => {
    if (!validate()) return
    if (isEdit) {
      dispatch({ type: MEMBER_UPDATE, id: initial.id, updates: { ...form } })
    } else {
      dispatch({ type: MEMBER_ADD, member: { ...form } })
    }
    onClose()
  }

  const depts = [...new Set(existingMembers.map(m => m.dept))].filter(Boolean)

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Member' : 'Add Team Member'}
      footer={
        <>
          <Btn variant="secondary" size="sm" onClick={onClose}>Cancel</Btn>
          <Btn size="sm" onClick={save}>{isEdit ? 'Save Changes' : 'Add Member'}</Btn>
        </>
      }>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input label="Full Name *" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Ahmed Al-Rashidi" autoFocus />
            {err.name && <p className="text-xs text-error mt-1">{err.name}</p>}
          </div>
          <div>
            <Input label="Role / Title *" value={form.role} onChange={e => set('role', e.target.value)}
              placeholder="Product Manager" />
            {err.role && <p className="text-xs text-error mt-1">{err.role}</p>}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-ink-muted mb-1.5 block">Department *</label>
          <input list="robox-depts" value={form.dept} onChange={e => set('dept', e.target.value)}
            placeholder="e.g. Engineering"
            className="ff-input w-full text-sm" />
          <datalist id="robox-depts">
            {depts.map(d => <option key={d} value={d} />)}
          </datalist>
          {err.dept && <p className="text-xs text-error mt-1">{err.dept}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input label="Email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="ahmed@company.com" type="email" />
            {err.email && <p className="text-xs text-error mt-1">{err.email}</p>}
          </div>
          <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)}
            placeholder="+966 50 123 4567" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-ink-muted mb-1.5 block">Reports To</label>
            <select value={form.managerId} onChange={e => set('managerId', e.target.value)}
              className="ff-input w-full text-sm">
              <option value="">No manager (top level)</option>
              {existingMembers
                .filter(m => !initial || m.id !== initial.id)
                .map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <Input label="Start Date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
            type="date" />
        </div>
      </div>
    </Modal>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MEMBER DRAWER  (right slide-in detail panel)
// ══════════════════════════════════════════════════════════════════════════════
function MemberDrawer({ member, allMembers, onClose, onEdit }) {
  const { dispatch } = useApp()
  if (!member) return null

  const cfg     = STATUS_CFG[member.status] || STATUS_CFG.absent
  const Icon    = cfg.icon
  const manager = allMembers.find(m => m.id === member.managerId)
  const reports = allMembers.filter(m => m.managerId === member.id)
  const history = (member.checkins || []).slice(0, 10)

  const cycleStatus = () => {
    const next = STATUS_CFG[member.status]?.next || 'checked_in'
    dispatch({ type: CHECKIN_LOG, memberId: member.id, status: next })
  }

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-dark/60 backdrop-blur-sm" />
      <div
        className="w-full max-w-sm bg-surface border-l border-border flex flex-col animate-slide-in shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-border">
          <Avatar name={member.name} size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-ink">{member.name}</h3>
            <p className="text-sm text-ink-muted">{member.role}</p>
            <Badge variant="default" size="sm" className="mt-1">{member.dept}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Btn variant="ghost" size="icon" className="w-7 h-7 text-ink-muted hover:text-ink"
              onClick={() => { onClose(); onEdit(member) }} title="Edit member">
              <Pencil size={13} />
            </Btn>
            <Btn variant="ghost" size="icon" className="w-7 h-7 text-ink-muted hover:text-ink"
              onClick={onClose}>
              <X size={14} />
            </Btn>
          </div>
        </div>

        {/* Status widget */}
        <div className="p-5 border-b border-border">
          <p className="text-xs font-medium text-ink-muted mb-2">Today's Status</p>
          <div className="flex items-center justify-between bg-dark rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Icon size={16} className={
                cfg.variant === 'success' ? 'text-success' :
                cfg.variant === 'warning' ? 'text-warning' : 'text-error'
              } />
              <span className="text-sm font-semibold text-ink">{cfg.label}</span>
            </div>
            <button onClick={cycleStatus}
              className="text-xs text-ink-muted hover:text-gold bg-border hover:bg-border/70 rounded-lg px-2.5 py-1.5 transition-colors">
              Cycle →
            </button>
          </div>
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-ink-muted">30-day attendance</span>
              <span className="text-xs font-semibold text-ink">{member.attendance ?? 0}%</span>
            </div>
            <ProgressBar value={member.attendance ?? 0} size="sm" />
          </div>
        </div>

        {/* Contact */}
        <div className="p-5 border-b border-border space-y-2.5">
          <p className="text-xs font-medium text-ink-muted">Contact</p>
          {member.email && (
            <div className="flex items-center gap-2.5">
              <Mail size={13} className="text-ink-faint shrink-0" />
              <span className="text-sm text-ink break-all">{member.email}</span>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-2.5">
              <Phone size={13} className="text-ink-faint shrink-0" />
              <span className="text-sm text-ink">{member.phone}</span>
            </div>
          )}
          {member.startDate && (
            <div className="flex items-center gap-2.5">
              <Calendar size={13} className="text-ink-faint shrink-0" />
              <span className="text-sm text-ink">Joined {fmtDate(member.startDate)}</span>
            </div>
          )}
          {!member.email && !member.phone && !member.startDate && (
            <p className="text-xs text-ink-faint italic">No contact info added</p>
          )}
        </div>

        {/* Reporting structure */}
        <div className="p-5 border-b border-border space-y-3">
          <p className="text-xs font-medium text-ink-muted">Reporting Structure</p>
          {manager ? (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-ink-faint mb-1.5">Reports To</p>
              <div className="flex items-center gap-2">
                <Avatar name={manager.name} size="xs" />
                <div>
                  <p className="text-xs font-medium text-ink">{manager.name}</p>
                  <p className="text-[10px] text-ink-faint">{manager.role}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-faint italic">Top-level — no manager assigned</p>
          )}
          {reports.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-ink-faint mb-1.5">
                Direct Reports ({reports.length})
              </p>
              <div className="space-y-1.5">
                {reports.map(r => {
                  const rCfg = STATUS_CFG[r.status] || STATUS_CFG.absent
                  return (
                    <div key={r.id} className="flex items-center gap-2">
                      <Avatar name={r.name} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink truncate">{r.name}</p>
                        <p className="text-[10px] text-ink-faint truncate">{r.role}</p>
                      </div>
                      <Badge variant={rCfg.variant} dot size="xs">{rCfg.label}</Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Check-in history */}
        <div className="p-5 flex-1">
          <p className="text-xs font-medium text-ink-muted mb-3">Check-in History</p>
          {history.length === 0 ? (
            <p className="text-xs text-ink-faint italic">No check-ins logged yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map(ci => {
                const ciCfg = STATUS_CFG[ci.status] || STATUS_CFG.absent
                return (
                  <div key={ci.id} className="flex items-center gap-2 p-2 rounded-lg bg-dark">
                    <Badge variant={ciCfg.variant} dot size="xs">{ciCfg.label}</Badge>
                    <span className="text-[10px] text-ink-faint ml-auto shrink-0">
                      {new Date(ci.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ORG NODE  (recursive tree node)
// ══════════════════════════════════════════════════════════════════════════════
function OrgNode({ member, allMembers, depth = 0, onSelect }) {
  const [open, setOpen] = useState(depth < 2)
  const children = allMembers.filter(m => m.managerId === member.id)
  const cfg = STATUS_CFG[member.status] || STATUS_CFG.absent

  return (
    <div className={depth > 0 ? 'ml-7 border-l border-border pl-4 mt-1' : ''}>
      <div className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-dark cursor-pointer group transition-colors"
        onClick={() => onSelect(member)}>
        {children.length > 0 ? (
          <button className="text-ink-muted shrink-0"
            onClick={e => { e.stopPropagation(); setOpen(v => !v) }}>
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : (
          <div className="w-[13px] shrink-0" />
        )}
        <Avatar name={member.name} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">{member.name}</p>
          <p className="text-xs text-ink-faint truncate">{member.role}</p>
        </div>
        <Badge variant={cfg.variant} dot size="xs">{cfg.label}</Badge>
      </div>
      {open && children.map(child => (
        <OrgNode key={child.id} member={child} allMembers={allMembers} depth={depth + 1} onSelect={onSelect} />
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE POLICY CARD
// ══════════════════════════════════════════════════════════════════════════════
function AttendancePolicyCard() {
  const { state, dispatch } = useApp()
  const ar = state.lang === 'ar'

  // Collect unique job titles from members
  const roles = useMemo(() => {
    const s = new Set((state.members || []).map(m => m.role).filter(Boolean))
    return [...s].sort()
  }, [state.members])

  const policy = state.org?.attendancePolicy || {}

  const toggleRole = (role) => {
    const current = policy[role] !== false
    dispatch({ type: ATTENDANCE_POLICY_SET, policy: { [role]: !current } })
  }

  return (
    <Card>
      <CardHeader
        title={ar ? 'سياسة الحضور' : 'Attendance Policy'}
        subtitle={ar
          ? 'حدد ما إذا كان الحضور إلزامياً حسب المسمى الوظيفي'
          : 'Configure attendance requirements per job title'}
      />
      {roles.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-muted">
          {ar ? 'لا توجد مسميات وظيفية بعد — أضف أعضاءً أولاً' : 'No job titles yet — add team members first'}
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-ink-muted mb-3">
            {ar
              ? 'القاعدة الافتراضية: الحضور إلزامي لجميع المسميات. قم بتعطيله للأدوار الاختيارية.'
              : 'Default: attendance is mandatory for all roles. Disable for roles where it\'s optional.'}
          </p>
          {roles.map(role => {
            const isMandatory = policy[role] !== false
            const memberCount = (state.members || []).filter(m => m.role === role).length
            return (
              <div key={role} className="flex items-center justify-between gap-4 py-2 border-b border-surface-3 last:border-0">
                <div>
                  <p className="text-sm text-ink font-medium">{role}</p>
                  <p className="text-xs text-ink-faint">
                    {memberCount} {ar ? 'عضو' : memberCount === 1 ? 'member' : 'members'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${isMandatory ? 'text-blue-400' : 'text-ink-muted'}`}>
                    {isMandatory
                      ? (ar ? 'إلزامي' : 'Mandatory')
                      : (ar ? 'اختياري' : 'Optional')}
                  </span>
                  <button
                    role="switch"
                    aria-checked={isMandatory}
                    onClick={() => toggleRole(role)}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 focus:outline-none ${
                      isMandatory ? 'bg-blue-500' : 'bg-surface-3'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      isMandatory ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            )
          })}
          <p className="text-[11px] text-ink-faint pt-1">
            {ar
              ? `${roles.filter(r => policy[r] !== false).length} من ${roles.length} مسمى إلزامي`
              : `${roles.filter(r => policy[r] !== false).length} of ${roles.length} roles set to mandatory`}
          </p>
        </div>
      )}
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function RoboxPage() {
  const { state, dispatch } = useApp()
  const { lang, members } = state

  const [search,       setSearch]       = useState('')
  const [deptFilter,   setDeptFilter]   = useState('')
  const [statusFilt,   setStatusFilt]   = useState('')
  const [view,         setView]         = useState('roster')  // roster | orgchart
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [drawerMember, setDrawerMember] = useState(null)

  // Stats
  const checkedIn     = members.filter(m => m.status === 'checked_in').length
  const late          = members.filter(m => m.status === 'late').length
  const absent        = members.filter(m => m.status === 'absent').length
  const avgAttendance = members.length
    ? Math.round(members.reduce((s, m) => s + (m.attendance ?? 0), 0) / members.length)
    : 0
  const depts = [...new Set(members.map(m => m.dept))].filter(Boolean)

  // Filtered list
  const filtered = useMemo(() => members.filter(m => {
    const q = search.toLowerCase()
    if (q && !m.name.toLowerCase().includes(q) && !m.role.toLowerCase().includes(q)) return false
    if (deptFilter && m.dept !== deptFilter) return false
    if (statusFilt && m.status !== statusFilt) return false
    return true
  }), [members, search, deptFilter, statusFilt])

  // Org chart roots
  const orgRoots = members.filter(m => !m.managerId || !members.find(x => x.id === m.managerId))

  const openAdd  = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (m) => { setEditTarget(m);   setModalOpen(true) }

  const cycleStatus = (m, e) => {
    e?.stopPropagation()
    const next = STATUS_CFG[m.status]?.next || 'checked_in'
    dispatch({ type: CHECKIN_LOG, memberId: m.id, status: next })
  }

  const deleteMember = (id, e) => {
    e?.stopPropagation()
    if (!window.confirm('Delete this team member?')) return
    dispatch({ type: MEMBER_DELETE, id })
    if (drawerMember?.id === id) setDrawerMember(null)
  }

  // Keep drawer in sync with live member data
  const liveDrawerMember = drawerMember ? members.find(m => m.id === drawerMember.id) || null : null

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={lang === 'ar' ? 'إجمالي الموظفين' : 'Total Staff'}     value={members.length}     icon={Building2}    color="#3B82F6" />
        <StatCard label={lang === 'ar' ? 'حاضرون اليوم'   : 'Present Today'}    value={checkedIn}           icon={CheckCircle2} color="#10B981" />
        <StatCard label={lang === 'ar' ? 'معدل الحضور'     : 'Avg Attendance'}   value={`${avgAttendance}%`} icon={Clock}        color="#D4920E" />
        <StatCard label={lang === 'ar' ? 'الأقسام'         : 'Departments'}      value={depts.length}        icon={Users}        color="#8B5CF6" />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث…' : 'Search name or role…'}
            className="ff-input w-full pl-8 text-sm" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="ff-input text-sm w-36">
          <option value="">{lang === 'ar' ? 'كل الأقسام' : 'All Depts'}</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={statusFilt} onChange={e => setStatusFilt(e.target.value)}
          className="ff-input text-sm w-36">
          <option value="">{lang === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {/* View toggle */}
        <div className="flex items-center bg-dark rounded-lg p-0.5 border border-border">
          {[
            { id: 'roster',   label: lang === 'ar' ? 'قائمة' : 'Roster'    },
            { id: 'orgchart', label: lang === 'ar' ? 'هيكل'  : 'Org Chart' },
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                view === v.id ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}>
              {v.label}
            </button>
          ))}
        </div>
        <Btn variant="secondary" size="sm" icon={<Download size={13} />} onClick={() => exportCSV(members)}>
          {lang === 'ar' ? 'تصدير' : 'Export CSV'}
        </Btn>
        <Btn size="sm" icon={<UserPlus size={13} />} onClick={openAdd}>
          {lang === 'ar' ? 'إضافة عضو' : 'Add Member'}
        </Btn>
      </div>

      {/* ── Roster view ── */}
      {view === 'roster' && (
        members.length === 0 ? (
          <EmptyState icon={Users}
            title={lang === 'ar' ? 'لا يوجد أعضاء بعد' : 'No team members yet'}
            description={lang === 'ar' ? 'ابدأ ببناء فريقك' : 'Add your first team member to get started'}
            action={openAdd} actionLabel={lang === 'ar' ? 'إضافة عضو' : 'Add Member'} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search}
            title={lang === 'ar' ? 'لا نتائج' : 'No results'}
            description={lang === 'ar' ? 'جرب تغيير المرشحات' : 'Try adjusting your search or filters'} />
        ) : (
          <Card>
            <table className="ff-table">
              <thead>
                <tr>
                  <th>{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{lang === 'ar' ? 'القسم' : 'Dept'}</th>
                  <th>{lang === 'ar' ? 'الحضور' : 'Attendance'}</th>
                  <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const cfg = STATUS_CFG[m.status] || STATUS_CFG.absent
                  return (
                    <tr key={m.id} className="group cursor-pointer" onClick={() => setDrawerMember(m)}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={m.name} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-ink">{m.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-ink-faint">{m.role}</p>
                              {(() => {
                                const policy = state.org?.attendancePolicy || {}
                                const role = m.role || ''
                                const isMandatory = policy[role] !== false
                                return (
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded ${
                                    isMandatory
                                      ? 'bg-blue-500/10 text-blue-400'
                                      : 'bg-gray-500/10 text-gray-400'
                                  }`}>
                                    {isMandatory ? '● Mandatory' : '○ Optional'}
                                  </span>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant="default" size="sm">{m.dept || '—'}</Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={m.attendance ?? 0} size="xs" className="w-16" />
                          <span className="text-xs text-ink">{m.attendance ?? 0}%</span>
                        </div>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button onClick={(e) => cycleStatus(m, e)} title="Click to cycle status"
                          className="group/badge">
                          <Badge variant={cfg.variant} dot size="sm"
                            className="group-hover/badge:opacity-80 transition-opacity cursor-pointer">
                            {cfg.label}
                          </Badge>
                        </button>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Btn variant="ghost" size="icon" className="w-7 h-7 text-ink-muted hover:text-ink"
                            onClick={(e) => { e.stopPropagation(); openEdit(m) }} title="Edit member">
                            <Pencil size={12} />
                          </Btn>
                          <Btn variant="ghost" size="icon" className="w-7 h-7 text-ink-muted hover:text-red-400"
                            onClick={(e) => deleteMember(m.id, e)} title="Delete member">
                            <Trash2 size={12} />
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        )
      )}

      {/* ── Org chart view ── */}
      {view === 'orgchart' && (
        <Card>
          <CardHeader title={lang === 'ar' ? 'الهيكل التنظيمي' : 'Org Chart'}
            subtitle={`${members.length} ${lang === 'ar' ? 'عضو' : 'members'}`} />
          {members.length === 0 ? (
            <EmptyState icon={GitBranch}
              title={lang === 'ar' ? 'لا يوجد هيكل بعد' : 'No org structure yet'}
              description={lang === 'ar' ? 'أضف أعضاء وحدد مديريهم' : 'Add members and assign managers to build the org chart'} />
          ) : (
            <div className="space-y-0.5 pt-1">
              {orgRoots.map(root => (
                <OrgNode key={root.id} member={root} allMembers={members} depth={0}
                  onSelect={setDrawerMember} />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Today's summary strip ── */}
      {members.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: lang === 'ar' ? 'حاضرون'  : 'Present',    value: checkedIn,          color: '#10B981' },
            { label: lang === 'ar' ? 'متأخرون' : 'Late',       value: late,               color: '#F59E0B' },
            { label: lang === 'ar' ? 'غائبون'  : 'Absent',     value: absent,             color: '#EF4444' },
            { label: lang === 'ar' ? 'معدل الحضور' : 'Avg Att.', value: `${avgAttendance}%`, color: '#D4920E' },
          ].map(item => (
            <div key={item.label}
              className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-ink-muted">{item.label}</span>
              <span className="text-lg font-bold" style={{ color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Attendance Policy ── */}
      {members.length > 0 && <AttendancePolicyCard />}

      {/* ── Modals + Drawer ── */}
      <MemberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editTarget}
        existingMembers={members}
      />
      <MemberDrawer
        member={liveDrawerMember}
        allMembers={members}
        onClose={() => setDrawerMember(null)}
        onEdit={(m) => { setDrawerMember(null); openEdit(m) }}
      />
    </div>
  )
}

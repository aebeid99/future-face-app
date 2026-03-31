import { useState, useEffect, useMemo } from 'react'
import { useApp } from '@/state/AppContext'
import Btn from '@/components/ui/Btn'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import {
  Users, Calendar, Plus, Search, Filter, ChevronLeft, ChevronRight,
  Phone, Mail, MapPin, Target, Video, Clock, MoreVertical,
  TrendingUp, UserCheck, UserX, Edit2, Trash2, RefreshCw,
  Briefcase, Star, AlertCircle, CheckCircle2, X
} from 'lucide-react'

// ── Constants ────────────────────────────────────────────────────────────────
const ROLES = ['Sales Rep', 'Account Executive', 'Sales Manager', 'SDR', 'BDR']
const TERRITORIES = ['Riyadh', 'Jeddah', 'Dammam', 'Abu Dhabi', 'Dubai', 'Sharjah', 'Remote', 'MENA']
const EVENT_TYPES = {
  meeting:    { label: 'Meeting',     color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  call:       { label: 'Call',        color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  demo:       { label: 'Demo',        color: 'bg-gold/20 text-gold border-gold/30' },
  follow_up:  { label: 'Follow-up',   color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  ooo:        { label: 'Out of Office', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  training:   { label: 'Training',    color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
}
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

// ── Demo seed data ────────────────────────────────────────────────────────────
const SEED_EMPLOYEES = [
  { id: 'e1', name: 'Khalid Al-Rashid', email: 'khalid@futureface.sa', phone: '+966 50 123 4567', role: 'Sales Manager', territory: 'Riyadh', quota: 2000000, quota_currency: 'SAR', status: 'active', joined_date: '2023-01-15', teams_user_id: 'khalid@corp.onmicrosoft.com' },
  { id: 'e2', name: 'Layla Hassan',     email: 'layla@futureface.sa',  phone: '+966 55 234 5678', role: 'Account Executive', territory: 'Jeddah', quota: 1200000, quota_currency: 'SAR', status: 'active', joined_date: '2023-03-20', teams_user_id: 'layla@corp.onmicrosoft.com' },
  { id: 'e3', name: 'Omar Farouk',      email: 'omar@futureface.sa',   phone: '+971 50 345 6789', role: 'Sales Rep', territory: 'Dubai', quota: 800000, quota_currency: 'AED', status: 'active', joined_date: '2023-06-01', teams_user_id: 'omar@corp.onmicrosoft.com' },
  { id: 'e4', name: 'Nora Al-Ghamdi',  email: 'nora@futureface.sa',   phone: '+966 54 456 7890', role: 'SDR', territory: 'Dammam', quota: 400000, quota_currency: 'SAR', status: 'on_leave', joined_date: '2024-01-10', teams_user_id: 'nora@corp.onmicrosoft.com' },
  { id: 'e5', name: 'Yusuf Ibrahim',   email: 'yusuf@futureface.sa',  phone: '+971 55 567 8901', role: 'Account Executive', territory: 'Abu Dhabi', quota: 1500000, quota_currency: 'AED', status: 'active', joined_date: '2022-11-05', teams_user_id: 'yusuf@corp.onmicrosoft.com' },
]

function seedEvents(employees) {
  const today = new Date()
  const events = []
  const titles = [
    ['Q2 Strategy Review', 'demo'],
    ['Enterprise Prospect Call', 'call'],
    ['Product Demo — ACME Corp', 'demo'],
    ['Follow-up: Vision 2030 Proposal', 'follow_up'],
    ['Onboarding Training', 'training'],
    ['Weekly Sales Sync', 'meeting'],
    ['Annual Leave', 'ooo'],
    ['CRM Workshop', 'training'],
    ['Renewal Discussion', 'call'],
    ['New Logo Meeting', 'meeting'],
  ]
  let id = 1
  employees.forEach(emp => {
    for (let d = -3; d <= 14; d++) {
      if (Math.random() > 0.6) continue
      const date = new Date(today)
      date.setDate(today.getDate() + d)
      const [title, type] = titles[Math.floor(Math.random() * titles.length)]
      const startH = 8 + Math.floor(Math.random() * 9)
      const start = new Date(date)
      start.setHours(startH, 0, 0, 0)
      const end = new Date(start)
      end.setHours(startH + 1, 0, 0, 0)
      events.push({
        id: `ev${id++}`, employee_id: emp.id,
        title, event_type: type,
        start_time: start.toISOString(),
        end_time:   end.toISOString(),
        teams_join_url: type === 'meeting' || type === 'demo' ? 'https://teams.microsoft.com/l/meetup-join/fake' : null,
        location: type === 'ooo' ? null : ['Riyadh HQ', 'Teams', 'Client Office', 'Zoom'][Math.floor(Math.random()*4)],
      })
    }
  })
  return events
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d) => new Intl.DateTimeFormat('en-SA', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(d))
const fmtTime = (d) => new Intl.DateTimeFormat('en-SA', { hour: '2-digit', minute: '2-digit' }).format(new Date(d))
const fmtMoney = (n, c = 'SAR') => new Intl.NumberFormat('en-SA', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(n)
const today = () => new Date()
const sameDay = (a, b) => {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear()===db.getFullYear() && da.getMonth()===db.getMonth() && da.getDate()===db.getDate()
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function EmployeeCard({ emp, events, onEdit, onDelete, onViewCalendar }) {
  const today_count = events.filter(e => e.employee_id === emp.id && sameDay(e.start_time, new Date())).length
  const week_count  = events.filter(e => e.employee_id === emp.id).length
  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-gold/40 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar name={emp.name} size="md" />
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface ${
              emp.status === 'active' ? 'bg-green-500' :
              emp.status === 'on_leave' ? 'bg-amber-500' : 'bg-gray-500'
            }`} />
          </div>
          <div>
            <p className="font-semibold text-ink text-sm">{emp.name}</p>
            <p className="text-xs text-ink-muted">{emp.role}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(emp)} className="p-1.5 hover:bg-border rounded-lg text-ink-muted hover:text-ink transition-colors">
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(emp.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-ink-muted hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <MapPin size={11} className="shrink-0" />
          <span>{emp.territory}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Mail size={11} className="shrink-0" />
          <span className="truncate">{emp.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Phone size={11} className="shrink-0" />
          <span>{emp.phone}</span>
        </div>
        {emp.teams_user_id && (
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <Video size={11} className="shrink-0" />
            <span className="truncate">Teams connected</span>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-3 mb-3">
        <div className="flex items-center gap-2 text-xs text-ink-muted mb-1">
          <Target size={11} />
          <span>Annual Quota</span>
        </div>
        <p className="text-sm font-semibold text-gold">{fmtMoney(emp.quota, emp.quota_currency)}</p>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-dark rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-ink">{today_count}</p>
          <p className="text-[10px] text-ink-muted">Today</p>
        </div>
        <div className="flex-1 bg-dark rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-ink">{week_count}</p>
          <p className="text-[10px] text-ink-muted">This period</p>
        </div>
      </div>

      <Btn variant="secondary" size="sm" className="w-full" onClick={() => onViewCalendar(emp)}>
        <Calendar size={13} />
        View Calendar
      </Btn>
    </div>
  )
}

function EventPill({ event }) {
  const cfg = EVENT_TYPES[event.event_type] || EVENT_TYPES.meeting
  return (
    <div className={`text-[10px] px-1.5 py-0.5 rounded border ${cfg.color} truncate cursor-default`}
         title={`${event.title} — ${fmtTime(event.start_time)}`}>
      {event.title}
    </div>
  )
}

function WeekCalendar({ employees, events, selectedEmp }) {
  const [weekOffset, setWeekOffset] = useState(0)

  const weekDates = useMemo(() => {
    const now = new Date()
    now.setDate(now.getDate() + weekOffset * 7)
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)) // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }, [weekOffset])

  const visibleEmps = selectedEmp ? [selectedEmp] : employees.filter(e => e.status === 'active')

  const getEventsForDay = (empId, date) =>
    events.filter(e => e.employee_id === empId && sameDay(e.start_time, date))

  const isToday = (d) => sameDay(d, new Date())

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-ink text-sm">
            {selectedEmp ? `${selectedEmp.name}'s Calendar` : 'Team Calendar'}
          </h3>
          {selectedEmp && (
            <span className="text-xs text-ink-muted">{selectedEmp.role} · {selectedEmp.territory}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">
            {MONTHS[weekDates[0].getMonth()]} {weekDates[0].getDate()} – {MONTHS[weekDates[6].getMonth()]} {weekDates[6].getDate()}, {weekDates[0].getFullYear()}
          </span>
          <button onClick={() => setWeekOffset(0)} className="text-xs text-gold hover:text-gold/80 px-2 py-1 rounded border border-gold/30 hover:border-gold/60 transition-colors">
            Today
          </button>
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 hover:bg-border rounded-lg text-ink-muted transition-colors">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 hover:bg-border rounded-lg text-ink-muted transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 900 }}>
          {/* Day headers */}
          <div className="grid border-b border-border" style={{ gridTemplateColumns: `160px repeat(7, 1fr)` }}>
            <div className="px-4 py-2 text-xs text-ink-muted font-medium border-r border-border">Employee</div>
            {weekDates.map((d, i) => (
              <div key={i} className={`px-2 py-2 text-center border-r border-border last:border-r-0 ${isToday(d) ? 'bg-gold/5' : ''}`}>
                <p className="text-[10px] text-ink-muted">{DAYS[d.getDay()]}</p>
                <p className={`text-sm font-semibold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto ${
                  isToday(d) ? 'bg-gold text-dark' : 'text-ink'
                }`}>{d.getDate()}</p>
              </div>
            ))}
          </div>

          {/* Rows */}
          {visibleEmps.length === 0 ? (
            <div className="text-center py-12 text-ink-muted text-sm">No active employees to show</div>
          ) : visibleEmps.map(emp => (
            <div key={emp.id} className="grid border-b border-border last:border-b-0 hover:bg-white/[0.01]"
                 style={{ gridTemplateColumns: `160px repeat(7, 1fr)` }}>
              <div className="px-4 py-3 border-r border-border flex items-center gap-2">
                <Avatar name={emp.name} size="xs" />
                <div>
                  <p className="text-xs font-medium text-ink leading-tight">{emp.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-ink-muted leading-tight">{emp.territory}</p>
                </div>
              </div>
              {weekDates.map((d, i) => {
                const dayEvents = getEventsForDay(emp.id, d)
                const isOOO = dayEvents.some(e => e.event_type === 'ooo')
                return (
                  <div key={i} className={`px-1 py-2 border-r border-border last:border-r-0 space-y-1 min-h-[60px] ${
                    isToday(d) ? 'bg-gold/5' : ''
                  } ${isOOO ? 'bg-red-500/5' : ''}`}>
                    {dayEvents.slice(0, 3).map(ev => <EventPill key={ev.id} event={ev} />)}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-ink-muted pl-1.5">+{dayEvents.length - 3} more</p>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AddEmployeeModal({ open, onClose, onSave, editing }) {
  const blank = { name: '', email: '', phone: '', role: 'Sales Rep', territory: 'Riyadh', quota: '', quota_currency: 'SAR', status: 'active', teams_user_id: '' }
  const [form, setForm] = useState(blank)

  useEffect(() => { setForm(editing ? { ...editing } : blank) }, [editing, open])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.email) return
    onSave({ ...form, id: editing?.id || `e${Date.now()}`, quota: Number(form.quota) || 0 })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Employee' : 'Add Sales Employee'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="ff-label">Full Name *</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Khalid Al-Rashid" required />
          </div>
          <div>
            <label className="ff-label">Email *</label>
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="khalid@company.com" required />
          </div>
          <div>
            <label className="ff-label">Phone</label>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+966 50 000 0000" />
          </div>
          <div>
            <label className="ff-label">Role</label>
            <select className="ff-input" value={form.role} onChange={e => set('role', e.target.value)}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="ff-label">Territory</label>
            <select className="ff-input" value={form.territory} onChange={e => set('territory', e.target.value)}>
              {TERRITORIES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="ff-label">Status</label>
            <select className="ff-input" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="ff-label">Annual Quota</label>
            <Input type="number" value={form.quota} onChange={e => set('quota', e.target.value)} placeholder="1000000" />
          </div>
          <div>
            <label className="ff-label">Quota Currency</label>
            <select className="ff-input" value={form.quota_currency} onChange={e => set('quota_currency', e.target.value)}>
              <option>SAR</option><option>AED</option><option>USD</option>
            </select>
          </div>
        </div>
        <div>
          <label className="ff-label flex items-center gap-1.5">
            <Video size={12} className="text-blue-400" />{' '}Teams {'/'} M365 User Principal Name
          </label>
          <Input value={form.teams_user_id} onChange={e => set('teams_user_id', e.target.value)} placeholder="khalid@company.onmicrosoft.com" />
          <p className="text-[11px] text-ink-muted mt-1">Used to sync calendar events from Microsoft Teams</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Btn variant="ghost" type="button" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" type="submit">{editing ? 'Save Changes' : 'Add Employee'}</Btn>
        </div>
      </form>
    </Modal>
  )
}

function AddEventModal({ open, onClose, onSave, employees }) {
  const blank = { title: '', event_type: 'meeting', employee_id: '', start_time: '', end_time: '', location: '', teams_join_url: '' }
  const [form, setForm] = useState(blank)

  useEffect(() => { if (open) setForm(blank) }, [open])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title || !form.employee_id || !form.start_time) return
    onSave({ ...form, id: `ev${Date.now()}` })
    onClose()
  }

  // Default end = start + 1h
  const handleStartChange = (v) => {
    set('start_time', v)
    if (v) {
      const end = new Date(v)
      end.setHours(end.getHours() + 1)
      set('end_time', end.toISOString().slice(0,16))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Calendar Event" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="ff-label">Event Title *</label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Product Demo — Acme Corp" required />
          </div>
          <div>
            <label className="ff-label">Employee *</label>
            <select className="ff-input" value={form.employee_id} onChange={e => set('employee_id', e.target.value)} required>
              <option value="">Select employee…</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="ff-label">Event Type</label>
            <select className="ff-input" value={form.event_type} onChange={e => set('event_type', e.target.value)}>
              {Object.entries(EVENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="ff-label">Start *</label>
            <Input type="datetime-local" value={form.start_time} onChange={e => handleStartChange(e.target.value)} required />
          </div>
          <div>
            <label className="ff-label">End</label>
            <Input type="datetime-local" value={form.end_time} onChange={e => set('end_time', e.target.value)} />
          </div>
          <div>
            <label className="ff-label">Location</label>
            <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Riyadh HQ / Teams / Client office" />
          </div>
          <div>
            <label className="ff-label flex items-center gap-1.5"><Video size={12} className="text-blue-400" /> Teams Join URL</label>
            <Input value={form.teams_join_url} onChange={e => set('teams_join_url', e.target.value)} placeholder="https://teams.microsoft.com/…" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Btn variant="ghost" type="button" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" type="submit">Add Event</Btn>
        </div>
      </form>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SalesPage() {
  const { state } = useApp()

  const [employees, setEmployees] = useState(SEED_EMPLOYEES)
  const [events, setEvents]       = useState(() => seedEvents(SEED_EMPLOYEES))
  const [view, setView]           = useState('employees') // 'employees' | 'calendar'
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTerritory, setFilterTerritory] = useState('all')
  const [selectedEmp, setSelectedEmp]   = useState(null)
  const [showAddEmp, setShowAddEmp]     = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [editingEmp, setEditingEmp]     = useState(null)
  const [syncing, setSyncing]           = useState(false)

  // Stats
  const stats = useMemo(() => {
    const active = employees.filter(e => e.status === 'active').length
    const on_leave = employees.filter(e => e.status === 'on_leave').length
    const todayEvts = events.filter(e => sameDay(e.start_time, new Date())).length
    const demos = events.filter(e => e.event_type === 'demo').length
    return { active, on_leave, total: employees.length, todayEvts, demos }
  }, [employees, events])

  const filtered = useMemo(() =>
    employees.filter(e => {
      if (filterStatus !== 'all' && e.status !== filterStatus) return false
      if (filterTerritory !== 'all' && e.territory !== filterTerritory) return false
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) &&
          !e.email.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }), [employees, filterStatus, filterTerritory, search])

  const handleSaveEmployee = (emp) => {
    setEmployees(prev => {
      const idx = prev.findIndex(e => e.id === emp.id)
      return idx >= 0 ? prev.map(e => e.id === emp.id ? emp : e) : [...prev, emp]
    })
  }

  const handleDeleteEmployee = (id) => {
    setEmployees(prev => prev.filter(e => e.id !== id))
    setEvents(prev => prev.filter(e => e.employee_id !== id))
  }

  const handleViewCalendar = (emp) => {
    setSelectedEmp(emp)
    setView('calendar')
  }

  const handleSaveEvent = (event) => {
    setEvents(prev => [...prev, event])
  }

  const handleTeamsSync = async () => {
    setSyncing(true)
    // Simulated Teams sync — in production, call Microsoft Graph API
    await new Promise(r => setTimeout(r, 2000))
    setSyncing(false)
  }

  const territories = ['all', ...new Set(employees.map(e => e.territory))]

  return (
    <div className="p-0 max-w-screen-2xl mx-auto">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink">Sales Team</h1>
            <p className="text-ink-muted text-sm mt-0.5">Manage employees and sync their Teams calendars</p>
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="ghost" size="sm" onClick={handleTeamsSync} disabled={syncing}>
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing…' : 'Sync Teams'}
            </Btn>
            <Btn variant="secondary" size="sm" onClick={() => setShowAddEvent(true)}>
              <Calendar size={14} />
              Add Event
            </Btn>
            <Btn variant="primary" size="sm" onClick={() => { setEditingEmp(null); setShowAddEmp(true) }}>
              <Plus size={14} />
              Add Employee
            </Btn>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Reps', value: stats.total, icon: Users, color: 'text-ink' },
            { label: 'Active Now', value: stats.active, icon: UserCheck, color: 'text-green-400' },
            { label: 'On Leave', value: stats.on_leave, icon: UserX, color: 'text-amber-400' },
            { label: "Today's Events", value: stats.todayEvts, icon: Calendar, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-dark flex items-center justify-center">
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{s.value}</p>
                <p className="text-xs text-ink-muted">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* View tabs */}
        <div className="flex gap-1 bg-dark rounded-xl p-1 w-fit mb-5">
          {[
            { id: 'employees', label: 'Employees', icon: Users },
            { id: 'calendar',  label: 'Calendar',  icon: Calendar },
          ].map(tab => (
            <button key={tab.id}
              onClick={() => { setView(tab.id); if (tab.id === 'employees') setSelectedEmp(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === tab.id ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Employees view */}
        {view === 'employees' && (
          <>
            {/* Filters */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  className="ff-input pl-8 text-sm"
                  placeholder="Search employees…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select className="ff-input text-sm w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
              <select className="ff-input text-sm w-auto" value={filterTerritory} onChange={e => setFilterTerritory(e.target.value)}>
                {territories.map(t => <option key={t} value={t}>{t === 'all' ? 'All territories' : t}</option>)}
              </select>
            </div>

            {filtered.length === 0 ? (
              <EmptyState icon={Users} title="No employees found" description="Try adjusting filters or add a new employee." action={<Btn onClick={() => setShowAddEmp(true)} variant="primary" size="sm"><Plus size={14} />Add Employee</Btn>} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(emp => (
                  <EmployeeCard
                    key={emp.id} emp={emp} events={events}
                    onEdit={e => { setEditingEmp(e); setShowAddEmp(true) }}
                    onDelete={handleDeleteEmployee}
                    onViewCalendar={handleViewCalendar}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Calendar view */}
        {view === 'calendar' && (
          <div className="space-y-4">
            {selectedEmp && (
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedEmp(null)}
                  className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
                  <ChevronLeft size={14} /> All employees
                </button>
                <span className="text-ink-muted">·</span>
                <span className="text-sm text-ink font-medium">{selectedEmp.name}</span>
                <Badge variant={selectedEmp.status === 'active' ? 'on_track' : 'at_risk'} size="sm">
                  {selectedEmp.status === 'active' ? 'Active' : 'On Leave'}
                </Badge>
              </div>
            )}

            {/* Today's events strip */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Clock size={14} className="text-gold" />
                  Today's Events
                </h3>
                <span className="text-xs text-ink-muted">{new Date().toLocaleDateString('en-SA', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
              {(() => {
                const todayEvts = events
                  .filter(e => sameDay(e.start_time, new Date()) &&
                    (!selectedEmp || e.employee_id === selectedEmp.id))
                  .sort((a,b) => new Date(a.start_time) - new Date(b.start_time))
                if (!todayEvts.length) return <p className="text-sm text-ink-muted">No events scheduled for today.</p>
                return (
                  <div className="flex flex-wrap gap-2">
                    {todayEvts.map(ev => {
                      const emp = employees.find(e => e.id === ev.employee_id)
                      const cfg = EVENT_TYPES[ev.event_type] || EVENT_TYPES.meeting
                      return (
                        <div key={ev.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${cfg.color}`}>
                          {emp && <Avatar name={emp.name} size="xs" />}
                          <div>
                            <p className="font-medium">{ev.title}</p>
                            <p className="opacity-70">{fmtTime(ev.start_time)} · {emp?.name?.split(' ')[0]}</p>
                          </div>
                          {ev.teams_join_url && (
                            <a href={ev.teams_join_url} target="_blank" rel="noreferrer"
                               className="ml-1 p-1 rounded hover:bg-white/10 transition-colors" title="Join Teams">
                              <Video size={11} />
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* Week grid */}
            <WeekCalendar employees={employees} events={events} selectedEmp={selectedEmp} />

            {/* Teams integration note */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
              <Video size={18} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-ink">Microsoft Teams Calendar Sync</p>
                <p className="text-xs text-ink-muted mt-1">
                  Events are synced via the Microsoft Graph API. To connect, add each employee's Teams User Principal Name
                  in their profile and configure your Azure AD app credentials in Settings → Integrations.
                  Once connected, meetings, calls, and OOO blocks sync automatically every 15 minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <AddEmployeeModal
          open={showAddEmp}
          onClose={() => setShowAddEmp(false)}
          onSave={handleSaveEmployee}
          editing={editingEmp}
        />
        <AddEventModal
          open={showAddEvent}
          onClose={() => setShowAddEvent(false)}
          onSave={handleSaveEvent}
          employees={employees}
        />
      </div>
  )
}

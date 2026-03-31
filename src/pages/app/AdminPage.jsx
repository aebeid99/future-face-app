import { useState, useEffect, useMemo } from 'react'
import { useApp } from '@/state/AppContext'
import Btn from '@/components/ui/Btn'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import {
  Users, Calendar, Plus, Search, ChevronLeft, ChevronRight,
  Phone, Mail, MapPin, Target, Video, Clock, MoreVertical,
  TrendingUp, UserCheck, UserX, Edit2, Trash2, RefreshCw,
  Briefcase, Star, AlertCircle, CheckCircle2, X,
  BarChart2, Users2, LayoutGrid, DollarSign, Building2,
  Zap, XCircle, Shield, Filter,
} from 'lucide-react'

// ──────────────────────────────────────────────────────────────
// SALES TEAM constants
// ──────────────────────────────────────────────────────────────
const ROLES       = ['Sales Rep', 'Account Executive', 'Sales Manager', 'SDR', 'BDR']
const TERRITORIES = ['Riyadh', 'Jeddah', 'Dammam', 'Abu Dhabi', 'Dubai', 'Sharjah', 'Remote', 'MENA']

const EVENT_TYPES = {
  meeting:   { label: 'Meeting',       color: 'bg-blue-500/20 text-blue-300 border-blue-500/30'    },
  call:      { label: 'Call',          color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  demo:      { label: 'Demo',          color: 'bg-gold/20 text-gold border-gold/30'                },
  follow_up: { label: 'Follow-up',     color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  ooo:       { label: 'Out of Office', color: 'bg-red-500/20 text-red-300 border-red-500/30'       },
  training:  { label: 'Training',      color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'    },
}

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

// ── Employee seed data ─────────────────────────────────────────
const SEED_EMPLOYEES = [
  { id: 'e1', name: 'Khalid Al-Rashid', email: 'khalid@futureface.sa', phone: '+966 50 123 4567', role: 'Sales Manager',     territory: 'Riyadh',    quota: 2000000, quota_currency: 'SAR', status: 'active',   joined_date: '2023-01-15', teams_user_id: 'khalid@corp.onmicrosoft.com' },
  { id: 'e2', name: 'Layla Hassan',     email: 'layla@futureface.sa',  phone: '+966 55 234 5678', role: 'Account Executive', territory: 'Jeddah',    quota: 1200000, quota_currency: 'SAR', status: 'active',   joined_date: '2023-03-20', teams_user_id: 'layla@corp.onmicrosoft.com'  },
  { id: 'e3', name: 'Omar Farouk',      email: 'omar@futureface.sa',   phone: '+971 50 345 6789', role: 'Sales Rep',         territory: 'Dubai',     quota: 800000,  quota_currency: 'AED', status: 'active',   joined_date: '2023-06-01', teams_user_id: 'omar@corp.onmicrosoft.com'   },
  { id: 'e4', name: 'Nora Al-Ghamdi',  email: 'nora@futureface.sa',   phone: '+966 54 456 7890', role: 'SDR',               territory: 'Dammam',    quota: 400000,  quota_currency: 'SAR', status: 'on_leave', joined_date: '2024-01-10', teams_user_id: 'nora@corp.onmicrosoft.com'   },
  { id: 'e5', name: 'Yusuf Ibrahim',   email: 'yusuf@futureface.sa',  phone: '+971 55 567 8901', role: 'Account Executive', territory: 'Abu Dhabi', quota: 1500000, quota_currency: 'AED', status: 'active',   joined_date: '2022-11-05', teams_user_id: 'yusuf@corp.onmicrosoft.com'  },
]

function seedEvents(employees) {
  const today  = new Date()
  const events = []
  const titles = [
    ['Q2 Strategy Review',           'demo'],
    ['Enterprise Prospect Call',     'call'],
    ['Product Demo — ACME Corp',     'demo'],
    ['Follow-up: Vision 2030 Proposal', 'follow_up'],
    ['Onboarding Training',          'training'],
    ['Weekly Sales Sync',            'meeting'],
    ['Annual Leave',                 'ooo'],
    ['CRM Workshop',                 'training'],
    ['Renewal Discussion',           'call'],
    ['New Logo Meeting',             'meeting'],
  ]
  let id = 1
  employees.forEach(emp => {
    for (let d = -3; d <= 14; d++) {
      if (Math.random() > 0.6) continue
      const date = new Date(today)
      date.setDate(today.getDate() + d)
      const [title, type] = titles[Math.floor(Math.random() * titles.length)]
      const startH = 8 + Math.floor(Math.random() * 9)
      const start  = new Date(date); start.setHours(startH, 0, 0, 0)
      const end    = new Date(start); end.setHours(startH + 1, 0, 0, 0)
      events.push({
        id: `ev${id++}`, employee_id: emp.id,
        title, event_type: type,
        start_time: start.toISOString(),
        end_time:   end.toISOString(),
        teams_join_url: (type === 'meeting' || type === 'demo')
          ? 'https://teams.microsoft.com/l/meetup-join/fake' : null,
        location: type === 'ooo' ? null
          : ['Riyadh HQ','Teams','Client Office','Zoom'][Math.floor(Math.random()*4)],
      })
    }
  })
  return events
}

// ──────────────────────────────────────────────────────────────
// CRM constants
// ──────────────────────────────────────────────────────────────
const STAGES = [
  { id: 'lead',        label: 'Lead',        color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',       dot: 'bg-gray-400',    count_color: 'text-gray-400'   },
  { id: 'demo_booked', label: 'Demo Booked', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',       dot: 'bg-blue-400',    count_color: 'text-blue-400'   },
  { id: 'demo_done',   label: 'Demo Done',   color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', dot: 'bg-purple-400',  count_color: 'text-purple-400' },
  { id: 'trial',       label: 'Trial',       color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',    dot: 'bg-amber-400',   count_color: 'text-amber-400'  },
  { id: 'converted',   label: 'Converted',   color: 'bg-green-500/20 text-green-300 border-green-500/30',    dot: 'bg-green-400',   count_color: 'text-green-400'  },
  { id: 'churned',     label: 'Churned',     color: 'bg-red-500/20 text-red-300 border-red-500/30',          dot: 'bg-red-400',     count_color: 'text-red-400'    },
]

const SEED_REPS = [
  { id: 'rep_1', name: 'Khalid Al-Harbi',  territory: 'Riyadh',    quota: 480000, currency: 'SAR' },
  { id: 'rep_2', name: 'Sara Mahmoud',     territory: 'Jeddah',    quota: 360000, currency: 'SAR' },
  { id: 'rep_3', name: 'Ahmed Al-Rashidi', territory: 'Dubai',     quota: 540000, currency: 'SAR' },
  { id: 'rep_4', name: 'Nora Al-Ghamdi',  territory: 'Abu Dhabi', quota: 300000, currency: 'SAR' },
]

const SEED_DEALS = [
  { id: 'd1', company: 'Acme Fintech KSA',    contact: 'Rami Al-Otaibi',   stage: 'converted',   value: 84000,  rep: 'rep_1', source: 'Outbound', closedAt: '2026-03-15', notes: 'Annual contract. Product → Enterprise plan.' },
  { id: 'd2', company: 'GovTech Riyadh',      contact: 'Dr. Layla Hassan', stage: 'trial',       value: 120000, rep: 'rep_3', source: 'Inbound',  closedAt: null, notes: 'Started trial Apr 1. Vision 2030 alignment.' },
  { id: 'd3', company: 'Najd Logistics',      contact: 'Faisal Al-Shehri', stage: 'demo_done',   value: 48000,  rep: 'rep_1', source: 'Partner',  closedAt: null, notes: 'Demo went well. Waiting for procurement.' },
  { id: 'd4', company: 'Madinah Media Group', contact: 'Lina Bakhsh',      stage: 'demo_booked', value: 36000,  rep: 'rep_2', source: 'Event',    closedAt: null, notes: 'Met at GITEX. Demo scheduled Apr 7.' },
  { id: 'd5', company: 'Jeddah Retail Co.',   contact: 'Omar Farouq',      stage: 'lead',        value: 24000,  rep: 'rep_2', source: 'Inbound',  closedAt: null, notes: 'Filled contact form for SME plan.' },
  { id: 'd6', company: 'Dubai SaaS Hub',      contact: 'Tariq Al-Mansoor', stage: 'converted',   value: 96000,  rep: 'rep_3', source: 'Referral', closedAt: '2026-02-20', notes: 'Referred by Acme Fintech.' },
  { id: 'd7', company: 'AlAhsa Tech Park',    contact: 'Waleed Ismail',    stage: 'churned',     value: 18000,  rep: 'rep_4', source: 'Outbound', closedAt: '2026-03-01', notes: 'Budget cut. Re-approach Q3.' },
  { id: 'd8', company: 'Emirates EduTech',    contact: 'Mona Al-Zaabi',    stage: 'demo_booked', value: 60000,  rep: 'rep_3', source: 'Inbound',  closedAt: null, notes: 'Enterprise edu license inquiry.' },
  { id: 'd9', company: 'KSA Insurance Co.',   contact: 'Saud Al-Mutairi',  stage: 'trial',       value: 72000,  rep: 'rep_1', source: 'Partner',  closedAt: null, notes: 'Pilot for 50-seat team.' },
]

const BLANK_DEAL = { company: '', contact: '', stage: 'lead', value: '', rep: '', source: 'Inbound', notes: '' }
const SOURCES    = ['Inbound', 'Outbound', 'Referral', 'Partner', 'Event', 'Other']

// ──────────────────────────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────────────────────────
const fmtTime  = (d) => new Intl.DateTimeFormat('en-SA', { hour: '2-digit', minute: '2-digit' }).format(new Date(d))
const fmtMoney = (n, c = 'SAR') => new Intl.NumberFormat('en-SA', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(n)
const sameDay  = (a, b) => {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

// ──────────────────────────────────────────────────────────────
// SALES TEAM sub-components
// ──────────────────────────────────────────────────────────────

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
              emp.status === 'active'   ? 'bg-green-500' :
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
          <MapPin size={11} className="shrink-0" /><span>{emp.territory}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Mail size={11} className="shrink-0" /><span className="truncate">{emp.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Phone size={11} className="shrink-0" /><span>{emp.phone}</span>
        </div>
        {emp.teams_user_id && (
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <Video size={11} className="shrink-0" /><span className="truncate">Teams connected</span>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-3 mb-3">
        <div className="flex items-center gap-2 text-xs text-ink-muted mb-1">
          <Target size={11} /><span>Annual Quota</span>
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
        <Calendar size={13} />View Calendar
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
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }, [weekOffset])

  const visibleEmps = selectedEmp ? [selectedEmp] : employees.filter(e => e.status === 'active')
  const getEventsForDay = (empId, date) => events.filter(e => e.employee_id === empId && sameDay(e.start_time, date))
  const isToday = (d) => sameDay(d, new Date())

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
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
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 hover:bg-border rounded-lg text-ink-muted transition-colors"><ChevronLeft size={14} /></button>
          <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 hover:bg-border rounded-lg text-ink-muted transition-colors"><ChevronRight size={14} /></button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 900 }}>
          <div className="grid border-b border-border" style={{ gridTemplateColumns: `160px repeat(7, 1fr)` }}>
            <div className="px-4 py-2 text-xs text-ink-muted font-medium border-r border-border">Employee</div>
            {weekDates.map((d, i) => (
              <div key={i} className={`px-2 py-2 text-center border-r border-border last:border-r-0 ${isToday(d) ? 'bg-gold/5' : ''}`}>
                <p className="text-[10px] text-ink-muted">{DAYS[d.getDay()]}</p>
                <p className={`text-sm font-semibold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto ${isToday(d) ? 'bg-gold text-dark' : 'text-ink'}`}>
                  {d.getDate()}
                </p>
              </div>
            ))}
          </div>
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
                const isOOO    = dayEvents.some(e => e.event_type === 'ooo')
                return (
                  <div key={i} className={`px-1 py-2 border-r border-border last:border-r-0 space-y-1 min-h-[60px] ${isToday(d) ? 'bg-gold/5' : ''} ${isOOO ? 'bg-red-500/5' : ''}`}>
                    {dayEvents.slice(0, 3).map(ev => <EventPill key={ev.id} event={ev} />)}
                    {dayEvents.length > 3 && <p className="text-[10px] text-ink-muted pl-1.5">+{dayEvents.length - 3} more</p>}
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
            <Video size={12} className="text-blue-400" /> Teams / M365 User Principal Name
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

  const handleStartChange = (v) => {
    set('start_time', v)
    if (v) {
      const end = new Date(v)
      end.setHours(end.getHours() + 1)
      set('end_time', end.toISOString().slice(0, 16))
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

// ──────────────────────────────────────────────────────────────
// CRM sub-components
// ──────────────────────────────────────────────────────────────

function StagePill({ stage }) {
  const cfg = STAGES.find(s => s.id === stage) || STAGES[0]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function DealCard({ deal, onEdit, onDelete, onStageChange, dragHandlers, isDragOver }) {
  const rep = SEED_REPS.find(r => r.id === deal.rep)
  return (
    <div
      {...(dragHandlers || {})}
      className={`group bg-surface border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all ${isDragOver ? 'border-gold/60 bg-gold/5 scale-[1.02]' : 'border-border hover:border-border-hover'}`}
    >
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="w-7 h-7 rounded-lg bg-dark flex items-center justify-center flex-shrink-0">
          <Building2 size={12} className="text-ink-muted" />
        </div>
        <div className="flex-1 min-w-0 ml-2">
          <p className="text-xs font-semibold text-ink leading-tight truncate">{deal.company}</p>
          <p className="text-[10px] text-ink-muted truncate">{deal.contact}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(deal)} className="p-1 text-ink-faint hover:text-ink rounded"><Edit2 size={10} /></button>
          <button onClick={() => onDelete(deal.id)} className="p-1 text-ink-faint hover:text-red-400 rounded"><Trash2 size={10} /></button>
        </div>
      </div>
      <p className="text-sm font-bold text-gold mb-1">{fmtMoney(deal.value)}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-ink-faint">{deal.source}</span>
        {rep && <Avatar name={rep.name} size="xs" />}
      </div>
      {deal.notes && <p className="text-[10px] text-ink-faint mt-1.5 line-clamp-1 italic">{deal.notes}</p>}
    </div>
  )
}

function DealModal({ open, onClose, onSave, editing }) {
  const [form, setForm] = useState(editing || BLANK_DEAL)
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }))
  useMemo(() => setForm(editing || BLANK_DEAL), [editing, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.company.trim()) return
    onSave({ ...form, id: editing?.id || `d${Date.now()}`, value: Number(form.value) || 0 })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Deal' : 'Add Deal'}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ff-label">Company *</label>
            <Input value={form.company} onChange={e => s('company', e.target.value)} placeholder="ACME Corp" required />
          </div>
          <div>
            <label className="ff-label">Contact</label>
            <Input value={form.contact} onChange={e => s('contact', e.target.value)} placeholder="Name" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ff-label">Stage</label>
            <select className="ff-input text-sm" value={form.stage} onChange={e => s('stage', e.target.value)}>
              {STAGES.map(st => <option key={st.id} value={st.id}>{st.label}</option>)}
            </select>
          </div>
          <div>
            <label className="ff-label">Deal Value (SAR)</label>
            <Input type="number" value={form.value} onChange={e => s('value', e.target.value)} placeholder="48000" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ff-label">Assigned Rep</label>
            <select className="ff-input text-sm" value={form.rep} onChange={e => s('rep', e.target.value)}>
              <option value="">Unassigned</option>
              {SEED_REPS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="ff-label">Source</label>
            <select className="ff-input text-sm" value={form.source} onChange={e => s('source', e.target.value)}>
              {SOURCES.map(src => <option key={src}>{src}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="ff-label">Notes</label>
          <textarea className="ff-input text-sm resize-none" rows={2} value={form.notes} onChange={e => s('notes', e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <Btn variant="ghost" type="button" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" type="submit">{editing ? 'Save Changes' : 'Add Deal'}</Btn>
        </div>
      </form>
    </Modal>
  )
}

function RepPerformanceTable({ deals }) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-ink">Rep Performance</p>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-dark/40">
            <th className="text-left px-4 py-2 text-ink-muted font-medium">Rep</th>
            <th className="text-right px-4 py-2 text-ink-muted font-medium">Demos Booked</th>
            <th className="text-right px-4 py-2 text-ink-muted font-medium">Demos Done</th>
            <th className="text-right px-4 py-2 text-ink-muted font-medium">Converted</th>
            <th className="text-right px-4 py-2 text-ink-muted font-medium">Conversion Rate</th>
            <th className="text-right px-4 py-2 text-ink-muted font-medium">ARR</th>
          </tr>
        </thead>
        <tbody>
          {SEED_REPS.map(rep => {
            const repDeals   = deals.filter(d => d.rep === rep.id)
            const demoBooked = repDeals.filter(d => ['demo_booked','demo_done','trial','converted'].includes(d.stage)).length
            const demoDone   = repDeals.filter(d => ['demo_done','trial','converted'].includes(d.stage)).length
            const converted  = repDeals.filter(d => d.stage === 'converted').length
            const rate       = demoBooked > 0 ? Math.round((converted / demoBooked) * 100) : 0
            const arr        = repDeals.filter(d => d.stage === 'converted').reduce((s, d) => s + d.value, 0)
            const rateColor  = rate >= 30 ? 'text-green-400' : rate >= 15 ? 'text-amber-400' : 'text-red-400'
            return (
              <tr key={rep.id} className="border-b border-border/50 last:border-b-0 hover:bg-surface-hover transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Avatar name={rep.name} size="xs" />
                    <div>
                      <p className="font-medium text-ink">{rep.name}</p>
                      <p className="text-[10px] text-ink-muted">{rep.territory}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-ink">{demoBooked}</td>
                <td className="px-4 py-2.5 text-right text-ink">{demoDone}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-green-400">{converted}</td>
                <td className={`px-4 py-2.5 text-right font-bold ${rateColor}`}>{rate}%</td>
                <td className="px-4 py-2.5 text-right font-semibold text-gold">{fmtMoney(arr)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Sales Team tab
// ──────────────────────────────────────────────────────────────
function SalesTeamTab() {
  const [employees, setEmployees]   = useState(SEED_EMPLOYEES)
  const [events, setEvents]         = useState(() => seedEvents(SEED_EMPLOYEES))
  const [view, setView]             = useState('employees')
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilterStatus]       = useState('all')
  const [filterTerritory, setFilterTerritory] = useState('all')
  const [selectedEmp, setSelectedEmp]         = useState(null)
  const [showAddEmp, setShowAddEmp]           = useState(false)
  const [showAddEvent, setShowAddEvent]       = useState(false)
  const [editingEmp, setEditingEmp]           = useState(null)
  const [syncing, setSyncing]                 = useState(false)

  const stats = useMemo(() => ({
    total:     employees.length,
    active:    employees.filter(e => e.status === 'active').length,
    on_leave:  employees.filter(e => e.status === 'on_leave').length,
    todayEvts: events.filter(e => sameDay(e.start_time, new Date())).length,
  }), [employees, events])

  const territories = ['all', ...new Set(employees.map(e => e.territory))]

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
  const handleViewCalendar = (emp) => { setSelectedEmp(emp); setView('calendar') }
  const handleSaveEvent = (event) => setEvents(prev => [...prev, event])
  const handleTeamsSync = async () => {
    setSyncing(true)
    await new Promise(r => setTimeout(r, 2000))
    setSyncing(false)
  }

  return (
    <div>
      {/* Header actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-ink-muted text-sm">Manage employees and sync their Teams calendars</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm" onClick={handleTeamsSync} disabled={syncing}>
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync Teams'}
          </Btn>
          <Btn variant="secondary" size="sm" onClick={() => setShowAddEvent(true)}>
            <Calendar size={14} />Add Event
          </Btn>
          <Btn variant="primary" size="sm" onClick={() => { setEditingEmp(null); setShowAddEmp(true) }}>
            <Plus size={14} />Add Employee
          </Btn>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Reps',      value: stats.total,     icon: Users,      color: 'text-ink'        },
          { label: 'Active Now',      value: stats.active,    icon: UserCheck,  color: 'text-green-400'  },
          { label: 'On Leave',        value: stats.on_leave,  icon: UserX,      color: 'text-amber-400'  },
          { label: "Today's Events",  value: stats.todayEvts, icon: Calendar,   color: 'text-blue-400'   },
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

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-dark rounded-xl p-1 w-fit mb-5">
        {[
          { id: 'employees', label: 'Employees', icon: Users    },
          { id: 'calendar',  label: 'Calendar',  icon: Calendar },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => { setView(tab.id); if (tab.id === 'employees') setSelectedEmp(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === tab.id ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {/* Employees view */}
      {view === 'employees' && (
        <>
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input className="ff-input pl-8 text-sm" placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} />
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
            <EmptyState icon={Users} title="No employees found" description="Try adjusting filters or add a new employee."
              action={<Btn onClick={() => setShowAddEmp(true)} variant="primary" size="sm"><Plus size={14} />Add Employee</Btn>} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(emp => (
                <EmployeeCard key={emp.id} emp={emp} events={events}
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
              <button onClick={() => setSelectedEmp(null)} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
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
                <Clock size={14} className="text-gold" />Today's Events
              </h3>
              <span className="text-xs text-ink-muted">{new Date().toLocaleDateString('en-SA', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            {(() => {
              const todayEvts = events
                .filter(e => sameDay(e.start_time, new Date()) && (!selectedEmp || e.employee_id === selectedEmp.id))
                .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
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

      <AddEmployeeModal open={showAddEmp} onClose={() => setShowAddEmp(false)} onSave={handleSaveEmployee} editing={editingEmp} />
      <AddEventModal    open={showAddEvent} onClose={() => setShowAddEvent(false)} onSave={handleSaveEvent} employees={employees} />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// CRM tab
// ──────────────────────────────────────────────────────────────
function CRMTab() {
  const [deals, setDeals]           = useState(SEED_DEALS)
  const [view, setView]             = useState('pipeline')
  const [showAdd, setShowAdd]       = useState(false)
  const [editingDeal, setEditingDeal] = useState(null)
  const [search, setSearch]         = useState('')
  const [dragging, setDragging]     = useState(null)
  const [overStage, setOverStage]   = useState(null)

  const filtered = useMemo(() =>
    deals.filter(d => !search || d.company.toLowerCase().includes(search.toLowerCase()) || d.contact.toLowerCase().includes(search.toLowerCase())),
  [deals, search])

  const stats = useMemo(() => {
    const total      = deals.length
    const converted  = deals.filter(d => d.stage === 'converted').length
    const inPipeline = deals.filter(d => !['converted','churned'].includes(d.stage)).length
    const totalARR   = deals.filter(d => d.stage === 'converted').reduce((s, d) => s + d.value, 0)
    const pipelineVal = deals.filter(d => !['converted','churned'].includes(d.stage)).reduce((s, d) => s + d.value, 0)
    const demosBooked = deals.filter(d => ['demo_booked','demo_done','trial','converted'].includes(d.stage)).length
    const convRate   = demosBooked > 0 ? Math.round((converted / demosBooked) * 100) : 0
    return { total, converted, inPipeline, totalARR, pipelineVal, demosBooked, convRate }
  }, [deals])

  const saveDeal   = (deal) => setDeals(prev => { const i = prev.findIndex(d => d.id === deal.id); return i >= 0 ? prev.map(d => d.id === deal.id ? deal : d) : [...prev, deal] })
  const deleteDeal = (id)   => setDeals(prev => prev.filter(d => d.id !== id))
  const moveDeal   = (id, stage) => setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d))

  const handleDrop = (stageId) => {
    if (dragging && dragging.stage !== stageId) moveDeal(dragging.id, stageId)
    setDragging(null); setOverStage(null)
  }

  const STAT_CARDS = [
    { label: 'Total Deals',      value: stats.total,              icon: LayoutGrid,   color: 'text-ink'         },
    { label: 'In Pipeline',      value: stats.inPipeline,         icon: Target,       color: 'text-blue-400'   },
    { label: 'Demos Booked',     value: stats.demosBooked,        icon: Calendar,     color: 'text-purple-400' },
    { label: 'Demo → Converted', value: `${stats.convRate}%`,     icon: Zap,          color: 'text-gold'        },
    { label: 'ARR Closed',       value: fmtMoney(stats.totalARR), icon: CheckCircle2, color: 'text-green-400'  },
    { label: 'Pipeline Value',   value: fmtMoney(stats.pipelineVal), icon: DollarSign, color: 'text-amber-400' },
  ]

  return (
    <div>
      {/* Header actions */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-ink-muted text-sm">Track deals from lead to conversion. Measure demo-to-subscription performance.</p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input className="ff-input pl-8 text-sm w-48" placeholder="Search deals…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Btn variant="primary" size="sm" onClick={() => { setEditingDeal(null); setShowAdd(true) }}>
            <Plus size={14} />Add Deal
          </Btn>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {STAT_CARDS.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className={s.color} />
                <span className="text-[10px] text-ink-muted">{s.label}</span>
              </div>
              <p className="text-lg font-bold text-ink">{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-dark rounded-xl p-1 w-fit mb-5">
        {[
          { id: 'pipeline', label: 'Pipeline',    icon: LayoutGrid },
          { id: 'list',     label: 'List',         icon: Users2     },
          { id: 'perf',     label: 'Performance',  icon: BarChart2  },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === tab.id ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}>
              <Icon size={13} />{tab.label}
            </button>
          )
        })}
      </div>

      {/* Pipeline (kanban) */}
      {view === 'pipeline' && (
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 480 }}>
          {STAGES.map(stage => {
            const stageDeals = filtered.filter(d => d.stage === stage.id)
            const stageARR   = stageDeals.reduce((s, d) => s + d.value, 0)
            return (
              <div key={stage.id}
                className={`flex flex-col flex-shrink-0 w-60 rounded-xl transition-all ${overStage === stage.id && dragging ? 'ring-1 ring-gold/40 bg-gold/5' : ''}`}
                onDragOver={e => { e.preventDefault(); setOverStage(stage.id) }}
                onDragLeave={() => setOverStage(null)}
                onDrop={() => handleDrop(stage.id)}
              >
                <div className="flex items-center gap-2 px-3 py-2.5 mb-2">
                  <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                  <span className="text-xs font-semibold text-ink">{stage.label}</span>
                  <span className="ml-auto text-[10px] text-ink-muted bg-border px-1.5 py-0.5 rounded-full">{stageDeals.length}</span>
                </div>
                {stageDeals.length > 0 && <p className="text-[10px] text-ink-faint px-3 mb-2">{fmtMoney(stageARR)}</p>}
                <div className="flex-1 space-y-2 px-1">
                  {stageDeals.map(deal => (
                    <DealCard key={deal.id} deal={deal}
                      onEdit={d => { setEditingDeal(d); setShowAdd(true) }}
                      onDelete={deleteDeal}
                      onStageChange={moveDeal}
                      isDragOver={overStage === stage.id && dragging?.id !== deal.id}
                      dragHandlers={{
                        draggable: true,
                        onDragStart: () => setDragging(deal),
                        onDragEnd:   () => { setDragging(null); setOverStage(null) },
                      }}
                    />
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-ink-faint border border-dashed border-border/40 rounded-lg">Drop here</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List */}
      {view === 'list' && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-dark/40">
                <th className="text-left px-4 py-2.5 text-ink-muted font-medium">Company</th>
                <th className="text-left px-4 py-2.5 text-ink-muted font-medium">Contact</th>
                <th className="text-left px-4 py-2.5 text-ink-muted font-medium">Stage</th>
                <th className="text-right px-4 py-2.5 text-ink-muted font-medium">Value</th>
                <th className="text-left px-4 py-2.5 text-ink-muted font-medium hidden md:table-cell">Rep</th>
                <th className="text-left px-4 py-2.5 text-ink-muted font-medium hidden lg:table-cell">Source</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(deal => {
                const rep = SEED_REPS.find(r => r.id === deal.rep)
                return (
                  <tr key={deal.id} className="group border-b border-border/50 last:border-b-0 hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3 font-medium text-ink">{deal.company}</td>
                    <td className="px-4 py-3 text-ink-muted">{deal.contact}</td>
                    <td className="px-4 py-3"><StagePill stage={deal.stage} /></td>
                    <td className="px-4 py-3 text-right font-semibold text-gold">{fmtMoney(deal.value)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {rep && <div className="flex items-center gap-1.5"><Avatar name={rep.name} size="xs" /><span className="text-ink-muted">{rep.name}</span></div>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-ink-muted">{deal.source}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingDeal(deal); setShowAdd(true) }} className="p-1 text-ink-faint hover:text-ink rounded"><Edit2 size={11} /></button>
                        <button onClick={() => deleteDeal(deal.id)} className="p-1 text-ink-faint hover:text-red-400 rounded"><Trash2 size={11} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Performance */}
      {view === 'perf' && (
        <div className="space-y-5">
          <div className="bg-surface border border-border rounded-xl p-5">
            <p className="text-sm font-semibold text-ink mb-4">Deal Funnel</p>
            <div className="space-y-2">
              {STAGES.map(stage => {
                const count  = deals.filter(d => d.stage === stage.id).length
                const pct    = Math.round((count / deals.length) * 100)
                return (
                  <div key={stage.id} className="flex items-center gap-3">
                    <span className="w-24 text-[11px] text-ink-muted text-right">{stage.label}</span>
                    <div className="flex-1 h-6 bg-dark rounded-lg overflow-hidden">
                      <div className={`h-full rounded-lg transition-all duration-500 ${stage.dot}`}
                           style={{ width: `${(count / deals.length) * 100}%`, opacity: 0.7 }} />
                    </div>
                    <span className="w-8 text-xs font-semibold text-ink text-right">{count}</span>
                    <span className="w-10 text-[10px] text-ink-muted">{pct}%</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-6 text-xs">
              <div><span className="text-ink-muted">Demo → Converted:</span><span className="font-bold text-gold ml-2">{stats.convRate}%</span></div>
              <div><span className="text-ink-muted">Pipeline Value:</span><span className="font-bold text-ink ml-2">{fmtMoney(stats.pipelineVal)}</span></div>
              <div><span className="text-ink-muted">Closed ARR:</span><span className="font-bold text-green-400 ml-2">{fmtMoney(stats.totalARR)}</span></div>
            </div>
          </div>
          <RepPerformanceTable deals={deals} />
        </div>
      )}

      <DealModal open={showAdd} onClose={() => { setShowAdd(false); setEditingDeal(null) }} onSave={saveDeal} editing={editingDeal} />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Main AdminPage
// ──────────────────────────────────────────────────────────────
const TOP_TABS = [
  { id: 'sales', label: 'Sales Team',             icon: Users    },
  { id: 'crm',   label: 'CRM — Customer Pipeline', icon: BarChart2 },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('sales')

  return (
    <div className="p-0 max-w-screen-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Shield size={17} className="text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">Admin</h1>
            <p className="text-ink-muted text-xs mt-0.5">Sales team management &amp; customer pipeline</p>
          </div>
        </div>
      </div>

      {/* Top-level tabs */}
      <div className="flex gap-1 bg-dark rounded-xl p-1 w-fit mb-7 border border-border">
        {TOP_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-surface text-ink shadow-sm border border-border'
                : 'text-ink-muted hover:text-ink'
            }`}>
            <tab.icon size={15} />{tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'sales' && <SalesTeamTab />}
      {activeTab === 'crm'   && <CRMTab />}
    </div>
  )
}

import { useState, useMemo } from 'react'
import {
  TrendingUp, Plus, Search, Phone, Mail, Calendar, Target,
  Edit2, Trash2, ChevronDown, UserCheck, Users, BarChart2,
  ArrowRight, CheckCircle2, XCircle, Clock, Zap, X, Save,
  DollarSign, Building2, Star, AlertCircle, LayoutGrid,
} from 'lucide-react'
import Btn from '@/components/ui/Btn'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

// ── Deal stages ─────────────────────────────────────────────────────────────
const STAGES = [
  { id: 'lead',         label: 'Lead',         color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',    dot: 'bg-gray-400',   count_color: 'text-gray-400'   },
  { id: 'demo_booked',  label: 'Demo Booked',  color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',   dot: 'bg-blue-400',   count_color: 'text-blue-400'   },
  { id: 'demo_done',    label: 'Demo Done',    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', dot: 'bg-purple-400', count_color: 'text-purple-400' },
  { id: 'trial',        label: 'Trial',        color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', dot: 'bg-amber-400',  count_color: 'text-amber-400'  },
  { id: 'converted',    label: 'Converted',    color: 'bg-green-500/20 text-green-300 border-green-500/30', dot: 'bg-green-400',  count_color: 'text-green-400'  },
  { id: 'churned',      label: 'Churned',      color: 'bg-red-500/20 text-red-300 border-red-500/30',       dot: 'bg-red-400',    count_color: 'text-red-400'    },
]

// ── Seed deals ───────────────────────────────────────────────────────────────
const SEED_REPS = [
  { id: 'rep_1', name: 'Khalid Al-Harbi',  territory: 'Riyadh',  quota: 480000, currency: 'SAR' },
  { id: 'rep_2', name: 'Sara Mahmoud',     territory: 'Jeddah',  quota: 360000, currency: 'SAR' },
  { id: 'rep_3', name: 'Ahmed Al-Rashidi', territory: 'Dubai',   quota: 540000, currency: 'SAR' },
  { id: 'rep_4', name: 'Nora Al-Ghamdi',   territory: 'Abu Dhabi', quota: 300000, currency: 'SAR' },
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
const fmtMoney   = (v) => new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(v)

// ── Stage pill ───────────────────────────────────────────────────────────────
function StagePill({ stage }) {
  const cfg = STAGES.find(s => s.id === stage) || STAGES[0]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── Deal card (kanban) ────────────────────────────────────────────────────────
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

// ── Add/Edit Deal modal ───────────────────────────────────────────────────────
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

// ── Rep performance table ─────────────────────────────────────────────────────
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
            const repDeals     = deals.filter(d => d.rep === rep.id)
            const demoBooked   = repDeals.filter(d => ['demo_booked', 'demo_done', 'trial', 'converted'].includes(d.stage)).length
            const demoDone     = repDeals.filter(d => ['demo_done', 'trial', 'converted'].includes(d.stage)).length
            const converted    = repDeals.filter(d => d.stage === 'converted').length
            const rate         = demoBooked > 0 ? Math.round((converted / demoBooked) * 100) : 0
            const arr          = repDeals.filter(d => d.stage === 'converted').reduce((s, d) => s + d.value, 0)
            const rateColor    = rate >= 30 ? 'text-green-400' : rate >= 15 ? 'text-amber-400' : 'text-red-400'
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

// ── Main CRM Page ─────────────────────────────────────────────────────────────
export default function CRMPage() {
  const [deals, setDeals]         = useState(SEED_DEALS)
  const [view, setView]           = useState('pipeline')
  const [showAdd, setShowAdd]     = useState(false)
  const [editingDeal, setEditingDeal] = useState(null)
  const [search, setSearch]       = useState('')
  const [dragging, setDragging]   = useState(null)
  const [overStage, setOverStage] = useState(null)

  const filtered = useMemo(() =>
    deals.filter(d => !search || d.company.toLowerCase().includes(search.toLowerCase()) || d.contact.toLowerCase().includes(search.toLowerCase())),
  [deals, search])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total       = deals.length
    const converted   = deals.filter(d => d.stage === 'converted').length
    const inPipeline  = deals.filter(d => !['converted', 'churned'].includes(d.stage)).length
    const totalARR    = deals.filter(d => d.stage === 'converted').reduce((s, d) => s + d.value, 0)
    const pipelineVal = deals.filter(d => !['converted', 'churned'].includes(d.stage)).reduce((s, d) => s + d.value, 0)
    const demosBooked = deals.filter(d => ['demo_booked', 'demo_done', 'trial', 'converted'].includes(d.stage)).length
    const convRate    = demosBooked > 0 ? Math.round((converted / demosBooked) * 100) : 0
    return { total, converted, inPipeline, totalARR, pipelineVal, demosBooked, convRate }
  }, [deals])

  // ── Deal CRUD ──────────────────────────────────────────────────────────────
  const saveDeal  = (deal) => setDeals(prev => { const i = prev.findIndex(d => d.id === deal.id); return i >= 0 ? prev.map(d => d.id === deal.id ? deal : d) : [...prev, deal] })
  const deleteDeal = (id) => setDeals(prev => prev.filter(d => d.id !== id))
  const moveDeal  = (id, stage) => setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d))

  // ── Drag DnD ───────────────────────────────────────────────────────────────
  const handleDrop = (stageId) => {
    if (dragging && dragging.stage !== stageId) moveDeal(dragging.id, stageId)
    setDragging(null)
    setOverStage(null)
  }

  const STAT_CARDS = [
    { label: 'Total Deals',      value: stats.total,                    icon: LayoutGrid, color: 'text-ink'        },
    { label: 'In Pipeline',      value: stats.inPipeline,               icon: Target,     color: 'text-blue-400'  },
    { label: 'Demos Booked',     value: stats.demosBooked,              icon: Calendar,   color: 'text-purple-400' },
    { label: 'Demo → Converted', value: `${stats.convRate}%`,           icon: Zap,        color: 'text-gold'      },
    { label: 'ARR Closed',       value: fmtMoney(stats.totalARR),       icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Pipeline Value',   value: fmtMoney(stats.pipelineVal),    icon: DollarSign, color: 'text-amber-400' },
  ]

  return (
    <div className="p-0 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">CRM — Customer Pipeline</h1>
          <p className="text-ink-muted text-sm mt-0.5">Track deals from lead to conversion. Measure demo-to-subscription performance.</p>
        </div>
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

      {/* View tabs */}
      <div className="flex gap-1 bg-dark rounded-xl p-1 w-fit mb-5">
        {[
          { id: 'pipeline', label: 'Pipeline', icon: LayoutGrid },
          { id: 'list',     label: 'List',     icon: Users       },
          { id: 'perf',     label: 'Performance', icon: BarChart2 },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === tab.id ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}>
              <Icon size={13} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Pipeline view (kanban by stage) */}
      {view === 'pipeline' && (
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 480 }}>
          {STAGES.map(stage => {
            const stageDeals = filtered.filter(d => d.stage === stage.id)
            const stageARR   = stageDeals.reduce((s, d) => s + d.value, 0)
            return (
              <div
                key={stage.id}
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
                {stageDeals.length > 0 && (
                  <p className="text-[10px] text-ink-faint px-3 mb-2">{fmtMoney(stageARR)}</p>
                )}
                <div className="flex-1 space-y-2 px-1">
                  {stageDeals.map(deal => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
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
                    <div className="text-center py-8 text-[11px] text-ink-faint border border-dashed border-border/40 rounded-lg">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List view */}
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

      {/* Performance view */}
      {view === 'perf' && (
        <div className="space-y-5">
          {/* Funnel */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <p className="text-sm font-semibold text-ink mb-4">Deal Funnel</p>
            <div className="space-y-2">
              {STAGES.map(stage => {
                const count = deals.filter(d => d.stage === stage.id).length
                const maxCount = Math.max(...STAGES.map(s => deals.filter(d => d.stage === s.id).length), 1)
                const pct = Math.round((count / deals.length) * 100)
                return (
                  <div key={stage.id} className="flex items-center gap-3">
                    <span className="w-24 text-[11px] text-ink-muted text-right">{stage.label}</span>
                    <div className="flex-1 h-6 bg-dark rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full rounded-lg transition-all duration-500 ${stage.dot.replace('bg-', 'bg-')}`}
                        style={{ width: `${(count / deals.length) * 100}%`, opacity: 0.7 }}
                      />
                    </div>
                    <span className="w-8 text-xs font-semibold text-ink text-right">{count}</span>
                    <span className="w-10 text-[10px] text-ink-muted">{pct}%</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-6 text-xs">
              <div>
                <span className="text-ink-muted">Demo → Converted:</span>
                <span className="font-bold text-gold ml-2">{stats.convRate}%</span>
              </div>
              <div>
                <span className="text-ink-muted">Pipeline Value:</span>
                <span className="font-bold text-ink ml-2">{fmtMoney(stats.pipelineVal)}</span>
              </div>
              <div>
                <span className="text-ink-muted">Closed ARR:</span>
                <span className="font-bold text-green-400 ml-2">{fmtMoney(stats.totalARR)}</span>
              </div>
            </div>
          </div>
          <RepPerformanceTable deals={deals} />
        </div>
      )}

      {/* Add/Edit modal */}
      <DealModal
        open={showAdd}
        onClose={() => { setShowAdd(false); setEditingDeal(null) }}
        onSave={saveDeal}
        editing={editingDeal}
      />
    </div>
  )
}

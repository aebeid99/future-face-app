import { useState, useMemo } from 'react'
import {
  ScrollText, Search, Filter, X, Download,
  ChevronLeft, ChevronRight, Target, Layers, Bot, Map, Settings, Users
} from 'lucide-react'
import Card, { CardHeader } from '../../components/ui/Card.jsx'
import Avatar from '../../components/ui/Avatar.jsx'
import Btn from '../../components/ui/Btn.jsx'
import { useApp } from '../../state/AppContext.jsx'

// ─── Constants ────────────────────────────────────────────────
const PAGE_SIZE = 25

const MODULE_META = {
  impactor: { label: 'Impactor', icon: Target,   cls: 'bg-gold/10 text-gold border border-gold/20' },
  issues:   { label: 'Issues',   icon: Layers,   cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  robox:    { label: 'Robox',    icon: Users,    cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  ai_pilot: { label: 'AI Pilot', icon: Bot,      cls: 'bg-violet-500/10 text-violet-400 border border-violet-500/20' },
  roadmap:  { label: 'Roadmap',  icon: Map,      cls: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' },
  settings: { label: 'Settings', icon: Settings, cls: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20' },
}

const ACTION_COLOR = {
  create:  'text-emerald-400',
  update:  'text-blue-400',
  delete:  'text-red-400',
  checkin: 'text-gold',
  status:  'text-violet-400',
  default: 'text-ink',
}

function actionColor(action = '') {
  const a = action.toLowerCase()
  if (a.includes('creat') || a.includes('add') || a.includes('invite')) return ACTION_COLOR.create
  if (a.includes('delet') || a.includes('remov'))                        return ACTION_COLOR.delete
  if (a.includes('check') || a.includes('checked'))                      return ACTION_COLOR.checkin
  if (a.includes('status') || a.includes('changed status'))              return ACTION_COLOR.status
  if (a.includes('updat') || a.includes('edit'))                         return ACTION_COLOR.update
  return ACTION_COLOR.default
}

// ─── Time formatter ────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return iso
  const now  = Date.now()
  const diff = now - d.getTime()
  if (diff < 60_000)               return 'just now'
  if (diff < 3_600_000)            return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000)           return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 7 * 86_400_000)       return `${Math.floor(diff / 86_400_000)}d ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isoDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d) ? '' : d.toISOString().slice(0, 10)
}

// ─── Sub-components ────────────────────────────────────────────
function ModulePill({ module }) {
  const meta = MODULE_META[module] || { label: module, icon: ScrollText, cls: 'bg-surface-2 text-ink-muted border border-surface-3' }
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.cls}`}>
      <Icon size={9} />
      {meta.label}
    </span>
  )
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-surface-2 rounded-lg p-3 flex flex-col gap-0.5">
      <span className="text-[10px] text-ink-muted uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-bold ${accent || 'text-ink'}`}>{value}</span>
      {sub && <span className="text-[10px] text-ink-faint">{sub}</span>}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────
export default function AuditPage() {
  const { state }    = useApp()
  const { lang, auditLog = [], members = [] } = state

  // ── Filters
  const [search,    setSearch]    = useState('')
  const [modFilter, setModFilter] = useState('')
  const [userFilter,setUserFilter]= useState('')
  const [dateFrom,  setDateFrom]  = useState('')
  const [dateTo,    setDateTo]    = useState('')
  const [page,      setPage]      = useState(1)

  // ── Unique options
  const moduleOptions = useMemo(() => {
    const s = new Set(auditLog.map(e => e.module).filter(Boolean))
    return [...s].sort()
  }, [auditLog])

  const userOptions = useMemo(() => {
    const s = new Set(auditLog.map(e => e.user).filter(Boolean))
    return [...s].sort()
  }, [auditLog])

  // ── Stats
  const today = new Date().toISOString().slice(0, 10)
  const stats = useMemo(() => {
    const todayCount   = auditLog.filter(e => isoDate(e.time) === today).length
    const createCount  = auditLog.filter(e => {
      const a = (e.action || '').toLowerCase()
      return a.includes('creat') || a.includes('add') || a.includes('invite')
    }).length
    const deleteCount  = auditLog.filter(e => {
      const a = (e.action || '').toLowerCase()
      return a.includes('delet') || a.includes('remov')
    }).length
    return { total: auditLog.length, todayCount, createCount, deleteCount }
  }, [auditLog, today])

  // ── Filtered list
  const filtered = useMemo(() => {
    let list = [...auditLog]
    if (search)     list = list.filter(e =>
      (e.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.target || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.user   || '').toLowerCase().includes(search.toLowerCase())
    )
    if (modFilter)  list = list.filter(e => e.module === modFilter)
    if (userFilter) list = list.filter(e => e.user === userFilter)
    if (dateFrom)   list = list.filter(e => isoDate(e.time) >= dateFrom)
    if (dateTo)     list = list.filter(e => isoDate(e.time) <= dateTo)
    return list
  }, [auditLog, search, modFilter, userFilter, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const hasFilters = search || modFilter || userFilter || dateFrom || dateTo

  function clearFilters() {
    setSearch(''); setModFilter(''); setUserFilter(''); setDateFrom(''); setDateTo('')
    setPage(1)
  }

  // ── Pagination helper
  function gotoPage(p) { setPage(Math.max(1, Math.min(totalPages, p))) }

  // ── CSV export
  function exportCSV() {
    const header = ['Time', 'User', 'Action', 'Target', 'Module'].join(',')
    const rows   = filtered.map(e =>
      [e.time, e.user, e.action, e.target, e.module]
        .map(v => `"${(v || '').replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv  = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `audit-log-${today}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const ar = lang === 'ar'

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={ar ? 'إجمالي الأحداث' : 'Total Events'}     value={stats.total}       />
        <StatCard label={ar ? 'اليوم'           : 'Today'}            value={stats.todayCount}  accent="text-gold" />
        <StatCard label={ar ? 'إنشاء / إضافة'   : 'Creates'}         value={stats.createCount} accent="text-emerald-400" />
        <StatCard label={ar ? 'حذف / إزالة'     : 'Deletes'}         value={stats.deleteCount} accent="text-red-400" />
      </div>

      {/* ── Main card */}
      <Card>
        <CardHeader
          title={ar ? 'سجل المراجعة' : 'Audit Log'}
          subtitle={ar
            ? `سجل كامل بجميع الإجراءات — ${filtered.length} حدث`
            : `Complete record of all organisation actions — ${filtered.length} events`}
          action={
            <Btn size="xs" variant="ghost" onClick={exportCSV} className="flex items-center gap-1">
              <Download size={11} />
              {ar ? 'تصدير CSV' : 'Export CSV'}
            </Btn>
          }
        />

        {/* Filters */}
        <div className="px-4 pb-3 flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
            <input
              className="ff-input ps-7 text-xs w-full"
              placeholder={ar ? 'بحث…' : 'Search action, target, user…'}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {/* Module */}
          <select
            className="ff-input text-xs"
            value={modFilter}
            onChange={e => { setModFilter(e.target.value); setPage(1) }}
          >
            <option value="">{ar ? 'كل الوحدات' : 'All modules'}</option>
            {moduleOptions.map(m => (
              <option key={m} value={m}>{MODULE_META[m]?.label || m}</option>
            ))}
          </select>

          {/* User */}
          <select
            className="ff-input text-xs"
            value={userFilter}
            onChange={e => { setUserFilter(e.target.value); setPage(1) }}
          >
            <option value="">{ar ? 'كل المستخدمين' : 'All users'}</option>
            {userOptions.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          {/* Date range */}
          <input
            type="date"
            className="ff-input text-xs"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1) }}
          />
          <input
            type="date"
            className="ff-input text-xs"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1) }}
          />

          {/* Clear */}
          {hasFilters && (
            <Btn size="xs" variant="ghost" onClick={clearFilters} className="flex items-center gap-1 text-red-400 hover:text-red-300">
              <X size={11} />
              {ar ? 'مسح' : 'Clear'}
            </Btn>
          )}
        </div>

        {/* Table */}
        {pageRows.length === 0 ? (
          <div className="px-4 py-10 text-center text-ink-muted text-sm">
            {ar ? 'لا توجد سجلات تطابق الفلاتر المحددة' : 'No log entries match the current filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ff-table">
              <thead>
                <tr>
                  <th>{ar ? 'الوقت'      : 'Time'}</th>
                  <th>{ar ? 'المستخدم'   : 'User'}</th>
                  <th>{ar ? 'الإجراء'    : 'Action'}</th>
                  <th>{ar ? 'الهدف'      : 'Target'}</th>
                  <th>{ar ? 'الوحدة'     : 'Module'}</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(log => (
                  <tr key={log.id}>
                    <td>
                      <span
                        className="text-xs text-ink-faint font-mono whitespace-nowrap"
                        title={log.time}
                      >
                        {fmtTime(log.time)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={log.user} size="xs" />
                        <span className="text-sm text-ink whitespace-nowrap">{log.user}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`text-sm font-medium ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-ink-muted truncate max-w-[200px] block" title={log.target}>
                        {log.target}
                      </span>
                    </td>
                    <td>
                      <ModulePill module={log.module} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-surface-3">
            <span className="text-xs text-ink-muted">
              {ar
                ? `الصفحة ${currentPage} من ${totalPages} — ${filtered.length} حدث`
                : `Page ${currentPage} of ${totalPages} — ${filtered.length} events`}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => gotoPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-surface-2 disabled:opacity-30 text-ink-muted"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let p
                if (totalPages <= 7) {
                  p = i + 1
                } else if (currentPage <= 4) {
                  p = i + 1
                } else if (currentPage >= totalPages - 3) {
                  p = totalPages - 6 + i
                } else {
                  p = currentPage - 3 + i
                }
                return (
                  <button
                    key={p}
                    onClick={() => gotoPage(p)}
                    className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                      p === currentPage
                        ? 'bg-gold text-dark'
                        : 'text-ink-muted hover:bg-surface-2'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => gotoPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-surface-2 disabled:opacity-30 text-ink-muted"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

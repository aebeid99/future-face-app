import { useMemo } from 'react'
import {
  Target, Users2, Sparkles, TrendingUp, Activity, ArrowRight,
  CheckSquare, AlertTriangle, Layers, Map, Bot, BarChart2, ShieldCheck
} from 'lucide-react'
import Card, { StatCard, CardHeader } from '../../components/ui/Card.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import ProgressRing from '../../components/ui/ProgressRing.jsx'
import Avatar from '../../components/ui/Avatar.jsx'
import Btn from '../../components/ui/Btn.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { NAV } from '../../state/actions.js'
import { currentQuarter, formatRelative, progressColor } from '../../utils/formatting.js'

// ─── Relative-time formatter (mirrors AuditPage) ───────────────
function fmtTime(iso) {
  if (!iso) return '—'
  const d    = new Date(iso)
  if (isNaN(d)) return iso
  const diff = Date.now() - d.getTime()
  if (diff < 60_000)         return 'just now'
  if (diff < 3_600_000)      return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000)     return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

// ─── Quick-nav tiles ──────────────────────────────────────────
const NAV_TILES = [
  { page: 'impactor',   icon: Target,    label: 'OKRs',      labelAr: 'الأهداف',     color: '#D4920E' },
  { page: 'all_issues', icon: Layers,    label: 'Issues',    labelAr: 'المشكلات',    color: '#3B82F6' },
  { page: 'roadmap',    icon: Map,       label: 'Roadmap',   labelAr: 'خارطة الطريق',color: '#10B981' },
  { page: 'ai_pilot',   icon: Bot,       label: 'AI Pilot',  labelAr: 'طيار الذكاء', color: '#8B5CF6' },
  { page: 'robox',      icon: Users2,    label: 'Robox',     labelAr: 'روبوكس',      color: '#0EA5E9' },
  { page: 'audit',      icon: ShieldCheck, label: 'Audit',   labelAr: 'سجل المراجعة',color: '#F59E0B' },
]

// ─── Derive live stats from OKRs ───────────────────────────────
function useLiveStats(okrs = [], members = [], auditLog = []) {
  return useMemo(() => {
    // OKR-level aggregates
    const okrCount    = okrs.length
    const avgProgress = okrCount
      ? Math.round(okrs.reduce((s, o) => s + (o.progress || 0), 0) / okrCount)
      : 0

    const atRiskCount = okrs.filter(o => o.status === 'at_risk').length
    const blockedOkrs = okrs.filter(o => o.status === 'blocked').length

    // KR + initiative aggregates
    let totalKRs = 0, totalInits = 0, blockedInits = 0, doneInits = 0, activeInits = 0

    okrs.forEach(okr => {
      const krs = okr.keyResults || okr.krs || []
      totalKRs += krs.length
      krs.forEach(kr => {
        const inits = kr.initiatives || []
        totalInits  += inits.length
        inits.forEach(ini => {
          if (ini.status === 'blocked')  blockedInits++
          else if (ini.status === 'done') doneInits++
          else                            activeInits++
        })
      })
    })

    // WERC: % of OKRs with at least 1 check-in this period (simple approximation)
    const checkedIn = okrs.filter(o => (o.checkIns || []).length > 0).length
    const werc      = okrCount ? Math.round((checkedIn / okrCount) * 100) : 0

    // Recent audit activity (latest 8)
    const recentActivity = (auditLog || []).slice(0, 8)

    return {
      avgProgress, atRiskCount, blockedOkrs,
      totalKRs, totalInits, blockedInits, doneInits, activeInits,
      werc, recentActivity,
      memberCount: members.length,
    }
  }, [okrs, members, auditLog])
}

// ─── Main ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { state, dispatch } = useApp()
  const { lang, okrs = [], members = [], auditLog = [], org, user, northStar } = state
  const go  = (page) => dispatch({ type: NAV, page })
  const ar  = lang === 'ar'

  const stats = useLiveStats(okrs, members, auditLog)
  const displayOkrs = okrs.slice(0, 5)    // show top 5 on dashboard

  const statusLabel = (status) =>
    org?.statusLabels?.[status] || (status || '').replace('_', ' ')

  // Blocked alert?
  const hasBlockers = stats.blockedInits > 0 || stats.blockedOkrs > 0

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Welcome banner */}
      <div className="bg-gradient-to-r from-gold/10 to-transparent border border-gold/15 rounded-xl px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">
            {ar
              ? `مرحباً، ${user?.name?.split(' ')[0] || 'Ahmed'} 👋`
              : `Welcome back, ${user?.name?.split(' ')[0] || 'Ahmed'} 👋`
            }
          </h2>
          <p className="text-sm text-ink-muted">
            {ar
              ? `${currentQuarter()} — فريقك يُحقّق أداءً رائعاً`
              : `${currentQuarter()} — ${
                  stats.avgProgress >= 70 ? 'Your team is executing well' :
                  stats.avgProgress >= 40 ? 'Keep pushing — mid-quarter check-in time' :
                  'Early stage — set your baselines'
                }`
            }
          </p>
        </div>
        <Badge
          variant={stats.avgProgress >= 70 ? 'on_track' : stats.avgProgress >= 40 ? 'at_risk' : 'default'}
          dot
        >
          {stats.avgProgress >= 70
            ? (ar ? 'على المسار' : 'On Track')
            : stats.avgProgress >= 40
            ? (ar ? 'في خطر' : 'At Risk')
            : (ar ? 'في البداية' : 'Starting')
          }
        </Badge>
      </div>

      {/* ── Blocked alert */}
      {hasBlockers && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertTriangle size={15} className="flex-shrink-0" />
          <p className="text-sm flex-1">
            {ar
              ? `تحذير: ${stats.blockedInits} مبادرة و${stats.blockedOkrs} هدف محجوب — يحتاج إلى تدخل عاجل`
              : `${stats.blockedInits} initiative${stats.blockedInits !== 1 ? 's' : ''} and ${stats.blockedOkrs} objective${stats.blockedOkrs !== 1 ? 's' : ''} are blocked — action required`
            }
          </p>
          <Btn size="xs" variant="ghost" className="text-red-400 hover:text-red-300 flex-shrink-0" onClick={() => go('all_issues')}>
            {ar ? 'عرض' : 'View'} <ArrowRight size={11} className="inline ms-1" />
          </Btn>
        </div>
      )}

      {/* ── KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={ar ? 'متوسط تقدم الأهداف' : 'Avg OKR Progress'}
          value={`${stats.avgProgress}%`}
          icon={Target}
          color="#D4920E"
        />
        <StatCard
          label={ar ? 'مؤشر WERC' : 'WERC Score'}
          value={`${stats.werc}%`}
          icon={Activity}
          color="#10B981"
        />
        <StatCard
          label={ar ? 'أعضاء الفريق' : 'Team Members'}
          value={stats.memberCount || '—'}
          icon={Users2}
          color="#3B82F6"
        />
        <StatCard
          label={ar ? 'مبادرات نشطة' : 'Active Initiatives'}
          value={stats.activeInits}
          icon={CheckSquare}
          color="#8B5CF6"
        />
      </div>

      {/* ── Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* OKR board preview */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader
              title={ar ? 'أهداف الربع الحالي' : `${currentQuarter()} Objectives`}
              subtitle={`${okrs.length} objective${okrs.length !== 1 ? 's' : ''}`}
              action={
                <Btn variant="ghost" size="sm" iconRight={<ArrowRight size={12} />} onClick={() => go('impactor')}>
                  {ar ? 'عرض الكل' : 'View all'}
                </Btn>
              }
            />
            {displayOkrs.length === 0 ? (
              <div className="py-8 text-center text-ink-muted text-sm">
                <Target size={28} className="mx-auto mb-2 text-ink-faint" />
                {ar ? 'لم يتم إنشاء أي أهداف بعد' : 'No objectives yet — go to Impactor to create your first OKR'}
                <br />
                <Btn variant="outline" size="sm" className="mt-3" onClick={() => go('impactor')}>
                  {ar ? 'إنشاء هدف' : 'Create OKR'}
                </Btn>
              </div>
            ) : (
              <div className="space-y-2">
                {displayOkrs.map(okr => {
                  const krs    = okr.keyResults || okr.krs || []
                  const inits  = krs.flatMap(kr => kr.initiatives || [])
                  const blocked = inits.filter(i => i.status === 'blocked').length
                  return (
                    <div
                      key={okr.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors cursor-pointer"
                      onClick={() => go('impactor')}
                    >
                      <ProgressRing value={okr.progress || 0} size={44} stroke={4} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{okr.title}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {okr.owner && (
                            <div className="flex items-center gap-1.5">
                              <Avatar name={okr.owner} size="xs" />
                              <span className="text-xs text-ink-faint">{okr.owner}</span>
                            </div>
                          )}
                          <span className="text-xs text-ink-faint">{krs.length} KRs · {inits.length} initiatives</span>
                          {blocked > 0 && (
                            <span className="text-xs text-red-400 font-medium flex items-center gap-0.5">
                              <AlertTriangle size={9} /> {blocked} blocked
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={okr.status} dot size="sm">
                        {statusLabel(okr.status)}
                      </Badge>
                    </div>
                  )
                })}
                {okrs.length > 5 && (
                  <button
                    className="w-full py-2 text-xs text-ink-muted hover:text-gold transition-colors text-center"
                    onClick={() => go('impactor')}
                  >
                    {ar ? `+ ${okrs.length - 5} أهداف أخرى` : `+ ${okrs.length - 5} more objectives`}
                  </button>
                )}
              </div>
            )}
          </Card>

          {/* ── Pipeline summary */}
          <Card>
            <CardHeader
              title={ar ? 'ملخص المبادرات' : 'Initiative Pipeline'}
              subtitle={ar ? `${stats.totalInits} مبادرة إجمالاً` : `${stats.totalInits} total initiatives`}
              action={
                <Btn variant="ghost" size="sm" iconRight={<ArrowRight size={12} />} onClick={() => go('all_issues')}>
                  {ar ? 'عرض المشكلات' : 'All Issues'}
                </Btn>
              }
            />
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: ar ? 'نشط'   : 'Active',  value: stats.activeInits,  color: 'text-blue-400',    bg: 'bg-blue-400' },
                { label: ar ? 'منجز'  : 'Done',    value: stats.doneInits,    color: 'text-emerald-400', bg: 'bg-emerald-400' },
                { label: ar ? 'محجوب' : 'Blocked', value: stats.blockedInits, color: 'text-red-400',     bg: 'bg-red-400' },
              ].map(item => (
                <div key={item.label} className="bg-surface-2 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-[10px] text-ink-muted uppercase tracking-wider mt-0.5">{item.label}</p>
                  {stats.totalInits > 0 && (
                    <div className="mt-2 h-1 rounded bg-surface-3 overflow-hidden">
                      <div
                        className={`h-full rounded ${item.bg}`}
                        style={{ width: `${Math.round((item.value / stats.totalInits) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* WERC ring */}
          <Card>
            <CardHeader
              title={ar ? 'مؤشر WERC' : 'WERC Score'}
              subtitle={ar ? 'نسبة الأهداف التي تم تسجيل دخولها' : 'OKRs with at least one check-in'}
            />
            <div className="flex items-center gap-4">
              <ProgressRing value={stats.werc} size={64} stroke={6} />
              <div>
                <p className="text-2xl font-bold text-ink">{stats.werc}%</p>
                <p className={`text-xs mt-0.5 ${stats.werc >= 80 ? 'text-success' : stats.werc >= 50 ? 'text-warning' : 'text-red-400'}`}>
                  {stats.werc >= 80
                    ? (ar ? '✓ أداء ممتاز' : '✓ Excellent cadence')
                    : stats.werc >= 50
                    ? (ar ? '⚠ يحتاج مزيداً من المراجعات' : '⚠ Needs more check-ins')
                    : (ar ? '✗ مراجعات متأخرة' : '✗ Reviews overdue')
                  }
                </p>
                <p className="text-xs text-ink-faint mt-1">
                  {stats.totalKRs > 0
                    ? (ar ? `${stats.totalKRs} نتيجة رئيسية` : `${stats.totalKRs} key results tracked`)
                    : (ar ? 'لا توجد نتائج رئيسية بعد' : 'No key results yet')
                  }
                </p>
              </div>
            </div>
          </Card>

          {/* AI Briefing teaser */}
          <Card className="bg-gradient-to-br from-surface to-dark-100 border-gold/15">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Sparkles size={15} className="text-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold">{ar ? 'إحاطة الذكاء الاصطناعي' : 'AI Briefing'}</p>
                <p className="text-xs text-ink-muted">
                  {ar ? 'تحليل فوري لحالة الأهداف' : 'Real-time objective health analysis'}
                </p>
              </div>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed mb-3">
              {ar
                ? `فريقك يُحقق ${stats.avgProgress}٪ إجمالاً. ${stats.atRiskCount > 0 ? `${stats.atRiskCount} أهداف في خطر تحتاج اهتمامك.` : 'جميع الأهداف على المسار الصحيح.'}`
                : `Team avg progress is ${stats.avgProgress}%. ${stats.atRiskCount > 0 ? `${stats.atRiskCount} objective${stats.atRiskCount > 1 ? 's' : ''} are at risk and need attention.` : 'All objectives are on track.'}`
              }
            </p>
            <Btn
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => go('ai_pilot')}
              iconRight={<ArrowRight size={12} />}
            >
              {ar ? 'قراءة الإحاطة الكاملة' : 'Open AI Pilot'}
            </Btn>
          </Card>

          {/* Quick nav */}
          <Card>
            <CardHeader title={ar ? 'التنقل السريع' : 'Quick Navigate'} />
            <div className="grid grid-cols-3 gap-2">
              {NAV_TILES.map(tile => {
                const Icon = tile.icon
                return (
                  <button
                    key={tile.page}
                    onClick={() => go(tile.page)}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors group"
                  >
                    <Icon size={16} style={{ color: tile.color }} />
                    <span className="text-[10px] text-ink-muted group-hover:text-ink transition-colors text-center leading-tight">
                      {ar ? tile.labelAr : tile.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Activity feed */}
      <Card>
        <CardHeader
          title={ar ? 'النشاط الأخير' : 'Recent Activity'}
          subtitle={ar ? 'آخر الأحداث في المؤسسة' : 'Latest organisation events'}
          action={
            <Btn variant="ghost" size="sm" iconRight={<ArrowRight size={12} />} onClick={() => go('audit')}>
              {ar ? 'سجل المراجعة' : 'Audit log'}
            </Btn>
          }
        />
        {stats.recentActivity.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">
            {ar ? 'لا يوجد نشاط بعد — ستظهر الأحداث هنا عند اتخاذ إجراءات' : 'No activity yet — events will appear here as actions are taken'}
          </p>
        ) : (
          <div className="space-y-0">
            {stats.recentActivity.map((act, i) => (
              <div key={act.id || i} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
                <Avatar name={act.user} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink">
                    <span className="font-medium">{act.user}</span>{' '}
                    <span className="text-ink-muted">{act.action}</span>
                  </p>
                  {act.target && (
                    <p className="text-xs text-ink-faint truncate mt-0.5">{act.target}</p>
                  )}
                </div>
                <span className="text-xs text-ink-faint flex-shrink-0">{fmtTime(act.time)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  )
}

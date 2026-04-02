import { useState, useMemo } from 'react'
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Target, Users2, BarChart2, Sparkles, ChevronRight, Clock, Zap, ArrowUpRight } from 'lucide-react'
import { useApp } from '../../state/AppContext.jsx'
import { computeOKRHealth } from '../../utils/aiSimulator.js'
import { NAV } from '../../state/actions.js'
import Btn from '../../components/ui/Btn.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Card, { CardHeader } from '../../components/ui/Card.jsx'

// ─── Health score ring ─────────────────────────────────────────────────────────
function HealthRing({ score, status }) {
  const r        = 42
  const circ     = 2 * Math.PI * r
  const pct      = Math.min(100, Math.max(0, score))
  const fill     = circ - (pct / 100) * circ

  const ringColor = status === 'healthy' ? '#2dd4bf'
                  : status === 'at_risk'  ? '#d4920e'
                  : '#ef4444'

  const label = status === 'healthy' ? 'Healthy'
              : status === 'at_risk'  ? 'At Risk'
              : 'Critical'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="110" height="110" viewBox="0 0 110 110">
        {/* Background ring */}
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--th-surface-hover)" strokeWidth="8" />
        {/* Progress ring */}
        <circle
          cx="55" cy="55" r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={fill}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
        />
        {/* Score text */}
        <text x="55" y="50" textAnchor="middle" fill="var(--th-ink)" fontSize="22" fontWeight="700" dy="0.3em">
          {score}
        </text>
        <text x="55" y="68" textAnchor="middle" fill="var(--th-ink-faint)" fontSize="10">
          / 100
        </text>
      </svg>
      <span className="text-xs font-bold" style={{ color: ringColor }}>{label}</span>
    </div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, trend, color = 'text-gold', onClick }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null

  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-4 ${onClick ? 'cursor-pointer hover:bg-surface-hover transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 rounded-xl bg-opacity-10 flex items-center justify-center`} style={{ background: 'var(--th-surface-hover)' }}>
          <Icon size={14} className={color} />
        </div>
        {TrendIcon && (
          <TrendIcon size={13} className={trend === 'up' ? 'text-teal-400' : 'text-error'} />
        )}
      </div>
      <p className="text-2xl font-bold text-ink leading-none">{value}</p>
      <p className="text-[11px] text-ink-muted mt-1">{label}</p>
      {sub && <p className="text-[10px] text-ink-faint mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Alert item ───────────────────────────────────────────────────────────────
function AlertItem({ alert }) {
  const colors = {
    error:   { dot: 'bg-error',       text: 'text-error',       bg: 'bg-error/5 border-error/20' },
    warning: { dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-400/5 border-amber-400/20' },
    info:    { dot: 'bg-sky-400',     text: 'text-sky-400',     bg: 'bg-sky-400/5 border-sky-400/20' },
  }
  const c = colors[alert.level] || colors.info

  return (
    <div className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border ${c.bg}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${c.dot} mt-1.5 flex-shrink-0`} />
      <p className="text-xs text-ink-muted leading-relaxed">{alert.msg}</p>
    </div>
  )
}

// ─── OKR summary row ──────────────────────────────────────────────────────────
function OKRSummaryRow({ okr, dispatch }) {
  const krs        = okr.keyResults || []
  const avgPct     = krs.length ? Math.round(krs.reduce((s, kr) => s + (kr.progress ?? 0), 0) / krs.length) : 0
  const statusColor = avgPct >= 70 ? 'bg-teal-400' : avgPct >= 40 ? 'bg-amber-400' : 'bg-error'

  return (
    <div
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-surface-hover cursor-pointer transition-colors"
      onClick={() => dispatch({ type: NAV, page: 'impactor' })}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ink truncate">{okr.title}</p>
        <p className="text-[10px] text-ink-faint mt-0.5">{okr.quarter || 'Q2 2026'} · {krs.length} KRs</p>
      </div>
      <div className="w-20 h-1.5 rounded-full bg-surface-hover overflow-hidden flex-shrink-0">
        <div className={`h-full rounded-full ${statusColor}`} style={{ width: `${avgPct}%` }} />
      </div>
      <span className="text-xs font-bold text-ink w-8 text-right">{avgPct}%</span>
      <ChevronRight size={12} className="text-ink-faint" />
    </div>
  )
}

// ─── Briefing section ─────────────────────────────────────────────────────────
function AiBriefing({ okrs, health, members, sprints }) {
  const activeSprint = (sprints || []).find(s => s.status === 'active')
  const atRiskCount  = okrs.flatMap(o => (o.keyResults || []).filter(kr => (kr.progress ?? 0) < 40)).length
  const onTrackCount = okrs.filter(o => (o.status === 'on_track' || o.status === 'completed')).length

  const lines = [
    `Organisation health is ${health.status === 'healthy' ? 'strong' : health.status === 'at_risk' ? 'showing signs of risk' : 'critical'} at ${health.score}/100.`,
    onTrackCount > 0
      ? `${onTrackCount} of ${okrs.length} OKRs are on track this quarter.`
      : `All OKRs require attention — consider running a check-in.`,
    atRiskCount > 0
      ? `${atRiskCount} key result${atRiskCount > 1 ? 's are' : ' is'} below 40% progress — prioritise a review.`
      : `No key results are critically behind — keep the momentum.`,
    activeSprint
      ? `An active sprint "${activeSprint.name}" is in progress with ${activeSprint.issueIds.length} issues.`
      : `No active sprint. Consider starting one to focus the team's effort.`,
    members?.length > 0
      ? `Team has ${members.length} member${members.length > 1 ? 's' : ''} — ${members.filter(m => m.status === 'checked_in').length} checked in today.`
      : '',
  ].filter(Boolean)

  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-ink-muted leading-relaxed">
          {i === 0 ? <span className="font-semibold text-ink">{line}</span> : line}
        </p>
      ))}
    </div>
  )
}

// ─── Main CEOPage ─────────────────────────────────────────────────────────────
export default function CEOPage() {
  const { state, dispatch } = useApp()

  const okrs      = state.okrs    || []
  const members   = state.members || []
  const issues    = state.issues  || []
  const sprints   = state.sprints || []

  const health = useMemo(() => computeOKRHealth(okrs), [okrs])

  // Derived metrics
  const totalKRs        = okrs.flatMap(o => o.keyResults || []).length
  const onTrackKRs      = okrs.flatMap(o => (o.keyResults || []).filter(kr => (kr.progress ?? 0) >= 60)).length
  const openIssues      = issues.filter(i => i.status !== 'done' && i.status !== 'completed').length
  const activeSprint    = sprints.find(s => s.status === 'active')
  const checkedIn       = members.filter(m => m.status === 'checked_in').length
  const avgAttendance   = members.length ? Math.round(members.reduce((s, m) => s + (m.attendance || 0), 0) / members.length) : 0

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={18} className="text-gold" />
            <h1 className="text-xl font-bold text-ink">CEO Intelligence</h1>
          </div>
          <p className="text-sm text-ink-muted">{today}</p>
        </div>
        <Btn
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => dispatch({ type: NAV, page: 'ai_pilot' })}
        >
          <Sparkles size={13} className="text-gold" />
          Open AI Pilot
        </Btn>
      </div>

      {/* Top row: health + briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Health score */}
        <Card className="flex flex-col items-center justify-center py-6">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-4">OKR Health Score</p>
          <HealthRing score={health.score} status={health.status} />
          {health.alerts.length > 0 && (
            <div className="w-full mt-4 space-y-2 px-2">
              {health.alerts.slice(0, 3).map((a, i) => (
                <AlertItem key={i} alert={a} />
              ))}
            </div>
          )}
        </Card>

        {/* AI Briefing */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Morning Briefing"
            subtitle="AI-generated summary of your workspace"
            action={
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20">
                <Sparkles size={10} className="text-gold" />
                <span className="text-[10px] font-semibold text-gold">AI</span>
              </div>
            }
          />
          <div className="p-4">
            <AiBriefing okrs={okrs} health={health} members={members} sprints={sprints} />
          </div>
        </Card>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          icon={Target}
          label="KRs on track"
          value={`${onTrackKRs}/${totalKRs}`}
          sub="≥60% progress"
          trend={onTrackKRs >= totalKRs * 0.7 ? 'up' : 'down'}
          color="text-teal-400"
          onClick={() => dispatch({ type: NAV, page: 'impactor' })}
        />
        <KpiCard
          icon={BarChart2}
          label="Open issues"
          value={openIssues}
          sub="across all OKRs"
          trend={openIssues < 10 ? 'up' : 'down'}
          color="text-sky-400"
          onClick={() => dispatch({ type: NAV, page: 'all_issues' })}
        />
        <KpiCard
          icon={Users2}
          label="Team check-ins"
          value={`${checkedIn}/${members.length}`}
          sub="today"
          trend={checkedIn >= members.length * 0.8 ? 'up' : 'down'}
          color="text-violet-400"
          onClick={() => dispatch({ type: NAV, page: 'robox' })}
        />
        <KpiCard
          icon={Zap}
          label="Avg attendance"
          value={`${avgAttendance}%`}
          sub="30-day rolling"
          trend={avgAttendance >= 85 ? 'up' : 'down'}
          color="text-gold"
        />
      </div>

      {/* OKR progress + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* OKR summary */}
        <Card>
          <CardHeader
            title="OKR Progress"
            subtitle="All active objectives"
            action={
              <Btn variant="ghost" size="sm" className="gap-1 text-xs text-gold" onClick={() => dispatch({ type: NAV, page: 'impactor' })}>
                View all <ArrowUpRight size={11} />
              </Btn>
            }
          />
          <div className="p-2">
            {okrs.length === 0 ? (
              <div className="py-6 text-center text-xs text-ink-faint">No OKRs created yet</div>
            ) : okrs.map(okr => (
              <OKRSummaryRow key={okr.id} okr={okr} dispatch={dispatch} />
            ))}
          </div>
        </Card>

        {/* Sprint + alerts */}
        <div className="space-y-4">
          {/* Active sprint */}
          <Card>
            <CardHeader title="Active Sprint" subtitle={activeSprint ? activeSprint.name : 'No sprint running'} />
            <div className="p-4">
              {!activeSprint ? (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-ink-faint">Start a sprint to see progress here.</p>
                  <Btn variant="ghost" size="sm" className="text-gold gap-1" onClick={() => dispatch({ type: NAV, page: 'sprint' })}>
                    Go to Sprints <ChevronRight size={11} />
                  </Btn>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSprint.goal && (
                    <p className="text-xs text-ink-muted italic border-l-2 border-gold/30 pl-3">{activeSprint.goal}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-surface-hover overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-400"
                        style={{ width: `${activeSprint.issueIds.length ? '45' : '0'}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-ink">{activeSprint.issueIds.length} issues</span>
                  </div>
                  <Btn variant="ghost" size="sm" className="text-gold gap-1 w-full justify-center" onClick={() => dispatch({ type: NAV, page: 'sprint' })}>
                    Open sprint board <ChevronRight size={11} />
                  </Btn>
                </div>
              )}
            </div>
          </Card>

          {/* Live alerts */}
          {health.alerts.length > 0 && (
            <Card>
              <CardHeader title="Live Alerts" subtitle={`${health.alerts.length} item${health.alerts.length > 1 ? 's' : ''} need attention`} />
              <div className="p-3 space-y-2">
                {health.alerts.map((a, i) => (
                  <AlertItem key={i} alert={a} />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

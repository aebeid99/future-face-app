import { useState, useEffect } from 'react'
import { Telescope, Lightbulb, AlertTriangle, TrendingUp, RefreshCw, ArrowRight, Plus, ChevronRight, Sparkles, X, BarChart2, Target, Zap } from 'lucide-react'
import { useApp } from '../../state/AppContext.jsx'
import { DISCOVERY_LOAD, DISCOVERY_DISMISS, DISCOVERY_PROMOTE, ISSUE_CREATE, NOTIF_ADD } from '../../state/actions.js'
import { generateDiscoveryCards } from '../../utils/aiSimulator.js'
import Btn from '../../components/ui/Btn.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Card, { CardHeader } from '../../components/ui/Card.jsx'

// ─── Type metadata ─────────────────────────────────────────────────────────────
const TYPE_META = {
  opportunity: { label: 'Opportunity', icon: Lightbulb,       color: 'text-teal-400',   bg: 'bg-teal-400/10',   border: 'border-teal-400/20',   badge: 'success'  },
  risk:        { label: 'Risk',        icon: AlertTriangle,    color: 'text-error',       bg: 'bg-error/10',      border: 'border-error/20',      badge: 'danger'   },
  insight:     { label: 'Insight',     icon: TrendingUp,       color: 'text-sky-400',     bg: 'bg-sky-400/10',    border: 'border-sky-400/20',    badge: 'info'     },
}

const IMPACT_COLOR = { high: 'text-error', medium: 'text-amber-400', low: 'text-teal-400' }
const EFFORT_COLOR = { high: 'text-error', medium: 'text-amber-400', low: 'text-teal-400' }

// ─── Discovery card component ──────────────────────────────────────────────────
function DiscoveryCard({ card, onDismiss, onPromote }) {
  const meta = TYPE_META[card.type] || TYPE_META.insight
  const Icon = meta.icon

  return (
    <div className={`rounded-2xl border ${meta.border} bg-surface p-4 flex flex-col gap-3 hover:bg-surface-hover transition-colors group`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
          <Icon size={14} className={meta.color} />
        </div>
        <button
          onClick={() => onDismiss(card.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-faint hover:text-ink p-0.5"
        >
          <X size={12} />
        </button>
      </div>

      {/* Content */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Badge variant={meta.badge} size="xs">{meta.label}</Badge>
          <span className={`text-[10px] font-semibold ${IMPACT_COLOR[card.impact]}`}>
            {card.impact?.toUpperCase()} IMPACT
          </span>
        </div>
        <p className="text-sm font-semibold text-ink leading-snug">{card.title}</p>
        <p className="text-[11px] text-ink-muted mt-1.5 leading-relaxed">{card.desc}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        <span className={`text-[10px] text-ink-faint`}>
          Effort: <span className={`font-semibold ${EFFORT_COLOR[card.effort]}`}>{card.effort}</span>
        </span>
        <div className="flex-1" />
        {card.type === 'opportunity' && (
          <button
            onClick={() => onPromote(card.id)}
            className="flex items-center gap-1 text-[11px] font-semibold text-teal-400 hover:text-teal-300 transition-colors"
          >
            <Plus size={11} />Convert to issue
          </button>
        )}
        <button
          onClick={() => onDismiss(card.id)}
          className="text-[11px] text-ink-faint hover:text-ink-muted transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

// ─── Metric chip ───────────────────────────────────────────────────────────────
function MetricChip({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface border border-border">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color} bg-opacity-15`}>
        <Icon size={13} className={color} />
      </div>
      <div>
        <p className="text-[10px] text-ink-faint">{label}</p>
        <p className="text-sm font-bold text-ink leading-tight">{value}</p>
      </div>
    </div>
  )
}

// ─── Main DiscoveryPage ────────────────────────────────────────────────────────
export default function DiscoveryPage() {
  const { state, dispatch } = useApp()
  const [loading, setLoading]   = useState(false)
  const [filter,  setFilter]    = useState('all')  // all | opportunity | risk | insight

  const cards      = state.discoveryCards || []
  const okrs       = state.okrs || []
  const issues     = state.issues || []

  // Stats derived from state
  const atRiskKRs  = okrs.flatMap(o => (o.keyResults || []).filter(kr => (kr.progress ?? 0) < 40)).length
  const noOwnerIni = okrs.flatMap(o => (o.initiatives || []).filter(i => !i.owner)).length
  const openIssues = issues.filter(i => i.status === 'in_progress' || i.status === 'todo').length

  async function runScan() {
    setLoading(true)
    try {
      const newCards = await generateDiscoveryCards(state)
      dispatch({ type: DISCOVERY_LOAD, cards: newCards })
      dispatch({ type: NOTIF_ADD, notification: { title: 'Discovery scan complete', body: `Found ${newCards.length} signals in your workspace.` } })
    } finally {
      setLoading(false)
    }
  }

  // Auto-scan on first visit if no cards
  useEffect(() => {
    if (cards.length === 0) runScan()
  }, [])

  function handleDismiss(id) {
    dispatch({ type: DISCOVERY_DISMISS, id })
  }

  function handlePromote(id) {
    dispatch({ type: DISCOVERY_PROMOTE, id })
    dispatch({ type: NOTIF_ADD, notification: { title: 'Added to issues', body: 'Discovery opportunity converted to an issue.' } })
  }

  const filtered = filter === 'all' ? cards : cards.filter(c => c.type === filter)

  const opportunities = cards.filter(c => c.type === 'opportunity').length
  const risks         = cards.filter(c => c.type === 'risk').length
  const insights      = cards.filter(c => c.type === 'insight').length

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Telescope size={18} className="text-gold" />
            <h1 className="text-xl font-bold text-ink">Discovery Mode</h1>
          </div>
          <p className="text-sm text-ink-muted">AI-powered signals, opportunities, and risks surfaced from your workspace data.</p>
        </div>
        <Btn
          variant="primary"
          size="sm"
          className="gap-2"
          onClick={runScan}
          disabled={loading}
        >
          {loading
            ? <><RefreshCw size={13} className="animate-spin" />Scanning…</>
            : <><Sparkles size={13} />Run new scan</>
          }
        </Btn>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricChip icon={AlertTriangle}  label="At-risk KRs"          value={atRiskKRs}   color="text-error" />
        <MetricChip icon={Target}         label="Initiatives no owner"  value={noOwnerIni}  color="text-amber-400" />
        <MetricChip icon={BarChart2}      label="Open issues"           value={openIssues}  color="text-sky-400" />
        <MetricChip icon={Lightbulb}      label="Opportunities found"   value={opportunities} color="text-teal-400" />
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'all',         label: `All (${cards.length})` },
          { key: 'opportunity', label: `Opportunities (${opportunities})` },
          { key: 'risk',        label: `Risks (${risks})` },
          { key: 'insight',     label: `Insights (${insights})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === f.key
                ? 'bg-gold text-dark'
                : 'bg-surface border border-border text-ink-muted hover:text-ink hover:bg-surface-hover'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards grid or empty state */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-4 animate-pulse h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center">
            <Telescope size={20} className="text-ink-faint" />
          </div>
          <p className="text-sm font-semibold text-ink">
            {cards.length === 0 ? 'No signals yet' : 'No cards in this category'}
          </p>
          <p className="text-xs text-ink-faint max-w-xs">
            {cards.length === 0
              ? 'Run a scan to discover opportunities and risks in your workspace.'
              : 'Try switching to "All" or run a fresh scan.'}
          </p>
          {cards.length === 0 && (
            <Btn variant="primary" size="sm" className="mt-2 gap-1.5" onClick={runScan} disabled={loading}>
              <Sparkles size={12} /> Scan now
            </Btn>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(card => (
            <DiscoveryCard
              key={card.id}
              card={card}
              onDismiss={handleDismiss}
              onPromote={handlePromote}
            />
          ))}
        </div>
      )}

      {/* What Discovery scans */}
      <Card>
        <CardHeader title="How Discovery works" subtitle="AI scans your workspace data to surface actionable signals" />
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Target,   title: 'OKR velocity',     desc: 'Detects KRs falling behind pace and estimates risk of missing quarter targets.' },
            { icon: Zap,      title: 'Team load',        desc: 'Flags over-allocated members and unassigned initiatives that risk stalling.' },
            { icon: BarChart2,title: 'Patterns',         desc: 'Identifies trends in issue resolution, sprint velocity, and check-in cadence.' },
          ].map(item => (
            <div key={item.title} className="flex gap-3 p-3 rounded-xl bg-surface-hover">
              <item.icon size={14} className="text-gold mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-ink">{item.title}</p>
                <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

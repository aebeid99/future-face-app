import { useState } from 'react'
import { CreditCard, Zap, CheckCircle2, Crown, Sparkles, RefreshCw, Info, ArrowUpRight, Shield, Infinity } from 'lucide-react'
import Card, { CardHeader } from '../../components/ui/Card.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { BILLING_PLAN_SET, AI_CREDIT_RESET, NOTIF_ADD } from '../../state/actions.js'

// ─── Plan definitions ─────────────────────────────────────────────────────────
const PLANS = [
  {
    id:       'free',
    name:     'Free',
    price:    0,
    period:   'forever',
    badge:    null,
    icon:     Zap,
    color:    'text-ink-muted',
    border:   'border-border',
    highlight: false,
    limits: {
      workspaces:   3,
      canvases:     3,
      aiDaily:      20,
      aiWeekly:     3,
      members:      5,
    },
    features: [
      '3 workspaces',
      '3 canvases per workspace',
      '20 AI credits / day',
      '3 AI sessions / week',
      'Up to 5 team members',
      'Basic OKR tracking',
      'Kanban & roadmap',
      'Community support',
    ],
  },
  {
    id:       'pro',
    name:     'Pro',
    price:    29,
    period:   'per user / month',
    badge:    'Most Popular',
    icon:     Crown,
    color:    'text-gold',
    border:   'border-gold/40',
    highlight: true,
    limits: {
      workspaces:   10,
      canvases:     20,
      aiDaily:      200,
      aiWeekly:     20,
      members:      25,
    },
    features: [
      '10 workspaces',
      '20 canvases per workspace',
      '200 AI credits / day',
      '20 AI sessions / week',
      'Up to 25 team members',
      'Advanced OKRs + Discovery',
      'Sprint management',
      'CEO Intelligence panel',
      'Canvas AI generation',
      'Priority support',
    ],
  },
  {
    id:       'enterprise',
    name:     'Enterprise',
    price:    null,
    period:   'custom pricing',
    badge:    'Custom',
    icon:     Shield,
    color:    'text-violet-400',
    border:   'border-violet-500/30',
    highlight: false,
    limits: {
      workspaces:   'Unlimited',
      canvases:     'Unlimited',
      aiDaily:      'Unlimited',
      aiWeekly:     'Unlimited',
      members:      'Unlimited',
    },
    features: [
      'Unlimited workspaces & canvases',
      'Unlimited AI credits',
      'Unlimited team members',
      'SSO & SAML 2.0',
      'Custom terminology',
      'Dedicated AI model config',
      'SLA guarantee',
      'Dedicated success manager',
      'Audit logs + compliance',
      'On-premise deployment option',
    ],
  },
]

// ─── Credit meter component ────────────────────────────────────────────────────
function CreditMeter({ used, limit, label, color = 'bg-gold' }) {
  const isUnlimited = limit === 'Unlimited' || limit === Infinity
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const danger = pct >= 85
  const barColor = danger ? 'bg-error' : pct >= 60 ? 'bg-amber-400' : color

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-ink-muted">{label}</span>
        <span className={`text-xs font-semibold ${danger ? 'text-error' : 'text-ink'}`}>
          {isUnlimited ? <span className="flex items-center gap-1"><Infinity size={11} /> Unlimited</span> : `${used} / ${limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Plan card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, currentPlanId, onSelect }) {
  const Icon      = plan.icon
  const isCurrent = plan.id === currentPlanId
  const isUpgrade = PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === currentPlanId)

  return (
    <div className={`relative flex flex-col rounded-2xl border ${plan.border} p-6 transition-all ${
      plan.highlight
        ? 'bg-gradient-to-b from-gold/[0.06] to-transparent shadow-[0_0_40px_rgba(212,146,14,0.08)]'
        : 'bg-surface hover:bg-surface-hover'
    }`}>
      {/* Popular badge */}
      {plan.badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          plan.id === 'pro' ? 'bg-gold text-dark' : 'bg-violet-500 text-white'
        }`}>
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
          plan.id === 'pro' ? 'bg-gold/15' : plan.id === 'enterprise' ? 'bg-violet-500/15' : 'bg-surface-hover'
        }`}>
          <Icon size={16} className={plan.color} />
        </div>
        <div>
          <p className="font-semibold text-ink">{plan.name}</p>
          {isCurrent && <Badge variant="success" size="xs">Current plan</Badge>}
        </div>
      </div>

      {/* Price */}
      <div className="mb-5">
        {plan.price === null ? (
          <p className="text-2xl font-bold text-ink">Custom</p>
        ) : plan.price === 0 ? (
          <p className="text-2xl font-bold text-ink">Free</p>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-ink">${plan.price}</span>
            <span className="text-xs text-ink-faint">{plan.period}</span>
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6 flex-1">
        {plan.features.map(f => (
          <li key={f} className="flex items-start gap-2 text-xs text-ink-muted">
            <CheckCircle2 size={12} className={`mt-0.5 flex-shrink-0 ${
              plan.id === 'pro' ? 'text-gold' : plan.id === 'enterprise' ? 'text-violet-400' : 'text-teal-400'
            }`} />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrent ? (
        <div className="h-9 rounded-lg bg-surface-hover flex items-center justify-center text-xs text-ink-faint font-medium">
          Active plan
        </div>
      ) : plan.id === 'enterprise' ? (
        <Btn variant="outline" size="sm" className="w-full gap-1.5 border-violet-500/40 text-violet-300 hover:bg-violet-500/10">
          Contact sales <ArrowUpRight size={12} />
        </Btn>
      ) : (
        <Btn
          variant={plan.highlight ? 'primary' : 'outline'}
          size="sm"
          className="w-full"
          onClick={() => onSelect(plan.id)}
        >
          {isUpgrade ? 'Upgrade to ' : 'Switch to '}{plan.name}
        </Btn>
      )}
    </div>
  )
}

// ─── Main BillingPage ─────────────────────────────────────────────────────────
export default function BillingPage() {
  const { state, dispatch } = useApp()
  const [tab, setTab]       = useState('plans') // 'plans' | 'usage' | 'history'

  const aiCredits   = state.aiCredits || {}
  const currentPlan = aiCredits.plan || 'free'
  const plan        = PLANS.find(p => p.id === currentPlan) || PLANS[0]

  // Billing history (mock)
  const billingHistory = [
    { id: 'inv_001', date: '2026-03-01', amount: currentPlan === 'free' ? 0 : 29, desc: `FutureFace ${plan.name} — March 2026`, status: 'paid' },
    { id: 'inv_002', date: '2026-02-01', amount: currentPlan === 'free' ? 0 : 29, desc: `FutureFace ${plan.name} — February 2026`, status: 'paid' },
  ]

  function handleSelectPlan(planId) {
    dispatch({ type: BILLING_PLAN_SET, plan: planId })
    dispatch({
      type: NOTIF_ADD,
      notification: {
        title: 'Plan updated',
        body:  `You are now on the ${PLANS.find(p => p.id === planId)?.name} plan.`,
      }
    })
  }

  function handleResetCredits() {
    dispatch({ type: AI_CREDIT_RESET })
    dispatch({
      type: NOTIF_ADD,
      notification: { title: 'Credits reset', body: 'Your daily AI credits have been reset.' }
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Billing & Plans</h1>
        <p className="text-sm text-ink-muted mt-0.5">Manage your subscription and AI credit usage</p>
      </div>

      {/* Current plan summary */}
      <div className="rounded-2xl border border-border bg-surface p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            currentPlan === 'pro' ? 'bg-gold/15' : currentPlan === 'enterprise' ? 'bg-violet-500/15' : 'bg-surface-hover'
          }`}>
            {currentPlan === 'pro' ? <Crown size={18} className="text-gold" /> :
             currentPlan === 'enterprise' ? <Shield size={18} className="text-violet-400" /> :
             <Zap size={18} className="text-ink-muted" />}
          </div>
          <div>
            <p className="font-semibold text-ink">{plan.name} plan</p>
            <p className="text-xs text-ink-muted">
              {currentPlan === 'free' ? 'Free forever · upgrade anytime' :
               currentPlan === 'enterprise' ? 'Custom · contact support to manage' :
               `$${plan.price}/user/month · renews monthly`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentPlan !== 'enterprise' && (
            <Btn
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={() => setTab('plans')}
            >
              {currentPlan === 'free' ? <><Crown size={13} /> Upgrade</> : 'Manage plan'}
            </Btn>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-surface border border-border w-fit">
        {['plans', 'usage', 'history'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              tab === t ? 'bg-surface-hover text-ink shadow-sm' : 'text-ink-faint hover:text-ink-muted'
            }`}
          >
            {t === 'plans' ? 'Plans' : t === 'usage' ? 'AI Usage' : 'History'}
          </button>
        ))}
      </div>

      {/* ── Plans tab ── */}
      {tab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(p => (
            <PlanCard
              key={p.id}
              plan={p}
              currentPlanId={currentPlan}
              onSelect={handleSelectPlan}
            />
          ))}
        </div>
      )}

      {/* ── Usage tab ── */}
      {tab === 'usage' && (
        <div className="space-y-4">
          {/* AI Credits card */}
          <Card>
            <CardHeader
              title="AI Credits"
              subtitle="Credits are used across AI Pilot, Canvas AI generation, and OKR auto-draft"
              action={
                <Btn variant="ghost" size="sm" className="gap-1.5 text-ink-muted" onClick={handleResetCredits}>
                  <RefreshCw size={12} /> Reset (dev)
                </Btn>
              }
            />
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-hover space-y-3">
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Daily Credits</p>
                  <CreditMeter
                    used={aiCredits.dailyUsed ?? 0}
                    limit={plan.limits.aiDaily}
                    label="Used today"
                    color="bg-gold"
                  />
                  <p className="text-[11px] text-ink-faint">
                    Resets daily at midnight
                    {aiCredits.dailyResetAt ? ` · Next reset ${new Date(aiCredits.dailyResetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-surface-hover space-y-3">
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Weekly Sessions</p>
                  <CreditMeter
                    used={aiCredits.weeklySessionsUsed ?? 0}
                    limit={plan.limits.aiWeekly}
                    label="Sessions used"
                    color="bg-teal-400"
                  />
                  <p className="text-[11px] text-ink-faint">
                    Each session = 1 AI conversation thread. Resets weekly.
                  </p>
                </div>
              </div>

              {/* What uses credits */}
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-ink mb-3">Credit usage guide</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { action: 'OKR auto-draft', cost: 5 },
                    { action: 'North Star generation', cost: 3 },
                    { action: 'KR ghost suggestion', cost: 1 },
                    { action: 'Canvas AI node', cost: 4 },
                    { action: 'AI Pilot message', cost: 2 },
                    { action: 'Discovery scan', cost: 3 },
                  ].map(item => (
                    <div key={item.action} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-hover">
                      <span className="text-[11px] text-ink-muted">{item.action}</span>
                      <span className="text-[11px] font-bold text-gold">{item.cost}cr</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Workspace & resource usage */}
          <Card>
            <CardHeader title="Resource Usage" subtitle="Current workspace and feature utilisation" />
            <div className="p-4 space-y-3">
              <CreditMeter
                used={state.workspaces?.length ?? 0}
                limit={plan.limits.workspaces === 'Unlimited' ? Infinity : plan.limits.workspaces}
                label="Workspaces"
                color="bg-violet-400"
              />
              <CreditMeter
                used={(() => {
                  const ws = state.workspaces?.find(w => w.id === state.currentWorkspaceId)
                  return ws?.canvases?.length ?? 0
                })()}
                limit={plan.limits.canvases === 'Unlimited' ? Infinity : plan.limits.canvases}
                label="Canvases (current workspace)"
                color="bg-sky-400"
              />
              <CreditMeter
                used={state.members?.length ?? 0}
                limit={plan.limits.members === 'Unlimited' ? Infinity : plan.limits.members}
                label="Team members"
                color="bg-teal-400"
              />
            </div>
          </Card>

          {/* Upgrade CTA if near limit */}
          {currentPlan === 'free' && (
            <div className="rounded-2xl border border-gold/30 bg-gold/[0.04] p-5 flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} className="text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink text-sm">Get 10× more AI power</p>
                <p className="text-xs text-ink-muted mt-1">
                  Upgrade to Pro for 200 AI credits/day, 20 sessions/week, unlimited canvas creation and advanced features.
                </p>
              </div>
              <Btn variant="primary" size="sm" className="flex-shrink-0" onClick={() => { setTab('plans') }}>
                Upgrade
              </Btn>
            </div>
          )}
        </div>
      )}

      {/* ── History tab ── */}
      {tab === 'history' && (
        <Card>
          <CardHeader title="Billing History" subtitle="Download invoices or review past charges" />
          <div className="divide-y divide-border/50">
            {currentPlan === 'free' ? (
              <div className="p-8 text-center text-xs text-ink-faint">
                No billing history — you are on the free plan.
              </div>
            ) : billingHistory.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-sm text-ink font-medium">{inv.desc}</p>
                  <p className="text-xs text-ink-faint mt-0.5">{new Date(inv.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={inv.status === 'paid' ? 'success' : 'warning'} size="xs">{inv.status}</Badge>
                  <span className="text-sm font-semibold text-ink">${inv.amount}</span>
                  <Btn variant="ghost" size="sm" className="text-ink-faint text-[11px]">
                    Invoice <ArrowUpRight size={11} />
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

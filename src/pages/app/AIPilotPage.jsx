import { useState } from 'react'
import { Sparkles, Shield, Calendar, Bot, AlertTriangle, TrendingDown, Send, RefreshCw, Zap } from 'lucide-react'
import Card, { CardHeader } from '../../components/ui/Card.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { NAV, SUB_UPDATE } from '../../state/actions.js'
import { t } from '../../utils/i18n.js'
import { chat, SYSTEM_PROMPTS } from '../../api/anthropic.js'

const ALERTS = [
  { id: 1, type: 'risk',   title: 'KR2 falling behind',        detail: 'Market share KR2 hasn\'t been updated in 18 days', okr: 'Market Share Growth',  severity: 'high' },
  { id: 2, type: 'trend',  title: 'WERC declining trend',      detail: 'Weekly review completion dropped from 92% to 78% over 3 weeks', severity: 'medium' },
  { id: 3, type: 'miss',   title: 'Initiative owner missing',  detail: 'Customer Experience Initiative has no assigned owner', okr: 'Customer Satisfaction', severity: 'low' },
]

export default function AIPilotPage() {
  const { state, dispatch } = useApp()
  const { lang, org, okrs } = state
  const tr = (k) => t(k, lang)

  // Unlocked when BOTH Impactor and Robox are on a paid plan (pro or enterprise)
  const PAID = ['pro', 'enterprise']
  const impactorPaid = PAID.includes(org.subs?.impactor)
  const roboxPaid    = PAID.includes(org.subs?.robox)
  const isLocked = !impactorPaid || !roboxPaid

  const [briefing,   setBriefing]   = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [tab,        setTab]        = useState('shield')

  const generateBriefing = async () => {
    setLoading(true)
    try {
      const context = `OKRs: ${okrs.length} total. Avg progress: ${okrs.length > 0 ? Math.round(okrs.reduce((s,o)=>s+o.progress,0)/okrs.length) : 73}%. WERC score: 89%. 3 active alerts.`
      const result = await chat({
        messages: [{ role: 'user', content: `Generate a Sunday Executive Briefing for my team. Context: ${context}` }],
        systemPrompt: SYSTEM_PROMPTS.sundayBriefing,
      })
      setBriefing(result)
    } catch (err) {
      setBriefing(`Error generating briefing: ${err.message}. Please check your API connection.`)
    } finally {
      setLoading(false)
    }
  }

  if (isLocked) {
    const simulateUnlock = () => {
      if (!impactorPaid) dispatch({ type: SUB_UPDATE, product: 'impactor', plan: 'pro' })
      if (!roboxPaid)    dispatch({ type: SUB_UPDATE, product: 'robox',    plan: 'pro' })
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mb-5">
          <Sparkles size={28} className="text-gold" />
        </div>
        <h2 className="text-xl font-bold mb-2">
          {lang === 'ar' ? 'افتح إمكانيات الذكاء الاصطناعي' : 'Unlock AI Pilot'}
        </h2>
        <p className="text-ink-muted max-w-sm mb-4">
          {lang === 'ar'
            ? 'تتطلب وحدة الذكاء الاصطناعي الاشتراك في كل من إمباكتور Pro وروبوكس Pro.'
            : 'AI Pilot requires both Impactor Pro and Robox Pro to unlock the intelligence layer.'
          }
        </p>

        {/* Show which modules are missing */}
        <div className="flex gap-3 mb-6">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
            impactorPaid ? 'border-success/40 bg-success/10 text-success' : 'border-border bg-surface text-ink-muted'
          }`}>
            {impactorPaid ? '✓' : '○'} Impactor Pro
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
            roboxPaid ? 'border-success/40 bg-success/10 text-success' : 'border-border bg-surface text-ink-muted'
          }`}>
            {roboxPaid ? '✓' : '○'} Robox Pro
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Btn onClick={() => dispatch({ type: NAV, page: 'billing' })}>
            {lang === 'ar' ? 'ترقية الآن' : 'Upgrade Now'}
          </Btn>
          <Btn variant="secondary" onClick={() => dispatch({ type: NAV, page: 'pricing' })}>
            {lang === 'ar' ? 'عرض الأسعار' : 'View Pricing'}
          </Btn>
          <Btn variant="ghost" icon={<Zap size={13} />} onClick={simulateUnlock}
            className="text-gold hover:bg-gold/10 border border-gold/30">
            {lang === 'ar' ? 'تجربة Pro (عرض)' : 'Try Pro (Demo)'}
          </Btn>
        </div>
        <p className="text-[10px] text-ink-faint mt-3">
          {lang === 'ar' ? 'زر "تجربة Pro" للعرض فقط — لا يتطلب بطاقة ائتمان' : '"Try Pro (Demo)" simulates paid plans for preview purposes'}
        </p>
      </div>
    )
  }

  const TABS = [
    { id: 'shield',   icon: Shield,   label: lang === 'ar' ? 'درع الذكاء' : 'Intelligence Shield' },
    { id: 'briefing', icon: Calendar, label: lang === 'ar' ? 'إحاطة الأحد' : 'Sunday Briefing'    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 w-fit">
        {TABS.map(tab_ => (
          <button
            key={tab_.id}
            onClick={() => setTab(tab_.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === tab_.id ? 'bg-gold/10 text-gold' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <tab_.icon size={14} />
            {tab_.label}
          </button>
        ))}
      </div>

      {/* Intelligence Shield */}
      {tab === 'shield' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">
              {lang === 'ar' ? `${ALERTS.length} تنبيهات نشطة` : `${ALERTS.length} active alerts`}
            </p>
            <Badge variant="warning" dot>{lang === 'ar' ? 'يحتاج انتباهاً' : 'Needs attention'}</Badge>
          </div>
          {ALERTS.map(alert => (
            <Card key={alert.id}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  alert.severity === 'high'   ? 'bg-error/10'   :
                  alert.severity === 'medium' ? 'bg-warning/10' : 'bg-info/10'
                }`}>
                  <AlertTriangle size={14} className={
                    alert.severity === 'high'   ? 'text-error'   :
                    alert.severity === 'medium' ? 'text-warning' : 'text-info'
                  } />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold">{alert.title}</p>
                    <Badge variant={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'} size="xs">
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-muted">{alert.detail}</p>
                  {alert.okr && (
                    <p className="text-xs text-gold mt-1">⊕ {alert.okr}</p>
                  )}
                </div>
                <Btn variant="ghost" size="sm" className="text-ink-faint">Dismiss</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Sunday Briefing */}
      {tab === 'briefing' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title={lang === 'ar' ? 'إحاطة الأحد التنفيذية' : 'Sunday Executive Briefing'}
              subtitle={lang === 'ar' ? 'ملخص أسبوعي بالذكاء الاصطناعي' : 'AI-generated weekly summary'}
              action={
                <Btn
                  variant="outline"
                  size="sm"
                  icon={<RefreshCw size={13} />}
                  loading={loading}
                  onClick={generateBriefing}
                >
                  {lang === 'ar' ? 'إنشاء' : 'Generate'}
                </Btn>
              }
            />
            {briefing ? (
              <div className="prose prose-sm max-w-none">
                <div className="bg-dark-100 rounded-xl p-5 text-sm text-ink leading-relaxed whitespace-pre-wrap">
                  {briefing}
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                  <Bot size={22} className="text-gold" />
                </div>
                <p className="text-sm text-ink-muted mb-4">
                  {lang === 'ar'
                    ? 'اضغط "إنشاء" للحصول على ملخص تنفيذي بالذكاء الاصطناعي لأداء فريقك هذا الأسبوع'
                    : 'Click "Generate" to get an AI-powered executive summary of your team\'s performance this week'
                  }
                </p>
                <Btn onClick={generateBriefing} loading={loading} icon={<Sparkles size={14} />}>
                  {lang === 'ar' ? 'إنشاء الإحاطة' : 'Generate Briefing'}
                </Btn>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

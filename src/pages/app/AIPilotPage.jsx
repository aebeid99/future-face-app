import { useState } from 'react'
import { Sparkles, Shield, Calendar, Bot, AlertTriangle, TrendingDown, Send, RefreshCw, Zap, ArrowRight, X as XIcon, Target, Wand2 } from 'lucide-react'
import Card, { CardHeader } from '../../components/ui/Card.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { NAV, SUB_UPDATE, HIGHLIGHT } from '../../state/actions.js'
import { t } from '../../utils/i18n.js'
import { chat, SYSTEM_PROMPTS } from '../../api/anthropic.js'
import { streamGPT, OKR_ARCHITECT_PROMPT } from '../../api/openai.js'
import { OKR_CREATE } from '../../state/actions.js'
import { currentQuarter } from '../../utils/formatting.js'

// Alerts wired to seed OKR / KR IDs so navigation + highlight works
const ALERTS = [
  {
    id: 1, type: 'risk', severity: 'high',
    title: 'ARR target KR at risk',
    detail: 'KR "Achieve SAR 2.4M in new ARR" is at 35% with only 6 weeks remaining. Velocity is insufficient to close the gap.',
    okr: 'Grow enterprise customer base in KSA',
    okrId: 'okr_demo_1', krId: 'kr_demo_1b',
  },
  {
    id: 2, type: 'trend', severity: 'medium',
    title: 'NPS survey initiative blocked',
    detail: '"Run quarterly NPS survey" has been blocked for 7 days. This is blocking progress on KR: Reach NPS score of 65+.',
    okr: 'Deliver world-class product experience',
    okrId: 'okr_demo_2', krId: 'kr_demo_2a',
  },
  {
    id: 3, type: 'miss', severity: 'low',
    title: 'Empty KR on new objective',
    detail: '"Build a high-performance sales team" has no Key Results defined. Add KRs to start tracking progress.',
    okr: 'Build a high-performance sales team',
    okrId: 'okr_demo_3', krId: null,
  },
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

  const [briefing,    setBriefing]    = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [tab,         setTab]         = useState('shield')
  const [dismissed,   setDismissed]   = useState(new Set())
  // AI OKR Architect (ChatGPT)
  const [archMsg,     setArchMsg]     = useState('')
  const [archHistory, setArchHistory] = useState([])
  const [archLoading, setArchLoading] = useState(false)
  const [archStream,  setArchStream]  = useState('')

  const navigateToAlert = (alert) => {
    // Navigate to Impactor page
    dispatch({ type: NAV, page: 'impactor' })
    // Highlight the target KR or OKR
    if (alert.okrId || alert.krId) {
      setTimeout(() => {
        dispatch({ type: HIGHLIGHT, id: alert.krId || alert.okrId, okrId: alert.okrId })
      }, 150)
    }
  }

  const activeAlerts = ALERTS.filter(a => !dismissed.has(a.id))

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

  const sendArchMsg = async () => {
    if (!archMsg.trim() || archLoading) return
    const userMsg  = { role: 'user', content: archMsg }
    const newHist  = [...archHistory, userMsg]
    setArchHistory(newHist)
    setArchMsg('')
    setArchLoading(true)
    setArchStream('')
    try {
      let full = ''
      await streamGPT({
        messages: newHist,
        systemPrompt: OKR_ARCHITECT_PROMPT,
        onChunk: (_, f) => { full = f; setArchStream(f) },
        onDone: (f) => {
          full = f
          setArchHistory(h => [...h, { role: 'assistant', content: f }])
          setArchStream('')
          // Auto-create OKR if JSON found
          const m = f.match(/```json\n([\s\S]*?)\n```/)
          if (m) {
            try {
              const p = JSON.parse(m[1])
              if (p.objective) {
                dispatch({ type: OKR_CREATE,
                  title: p.objective,
                  quarter: p.quarter || currentQuarter(),
                  owner: state.user?.name || '',
                })
              }
            } catch {}
          }
        },
        onError: (err) => {
          setArchHistory(h => [...h, { role: 'assistant', content: `⚠️ Error: ${err}` }])
          setArchStream('')
        },
      })
    } finally { setArchLoading(false) }
  }

  const QUICK_PROMPTS = [
    'Draft an OKR for growing our enterprise customer base in Saudi Arabia',
    'Create an OKR for improving customer retention and reducing churn',
    'Write an OKR for launching a new product feature this quarter',
    'Generate an OKR aligned to Vision 2030 for our HR transformation',
  ]

  const TABS = [
    { id: 'shield',    icon: Shield,   label: lang === 'ar' ? 'درع الذكاء' : 'Intelligence Shield' },
    { id: 'briefing',  icon: Calendar, label: lang === 'ar' ? 'إحاطة الأحد' : 'Sunday Briefing'    },
    { id: 'architect', icon: Wand2,    label: lang === 'ar' ? 'مهندس الأهداف' : 'OKR Architect'    },
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
              {lang === 'ar' ? `${activeAlerts.length} تنبيهات نشطة` : `${activeAlerts.length} active alert${activeAlerts.length !== 1 ? 's' : ''}`}
            </p>
            {activeAlerts.length > 0
              ? <Badge variant="warning" dot>{lang === 'ar' ? 'يحتاج انتباهاً' : 'Needs attention'}</Badge>
              : <Badge variant="success" dot>{lang === 'ar' ? 'كل شيء على ما يرام' : 'All clear'}</Badge>
            }
          </div>

          {activeAlerts.length === 0 && (
            <Card>
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <Shield size={22} className="text-success" />
                </div>
                <p className="text-sm font-medium text-ink mb-1">Intelligence Shield is clear</p>
                <p className="text-xs text-ink-muted">All alerts have been dismissed. Keep executing!</p>
              </div>
            </Card>
          )}

          {activeAlerts.map(alert => (
            <Card key={alert.id}
              className={`border transition-all hover:border-gold/30 ${
                alert.severity === 'high'   ? 'border-red-500/20'    :
                alert.severity === 'medium' ? 'border-yellow-500/20' : 'border-border'
              }`}>
              <div className="flex items-start gap-3">
                {/* Severity icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  alert.severity === 'high'   ? 'bg-error/10'   :
                  alert.severity === 'medium' ? 'bg-warning/10' : 'bg-blue-500/10'
                }`}>
                  <AlertTriangle size={15} className={
                    alert.severity === 'high'   ? 'text-error'   :
                    alert.severity === 'medium' ? 'text-warning' : 'text-blue-400'
                  } />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-ink">{alert.title}</p>
                    <Badge
                      variant={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'default'}
                      size="xs">
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">{alert.detail}</p>
                  {alert.okr && (
                    <p className="text-[11px] text-gold mt-1.5 flex items-center gap-1">
                      <TrendingDown size={9} /> {alert.okr}
                    </p>
                  )}
                  {/* Action row */}
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={() => navigateToAlert(alert)}
                      className="flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold/80 transition-colors group">
                      View in Impactor
                      <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <span className="text-border">·</span>
                    <button
                      onClick={() => setDismissed(d => new Set([...d, alert.id]))}
                      className="text-xs text-ink-faint hover:text-ink-muted transition-colors">
                      Dismiss
                    </button>
                  </div>
                </div>
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

      {/* ── OKR ARCHITECT TAB (ChatGPT) ─────────────────────────────────── */}
      {tab === 'architect' && (
        <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 260px)', minHeight: 480 }}>
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
              <Wand2 size={18} className="text-gold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">AI OKR Architect</h3>
              <p className="text-xs text-ink-muted">Powered by ChatGPT · Marty Cagan · SMART Goals</p>
            </div>
            {archHistory.length > 0 && (
              <button onClick={() => { setArchHistory([]); setArchStream('') }}
                className="ml-auto text-xs text-ink-faint hover:text-ink-muted transition-colors flex items-center gap-1">
                <RefreshCw size={11} /> New session
              </button>
            )}
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto rounded-xl bg-dark border border-border p-4 space-y-4">
            {archHistory.length === 0 && !archLoading && (
              <div className="py-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <Target size={24} className="text-gold" />
                </div>
                <p className="text-sm font-medium text-ink mb-1">Describe your goal</p>
                <p className="text-xs text-ink-muted mb-5">I'll draft a complete OKR with Key Results and auto-populate the form</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                  {QUICK_PROMPTS.map(p => (
                    <button key={p} onClick={() => setArchMsg(p)}
                      className="text-left text-xs px-3 py-2.5 rounded-lg border border-border bg-surface hover:border-gold/40 hover:bg-gold/5 text-ink-muted hover:text-ink transition-all">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {archHistory.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Wand2 size={13} className="text-gold" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gold/15 text-gold border border-gold/20'
                    : 'bg-surface text-ink border border-border'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-ink-faint/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] text-ink-muted font-medium">
                      {(state.user?.name || 'U')[0]}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {/* Streaming assistant reply */}
            {archLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Wand2 size={13} className="text-gold" />
                </div>
                <div className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed bg-surface text-ink border border-border">
                  {archStream || (
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              value={archMsg}
              onChange={e => setArchMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendArchMsg()}
              placeholder="Describe your goal… e.g. 'Grow revenue by 40% in KSA'"
              className="ff-input flex-1 text-sm"
              disabled={archLoading}
            />
            <button
              onClick={sendArchMsg}
              disabled={!archMsg.trim() || archLoading}
              className="w-10 h-10 rounded-xl bg-gold/15 hover:bg-gold/25 text-gold flex items-center justify-center shrink-0 transition-colors disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-[10px] text-ink-faint text-center -mt-2">
            When a valid OKR is generated, it will be automatically added to your Impactor board
          </p>
        </div>
      )}
    </div>
  )
}

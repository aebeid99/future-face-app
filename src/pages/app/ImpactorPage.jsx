import { useState } from 'react'
import { Plus, Target, ChevronDown, ChevronRight, Edit2, Trash2, Sparkles, Send, Bot, X } from 'lucide-react'
import Card, { CardHeader } from '../../components/ui/Card.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Modal from '../../components/ui/Modal.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import ProgressRing from '../../components/ui/ProgressRing.jsx'
import Avatar from '../../components/ui/Avatar.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { OKR_CREATE, OKR_UPDATE, OKR_DELETE, KR_UPDATE, CHAT_ADD, CHAT_UPDATE_LAST } from '../../state/actions.js'
import { t } from '../../utils/i18n.js'
import { currentQuarter, quarterList, progressColor, STATUS_COLORS } from '../../utils/formatting.js'
import { streamChat, SYSTEM_PROMPTS } from '../../api/anthropic.js'

const QUARTERS = quarterList(8)

export default function ImpactorPage() {
  const { state, dispatch } = useApp()
  const { lang, okrs, org, user, chatHistory } = state
  const tr = (k) => t(k, lang)

  const [filterQ,     setFilterQ]     = useState(currentQuarter())
  const [expanded,    setExpanded]    = useState({})
  const [newOkrOpen,  setNewOkrOpen]  = useState(false)
  const [aiOpen,      setAiOpen]      = useState(false)
  const [aiMsg,       setAiMsg]       = useState('')
  const [aiLoading,   setAiLoading]   = useState(false)
  const [newOkr,      setNewOkr]      = useState({ title: '', quarter: currentQuarter(), owner: user?.name || '' })

  const statusLabel = (s) => org.statusLabels?.[s] || s.replace('_','')

  const filteredOkrs = okrs.filter(o => !filterQ || o.quarter === filterQ)

  // Toggle OKR expansion
  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  // Create OKR
  const createOkr = () => {
    if (!newOkr.title.trim()) return
    dispatch({ type: OKR_CREATE, ...newOkr })
    setNewOkr({ title: '', quarter: currentQuarter(), owner: user?.name || '' })
    setNewOkrOpen(false)
  }

  // AI Architect chat
  const sendAiMsg = async () => {
    if (!aiMsg.trim() || aiLoading) return
    const userMsg = { role: 'user', content: aiMsg }
    dispatch({ type: CHAT_ADD, message: userMsg })
    setAiMsg('')
    setAiLoading(true)

    // Add placeholder for assistant
    dispatch({ type: CHAT_ADD, message: { role: 'assistant', content: '...' } })

    try {
      await streamChat({
        messages: [...chatHistory, userMsg],
        systemPrompt: SYSTEM_PROMPTS.okrArchitect,
        onChunk: (chunk, full) => {
          dispatch({ type: CHAT_UPDATE_LAST, updates: { content: full } })
        },
        onDone: (full) => {
          dispatch({ type: CHAT_UPDATE_LAST, updates: { content: full } })
          // Try to parse JSON OKR from response
          const jsonMatch = full.match(/```json\n([\s\S]*?)\n```/)
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[1])
              if (parsed.objective) {
                setNewOkr({ title: parsed.objective, quarter: currentQuarter(), owner: user?.name || '' })
                setNewOkrOpen(true)
              }
            } catch {}
          }
        },
        onError: (err) => {
          dispatch({ type: CHAT_UPDATE_LAST, updates: { content: `Error: ${err}` } })
        },
      })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select
            value={filterQ}
            onChange={e => setFilterQ(e.target.value)}
            options={QUARTERS.map(q => ({ value: q, label: q }))}
            className="text-sm w-28"
          />
          <span className="text-sm text-ink-muted">{filteredOkrs.length} objectives</span>
        </div>
        <div className="flex items-center gap-2">
          <Btn
            variant="secondary"
            size="sm"
            onClick={() => setAiOpen(true)}
            icon={<Sparkles size={13} />}
          >
            {lang === 'ar' ? 'مهندس الأهداف AI' : 'AI Architect'}
          </Btn>
          <Btn size="sm" onClick={() => setNewOkrOpen(true)} icon={<Plus size={14} />}>
            {tr('okr_new')}
          </Btn>
        </div>
      </div>

      {/* OKR list */}
      {filteredOkrs.length === 0 ? (
        <EmptyState
          icon={Target}
          title={lang === 'ar' ? 'لا توجد أهداف بعد' : 'No objectives yet'}
          description={lang === 'ar' ? 'أنشئ هدفاً جديداً أو استخدم مهندس الأهداف بالذكاء الاصطناعي' : 'Create your first objective or use the AI Architect to get started'}
          action={() => setNewOkrOpen(true)}
          actionLabel={tr('okr_new')}
        />
      ) : (
        <div className="space-y-3">
          {filteredOkrs.map(okr => (
            <Card key={okr.id} className="overflow-hidden">
              {/* OKR header */}
              <div
                className="flex items-center gap-3 cursor-pointer select-none"
                onClick={() => toggle(okr.id)}
              >
                <button className="text-ink-muted">
                  {expanded[okr.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <ProgressRing value={okr.progress} size={40} stroke={4} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{okr.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Avatar name={okr.owner} size="xs" />
                    <span className="text-xs text-ink-faint">{okr.owner}</span>
                    <span className="text-ink-faint">·</span>
                    <span className="text-xs text-ink-faint">{okr.quarter}</span>
                  </div>
                </div>
                <Badge variant={okr.status} dot size="sm">{statusLabel(okr.status)}</Badge>
                <div className="flex items-center gap-1 ml-1">
                  <Btn
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-ink-faint opacity-0 group-hover:opacity-100"
                    onClick={e => { e.stopPropagation(); dispatch({ type: OKR_DELETE, id: okr.id }) }}
                  >
                    <Trash2 size={13} />
                  </Btn>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 ml-9">
                <ProgressBar value={okr.progress} showLabel size="sm" />
              </div>

              {/* Key Results */}
              {expanded[okr.id] && (
                <div className="mt-4 ml-9 space-y-2 border-t border-border pt-4">
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
                    {lang === 'ar' ? 'النتائج الرئيسية' : 'Key Results'}
                    {okr.keyResults?.length > 0 && ` (${okr.keyResults.length})`}
                  </p>
                  {okr.keyResults?.length === 0 && (
                    <p className="text-xs text-ink-faint italic">
                      {lang === 'ar' ? 'لا توجد نتائج رئيسية بعد' : 'No key results yet — add your first KR'}
                    </p>
                  )}
                  {okr.keyResults?.map(kr => (
                    <div key={kr.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-100">
                      <ProgressRing value={Math.round((kr.current/kr.target)*100)} size={32} stroke={3} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink">{kr.title}</p>
                        <p className="text-[10px] text-ink-faint mt-0.5">
                          {kr.current} / {kr.target} {kr.unit}
                        </p>
                      </div>
                      <Badge variant={kr.status || 'on_track'} size="xs">
                        {statusLabel(kr.status || 'on_track')}
                      </Badge>
                    </div>
                  ))}
                  <Btn variant="ghost" size="sm" icon={<Plus size={12} />} className="text-ink-faint hover:text-gold">
                    {tr('okr_add_kr')}
                  </Btn>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create OKR modal */}
      <Modal
        open={newOkrOpen}
        onClose={() => setNewOkrOpen(false)}
        title={tr('okr_new')}
        footer={
          <>
            <Btn variant="secondary" size="sm" onClick={() => setNewOkrOpen(false)}>{tr('btn_cancel')}</Btn>
            <Btn size="sm" onClick={createOkr}>{tr('btn_save')}</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={lang === 'ar' ? 'عنوان الهدف' : 'Objective Title'}
            value={newOkr.title}
            onChange={e => setNewOkr(o => ({ ...o, title: e.target.value }))}
            placeholder={lang === 'ar' ? 'مثال: زيادة رضا العملاء بنسبة ٣٠٪' : 'e.g. Increase customer satisfaction by 30%'}
            autoFocus
          />
          <Select
            label={lang === 'ar' ? 'الربع المالي' : 'Quarter'}
            value={newOkr.quarter}
            onChange={e => setNewOkr(o => ({ ...o, quarter: e.target.value }))}
            options={QUARTERS.map(q => ({ value: q, label: q }))}
          />
          <Input
            label={lang === 'ar' ? 'المسؤول' : 'Owner'}
            value={newOkr.owner}
            onChange={e => setNewOkr(o => ({ ...o, owner: e.target.value }))}
            placeholder={user?.name || 'Your name'}
          />
        </div>
      </Modal>

      {/* AI Architect drawer */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-dark-400/60 backdrop-blur-sm" onClick={() => setAiOpen(false)} />
          <div className="w-full max-w-md bg-surface border-l border-border flex flex-col animate-slide-in shadow-panel">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Sparkles size={14} className="text-gold" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{tr('okr_ai_architect')}</p>
                  <p className="text-[10px] text-ink-faint">Powered by Claude AI</p>
                </div>
              </div>
              <Btn variant="ghost" size="icon" onClick={() => setAiOpen(false)}>
                <X size={16} />
              </Btn>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                    <Bot size={22} className="text-gold" />
                  </div>
                  <p className="text-sm text-ink-muted">
                    {lang === 'ar'
                      ? 'صِف هدفك وسأساعدك في بناء أهداف OKR مع نتائج رئيسية قابلة للقياس'
                      : "Describe your goal and I'll help you craft OKRs with measurable Key Results"
                    }
                  </p>
                  <div className="mt-4 space-y-2">
                    {[
                      lang === 'ar' ? 'نريد زيادة مبيعاتنا في المنطقة الشرقية' : 'We want to grow sales in the eastern region',
                      lang === 'ar' ? 'نهدف لتقليل معدل دوران الموظفين' : 'We want to reduce employee turnover',
                    ].map(s => (
                      <button
                        key={s}
                        onClick={() => setAiMsg(s)}
                        className="w-full text-left text-xs bg-dark-100 hover:bg-dark-200 border border-border rounded-lg px-3 py-2 text-ink-muted hover:text-ink transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gold/15 text-ink'
                        : 'bg-dark-100 border border-border text-ink'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-dark-100 border border-border rounded-xl px-3.5 py-2.5">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  value={aiMsg}
                  onChange={e => setAiMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendAiMsg()}
                  placeholder={tr('okr_ai_placeholder')}
                  className="ff-input flex-1 text-sm"
                  disabled={aiLoading}
                />
                <Btn
                  size="icon"
                  onClick={sendAiMsg}
                  disabled={!aiMsg.trim() || aiLoading}
                >
                  <Send size={14} />
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

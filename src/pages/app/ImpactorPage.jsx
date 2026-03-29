import { useState, useRef, useEffect } from 'react'
import {
  Plus, Target, ChevronDown, ChevronRight, Trash2, Sparkles,
  Send, Bot, X, Edit2, Check, TrendingUp, AlertCircle,
} from 'lucide-react'
import Card from '../../components/ui/Card.jsx'
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
import {
  OKR_CREATE, OKR_UPDATE, OKR_DELETE,
  KR_CREATE, KR_UPDATE, KR_DELETE,
  CHAT_ADD, CHAT_UPDATE_LAST,
} from '../../state/actions.js'
import { t } from '../../utils/i18n.js'
import { currentQuarter, quarterList } from '../../utils/formatting.js'
import { streamChat, SYSTEM_PROMPTS } from '../../api/anthropic.js'

const QUARTERS = quarterList(8)
const KR_UNITS = ['%', 'SAR', 'AED', 'USD', 'users', 'leads', 'calls', 'deals', 'days', 'score', 'NPS']

// ── Inline KR row (add or display) ───────────────────────────────────────────
function KrAddRow({ okrId, onDone }) {
  const { dispatch } = useApp()
  const [form, setForm] = useState({ title: '', target: '', current: '0', unit: '%' })
  const titleRef = useRef(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    if (!form.title.trim() || !form.target) return
    dispatch({ type: KR_CREATE, okrId, ...form })
    onDone()
  }

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gold/5 border border-gold/20 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
        <TrendingUp size={13} className="text-gold" />
      </div>
      <input
        ref={titleRef}
        value={form.title}
        onChange={e => set('title', e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()}
        placeholder="Key result title…"
        className="flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink-muted min-w-0"
      />
      <input
        type="number"
        value={form.current}
        onChange={e => set('current', e.target.value)}
        placeholder="0"
        className="w-14 bg-dark border border-border rounded-lg px-2 py-1 text-xs text-ink text-center outline-none focus:border-gold/60"
      />
      <span className="text-ink-muted text-xs">/</span>
      <input
        type="number"
        value={form.target}
        onChange={e => set('target', e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()}
        placeholder="100"
        className="w-14 bg-dark border border-border rounded-lg px-2 py-1 text-xs text-ink text-center outline-none focus:border-gold/60"
      />
      <select
        value={form.unit}
        onChange={e => set('unit', e.target.value)}
        className="bg-dark border border-border rounded-lg px-1.5 py-1 text-xs text-ink-muted outline-none focus:border-gold/60 w-16"
      >
        {KR_UNITS.map(u => <option key={u}>{u}</option>)}
      </select>
      <button onClick={save}
        className="w-7 h-7 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold flex items-center justify-center transition-colors"
        title="Save KR">
        <Check size={12} />
      </button>
      <button onClick={onDone}
        className="w-7 h-7 rounded-lg hover:bg-border text-ink-muted flex items-center justify-center transition-colors"
        title="Cancel">
        <X size={12} />
      </button>
    </div>
  )
}

// ── KR display row with inline edit ──────────────────────────────────────────
function KrRow({ kr, okrId, statusLabel }) {
  const { dispatch } = useApp()
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(kr.current))

  const pct = Math.min(Math.round((kr.current / kr.target) * 100), 100)

  const commitEdit = () => {
    const n = parseFloat(val)
    if (!isNaN(n)) dispatch({ type: KR_UPDATE, okrId, krId: kr.id, updates: { current: n } })
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-dark hover:bg-dark/80 group transition-colors">
      <ProgressRing value={pct} size={32} stroke={3} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ink leading-tight truncate">{kr.title}</p>
        <div className="flex items-center gap-1.5 mt-1">
          {editing ? (
            <input
              autoFocus
              type="number"
              value={val}
              onChange={e => setVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false) }}
              className="w-16 bg-surface border border-gold/60 rounded px-1.5 py-0.5 text-xs text-ink outline-none"
            />
          ) : (
            <button onClick={() => setEditing(true)}
              className="text-[10px] text-ink-muted hover:text-gold transition-colors cursor-text"
              title="Click to update progress">
              {kr.current} / {kr.target} {kr.unit}
            </button>
          )}
        </div>
      </div>
      <Badge variant={kr.status || 'on_track'} size="xs">{statusLabel(kr.status || 'on_track')}</Badge>
      <button
        onClick={() => dispatch({ type: KR_DELETE, okrId, krId: kr.id })}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded hover:bg-red-500/10 text-ink-muted hover:text-red-400 flex items-center justify-center transition-all"
        title="Delete KR">
        <Trash2 size={11} />
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ImpactorPage() {
  const { state, dispatch } = useApp()
  const { lang, okrs, org, user, chatHistory } = state
  const tr = (k) => t(k, lang)

  const [filterQ,    setFilterQ]    = useState(currentQuarter())
  const [expanded,   setExpanded]   = useState({})
  const [addingKr,   setAddingKr]   = useState({})   // { okrId: true }
  const [newOkrOpen, setNewOkrOpen] = useState(false)
  const [aiOpen,     setAiOpen]     = useState(false)
  const [aiMsg,      setAiMsg]      = useState('')
  const [aiLoading,  setAiLoading]  = useState(false)
  const [newOkr,     setNewOkr]     = useState({ title: '', quarter: currentQuarter(), owner: user?.name || '' })

  const statusLabel = (s) => org.statusLabels?.[s] || s.replace('_', ' ')
  const filteredOkrs = okrs.filter(o => !filterQ || o.quarter === filterQ)

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const openAddKr = (okrId) => {
    setExpanded(e => ({ ...e, [okrId]: true }))   // auto-expand
    setAddingKr(a => ({ ...a, [okrId]: true }))
  }
  const closeAddKr = (okrId) => setAddingKr(a => ({ ...a, [okrId]: false }))

  const createOkr = () => {
    if (!newOkr.title.trim()) return
    dispatch({ type: OKR_CREATE, ...newOkr })
    setNewOkr({ title: '', quarter: currentQuarter(), owner: user?.name || '' })
    setNewOkrOpen(false)
  }

  // AI Architect
  const sendAiMsg = async () => {
    if (!aiMsg.trim() || aiLoading) return
    const userMsg = { role: 'user', content: aiMsg }
    dispatch({ type: CHAT_ADD, message: userMsg })
    setAiMsg('')
    setAiLoading(true)
    dispatch({ type: CHAT_ADD, message: { role: 'assistant', content: '...' } })
    try {
      await streamChat({
        messages: [...chatHistory, userMsg],
        systemPrompt: SYSTEM_PROMPTS.okrArchitect,
        onChunk: (_, full) => dispatch({ type: CHAT_UPDATE_LAST, updates: { content: full } }),
        onDone: (full) => {
          dispatch({ type: CHAT_UPDATE_LAST, updates: { content: full } })
          const m = full.match(/```json\n([\s\S]*?)\n```/)
          if (m) {
            try {
              const p = JSON.parse(m[1])
              if (p.objective) {
                setNewOkr({ title: p.objective, quarter: currentQuarter(), owner: user?.name || '' })
                setNewOkrOpen(true)
              }
            } catch {}
          }
        },
        onError: (err) => dispatch({ type: CHAT_UPDATE_LAST, updates: { content: `Error: ${err}` } }),
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
          <Btn variant="secondary" size="sm" onClick={() => setAiOpen(true)} icon={<Sparkles size={13} />}>
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
          description={lang === 'ar' ? 'أنشئ هدفاً جديداً أو استخدم مهندس الأهداف' : 'Create your first objective or use the AI Architect to get started'}
          action={() => setNewOkrOpen(true)}
          actionLabel={tr('okr_new')}
        />
      ) : (
        <div className="space-y-3">
          {filteredOkrs.map(okr => (
            <Card key={okr.id} className="overflow-hidden group/card">
              {/* OKR header row */}
              <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => toggle(okr.id)}>
                <button className="text-ink-muted shrink-0">
                  {expanded[okr.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <ProgressRing value={okr.progress} size={40} stroke={4} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{okr.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Avatar name={okr.owner} size="xs" />
                    <span className="text-xs text-ink-muted">{okr.owner}</span>
                    <span className="text-ink-muted">·</span>
                    <span className="text-xs text-ink-muted">{okr.quarter}</span>
                    <span className="text-ink-muted">·</span>
                    <span className="text-xs text-ink-muted">
                      {okr.keyResults?.length || 0} KR{okr.keyResults?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <Badge variant={okr.status} dot size="sm">{statusLabel(okr.status)}</Badge>
                <div className="flex items-center gap-1 ml-1" onClick={e => e.stopPropagation()}>
                  <Btn
                    variant="ghost" size="icon"
                    className="w-7 h-7 text-ink-muted opacity-0 group-hover/card:opacity-100"
                    onClick={() => openAddKr(okr.id)}
                    title="Add Key Result"
                  >
                    <Plus size={13} />
                  </Btn>
                  <Btn
                    variant="ghost" size="icon"
                    className="w-7 h-7 text-ink-muted opacity-0 group-hover/card:opacity-100 hover:text-red-400"
                    onClick={() => dispatch({ type: OKR_DELETE, id: okr.id })}
                    title="Delete OKR"
                  >
                    <Trash2 size={13} />
                  </Btn>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 ml-9">
                <ProgressBar value={okr.progress} showLabel size="sm" />
              </div>

              {/* Key Results panel */}
              {expanded[okr.id] && (
                <div className="mt-4 ml-9 border-t border-border pt-4 space-y-1.5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Key Results {okr.keyResults?.length > 0 && `(${okr.keyResults.length})`}
                    </p>
                    {!addingKr[okr.id] && (
                      <Btn
                        variant="ghost" size="xs"
                        className="text-ink-muted hover:text-gold"
                        onClick={() => openAddKr(okr.id)}
                      >
                        <Plus size={11} /> Add KR
                      </Btn>
                    )}
                  </div>

                  {(!okr.keyResults || okr.keyResults.length === 0) && !addingKr[okr.id] && (
                    <button
                      onClick={() => openAddKr(okr.id)}
                      className="w-full flex items-center gap-2 p-3 rounded-lg border border-dashed border-border hover:border-gold/40 hover:bg-gold/5 text-ink-muted hover:text-gold transition-all group/empty"
                    >
                      <Plus size={13} className="shrink-0" />
                      <span className="text-xs">Add your first Key Result to measure progress</span>
                    </button>
                  )}

                  {okr.keyResults?.map(kr => (
                    <KrRow key={kr.id} kr={kr} okrId={okr.id} statusLabel={statusLabel} />
                  ))}

                  {addingKr[okr.id] && (
                    <KrAddRow okrId={okr.id} onDone={() => closeAddKr(okr.id)} />
                  )}
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
            <Btn size="sm" onClick={createOkr} disabled={!newOkr.title.trim()}>{tr('btn_save')}</Btn>
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
            onKeyDown={e => e.key === 'Enter' && createOkr()}
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
          <div className="flex-1 bg-dark/60 backdrop-blur-sm" onClick={() => setAiOpen(false)} />
          <div className="w-full max-w-md bg-surface border-l border-border flex flex-col animate-slide-in shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Sparkles size={14} className="text-gold" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{tr('okr_ai_architect')}</p>
                  <p className="text-[10px] text-ink-muted">Powered by Claude</p>
                </div>
              </div>
              <Btn variant="ghost" size="icon" onClick={() => setAiOpen(false)}><X size={16} /></Btn>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                    <Bot size={22} className="text-gold" />
                  </div>
                  <p className="text-sm text-ink-muted">
                    {lang === 'ar'
                      ? 'صِف هدفك وسأساعدك في بناء أهداف OKR مع نتائج رئيسية قابلة للقياس'
                      : "Describe your goal and I'll craft OKRs with measurable Key Results"
                    }
                  </p>
                  <div className="mt-4 space-y-2">
                    {[
                      lang === 'ar' ? 'نريد زيادة مبيعاتنا في المنطقة الشرقية' : 'Grow sales in the eastern region by 40%',
                      lang === 'ar' ? 'نهدف لتقليل معدل دوران الموظفين' : 'Reduce employee turnover below 10%',
                      lang === 'ar' ? 'تحسين رضا العملاء' : 'Improve NPS score to 70+',
                    ].map(s => (
                      <button key={s} onClick={() => setAiMsg(s)}
                        className="w-full text-left text-xs bg-dark hover:bg-border border border-border rounded-lg px-3 py-2 text-ink-muted hover:text-ink transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user' ? 'bg-gold/15 text-ink' : 'bg-dark border border-border text-ink'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-dark border border-border rounded-xl px-3.5 py-2.5 flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce"
                           style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

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
                <Btn size="icon" onClick={sendAiMsg} disabled={!aiMsg.trim() || aiLoading}>
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

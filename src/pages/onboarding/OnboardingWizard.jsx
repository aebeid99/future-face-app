import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Rocket, Landmark, HeartPulse, Briefcase, FlaskConical, Pencil, Building2, Target, Users2, BarChart2, Code2, Globe2, Upload, Sparkles, RefreshCw, X } from 'lucide-react'
import { useApp } from '../../state/AppContext.jsx'
import { ONBOARDING_SET, ONBOARDING_COMPLETE, NORTHSTAR_SET, OKR_CREATE, NOTIF_ADD } from '../../state/actions.js'
import Logo from '../../components/ui/Logo.jsx'

// ── constants ─────────────────────────────────────────────────
const TOTAL_STEPS = 7

const ROLES = [
  { id: 'ceo',      icon: Building2,  label: 'CEO / Founder',    sub: 'Executive view'    },
  { id: 'product',  icon: Target,     label: 'Product Lead',     sub: 'OKR & Roadmap'     },
  { id: 'eng',      icon: Code2,      label: 'Engineering',      sub: 'Issues & Sprints'  },
  { id: 'strategy', icon: BarChart2,  label: 'Strategy',         sub: 'OKR Planning'      },
  { id: 'gov',      icon: Landmark,   label: 'Government',       sub: 'Ministry / PMO'    },
  { id: 'team',     icon: Users2,     label: 'Team Lead',        sub: 'Manage work'       },
]

const SECTORS = [
  { id: 'tech',       icon: Rocket,       label: 'Tech / Startup',     terms: 'OKR · KR · Initiative · Issue'                },
  { id: 'government', icon: Landmark,     label: 'Government / PMO',   terms: 'Goal · KPI · Program · Task'                  },
  { id: 'healthcare', icon: HeartPulse,   label: 'Healthcare',         terms: 'Objective · Metric · Project · Activity'      },
  { id: 'finance',    icon: Briefcase,    label: 'Finance',            terms: 'Strategic Goal · Indicator · Project · Action' },
  { id: 'research',   icon: FlaskConical, label: 'Research',           terms: 'Aim · Milestone · Study · Task'               },
  { id: 'custom',     icon: Pencil,       label: 'Custom',             terms: "I'll define my own terms"                     },
]

const AI_NORTH_STAR_SUGGESTIONS = [
  'Be the go-to platform in our market by 2026 — reaching 10,000 active teams',
  'Become the most-trusted solution for our sector through product excellence',
  'Achieve market leadership in our region within 18 months',
]

// ── StepBar ───────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div className="flex gap-1 mb-8">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div
          key={i}
          className={[
            'h-1 flex-1 rounded-full transition-all duration-300',
            i < current  ? 'bg-gold' :
            i === current ? 'bg-gold/50' :
            'bg-surface-hover',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

// ── Step label ───────────────────────────────────────────────
function StepLabel({ step, label }) {
  return (
    <div className="mb-2">
      <span className="text-[11px] font-bold text-gold uppercase tracking-widest">Step {step} of {TOTAL_STEPS} · {label}</span>
    </div>
  )
}

// ── Main Wizard ───────────────────────────────────────────────
export default function OnboardingWizard({ workspace }) {
  const { state, dispatch } = useApp()

  // Local state for all steps
  const [step, setStep]           = useState(workspace?.onboarding?.step || 0)
  const [role, setRole]           = useState(workspace?.onboarding?.role || null)
  const [sector, setSector]       = useState(workspace?.onboarding?.sector || 'tech')
  const [orgName, setOrgName]     = useState(state.org?.name || '')
  const [contextUrl, setContextUrl] = useState('')
  const [northStar, setNorthStar] = useState(workspace?.onboarding?.northStar || '')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggIdx, setAiSuggIdx] = useState(0)
  const [objectives, setObjectives] = useState([
    { title: '', krs: ['', ''] },
  ])
  const [aiDrafted, setAiDrafted] = useState(false)

  function persistStep(updates) {
    dispatch({ type: ONBOARDING_SET, wsId: workspace.id, updates: { step, ...updates } })
  }

  function next() {
    persistStep({})
    setStep(s => Math.min(s + 1, TOTAL_STEPS - 1))
  }
  function back() { setStep(s => Math.max(s - 1, 0)) }

  // AI North Star simulation
  function generateNorthStar() {
    setAiLoading(true)
    setTimeout(() => {
      const suggestion = AI_NORTH_STAR_SUGGESTIONS[aiSuggIdx % AI_NORTH_STAR_SUGGESTIONS.length]
      setNorthStar(suggestion)
      setAiSuggIdx(i => i + 1)
      setAiLoading(false)
      setAiDrafted(true)
    }, 1200)
  }

  // AI Objectives simulation
  function aiDraftObjectives() {
    setAiLoading(true)
    setTimeout(() => {
      setObjectives([
        {
          title: 'Achieve strong product-market fit',
          krs: ['Reach 1,000 paying customers by Q3', 'Achieve NPS score of 45+ across all accounts'],
        },
        {
          title: 'Build a scalable go-to-market engine',
          krs: ['Sign 5 strategic partnerships', 'Launch in 2 new markets'],
        },
      ])
      setAiLoading(false)
      setAiDrafted(true)
    }, 1400)
  }

  function addObjective() {
    if (objectives.length < 6) {
      setObjectives(prev => [...prev, { title: '', krs: [''] }])
    }
  }

  function updateObj(idx, title) {
    setObjectives(prev => prev.map((o, i) => i === idx ? { ...o, title } : o))
  }

  function updateKr(oIdx, kIdx, val) {
    setObjectives(prev => prev.map((o, i) => i !== oIdx ? o : {
      ...o, krs: o.krs.map((k, j) => j === kIdx ? val : k),
    }))
  }

  function addKr(oIdx) {
    setObjectives(prev => prev.map((o, i) => i !== oIdx ? o : { ...o, krs: [...o.krs, ''] }))
  }

  function complete() {
    // Save North Star
    if (northStar.trim()) {
      dispatch({ type: NORTHSTAR_SET, updates: { title: northStar.trim() } })
    }
    // Create OKRs from wizard
    objectives.filter(o => o.title.trim()).forEach(o => {
      dispatch({
        type: OKR_CREATE,
        okr: {
          title: o.title.trim(),
          owner: state.user?.name || 'You',
          quarter: 'Q2 2026',
          cadence: 'Quarterly',
          keyResults: o.krs.filter(k => k.trim()).map(k => ({
            id: `kr_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
            title: k.trim(), current: 0, target: 100, unit: '%', status: 'on_track',
          })),
          initiatives: [],
          checkins: [],
        },
      })
    })
    dispatch({ type: ONBOARDING_COMPLETE, wsId: workspace.id })
    dispatch({
      type: NOTIF_ADD,
      notification: { title: 'Workspace ready! 🎉', body: `${workspace.name} is set up. Your AI-drafted OKRs are live.` },
    })
  }

  // ── Render steps ─────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      // ── Step 0: Welcome ────────────────────────────────────
      case 0:
        return (
          <div className="text-center">
            <StepLabel step={1} label="Welcome" />
            <div className="text-4xl mb-4">👋</div>
            <h2 className="text-2xl font-extrabold text-ink mb-3 tracking-tight">
              Welcome to <span className="text-gold">{workspace.name}</span>
            </h2>
            <p className="text-ink-muted text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              Let's take 2 minutes to set up your workspace. We'll help you create your first OKRs with AI assistance.
            </p>
            <div className="flex justify-center gap-3 text-xs text-ink-faint mb-8">
              {['Role', 'Sector', 'Org', 'Context', 'North Star', 'Objectives', 'Done'].map((l, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-surface-hover border border-border flex items-center justify-center text-[9px] font-bold">{i + 1}</div>
                  <span>{l}</span>
                  {i < 6 && <span className="text-border">→</span>}
                </div>
              ))}
            </div>
            <button onClick={next} className="px-8 py-3 rounded-xl bg-gold text-dark-400 font-bold text-sm hover:opacity-90 transition-opacity">
              Get started →
            </button>
          </div>
        )

      // ── Step 1: Role ────────────────────────────────────────
      case 1:
        return (
          <div>
            <StepLabel step={2} label="Role" />
            <h2 className="text-xl font-extrabold text-ink mb-2 tracking-tight">Who are you in this team?</h2>
            <p className="text-ink-muted text-sm mb-6">This tailors your default views and AI suggestions.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
              {ROLES.map(r => {
                const Icon = r.icon
                return (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={[
                      'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-150',
                      role === r.id
                        ? 'border-gold/60 bg-gold/[0.07] shadow-[0_0_12px_rgba(212,146,14,0.1)]'
                        : 'border-border bg-surface hover:border-border-hover',
                    ].join(' ')}
                  >
                    <Icon size={20} className={role === r.id ? 'text-gold' : 'text-ink-muted'} />
                    <div className="text-center">
                      <p className={`text-xs font-semibold ${role === r.id ? 'text-ink' : 'text-ink-muted'}`}>{r.label}</p>
                      <p className="text-[10px] text-ink-faint mt-0.5">{r.sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"><ArrowLeft size={14} /> Back</button>
              <button onClick={next} disabled={!role} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gold text-dark-400 font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity">
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )

      // ── Step 2: Sector ──────────────────────────────────────
      case 2:
        return (
          <div>
            <StepLabel step={3} label="Sector" />
            <h2 className="text-xl font-extrabold text-ink mb-2 tracking-tight">What sector are you in?</h2>
            <p className="text-ink-muted text-sm mb-6">We'll configure terminology to match your organisation's language.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
              {SECTORS.map(s => {
                const Icon = s.icon
                return (
                  <button
                    key={s.id}
                    onClick={() => setSector(s.id)}
                    className={[
                      'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150',
                      sector === s.id
                        ? 'border-gold/60 bg-gold/[0.07]'
                        : 'border-border bg-surface hover:border-border-hover',
                    ].join(' ')}
                  >
                    <Icon size={16} className={sector === s.id ? 'text-gold' : 'text-ink-muted'} />
                    <div>
                      <p className={`text-xs font-semibold ${sector === s.id ? 'text-ink' : 'text-ink-muted'}`}>{s.label}</p>
                      <p className="text-[10px] text-ink-faint mt-0.5">{s.terms}</p>
                    </div>
                    {sector === s.id && <Check size={13} className="text-gold ml-auto flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"><ArrowLeft size={14} /> Back</button>
              <button onClick={next} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gold text-dark-400 font-bold text-sm hover:opacity-90 transition-opacity">
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )

      // ── Step 3: Org Name ────────────────────────────────────
      case 3:
        return (
          <div>
            <StepLabel step={4} label="Organisation" />
            <h2 className="text-xl font-extrabold text-ink mb-2 tracking-tight">Name your organisation</h2>
            <p className="text-ink-muted text-sm mb-6">This appears across your workspace and reports.</p>
            <div className="mb-8">
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Organisation name</label>
              <input
                autoFocus
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="e.g. Acme Corp, Ministry of Innovation"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-gold/60 transition-colors"
              />
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"><ArrowLeft size={14} /> Back</button>
              <button onClick={next} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gold text-dark-400 font-bold text-sm hover:opacity-90 transition-opacity">
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )

      // ── Step 4: Context ─────────────────────────────────────
      case 4:
        return (
          <div>
            <StepLabel step={5} label="Context" />
            <h2 className="text-xl font-extrabold text-ink mb-2 tracking-tight">Give the AI some context</h2>
            <p className="text-ink-muted text-sm mb-6">We'll analyse this to generate a relevant North Star and suggest your first Objectives.</p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                Website URL <span className="font-normal text-ink-faint">(optional)</span>
              </label>
              <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2.5 focus-within:border-gold/60 transition-colors">
                <Globe2 size={14} className="text-ink-faint flex-shrink-0" />
                <input
                  value={contextUrl}
                  onChange={e => setContextUrl(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
                />
              </div>
            </div>
            <div className="mb-8">
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                Upload documents <span className="font-normal text-ink-faint">(strategy deck, annual report…)</span>
              </label>
              <div className="border border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-gold/40 hover:bg-gold/[0.02] transition-all group">
                <Upload size={20} className="text-ink-faint mx-auto mb-2 group-hover:text-gold transition-colors" />
                <p className="text-xs text-ink-muted">Drop files here or <span className="text-gold cursor-pointer">browse</span></p>
                <p className="text-[11px] text-ink-faint mt-1">PDF, DOCX, TXT · max 10MB each</p>
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"><ArrowLeft size={14} /> Back</button>
              <div className="flex gap-2">
                <button onClick={next} className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-ink-muted hover:text-ink transition-colors">
                  Skip →
                </button>
                <button onClick={next} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gold text-dark-400 font-bold text-sm hover:opacity-90 transition-opacity">
                  Analyse & continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )

      // ── Step 5: North Star ──────────────────────────────────
      case 5:
        return (
          <div>
            <StepLabel step={6} label="North Star" />
            <h2 className="text-xl font-extrabold text-ink mb-2 tracking-tight">Set your North Star</h2>
            <p className="text-ink-muted text-sm mb-5">Your long-term strategic vision — the single metric or outcome that guides everything.</p>

            {/* AI generate button */}
            {!aiDrafted && (
              <button
                onClick={generateNorthStar}
                disabled={aiLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gold/30 bg-gold/[0.05] hover:bg-gold/[0.09] text-sm font-semibold text-gold transition-all mb-4 disabled:opacity-60"
              >
                {aiLoading
                  ? <><RefreshCw size={14} className="animate-spin" /> Analysing your context…</>
                  : <><Sparkles size={14} /> ✨ Draft with AI</>
                }
              </button>
            )}

            {aiDrafted && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-gold font-semibold">✨ AI drafted</span>
                <button onClick={generateNorthStar} disabled={aiLoading} className="text-[11px] text-ink-muted hover:text-ink flex items-center gap-1">
                  <RefreshCw size={11} className={aiLoading ? 'animate-spin' : ''} /> Regenerate
                </button>
              </div>
            )}

            <div className="mb-8">
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">North Star statement</label>
              <textarea
                value={northStar}
                onChange={e => setNorthStar(e.target.value)}
                placeholder="e.g. Be the go-to platform in our market — reaching 10,000 active teams by 2026"
                rows={3}
                className={[
                  'w-full bg-surface border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-faint resize-none focus:outline-none transition-colors leading-relaxed',
                  aiDrafted ? 'border-gold/40 bg-gold/[0.03]' : 'border-border focus:border-gold/60',
                ].join(' ')}
              />
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"><ArrowLeft size={14} /> Back</button>
              <button onClick={next} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gold text-dark-400 font-bold text-sm hover:opacity-90 transition-opacity">
                Set up Objectives <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )

      // ── Step 6: Objectives ──────────────────────────────────
      case 6:
        return (
          <div>
            <StepLabel step={7} label="Objectives" />
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-extrabold text-ink tracking-tight">Set up your Objectives</h2>
              <span className="text-xs text-ink-faint">max 6</span>
            </div>
            <p className="text-ink-muted text-sm mb-4">Add your top-level goals. You can always refine these later.</p>

            {/* AI draft button */}
            {!aiDrafted && (
              <button
                onClick={aiDraftObjectives}
                disabled={aiLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gold/30 bg-gold/[0.05] hover:bg-gold/[0.09] text-sm font-semibold text-gold transition-all mb-4 disabled:opacity-60"
              >
                {aiLoading
                  ? <><RefreshCw size={14} className="animate-spin" /> Drafting Objectives…</>
                  : <><Sparkles size={14} /> ✨ AI-draft Objectives for me</>
                }
              </button>
            )}

            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
              {objectives.map((obj, oIdx) => (
                <div key={oIdx} className="bg-surface border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/20">OBJ {oIdx + 1}</span>
                    <input
                      value={obj.title}
                      onChange={e => updateObj(oIdx, e.target.value)}
                      placeholder="Objective title…"
                      className="flex-1 bg-transparent text-sm font-semibold text-ink placeholder:text-ink-faint outline-none"
                    />
                    {objectives.length > 1 && (
                      <button onClick={() => setObjectives(prev => prev.filter((_, i) => i !== oIdx))} className="text-ink-faint hover:text-error transition-colors flex-shrink-0"><X size={13} /></button>
                    )}
                  </div>
                  {/* KRs */}
                  <div className="pl-3 border-l-2 border-teal-500/30 space-y-1.5">
                    {obj.krs.map((kr, kIdx) => (
                      <div key={kIdx} className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-teal-400 flex-shrink-0">KR {kIdx + 1}</span>
                        <input
                          value={kr}
                          onChange={e => updateKr(oIdx, kIdx, e.target.value)}
                          placeholder={kr === '' && !aiDrafted ? 'Tab to accept AI suggestion…' : 'Key result…'}
                          className={[
                            'flex-1 text-xs rounded-lg px-2.5 py-1.5 outline-none transition-colors',
                            aiDrafted && kr ? 'bg-teal-500/[0.05] border border-teal-500/20 text-ink' : 'bg-surface-hover border border-border text-ink placeholder:text-ink-faint',
                          ].join(' ')}
                        />
                      </div>
                    ))}
                    <button onClick={() => addKr(oIdx)} className="text-[10px] text-ink-faint hover:text-teal-400 transition-colors pl-6">
                      + Add key result
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {objectives.length < 6 && (
              <button onClick={addObjective} className="w-full py-2.5 rounded-xl border border-dashed border-border hover:border-gold/40 text-xs text-ink-muted hover:text-ink transition-all mb-6">
                + Add Objective ({6 - objectives.length} remaining)
              </button>
            )}

            <div className="flex justify-between">
              <button onClick={back} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"><ArrowLeft size={14} /> Back</button>
              <button
                onClick={complete}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-dark-400 font-bold text-sm hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(212,146,14,0.3)]"
              >
                🚀 Launch workspace
              </button>
            </div>
          </div>
        )

      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-dark-400 flex flex-col items-center justify-start px-4 py-10">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3 self-start max-w-lg w-full mx-auto">
        <Logo size={26} showText={false} />
        <span className="text-xs text-ink-muted">Setting up <span className="text-ink font-semibold">{workspace.name}</span></span>
      </div>

      <div className="w-full max-w-lg">
        <div className="bg-dark rounded-2xl border border-border p-7 shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
          <StepBar current={step} />
          {renderStep()}
        </div>
      </div>
    </div>
  )
}

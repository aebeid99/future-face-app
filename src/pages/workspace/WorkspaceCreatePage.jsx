import { useState } from 'react'
import { ArrowLeft, Building2, Rocket, FlaskConical, Landmark, HeartPulse, Briefcase, Pencil } from 'lucide-react'
import { useApp } from '../../state/AppContext.jsx'
import { WS_CREATE, NAV, NOTIF_ADD } from '../../state/actions.js'
import Logo from '../../components/ui/Logo.jsx'

const SECTORS = [
  { id: 'tech',        icon: Rocket,       label: 'Tech / Startup',     desc: 'OKR · KR · Initiative · Issue' },
  { id: 'government',  icon: Landmark,     label: 'Government / PMO',   desc: 'Goal · KPI · Program · Task' },
  { id: 'healthcare',  icon: HeartPulse,   label: 'Healthcare',         desc: 'Objective · Metric · Project · Activity' },
  { id: 'finance',     icon: Briefcase,    label: 'Finance',            desc: 'Strategic Goal · Indicator · Project · Action' },
  { id: 'research',    icon: FlaskConical, label: 'Research & Academia', desc: 'Aim · Milestone · Study · Task' },
  { id: 'custom',      icon: Pencil,       label: 'Custom',             desc: "I'll define my own terms" },
]

export default function WorkspaceCreatePage() {
  const { state, dispatch } = useApp()
  const [name, setName]       = useState('')
  const [desc, setDesc]       = useState('')
  const [sector, setSector]   = useState('tech')
  const [errors, setErrors]   = useState({})
  const [creating, setCreating] = useState(false)

  function validate() {
    const e = {}
    if (!name.trim()) e.name = 'Workspace name is required'
    if (name.trim().length > 50) e.name = 'Max 50 characters'
    return e
  }

  function handleCreate() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setCreating(true)

    setTimeout(() => {
      dispatch({
        type: WS_CREATE,
        workspace: {
          name: name.trim(),
          description: desc.trim(),
          sector,
          plan: 'free',
          createdBy: state.user?.id || 'u1',
        },
      })
      dispatch({
        type: NOTIF_ADD,
        notification: {
          type: 'success',
          title: 'Workspace created',
          body: `"${name.trim()}" is ready. Let's set it up.`,
        },
      })
      // Router will detect new WS with incomplete onboarding → show wizard
    }, 320)
  }

  return (
    <div className="min-h-screen bg-dark-400 flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <Logo size={32} showText={false} />
        <div className="text-center">
          <h1 className="text-xl font-extrabold text-ink tracking-tight">Create workspace</h1>
          <p className="text-sm text-ink-muted mt-1">Set up a workspace for your team</p>
        </div>
      </div>

      <div className="w-full max-w-lg">
        <div className="bg-dark rounded-2xl border border-border p-7 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">

          {/* Back */}
          <button
            onClick={() => dispatch({ type: NAV, page: 'workspace_select' })}
            className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink mb-6 transition-colors"
          >
            <ArrowLeft size={13} /> Back to workspaces
          </button>

          {/* Name */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              Workspace name <span className="text-error">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: null })) }}
              placeholder="e.g. Product Team, Engineering, Q2 Strategy"
              className={[
                'w-full bg-surface border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint',
                'focus:outline-none focus:border-gold/60 transition-colors',
                errors.name ? 'border-error/60' : 'border-border',
              ].join(' ')}
            />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              Description <span className="text-ink-faint font-normal">(optional)</span>
            </label>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="What does this workspace focus on?"
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-gold/60 transition-colors"
            />
          </div>

          {/* Sector */}
          <div className="mb-7">
            <label className="block text-xs font-semibold text-ink-muted mb-2">
              Sector <span className="text-ink-faint font-normal">— sets default terminology</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SECTORS.map(s => {
                const Icon = s.icon
                const active = sector === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setSector(s.id)}
                    className={[
                      'flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-150',
                      active
                        ? 'border-gold/60 bg-gold/[0.07] shadow-[0_0_10px_rgba(212,146,14,0.08)]'
                        : 'border-border bg-surface hover:border-border-hover',
                    ].join(' ')}
                  >
                    <Icon size={15} className={`mt-0.5 flex-shrink-0 ${active ? 'text-gold' : 'text-ink-muted'}`} />
                    <div>
                      <p className={`text-xs font-semibold leading-tight ${active ? 'text-ink' : 'text-ink-muted'}`}>{s.label}</p>
                      <p className="text-[10px] text-ink-faint mt-0.5 leading-tight">{s.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => dispatch({ type: NAV, page: 'workspace_select' })}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-ink-muted hover:text-ink hover:border-border-hover transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 py-2.5 rounded-xl bg-gold text-dark-400 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create workspace →'}
            </button>
          </div>
        </div>

        {/* Free tier note */}
        <p className="text-center text-xs text-ink-faint mt-4">
          Free plan · up to 3 workspaces · 3 canvases each ·{' '}
          <span className="text-gold cursor-pointer hover:underline">Upgrade to Pro</span> for unlimited
        </p>
      </div>
    </div>
  )
}

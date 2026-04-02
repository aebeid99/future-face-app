import { useState } from 'react'
import { Plus, LogOut, ChevronRight, Users, Layers } from 'lucide-react'
import { useApp } from '../../state/AppContext.jsx'
import { WS_SWITCH, NAV, LOGOUT } from '../../state/actions.js'
import Logo from '../../components/ui/Logo.jsx'

// ── helpers ───────────────────────────────────────────────────
function wsInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}
function wsColor(id = '') {
  const colors = [
    'from-amber-500 to-orange-600',
    'from-violet-500 to-purple-700',
    'from-teal-500 to-emerald-600',
    'from-sky-500 to-blue-600',
    'from-rose-500 to-pink-600',
  ]
  const idx = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % colors.length
  return colors[idx]
}

export default function WorkspaceSelectorPage() {
  const { state, dispatch } = useApp()
  const { workspaces = [], org, user } = state
  const [hovered, setHovered] = useState(null)

  const orgLimit = 3
  const canCreate = workspaces.length < orgLimit

  function enter(ws) {
    dispatch({ type: WS_SWITCH, id: ws.id })
  }

  function createNew() {
    dispatch({ type: NAV, page: 'workspace_create' })
  }

  return (
    <div className="min-h-screen bg-dark-400 flex flex-col items-center justify-center px-4 py-12">

      {/* ── Logo ── */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <Logo size={36} showText={false} />
        <div>
          <h1 className="text-xl font-extrabold text-ink text-center tracking-tight">
            Choose a workspace
          </h1>
          <p className="text-sm text-ink-muted text-center mt-1">
            {org?.name || org?.domain
              ? `Organisation: ${org.name || org.domain}`
              : 'Select or create a workspace to continue'}
          </p>
        </div>
      </div>

      {/* ── Workspace cards ── */}
      <div className="w-full max-w-2xl">
        {workspaces.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {workspaces.map(ws => {
              const isHover = hovered === ws.id
              const memberCount = (ws.members || []).length
              const canvasCount = (ws.canvases || []).length
              return (
                <button
                  key={ws.id}
                  onMouseEnter={() => setHovered(ws.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => enter(ws)}
                  className={[
                    'group relative w-full text-left rounded-2xl border transition-all duration-200 p-5',
                    'bg-dark border-border hover:border-gold/50 hover:bg-gold/[0.04] hover:shadow-[0_0_24px_rgba(212,146,14,0.1)]',
                    'focus:outline-none focus:border-gold/60',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${wsColor(ws.id)} flex items-center justify-center text-sm font-black text-white flex-shrink-0 shadow-md`}>
                      {wsInitials(ws.name)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-sm text-ink truncate">{ws.name || 'Unnamed Workspace'}</p>
                        {ws.plan === 'pro' && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">PRO</span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted truncate">{ws.description || 'No description'}</p>
                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="flex items-center gap-1 text-[11px] text-ink-faint">
                          <Users size={11} />
                          <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-ink-faint">
                          <Layers size={11} />
                          <span>{canvasCount}/3 canvases</span>
                        </div>
                      </div>
                    </div>
                    {/* Arrow */}
                    <ChevronRight
                      size={16}
                      className={`mt-1 flex-shrink-0 transition-all duration-150 ${isHover ? 'text-gold translate-x-0.5' : 'text-ink-faint'}`}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10 mb-4">
            <p className="text-ink-muted text-sm mb-1">No workspaces yet</p>
            <p className="text-ink-faint text-xs">Create your first workspace to get started</p>
          </div>
        )}

        {/* Create new / limit reached */}
        {canCreate ? (
          <button
            onClick={createNew}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border hover:border-gold/40 hover:bg-gold/[0.03] transition-all duration-200 py-4 text-sm font-semibold text-ink-muted hover:text-ink group"
          >
            <Plus size={15} className="group-hover:text-gold transition-colors" />
            <span>Create new workspace</span>
            <span className="text-xs text-ink-faint">({orgLimit - workspaces.length} remaining on free)</span>
          </button>
        ) : (
          <div className="w-full rounded-2xl border border-border bg-dark/50 py-4 px-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Workspace limit reached</p>
              <p className="text-xs text-ink-muted mt-0.5">Upgrade to Pro for unlimited workspaces</p>
            </div>
            <button
              onClick={() => dispatch({ type: NAV, page: 'billing' })}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gold text-dark-400 hover:opacity-90 transition-opacity"
            >
              Upgrade →
            </button>
          </div>
        )}

        {/* Join with invite code */}
        <div className="mt-4 text-center">
          <span className="text-xs text-ink-faint">
            Have an invite?{' '}
            <button className="text-gold hover:underline font-semibold" onClick={() => dispatch({ type: NAV, page: 'join_workspace' })}>
              Join existing workspace →
            </button>
          </span>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-12 flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark border border-border">
          <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-300">
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <span className="text-xs text-ink-muted">{user?.name || user?.email || 'User'}</span>
        </div>
        <button
          onClick={() => dispatch({ type: LOGOUT })}
          className="flex items-center gap-1.5 text-xs text-ink-faint hover:text-error transition-colors"
        >
          <LogOut size={12} />
          Sign out
        </button>
      </div>
    </div>
  )
}

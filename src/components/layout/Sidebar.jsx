import { useState } from 'react'
import {
  LayoutDashboard, Target, Users2, Sparkles, Map,
  CreditCard, Settings, ScrollText, HelpCircle,
  ChevronLeft, ChevronRight, LogOut, Check,
  Compass, Layers, Shield, PenSquare, Plus, ChevronDown,
  Palette,
} from 'lucide-react'
import Logo from '../ui/Logo.jsx'
import Avatar from '../ui/Avatar.jsx'
import Badge from '../ui/Badge.jsx'
import Tooltip from '../ui/Tooltip.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { NAV, LOGOUT, WS_SWITCH } from '../../state/actions.js'
import { t } from '../../utils/i18n.js'

const NAV_ITEMS = [
  { id: 'dashboard',  icon: LayoutDashboard, key: 'sidebar_dashboard',  group: 'main' },
  { id: 'strategy',   icon: Compass,         label: 'Strategy',         group: 'main' },
  { id: 'impactor',   icon: Target,          key: 'sidebar_impactor',   group: 'main', product: 'impactor' },
  { id: 'roadmap',    icon: Map,             key: 'sidebar_roadmap',    group: 'main' },
  { id: 'all_issues', icon: Layers,          label: 'All Issues',       group: 'main' },
  { id: 'canvas',     icon: Palette,         label: 'Canvas',           group: 'main', isNew: true },
  { id: 'robox',      icon: Users2,          key: 'sidebar_robox',      group: 'main', product: 'robox' },
  { id: 'ai_pilot',   icon: Sparkles,        key: 'sidebar_ai_pilot',   group: 'main', product: 'aiPilot' },
  { id: 'admin',      icon: Shield,          label: 'Admin',            group: 'main' },
  { id: 'billing',    icon: CreditCard,      key: 'sidebar_billing',    group: 'bottom' },
  { id: 'settings',   icon: Settings,        key: 'sidebar_settings',   group: 'bottom' },
  { id: 'audit',      icon: ScrollText,      key: 'sidebar_audit',      group: 'bottom' },
]

// ── Workspace initials + color ───────────────────────────────
function wsInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}
const WS_COLORS = [
  'from-amber-500 to-orange-600',
  'from-violet-500 to-purple-700',
  'from-teal-500 to-emerald-600',
  'from-sky-500 to-blue-600',
  'from-rose-500 to-pink-600',
]
function wsColorIdx(id = '') {
  return WS_COLORS[id.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % WS_COLORS.length]
}

export default function Sidebar() {
  const { state, dispatch } = useApp()
  const [collapsed, setCollapsed]   = useState(false)
  const [wsDdOpen, setWsDdOpen]     = useState(false)
  const { page, lang, user, org, workspaces = [], currentWorkspaceId } = state

  const tr = (k) => t(k, lang)

  const currentWs = workspaces.find(w => w.id === currentWorkspaceId) || null

  const isLocked = (product) => {
    if (!product) return false
    if (product === 'aiPilot') return org.subs.impactor === 'free' || org.subs.robox === 'free'
    return false
  }

  const planBadge = (product) => {
    if (!product) return null
    const sub = org.subs[product]
    if (sub === 'free') return <Badge variant="default" size="xs">Free</Badge>
    if (sub === 'pro')  return <Badge variant="gold" size="xs">Pro</Badge>
    return null
  }

  const mainItems   = NAV_ITEMS.filter(i => i.group === 'main')
  const bottomItems = NAV_ITEMS.filter(i => i.group === 'bottom')

  const NavItem = ({ item }) => {
    const Icon   = item.icon
    const active = page === item.id
    const locked = isLocked(item.product)
    const label  = item.label || (item.key ? tr(item.key) : item.id)

    const content = (
      <button
        onClick={() => !locked && dispatch({ type: NAV, page: item.id })}
        className={[
          'sidebar-item w-full',
          active  ? 'active' : '',
          locked  ? 'opacity-40 cursor-not-allowed' : '',
          item.isNew && !active ? 'text-teal-400/80 border-l-2 border-l-teal-500/50' : '',
          collapsed ? 'justify-center px-0' : '',
        ].join(' ')}
        title={collapsed ? label : undefined}
      >
        <Icon size={16} className="flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{label}</span>
            {item.isNew && !active && (
              <span className="text-[9px] font-black px-1 py-0.5 rounded bg-teal-500/15 text-teal-400 border border-teal-500/20">NEW</span>
            )}
            {item.product && !collapsed && planBadge(item.product)}
          </>
        )}
      </button>
    )

    return collapsed ? (
      <Tooltip content={label} placement="right">{content}</Tooltip>
    ) : content
  }

  return (
    <aside
      className={[
        'relative flex flex-col bg-dark border-r border-border transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-14' : 'w-56',
      ].join(' ')}
    >
      {/* ── Logo ── */}
      <div className={`flex items-center h-14 px-4 border-b border-border flex-shrink-0 ${collapsed ? 'justify-center px-2' : ''}`}>
        <Logo size={28} showText={!collapsed} />
      </div>

      {/* ── Workspace Switcher ── */}
      {!collapsed && (
        <div className="px-2 pt-2 relative">
          <button
            onClick={() => setWsDdOpen(o => !o)}
            className={[
              'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all duration-150',
              wsDdOpen
                ? 'border-gold/40 bg-gold/[0.06]'
                : 'border-border hover:border-border-hover bg-surface hover:bg-surface-hover',
            ].join(' ')}
          >
            {currentWs ? (
              <>
                <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${wsColorIdx(currentWs.id)} flex items-center justify-center text-[10px] font-black text-white flex-shrink-0`}>
                  {wsInitials(currentWs.name)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-semibold text-ink truncate leading-tight">{currentWs.name}</p>
                  <p className="text-[10px] text-ink-faint truncate leading-tight">{org.name || org.domain || 'Free'}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {currentWs.plan === 'pro'
                    ? <span className="text-[9px] font-black px-1 py-0.5 rounded bg-gold/15 text-gold border border-gold/20">PRO</span>
                    : <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-surface-hover text-ink-faint">FREE</span>
                  }
                  <ChevronDown size={12} className={`text-ink-faint transition-transform duration-150 ${wsDdOpen ? 'rotate-180' : ''}`} />
                </div>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-md bg-surface-hover flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-ink-faint">?</span>
                </div>
                <span className="flex-1 text-xs text-ink-muted truncate text-left">Select workspace</span>
                <ChevronDown size={12} className="text-ink-faint flex-shrink-0" />
              </>
            )}
          </button>

          {/* ── Workspace dropdown ── */}
          {wsDdOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setWsDdOpen(false)} />
              <div className="absolute left-2 right-2 top-full mt-1 bg-dark border border-border rounded-xl shadow-panel z-40 overflow-hidden animate-slide-up">
                {/* workspace list */}
                <div className="p-1.5">
                  {workspaces.map(ws => (
                    <button
                      key={ws.id}
                      onClick={() => { dispatch({ type: WS_SWITCH, id: ws.id }); setWsDdOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-hover transition-colors text-left"
                    >
                      <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${wsColorIdx(ws.id)} flex items-center justify-center text-[10px] font-black text-white flex-shrink-0`}>
                        {wsInitials(ws.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-ink truncate">{ws.name}</p>
                        <p className="text-[10px] text-ink-faint">{(ws.members || []).length} members</p>
                      </div>
                      {ws.id === currentWorkspaceId && (
                        <Check size={12} className="text-gold flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-border p-1.5">
                  <button
                    onClick={() => { dispatch({ type: NAV, page: 'workspace_create' }); setWsDdOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-hover transition-colors text-left"
                  >
                    <div className="w-6 h-6 rounded-md border border-dashed border-border flex items-center justify-center flex-shrink-0">
                      <Plus size={11} className="text-ink-faint" />
                    </div>
                    <span className="text-xs text-ink-muted">New workspace</span>
                    {workspaces.length >= 3 && (
                      <span className="text-[9px] text-ink-faint ml-auto">upgrade</span>
                    )}
                  </button>
                  <button
                    onClick={() => { dispatch({ type: NAV, page: 'workspace_select' }); setWsDdOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-hover transition-colors text-left"
                  >
                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0">
                      <PenSquare size={11} className="text-ink-faint" />
                    </div>
                    <span className="text-xs text-ink-muted">All workspaces</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Collapsed workspace icon ── */}
      {collapsed && currentWs && (
        <Tooltip content={currentWs.name} placement="right">
          <div className="flex justify-center py-2">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${wsColorIdx(currentWs.id)} flex items-center justify-center text-[10px] font-black text-white cursor-pointer`}
              onClick={() => setCollapsed(false)}
            >
              {wsInitials(currentWs.name)}
            </div>
          </div>
        </Tooltip>
      )}

      {/* ── Main nav ── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {mainItems.map(item => <NavItem key={item.id} item={item} />)}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-border" />

      {/* ── Bottom nav ── */}
      <nav className="py-2 px-2 space-y-0.5">
        {bottomItems.map(item => <NavItem key={item.id} item={item} />)}
        <Tooltip content="Help & Support" placement="right">
          <button className={`sidebar-item w-full ${collapsed ? 'justify-center px-0' : ''}`}>
            <HelpCircle size={16} className="flex-shrink-0" />
            {!collapsed && <span>Help</span>}
          </button>
        </Tooltip>
      </nav>

      {/* ── User / Org ── */}
      <div className="px-2 pb-3">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface-hover">
            <Avatar name={user?.name || 'User'} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-ink truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-ink-faint truncate">
                {currentWs ? `${currentWs.name}` : (org.name || org.domain || 'Your Org')}
              </p>
            </div>
            <button
              onClick={() => dispatch({ type: LOGOUT })}
              className="text-ink-faint hover:text-error transition-colors"
              title="Sign out"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <Tooltip content={user?.name || 'User'} placement="right">
            <div className="flex justify-center py-1">
              <Avatar name={user?.name || 'User'} size="sm" />
            </div>
          </Tooltip>
        )}
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-hover transition-all z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}

import { useState } from 'react'
import {
  LayoutDashboard, Target, Users2, Sparkles, Map,
  CreditCard, Settings, ScrollText, HelpCircle,
  ChevronLeft, ChevronRight, LogOut, TrendingUp,
  Compass, Layers, BarChart2,
} from 'lucide-react'
import Logo from '../ui/Logo.jsx'
import Avatar from '../ui/Avatar.jsx'
import Badge from '../ui/Badge.jsx'
import Tooltip from '../ui/Tooltip.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { NAV, LOGOUT } from '../../state/actions.js'
import { t } from '../../utils/i18n.js'

const NAV_ITEMS = [
  { id: 'dashboard',  icon: LayoutDashboard, key: 'sidebar_dashboard',   group: 'main' },
  { id: 'strategy',   icon: Compass,         label: 'Strategy',          group: 'main' },
  { id: 'impactor',   icon: Target,          key: 'sidebar_impactor',    group: 'main', product: 'impactor' },
  { id: 'roadmap',    icon: Map,             key: 'sidebar_roadmap',     group: 'main' },
  { id: 'all_issues', icon: Layers,          label: 'All Issues',        group: 'main' },
  { id: 'robox',      icon: Users2,          key: 'sidebar_robox',       group: 'main', product: 'robox'    },
  { id: 'ai_pilot',   icon: Sparkles,        key: 'sidebar_ai_pilot',    group: 'main', product: 'aiPilot'  },
  { id: 'crm',        icon: BarChart2,       label: 'CRM',               group: 'main' },
  { id: 'billing',    icon: CreditCard,      key: 'sidebar_billing',     group: 'bottom' },
  { id: 'settings',   icon: Settings,        key: 'sidebar_settings',    group: 'bottom' },
  { id: 'audit',      icon: ScrollText,      key: 'sidebar_audit',       group: 'bottom' },
]

export default function Sidebar() {
  const { state, dispatch } = useApp()
  const [collapsed, setCollapsed] = useState(false)
  const { page, lang, user, org } = state

  const tr = (k) => t(k, lang)

  const isLocked = (product) => {
    if (!product) return false
    if (product === 'aiPilot') {
      return org.subs.impactor === 'free' || org.subs.robox === 'free'
    }
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
    const Icon    = item.icon
    const active  = page === item.id
    const locked  = isLocked(item.product)
    const label   = item.label || (item.key ? tr(item.key) : item.id)

    const content = (
      <button
        onClick={() => !locked && dispatch({ type: NAV, page: item.id })}
        className={[
          'sidebar-item w-full',
          active ? 'active' : '',
          locked ? 'opacity-40 cursor-not-allowed' : '',
          collapsed ? 'justify-center px-0' : '',
        ].join(' ')}
        title={collapsed ? label : undefined}
      >
        <Icon size={16} className="flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{label}</span>
            {item.product && !collapsed && planBadge(item.product)}
          </>
        )}
      </button>
    )

    return collapsed ? (
      <Tooltip content={label} placement="right">
        {content}
      </Tooltip>
    ) : content
  }

  return (
    <aside
      className={[
        'relative flex flex-col bg-dark border-r border-border transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-14' : 'w-56',
      ].join(' ')}
    >
      {/* Logo */}
      <div className={`flex items-center h-14 px-4 border-b border-border flex-shrink-0 ${collapsed ? 'justify-center px-2' : ''}`}>
        <Logo size={28} showText={!collapsed} />
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {mainItems.map(item => <NavItem key={item.id} item={item} />)}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-border" />

      {/* Bottom nav */}
      <nav className="py-3 px-2 space-y-0.5">
        {bottomItems.map(item => <NavItem key={item.id} item={item} />)}
        <Tooltip content="Help & Support" placement="right">
          <button className={`sidebar-item w-full ${collapsed ? 'justify-center px-0' : ''}`}>
            <HelpCircle size={16} className="flex-shrink-0" />
            {!collapsed && <span>Help</span>}
          </button>
        </Tooltip>
      </nav>

      {/* User / Org */}
      <div className={`px-2 pb-3 ${collapsed ? '' : ''}`}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface-hover">
            <Avatar name={user?.name || 'User'} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-ink truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-ink-faint truncate">{org.name || org.domain || 'Your Org'}</p>
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

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-hover transition-all z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}

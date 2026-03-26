import { useState } from 'react'
import { Bell, Search, Globe, ChevronDown } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import Btn from '../ui/Btn.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { LANG } from '../../state/actions.js'

const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'Q2 OKR review due in 3 days', type: 'warning', unread: true },
  { id: 2, text: 'AI Briefing ready for your team', type: 'info', unread: true },
  { id: 3, text: 'Robox: 2 attendance alerts', type: 'error', unread: false },
]

export default function TopBar({ title, subtitle }) {
  const { state, dispatch } = useApp()
  const [notiOpen, setNotiOpen] = useState(false)
  const { user, lang } = state

  const unread = MOCK_NOTIFICATIONS.filter(n => n.unread).length

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-border bg-dark/50 backdrop-blur-sm flex-shrink-0">
      {/* Left: Page title */}
      <div>
        {title && <h1 className="text-sm font-semibold text-ink">{title}</h1>}
        {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Search */}
        <Btn variant="ghost" size="icon" className="text-ink-muted">
          <Search size={16} />
        </Btn>

        {/* Language toggle */}
        <Btn
          variant="ghost"
          size="sm"
          className="text-ink-muted gap-1"
          onClick={() => dispatch({ type: LANG, lang: lang === 'en' ? 'ar' : 'en' })}
        >
          <Globe size={14} />
          <span className="text-xs font-medium">{lang === 'en' ? 'EN' : 'عربي'}</span>
        </Btn>

        {/* Notifications */}
        <div className="relative">
          <Btn
            variant="ghost"
            size="icon"
            className="text-ink-muted relative"
            onClick={() => setNotiOpen(o => !o)}
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-error" />
            )}
          </Btn>

          {notiOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotiOpen(false)} />
              <div className="absolute right-0 top-10 w-72 bg-surface border border-border rounded-xl shadow-panel z-40 animate-slide-up overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-xs font-semibold text-ink">Notifications</span>
                  <span className="text-xs text-ink-faint">{unread} new</span>
                </div>
                <ul>
                  {MOCK_NOTIFICATIONS.map(n => (
                    <li
                      key={n.id}
                      className={`px-4 py-3 text-xs border-b border-border/50 last:border-0 cursor-pointer hover:bg-surface-hover transition-colors ${
                        n.unread ? 'text-ink' : 'text-ink-muted'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {n.unread && <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1 flex-shrink-0" />}
                        <span className={n.unread ? '' : 'ml-3.5'}>{n.text}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* User avatar */}
        <Avatar name={user?.name || 'User'} size="sm" className="cursor-pointer" />
      </div>
    </header>
  )
}

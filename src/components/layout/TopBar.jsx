import { useState, useEffect } from 'react'
import { Bell, Search, Globe } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import Btn from '../ui/Btn.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { LANG, NOTIF_READ_ALL, CMD_PALETTE_OPEN } from '../../state/actions.js'

export default function TopBar({ title, subtitle }) {
  const { state, dispatch } = useApp()
  const [notiOpen, setNotiOpen] = useState(false)
  const { user, lang, notifications = [], workspaces = [], currentWorkspaceId } = state

  const currentWs = workspaces.find(w => w.id === currentWorkspaceId) || null
  const unread    = notifications.filter(n => !n.read).length

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        dispatch({ type: CMD_PALETTE_OPEN })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [dispatch])

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-border bg-dark/50 backdrop-blur-sm flex-shrink-0">

      {/* ── Left: page title + workspace chip ── */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          {title    && <h1 className="text-sm font-semibold text-ink leading-tight">{title}</h1>}
          {subtitle && <p className="text-xs text-ink-muted leading-tight">{subtitle}</p>}
        </div>
        {currentWs && (
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gold/10 border border-gold/20 flex-shrink-0">
            <span className="text-[10px]">🏢</span>
            <span className="text-[11px] font-semibold text-gold leading-none truncate max-w-[120px]">{currentWs.name}</span>
          </div>
        )}
      </div>

      {/* ── Right: actions ── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">

        {/* Cmd+K search pill */}
        <button
          onClick={() => dispatch({ type: CMD_PALETTE_OPEN })}
          className="flex items-center gap-2 px-3 h-8 rounded-lg bg-surface border border-border hover:border-border-hover hover:bg-surface-hover text-ink-muted text-xs transition-all group"
        >
          <Search size={13} className="group-hover:text-ink transition-colors" />
          <span className="hidden sm:inline">Search…</span>
          <span className="hidden sm:inline-flex items-center gap-0.5 ml-1">
            <kbd className="text-[9px] px-1 py-0.5 rounded bg-surface-hover border border-border text-ink-faint">⌘</kbd>
            <kbd className="text-[9px] px-1 py-0.5 rounded bg-surface-hover border border-border text-ink-faint">K</kbd>
          </span>
        </button>

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
              <div className="absolute right-0 top-10 w-80 bg-surface border border-border rounded-xl shadow-panel z-40 animate-slide-up overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-xs font-semibold text-ink">Notifications</span>
                  <div className="flex items-center gap-2">
                    {unread > 0 && <span className="text-xs text-ink-faint">{unread} new</span>}
                    {unread > 0 && (
                      <button
                        className="text-[10px] text-gold hover:underline"
                        onClick={() => dispatch({ type: NOTIF_READ_ALL })}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                <ul className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <li className="px-4 py-6 text-xs text-center text-ink-faint">No notifications yet</li>
                  ) : notifications.slice(0, 20).map(n => (
                    <li
                      key={n.id}
                      className={`px-4 py-3 text-xs border-b border-border/50 last:border-0 cursor-pointer hover:bg-surface-hover transition-colors ${n.read ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1 flex-shrink-0" />}
                        <div className={n.read ? 'ml-3.5' : ''}>
                          {n.title && <p className="font-semibold text-ink mb-0.5">{n.title}</p>}
                          <p className="text-ink-muted">{n.body || n.text || ''}</p>
                          <p className="text-ink-faint text-[10px] mt-1">
                            {n.ts ? new Date(n.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-border text-center">
                    <button className="text-[11px] text-gold hover:underline">View all notifications</button>
                  </div>
                )}
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

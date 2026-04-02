import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, LayoutDashboard, Compass, Target, Map, Layers, Sparkles, Users2, Settings, CreditCard, ScrollText, Shield, Palette, X, ArrowRight, Hash, Telescope, Zap, Brain } from 'lucide-react'
import { useApp } from '../../state/AppContext.jsx'
import { CMD_PALETTE_CLOSE, NAV } from '../../state/actions.js'

const PAGE_ACTIONS = [
  { id: 'dashboard',  label: 'Dashboard',     desc: 'Executive overview', icon: LayoutDashboard, type: 'page' },
  { id: 'strategy',   label: 'Strategy',      desc: 'North Star · OKRs',  icon: Compass,         type: 'page' },
  { id: 'impactor',   label: 'Impactor',      desc: 'OKR execution',      icon: Target,          type: 'page' },
  { id: 'roadmap',    label: 'Roadmap',       desc: 'Gantt · Timeline',   icon: Map,             type: 'page' },
  { id: 'all_issues', label: 'All Issues',    desc: 'Work management',    icon: Layers,          type: 'page' },
  { id: 'canvas',     label: 'Canvas',        desc: 'Whiteboard · Diagrams', icon: Palette,      type: 'page' },
  { id: 'discovery',  label: 'Discovery',     desc: 'AI signals & insights',    icon: Telescope,   type: 'page' },
  { id: 'sprint',     label: 'Sprints',       desc: 'Sprint planning & board',  icon: Zap,         type: 'page' },
  { id: 'ceo',        label: 'CEO Intelligence', desc: 'Health score & briefing', icon: Brain,     type: 'page' },
  { id: 'ai_pilot',   label: 'AI Pilot',      desc: 'Intelligence & automation', icon: Sparkles, type: 'page' },
  { id: 'robox',      label: 'Robox',         desc: 'Workforce & attendance', icon: Users2,      type: 'page' },
  { id: 'settings',   label: 'Settings',      desc: 'Org & preferences',  icon: Settings,        type: 'page' },
  { id: 'billing',    label: 'Billing',       desc: 'Plans & usage',      icon: CreditCard,      type: 'page' },
  { id: 'audit',      label: 'Audit Log',     desc: 'Activity history',   icon: ScrollText,      type: 'page' },
  { id: 'admin',      label: 'Admin',         desc: 'Team management',    icon: Shield,          type: 'page' },
]

function buildResults(query, state) {
  const q = query.toLowerCase().trim()
  const results = []

  // Pages always appear when no query or query matches
  const pages = PAGE_ACTIONS.filter(p =>
    !q || p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
  )
  if (pages.length) results.push({ group: 'Navigate', items: pages })

  // OKRs
  if (state.okrs && q.length >= 2) {
    const okrItems = []
    state.okrs.forEach(okr => {
      if (okr.title.toLowerCase().includes(q)) {
        okrItems.push({ id: okr.id, label: okr.title, desc: `${okr.quarter || 'OKR'} · ${okr.status || ''}`, icon: Target, type: 'okr', okrId: okr.id })
      }
      ;(okr.keyResults || []).forEach(kr => {
        if (kr.title.toLowerCase().includes(q)) {
          okrItems.push({ id: kr.id, label: kr.title, desc: `KR in "${okr.title}"`, icon: Hash, type: 'kr', okrId: okr.id })
        }
      })
      ;(okr.initiatives || []).forEach(ini => {
        if (ini.title.toLowerCase().includes(q)) {
          okrItems.push({ id: ini.id, label: ini.title, desc: `Initiative · ${ini.status || ''}`, icon: ArrowRight, type: 'initiative', okrId: okr.id })
        }
      })
    })
    if (okrItems.length) results.push({ group: 'OKRs & Initiatives', items: okrItems.slice(0, 6) })
  }

  return results
}

export default function CommandPalette() {
  const { state, dispatch } = useApp()
  const [query, setQuery]   = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef            = useRef(null)

  const results = buildResults(query, state)
  const flatItems = results.flatMap(g => g.items)

  // Focus input on open
  useEffect(() => {
    if (state.cmdPaletteOpen) {
      setQuery('')
      setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [state.cmdPaletteOpen])

  const close = useCallback(() => dispatch({ type: CMD_PALETTE_CLOSE }), [dispatch])

  function select(item) {
    if (item.type === 'page') {
      dispatch({ type: NAV, page: item.id })
    } else if (item.type === 'okr') {
      dispatch({ type: NAV, page: 'impactor' })
    } else if (item.type === 'kr' || item.type === 'initiative') {
      dispatch({ type: NAV, page: 'impactor' })
    }
    close()
  }

  // Keyboard nav
  useEffect(() => {
    if (!state.cmdPaletteOpen) return
    const handler = (e) => {
      if (e.key === 'Escape') { close(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, flatItems.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
      if (e.key === 'Enter' && flatItems[cursor]) { select(flatItems[cursor]) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.cmdPaletteOpen, cursor, flatItems, close])

  if (!state.cmdPaletteOpen) return null

  let itemIndex = 0

  return (
    <div className="fixed inset-0 z-[9000] flex items-start justify-center pt-[10vh] px-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-dark-400/80 backdrop-blur-sm" onClick={close} />

      <div className="relative w-full max-w-xl bg-surface border border-border rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden animate-scale-in">

        {/* search input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search size={15} className="text-ink-muted flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0) }}
            placeholder="Search pages, OKRs, initiatives…"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
          />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <kbd className="text-[9px] px-1.5 py-0.5 rounded border border-border bg-surface-hover text-ink-faint">ESC</kbd>
            <button onClick={close} className="text-ink-faint hover:text-ink transition-colors ml-1">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* results */}
        <div className="max-h-[400px] overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <div className="py-10 text-center text-xs text-ink-faint">No results for "{query}"</div>
          ) : results.map(group => (
            <div key={group.group}>
              <div className="px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-ink-faint">
                {group.group}
              </div>
              {group.items.map(item => {
                const Icon    = item.icon
                const isActive = itemIndex === cursor
                const thisIdx  = itemIndex++
                return (
                  <button
                    key={item.id}
                    onMouseEnter={() => setCursor(thisIdx)}
                    onClick={() => select(item)}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      isActive ? 'bg-gold/[0.08]' : 'hover:bg-surface-hover',
                    ].join(' ')}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-gold/15' : 'bg-surface-hover'}`}>
                      <Icon size={14} className={isActive ? 'text-gold' : 'text-ink-muted'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-ink' : 'text-ink-muted'}`}>{item.label}</p>
                      {item.desc && <p className="text-[11px] text-ink-faint truncate">{item.desc}</p>}
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${
                      item.type === 'page'       ? 'bg-violet-500/10 text-violet-300' :
                      item.type === 'okr'        ? 'bg-teal-500/10 text-teal-300' :
                      item.type === 'kr'         ? 'bg-teal-500/10 text-teal-300' :
                      item.type === 'initiative' ? 'bg-sky-500/10 text-sky-300' :
                      'bg-surface-hover text-ink-faint'
                    }`}>
                      {item.type}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* footer hint */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-3 text-[10px] text-ink-faint">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>ESC close</span>
        </div>
      </div>
    </div>
  )
}

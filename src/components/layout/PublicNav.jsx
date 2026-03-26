import { useState } from 'react'
import { Menu, X, Globe } from 'lucide-react'
import Logo from '../ui/Logo.jsx'
import Btn from '../ui/Btn.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { NAV, LANG } from '../../state/actions.js'
import { t } from '../../utils/i18n.js'

export default function PublicNav() {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const { lang } = state

  const tr = (k) => t(k, lang)
  const go = (page) => { dispatch({ type: NAV, page }); setOpen(false) }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16 flex items-center border-b border-border/50 bg-dark-400/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto w-full px-5 flex items-center gap-4">
        {/* Logo */}
        <button onClick={() => go('landing')} className="flex-shrink-0">
          <Logo size={30} />
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1 ml-6 flex-1">
          {[
            { page: 'landing',  label: tr('nav_home') },
            { page: 'pricing',  label: tr('nav_pricing') },
            { page: 'demo',     label: tr('nav_demo') },
          ].map(item => (
            <button
              key={item.page}
              onClick={() => go(item.page)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                state.page === item.page
                  ? 'text-gold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="ml-auto hidden md:flex items-center gap-2">
          <Btn
            variant="ghost"
            size="sm"
            className="text-ink-muted gap-1.5"
            onClick={() => dispatch({ type: LANG, lang: lang === 'en' ? 'ar' : 'en' })}
          >
            <Globe size={14} />
            <span className="text-xs">{lang === 'en' ? 'EN' : 'عربي'}</span>
          </Btn>
          <Btn variant="ghost" size="sm" onClick={() => go('login')}>
            {tr('nav_login')}
          </Btn>
          <Btn variant="primary" size="sm" onClick={() => go('signup')}>
            {tr('nav_signup')}
          </Btn>
        </div>

        {/* Mobile hamburger */}
        <button className="ml-auto md:hidden text-ink-muted" onClick={() => setOpen(o => !o)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="absolute top-16 inset-x-0 bg-dark-400 border-b border-border md:hidden animate-slide-up">
          <div className="px-5 py-3 space-y-1">
            {[
              { page: 'landing', label: tr('nav_home') },
              { page: 'pricing', label: tr('nav_pricing') },
              { page: 'demo',    label: tr('nav_demo') },
            ].map(item => (
              <button
                key={item.page}
                onClick={() => go(item.page)}
                className="w-full text-left px-3 py-2.5 text-sm text-ink-muted hover:text-ink hover:bg-surface-hover rounded-lg transition-colors"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 flex gap-2 pb-1">
              <Btn variant="secondary" size="sm" className="flex-1" onClick={() => go('login')}>
                {tr('nav_login')}
              </Btn>
              <Btn variant="primary" size="sm" className="flex-1" onClick={() => go('signup')}>
                {tr('nav_signup')}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

import { createContext, useContext, useReducer, useEffect } from 'react'
import { reducer, INIT_STATE } from './reducer.js'

// ─── Context ──────────────────────────────────────────────────
export const AppCtx = createContext(null)

// ─── Provider ─────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INIT_STATE, (init) => {
    try {
      const saved = localStorage.getItem('ff_state')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Only restore certain parts (not UI state like page/step)
        return {
          ...init,
          lang: parsed.lang || init.lang,
          user: parsed.user || init.user,
          org: { ...init.org, ...parsed.org },
          okrs: parsed.okrs || init.okrs,
          members: parsed.members || init.members,
          // Restore page only if user is logged in
          page: parsed.user ? (parsed.page || 'dashboard') : 'landing',
        }
      }
    } catch {}
    return init
  })

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem('ff_state', JSON.stringify({
        lang: state.lang,
        user: state.user,
        org: state.org,
        okrs: state.okrs,
        members: state.members,
        page: state.page,
      }))
    } catch {}
  }, [state.lang, state.user, state.org, state.okrs, state.members, state.page])

  // Apply RTL direction
  useEffect(() => {
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = state.lang
  }, [state.lang])

  return (
    <AppCtx.Provider value={{ state, dispatch }}>
      {children}
    </AppCtx.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────
export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

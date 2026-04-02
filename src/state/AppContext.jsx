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
        // Deep-merge org.subs to prevent nested object reset bugs
        const restoredOrg = { ...init.org, ...parsed.org }
        if (parsed.org?.subs) {
          restoredOrg.subs = { ...init.org.subs, ...parsed.org.subs }
        }
        // Migration guard: aiCredits
        const restoredAiCredits = { ...init.aiCredits, ...(parsed.aiCredits || {}) }
        return {
          ...init,
          lang:                 parsed.lang                 || init.lang,
          user:                 parsed.user                 || init.user,
          org:                  restoredOrg,
          okrs:                 parsed.okrs                 || init.okrs,
          members:              parsed.members              || init.members,
          auditLog:             parsed.auditLog             || init.auditLog,
          northStar:            parsed.northStar            || init.northStar,
          workflowConfig:       parsed.workflowConfig       || init.workflowConfig,
          theme:                parsed.theme                || init.theme,
          fontSize:             parsed.fontSize             || init.fontSize,
          // P1 workspace state — migration guard: default to [] if old save has none
          workspaces:           Array.isArray(parsed.workspaces) ? parsed.workspaces : init.workspaces,
          currentWorkspaceId:   parsed.currentWorkspaceId   ?? init.currentWorkspaceId,
          joinRequests:         Array.isArray(parsed.joinRequests) ? parsed.joinRequests : init.joinRequests,
          // P6 notifications
          notifications:        Array.isArray(parsed.notifications) ? parsed.notifications : init.notifications,
          // Billing / AI credits
          aiCredits:            restoredAiCredits,
          // P7 discovery + P8 sprints
          discoveryCards:       Array.isArray(parsed.discoveryCards) ? parsed.discoveryCards : init.discoveryCards,
          sprints:              Array.isArray(parsed.sprints) ? parsed.sprints : init.sprints,
          // Never restore drawer / palette open state
          openTicketId:         null,
          cmdPaletteOpen:       false,
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
        lang:               state.lang,
        user:               state.user,
        org:                state.org,
        okrs:               state.okrs,
        members:            state.members,
        auditLog:           (state.auditLog || []).slice(0, 200),
        northStar:          state.northStar,
        workflowConfig:     state.workflowConfig,
        theme:              state.theme,
        fontSize:           state.fontSize,
        page:               state.page,
        workspaces:         state.workspaces,
        currentWorkspaceId: state.currentWorkspaceId,
        joinRequests:       state.joinRequests,
        notifications:      (state.notifications || []).slice(0, 50),
        aiCredits:          state.aiCredits,
        discoveryCards:     state.discoveryCards,
        sprints:            state.sprints,
      }))
    } catch {}
  }, [
    state.lang, state.user, state.org, state.okrs, state.members,
    state.auditLog, state.northStar, state.workflowConfig,
    state.theme, state.fontSize, state.page,
    state.workspaces, state.currentWorkspaceId, state.joinRequests,
    state.notifications, state.aiCredits,
    state.discoveryCards, state.sprints,
  ])

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

// ─── Workspace selector helper ────────────────────────────────
export function useWorkspace() {
  const { state } = useApp()
  const ws = (state.workspaces || []).find(w => w.id === state.currentWorkspaceId) || null
  return ws
}

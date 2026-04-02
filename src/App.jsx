import { useEffect } from 'react'
import { AppProvider, useApp } from './state/AppContext.jsx'

// Public pages
import LandingPage  from './pages/public/LandingPage.jsx'
import PricingPage  from './pages/public/PricingPage.jsx'
import DemoPage     from './pages/public/DemoPage.jsx'

// Auth pages
import LoginPage    from './pages/auth/LoginPage.jsx'
import SignupWizard from './pages/auth/SignupWizard.jsx'

// Workspace pages (P1)
import WorkspaceSelectorPage from './pages/workspace/WorkspaceSelectorPage.jsx'
import WorkspaceCreatePage   from './pages/workspace/WorkspaceCreatePage.jsx'

// Onboarding wizard (P2)
import OnboardingWizard from './pages/onboarding/OnboardingWizard.jsx'

// Canvas page (P9)
import CanvasPage from './pages/app/CanvasPage.jsx'

// App shell + pages
import AppShell         from './components/layout/AppShell.jsx'
import TicketDrawer     from './components/ui/TicketDrawer.jsx'
import InitiativeView   from './components/ui/InitiativeView.jsx'
import CommandPalette   from './components/ui/CommandPalette.jsx'
import DashboardPage    from './pages/app/DashboardPage.jsx'
import ImpactorPage     from './pages/app/ImpactorPage.jsx'
import RoboxPage        from './pages/app/RoboxPage.jsx'
import AIPilotPage      from './pages/app/AIPilotPage.jsx'
import RoadmapPage      from './pages/app/RoadmapPage.jsx'
import BillingPage      from './pages/app/BillingPage.jsx'
import SettingsPage     from './pages/app/SettingsPage.jsx'
import AuditPage        from './pages/app/AuditPage.jsx'
import SalesPage        from './pages/app/SalesPage.jsx'
import StrategyPage     from './pages/app/StrategyPage.jsx'
import AllIssuesPage    from './pages/app/AllIssuesPage.jsx'
import CRMPage          from './pages/app/CRMPage.jsx'
import AdminPage        from './pages/app/AdminPage.jsx'

// Actions
import { OPEN_TICKET, CLOSE_TICKET } from './state/actions.js'

// ─── Router ───────────────────────────────────────────────────
function Router() {
  const { state, dispatch } = useApp()
  const { page, user, workspaces = [], currentWorkspaceId } = state

  // Apply theme and font scale to document element
  useEffect(() => {
    const root = document.documentElement
    const resolvedTheme = state.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : (state.theme || 'light')
    root.setAttribute('data-theme', resolvedTheme)
    root.setAttribute('data-fontscale', state.fontSize || 'md')
  }, [state.theme, state.fontSize])

  // Hash routing — open ticket on load/hashchange
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash
      const m = hash.match(/^#ticket=(.+)$/)
      if (m) {
        dispatch({ type: OPEN_TICKET, id: m[1] })
      } else if (hash === '') {
        dispatch({ type: CLOSE_TICKET })
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [dispatch])

  // Public routes (no auth needed)
  const publicPages = {
    landing: <LandingPage />,
    pricing: <PricingPage />,
    demo:    <DemoPage />,
    login:   <LoginPage />,
    signup:  <SignupWizard />,
  }
  if (publicPages[page]) return publicPages[page]

  // Protected — redirect to login if not authenticated
  if (!user) return <LoginPage />

  // ── P1 Workspace routing ──────────────────────────────────────
  // Workspace management pages (full-screen, no AppShell)
  if (page === 'workspace_select') return <WorkspaceSelectorPage />
  if (page === 'workspace_create') return <WorkspaceCreatePage />

  // If user is logged in but has no workspace → show selector
  if (!currentWorkspaceId || workspaces.length === 0) {
    return <WorkspaceSelectorPage />
  }

  // ── P2 Onboarding ─────────────────────────────────────────────
  const currentWs = workspaces.find(w => w.id === currentWorkspaceId)
  if (currentWs && currentWs.onboarding && !currentWs.onboarding.complete && page !== 'workspace_select' && page !== 'workspace_create') {
    return <OnboardingWizard workspace={currentWs} />
  }

  // App routes (inside AppShell)
  const appPages = {
    dashboard:  <DashboardPage />,
    strategy:   <StrategyPage />,
    impactor:   <ImpactorPage />,
    robox:      <RoboxPage />,
    ai_pilot:   <AIPilotPage />,
    roadmap:    <RoadmapPage />,
    all_issues: <AllIssuesPage />,
    canvas:     <CanvasPage />,
    admin:      <AdminPage />,
    crm:        <CRMPage />,
    sales:      <SalesPage />,
    billing:    <BillingPage />,
    settings:   <SettingsPage />,
    audit:      <AuditPage />,
  }

  const content = appPages[page] ?? <DashboardPage />

  return (
    <>
      <AppShell>{content}</AppShell>
      <TicketDrawer />
      <InitiativeView />
      <CommandPalette />
    </>
  )
}

// ─── Root App ─────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  )
}

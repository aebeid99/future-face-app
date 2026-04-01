import { useEffect } from 'react'
import { AppProvider, useApp } from './state/AppContext.jsx'

// Public pages
import LandingPage  from './pages/public/LandingPage.jsx'
import PricingPage  from './pages/public/PricingPage.jsx'
import DemoPage     from './pages/public/DemoPage.jsx'

// Auth pages
import LoginPage    from './pages/auth/LoginPage.jsx'
import SignupWizard from './pages/auth/SignupWizard.jsx'

// App shell + pages
import AppShell         from './components/layout/AppShell.jsx'
import TicketDrawer     from './components/ui/TicketDrawer.jsx'
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
  const { page, user } = state

  // Apply theme and font scale to document element
  useEffect(() => {
    const root = document.documentElement
    // Resolve 'system' to actual preference
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

  // Protected routes — redirect to login if not authenticated
  if (!user) return <LoginPage />

  // App routes (inside AppShell)
  const appPages = {
    dashboard:  <DashboardPage />,
    strategy:   <StrategyPage />,
    impactor:   <ImpactorPage />,
    robox:      <RoboxPage />,
    ai_pilot:   <AIPilotPage />,
    roadmap:    <RoadmapPage />,
    all_issues: <AllIssuesPage />,
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

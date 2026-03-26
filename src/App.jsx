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
import DashboardPage    from './pages/app/DashboardPage.jsx'
import ImpactorPage     from './pages/app/ImpactorPage.jsx'
import RoboxPage        from './pages/app/RoboxPage.jsx'
import AIPilotPage      from './pages/app/AIPilotPage.jsx'
import RoadmapPage      from './pages/app/RoadmapPage.jsx'
import BillingPage      from './pages/app/BillingPage.jsx'
import SettingsPage     from './pages/app/SettingsPage.jsx'
import AuditPage        from './pages/app/AuditPage.jsx'
import SalesPage        from './pages/app/SalesPage.jsx'

// ─── Router ───────────────────────────────────────────────────
function Router() {
  const { state } = useApp()
  const { page, user } = state

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
    dashboard: <DashboardPage />,
    impactor:  <ImpactorPage />,
    robox:     <RoboxPage />,
    ai_pilot:  <AIPilotPage />,
    roadmap:   <RoadmapPage />,
    billing:   <BillingPage />,
    settings:  <SettingsPage />,
    audit:     <AuditPage />,
    sales:     <SalesPage />,
  }

  const content = appPages[page] ?? <DashboardPage />

  return <AppShell>{content}</AppShell>
}

// ─── Root App ─────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  )
}

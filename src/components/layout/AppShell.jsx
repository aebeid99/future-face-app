import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'
import { useApp } from '../../state/AppContext.jsx'

// Page → title/subtitle mapping
const PAGE_META = {
  dashboard: { title: 'Executive Dashboard',  subtitle: 'Your strategy at a glance' },
  impactor:  { title: 'Impactor',             subtitle: 'OKR & Strategy Execution' },
  robox:     { title: 'Robox',                subtitle: 'Workforce & Attendance' },
  ai_pilot:  { title: 'AI Pilot',             subtitle: 'Intelligence & Automation' },
  roadmap:   { title: 'Roadmap',              subtitle: 'Initiatives & Milestones' },
  billing:   { title: 'Billing & Plans',      subtitle: 'Manage your subscription' },
  settings:  { title: 'Settings',             subtitle: 'Organisation & Preferences' },
  audit:     { title: 'Audit Log',            subtitle: 'Activity history' },
}

export default function AppShell({ children }) {
  const { state } = useApp()
  const meta = PAGE_META[state.page] || {}

  return (
    <div className="flex h-screen overflow-hidden bg-dark-400">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <TopBar title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  )
}

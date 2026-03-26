import { Plus, Flag, Calendar } from 'lucide-react'
import Card, { CardHeader } from '../../components/ui/Card.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Badge from '../../components/ui/Badge.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { t } from '../../utils/i18n.js'

const DEMO_INITIATIVES = [
  { id:1, title:'Customer Portal Launch',        quarter:'Q2 2026', owner:'Sara Mahmoud',   status:'on_track',  progress:65, okr:'Market Share Growth' },
  { id:2, title:'AI OKR Automation rollout',     quarter:'Q2 2026', owner:'Ahmed Al-Rashidi',status:'at_risk',  progress:40, okr:'Product Innovation'  },
  { id:3, title:'Robox Mobile App v2',           quarter:'Q3 2026', owner:'Ali Hassan',      status:'on_track', progress:20, okr:'Platform Expansion'  },
  { id:4, title:'PDPL Compliance Audit',         quarter:'Q2 2026', owner:'Nora Al-Ghamdi',  status:'completed',progress:100,okr:'Regulatory'           },
]

export default function RoadmapPage() {
  const { state } = useApp()
  const { lang, org } = state
  const statusLabel = (s) => org.statusLabels?.[s] || s.replace('_',' ')

  const quarters = [...new Set(DEMO_INITIATIVES.map(i => i.quarter))]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">{DEMO_INITIATIVES.length} initiatives across {quarters.length} quarters</p>
        <Btn size="sm" icon={<Plus size={14} />}>
          {lang === 'ar' ? 'مبادرة جديدة' : 'New Initiative'}
        </Btn>
      </div>

      {quarters.map(q => (
        <Card key={q}>
          <CardHeader
            title={q}
            subtitle={`${DEMO_INITIATIVES.filter(i => i.quarter === q).length} initiatives`}
          />
          <div className="space-y-2">
            {DEMO_INITIATIVES.filter(i => i.quarter === q).map(init => (
              <div key={init.id} className="flex items-center gap-4 p-3 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors cursor-pointer">
                <Flag size={14} className="text-ink-faint flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{init.title}</p>
                  <p className="text-xs text-ink-faint mt-0.5">⊕ {init.okr} · {init.owner}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${init.progress}%` }} />
                  </div>
                  <span className="text-xs text-ink-muted w-8">{init.progress}%</span>
                  <Badge variant={init.status} dot size="sm">{statusLabel(init.status)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

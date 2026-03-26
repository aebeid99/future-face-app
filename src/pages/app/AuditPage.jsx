import { ScrollText, Filter } from 'lucide-react'
import Card, { CardHeader } from '../../components/ui/Card.jsx'
import Avatar from '../../components/ui/Avatar.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { t } from '../../utils/i18n.js'

const AUDIT_LOG = [
  { id:1, user:'Ahmed Al-Rashidi', action:'Created OKR',             target:'Market Share Growth Q2',  product:'impactor', time:'2026-03-26 14:22' },
  { id:2, user:'Sara Mahmoud',     action:'Updated Key Result',      target:'KR2: Revenue +20%',       product:'impactor', time:'2026-03-26 13:45' },
  { id:3, user:'Ali Hassan',       action:'Checked in',              target:'Attendance system',       product:'robox',    time:'2026-03-26 08:01' },
  { id:4, user:'Nora Al-Ghamdi',   action:'Generated AI Briefing',   target:'Sunday Briefing',         product:'ai_pilot', time:'2026-03-25 19:00' },
  { id:5, user:'Ahmed Al-Rashidi', action:'Changed status',          target:'Initiative: Portal → On Track',product:'impactor',time:'2026-03-25 15:30' },
  { id:6, user:'Sara Mahmoud',     action:'Invited team member',     target:'khalid@org.com',          product:'robox',    time:'2026-03-24 11:00' },
]

const PRODUCT_BADGE = {
  impactor: { label: 'Impactor', variant: 'gold'    },
  robox:    { label: 'Robox',    variant: 'info'     },
  ai_pilot: { label: 'AI Pilot', variant: 'default'  },
}

export default function AuditPage() {
  const { state } = useApp()
  const { lang } = state

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader
          title={lang === 'ar' ? 'سجل المراجعة' : 'Audit Log'}
          subtitle={lang === 'ar' ? 'سجل كامل بجميع الإجراءات في المؤسسة' : 'Complete record of all organisation actions'}
          action={
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Filter size={12} />
              {lang === 'ar' ? 'تصفية' : 'Filter'}
            </div>
          }
        />
        <table className="ff-table">
          <thead>
            <tr>
              <th>{lang === 'ar' ? 'المستخدم' : 'User'}</th>
              <th>{lang === 'ar' ? 'الإجراء' : 'Action'}</th>
              <th>{lang === 'ar' ? 'الهدف' : 'Target'}</th>
              <th>{lang === 'ar' ? 'المنتج' : 'Product'}</th>
              <th>{lang === 'ar' ? 'الوقت' : 'Time'}</th>
            </tr>
          </thead>
          <tbody>
            {AUDIT_LOG.map(log => {
              const badge = PRODUCT_BADGE[log.product]
              return (
                <tr key={log.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar name={log.user} size="xs" />
                      <span className="text-sm text-ink">{log.user}</span>
                    </div>
                  </td>
                  <td><span className="text-sm">{log.action}</span></td>
                  <td><span className="text-xs text-ink-muted truncate max-w-[160px] block">{log.target}</span></td>
                  <td><Badge variant={badge?.variant} size="xs">{badge?.label}</Badge></td>
                  <td><span className="text-xs text-ink-faint font-mono">{log.time}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

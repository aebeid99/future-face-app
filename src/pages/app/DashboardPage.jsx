import { Target, Users2, Sparkles, TrendingUp, Activity, ArrowRight, Calendar, CheckSquare } from 'lucide-react'
import Card, { StatCard, CardHeader } from '../../components/ui/Card.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import ProgressRing from '../../components/ui/ProgressRing.jsx'
import Avatar, { AvatarGroup } from '../../components/ui/Avatar.jsx'
import Btn from '../../components/ui/Btn.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { NAV } from '../../state/actions.js'
import { t } from '../../utils/i18n.js'
import { currentQuarter, formatRelative, progressColor } from '../../utils/formatting.js'

// Demo data for initial state
const DEMO_OKRS = [
  { id: 1, title: 'Increase market share in KSA by 20%', progress: 72, status: 'on_track',  owner: 'Ahmed Al-Rashidi' },
  { id: 2, title: 'Launch Robox workforce module Q2 2026', progress: 45, status: 'at_risk',  owner: 'Sara Mahmoud'    },
  { id: 3, title: 'Achieve 90% customer satisfaction score', progress: 88, status: 'on_track', owner: 'Ali Hassan'  },
]

const DEMO_ACTIVITIES = [
  { user: 'Ahmed Al-Rashidi', action: 'updated OKR progress to 72%', time: '10m ago', product: 'impactor' },
  { user: 'Sara Mahmoud',     action: 'flagged KR as At Risk',        time: '1h ago', product: 'impactor' },
  { user: 'Ali Hassan',       action: 'completed attendance review',  time: '2h ago', product: 'robox'    },
  { user: 'Nora Al-Ghamdi',   action: 'ran AI Sunday Briefing',       time: '3h ago', product: 'ai_pilot' },
]

export default function DashboardPage() {
  const { state, dispatch } = useApp()
  const { lang, okrs, org, user } = state
  const tr = (k) => t(k, lang)
  const go = (page) => dispatch({ type: NAV, page })

  const displayOkrs = okrs.length > 0 ? okrs : DEMO_OKRS
  const avgProgress = Math.round(
    displayOkrs.reduce((s, o) => s + o.progress, 0) / displayOkrs.length
  )

  const wercScore = 89  // WERC: Weekly Execution Reviews Completed

  const statusLabel = (status) => org.statusLabels?.[status] || status.replace('_', ' ')

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-gold/10 to-transparent border border-gold/15 rounded-xl px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">
            {lang === 'ar'
              ? `مرحباً، ${user?.name?.split(' ')[0] || 'Ahmed'} 👋`
              : `Welcome back, ${user?.name?.split(' ')[0] || 'Ahmed'} 👋`
            }
          </h2>
          <p className="text-sm text-ink-muted">
            {lang === 'ar'
              ? `${currentQuarter()} — فريقك يُحقّق أداءً رائعاً`
              : `${currentQuarter()} — Your team is executing well`
            }
          </p>
        </div>
        <Badge variant="gold" dot>{lang === 'ar' ? 'على المسار' : 'On Track'}</Badge>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={lang === 'ar' ? 'تقدم الأهداف' : 'OKR Progress'}
          value={`${avgProgress}%`}
          delta={+5}
          icon={Target}
          color="#D4920E"
        />
        <StatCard
          label={lang === 'ar' ? 'مؤشر WERC' : 'WERC Score'}
          value={`${wercScore}%`}
          delta={+3}
          icon={Activity}
          color="#10B981"
        />
        <StatCard
          label={lang === 'ar' ? 'أعضاء الفريق النشطون' : 'Active Team Members'}
          value={state.members.length || 12}
          icon={Users2}
          color="#3B82F6"
        />
        <StatCard
          label={lang === 'ar' ? 'مبادرات جارية' : 'Active Initiatives'}
          value={8}
          delta={+2}
          icon={CheckSquare}
          color="#8B5CF6"
        />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* OKR board preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title={lang === 'ar' ? 'أهداف الربع الحالي' : `${currentQuarter()} Objectives`}
              subtitle={`${displayOkrs.length} objectives`}
              action={
                <Btn variant="ghost" size="sm" iconRight={<ArrowRight size={12} />} onClick={() => go('impactor')}>
                  {lang === 'ar' ? 'عرض الكل' : 'View all'}
                </Btn>
              }
            />
            <div className="space-y-3">
              {displayOkrs.map(okr => (
                <div key={okr.id} className="flex items-center gap-4 p-3 rounded-lg bg-dark-100 hover:bg-dark-200 transition-colors cursor-pointer" onClick={() => go('impactor')}>
                  <ProgressRing value={okr.progress} size={44} stroke={4} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{okr.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar name={okr.owner} size="xs" />
                      <span className="text-xs text-ink-faint">{okr.owner}</span>
                    </div>
                  </div>
                  <Badge variant={okr.status} dot size="sm">
                    {statusLabel(okr.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* WERC ring */}
          <Card>
            <CardHeader title={lang === 'ar' ? 'مؤشر WERC' : 'WERC Score'} subtitle={lang === 'ar' ? 'مراجعات أسبوعية مكتملة' : 'Weekly reviews completed'} />
            <div className="flex items-center gap-4">
              <ProgressRing value={wercScore} size={64} stroke={6} />
              <div>
                <p className="text-2xl font-bold text-ink">{wercScore}%</p>
                <p className="text-xs text-success mt-0.5">
                  {lang === 'ar' ? '↑ ٣٪ مقارنة بالأسبوع الماضي' : '↑ 3% vs last week'}
                </p>
                <p className="text-xs text-ink-faint mt-1">
                  {lang === 'ar' ? '8 من 9 مراجعات مكتملة' : '8 of 9 reviews done'}
                </p>
              </div>
            </div>
          </Card>

          {/* AI Briefing teaser */}
          <Card className="bg-gradient-to-br from-surface to-dark-100 border-gold/15">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Sparkles size={15} className="text-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold">{lang === 'ar' ? 'إحاطة الذكاء الاصطناعي' : 'AI Briefing'}</p>
                <p className="text-xs text-ink-muted">
                  {lang === 'ar' ? 'آخر تحديث: اليوم ٧:٠٠ ص' : 'Last updated: Today 7:00 AM'}
                </p>
              </div>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed mb-3">
              {lang === 'ar'
                ? 'فريقك يُحقق ٧٢٪ من هدف زيادة الحصة السوقية. يُنصح بمراجعة نتيجتَي KR2 و KR4 — تأخّرتا عن المسار...'
                : 'Your team is at 72% on the market share objective. KR2 and KR4 need attention — they fell behind schedule last week...'
              }
            </p>
            <Btn
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => go('ai_pilot')}
              iconRight={<ArrowRight size={12} />}
            >
              {lang === 'ar' ? 'قراءة الإحاطة الكاملة' : 'Read full briefing'}
            </Btn>
          </Card>
        </div>
      </div>

      {/* Activity feed */}
      <Card>
        <CardHeader title={lang === 'ar' ? 'النشاط الأخير' : 'Recent Activity'} />
        <div className="space-y-0">
          {DEMO_ACTIVITIES.map((act, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
              <Avatar name={act.user} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink">
                  <span className="font-medium">{act.user}</span>{' '}
                  <span className="text-ink-muted">{act.action}</span>
                </p>
              </div>
              <span className="text-xs text-ink-faint flex-shrink-0">{act.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { UserPlus, Download, CheckCircle2, XCircle, Clock, Building2 } from 'lucide-react'
import Card, { CardHeader, StatCard } from '../../components/ui/Card.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Avatar, { AvatarGroup } from '../../components/ui/Avatar.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { t } from '../../utils/i18n.js'

const DEMO_MEMBERS = [
  { id:'m1', name:'Ahmed Al-Rashidi',  role:'Product Manager',  dept:'Product',   status:'checked_in',  attendance: 96 },
  { id:'m2', name:'Sara Mahmoud',      role:'Strategy Lead',    dept:'Strategy',  status:'checked_in',  attendance: 91 },
  { id:'m3', name:'Ali Hassan',        role:'Engineering Lead', dept:'Tech',      status:'absent',      attendance: 88 },
  { id:'m4', name:'Nora Al-Ghamdi',    role:'Data Analyst',     dept:'Analytics', status:'checked_in',  attendance: 94 },
  { id:'m5', name:'Khalid Al-Harbi',   role:'Sales Lead',       dept:'Sales',     status:'late',        attendance: 79 },
]

const ATTENDANCE_STATUS = {
  checked_in: { label: 'Checked In', variant: 'success', icon: CheckCircle2 },
  absent:     { label: 'Absent',     variant: 'error',   icon: XCircle       },
  late:       { label: 'Late',       variant: 'warning', icon: Clock         },
}

export default function RoboxPage() {
  const { state } = useApp()
  const { lang, members } = state
  const tr = (k) => t(k, lang)

  const displayMembers = members.length > 0 ? members : DEMO_MEMBERS
  const checkedIn = displayMembers.filter(m => m.status === 'checked_in').length
  const avgAttendance = Math.round(displayMembers.reduce((s, m) => s + (m.attendance || 0), 0) / displayMembers.length)

  const depts = [...new Set(displayMembers.map(m => m.dept))].filter(Boolean)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={lang === 'ar' ? 'إجمالي الموظفين' : 'Total Staff'} value={displayMembers.length} icon={Building2} color="#3B82F6" />
        <StatCard label={lang === 'ar' ? 'حاضرون اليوم' : 'Present Today'} value={checkedIn} delta={+2} icon={CheckCircle2} color="#10B981" />
        <StatCard label={lang === 'ar' ? 'معدل الحضور' : 'Avg Attendance'} value={`${avgAttendance}%`} icon={Clock} color="#D4920E" />
        <StatCard label={lang === 'ar' ? 'الأقسام' : 'Departments'} value={depts.length} icon={Building2} color="#8B5CF6" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Team roster */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title={lang === 'ar' ? 'سجل الفريق' : 'Team Roster'}
              subtitle={`${displayMembers.length} members`}
              action={
                <Btn size="sm" icon={<UserPlus size={13} />}>
                  {lang === 'ar' ? 'إضافة عضو' : 'Add Member'}
                </Btn>
              }
            />
            <table className="ff-table">
              <thead>
                <tr>
                  <th>{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{lang === 'ar' ? 'القسم' : 'Dept'}</th>
                  <th>{lang === 'ar' ? 'الحضور' : 'Attendance'}</th>
                  <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {displayMembers.map(m => {
                  const st = ATTENDANCE_STATUS[m.status] || ATTENDANCE_STATUS.absent
                  return (
                    <tr key={m.id} className="group">
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={m.name} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-ink">{m.name}</p>
                            <p className="text-xs text-ink-faint">{m.role}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant="default" size="sm">{m.dept}</Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={m.attendance || 0} size="xs" className="w-16" />
                          <span className="text-xs text-ink">{m.attendance}%</span>
                        </div>
                      </td>
                      <td>
                        <Badge variant={st.variant} dot size="sm">{st.label}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Department breakdown */}
        <div className="space-y-4">
          <Card>
            <CardHeader title={lang === 'ar' ? 'الأقسام' : 'Departments'} />
            <div className="space-y-3">
              {depts.map(dept => {
                const deptMembers = displayMembers.filter(m => m.dept === dept)
                const deptAvg = Math.round(deptMembers.reduce((s, m) => s + (m.attendance || 0), 0) / deptMembers.length)
                return (
                  <div key={dept}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-ink">{dept}</span>
                      <span className="text-xs text-ink-muted">{deptMembers.length} members · {deptAvg}%</span>
                    </div>
                    <ProgressBar value={deptAvg} size="sm" />
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title={lang === 'ar' ? 'اليوم' : "Today's Summary"} />
            <div className="space-y-2">
              {[
                { label: lang === 'ar' ? 'حاضرون' : 'Present',   value: checkedIn,                              color: '#10B981' },
                { label: lang === 'ar' ? 'متأخرون' : 'Late',      value: displayMembers.filter(m => m.status === 'late').length,   color: '#F59E0B' },
                { label: lang === 'ar' ? 'غائبون' : 'Absent',     value: displayMembers.filter(m => m.status === 'absent').length, color: '#EF4444' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-ink-muted">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-ink">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

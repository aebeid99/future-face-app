import { useState } from 'react'
import {
  Building2, Globe, Bell, Shield, Palette, Download, Trash2,
  Key, ChevronRight, Moon, Sun, Check, AlertTriangle
} from 'lucide-react'
import Card, { CardHeader } from '../../components/ui/Card.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { ORG_UPDATE, STATUS_CONFIG, LANG, LOGOUT } from '../../state/actions.js'
import { t } from '../../utils/i18n.js'

// ─── Toggle switch ─────────────────────────────────────────────
function Toggle({ checked, onChange, label, sublabel }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer group">
      <div>
        <p className="text-sm text-ink group-hover:text-ink transition-colors">{label}</p>
        {sublabel && <p className="text-xs text-ink-faint">{sublabel}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-gold/40 ${
          checked ? 'bg-gold' : 'bg-surface-3'
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </label>
  )
}

// ─── Section wrapper ───────────────────────────────────────────
function Section({ title, icon: Icon, children, className = '' }) {
  return (
    <Card className={className}>
      <CardHeader title={title} icon={Icon} />
      <div className="space-y-4">{children}</div>
    </Card>
  )
}

// ─── Main ──────────────────────────────────────────────────────
export default function SettingsPage() {
  const { state, dispatch } = useApp()
  const { lang, org, user, okrs = [], members = [], auditLog = [] } = state
  const ar = lang === 'ar'

  // ── Org settings
  const [orgName,   setOrgName]   = useState(org.name || '')
  const [orgSaved,  setOrgSaved]  = useState(false)

  const saveOrg = () => {
    dispatch({ type: ORG_UPDATE, updates: { name: orgName } })
    setOrgSaved(true)
    setTimeout(() => setOrgSaved(false), 2000)
  }

  // ── Status labels
  const STATUS_KEYS = ['on_track', 'at_risk', 'off_track', 'completed', 'paused', 'blocked']
  const [statusLabels, setStatusLabels] = useState({ ...org.statusLabels })
  const [labelsSaved,  setLabelsSaved]  = useState(false)

  const saveLabels = () => {
    dispatch({ type: STATUS_CONFIG, labels: statusLabels })
    setLabelsSaved(true)
    setTimeout(() => setLabelsSaved(false), 2000)
  }

  // ── Notifications (UI state only — would persist via ORG_UPDATE in a real app)
  const [notifs, setNotifs] = useState({
    okrCheckIn:   true,
    blockedAlert: true,
    weeklyDigest: false,
    memberJoins:  true,
  })
  const toggleNotif = (key) => setNotifs(n => ({ ...n, [key]: !n[key] }))

  // ── API key (mock)
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const mockApiKey = 'ff_live_••••••••••••••••••••••••••••'
  const shownKey   = 'ff_live_3x7kQ2mNpW9rL5vT8jYdA1bFhC6sE0uX'

  // ── Export data
  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      org,
      okrs,
      members,
      auditLog: auditLog.slice(0, 200),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `futureface-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Danger zone
  const [dangerConfirm, setDangerConfirm] = useState('')
  const confirmText = ar ? 'حذف البيانات' : 'reset data'
  const canReset    = dangerConfirm.toLowerCase() === confirmText

  function resetAllData() {
    if (!canReset) return
    localStorage.removeItem('ff_state')
    dispatch({ type: LOGOUT })
  }

  return (
    <div className="space-y-5 max-w-2xl animate-fade-in">

      {/* ── Organisation */}
      <Section title={ar ? 'إعدادات المؤسسة' : 'Organisation'} icon={Building2}>
        <Input
          label={ar ? 'اسم المؤسسة' : 'Organisation Name'}
          value={orgName}
          onChange={e => setOrgName(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="ff-label">{ar ? 'معرف المؤسسة' : 'Org Domain'}</p>
            <div className="ff-input opacity-60 cursor-not-allowed text-sm">{org.domain || org.id || '—'}</div>
          </div>
          <div className="flex-1">
            <Select
              label={ar ? 'الدولة' : 'Country'}
              value={org.country || 'SA'}
              onChange={e => dispatch({ type: ORG_UPDATE, updates: { country: e.target.value } })}
              options={[
                { value: 'SA', label: '🇸🇦 Saudi Arabia' },
                { value: 'AE', label: '🇦🇪 UAE' },
                { value: 'US', label: '🇺🇸 United States' },
                { value: 'GB', label: '🇬🇧 United Kingdom' },
                { value: 'EG', label: '🇪🇬 Egypt' },
                { value: 'KW', label: '🇰🇼 Kuwait' },
                { value: 'QA', label: '🇶🇦 Qatar' },
              ]}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Btn size="sm" onClick={saveOrg}>
            {orgSaved
              ? <><Check size={12} className="inline me-1 text-emerald-400" />{ar ? 'تم الحفظ' : 'Saved'}</>
              : (ar ? 'حفظ' : 'Save Changes')}
          </Btn>
        </div>
      </Section>

      {/* ── Status labels */}
      <Card>
        <CardHeader
          title={ar ? 'تسميات الحالة' : 'Status Labels'}
          subtitle={ar
            ? 'خصّص تسميات الحالة لتناسب مؤسستك'
            : "Customise status labels to match your organisation's language"}
        />
        <p className="text-xs text-ink-muted mb-4">
          {ar
            ? 'هذه التسميات تظهر في لوحة الأهداف وبطاقات المبادرات لجميع الأعضاء.'
            : 'These labels appear on OKR boards and initiative cards for all org members.'}
        </p>
        <div className="space-y-3">
          {STATUS_KEYS.map(key => (
            <div key={key} className="flex items-center gap-3">
              <Badge variant={key} dot size="sm" className="w-24 justify-center flex-shrink-0 text-center">
                {key.replace('_', ' ')}
              </Badge>
              <Input
                value={statusLabels[key] || ''}
                onChange={e => setStatusLabels(l => ({ ...l, [key]: e.target.value }))}
                placeholder={key.replace('_', ' ')}
              />
            </div>
          ))}
        </div>
        <Btn size="sm" className="mt-4" onClick={saveLabels}>
          {labelsSaved
            ? <><Check size={12} className="inline me-1 text-emerald-400" />{ar ? 'تم الحفظ' : 'Saved'}</>
            : (ar ? 'حفظ التسميات' : 'Save Labels')}
        </Btn>
      </Card>

      {/* ── Language */}
      <Section title={ar ? 'اللغة والمنطقة' : 'Language & Region'} icon={Globe}>
        <div>
          <p className="ff-label mb-2">{ar ? 'لغة الواجهة' : 'Interface Language'}</p>
          <div className="flex gap-3">
            {[
              { id: 'en', label: 'English',  sublabel: 'Default' },
              { id: 'ar', label: 'العربية',  sublabel: 'Arabic / RTL' },
            ].map(l => (
              <button
                key={l.id}
                onClick={() => dispatch({ type: LANG, lang: l.id })}
                className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  lang === l.id
                    ? 'bg-gold/10 border-gold/40 text-gold'
                    : 'bg-dark-100 border-border text-ink-muted hover:border-border-light hover:text-ink'
                }`}
              >
                <p>{l.label}</p>
                <p className="text-xs opacity-60 mt-0.5">{l.sublabel}</p>
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Notifications */}
      <Section title={ar ? 'الإشعارات' : 'Notifications'} icon={Bell}>
        <Toggle
          checked={notifs.okrCheckIn}
          onChange={() => toggleNotif('okrCheckIn')}
          label={ar ? 'تذكير بمراجعات OKR' : 'OKR Check-in reminders'}
          sublabel={ar ? 'تذكير أسبوعي بإجراء المراجعات' : 'Weekly nudge to log check-ins'}
        />
        <Toggle
          checked={notifs.blockedAlert}
          onChange={() => toggleNotif('blockedAlert')}
          label={ar ? 'تنبيه العناصر المحجوبة' : 'Blocked item alerts'}
          sublabel={ar ? 'إشعار فوري عند تعليم مبادرة كمحجوبة' : 'Instant alert when an initiative is marked blocked'}
        />
        <Toggle
          checked={notifs.weeklyDigest}
          onChange={() => toggleNotif('weeklyDigest')}
          label={ar ? 'ملخص أسبوعي' : 'Weekly digest email'}
          sublabel={ar ? 'ملخص أداء الأهداف كل أحد' : 'OKR performance summary every Sunday'}
        />
        <Toggle
          checked={notifs.memberJoins}
          onChange={() => toggleNotif('memberJoins')}
          label={ar ? 'انضمام عضو جديد' : 'New member joins'}
          sublabel={ar ? 'إشعار عند انضمام عضو جديد للمؤسسة' : 'Notify when someone joins the org'}
        />
      </Section>

      {/* ── API key */}
      <Section title={ar ? 'مفاتيح API' : 'API Keys'} icon={Key}>
        <div>
          <p className="ff-label mb-1">{ar ? 'مفتاح API الخاص بك' : 'Your API Key'}</p>
          <div className="flex gap-2 items-center">
            <div className="ff-input flex-1 font-mono text-xs text-ink-muted select-all">
              {apiKeyVisible ? shownKey : mockApiKey}
            </div>
            <Btn
              size="xs"
              variant="ghost"
              onClick={() => setApiKeyVisible(v => !v)}
            >
              {apiKeyVisible ? (ar ? 'إخفاء' : 'Hide') : (ar ? 'عرض' : 'Reveal')}
            </Btn>
          </div>
          <p className="text-xs text-ink-faint mt-1.5">
            {ar
              ? 'استخدم هذا المفتاح للوصول إلى FutureFace API. لا تشاركه مع أحد.'
              : 'Use this key to access the FutureFace API. Keep it secret.'}
          </p>
        </div>
        <Btn size="sm" variant="outline">
          {ar ? 'إعادة إنشاء المفتاح' : 'Regenerate Key'}
        </Btn>
      </Section>

      {/* ── Data & Privacy */}
      <Section title={ar ? 'البيانات والخصوصية' : 'Data & Privacy'} icon={Shield}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">{ar ? 'تصدير بياناتك' : 'Export Your Data'}</p>
            <p className="text-xs text-ink-muted mt-0.5">
              {ar
                ? `تصدير جميع أهدافك ومبادراتك والسجل التدقيقي كملف JSON. (${okrs.length} OKRs, ${members.length} أعضاء)`
                : `Export all your OKRs, initiatives, and audit log as JSON. (${okrs.length} OKRs, ${members.length} members)`}
            </p>
          </div>
          <Btn size="sm" variant="outline" onClick={exportData} className="flex-shrink-0 flex items-center gap-1.5">
            <Download size={13} />
            {ar ? 'تصدير' : 'Export'}
          </Btn>
        </div>
        <div className="pt-2 border-t border-surface-3">
          <p className="text-xs text-ink-faint">
            {ar
              ? 'بياناتك محفوظة محلياً في متصفحك. لا يتم إرسالها إلى خوادم خارجية.'
              : 'Your data is stored locally in your browser. Nothing is sent to external servers.'}
          </p>
        </div>
      </Section>

      {/* ── Danger zone */}
      <Card className="border-red-500/25">
        <CardHeader
          title={ar ? 'منطقة الخطر' : 'Danger Zone'}
          icon={Trash2}
        />
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">
                  {ar ? 'إعادة تعيين جميع بيانات التطبيق' : 'Reset all application data'}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {ar
                    ? 'سيؤدي هذا إلى حذف جميع الأهداف والأعضاء والإعدادات بشكل دائم لا يمكن التراجع عنه.'
                    : 'This will permanently delete all OKRs, members, and settings. This action cannot be undone.'}
                </p>
              </div>
            </div>
            <p className="text-xs text-ink-muted mb-2">
              {ar
                ? `اكتب "${confirmText}" للتأكيد:`
                : `Type "${confirmText}" to confirm:`}
            </p>
            <div className="flex gap-2">
              <input
                className="ff-input flex-1 text-sm border-red-500/30 focus:border-red-500/60"
                value={dangerConfirm}
                onChange={e => setDangerConfirm(e.target.value)}
                placeholder={confirmText}
              />
              <Btn
                size="sm"
                disabled={!canReset}
                onClick={resetAllData}
                className={`flex-shrink-0 ${canReset ? 'bg-red-600 hover:bg-red-500 text-white border-red-600' : 'opacity-40 cursor-not-allowed'}`}
              >
                {ar ? 'إعادة تعيين' : 'Reset'}
              </Btn>
            </div>
          </div>
        </div>
      </Card>

    </div>
  )
}

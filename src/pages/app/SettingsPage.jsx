import { useState } from 'react'
import { Building2, Globe, Bell, Shield, Palette } from 'lucide-react'
import Card, { CardHeader } from '../../components/ui/Card.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { ORG_UPDATE, STATUS_CONFIG, LANG } from '../../state/actions.js'
import { t } from '../../utils/i18n.js'

export default function SettingsPage() {
  const { state, dispatch } = useApp()
  const { lang, org } = state
  const tr = (k) => t(k, lang)

  const [orgName, setOrgName] = useState(org.name || '')
  const [saved,   setSaved]   = useState(false)

  const [statusLabels, setStatusLabels] = useState({ ...org.statusLabels })

  const saveOrg = () => {
    dispatch({ type: ORG_UPDATE, updates: { name: orgName } })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const saveLabels = () => {
    dispatch({ type: STATUS_CONFIG, labels: statusLabels })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const STATUS_KEYS = ['on_track','at_risk','off_track','completed','paused']

  return (
    <div className="space-y-5 max-w-2xl animate-fade-in">
      {/* Organisation */}
      <Card>
        <CardHeader title={lang === 'ar' ? 'إعدادات المؤسسة' : 'Organisation Settings'} icon={Building2} />
        <div className="space-y-4">
          <Input
            label={lang === 'ar' ? 'اسم المؤسسة' : 'Organisation Name'}
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="ff-label">{lang === 'ar' ? 'معرف المؤسسة' : 'Org Domain'}</p>
              <div className="ff-input opacity-60 cursor-not-allowed">{org.domain || org.id || '—'}</div>
            </div>
            <div className="flex-1">
              <Select
                label={lang === 'ar' ? 'الدولة' : 'Country'}
                value={org.country || 'SA'}
                onChange={e => dispatch({ type: ORG_UPDATE, updates: { country: e.target.value } })}
                options={[
                  { value:'SA', label:'🇸🇦 Saudi Arabia' },
                  { value:'AE', label:'🇦🇪 UAE' },
                  { value:'US', label:'🇺🇸 US' },
                  { value:'GB', label:'🇬🇧 UK' },
                ]}
              />
            </div>
          </div>
          <Btn size="sm" onClick={saveOrg}>
            {saved ? (lang === 'ar' ? '✓ تم الحفظ' : '✓ Saved') : tr('btn_save')}
          </Btn>
        </div>
      </Card>

      {/* Status labels — Dynamic / per-org */}
      <Card>
        <CardHeader
          title={lang === 'ar' ? 'تسميات الحالة' : 'Status Labels'}
          subtitle={lang === 'ar' ? 'خصّص تسميات الحالة لتناسب مؤسستك' : 'Customise status labels to match your organisation\'s language'}
        />
        <p className="text-xs text-ink-muted mb-4">
          {lang === 'ar'
            ? 'هذه التسميات تظهر في لوحة الأهداف OKR وبطاقات المبادرات لجميع أعضاء مؤسستك.'
            : 'These labels appear on OKR boards and initiative cards for all your org members.'
          }
        </p>
        <div className="space-y-3">
          {STATUS_KEYS.map(key => (
            <div key={key} className="flex items-center gap-3">
              <Badge
                variant={key}
                dot
                size="sm"
                className="w-24 justify-center flex-shrink-0"
              >
                {key.replace('_',' ')}
              </Badge>
              <Input
                value={statusLabels[key] || ''}
                onChange={e => setStatusLabels(l => ({ ...l, [key]: e.target.value }))}
                placeholder={key.replace('_', ' ')}
                className="text-sm"
              />
            </div>
          ))}
        </div>
        <Btn size="sm" className="mt-4" onClick={saveLabels}>
          {saved ? (lang === 'ar' ? '✓ تم الحفظ' : '✓ Saved') : (lang === 'ar' ? 'حفظ التسميات' : 'Save Labels')}
        </Btn>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader title={lang === 'ar' ? 'اللغة' : 'Language'} icon={Globe} />
        <div className="flex gap-3">
          {[
            { id:'en', label:'English', sublabel:'Default' },
            { id:'ar', label:'العربية', sublabel:'Arabic' },
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
      </Card>
    </div>
  )
}

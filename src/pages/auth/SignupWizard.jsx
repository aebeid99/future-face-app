import { useState } from 'react'
import { CheckCircle2, ArrowRight, ArrowLeft, Building2, Globe, Mail, Users, ShieldCheck, Loader2 } from 'lucide-react'
import Logo from '../../components/ui/Logo.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { NAV, SIGNUP } from '../../state/actions.js'
import { domainFromEmail } from '../../utils/formatting.js'
import { t } from '../../utils/i18n.js'

const STEPS = [
  { id: 'auth',      label: 'Account',     labelAr: 'الحساب' },
  { id: 'country',   label: 'Country',     labelAr: 'الدولة' },
  { id: 'org',       label: 'Organisation',labelAr: 'المؤسسة' },
  { id: 'invite',    label: 'Invite',      labelAr: 'الدعوة' },
  { id: 'residency', label: 'Data',        labelAr: 'البيانات' },
]

const COUNTRIES = [
  { value: 'SA', label: '🇸🇦 Saudi Arabia — PDPL' },
  { value: 'AE', label: '🇦🇪 United Arab Emirates' },
  { value: 'KW', label: '🇰🇼 Kuwait' },
  { value: 'BH', label: '🇧🇭 Bahrain' },
  { value: 'QA', label: '🇶🇦 Qatar' },
  { value: 'OM', label: '🇴🇲 Oman' },
  { value: 'EG', label: '🇪🇬 Egypt' },
  { value: 'GB', label: '🇬🇧 United Kingdom — GDPR' },
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'OTHER', label: '🌍 Other' },
]

export default function SignupWizard() {
  const { state, dispatch } = useApp()
  const { lang } = state
  const tr = (k) => t(k, lang)
  const go = (page) => dispatch({ type: NAV, page })

  const [step,    setStep]    = useState(0)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', otp: '',
    country: 'SA', currency: 'SAR',
    orgName: '', orgSize: '11-50',
    invites: [''],
    residencyConfirmed: false,
  })

  const upd = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const CURRENCY_BY_COUNTRY = { SA: 'SAR', AE: 'AED', KW: 'KWD', BH: 'BHD', QA: 'QAR', OM: 'OMR' }

  const nextStep = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    setLoading(false)
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      finishSignup()
    }
  }

  const finishSignup = () => {
    const domain = domainFromEmail(form.email)
    dispatch({
      type: SIGNUP,
      user: {
        name: form.name,
        email: form.email,
        role: 'admin',
      },
      org: {
        id: domain,
        domain,
        name: form.orgName || domain.split('.')[0],
        country: form.country,
        currency: CURRENCY_BY_COUNTRY[form.country] || 'USD',
        dataResidency: form.residencyConfirmed
          ? (form.country === 'SA' ? 'KSA (PDPL)' : form.country === 'GB' ? 'EU (GDPR)' : 'Global')
          : null,
      },
      nextPage: 'dashboard',
    })
  }

  const currentStep = STEPS[step]

  return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center p-5">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <button onClick={() => go('landing')}><Logo size={36} /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                  i < step ? 'bg-success text-white' :
                  i === step ? 'bg-gold text-dark-400' :
                  'bg-border text-ink-faint'
                }`}
              >
                {i < step ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === step ? 'text-ink' : 'text-ink-faint'}`}>
                {lang === 'ar' ? s.labelAr : s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-6 ${i < step ? 'bg-success' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-7">
          {/* Step 0: Auth */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">{tr('signup_step_auth')}</h2>
              <Input
                label={lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                value={form.name}
                onChange={e => upd('name', e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: أحمد العبيد' : 'e.g. Ahmed Al-Obayd'}
                required
              />
              <Input
                label={lang === 'ar' ? 'البريد الإلكتروني للعمل' : 'Work Email'}
                type="email"
                value={form.email}
                onChange={e => upd('email', e.target.value)}
                placeholder="you@company.com"
                required
                icon={<Mail size={14} />}
              />
            </div>
          )}

          {/* Step 1: Country */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">{tr('signup_step_country')}</h2>
              <p className="text-sm text-ink-muted">
                {lang === 'ar'
                  ? 'نستخدم هذه المعلومات لضبط العملة ومتطلبات الامتثال التنظيمي'
                  : 'Used to set currency and regulatory compliance requirements'
                }
              </p>
              <div className="grid grid-cols-2 gap-2">
                {COUNTRIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => upd('country', c.value)}
                    className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                      form.country === c.value
                        ? 'bg-gold/10 border-gold/40 text-ink'
                        : 'border-border text-ink-muted hover:border-border-light hover:text-ink'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Organisation */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">{tr('signup_step_org')}</h2>
              <Input
                label={lang === 'ar' ? 'اسم المؤسسة' : 'Organisation Name'}
                value={form.orgName}
                onChange={e => upd('orgName', e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: شركة المستقبل' : 'e.g. Future Corp'}
                icon={<Building2 size={14} />}
                required
              />
              <Select
                label={lang === 'ar' ? 'حجم المؤسسة' : 'Organisation Size'}
                value={form.orgSize}
                onChange={e => upd('orgSize', e.target.value)}
                options={[
                  { value: '1-10',   label: '1–10 employees' },
                  { value: '11-50',  label: '11–50 employees' },
                  { value: '51-200', label: '51–200 employees' },
                  { value: '201-500',label: '201–500 employees' },
                  { value: '500+',   label: '500+ employees' },
                ]}
              />
              {form.email && (
                <div className="bg-dark-100 rounded-lg px-3 py-2.5 text-xs text-ink-muted">
                  <span className="text-ink-faint">{lang === 'ar' ? 'معرف المؤسسة:' : 'Org ID:'}</span>{' '}
                  <span className="font-mono text-gold">{domainFromEmail(form.email)}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Invite */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">{tr('signup_step_invite')}</h2>
              <p className="text-sm text-ink-muted">
                {lang === 'ar' ? 'يمكنك تخطي هذه الخطوة والدعوة لاحقاً' : 'You can skip this and invite later'}
              </p>
              {form.invites.map((inv, i) => (
                <Input
                  key={i}
                  placeholder={`teammate${i + 1}@${domainFromEmail(form.email) || 'company.com'}`}
                  value={inv}
                  onChange={e => {
                    const arr = [...form.invites]
                    arr[i] = e.target.value
                    upd('invites', arr)
                  }}
                  icon={<Users size={14} />}
                />
              ))}
              {form.invites.length < 5 && (
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => upd('invites', [...form.invites, ''])}
                >
                  + {lang === 'ar' ? 'إضافة شخص آخر' : 'Add another'}
                </Btn>
              )}
            </div>
          )}

          {/* Step 4: Data Residency */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">{tr('signup_step_residency')}</h2>
              <div className="bg-dark-100 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={18} className="text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">
                      {form.country === 'SA'
                        ? (lang === 'ar' ? 'بيانات محلية — المملكة العربية السعودية (PDPL)' : 'Local data — KSA (PDPL Compliant)')
                        : form.country === 'GB'
                        ? 'EU Region — GDPR Compliant'
                        : 'Global Region — Standard Compliance'
                      }
                    </p>
                    <p className="text-xs text-ink-muted mt-1">
                      {lang === 'ar'
                        ? 'سيتم تخزين بيانات مؤسستك وفق اللوائح المحلية المعمول بها في بلدك'
                        : 'Your organisation data will be stored in compliance with applicable local regulations'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.residencyConfirmed}
                  onChange={e => upd('residencyConfirmed', e.target.checked)}
                  className="mt-0.5 accent-gold"
                />
                <span className="text-sm text-ink-muted">
                  {lang === 'ar'
                    ? 'أؤكد أنني مخوّل باتخاذ قرار موقع تخزين البيانات لمؤسستي، وأقبل بنود الخدمة وسياسة الخصوصية'
                    : 'I confirm I am authorised to decide data residency for my organisation, and accept the Terms of Service and Privacy Policy'
                  }
                </span>
              </label>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-2 mt-6">
            {step > 0 && (
              <Btn
                variant="secondary"
                size="md"
                onClick={() => setStep(s => s - 1)}
                icon={<ArrowLeft size={14} />}
              >
                {tr('btn_back')}
              </Btn>
            )}
            <Btn
              variant="primary"
              size="md"
              className="flex-1"
              loading={loading}
              onClick={nextStep}
              disabled={step === 4 && !form.residencyConfirmed}
              iconRight={step < STEPS.length - 1 ? <ArrowRight size={14} /> : null}
            >
              {step < STEPS.length - 1
                ? (step === 3 && form.invites.every(i => !i.trim())
                    ? (lang === 'ar' ? 'تخطي الدعوة' : 'Skip Invites')
                    : tr('btn_next'))
                : (lang === 'ar' ? 'إنشاء الحساب' : 'Create Account')
              }
            </Btn>
          </div>
        </div>

        <p className="text-center text-xs text-ink-muted mt-4">
          {lang === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
          <button onClick={() => go('login')} className="text-gold hover:underline">
            {tr('auth_login')}
          </button>
        </p>
      </div>
    </div>
  )
}

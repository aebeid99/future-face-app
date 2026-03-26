import { useState } from 'react'
import { CheckCircle2, ArrowRight, Zap } from 'lucide-react'
import PublicNav from '../../components/layout/PublicNav.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { NAV } from '../../state/actions.js'
import { calcPrice, PLANS } from '../../utils/pricing.js'
import { t } from '../../utils/i18n.js'

const CURRENCIES = ['SAR', 'AED', 'USD']
const CURRENCY_OPTS = [{ value: 'SAR', label: 'SAR — Saudi Riyal' }, { value: 'AED', label: 'AED — UAE Dirham' }, { value: 'USD', label: 'USD — US Dollar' }]

export default function PricingPage() {
  const { state, dispatch } = useApp()
  const { lang, org } = state
  const tr = (k) => t(k, lang)
  const go = (page) => dispatch({ type: NAV, page })

  const [billing,  setBilling]  = useState('monthly')
  const [currency, setCurrency] = useState(org.currency || 'SAR')
  const [users,    setUsers]    = useState(org.userCount || 5)
  const discount   = org.yearlyDiscount || 20

  const price = (product, plan) => calcPrice({ product, plan, users, currency, billing, yearlyDiscount: discount })

  const PLANS_DATA = [
    {
      id: 'free',
      name: tr('plan_free'),
      badge: null,
      impactor: price('impactor', 'free'),
      robox:    price('robox',    'free'),
      highlight: false,
      features: lang === 'ar'
        ? ['٥ مستخدمين', '١٠ أهداف OKR', 'لوحة تحكم أساسية', 'تتبع الحضور للـ ٥ موظفين']
        : ['5 users', '10 OKRs', 'Basic dashboard', 'Attendance for 5 staff'],
      cta: lang === 'ar' ? 'ابدأ مجاناً' : 'Start Free',
      action: () => go('signup'),
    },
    {
      id: 'pro',
      name: tr('plan_pro'),
      badge: lang === 'ar' ? 'الأكثر شيوعاً' : 'Most Popular',
      impactor: price('impactor', 'pro'),
      robox:    price('robox',    'pro'),
      highlight: true,
      features: lang === 'ar'
        ? ['مستخدمون غير محدودون', 'أهداف OKR غير محدودة', 'تقارير متقدمة', 'تكاملات كاملة', 'الذكاء الاصطناعي (عند الاشتراك في كلا المنتجين)']
        : ['Unlimited users', 'Unlimited OKRs', 'Advanced reports', 'Full integrations', 'AI Pilot (when both products Pro)'],
      cta: lang === 'ar' ? 'ابدأ النسخة الاحترافية' : 'Start Pro',
      action: () => go('signup'),
    },
    {
      id: 'enterprise',
      name: tr('plan_enterprise'),
      badge: null,
      impactor: null,
      robox: null,
      highlight: false,
      features: lang === 'ar'
        ? ['كل ما في النسخة الاحترافية', 'خادم مخصص للبيانات', 'مدير حساب مخصص', 'تدريب وإعداد مُخصّص', 'عقود SLA', 'تكاملات مخصصة']
        : ['Everything in Pro', 'Dedicated data residency', 'Dedicated account manager', 'Custom onboarding & training', 'SLA contracts', 'Custom integrations'],
      cta: lang === 'ar' ? 'تواصل مع المبيعات' : 'Contact Sales',
      action: () => go('demo'),
    },
  ]

  return (
    <div className="min-h-screen bg-dark-400">
      <PublicNav />
      <div className="pt-24 pb-20 px-5 max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">
            {lang === 'ar' ? 'أسعار شفافة وبسيطة' : 'Simple, Transparent Pricing'}
          </h1>
          <p className="text-ink-muted">
            {lang === 'ar'
              ? 'ادفع فقط مقابل ما تحتاجه — ابدأ مجاناً، وسعّد فريقك معنا'
              : 'Pay only for what you need — start free, grow with your team'
            }
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          {/* Billing toggle */}
          <div className="flex items-center bg-surface border border-border rounded-xl p-1">
            {['monthly', 'yearly'].map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  billing === b ? 'bg-gold text-dark-400' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {b === 'monthly'
                  ? (lang === 'ar' ? 'شهري' : 'Monthly')
                  : (lang === 'ar' ? `سنوي (وفّر ${discount}%)` : `Yearly (Save ${discount}%)`)
                }
              </button>
            ))}
          </div>

          {/* Currency */}
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-gold/50"
          >
            {CURRENCY_OPTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          {/* User count */}
          <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5">
            <span className="text-sm text-ink-muted">{lang === 'ar' ? 'المستخدمون:' : 'Users:'}</span>
            <button onClick={() => setUsers(u => Math.max(1, u - 1))} className="w-6 h-6 rounded bg-border/50 hover:bg-border text-sm font-medium">−</button>
            <span className="text-sm font-semibold w-6 text-center">{users}</span>
            <button onClick={() => setUsers(u => u + 1)} className="w-6 h-6 rounded bg-border/50 hover:bg-border text-sm font-medium">+</button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS_DATA.map(plan => {
            const impTotal = plan.impactor?.total || 0
            const robTotal = plan.robox?.total || 0
            const combined = impTotal + robTotal

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                  plan.highlight
                    ? 'bg-surface border-gold/40 shadow-glow'
                    : 'bg-surface border-border'
                }`}
              >
                {plan.badge && (
                  <Badge variant="gold" className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-sm">
                    <Zap size={10} />{plan.badge}
                  </Badge>
                )}

                <div className="mb-5">
                  <h2 className="text-lg font-bold mb-1">{plan.name}</h2>

                  {plan.id === 'enterprise' ? (
                    <div className="mt-3">
                      <span className="text-2xl font-bold">{lang === 'ar' ? 'تسعير مخصص' : 'Custom'}</span>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{plan.impactor?.display || '0'}</span>
                        <span className="text-xs text-ink-faint">/mo {lang === 'ar' ? '(إمباكتور)' : '(Impactor)'}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold text-ink-muted">+ {plan.robox?.display || '0'}</span>
                        <span className="text-xs text-ink-faint">/mo {lang === 'ar' ? '(روبوكس)' : '(Robox)'}</span>
                      </div>
                      {combined > 0 && (
                        <div className="pt-2 border-t border-border mt-2">
                          <span className="text-xs text-ink-muted">{lang === 'ar' ? 'المجموع مع ضريبة القيمة المضافة:' : 'Bundle total incl. VAT:'} </span>
                          <span className="text-sm font-bold text-gold">
                            {currency === 'SAR' ? 'SAR' : currency === 'AED' ? 'AED' : '$'} {combined.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <p className="text-[10px] text-ink-faint">{lang === 'ar' ? 'لكل مستخدم / شهرياً' : `per user/month`} · {users} {lang === 'ar' ? 'مستخدم' : 'users'}</p>
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-muted">
                      <CheckCircle2 size={14} className="text-success flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Btn
                  variant={plan.highlight ? 'primary' : 'secondary'}
                  size="md"
                  className="w-full"
                  onClick={plan.action}
                  iconRight={<ArrowRight size={14} />}
                >
                  {plan.cta}
                </Btn>
              </div>
            )
          })}
        </div>

        {/* VAT note */}
        <p className="text-center text-xs text-ink-faint mt-6">
          {lang === 'ar'
            ? '* الأسعار بالريال السعودي تشمل ضريبة القيمة المضافة ١٥٪ وفقاً لنظام هيئة الزكاة والضريبة والجمارك.'
            : '* SAR prices include 15% VAT as required by ZATCA. All other currencies exclude VAT.'
          }
        </p>
      </div>
    </div>
  )
}

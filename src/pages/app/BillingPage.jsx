import { CreditCard, Zap, ArrowRight, CheckCircle2 } from 'lucide-react'
import Card, { CardHeader } from '../../components/ui/Card.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { SUB_UPDATE } from '../../state/actions.js'
import { calcPrice, FREE_LIMITS } from '../../utils/pricing.js'
import { t } from '../../utils/i18n.js'

export default function BillingPage() {
  const { state, dispatch } = useApp()
  const { lang, org } = state
  const tr = (k) => t(k, lang)

  const okrCount = state.okrs.length

  const impPrice = calcPrice({ product:'impactor', plan:'pro', users: org.userCount||5, currency: org.currency||'SAR', billing:'monthly' })
  const robPrice = calcPrice({ product:'robox',    plan:'pro', users: org.userCount||5, currency: org.currency||'SAR', billing:'monthly' })

  const products = [
    {
      id: 'impactor', label: 'Impactor', sub: org.subs.impactor, icon: '⟳',
      freeUsage: { okrs: { used: okrCount, limit: FREE_LIMITS.impactor.okrs } },
      proPrice: impPrice.display,
    },
    {
      id: 'robox', label: 'Robox', sub: org.subs.robox, icon: '◎',
      freeUsage: { users: { used: state.members.length || 1, limit: FREE_LIMITS.robox.users } },
      proPrice: robPrice.display,
    },
  ]

  return (
    <div className="space-y-5 max-w-3xl animate-fade-in">
      {products.map(product => (
        <Card key={product.id}>
          <CardHeader
            title={product.label}
            subtitle={`Current plan: ${product.sub}`}
            action={<Badge variant={product.sub === 'pro' ? 'gold' : 'default'}>{product.sub}</Badge>}
          />

          {product.sub === 'free' && (
            <div className="space-y-3 mb-5">
              {Object.entries(product.freeUsage).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-ink-muted capitalize">{key}</span>
                    <span className="text-xs text-ink">{val.used} / {val.limit}</span>
                  </div>
                  <ProgressBar value={(val.used / val.limit) * 100} size="sm" color={val.used >= val.limit ? '#EF4444' : undefined} />
                  {val.used >= val.limit && (
                    <p className="text-xs text-error mt-1">Free tier limit reached</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {product.sub === 'free' ? (
            <div className="bg-gold/5 border border-gold/20 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={14} className="text-gold" />
                    <span className="text-sm font-semibold">{lang === 'ar' ? 'ترقية للنسخة الاحترافية' : 'Upgrade to Pro'}</span>
                  </div>
                  <p className="text-xs text-ink-muted">
                    {lang === 'ar' ? 'مستخدمون غير محدودون + أهداف OKR غير محدودة + تقارير متقدمة' : 'Unlimited users + unlimited OKRs + advanced reports'}
                  </p>
                  <p className="text-sm font-bold text-gold mt-1">{product.proPrice}/mo</p>
                </div>
                <Btn
                  size="sm"
                  onClick={() => dispatch({ type: SUB_UPDATE, product: product.id, plan: 'pro' })}
                  iconRight={<ArrowRight size={12} />}
                >
                  {lang === 'ar' ? 'ترقية' : 'Upgrade'}
                </Btn>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 size={14} />
              {lang === 'ar' ? 'النسخة الاحترافية نشطة — وصول كامل بدون حدود' : 'Pro plan active — unlimited access'}
            </div>
          )}
        </Card>
      ))}

      {/* AI Pilot */}
      <Card className="border-gold/20 bg-gradient-to-br from-surface to-dark-100">
        <CardHeader
          title="AI Pilot"
          subtitle={lang === 'ar' ? 'طبقة الذكاء الاصطناعي' : 'Intelligence Layer'}
          action={<Badge variant={org.subs.aiPilot ? 'gold' : 'default'}>{org.subs.aiPilot ? 'Active' : 'Locked'}</Badge>}
        />
        {(!org.subs.aiPilot) && (
          <p className="text-xs text-ink-muted mb-3">
            {lang === 'ar'
              ? '⚡ يُفعَّل تلقائياً عند الاشتراك في إمباكتور Pro وروبوكس Pro معاً'
              : '⚡ Automatically unlocked when both Impactor Pro + Robox Pro are active'
            }
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${org.subs.impactor === 'pro' ? 'bg-success' : 'bg-border'}`} />
          <span className="text-xs text-ink-muted">Impactor Pro</span>
          <span className="text-ink-faint">+</span>
          <div className={`w-3 h-3 rounded-full ${org.subs.robox === 'pro' ? 'bg-success' : 'bg-border'}`} />
          <span className="text-xs text-ink-muted">Robox Pro</span>
          <span className="text-ink-faint">=</span>
          <div className={`w-3 h-3 rounded-full ${org.subs.aiPilot ? 'bg-gold' : 'bg-border'}`} />
          <span className="text-xs text-ink-muted">AI Pilot</span>
        </div>
      </Card>
    </div>
  )
}

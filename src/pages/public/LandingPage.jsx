import { ArrowRight, CheckCircle2, Target, Users2, Sparkles, TrendingUp, BarChart3, Shield, Zap } from 'lucide-react'
import PublicNav from '../../components/layout/PublicNav.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ProgressRing from '../../components/ui/ProgressRing.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { NAV } from '../../state/actions.js'
import { t } from '../../utils/i18n.js'

export default function LandingPage() {
  const { state, dispatch } = useApp()
  const { lang } = state
  const tr = (k) => t(k, lang)
  const go = (page) => dispatch({ type: NAV, page })

  return (
    <div className="min-h-screen bg-dark-400 text-ink">
      <PublicNav />

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-5 max-w-6xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="gold" className="mb-6">
            <Sparkles size={10} />
            {lang === 'ar' ? 'الذكاء الاصطناعي + OKR + إدارة القوى العاملة' : 'AI + OKR + Workforce — One Platform'}
          </Badge>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-5 leading-tight">
            {lang === 'ar'
              ? <>من <span className="text-gradient-gold">الاستراتيجية</span> إلى <span className="text-gradient-gold">التنفيذ</span></>
              : <>From <span className="text-gradient-gold">Strategy</span> to <span className="text-gradient-gold">Execution</span></>
            }
          </h1>

          <p className="text-xl text-ink-muted max-w-2xl mx-auto mb-8 leading-relaxed">
            {lang === 'ar'
              ? 'منصة FutureFace تُوحّد أهداف OKR مع إدارة القوى العاملة والذكاء الاصطناعي — لتُحوّل خطط رؤية ٢٠٣٠ إلى إنجازات قابلة للقياس.'
              : 'FutureFace unifies OKR strategy with workforce management and AI intelligence — transforming Vision 2030 plans into measurable outcomes.'
            }
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Btn size="lg" onClick={() => go('signup')} iconRight={<ArrowRight size={16} />}>
              {lang === 'ar' ? 'ابدأ مجاناً' : 'Start for Free'}
            </Btn>
            <Btn variant="secondary" size="lg" onClick={() => go('demo')}>
              {lang === 'ar' ? 'احجز عرضاً' : 'Book a Demo'}
            </Btn>
          </div>

          <p className="text-xs text-ink-faint mt-4">
            {lang === 'ar' ? 'لا يُشترط استخدام بطاقة ائتمانية — الباقة المجانية تشمل ٥ مستخدمين' : 'No credit card required — Free tier includes 5 users'}
          </p>
        </div>

        {/* Hero visual - mock dashboard */}
        <div className="mt-14 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-400 z-10 pointer-events-none" style={{ top: '60%' }} />
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-panel">
            {/* Mock topbar */}
            <div className="h-10 bg-dark border-b border-border flex items-center px-4 gap-3">
              <div className="flex gap-1.5">
                {['#EF4444','#F59E0B','#10B981'].map(c => (
                  <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex-1 h-4 bg-border/50 rounded max-w-xs mx-auto" />
            </div>
            {/* Mock content */}
            <div className="flex h-52 md:h-80">
              {/* Sidebar */}
              <div className="w-44 bg-dark border-r border-border p-3 space-y-1 hidden md:block">
                {['Dashboard','Impactor','Robox','AI Pilot','Roadmap'].map((item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs ${i === 0 ? 'bg-gold/10 text-gold' : 'text-ink-muted'}`}
                  >
                    <div className="w-3 h-3 rounded bg-current opacity-50" />
                    {item}
                  </div>
                ))}
              </div>
              {/* Main */}
              <div className="flex-1 p-4 grid grid-cols-3 gap-3 content-start">
                {[
                  { label: 'OKR Progress', value: '73%', color: '#10B981' },
                  { label: 'WERC Score',   value: '89%', color: '#D4920E' },
                  { label: 'Team Health',  value: '91%', color: '#3B82F6' },
                ].map(stat => (
                  <div key={stat.label} className="bg-dark rounded-lg p-3 border border-border">
                    <p className="text-[10px] text-ink-faint mb-1">{stat.label}</p>
                    <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    <div className="mt-1.5 h-1 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: stat.value, backgroundColor: stat.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product pillars ── */}
      <section className="py-20 px-5 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">
            {lang === 'ar' ? 'ثلاثة منتجات. تنفيذ واحد.' : 'Three Products. One Execution.'}
          </h2>
          <p className="text-ink-muted">
            {lang === 'ar'
              ? 'إمباكتور + روبوكس + الذكاء الاصطناعي — مصمّمة للعمل معاً'
              : 'Impactor + Robox + AI Pilot — designed to work together'
            }
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Target,
              color: '#D4920E',
              name: lang === 'ar' ? 'إمباكتور' : 'Impactor',
              tagline: lang === 'ar' ? 'تنفيذ الاستراتيجية وأهداف OKR' : 'OKR & Strategy Execution',
              features: lang === 'ar'
                ? ['تحديد الأهداف والنتائج الرئيسية', 'لوحة تنفيذ تفاعلية', 'ربط مع رؤية ٢٠٣٠', 'تقارير أسبوعية تلقائية']
                : ['Set OKRs with Key Results', 'Interactive execution board', 'Vision 2030 alignment', 'Auto weekly reviews'],
            },
            {
              icon: Users2,
              color: '#3B82F6',
              name: lang === 'ar' ? 'روبوكس' : 'Robox',
              tagline: lang === 'ar' ? 'إدارة القوى العاملة والحضور' : 'Workforce & Attendance',
              features: lang === 'ar'
                ? ['تتبع الحضور والانصراف', 'إدارة الهيكل التنظيمي', 'جدولة الفرق', 'لوحة صحة الموارد البشرية']
                : ['Attendance & time tracking', 'Org structure management', 'Team scheduling', 'HR health dashboard'],
            },
            {
              icon: Sparkles,
              color: '#8B5CF6',
              name: lang === 'ar' ? 'الذكاء الاصطناعي' : 'AI Pilot',
              tagline: lang === 'ar' ? 'الذكاء الاصطناعي في خدمة التنفيذ' : 'Intelligence Layer',
              features: lang === 'ar'
                ? ['مهندس الأهداف بالذكاء الاصطناعي', 'درع الذكاء لرصد المخاطر', 'إحاطة يوم الأحد', 'مساعد تنفيذي شخصي']
                : ['AI OKR Architect', 'Intelligence Shield alerts', 'Sunday AI Briefing', 'Personal exec assistant'],
              badge: lang === 'ar' ? 'يتطلب إمباكتور Pro + روبوكس Pro' : 'Requires Impactor Pro + Robox Pro',
            },
          ].map(product => {
            const Icon = product.icon
            return (
              <div
                key={product.name}
                className="bg-surface border border-border rounded-2xl p-6 flex flex-col card-hover"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: product.color + '18' }}
                >
                  <Icon size={22} style={{ color: product.color }} />
                </div>
                <h3 className="text-base font-bold mb-1">{product.name}</h3>
                <p className="text-sm text-ink-muted mb-4">{product.tagline}</p>
                {product.badge && (
                  <Badge variant="gold" size="xs" className="mb-3 self-start">{product.badge}</Badge>
                )}
                <ul className="space-y-2 mt-auto">
                  {product.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-muted">
                      <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: product.color }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="py-16 px-5 border-y border-border bg-surface/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+',  label: lang === 'ar' ? 'مؤسسة تستخدم المنصة' : 'Organisations' },
              { value: '50k+',  label: lang === 'ar' ? 'هدف OKR تم إنشاؤه' : 'OKRs Created' },
              { value: '89%',   label: lang === 'ar' ? 'نسبة التنفيذ الفعلي' : 'Execution Rate' },
              { value: '4.9★',  label: lang === 'ar' ? 'تقييم العملاء' : 'Customer Rating' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-3xl font-extrabold text-gradient-gold mb-1">{stat.value}</div>
                <div className="text-sm text-ink-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-5 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            {lang === 'ar' ? 'ابدأ رحلة التنفيذ اليوم' : 'Start executing today'}
          </h2>
          <p className="text-ink-muted mb-8">
            {lang === 'ar'
              ? 'انضم إلى المؤسسات الرائدة التي تُحوّل استراتيجيتها إلى نتائج حقيقية مع FutureFace'
              : 'Join leading organisations transforming their strategy into real results with FutureFace'
            }
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Btn size="xl" onClick={() => go('signup')} iconRight={<ArrowRight size={16} />}>
              {lang === 'ar' ? 'ابدأ مجاناً الآن' : 'Get Started Free'}
            </Btn>
            <Btn variant="outline" size="xl" onClick={() => go('pricing')}>
              {lang === 'ar' ? 'عرض الأسعار' : 'View Pricing'}
            </Btn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center text-sm font-black text-dark-400">F</div>
            <span className="text-sm font-semibold">FutureFace</span>
          </div>
          <p className="text-xs text-ink-faint">
            © 2026 FutureFace. {lang === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.
            {' '}{lang === 'ar' ? 'مُتوافق مع نظام حماية البيانات الشخصية (PDPL)' : 'PDPL & GDPR Compliant'}.
          </p>
        </div>
      </footer>
    </div>
  )
}

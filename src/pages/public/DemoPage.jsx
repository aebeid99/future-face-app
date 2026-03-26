import { useState } from 'react'
import { Calendar, Mail, ArrowRight, Clock, CheckCircle2 } from 'lucide-react'
import PublicNav from '../../components/layout/PublicNav.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Input from '../../components/ui/Input.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { t } from '../../utils/i18n.js'

const SLOTS = [
  'Sunday 30 Mar — 10:00 AM', 'Sunday 30 Mar — 2:00 PM',
  'Monday 31 Mar — 9:00 AM',  'Monday 31 Mar — 3:00 PM',
  'Tuesday 1 Apr — 11:00 AM', 'Wednesday 2 Apr — 10:00 AM',
]

export default function DemoPage() {
  const { state } = useApp()
  const { lang } = state
  const [variant] = useState(state.demoVariant || 'A')
  const [selected, setSelected] = useState(null)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (variant === 'A' && !selected) return
    if (variant === 'B' && !email.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <PublicNav />
        <div className="text-center max-w-md px-5">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {lang === 'ar' ? 'تم الحجز بنجاح!' : 'You\'re all set!'}
          </h2>
          <p className="text-ink-muted">
            {lang === 'ar'
              ? 'سيتواصل معك فريقنا خلال ٢٤ ساعة لتأكيد موعد العرض'
              : 'Our team will reach out within 24 hours to confirm your demo'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-400">
      <PublicNav />
      <div className="pt-24 pb-20 px-5 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">
            {lang === 'ar' ? 'شاهد FutureFace في العمل' : 'See FutureFace in Action'}
          </h1>
          <p className="text-ink-muted">
            {lang === 'ar' ? '٣٠ دقيقة مخصصة لاحتياجات مؤسستك' : '30-minute personalised demo for your organisation'}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-7">
          {/* Plan A: Calendar */}
          {variant === 'A' && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Calendar size={16} className="text-gold" />
                <h2 className="text-base font-semibold">
                  {lang === 'ar' ? 'اختر موعداً مناسباً' : 'Choose a time slot'}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {SLOTS.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelected(slot)}
                    className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      selected === slot
                        ? 'bg-gold/10 border-gold/40 text-gold'
                        : 'border-border text-ink-muted hover:border-border-light hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="flex-shrink-0" />
                      {slot}
                    </div>
                  </button>
                ))}
              </div>
              {selected && (
                <Input
                  label={lang === 'ar' ? 'بريدك الإلكتروني للتأكيد' : 'Your email for confirmation'}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="mb-4"
                />
              )}
            </div>
          )}

          {/* Plan B: Email request */}
          {variant === 'B' && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Mail size={16} className="text-gold" />
                <h2 className="text-base font-semibold">
                  {lang === 'ar' ? 'أخبرنا عن مؤسستك' : 'Tell us about your organisation'}
                </h2>
              </div>
              <div className="space-y-4">
                <Input label={lang === 'ar' ? 'الاسم' : 'Name'} placeholder={lang === 'ar' ? 'اسمك الكامل' : 'Your full name'} />
                <Input label={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
                <Input label={lang === 'ar' ? 'اسم الشركة' : 'Company'} placeholder={lang === 'ar' ? 'اسم مؤسستك' : 'Your company name'} />
                <Input label={lang === 'ar' ? 'ملاحظات إضافية' : 'What are you hoping to solve?'} placeholder={lang === 'ar' ? 'أخبرنا عن تحديات مؤسستك...' : 'Tell us about your challenges...'} />
              </div>
            </div>
          )}

          <Btn
            size="lg"
            className="w-full mt-5"
            loading={loading}
            onClick={submit}
            disabled={variant === 'A' ? !selected || !email : !email}
            iconRight={<ArrowRight size={16} />}
          >
            {lang === 'ar' ? 'حجز العرض التجريبي' : 'Book Demo'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

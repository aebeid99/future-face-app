import { useState } from 'react'
import { Mail, ArrowRight } from 'lucide-react'
import Logo from '../../components/ui/Logo.jsx'
import Btn from '../../components/ui/Btn.jsx'
import Input from '../../components/ui/Input.jsx'
import { useApp } from '../../state/AppContext.jsx'
import { NAV, LOGIN } from '../../state/actions.js'
import { t } from '../../utils/i18n.js'
import { domainFromEmail } from '../../utils/formatting.js'

export default function LoginPage() {
  const { state, dispatch } = useApp()
  const { lang } = state
  const tr = (k) => t(k, lang)
  const go = (page) => dispatch({ type: NAV, page })

  const [email,   setEmail]   = useState('')
  const [otp,     setOtp]     = useState('')
  const [step,    setStep]    = useState('email')   // email | otp
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleEmail = async (e) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setError(lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Enter a valid email address')
      return
    }
    setLoading(true)
    setError('')
    // Simulate OTP send
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setStep('otp')
  }

  const handleOtp = async (e) => {
    e.preventDefault()
    if (!otp.trim() || otp.length < 4) {
      setError(lang === 'ar' ? 'يرجى إدخال رمز التحقق' : 'Enter the verification code')
      return
    }
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)

    const domain = domainFromEmail(email)
    dispatch({
      type: LOGIN,
      user: {
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        email,
        role: 'admin',
      },
      org: {
        id: domain,
        domain,
        name: domain.split('.')[0].replace(/\b\w/g, c => c.toUpperCase()),
      },
    })
  }

  const handleSSO = (provider) => {
    const domain = 'demo.futureface.io'
    dispatch({
      type: LOGIN,
      user: {
        name: provider === 'google' ? 'Ahmed Al-Rashidi' : 'Sara Mahmoud',
        email: `user@${domain}`,
        role: 'admin',
        avatar: null,
      },
      org: { id: domain, domain, name: 'Demo Org' },
    })
  }

  return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <button onClick={() => go('landing')}><Logo size={36} /></button>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-7">
          <h1 className="text-xl font-bold text-center mb-1">{tr('auth_login')}</h1>
          <p className="text-sm text-ink-muted text-center mb-6">
            {lang === 'ar' ? 'مرحباً بعودتك إلى FutureFace' : 'Welcome back to FutureFace'}
          </p>

          {/* SSO buttons */}
          <div className="space-y-2.5 mb-5">
            <Btn
              variant="secondary"
              size="md"
              className="w-full"
              onClick={() => handleSSO('google')}
              icon={
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              }
            >
              {tr('auth_google')}
            </Btn>
            <Btn
              variant="secondary"
              size="md"
              className="w-full"
              onClick={() => handleSSO('microsoft')}
              icon={
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#F25022" d="M1 1h10v10H1z"/>
                  <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                  <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                  <path fill="#FFB900" d="M13 13h10v10H13z"/>
                </svg>
              }
            >
              {tr('auth_microsoft')}
            </Btn>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-ink-faint">{tr('auth_or')}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email form */}
          {step === 'email' ? (
            <form onSubmit={handleEmail} className="space-y-4">
              <Input
                label={tr('auth_email')}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                icon={<Mail size={14} />}
                error={error}
                autoFocus
              />
              <Btn
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                loading={loading}
                iconRight={<ArrowRight size={14} />}
              >
                {lang === 'ar' ? 'إرسال رمز التحقق' : 'Send verification code'}
              </Btn>
            </form>
          ) : (
            <form onSubmit={handleOtp} className="space-y-4">
              <div>
                <p className="text-xs text-ink-muted mb-3">
                  {tr('auth_otp_sent')} <strong className="text-ink">{email}</strong>
                </p>
                <Input
                  label={tr('auth_otp')}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="123456"
                  error={error}
                  autoFocus
                />
              </div>
              <Btn type="submit" variant="primary" size="md" className="w-full" loading={loading}>
                {lang === 'ar' ? 'تحقق وادخل' : 'Verify & Sign In'}
              </Btn>
              <Btn
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => { setStep('email'); setOtp(''); setError('') }}
              >
                {lang === 'ar' ? 'تغيير البريد الإلكتروني' : 'Change email'}
              </Btn>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-ink-muted mt-4">
          {tr('auth_no_account')}{' '}
          <button onClick={() => go('signup')} className="text-gold hover:underline">
            {tr('auth_signup')}
          </button>
        </p>
      </div>
    </div>
  )
}

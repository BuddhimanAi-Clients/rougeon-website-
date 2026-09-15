import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { apiRequest } from '../lib/api'
import { authClient } from '../lib/auth-client'

function isValidAdDate(year: string, month: string, day: string) {
  const parts = [Number(year), Number(month), Number(day)]
  if (!parts.every(Number.isInteger)) return false
  const [parsedYear, parsedMonth, parsedDay] = parts
  const date = new Date(Date.UTC(parsedYear, parsedMonth - 1, parsedDay))
  return date.getUTCFullYear() === parsedYear && date.getUTCMonth() === parsedMonth - 1 && date.getUTCDate() === parsedDay
}

export function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [query] = useSearchParams()
  const signUp = location.pathname.endsWith('sign-up')
  const reset = location.pathname.endsWith('reset-password')
  const verificationSuccess = !signUp && !reset && query.get('verified') === '1'
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [emailAction, setEmailAction] = useState<'reset' | 'verify' | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', dobCalendar: 'AD', year: '', month: '', day: '' })

  useEffect(() => {
    if (!verificationSuccess) return
    const redirect = window.setTimeout(() => navigate('/auth/sign-in', { replace: true }), 3_000)
    return () => window.clearTimeout(redirect)
  }, [navigate, verificationSuccess])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      if (reset) {
        const token = query.get('token')
        if (!token) throw new Error('This reset link is missing its token. Request a new email.')
        await apiRequest('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword: form.password }) })
        toast.success('Password reset. Please sign in.')
        navigate('/auth/sign-in')
        return
      }
      if (signUp) {
        if (form.dobCalendar === 'AD' && !isValidAdDate(form.year, form.month, form.day)) throw new Error('Enter a valid English (AD) date')
        // Better Auth rejects a verification request for a new address when a
        // different account still has a session in this browser.
        await authClient.signOut()
        const membershipProfile = JSON.stringify({ fullName: form.name.trim(), phone: form.phone, email: form.email.trim(), dobCalendar: form.dobCalendar, dob: { year: Number(form.year), month: Number(form.month), day: Number(form.day) } })
        const signUpInput = { name: form.name.trim(), email: form.email.trim(), password: form.password, pendingMembershipProfile: membershipProfile }
        const result = await authClient.signUp.email(signUpInput)
        if (result.error) throw new Error(result.error.message ?? 'Could not create account')
        // Sign-up details are linked only after the customer proves control of
        // the email and signs in. localStorage keeps them available if the
        // verification link opens in a separate tab; they are cleared after use.
        localStorage.setItem('rogueon-pending-membership-profile', membershipProfile)
        sessionStorage.removeItem('rogueon-pending-membership-profile')
        await apiRequest('/api/v1/auth/send-verification-email', { method: 'POST', body: JSON.stringify({ email: form.email.trim(), callbackURL: window.location.origin + '/auth/sign-in?verified=1' }) })
        toast.success('Account created. Verification email queued — check your inbox shortly.')
        navigate('/auth/sign-in?verification=sent')
        return
      }
      const result = await authClient.signIn.email({ email: form.email.trim(), password: form.password })
      if (result.error) throw new Error(result.error.message ?? 'Authentication failed')
      const pendingProfile = localStorage.getItem('rogueon-pending-membership-profile') ?? sessionStorage.getItem('rogueon-pending-membership-profile')
      let completeMembershipProfile = false
      if (pendingProfile) {
        try {
          const savedProfile = JSON.parse(pendingProfile) as { email?: unknown }
          if (typeof savedProfile.email !== 'string' || savedProfile.email.trim().toLowerCase() !== form.email.trim().toLowerCase()) {
            completeMembershipProfile = true
          } else {
            await apiRequest('/api/v1/customers/membership-signup', { method: 'POST', body: pendingProfile })
          }
        } catch {
          completeMembershipProfile = true
        } finally {
          localStorage.removeItem('rogueon-pending-membership-profile')
          sessionStorage.removeItem('rogueon-pending-membership-profile')
        }
      }
      await apiRequest('/api/v1/cart/merge', { method: 'POST' }).catch(() => undefined)
      if (completeMembershipProfile) {
        toast.success('Signed in. Please complete your membership profile.')
        navigate('/account?tab=profile')
        return
      }
      toast.success('Welcome back')
      navigate((location.state as { from?: string } | null)?.from ?? '/')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setPending(false)
    }
  }

  async function sendEmailAction(action: 'reset' | 'verify') {
    if (!form.email.trim()) {
      toast.error('Enter your email address first')
      return
    }
    setEmailAction(action)
    try {
      if (action === 'reset') {
        await apiRequest('/api/v1/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email: form.email.trim(), redirectTo: `${window.location.origin}/auth/reset-password` }) })
      } else {
        if (signUp) await authClient.signOut()
        await apiRequest('/api/v1/auth/send-verification-email', { method: 'POST', body: JSON.stringify({ email: form.email.trim(), callbackURL: `${window.location.origin}/auth/sign-in?verified=1` }) })
      }
      if (action === 'reset') toast.success('Password reset email queued')
      else if (signUp) toast.success('Verification email queued — check your inbox shortly')
      else toast.success('If this account still needs verification, a link will arrive shortly.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send the email')
    } finally {
      setEmailAction(null)
    }
  }

  if (verificationSuccess) {
    return (
      <main className="verification-success-page">
        <section className="verification-success-card" aria-live="polite">
          <div className="verification-check"><CheckCircle2 aria-hidden="true" /></div>
          <p className="eyebrow">ROGUEON ACCOUNT</p>
          <h1>EMAIL<br />VERIFIED.</h1>
          <p>Your account is ready. Redirecting you to sign in now.</p>
          <div className="verification-progress" aria-hidden="true"><span /></div>
          <Link className="text-link" to="/auth/sign-in">Continue to sign in <ArrowRight /></Link>
        </section>
      </main>
    )
  }

  return (
    <div className="auth-page">
      <section className="auth-art" aria-hidden="true"><span>RGN</span><p>IDENTITY / ACCESS</p></section>
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <p className="eyebrow">ROGUEON ACCOUNT</p>
          <h1>{reset ? 'RESET\nACCESS.' : signUp ? 'JOIN THE\nSYNDICATE.' : 'WELCOME\nBACK.'}</h1>
          <p>{reset ? 'Choose a new password for your ROGUEON account.' : signUp ? 'Create your account, then verify your email before signing in. Existing POS members are linked after verification.' : 'Sign in with the email and password attached to your verified account.'}</p>
          <form onSubmit={submit} className="stack-form">
            {signUp && <><label><span>Full name</span><input required maxLength={120} autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label><span>Nepal mobile number</span><input required inputMode="tel" placeholder="98XXXXXXXX" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label><span>Date calendar</span><select value={form.dobCalendar} onChange={(event) => setForm({ ...form, dobCalendar: event.target.value })}><option value="AD">English date (AD)</option><option value="BS">Nepali date (BS)</option></select></label><label><span>Date of birth</span><div className="auth-dob"><input required min="1900" max="2100" inputMode="numeric" placeholder="Year" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })}/><input required min="1" max="12" inputMode="numeric" placeholder="Month" value={form.month} onChange={(event) => setForm({ ...form, month: event.target.value })}/><input required min="1" max="32" inputMode="numeric" placeholder="Day" value={form.day} onChange={(event) => setForm({ ...form, day: event.target.value })}/></div></label></>}
            {!reset && <label><span>Email</span><input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>}
            <label><span>{reset ? 'New password' : 'Password'}</span><div className="password-input"><input required minLength={8} type={showPassword ? 'text' : 'password'} autoComplete={signUp || reset ? 'new-password' : 'current-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
            <button className="solid-button" type="submit" disabled={pending}>{pending ? 'Please wait…' : reset ? 'Reset password' : signUp ? 'Create account' : 'Sign in'} <ArrowRight /></button>
          </form>
          {!reset && <><>{!signUp && <button className="text-link auth-email-action" type="button" disabled={emailAction !== null} onClick={() => sendEmailAction('reset')}>{emailAction === 'reset' ? 'Sending reset email…' : 'Forgot password?'}</button>}</><button className="text-link auth-email-action" type="button" disabled={emailAction !== null} onClick={() => sendEmailAction('verify')}>{emailAction === 'verify' ? 'Sending verification email…' : 'Resend verification email'}</button><p className="auth-switch">{signUp ? 'Already have an account?' : 'New to ROGUEON?'} <Link to={signUp ? '/auth/sign-in' : '/auth/sign-up'}>{signUp ? 'Sign in' : 'Create account'}</Link></p><small>{signUp ? 'We will email a verification link. Sign in only after opening it.' : 'Check your inbox after requesting a reset or verification link.'}</small></>}
        </div>
      </section>
    </div>
  )
}

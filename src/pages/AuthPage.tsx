import { useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { apiRequest } from '../lib/api'
import { authClient } from '../lib/auth-client'

export function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [query] = useSearchParams()
  const signUp = location.pathname.endsWith('sign-up')
  const reset = location.pathname.endsWith('reset-password')
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [emailAction, setEmailAction] = useState<'reset' | 'verify' | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

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
      const result = signUp
        ? await authClient.signUp.email({ name: form.name.trim(), email: form.email.trim(), password: form.password })
        : await authClient.signIn.email({ email: form.email.trim(), password: form.password })
      if (result.error) throw new Error(result.error.message ?? 'Authentication failed')
      await apiRequest('/api/v1/cart/merge', { method: 'POST' }).catch(() => undefined)
      toast.success(signUp ? 'Account created' : 'Welcome back')
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
        await apiRequest('/api/v1/auth/send-verification-email', { method: 'POST', body: JSON.stringify({ email: form.email.trim(), callbackURL: `${window.location.origin}/account` }) })
      }
      toast.success(action === 'reset' ? 'Password reset email sent' : 'Verification email sent')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send the email')
    } finally {
      setEmailAction(null)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-art" aria-hidden="true"><span>RGN</span><p>IDENTITY / ACCESS</p></section>
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <p className="eyebrow">ROGUEON ACCOUNT</p>
          <h1>{reset ? 'RESET\nACCESS.' : signUp ? 'JOIN THE\nSYNDICATE.' : 'WELCOME\nBACK.'}</h1>
          <p>{reset ? 'Choose a new password for your ROGUEON account.' : signUp ? 'Create an account for saved addresses, wishlist and order history.' : 'Sign in with the email and password attached to your account.'}</p>
          <form onSubmit={submit} className="stack-form">
            {signUp && <label><span>Name</span><input required maxLength={120} autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>}
            {!reset && <label><span>Email</span><input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>}
            <label><span>{reset ? 'New password' : 'Password'}</span><div className="password-input"><input required minLength={8} type={showPassword ? 'text' : 'password'} autoComplete={signUp || reset ? 'new-password' : 'current-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
            <button className="solid-button" type="submit" disabled={pending}>{pending ? 'Please wait…' : reset ? 'Reset password' : signUp ? 'Create account' : 'Sign in'} <ArrowRight /></button>
          </form>
          {!reset && <><>{!signUp && <button className="text-link auth-email-action" type="button" disabled={emailAction !== null} onClick={() => sendEmailAction('reset')}>{emailAction === 'reset' ? 'Sending reset email…' : 'Forgot password?'}</button>}</><button className="text-link auth-email-action" type="button" disabled={emailAction !== null} onClick={() => sendEmailAction('verify')}>{emailAction === 'verify' ? 'Sending verification email…' : 'Resend verification email'}</button><p className="auth-switch">{signUp ? 'Already have an account?' : 'New to ROGUEON?'} <Link to={signUp ? '/auth/sign-in' : '/auth/sign-up'}>{signUp ? 'Sign in' : 'Create account'}</Link></p><small>Check your inbox after requesting a reset or verification link.</small></>}
        </div>
      </section>
    </div>
  )
}

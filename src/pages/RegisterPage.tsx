import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Globe } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { DEFAULT_DEPARTMENT } from '../lib/constants'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { googleLoginThunk, registerThunk } from '../features/auth/authSlice'
import type { RegisterPayload } from '../types'
import heroImage from '../assets/hero.png'

export function RegisterPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, error } = useAppSelector((state) => state.auth)

  const [form, setForm] = useState<Pick<RegisterPayload, 'fullName' | 'email' | 'password'>>({
    fullName: '',
    email: '',
    password: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function onGoogleSignup() {
    setLocalError('')

    try {
      await dispatch(googleLoginThunk()).unwrap()
      navigate('/complete-profile', { replace: true })
    } catch (submitError) {
      setLocalError(submitError instanceof Error ? submitError.message : 'Unable to continue with Google.')
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError('')

    if (form.password.length < 6) {
      setLocalError('Password must be at least 6 characters.')
      return
    }

    if (form.password !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }

    try {
      const registerPayload: RegisterPayload = {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        department: DEFAULT_DEPARTMENT,
        role: 'student',
      }

      await dispatch(registerThunk(registerPayload)).unwrap()

      navigate('/complete-profile', { replace: true })
    } catch (submitError) {
      setLocalError(submitError instanceof Error ? submitError.message : 'Unable to register account.')
    }
  }

  const isSubmitting = status === 'loading'

  return (
    <div className="auth-stage">
      <div className="auth-shell animate-fade-up">
        <section className="auth-showcase hidden lg:block">
          <img src={heroImage} alt="Dancer visual" className="auth-showcase-image" />
          <div className="auth-showcase-content">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-slate-900">AI</span>
              <span className="brand-wordmark text-base">AI REPO</span>
            </div>

            <div className="rounded-2xl border border-white/20 bg-slate-900/25 p-4 backdrop-blur-sm">
              <p className="text-3xl font-bold leading-tight text-white">Create an account and start building better research.</p>
              <p className="mt-2 text-sm text-slate-100">Institutional onboarding takes one minute and unlocks full AI REPO workflow access.</p>
            </div>
          </div>
        </section>

        <section className="auth-form-pane">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="brand-wordmark text-lg text-slate-900">AI REPO</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Create Account</p>
            </div>
            <Link to="/login" className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white">
              Sign in
            </Link>
          </div>

          <div className="mt-6">
            <h1 className="text-4xl font-extrabold text-slate-950">Create account</h1>
            <p className="mt-1 text-sm text-slate-500">Set up your profile for institutional research access.</p>
          </div>

          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <Input
              label="Full name"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              required
            />

            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />

            <label className="block space-y-1.5 text-sm sm:col-span-1">
              <span className="font-medium text-slate-700">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-11 text-slate-900 outline-none ring-offset-2 transition placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="block space-y-1.5 text-sm sm:col-span-1">
              <span className="font-medium text-slate-700">Confirm password</span>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-11 text-slate-900 outline-none ring-offset-2 transition placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="sm:col-span-2 space-y-1 text-xs text-slate-500">
              <p>- Password must be at least 6 characters.</p>
              <p>- Department, role, and supervisor are selected in onboarding after signup.</p>
            </div>

            {localError || error ? (
              <p className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {localError || error}
              </p>
            ) : null}

            <Button className="sm:col-span-2" size="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Get started'}
            </Button>
          </form>

          <div className="mt-6 auth-divider">or continue with</div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full" onClick={() => void onGoogleSignup()} disabled={isSubmitting}>
              <Globe size={16} />
              Google
            </Button>
            <Button type="button" variant="secondary" className="w-full" disabled>
              Apple
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-slate-900 underline">
              Log in
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}

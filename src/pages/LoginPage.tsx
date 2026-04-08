import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Globe } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { useErrorToast } from '../hooks/useErrorToast'
import { googleLoginThunk, loginThunk } from '../features/auth/authSlice'
import { fetchProfileThunk } from '../features/auth/profileSlice'
import heroImage from '../assets/hero.png'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, error } = useAppSelector((state) => state.auth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  useErrorToast(localError || error)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError('')

    try {
      await dispatch(loginThunk({ email, password })).unwrap()
      navigate('/dashboard', { replace: true })
    } catch (submitError) {
      setLocalError(submitError instanceof Error ? submitError.message : 'Unable to sign in.')
    }
  }

  const isSubmitting = status === 'loading'

  async function onGoogleSignIn() {
    setLocalError('')

    try {
      const authUser = await dispatch(googleLoginThunk()).unwrap()
      const existingProfile = await dispatch(fetchProfileThunk(authUser.uid)).unwrap()

      navigate(existingProfile ? '/dashboard' : '/complete-profile', { replace: true })
    } catch (submitError) {
      setLocalError(submitError instanceof Error ? submitError.message : 'Unable to sign in with Google.')
    }
  }

  return (
    <div className="auth-stage">
      <div className="auth-shell animate-fade-up">
        <section className="auth-showcase hidden lg:block">
          <img src={heroImage} alt="Campus skyline" className="auth-showcase-image" />
          <div className="auth-showcase-content">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-slate-900">AI</span>
              <span className="brand-wordmark text-base">AI REPO</span>
            </div>

            <div className="rounded-2xl border border-white/20 bg-slate-900/25 p-4 backdrop-blur-sm">
              <p className="text-3xl font-bold leading-tight text-white">Research starts with stronger context.</p>
              <p className="mt-2 text-sm text-slate-100">Find your best topic fit in fewer clicks with grounded repository intelligence.</p>
            </div>
          </div>
        </section>

        <section className="auth-form-pane">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="brand-wordmark text-lg text-slate-900">AI REPO</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Secure Sign In</p>
            </div>
            <Button
              type="button"
              size="sm"
              className="rounded-full px-4 py-2 text-xs font-semibold"
              onClick={() => navigate('/register')}
            >
              Create account
            </Button>
          </div>

          <div className="mt-8">
            <h1 className="text-4xl font-extrabold text-slate-950">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to continue your AI REPO workspace.</p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-slate-700">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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

            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                Remember me
              </label>
              <a href="#" className="font-medium text-slate-500 hover:text-slate-800">
                Forgot password?
              </a>
            </div>

            {localError || error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {localError || error}
              </p>
            ) : null}

            <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Log in'}
            </Button>
          </form>

          <div className="mt-6 auth-divider">or continue with</div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void onGoogleSignIn()}
              disabled={isSubmitting}
            >
              <Globe size={16} />
              Google
            </Button>
            <Button type="button" variant="secondary" className="w-full" disabled>
              Apple
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            Do not have an account?{' '}
            <Link to="/register" className="font-semibold text-slate-900 underline">
              Register
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { googleLoginThunk, loginThunk } from '../features/auth/authSlice'
import { Badge } from '../components/ui/Badge'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, error } = useAppSelector((state) => state.auth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

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
      await dispatch(googleLoginThunk()).unwrap()
      navigate('/dashboard', { replace: true })
    } catch (submitError) {
      setLocalError(submitError instanceof Error ? submitError.message : 'Unable to sign in with Google.')
    }
  }

  return (
    <div className="content-shell flex min-h-screen items-center py-10">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="premium-card animate-fade-up p-8 sm:p-10">
          <Badge tone="accent" className="mb-4">Secure Academic Access</Badge>
          <h1 className="text-balance text-4xl font-extrabold text-slate-950 sm:text-5xl">
            Sign in to your intelligent project workspace.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Analyze originality, explore prior repositories, and generate credible AI-backed research direction in one premium environment.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="premium-card bg-slate-50/80 p-4">
              <BookOpen size={18} className="text-slate-700" />
              <p className="mt-3 text-sm font-semibold text-slate-900">Curated Repository Intelligence</p>
              <p className="mt-1 text-sm text-slate-600">Search and review historical projects with confidence.</p>
            </div>
            <div className="premium-card bg-slate-50/80 p-4">
              <Sparkles size={18} className="text-blue-700" />
              <p className="mt-3 text-sm font-semibold text-slate-900">AI Similarity + Recommendations</p>
              <p className="mt-1 text-sm text-slate-600">Grounded novelty feedback for better topic choices.</p>
            </div>
          </div>
        </section>

        <section className="premium-card animate-fade-up p-8 [animation-delay:140ms]">
          <h2 className="text-2xl font-extrabold text-slate-950">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Access Project Repository AI workspace</p>

          <div className="mt-5 space-y-3">
            <Button variant="outline" className="w-full" onClick={() => void onGoogleSignIn()} disabled={isSubmitting}>
              Continue with Google
            </Button>
            <p className="text-center text-xs uppercase tracking-[0.16em] text-slate-400">or sign in with email</p>
          </div>

          <form className="mt-4 space-y-4" onSubmit={onSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {localError || error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {localError || error}
              </p>
            ) : null}

            <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-5 text-sm text-slate-600">
            New user?{' '}
            <Link to="/register" className="font-semibold text-slate-900 underline">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}

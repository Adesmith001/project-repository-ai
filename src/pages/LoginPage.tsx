import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { loginThunk } from '../features/auth/authSlice'

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Access Project Repository AI workspace</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
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
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {localError || error}
            </p>
          ) : null}

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          New user?{' '}
          <Link to="/register" className="font-medium text-slate-900 underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
